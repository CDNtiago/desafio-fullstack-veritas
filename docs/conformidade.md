# Matriz de conformidade

Fontes: `Desafio prático.txt` (edital), PDF **DESAFIO TÉCNICO - ORIENTAÇÕES** fornecido pelo candidato e comunicado sobre entrega pública. O PDF detalha o MVP e o README. Ferramentas auxiliares e limites adicionais são decisões da implementação, não exigências atribuídas à empresa.

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
| GitHub público, nome `desafio-fullstack-veritas` | Conferência de nome, visibilidade e leitura sem autenticação no registro de verificação |
| Documentação acessível à banca | README e PNG dentro do repositório público, sem documento externo que exija convite |
| Envio pelo canal indicado pela empresa | Link do repositório pronto para envio; formulário não consta nos documentos fornecidos |
| Git: commits claros | Histórico incremental de requisitos, backend, frontend, revisão e entrega |

## Critérios de avaliação

Funcionalidade **40%**, código/arquitetura **25%**, UI/UX **15%**, documentação **15%** e Git **5%**. O edital exige nota mínima 7 e domínio mínimo. O [roteiro no README](../README.md#demonstração-e-entrega) permite explicar a solução e demonstrar os fluxos; não constitui garantia de nota.

O comunicado chama o nome do repositório de preferencial; o edital e o PDF indicam `desafio-fullstack-veritas`. Utilizamos esse nome, atendendo às três fontes. As datas impressas foram desconsideradas por orientação do candidato; o prazo e o canal efetivos de submissão dependem da comunicação da empresa.

## Revisões por etapa

Requisitos, desenho, backend, frontend, interação, segurança, execução e documentação foram revisados contra as fontes recebidas. Os comandos realmente executados e as pendências externas ficam em [verificacao.md](verificacao.md).
