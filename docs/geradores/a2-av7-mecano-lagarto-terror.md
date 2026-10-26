# Arco 2 · Aventura 7 · O Ataque do Mecano-Lagarto-Terror de 50 Metros de Altura

Arquivo: `a2-av7-mecano-lagarto-terror.js` (Foundry v14, Tormenta20 1.6.x). No módulo, o conteúdo vem nos compêndios do Ato 2. Como macro avulsa: crie uma macro do tipo Script como Mestre, cole o arquivo inteiro e execute. Rodar de novo apaga e recria só o que tem a marca `a2av7`.

## O que é criado

**Ameaças:**
- Ghorskander (ND 12, vilão final do arco):
  - garras-bisturi com Romper Tendões (lento e vulnerável no card);
  - garra-injetora com o Injetor Parasitário (–1 cumulativo em perícias);
  - Forma Final, Mãos Independentes, Tique-Taque Dominador, Láudano Mentagênico, Surto Serotônico e Ossos Frágeis;
  - Engenhosidade (+6) e a resistência a mental e medo (+3) marcadas na rolagem.
- Torgo (ND 10), com a arte do Arco 1, Fúria na aba de efeitos e escalada 9m.
- Mecano-Lagarto-Terror: um ator só com as armas do monstro inteiro (garra, pisotear, golpe e sacudida da cauda, descargas, sopro de fúria, raios oculares, Lagarto Teimoso). O recurso conta os segmentos desativados.
- Um ator-objeto para cada ponto fraco, com Defesa, RD e PV do livro:
  - pernas, cauda e ombro (dois tokens);
  - mecanismo do tronco (cinco tokens);
  - sopro de fúria e olho (dois tokens) na cabeça.
- Ninho de Metralhadoras e Lança-Mísseis, para colocar quantos houver no segmento.
- Os enxames de dragões do esgoto são os da Aventura 5 (o diário liga para eles).

**Itens:**
- Poção de curar ferimentos (11d8+11) e pó azul (2d4 PM, ação completa) da Guarita da Praia.
- Benefícios de Lei & Ordem (excesso), Eu <3 Valkaria e Velozes e Valorosos, como textos de referência.

**Tabelas:** Situações em Valkaria (1d12) e NPCs em Valkaria (d100, os 50 resultados do livro).

**Diário (6 páginas):**
- guia do Mestre;
- fase 1 (plano de Ghorskander, ascensão, excesso de Lei & Ordem, caminho de destruição, estátua e palácio, Lagarto Teimoso);
- as doze situações numa tabela;
- fase 2 (segmentos, defesas, abordagens alternativas);
- fase 3 (Ghorskander e Eu <3 Valkaria);
- fase 4 (desfecho, caminhos para Galrasia, epílogo, destino dos NPCs, informações para o futuro).

**Macros**
- **Av7 · Caminho de Destruição:** guarda o estado da aventura:
  - a ascensão (1d6 e 2d4);
  - as penalidades das aventuras não resolvidas;
  - o avanço a cada rodada, os hexágonos destruídos e o limite de 10 (mais os de Lei & Ordem);
  - Lagarto Teimoso (até 3);
  - a estátua e o palácio (+5 CD e +10% cada);
  - a abominação dos cultistas;
  - os segmentos desativados (a cabeça vale dois; aviso de Ghorskander no terceiro);
  - os gastos de Lei & Ordem (cura, rolar de novo, parar 2/4/6, resistir 1/2/3, anular a abominação), descontados do ator da Aventura 0.
- **Av7 · Situação em Valkaria:**
  - rola a situação e os NPCs (três no tumulto e na batalha; 99-00 vira NPC enfurecido);
  - cada personagem selecionado faz um teste com a melhor perícia permitida;
  - aplica o efeito da falha em cada teste, o sucesso ou o fracasso e as chances de morte dos NPCs;
  - soma hexágono destruído, estátua, palácio, NPC enfurecido e monstros perseguindo;
  - regras próprias de Batalha Campal, Magia Selvagem, Dra. Zymni, orfanato e NPC lendário.
- **Av7 · Escalar e Sabotar:**
  - escaladas (pernas 25, cauda 22, cabeça 25) e abordagens por salto, voo ou teletransporte (25 ou 30);
  - sabotagem do ponto fraco mirado (CD 25, o ponto perde PV iguais ao resultado) ou de ninhos e mísseis (CD 30);
  - pisoteio, golpe de cauda, sacudida e descargas nos alvos.
- **Av7 · Defesas do Mecano-Lagarto-Terror:** a barragem de cada segmento (fim de rodada ou ao abordar) e as contagens 20, 15 e 10 da cabeça, com alvos sorteados entre os mirados:
  - ninhos (dois disparos em alvos diferentes, crítico 19/×3);
  - mísseis (–2 em testes por 1 rodada);
  - garras (uma rolagem contra todos, ignora RD);
  - sopro (PM por 6 nos dados, frenesi a 0 PM);
  - raios oculares.
- **Av7 · Ghorskander em Combate:**
  - Láudano Mentagênico;
  - Injetor Parasitário;
  - Tique-Taque Dominador (só nos alvos com o injetor);
  - Romper Tendões;
  - Forma Final (145 PV, liga o efeito e abala quem vê);
  - Mãos Independentes;
  - o discurso;
  - Eu <3 Valkaria.
- **Av7 · Suprimentos da Guarita:** dá a poção e o pó azul aos personagens selecionados.

## O que foi inferido (não está no livro)
- O livro não dá imagens para o monstro e os segmentos. O monstro usa o ícone do dragão-rei e os pontos fracos usam o engenho de guerra goblin. Ghorskander usa o ícone do kliren.
- O ator do monstro tem PV 1, Defesa 10 e atributos 0. Só as armas e o recurso de segmentos importam. A garra usa Luta +28.
- Aventureiros em Pânico manda rolar três perícias na Tabela 6-6 do livro básico, que não está aqui. A macro sorteia três perícias de uma lista de perícias comuns de aventureiros.
- "Ignora qualquer redução de dano" e "ignoram qualquer tipo de resistência a dano" viram dano com a RD ignorada. Os ninhos e os mísseis não dizem isso e respeitam a RD.
- O livro dá à sacudida da cauda um teste de Atletismo ou Reflexos. A macro usa o maior dos dois. Em todas as situações, a macro usa a maior perícia permitida de cada personagem.
- Na Batalha Campal, cada 3 sucessos salvam um grupo, a partir do escolhido. O livro deixa o segundo grupo ao Mestre.
- Na cura de Lei & Ordem, a macro escolhe PV quando faltam 10 ou mais e PM nos outros casos. O jogador pode trocar na ficha.
- A estátua e o palácio passam a valer assim que são registrados. Pelo livro, valem depois que o monstro sai do hexágono.
- O Injetor Parasitário não tem duração no efeito, porque o v14 não tem a unidade "cena". Apague os efeitos no fim da cena.
- Ossos Frágeis (+1 por dado de impacto) fica no texto, para somar na mão.
