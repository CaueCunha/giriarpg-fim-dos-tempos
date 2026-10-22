# Fim dos Tempos · módulo para Foundry VTT

Este é o conteúdo da campanha **Fim dos Tempos** (Tormenta20) num módulo do Foundry VTT: ameaças, itens, diários, tabelas e macros com automação. Cada ato tem seus próprios compêndios.

| Compêndios | Ameaças e NPCs | Itens | Diários | Tabelas | Macros |
|---|---:|---:|---:|---:|---:|
| **Ato 1 · Colinas Centrais** (Av1 a Av5, Templo do Vácuo, Especial de Gatal, encontros das Colinas) | 139 | 90 | 9 | 15 | 49 |
| **Ato 2 · Valkaria** (Av0 Valkaria, Av1 Stremtol, Av2 Conexão Vectora, Av3 Fuga da Rocha Cinzenta, Av4 Massacre na Taverna dos Maníacos, Av5 Túneis Famintos, Av6 Baile de Debutantes Sangrento, Av7 O Ataque do Mecano-Lagarto-Terror, Mini 1 Ruas de Cobiça, Mini 2 Irmandade Máxima, O Labirinto Liberto, Encontros em Valkaria, As Ruas Traiçoeiras de Valkaria, Lendas Urbanas e Linhas Narrativas) | 167 | 133 | 15 | 28 | 74 |
| **Campanha** (regras de grupo, Poderes de Grupo, utilidades) | | 23 | 1 | | 7 |

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

As macros da campanha procuram as ameaças, as tabelas e os diários **no mundo**, pelas marcas que os geradores sempre usaram. Por isso o conteúdo precisa ser importado dos compêndios para o mundo.

- Na primeira vez que o Mestre abre o mundo com o módulo ativo, aparece a janela **Fim dos Tempos: importar para o mundo**. Marque os atos que quiser e clique em **Importar**.
- Para importar depois, há três caminhos:
  - o botão **Fim dos Tempos: importar**, no topo da aba de Compêndios;
  - a opção em **Configurações › Fim dos Tempos**;
  - a macro **FdT · Importar conteúdo do módulo**, no compêndio Campanha.
- O conteúdo vai para as mesmas pastas que os geradores criavam.

Se o mundo já tem o conteúdo (de uma importação anterior ou dos geradores antigos), o importador pergunta o que fazer:

- **Substituir** apaga e recria os documentos com a versão do módulo. Os IDs não mudam, então os tokens já colocados nas cenas continuam ligados aos seus atores. O contador de **Lei & Ordem** de Valkaria e a ficha **FdT · O Grupo** são mantidos. Edições feitas à mão nos documentos importados se perdem.
- **Só o que falta** cria apenas o que não está no mundo e não mexe no resto.

Quando sai uma versão nova do módulo, o Mestre vê a oferta de importação uma vez. Ela pode ser desligada em **Configurações › Fim dos Tempos**.

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

## Testes

```bash
npm ci
npm run setup   # baixa o código do sistema Tormenta20 1.6.4 (modelos de dados e compêndios)
npm test
```

Os testes rodam num **Foundry v14 simulado**, sem servidor (veja [`tools/sim/README.md`](tools/sim/README.md)). A simulação usa os modelos de dados reais do Tormenta20, então cada documento é validado e limpo como o Foundry faria. Um campo que o Foundry descartaria em silêncio faz o teste falhar. Os testes cobrem:

- **Macros (129):** todas são executadas numa cena da aventura, em combate, com um PJ selecionado e um NPC como alvo. Cada uma roda com os valores padrão, com cada opção do primeiro menu do diálogo e com 6 rodadas de escolhas sorteadas. Depois de cada execução o combate avança turnos e um PJ sofre dano, para disparar os ganchos das automações. Falham exceções, `console.error`, documentos inválidos, campos descartados, links quebrados e rolagens não avaliadas.
- **Geradores:** cada ato roda limpo num mundo vazio, e rodar de novo substitui em vez de duplicar.
- **Compêndios:**
  - formato do `foundryvtt-cli` e IDs únicos;
  - validação de todos os documentos;
  - chaves de efeitos (cada uma existe na ficha ou é usada pelo próprio sistema);
  - imagens do sistema;
  - links `@UUID` e resultados de tabela;
  - compilação de todas as macros;
  - sorteio de todas as tabelas.
- **Pacote:** os compêndios são compilados em LevelDB e extraídos de volta, e o resultado é comparado com as fontes.
- **Importador:**
  - oferta ao abrir o mundo;
  - botão na aba de Compêndios;
  - jogador sem permissão;
  - Substituir com IDs, Lei & Ordem, ficha do grupo e tokens preservados;
  - Só o que falta;
  - Cancelar;
  - atos independentes.

**Limite importante:** é uma simulação, não o Foundry de verdade. A interface (fichas, canvas, animações, arrastar e soltar) não é testada. Antes de usar na sessão, vale abrir o mundo uma vez, importar e rodar algumas macros.

## Desenvolvimento

O conteúdo nasce dos **geradores** em [`src/geradores/`](src/geradores), as mesmas macros-gerador da campanha.

| Comando | O que faz |
|---|---|
| `npm run build` | Roda os geradores no Foundry simulado, liga o conteúdo ao sistema e fixa IDs estáveis. Grava as fontes JSON em `src/packs/`, o `module.json` e `build/relatorio.md`, e compila os compêndios em `packs/`. |
| `npm run pack` | Só compila `src/packs/` em `packs/` (LevelDB). |
| `npm run pack -- --extrair` | Extrai `packs/` para `build/extraido/`, para conferência. |

Para incluir uma aventura nova:

1. Ponha o gerador em `src/geradores/`.
2. Acrescente o nome dele no ato certo em [`tools/conteudo.mjs`](tools/conteudo.mjs).
3. Rode `npm run build` e `npm test`.

Todas as aventuras, mini-aventuras e masmorras dos dois atos já têm gerador, assim como a Tabela de Encontros, As Ruas Traiçoeiras de Valkaria (notáveis e Guarda), as Lendas Urbanas e as Linhas Narrativas. Dos capítulos gerais do Ato 2, ainda faltam os Apêndices.

### Versões

Para lançar uma versão, suba o `version` no `package.json`, rode `npm run build` (que atualiza o `module.json`) e faça merge na `main`. Aí o GitHub Actions compila os compêndios e publica a release `vX.Y.Z` com o `module.json` e o `module.zip`. O link do manifesto passa a apontar para ela.
