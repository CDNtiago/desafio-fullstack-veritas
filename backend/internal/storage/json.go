package storage

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

	"github.com/CDNtiago/desafio-fullstack-veritas/backend/internal/task"
)

// JSON serializes read-modify-write operations for one process and one file.
type JSON struct {
	mu    sync.RWMutex
	path  string
	tasks []task.Task
	write func(string, []byte) error
}

func Open(path string) (*JSON, error) {
	s := &JSON{path: path, tasks: []task.Task{}, write: writeSnapshot}
	data, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return s, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read tasks: %w", err)
	}
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&s.tasks); err != nil {
		return nil, fmt.Errorf("invalid task file: %w", err)
	}
	if err := decoder.Decode(new(any)); err != io.EOF || s.tasks == nil {
		return nil, errors.New("task file must contain exactly one JSON array")
	}
	seen := make(map[string]bool, len(s.tasks))
	for _, t := range s.tasks {
		input, err := task.Validate(task.Input{Title: t.Title, Description: t.Description, Status: t.Status})
		if err != nil || input.Title != t.Title || !task.ValidID(t.ID) || seen[t.ID] || t.CreatedAt.IsZero() || t.UpdatedAt.Before(t.CreatedAt) {
			return nil, errors.New("task file contains invalid or duplicate tasks")
		}
		seen[t.ID] = true
	}
	sortTasks(s.tasks)
	return s, nil
}

func sortTasks(tasks []task.Task) {
	sort.Slice(tasks, func(i, j int) bool {
		if tasks[i].CreatedAt.Equal(tasks[j].CreatedAt) {
			return tasks[i].ID < tasks[j].ID
		}
		return tasks[i].CreatedAt.Before(tasks[j].CreatedAt)
	})
}

func (s *JSON) List(ctx context.Context) ([]task.Task, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]task.Task{}, s.tasks...), nil
}

func (s *JSON) Create(ctx context.Context, t task.Task) (task.Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, existing := range s.tasks {
		if existing.ID == t.ID {
			return task.Task{}, errors.New("duplicate generated id")
		}
	}
	next := append(append([]task.Task{}, s.tasks...), t)
	if err := s.commit(ctx, next); err != nil {
		return task.Task{}, err
	}
	return t, nil
}

func (s *JSON) Update(ctx context.Context, id string, input task.Input, now time.Time) (task.Task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	next := append([]task.Task{}, s.tasks...)
	for i, t := range next {
		if t.ID != id {
			continue
		}
		t.Title, t.Description, t.Status = input.Title, input.Description, input.Status
		// Keep timestamps monotonic if the wall clock moves backwards.
		if now.After(t.UpdatedAt) {
			t.UpdatedAt = now
		}
		next[i] = t
		if err := s.commit(ctx, next); err != nil {
			return task.Task{}, err
		}
		return t, nil
	}
	return task.Task{}, task.ErrNotFound
}

func (s *JSON) Delete(ctx context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, t := range s.tasks {
		if t.ID != id {
			continue
		}
		next := append([]task.Task{}, s.tasks[:i]...)
		next = append(next, s.tasks[i+1:]...)
		return s.commit(ctx, next)
	}
	return task.ErrNotFound
}

// Publish in memory only after persistence succeeds. Caller holds the write lock.
func (s *JSON) commit(ctx context.Context, next []task.Task) error {
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
	// Never remove the existing file first. Rename is not guaranteed atomic on Windows.
	return os.Rename(f.Name(), path)
}
