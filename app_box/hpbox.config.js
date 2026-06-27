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
