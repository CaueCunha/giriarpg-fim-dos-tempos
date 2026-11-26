# Giria T20 - Fim dos Tempos (Campanha) · módulo para Foundry VTT

Este é o conteúdo da campanha **Fim dos Tempos** (Tormenta20) num módulo do Foundry VTT: ameaças, poderes, itens, diários, tabelas e macros com automação. A organização segue a do módulo **Duelo de Dragões**: cada aventura tem os seus compêndios, dentro da pasta do ato, e a fonte de cada aventura (gerador, guia e artes) fica numa pasta só.

Na aba de Compêndios, tudo fica em **Giria T20 - Fim dos Tempos (Campanha)**:

| Pasta | Aventuras (uma pasta cada) | Cor |
|---|---|---|
| Ato 1 · Colinas Centrais | Av1 a Av5, Av4.5, Guloseimas do Gronko, Templo do Vácuo, Especial de Gatal, Encontros nas Colinas Centrais | ocre |
| Ato 2 · Valkaria | Av0 a Av7, Mini 1 e 2, O Labirinto Liberto, Encontros em Valkaria, Ruas de Valkaria, Lendas e Linhas Narrativas, Apêndices | azul |
| Ferramentas gerais | O Grupo (regras e Poderes de Grupo), Poderes dos PJs, Ferramentas (Puxar, Atualizar, Limpar, Combate Defensivo) | ocre escuro |

Dentro da pasta de cada aventura ficam só os compêndios dos tipos que ela tem: **Ameaças e NPCs**, **Poderes**, **Itens**, **Diários**, **Tabelas** e **Macros**. Exemplo: **Giria T20 - Fim dos Tempos (Campanha) › Ato 1 · Colinas Centrais › Av3 · Cultistas Puristas › Av3 · Ameaças e NPCs** (compêndio `a1-av3-ameacas`). Os compêndios são só do Mestre.

Quem cria e preenche essas pastas é o próprio módulo, quando o Mestre abre o mundo (o Foundry nem sempre as cria sozinho, por exemplo no The Forge). Cada compêndio é posto na pasta uma vez só: se você tirar um compêndio de lá, ele fica onde você deixou. Isso pode ser desligado em **Configurações › Giria T20 - Fim dos Tempos (Campanha) › Pasta dos compêndios**.

Para os **outros módulos** (aventuras oficiais, Armadilhas...), rode a macro **FdT · Pastas dos compêndios dos módulos** (compêndio Ferramentas gerais › Ferramentas): os compêndios soltos de cada módulo ativo vão para uma pasta com o nome dele, ou para as pastas que o próprio módulo declara. O que já está em alguma pasta não é mexido. Rode de novo depois de instalar um módulo novo.

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
- **Uma aventura inteira:** use **Puxar do compêndio**. Ele fica no botão **Fim dos Tempos**, no topo da aba de Compêndios, em **Configurações › Giria T20 - Fim dos Tempos (Campanha)** e na macro **FdT · Puxar do compêndio**. Marque as aventuras e ele cria só o que falta, nas pastas do compêndio (Ato › aventura) e com os mesmos IDs, para os links dos diários e as macros funcionarem. O que já está no mundo nunca é substituído.

As macros da campanha procuram as ameaças, as tabelas e os diários **no mundo**, pelas marcas que os geradores sempre usaram. Por isso, puxe a aventura antes de usar as macros dela. Se faltar alguma coisa, a macro avisa.

### Testes no chat: o jogador rola, o Mestre aplica

As macros seguem o padrão de testes no chat do módulo Duelo de Dragões (`scripts/testes.mjs` usa o mesmo motor):

