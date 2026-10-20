# Revisão antes da entrega

Em 20/10/2026, revisei o projeto com base nas duas páginas do PDF **DESAFIO TÉCNICO - ORIENTAÇÕES**, no `Desafio prático.txt` e no plano de implementação. Mantenho o repositório **privado** enquanto concluo a revisão. Ainda não enviei o projeto à empresa.

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
| Repositório público com nome indicado | Nome atendido; **visibilidade pública pendente** até concluir a revisão |
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

1. **Corrupção UTF-8:** reproduzi a aceitação de um arquivo com substituição silenciosa de caracteres e corrigi a leitura. A abertura agora falha e preserva os bytes; incluí um teste de regressão.
2. **Cobertura de entradas manipuladas:** adicionei casos para `updatedAt` protegido em PUT, mídia ausente e preflight com método/cabeçalho não permitido.
3. **Identidade visual:** apliquei a paleta observada no site de carreiras por variáveis CSS e conferi o contraste. Atualizei a captura, o favicon e o User Flow.
4. **Estado da entrega:** registrei no README e na matriz que mantenho o acesso privado durante a revisão e que preciso torná-lo público antes da avaliação.
5. **Validação por teclado:** ajustei o foco para o primeiro campo com erro ao enviar um formulário inválido, com a descrição acessível associada, e acrescentei testes de regressão.
6. **Ambiente nativo:** registrei a instalação Go no PATH da minha conta no Windows. Terminais já abertos podem precisar ser reabertos para receber a configuração.
7. **Manutenção da CI:** a execução passou, mas apontou Actions com runtime Node 20 obsoleto. Atualizei para versões oficiais com Node 24, fixadas por SHA. Defini os ambientes como `ubuntu-24.04` e `windows-2025` para evitar mudanças de versão principal por aliases `latest`.

Resultados executados e links de CI ficam em [verificacao.md](verificacao.md).

## O que ainda falta

- [ ] Conferir o visual e praticar o [roteiro de demonstração](../README.md#demonstração-e-entrega), explicando fluxo de dados, JSON, validações, CORS e tratamento de falhas.
- [ ] Confirmar com a empresa o formulário/canal correto e o prazo vigente; os documentos recebidos não fornecem o endereço do formulário.
- [ ] Tornar o repositório público quando concluir a revisão. Até lá, mantê-lo privado.
- [ ] Após publicar, reconferir sem login o repositório, README, PNG e clone; conferir a CI do commit escolhido e registrar seu SHA no envio.
- [ ] Enviar o link pelo canal da empresa e guardar o comprovante da submissão.

Nesta revisão, não identifiquei funcionalidades obrigatórias do MVP sem implementação. Ainda preciso concluir as conferências e o envio listados acima. Vou manter o escopo definido, sem acrescentar login, banco de dados ou novas funcionalidades nesta etapa.
