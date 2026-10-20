# Registro de verificação

Revisão em 20/10/2026, contra o edital e as duas páginas do PDF de orientações. Este registro descreve verificações executadas, sem promessa de nota ou ausência absoluta de vulnerabilidades.

## Ambiente e backend

- Go 1.27.3 instalado a partir do arquivo oficial, com SHA-256 conferido; Node 24.19.0 e Docker disponíveis.
- `go test ./...` e `go vet ./...`: aprovados no Windows, inclusive após adequar a estrutura a `main.go`, `handlers.go`, `models.go`, `service.go` e `repository.go`.
- CRUD, todas as transições, limites Unicode, IDs e campos protegidos, tipos inválidos, status, JSON malformado/adicional, mídia, corpo excessivo, rotas e métodos.
- CORS: preflight, origem exata autorizada e origens/cabeçalhos recusados antes de alterar dados.
- JSON: recarga após reinício, corrupção preservada, falha de escrita sem publicação em memória, falha real de substituição sem vazamento na resposta, operações concorrentes, cancelamento e limpeza de temporários.
- Race detector e vet aprovados em Linux dentro de container.
- `govulncheck` 1.9.0: nenhuma vulnerabilidade encontrada na análise executada.

## Frontend e integração

- Prettier, ESLint, TypeScript e build de produção aprovados.
- Vitest: **7 testes aprovados** (validação, formulário, erro sem perda de campos, bloqueio de duplicação, rollback/reconciliação e descarte de resposta antiga).
- Playwright com Go/JSON reais: **4 testes aprovados** após a reorganização do backend.
- Ciclo completo: criar → editar → mover entre as três colunas → recarregar → cancelar/confirmar exclusão.
- Arraste para coluna vazia e cancelamento com Escape; alternativa por seletor de status operada pelo teclado.
- Falhas simuladas apenas no cenário de falha: preservação do formulário e reconciliação do movimento. O CRUD principal não usa API simulada.
- Conteúdo semelhante a HTML/script aparece como texto; viewport móvel sem transbordamento horizontal.
- Axe sem violações nos cenários verificados: quadro e formulário móveis; quadro desktop na captura. Isso não equivale a auditoria completa de acessibilidade.
- `npm audit --audit-level=high`: nenhuma vulnerabilidade reportada na execução registrada.

## Persistência e execução

- Docker Compose construiu e iniciou frontend e backend com healthchecks saudáveis, processos sem root e portas vinculadas ao endereço local.
- Tarefa criada por HTTP permaneceu após reiniciar o container da API; excluída ao concluir o teste.
- Testes e containers de conferência usam dados próprios; a captura cria e remove somente seus exemplos.
- Clone público sem credenciais, fora da pasta de trabalho, no commit `6adcc33`: `npm ci`, formatação, lint, 7 testes unitários, build, 4 E2E, `go test ./...` e `go vet ./...` aprovados no Windows.
- [CI pública aprovada](https://github.com/CDNtiago/desafio-fullstack-veritas/actions/runs/39502872448) no mesmo commit: backend Windows e Linux, race detector Linux, análise de vulnerabilidades, frontend/E2E e containers com verificação de persistência após reinício.
- Build de produção servido pelo Nginx/Docker: criação, mudança para Concluídas, recarga e exclusão confirmadas no navegador; sem erros de JavaScript ou CSP no cenário executado.

## Documentação e entrega

- README contém execução de ambos os serviços, decisões, limitações, melhorias futuras e roteiro de demonstração.
- `docs/user-flow.png` gerado pela fonte Mermaid e inspecionado visualmente: carregamento, criação, edição, movimentação, exclusão, erros e cancelamentos.
- Captura da interface inspecionada; matriz de conformidade cruza as fontes e as evidências.
- [Repositório público](https://github.com/CDNtiago/desafio-fullstack-veritas) com nome correto e branch padrão `main`. Repositório, README e `docs/user-flow.png` responderam HTTP 200 sem autenticação; clone sem credenciais aprovado.
- Submissão à empresa: não realizada. O endereço do formulário não está nos documentos recebidos.
