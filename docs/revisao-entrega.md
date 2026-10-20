# Revisão antes da entrega

Data: 20/10/2026. Fontes: as duas páginas do PDF **DESAFIO TÉCNICO - ORIENTAÇÕES**, `Desafio prático.txt` e o plano aprovado pelo candidato. O repositório permanece **privado**, conforme solicitação expressa. A revisão não equivale à submissão à empresa nem garante uma nota.

## Comparação com o PDF

| Exigência | Resultado da revisão |
| --- | --- |
| React + Go | Atendido: interface React e API Go real; nenhuma API simulada na aplicação |
| Três colunas fixas e CRUD | Atendido: criar, editar, mover e excluir; fluxo principal coberto por E2E |
| Título obrigatório, descrição opcional, status válido | Atendido: validação no Go e na interface; descrição pode ficar vazia |
| Loading/erro e consumo REST | Atendido: feedbacks, bloqueio durante envio, preservação de formulário e recuperação de falhas |
| GET, POST, PUT e DELETE em `/tasks` | Atendido: operações individuais usam `/tasks/{id}`, convenção documentada |
| Memória, com JSON opcional | Atendido: memória carregada do arquivo e gravação confirmada pelo backend; sem banco ou armazenamento do navegador |
| CORS | Atendido: origem exata, preflight e recusa de origem/cabeçalho/método indevido |
| Organização de pastas e nomes do backend | Atendido: backend, frontend, docs; main.go, handlers.go e models.go presentes |
| README com execução, decisões, limitações e melhorias | Atendido: seções específicas, comandos nativos e Docker |
| Imagem do User Flow em docs | Atendido: PNG incorporado ao README, fonte editável, erros e cancelamentos representados |
| Git com commits claros | Atendido: histórico incremental preservado, incluindo correções e documentação |
| Repositório público com nome indicado | Nome atendido; **visibilidade pública pendente**, deliberadamente adiada pelo candidato |
| Link enviado à empresa | **Pendente**: canal/prazo efetivos e submissão |

O fluxo de dados em PNG é opcional no PDF. Há diagrama de arquitetura em Mermaid; a ausência de `data-flow.png` não impede a entrega. Arraste, JSON, Docker e testes são bônus opcionais implementados.

## Comparação com o plano

| Etapa/decisão | Evidência e limite |
| --- | --- |
| Preparação e dependências | Versões fixadas, lockfile, estrutura e matriz; Go/Node/Docker verificados |
| Contrato e arquitetura | Handlers, serviço, interface Repository e implementação JSON separados por responsabilidade; um pacote Go pequeno, conforme organização do PDF |
| Backend | IDs/datas gerados no servidor, limites de entrada, erros uniformes e persistência antes da confirmação |
| Frontend | Quadro único sem login; API como fonte de verdade; operações serializadas e resposta antiga descartada |
| Interação | Tema claro com paleta da empresa, arraste e seletor, confirmação de exclusão, teclado, viewport móvel e feedbacks |
| Segurança e concorrência | Corpo de 16 KiB, tipos/campos protegidos, CORS, texto seguro, mutex, rollback após falha de escrita e testes de corrupção |
| Execução reproduzível | Nativa e Compose, volume persistente, bind local, containers sem root, CI Windows/Linux e race detector Linux |
| Documentação e auditoria | README, User Flow PNG, arquitetura, segurança, captura e evidências; submissão e republicação ainda pendentes |

JSON continua adequado ao MVP de uma instância por arquivo. Ausência de login, regravação integral, última gravação da mesma tarefa prevalecendo e limites de atomicidade no Windows estão documentados; não são funcionalidades obrigatórias faltantes. Não há limite artificial de número de tarefas.

## Correções desta revisão

1. **Corrupção UTF-8:** reproduzido um arquivo que era aceito com substituição silenciosa de caracteres. A abertura agora falha e preserva os bytes; teste de regressão incluído.
2. **Cobertura de entradas manipuladas:** adicionados casos para `updatedAt` protegido em PUT, mídia ausente e preflight com método/cabeçalho não permitido.
3. **Identidade visual:** paleta extraída do site de carreiras aplicada por variáveis CSS, com contraste verificado. Captura, favicon e User Flow atualizados.
4. **Estado da entrega:** README e matriz corrigidos para informar que o acesso privado é temporário e não satisfaz ainda a exigência de acesso público da banca.
5. **Validação por teclado:** ao enviar um formulário inválido, o foco vai para o primeiro campo com erro, com a descrição acessível associada; testes de regressão incluídos.
6. **Ambiente nativo:** a instalação Go existente foi registrada no PATH do usuário. Terminais já abertos podem precisar ser reabertos para receber a configuração.

Resultados executados e links de CI ficam em [verificacao.md](verificacao.md).

## O que ainda falta

- [ ] O candidato validar o visual e praticar o [roteiro de demonstração](../README.md#demonstração-e-entrega), explicando fluxo de dados, JSON, validações, CORS e tratamento de falhas.
- [ ] Confirmar com a empresa o formulário/canal correto e o prazo vigente; os documentos recebidos não fornecem o endereço do formulário.
- [ ] Após autorização do candidato, tornar o repositório público. Até lá, mantê-lo privado.
- [ ] Após publicar, reconferir sem login o repositório, README, PNG e clone; conferir a CI do commit escolhido e registrar seu SHA no envio.
- [ ] Enviar o link pelo canal da empresa e guardar o comprovante da submissão.

Não foi identificada funcionalidade obrigatória do MVP ainda sem implementação nesta revisão. As etapas acima são conferências finais e atos de entrega, não motivo para adicionar login, banco de dados ou novas funcionalidades ao desafio.
