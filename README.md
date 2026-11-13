# Fim dos Tempos · módulo para Foundry VTT

Este é o conteúdo da campanha **Fim dos Tempos** (Tormenta20) num módulo do Foundry VTT: ameaças, poderes, itens, diários, tabelas e macros com automação. Os compêndios ficam na pasta **Fim dos Tempos** da aba de Compêndios, um por tipo, com uma pasta por ato e as pastas das aventuras dentro:

| Compêndio | Ato 1 · Colinas Centrais | Ato 2 · Valkaria | Campanha |
|---|---|---|---|
| **Ameaças e NPCs**, **Poderes**, **Itens**, **Diários**, **Tabelas**, **Macros** | Av1 a Av5, Templo do Vácuo, Especial de Gatal, encontros das Colinas | Av0 a Av7, Mini 1 e 2, O Labirinto Liberto, Encontros, Ruas Traiçoeiras, Lendas Urbanas, Apêndices | regras de grupo, Poderes de Grupo, revisão dos poderes dos PJs, utilidades |

A contagem de cada compêndio está em [`build/relatorio.md`](build/relatorio.md).

Requisitos: **Foundry VTT v14** e o sistema **Tormenta20** (Vizael) **1.6.x**.

## Instalação

### Pelo link do manifesto (recomendado)

1. No Foundry, vá em **Configuração › Módulos Adicionais › Instalar Módulo**.
2. Em **URL do Manifesto**, cole o link abaixo e clique em **Instalar**:

   ```
   https://github.com/CaueCunha/giriarpg-fim-dos-tempos/releases/latest/download/module.json
   ```

3. Entre no mundo da campanha e ative o módulo em **Configurações do Jogo › Gerenciar Módulos**.

Quando sair uma versão nova, o botão **Atualizar** do Foundry baixa a nova versão.

### Instalação manual

