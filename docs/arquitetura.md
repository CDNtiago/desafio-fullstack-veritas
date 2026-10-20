# Arquitetura

```mermaid
flowchart LR
  UI[Componentes React] --> H[Hook de tarefas]
  H --> API[Cliente HTTP]
  API --> HTTP[Handlers Go]
  HTTP --> S[Serviço de tarefas]
  S --> R[Interface Repository]
  J[Repositório JSON] -. implementa .-> R
  J --> F[Arquivo local]
```

O serviço contém validações e geração de identificadores/datas, sem conhecer HTTP ou arquivos. O repositório implementa leitura e mutações serializadas. O transporte traduz erros e valida o formato das requisições. A composição das dependências fica na inicialização.

O backend usa um pacote Go pequeno, com `main.go`, `handlers.go` e `models.go` conforme a estrutura apresentada nas orientações. `service.go` contém o serviço e a interface de persistência; `repository.go` implementa JSON. A separação é por arquivos e tipos, sem wrappers ou camadas vazias. Modelo e serviço não importam HTTP nem operações de arquivo. O comando de execução é `go run .` dentro de `backend`.

No frontend, componentes apresentam dados e coletam intenções; o hook coordena requisições e operações pendentes; o cliente HTTP define o contrato. O backend é a fonte de verdade.

Um processo por arquivo JSON. Edições concorrentes da mesma tarefa adotam a última gravação bem-sucedida. Não há usuários, autorização, banco de dados ou sincronização em tempo real.
