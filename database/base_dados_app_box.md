# Base de dados da HPBOX

Este documento descreve a base de dados separada para a HPBOX.

Neste momento a app guarda dados no browser, em `localStorage`. Isso e bom para prototipo, mas nao serve para uso real porque cada browser fica com os seus proprios dados.

Com uma base de dados separada, todos os atletas, coaches e admins passam a ver a mesma informacao, em qualquer telemovel ou computador.

## Opcao recomendada

Usar Supabase.

Motivos:

- Tem base de dados PostgreSQL real.
- Tem login e passwords.
- Permite regras de seguranca por utilizador.
- Permite que atleta veja apenas o que deve ver.
- Permite que admin e coach tenham mais permissao.
- E simples de ligar depois a uma app web.

## Ficheiro criado

O esquema SQL esta em:

`outputs/database/supabase_schema.sql`

Esse ficheiro deve ser executado no SQL Editor do Supabase quando o projeto for criado.

## Tabelas principais

### profiles

Guarda os utilizadores principais:

- atleta
- coach
- admin

Campos importantes:

- username
- nome
- role
- genero
- ativo/inativo

### profile_private

Guarda dados mais privados do atleta:

- email
- telefone
- notas internas

So o proprio atleta, coach ou admin devem conseguir ver estes dados.

### workouts

Guarda cada treino por dia.

Campos importantes:

- data
- titulo
- hora a que fica visivel
- se esta publicado
- se foi desbloqueado manualmente

### workout_parts

Guarda as partes do treino:

- warm-up
- forca/skill
- metcon
- notas de treinador

As notas de treinador ficam separadas para nao aparecerem aos atletas.

### results

Guarda os resultados dos atletas.

O ponto importante e que a forca e o metcon ficam separados:

- `part = strength`
- `part = metcon`

Isto evita misturar o resultado da forca com o resultado do WOD.

Tambem permite ranking separado para:

- forca
- metcon

Para a forca, suporta registos simples e tambem complexos/sets por percentagem, por exemplo:

- Power Clean + Jerk
- 7 sets
- maior carga completada
- sets feitos/falhados

No Supabase, os sets ficam guardados em `strength_sets`, para permitir:

- reps por linha
- movimento por linha
- percentagem por linha
- carga usada por linha

### master_pins

Guarda os PINs master de utilizacao unica.

Serve para o admin gerar um PIN para desbloquear um atleta em qualquer hora daquele dia.

O atleta nao deve conseguir listar PINs. Deve apenas inserir o codigo e a base de dados valida se:

- o PIN pertence ao atleta
- e do dia certo
- ainda nao foi usado
- ainda nao expirou

### prs

Guarda os PRs dos atletas e o historico.

Exemplos:

- Clean 3RM 120 kg
- Back Squat 5RM 100 kg
- Fran 7:42

### result_comments

Guarda comentarios nos resultados.

Todos os atletas podem comentar resultados visiveis, para criar interacao no ranking.

### result_reactions

Guarda likes e parabens nos resultados.

### classes

Guarda horarios de aula.

Mesmo que a marcacao de aulas continue noutro programa, esta tabela permite criar codigos PIN/QR por aula.

### athlete_workout_unlocks

Guarda quem desbloqueou um treino com PIN/QR.

Exemplo:

- Tiago desbloqueou o treino de quarta as 07:55 com PIN da aula.

## Regras de permissao

### Atleta

Pode:

- ver o proprio perfil
- ver treinos quando estiverem desbloqueados
- ver ranking quando o treino estiver visivel
- registar os proprios resultados
- editar os proprios resultados
- comentar e reagir
- ver os proprios PRs

Nao pode:

- ver notas de treinador
- editar programacao
- ver dados privados de outros atletas
- mexer em resultados de outros

### Coach

Pode:

- ver todos os atletas
- ver resultados
- ver comentarios
- gerir treinos
- gerir horarios/PINs de aula
- marcar ou ajustar presencas no futuro

### Admin

Pode tudo.

Inclui:

- criar atletas
- criar coaches
- alterar login/password
- editar programacao
- ver e corrigir resultados
- apagar dados quando for mesmo necessario

## Proximo passo tecnico

Depois de criar o projeto Supabase:

1. Executar `supabase_schema.sql`.
2. Criar o primeiro utilizador admin.
3. Ligar a app ao Supabase.
4. Migrar os dados atuais do `localStorage` para as novas tabelas.
5. Remover a dependencia do browser como "base de dados".

## Mudanca na app

A app deve deixar de fazer isto:

`localStorage.setItem(...)`

E passar a fazer pedidos a base de dados:

- buscar treinos
- guardar resultados
- buscar ranking
- criar comentarios
- criar PRs
- atualizar atletas

Assim, quando um atleta regista um resultado no telemovel, o admin ve logo no computador.