Baixe o `module.zip` da [última versão](https://github.com/CaueCunha/giriarpg-fim-dos-tempos/releases/latest). Descompacte-o em `Data/modules/giriarpg-fim-dos-tempos/`, de modo que o `module.json` fique direto nessa pasta, e reinicie o Foundry.

## Usando na mesa

**Nada vai para o mundo sozinho.** O módulo só oferece os compêndios, e você escolhe o que entra no mundo:

- **Um documento:** arraste-o do compêndio para a barra lateral (ou para a cena, no caso de ameaças).
- **Uma aventura inteira:** use **Puxar do compêndio**. Ele fica no botão **Fim dos Tempos**, no topo da aba de Compêndios, em **Configurações › Fim dos Tempos** e na macro **FdT · Puxar do compêndio**. Marque as aventuras e ele cria só o que falta, nas pastas do compêndio (Ato › aventura) e com os mesmos IDs, para os links dos diários e as macros funcionarem. O que já está no mundo nunca é substituído.

As macros da campanha procuram as ameaças, as tabelas e os diários **no mundo**, pelas marcas que os geradores sempre usaram. Por isso, puxe a aventura antes de usar as macros dela. Se faltar alguma coisa, a macro avisa.

### Limpar do mundo

**Limpar do mundo** (no botão **Fim dos Tempos**, em **Configurações › Fim dos Tempos** e na macro **FdT · Limpar do mundo**) apaga do mundo o conteúdo do módulo, para você puxar do compêndio só o que precisar. Por padrão:

- apaga itens e poderes, diários, tabelas e macros; ameaças e NPCs só se você marcar (tokens nas cenas perdem a ficha);
- **não apaga o que você editou** (o que não bate com nenhuma versão publicada), a não ser que você marque;
- mantém **Lei & Ordem** e a ficha **FdT · O Grupo**;
- antes de apagar, guarda uma cópia num compêndio do mundo por tipo (*FdT · Cópia AAAA-MM-DD · Diários*...).

Itens nas fichas dos personagens e documentos que não são do módulo nunca são tocados. As pastas do módulo que ficam vazias são removidas.

### Versões novas: atualizar só o que você quiser

Quando sai uma versão nova, o Foundry atualiza os compêndios, mas o mundo não muda. O Mestre recebe uma mensagem no chat, uma vez só, dizendo quantos documentos do mundo têm melhorias. O aviso pode ser desligado em **Configurações › Fim dos Tempos**.

**Atualizar do compêndio** (no mesmo botão, nas configurações e na macro **FdT · Atualizar do compêndio**) lista os documentos do mundo que vieram do módulo e mudaram:

- **Sem alteração sua:** o documento é igual a alguma versão já publicada do módulo. Ele vem marcado e você desmarca o que não quiser trocar.
- **Editado por você:** o documento não bate com nenhuma versão publicada, então foi corrigido à mão. Ele aparece travado e **fica como está**. Se quiser a versão nova de um deles, arraste-a do compêndio.

Para saber isso, cada documento leva uma **assinatura** do conteúdo que pode ser corrigido (nome, imagem, dados da ficha, efeitos, itens, páginas, resultados, comando). O compêndio guarda as assinaturas de todas as versões publicadas desde a v0.1.0. O que muda sozinho na mesa não conta como edição: PV e PM atuais, efeitos ligados ou desligados, pasta, permissões, o contador de Lei & Ordem e a ficha do grupo.

A atualização troca o documento pela versão do compêndio com o **mesmo ID**, então os tokens nas cenas continuam ligados. Pasta, ordem, permissões, flags de outros módulos, **Lei & Ordem** e **FdT · O Grupo** ficam como estavam. No fim, o chat mostra o que foi atualizado e o que ficou.

**Vindo da v0.16 ou anterior:** o conteúdo que o importador antigo trouxe para o mundo é reconhecido pelo ID, pela origem ou pela marca e nome (mundos dos geradores antigos). Os endereços antigos dos compêndios (`ato1-ameacas`, `ato2-itens`...) são redirecionados para os novos. Edições feitas **dentro do compêndio do módulo** (destravado) se perdem em qualquer atualização do Foundry, porque ele troca a pasta do módulo inteira. Antes de atualizar, traga essas correções para o mundo.

### Poderes dos PJs

Depois de puxar a Campanha, selecione os tokens dos PJs e rode **PJs · Corrigir poderes**. A macro lista os poderes quebrados nas fichas (efeitos no formato antigo, chaves em branco, ataques dentro de poderes...), corrige o que estiver marcado e guarda uma cópia para desfazer. Ligue também **PJs · Automações** (Temeroso e Provocação Petulante). O diário **FdT · Poderes dos PJs** tem a revisão de cada personagem, e o guia está em [`docs/geradores/fdt-poderes-pjs.md`](docs/geradores/fdt-poderes-pjs.md).

### Ligação com o sistema

Poderes, magias, armas e ameaças que já existem nos compêndios do Tormenta20 são reaproveitados:

- As **magias** dos NPCs são a magia do sistema, com os efeitos de aprimoramento dela. Por cima vêm o custo, a CD e as rolagens da ficha do NPC, e uma nota "Nesta ficha (Fim dos Tempos)".
- **Armas e poderes** com o mesmo nome no sistema mantêm os números da ficha da aventura. Eles ganham a origem no sistema (`compendiumSource`) e um link "No sistema: …" na descrição.
- As ameaças **clonadas do livro** (Aparição, Enxame, Ogro e outras) vêm do compêndio de ameaças do sistema.

O relatório completo do que foi ligado está em [`build/relatorio.md`](build/relatorio.md).

O que é próprio da campanha foi criado com efeitos e macros de automação: Poderes de Grupo, Lei & Ordem, Máquina de Purificação, Bombardeio, Oficina de Gatal, tributos do Templo e o resto.

Os guias de cada aventura estão em [`docs/geradores/`](docs/geradores).

### Artes

Retratos e tokens feitos para a campanha ficam em [`assets/`](assets), separados por aventura (por enquanto: Lefou Adolescente, Cultistas Puristas Devem Morrer e O Terror que Veio do Céu). Os geradores apontam para eles (`modules/giriarpg-fim-dos-tempos/assets/...`), e os NPCs sem ficha no livro ganham um ator de apoio só com a arte (ou uma página de imagem no diário), prontas para **Mostrar aos Jogadores**.

Toda ameaça e NPC já vem com o token configurado: nome visível ao passar o mouse (qualquer um), visão ligada, barras sempre visíveis ao dono, com PV embaixo (vermelho→verde) e PM em cima (azul), já nas barras do **Bar Brawl**. O padrão é uma constante só (`TOKEN_PADRAO` em `scripts/assinatura.mjs`): o build aplica em todo ator `npc`, e o módulo reaplica ao criar a ameaça ou o token no mundo, vencendo o padrão do mundo e o do Bar Brawl. Ao abrir o mundo, o Mestre corrige as ameaças do módulo que já estão nele e os tokens delas nas cenas (arte, nome e tamanho ficam; nada passa a contar como editado). Para desligar a correção, desmarque **Token padrão nas ameaças** nas configurações do módulo.

## Testes

```bash
npm ci
npm run setup   # baixa o código do sistema Tormenta20 1.6.4 (modelos de dados e compêndios)
npm test
```

Os testes rodam num **Foundry v14 simulado**, sem servidor (veja [`tools/sim/README.md`](tools/sim/README.md)). A simulação usa os modelos de dados reais do Tormenta20, então cada documento é validado e limpo como o Foundry faria. Um campo que o Foundry descartaria em silêncio faz o teste falhar. Os testes cobrem:

- **Macros (135):** todas são executadas numa cena da aventura, em combate, com um PJ selecionado e um NPC como alvo. Cada uma roda com os valores padrão, com cada opção do primeiro menu do diálogo e com 6 rodadas de escolhas sorteadas. Depois de cada execução o combate avança turnos e um PJ sofre dano, para disparar os ganchos das automações. Falham exceções, `console.error`, documentos inválidos, campos descartados, links quebrados e rolagens não avaliadas.
- **Geradores:** cada ato roda limpo num mundo vazio, e rodar de novo substitui em vez de duplicar.
- **Poderes dos PJs:** um PJ com os defeitos achados nas fichas da campanha passa por "PJs · Corrigir poderes"; o teste confere cada correção, que uma segunda passada não acha nada e que "Desfazer" devolve a ficha.
- **Compêndios:**
  - formato do `foundryvtt-cli` e IDs únicos;
  - validação de todos os documentos;
  - chaves de efeitos (cada uma existe na ficha ou é usada pelo próprio sistema);
  - imagens do sistema;
  - links `@UUID` e resultados de tabela;
  - compilação de todas as macros;
  - sorteio de todas as tabelas.
- **Pacote:** os compêndios são compilados em LevelDB e extraídos de volta, e o resultado é comparado com as fontes.
- **Puxar e atualizar:**
  - abrir o mundo não importa nada;
  - o botão da aba de Compêndios puxa só a aventura marcada, nas pastas do compêndio;
  - puxar de novo só cria o que falta;
  - links do compêndio funcionam no compêndio e viram links do mundo ao puxar;
  - o que foi puxado é igual ao compêndio;
  - a atualização troca só o marcado e não editado, e preserva Lei & Ordem, grupo, pasta e tokens;
  - cancelar não muda nada;
  - jogador não puxa nem atualiza;
  - o aviso de versão nova aparece uma vez e não muda nada;
  - limpar do mundo apaga só o não editado, guarda cópia, mantém atores, Lei & Ordem, grupo e fichas dos PJs, e apaga as pastas vazias.

**Limite importante:** é uma simulação, não o Foundry de verdade. A interface (fichas, canvas, animações, arrastar e soltar) não é testada. Antes de usar na sessão, vale abrir o mundo uma vez, puxar uma aventura e rodar algumas macros.

## Desenvolvimento

O conteúdo nasce dos **geradores** em [`src/geradores/`](src/geradores), as mesmas macros-gerador da campanha.

| Comando | O que faz |
|---|---|
| `npm run build` | Roda os geradores no Foundry simulado, liga o conteúdo ao sistema e fixa IDs estáveis. Grava as fontes JSON em `src/packs/`, o `module.json` e `build/relatorio.md`, e compila os compêndios em `packs/`. |
| `npm run pack` | Só compila `src/packs/` em `packs/` (LevelDB). |
| `node tools/historico.mjs` | Recalcula `src/historico.json` (as assinaturas de cada documento em todas as versões commitadas). O build acrescenta a assinatura atual sozinho; só é preciso rodar isto se a função de `scripts/assinatura.mjs` mudar. |
| `npm run pack -- --extrair` | Extrai `packs/` para `build/extraido/`, para conferência. |

Para incluir uma aventura nova:

1. Ponha o gerador em `src/geradores/`.
2. Acrescente o nome dele no ato certo em [`tools/conteudo.mjs`](tools/conteudo.mjs).
3. Rode `npm run build` e `npm test`.

Todas as aventuras, mini-aventuras e masmorras dos dois atos já têm gerador, assim como a Tabela de Encontros, As Ruas Traiçoeiras de Valkaria (notáveis e Guarda), as Lendas Urbanas, as Linhas Narrativas e os Apêndices (negócios e distinções). Todos os capítulos gerais do Ato 2 estão no módulo.

### Versões

Para lançar uma versão, suba o `version` no `package.json`, rode `npm run build` (que atualiza o `module.json`) e faça merge na `main`. Aí o GitHub Actions compila os compêndios e publica a release `vX.Y.Z` com o `module.json` e o `module.zip`. O link do manifesto passa a apontar para ela.
