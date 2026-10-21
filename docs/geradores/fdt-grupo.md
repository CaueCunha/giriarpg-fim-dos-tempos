# O Grupo · regras de grupo e Poderes de Grupo no Foundry

Arquivo: `fdt-grupo.js`. Foundry v14 com o sistema Tormenta20 do Vizael (1.6.x). TAG `fdtgrupo`. Serve para a campanha inteira, não para uma aventura.

## O que o gerador cria (pasta "FdT · O Grupo")
- **3 benefícios do Fim dos Tempos** (Arco 1, Introdução, "Regras para Grupos", p. 60): Nome, Liderança e Base.
- **20 Poderes de Grupo** de Heróis de Arton (cap. 1, p. 92-95), como poderes gerais (subtipo "Grupo").
- **5 macros**: Montar o Grupo, Dar Poderes de Grupo, Sincronizar Cena, PM da Base e Ações de Grupo.
- **Diário "FdT · O Grupo"** com a ficha do grupo, as regras e uma tabela do que cada poder automatiza.

Rodar de novo recria itens, macros e diário, e **mantém a ficha do grupo** (nome, líder, base, membros e PM da base). Os poderes já postos nas fichas continuam lá. Para trocá-los pela versão nova, use "Dar Poderes de Grupo" com "Trocar cópias antigas".

## Passo a passo
1. Como Mestre, crie uma macro **Script**, cole `fdt-grupo.js` e execute.
2. **Grupo · Montar o Grupo**: preencha nome, líder, base e membros, e divida a Iniciativa do líder (o padrão é +1 para cada; o total é o número de membros). A macro coloca na ficha de cada membro:
   - **Grupo · <nome>**, que põe na janela de rolagem "Ajuda de membro do grupo". Marque uma vez por ajudante: +2 cada (+1 da ajuda e +1 do nome). Com 20 ou mais no teste do ajudante, some +1 à mão.
   - **Grupo · Liderança de <líder> (+N Iniciativa)**, um efeito passivo na Iniciativa.
   - **Grupo · Base: <nome>**, que é só o texto da regra.
   Só aparece o que já foi decidido: sem nome não há item de nome, por exemplo.
3. **Grupo · Dar Poderes de Grupo**: marque os PJs e os poderes (ou "Remover"). A macro confere os pré-requisitos (Luta/Pontaria, Iniciativa, Guerra, Mão Amiga, Exército + outro poder) e sincroniza no fim.
4. **Grupo · Sincronizar Cena**: rode no começo de cada cena, ou marque "Automático nesta sessão" para rodar sozinha ao trocar de cena e quando tokens entram ou saem. O modo automático vale até recarregar o mundo. A macro conta quais PJs com token na cena têm cada poder:
   - com 2 ou mais, liga os efeitos; com menos, desliga;
   - Espírito de União exige **todos os membros** do grupo com o poder e na cena;
   - Bote Coletivo recebe o número de aliados como bônus;
   - manda ao Mestre um resumo (🟢 ativo / ⚪ inativo), com o % do Dinheiro Atrai Dinheiro e os usos por cena de Uma Mão Lava a Outra.
5. **Grupo · PM da Base**: o máximo é a média dos PM máximos dos membros. "Entregar PM" tira da base e dá ao PJ como **PM temporário** (o sistema gasta esses primeiro). Os PM da base só valem na base, então tire o que sobrar se o PJ sair. Também tem "Passar dias" (+1 por dia), "Recalcular o máximo" (após subir de nível) e "Definir".
6. **Grupo · Ações de Grupo**: Conselhos Salvadores, Presença Luminosa, Conforto Familiar, Espírito de União (iniciar e encerrar) e Dinheiro Atrai Dinheiro.

## Automação por poder
| Poder | Como funciona no Foundry |
|---|---|
| Abrir a Guarda, Defesa do Mártir, Escudo Vivo | Card de reação com custo de 2 PM (botão de gastar PM); o ataque ou o dano você faz à mão |
| Ajuda do Amador | Card com o efeito "+1 ataque" por 1 rodada para aplicar nos aliados alvo (T) |
| Apontar Fraqueza | Efeito de Uso no ataque (2 PM): margem de ameaça vira 1, então qualquer acerto é crítico |
| Barragem de Golpes | Efeito de Uso no ataque, +1 de dano por marca (marque uma vez por golpe dos aliados; o limite é o seu nível) |
| Bote Coletivo | Iniciativa +N automática (N = aliados com o poder na cena). Na 1ª rodada há Efeitos de Uso de +N em perícia, ataque e CD |
| Conforto Familiar | Ações: 3 PV e 1 PM temporários por patamar para cada aliado que dormiu junto |
| Conselhos Salvadores | Ações: rola a resistência com o valor do aliado e gasta 2 PM |
| Dinheiro Atrai Dinheiro | Ações ou o resumo da sincronização: +5% por PJ com o poder na cena |
| Espírito de União | Ações: "iniciar" gasta 2 PM de cada um e mostra o total; "encerrar" divide igualmente os PV restantes |
| Exército de Um Grupo Só | Efeito de Uso no ataque: +2 por aliado no bando (marque uma vez por aliado) |
| Parede de Escudos | Efeito liga/desliga na ficha: +5 Defesa e RD 5 |
| Presença Luminosa | Ações: gasta 2 PM de cada participante e, até o fim da cena, iguala as perícias de Carisma de cada um às maiores do grupo |
| Saúde Coletiva | Efeito de Uso em magia, poder ou consumível de cura: +2 por dado |
| Uma Mão Lava a Outra | Card com custo de 1 PM; a sincronização diz os usos por cena |
| Bode Expiatório, Corrente de Corpos, Magia Comunitária, Mão Amiga | Só texto (narrativos ou feitos à mão) |

Efeitos de Uso aparecem na janela de rolagem. Abra a janela clicando **sem Shift** (no modo padrão), marque o efeito e role.

## Regras que valem lembrar
- Poder de grupo só funciona com **outro PJ** com o mesmo poder na cena. NPCs e parceiros nunca contam.
- **Jogador ausente**: o livro sugere que o PJ conte se estiver em risco na sessão. A sincronização conta quem tem token na cena, então deixe o token dele no mapa se ele deve contar.
- Se um membro morrer, o jogador pode trocar o poder em tempo entre aventuras.

## Limites conhecidos
- Não foi testado num Foundry rodando. Foi simulado com um Foundry falso: gerar, montar, dar poderes, sincronizar com 2 e com 1 PJ na cena, PM da base e regerar mantendo a ficha.
- **[inferido]** "Apontar Fraqueza" troca `criticoM` para 1 pelo Efeito de Uso. Confira na primeira vez se o card marca crítico.
- **[inferido]** "Saúde Coletiva" usa `d*2` na rolagem de cura. Se a magia tiver várias partes, só a primeira recebe o bônus.
- Espírito de União não junta os PV de verdade. Aplique o dano em qualquer um dos participantes, já que o total é a soma deles, e use "encerrar" no fim da cena. Ninguém deve passar do próprio limite de morte.
- Só o Mestre roda Montar, Dar, Sincronizar e PM da Base, porque elas mexem nas fichas de todos.
