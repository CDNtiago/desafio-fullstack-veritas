# Registro de verificação

Em 20/10/2026, conferi o projeto com o edital e as duas páginas do PDF de orientações. Registrei abaixo as verificações executadas e os limites de cada uma.

**Visibilidade atual: privada.** Mantenho o repositório privado enquanto concluo a revisão. Fiz as verificações de acesso público abaixo antes dessa mudança e vou repeti-las quando tornar o repositório público para a entrega.

## Conferência final em clone limpo

Clonei novamente o repositório no commit `9ecd5ec44b0ff03a0ee4618aa2d21f332178097e`, em uma pasta temporária fora do projeto. Como o repositório está privado, usei o acesso autenticado; a conferência pública sem login continua pendente.

- Reli as duas páginas do PDF e o edital e comparei os requisitos com o plano, os arquivos do projeto e os testes. Não identifiquei funcionalidades obrigatórias do MVP sem implementação.
- Executei `gofmt`, `go test -count=1 -cover ./...`, `go vet ./...` e `govulncheck` 1.9.0 no Windows: todos passaram. A cobertura registrada foi de 79,2% das instruções Go; a análise não encontrou vulnerabilidades.
- Instalei as dependências com `npm ci` e executei formatação, lint, os **8 testes unitários**, TypeScript, build de produção e auditoria npm: todos passaram, sem vulnerabilidades reportadas nessa execução.
- Executei os **4 testes Playwright** com API Go e JSON reais: CRUD, movimentação, cancelamento, recuperação de falhas, teclado, texto seguro e viewport móvel passaram. Os cenários de acessibilidade verificados pelo Axe também passaram.
- Conferi os links locais da documentação, os arquivos exigidos e a imagem PNG do User Flow. Inspecionei o diagrama e o quadro no navegador.
- Construí e iniciei o Docker Compose a partir desse clone, usando um projeto e um volume exclusivos de teste nas portas 5185 e 8095. Conferi interface, criação, edição, mudança de status, persistência após reiniciar a API e exclusão. Ao terminar, removi somente os containers e o volume dessa verificação.
- A [CI desse commit](https://github.com/CDNtiago/desafio-fullstack-veritas/actions/runs/39507136740) passou em backend Windows, backend Linux, frontend e containers, incluindo detecção de concorrência e persistência após reinício.

Os testes usaram seus próprios arquivos temporários. Para a avaliação manual, iniciei o frontend em `http://127.0.0.1:5183/` e a API em `http://127.0.0.1:8093`, com CORS para a origem correspondente e persistência em `backend/data/tasks.json`, ignorado pelo Git. Usei as portas alternativas documentadas porque 5173 e 8080 já estavam ocupadas. Confirmei respostas HTTP 200, a saúde da API e o carregamento das três colunas no navegador.

## Ambiente e backend

- Instalei Go 1.27.3 a partir do arquivo oficial e conferi o SHA-256; Node 24.19.0 e Docker também estão disponíveis. Registrei Go no PATH da minha conta no Windows; terminais antigos precisam ser reabertos para receber a alteração.
- `go test ./...` e `go vet ./...`: aprovados no Windows, inclusive após adequar a estrutura a `main.go`, `handlers.go`, `models.go`, `service.go` e `repository.go`.
- CRUD, todas as transições, limites Unicode, IDs e campos protegidos, tipos inválidos, status, JSON malformado/adicional, mídia, corpo excessivo, rotas e métodos.
- CORS: preflight, origem exata autorizada e origens/cabeçalhos recusados antes de alterar dados.
- JSON: recarga após reinício, corrupção preservada, falha de escrita sem publicação em memória, falha real de substituição sem vazamento na resposta, operações concorrentes, cancelamento e limpeza de temporários.
- Regressão de UTF-8: o teste reproduziu a aceitação indevida antes da correção e passou depois dela; bytes corrompidos agora impedem a abertura e permanecem intactos no arquivo.
- Novos casos aprovados: `updatedAt` protegido em PUT, Content-Type ausente e preflight com cabeçalho/método não permitido.
- Race detector e vet aprovados em Linux dentro de container.
- `govulncheck` 1.9.0: nenhuma vulnerabilidade encontrada na análise executada.

## Frontend e integração

- Prettier, ESLint, TypeScript e build de produção aprovados.
- Vitest: **8 testes aprovados**, cobrindo validação, formulário, erro sem perda de campos, bloqueio de duplicação, rollback/reconciliação e descarte de resposta antiga. A revisão acrescenta foco no campo inválido e associação acessível da mensagem; comportamento também conferido no navegador.
- Playwright com Go/JSON reais: **4 testes aprovados** após a reorganização do backend.
- Ciclo completo: criar → editar → mover entre as três colunas → recarregar → cancelar/confirmar exclusão.
- Arraste para coluna vazia e cancelamento com Escape; alternativa por seletor de status operada pelo teclado.
- Falhas simuladas apenas no cenário de falha: preservação do formulário e reconciliação do movimento. O CRUD principal não usa API simulada.
- Conteúdo semelhante a HTML/script aparece como texto; viewport móvel sem transbordamento horizontal.
- Axe sem violações nos cenários verificados: quadro e formulário móveis; quadro desktop na captura. Isso não equivale a auditoria completa de acessibilidade.
- Nova paleta petróleo/dourado: build, lint e os 4 E2E passaram; nova captura desktop passou no Axe e foi inspecionada. User Flow regenerado e inspecionado com as mesmas cores.
- `npm audit --audit-level=high`: nenhuma vulnerabilidade reportada na execução registrada.

## Persistência e execução

- Docker Compose construiu e iniciou frontend e backend com healthchecks saudáveis, processos sem root e portas vinculadas ao endereço local.
- Tarefa criada por HTTP permaneceu após reiniciar o container da API; excluída ao concluir o teste.
- Testes e containers de conferência usam dados próprios; a captura cria e remove somente seus exemplos.
- Clone público sem credenciais, fora da pasta de trabalho, no commit `6adcc33`: `npm ci`, formatação, lint, 7 testes unitários, build, 4 E2E, `go test ./...` e `go vet ./...` aprovados no Windows.
- [CI aprovada na revisão anterior](https://github.com/CDNtiago/desafio-fullstack-veritas/actions/runs/39502872448) no mesmo commit: backend Windows e Linux, race detector Linux, análise de vulnerabilidades, frontend/E2E e containers com verificação de persistência após reinício. Os resultados das revisões seguintes ficam em [Actions por commit](https://github.com/CDNtiago/desafio-fullstack-veritas/actions/workflows/ci.yml), acessíveis aos colaboradores enquanto o repositório estiver privado.
- Build de produção servido pelo Nginx/Docker: criação, mudança para Concluídas, recarga e exclusão confirmadas no navegador; sem erros de JavaScript ou CSP no cenário executado.
- A [CI da revisão visual e de segurança](https://github.com/CDNtiago/desafio-fullstack-veritas/actions/runs/39505720911), commit `3162857`, passou nas quatro etapas. Avisos de manutenção motivaram a atualização das Actions para Node 24, com SHAs conferidos nos repositórios oficiais, e dos aliases de ambiente para Ubuntu 24.04 e Windows Server 2025. O resultado dessa atualização está no histórico de Actions por commit.

## Documentação e entrega

- README contém execução de ambos os serviços, decisões, limitações, melhorias futuras e roteiro de demonstração.
- `docs/user-flow.png` gerado pela fonte Mermaid e inspecionado visualmente: carregamento, criação, edição, movimentação, exclusão, erros e cancelamentos.
- Captura da interface inspecionada; matriz de conformidade cruza as fontes e as evidências.
- [Repositório](https://github.com/CDNtiago/desafio-fullstack-veritas) com nome correto e branch padrão `main`. Na conferência inicial, antes de torná-lo privado, repositório, README e `docs/user-flow.png` responderam HTTP 200 sem autenticação; clone sem credenciais aprovado. Atualmente a visibilidade está confirmada como `PRIVATE`.
- Submissão à empresa: não realizada. O endereço do formulário não está nos documentos recebidos.
- Listei as pendências em [revisao-entrega.md](revisao-entrega.md). Vou manter o repositório privado até concluir a revisão.
