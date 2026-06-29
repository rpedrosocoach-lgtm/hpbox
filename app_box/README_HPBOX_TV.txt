HPBOX TV v20

Alteracao desta versao:
- O bloco Strength tambem fica escondido quando o texto for apenas placeholder:
  - Sem força
  - Sem Strength
  - Sem skill
  - Sem força/skill
  - ou as variantes com "programado/programada"

Aplicacao:
1. Copiar tv.html, tv.css e tv.js para a raiz do projeto.
2. Fazer commit/deploy.
3. Abrir /tv.html?v=20 para evitar cache.


TV v21: letras maiores nos blocos de treino e degradê de fundo suavizado.

TV v22: textos de treino aumentados novamente para melhor leitura em TV 65".

TV v23: ranking da direita mostra apenas resultados de WOD; força deixa de entrar nessa tabela.

TV v24: Atividade recente mostra atletas diferentes, evitando repetir sempre a mesma pessoa quando há vários registos.

TV v25: corrige o aumento real das letras dos blocos de treino com override final no CSS.

TV v26: se o resultado de WOD não estiver no campo metconScore, tenta recuperar o tempo a partir da atividade/feed: "metcon 17:00".
