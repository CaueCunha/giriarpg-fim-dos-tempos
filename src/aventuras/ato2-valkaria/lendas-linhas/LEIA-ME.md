# Arco 2 · Lendas Urbanas e Linhas Narrativas

Arquivo: `a2-lendas-linhas.js` (Foundry v14, Tormenta20 1.6.x). No módulo, o conteúdo vem nos compêndios do Ato 2. Como macro avulsa: crie uma macro do tipo Script como Mestre, cole o arquivo inteiro e execute. Rodar de novo apaga e recria só o que tem a marca `a2lendas`.

Cobre os capítulos Lendas Urbanas (p. 62) e Linhas Narrativas da Campanha (pp. 65–73) do livro do Arco 2. As Novas Regras (Lei & Ordem e as atividades) já estão na Aventura 0.

## O que é criado

**Diário "Arco 2 · Lendas Urbanas e Linhas Narrativas" (16 páginas):**
- Guia do Mestre.
- Lendas Urbanas: o que são e como contar (a "verdade chocante" do livro).
- Uma página por lenda, com o texto e o subtexto:
  - Vampiros de Pensamentos;
  - A Serva e o Bardo;
  - Megan Miserável;
  - Os Doentes da Praga;
  - O Golem Errado;
  - Dragões nos Esgotos.
- Linha Narrativa 1 · Caos em Valkaria: o objetivo de Ghorskander e as engrenagens, com links para as aventuras.
- Linha Narrativa 2 · Espaço de Masmorra.
- Ghorskander e Torgo: a história de cada um e o link para a ficha da Aventura 7.
- Os Avatares do Futuro Eterno: a "sopa de letrinhas" e como investigar a seita.
- Cronologia e Níveis: ordem presumida e como adaptar ao nível do grupo.
- Simplificando.
- Linha do Tempo sem os Heróis.

**Diário "Arco 2 · Documentos da Trama":** os 5 Pergaminhos dos Avatares do Futuro Eterno e as 5 entradas do Diário Científico de Ghorskander. Todas as páginas começam ocultas para os jogadores.

**Tabela:** Lendas Urbanas de Valkaria (1d6).

## Macros
- **Valkaria · Lenda Urbana:**
  - rola 1d6 ou usa a lenda escolhida;
  - conta para todos com uma abertura de "amigo do amigo", como anotação num diário ou como nota da Gazeta;
  - manda o subtexto e a aventura da dica só ao Mestre;
  - guarda a coleção que o grupo já ouviu.
- **Valkaria · Documentos da Trama:**
  - revela um documento (a página fica como Observador para os jogadores e o texto vai ao chat) ou o esconde de novo;
  - mostra o que já foi revelado;
  - "investigar os Avatares": rola Investigação dos selecionados e lembra o Mestre do que o livro manda revelar.
- **Valkaria · Linha do Tempo:**
  - os 30 acontecimentos, com os 13 de antes da chegada do grupo já marcados;
  - cada um pode ser marcado como acontecido (vai para o chat de todos), evitado pelo grupo ou desmarcado;
  - a macro mostra o próximo acontecimento.
- **Arco 2 · Ajustar ao Nível:**
  - oponente único: um efeito de ±1 por nível de diferença em ataque, perícias e dano, e ±10 PV por nível no PV máximo (desfeito ao remover);
  - vários oponentes: sugere a nova quantidade de criaturas;
  - mostra também os níveis presumidos.

## O que foi inferido (não está no livro)
- As aberturas de "amigo do amigo" foram escritas para o módulo, seguindo as dicas do livro (dois intermediários).
- "Os Doentes da Praga" fica ligada à trama geral (os Imagodutos), não a uma aventura só.
- Linha do tempo:
  - o livro não diz qual aventura evita cada acontecimento;
  - as ligações mostradas são uma leitura deste módulo;
  - as únicas explícitas no livro são a Irmandade Máxima (guerra de irmandades), a Aventura 1 (evita o massacre e a destruição da Guarita) e as notas sobre as Aventuras 2 e 5.
- Ajuste de nível:
  - o PV máximo de NPC é um número fixo da ficha, então a macro muda o PV máximo direto e guarda a diferença (flag `fdtAjustePV`) para desfazer;
  - testes e dano usam os modificadores gerais do sistema.
- Quantidade de criaturas: o livro só manda igualar o ND do encontro ao nível do grupo. A sugestão usa a regra prática de que dobrar o número de criaturas sobe o ND em cerca de 2.
- O livro não dá CD para investigar os Avatares, e a macro não usa CD.
