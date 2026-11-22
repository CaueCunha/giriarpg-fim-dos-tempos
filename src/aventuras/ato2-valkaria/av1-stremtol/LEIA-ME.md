# Arco 2 · Aventura 1 · Os Aventureiros de Stremtol

Arquivo: `a2-av1-stremtol.js` (Foundry v14, Tormenta20 1.6.x). Crie uma macro do tipo Script como Mestre, cole o arquivo inteiro e execute. Rodar de novo apaga e recria só o que tem a marca `a2av1`.

## O que é criado

**Atores**
- Madame Margebell (ND 7, ficha vinculada): magias de frade de Khalmyr (CD 28), Cólera Divina, Dom da Verdade, Erudição, Fé e Razão. Efeitos para ligar: Cólera Divina, Oração e "Protegida pelo campo dos anjos".
- Anjo Aprisionado (ND 5, voo 18): coloque **quatro**. A maça tem o aprimoramento Rasante (+4d6 de luz).
- Servo da Escola (ND 1/2): ficha do mercador adaptada, como o livro sugere.
- Mata-Malvados (neutros, fichas vinculadas), só para a contingência de combate: Torzogh (com o efeito Fúria), Ingwi (Ataque Furtivo como aprimoramento, Veneno), Thurab (Espada Solar como aprimoramento) e Nyrimm.
- Vizinhança de Stremtol (pistas): ator de apoio que não vai para o mapa. Cada item é uma casa com todas as pistas e CDs.

**Itens de prova:** Dossiês do Aluno, Óculos de Margebell, Pintura Subliminar e Anotações de Madame Margebell.

**Diário (8 páginas):** Guia do Mestre; Fases 0 a 2 (guarita, Esqueleto Gordo, Mata-Malvados e linha do tempo); Fase 3 (Stremtol e pistas por casa); Handout dos Dossiês do Aluno; Respostas em Stremtol (as quatro abordagens e as contingências); A Escola (salas, quadros e regras das pinturas); Punindo os Bagunceiros (discurso, encontro, história de Margebell e o que realmente aconteceu); Desfecho, provas e pagamento.

**Macros**
- **Av1 · Investigar Stremtol:** escolha a casa e a perícia. A macro rola para os tokens selecionados, ou usa um resultado que você digitar, e sussurra para o Mestre as pistas que a CD alcança. Também mostra quantas pistas ainda faltam com aquela perícia. "Ofício" usa o melhor Ofício do personagem; "Inteligência" usa o atributo.
- **Av1 · Pinturas Subliminares:** a cada sala com quadros, selecione quem olhou. A macro faz Vontade CD 15 (+2 por teste anterior do mesmo personagem; +5 para quem você marcar como imune a efeitos mentais). Nas três primeiras falhas manda um bilhete secreto diferente ao dono do personagem. Depois avisa a perda de habilidades. Marque "sem habilidades" quando o personagem já não tiver nenhuma, e a macro passa aos estágios finais (uma ação por rodada, paralisado, concorda com Margebell). Tem a opção de zerar a contagem.
- **Av1 · Infiltração na Escola:** Furtividade dos selecionados contra os servos (juntos com +12 se o grupo já foi visto, ou um por um com +5). Se alguém for visto, rola em quantas rodadas Margebell chega.

Lei & Ordem continua no ator e na macro da Aventura 0. As provas vão na opção "Provas entregues".

## O que foi inferido (não está no livro)
- O Servo da Escola usa o mercador do Guia de NPCs sem a besta, com clava, como o livro manda. Os valores de perícia vêm dessa ficha.
- A RD 4 e a resistência a magia +5 de Torzogh, a RD de ácido e fogo de Thurab e a evasão de Ingwi foram lançadas como texto e resistências da ficha. A resistência a magia não tem campo próprio, então só aparece no texto.
- O dano de veneno de Ingwi é perda de vida sem tipo. O Rasante do anjo e a Espada Solar são aprimoramentos marcados na janela de rolagem, não automáticos.
- O campo dos anjos é um efeito informativo para você ligar e desligar. O Foundry não bloqueia movimento nem alvos sozinho.
- A macro de pinturas não sabe quais habilidades o personagem tem. Ela diz a ordem do livro e você marca quando acabarem.
- A macro de investigação mostra todas as pistas alcançadas; o livro diz que cada teste revela uma informação, e bons testes podem revelar mais. Você escolhe quantas contar.

Não foi testado num Foundry rodando. Foi validado com sintaxe, conferência de ícones e uma simulação das três macros.
