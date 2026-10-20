# Registro de verificação

## Preparação e backend

- Enunciado relido antes da implementação: React, Go, JSON, CRUD e CORS preservados.
- Go 1.27.3 instalado localmente a partir do arquivo oficial com checksum SHA-256 verificado.
- `go test ./...` e `go vet ./...`: aprovados no Windows.
- Cobertura funcional: ciclo CRUD; validação de limites e Unicode; CORS; tipos/rotas/métodos inválidos; campos protegidos; corpos excessivos.
- Persistência: reinício, corrupção preservada, falha de escrita sem publicação em memória, concorrência, cancelamento e limpeza de temporários.

As verificações de frontend, Linux, Docker e E2E serão registradas após execução real. Não há promessa de nota ou ausência absoluta de vulnerabilidades.
