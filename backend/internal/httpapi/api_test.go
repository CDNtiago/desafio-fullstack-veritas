package httpapi

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/CDNtiago/desafio-fullstack-veritas/backend/internal/storage"
	"github.com/CDNtiago/desafio-fullstack-veritas/backend/internal/task"
)

func testAPI(t *testing.T) http.Handler {
	t.Helper()
	repo, err := storage.Open(filepath.Join(t.TempDir(), "tasks.json"))
	if err != nil {
		t.Fatal(err)
	}
	return New(task.NewService(repo), []string{"http://localhost:5173"}, slog.New(slog.NewTextHandler(io.Discard, nil)))
}
func request(api http.Handler, method, path, body string, headers map[string]string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		r.Header.Set("Content-Type", "application/json")
	}
	for k, v := range headers {
		r.Header.Set(k, v)
	}
	w := httptest.NewRecorder()
	api.ServeHTTP(w, r)
	return w
}

func TestCRUD(t *testing.T) {
	api := testAPI(t)
	if w := request(api, "GET", "/tasks", "", nil); w.Code != 200 || strings.TrimSpace(w.Body.String()) != "[]" {
		t.Fatal(w)
	}
	w := request(api, "POST", "/tasks", `{"title":"  Planejar  "}`, nil)
	if w.Code != 201 {
		t.Fatal(w)
	}
	var created task.Task
	if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil {
		t.Fatal(err)
	}
	if created.Title != "Planejar" || created.Status != task.Todo || !task.ValidID(created.ID) {
		t.Fatal(created)
	}
	for _, status := range []string{task.InProgress, task.Done, task.Todo} {
		w = request(api, "PUT", "/tasks/"+created.ID, `{"title":"Editado","description":"Teste","status":"`+status+`"}`, nil)
		if w.Code != 200 {
			t.Fatal(w)
		}
	}
	if w := request(api, "DELETE", "/tasks/"+created.ID, "", nil); w.Code != 204 || w.Body.Len() != 0 {
		t.Fatal(w)
	}
	if w := request(api, "DELETE", "/tasks/"+created.ID, "", nil); w.Code != 404 {
		t.Fatal(w)
	}
}

func TestRejectManipulatedRequests(t *testing.T) {
	for _, tc := range []struct {
		name, method, path, body string
		headers                  map[string]string
		status                   int
	}{
		{"empty title", "POST", "/tasks", `{"title":"  "}`, nil, 400},
		{"unknown status", "POST", "/tasks", `{"title":"a","status":"admin"}`, nil, 400},
		{"protected id", "POST", "/tasks", `{"title":"a","id":"x"}`, nil, 400},
		{"protected date", "POST", "/tasks", `{"title":"a","createdAt":"2026-01-01"}`, nil, 400},
		{"case-sensitive keys", "POST", "/tasks", `{"Title":"a"}`, nil, 400},
		{"null title", "POST", "/tasks", `{"title":null}`, nil, 400},
		{"null description", "POST", "/tasks", `{"title":"a","description":null}`, nil, 400},
		{"number", "POST", "/tasks", `{"title":3}`, nil, 400},
		{"array", "POST", "/tasks", `[]`, nil, 400},
		{"null body", "POST", "/tasks", `null`, nil, 400},
		{"malformed", "POST", "/tasks", `{`, nil, 400},
		{"trailing object", "POST", "/tasks", `{"title":"a"} {}`, nil, 400},
		{"wrong type", "POST", "/tasks", `{"title":"a"}`, map[string]string{"Content-Type": "text/plain"}, 415},
		{"too large", "POST", "/tasks", strings.Repeat(" ", MaxBodyBytes+1), nil, 413},
		{"invalid id", "DELETE", "/tasks/bad", "", nil, 400},
		{"unknown id", "DELETE", "/tasks/" + strings.Repeat("a", 32), "", nil, 404},
		{"partial update", "PUT", "/tasks/" + strings.Repeat("a", 32), `{"title":"a"}`, nil, 400},
		{"wrong method", "PATCH", "/tasks", "", nil, 405},
		{"unknown route", "GET", "/unknown", "", nil, 404},
		{"denied origin", "POST", "/tasks", `{"title":"a"}`, map[string]string{"Origin": "https://evil.example"}, 403},
	} {
		t.Run(tc.name, func(t *testing.T) {
			api := testAPI(t)
			w := request(api, tc.method, tc.path, tc.body, tc.headers)
			if w.Code != tc.status {
				t.Fatalf("want %d got %d: %s", tc.status, w.Code, w.Body)
			}
			var body map[string]any
			if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil || body["error"] == nil {
				t.Fatal("error not JSON", err)
			}
			list := request(api, "GET", "/tasks", "", nil)
			if strings.TrimSpace(list.Body.String()) != "[]" {
				t.Fatal("rejected request mutated state")
			}
		})
	}
}

func TestCORS(t *testing.T) {
	api := testAPI(t)
	w := request(api, "OPTIONS", "/tasks", "", map[string]string{"Origin": "http://localhost:5173", "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "content-type"})
	if w.Code != 204 || w.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
		t.Fatal(w)
	}
	w = request(api, "OPTIONS", "/tasks", "", map[string]string{"Origin": "http://localhost:5173.evil.example", "Access-Control-Request-Method": "POST"})
	if w.Code != 403 || w.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatal(w)
	}
	w = request(api, "GET", "/tasks", "", nil)
	if w.Header().Get("Access-Control-Allow-Origin") != "" || w.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Fatal(w)
	}
}

func TestPersistenceErrorIsPrivateAndDoesNotMutate(t *testing.T) {
	path := filepath.Join(t.TempDir(), "tasks.json")
	repo, err := storage.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	// Force a real rename failure without relying on administrator-sensitive permissions.
	if err := os.Mkdir(path, 0700); err != nil {
		t.Fatal(err)
	}
	api := New(task.NewService(repo), nil, slog.New(slog.NewTextHandler(io.Discard, nil)))
	w := request(api, "POST", "/tasks", `{"title":"Not persisted"}`, nil)
	if w.Code != 500 || strings.Contains(w.Body.String(), path) || strings.Contains(w.Body.String(), "rename") {
		t.Fatalf("unsafe persistence error: %d %s", w.Code, w.Body)
	}
	w = request(api, "GET", "/tasks", "", nil)
	if strings.TrimSpace(w.Body.String()) != "[]" {
		t.Fatal("unpersisted task published")
	}
}
