# Templo do Vácuo no Foundry (Arco 1, masmorra opcional)

Guia da macro `a1-templo-do-vacuo.js` (Foundry v14, sistema Tormenta20 do Vizael 1.6.x). Igual às outras: macro do tipo **Script**, colar, rodar uma vez como Mestre. Tudo vai para pastas **FdT · Arco 1 · Templo do Vácuo**. Rodar de novo pergunta antes e recria só o que tem a marca `a1templo`.

## O que é criado

| Tipo | Conteúdo |
|---|---|
| Criaturas do livro | Tirano das Águas (ND 1), Tirano das Águas Barão (ND 5, com as 4 Mutações Rubras como efeitos), Mecanículo (ND 2), Monstro da Ferrugem (ND 2), Cardume Carnívoro (ND 3), Cocatriz (ND 3), Ameba Gigante Jovem (ND 3) e Adulta (ND 5) |
| Do compêndio | Estátua Animada e Estátua com Besta (Golem de Ferro com "uma ação por rodada"), Ganchador |
| Objetos | Autômato Ferreiro Arruinado (Estátua Executora), Porta de Ferro Pesada (Def 8, RD 10, 100 PV) |
| Ator de apoio | **Templo do Vácuo · Armadilhas**: as 11 armadilhas com onde ficam, ND, efeito e CDs |
| Itens | Engenhosidade (Altar da Memória), Anotações de Kizadrinni, diário do aventureiro, livro do Herói Louco, mapa de Sambúrdia, tabuletas dos túmulos, kit de ofício e gazua |
| Tabelas | Encontros no Templo do Vácuo (1d20 + ruído), Reações dos Encontros, Memórias dos Gnomos |
| Diário | Guia do Mestre, Como Chegar, Regras da Masmorra, Nível 1, Nível 2, Nível 3, Enigma das Tabuletas (gabarito) e dois de handouts |
| Macros | Busca pelo Templo, Exploração, Escuridão do Templo, Armadilhas, Testes do Templo, Criaturas, Mecanismos e Altares |

## Na mesa

- **Busca pelo Templo:** selecione o grupo; o primeiro token selecionado faz o teste.
  - A macro guarda o progresso, sobe a CD (15, +2 por teste) e bloqueia perícias já usadas (só Sobrevivência repete). Na falha, tira 1d8 PV.
  - A cada dois testes (um dia), roda o encontro das Colinas: a macro *Colinas · Encontro do Dia*, se existir, ou a tabela de encontros.
  - No 7º sucesso, rola 1d3 para a entrada. Cada sucesso a mais revela outra entrada.
- **Exploração:** rode ao entrar em cada sala ou corredor.
  - Ajuste o **ruído** (0 a 5, mais 1 por armadura pesada, criatura Grande ou montaria).
  - Em sala sem criaturas, rola 1d20 + ruído, a quantidade e a reação (1d6 + o menor Carisma dos tokens selecionados, ou teste social ÷ 5).
  - Põe os tokens **ocultos** em volta do primeiro token selecionado.
  - Conta a cena (sala = 3, corredor = 1; 6 = uma cena) e avisa quando as tochas se apagam.
- **Escuridão do Templo:**
  - **Ligar:** corta pela metade a luz dos tokens e das luzes da cena, zera a visão no escuro e escurece a cena.
  - **Desligar:** restaura tudo.
  - Também acende tocha (9 m) e lampião (15 m), já pela metade com a escuridão ligada.
  - Tokens colocados depois de ligar não são ajustados: desligue e ligue de novo.
- **Armadilhas:** mire os atingidos e escolha a armadilha.
  - Rola a resistência de cada um e aplica dano (com RD), perda de PV (sem RD), caído ou atordoado.
  - Casos especiais: as três fases do desabamento, os dois golpes da estátua executora e quem ativou a runa (sem teste).
  - Veneno: "de uma vez" aplica tudo na hora; desmarcado, cria um efeito de dano contínuo por rodadas.
- **Testes do Templo:** os testes de pista com a CD do livro (do grupo usa o melhor; individual rola cada um) e os especiais:
  - corda da cratera (a resistência da corda e a CD que sobe);
  - rio (o resultado pela margem de falha);
  - prender o fôlego (conta as rodadas por personagem);
  - desabamento (estendido, 5 antes de 3, com "boa ideia" valendo sucesso);
  - escalar os fossos (3 seguidos);
  - abrir tumba à força (três tentativas arruínam o tesouro).
- **Criaturas:**
  - Frenesi Sangrento empilha +2 num efeito só, e *encerrar* o remove.
  - Vômito Cáustico aplica o dano e deixa o da rodada seguinte como dano contínuo.
  - Bicada Petrificante deixa lento e, se já estava lento, petrificado.
  - Ferrugem: item mágico, ou a escala fatigado → exausto → paralisado em construtos.
  - Cardume: 2d6 que explode no 6, e sangrando com 10 ou mais.
  - Ameba: engolir (agarrar resistido, paralisia com imunidade de um dia), digestão e expelir.
- **Mecanismos e Altares:**
  - **Alavanca 1:** 4d6 mecanículos com +5, e os tokens ocultos. Selecione antes um token na Sala da Estátua.
  - **Alavanca 2:** mecanículos a 10 PV com –5; tiranos com +3. *Desligar* tira os dois efeitos.
  - **Tributo:** rola uma memória gnômica para cada token selecionado.
  - **Salão da Memória:** conta as quatro respostas; na quarta, estátuas e mecanículos da cena ficam neutros.
  - **Forja:** rola 1d6 itens no primeiro uso e conta.
  - **Altar da Memória:** máximo de dois personagens. Rola 4d6 sem o menor dado e pergunta se aplica o valor. Entrega Engenhosidade com o bônus igual à Inteligência atual e, se repetir, com –1 PM.
  - **Entrada B:** dias até rearmar e quantas cargas de veneno restam.
- **Enigma das Tabuletas:** a página do diário é o gabarito (só para o Mestre). Desenhe as tabuletas à mão, como o autor fez.

## O que foi inferido (não está no livro)

- **Estátua com besta:** o livro não dá a ficha da besta. Usei o bônus de Luta do golem e o dano de besta pesada (1d12, 19).
- **Autômato ferreiro:** sem PV nem Defesa no livro (100 PV e Defesa 10, só para ter um token). O golpe é o da Estátua Executora.
- **Busca:** o livro diz que a falha custa 1d8 PV, sem dizer de quem. Por padrão só quem testou perde PV; há uma caixa para ferir o grupo todo.
- **Altar da Memória:** o livro usa a escala antiga (3 a 18). A macro converte com (total – 10) ÷ 2, arredondado para baixo.
- **Tumbas:** o livro diz "três tentativas arruínam o tesouro". A macro conta as falhas de Força.
- **Desabamento do Teto:** um sucesso em qualquer das três Iniciativas escapa; quem falha nas três faz o Reflexos.
- **Gás venenoso em efeito contínuo:** a metade de 1d12 virou 1d6. A 2ª rodada do Vômito Cáustico pela metade virou 1d4.
- **Ícones:** tirano usa o troll aquático do sistema, a cocatriz o basilisco e as amebas o glop. Troque pelos seus.

## Limitações

- **Não foi testado num Foundry rodando.** Foi conferido contra o código do sistema e rodou numa simulação com todas as opções das 7 macros. Os ícones do sistema foram verificados.
- Ganchador e estátuas vêm do compêndio `tormenta20.ameacas`; sem o compêndio, eles não são criados.
- A reação usa os tokens **selecionados** como "os mais próximos". Selecione quem está na frente.
