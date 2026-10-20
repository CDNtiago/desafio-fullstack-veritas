# Referência visual

Referência consultada em 20/10/2026: [Veritas Carreiras](https://carreiras.veritas.law/). Os valores abaixo foram lidos nos estilos da página e conferidos visualmente. São referências observadas no site, não um manual oficial de marca.

| Cor observada | Valor | Uso no Mini Kanban |
| --- | --- | --- |
| Azul-petróleo profundo | `#02141B` | Títulos e texto de botões dourados |
| Azul-petróleo | `#071F27` | Barra lateral e favicon |
| Dourado | `#D4AF78` | Marca textual, ação principal, progresso e detalhes |
| Azul acinzentado | `#526C76` | Textos secundários e indicadores |
| Petróleo intermediário | `#273F49` | Navegação ativa na barra lateral |
| Branco | `#FFFFFF` | Cartões e formulários |

A área de trabalho permanece clara, conforme o plano. Fundos suaves e dourado escuro `#795B2C` são adaptações para legibilidade em superfícies claras. Não se usa dourado claro como texto pequeno sobre branco. Os estados também têm rótulos: a cor não é o único indicador de status, erro ou sucesso.

As variáveis estão em `frontend/src/global.css`, com aplicação em `App.module.css`. A tipografia usa fontes do sistema; não depende de baixar fontes ou executar código do site da empresa. O monograma V é um elemento do projeto, não uma reprodução do logotipo oficial.

A captura em [quadro.png](quadro.png), o favicon e o [User Flow](user-flow.png) acompanham a paleta. Contraste e comportamento são verificados com Axe e testes de navegação; ajustes cosméticos não alteram o contrato da API nem o armazenamento.
