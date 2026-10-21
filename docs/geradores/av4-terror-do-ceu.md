# Aventura 4 no Foundry: "O Terror que Veio do Céu"

Guia da macro `av4-terror-do-ceu.js` (Foundry v14, sistema Tormenta20 do Vizael 1.6.x). Funciona igual às das Aventuras 2 e 3: macro do tipo **Script**, colar, rodar uma vez como Mestre. Tudo vai para pastas **FdT · Av4 · Terror que Veio do Céu**. Rodar de novo pergunta antes e recria só o que tem a marca da Av4.

## O que é criado

| Tipo | Conteúdo |
|---|---|
| Ameaças | Bandoleiro da Harpia (ND 1/2, serve também de artilheiro, timoneira e capanga), Cão do Inferno (ND 2, Grande), Torgo (ND 5), Canhão de Fogo (objeto, 40 PV, RD 10) |
| Atores de apoio | **Harpia, o Gog'magogue**: luz cegante, bater das nadadeiras, canhão, escadas de corda e regras a bordo. **Fazendas Gallobalt**: autópsia das cabras, plantação, testemunhos, implante de Vadrinne |
| Itens | Essência Abissal (do compêndio), Implante de Cristal de Vadrinne, Instruções de Syvarian a Torgo |
| Diário | Guia do Mestre, aviso de Nathanael, família Gallobalt, investigação, o ataque, a bordo, a Harpia (com a fala de Torgo), instruções de Syvarian e desfecho |
| Macros | Ataque do Céu, Luz da Harpia, Turno da Harpia, Testes a Bordo, Cirurgia do Implante, Elemental Elétrico (Torgo) |

## Na mesa

- **Ataque do Céu:** rode no começo de cada rodada do ataque. Ela posta o que acontece: luz e cães na rodada 1, escadas e implante na 2, a caminhada de Vadrinne até a 7. O contador fica na ficha da Harpia.
- **Luz da Harpia:** mire os tokens na área e escolha *Cegar*, *Protegeu os olhos* (ofuscado) ou *Saiu da luz*. Bandoleiros e cães são imunes e a macro pula esses tokens.
- **Turno da Harpia:** mire quem está na linha ou no cone e escolha a ação.
  - *Canhão de Fogo* rola Reflexos CD 20, aplica 4d6 de fogo (metade no sucesso) e coloca **em chamas** quem falhou. O fogo rola sozinho no início do turno da vítima.
  - *Bater das Nadadeiras* rola Fortitude CD 20 (–5 se marcar "voando") e aplica 1d6 de impacto em quem falhou e bateu em algo. Os tokens você move à mão.
- **Testes a Bordo:** selecione os personagens e escolha a situação: piso, escada, borda, cordame, queda, túnel, leme ou alcançar a Harpia.
  - A macro tira os 2 da timoneira de quem está desprevenido.
  - Na queda da escada, aplica o dano e marca caído.
  - No piso, marca caído (falha por 5+) e desprevenido (não treinado em Acrobacia).
- **Bandoleiros:** *Ataque Furtivo* (+1d6) é um aprimoramento marcado na janela de ataque. Para os artilheiros, ligue *Cobertura do canhão (+5 Def)*. Quem defende a escada usa a arma *Chute*.
- **Cão do Inferno:** o recurso *Sopro carregado* controla a recarga (gaste ao soprar, devolva com a ação de movimento).
- **Torgo:**
  - *Fúria* é um efeito para ligar (+2 em ataque e dano corpo a corpo).
  - *Olhar Elétrico carregado* e *Fúria (1 por cena)* são recursos na ficha.
  - Quando ele sofrer dano **mágico de eletricidade**, não aplique o dano: rode **Elemental Elétrico**, digite o valor e ele cura a metade. Até o fim do próximo turno, marque *Carga elétrica* na pancada e use a rolagem "Com carga elétrica" do Olhar.
- **Cirurgia do Implante:** selecione quem opera. A macro conta 3 sucessos antes de 3 falhas (Cura CD 25) e, na falha, rola os 1d4+1 dias de espera.

## O que foi inferido (não está no livro)

- **Canhão de Fogo:** o livro dá 40 PV e RD 10, mas não a Defesa. Usei 10.
- **Cirurgia:** o livro diz "3 sucessos"; usei o limite padrão de 3 falhas do teste estendido.
- **Alcançar a Harpia:** o livro não dá CD; a macro usa 15 e avisa no chat.
- **Poção de relâmpago de Torgo:** sem CD no livro. Sugeri a CD 20 dele. O dano (6d6) é o da magia *Relâmpago*.
- **Autodestruição:** 8d6 em raio de 6m, sem tipo de dano nem teste no livro. A rolagem sai sem tipo.
- **Capangas da nave:** o livro não dá ficha; use o Bandoleiro.
- **Retratos:** bandido, cão do inferno e golem de ferro do sistema. A Harpia e o canhão usam ícones de magia.

## Limitações

- **Não foi testado num Foundry rodando.** Valem as mesmas ressalvas das outras aventuras, incluindo o bug dos cards do sistema.
- **RD 10/mágico dos cães:** o sistema não tem RD "exceto mágico". A ficha usa RD 10 geral; contra ataques mágicos, devolva os 10 PV à mão ou use a opção de ignorar RD.
- **Elemental Elétrico** fica com você: o sistema não sabe se a eletricidade é mágica, então não cura Torgo sozinho.
- **Coisas que ficam à mão:**
  - Ataques à distância no cone das nadadeiras sofrem –5.
  - O canhão fica inativo por 1d3 rodadas quando um artilheiro cai (há um recurso no ator do canhão).
  - Armas de duas mãos sofrem –2 dentro da nave.
  - Ver a forma da Harpia exige 20 natural em Percepção.