1. **Nenhuma macro rola teste de resistência nem aplica dano, condição ou efeito sozinha.**
2. A macro manda ao chat **um card** com o dano já rolado **uma vez para todos**, como uma magia em área. A rolagem fica só no conteúdo (classe `roll--dano`), não em `rolls`, então os dados não aparecem duas vezes.
3. O card tem um botão **Rolar** por personagem. O dono clica e rola pela própria ficha, com a janela de uso e os efeitos dele. O resultado volta ao Mestre pelo socket do módulo, e a macro continua.
4. O Mestre aplica **dano, metade, condição ou efeito** por botões que só ele vê. O que a macro calcula depois do teste (PM, PV temporários, efeitos de uma cena) também vira botão, na mensagem da macro ou numa mensagem só para o Mestre.
5. O card usa as classes `tormenta20 item-card`, e os botões ficam em linha como nos poderes do sistema.

O Mestre clica no botão dos NPCs e dos PJs sem jogador. Um ↻ no card deixa rolar de novo.

Ficam de fora, de propósito: os placares de perigo (PV da horda e dos abrigos, Tempestade), testes secretos do Mestre, rolagens de NPCs contra os PJs, a manutenção das fichas (Corrigir poderes, Ajustar ao Nível, sincronizar o grupo), o gasto de PM dos próprios poderes (`spendMana`) e a automação do Temeroso.

**As macros do mundo se atualizam sozinhas** quando o Mestre abre o mundo numa versão nova, inclusive as que foram puxadas dos compêndios ou postas na barra. Se você tinha editado uma, ela é atualizada do mesmo jeito, e a sua versão fica guardada numa cópia "(sua edição)" na pasta **Fim dos Tempos · Cópias das suas edições**.

### Limpar do mundo

**Limpar do mundo** (no botão **Fim dos Tempos**, em **Configurações › Giria T20 - Fim dos Tempos (Campanha)** e na macro **FdT · Limpar do mundo**) apaga do mundo o conteúdo do módulo, para você puxar do compêndio só o que precisar. Por padrão:

- apaga itens e poderes, diários, tabelas e macros; ameaças e NPCs só se você marcar (tokens nas cenas perdem a ficha);
- **não apaga o que você editou** (o que não bate com nenhuma versão publicada), a não ser que você marque;
- mantém **Lei & Ordem** e a ficha **FdT · O Grupo**;
- antes de apagar, guarda uma cópia num compêndio do mundo por tipo (*FdT · Cópia AAAA-MM-DD · Diários*...).

Itens nas fichas dos personagens e documentos que não são do módulo nunca são tocados. As pastas do módulo que ficam vazias são removidas.

### Versões novas: atualizar só o que você quiser

Quando sai uma versão nova, o Foundry atualiza os compêndios, mas o mundo não muda. O Mestre recebe uma mensagem no chat, uma vez só, dizendo quantos documentos do mundo têm melhorias. O aviso pode ser desligado em **Configurações › Giria T20 - Fim dos Tempos (Campanha)**.

**Atualizar do compêndio** (no mesmo botão, nas configurações e na macro **FdT · Atualizar do compêndio**) lista os documentos do mundo que vieram do módulo e mudaram:

- **Sem alteração sua:** o documento é igual a alguma versão já publicada do módulo. Ele vem marcado e você desmarca o que não quiser trocar.
- **Editado por você:** o documento não bate com nenhuma versão publicada, então foi corrigido à mão. Ele aparece travado e **fica como está**. Se quiser a versão nova de um deles, arraste-a do compêndio.

Para saber isso, cada documento leva uma **assinatura** do conteúdo que pode ser corrigido (nome, imagem, dados da ficha, efeitos, itens, páginas, resultados, comando). O compêndio guarda as assinaturas de todas as versões publicadas desde a v0.1.0. O que muda sozinho na mesa não conta como edição: PV e PM atuais, efeitos ligados ou desligados, pasta, permissões, o contador de Lei & Ordem e a ficha do grupo.

A atualização troca o documento pela versão do compêndio com o **mesmo ID**, então os tokens nas cenas continuam ligados. Pasta, ordem, permissões, flags de outros módulos, **Lei & Ordem** e **FdT · O Grupo** ficam como estavam. No fim, o chat mostra o que foi atualizado e o que ficou.

