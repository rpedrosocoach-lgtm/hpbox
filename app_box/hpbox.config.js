"use strict";

window.HPBOX_CONFIG = {
  appName: "HPBOX",
  dataMode: "supabase",
  // Fase 1 segurança:
  // manter "legacy" até criares os utilizadores no Supabase Auth e correres o SQL em supabase/phase1_security.sql.
  // depois mudar para "supabase".
  authMode: "legacy",
  stripPasswordsFromRemotePayload: false,
  storageKey: "hpbox-pilot-v1",
  onlineStateTable: "hpbox_pilot_state",
  onlineStateId: "hpbox-pilot",
  // Phase 2: guarda o state por secções em vez de uma única linha gigante.
  // "hybrid" tenta hpbox_pilot_state_sections e cai para hpbox_pilot_state se a tabela ainda não existir.
  remoteStateMode: "hybrid",
  onlineStateSectionsTable: "hpbox_pilot_state_sections",
  onlinePublicStateTable: "hpbox_tv_public_state",
  onlinePublicStateId: "hpbox-tv-public",
  supabaseUrl: "https://dkguyclyiicqkzrbcgha.supabase.co",
  supabaseAnonKey: "sb_publishable_L57UjG_gDDaeYSUnwlV5kw_ry958jU9",
  visualAssets: {
    background: "assets/training-bg-clean.png",
    warmupHeader: "assets/training-warm-up-header-clean.png",
    strengthHeader: "assets/training-strength-header-clean.png",
    wodHeader: "assets/training-wod-header-clean.png",
    warmupFilter: "none",
  },
};
