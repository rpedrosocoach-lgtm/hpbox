HPBOX - Admin lançar/editar Força e WOD por atleta

Alteração:
- No separador Admin > Resultados há agora um seletor único de atleta.
- O Admin consegue lançar/editar Força e WOD para esse atleta no dia selecionado.
- A lista abaixo continua compacta: só mostra atletas que já têm algum resultado nesse dia.

Como aplicar:
1. Substituir app.js e styles.css na raiz do projeto.
2. Fazer commit/deploy.
3. Abrir a app com ?v=admin-strength-wod-1 para evitar cache.

Notas:
- Guardar força preserva o WOD já existente.
- Guardar WOD preserva a força já existente.
- Para força em modo complexo/sets, preenche os pesos nas linhas e clica Guardar força.
