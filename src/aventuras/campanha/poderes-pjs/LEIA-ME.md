# Poderes dos PJs · revisão e automação no Foundry

Arquivo: `fdt-poderes-pjs.js`. Foundry v14 com o sistema Tormenta20 do Vizael (1.6.x). TAG `fdtpoderes`. Serve para a campanha inteira.

Revisão dos poderes de Tariq, Rak, Hannah, Felix, Elyas e Balthazar, feita sobre as fichas exportadas em out/2026 e conferida no código do sistema 1.6.4. As fichas ficam no mundo do Mestre, então o módulo não as substitui. Em vez disso, uma macro acha os defeitos pelo nome do poder e corrige cada um na ficha. Por isso ela também serve para personagens novos com os mesmos poderes.

## O que o gerador cria (pasta "FdT · Poderes dos PJs")
- **PJs · Corrigir poderes**: lista o que está quebrado, corrige o que estiver marcado, manda o relatório ao Mestre e permite desfazer.
- **PJs · Mau Cheiro**: a habilidade do trog. Todos em 9 m (menos trogs) testam Fortitude contra veneno (CD 10 + metade do nível + Con). Quem falha fica enjoado por 1d6 rodadas; quem passa fica imune por um dia. Presentes de Ssaazzaas soma +5 sozinho.
- **PJs · Rolar de novo**: Sortudo (3 PM, qualquer teste, uma vez por teste) e Sorte Salvadora (1 PM, testes de resistência). Escolha o teste entre os 8 últimos do personagem no chat.
- **PJs · Automações**: Temeroso e Provocação Petulante (veja abaixo). Fica ligada entre sessões: o módulo religa ao abrir o mundo.
- **Armas naturais modelo**: Mordida (1d6, perfuração) e Cauda (1d6, impacto).
- **Diário "FdT · Poderes dos PJs"**: como usar, por que os poderes quebravam, e uma página por PJ com cada poder.

## Passo a passo
1. Importe a Campanha do módulo (ou cole o gerador numa macro Script e execute).
2. Selecione os tokens dos PJs (sem seleção, a macro pega todos os PJs que têm jogador) e rode **PJs · Corrigir poderes**. Ela mostra cada problema com uma caixa marcada. Na Resistência Elemental, escolha o elemento (a macro sugere o que está digitado à mão na ficha).
3. Rode **PJs · Automações** e marque "Ligado".
4. Para voltar atrás, rode a macro de correção e escolha **Desfazer**. Antes de mudar, ela guarda uma cópia de cada poder na ficha (flag `world.fdtPoderesBackup`). Só a última correção de cada ficha pode ser desfeita.

## O que a correção faz
| Problema | Correção |
|---|---|
| Mordida/Cauda com o ataque dentro do poder (sem Fúria, passos e crítico; Cauda sem Força) | Cria a arma natural; o poder fica só com o texto. Cópias com bônus embutidos à mão são apagadas |
| Resistência Elemental com `resistencias.???.value` | `resistencias.<elemento>.bonus` +10; zera o valor digitado à mão no mesmo elemento |
| Presentes de Ssaazzaas sem veneno +5 | Caixa +5 na Fortitude |
| Fraquezas Ofídicas, Ossos Frágeis sem efeito | `danoPorDado` em frio/impacto; caixa −5 contra Música |
| Visão nas Trevas sem efeito | Visão no escuro |
| Fúria com duração de 10 rodadas | Duração especial (até parar, no máximo a cena) |
| Fúria Bestial no formato antigo | Efeito no card da Fúria: armas naturais +2 passos e crítico +1, automático |
| Presas Primordiais: +2 em qualquer ataque, como dano fixo | Efeito no card do poder (1 PM): Mordida +2 passos até o fim da cena, automático |
| Efeitos de Uso antigos (`flags.tormenta20.onuse`) | Migra como o sistema migrou o mundo no 1.6. Bônus de perícia sem tipo viram caixa naquela perícia |
| Infusão Distante sem mudanças | Caixa de 1 PM nos consumíveis |
| Vanguardista com +2 em qualquer perícia | Fica só o +2 no Ofício |
| Adepto com três caixas de −1 PM | Uma caixa |
| Foco em Magia como caixa em toda magia | −1 PM automático só na magia escolhida |
| Citadino com +2 em Adestramento | −2 em Adestramento compensa |
| Montaria Mestre com +15 em Fortitude | +5 em Fortitude, Reflexos e Vontade |
| Combate Defensivo do compêndio (só o −2) | O mesmo que a macro Poder · Combate Defensivo |
| Provocação Petulante sem efeito | Efeito "postura" no card |
| Efeito de Uso feito à mão no ator, copiando um poder | Apagado (a caixa apareceria duas vezes) |

## Automações
- **Temeroso:** quem tem o poder ganha "Temeroso · abalado (inimigo adjacente)" quando um token de disposição oposta (e com PV) encosta, e perde quando ninguém está ao lado. Confere a cada movimento de token e a cada turno.
- **Provocação Petulante:** aplique a postura pelo card do poder no token de quem provoca. No início do turno de cada inimigo em alcance curto, a automação rola Vontade (CD 10 + metade do nível + Car). Se falhar, o inimigo ganha o lembrete "Provocado por …" até o fim do turno.

Rodam só no cliente do Mestre ativo.

## Detalhes do sistema que pesaram
- `passos` só sobe o dado com o tipo **custom**. Com o tipo `add`, o sistema empurra o número para o dano (`ability-use.mjs`, ramo "add").
- Poder com rolagem própria não recebe `modificadores.ataque.cac` e `dano.cac`: o sistema só os soma em armas (`item.mjs`, `getAttackRoll`).
- Efeito de Uso **temporário** num item não aparece nas rolagens enquanto estiver no item. Ligado e sem `transfer`, ele vai para o card do poder, e aplicado no ator passa a valer, com `automatic` marcado. Assim funcionam os efeitos da Fúria Bestial e das Presas.
- A tabela de passos do sistema é a do livro: 1d6 → 1d8 → 1d10 → 1d12 → 3d6. A mordida do Rak em fúria com Presas fica 3d6 (a ficha à mão dizia 2d6).

## Limites
- Não foi testado num Foundry real, só no simulado (com as 6 fichas reais e um PJ de teste).
- Ficam à mão: a cura de Abraço da Fênix com dano mágico de fogo, trocar o teste por Enganação (Inocência Dissimulada), a ação extra da montaria, e os poderes que só têm texto.
