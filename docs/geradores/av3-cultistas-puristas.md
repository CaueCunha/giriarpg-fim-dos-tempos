# Aventura 3 no Foundry: "Cultistas Puristas Devem Morrer"

Guia da macro `av3-cultistas-puristas.js` (Foundry v14, sistema Tormenta20 do Vizael 1.6.x). Funciona igual à da Aventura 2: macro do tipo **Script**, colar, rodar uma vez como Mestre. Tudo vai para pastas **FdT · Av3 · Cultistas Puristas**. Rodar de novo pergunta antes e recria só o que tem a marca da Av3.

## O que é criado

| Tipo | Conteúdo |
|---|---|
| Ameaças | Lorelei Wulff (ND 4, com PM, magias e lampião), Soldado de Lorelei (ND 2), Guarda de Dornbach (ND 1/2), Aldeão de Dornbach (ND 1/4), Zagar "Hermann" (ND 1/4, neutro), Máquina de Purificação |
| Ator de apoio | **Aldeia de Dornbach**: armadilha de alçapão, jantar com Poção de Sono, infiltração, busca por Andrisse, ataque frontal |
| Itens | Poção de Sono ×6 (do compêndio), Lampião Mecanomágico (T$ 300 em matéria-prima), Panfleto de Ódio |
| Diário | Guia do Mestre, aviso do quadro, Dahllan Daninhas (o que dizem e o que é verdade), construções, linha de tempo hora a hora, ritual e desfecho |
| Tabela | Demais Habitantes de Dornbach (1d8) |
| Macros | Demais Habitantes, Ritual de Purificação, Infiltração em Dornbach, Lampião Mecanomágico |

## Na mesa

- **Combatentes de Dornbach:** o livro recomenda a Alternativa 2. Lorelei e os soldados têm na aba de efeitos *Ajudantes de Dornbach: dois (+5)* e *um (+2)*. Ligue o de +5 no início; quando um ajudante cair, troque para o de +2; com os dois caídos, desligue.
- **Soldados:**
  - *Ódio Puro* (+5 Vontade) já vem ligado.
  - O +2 de dano contra não humanos é um aprimoramento marcado na janela de ataque.
  - *Lutar em Formação* (+1 ataque e Defesa) é um efeito para ligar quando os dois estiverem lado a lado.
- **Resistências a magia divina (+5) e a Tormenta (+10):** de Lorelei e dos soldados, são aprimoramentos marcados na rolagem de resistência.
- **Demais Habitantes:** rode no fim de cada rodada. Começa pelo último personagem na iniciativa e vai subindo. Rola a tabela, faz o teste do alvo, aplica o dano já descontando RD e marca caído, enjoado ou desprevenido. O "filho corajoso" só sai uma vez.
- **Ritual de Purificação:** cada vez que roda, avança uma rodada (1 a 5) e posta a narração. O botão *Interromper* zera o contador.
- **Infiltração:** selecione quem está se esgueirando.
  - A macro rola Furtividade, Enganação, Atletismo ou Adestramento contra a CD certa: 15 +1 por personagem extra, ou 20 para os cães.
  - Ela conta o teste estendido (5 sucessos antes de 3 falhas).
- **Lampião:** mire os não humanos. A macro rola Vontade CD 20, marca quem ficou hipnotizado e tira a marca de quem resistiu naquela rodada.
- **Zagar** entra como neutro e com o efeito *Desajeitado (Des –3)* ligado. Os valores dele batem com os entre parênteses do livro. Desligue o efeito se ele se acostumar ao corpo.

## O que foi inferido (não está no livro)

- **Máquina de Purificação:** o livro não dá Defesa nem PV. Usei Defesa 10 e 40 PV como sugestão.
- **Torgo e as Dahllan Daninhas:** não têm ficha no livro, então não foram criados.
- **Ajudantes:** a Defesa e as resistências deles são as das fichas de guarda e aldeão, como o livro manda.

## Limitações

- **Não foi testado num Foundry rodando.** Valem as mesmas ressalvas da Av2, incluindo o bug dos cards do sistema e o idioma em português para os aprimoramentos de resistência.
- **Coisas que ficam à mão:**
  - A CD 19 da Poção de Sono e as CDs da armadilha de alçapão aparecem só no texto.
  - Empurrão do Soco de Arsenal.
  - Os 50% do filho corajoso.
