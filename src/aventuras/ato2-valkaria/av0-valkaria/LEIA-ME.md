# Arco 2, Aventura 0 no Foundry: "Chegada a Valkaria"

Guia da macro `a2-av0-valkaria.js` (Foundry v14, sistema Tormenta20 do Vizael 1.6.x). Igual às do Arco 1: macro do tipo **Script**, colar, rodar uma vez como Mestre. Tudo vai para pastas **FdT · Arco 2 · Av0 · Chegada a Valkaria**. Rodar de novo pergunta antes, recria só o que tem a marca desta aventura e **mantém o valor de Lei & Ordem**.

## O que é criado

| Tipo | Conteúdo |
|---|---|
| Ameaças | Bandido Descarado (ND 4), Barnett (ND 5), Gárgula da Metrópole (ND 6), com as fichas do livro |
| Personagens | Blixto Arting e a Xerife Mathilda Nolt (tokens para a parte social) |
| Ator de apoio | **Valkaria · Lei & Ordem**: o contador do arco (começa em 20) e as provas da aventura atual, com as regras e os segredos |
| Itens | Carta de Belinda, Medalhão da Gárgula (3 cargas na quantidade), Distintivo da Guarda |
| Tabelas | Encontros em Valkaria (1d20) e Eventos da Perseguição (1d20) |
| Diário | Guia, handout da carta, as quatro fases, elenco da Guarita da Praia, juramento, handout do **Quadro de Casos** (os seis casos), Lei & Ordem e Provas, Atividades em Valkaria (e em Vectora) e Moradias |
| Macros | Lei & Ordem, Perseguição |

## Na mesa

- **Lei & Ordem** serve para o arco inteiro. Escolha a ação:
  - *Fim de sessão* tira 1.
  - *Atividades* tira 1 por momento separado.
  - *Provas entregues* soma, respeitando o limite de 5 por caso.
  - *Novo caso* zera a contagem de provas.
  - *Ajuste* é para o que o livro mandar (por exemplo, matar Janara custa −5).
  
  A mensagem vai para o chat de todos e avisa quando chega a zero (começa a Aventura 7).
- **Perseguição** também serve para o arco inteiro.
  - **Iniciar:** selecione os perseguidores, marque os fugitivos como alvo (tecla T) e rode *Iniciar*, informando a vantagem e a distância de fuga (80 quadrados nesta aventura).
  - **A cada rodada:** a macro rola o evento, os testes de obstáculo ou atalho (com o melhor bônus quando há mais de uma perícia), o dano dos eventos e a corrida de Atletismo, já com o modificador de deslocamento.
  - **Fim da perseguição:** a macro faz o teste de cansaço depois de 1 + Constituição rodadas. Avisa quem alcançou quem e quem escapou.
  - **Barnett** pode atrapalhar um perseguidor no início da rodada (escolha na lista). **Use só enquanto a gárgula o carrega.**
  - **"A gárgula sofreu 20+ de dano"** rola a Fortitude dela com CD igual ao dano.
- **Gárgula:** a ficha já tem Atletismo +14 (o número que o livro dá para a perseguição) e voo 18 m. A macro não soma o bônus de deslocamento para ela.
- **Nuvem de Detritos:** está na ficha da gárgula com o dano 6d6, o Reflexos CD 22 e o botão de atordoado.

## O que foi inferido (não está no livro)

- **Blixto e Mathilda:** o livro não dá ficha. Os números são só para ter um token.
- **Ator de Lei & Ordem:** é só um jeito de guardar o contador no mundo. As regras são do livro.
- **Tabela de encontros:** os resumos são meus; os detalhes de cada encontro ficam no livro.
- **Atalho na perseguição:** pelo livro, cada participante escolhe se tenta o atalho. A macro faz todos tentarem; se alguém não quiser, ajuste à mão.

## Limitações

- **Não foi testado num Foundry rodando.** O gerador foi conferido contra o código do sistema e rodou numa simulação, assim como as duas macros. Os caminhos de ícone também foram verificados.
- **Contador de Lei & Ordem:** se você rodar os geradores das próximas aventuras do Arco 2, eles vão usar este mesmo contador. Não apague o ator.
