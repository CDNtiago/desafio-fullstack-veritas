# Veritas · Mini Kanban

Desenvolvi este Mini Kanban para organizar tarefas em **A Fazer**, **Em Progresso** e **Concluídas**, usando **React** no frontend, **Go** na API e **arquivo JSON** para persistência, conforme o [Desafio prático](./Desafio%20pr%C3%A1tico.txt).

## Funcionalidades

- Criar, editar e excluir tarefas com confirmação.
- Mover entre todas as colunas por arraste ou seletor de status.
- Título, descrição opcional e status, validados também no servidor.
- Feedback de carregamento, salvamento, sucesso, falha e quadro vazio.
- Formulário preservado em falhas; movimento otimista com reversão e reconciliação.
- Interface responsiva, teclado, foco visível e anúncios acessíveis.
- Dados preservados ao recarregar a página e reiniciar a API.

## Como executar

Há duas formas de executar, e as duas usam as mesmas portas: interface em **5173** e API em **8080**.

- **Opção 1, sem Docker:** requer Go e Node.js instalados.
- **Opção 2, com Docker:** requer apenas Docker, sem Go nem Node.

Primeiro, clone o repositório:

```sh
git clone https://github.com/CDNtiago/desafio-fullstack-veritas.git
cd desafio-fullstack-veritas
```

### Opção 1 — Sem Docker (Go + Node.js)