**Vindo de versões anteriores:** o conteúdo que já está no mundo é reconhecido pelo ID, pela origem ou pela marca e nome (mundos dos geradores antigos), e as pastas do mundo continuam as mesmas (Ato › aventura, com os mesmos IDs). Os endereços antigos dos compêndios, por ato até a v0.16 (`ato1-ameacas`, `ato2-itens`...) e por tipo da v0.17 à v0.24 (`ameacas`, `macros`...), são redirecionados para o compêndio da aventura (`a1-av3-ameacas`...), então os links dos diários e as origens dos documentos continuam valendo. Edições feitas **dentro do compêndio do módulo** (destravado) se perdem em qualquer atualização do Foundry, porque ele troca a pasta do módulo inteira. Antes de atualizar, traga essas correções para o mundo.

### Poderes dos PJs

Depois de puxar a Campanha, selecione os tokens dos PJs e rode **PJs · Corrigir poderes**. A macro lista os poderes quebrados nas fichas (efeitos no formato antigo, chaves em branco, ataques dentro de poderes...), corrige o que estiver marcado e guarda uma cópia para desfazer. Ligue também **PJs · Automações** (Temeroso e Provocação Petulante). O diário **FdT · Poderes dos PJs** tem a revisão de cada personagem, e o guia está em [`src/aventuras/campanha/poderes-pjs/LEIA-ME.md`](src/aventuras/campanha/poderes-pjs/LEIA-ME.md).

### Ligação com o sistema

Poderes, magias, armas e ameaças que já existem nos compêndios do Tormenta20 são reaproveitados:

- As **magias** dos NPCs são a magia do sistema, com os efeitos de aprimoramento dela. Por cima vêm o custo, a CD e as rolagens da ficha do NPC, e uma nota "Nesta ficha (Fim dos Tempos)".
- **Armas e poderes** com o mesmo nome no sistema mantêm os números da ficha da aventura. Eles ganham a origem no sistema (`compendiumSource`) e um link "No sistema: …" na descrição.
- As ameaças **clonadas do livro** (Aparição, Enxame, Ogro e outras) vêm do compêndio de ameaças do sistema.

O relatório completo do que foi ligado está em [`build/relatorio.md`](build/relatorio.md).

O que é próprio da campanha foi criado com efeitos e macros de automação: Poderes de Grupo, Lei & Ordem, Máquina de Purificação, Bombardeio, Oficina de Gatal, tributos do Templo e o resto.

