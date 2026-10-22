# Arco 2 · Aventura 3 · Fuga da Rocha Cinzenta

Arquivo: `a2-av3-rocha-cinzenta.js` (Foundry v14, Tormenta20 1.6.x). No módulo, o conteúdo vem nos compêndios do Ato 2. Como macro avulsa: crie uma macro do tipo Script como Mestre, cole o arquivo inteiro e execute. Rodar de novo apaga e recria só o que tem a marca `a2av3`.

## O que é criado

**Ameaças:** Prisioneiro Bandido (ND 1), Carcereiro Comum (ND 3), Chefe do Corredor (ND 4), Turba de Prisioneiros (ND 6, bando Grande), Nerisha (ND 5, magias do sistema), Carcereiro Stoke (ND 7), Rakkas (ND 7), o Benfeitor (ND 8), Jaydill (ND 8) e o Dejeto Vivo (ND 6, *Ameaças de Arton*). Estocada nos Rins, Nas Costelas, Crimes Tatuados, Mau Cheiro, Charuto, Um Dois e Investida Poderosa têm botões de condição no card. Ataque Furtivo, Assassinar e Ha, ha, ha, ha (+2 a +8) são aprimoramentos das armas.

**Apoio (sem ficha no livro):** Farhuk ("Majid"), Tryphne (Religião +7, Cura +12, usados pela macro) e Bartolakk.

**Itens:**
- Limitações da Rocha Cinzenta, como efeito, e o Implante de Cristal Rosado.
- Mensagem de Farhuk e Mapa da Rocha Cinzenta.
- Provas: Pergaminhos da Cirurgia, Cristal Rosado e Documentos da Prisão.
- Parceiros copiados do compêndio do sistema: Cremildhe, Imnek, Borislav, Sakrizi, Yngri, Jaydill, Tryphne e Farhuk.

**Tabela:** Arquétipos e Nomes de Prisioneiros.

**Diário (9 páginas):** Guia do Mestre, Fases 0 e 1 (o caso e Bartolakk), Limitações, Fase 2 (cotidiano, locais e personalidades), o Feudo do Benfeitor, a Cirurgia, Fase 3 (os planos de fuga), Túnel e Corrida para a Liberdade, Fase 4 (desfecho, provas, pagamento e parceiros).

**Macros**
- **Av3 · Rocha Cinzenta (entrar/sair):**
  - Ao entrar, zera os PM e liga as limitações nos selecionados: voo, escalada e natação ficam em 0.
  - Ao sair, desliga as limitações.
  - Também marca e tira o implante. Quem tem implante não sofre as limitações.
- **Av3 · Cirurgia de Tryphne:**
  - Religião CD 15 (com falha, a Fortitude do paciente cai uma categoria).
  - Cura CD 25 por paciente.
  - Fortitude CD 20 com os quatro resultados (1 natural, falha, sucesso, 20 natural). A macro aplica PV, inconsciente, sangrando e debilitado conforme o resultado e põe o implante.
  - Opção dos pesadelos da mesa original.
- **Av3 · Corrida para a Liberdade:**
  - Primeiro clique: sorteia o evento da rodada.
  - Segundo clique: resolve o evento com a abordagem escolhida, aplicando os efeitos na Prontidão.
  - Cobre discrição, perícias alternativas (cada uma só uma vez), o pátio (todos testam, com a luz mágica) e a repetição dos eventos 2 e 6.
  - Acompanha 7 sucessos e 3 falhas. Na falha total, os selecionados ficam com 0 PV.
- **Av3 · Escavando um Túnel:**
  - Cada clique é uma semana.
  - Selecione o escavador e quem ajuda (bônus dobrado). Marque como alvo quem oculta a obra.
  - Acompanha CD +2 por imprevisto, desconfiança, descoberta e desabamento (dois testes de Reflexos).
- **Av3 · Amigos no Corredor:** 2d6 no herói que errou um prisioneiro, uma vez por rodada de combate.
- **Av3 · Prisioneiro Improvisado:** arquétipo e nome, cada um sorteado na tabela.

## O que foi inferido (não está no livro)
- Farhuk, Tryphne e Bartolakk não têm ficha de combate no livro. Os números existem só para o token e a macro (Religião e Cura de Tryphne são do livro).
- O efeito de limitações não zera o máximo de PM (o sistema não deixa). A macro zera os PM atuais ao entrar, e o Mestre não deve deixar descansar PM lá dentro.
- O Medo de Altura do Benfeitor é um efeito para ligar (–2 em ataques e perícias, como abalado).
- Na Turba de Prisioneiros e no Dejeto Vivo, o token tem 2×2.
