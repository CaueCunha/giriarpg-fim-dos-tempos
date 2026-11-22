# Aventura 2 no Foundry: "Eu Fui um Lefou Adolescente"

Guia da macro `av2-lefou-adolescente.js` (Foundry v14, sistema Tormenta20 do Vizael 1.6.x).

## Instalar

1. No Foundry, como Mestre: Barra de Macros › nova macro › tipo **Script**.
2. Cole o arquivo inteiro e execute uma vez.
3. Tudo aparece em pastas chamadas **FdT · Av2 · Lefou Adolescente** (Atores, Itens, Diário, Tabelas, Macros).
4. Rodar de novo pergunta antes e recria tudo. Só apaga o que tem a marca da Av2.

O Foundry precisa estar em **português**: os aprimoramentos de resistência (Kerok, Ralphus, Garotinho Assustado) procuram as perícias pelos nomes "Fortitude", "Reflexos" e "Vontade".

## O que é criado

| Tipo | Conteúdo |
|---|---|
| Ameaças | Chupacabra da Tormenta (com Tylora), X'illirienn, Bhuluk, Enxame de Insetos, Gronko, Gaspar, Zardu, Cópia Ilusória de Zardu |
| Ator de apoio | **Espetáculo de Prodígios e Horrores**: Um de Nós!, correntes rubras, Redefinição de Caminhos, chamas do palco, zumbido das colmeias, pesos de ferro, tatuagens de Noirax e as 6 guloseimas de Gronko |
| Itens para PJs | Parceiros (Vyrda, Híbridos, Plateia, Gaspar veterano, Mabel veterana), Seringa de Vyrda, Bênção de Kerok, Segredo de Ralphus, Sopa LeBlanc, 6 Bolas de Cristal, Relógio Parado |
| Diário | Guia do Mestre, As Cinco Tendas, handouts (Rima, Carta de Syvarian, Página do Diário) e Desfecho |
| Tabela | Redefinição de Caminhos (1d6) |
| Macros | Automação, Um de Nós!, Teste do Circo, Redefinição de Caminhos, Convencer Gaspar, Mil Faces, Enxames de Bhuluk |

Os parceiros e a poção são copiados dos compêndios do sistema, então vêm com os efeitos de iniciante, veterano e mestre que o sistema já tem.

## Na mesa

- **Antes de cada atração:** rode **Um de Nós!** (rola Vontade CD 15 para os tokens selecionados ou para todos os PJs na cena e marca o menor resultado entre os que falharam).
- **Ilusão ou Realidade:** a macro **Teste do Circo** tem as situações prontas (colmeias, insanidade do chupacabra, pesos, bombas de Zardu, Buraco/Palhaço, guloseima, plateia). Ela soma +5/–5, Kerok (+5), Sopa LeBlanc (–2) e Ralphus (+5), e tira os PM sozinha quando o efeito pede.
- **Ligue a Automação** no começo da sessão. Ela vale até recarregar a página e só roda no computador do Mestre. Ela cuida de:
  - **Bhuluk:** todo dano cai pela metade e o bônus de insetos perde 2. O recurso "Insetos" soma direto na Defesa (16 → 22).
  - **Tylora:**
    - Cada dano no chupacabra rola 1d6. Um resultado 1 fere Tylora; o segundo 1 derruba Tylora e liga a Fúria (+2 em ataque e dano).
    - No início do turno do chupacabra, o alvo que você estiver **mirando** recebe a penalidade em perícias (1d6–1, ou 1d4–1 com Tylora ferida) e já rola Fortitude CD 15 contra o veneno.
  - **Drenar Sangue:** no início do turno do chupacabra, quem estiver com a condição **agarrado** perde 1d6 PV. O chupacabra ganha esse valor em PV temporários.
- **Mil Faces:** com Zardu na cena, rode a macro para esconder Zardu e criar 4 cópias. Quando uma cópia sofrer dano, selecione o token dela e rode de novo. Quando sobrar uma, Zardu toma o lugar dela.
- **Enxames de Bhuluk:** rola 1d4+1 e coloca os enxames em volta do token dele.
- **Convencer Gaspar:** selecione o PJ que argumenta. A macro rola a perícia social dele contra a Enganação de Zardu e conta as vitórias no recurso da ficha de Gaspar. Na 3ª vitória, o token de Gaspar vira aliado.

### Botões dos cards

- **Condições:** Caído, Ofuscado, Pasmo, Enjoado, Agarrado e Confuso aparecem como botões no card da habilidade.
- **Em chamas e engolido:** "Incendiado (em chamas)" e "Engolido por Gronko" rolam o dano sozinhos no início do turno da vítima.
- **Perda de PM:** nas rolagens de PM (insanidade, colmeias, chicote), **Aplicar Dano** tira PM e **Aplicar Cura** devolve. É assim que o sistema trata o tipo "curapm".
- **Guloseimas:** mire o PJ e clique em Aplicar Cura ou no botão do efeito. Valkaria de Marzipã e Olhinho do Amor duram até o fim da cena.

## O que foi inferido (não está no livro)

- **Insanidade do Chupacabra:** o livro dá só a CD 14. Usei **1d4 PM**; o lefeu mais fraco do Livro Básico causa 1d6.
- **Enxame:** o livro diz "Des 14"; usei Des 2 e Defesa 0.
- **Mordida do chupacabra:** o livro não dá o tipo de dano; usei perfuração.
- **Retratos:** usei os do sistema mais parecidos (lobo, ogro, maníaco lefou, necromante, besouro aberrante). X'illirienn e Bhuluk ficaram com o placeholder; troque pelos ícones do Arco 2 que você tem no PC.
- **Tylora:** não tem ficha. Ela existe como recurso e itens dentro do Chupacabra.

## Limitações conhecidas

- **Não foi testado num Foundry rodando.** A macro foi conferida contra o código do sistema (`master` de out/2026) e rodou sem erro numa simulação.
- **Bug do sistema que pode afetar os cards:** em `module/documents/item.mjs:1072`, o sistema percorre `CONFIG.statusEffects` com `for...of`. Se o card de uma habilidade não abrir, o problema é esse (ele afeta qualquer item, não só os da Av2). Teste usando uma habilidade antes da sessão.
- **Dano contínuo sem tipo:** o sistema tira o tipo de dano do "dano contínuo" quando cria o efeito. O fogo de "em chamas" e o ácido de "engolido" chegam como dano genérico, então RD contra fogo ou ácido precisa ser descontada à mão.
- **Drenar Sangue:** a automação considera que **qualquer** criatura agarrada está presa no chupacabra. Isso só vale na luta dele.
- **Coisas que ficam à mão:**
  - Regurgitar: recarrega quando Gronko usa Engolir (há um recurso na ficha para controlar).
  - Digestão Insana: uma vez por cena por personagem.
  - Anatomia Insana: rola 1d4; no 1, ignora o extra do crítico.
  - Golpe Avassalador: multiplique o 1d6 pela distância se a vítima bater em algo.
  - Escudo de Insetos.
- **Apagar a Bênção de Kerok:** apague-a dos PJs ao sair do circo.
