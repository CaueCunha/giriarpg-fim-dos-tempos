# Arco 2 · Aventura 4 · Massacre na Taverna dos Maníacos

Arquivo: `a2-av4-taverna-maniacos.js` (Foundry v14, Tormenta20 1.6.x). No módulo, o conteúdo vem nos compêndios do Ato 2. Como macro avulsa: crie uma macro do tipo Script como Mestre, cole o arquivo inteiro e execute. Rodar de novo apaga e recria só o que tem a marca `a2av4`.

## O que é criado

**Ameaças:**
- As manifestações dos internos da Casa de Repouso, de *Ameaças de Arton*:
  - Carrasco de Lena, o tormento de Rylonn (ND 6);
  - Cocatriz-Real, o tormento de Bdun (ND 7);
  - Quimera, o tormento de Grisgemm (ND 8, com as cabeças clássicas de bode, leão e dragão).
- Os três são Grandes (token 2×2) e cada um tem o poder **Apaziguar** com a CD e as perícias do livro.
- A Bicada Petrificante (lento, depois petrificado) e a Marrada do bode (caído) têm botões de condição no card.
- O Açoite Circular e o Sopro de Fogo rolam o dano.
- O **Imagoduto** tem 500 PV e RD 20.

**Apoio (sem ficha no livro):** Click, Drasala, Calliko, Dorothea Millicent, Ellanie Millicent, Emblyn, Blanto e Coltrack.

**Itens:**
- As oito bebidas anãs da Terceira Opção, como consumíveis. Cada uma tem o efeito do benefício (redução de fogo ou frio, +1 For com –3m, +2 em Fortitude, Reflexos, Misticismo ou Vontade, e +1d6 marcado na rolagem).
- A Partitura de Calliko e a Lousa da Terceira Opção.
- Provas: a Peça do Imagoduto e o Depoimento de Dorothea.

**Tabelas:** Efeitos de Loucura (1d12), Surtos dos Internos (1d4) e Bebidas Anãs da Terceira Opção (1d8).

**Diário (8 páginas):**
- Guia do Mestre;
- a Terceira Opção (Click, Drasala, outras tavernas, bebidas);
- bandas e clientes;
- a Briga de Taverna;
- o Show na Terceira Opção;
- a Traficante de Partituras (Dorothea);
- a Casa de Repouso e a Batalha Insana;
- desfecho, provas e pagamento.

**Macros**
- **Av4 · Briga de Taverna** (perigo complexo ND 7):
  - "Começar a rodada" aplica o dano automático nos selecionados: 2d6 de impacto, depois 3d6, depois 5d6 a partir da 5ª rodada.
  - Também rola a Vontade CD 20 de cada um e mostra a escalada de cada falha. Criaturas não vivas (osteon, golem, construto) não testam.
  - As ações acumulam Deixa Disso (15) e Boa Ideia (10, cada sucesso tira um do Deixa Disso).
  - Canção de Ninar e Me Segura! dispensam a Vontade.
  - Cidadão de Bem e Na Amizade (ataque contra a Defesa do aliado mirado) poupam do dano seguinte.
  - Escolha Alguém do Seu Tamanho e Dá na Minha Cara somam os danos no protetor.
- **Av4 · Show na Terceira Opção:**
  - Teste estendido de Atuação CD 20, 5 sucessos.
  - Perícia alternativa sem justificativa soma +2 na CD.
  - Cada falha tira 2d8 PM de todos os selecionados. Quem chega a 0 congela, sai do show e a CD sobe +5.
  - O último teste é do frontman, e a margem dele dá os resultados acumulados.
- **Av4 · Beber na Terceira Opção:**
  - Fortitude contra a CD da bebida, com +5 por dose no dia (contada no ator).
  - Aplica o benefício por 1 dia e a escalada embriagado → bebum (desprevenido) → inconsciente.
  - "Fim do dia" limpa tudo.
- **Av4 · Batalha Insana:**
  - Rola os Efeitos de Loucura no início da rodada.
  - Rola a Vontade de quem caiu no Rio de Som.
  - Faz o teste de apaziguar cada interno (com bônus de ajuda) e conta os 5 sucessos.
  - Falhando por 5 ou mais, rola o surto e aplica: Fúria (+5 por 1 rodada), Psíquico (2d12 com Vontade CD 25 em cada personagem dos jogadores) ou Adrenalina (+30 PV). Euforia é avisada no chat.
- **Av4 · Sabotar o Imagoduto:** um teste de Ofício (engenhoqueiro) CD 30 por selecionado, até 50 sucessos.

## O que foi inferido (não está no livro)
- Click, Drasala, Calliko, Dorothea, Ellanie e os clientes não têm ficha. Os números existem só para o token.
- O livro não dá Defesa para o Imagoduto. Ficou 5, como objeto imóvel, e ND 7 só para organizar.
- O livro não diz quais cabeças tem a quimera de Grisgemm. Ficou a clássica, com uma cabeça para cada personalidade (Salassan, dragão; Grumk, leão; Hans, bode).
- Na tabela de bebidas do livro, a ligação entre CD, preço e nome ficou embaralhada na diagramação. A ordem usada segue as linhas (Barbas de Heredrimm, Beluhga, Escavador, Rangedente, Limpa-ventas, Tuku'tu, Bafo de elfa, Água-de-sangue).
- A Inversão de Dano e a Vulnerabilidade a Cura do carrasco não são automáticas. O sistema aplica dano e cura normalmente, então o Mestre inverte à mão.
- Na Briga, "Roda de Bardos" conta para a contagem que estiver mais adiantada. O dano da 5ª rodada é aplicado como psíquico, para representar "um tipo sem resistência".
