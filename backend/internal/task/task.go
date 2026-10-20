package task

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"time"
	"unicode/utf8"
)

const (
	Todo       = "todo"
	InProgress = "in_progress"
	Done       = "done"
)

var ErrNotFound = errors.New("task not found")

type ValidationError struct{ Fields map[string]string }

func (e *ValidationError) Error() string { return "Dados da tarefa inválidos." }

type Task struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Input struct{ Title, Description, Status string }

func Validate(input Input) (Input, error) {
	input.Title = strings.TrimSpace(input.Title)
	fields := map[string]string{}
	if n := utf8.RuneCountInString(input.Title); n < 1 || n > 120 {
		fields["title"] = "Informe um título de 1 a 120 caracteres."
	}
	if utf8.RuneCountInString(input.Description) > 2000 {
		fields["description"] = "Use no máximo 2.000 caracteres."
	}
	if input.Status != Todo && input.Status != InProgress && input.Status != Done {
		fields["status"] = "Selecione um status válido."
	}
	if len(fields) > 0 {
		return Input{}, &ValidationError{fields}
	}
	return input, nil
}

func ValidID(id string) bool {
	if len(id) != 32 || id != strings.ToLower(id) {
		return false
	}
	_, err := hex.DecodeString(id)
	return err == nil
}

type Repository interface {
	List(context.Context) ([]Task, error)
	Create(context.Context, Task) (Task, error)
	Update(context.Context, string, Input, time.Time) (Task, error)
	Delete(context.Context, string) error
}

type Service struct{ repo Repository }

func NewService(repo Repository) *Service                   { return &Service{repo: repo} }
func (s *Service) List(ctx context.Context) ([]Task, error) { return s.repo.List(ctx) }
func (s *Service) Create(ctx context.Context, input Input) (Task, error) {
	input, err := Validate(input)
	if err != nil {
		return Task{}, err
	}
	var id [16]byte
	if _, err := rand.Read(id[:]); err != nil {
		return Task{}, err
	}
	now := time.Now().UTC()
	return s.repo.Create(ctx, Task{hex.EncodeToString(id[:]), input.Title, input.Description, input.Status, now, now})
}
func (s *Service) Update(ctx context.Context, id string, input Input) (Task, error) {
	if !ValidID(id) {
		return Task{}, &ValidationError{map[string]string{"id": "Identificador inválido."}}
	}
	input, err := Validate(input)
	if err != nil {
		return Task{}, err
	}
	return s.repo.Update(ctx, id, input, time.Now().UTC())
}
func (s *Service) Delete(ctx context.Context, id string) error {
	if !ValidID(id) {
		return &ValidationError{map[string]string{"id": "Identificador inválido."}}
	}
	return s.repo.Delete(ctx, id)
}
