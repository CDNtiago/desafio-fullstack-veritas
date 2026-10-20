# Segurança e limites

## Modelo de acesso

Aplicação local de quadro único, sem contas ou autorização. Qualquer cliente com acesso à API pode operar todas as tarefas. CORS restringe origens de navegadores; não autentica clientes HTTP. Não exponha as portas na internet sem implementar identidade, autorização e HTTPS.

O servidor nativo escuta em `127.0.0.1`. No Compose, os containers escutam internamente em todas as interfaces, mas as portas do host são publicadas exclusivamente em `127.0.0.1`. Processos usam usuários sem privilégios, filesystem raiz somente leitura e capabilities removidas; o backend pode escrever apenas no volume de dados.

## Controles implementados

- Corpo limitado a 16 KiB antes de interpretar JSON; mídia `application/json`; um objeto por requisição.
- Campos exatos, com diferenciação de maiúsculas; campos imutáveis, desconhecidos, nulos indevidos e tipos incorretos são rejeitados.
- Status por enumeração; título de 1–120 caracteres após trim; descrição até 2.000 caracteres. Contagem por pontos de código Unicode.
- IDs aleatórios gerados no servidor e timestamps controlados no Go. PUT exige os três campos editáveis.
- Texto renderizado pelo React, sem HTML do usuário, shell, SQL ou caminhos derivados do título/ID.
- CORS por origem exata; origens rejeitadas não chegam aos handlers; preflight verifica métodos e cabeçalhos.
- Timeouts e limite de cabeçalhos HTTP; respostas JSON com `nosniff` e `no-store`; erros internos sem caminhos ou stack traces.
- CSP no Nginx: scripts locais, sem avaliação dinâmica, frames bloqueados. Estilos inline são permitidos para posicionamento do arraste e progresso; conexões limitadas ao host local, em portas configuráveis.
- Logs internos não incluem o corpo das tarefas. Dados e configurações locais são ignorados pelo Git.

## Persistência

Mutações usam mutex, snapshot separado, arquivo temporário no mesmo diretório, `Sync`, fechamento e `Rename`. Só então a nova versão é publicada em memória. Nunca se remove o arquivo de destino antecipadamente. Arquivos corrompidos interrompem a inicialização, sem serem sobrescritos. A leitura verifica UTF-8 antes de decodificar: o decodificador padrão do Go substituiria bytes inválidos silenciosamente; um teste de regressão garante a recusa e a preservação exata desses bytes.

Uma instância do backend por arquivo. Sem transações distribuídas ou proteção contra dois processos gravando simultaneamente. A última atualização concluída da mesma tarefa prevalece. O arquivo é regravado integralmente, adequado a este MVP; não há limite artificial de quantidade de tarefas.

`os.Rename` não garante atomicidade em plataformas não Unix. Também não se promete durabilidade contra queda de energia. Para recuperar um arquivo corrompido: pare a API, preserve uma cópia para análise e restaure um backup válido; não altere o arquivo enquanto o serviço estiver executando.

## Testes de resistência

Os testes cobrem chamadas diretas à API com dados manipulados, origens indevidas, corpos excessivos, falhas de persistência, concorrência e conteúdo parecido com scripts. Os E2E verificam renderização literal e recuperação de falhas. Auditorias de dependências complementam esses testes; não demonstram ausência absoluta de vulnerabilidades.
