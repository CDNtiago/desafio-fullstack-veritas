# Referência visual

Usei o site [Veritas Carreiras](https://carreiras.veritas.law/) como referência visual em 20/10/2026. Li os valores abaixo nos estilos da página e conferi o resultado visualmente. São referências que observei no site, não um manual oficial de marca.

| Cor observada | Valor | Uso no Mini Kanban |
| --- | --- | --- |
| Azul-petróleo profundo | `#02141B` | Títulos e texto de botões dourados |
| Azul-petróleo | `#071F27` | Barra lateral e favicon |
| Dourado | `#D4AF78` | Marca textual, ação principal, progresso e detalhes |
| Azul acinzentado | `#526C76` | Textos secundários e indicadores |
| Petróleo intermediário | `#273F49` | Navegação ativa na barra lateral |
| Branco | `#FFFFFF` | Cartões e formulários |

Mantive a área de trabalho clara, conforme o plano, e adaptei os fundos e o dourado escuro `#795B2C` para legibilidade nessas superfícies. Evitei dourado claro em textos pequenos sobre branco. Os estados também têm rótulos: a cor não é o único indicador de status, erro ou sucesso.

As variáveis estão em `frontend/src/global.css`, com aplicação em `App.module.css`. A tipografia usa fontes do sistema; não depende de baixar fontes ou executar código do site da empresa. O monograma V é um elemento do projeto, não uma reprodução do logotipo oficial.

A captura em [quadro.png](quadro.png), o favicon e o [User Flow](user-flow.png) acompanham a paleta. Contraste e comportamento são verificados com Axe e testes de navegação; ajustes cosméticos não alteram o contrato da API nem o armazenamento.
