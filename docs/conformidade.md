# Matriz de conformidade

Usei como referência o `Desafio prático.txt` (edital), o PDF **DESAFIO TÉCNICO - ORIENTAÇÕES** e o comunicado sobre entrega pública. O PDF detalha o MVP e o README. As ferramentas auxiliares e os limites adicionais são decisões que tomei na implementação, não exigências da empresa.

| Requisito | Evidência implementada |
| --- | --- |
| React no frontend; Go no backend | `frontend/package.json`, `backend/go.mod`; E2E inicia ambos |
| Três colunas fixas | `frontend/src/App.tsx`: A Fazer, Em Progresso, Concluídas |
| Criar tarefa com título e descrição opcional | `TaskForm.tsx`, `models.go`, testes de formulário e HTTP |
| Editar, mover e excluir | PUT/DELETE no backend; controles, arraste e confirmação na interface; E2E do ciclo completo |
| Feedback de loading/erro e consumo da API | `useTasks.ts`, `api.ts`, estados pendentes, mensagens e preservação do formulário |
| GET, POST, PUT, DELETE para `/tasks` | `backend/handlers.go`; contrato e rotas individuais por ID descritos no README |
| Memória ou JSON | `backend/repository.go`: memória carregada de JSON, gravação a cada mutação; testes de recarga |
| Título obrigatório e status válido | `backend/models.go`, validação também em chamadas externas à interface |
| CORS | Origens exatas e preflight em `handlers.go`; testes de origens recusadas |
| Pastas backend, frontend e docs | Estrutura versionada; `main.go`, `handlers.go`, `models.go` em backend, serviço e repositório em arquivos próprios |
| README: execução e decisões | Instruções nativas, Docker, versões, variáveis, contrato e justificativas |
| README: limitações e melhorias futuras | Seções específicas sobre JSON, ausência de login, concorrência e evolução |
| Imagem obrigatória do User Flow | [`user-flow.png`](user-flow.png), incorporada ao README, com [fonte editável](user-flow.mmd) |
| Fluxo de dados opcional | Diagrama em [arquitetura.md](arquitetura.md); não substitui o User Flow |
| Bônus: arraste, JSON, Docker ou testes | Todos implementados e verificados; continuam opcionais no documento |
| GitHub público, nome `desafio-fullstack-veritas` | Nome correto; **publicação pendente**. Mantenho o repositório privado até concluir a revisão |
| Documentação acessível à banca | README e PNG versionados; vou reconferir o acesso sem login após tornar o repositório público |
| Envio pelo canal indicado pela empresa | Pendente: confirmar canal/prazo e submeter o link; formulário não consta nos documentos fornecidos |
| Git: commits claros | Histórico incremental de requisitos, backend, frontend, revisão e entrega |

## Critérios de avaliação

Funcionalidade **40%**, código/arquitetura **25%**, UI/UX **15%**, documentação **15%** e Git **5%**. O edital exige nota mínima 7 e domínio mínimo. Preparei o [roteiro no README](../README.md#demonstração-e-entrega) para apresentar a solução e demonstrar os fluxos.

O comunicado chama o nome do repositório de preferencial; o edital e o PDF indicam `desafio-fullstack-veritas`. Usei esse nome, atendendo às três fontes. Ainda vou confirmar o prazo e o canal de envio com a empresa, sem tomar as datas impressas como prazo vigente.

## Revisões por etapa

Revisei requisitos, desenho, backend, frontend, interação, segurança, execução e documentação com base nas orientações recebidas. Registrei os comandos executados e as pendências em [verificacao.md](verificacao.md).

Na [revisão de entrega](revisao-entrega.md), comparei também as decisões do plano e listei o que ainda preciso concluir antes do envio.
