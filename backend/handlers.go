package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"mime"
	"net/http"
	"strings"
	"unicode/utf8"
)

const MaxBodyBytes = 16 * 1024

type API struct {
	service *Service
	origins map[string]bool
	logger  *slog.Logger
}

func NewHandler(service *Service, origins []string, logger *slog.Logger) http.Handler {
	allowed := make(map[string]bool, len(origins))
	for _, origin := range origins {
		allowed[origin] = true
	}
	return &API{service, allowed, logger}
}

func (a *API) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Vary", "Origin")
	if origin := r.Header.Get("Origin"); origin != "" {
		if !a.origins[origin] {
			failure(w, 403, "origin_denied", "Origem não permitida.", nil)
			return
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
	}
	if r.Method == http.MethodOptions {
		if r.URL.Path != "/tasks" && !strings.HasPrefix(r.URL.Path, "/tasks/") {
			failure(w, 404, "not_found", "Rota não encontrada.", nil)
			return
		}
		method := r.Header.Get("Access-Control-Request-Method")
		if method != "GET" && method != "POST" && method != "PUT" && method != "DELETE" {
			failure(w, 405, "method_not_allowed", "Método não permitido.", nil)
			return
		}
		for _, h := range strings.Split(r.Header.Get("Access-Control-Request-Headers"), ",") {
			if h = strings.ToLower(strings.TrimSpace(h)); h != "" && h != "content-type" {
				failure(w, 403, "header_denied", "Cabeçalho não permitido.", nil)
				return
			}
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Add("Vary", "Access-Control-Request-Method")
		w.Header().Add("Vary", "Access-Control-Request-Headers")
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.URL.Path == "/health" && r.Method == http.MethodGet {
		respond(w, 200, map[string]string{"status": "ok"})
		return
	}
	if r.URL.Path == "/tasks" {
		switch r.Method {
		case http.MethodGet:
			tasks, err := a.service.List(r.Context())
			if err != nil {
				a.error(w, err)
				return
			}
			respond(w, 200, tasks)
		case http.MethodPost:
			input, ok := readInput(w, r, false)
			if !ok {
				return
			}
			t, err := a.service.Create(r.Context(), input)
			if err != nil {
				a.error(w, err)
				return
			}
			respond(w, 201, t)
		default:
			methodNotAllowed(w, "GET, POST, OPTIONS")
		}
		return
	}
	if strings.HasPrefix(r.URL.Path, "/tasks/") {
		id := strings.TrimPrefix(r.URL.Path, "/tasks/")
		switch r.Method {
		case http.MethodPut:
			input, ok := readInput(w, r, true)
			if !ok {
				return
			}
			t, err := a.service.Update(r.Context(), id, input)
			if err != nil {
				a.error(w, err)
				return
			}
			respond(w, 200, t)
		case http.MethodDelete:
			if err := a.service.Delete(r.Context(), id); err != nil {
				a.error(w, err)
				return
			}
			w.WriteHeader(204)
		default:
			methodNotAllowed(w, "PUT, DELETE, OPTIONS")
		}
		return
	}
	failure(w, 404, "not_found", "Rota não encontrada.", nil)
}

func readInput(w http.ResponseWriter, r *http.Request, update bool) (Input, bool) {
	media, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || media != "application/json" {
		failure(w, 415, "unsupported_media_type", "Envie application/json.", nil)
		return Input{}, false
	}
	data, err := io.ReadAll(http.MaxBytesReader(w, r.Body, MaxBodyBytes))
	if err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			failure(w, 413, "body_too_large", "O corpo excede 16 KiB.", nil)
		} else {
			failure(w, 400, "invalid_json", "Não foi possível ler o JSON.", nil)
		}
		return Input{}, false
	}
	var fields map[string]json.RawMessage
	decoder := json.NewDecoder(bytes.NewReader(data))
	if !utf8.Valid(data) || decoder.Decode(&fields) != nil || fields == nil || decoder.Decode(new(any)) != io.EOF {
		failure(w, 400, "invalid_json", "Envie um único objeto JSON válido.", nil)
		return Input{}, false
	}
	input := Input{Status: Todo}
	values := map[string]*string{"title": &input.Title, "description": &input.Description, "status": &input.Status}
	for key, raw := range fields {
		destination, allowed := values[key]
		if !allowed || bytes.Equal(bytes.TrimSpace(raw), []byte("null")) || json.Unmarshal(raw, destination) != nil {
			failure(w, 400, "invalid_field", "Campos desconhecidos ou valores inválidos.", nil)
			return Input{}, false
		}
	}
	if update {
		for key := range values {
			if _, exists := fields[key]; !exists {
				failure(w, 400, "missing_field", "PUT exige title, description e status.", nil)
				return Input{}, false
			}
		}
	}
	return input, true
}

func (a *API) error(w http.ResponseWriter, err error) {
	var validation *ValidationError
	switch {
	case errors.As(err, &validation):
		failure(w, 400, "validation_error", validation.Error(), validation.Fields)
	case errors.Is(err, ErrNotFound):
		failure(w, 404, "task_not_found", "Tarefa não encontrada. Atualize o quadro.", nil)
	default:
		a.logger.Error("request failed", "error", err)
		failure(w, 500, "internal_error", "Não foi possível concluir a operação.", nil)
	}
}
func methodNotAllowed(w http.ResponseWriter, allow string) {
	w.Header().Set("Allow", allow)
	failure(w, 405, "method_not_allowed", "Método não permitido.", nil)
}
func failure(w http.ResponseWriter, status int, code, message string, fields map[string]string) {
	type detail struct {
		Code    string            `json:"code"`
		Message string            `json:"message"`
		Fields  map[string]string `json:"fields,omitempty"`
	}
	respond(w, status, struct {
		Error detail `json:"error"`
	}{detail{code, message, fields}})
}
func respond(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
