# Arco 2 · Mini-Aventura 1 · Ruas de Cobiça

Arquivo: `a2-mini1-ruas-de-cobica.js` (Foundry v14, Tormenta20 1.6.x). No módulo, o conteúdo vem nos compêndios do Ato 2. Como macro avulsa: crie uma macro do tipo Script como Mestre, cole o arquivo inteiro e execute. Rodar de novo apaga e recria só o que tem a marca `a2mini1`.

## O que é criado

**Ameaças:**
- Os seis aventureiros-capangas (ND 5), com as fichas do livro:
  - guerreiro (marreta ×2, Sequência Debilitante no card);
  - clérigo (martelo de guerra, Curar Ferimentos);
  - caçador (arco longo ×2, Disparo Retardante);
  - ladino (espada curta e adaga com Ataque Furtivo +3d6, Estocada Atordoante, evasão);
  - mago (Raio Arcano com em chamas, Escudo Arcano ligado na aba de efeitos);
  - cavaleiro (espada bastarda e chifres, Chifrada Oportuna, Guarda Aberta).
- O Cobrador da Ploigoníada (ND 9). Tem 400 PV, 52 PM, RD 5 e imunidade a frio. A resistência a magia +5 é marcada na rolagem. Habilidades:
  - espada bastarda ×2 com 2d6 de frio;
  - Ler Seus Direitos, Negar Recurso, Analisar Suspeito, Encontrar o Culpado e Visão da Justiça;
  - as magias Disfarce Ilusório, Dissipar Magia, Imobilizar e Silêncio.
- Blixto Arting é o ator da Aventura 0. O diário liga para ele.

**Itens:**
- Os 12 itens especiais efêmeros, com a quantidade 5 contando os usos. O escudo esbodegado começa com 50, para contar o dano que ainda absorve. Os bônus que dá para automatizar vêm marcados na rolagem:
  - espada exagerada (+1d10);
  - maça exagerada (+2d12);
  - besta maldosa (margem e multiplicador);
  - tomo fumegante (+2d6 de fogo em magias);
  - o tijolo tem o botão de atordoado.
- As 8 comidas especiais:
  - batata valkariana, gorad quente e macarrão de Yuvalin são cópias do compêndio do sistema;
  - Doppelganger, Batata do Castelo, Cestinha Uivante e Alqui-Fruta seguem o texto do Castelo do Sabor;
  - a coxa de trobo assada cura 1d6 PV e 1d6 PM.

**Tabelas:** Aventureiros-Capangas (1d6), Itens Especiais da Ploigoníada (1d12) e Comidas Especiais (1d8). As três ligam para os atores e itens.

**Diário (5 páginas):**
- guia do Mestre;
- fases 0 e 1 (a Ploigoníada, o Cobrador, a mensagem e os planos criativos);
- fase 2 (a rua, os grupos, os itens e as comidas);
- fase 3 (o Cobrador);
- fase 4 (efeitos de vitória e de derrota).

**Macros**
- **Mini 1 · Mensagem da Ploigoníada:**
  - mostra o pergaminho de luz e inicia o prazo de 12 horas pelo relógio do mundo;
  - diz quanto falta;
  - rola o melhor entre Misticismo, Religião e Nobreza dos selecionados.
- **Mini 1 · Andar e Bater:**
  - monta os grupos: 4 no nível 9 e +1 por nível acima, cada um com personagens + 2 capangas sorteados, e 1 em 5 com um item especial;
  - rola a comida de um capanga derrotado (20%) e entrega ao PJ selecionado;
  - dá um item especial a quem o apanha, um por personagem.
- **Mini 1 · Cobrador em Combate:**
  - cura acelerada 5;
  - Ler Seus Direitos: pasmo, ou atordoado se for o devedor;
  - Negar Recurso;
  - Imobilizar: paralisado ou lento;
  - Silêncio: surdo nos alvos;
  - Analisar Suspeito e falas.
  - Os PM são gastos da ficha.
- **Mini 1 · Desfecho:** registra vitória (+10% em todo tesouro) ou derrota (+20% nos preços) e faz as contas.

## O que foi inferido (não está no livro)
- O texto do livro mistura as fichas do caçador, do ladino e do mago. A divisão usada:
  - caçador: Des 3, Sab 1, Acrobacia +9;
  - ladino: For 1, Des 3, Furtividade +9, deslocamento 12m e evasão, raça não informada;
  - mago: elfo, Raio Arcano.
- Os ataques ×2 aparecem como uma arma só, com a nota "dois ataques por ação agredir".
- O livro não dá ícones para os capangas e o Cobrador. Os capangas usam ícones de ameaças e de raças do sistema; o Cobrador usa o golem de ferro.
- O Escudo Arcano é um efeito ligado de RD 30. Desligue-o por 1 rodada quando o mago sofrer dano mágico.
- O prazo de 12 horas usa o relógio do mundo do Foundry. Se o tempo não for avançado, a macro continua mostrando 12 h.
- As comidas copiadas do sistema mantêm as regras do sistema. A batata valkariana do sistema se chama Batata Ambiciosa e dá +1d6.
