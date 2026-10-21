# Combate Defensivo automatizado

Script: `poder-combate-defensivo.js` (macro do tipo Script). Foundry v14, Tormenta20 do Vizael 1.6.x. Feito a partir do código do sistema (master 1.6.4); não foi testado num Foundry rodando.

**Regra** (Tormenta20 JdA, p. 124): quando usa a ação agredir, você pode usar este poder. Até seu próximo turno, sofre −2 em todos os testes de ataque, mas recebe +5 na Defesa.

## Por que o poder do compêndio falha
O poder do compêndio traz dois efeitos: um Efeito de Uso com `ataque −2` e um efeito com `+5 Defesa`. Só o primeiro funciona. Nada leva o segundo para o card do ataque, e não dá para consertar só na ficha do poder: a chave `efeito` (que manda outro efeito para o card) procura o efeito em `ef.parent.items` (`module/apps/ability-use.mjs:419-423`). Quando o Efeito de Uso está dentro de um poder, o pai é o próprio poder, que não tem itens, e a busca volta vazia.

## O que a macro monta
1. **No poder "Combate Defensivo"** (cria o poder se faltar):
   - O Efeito de Uso do compêndio é desligado (sem tipos de uso), para não aparecer duas vezes.
   - O efeito de Defesa vira **"Combate Defensivo · Defesa"**: `system.attributes.defesa.bonus +5` e `system.modificadores.pericias.ataque −2`, duração 1 rodada, expira no **início do próximo turno**. Fica desligado no poder; o card liga ao aplicar.
2. **No ator**, um Efeito de Uso **"Combate Defensivo"** (tipo de uso: Ataque) com `ataque −2` (só nesta rolagem) e `efeito = Combate Defensivo · Defesa`. O `origin` aponta para o poder, e é isso que faz a busca do sistema achar o efeito de Defesa. "Aplicar várias vezes" fica desligado (é uma caixa simples). Efeito colateral do sistema: o efeito aplicado leva junto uma mudança inerte de chave `efeito` (o sistema copia as chaves do Efeito de Uso para o efeito encadeado); não altera nada na ficha. O `ataque` vem antes de `efeito` na lista para não ser copiado.

## Na mesa
1. Selecione o token do personagem e rode a macro uma vez (pode selecionar vários; sem seleção, usa o personagem do usuário). Rodar de novo só atualiza.
2. Ao atacar, na janela de uso, marque a caixa de "Combate Defensivo".
3. O ataque sai com −2. O card tem o botão **Combate Defensivo · Defesa**: com o token do personagem selecionado, clique nele.
4. Até o próximo turno do personagem: +5 na Defesa e −2 em Luta e Pontaria (ataques com arma e manobras). No início do turno seguinte o efeito expira sozinho (precisa de combate ativo; fora de combate some no fim da cena).

## Cuidados
- Num segundo ataque no mesmo turno (Ataque Extra etc.), **não** marque o poder de novo: o −2 já vem do efeito ativo, e um segundo +5 seria aplicado.
- O −2 do efeito ativo entra via perícia de ataque, então também vale em manobras (são testes de ataque). Ataques de magia que não usam Luta/Pontaria não pegam o −2.
