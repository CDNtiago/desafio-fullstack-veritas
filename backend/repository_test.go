package main

import (
	"bytes"
	"context"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"
)

func TestPersistenceLifecycle(t *testing.T) {
	path := filepath.Join(t.TempDir(), "data", "tasks.json")
	repo, err := OpenJSONRepository(path)
	if err != nil {
		t.Fatal(err)
	}
	s := NewService(repo)
	ctx := context.Background()
	initial, _ := s.List(ctx)
	if initial == nil || len(initial) != 0 {
		t.Fatal("expected non-nil empty list")
	}
	created, err := s.Create(ctx, Input{Title: "  Primeiro  ", Status: Todo})
	if err != nil {
		t.Fatal(err)
	}
	updated, err := s.Update(ctx, created.ID, Input{Title: "Editado", Description: "Detalhes", Status: Done})
	if err != nil {
		t.Fatal(err)
	}
	if updated.ID != created.ID || !updated.CreatedAt.Equal(created.CreatedAt) || updated.UpdatedAt.Before(created.UpdatedAt) {
		t.Fatal("immutable fields changed")
	}
	reloaded, err := OpenJSONRepository(path)
	if err != nil {
		t.Fatal(err)
	}
	list, _ := reloaded.List(ctx)
	if len(list) != 1 || list[0] != updated {
		t.Fatalf("reload: %+v", list)
	}
	list[0].Title = "mutated externally"
	check, _ := reloaded.List(ctx)
	if check[0].Title != "Editado" {
		t.Fatal("list leaked mutable slice")
	}
	if err := s.Delete(ctx, created.ID); err != nil {
		t.Fatal(err)
	}
	reloaded, err = OpenJSONRepository(path)
	if err != nil {
		t.Fatal(err)
	}
	list, _ = reloaded.List(ctx)
	if len(list) != 0 {
		t.Fatal("delete not persisted")
	}
	if err := s.Delete(ctx, created.ID); !errors.Is(err, ErrNotFound) {
		t.Fatal(err)
	}
}

func TestCorruptFilePreserved(t *testing.T) {
	for _, content := range []string{"{broken", "null", "[] {}", `[{}]`} {
		t.Run(content, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "tasks.json")
			if err := os.WriteFile(path, []byte(content), 0600); err != nil {
				t.Fatal(err)
			}
			if _, err := OpenJSONRepository(path); err == nil {
				t.Fatal("accepted corrupt file")
			}
			got, _ := os.ReadFile(path)
			if string(got) != content {
				t.Fatal("corrupt file overwritten")
			}
		})
	}
}

func TestFailedWriteDoesNotPublish(t *testing.T) {
	path := filepath.Join(t.TempDir(), "tasks.json")
	repo, _ := OpenJSONRepository(path)
	s := NewService(repo)
	ctx := context.Background()
	created, err := s.Create(ctx, Input{Title: "Original", Status: Todo})
	if err != nil {
		t.Fatal(err)
	}
	before, _ := os.ReadFile(path)
	repo.write = func(string, []byte) error { return errors.New("simulated disk failure") }
	if _, err := s.Update(ctx, created.ID, Input{Title: "Changed", Status: Done}); err == nil {
		t.Fatal("update succeeded")
	}
	if err := s.Delete(ctx, created.ID); err == nil {
		t.Fatal("delete succeeded")
	}
	if _, err := s.Create(ctx, Input{Title: "Extra", Status: Todo}); err == nil {
		t.Fatal("create succeeded")
	}
	after, _ := os.ReadFile(path)
	list, _ := s.List(ctx)
	if string(before) != string(after) || len(list) != 1 || list[0] != created {
		t.Fatal("failed write changed state")
	}
}

func TestInvalidUTF8FilePreserved(t *testing.T) {
	path := filepath.Join(t.TempDir(), "tasks.json")
	content := []byte(`[{"id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","title":"valid","description":"","status":"todo","createdAt":"2026-01-01T00:00:00Z","updatedAt":"2026-01-01T00:00:00Z"}]`)
	content = bytes.Replace(content, []byte("valid"), []byte{0xff}, 1)
	if err := os.WriteFile(path, content, 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := OpenJSONRepository(path); err == nil {
		t.Fatal("accepted invalid UTF-8 and silently replaced corrupted text")
	}
	got, err := os.ReadFile(path)
	if err != nil || !bytes.Equal(got, content) {
		t.Fatal("corrupted file was not preserved", err)
	}
}

func TestConcurrentMutations(t *testing.T) {
	path := filepath.Join(t.TempDir(), "tasks.json")
	repo, _ := OpenJSONRepository(path)
	s := NewService(repo)
	ctx := context.Background()
	var wg sync.WaitGroup
	for i := 0; i < 30; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			created, err := s.Create(ctx, Input{Title: "Concurrent", Status: Todo})
			if err != nil {
				t.Error(err)
				return
			}
			if _, err := s.Update(ctx, created.ID, Input{Title: "Updated", Status: Done}); err != nil {
				t.Error(err)
			}
			if _, err := s.List(ctx); err != nil {
				t.Error(err)
			}
		}()
	}
	wg.Wait()
	reloaded, err := OpenJSONRepository(path)
	if err != nil {
		t.Fatal(err)
	}
	list, _ := reloaded.List(ctx)
	if len(list) != 30 {
		t.Fatalf("lost writes: %d", len(list))
	}
	for _, item := range list {
		if item.Status != Done {
			t.Fatal("lost update")
		}
	}
}

func TestSnapshotFailureKeepsDestination(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "existing-directory")
	if err := os.Mkdir(path, 0700); err != nil {
		t.Fatal(err)
	}
	if err := writeSnapshot(path, []byte("[]")); err == nil {
		t.Fatal("expected replace failure")
	}
	info, err := os.Stat(path)
	if err != nil || !info.IsDir() {
		t.Fatal("destination removed")
	}
	temps, _ := filepath.Glob(filepath.Join(dir, ".tasks-*.tmp"))
	if len(temps) != 0 {
		t.Fatal("temporary files leaked")
	}
}

func TestCancelledMutation(t *testing.T) {
	repo, _ := OpenJSONRepository(filepath.Join(t.TempDir(), "tasks.json"))
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := repo.Create(ctx, Task{ID: "a", CreatedAt: time.Now()}); !errors.Is(err, context.Canceled) {
		t.Fatal(err)
	}
	list, _ := repo.List(context.Background())
	if len(list) != 0 {
		t.Fatal("cancelled mutation persisted")
	}
}
