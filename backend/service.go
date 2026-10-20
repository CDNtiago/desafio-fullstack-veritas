package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"
)

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
