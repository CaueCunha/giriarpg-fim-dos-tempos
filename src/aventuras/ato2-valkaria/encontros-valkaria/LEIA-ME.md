# Arco 2 · Encontros em Valkaria

Arquivo: `a2-encontros-valkaria.js` (Foundry v14, Tormenta20 1.6.x). No módulo, o conteúdo vem nos compêndios do Ato 2. Como macro avulsa: crie uma macro do tipo Script como Mestre, cole o arquivo inteiro e execute. Rodar de novo apaga e recria só o que tem a marca `a2encontros`.

Este gerador detalha a Tabela de Encontros da Introdução do Arco 2 (pp. 39–61). A tabela simples *Encontros em Valkaria*, da Aventura 0, continua existindo. Outras macros, como a busca do Labirinto, ainda a usam.

## O que é criado

**Habitantes (15):**
- Gnuk.
- Farboraff e Brungamm.
- Wynstar.
- Drelene.
- Melora, do Castelo do Sabor.
- Galswell.
- O Elemental da Poluição.
- Bebê Corisco.
- Um goblin da Gazeta.
- Yolana, com a perícia Memética +15.
- Anatole.
- O Avatar da Cidade, com a perícia Memória +15.
- Justine.
- Tilliann.

Os assaltantes do Mercado usam o Bandido Descarado da Aventura 0.

**Itens:**
- A Carroça de Lagarto Interno.
- Os 25 chapéus, cada um com o +1 marcado na janela de rolagem.
- Os poderes concedidos Palavra de Drelene e Procrastinação Criativa.

Os pratos do Castelo do Sabor já vêm na Mini-Aventura 1. O diário traz o link para eles.

**Tabelas:**
- Encontros em Valkaria (detalhada), em 1d20.
- Chapéus de Farboraff e Brungamm, em 1d25.
- Lutadores das Qualificatórias, em 1d20.
- Corredores do Circuito, em 1d5.
- Aforismos do Avatar, em 1d5.

**Diário:** um Guia do Mestre e uma página por encontro. As páginas trazem:
- a lista de chapéus;
- o cardápio do Castelo;
- a tabela da entrevista da Gazeta;
- a tabela do Depósito de Lixo, com a contingência "Vivendo no Lixo";
- a tabela de lutadores e os bônus de Glamour;
- os aforismos do Avatar;
- os efeitos do metal arco-íris.

## Macros

### Valkaria · Encontro na Cidade

Rola o encontro ou usa um resultado escolhido. Depois:
- Conta quem já apareceu e marca os locais descobertos: Paterfax, Orfanato, Depósito de Lixo e Clube.
- Mostra o resumo, a mecânica e os links para a ficha e a página.
- Põe os tokens ocultos na cena. No Mercado, são 10 bandidos.
- Sorteia os cinco lutadores do dia na Arena.
- Rola um aforismo quando o encontro é com o Avatar.
- No reencontro com Justine, revela se ela foi eleita.
- Destrava a forja com Tilliann.

### Valkaria · Testes dos Encontros

- **Carroça de Lagarto Interno:**
  - rola a chance de explosão rodada a rodada;
  - aplica o dano de 5d6 com Reflexos para reduzir à metade;
  - acompanha a versão do invento.
- **Wynstar:** o formulário.
- **Castelo do Sabor:**
  - conta as refeições;
  - aplica o vício como PM máximos negativos;
  - registra os dias sem Castelo;
  - aplica a Purificação.
- **Galswell:** o duelo de atuação.
- **Elemental:**
  - os três sucessos para entendê-lo;
  - a Fortitude diária: fraco, depois debilitado, depois –2 em Con e Car, e por fim criatura de poluição.
- **Mercado e Orfanato:** os testes para perceber.
- **Gazeta:** aplica a manchete como bônus ou penalidade na perícia escolhida.
- **Yolana:**
  - a intrusão;
  - a manipulação, com um efeito de um dia e a regra do 1 natural.
- **Anatole:** o teste para ver através da lábia.
- **Avatar:** o teste de Memória, com a CD de cada tipo de pergunta.
- **Clube de Cavalheiros:**
  - perceber a fachada e convencer os taxidermistas;
  - contar as violações;
  - a fuga, com os quatro resultados.
- **Justine:** a campanha. Os votos são somados em segredo.
- **Tilliann:**
  - a entrega do metal arco-íris;
  - a forja, com a CD de 30 subindo +5 por item e travando depois de uma falha.

### Valkaria · Desafios da Cidade

- **Corrida do Circuito:**
  - quatro rivais com Cavalgar 1d20+10;
  - cinco testes;
  - os totais, a aposta e a parte de Corisco.
- **Depósito de Lixo:**
  - a Investigação do turno e o resultado na Tabela 8-1;
  - a Fortitude de cada um, com CD de 20 e +2 por teste;
  - o fedor de –5 cumulativo em perícias sociais.
- **Banho:** tira o fedor.
- **Lutas Qualificatórias:**
  - os cinco testes opostos;
  - o investimento de PV e PM, limitado ao nível;
  - as regras de Zardana e Shai-Nefer;
  - o teste de Atuação com o Glamour.

## O que foi inferido (não está no livro)

- **Fichas.** O livro só dá números para algumas perícias: Galswell (Atuação +10), Yolana (Memética +15), Anatole (Enganação +12) e o Avatar (Memória +15). PV, Defesa e o resto são palpites, só para ter token.
- **Ícones.** Os ícones são do sistema:
  - Wynstar: cavalo;
  - Elemental: otyugh;
  - Yolana: nagah mística;
  - os outros: as raças ou trajes.
- **Duelo de atuação de Galswell.** O livro não dá a regra. A macro usa Atuação oposta, e o empate fica com Galswell.
- **Ver através de Anatole.** O livro só diz que ele esconde a verdade com Enganação +12. A macro usa Intuição oposta.
- **Vício no Castelo.** Entra como PM máximos negativos (`system.attributes.pm.bonus.total`). A Purificação só cura com 0 PM máximos.
- **Carroça.** Quando explode, Gnuk recomeça os aperfeiçoamentos do zero. O livro não diz o que acontece nesse caso.
- **Corrida.** Os rivais são Jallillah, Cherb, Hollan e Veliette. O Cavalgar de cada um é rolado uma vez por corrida. O empate não vence.
- **Lutas da Arena:**
  - empates são rolados de novo;
  - o investimento é o mesmo em todas as lutas;
  - investir depois da rolagem (o custo dobrado) fica para o Mestre, à mão.
- **Clube de Cavalheiros.** Na fuga, cada um usa a melhor das perícias listadas. Os itens perdidos saem da ficha à mão.
- **Gazeta.** O efeito vale até o fim da aventura e é apagado à mão. O Mestre escolhe a perícia afetada.
- **Locais descobertos.** O livro só diz que os lugares ficam descobertos. Rolar um local de novo faz o grupo voltar a ele, e não conta como resultado inviável.
