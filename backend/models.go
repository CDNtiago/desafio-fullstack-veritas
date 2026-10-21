package main

import (
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

// Input contém somente os campos editáveis; ID e datas pertencem ao servidor.
type Input struct{ Title, Description, Status string }

// Validate centraliza as regras usadas pelo serviço e pela leitura do arquivo.
func Validate(input Input) (Input, error) {
	input.Title = strings.TrimSpace(input.Title)
	fields := map[string]string{}
	// Conto pontos de código Unicode, como no frontend, em vez de bytes UTF-8.
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
