# Aventura 5 no Foundry: "A Noite dos Maníacos Aberrantes"

Guia da macro `av5-maniacos-aberrantes.js` (Foundry v14, sistema Tormenta20 do Vizael 1.6.x). Igual às anteriores: macro do tipo **Script**, colar, rodar uma vez como Mestre. Tudo vai para pastas **FdT · Av5 · Noite dos Maníacos Aberrantes**. Rodar de novo pergunta antes e recria só o que tem a marca da Av5.

## O que é criado

| Tipo | Conteúdo |
|---|---|
| Ameaças | Bandoleiro de Syvarian (ND 1/2), Cão do Inferno (ND 2), Irmão da Companhia (ND 1), Bando Desesperado (ND 4), Syvarian (ND 5), Torgo (ND 5) |
| Lefeu | Uktril, Geraktril e Reishid, copiados do compêndio do sistema (Formiga Aberrante, Formiga Aberrante Maior e Assassino Aberrante), mais os LeBlanc corrompidos |
| Perigos com ficha | Horda de Zumbis (400 PV), Tentáculos Lefeu (200 PV), 2ª Onda · Bombardeio, Ygor e os quatro abrigos (Ponta de Pedra, Darandell, Placidez, Dornbach) |
| Ator de apoio | **Forte Cabeça-de-Martelo**: dias até o ataque, construir defesas, ativar defesas, treinar parceiros, paliçada, lutar na paliçada, sentinelas e as regras de parceiros |
| Itens | Um item de parceiro para **cada NPC da lista do livro** (39 deles, com o poder de parceiro do compêndio), o pergaminho de Syvarian, o esconderijo de Nadine e o chá de Raguria |
| Diário | Guia do Mestre, handout das ordens, recrutamento NPC por NPC, preparação, as cinco ondas hora a hora, discurso de Syvarian com as revelações, discurso do Dr. Vesper e desfecho |
| Macros | Noite no Inferno, Aproximação, Preparar o Forte, Treinar Parceiros, Parceiros, Bombardeio, Horda Zumbi, Tentáculos Lefeu, Abrigos dos Inocentes |

## Na mesa

- **Noite no Inferno** é a macro central. Rode a cada hora: ela avança o relógio (recurso na ficha do Forte) e posta no chat o que acontece, das 18:00 às 05:00, com as cinco ondas e todas as cenas de NPC no meio.
- **Aproximação:** selecione as sentinelas antes de cada onda. A macro rola Guerra ou Percepção, usa o melhor resultado e diz quantas rodadas de antecedência o grupo tem. Marque a caixa de Nadine na 3ª onda.
- **Preparar o Forte:** selecione quem está coordenando as obras. A macro rola os testes, conta os d4 e já rola o orçamento de mana do dia. Guarde o total para gastar nas magias que representam as defesas.
- **Treinar Parceiros:** selecione o professor. Rola os 1d6 dias, os dois testes CD 20 dele e a Inteligência de cada aluno. Some o modificador de Inteligência do NPC se ele tiver ficha.
- **Parceiros:** rode no fim da rodada de cada jogador para o 1d6 de ferimento (marque a caixa dos tentáculos quando for o caso), e no fim de cada onda para as mortes. A macro acumula os feridos da onda sozinha.
- **Bombardeio (2ª onda):**
  - *Início do turno* avança a rodada, rola Reflexos, aplica os 4d6 e avisa quem perdeu a ação. Marque "perto de um explosivo" para a CD 25 com dano de perfuração.
  - *Desarmar* (Ladinagem CD 25, 3 sucessos por explosivo) e *Carregar* (Força CD 15) já tratam as falhas por 5 e por 10.
  - *Detonar* aplica os 10d6 de cada explosivo que sobrou.
- **Horda Zumbi (3ª onda):**
  - *Registrar dano* desconta dos 400 PV da ficha e, ao passar de 200, liga a Tempestade Rubra sozinha, subindo todas as CDs para 30.
  - *Início do turno* rola Fortitude ou Vontade e já tira os 2 PM (ou avisa que o personagem sem PM perde um parceiro).
  - *Ação da horda* rola o 1d4 e descreve a ação com a CD certa.
- **Tentáculos Lefeu:** o 1d4 de surgimento, o teste de agarrar (marcando a condição no token) e o dano de cada turno, com a opção do fosso em dobro.
- **Abrigos:** escolha o prédio e a ação. A macro cuida dos focos de incêndio, do dano e, quando o abrigo cai, conta quantos inocentes morreram.
- **Syvarian:**
  - A serra giratória já rola **dois d20** automaticamente (aprimoramento marcado sozinho). O +2d6 por exceder a Defesa em 10 é um aprimoramento que você marca.
  - *Ossos Frágeis* está na ficha como "dano por dado" de impacto: o sistema soma +1 por dado de impacto sozinho.
  - Com 60 PV ou menos, ligue o efeito **Forma Final** e passe a usar só as *Pancadas de Tentáculo*. Dispare a *Transformação Enlouquecedora* em quem assistir.
  - Os recursos da ficha contam as três granadas sônicas e o arpão carregado.
- **Bando Desesperado:** o *Ataque em Bando* tem duas rolagens prontas com a metade do dano, para quando o ataque errar. O dobro por exceder a Defesa em 10 você aplica à mão.
- **Irmão da Companhia:** só um em cada quatro carrega bomba. Ponha 1 no recurso *Bomba* desses tokens.

## O que foi inferido (não está no livro)

- **Zumbis da Tormenta:** o livro não dá ficha. A horda virou um ator de 400 PV e Defesa 25 (os números do perigo complexo), com as imunidades dos lefeu. Os LeBlanc corrompidos são a ficha de Zumbi do sistema com essas imunidades acrescentadas.
- **Uktril, geraktril e reishid** são as fichas do compêndio do sistema (Formiga Aberrante, Formiga Aberrante Maior e Assassino Aberrante), que são as mesmas criaturas com os nomes usados no sistema.
- **Tentáculos Lefeu:** os 200 PV e a Defesa 23 são do livro; o resto da ficha (atributos, tamanho) é sugestão.
- **Abrigos:** 100 PV é do livro; a Defesa 10 é sugestão.
- **Ygor:** PV e Defesa são sugestão.
- **Cletus como parceiro:** o livro não dá um tipo de parceiro para ele, só as regras de ofender e ir embora. Defina o bônus com a mesa.
- **Retratos:** usei os mais próximos do sistema. Syvarian ficou com o goblin engenhoqueiro e os tentáculos com o otyugh; troque pelos ícones do Arco 1 que você tem no PC.

## Limitações

- **Não foi testado num Foundry rodando.** A macro foi conferida contra o código do sistema, rodou numa simulação e os caminhos de ícone foram verificados.
- **RD 10/mágico dos cães:** como na Aventura 4, a ficha usa RD 10 geral; contra ataque mágico, devolva os 10 PV à mão.
- **Coisas que ficam à mão:**
  - A paliçada (quadrados danificados e destruídos) é controlada no mapa.
  - Ordens dos parceiros e os bônus deles nas rolagens dos PJs.
  - O dobro de dano do *Ataque em Bando* e o +50% de dano em área contra horda, tentáculos e bandos.
  - A mentira do Fermond: subtraia 2 dos ataques do jogador em segredo.
  - As especiais de Moira, Raguria, Gaspar e Morgan, que dependem do que acontecer na mesa.
