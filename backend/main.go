package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
)

func env(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}
func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stderr, nil))
	if err := run(logger); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
func run(logger *slog.Logger) error {
	// Valido as origens do CORS na inicialização para detectar erros de configuração.
	origins := strings.Split(env("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"), ",")
	for i, origin := range origins {
		origin = strings.TrimSpace(origin)
		u, err := url.Parse(origin)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" || u.Hostname() == "*" || u.User != nil || u.Path != "" || u.RawQuery != "" || u.Fragment != "" {
			return errors.New("ALLOWED_ORIGINS must contain exact HTTP origins without paths")
		}
		origins[i] = origin
	}
	// Só inicio a API depois de carregar e validar o arquivo de tarefas.
	repo, err := OpenJSONRepository(env("TASKS_FILE", "data/tasks.json"))
	if err != nil {
		return err
	}
	// Limito o tempo de leitura/escrita e os cabeçalhos de cada conexão HTTP.
	server := &http.Server{
		Addr:              env("HTTP_ADDR", "127.0.0.1:8080"),
		Handler:           NewHandler(NewService(repo), origins, logger),
		ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second,
		WriteTimeout: 15 * time.Second, IdleTimeout: 60 * time.Second, MaxHeaderBytes: 8 * 1024,
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	done := make(chan error, 1)
	go func() { logger.Info("API listening", "address", server.Addr); done <- server.ListenAndServe() }()
	select {
	case err := <-done:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
		// Ao encerrar, dou prazo para concluir as requisições que já estão em andamento.
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return server.Shutdown(shutdown)
	}
	return nil
}
