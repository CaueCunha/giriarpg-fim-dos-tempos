# Especial de Gatal no Foundry (Arco 1, aventura extra)

Guia da macro `a1-especial-de-gatal.js` (Foundry v14, sistema Tormenta20 do Vizael 1.6.x). Igual às outras: macro do tipo **Script**, colar, rodar uma vez como Mestre. Tudo vai para pastas **FdT · Arco 1 · Especial de Gatal**. Rodar de novo pergunta antes e recria só o que tem a marca `a1gatal`.

## O que é criado

| Tipo | Conteúdo |
|---|---|
| Atores | Garbin (a Fada Madrinha disfarçada, com 0 PV), os seis amigos (Halinn, Yrma, Berent, Larsen, Enoa, Nan; o deus de cada um só aparece na biografia do Mestre) e um Gnoll do compêndio para a contingência |
| Itens | Os presentes dos amigos: Flauta Animalizante, Balança Moral, Alev (5 usos), Criadora de Meios (alabarda com 3 rerrolagens), Copo de Ar (5 usos), Truque na Mágica |
| Tabelas | Matérias-primas para Presentes (os 100 objetos, 1d100) e Garbin Agora Parece... |
| Diário | Guia do Mestre, poema de abertura (handout), Garbin e a Oficina, A Lista de Garbin (handout sem os deuses), Fabricação, Então É Gatal (quem é quem), Os Presentes, Contingência e Epílogo, O Que Sobrou na Oficina (handout com os 100 objetos) |
| Macros | Oficina de Gatal, Garbin Muda de Novo, Perseguição aos Gnolls, Usar Presente de Gatal |

## Na mesa

- **Oficina de Gatal:** o primeiro token selecionado faz o teste; os outros selecionados ajudam.
  - **Fabricar:** escolha o amigo, digite os números dos objetos ("3, 17, 45") e a perícia. A macro confere o mínimo de 3 objetos e se algum já foi usado ou estragou.
  - CD 25 +2 por objeto além do terceiro. Tempo de 1h +1h por objeto extra. Horas extras de ajuda viram testes de ajuda a mais (CD 10, +1 e +1 a cada 10 acima), inclusive do próprio artesão.
  - Falhas: a primeira não estraga nada, a segunda estraga um objeto aleatório, falhar por 5 ou mais estraga todos.
  - Conta as horas de cada um e recusa quem não tem mais tempo até a meia-noite. Avisa quando dá meia-noite.
  - **Entregar:** soma +5 por objeto extra e as caixas (combina, espírito gatalino, embrulho). Se fabricação + entrega chegar a 80, o presente do amigo vai direto para a ficha de quem entregou. O deus é revelado só para o Mestre, por sussurro.
  - Também sorteia 3 objetos de inspiração, lista o que sobrou, mostra o relógio e zera a noite.
- **Garbin Muda de Novo:** a cada uso, Garbin é de outra raça (humano idoso, hynne, anão, elfo baixinho e depois cada vez mais forçado). A imagem do ator e dos tokens muda junto.
- **Perseguição aos Gnolls:** a contingência Sem Espírito Gatalino. Cada uso encontra o próximo amigo e uma parte dos objetos espalhados na neve.
- **Usar Presente de Gatal:** com o token do portador selecionado, gasta um uso. A Criadora de Meios perde o martelo, a ponta de lança e o machado, e some no terceiro uso.

## O que foi inferido (não está no livro)

- **Garbin:** PV máximos 20, só para a barra do token. Ele começa com 0.
- **Horas dos ajudantes:** quem ajuda gasta o tempo do presente mais as horas extras. O "relógio" é o de quem mais trabalhou.
- **Perseguição:** o livro diz que perto de cada amigo há "uma parte" da lista. A macro divide os 100 objetos em seis partes, na ordem.
- **Garbin a partir da sílfide:** o livro só dá as quatro primeiras raças e manda "forçar a barra". As outras são sugestões.
- **Fichas dos amigos:** ND 20 e valores altos só para terem token. Eles não lutam.

## Limitações

- **Não foi testado num Foundry rodando.** Foi conferido contra o código do sistema e rodou numa simulação com todas as opções das 4 macros.
- Os poemas citam o grupo original (Ignis, Arius, Ayla, Rexthor, Kiki). O diário sugere trocar pelos nomes do grupo de vocês.
- O Gnoll vem do compêndio `tormenta20.ameacas`; sem o compêndio, ele não é criado.