**Pré-requisitos:** [Go](https://go.dev/dl/) 1.27 ou superior e [Node.js](https://nodejs.org/) 24 (testado com Go 1.27.3 e Node.js 24.19.0). Para conferir:

```sh
go version
node --version
```

**Passo 1 — Iniciar a API.** Em um terminal, na pasta do projeto:

```sh
cd backend
go run .
```

A API está pronta quando aparecer a mensagem `API listening`. Deixe esse terminal aberto.

**Passo 2 — Iniciar a interface.** Abra um **segundo terminal**, na pasta do projeto:

```sh
cd frontend
npm ci
npm run dev
```

O `npm ci` só é necessário na primeira execução. Ele instala as versões exatas do `package-lock.json`.

**Passo 3 — Abrir no navegador:** <http://localhost:5173>

Para encerrar, use `Ctrl+C` nos dois terminais. As tarefas ficam salvas em `backend/data/tasks.json`, criado na primeira gravação, e continuam lá na próxima execução.

#### Se a porta 8080 ou 5173 já estiver em uso

Use outras portas, por exemplo **8094** para a API e **5184** para a interface. Copie o bloco do seu terminal.

**PowerShell (Windows)**

Terminal 1, na pasta do projeto:

```powershell
cd backend
$env:HTTP_ADDR = '127.0.0.1:8094'
$env:ALLOWED_ORIGINS = 'http://localhost:5184,http://127.0.0.1:5184'
go run .
```

Terminal 2, na pasta do projeto:

```powershell
cd frontend
npm ci
$env:VITE_API_URL = 'http://127.0.0.1:8094'
npm run dev -- --port 5184
```

**Bash ou Zsh (Linux, macOS, Git Bash)**

Terminal 1, na pasta do projeto:

```sh
cd backend
HTTP_ADDR=127.0.0.1:8094 ALLOWED_ORIGINS=http://localhost:5184,http://127.0.0.1:5184 go run .
```

Terminal 2, na pasta do projeto:

```sh
cd frontend
npm ci
VITE_API_URL=http://127.0.0.1:8094 npm run dev -- --port 5184
```

Depois, acesse <http://localhost:5184>. As três variáveis precisam combinar: a interface chama a API em `VITE_API_URL`, e a API só aceita a origem listada em `ALLOWED_ORIGINS`.

### Opção 2 — Com Docker

**Pré-requisito:** Docker Desktop ou Docker Engine com Compose v2, em modo de containers Linux.

**Passo 1 — Construir e iniciar**, na pasta do projeto:

```sh
docker compose up --build -d --wait
```

O primeiro build leva alguns minutos. O comando termina quando os dois serviços estão saudáveis.

**Passo 2 — Abrir no navegador:** <http://localhost:5173>

**Para acompanhar ou encerrar:**

```sh
docker compose logs -f
docker compose down
```

O `down` mantém as tarefas no volume `tasks-data`. Para **apagar todas as tarefas**, use `docker compose down --volumes`.

**Se a porta 8080 ou 5173 já estiver em uso:** informe outras portas ao iniciar. O Compose ajusta o CORS e a URL da API automaticamente.

PowerShell (Windows):

```powershell
$env:BACKEND_PORT = '8094'
$env:FRONTEND_PORT = '5184'
docker compose up --build -d --wait
```

Bash ou Zsh (Linux, macOS, Git Bash):

```sh
BACKEND_PORT=8094 FRONTEND_PORT=5184 docker compose up --build -d --wait
```

Depois, acesse <http://localhost:5184>. Para não repetir as variáveis, copie `.env.example` para `.env` e altere as portas nele.

### Conferir se a API está no ar

Com qualquer uma das opções, estes endereços respondem no navegador:

- Disponibilidade: <http://localhost:8080/health> → `{"status":"ok"}`
- Tarefas: <http://localhost:8080/tasks> → lista em JSON, `[]` quando vazia

### Build de produção da interface (opcional)

Com a API rodando, pare o `npm run dev` e execute em `frontend`:

```sh
npm run build
npm run preview
```

### Configuração

| Variável | Padrão | Uso |
| --- | --- | --- |
| `HTTP_ADDR` | `127.0.0.1:8080` | Endereço da API sem Docker |
| `TASKS_FILE` | `data/tasks.json` | Arquivo de tarefas, relativo à pasta onde a API é iniciada |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Origens exatas, separadas por vírgulas, sem barra final |
| `VITE_API_URL` | `http://localhost:8080` | URL da API usada pela interface |
| `BACKEND_PORT` / `FRONTEND_PORT` | `8080` / `5173` | Portas do host no Docker Compose |

O Go lê as variáveis do terminal e **não carrega `.env` automaticamente**. O Vite lê `frontend/.env`, e o Compose lê `.env` na raiz. Nenhum segredo é necessário.

## API

O enunciado nomeia `/tasks`; adotei o ID no caminho nas operações individuais.

| Método | Rota | Corpo | Sucesso |
| --- | --- | --- | --- |
| GET | `/tasks` | — | `200`, array, incluindo `[]` |
| POST | `/tasks` | `title`; `description` e `status` opcionais | `201`, tarefa criada |
| PUT | `/tasks/{id}` | `title`, `description`, `status` obrigatórios | `200`, tarefa atualizada |
| DELETE | `/tasks/{id}` | — | `204`, sem corpo |
| GET | `/health` | — | `200`, disponibilidade |

Criação e atualização exigem `Content-Type: application/json`. Exemplo:

```json
{
  "title": "Revisar a entrega",
  "description": "Conferir README, testes e User Flow.",
  "status": "todo"
}
```

A resposta também contém `id` (32 caracteres hexadecimais aleatórios), `createdAt` e `updatedAt` (RFC 3339 em UTC). Esses campos são controlados pelo servidor e não são aceitos na entrada.

Título: 1–120 caracteres após trim. Descrição: até 2.000. Status: `todo`, `in_progress` ou `done`. Corpo: até 16 KiB. Texto é contado por pontos de código Unicode. POST sem status usa `todo`; descrição ausente usa string vazia. Campos desconhecidos, tipos incorretos e valores `null` são rejeitados. Títulos iguais são permitidos.

Mover uma tarefa usa PUT, preservando título e descrição. Cartões são ordenados por criação, com desempate pelo ID; não há reordenação manual dentro da coluna.

Formato dos erros:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Dados da tarefa inválidos.",
    "fields": { "title": "Informe um título de 1 a 120 caracteres." }
  }
}
```

`fields` é opcional. Status HTTP: `400` entrada inválida; `403` origem/cabeçalho recusado pelo CORS; `404` recurso inexistente; `405` método indevido; `413` corpo excessivo; `415` mídia incompatível; `500` falha interna. Excluir novamente o mesmo ID retorna `404`.

## Arquitetura e decisões

```text
backend/
  main.go              inicialização e configuração
  handlers.go          HTTP, JSON de entrada, CORS e respostas
  models.go            modelo e validações
  service.go           regras de negócio e interface Repository
  repository.go        implementação JSON e sincronização
frontend/
  src/components/       ícones e modal
  src/tasks/            modelo, cliente HTTP, hook e componentes
  tests/                Playwright com API real e dados isolados
docs/
  user-flow.png         diagrama obrigatório do fluxo de uso
  data-flow.png         fluxo de dados entre interface, API e arquivo JSON
  *.mmd                 fontes Mermaid dos dois diagramas
