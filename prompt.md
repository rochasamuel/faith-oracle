Vamos desenvolver uma nova funcionalidade. Vai ser a EBD (Escola Biblica Dominical).

A dor é que hoje temos tudo armazenado no papel, ou seja, frequencia do dia, oferta do dia, presenças, faltas, total de assistencias (presenças mais visitantes), visitantes, total de biblias, total de revistas. Tudo isso tem que ser registrado todo dia em que há a escola dominical. Apesar de se chamar escola dominical as vezes temos que remanejar para outro dia. Ou seja, um dos requisitos e que possamos abrir um "dia" da escola dominical em qualquer data (inclusive passado para dados historicos). 

Mas vamos do início. Hoje já temos o cadastro de membros, mas nem todos os membros são matriculados na EBD. Separamos por 4 trimestres, ou seja todo anos temos 4 trimestres, cada trimestre tera uma revista especifica com um tema especifico e consequentemente uma turma especifica. Lembrando que devemos preparar o sistema para receber multiplas turmas, mas no momento so temos uma, a principal.

O fluxo é o seguinte:
Trimestre começa > criamos a turma e matriculamos os membros > compramos revistas

O fluxo diario é o seguinte:
Abrimos o relatório do dia > cadastramos frequencia (presente, falta, não aplicavel[para quando alguem se matriculou depois do incio do trimestre]) > cadastramos as metricas incluisive ofertas, no final do dia temos um relatório de cada dia, que pode ficar atrelado ao dia.

No final do trimestre temos o relatorio trimestral e no final do ano relatorio anual. em relação ao template desse relatório e geração deicidiremos depois, mas o diario tem que estar a pronta entrega na pagina do dia sem exportação (disponivel para consulta rapida). Devemos ter uma ação de fechar o relatório do dia para confirmar topdos os dados e gerar o relatorio diario.

Quero colocar o nuymero da lição do dia também e quem foi o professor.

A interface deve ser mobile first, mas amigavel para todos os dispositivos.

Peço que me ajude com requisitos que eu não lembro, me pergunte tudo que for necessário e me de sugestões de dados necessários. Tenha em mente que embreve teremos um dashboard desses dados, para que possamos visualizar metricas de faltas, ofertas, progressao etc.

Comece primeiro com as entidades em sqls diferentes para o supabase

Na implementação use as melhores praticas de ux/ui e da versão mais recente do react. Priorize leitura e codigo simples e limpo, mas sem muitas camadas.