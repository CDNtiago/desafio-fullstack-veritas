# Veritas · Mini Kanban

Desafio fullstack com React no frontend e Go no backend. Três colunas fixas, CRUD completo e persistência em JSON, conforme [o enunciado](./Desafio%20pr%C3%A1tico.txt).

## Estrutura

- `backend`: API Go, regras e persistência JSON.
- `frontend`: interface React com TypeScript e Vite.
- `docs`: User Flow, arquitetura e evidências de conformidade.

## Decisões iniciais

Quadro local único, sem login. JSON é uma das duas alternativas expressamente permitidas. O frontend usa a API Go real. TypeScript, Vite, testes e Docker são escolhas auxiliares.

A matriz em [docs/conformidade.md](docs/conformidade.md) acompanha os requisitos. As instruções completas de execução e verificação serão incorporadas conforme os componentes forem implementados.
