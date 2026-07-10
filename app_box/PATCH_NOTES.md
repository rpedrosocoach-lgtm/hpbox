# HPBOX Patch — Estrutura, sync e lógica TV

## Não mexido

- `tvlg.html` e `tvlg.js` ficaram iguais aos ficheiros enviados. A TV LG antiga fica quieta.
- `authMode: "legacy"` e `stripPasswordsFromRemotePayload: false` ficaram como estavam, porque foi pedido para ignorar o ponto das passwords.

## Alterações principais

### 1. app.js menos carregado

- Extraído o CSS desktop de admin para `admin-desktop.css`.
- Extraído o CSS semanal inline de `index.html` para `admin-weekly.css`.
- Criado `app-state-sync.js` para a lógica de estado remoto por secções.
- `index.html` passa a carregar `app-state-sync.js` antes de `app.js`.

### 2. Sync remoto por secções

- Adicionado suporte a `hpbox_pilot_state_sections`.
- Modo configurado como `remoteStateMode: "hybrid"`.
- Se a tabela nova ainda não existir, a app cai para `hpbox_pilot_state` para não partir.
- Merge de registos por `id` passa a preferir o registo mais recente quando há `updatedAt`, `modifiedAt`, `createdAt` ou `endedAt`.

### 3. HYROX sem criação falsa

- `normalizeHyroxWorkouts()` deixou de criar HYROX automaticamente só porque existe treino Cross no dia.
- HYROX só fica guardado se tiver conteúdo público ou coach notes.
- A TV não ativa HYROX se não houver blocos públicos reais.

### 4. TV normal mais segura e estável

- `tv.js` reutiliza o cliente Supabase em vez de criar um cliente novo a cada refresh.
- `tv.js` tenta ler primeiro `hpbox_tv_public_state`.
- Se a tabela pública ainda não existir, cai para o payload antigo.
- Corrigida duplicação de `const countClass` em `tv.js`.

### 5. Payload público para TV

- A app publica um payload separado em `hpbox_tv_public_state`.
- Esse payload remove conteúdo privado óbvio: coach notes de treino Cross e coach notes HYROX.
- A TV normal passa a poder ler só o que precisa.

### 6. CSS pesado

- Removidos `data:image` gigantes de `styles.css`.
- O CSS passa a usar assets externos em `assets/`.

## SQL obrigatório

Para ativar as tabelas novas, correr no Supabase:

`supabase/phase2_state_sections_and_public_tv.sql`

Sem este SQL, a app continua a cair para o modo antigo por segurança.