O guia de cada aventura fica junto do gerador dela, em `src/aventuras/<ato>/<aventura>/LEIA-ME.md` (veja [Desenvolvimento](#desenvolvimento)).

### Artes

Retratos e tokens feitos para a campanha ficam em [`assets/`](assets), separados por aventura (por enquanto: Lefou Adolescente, Cultistas Puristas Devem Morrer e O Terror que Veio do Céu). Os geradores apontam para eles (`modules/giriarpg-fim-dos-tempos/assets/...`), e os NPCs sem ficha no livro ganham um ator de apoio só com a arte (ou uma página de imagem no diário), prontas para **Mostrar aos Jogadores**.

Toda ameaça e NPC já vem com o token configurado: nome visível ao passar o mouse (qualquer um), visão ligada, barras sempre visíveis ao dono, com PV embaixo (vermelho→verde) e PM em cima (azul), já nas barras do **Bar Brawl**. O padrão é uma constante só (`TOKEN_PADRAO` em `scripts/assinatura.mjs`): o build aplica em todo ator `npc`, e o módulo reaplica ao criar a ameaça ou o token no mundo, vencendo o padrão do mundo e o do Bar Brawl. Ao abrir o mundo, o Mestre corrige as ameaças do módulo que já estão nele e os tokens delas nas cenas (arte, nome e tamanho ficam; nada passa a contar como editado). Para desligar a correção, desmarque **Token padrão nas ameaças** nas configurações do módulo.

### Mapas e cenas

Os mapas de batalha também ficam em `assets/`, na pasta `mapas` de cada aventura. Por enquanto existem os da Av3 (Cultistas Puristas: Carvalho Oco, Salão Comunal, subsolo do salão, Taverna Chifre de Bode e a aldeia de Dornbach de dia e na noite do ritual) e os da Av4 (O Terror que Veio do Céu: chegada às Fazendas Gallobalt, casarão, plantação de achbuld, convés e ponte de comando da Harpia). Depois de puxar o Ato 1, rode **Av3 · Montar cenas dos mapas** ou **Av4 · Montar cenas dos mapas**. Cada macro cria uma cena para cada mapa da sua aventura, com:

- grid de 1,5 m (o convés da Harpia usa quadrados de 50 px, o dobro de quadrados sobre a mesma imagem);
- paredes, janelas, cortinas de musgo, muretas (amurada da Harpia, cercas dos galpões) e portas (as grades das celas da Av3 começam trancadas);
- luzes de lareiras, fogueiras, lampiões e velas;
- notas do Mestre ligadas ao diário da aventura (na Av3: alçapões, retrato, poções de Sono, celas e quartos; na Av4: quartos da família, faixas queimadas, Canhão de Fogo, regras a bordo, timão).

As paredes foram traçadas à mão sobre as imagens, então confira no editor de paredes antes da sessão. Rodar a macro de novo pergunta se deve recriar as cenas ou só criar as que faltam, nunca duplica e não mexe nas cenas da outra aventura.

## Testes

```bash
npm ci
npm run setup   # baixa o código do sistema Tormenta20 1.6.4 (modelos de dados e compêndios)
npm test
```

Os testes rodam num **Foundry v14 simulado**, sem servidor (veja [`tools/sim/README.md`](tools/sim/README.md)). A simulação usa os modelos de dados reais do Tormenta20, então cada documento é validado e limpo como o Foundry faria. Um campo que o Foundry descartaria em silêncio faz o teste falhar. Os testes cobrem:

- **Macros (135):** todas são executadas numa cena da aventura, em combate, com um PJ selecionado e um NPC como alvo. Cada uma roda com os valores padrão, com cada opção do primeiro menu do diálogo e com 6 rodadas de escolhas sorteadas. Depois de cada execução o combate avança turnos e um PJ sofre dano, para disparar os ganchos das automações. Falham exceções, `console.error`, documentos inválidos, campos descartados, links quebrados e rolagens não avaliadas.
- **Testes no chat:** o card (classes, `roll--dano` fora de `rolls`, um botão por personagem), o resultado pelo socket, os botões do Mestre aplicando uma vez só, nada aplicado antes do clique, nada repetido no chat e a atualização das macros com a cópia das editadas. Nas macros, cada "jogador" clica no botão do seu card.
- **Cenas:** as macros dos mapas criam as seis cenas da Av3 e as cinco da Av4 com imagem do módulo, grid de 1,5 m, paredes, luzes e notas dentro da cena; rodar de novo não duplica nem mexe nas cenas da outra aventura.
- **Geradores:** cada ato roda limpo num mundo vazio, e rodar de novo substitui em vez de duplicar. Cada aventura tem a sua pasta em `src/aventuras`, com o gerador.
- **Poderes dos PJs:** um PJ com os defeitos achados nas fichas da campanha passa por "PJs · Corrigir poderes"; o teste confere cada correção, que uma segunda passada não acha nada e que "Desfazer" devolve a ficha.
- **Compêndios:**
  - um compêndio por aventura e tipo, nas pastas Ato › aventura (como no Duelo de Dragões);
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
  - o botão da aba de Compêndios puxa só a aventura marcada, nas pastas Ato › aventura;
  - mundos das versões antigas (compêndios por ato ou por tipo) continuam ligados: nada a atualizar, nada duplicado, as mesmas pastas e os links antigos redirecionados;
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

Como nas revistas do Duelo de Dragões, cada aventura tem a sua pasta de fonte:

```
src/aventuras/
  ato1-colinas-centrais/
    av3-cultistas-puristas/
      gerador.js      o gerador (a mesma macro-gerador da campanha): a fonte do conteúdo
      LEIA-ME.md      o guia da aventura no Foundry
    ...
  ato2-valkaria/
    av3-rocha-cinzenta/ ...
  campanha/
    grupo/  poderes-pjs/  ferramentas/
assets/<arco>/<aventura>/    retratos e tokens (webp) e, em mapas/, os mapas de batalha
src/packs/<compêndio>/       fontes JSON dos compêndios, geradas pelo build (uma por aventura e tipo)
```

A lista das aventuras, com a pasta, a sigla dos compêndios (`a1-av3-...`), o nome na aba de Compêndios e a pasta das artes, fica em [`tools/conteudo.mjs`](tools/conteudo.mjs).

### Arquivos do módulo

- `module.json`: os compêndios, as pastas da aba de Compêndios e, em `flags`, as pastas que o Puxar cria no mundo.
- `scripts/main.mjs`: ganchos, configurações e a API (`game.modules.get("giriarpg-fim-dos-tempos").api`).
- `scripts/constantes.mjs`: constantes e ajudantes comuns.
- `scripts/importador.mjs`: catálogo dos compêndios, Puxar, Atualizar, Limpar e os endereços antigos.
- `scripts/tokens.mjs`: token padrão das ameaças.
- `scripts/macros.mjs`: atualização única das macros do mundo.
- `scripts/testes.mjs`: testes no chat (o jogador rola, o Mestre aplica).
- `scripts/assinatura.mjs`: assinatura dos documentos e `TOKEN_PADRAO` (também usados pelo build).
- `packs/`: os compêndios compilados (LevelDB), gerados na release.
- `assets/`: artes e mapas.

### Comandos

| Comando | O que faz |
|---|---|
| `npm run build` | Roda os geradores no Foundry simulado, liga o conteúdo ao sistema e fixa IDs estáveis. Grava as fontes JSON em `src/packs/` (um compêndio por aventura e tipo), o `module.json` e `build/relatorio.md`, e compila os compêndios em `packs/`. |
| `npm run pack` | Só compila `src/packs/` em `packs/` (LevelDB). |
| `node tools/historico.mjs` | Recalcula `src/historico.json` (as assinaturas de cada documento em todas as versões commitadas). O build acrescenta a assinatura atual sozinho; só é preciso rodar isto se a função de `scripts/assinatura.mjs` mudar. |
| `npm run pack -- --extrair` | Extrai `packs/` para `build/extraido/`, para conferência. |

Para incluir uma aventura nova:

1. Crie `src/aventuras/<ato>/<aventura>/gerador.js` e o `LEIA-ME.md` dela. As artes vão em `assets/<arco>/<aventura>/` (mapas em `mapas/`).
2. Acrescente a linha dela no ato certo em [`tools/conteudo.mjs`](tools/conteudo.mjs) (id, pasta, sigla, nome e artes).
3. Rode `npm run build` e `npm test`.

Todas as aventuras, mini-aventuras e masmorras dos dois atos já têm gerador, assim como a Tabela de Encontros, As Ruas Traiçoeiras de Valkaria (notáveis e Guarda), as Lendas Urbanas, as Linhas Narrativas e os Apêndices (negócios e distinções). Todos os capítulos gerais do Ato 2 estão no módulo.

### Versões

Para lançar uma versão, suba o `version` no `package.json`, rode `npm run build` (que atualiza o `module.json`) e faça merge na `main`. Aí o GitHub Actions compila os compêndios e publica a release `vX.Y.Z` com o `module.json` e o `module.zip`. O link do manifesto passa a apontar para ela.
