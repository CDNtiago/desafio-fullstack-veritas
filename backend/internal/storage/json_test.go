package storage

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"github.com/CDNtiago/desafio-fullstack-veritas/backend/internal/task"
)

func TestPersistenceLifecycle(t *testing.T) {
	path := filepath.Join(t.TempDir(), "data", "tasks.json")
	repo, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	s := task.NewService(repo)
	ctx := context.Background()
	initial, _ := s.List(ctx)
	if initial == nil || len(initial) != 0 {
		t.Fatal("expected non-nil empty list")
	}
	created, err := s.Create(ctx, task.Input{Title: "  Primeiro  ", Status: task.Todo})
	if err != nil {
		t.Fatal(err)
	}
	updated, err := s.Update(ctx, created.ID, task.Input{Title: "Editado", Description: "Detalhes", Status: task.Done})
	if err != nil {
		t.Fatal(err)
	}
	if updated.ID != created.ID || !updated.CreatedAt.Equal(created.CreatedAt) || updated.UpdatedAt.Before(created.UpdatedAt) {
		t.Fatal("immutable fields changed")
	}
	reloaded, err := Open(path)
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
	reloaded, err = Open(path)
	if err != nil {
		t.Fatal(err)
	}
	list, _ = reloaded.List(ctx)
	if len(list) != 0 {
		t.Fatal("delete not persisted")
	}
	if err := s.Delete(ctx, created.ID); !errors.Is(err, task.ErrNotFound) {
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
			if _, err := Open(path); err == nil {
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
	repo, _ := Open(path)
	s := task.NewService(repo)
	ctx := context.Background()
	created, err := s.Create(ctx, task.Input{Title: "Original", Status: task.Todo})
	if err != nil {
		t.Fatal(err)
	}
	before, _ := os.ReadFile(path)
	repo.write = func(string, []byte) error { return errors.New("simulated disk failure") }
	if _, err := s.Update(ctx, created.ID, task.Input{Title: "Changed", Status: task.Done}); err == nil {
		t.Fatal("update succeeded")
	}
	if err := s.Delete(ctx, created.ID); err == nil {
		t.Fatal("delete succeeded")
	}
	if _, err := s.Create(ctx, task.Input{Title: "Extra", Status: task.Todo}); err == nil {
		t.Fatal("create succeeded")
	}
	after, _ := os.ReadFile(path)
	list, _ := s.List(ctx)
	if string(before) != string(after) || len(list) != 1 || list[0] != created {
		t.Fatal("failed write changed state")
	}
}

func TestConcurrentMutations(t *testing.T) {
	path := filepath.Join(t.TempDir(), "tasks.json")
	repo, _ := Open(path)
	s := task.NewService(repo)
	ctx := context.Background()
	var wg sync.WaitGroup
	for i := 0; i < 30; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			created, err := s.Create(ctx, task.Input{Title: "Concurrent", Status: task.Todo})
			if err != nil {
				t.Error(err)
				return
			}
			if _, err := s.Update(ctx, created.ID, task.Input{Title: "Updated", Status: task.Done}); err != nil {
				t.Error(err)
			}
			if _, err := s.List(ctx); err != nil {
				t.Error(err)
			}
		}()
	}
	wg.Wait()
	reloaded, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	list, _ := reloaded.List(ctx)
	if len(list) != 30 {
		t.Fatalf("lost writes: %d", len(list))
	}
	for _, item := range list {
		if item.Status != task.Done {
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
	repo, _ := Open(filepath.Join(t.TempDir(), "tasks.json"))
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := repo.Create(ctx, task.Task{ID: "a", CreatedAt: time.Now()}); !errors.Is(err, context.Canceled) {
		t.Fatal(err)
	}
	list, _ := repo.List(context.Background())
	if len(list) != 0 {
		t.Fatal("cancelled mutation persisted")
	}
}
