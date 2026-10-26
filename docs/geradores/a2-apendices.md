# Arco 2 · Apêndices (Negócios e Distinções)

Arquivo: `a2-apendices.js` (Foundry v14, Tormenta20 1.6.x). No módulo, o conteúdo vem nos compêndios do Ato 2. Como macro avulsa: crie uma macro do tipo Script como Mestre, cole o arquivo inteiro e execute. Rodar de novo apaga e recria só o que tem a marca `a2apendices`. Os negócios ficam guardados nos atores dos donos (flag `fdtNegocios`) e sobrevivem à recriação.

Cobre os Apêndices do livro do Arco 2 (pp. 309–319): Negócios, Distinções, Cavaleiro da Redenção e Vigilante Mascarado.

## O que é criado

**Poderes de distinção (12, tipo "distinção"):**
- Cavaleiro da Redenção: a marca Presença Protetora e os poderes Escudo Redentor, Conceder Segunda Chance, Palavras Redentoras, Provocação Flamejante (com a rolagem de fogo) e Revoada da Fênix.
- Vigilante Mascarado: a marca Traje das Sombras (com o efeito de Furtividade e Intimidação) e os poderes Cavaleiro das Trevas, Criatura da Noite, Mobilidade Urbana (com o efeito de ambiente urbano, desligado), Símbolo de Esperança e Vingador Sem Rosto.

**Diário "Arco 2 · Apêndices" (6 páginas):**
- Guia do Mestre.
- Negócios: criar, níveis, ativos e rendimentos.
- Os Ativos: os 45 ativos, com os pré-requisitos e quais a macro aplica sozinha.
- Distinções: admissão, marca, poderes, como usar e mentores.
- Cavaleiro da Redenção: Ignis Crae e a Ordem, a admissão e os poderes.
- Vigilante Mascarado: a admissão, Por Trás da Máscara e os poderes.

## Macros
- **Valkaria · Negócios:**
  - criar: um mês, T$ 1.000 e o melhor entre Ofício e Nobreza do dono contra CD 20; se passar, o negócio nasce no nível 1 com o primeiro ativo;
  - subir de nível: CD 20 + 2 × o próximo nível (–5 com Estúdio), T$ 1.000 × o próximo nível (metade com Escritório) e o ativo novo, conferindo os pré-requisitos;
  - acrescentar ou tirar um ativo sem teste, e fechar o negócio;
  - rendimento: T$ 100 × nível, ou o resultado do teste × 10 × nível se o dono dedicou o mês (Empório: em TO);
  - Cassino (com a dívida guardada) e Mercado Multinivelado;
  - benefícios: um efeito "Negócios do grupo" em cada personagem, com os bônus de todos os ativos do grupo contados uma vez só (estruturas não acumulam). Os outros ativos aparecem num lembrete para o Mestre;
  - opção de descontar e creditar o dinheiro na ficha.
- **Arco 2 · Distinções:**
  - mostra as admissões e dá a marca ao personagem selecionado (copiando o item do mundo);
  - atualiza o Traje das Sombras (+1, +1 por poder de vigilante) e a Mobilidade Urbana (+1, +1 por outro poder);
  - desmascarado: desliga os efeitos e bloqueia os poderes; recuperar a identidade religa o traje;
  - gasta os PM dos poderes: Símbolo de Esperança aplica +2 na Defesa e nas resistências em quem usou e nos aliados mirados até o fim da cena; Provocação Flamejante rola o fogo (com o limite de PM extras pelos poderes) e aplica o dano nos alvos; Conceder Segunda Chance diz quantas vezes por rodada; Criatura da Noite escolhe 3, 6 ou 10 PM pelos poderes.

## O que foi inferido (não está no livro)
- Os valores em TO (Cassino, Empório) ficam em TO, como no livro, e vão para o campo de TO da ficha.
- O "dado" do Cassino é 1d6.
- Altar e Círculo de Poder: a macro considera conjurador divino ou arcano quem tem uma magia desse tipo (ou universal) na ficha.
- Bônus de PV e PM usam os campos de bônus total do sistema; Salão de Marah dá +1 PM por patamar (1º–4º, 5º–10º, 11º–16º, 17º+).
- Propaganda dá Diplomacia por padrão (o livro deixa escolher Enganação: troque no efeito).
- Oficina dá +1 em todos os Ofícios.
- Os bônus de perícia, PV, PM e carga não foram conferidos no Foundry simulado, que não recalcula os valores derivados; as chaves são as que o próprio sistema usa.
