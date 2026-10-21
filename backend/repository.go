package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
	"unicode/utf8"
)

// JSONRepository coordena leitura, alteração e gravação em um processo por arquivo.
type JSONRepository struct {
	mu    sync.RWMutex
	path  string
	tasks []Task
	write func(string, []byte) error
}

func OpenJSONRepository(path string) (*JSONRepository, error) {
	s := &JSONRepository{path: path, tasks: []Task{}, write: writeSnapshot}
	data, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return s, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read tasks: %w", err)
	}
	// encoding/json substituiria UTF-8 inválido; recuso o arquivo para preservar os bytes.
	if !utf8.Valid(data) {
		return nil, errors.New("task file contains invalid UTF-8")
	}
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&s.tasks); err != nil {
		return nil, fmt.Errorf("invalid task file: %w", err)
	}
	if err := decoder.Decode(new(any)); err != io.EOF || s.tasks == nil {
		return nil, errors.New("task file must contain exactly one JSON array")
	}
	// JSON bem formado ainda pode conter tarefas inválidas ou IDs repetidos.
	seen := make(map[string]bool, len(s.tasks))
	for _, t := range s.tasks {
		input, err := Validate(Input{Title: t.Title, Description: t.Description, Status: t.Status})
		if err != nil || input.Title != t.Title || !ValidID(t.ID) || seen[t.ID] || t.CreatedAt.IsZero() || t.UpdatedAt.Before(t.CreatedAt) {
			return nil, errors.New("task file contains invalid or duplicate tasks")
		}
		seen[t.ID] = true
	}
	sortTasks(s.tasks)
	return s, nil
}

func sortTasks(tasks []Task) {
	sort.Slice(tasks, func(i, j int) bool {
		if tasks[i].CreatedAt.Equal(tasks[j].CreatedAt) {
			return tasks[i].ID < tasks[j].ID
		}
		return tasks[i].CreatedAt.Before(tasks[j].CreatedAt)
	})
}

func (s *JSONRepository) List(ctx context.Context) ([]Task, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	// A cópia evita que quem recebe a lista altere o slice mantido pelo repositório.
	return append([]Task{}, s.tasks...), nil
}

func (s *JSONRepository) Create(ctx context.Context, t Task) (Task, error) {
	// O bloqueio cobre também a gravação, evitando sobrescrever alterações concorrentes.
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, existing := range s.tasks {
		if existing.ID == t.ID {
			return Task{}, errors.New("duplicate generated id")
		}
	}
	// Preparo outra lista; uma falha de persistência não deve alterar o estado atual.
	next := append(append([]Task{}, s.tasks...), t)
	if err := s.commit(ctx, next); err != nil {
		return Task{}, err
	}
	return t, nil
}

func (s *JSONRepository) Update(ctx context.Context, id string, input Input, now time.Time) (Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	next := append([]Task{}, s.tasks...)
	for i, t := range next {
		if t.ID != id {
			continue
		}
		t.Title, t.Description, t.Status = input.Title, input.Description, input.Status
		// Evito retroceder updatedAt se o relógio do sistema voltar.
		if now.After(t.UpdatedAt) {
			t.UpdatedAt = now
		}
		next[i] = t
		if err := s.commit(ctx, next); err != nil {
			return Task{}, err
		}
		return t, nil
	}
	return Task{}, ErrNotFound
}

func (s *JSONRepository) Delete(ctx context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, t := range s.tasks {
		if t.ID != id {
			continue
		}
		next := append([]Task{}, s.tasks[:i]...)
		next = append(next, s.tasks[i+1:]...)
		return s.commit(ctx, next)
	}
	return ErrNotFound
}

// commit publica em memória só depois de salvar; quem chama deve manter o bloqueio de escrita.
func (s *JSONRepository) commit(ctx context.Context, next []Task) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	sortTasks(next)
	data, err := json.MarshalIndent(next, "", "  ")
	if err != nil {
		return err
	}
	if err := s.write(s.path, append(data, '\n')); err != nil {
		return fmt.Errorf("persist tasks: %w", err)
	}
	s.tasks = next
	return nil
}

func writeSnapshot(path string, data []byte) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	// O temporário fica no mesmo diretório para permitir a substituição no mesmo volume.
	f, err := os.CreateTemp(dir, ".tasks-*.tmp")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	defer f.Close()
	if _, err := f.Write(data); err != nil {
		return err
	}
	if err := f.Sync(); err != nil {
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	// Não apago o arquivo válido antes de substituir; Rename não garante atomicidade no Windows.
	return os.Rename(f.Name(), path)
}
