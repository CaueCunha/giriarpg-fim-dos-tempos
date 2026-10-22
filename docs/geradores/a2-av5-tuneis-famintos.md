# Arco 2 · Aventura 5 · Túneis Famintos

Arquivo: `a2-av5-tuneis-famintos.js` (Foundry v14, Tormenta20 1.6.x). No módulo, o conteúdo vem nos compêndios do Ato 2. Como macro avulsa: crie uma macro do tipo Script como Mestre, cole o arquivo inteiro e execute. Rodar de novo apaga e recria só o que tem a marca `a2av5`.

## O que é criado

**Ameaças:**
- Dragão do Esgoto (ND 2, Pequeno): mordida com Ataque Furtivo (+2d6 marcado na rolagem), Emboscada Selvagem e Invisibilidade Natural.
- Enxame de Dragões do Esgoto (ND 6) e Enxame Alfa (ND 8), Grandes (token 2×2): o Enxame tem uma rolagem normal e outra com o dobro contra desprevenidos (Predadores Oportunistas), e a Emboscada rola o dano.
- Khenzarr, o Biomante (ND 9, finntroll): Raio Arcano, Magia Acelerada, Fluxo de Mana, Natureza Vegetal, cura acelerada e as magias da ficha (Armadura Arcana, Campo de Força, Desespero Esmagador, Dissipar Magia, Ferver Sangue, Imobilizar e Metamorfose), com botões de condição.
- A invisibilidade dos dragões é um efeito desligado na ficha (condição Invisível e +10 em Furtividade).

**Apoio (sem ficha no livro):** Marquês Vladmir Mors, Fido, Barba de Rato, Athisza, Ellan'grag'dakrimm, Gausbloppasremme e o Xerife Dallmirann.

**Itens:**
- Fedor do Esgoto (efeitos de –2 e de –1 com lenço), Infecção do Esgoto e o Lenço contra o Fedor.
- Capa de Couro de Dragão do Esgoto (regra da mesa original) e o Couro de Dragão do Esgoto.
- Pergaminho de Cidadania de Vladmir e o Transmissor Simples.
- Provas: Ferramentas Cirúrgicas de Khenzarr, Corpo de um Dragão do Esgoto e Depoimento do Povo dos Túneis.

**Tabela:** Isca para os Dragões (1d6).

**Diário (7 páginas):** Guia do Mestre; a Mansão do Sono e Suplício; No Esgoto (os dois caminhos e as demonstrações de amizade); o Povo dos Túneis; o Laboratório Secreto (as ideias para achá-lo); o Covil de Khenzarr; desfecho, provas e pagamento.

**Macros**
- **Av5 · Esgoto (fedor e infecção):** põe ou tira o fedor nos selecionados (alquebrado para quem tem faro, menos com lenço) e rola a Fortitude CD 15 do fim do dia (–5 se ferido).
- **Av5 · Testes Estendidos do Esgoto:** guarda o progresso de seis testes do livro:
  - achar o rastro (CD 20, 7 sucessos, sem falha total);
  - caçar com Barba de Rato (CD 20, 5 sucessos, Pilotagem e uma rolagem repetida);
  - mapear os túneis (CD 30, 7 sucessos, 3 falhas, enxame na 2ª falha, –1d4/–1d6... por dia fora);
  - rastrear a isca (CD 20, 3 sucessos);
  - terapia no Povo dos Túneis (Cura CD 25, 5 sucessos);
  - arrombar a fechadura (Ladinagem CD 25, 3 sucessos).
  Nas falhas, tira os PV e PM do livro de todos os selecionados.
- **Av5 · Isca para os Dragões:** rola o posicionamento (Sobrevivência CD 25, +2 com poder de armadilhas, só para o Mestre ver) e o d6 diário.
- **Av5 · Seguir um Dragão:** três testes de Furtividade ou Sobrevivência contra Percepção +12; um perdido perde o rastro, dois dão emboscada.
- **Av5 · Barulho nos Túneis:** soma os pontos do dia (aliados, ND dos combates e ideias), rola o d100 e conta os 3 sucessos da semana.
- **Av5 · Porta do Laboratório:** três testes de Força CD 20 (com ajudante); cada falha aplica 1d6 de impacto em quem força e em quem ajuda.
- **Av5 · Dragões Invisíveis:** liga ou desliga a invisibilidade dos dragões selecionados e cobra a ação e os PM de quem quer enxergá-los (1 PM para um dragão, 2 para um enxame).

## O que foi inferido (não está no livro)
- Vladmir, Fido, Barba de Rato, Athisza, os líderes do Povo dos Túneis e Dallmirann não têm ficha. Os números existem só para o token. As imagens são ícones do sistema (vampiro, lobo e raças) até haver arte.
- A arte dos dragões e de Khenzarr é a do lobo-crocodilo e a do finntroll do sistema, até haver arte da aventura.
- O fedor usa a chave `system.pericias.*.bonus` (todas as perícias), que o sistema replica para cada perícia.
- A cura acelerada, a intolerância a luz e a resistência a magia de Khenzarr ficam no texto; a resistência a magia também é um bônus de +2 marcado na rolagem de resistência.
- Na macro de testes estendidos, quem testa é o primeiro token selecionado; o bônus de ajuda é digitado.