```

Mantive os nomes `main.go`, `handlers.go` e `models.go` sugeridos nas orientações do desafio e separei serviço e repositório em arquivos próprios.

- **Go com biblioteca padrão:** optei por não adicionar framework ou ORM, pois a biblioteca padrão atende ao escopo. O servidor de execução não tem dependências externas.
- **JSON:** escolhi uma alternativa permitida no desafio. Os dados são lidos em memória, e cada alteração só é confirmada após a gravação no arquivo.
- **Responsabilidades:** separei HTTP nos handlers, regras no serviço e arquivos no repositório. A interface pequena permite testar cada responsabilidade.
- **React, TypeScript e Vite:** usei tipagem estrita e um build simples. Para um quadro único, não precisei de roteador ou gerenciador global de estado.
- **dnd-kit:** escolhi a biblioteca para oferecer arraste por ponteiro e teclado, mantendo o seletor de status como alternativa explícita.
- **Identidade visual:** usei o azul-petróleo e o dourado observados no [site de carreiras da Veritas](https://carreiras.veritas.law/), mantendo a área de trabalho clara. Centralizei as cores em variáveis CSS e adaptei tons para contraste.
- **Consistência:** mutações da interface serializadas; respostas antigas descartadas. Erros de movimentação revertem o estado e consultam a API, sem repetir automaticamente mutações.
- **Testes:** simulações restritas a testes de componentes/falhas; o E2E principal usa React, HTTP, Go e JSON reais. Sem MSW.

### Limitações e dados

Quadro local único, sem login. Todos os clientes com acesso à API podem operar tarefas; CORS não autentica. Uma instância por arquivo; a última gravação concluída da mesma tarefa prevalece. A interface recarrega ao recuperar foco; não há colaboração em tempo real.

O arquivo é regravado integralmente, com mutex, temporário, sincronização e substituição sem apagar antes o original. `Rename` não garante atomicidade no Windows; não há garantia transacional contra queda de energia. Arquivos inválidos, inclusive com bytes UTF-8 corrompidos, impedem a inicialização, preservando o conteúdo.

Para reiniciar dados nativos: pare a API, faça backup de `backend/data/tasks.json` e remova ou renomeie apenas esse arquivo. No próximo início o quadro estará vazio. Não edite o JSON enquanto o serviço estiver executando.

### Melhorias futuras

- Adicionar busca e filtros para facilitar quadros maiores.
- Adicionar controle de versão das tarefas para detectar edições concorrentes.
- Oferecer exportação e restauração de backups pela interface.
- Caso o produto evolua para uso compartilhado, avaliar autenticação, autorização por quadro e persistência transacional. Isso exigiria ampliar o escopo; a entrega atual mantém o armazenamento JSON permitido no desafio.

## Testes e qualidade

Em `backend`:

```sh
go test ./...
go vet ./...
go run golang.org/x/vuln/cmd/govulncheck@v1.9.0 ./...
```

No Linux com compilador C, execute também `go test -race ./...`. Os testes usam diretórios temporários e cobrem HTTP, CORS, validação, reinício, corrupção, falhas de escrita e concorrência.

Em `frontend`:

```sh
npm ci
npm run format:check
npm run lint
npm test
npm run build
npm audit --audit-level=high
npx playwright install chromium
npm run test:e2e
```

No Linux, use `npx playwright install --with-deps chromium`. O E2E requer Go no PATH e portas **5174 e 8082** livres. Compila seu próprio binário e usa um diretório temporário do sistema, sem reutilizar serviços existentes nem alterar dados da aplicação. Diretórios temporários residuais podem permanecer após encerramento forçado no Windows.

A CI verifica Go em Windows e Linux, race detector, frontend, E2E, auditorias e containers com reinício do backend.

## User Flow

![Fluxo de uso com criação, edição, movimentação, exclusão, erros e cancelamentos](docs/user-flow.png)

Incluí a imagem obrigatória do fluxo de uso em `docs/user-flow.png`.

## Fluxo de dados

![Fluxo de dados da interface React, passando pela API Go, até o arquivo JSON](docs/data-flow.png)

O diagrama opcional `docs/data-flow.png` mostra o caminho de cada operação: componentes → `useTasks` → `api.ts` → HTTP → `handlers.go` → `service.go` → `repository.go` → `tasks.json`. A resposta só retorna à interface depois da gravação no arquivo.

Os dois diagramas são gerados a partir das fontes Mermaid em `docs`. Para regenerá-los, execute `npm run docs:flow` em `frontend`, depois de instalar o Chromium do Playwright. Para gerar uma nova captura da interface, inicie uma instância de desenvolvimento vazia e execute `node scripts/capture.mjs` em `frontend`. O script cria cinco exemplos e remove apenas os que criou ao terminar. Use `CAPTURE_URL` e `CAPTURE_API_URL` para portas alternativas.

## Roteiro de demonstração

1. Criar e editar uma tarefa.
2. Mover por arraste e seletor, incluindo retorno a A Fazer.
3. Recarregar a página e reiniciar a API para comprovar persistência.
4. Cancelar e depois confirmar a exclusão.
5. Demonstrar entrada inválida rejeitada pela API e explicar HTTP → serviço → JSON.
6. Mostrar testes, User Flow, fluxo de dados e decisões técnicas.
