# Arco 2 · Aventura 6 · Baile de Debutantes Sangrento

Arquivo: `a2-av6-baile-debutantes.js` (Foundry v14, Tormenta20 1.6.x). No módulo, o conteúdo vem nos compêndios do Ato 2. Como macro avulsa: crie uma macro do tipo Script como Mestre, cole o arquivo inteiro e execute. Rodar de novo apaga e recria só o que tem a marca `a2av6`.

## O que é criado

**Ameaças:**
- Lakshrimi, Replicoide Duquesa Alfraye (ND 10, construto, RD 5):
  - adaga e canhão peitoral com Ataque Furtivo +5d6 marcado na rolagem;
  - Armamento Embutido (botão de surpreendido) e Convidar Amigos;
  - Gravação Estridente (atordoado), Mão a Jato (agarrado) e Sopro Cáustico (enjoado);
  - bônus de "passar-se por Alfraye" e "no palácio" marcados na rolagem.
- Um replicoide convidado (ND 7) para cada convidado de honra. O token tem o nome do convidado. Cada um tem um armamento embutido:
  - canhão peitoral: Drekaag e Axel;
  - mandíbula de ferro: Kalyon e Melynna;
  - mão a jato: Angeliese e Irludde;
  - granada ocular: Archibald;
  - sopro cáustico: Loranth.

**Apoio (sem ficha no livro):** a Duquesa Alfraye, os oito convidados de honra (com as atividades de cada um na bio) e os detetives Ulnsariann e Throgarimm.

**Itens:**
- Aura de Paz.
- As nove Máscaras Alegóricas da chapelaria, com o efeito.
- Bênção da Capela de Marah, Ateliê da Inspiração, Calor do Coração e o Batatino da Estufa.
- Instrumento Abençoado do Palácio.
- Provas: Pedaço do Corpo Metálico de Lakshrimi, Fragmento de Cristal Rosado e Depoimento da Duquesa Alfraye.

**Tabelas:** Vítimas do Baile (1d8), Regras Quebradas (1d10), Salas Mágicas (1d4) e Saída da Sala Mágica (1d20).

**Diário (9 páginas):** Guia do Mestre; os detetives e a duquesa; becos sem saída; o que realmente aconteceu; o Baile da Primavera; o Palácio do Coração Florido (todos os cômodos, conexões e passagens); banho de sangue; confronto; desfecho, provas e pagamento.

**Macros**
- **Av6 · Baile da Primavera (cenas e vítimas):** conta as cenas e, a cada duas, sorteia a vítima e a regra quebrada só para o Mestre. Segue as regras do livro:
  - Drekaag é sempre o primeiro;
  - Alfraye só morre se sair duas vezes;
  - Loranth sempre usa drogas;
  - "faz sexo" sorteia o par (brincadeira cruel com Archibald);
  - vítimas e regras não se repetem.

  A macro também registra quem foi substituído (com o link do replicoide). "Alfraye encerra o baile" acaba com a Aura de Paz e tira os efeitos do palácio.
- **Av6 · Passagens Secretas:** um personagem procura a passagem (Investigação, Nobreza ou Religião CD 30, +5 se viu alguém usar e +2 se é devoto de Marah). Em seguida a macro sorteia a passagem do cômodo, a sala mágica e a saída (1d20). Também sorteia a passagem de um convidado, sem teste.
- **Av6 · Cômodos do Palácio:**
  - átrio (Carisma CD 15, 3 PM temporários);
  - máscaras;
  - efeitos de lugar do salão principal, da sacada e do lavabo;
  - salão de música (Atuação +5 contra CD 25);
  - galeria (Sabedoria CD 15);
  - capela, ateliê, santuário (PM temporários iguais ao nível) e calor do coração (Carisma CD 10 dos dois).
- **Av6 · Adega do Palácio:** +5 em Diplomacia enquanto bebe e Fortitude CD 15 com +2 por teste anterior. Quem falha fica embriagado e depois bebum. A manhã seguinte limpa os efeitos.
- **Av6 · Cassino dos Sentimentos:** um teste de Jogatina para cada apostador selecionado. Os perdedores pagam a aposta (inspiração, coração, coragem ou talento) e o vencedor recebe o efeito inverso.
- **Av6 · Investigar no Baile:**
  - notar um replicoide (Intuição CD 35, +2 por detalhe);
  - examinar a falsa Alfraye (contra Enganação +34);
  - seguir um convidado (contra Percepção +10);
  - ver se os nobres despistam a vigilância (+20);
  - quanto tempo o grupo demorou para chegar à sala mágica.
- **Av6 · Lakshrimi em Combate:**
  - Gravação Estridente nos alvos: 6d12 psíquico, metade com Vontade CD 32, e atordoado;
  - lista dos replicoides que podem ser convidados;
  - autodestruição.

## O que foi inferido (não está no livro)
- Os convidados, Alfraye e os detetives não têm ficha. Os números existem só para o token. As imagens são ícones de raça do sistema (Drekaag usa o humano) e a de Lakshrimi e dos replicoides é o golem de ferro, até haver arte da aventura.
- O livro deixa ao Mestre o armamento embutido de cada replicoide. A distribuição acima é deste módulo.
- O replicoide tem Int "–" no livro. Aqui fica 0, com uma nota.
- O cabeçalho do replicoide diz Percepção +7, mas as perícias dizem +9. Ficou +9.
- Na biblioteca, o livro cita um "cofre das artes (m3)", que não existe. A macro usa o ninho de prazer (m3) e o diário avisa.
- Na sacada, o livro diz "santuário da esperança (m5)". A macro usa o santuário (m4).
- O +5 em Ofício do ateliê e a escolha do poder concedido da galeria ficam no texto. O sistema tem várias perícias de Ofício.
- Embriagado e bebum devolvem a penalidade em Diplomacia com um bônus igual, porque as bebidas mágicas não penalizam Diplomacia.
- No cassino, o vencedor recebe o efeito de uma aposta perdida. A regra de "multiplicar o valor da aposta" fica a critério do Mestre (a macro informa a razão entre os resultados).
