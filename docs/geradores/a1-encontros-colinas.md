# Encontros nas Colinas Centrais no Foundry (Arco 1)

Guia da macro `a1-encontros-colinas.js` (Foundry v14, sistema Tormenta20 do Vizael 1.6.x). Igual às outras: macro do tipo **Script**, colar, rodar uma vez como Mestre. Tudo vai para pastas **FdT · Arco 1 · Colinas Centrais**. Rodar de novo pergunta antes e recria só o que tem a marca `a1colinas`.

Substitui, na prática, a tabela simples que a `av45-plano-5-colinas.js` cria (as duas podem coexistir).

## O que é criado

| Tipo | Conteúdo |
|---|---|
| Habitantes | Tolbert, Abner, Quimby, Gormaggor, Raguria, Arlo, Mungo Joe, Jonid (Homem-Bode), Ebenezer, Dona Erneshia, o Diabo das Colinas, as sereias Shanamarie, Shaylyne e Shadolenn, Cletus Rigby, Nada Mais que a Verdade Reston, o Ladrão de Rabos, Elmer e Fortunata |
| Do compêndio | Recruta Purista Caipira (8 no encontro) e Aparição da Mina de Duas Pedras |
| Cães das Colinas | Ayla, Ignis, Kiki, Rexthor (com a ficha do duelo do livro), Arius, Chèvre e Timm |
| Itens | Os 5 produtos fajutos do Quimby (meio preço), Ensopado de Raguria, Moeda-Alma de Tolbert, Metal Arco-Íris (unidade) |
| Tabelas | Encontros nas Colinas Centrais (detalhada), Encontros Especiais, Perseguições nas Centrais, Histórias do Herói Louco, Coisas que Ofendem Cletus Rigby |
| Diário | Guia, uma página por encontro (20 + 6 especiais), Perseguições nas Centrais e três handouts: panfleto purista, pergaminho do Evento e as histórias do Herói Louco |
| Macros | Encontro do Dia, Testes dos Encontros, Bênçãos e Maldições, Perseguição ao Diabo, Alquimia do Quimby |

## Na mesa

- **Encontro do Dia:** role ao sair do Forte, ou uma vez por dia de viagem.
  - Mostra ao Mestre (sussurro) o encontro com resumo, mecânica, links para a ficha e a página do diário.
  - Conta os dias e guarda quem já foi visto. Locais e NPCs parados (Duas Pedras, o Museu, Gormaggor, as sereias, Elmer) ficam **descobertos**: rolar de novo vira resultado inviável, que rola os Cães das Colinas (dá para desligar).
  - Depois que o Diabo é avistado, ele aparece junto em todo resultado par.
  - Se Fortunata contou do Cemitério, a próxima rolagem cai nele.
  - Opcional: põe os tokens ocultos perto do primeiro token selecionado.
  - A **Busca pelo Templo** (Templo do Vácuo) chama esta macro a cada dia.
- **Testes dos Encontros:** selecione quem testa.
  - Duelo musical com Tolbert (3 testes opostos; vence quem ganhar 2). A vitória põe a Moeda-Alma na ficha; a derrota marca a alma perdida.
  - Concurso de tiro com Arlo, com desempate subindo a CD.
  - Doses do Mungo Joe por personagem (CD sobe por dose, PM temporário, enjoado, inconsciente na 2ª falha). Há a opção de virar o dia.
  - Sereias: o canto para cada selecionado e a abordagem (distração, Hipnotismo ou Sono, furto com sugestão de item).
  - Ladrão de Rabos, Fortunata (conta as derrotas dela e entrega o segredo, o Cemitério e as histórias), Nada Mais que a Verdade, cabana e ofensas de Cletus, sonho de Elmer e a traição de Chèvre e Timm.
- **Bênçãos e Maldições:** aplica nos selecionados.
  - Bênção e Perdição de Abner (uma anula a outra), maldição de Raguria (–5 em tudo, metade do deslocamento), ensopado, Curar Ferimentos do Homem-Bode.
  - Noites no Cemitério: a 1ª dá +1 por uma semana, a 2ª soma +1 permanente na base. A Moeda-Alma enterrada dá +1 noutro atributo.
  - Ebenezer: os +20 a gastar e as 5 rerrolagens do Mestre, com um lembrete na aba de efeitos.
- **Perseguição ao Diabo:** selecione quem persegue e comece. Cada rodada rola o evento das Centrais e o Atletismo de todos (com o ajuste de deslocamento), aplica obstáculos, atalhos, 1d6 de dano por falha e o cansaço. Para quando alguém alcança o Diabo ou ele abre 50 quadrados. Dona Erneshia soma +4.
- **Alquimia do Quimby:** com o token do usuário selecionado (e os alvos mirados), rola o 1d6. Par funciona; ímpar faz o dano cair no usuário, o bálsamo ferir e a essência drenar PM.

## O que foi inferido (não está no livro)

- **Fichas:** só o livro dá números para Tolbert (Atuação +15), Arlo (Pontaria +10), as sereias (+10), o Diabo (+17), o Ladrão (Percepção +10), Fortunata (Jogatina +15), Nada Mais que a Verdade (Int +4) e Rexthor (o duelo). PV, Defesa e o resto são palpites só para ter token. Gormaggor e Cletus são fortes de propósito.
- **Duelo de Tolbert:** o livro diz "três testes opostos". A macro dá a vitória a quem ganhar dois.
- **Sereias:** a distração usa Atuação contra Intuição e o furto usa Ladinagem contra Percepção (–5 se distraído; automático se a vítima dormiu ou ficou fascinada).
- **Sonho de Elmer:** o livro não dá CD. A macro sugere 20.
- **Ensopado:** soma +1 na CD geral da ficha (o sistema não separa a CD arcana). Desligue o efeito para habilidades que não são magia arcana.
- **Moeda-Alma enterrada:** o livro diz "como se tivesse passado a noite lá", sem dizer se é permanente. A macro cria um +1 sem duração.
- **Diabo na perseguição:** tenta todos os atalhos e cansa como os PJs (Constituição 3).
- **Resultado inviável:** só repetir um local ou NPC parado. Repetir um viajante não é inviável.

## Limitações

- **Não foi testado num Foundry rodando.** Foi conferido contra o código do sistema e rodou numa simulação com todas as opções das 5 macros. Os ícones do sistema foram verificados.
- A Tabela 8–1 (dinheiro e itens por ND) não está no sistema. Duas Pedras e o pote de ouro só dizem o que rolar.
- O furto das sereias só sugere o item: o Mestre tira da ficha.
- Recrutas e aparição vêm do compêndio `tormenta20.ameacas`; sem ele, não são criados.
