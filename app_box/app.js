"use strict";

const APP_CONFIG = (typeof window !== "undefined" && window.HPBOX_CONFIG) || {};
const APP_NAME = APP_CONFIG.appName || "HPBOX";
const STORAGE_KEY = APP_CONFIG.storageKey || "hpbox-pilot-v1";
const LEGACY_STORAGE_KEYS = ["box-board-prototype-v1"];
const ONLINE_STATE_TABLE = APP_CONFIG.onlineStateTable || "hpbox_pilot_state";
const ONLINE_STATE_ID = APP_CONFIG.onlineStateId || "hpbox-pilot";
const ONLINE_SAVE_DEBOUNCE_MS = 700;
const ONLINE_REQUEST_TIMEOUT_MS = 12000;
const ONLINE_REFRESH_INTERVAL_MS = 15000;
const CURRENT_VERSION = 17;
const BOOKING_WINDOW_HOURS = 72;
const SHOW_CLASS_FEATURES = false;
const SHOW_STAFF_CLASS_TOOLS = true;
const CLASS_CODE_EARLY_MINUTES = 15;
const CLASS_CODE_GRACE_MINUTES = 10;
const MANUAL_PROGRAMMING_CLEAR_START = "2026-06-22";
const MANUAL_PROGRAMMING_CLEAR_END = "2026-06-27";
const LEADERBOARD_SCOPES = ["workout", "week", "general"];
const RANKING_POINTS_BY_PLACE = [10, 8, 6, 5, 4, 3, 2, 1];
const GENERAL_RANKING_WEEKS = 8;
const DEFAULT_VISUAL_ASSETS = Object.freeze({
  background: "assets/training-bg-clean.png",
  warmupHeader: "assets/training-warm-up-header-clean.png",
  strengthHeader: "assets/training-strength-header-clean.png",
  wodHeader: "assets/training-wod-header-clean.png",
});
const DEFAULT_WARMUP_FILTER = "none";

const scoreTypes = {
  time: "Tempo",
  reps: "Reps",
  load: "Carga",
  complex: "Complexo / sets",
  quality: "Qualidade",
  rounds: "Rounds + reps",
  complete: "Completed",
};

const prTypes = {
  load: { label: "Carga", unit: "kg", direction: "higher", placeholder: "Ex: 90" },
  one_rm: { label: "1RM", unit: "kg", direction: "higher", placeholder: "Ex: 100" },
  three_rm: { label: "3RM", unit: "kg", direction: "higher", placeholder: "Ex: 90" },
  five_rm: { label: "5RM", unit: "kg", direction: "higher", placeholder: "Ex: 82.5" },
  max_reps: { label: "Máximo de reps", unit: "reps", direction: "higher", placeholder: "Ex: 18" },
  benchmark_time: { label: "Benchmark por tempo", unit: "tempo", direction: "lower", placeholder: "Ex: 7:42" },
  benchmark_score: { label: "Benchmark por score", unit: "score", direction: "higher", placeholder: "Ex: 152" },
};

const genderOptions = [
  { value: "F", label: "Feminino" },
  { value: "M", label: "Masculino" },
];

const weekNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
const dayNames = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];
const defaultClassSchedule = [
  { time: "07:00", duration: 60 },
  { time: "13:00", duration: 60 },
  { time: "18:30", duration: 60 },
];
const LEGACY_DEADLIFT_STRENGTH = "Deadlift\n4 x 5 @ 75%";
const PREVIOUS_DEADLIFT_STRENGTH = "Deadlift\n5 @75%\n3 @80%\n2 @85%";
const DEFAULT_DEADLIFT_STRENGTH = "Deadlift\n5 @75%\n3 @80%\n2 @85%\n1 @95%";
const ADMIN_PROGRAMMING_FIELD_IDS = new Set([
  "workoutTitle",
  "workoutStrengthScoreType",
  "workoutMovement",
  "workoutPrType",
  "workoutScoreType",
  "workoutUnlock",
  "workoutWarmup",
  "workoutStrength",
  "workoutMetcon",
  "workoutNotes",
]);

const app = {
  state: null,
  els: {},
  ui: {
    adminDraftDirty: false,
    adminDraftDate: "",
    focusWorkoutZone: "",
  },
  online: {
    client: null,
    enabled: false,
    ready: false,
    loading: false,
    saving: false,
    pendingSave: false,
    pendingImmediateSave: false,
    localWritesDuringLoad: 0,
    saveTimer: null,
    refreshTimer: null,
    status: "local",
    lastError: "",
    lastErrorDetail: "",
    lastSavedAt: "",
  },
};

function getVisualAssetPath(key) {
  const configuredAssets = APP_CONFIG.visualAssets || {};
  const fallback = DEFAULT_VISUAL_ASSETS[key];
  const candidate = String(configuredAssets[key] || fallback || "").trim();
  return /^assets\/[A-Za-z0-9._/-]+\.png(?:\?v=[A-Za-z0-9._-]+)?$/i.test(candidate)
    ? candidate
    : fallback;
}

function getWarmupFilter() {
  const configuredAssets = APP_CONFIG.visualAssets || {};
  const filter = String(configuredAssets.warmupFilter || DEFAULT_WARMUP_FILTER).trim();
  return filter === "none" || filter === "hue-rotate(88deg) saturate(1.12)"
    ? filter
    : DEFAULT_WARMUP_FILTER;
}

function applyVisualAssetConfig() {
  if (typeof document === "undefined" || !document.documentElement || !document.documentElement.style) return;
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--hpbox-training-background-image", `url("${getVisualAssetPath("background")}")`);
  rootStyle.setProperty("--hpbox-warmup-header-image", `url("${getVisualAssetPath("warmupHeader")}")`);
  rootStyle.setProperty("--hpbox-strength-header-image", `url("${getVisualAssetPath("strengthHeader")}")`);
  rootStyle.setProperty("--hpbox-wod-header-image", `url("${getVisualAssetPath("wodHeader")}")`);
  rootStyle.setProperty("--hpbox-warmup-filter", getWarmupFilter());
}

document.addEventListener("DOMContentLoaded", () => {
  applyVisualAssetConfig();
  document.title = APP_NAME;
  app.els = {
    workspace: document.getElementById("workspace"),
    sidePanel: document.getElementById("sidePanel"),
    statusStrip: document.getElementById("statusStrip"),
    dateLine: document.getElementById("dateLine"),
    roleSelect: document.getElementById("roleSelect"),
    rolePickerWrap: document.getElementById("rolePickerWrap"),
    athleteSelect: document.getElementById("athleteSelect"),
    athletePickerWrap: document.getElementById("athletePickerWrap"),
    staffSelect: document.getElementById("staffSelect"),
    staffPickerWrap: document.getElementById("staffPickerWrap"),
    sessionUserBox: document.getElementById("sessionUserBox"),
    sessionRoleLine: document.getElementById("sessionRoleLine"),
    sessionUserName: document.getElementById("sessionUserName"),
    layout: document.querySelector(".layout"),
    bottomNav: document.querySelector(".bottom-nav"),
    navButtons: [...document.querySelectorAll(".nav-button")],
  };

  app.state = loadState();
  const restoredInteractionNotice = markInteractionNotificationsAsRead(getSessionUser());
  if (restoredInteractionNotice) persistLocalState();
  bindEvents();
  initOnlineSync();
  render();
  if (restoredInteractionNotice) toast(restoredInteractionNotice, 6200);
});

function bindEvents() {
  app.els.roleSelect.addEventListener("change", (event) => {
    app.state.currentRole = event.target.value;
    saveState();
    render();
  });

  app.els.athleteSelect.addEventListener("change", (event) => {
    app.state.currentUserId = event.target.value;
    saveState();
    render();
  });

  app.els.staffSelect.addEventListener("change", (event) => {
    app.state.currentStaffId = event.target.value;
    saveState();
    render();
  });

  app.els.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.view !== "admin") clearAdminProgrammingDraftDirty();
      app.state.activeView = button.dataset.view;
      saveState();
      render();
    });
  });

  window.addEventListener?.("focus", () => {
    refreshRemoteStateNow();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshRemoteStateNow();
  });

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    if (action === "select-date") selectDate(target.dataset.date);
    if (action === "select-week") selectWeek(target.dataset.weekStart);
    if (action === "select-leaderboard-scope") selectLeaderboardScope(target.dataset.scope);
    if (action === "add-week") addWeek(Number(target.dataset.offset || 1));
    if (action === "add-boundary-week") addBoundaryWeek(target.dataset.direction);
    if (action === "toggle-result-form") toggleResultForm(target.dataset.workoutId, target.dataset.mode);
    if (action === "save-result") saveResult();
    if (action === "save-workout") saveWorkout();
    if (action === "open-complex-builder") openComplexBuilder();
    if (action === "close-complex-builder") closeComplexBuilder();
    if (action === "add-complex-builder-row") addComplexBuilderRow();
    if (action === "remove-complex-builder-row") removeComplexBuilderRow(Number(target.dataset.index || 0));
    if (action === "apply-complex-builder") applyComplexBuilder();
    if (action === "end-class") toggleClass(target.dataset.classId, true);
    if (action === "undo-class") toggleClass(target.dataset.classId, false);
    if (action === "unlock-now") setWorkoutUnlock(true, target.dataset.workoutId);
    if (action === "lock-again") setWorkoutUnlock(false, target.dataset.workoutId);
    if (action === "unlock-with-code") unlockWorkoutWithCode(target.dataset.date);
    if (action === "refresh-training-access") refreshTrainingAccess();
    if (action === "generate-master-pin") generateMasterPin(target.dataset.workoutId);
    if (action === "retry-online-sync") retryOnlineSync();
    if (action === "login") login();
    if (action === "register-athlete") registerAthlete();
    if (action === "logout") logout();
    if (action === "book-class") bookClass(target.dataset.classId);
    if (action === "cancel-class") cancelClass(target.dataset.classId);
    if (action === "reset-demo") resetDemo();
    if (action === "toggle-feed-boost") toggleFeedBoost(target.dataset.feedId);
    if (action === "view-feed-workout") viewFeedWorkout(target.dataset.feedId);
    if (action === "toggle-result-boost") toggleResultBoost(target.dataset.resultId, target.dataset.mode);
    if (action === "toggle-result-comments") toggleResultComments(target.dataset.resultId, target.dataset.mode);
    if (action === "add-result-comment") addResultComment(target.dataset.resultId, target.dataset.inputId, target.dataset.mode);
    if (action === "set-attendance") setAttendance(target.dataset.classId, target.dataset.userId, target.dataset.status);
    if (action === "toggle-attendance") toggleAttendance(target.dataset.classId, target.dataset.userId);
    if (action === "add-athlete") addUser();
    if (action === "add-user") addUser();
    if (action === "toggle-person-editor") togglePersonEditor(target.dataset.userId);
    if (action === "save-person") savePerson(target.dataset.userId);
    if (action === "delete-person") deletePerson(target.dataset.userId);
    if (action === "select-admin-tab") selectAdminTab(target.dataset.tab);
    if (action === "add-class") addClass();
    if (action === "delete-class") deleteClass(target.dataset.classId);
    if (action === "add-athlete-to-class") addAthleteToClass(target.dataset.classId, target.dataset.selectId);
    if (action === "toggle-class-roster") toggleClassRoster(target.dataset.classId);
    if (action === "toggle-pr-history") togglePrHistory(target.dataset.key);
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "adminWorkoutDate") {
      selectDate(event.target.value);
    }
    markAdminProgrammingDraftDirty(event);
  });

  document.addEventListener("input", (event) => {
    markAdminProgrammingDraftDirty(event);
  });
}

function markAdminProgrammingDraftDirty(event) {
  if (!isAdminProgrammingField(event?.target)) return;
  if (!app.state || app.state.activeView !== "admin") return;
  if ((app.state.activeAdminTab || "programming") !== "programming") return;
  app.ui.adminDraftDirty = true;
  app.ui.adminDraftDate = app.state.selectedDate || "";
}

function clearAdminProgrammingDraftDirty() {
  app.ui.adminDraftDirty = false;
  app.ui.adminDraftDate = "";
}

function isAdminProgrammingField(target) {
  const id = String(target?.id || "");
  return Boolean(
    id &&
      (ADMIN_PROGRAMMING_FIELD_IDS.has(id) ||
        id === "complexBuilderIntro" ||
        /^builder(Reps|Movement|Percent|Work)-\d+$/.test(id))
  );
}

function isEditableFieldFocused() {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;
  if (!active || active.disabled || active.readOnly) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(String(active.tagName || "").toUpperCase());
}

function hasUnsavedAdminProgrammingDraft() {
  if (!app.ui.adminDraftDirty || !app.state) return false;
  if (!canManage()) return false;
  if (app.state.activeView !== "admin") return false;
  if ((app.state.activeAdminTab || "programming") !== "programming") return false;
  return !app.ui.adminDraftDate || app.ui.adminDraftDate === app.state.selectedDate;
}

function shouldDeferRemoteRefreshForEditing() {
  return hasUnsavedAdminProgrammingDraft() || isEditableFieldFocused();
}

function loadState() {
  let saved = null;
  let savedKey = STORAGE_KEY;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        saved = localStorage.getItem(legacyKey);
        if (saved) {
          savedKey = legacyKey;
          break;
        }
      }
    }
  } catch {
    return createSeedState();
  }
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const migrated = migrateState(parsed, { resetAthleteToToday: true });
      const today = isoDate(new Date());
      if (migrated && migrated.workouts?.some((workout) => workout.date === today)) {
        return migrated;
      }
    } catch {
      try {
        localStorage.removeItem(savedKey);
      } catch {
        // Storage may be blocked by the browser.
      }
    }
  }
  return createSeedState();
}

function shouldUseOnlineSync() {
  return APP_CONFIG.dataMode === "supabase" && Boolean(APP_CONFIG.supabaseUrl && APP_CONFIG.supabaseAnonKey);
}

function initOnlineSync() {
  if (!shouldUseOnlineSync()) return;
  app.online.enabled = true;
  app.online.status = "connecting";
  app.online.lastErrorDetail = "";

  if (typeof window === "undefined" || !window.supabase?.createClient) {
    app.online.status = "local-fallback";
    app.online.lastError = "supabase-client-missing";
    refreshOnlineUi();
    return;
  }

  try {
    app.online.client = window.supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey);
    loadRemoteState();
  } catch {
    app.online.status = "local-fallback";
    app.online.lastError = "supabase-client-failed";
    app.online.lastErrorDetail = "Supabase client could not be created.";
    refreshOnlineUi();
  }
}

function retryOnlineSync() {
  if (!shouldUseOnlineSync()) return;
  app.online.enabled = true;
  app.online.ready = false;
  app.online.loading = false;
  app.online.saving = false;
  app.online.pendingSave = false;
  app.online.pendingImmediateSave = false;
  app.online.lastError = "";
  app.online.lastErrorDetail = "";
  app.online.status = "connecting";

  if (typeof window === "undefined" || !window.supabase?.createClient) {
    app.online.client = null;
    app.online.status = "local-fallback";
    app.online.lastError = "supabase-client-missing";
    refreshOnlineUi();
    return;
  }

  try {
    app.online.client = app.online.client || window.supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey);
    refreshOnlineUi();
    loadRemoteState();
  } catch {
    app.online.client = null;
    app.online.status = "local-fallback";
    app.online.lastError = "supabase-client-failed";
    app.online.lastErrorDetail = "Supabase client could not be created.";
    refreshOnlineUi();
  }
}

async function loadRemoteState(options = {}) {
  if (!app.online.client || app.online.loading) return;
  const background = Boolean(options.background);
  if (background && shouldDeferRemoteRefreshForEditing()) {
    scheduleOnlineRefresh();
    return;
  }
  app.online.loading = true;
  app.online.localWritesDuringLoad = 0;
  let shouldSaveMergedState = false;
  let interactionNotice = "";
  if (!background) {
    app.online.status = "loading";
    renderOnlineStatus();
  }

  try {
    const { data, error } = await withOnlineRequestTimeout(
      app.online.client
        .from(ONLINE_STATE_TABLE)
        .select("payload, updated_at")
        .eq("id", ONLINE_STATE_ID)
        .maybeSingle(),
      "remote-load-timeout"
    );

    if (error) throw error;

    if (background && shouldDeferRemoteRefreshForEditing()) {
      app.online.ready = true;
      app.online.status = "online";
      app.online.lastError = "";
      app.online.lastErrorDetail = "";
      app.online.lastSavedAt = data?.updated_at || app.online.lastSavedAt || "";
      scheduleOnlineRefresh();
      return;
    }

    if (data?.payload) {
      const merged = mergeRemoteState(data.payload);
      if (merged) {
        app.state = merged;
        interactionNotice = markInteractionNotificationsAsRead(getSessionUser());
        persistLocalState();
        shouldSaveMergedState = remotePayloadNeedsSave(data.payload, app.state) || Boolean(interactionNotice);
      }
      app.online.lastSavedAt = data.updated_at || "";
    } else if (!data?.payload) {
      await uploadRemoteState(true);
    }

    app.online.ready = true;
    app.online.status = "online";
    app.online.lastError = "";
    app.online.lastErrorDetail = "";
    scheduleOnlineRefresh();
    render();
    if (interactionNotice) toast(interactionNotice, 6200);
  } catch (error) {
    app.online.status = "local-fallback";
    app.online.lastError = error?.message === "remote-load-timeout" ? "remote-load-timeout" : "remote-load-failed";
    app.online.lastErrorDetail = describeOnlineError(error);
    refreshOnlineUi();
  } finally {
    app.online.loading = false;
    if (shouldSaveMergedState || app.online.pendingSave) {
      const shouldFlushImmediately = app.online.pendingImmediateSave;
      app.online.pendingSave = false;
      app.online.pendingImmediateSave = false;
      if (shouldFlushImmediately) flushRemoteStateSave();
      else queueRemoteStateSave();
    }
  }
}

function createRemotePayload(state) {
  return {
    version: state.version,
    users: state.users || [],
    workouts: state.workouts || [],
    classes: state.classes || [],
    deletedUsers: normalizeDeletedUsers(state.deletedUsers || []),
    deletedClasses: normalizeDeletedClasses(state.deletedClasses || []),
    results: (state.results || []).map((result) => {
      const { reactions, ...rest } = result;
      return {
        ...rest,
        reactionsByMode: normalizeResultReactionModes(result),
      };
    }),
    prs: state.prs || [],
    feed: (state.feed || []).map((item) => ({
      ...item,
      reactions: normalizeReactions(item.reactions),
    })),
    notifications: normalizeNotifications(state.notifications || []),
    workoutUnlocks: state.workoutUnlocks || [],
    masterPins: state.masterPins || [],
  };
}

function mergeRecordsById(remoteRecords = [], localRecords = []) {
  const merged = [];
  const seen = new Set();
  [...(remoteRecords || []), ...(localRecords || [])].forEach((record) => {
    if (!record || typeof record !== "object") return;
    const key = String(record.id || "");
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(record);
  });
  return merged;
}

function mergeDeletedClassMarkers(remoteRecords = [], localRecords = []) {
  return mergeRecordsByKey(
    normalizeDeletedClasses(remoteRecords),
    normalizeDeletedClasses(localRecords),
    deletedClassSyncKey
  );
}

function mergeDeletedUserMarkers(remoteRecords = [], localRecords = []) {
  return mergeRecordsByKey(
    normalizeDeletedUsers(remoteRecords),
    normalizeDeletedUsers(localRecords),
    deletedUserSyncKey
  );
}

function mergeRecordsByKey(remoteRecords = [], localRecords = [], keyFn) {
  const merged = [];
  const seen = new Set();
  [...(remoteRecords || []), ...(localRecords || [])].forEach((record) => {
    const key = String(keyFn(record) || "");
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(record);
  });
  return merged;
}

function mergeUsersByLogin(remoteUsers = [], localUsers = []) {
  const mergedById = mergeRecordsById(remoteUsers, localUsers);
  const seenLogins = new Set();
  return mergedById.filter((user) => {
    const login = normalizeLoginName(user.loginName || user.id || user.name);
    if (!login || seenLogins.has(login)) return false;
    seenLogins.add(login);
    return true;
  });
}

function mergeNotifications(remoteRecords = [], localRecords = []) {
  const merged = new Map();
  [...normalizeNotifications(remoteRecords), ...normalizeNotifications(localRecords)].forEach((record) => {
    const existing = merged.get(record.id);
    if (!existing) {
      merged.set(record.id, record);
      return;
    }
    const readAt = latestNotificationReadAt(existing.readAt, record.readAt);
    merged.set(record.id, { ...existing, ...record, readAt });
  });
  return [...merged.values()];
}

function latestNotificationReadAt(...values) {
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .sort()
    .at(-1) || "";
}

function mergeRemoteState(remotePayload) {
  if (!remotePayload || !Array.isArray(remotePayload.users) || !Array.isArray(remotePayload.workouts)) return null;
  const localState = app.state || createSeedState();
  const localPayload = createRemotePayload(localState);
  const deletedUsers = mergeDeletedUserMarkers(remotePayload.deletedUsers, localPayload.deletedUsers);
  return migrateState({
    ...localState,
    ...remotePayload,
    users: filterDeletedUsers(mergeUsersByLogin(remotePayload.users, localPayload.users), deletedUsers),
    workouts: mergeRecordsById(remotePayload.workouts, localPayload.workouts),
    classes: mergeRecordsById(remotePayload.classes, localPayload.classes),
    deletedClasses: mergeDeletedClassMarkers(remotePayload.deletedClasses, localPayload.deletedClasses),
    deletedUsers,
    results: mergeRecordsById(remotePayload.results, localPayload.results),
    prs: mergeRecordsById(remotePayload.prs, localPayload.prs),
    feed: mergeRecordsById(remotePayload.feed, localPayload.feed),
    notifications: mergeNotifications(remotePayload.notifications, localPayload.notifications),
    workoutUnlocks: mergeRecordsById(remotePayload.workoutUnlocks, localPayload.workoutUnlocks),
    masterPins: mergeRecordsById(remotePayload.masterPins, localPayload.masterPins),
    activeView: localState.activeView || "today",
    selectedDate: localState.selectedDate || isoDate(new Date()),
    sessionUserId: localState.sessionUserId || "",
    currentRole: localState.currentRole || "athlete",
    currentUserId: localState.currentUserId || "",
    currentStaffId: localState.currentStaffId || "",
    expandedResultWorkoutId: localState.expandedResultWorkoutId || "",
    expandedResultMode: localState.expandedResultMode || "",
    expandedResultCommentsKey: localState.expandedResultCommentsKey || "",
    complexBuilderOpen: Boolean(localState.complexBuilderOpen),
    complexBuilderRows: normalizeBuilderRows(localState.complexBuilderRows),
  });
}

function remotePayloadNeedsSave(remotePayload, mergedState) {
  const remote = createRemotePayload(remotePayload || {});
  const merged = createRemotePayload(mergedState || {});
  return (
    hasRecordsMissingFromRemote(remote.users, merged.users, (user) =>
      normalizeLoginName(user.loginName || user.id || user.name)
    ) ||
    hasRecordsMissingFromRemote(remote.workouts, merged.workouts, workoutSyncKey) ||
    hasRecordsMissingFromRemote(remote.classes, merged.classes, classSyncKey) ||
    hasRecordsMissingFromRemote(remote.deletedUsers, merged.deletedUsers, deletedUserSyncKey) ||
    hasRecordsMissingFromRemote(remote.deletedClasses, merged.deletedClasses, deletedClassSyncKey) ||
    hasRecordsMissingFromRemote(remote.results, merged.results, resultSyncKey) ||
    hasRecordsMissingFromRemote(remote.prs, merged.prs, prSyncKey) ||
    hasRecordsMissingFromRemote(remote.feed, merged.feed, feedSyncKey) ||
    notificationsNeedSave(remote.notifications, merged.notifications) ||
    hasRecordsMissingFromRemote(remote.workoutUnlocks, merged.workoutUnlocks, (record) =>
      record.id || `${record.workoutId || ""}-${record.userId || record.athleteId || ""}`
    ) ||
    hasRecordsMissingFromRemote(remote.masterPins, merged.masterPins, (record) => record.id || record.code)
    || remotePayloadHasOrphanedUserReferences(remote, merged)
  );
}

function notificationsNeedSave(remoteRecords = [], mergedRecords = []) {
  const remoteById = new Map(normalizeNotifications(remoteRecords).map((record) => [record.id, record]));
  return normalizeNotifications(mergedRecords).some((record) => {
    const remote = remoteById.get(record.id);
    return !remote || String(remote.readAt || "") !== String(record.readAt || "");
  });
}

function hasRecordsMissingFromRemote(remoteRecords = [], mergedRecords = [], keyFn) {
  const remoteKeys = new Set(
    (remoteRecords || [])
      .map((record) => String(keyFn(record) || ""))
      .filter(Boolean)
  );

  return (mergedRecords || []).some((record) => {
    const key = String(keyFn(record) || "");
    return key && !remoteKeys.has(key);
  });
}

function remotePayloadHasOrphanedUserReferences(remotePayload = {}, mergedState = {}) {
  const knownUserIds = new Set((mergedState.users || []).map((user) => String(user?.id || "")));
  const isUnknownUser = (userId) => !knownUserIds.has(String(userId || ""));
  const hasUnknownBoost = (reactions) => normalizeReactions(reactions).boostBy.some(isUnknownUser);
  const hasUnknownResultData = (result) => {
    const reactions = normalizeResultReactionModes(result);
    return (
      isUnknownUser(result?.userId) ||
      normalizeResultComments(result?.comments).some((comment) => isUnknownUser(comment.userId)) ||
      hasUnknownBoost(reactions.strength) ||
      hasUnknownBoost(reactions.metcon)
    );
  };

  return (
    (remotePayload.classes || []).some((classEntry) =>
      [...(classEntry.attendees || []), ...(classEntry.present || []), ...(classEntry.absent || [])].some(isUnknownUser)
    ) ||
    (remotePayload.results || []).some(hasUnknownResultData) ||
    (remotePayload.prs || []).some((pr) => isUnknownUser(pr.userId)) ||
    (remotePayload.feed || []).some(
      (item) => isUnknownUser(item.userId) || hasUnknownBoost(item.reactions)
    ) ||
    (remotePayload.notifications || []).some(
      (notification) =>
        isUnknownUser(notification.userId) ||
        (notification.actorId && isUnknownUser(notification.actorId))
    ) ||
    (remotePayload.workoutUnlocks || []).some((unlock) => isUnknownUser(unlock.userId || unlock.athleteId)) ||
    (remotePayload.masterPins || []).some((pin) => isUnknownUser(pin.userId || pin.athleteId))
  );
}

function workoutSyncKey(record = {}) {
  return syncKey([
    record.id || record.date,
    record.date,
    record.title,
    record.movement,
    record.scoreType,
    record.prType,
    record.unlockTime,
    record.blocks?.warmup,
    record.blocks?.strength,
    record.blocks?.metcon,
    record.blocks?.notes,
  ]);
}

function classSyncKey(record = {}) {
  return syncKey([record.id || record.date, record.date, record.time, record.endTime, record.duration]);
}

function deletedClassSyncKey(record = {}) {
  return syncKey([record.date, record.time]);
}

function deletedUserSyncKey(record = {}) {
  return String(record.userId || record.id || "").trim();
}

function resultSyncKey(record = {}) {
  return syncKey([
    record.userId,
    record.workoutId || record.workoutDate || getWorkoutDateFromId(record.workoutId),
    record.strengthScore,
    record.strengthLoad || record.load,
    record.prType,
    record.prRawValue,
    record.strengthMovement,
    serializeSyncValue(record.strengthSets),
    record.metconScore || record.score,
    record.metconLevel || record.level,
  ]);
}

function prSyncKey(record = {}) {
  return syncKey([
    record.userId,
    record.movement,
    record.prType,
    record.rawValue || record.value,
    record.sourceLoad,
    record.sourceReps,
    record.date,
  ]);
}

function feedSyncKey(record = {}) {
  return syncKey([record.type, record.userId, record.workoutId, record.text]);
}

function syncKey(parts) {
  return parts.map((part) => normalizeSyncPart(part)).join("|");
}

function normalizeSyncPart(value) {
  if (value === undefined || value === null) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function serializeSyncValue(value) {
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function persistLocalState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(app.state));
  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    try {
      localStorage.removeItem(legacyKey);
    } catch {
      // Storage cleanup is best-effort only.
    }
  }
}

function queueRemoteStateSave() {
  if (!app.online.enabled || !app.online.client) return;
  app.online.localWritesDuringLoad += app.online.loading ? 1 : 0;
  if (app.online.saveTimer) window.clearTimeout(app.online.saveTimer);
  app.online.saveTimer = window.setTimeout(() => {
    uploadRemoteState(false);
  }, ONLINE_SAVE_DEBOUNCE_MS);
}

function scheduleOnlineRefresh() {
  if (!app.online.enabled || !app.online.client || typeof window === "undefined") return;
  if (app.online.refreshTimer) window.clearTimeout(app.online.refreshTimer);
  app.online.refreshTimer = window.setTimeout(() => {
    app.online.refreshTimer = null;
    refreshRemoteStateNow();
  }, ONLINE_REFRESH_INTERVAL_MS);
}

function refreshRemoteStateNow() {
  if (!app.online.enabled || !app.online.client || app.online.loading || app.online.saving) return;
  if (shouldDeferRemoteRefreshForEditing()) {
    scheduleOnlineRefresh();
    return;
  }
  loadRemoteState({ background: true });
}

function flushRemoteStateSave() {
  if (!app.online.enabled || !app.online.client) return false;
  if (app.online.loading) {
    app.online.pendingSave = true;
    return false;
  }
  if (app.online.saveTimer) {
    window.clearTimeout(app.online.saveTimer);
    app.online.saveTimer = null;
  }
  return uploadRemoteState(false);
}

async function uploadRemoteState(isInitialUpload = false) {
  if (!app.online.client || !app.state) return false;
  if (app.online.loading && !isInitialUpload) {
    app.online.pendingSave = true;
    return false;
  }
  if (app.online.saving) {
    app.online.pendingSave = true;
    return false;
  }

  app.online.saving = true;
  app.online.status = isInitialUpload ? "initial-upload" : "saving";
  renderOnlineStatus();

  try {
    const payload = createRemotePayload(app.state);
    const { error } = await withOnlineRequestTimeout(
      app.online.client
        .from(ONLINE_STATE_TABLE)
        .upsert(
          {
            id: ONLINE_STATE_ID,
            payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        ),
      "remote-save-timeout"
    );

    if (error) throw error;
    app.online.ready = true;
    app.online.status = "online";
    app.online.lastError = "";
    app.online.lastErrorDetail = "";
    app.online.lastSavedAt = new Date().toISOString();
    scheduleOnlineRefresh();
    refreshOnlineUi();
    return true;
  } catch (error) {
    app.online.status = "local-fallback";
    app.online.lastError = error?.message === "remote-save-timeout" ? "remote-save-timeout" : "remote-save-failed";
    app.online.lastErrorDetail = describeOnlineError(error);
    refreshOnlineUi();
    return false;
  } finally {
    app.online.saving = false;
    if (app.online.pendingSave) {
      const shouldFlushImmediately = app.online.pendingImmediateSave;
      app.online.pendingSave = false;
      app.online.pendingImmediateSave = false;
      if (shouldFlushImmediately) flushRemoteStateSave();
      else queueRemoteStateSave();
    }
  }
}

function withOnlineRequestTimeout(request, timeoutMessage) {
  let timerId = null;
  const timeout = new Promise((_, reject) => {
    timerId = window.setTimeout(() => reject(new Error(timeoutMessage)), ONLINE_REQUEST_TIMEOUT_MS);
  });
  return Promise.race([request, timeout]).finally(() => {
    if (timerId) window.clearTimeout?.(timerId);
  });
}

function describeOnlineError(error) {
  if (!error) return "";
  const parts = [
    error.message,
    error.details,
    error.hint,
    error.code ? `code ${error.code}` : "",
    error.status ? `status ${error.status}` : "",
    error.statusCode ? `status ${error.statusCode}` : "",
  ]
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean);
  return [...new Set(parts)].join(" | ").slice(0, 240);
}

function getOnlineStatusLabel() {
  if (!app.online.enabled) return "Local";
  if (app.online.status === "online") return "Online";
  if (app.online.status === "saving" || app.online.status === "initial-upload") return "A sincronizar";
  if (app.online.status === "loading" || app.online.status === "connecting") return "A ligar";
  return "Local";
}

function isOnlineSyncPending() {
  return app.online.enabled && !app.online.ready && ["connecting", "loading", "initial-upload"].includes(app.online.status);
}

function hasOnlineSyncFailed() {
  return app.online.enabled && !app.online.ready && app.online.status === "local-fallback";
}

function renderOnlineStatus() {
  if (!app.els.statusStrip || app.state?.currentRole === "athlete") return;
  if (app.state?.sessionUserId) renderStatusStrip();
}

function refreshOnlineUi() {
  if (!app.els.workspace) return;
  if (!getSessionUser()) {
    render();
    return;
  }
  renderOnlineStatus();
}

function migrateState(state, options = {}) {
  if (!state || !Array.isArray(state.users) || !Array.isArray(state.workouts)) return null;
  const wasBeforeBookingFlow = Number(state.version || 1) < 12;
  const shouldClearManualProgrammingWeek = Number(state.version || 1) < 13;
  const deletedUsers = normalizeDeletedUsers(state.deletedUsers || []);
  const deletedUserIds = new Set(deletedUsers.map((entry) => entry.userId));
  const users = state.users.filter((user) => !deletedUserIds.has(String(user?.id || ""))).map((user) => ({
    ...user,
    loginName: normalizeLoginName(user.loginName || user.id || user.name),
    password: user.password || defaultPasswordForUser(user),
    email: user.email || "",
    phone: user.phone || "",
    active: user.active !== false,
    gender: user.role === "athlete" ? normalizeGender(user.gender) : "-",
    classTime: "-",
  }));
  if (!users.some((user) => user.id === "admin")) {
    users.push({ id: "admin", name: "Admin", loginName: "admin", role: "admin", gender: "-", classTime: "-", password: "admin", email: "", phone: "", active: true });
  }
  const validUserIds = new Set(users.map((user) => String(user.id)));
  const isKnownUser = (userId) => validUserIds.has(String(userId || ""));
  const keepKnownUserIds = (userIds) => [...new Set(userIds || [])].filter(isKnownUser);
  const keepKnownBoosts = (reactions) => {
    const normalized = normalizeReactions(reactions);
    return { ...normalized, boostBy: normalized.boostBy.filter(isKnownUser) };
  };

  const classes = (state.classes || []).map((classEntry) => ({
    ...classEntry,
    duration: getClassDuration(classEntry),
    accessCode: classEntry.accessCode || createClassAccessCode(classEntry),
    recurring: classEntry.recurring ?? !classEntry.custom,
    attendees: wasBeforeBookingFlow ? [] : keepKnownUserIds(classEntry.attendees),
    present: keepKnownUserIds(classEntry.present),
    absent: keepKnownUserIds(classEntry.absent),
  }));
  const workouts = ensureWeeksAroundDate([...(state.workouts || [])], isoDate(new Date()), [-2, -1, 0, 1]).map((workout) => {
    const dayClasses = classes.filter((classEntry) => classEntry.date === workout.date);
    const blocks = normalizeWorkoutBlocks(workout);
    const normalizedWorkout = {
      ...workout,
      blocks,
      accessCode: workout.accessCode || createWorkoutAccessCode(workout.date),
      classesUnlocked:
        Boolean(workout.classesUnlocked) || (dayClasses.length > 0 && dayClasses.every((classEntry) => classEntry.ended)),
    };
    if (shouldClearManualProgrammingWeek && isManualProgrammingClearDate(normalizedWorkout.date)) {
      return clearWorkoutForManualProgramming(normalizedWorkout);
    }
    return {
      ...normalizedWorkout,
      strengthScoreType: getEffectiveStrengthScoreType(normalizedWorkout),
    };
  });
  const resultDedupe = dedupeResultRecordsWithIdMap((state.results || []).filter((result) => isKnownUser(result?.userId)).map((result) => {
    const { reactions, ...rest } = result;
    const reactionsByMode = normalizeResultReactionModes(result);
    return {
      ...rest,
      workoutDate: getResultWorkoutDate(result, workouts),
      reactionsByMode: {
        strength: keepKnownBoosts(reactionsByMode.strength),
        metcon: keepKnownBoosts(reactionsByMode.metcon),
      },
      comments: normalizeResultComments(result.comments).filter((comment) => isKnownUser(comment.userId)),
    };
  }));
  const results = resultDedupe.records;
  const feed = (state.feed || []).filter((item) => isKnownUser(item?.userId)).map((item) => ({
    ...item,
    reactions: keepKnownBoosts(item.reactions),
  }));
  const notifications = normalizeNotifications(state.notifications || []).filter(
    (notification) =>
      isKnownUser(notification.userId) &&
      (!notification.actorId || isKnownUser(notification.actorId))
  );
  const prs = normalizePrRecords(state.prs || []).filter((pr) => isKnownUser(pr.userId));
  syncPrSourceResultIds(prs, resultDedupe.idMap);
  const workoutUnlocks = Array.isArray(state.workoutUnlocks)
    ? state.workoutUnlocks.filter((unlock) => isKnownUser(unlock.userId || unlock.athleteId))
    : [];
  const masterPins = Array.isArray(state.masterPins)
    ? state.masterPins.map((pin) => ({
        ...pin,
        userId: pin.userId || pin.athleteId || "",
      })).filter((pin) => isKnownUser(pin.userId))
    : [];
  const deletedClasses = normalizeDeletedClasses(state.deletedClasses || []);

  const sessionUser = users.find((user) => user.id === state.sessionUserId);
  const resetAthleteToToday = Boolean(options.resetAthleteToToday && sessionUser?.role === "athlete");
  const todayIso = isoDate(new Date());
  return {
    ...state,
    version: CURRENT_VERSION,
    sessionUserId: sessionUser ? sessionUser.id : "",
    currentRole: sessionUser?.role || state.currentRole || "athlete",
    activeView: resetAthleteToToday ? "today" : state.activeView || "today",
    selectedDate: resetAthleteToToday ? todayIso : state.selectedDate || todayIso,
    currentUserId: sessionUser?.role === "athlete" ? sessionUser.id : state.currentUserId || getFirstUserId(users, "athlete"),
    currentStaffId:
      sessionUser && sessionUser.role !== "athlete" ? sessionUser.id : state.currentStaffId || getFirstStaffId(users),
    expandedResultWorkoutId: state.expandedResultWorkoutId || "",
    expandedResultMode: state.expandedResultMode || "",
    expandedResultCommentsKey: state.expandedResultCommentsKey || "",
    leaderboardScope: LEADERBOARD_SCOPES.includes(state.leaderboardScope) ? state.leaderboardScope : "workout",
    complexBuilderOpen: Boolean(state.complexBuilderOpen),
    complexBuilderRows: normalizeBuilderRows(state.complexBuilderRows),
    users,
    workouts,
    results,
    feed,
    notifications,
    prs,
    workoutUnlocks,
    masterPins,
    deletedUsers,
    deletedClasses,
    classes,
  };
}

function saveState() {
  try {
    persistLocalState();
    if (app.state) app.state.lastSaveError = "";
    queueRemoteStateSave();
    return true;
  } catch {
    if (app.state) app.state.lastSaveError = "storage-unavailable";
    toast("Nao foi possivel guardar os dados neste browser.");
    return false;
  }
}

function commitState(successMessage = "") {
  if (!saveState()) return false;
  if (successMessage) toast(successMessage);
  return true;
}

function flushSharedStateNow() {
  if (!app.online.enabled || !app.online.client) return;
  if (app.online.loading || app.online.saving) {
    app.online.pendingSave = true;
    app.online.pendingImmediateSave = true;
    return;
  }
  flushRemoteStateSave();
}

async function commitAccountState(successMessage = "", failureMessage = "Nao consegui guardar a conta na base online.") {
  if (!saveState()) return false;
  if (app.online.enabled) {
    const savedOnline = await flushRemoteStateSave();
    if (!savedOnline) {
      toast(failureMessage);
      return false;
    }
  }
  if (successMessage) toast(successMessage);
  return true;
}

function requireOnlineAccountWriteReady() {
  if (!app.online.enabled) return true;
  if (isOnlineSyncPending()) {
    toast("Ainda estou a carregar as contas online. Espera uns segundos e tenta outra vez.");
    return false;
  }
  if (!app.online.client || hasOnlineSyncFailed()) {
    toast("Nao consegui ligar a base online. Nao vou criar uma conta local que depois desaparece.");
    return false;
  }
  return true;
}

function cloneStateForRollback() {
  return JSON.parse(JSON.stringify(app.state));
}

function restoreStateAfterFailedAccountSave(previousState) {
  if (!previousState) return;
  app.state = previousState;
  try {
    persistLocalState();
  } catch {
    // The visible error was already shown by the failed save path.
  }
}

function requireManage(message = "Apenas Coach ou Admin pode fazer esta acao.") {
  if (canManage()) return true;
  toast(message);
  return false;
}

function requireSignedIn() {
  if (getSessionUser()) return true;
  toast("Inicia sessao para continuar.");
  return false;
}

function normalizeWorkoutBlocks(workout) {
  const blocks = { warmup: "", strength: "", metcon: "", notes: "", ...(workout.blocks || {}) };
  if (
    (workout.title === "Benchmark Friday" || workout.movement === "Deadlift") &&
    [LEGACY_DEADLIFT_STRENGTH, PREVIOUS_DEADLIFT_STRENGTH].includes(String(blocks.strength || "").replace(/\r\n/g, "\n").trim())
  ) {
    blocks.strength = DEFAULT_DEADLIFT_STRENGTH;
  }
  return blocks;
}

function getEffectiveStrengthScoreType(workout) {
  const selectedType = String(workout?.strengthScoreType || "").trim();
  if (scoreTypes[selectedType]) return selectedType;
  return hasStructuredStrengthRows(workout) ? "complex" : "load";
}

function hasStructuredStrengthRows(workout) {
  return parseComplexRowsFromText(workout?.blocks?.strength || "", workout?.movement || "").length >= 2;
}

function normalizePrRecords(prs) {
  if (!Array.isArray(prs)) return [];
  return prs.map((pr) => {
    const prType = pr.prType || "load";
    const config = prTypes[prType] || prTypes.load;
    if (config.unit !== "kg") return pr;
    if (prType === "one_rm") {
      const sourceLoad = pr.sourceLoad || pr.rawValue || pr.value;
      const sourceReps = Number(pr.sourceReps) > 0 ? Number(pr.sourceReps) : 1;
      const normalizedValue = estimateOneRepMax(numericLoad(sourceLoad), sourceReps);
      if (!Number.isFinite(normalizedValue)) return pr;
      const rawValue = formatPrNumber(normalizedValue);
      return {
        ...pr,
        value: parsePrValue(rawValue, "one_rm"),
        rawValue,
        unit: "kg",
        estimated: sourceReps > 1,
        sourceLoad,
        sourceReps,
      };
    }
    const sourceLoad = pr.rawValue || pr.value;
    const reps = repsFromPrType(prType);
    const estimated = estimateOneRepMax(numericLoad(sourceLoad), reps);
    if (!Number.isFinite(estimated)) return pr;
    const rawValue = formatPrNumber(estimated);
    return {
      ...pr,
      prType: "one_rm",
      value: parsePrValue(rawValue, "one_rm"),
      rawValue,
      unit: "kg",
      estimated: reps > 1 || Boolean(pr.estimated),
      sourceLoad,
      sourceReps: pr.sourceReps || reps,
    };
  });
}

function ensureWeeksAroundDate(workouts, date, offsets) {
  const existing = [...workouts];
  const anchor = startOfWeek(new Date(`${date}T12:00:00`));
  offsets.forEach((offset) => {
    const weekStart = addDays(anchor, offset * 7);
    const weekStartIso = isoDate(weekStart);
    const weekEndIso = isoDate(addDays(weekStart, 6));
    const hasAnyDay = existing.some((workout) => workout.date >= weekStartIso && workout.date <= weekEndIso);
    if (!hasAnyDay) {
      existing.push(...createBlankWeekWorkouts(weekStart));
    }
  });
  return existing.sort((a, b) => a.date.localeCompare(b.date));
}

function isManualProgrammingClearDate(date) {
  return date >= MANUAL_PROGRAMMING_CLEAR_START && date <= MANUAL_PROGRAMMING_CLEAR_END;
}

function clearWorkoutForManualProgramming(workout) {
  return {
    ...workout,
    title: "",
    strengthScoreType: "load",
    prType: "load",
    scoreType: "time",
    movement: "",
    blocks: {
      warmup: "",
      strength: "",
      metcon: "",
      notes: "",
    },
  };
}

function defaultPasswordForUser(user) {
  if (user.role === "coach") return "coach";
  if (user.role === "admin") return "admin";
  return "1234";
}

function getFirstUserId(users, role) {
  return users.find((user) => user.role === role)?.id || "";
}

function getFirstStaffId(users) {
  return users.find((user) => user.role === "coach" || user.role === "admin")?.id || "";
}

function createSeedState() {
  const today = new Date();
  const monday = startOfWeek(today);
  const workoutTemplates = [
    {
      title: "Lower body engine",
      strengthScoreType: "complex",
      prType: "three_rm",
      scoreType: "time",
      movement: "Back Squat",
      blocks: {
        warmup: "3 rounds easy pace\n10 air squats\n8 inchworms\n12 banded good mornings",
        strength: "Back Squat\n5 x 3 @ carga moderada\nDescanso 2:00",
        metcon: "For time\n21-15-9\nWall balls\nBox jumps\nBurpees",
        notes: "RX: 9/6 kg wall ball. Scaled: reduzir reps ou step-ups.",
      },
    },
    {
      title: "Pull and press",
      strengthScoreType: "load",
      prType: "five_rm",
      scoreType: "rounds",
      movement: "Strict Press",
      blocks: {
        warmup: "8:00 flow\nRing rows\nScap push-ups\nHollow hold",
        strength: "Strict Press\n6 x 4\nSubir carga mantendo técnica",
        metcon: "AMRAP 12\n8 pull-ups\n10 push-ups\n12 DB snatch",
        notes: "Scaled: jumping pull-up ou ring row.",
      },
    },
    {
      title: "Weightlifting focus",
      strengthScoreType: "load",
      prType: "three_rm",
      scoreType: "load",
      movement: "Clean",
      blocks: {
        warmup: "PVC complex\nFront rack mobility\nTall clean drill",
        strength: "Clean\nEncontrar 3RM técnico\nSem falhar reps",
        metcon: "EMOM 10\nMin 1: 8 cal row\nMin 2: 6 power clean",
        notes: "Pontuação principal: carga do 3RM.",
      },
    },
    {
      title: "Gymnastics density",
      strengthScoreType: "reps",
      prType: "max_reps",
      scoreType: "reps",
      movement: "Pull-up",
      blocks: {
        warmup: "Shoulder prep\nBeat swings\nCore activation",
        strength: "Skill\nToes to bar progressions\nHandstand hold",
        metcon: "Tabata total reps\nPull-ups\nSit-ups\nDB lunges\nCal bike",
        notes: "Pontuação: total de reps.",
      },
    },
    {
      title: "Benchmark Friday",
      strengthScoreType: "load",
      prType: "five_rm",
      scoreType: "time",
      movement: "Deadlift",
      blocks: {
        warmup: "10:00 progressive warm-up\nDeadlift prep\nRun drills",
        strength: DEFAULT_DEADLIFT_STRENGTH,
        metcon: "For time\n400 m run\n30 deadlifts\n400 m run\n30 hand release push-ups",
        notes: "Scaled: reduzir carga e distância.",
      },
    },
    {
      title: "Team Saturday",
      strengthScoreType: "complete",
      prType: "benchmark_score",
      scoreType: "rounds",
      movement: "Team WOD",
      blocks: {
        warmup: "Partner mobility\nLight sled push\nBike easy",
        strength: "Sem força isolada",
        metcon: "Partner AMRAP 24\n20 cal bike\n20 kettlebell swings\n20 sit-ups",
        notes: "Um trabalha, outro descansa.",
      },
    },
    {
      title: "Recovery",
      strengthScoreType: "complete",
      prType: "benchmark_time",
      scoreType: "complete",
      movement: "Mobility",
      blocks: {
        warmup: "Respiração e mobilidade",
        strength: "Sem força",
        metcon: "Zone 2 + alongamentos",
        notes: "Dia leve para recuperar.",
      },
    },
  ];

  const workouts = [-2, -1, 0, 1].flatMap((weekOffset) =>
    workoutTemplates.map((template, index) => {
      const date = isoDate(addDays(monday, weekOffset * 7 + index));
      const workout = {
        id: `w-${date}`,
        date,
        published: true,
        forceUnlocked: false,
        classesUnlocked: false,
        unlockTime: "20:00",
        accessCode: createWorkoutAccessCode(date),
        ...template,
      };
      return isManualProgrammingClearDate(date) ? clearWorkoutForManualProgramming(workout) : workout;
    })
  );

  const users = [
    { id: "ana", name: "Ana Silva", loginName: "ana", role: "athlete", gender: "F", classTime: "-", password: "1234", email: "", phone: "", active: true },
    { id: "tiago", name: "Tiago Rocha", loginName: "tiago", role: "athlete", gender: "M", classTime: "-", password: "1234", email: "", phone: "", active: true },
    { id: "marta", name: "Marta Reis", loginName: "marta", role: "athlete", gender: "F", classTime: "-", password: "1234", email: "", phone: "", active: true },
    { id: "joao", name: "João Costa", loginName: "joao", role: "athlete", gender: "M", classTime: "-", password: "1234", email: "", phone: "", active: true },
    { id: "coach", name: "Coach", loginName: "coach", role: "coach", gender: "-", classTime: "-", password: "coach", email: "", phone: "", active: true },
    { id: "admin", name: "Admin", loginName: "admin", role: "admin", gender: "-", classTime: "-", password: "admin", email: "", phone: "", active: true },
  ];

  const classes = workouts.flatMap((workout) =>
    defaultClassSchedule.map((slot) =>
      createClassEntry(workout.date, slot.time, slot.duration, { recurring: true })
    )
  );

  const todayIso = isoDate(today);
  const todayWorkout = workouts.find((workout) => workout.date === todayIso) || workouts[0];
  const yesterdayWorkout = workouts[Math.max(0, workouts.findIndex((w) => w.id === todayWorkout.id) - 1)];

  const results = [
    {
      id: uniqueId("r"),
      workoutId: todayWorkout.id,
      workoutDate: todayWorkout.date,
      userId: "tiago",
      strengthScore: "3 reps @ 120 kg",
      strengthLoad: "120",
      prType: todayWorkout.prType,
      prRawValue: "120",
      strengthMovement: todayWorkout.movement,
      strengthNotes: "Todas as séries sólidas.",
      metconScore: "12:44",
      metconLevel: "RX",
      metconNotes: "Ritmo constante.",
      reactionsByMode: { strength: { legacyBoost: 0, boostBy: [] }, metcon: { legacyBoost: 6, boostBy: [] } },
      comments: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: uniqueId("r"),
      workoutId: todayWorkout.id,
      workoutDate: todayWorkout.date,
      userId: "marta",
      strengthScore: "3 reps @ 82.5 kg",
      strengthLoad: "82.5",
      prType: todayWorkout.prType,
      prRawValue: "82.5",
      strengthMovement: todayWorkout.movement,
      strengthNotes: "Subiu 2.5 kg.",
      metconScore: "14:10",
      metconLevel: "Scaled",
      metconNotes: "Step-ups nos box jumps.",
      reactionsByMode: { strength: { legacyBoost: 0, boostBy: [] }, metcon: { legacyBoost: 3, boostBy: [] } },
      comments: [],
      createdAt: new Date().toISOString(),
    },
  ];

  const prs = normalizePrRecords([
    { id: uniqueId("pr"), userId: "ana", movement: "Back Squat", prType: "three_rm", value: 92.5, rawValue: "92.5", unit: "kg", date: isoDate(addDays(monday, -4)) },
    { id: uniqueId("pr"), userId: "tiago", movement: "Deadlift", prType: "five_rm", value: 165, rawValue: "165", unit: "kg", date: isoDate(addDays(monday, -2)) },
    { id: uniqueId("pr"), userId: "marta", movement: "Clean", prType: "three_rm", value: 72.5, rawValue: "72.5", unit: "kg", date: isoDate(addDays(monday, -5)) },
  ]);

  const feed = [
    {
      id: uniqueId("f"),
      type: "pr",
      userId: "tiago",
      workoutId: yesterdayWorkout.id,
      text: "novo PR no Deadlift: 165 kg",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      reactions: { legacyBoost: 5, boostBy: [] },
    },
    {
      id: uniqueId("f"),
      type: "result",
      userId: "marta",
      workoutId: yesterdayWorkout.id,
      text: "fechou o treino scaled com boa consistência",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      reactions: { legacyBoost: 2, boostBy: [] },
    },
  ];

  return {
    version: CURRENT_VERSION,
    activeView: "today",
    selectedDate: todayIso,
    sessionUserId: "",
    currentRole: "athlete",
    currentUserId: "ana",
    currentStaffId: "coach",
    expandedResultWorkoutId: "",
    expandedResultMode: "",
    expandedResultCommentsKey: "",
    leaderboardScope: "workout",
    complexBuilderOpen: false,
    complexBuilderRows: [],
    users,
    workouts,
    classes,
    results,
    prs,
    feed,
    notifications: [],
    workoutUnlocks: [],
    masterPins: [],
    deletedUsers: [],
    deletedClasses: [],
  };
}

function render() {
  const today = new Date();
  const sessionUser = getSessionUser();
  app.els.dateLine.textContent = formatDateLong(isoDate(today));
  renderSessionTools(sessionUser);

  if (!sessionUser) {
    document.body?.classList?.remove("athlete-board-view");
    renderLoggedOut();
    return;
  }

  app.state.currentRole = sessionUser.role;
  if (sessionUser.role === "athlete") {
    app.state.currentUserId = sessionUser.id;
  } else {
    app.state.currentStaffId = sessionUser.id;
  }
  if (!canManage() && app.state.activeView === "admin") {
    app.state.activeView = "today";
  }
  const previewingTrainingAsStaff = canManage() && app.state.activeView === "today";
  const athleteBoardMode = sessionUser.role === "athlete" || previewingTrainingAsStaff;
  document.body?.classList?.toggle("athlete-board-view", athleteBoardMode);

  app.els.statusStrip.classList.toggle("hidden", athleteBoardMode);
  app.els.sidePanel.classList.toggle("hidden", athleteBoardMode);
  app.els.layout?.classList.toggle("athlete-main-layout", athleteBoardMode);
  app.els.bottomNav.classList.remove("hidden");
  renderUserPickers();
  renderNavigation();
  renderStatusStrip();
  renderSidePanel();

  if (app.state.activeView === "today") renderToday();
  if (app.state.activeView === "leaderboard") renderLeaderboard();
  if (app.state.activeView === "prs") renderPrs();
  if (app.state.activeView === "community") renderCommunity();
  if (app.state.activeView === "admin") renderAdmin();
}

function renderSessionTools(sessionUser) {
  app.els.rolePickerWrap?.classList.add("hidden");
  app.els.athletePickerWrap.classList.add("hidden");
  app.els.staffPickerWrap.classList.add("hidden");
  app.els.sessionUserBox.classList.toggle("hidden", !sessionUser);
  document.querySelector(".session-logout")?.classList.toggle("hidden", !sessionUser);
  if (!sessionUser) return;
  app.els.sessionUserName.textContent = sessionUser.name;
  app.els.sessionRoleLine.textContent = roleLabel(sessionUser.role);
}

function renderLoggedOut() {
  document.body?.classList?.remove("athlete-board-view");
  app.els.statusStrip.classList.add("hidden");
  app.els.sidePanel.classList.add("hidden");
  app.els.layout?.classList.remove("athlete-main-layout");
  app.els.bottomNav.classList.add("hidden");
  app.els.navButtons.forEach((button) => button.classList.add("hidden"));
  app.els.workspace.innerHTML = `
    <section class="panel login-panel">
      <div class="panel-header">
        <div>
          <span class="panel-kicker">Entrar</span>
          <h2 class="panel-title">Acesso da box</h2>
        </div>
      </div>
      <div class="panel-body">
        <div class="login-grid">
          <div class="result-section">
            <h3>Entrar</h3>
            ${renderLoginOnlineNotice()}
            <div class="form-grid">
              <label class="field">
                <span>Nome de login</span>
                <input id="loginName" placeholder="Ex: ana" autocomplete="username" />
              </label>
              <label class="field">
                <span>Password</span>
                <input id="loginPassword" type="password" placeholder="Password" autocomplete="current-password" />
              </label>
            </div>
            <div class="action-row">
              <button class="btn" data-action="login" type="button">Entrar</button>
            </div>
          </div>
          <div class="result-section">
            <h3>Novo atleta</h3>
            <div class="form-grid">
              <label class="field">
                <span>Nome</span>
                <input id="registerName" placeholder="Nome completo" autocomplete="name" />
              </label>
              <label class="field">
                <span>Nome de login</span>
                <input id="registerLoginName" placeholder="Ex: ana.silva" autocomplete="username" />
              </label>
              <label class="field">
                <span>Password</span>
                <input id="registerPassword" type="password" placeholder="Password" autocomplete="new-password" />
              </label>
              <label class="field">
                <span>Confirmar</span>
                <input id="registerPasswordConfirm" type="password" placeholder="Repetir password" autocomplete="new-password" />
              </label>
              <label class="field">
                <span>Email</span>
                <input id="registerEmail" type="email" placeholder="email@exemplo.com" autocomplete="email" />
              </label>
              <label class="field">
                <span>Telefone</span>
                <input id="registerPhone" type="tel" placeholder="Contacto" autocomplete="tel" />
              </label>
              <label class="field">
                <span>Género</span>
                <select id="registerGender">
                  ${renderGenderOptions("F")}
                </select>
              </label>
            </div>
            <div class="action-row">
              <button class="btn secondary" data-action="register-athlete" type="button">Criar conta</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderLoginOnlineNotice() {
  if (!app.online.enabled) return "";
  let message = "As contas estao sincronizadas com a box.";
  let tone = "online";
  const detail = hasOnlineSyncFailed() ? app.online.lastErrorDetail : "";
  if (isOnlineSyncPending()) {
    message = "A carregar contas online. Espera uns segundos antes de entrar.";
    tone = "pending";
  } else if (hasOnlineSyncFailed()) {
    message = getOnlineFailureMessage();
    tone = "error";
  } else if (app.online.status !== "online") {
    message = "Este dispositivo esta a usar dados locais.";
    tone = "local";
  }
  return `
    <div class="login-sync-notice ${tone}">
      <div>
        <strong>${escapeHtml(getOnlineStatusLabel())}</strong>
        <span>${escapeHtml(message)}</span>
        ${detail ? `<small class="login-sync-detail">${escapeHtml(detail)}</small>` : ""}
      </div>
      ${tone === "error" ? `<button class="btn secondary retry-sync-button" data-action="retry-online-sync" type="button">Tentar novamente</button>` : ""}
    </div>
  `;
}

function getOnlineFailureMessage() {
  if (app.online.lastError === "remote-load-timeout") {
    return "A base online nao respondeu. Confirma a internet e tenta novamente.";
  }
  if (app.online.lastError === "remote-save-timeout") {
    return "A gravação online demorou demasiado. Tenta novamente antes de sair.";
  }
  if (app.online.lastError === "supabase-client-missing") {
    return "Nao consegui carregar a ligacao online. Atualiza a pagina e confirma a internet.";
  }
  if (app.online.lastError === "supabase-client-failed") {
    return "Nao consegui iniciar a ligacao online neste dispositivo.";
  }
  if (app.online.lastError === "remote-save-failed") {
    return "Nao consegui guardar na base online. Tenta novamente.";
  }
  return "Nao consegui carregar a base de dados online neste dispositivo.";
}

function renderAthleteWorkoutPoster(workout, user, options = {}) {
  const canRegister =
    options.canRegister !== undefined ? Boolean(options.canRegister) : app.state.currentRole === "athlete" && user?.role === "athlete";
  return `
    <div class="athlete-template-stack">
      <div class="athlete-workout-poster" data-board-title="TREINO" aria-label="${escapeAttr(workout.title)}">
        <div class="poster-board-content">
          ${renderAthleteWarmupBlock(workout)}
          ${renderAthletePosterBlock({
            tone: "strength",
            label: "STRENGTH",
            body: workout.blocks.strength,
            workout,
            user,
            mode: "strength",
            canRegister,
          })}
          ${renderAthletePosterBlock({
            tone: "wod",
            label: "WOD",
            body: workout.blocks.metcon,
            workout,
            user,
            mode: "metcon",
            canRegister,
          })}
        </div>
      </div>
    </div>
  `;
}

function shouldShowWorkoutWarmup(workout) {
  return Boolean(workout?.blocks?.warmup && getWeekdayNumber(workout.date) === 6);
}

function renderAthleteWarmupBlock(workout) {
  if (!shouldShowWorkoutWarmup(workout)) return "";
  return renderAthletePosterBlock({
    tone: "warmup",
    label: "WARM UP",
    body: workout.blocks.warmup,
    workout,
    user: null,
    mode: "warmup",
    canRegister: false,
  });
}

function renderAthletePosterBlock({ tone, label, body, workout, user, mode, canRegister = false }) {
  const showRegisterControls = Boolean(canRegister && workout && user && mode);
  const isExpanded = app.state.expandedResultWorkoutId === workout?.id && app.state.expandedResultMode === mode;
  const isFocused = app.ui.focusWorkoutZone === mode;
  const activePanel = showRegisterControls && isExpanded ? renderResultPanel(workout, user, mode) : "";
  return `
    <div class="poster-zone-wrap poster-zone-wrap-${escapeAttr(mode)}">
      <article id="workout-zone-${escapeAttr(mode)}" class="poster-template-zone ${tone ? `poster-${tone}` : ""} ${isFocused ? "poster-zone-focused" : ""}" data-zone-title="${escapeAttr(label)}">
        <div class="poster-zone-header" aria-hidden="true"></div>
        <div class="poster-zone-body">
          <div class="poster-zone-copy">
            <pre>${escapeHtml(formatPosterWorkoutText(body, mode, workout))}</pre>
          </div>
          ${
            showRegisterControls
              ? `<div class="poster-zone-actions">
                  ${renderWorkoutBlockResultButton(workout, user, mode)}
                  ${renderWorkoutResultSummary(workout, user, mode)}
                </div>`
              : ""
          }
        </div>
      </article>
      ${activePanel ? `<div class="poster-result-drawer poster-result-drawer-${escapeAttr(mode)}">${activePanel}</div>` : ""}
    </div>
  `;
}

function renderStrengthComplexTable(workout, existing) {
  if (getEffectiveStrengthScoreType(workout) !== "complex") return "";
  const rows = getStrengthComplexRows(workout, existing);
  return `
    <div class="complex-table-wrap">
      <div class="section-heading compact">
        <h3>Registo por set</h3>
        <span class="chip blue">resultado por linha</span>
      </div>
      <div class="complex-set-list complex-score-table">
        <div class="complex-score-header" aria-hidden="true">
          <span>Reps</span>
          <span>Movimento</span>
          <span>Percentagem</span>
          <span>Resultado</span>
        </div>
        ${rows.map((row, index) => renderStrengthComplexScoreRow(row, index)).join("")}
      </div>
    </div>
  `;
}

function renderStrengthComplexRow(row, index) {
  const setNumber = index + 1;
  const status = row.status || "done";
  const split = splitComplexWork(row.work);
  const reps = row.reps || split.reps;
  const movement = row.movement || split.movement;
  return `
    <div class="complex-set-row">
      <span class="complex-set-number">${setNumber}</span>
      <label class="field">
        <span>Trabalho</span>
        <input id="complexWork-${setNumber}" value="${escapeAttr(row.work)}" />
      </label>
      <label class="field narrow">
        <span>%</span>
        <input id="complexPercent-${setNumber}" value="${escapeAttr(row.percent)}" placeholder="65-68%" />
      </label>
      <label class="field narrow">
        <span>Carga</span>
        <input id="complexLoad-${setNumber}" value="${escapeAttr(row.load)}" inputmode="decimal" placeholder="kg" />
      </label>
      <label class="field">
        <span>Estado</span>
        <select id="complexStatus-${setNumber}">
          <option value="done" ${status === "done" ? "selected" : ""}>Feito</option>
          <option value="failed" ${status === "failed" ? "selected" : ""}>Falhou</option>
          <option value="skipped" ${status === "skipped" ? "selected" : ""}>Não fez</option>
        </select>
      </label>
    </div>
  `;
}

function renderStrengthComplexScoreRow(row, index) {
  const setNumber = index + 1;
  const status = row.status || "done";
  const split = splitComplexWork(row.work);
  const reps = row.reps || split.reps;
  const movement = row.movement || split.movement;
  return `
    <div class="complex-set-row complex-score-row">
      <label class="field complex-reps-field">
        <span>Reps</span>
        <span class="complex-readonly-value">${escapeHtml(reps)}</span>
        <input id="complexReps-${setNumber}" type="hidden" value="${escapeAttr(reps)}" />
      </label>
      <label class="field complex-movement-field">
        <span>Movimento</span>
        <span class="complex-readonly-value complex-movement-value">${escapeHtml(movement)}</span>
        <input id="complexMovement-${setNumber}" type="hidden" value="${escapeAttr(movement)}" />
      </label>
      <label class="field complex-percent-field">
        <span>Percentagem</span>
        <span class="complex-readonly-value">${escapeHtml(formatPercentForInput(row.percent))}</span>
        <input id="complexPercent-${setNumber}" type="hidden" value="${escapeAttr(formatPercentForInput(row.percent))}" />
      </label>
      <label class="field complex-result-field">
        <span>Resultado</span>
        <input id="complexLoad-${setNumber}" value="${escapeAttr(row.load)}" inputmode="decimal" placeholder="kg" />
      </label>
      <input id="complexWork-${setNumber}" type="hidden" value="${escapeAttr(row.work || buildComplexWork(reps, movement))}" />
      <input id="complexStatus-${setNumber}" type="hidden" value="${escapeAttr(status === "done" ? "" : status)}" />
    </div>
  `;
}

function getStrengthComplexRows(workout, existing) {
  const savedRows = normalizeComplexSets(existing?.strengthSets);
  const parsedRows = parseComplexRowsFromText(workout.blocks?.strength || "", workout.movement);
  if (parsedRows.length) {
    return parsedRows.map((planned, index) => {
      const saved = savedRows[index] || {};
      return {
        reps: planned.reps || "",
        movement: planned.movement || workout.movement || "",
        work: planned.work || buildComplexWork(planned.reps, planned.movement || workout.movement),
        percent: planned.percent || "",
        load: saved.load || "",
        status: saved.status || "skipped",
      };
    });
  }
  if (savedRows.length) return savedRows;
  return [{
    reps: "",
    movement: workout.movement || "",
    work: workout.movement || "",
    percent: "",
    load: "",
    status: "skipped",
  }];
}

function parseComplexRowsFromText(text, fallbackMovement = "") {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes("@"))
    .flatMap((line) => {
      const [workRaw, ...percentParts] = line.split("@");
      const percent = normalizePercentValue(percentParts.join("@"));
      if (!isPercentLike(percent)) return [];
      return expandComplexWorkRows(workRaw, fallbackMovement).map(({ reps, movement, work }) => ({
        reps,
        movement,
        work,
        percent,
        load: "",
        status: "done",
      }));
    })
    .filter((row) => row.reps || row.movement || row.work || row.percent);
}

function expandComplexWorkRows(workRaw, fallbackMovement = "") {
  const raw = String(workRaw || "").trim();
  const multiplier = raw.match(/^(\d+)\s*x\s*(.+)$/i);
  if (multiplier) {
    const setCount = Math.max(1, Math.min(20, Number(multiplier[1])));
    const inner = multiplier[2].replace(/^\((.*)\)$/, "$1").trim();
    const split = splitComplexWork(inner, fallbackMovement);
    const reps = split.reps || (inner.match(/^(\d+(?:[.,]\d+)?)/)?.[1] || "");
    const movement = split.movement || String(fallbackMovement || "").trim();
    const work = buildComplexWork(reps, movement) || inner || String(fallbackMovement || "").trim();
    return Array.from({ length: setCount }, () => ({
      reps,
      movement,
      work,
    }));
  }
  const { reps, movement } = splitComplexWork(raw, fallbackMovement);
  return [
    {
      reps,
      movement,
      work: buildComplexWork(reps, movement) || raw,
    },
  ];
}

function isPercentLike(value) {
  const target = String(value || "").trim().replace(/\s+/g, "");
  const numericTarget = "\\d+(?:[.,]\\d+)?(?:-\\d+(?:[.,]\\d+)?)?";
  return new RegExp(`^(?:${numericTarget}%?|rpe${numericTarget}(?:/10)?|${numericTarget}(?:/10)?(?:rpe)?)$`, "i").test(target);
}

function readStrengthComplexSets() {
  return Array.from({ length: 16 }, (_, index) => index + 1)
    .map((setNumber) => {
      const reps = valueOf(`complexReps-${setNumber}`);
      const movement = valueOf(`complexMovement-${setNumber}`);
      const work = valueOf(`complexWork-${setNumber}`) || buildComplexWork(reps, movement);
      const load = valueOf(`complexLoad-${setNumber}`);
      return {
        reps,
        movement,
        work: buildComplexWork(reps, movement) || work,
        percent: normalizePercentValue(valueOf(`complexPercent-${setNumber}`)),
        load,
        status: valueOf(`complexStatus-${setNumber}`) || (load ? "done" : "skipped"),
      };
    })
    .filter((row) => row.reps || row.movement || row.work || row.percent || row.load);
}

function normalizeComplexSets(sets) {
  if (!Array.isArray(sets)) return [];
  return sets
    .map((row) => {
      const split = splitComplexWork(row.work || "");
      const reps = String(row.reps || split.reps || "").trim();
      const movement = String(row.movement || split.movement || "").trim();
      const work = buildComplexWork(reps, movement) || String(row.work || "").trim();
      return {
        reps,
        movement,
        work,
        percent: normalizePercentValue(row.percent),
        load: String(row.load || "").trim(),
        status: ["done", "failed", "skipped"].includes(row.status) ? row.status : "done",
      };
    })
    .filter((row) => row.reps || row.movement || row.work || row.percent || row.load);
}

function splitComplexWork(work, fallbackMovement = "") {
  const raw = String(work || "").trim();
  if (!raw) return { reps: "", movement: String(fallbackMovement || "").trim() };
  const numericOnly = raw.match(/^(\d+(?:[.,]\d+)?)$/);
  if (numericOnly) return { reps: numericOnly[1], movement: String(fallbackMovement || "").trim() };
  const match = raw.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (!match) return { reps: "", movement: raw || String(fallbackMovement || "").trim() };
  return { reps: match[1], movement: match[2].trim() || String(fallbackMovement || "").trim() };
}

function buildComplexWork(reps, movement) {
  return [String(reps || "").trim(), String(movement || "").trim()].filter(Boolean).join(" ");
}

function normalizePercentValue(value) {
  return String(value || "").trim().replace(/^@+/, "").replace(/\s+/g, "");
}

function formatPercentForInput(value) {
  const percent = normalizePercentValue(value);
  return percent ? `@${percent}` : "";
}

function getBestCompletedComplexLoad(sets) {
  const loads = normalizeComplexSets(sets)
    .filter((row) => row.status === "done")
    .map((row) => numericLoad(row.load))
    .filter(Number.isFinite);
  if (!loads.length) return "";
  return String(Math.max(...loads));
}

function getBestCompletedComplexSet(sets) {
  return normalizeComplexSets(sets)
    .filter((row) => row.status === "done" && Number.isFinite(numericLoad(row.load)))
    .sort((a, b) => numericLoad(b.load) - numericLoad(a.load))[0];
}

function numericLoad(value) {
  const match = String(value || "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function validateStrengthLoadInputs(rawValue, strengthSets = [], strengthType = "") {
  const loads =
    strengthType === "complex"
      ? [
          ...normalizeComplexSets(strengthSets).filter((row) => row.load).map((row) => row.load),
          ...(rawValue ? [rawValue] : []),
        ]
      : rawValue
        ? [rawValue]
        : [];
  const invalid = loads.some((load) => {
    const value = numericLoad(load);
    return !Number.isFinite(value) || value <= 0;
  });
  return invalid ? "A carga da forca tem de ser maior que zero." : "";
}

function formatComplexStrengthScore(sets, bestLoad) {
  const normalized = normalizeComplexSets(sets);
  const completed = normalized.filter((row) => row.status === "done").length;
  if (!normalized.length && !bestLoad) return "";
  const base = `${completed}/${normalized.length || completed} sets completos`;
  return bestLoad ? `${base} - top set ${formatScoreWithUnit(bestLoad, "kg")}` : base;
}

function renderAthleteDataSummary(user) {
  const results = getResultsForUser(user.id);
  const strengthCount = results.filter((result) => {
    const workout = getWorkoutForResult(result);
    return Boolean(workout && getStrengthScore(result, workout));
  }).length;
  const metconCount = results.filter((result) => Boolean(getMetconScore(result))).length;
  const prCount = app.state.prs.filter((pr) => pr.userId === user.id).length;
  const lastResult = [...results].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
  const lastWorkout = lastResult ? getWorkoutForResult(lastResult) : null;
  const lastLabel = lastResult
    ? `${formatDateShort(lastResult.workoutDate || lastWorkout?.date || isoDate(new Date(lastResult.createdAt || Date.now())))} · ${
        getMetconScore(lastResult) || (lastWorkout ? getStrengthScore(lastResult, lastWorkout) : "") || "resultado"
      }`
    : "sem resultados";
  return `
    <div class="person-data-summary">
      <span>${strengthCount} força</span>
      <span>${metconCount} WOD</span>
      <span>${prCount} PRs</span>
      <span>último: ${escapeHtml(lastLabel)}</span>
    </div>
  `;
}

function formatPosterWorkoutText(body, mode, workout = null) {
  if (mode === "strength") {
    const rows = parseComplexRowsFromText(body, workout?.movement || "");
    if (rows.length >= 2) {
      const introLines = String(body || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.includes("@"));
      return [...introLines, ...rows.map(formatStrengthSetDisplay)].filter(Boolean).join("\n");
    }
  }
  return String(body || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (mode === "strength" ? formatPosterStrengthLine(line, workout?.movement || "") : normalizePosterAtSpacing(line)))
    .join("\n");
}

function formatPosterStrengthLine(line, fallbackMovement = "") {
  const simpleSet = line.match(/^(\d+(?:[.,]\d+)?)\s*@\s*([0-9]+(?:[.,][0-9]+)?(?:\s*-\s*[0-9]+(?:[.,][0-9]+)?)?%?)$/);
  if (!simpleSet) return normalizePosterAtSpacing(line);
  const reps = simpleSet[1].replace(",", ".");
  const percent = ensurePercentSymbol(simpleSet[2]);
  const movement = String(fallbackMovement || "").trim();
  return [reps, "reps", movement, `@${percent}`].filter(Boolean).join(" ");
}

function formatStrengthSetDisplay(row) {
  const reps = String(row.reps || "").replace(",", ".");
  const movement = String(row.movement || "").trim();
  const percent = ensurePercentSymbol(row.percent);
  return [reps, "reps", movement, `@${percent}`].filter(Boolean).join(" ");
}

function normalizePosterAtSpacing(line) {
  return String(line || "").replace(/\s*@\s*/g, " @ ");
}

function ensurePercentSymbol(value) {
  const trimmed = String(value || "").replace(/\s+/g, "");
  return trimmed.endsWith("%") ? trimmed : `${trimmed}%`;
}

function renderWorkoutResultSummary(workout, user, mode) {
  const result = getUserWorkoutResult(workout, user);
  if (!result) return "";
  const isStrength = mode === "strength";
  const score = isStrength ? getStrengthScore(result, workout) : getMetconScore(result);
  if (!score) return "";
  const detail = isStrength ? getStrengthDetail(result, workout) : getMetconDetail(result);
  return `
    <div class="saved-result-summary">
      <span>${isStrength ? "Força registada" : "WOD registado"}</span>
      <strong>${escapeHtml(score)}</strong>
      ${detail ? `<p>${escapeHtml(detail)}</p>` : ""}
    </div>
  `;
}

function renderWorkoutAccessTimeline(workout) {
  const windows = getClassAccessWindows(workout);
  if (!SHOW_STAFF_CLASS_TOOLS || !windows.length) {
    return `
      <div class="access-window-list">
        <span class="chip blue">Disponível às ${escapeHtml(workout.unlockTime)}</span>
      </div>
    `;
  }
  return `
    <div class="access-window-list">
      ${windows
        .slice(0, 5)
        .map(({ classEntry, opensAt, expiresAt }) => {
          const status = getClassAccessStatus(classEntry);
          return `<span class="chip ${escapeAttr(status.chip)}">PIN ${formatTimeOnly(opensAt)}-${formatTimeOnly(expiresAt)}</span>`;
        })
        .join("")}
      ${windows.length > 5 ? `<span class="chip">+${windows.length - 5} aulas</span>` : ""}
      <span class="chip blue">Abertura geral às ${escapeHtml(workout.unlockTime)}</span>
    </div>
  `;
}

function renderWorkoutAccessCodePanel(workout) {
  return `
    <div style="height:16px"></div>
    <section class="workout-block access-code-panel">
      <div class="section-heading">
        <h3>Desbloqueio da aula</h3>
        <span class="chip gold">PIN</span>
      </div>
      <div class="access-code-layout">
        <div>
          <p class="item-sub">Mostra este código na aula para desbloquear o treino antes das ${escapeHtml(workout.unlockTime)}.</p>
          <div class="access-code-value">${escapeHtml(getWorkoutAccessCode(workout))}</div>
        </div>
        ${renderPseudoQr(`${workout.id}-${getWorkoutAccessCode(workout)}`)}
      </div>
    </section>
  `;
}

function renderPseudoQr(seed) {
  const bits = buildQrBits(seed);
  return `
    <div class="qr-code" aria-label="Código visual da aula">
      ${bits.map((active) => `<span class="${active ? "on" : ""}"></span>`).join("")}
    </div>
  `;
}

function formatAttendanceSummary(classEntry) {
  const counts = getAttendanceCounts(classEntry);
  return `${counts.booked} reservas · ${counts.present} presenças · ${counts.absent} faltas · ${counts.pending} por marcar`;
}

function getAttendanceCounts(classEntry) {
  const booked = (classEntry.attendees || []).length;
  const present = (classEntry.present || []).filter((id) => (classEntry.attendees || []).includes(id)).length;
  const absent = (classEntry.absent || []).filter((id) => (classEntry.attendees || []).includes(id)).length;
  return {
    booked,
    present,
    absent,
    pending: Math.max(0, booked - present - absent),
  };
}

function renderClassRoster(classEntry) {
  const athletes = (classEntry.attendees || []).map((id) => getUser(id)).filter(Boolean);
  const expanded = app.state.expandedClassRosterId === classEntry.id;
  const availableAthletes = getAthletes().filter((athlete) => !getBookedClass(classEntry.date, athlete.id));
  const selectId = `addAthleteToClass-${domSafeId(classEntry.id)}`;
  return `
    <div class="class-roster-wrap">
      <div class="quick-add-athlete">
        <label class="field">
          <span>Adicionar atleta à aula</span>
          <select id="${escapeAttr(selectId)}" ${availableAthletes.length ? "" : "disabled"}>
            ${
              availableAthletes.length
                ? availableAthletes
                    .map((athlete) => `<option value="${athlete.id}">${escapeHtml(athlete.name)}</option>`)
                    .join("")
                : `<option value="">Sem atletas livres neste dia</option>`
            }
          </select>
        </label>
        <button class="btn secondary" data-action="add-athlete-to-class" data-class-id="${classEntry.id}" data-select-id="${escapeAttr(selectId)}" type="button" ${availableAthletes.length ? "" : "disabled"}>
          Adicionar
        </button>
      </div>
      <button class="reaction-button" data-action="toggle-class-roster" data-class-id="${classEntry.id}" type="button">
        ${expanded ? "Esconder presenças" : `Ver presenças (${athletes.length})`}
      </button>
      ${
        expanded
          ? `<div class="attendance-list class-roster">
              ${
                athletes.length
                  ? athletes
                      .map((athlete) => {
                        const isPresent = (classEntry.present || []).includes(athlete.id);
                        const isAbsent = (classEntry.absent || []).includes(athlete.id);
                        const status = isPresent ? "Presente" : isAbsent ? "Falta" : "Por marcar";
                        return `
                          <div class="attendance-row">
                            <div>
                              <strong>${escapeHtml(athlete.name)}</strong>
                              <span>${escapeHtml(status)}</span>
                            </div>
                            <div class="attendance-actions">
                              <button class="attendance-chip ${isPresent ? "present" : ""}" data-action="set-attendance" data-class-id="${classEntry.id}" data-user-id="${athlete.id}" data-status="present" type="button">
                                Presente
                              </button>
                              <button class="attendance-chip ${isAbsent ? "absent" : ""}" data-action="set-attendance" data-class-id="${classEntry.id}" data-user-id="${athlete.id}" data-status="absent" type="button">
                                Falta
                              </button>
                            </div>
                          </div>
                        `;
                      })
                      .join("")
                  : `<p class="item-sub">Sem reservas nesta aula.</p>`
              }
            </div>`
          : ""
      }
    </div>
  `;
}

function renderWorkoutCodeUnlockForm(workout) {
  return `
    <div class="code-unlock-box">
      <label class="field">
        <span>PIN da aula</span>
        <input id="workoutAccessCodeInput" inputmode="numeric" maxlength="6" placeholder="Código" />
      </label>
      <button class="btn" data-action="unlock-with-code" data-date="${escapeHtml(workout.date)}" type="button">Desbloquear treino</button>
    </div>
  `;
}

function renderWorkoutBlockResultButton(workout, user, mode) {
  const existing = getUserWorkoutResult(workout, user);
  const expanded = app.state.expandedResultWorkoutId === workout.id && app.state.expandedResultMode === mode;
  const isStrength = mode === "strength";
  const hasResult = isStrength
    ? Boolean(existing?.strengthScore || existing?.prRawValue || existing?.strengthNotes)
    : Boolean(existing?.metconScore || existing?.metconNotes);
  const label = isStrength
    ? expanded
      ? "Fechar força"
      : hasResult
      ? "Editar força"
      : "Registar força"
    : expanded
    ? "Fechar WOD"
    : hasResult
    ? "Editar WOD"
    : "Registar WOD";
  return `
    <button class="btn result-toggle-button ${expanded ? "secondary" : ""}" data-action="toggle-result-form" data-workout-id="${escapeAttr(workout.id)}" data-mode="${escapeAttr(mode)}" type="button">
      ${label}
    </button>
  `;
}

function renderResultPanel(workout, user, mode) {
  if (app.state.expandedResultWorkoutId !== workout.id || app.state.expandedResultMode !== mode) return "";
  return renderResultForm(workout, user, mode);
}

function renderBookingPanel(date, user) {
  if (!SHOW_CLASS_FEATURES) return "";
  if (!user || user.role !== "athlete") return "";
  const classes = getClassesForDate(date);
  if (!shouldShowBookingPanel(date, classes)) return "";
  const bookedClass = getBookedClass(date, user.id);
  return `
    <section class="workout-block booking-panel">
      <div class="section-heading">
        <h3>Reserva de aula</h3>
        <span class="chip blue">abre ${BOOKING_WINDOW_HOURS}h antes</span>
      </div>
      ${
        bookedClass
          ? `<p class="item-sub">Tens reserva para as ${escapeHtml(bookedClass.time)}-${escapeHtml(bookedClass.endTime)}.</p>`
          : `<p class="item-sub">Escolhe a aula que consegues fazer. Podes cancelar antes de começar.</p>`
      }
      <div class="class-grid booking-grid">
        ${
          classes.length
            ? classes.map((classEntry) => renderBookingCard(classEntry, user, bookedClass)).join("")
            : `<div class="empty-state"><h3>Sem aulas neste dia</h3><p>O coach ainda não criou horários para este dia.</p></div>`
        }
      </div>
    </section>
  `;
}

function shouldShowBookingPanel(date, classes) {
  if (!SHOW_CLASS_FEATURES) return false;
  const now = new Date();
  if (!classes.length) {
    return localDateTime(date, "23:59") >= now;
  }
  return classes.some((classEntry) => {
    const startAt = localDateTime(classEntry.date, classEntry.time);
    return !classEntry.ended && now < startAt;
  });
}

function renderBookingCard(classEntry, user, bookedClass) {
  const status = getBookingStatus(classEntry, user.id);
  const isBooked = Boolean(bookedClass && bookedClass.id === classEntry.id);
  const bookedElsewhere = Boolean(bookedClass && bookedClass.id !== classEntry.id);
  const canBook = status.canBook && !isBooked;
  const canCancel = status.canCancel && isBooked;
  return `
    <div class="class-box ${isBooked ? "selected" : ""}">
      <div class="item-title">${escapeHtml(classEntry.time)}-${escapeHtml(classEntry.endTime)}</div>
      <p class="item-sub">${escapeHtml(status.label)}</p>
      <div class="meta-row">
        <span class="chip">${(classEntry.attendees || []).length} reservas</span>
        <span class="chip ${classEntry.ended ? "green" : "gold"}">${classEntry.ended ? "terminada" : "por fechar"}</span>
      </div>
      <div class="action-row" style="justify-content:flex-start">
        ${
          isBooked
            ? `<button class="btn secondary" data-action="cancel-class" data-class-id="${classEntry.id}" type="button" ${canCancel ? "" : "disabled"}>Cancelar</button>`
            : `<button class="btn" data-action="book-class" data-class-id="${classEntry.id}" type="button" ${canBook ? "" : "disabled"}>${bookedElsewhere ? "Trocar para esta" : "Reservar"}</button>`
        }
      </div>
    </div>
  `;
}

function renderUserPickers() {
  const athletes = getAthletes();
  app.els.athleteSelect.innerHTML = athletes
    .map((athlete) => `<option value="${athlete.id}">${escapeHtml(athlete.name)}</option>`)
    .join("");
  app.els.athleteSelect.value = app.state.currentUserId;

  const staff = getStaffUsers();
  app.els.staffSelect.innerHTML = staff
    .map((member) => `<option value="${member.id}">${escapeHtml(member.name)} (${escapeHtml(roleLabel(member.role))})</option>`)
    .join("");
  app.state.currentStaffId = app.state.currentStaffId || staff[0]?.id || "coach";
  app.els.staffSelect.value = app.state.currentStaffId;
}

function renderNavigation() {
  app.els.navButtons.forEach((button) => {
    const adminOnly = button.dataset.view === "admin";
    button.classList.toggle("hidden", adminOnly && !canManage());
    button.classList.toggle("active", button.dataset.view === app.state.activeView);
  });
}

function renderStatusStrip() {
  const workout = getWorkout(app.state.selectedDate) || getTodayWorkout();
  const access = getAccess(workout);
  const results = getResultsForWorkout(workout.id);
  const recentPrs = app.state.prs.filter((pr) => daysBetween(pr.date, isoDate(new Date())) <= 14);
  const weekProgrammed = app.state.workouts.filter((item) => item.published).length;

  app.els.statusStrip.innerHTML = `
    <div class="status-tile">
      <strong>${access.unlocked ? "Aberto" : "Fechado"}</strong>
      <span>${escapeHtml(access.shortLabel)}</span>
    </div>
    <div class="status-tile">
      <strong>${weekProgrammed}</strong>
      <span>treinos programados esta semana</span>
    </div>
    <div class="status-tile">
      <strong>${results.length}</strong>
      <span>resultados no treino selecionado</span>
    </div>
    <div class="status-tile">
      <strong>${recentPrs.length}</strong>
      <span>PRs registados nos últimos 14 dias</span>
    </div>
    <div class="status-tile">
      <strong>${escapeHtml(getOnlineStatusLabel())}</strong>
      <span>estado da sincronização</span>
    </div>
  `;
}

function renderSidePanel() {
  if (app.state.currentRole === "athlete") {
    app.els.sidePanel.innerHTML = "";
    return;
  }

  const user = getSessionUser();
  const workout = getWorkout(app.state.selectedDate) || getTodayWorkout();
  const access = getAccess(workout);
  const classInfo = user?.role === "athlete" ? getAthleteClass(workout.date, user) : null;
  const topResults = getSortedLeaderboard(workout, "metcon").slice(0, 3);
  const recentFeed = getVisibleFeed().slice(0, 3);

  app.els.sidePanel.innerHTML = `
    <div class="side-stack">
      ${
        canManage()
          ? `<div class="side-card">
              <h3>Estado</h3>
              <ul class="mini-list">
                <li><span>Treino</span><strong>${access.unlocked ? "Visível" : "Bloqueado"}</strong></li>
                <li><span>Libertação</span><strong>${escapeHtml(workout.unlockTime)}</strong></li>
                <li><span>Data</span><strong>${escapeHtml(formatDateShort(workout.date))}</strong></li>
                ${
                  classInfo
                    ? `<li><span>Aula</span><strong>${escapeHtml(classInfo.time)}-${escapeHtml(classInfo.endTime)}</strong></li>`
                    : ""
                }
              </ul>
            </div>`
          : ""
      }

      <div class="side-card">
        <h3>Top do treino</h3>
        ${
          topResults.length
            ? `<ul class="mini-list">${topResults
                .map(
                  (row) =>
                    `<li><span>${escapeHtml(getUser(row.userId)?.name || "Atleta")}</span><strong>${escapeHtml(
                      getMetconScore(row)
                    )}</strong></li>`
                )
                .join("")}</ul>`
            : `<p class="item-sub">Ainda sem resultados visíveis.</p>`
        }
      </div>

      <div class="side-card">
        <h3>Comunidade</h3>
        ${
          recentFeed.length
            ? `<ul class="mini-list">${recentFeed
                .map(
                  (item) =>
                    `<li><span>${escapeHtml(getUser(item.userId)?.name || "Atleta")}</span><strong>${escapeHtml(
                      compactFeedText(item.text)
                    )}</strong></li>`
                )
                .join("")}</ul>`
            : `<p class="item-sub">Sem atividade visível.</p>`
        }
      </div>
    </div>
  `;
}

function renderToday() {
  const workout = getWorkout(app.state.selectedDate) || getTodayWorkout();
  app.state.selectedDate = workout.date;
  const access = getAccess(workout);
  const user = getCurrentUser();
  const bookingPanel = renderBookingPanel(workout.date, user);
  const strengthType = getEffectiveStrengthScoreType(workout);
  const canRegister = app.state.currentRole === "athlete" && user?.role === "athlete";
  const previewAsAthlete = canManage();
  if (!user) {
    toast("Inicia sessao para registar resultados.");
    return;
  }

  if (app.state.currentRole === "athlete" && !access.unlocked) {
    app.els.workspace.innerHTML = `
      <section class="panel">
        <div class="panel-header">
          <div>
            <span class="panel-kicker">${escapeHtml(formatDateLong(workout.date))}</span>
            <h2 class="panel-title">Treino fechado</h2>
          </div>
        </div>
        <div class="panel-body">
          ${renderDateTabs()}
          <div style="height:12px"></div>
          ${bookingPanel ? `${bookingPanel}<div style="height:12px"></div>` : ""}
          <div class="locked-panel">
            <div>
              <span class="lock-symbol">LOCK</span>
              <h2>Treino fechado</h2>
              <p>${escapeHtml(access.longLabel)}</p>
              ${renderWorkoutCodeUnlockForm(workout)}
              <div class="action-row"><button class="btn secondary" data-action="refresh-training-access" type="button">Atualizar estado</button></div>
              ${renderWorkoutAccessTimeline(workout)}
            </div>
          </div>
        </div>
      </section>
    `;
    return;
  }

  app.els.workspace.innerHTML = `
    <section class="panel ${canRegister || previewAsAthlete ? "athlete-training-shell" : ""}">
      <div class="panel-header">
        <div>
          <span class="panel-kicker">${escapeHtml(formatDateLong(workout.date))}</span>
          <h2 class="panel-title">${escapeHtml(workout.title)}</h2>
          <div class="meta-row">
            <span class="chip blue">Força: ${escapeHtml(scoreTypes[strengthType])}</span>
            <span class="chip green">Metcon: ${escapeHtml(scoreTypes[workout.scoreType])}</span>
            <span class="chip gold">PR: ${escapeHtml(prTypes[workout.prType || "load"]?.label || "Carga")}</span>
            <span class="chip">${escapeHtml(workout.movement)}</span>
            <span class="chip">${access.unlocked ? "Visível para atleta" : "Visível só para staff"}</span>
          </div>
        </div>
        ${
          canManage()
            ? workout.forceUnlocked
              ? `<button class="btn secondary" data-action="lock-again" data-workout-id="${escapeAttr(workout.id)}" type="button">Voltar a bloquear</button>`
              : `<button class="btn secondary" data-action="unlock-now" data-workout-id="${escapeAttr(workout.id)}" type="button">Desbloquear agora</button>`
            : ""
        }
      </div>
      <div class="panel-body">
        ${renderDateTabs()}
        <div style="height:12px"></div>
        ${app.state.currentRole === "athlete" && bookingPanel ? `${bookingPanel}<div style="height:12px"></div>` : ""}
        ${renderWorkoutBlocks(workout, user, { canRegister, previewAsAthlete })}
        ${canManage() ? renderCoachTodayTools(workout) : ""}
      </div>
    </section>
  `;
}

function renderWorkoutBlocks(workout, user, options = {}) {
  const canRegister =
    options.canRegister !== undefined ? Boolean(options.canRegister) : app.state.currentRole === "athlete" && user?.role === "athlete";
  const previewAsAthlete = Boolean(options.previewAsAthlete);
  const showCoachNotes = canManage();
  if (canRegister || previewAsAthlete) return renderAthleteWorkoutPoster(workout, user, { canRegister });
  return `
    <div class="workout-blocks">
      ${
        shouldShowWorkoutWarmup(workout)
          ? `<article class="workout-block">
              <h3>Warm-up</h3>
              <pre>${escapeHtml(workout.blocks.warmup)}</pre>
            </article>`
          : ""
      }
      <article class="workout-block">
        <div class="workout-block-heading">
          <h3>Força / Skill</h3>
          ${canRegister ? renderWorkoutBlockResultButton(workout, user, "strength") : ""}
        </div>
        <pre>${escapeHtml(workout.blocks.strength)}</pre>
        ${canRegister ? renderWorkoutResultSummary(workout, user, "strength") : ""}
        ${canRegister ? renderResultPanel(workout, user, "strength") : ""}
      </article>
      <article class="workout-block">
        <div class="workout-block-heading">
          <h3>Metcon</h3>
          ${canRegister ? renderWorkoutBlockResultButton(workout, user, "metcon") : ""}
        </div>
        <pre>${escapeHtml(workout.blocks.metcon)}</pre>
        ${canRegister ? renderWorkoutResultSummary(workout, user, "metcon") : ""}
        ${canRegister ? renderResultPanel(workout, user, "metcon") : ""}
      </article>
      ${
        showCoachNotes
          ? `<article class="workout-block coach-notes-block">
              <h3>Notas</h3>
              <pre>${escapeHtml(workout.blocks.notes)}</pre>
            </article>`
          : ""
      }
    </div>
  `;
}

function renderResultForm(workout, user, mode = "strength") {
  const existing = getUserWorkoutResult(workout, user);
  const existingStrengthScore = existing?.strengthScore || (existing?.load ? `${existing.load} kg` : "");
  const prConfig = prTypes[workout.prType || "load"] || prTypes.load;
  const existingPrValue = existing?.prRawValue || existing?.strengthLoad || existing?.load || "";
  const existingStrengthMovement = existing?.strengthMovement || workout.movement;
  const existingMetconScore = existing?.metconScore || existing?.score || "";
  const existingMetconLevel = existing?.metconLevel || existing?.level || "RX";
  const existingMetconNotes = existing?.metconNotes || existing?.notes || "";
  const isStrength = mode === "strength";
  const strengthType = getEffectiveStrengthScoreType(workout);

  return `
    <div class="inline-result-panel">
      <h3>${isStrength ? "Registo da força" : "Registo do WOD"}</h3>
      <div class="result-sections">
        <div class="result-section ${isStrength ? "" : "hidden"}">
          <div class="section-heading">
            <h3>Força</h3>
            <span class="chip blue">${escapeHtml(scoreTypes[strengthType])}</span>
          </div>
          ${renderStrengthComplexTable(workout, existing)}
          ${
            strengthType === "complex"
              ? `<div class="form-grid strength-notes-grid">
                  <label class="field wide">
                    <span>Notas da força</span>
                    <textarea id="strengthNotesInput" placeholder="Ex: última série difícil, técnica sólida">${escapeHtml(existing?.strengthNotes || "")}</textarea>
                  </label>
                </div>`
              : strengthType === "quality"
              ? `<div class="form-grid strength-notes-grid">
                  <div class="field wide">
                    <span>Registo</span>
                    <label class="checkbox-field">
                      <input id="strengthCompleteInput" type="checkbox" ${existing?.strengthScore ? "checked" : ""} />
                      <span>Concluí o trabalho com qualidade</span>
                    </label>
                  </div>
                  <p class="item-sub wide">Este trabalho não cria PR nem entra no ranking de força.</p>
                  <label class="field wide">
                    <span>Notas da força</span>
                    <textarea id="strengthNotesInput" placeholder="Ex: técnica, controlo e adaptações">${escapeHtml(existing?.strengthNotes || "")}</textarea>
                  </label>
                </div>`
              : `<div class="form-grid">
                  <label class="field">
                    <span>Resultado da força</span>
                    <input id="strengthScoreInput" value="${escapeAttr(existingStrengthScore)}" placeholder="Ex: 5 x 3 @ 90 kg" />
                  </label>
                  <label class="field">
                    <span>Valor para PR</span>
                    <input id="prValueInput" value="${escapeAttr(existingPrValue)}" placeholder="${escapeAttr(prConfig.placeholder)}" />
                  </label>
                  <label class="field">
                    <span>Movimento</span>
                    <input id="strengthMovementInput" value="${escapeAttr(existingStrengthMovement)}" />
                  </label>
                  <label class="field">
                    <span>Tipo de PR</span>
                    <input value="${escapeAttr(prConfig.label)}" disabled />
                  </label>
                  <label class="field wide">
                    <span>Notas da força</span>
                    <textarea id="strengthNotesInput" placeholder="Ex: última série difícil, técnica sólida">${escapeHtml(existing?.strengthNotes || "")}</textarea>
                  </label>
                </div>`
          }
        </div>

        <div class="result-section ${isStrength ? "hidden" : ""}">
          <div class="section-heading">
            <h3>Metcon</h3>
            <span class="chip green">${escapeHtml(scoreTypes[workout.scoreType])}</span>
          </div>
          <div class="form-grid">
        ${renderMetconScoreInput(workout, existingMetconScore)}
        <label class="field">
          <span>Versão</span>
          <select id="metconLevelInput">
            ${["RX", "Scaled", "Adaptado"].map(
              (level) => `<option value="${level}" ${existingMetconLevel === level ? "selected" : ""}>${level}</option>`
            ).join("")}
          </select>
        </label>
        <label class="field wide">
          <span>Notas</span>
          <textarea id="metconNotesInput" placeholder="Notas públicas do metcon">${escapeHtml(existingMetconNotes)}</textarea>
        </label>
      </div>
        </div>
      </div>
      <div class="action-row">
        <button class="btn" data-action="save-result" type="button">${isStrength ? "Guardar força" : "Guardar WOD"}</button>
        <button class="btn secondary" data-action="toggle-result-form" data-workout-id="${escapeAttr(workout.id)}" data-mode="${escapeAttr(mode)}" type="button">${isStrength ? "Fechar força" : "Fechar WOD"}</button>
      </div>
    </section>
  `;
}

function renderMetconScoreInput(workout, existingScore = "") {
  if (workout.scoreType === "rounds") {
    const parts = splitRoundsScore(existingScore);
    return `
      <div class="field rounds-score-field">
        <span>Resultado do metcon</span>
        <div class="rounds-score-grid" role="group" aria-label="Resultado por rondas e reps">
          <label>
            <span>Rondas</span>
            <input id="metconRoundsInput" value="${escapeAttr(parts.rounds)}" inputmode="numeric" placeholder="5" />
          </label>
          <span class="rounds-score-separator">+</span>
          <label>
            <span>Reps</span>
            <input id="metconRepsInput" value="${escapeAttr(parts.reps)}" inputmode="numeric" placeholder="12" />
          </label>
        </div>
        <input id="metconScoreInput" type="hidden" value="${escapeAttr(existingScore)}" />
      </div>
    `;
  }
  if (workout.scoreType !== "time") {
    return `
      <label class="field">
        <span>Resultado do metcon</span>
        <input id="metconScoreInput" value="${escapeAttr(existingScore)}" placeholder="Ex: 5+12 ou 140 reps" />
      </label>
    `;
  }
  const parts = splitTimeScore(existingScore);
  return `
    <div class="field time-score-field">
      <span>Resultado do metcon</span>
      <div class="time-score-grid" role="group" aria-label="Resultado por tempo">
        <label>
          <span>Minutos</span>
          <input id="metconMinutesInput" value="${escapeAttr(parts.minutes)}" inputmode="numeric" placeholder="12" />
        </label>
        <span class="time-score-separator">:</span>
        <label>
          <span>Segundos</span>
          <input id="metconSecondsInput" value="${escapeAttr(parts.seconds)}" inputmode="numeric" placeholder="35" />
        </label>
      </div>
    </div>
  `;
}

function splitRoundsScore(score) {
  const raw = String(score || "").trim().toLowerCase();
  const compact = raw.replace(/\s+/g, "");
  const plusMatch = compact.match(/^(\d+)?\+(\d+)?$/);
  if (plusMatch) return { rounds: plusMatch[1] || "", reps: plusMatch[2] || "" };
  const wordsMatch = raw.match(/(\d+)\s*(?:rounds?|rondas?)\D+(\d+)\s*(?:reps?|repeti[cç][oõ]es)?/i);
  if (wordsMatch) return { rounds: wordsMatch[1] || "", reps: wordsMatch[2] || "" };
  return { rounds: "", reps: "" };
}

function normalizeRoundsScore(score) {
  const parts = splitRoundsScore(score);
  if (!parts.rounds && !parts.reps) return "";
  return `${Number(parts.rounds || 0)}+${Number(parts.reps || 0)}`;
}

function splitTimeScore(score) {
  const match = String(score || "").trim().match(/^(\d+)(?::(\d{1,2}))?/);
  if (!match) return { minutes: "", seconds: "" };
  return {
    minutes: match[1] || "",
    seconds: match[2] || "",
  };
}

function normalizeTimeScore(score) {
  const raw = String(score || "").trim().toLowerCase();
  const normalized = raw
    .replace(/\s+/g, "")
    .replace(/^(\d+)m([0-5]?\d)s?$/, "$1:$2");
  const match = normalized.match(/^(\d{1,3}):([0-5]?\d)$/);
  if (!match) return "";
  return `${Number(match[1])}:${String(Number(match[2])).padStart(2, "0")}`;
}

function readMetconScoreInput(workout) {
  if (workout.scoreType === "rounds") {
    const fallback = valueOf("metconScoreInput");
    const roundsRaw = valueOf("metconRoundsInput");
    const repsRaw = valueOf("metconRepsInput");
    if (!roundsRaw && !repsRaw) {
      if (!fallback) return { score: "", error: "" };
      const parsedFallback = normalizeRoundsScore(fallback);
      if (!parsedFallback) return { score: "", error: "Resultado invalido. Usa rondas e reps." };
      return { score: parsedFallback, error: "" };
    }
    const rounds = Number(roundsRaw || 0);
    const reps = Number(repsRaw || 0);
    if (!Number.isInteger(rounds) || rounds < 0) {
      return { score: "", error: "Rondas devem ser um numero valido." };
    }
    if (!Number.isInteger(reps) || reps < 0) {
      return { score: "", error: "Reps devem ser um numero valido." };
    }
    return { score: `${rounds}+${reps}`, error: "" };
  }
  if (workout.scoreType !== "time") return { score: valueOf("metconScoreInput"), error: "" };
  const fallback = valueOf("metconScoreInput");
  const minutesRaw = valueOf("metconMinutesInput");
  const secondsRaw = valueOf("metconSecondsInput");
  if (!minutesRaw && !secondsRaw) {
    if (!fallback) return { score: "", error: "" };
    const parsedFallback = normalizeTimeScore(fallback);
    if (!parsedFallback) return { score: "", error: "Tempo invalido. Usa minutos e segundos." };
    return { score: parsedFallback, error: "" };
  }
  const minutes = Number(minutesRaw || 0);
  const seconds = Number(secondsRaw || 0);
  if (!Number.isInteger(minutes) || minutes < 0) {
    return { score: "", error: "Minutos devem ser um número válido." };
  }
  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 59) {
    return { score: "", error: "Segundos devem estar entre 0 e 59." };
  }
  return { score: `${minutes}:${String(seconds).padStart(2, "0")}`, error: "" };
}

function renderCoachTodayTools(workout) {
  if (!SHOW_STAFF_CLASS_TOOLS) return renderWorkoutAccessCodePanel(workout);
  const classes = getClassesForDate(workout.date);
  return `
    <div style="height:16px"></div>
    <section class="workout-block">
      <div class="section-heading">
        <h3>Aulas do dia</h3>
        <span class="chip gold">PIN por aula</span>
      </div>
      <div class="class-grid">
        ${
          classes.length
            ? classes.map((item) => renderClassCard(item, { canDelete: false })).join("")
            : `<div class="empty-state"><h3>Sem aulas neste dia</h3><p>Cria as horas no separador Aulas.</p></div>`
        }
      </div>
    </section>
    ${renderMasterPinPanel(workout)}
  `;
}

function renderMasterPinPanel(workout) {
  const pins = getMasterPinsForWorkout(workout);
  const athletes = getAthletes();
  return `
    <section class="workout-block">
      <div class="section-heading">
        <h3>PIN master diário</h3>
        <span class="chip gold">uso único</span>
      </div>
      <div class="form-grid">
        <label class="field">
          <span>Atleta</span>
          <select id="masterPinAthlete">
            ${athletes.map((athlete) => `<option value="${athlete.id}">${escapeHtml(athlete.name)}</option>`).join("")}
          </select>
        </label>
        <div class="field add-athlete-action">
          <span>&nbsp;</span>
          <button class="btn" data-action="generate-master-pin" data-workout-id="${escapeAttr(workout.id)}" type="button">Gerar PIN</button>
        </div>
      </div>
      ${
        pins.length
          ? `<div class="mini-list master-pin-list">${pins
              .map((pin) => {
                const athlete = getUser(getMasterPinUserId(pin));
                return `<div class="mini-row"><span>${escapeHtml(athlete?.name || "Atleta")}</span><strong>${escapeHtml(pin.code)}</strong><em>${pin.used ? "usado" : "ativo"}</em></div>`;
              })
              .join("")}</div>`
          : `<p class="item-sub">Gera um PIN de uso único para desbloquear um atleta neste treino, sem depender da hora da aula.</p>`
      }
    </section>
  `;
}

function renderLeaderboard() {
  const workout = getWorkout(app.state.selectedDate) || getTodayWorkout();
  const access = getAccess(workout);
  const scope = getLeaderboardScope();
  const scopeTabs = renderLeaderboardScopeTabs(scope);

  if (app.state.currentRole === "athlete" && !access.unlocked && scope === "workout") {
    app.els.workspace.innerHTML = `
      <section class="panel">
        <div class="panel-header">
          <div>
            <span class="panel-kicker">${escapeHtml(formatDateLong(workout.date))}</span>
            <h2 class="panel-title">Ranking fechado</h2>
          </div>
        </div>
        <div class="panel-body">
          ${scopeTabs}
          <div class="empty-state">
            <h3>O leaderboard abre com o treino</h3>
            <p>${escapeHtml(access.longLabel)}</p>
          </div>
        </div>
      </section>
    `;
    return;
  }

  if (scope === "week" || scope === "general") {
    renderPeriodLeaderboard(scope, workout, scopeTabs);
    return;
  }

  const metconRows = getSortedLeaderboard(workout, "metcon");
  const strengthRows = getSortedLeaderboard(workout, "strength");
  const strengthSections = buildLeaderboardSections(strengthRows, workout, "strength");
  const metconSections = buildLeaderboardSections(metconRows, workout, "metcon");
  app.els.workspace.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <span class="panel-kicker">Leaderboard · ${escapeHtml(formatDateLong(workout.date))}</span>
          <h2 class="panel-title">${escapeHtml(workout.title)}</h2>
          <div class="meta-row">
            <span class="chip blue">${strengthRows.length} força</span>
            <span class="chip green">${metconRows.length} WOD</span>
          </div>
        </div>
      </div>
      <div class="panel-body">
        ${scopeTabs}
        ${renderDateTabs()}
        <div style="height:12px"></div>
        <div class="leaderboard-columns">
          ${renderLeaderboardColumn("Força", strengthSections, workout, "strength")}
          ${renderLeaderboardColumn("Metcon", metconSections, workout, "metcon")}
        </div>
      </div>
    </section>
  `;
}

function getLeaderboardScope() {
  return LEADERBOARD_SCOPES.includes(app.state?.leaderboardScope) ? app.state.leaderboardScope : "workout";
}

function selectLeaderboardScope(scope) {
  if (!LEADERBOARD_SCOPES.includes(scope)) return;
  app.state.leaderboardScope = scope;
  saveState();
  render();
}

function renderLeaderboardScopeTabs(scope) {
  const labels = { workout: "Treino", week: "Semana", general: "Geral" };
  return `
    <div class="ranking-scope-tabs" role="tablist" aria-label="Periodo do ranking">
      ${LEADERBOARD_SCOPES.map((item) => `
        <button class="ranking-scope-button ${scope === item ? "active" : ""}" data-action="select-leaderboard-scope" data-scope="${item}" type="button" aria-selected="${scope === item}">
          ${labels[item]}
        </button>
      `).join("")}
    </div>
  `;
}

function renderPeriodLeaderboard(scope, selectedWorkout, scopeTabs) {
  const period = getLeaderboardPeriod(scope, selectedWorkout);
  const rows = buildPeriodRanking(period.workouts);
  const title = scope === "week" ? "Ranking semanal" : "Ranking geral";
  const periodLabel = scope === "week" ? formatWeekRange(period.startDate) : `${formatDateShort(period.startDate)} a ${formatDateShort(period.endDate)}`;
  const femaleRows = rows.filter((row) => row.gender === "F");
  const maleRows = rows.filter((row) => row.gender === "M");

  app.els.workspace.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <span class="panel-kicker">${escapeHtml(title)} · ${escapeHtml(periodLabel)}</span>
          <h2 class="panel-title">${escapeHtml(title)}</h2>
          <div class="meta-row">
            <span class="chip gold">${rows.length} atletas</span>
            <span class="chip blue">${period.workouts.length} treinos</span>
          </div>
        </div>
      </div>
      <div class="panel-body">
        ${scopeTabs}
        ${scope === "week" ? `${renderDateTabs()}<div style="height:12px"></div>` : ""}
        <div class="period-ranking-grid">
          ${renderPeriodRankingList("Feminino", femaleRows)}
          ${renderPeriodRankingList("Masculino", maleRows)}
        </div>
      </div>
    </section>
  `;
}

function getLeaderboardPeriod(scope, selectedWorkout) {
  const anchorDate = selectedWorkout?.date || app.state.selectedDate || isoDate(new Date());
  const weekStart = startOfWeek(new Date(`${anchorDate}T12:00:00`));
  const endDate = isoDate(addDays(weekStart, 6));
  const startDate =
    scope === "week"
      ? isoDate(weekStart)
      : isoDate(addDays(weekStart, -7 * (GENERAL_RANKING_WEEKS - 1)));
  const workouts = app.state.workouts
    .filter((workout) => workout.date >= startDate && workout.date <= endDate)
    .sort((left, right) => left.date.localeCompare(right.date));
  return { startDate, endDate, workouts };
}

function renderPeriodRankingList(title, rows) {
  return `
    <section class="workout-block period-ranking-list">
      <div class="section-heading">
        <h3>${escapeHtml(title)}</h3>
        <span class="chip gold">Pontos</span>
      </div>
      ${
        rows.length
          ? `<div class="list">${rows.map((row, index) => renderPeriodLeaderRow(row, index + 1)).join("")}</div>`
          : `<div class="empty-state"><h3>Ainda sem pontos</h3><p>Os pontos aparecem quando houver resultados registados.</p></div>`
      }
    </section>
  `;
}

function renderPeriodLeaderRow(row, rank) {
  return `
    <article class="item-card">
      <div class="leader-row">
        <span class="rank">${rank}</span>
        <div>
          <div class="item-title leader-title">
            <span>${escapeHtml(row.name)}</span>
            ${row.hasStrengthPr ? `<span class="pr-highlight-badge" title="Novo PR na forca" aria-label="Novo PR na forca"><span class="pr-highlight-icon" aria-hidden="true"></span>PR</span>` : ""}
          </div>
          <p class="item-sub">${row.workoutCount} treinos · Forca ${row.strengthPoints} · Metcon ${row.metconPoints}</p>
        </div>
        <strong class="score period-score">${row.points} pts</strong>
      </div>
    </article>
  `;
}

function buildPeriodRanking(workouts) {
  const totals = new Map();
  (workouts || []).forEach((workout) => {
    ["strength", "metcon"].forEach((mode) => {
      getRankingPointEntries(workout, mode).forEach((entry) => {
        const user = getUser(entry.result.userId);
        if (!user || user.role !== "athlete" || user.active === false) return;
        const current = totals.get(user.id) || {
          userId: user.id,
          name: user.name,
          gender: getUserGender(user.id),
          points: 0,
          strengthPoints: 0,
          metconPoints: 0,
          workoutIds: new Set(),
          hasStrengthPr: false,
        };
        current.points += entry.points;
        current.workoutIds.add(workout.id);
        if (mode === "strength") {
          current.strengthPoints += entry.points;
          current.hasStrengthPr = current.hasStrengthPr || resultHasStrengthPr(entry.result, workout);
        } else {
          current.metconPoints += entry.points;
        }
        totals.set(user.id, current);
      });
    });
  });

  return [...totals.values()]
    .map((row) => ({ ...row, workoutCount: row.workoutIds.size }))
    .sort((left, right) =>
      right.points - left.points ||
      right.strengthPoints - left.strengthPoints ||
      right.metconPoints - left.metconPoints ||
      left.name.localeCompare(right.name, "pt-PT")
    );
}

function getRankingPointEntries(workout, mode) {
  const groups = new Map();
  getSortedLeaderboard(workout, mode).forEach((result) => {
    const key = getRankingPointGroup(result, mode);
    const rows = groups.get(key) || [];
    rows.push(result);
    groups.set(key, rows);
  });

  return [...groups.values()].flatMap((rows) => {
    let place = 0;
    let previousValue = null;
    return rows.map((result, index) => {
      const value = getLeaderboardSortValue(result, workout, mode);
      if (index === 0 || value !== previousValue) place = index + 1;
      previousValue = value;
      return { result, points: getRankingPointsForPlace(place), place };
    });
  });
}

function getRankingPointGroup(result, mode) {
  const gender = getUserGender(result.userId);
  if (mode === "strength") return `strength-${gender}`;
  return `metcon-${gender}-${normalizeResultLevel(result.metconLevel || result.level)}`;
}

function getRankingPointsForPlace(place) {
  const index = Math.max(0, Math.min(Number(place || 1) - 1, RANKING_POINTS_BY_PLACE.length - 1));
  return RANKING_POINTS_BY_PLACE[index];
}

function buildLeaderboardSections(rows, workout, mode) {
  if (mode === "strength") {
    return buildGenderLeaderboardSections(rows, workout, mode, "Força");
  }
  return buildLevelGenderLeaderboardSections(rows, workout);
}

function buildGenderLeaderboardSections(rows, workout, mode, titlePrefix) {
  return ["F", "M"]
    .map((gender) => {
      const groupRows = rows.filter((result) => getUserGender(result.userId) === gender);
      return {
        title: `${titlePrefix} · ${genderLabel(gender)}`,
        chip: mode === "strength" ? scoreTypes[getEffectiveStrengthScoreType(workout)] : scoreTypes[workout.scoreType],
        mode,
        rows: groupRows,
      };
    })
    .filter((section) => section.rows.length);
}

function buildLevelGenderLeaderboardSections(rows, workout) {
  return ["RX", "Scaled"]
    .flatMap((level) =>
      ["F", "M"].map((gender) => {
        const groupRows = rows.filter(
          (result) => normalizeResultLevel(result.metconLevel || result.level) === level && getUserGender(result.userId) === gender
        );
        return {
          title: `Metcon · ${level} · ${genderLabel(gender)}`,
          chip: scoreTypes[workout.scoreType],
          mode: "metcon",
          rows: groupRows,
        };
      })
    )
    .filter((section) => section.rows.length);
}

function getUserGender(userId) {
  return normalizeGender(getUser(userId)?.gender);
}

function normalizeResultLevel(level) {
  const raw = String(level || "RX").trim().toLowerCase();
  return raw === "scaled" || raw === "scale" || raw === "sc" || raw === "adaptado" ? "Scaled" : "RX";
}

function renderLeaderboardColumn(title, sections, workout, mode) {
  return `
    <div class="leaderboard-column leaderboard-column-${mode}">
      ${
        sections.length
          ? sections.map((section) => renderLeaderboardList(section.title, section.rows, workout, section.mode, section.chip)).join("")
          : `<div class="empty-state"><h3>Sem ${escapeHtml(title)}</h3><p>Quando houver registos de ${escapeHtml(title.toLowerCase())}, aparecem aqui.</p></div>`
      }
    </div>
  `;
}

function renderLeaderboardList(title, rows, workout, mode, chipLabel = "") {
  return `
    <section class="workout-block">
      <div class="section-heading">
        <h3>${escapeHtml(title)}</h3>
        <span class="chip ${mode === "strength" ? "blue" : "green"}">${escapeHtml(
          chipLabel || (mode === "strength" ? scoreTypes[getEffectiveStrengthScoreType(workout)] : scoreTypes[workout.scoreType])
        )}</span>
      </div>
      ${
        rows.length
          ? `<div class="list">${rows
              .map((result, index) => renderLeaderRow(result, index + 1, workout, mode))
              .join("")}</div>`
          : `<div class="empty-state"><h3>Ainda sem resultados</h3><p>Quando os atletas registarem, este ranking aparece aqui.</p></div>`
      }
    </section>
  `;
}

function renderLeaderRow(result, rank, workout, mode) {
  const user = getUser(result.userId);
  const mainScore = mode === "strength" ? getStrengthRankingScore(result, workout) : getMetconScore(result);
  const detail = mode === "strength" ? getStrengthDetail(result, workout) : getMetconDetail(result);
  const reactions = getResultReactions(result, mode);
  const currentUser = getCurrentUser();
  const boostCount = getBoostCount(reactions);
  const gaveBoost = hasBoostFrom(reactions, currentUser?.id);
  const comments = getResultComments(result, mode);
  const commentsOpen = app.state.expandedResultCommentsKey === getResultCommentKey(result.id, mode);
  const commentInputId = `resultComment-${mode}-${domSafeId(result.id)}`;
  const hasPrHighlight = mode === "strength" && resultHasStrengthPr(result, workout);
  return `
    <article class="item-card">
      <div class="leader-row">
        <span class="rank">${rank}</span>
        <div>
          <div class="item-title leader-title">
            <span>${escapeHtml(user?.name || "Atleta")}</span>
            ${hasPrHighlight ? `<span class="pr-highlight-badge" title="Novo PR na força" aria-label="Novo PR na força"><span class="pr-highlight-icon" aria-hidden="true"></span>PR</span>` : ""}
          </div>
          <p class="item-sub">${escapeHtml(detail)}</p>
        </div>
        <strong class="score">${escapeHtml(mainScore)}</strong>
      </div>
      <div class="leader-actions">
        <button class="reaction-button ${gaveBoost ? "active" : ""}" data-action="toggle-result-boost" data-result-id="${escapeAttr(result.id)}" data-mode="${escapeAttr(mode)}" type="button" aria-pressed="${gaveBoost}">
          Boost ${boostCount}
        </button>
        <button class="reaction-button ${commentsOpen ? "active" : ""}" data-action="toggle-result-comments" data-result-id="${escapeAttr(result.id)}" data-mode="${escapeAttr(mode)}" type="button">
          ${commentsOpen ? "Fechar comentários" : `Comentários da box ${comments.length}`}
        </button>
      </div>
      ${commentsOpen ? renderResultComments(result, commentInputId, mode) : ""}
    </article>
  `;
}

function resultHasStrengthPr(result, workout) {
  if (!result || !workout) return false;
  const movement = String(result.strengthMovement || workout.movement || "").toLowerCase();
  return app.state.prs.some((pr) => {
    if (pr.userId !== result.userId) return false;
    if (pr.sourceResultId && result.id && pr.sourceResultId === result.id) return true;
    const sameWorkout = pr.workoutId === workout.id || pr.date === workout.date;
    return sameWorkout && String(pr.movement || "").toLowerCase() === movement;
  });
}

function renderResultComments(result, inputId, mode) {
  const comments = getResultComments(result, mode);
  return `
    <div class="result-comments">
      ${
        comments.length
          ? `<div class="comment-list">
              ${comments.map(renderResultComment).join("")}
            </div>`
          : `<p class="comment-empty">Sem comentários ainda.</p>`
      }
      <div class="comment-form">
        <input id="${escapeAttr(inputId)}" maxlength="180" placeholder="Responder na ${mode === "strength" ? "força" : "WOD"}" />
        <button class="btn secondary" data-action="add-result-comment" data-result-id="${escapeAttr(result.id)}" data-input-id="${escapeAttr(inputId)}" data-mode="${escapeAttr(mode)}" type="button">
          Comentar
        </button>
      </div>
    </div>
  `;
}

function renderResultComment(comment) {
  const user = getUser(comment.userId);
  const createdAt = comment.createdAt ? new Date(comment.createdAt) : null;
  const timeLabel = createdAt && !Number.isNaN(createdAt.getTime()) ? formatDateTimeShort(createdAt) : "";
  const authorRole = comment.authorRole || user?.role || "athlete";
  return `
    <div class="comment-row">
      <div>
        <strong>${escapeHtml(user?.name || "Atleta")} <em>${escapeHtml(roleLabel(authorRole))}</em></strong>
        ${timeLabel ? `<span>${escapeHtml(timeLabel)}</span>` : ""}
      </div>
      <p>${escapeHtml(comment.text)}</p>
    </div>
  `;
}

function renderPrs() {
  const user = getCurrentUser();
  const prs = app.state.currentRole === "athlete"
    ? app.state.prs.filter((pr) => pr.userId === user.id)
    : [...app.state.prs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const groups = groupPrHistory(prs);

  app.els.workspace.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <span class="panel-kicker">Records pessoais</span>
          <h2 class="panel-title">${app.state.currentRole === "athlete" ? escapeHtml(user.name) : "PRs da box"}</h2>
        </div>
      </div>
      <div class="panel-body">
        ${
          groups.length
            ? `<div class="list">${groups.map(renderPrHistoryCard).join("")}</div>`
            : `<div class="empty-state"><h3>Sem PRs registados</h3><p>Quando houver cargas novas ou benchmarks, ficam guardados aqui.</p></div>`
        }
      </div>
    </section>
  `;
}

function groupPrHistory(prs) {
  const grouped = new Map();
  prs.forEach((pr) => {
    const key = `${pr.userId}|${String(pr.movement).toLowerCase()}|${pr.prType || "load"}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(pr);
  });

  return [...grouped.values()]
    .map((items) => {
      const first = items[0];
      const prType = first.prType || "load";
      const best = getBestPrFromList(items, prType);
      const history = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
      return {
        key: buildPrGroupKey(first.userId, first.movement, prType),
        best,
        history,
        prType,
        user: getUser(first.userId),
        movement: first.movement,
      };
    })
    .sort((a, b) => new Date(b.best.date) - new Date(a.best.date));
}

function buildPrGroupKey(userId, movement, prType) {
  return `${userId}|${String(movement).toLowerCase()}|${prType || "load"}`;
}

function getBestPrFromList(items, prType) {
  return [...items].sort((a, b) => comparePrRecords(a, b, prType))[0];
}

function renderPrHistoryCard(group) {
  const label = group.best?.estimated ? "1RM estimado" : prTypes[group.prType]?.label || "PR";
  const expanded = app.state.expandedPrKey === group.key;
  const sourceValue = formatPrSourceValue(group.best);
  const estimatedValue = sourceValue ? formatPrValue(group.best) : "";
  return `
    <article class="item-card pr-card">
      <div class="item-row">
        <div>
          <button class="movement-button" data-action="toggle-pr-history" data-key="${escapeAttr(group.key)}" type="button">
            ${escapeHtml(group.movement)}
          </button>
          <p class="item-sub">${escapeHtml(group.user?.name || "Atleta")} · ${escapeHtml(label)} · ${group.history.length} registos</p>
        </div>
        <div class="pr-score-stack">
          <strong class="score">${escapeHtml(sourceValue || formatPrValue(group.best))}</strong>
          ${estimatedValue ? `<span class="pr-estimate">${escapeHtml(estimatedValue)}<small>estimado</small></span>` : ""}
        </div>
      </div>
      <div class="pr-card-footer">
        <button class="reaction-button" data-action="toggle-pr-history" data-key="${escapeAttr(group.key)}" type="button">
          ${expanded ? "Esconder histórico" : "Ver histórico"}
        </button>
      </div>
      ${
        expanded
          ? `<div class="pr-history">
              <div class="pr-history-title">Histórico</div>
              ${group.history
                .map(
                  (pr) => `
                    <div class="pr-history-row ${pr.id === group.best.id ? "best" : ""}">
                      <span>${escapeHtml(formatDateShort(pr.date))}</span>
                      <strong>${escapeHtml(formatPrSourceValue(pr) || formatPrValue(pr))}</strong>
                      <em>${pr.id === group.best.id ? "melhor" : "anterior"}${pr.estimated ? " · estimado" : ""}</em>
                    </div>
                  `
                )
                .join("")}
            </div>`
          : ""
      }
    </article>
  `;
}

function renderCommunity() {
  const feed = getVisibleFeed();
  app.els.workspace.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <span class="panel-kicker">Comunidade</span>
          <h2 class="panel-title">Atividade da box</h2>
        </div>
      </div>
      <div class="panel-body">
        ${
          feed.length
            ? `<div class="list">${feed.map(renderFeedCard).join("")}</div>`
            : `<div class="empty-state"><h3>Sem atividade visível</h3><p>Resultados e PRs aparecem aqui quando forem publicados.</p></div>`
        }
      </div>
    </section>
  `;
}

function renderFeedCard(item) {
  const user = getUser(item.userId);
  const workout = app.state.workouts.find((entry) => entry.id === item.workoutId);
  const viewLabel = item.type === "pr" ? "Ver PR" : "Ver treino";
  const gaveBoost = hasBoostFrom(item.reactions, getCurrentUser()?.id);
  return `
    <article class="item-card">
      <div class="item-row">
        <div>
          <div class="item-title">${escapeHtml(user?.name || "Atleta")}</div>
          <p class="item-sub">${escapeHtml(item.text)}${workout ? ` · ${escapeHtml(formatDateShort(workout.date))}` : ""}</p>
        </div>
        <span class="tag">${escapeHtml(item.type === "pr" ? "PR" : "Resultado")}</span>
      </div>
      <div class="meta-row">
        <button class="reaction-button ${gaveBoost ? "active" : ""}" data-action="toggle-feed-boost" data-feed-id="${escapeAttr(item.id)}" type="button" aria-pressed="${gaveBoost}">
          Boost ${getBoostCount(item.reactions)}
        </button>
        ${
          workout
            ? `<button class="btn secondary community-workout-button" data-action="view-feed-workout" data-feed-id="${escapeAttr(item.id)}" type="button">${viewLabel}</button>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderAdmin() {
  if (!canManage()) {
    app.els.workspace.innerHTML = `
      <section class="panel">
        <div class="panel-header">
          <div>
            <span class="panel-kicker">Admin</span>
            <h2 class="panel-title">Área reservada</h2>
          </div>
        </div>
        <div class="panel-body">
          <div class="empty-state">
            <h3>Apenas coach/admin</h3>
            <p>Troca o perfil no topo para veres a programação semanal.</p>
          </div>
        </div>
      </section>
    `;
    return;
  }

  const workout = getWorkout(app.state.selectedDate) || getTodayWorkout();
  const classes = getClassesForDate(workout.date);
  let adminTab = app.state.activeAdminTab || "programming";
  if ((!SHOW_STAFF_CLASS_TOOLS && adminTab === "classes") || (!SHOW_CLASS_FEATURES && adminTab === "attendance")) {
    adminTab = "programming";
    app.state.activeAdminTab = adminTab;
  }
  const adminLabels = {
    programming: "Programação",
    results: "Resultados",
    ...(SHOW_STAFF_CLASS_TOOLS ? { classes: "Aulas" } : {}),
    ...(SHOW_CLASS_FEATURES ? { attendance: "Presenças" } : {}),
    athletes: "Pessoas",
  };
  app.els.workspace.innerHTML = `
    <section class="panel">
      <div class="panel-header">
        <div>
          <span class="panel-kicker">Admin · ${escapeHtml(adminLabels[adminTab] || "Programação")}</span>
          <h2 class="panel-title">${adminTab === "athletes" ? "Pessoas" : escapeHtml(formatDateLong(workout.date))}</h2>
        </div>
        <div class="action-row ${adminTab === "athletes" ? "hidden" : ""}" style="margin-top:0">
          ${
            workout.forceUnlocked
              ? `<button class="btn secondary" data-action="lock-again" data-workout-id="${escapeAttr(workout.id)}" type="button">Voltar a bloquear</button>`
              : `<button class="btn secondary" data-action="unlock-now" data-workout-id="${escapeAttr(workout.id)}" type="button">Desbloquear agora</button>`
          }
        </div>
      </div>
      <div class="panel-body">
        ${adminTab === "athletes" ? "" : `${renderDateTabs()}<div style="height:14px"></div>`}
        ${renderAdminTabs(adminTab)}
        <div style="height:14px"></div>
        <div class="admin-editor">
          <div class="admin-section ${adminTab === "programming" ? "" : "hidden"}">
            ${renderProgrammingTools(workout)}
          </div>

          <div class="form-grid admin-section ${adminTab === "programming" ? "" : "hidden"}">
            <label class="field wide">
              <span>Título</span>
              <input id="workoutTitle" value="${escapeAttr(workout.title)}" />
            </label>
            <label class="field">
              <span>Tipo força</span>
              <select id="workoutStrengthScoreType">
                ${Object.entries(scoreTypes)
                  .map(
                    ([key, label]) =>
                      `<option value="${key}" ${getEffectiveStrengthScoreType(workout) === key ? "selected" : ""}>${label}</option>`
                  )
                  .join("")}
              </select>
            </label>
            <label class="field">
              <span>Movimento para PR</span>
              <input id="workoutMovement" value="${escapeAttr(workout.movement)}" />
            </label>
            <label class="field">
              <span>Tipo de PR</span>
              <select id="workoutPrType">
                ${Object.entries(prTypes)
                  .map(
                    ([key, config]) =>
                      `<option value="${key}" ${(workout.prType || "load") === key ? "selected" : ""}>${escapeHtml(config.label)}</option>`
                  )
                  .join("")}
              </select>
            </label>
            ${renderComplexBuilderTrigger(workout)}
            <label class="field">
              <span>Tipo metcon</span>
              <select id="workoutScoreType">
                ${Object.entries(scoreTypes)
                  .filter(([key]) => !["complex", "quality"].includes(key))
                  .map(
                    ([key, label]) =>
                      `<option value="${key}" ${workout.scoreType === key ? "selected" : ""}>${label}</option>`
                  )
                  .join("")}
              </select>
            </label>
            <label class="field">
              <span>VisÃ­vel a partir das</span>
              <input id="workoutUnlock" type="time" value="${escapeAttr(workout.unlockTime)}" />
            </label>
            <label class="field wide">
              <span>Warm-up</span>
              <textarea id="workoutWarmup">${escapeHtml(workout.blocks.warmup)}</textarea>
            </label>
            <label class="field wide">
              <span>Força / Skill</span>
              <textarea id="workoutStrength">${escapeHtml(workout.blocks.strength)}</textarea>
            </label>
            <label class="field wide">
              <span>Metcon</span>
              <textarea id="workoutMetcon">${escapeHtml(workout.blocks.metcon)}</textarea>
            </label>
            <label class="field wide">
              <span>Notas</span>
              <textarea id="workoutNotes">${escapeHtml(workout.blocks.notes)}</textarea>
            </label>
          </div>

          <div class="action-row admin-section ${adminTab === "programming" ? "" : "hidden"}">
            <button class="btn secondary danger" data-action="reset-demo" type="button">Repor demo</button>
            <button class="btn" data-action="save-workout" type="button">Guardar treino</button>
          </div>

          <section class="admin-section ${adminTab === "results" ? "" : "hidden"}">
            <h3>Resultados do dia</h3>
            ${renderAdminResultsManager(workout)}
          </section>

          ${
            SHOW_STAFF_CLASS_TOOLS
              ? `<section class="admin-section ${adminTab === "classes" ? "" : "hidden"}">
                  <h3>Aulas e PINs</h3>
                  ${renderClassManager(classes)}
                </section>`
              : ""
          }

          ${
            SHOW_CLASS_FEATURES
              ? `
                <section class="admin-section ${adminTab === "attendance" ? "" : "hidden"}">
                  <h3>Presenças do dia</h3>
                  ${renderAttendanceManager(classes)}
                </section>`
              : ""
          }

          <section class="admin-section ${adminTab === "athletes" ? "" : "hidden"}">
            <h3>Atletas e coaches</h3>
            ${renderAthleteManager()}
          </section>
        </div>
        ${renderComplexBuilderModal(workout)}
      </div>
    </section>
  `;
}

function renderComplexBuilderTrigger(workout) {
  const isComplex = getEffectiveStrengthScoreType(workout) === "complex";
  return `
    <div class="field complex-builder-field">
      <span>Sets e reps</span>
      <button class="btn secondary" data-action="open-complex-builder" type="button">
        Inserir Sets e Reps
      </button>
      <em>${isComplex ? "Edita as linhas do complexo." : "Abre o construtor e muda para Complexo / sets."}</em>
    </div>
  `;
}

function renderComplexBuilderModal(workout) {
  if (!app.state.complexBuilderOpen) return "";
  const rows = normalizeBuilderRows(app.state.complexBuilderRows);
  const safeRows = rows.length ? rows : parseComplexBuilderRowsFromWorkout(workout);
  const intro = app.state.complexBuilderIntro || getComplexBuilderIntro(workout);
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Inserir sets e reps">
      <div class="modal-panel complex-builder-modal">
        <div class="modal-header">
          <div>
            <span class="panel-kicker">Força · Complexo / sets</span>
            <h2>Inserir Sets e Reps</h2>
          </div>
          <button class="icon-button" data-action="close-complex-builder" type="button" aria-label="Fechar">×</button>
        </div>
        <label class="field">
          <span>Instrução</span>
          <input id="complexBuilderIntro" value="${escapeAttr(intro)}" placeholder="Ex: Do a set every 2 minutes." />
        </label>
        <div class="builder-set-list">
          ${safeRows.map((row, index) => renderComplexBuilderRow(row, index, safeRows.length)).join("")}
        </div>
        <div class="action-row builder-actions">
          <button class="btn secondary" data-action="add-complex-builder-row" type="button">Adicionar set</button>
          <button class="btn secondary" data-action="close-complex-builder" type="button">Cancelar</button>
          <button class="btn" data-action="apply-complex-builder" type="button">Aplicar à força</button>
        </div>
      </div>
    </div>
  `;
}

function renderComplexBuilderRow(row, index, totalRows) {
  const setNumber = index + 1;
  const split = splitComplexWork(row.work);
  const reps = row.reps || split.reps;
  const movement = row.movement || split.movement;
  return `
    <div class="builder-set-row">
      <span class="complex-set-number">${setNumber}</span>
      <label class="field builder-reps-field">
        <span>Reps</span>
        <input id="builderReps-${index}" value="${escapeAttr(reps)}" inputmode="decimal" placeholder="Ex: 2" />
      </label>
      <label class="field">
        <span>Movimento</span>
        <input id="builderMovement-${index}" value="${escapeAttr(movement)}" placeholder="Ex: Power Clean + 1 Jerk" />
      </label>
      <label class="field">
        <span>%</span>
        <input id="builderPercent-${index}" value="${escapeAttr(row.percent)}" placeholder="Ex: 65-68%" />
      </label>
      <input id="builderWork-${index}" type="hidden" value="${escapeAttr(row.work || buildComplexWork(reps, movement))}" />
      <button class="btn secondary builder-remove" data-action="remove-complex-builder-row" data-index="${index}" type="button" ${
        totalRows <= 1 ? "disabled" : ""
      }>
        Remover
      </button>
    </div>
  `;
}

function openComplexBuilder() {
  if (!requireManage()) return;
  const workout = getWorkout(app.state.selectedDate) || getTodayWorkout();
  syncWorkoutDraftFromAdminFields(workout);
  app.state.complexBuilderOpen = true;
  app.state.complexBuilderIntro = getComplexBuilderIntro(workout);
  app.state.complexBuilderRows = parseComplexBuilderRowsFromWorkout(workout);
  saveState();
  clearAdminProgrammingDraftDirty();
  render();
}

function closeComplexBuilder() {
  app.state.complexBuilderOpen = false;
  app.state.complexBuilderRows = [];
  app.state.complexBuilderIntro = "";
  saveState();
  clearAdminProgrammingDraftDirty();
  render();
}

function addComplexBuilderRow() {
  if (!requireManage()) return;
  app.state.complexBuilderIntro = valueOf("complexBuilderIntro") || app.state.complexBuilderIntro || "Do a set every 2 minutes.";
  const rows = readComplexBuilderRows({ keepEmpty: true });
  const movement =
    [...rows]
      .reverse()
      .map((row) => row.movement || splitComplexWork(row.work).movement)
      .find(Boolean) ||
    valueOf("workoutMovement") ||
    (getWorkout(app.state.selectedDate) || getTodayWorkout())?.movement ||
    "";
  app.state.complexBuilderRows = [...rows, { reps: "", movement, work: movement, percent: "" }];
  saveState();
  render();
}

function removeComplexBuilderRow(index) {
  if (!requireManage()) return;
  const rows = readComplexBuilderRows({ keepEmpty: true });
  if (rows.length <= 1) return;
  rows.splice(index, 1);
  app.state.complexBuilderIntro = valueOf("complexBuilderIntro") || app.state.complexBuilderIntro || "Do a set every 2 minutes.";
  app.state.complexBuilderRows = rows;
  saveState();
  render();
}

function applyComplexBuilder() {
  if (!requireManage()) return;
  const workout = getWorkout(app.state.selectedDate) || getTodayWorkout();
  syncWorkoutDraftFromAdminFields(workout);
  const rows = readComplexBuilderRows().filter((row) => row.work || row.percent);
  const safeRows = rows.length ? rows : [{ work: valueOf("workoutMovement") || workout.movement || "Complexo", percent: "" }];
  const intro = valueOf("complexBuilderIntro") || "Do a set every 2 minutes.";
  workout.strengthScoreType = "complex";
  workout.blocks.strength = buildComplexStrengthText(intro, safeRows);
  app.state.complexBuilderOpen = false;
  app.state.complexBuilderRows = [];
  app.state.complexBuilderIntro = "";
  saveState();
  clearAdminProgrammingDraftDirty();
  toast("Sets e reps aplicados à força.");
  render();
}

function syncWorkoutDraftFromAdminFields(workout) {
  if (!workout) return;
  workout.title = valueOf("workoutTitle") || workout.title;
  workout.strengthScoreType = valueOf("workoutStrengthScoreType") || workout.strengthScoreType || "load";
  workout.scoreType = valueOf("workoutScoreType") || workout.scoreType;
  workout.movement = valueOf("workoutMovement") || workout.movement;
  workout.prType = valueOf("workoutPrType") || workout.prType || "load";
  workout.unlockTime = valueOf("workoutUnlock") || workout.unlockTime || "20:00";
  workout.blocks = {
    warmup: valueOf("workoutWarmup") || workout.blocks?.warmup || "",
    strength: valueOf("workoutStrength") || workout.blocks?.strength || "",
    metcon: valueOf("workoutMetcon") || workout.blocks?.metcon || "",
    notes: valueOf("workoutNotes") || workout.blocks?.notes || "",
  };
  workout.strengthScoreType = getEffectiveStrengthScoreType(workout);
}

function readComplexBuilderRows(options = {}) {
  const source = normalizeBuilderRows(app.state.complexBuilderRows);
  const count = Math.max(source.length, 1);
  const rows = Array.from({ length: count }, (_, index) => {
    const fallback = source[index] || {};
    const legacyWork = valueOf(`builderWork-${index}`);
    const legacySplit = splitComplexWork(legacyWork);
    const reps = valueOf(`builderReps-${index}`) || legacySplit.reps || fallback.reps || "";
    const movement = valueOf(`builderMovement-${index}`) || legacySplit.movement || fallback.movement || "";
    const work = buildComplexWork(reps, movement) || legacyWork || fallback.work || "";
    return {
      reps,
      movement,
      work,
      percent: normalizePercentValue(valueOf(`builderPercent-${index}`) || fallback.percent || ""),
    };
  });
  return options.keepEmpty ? rows : rows.filter((row) => row.reps || row.movement || row.work || row.percent);
}

function normalizeBuilderRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const split = splitComplexWork(row.work || "");
    const reps = String(row.reps || split.reps || "").trim();
    const movement = String(row.movement || split.movement || "").trim();
    return {
      reps,
      movement,
      work: buildComplexWork(reps, movement) || String(row.work || "").trim(),
      percent: normalizePercentValue(row.percent),
    };
  });
}

function getComplexBuilderIntro(workout) {
  const lines = String(workout?.blocks?.strength || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.find((line) => !line.includes("@")) || "Do a set every 2 minutes.";
}

function parseComplexBuilderRowsFromWorkout(workout) {
  const rows = parseComplexRowsFromText(workout?.blocks?.strength || "", workout?.movement || "").map((row) => ({
    reps: row.reps,
    movement: row.movement,
    work: row.work,
    percent: row.percent,
  }));
  if (rows.length) return rows;
  const movement = workout?.movement || "Power Clean + 1 Jerk";
  return [{ reps: "", movement, work: movement, percent: "" }];
}

function buildComplexStrengthText(intro, rows) {
  const lines = normalizeBuilderRows(rows)
    .filter((row) => row.reps || row.movement || row.work || row.percent)
    .map((row) => {
      const work = buildComplexWork(row.reps, row.movement) || row.work;
      const percent = row.percent ? ` @${row.percent}` : "";
      return `${work}${percent}`.trim();
    });
  return [intro, ...lines].filter(Boolean).join("\n");
}

function renderAdminTabs(activeTab) {
  const tabs = [
    { id: "programming", label: "Programação" },
    { id: "results", label: "Resultados" },
    ...(SHOW_STAFF_CLASS_TOOLS ? [{ id: "classes", label: "Aulas" }] : []),
    ...(SHOW_CLASS_FEATURES ? [{ id: "attendance", label: "Presenças" }] : []),
    { id: "athletes", label: "Pessoas" },
  ];
  return `
    <div class="tabs admin-tabs" role="tablist" aria-label="Separadores do admin">
      ${tabs
        .map(
          (tab) => `
            <button class="tab ${activeTab === tab.id ? "active" : ""}" data-action="select-admin-tab" data-tab="${tab.id}" type="button">
              ${escapeHtml(tab.label)}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderAdminResultsManager(workout) {
  const rows = getAthletes().map((athlete) => {
    const result = getUserWorkoutResult(workout, athlete);
    const strengthScore = result ? getStrengthRankingScore(result, workout) : "";
    const metconScore = result ? getMetconScore(result) : "";
    const strengthDetail = result && strengthScore ? getStrengthDetail(result, workout) : "";
    const metconDetail = result && metconScore ? getMetconDetail(result) : "";
    const hasAnyScore = Boolean(strengthScore || metconScore);
    return `
      <div class="admin-result-row ${hasAnyScore ? "" : "empty"}">
        <div>
          <strong>${escapeHtml(athlete.name)}</strong>
          <span>${escapeHtml(athlete.loginName || athlete.id)}</span>
        </div>
        <div>
          <span>Força</span>
          <strong>${strengthScore ? escapeHtml(strengthScore) : "Sem força"}</strong>
          ${strengthDetail ? `<em>${escapeHtml(strengthDetail)}</em>` : ""}
        </div>
        <div>
          <span>WOD</span>
          <strong>${metconScore ? escapeHtml(metconScore) : "Sem WOD"}</strong>
          ${metconDetail ? `<em>${escapeHtml(metconDetail)}</em>` : ""}
        </div>
        <span class="chip ${hasAnyScore ? "green" : ""}">${hasAnyScore ? "Registado" : "Sem score"}</span>
      </div>
    `;
  });

  return `
    <div class="result-section admin-results-panel">
      <div class="section-heading">
        <div>
          <h3>Dia selecionado · ${escapeHtml(formatDateLong(workout.date))}</h3>
          <p class="item-sub">${getResultsForWorkout(workout.id).length} resultados registados neste treino</p>
        </div>
      </div>
      <div class="admin-results-list">
        ${rows.join("")}
      </div>
    </div>
    ${renderAdminResultsHistory()}
  `;
}

function renderAdminResultsHistory() {
  const results = [...app.state.results].sort((a, b) => {
    const leftDate = getResultWorkoutDate(a);
    const rightDate = getResultWorkoutDate(b);
    if (leftDate !== rightDate) return rightDate.localeCompare(leftDate);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return `
    <div class="result-section admin-results-panel">
      <div class="section-heading">
        <div>
          <h3>Todos os registos guardados</h3>
          <p class="item-sub">${results.length} registos no histórico da box</p>
        </div>
      </div>
      <div class="admin-results-list">
        ${
          results.length
            ? results.map(renderAdminResultHistoryRow).join("")
            : `<div class="empty-state"><h3>Sem resultados</h3><p>Ainda não há registos guardados.</p></div>`
        }
      </div>
    </div>
  `;
}

function renderAdminResultHistoryRow(result) {
  const athlete = getUser(result.userId);
  const workout = getWorkoutForResult(result);
  const strengthScore = workout ? getStrengthRankingScore(result, workout) : result.strengthScore || result.strengthLoad || "";
  const metconScore = getMetconScore(result);
  const date = getResultWorkoutDate(result);
  return `
    <div class="admin-result-row history">
      <div>
        <strong>${escapeHtml(athlete?.name || "Atleta")}</strong>
        <span>${date ? escapeHtml(formatDateShort(date)) : "sem data"}</span>
      </div>
      <div>
        <span>Treino</span>
        <strong>${escapeHtml(workout?.title || "Treino")}</strong>
      </div>
      <div>
        <span>Força</span>
        <strong>${strengthScore ? escapeHtml(strengthScore) : "Sem força"}</strong>
      </div>
      <div>
        <span>WOD</span>
        <strong>${metconScore ? escapeHtml(metconScore) : "Sem WOD"}</strong>
      </div>
    </div>
  `;
}

function renderProgrammingTools(workout) {
  const orderedWorkouts = [...app.state.workouts].sort((a, b) => a.date.localeCompare(b.date));
  return `
    <div class="result-section programming-tools">
      <label class="field">
        <span>Dia a editar</span>
        <select id="adminWorkoutDate">
          ${orderedWorkouts
            .map(
              (item) =>
                `<option value="${item.date}" ${item.date === workout.date ? "selected" : ""}>${escapeHtml(
                  `${formatDateLong(item.date)} · ${item.title}`
                )}</option>`
            )
            .join("")}
        </select>
      </label>
      <div class="action-row programming-actions">
        <button class="btn secondary" data-action="add-boundary-week" data-direction="previous" type="button">
          Criar semana anterior
        </button>
        <button class="btn secondary" data-action="add-boundary-week" data-direction="next" type="button">
          Criar semana seguinte
        </button>
      </div>
      <p class="item-sub wide">Em todos os dias, o treino aparece aos atletas pela hora definida, PIN, presença ou fim das aulas.</p>
    </div>
  `;
}

function renderClassManager(classes) {
  const orderedWorkouts = [...app.state.workouts].sort((a, b) => a.date.localeCompare(b.date));
  const defaultDate = app.state.selectedDate || getTodayWorkout().date;
  return `
    <div class="class-manager">
      <div class="result-section">
        <div class="form-grid">
          <label class="field">
            <span>Dia</span>
            <select id="newClassDate">
              ${orderedWorkouts
                .map(
                  (workout) =>
                    `<option value="${workout.date}" ${workout.date === defaultDate ? "selected" : ""}>${escapeHtml(
                      formatDateLong(workout.date)
                    )}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="field">
            <span>Hora início</span>
            <input id="newClassTime" type="time" value="18:30" />
          </label>
          <label class="field">
            <span>Duração</span>
            <input id="newClassDuration" type="number" min="15" step="15" value="60" />
          </label>
          <label class="checkbox-field">
            <input id="newClassRepeatFuture" type="checkbox" checked />
            <span>Repetir nas semanas seguintes</span>
          </label>
          <div class="field add-athlete-action">
            <span>&nbsp;</span>
            <button class="btn" data-action="add-class" type="button">Adicionar aula</button>
          </div>
        </div>
      </div>

      <div class="class-grid">
        ${
          classes.length
            ? classes.map(renderClassCard).join("")
            : `<div class="empty-state"><h3>Sem aulas neste dia</h3><p>Adiciona uma aula para este dia.</p></div>`
        }
      </div>
    </div>
  `;
}

function renderClassCard(item, options = {}) {
  const status = getClassAccessStatus(item);
  const code = getClassAccessCode(item);
  return `
    <div class="class-box class-code-card ${item.ended ? "done" : ""}">
      <div class="section-heading">
        <div>
          <div class="item-title">${escapeHtml(item.time)}-${escapeHtml(item.endTime)}</div>
          <p class="item-sub">${escapeHtml(getClassAccessWindowLabel(item))}</p>
        </div>
        <span class="chip ${escapeAttr(status.chip)}">${escapeHtml(status.label)}</span>
      </div>
      <div class="access-code-layout class-access-code">
        <div>
          <span class="item-sub">PIN da aula</span>
          <div class="access-code-value">${escapeHtml(code)}</div>
        </div>
        ${renderPseudoQr(`${item.id}-${code}`)}
      </div>
      <div class="action-row" style="justify-content:flex-start">
        ${
          item.ended
            ? `<button class="btn secondary" data-action="undo-class" data-class-id="${item.id}" type="button">Reabrir</button>`
            : `<button class="btn" data-action="end-class" data-class-id="${item.id}" type="button">Aula terminou</button>`
        }
        ${options.canDelete === false ? "" : `<button class="btn secondary" data-action="delete-class" data-class-id="${item.id}" type="button">Remover</button>`}
      </div>
    </div>
  `;
}

function renderAttendanceManager(classes) {
  return `
    <div class="attendance-grid">
      ${classes
        .map((classEntry) => {
          return `
            <div class="class-box">
              <div class="section-heading">
                <h3>${escapeHtml(classEntry.time)}-${escapeHtml(classEntry.endTime)}</h3>
                <span class="chip ${classEntry.ended ? "green" : "gold"}">${classEntry.ended ? "terminada" : "por fechar"}</span>
              </div>
              <p class="item-sub">${escapeHtml(formatAttendanceSummary(classEntry))}</p>
              ${renderClassRoster(classEntry)}
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderAthleteManager() {
  const allAthletes = getAllAthletes();
  const allStaff = getAllStaffUsers();
  return `
    <div class="athlete-manager">
      <div class="result-section">
        <div class="form-grid">
          <label class="field">
            <span>Tipo</span>
            <select id="newUserRole">
              <option value="athlete">Atleta</option>
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label class="field">
            <span>Nome</span>
            <input id="newUserName" placeholder="Nome" />
          </label>
          <label class="field">
            <span>Nome de login</span>
            <input id="newUserLoginName" placeholder="Ex: ana.silva" />
          </label>
          <label class="field">
            <span>Password</span>
            <input id="newUserPassword" type="password" placeholder="Password inicial" />
          </label>
          <label class="field">
            <span>Email</span>
            <input id="newUserEmail" type="email" placeholder="email@exemplo.com" />
          </label>
          <label class="field">
            <span>Telefone</span>
            <input id="newUserPhone" type="tel" placeholder="Contacto" />
          </label>
          <label class="field">
            <span>Género</span>
            <select id="newUserGender">
              ${renderGenderOptions("F")}
            </select>
          </label>
          <div class="field add-athlete-action">
            <span>&nbsp;</span>
            <button class="btn" data-action="add-user" type="button">Adicionar pessoa</button>
          </div>
        </div>
      </div>

      <div class="person-sections">
        <section class="person-section">
          <div class="section-heading">
            <h3>Atletas</h3>
            <span class="chip">${getAthletes().length}/${allAthletes.length} ativos</span>
          </div>
          <div class="person-list">
            ${allAthletes.map(renderPersonRow).join("")}
          </div>
        </section>

        <section class="person-section">
          <div class="section-heading">
            <h3>Staff</h3>
            <span class="chip">${getStaffUsers().length}/${allStaff.length} ativos</span>
          </div>
          <div class="person-list">
            ${allStaff.map(renderPersonRow).join("")}
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderPersonRow(user) {
  const expanded = app.state.expandedPersonId === user.id;
  const active = isUserActive(user);
  const details = [roleLabel(user.role), active ? "ativo" : "desativado", user.role === "athlete" ? genderLabel(user.gender) : "", `login ${user.loginName || user.id}`, user.email, user.phone]
    .filter(Boolean)
    .join(" · ");
  const dataSummary = user.role === "athlete" && canManage() ? renderAthleteDataSummary(user) : "";
  const rowContent = `
    <div>
      <strong>${escapeHtml(user.name)}</strong>
      <span>${escapeHtml(details)}</span>
      ${dataSummary}
    </div>
    <span class="tag ${active ? "" : "inactive"}">${canAdmin() ? (expanded ? "A editar" : "Editar") : roleLabel(user.role)}</span>
  `;

  return `
    <article class="person-row-wrap ${expanded ? "open" : ""} ${active ? "" : "inactive"}">
      ${
        canAdmin()
          ? `<button class="person-row" data-action="toggle-person-editor" data-user-id="${user.id}" type="button">${rowContent}</button>`
          : `<div class="person-row">${rowContent}</div>`
      }
      ${expanded ? renderPersonEditor(user) : ""}
    </article>
  `;
}

function renderPersonEditor(user) {
  const safeId = domSafeId(user.id);
  return `
    <div class="person-editor">
      <div class="form-grid">
        <label class="field">
          <span>Acesso</span>
          <select id="personRole-${safeId}">
            <option value="athlete" ${user.role === "athlete" ? "selected" : ""}>Atleta</option>
            <option value="coach" ${user.role === "coach" ? "selected" : ""}>Coach</option>
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
        </label>
        <label class="field">
          <span>Estado</span>
          <select id="personActive-${safeId}">
            <option value="active" ${isUserActive(user) ? "selected" : ""}>Ativo</option>
            <option value="inactive" ${!isUserActive(user) ? "selected" : ""}>Desativado</option>
          </select>
        </label>
        <label class="field">
          <span>Nome</span>
          <input id="personName-${safeId}" value="${escapeAttr(user.name)}" />
        </label>
        <label class="field">
          <span>Nome de login</span>
          <input id="personLogin-${safeId}" value="${escapeAttr(user.loginName || user.id)}" />
        </label>
        <label class="field">
          <span>Nova password</span>
          <input id="personPassword-${safeId}" type="password" placeholder="Deixar vazio para manter" />
        </label>
        <label class="field">
          <span>Email</span>
          <input id="personEmail-${safeId}" type="email" value="${escapeAttr(user.email || "")}" />
        </label>
        <label class="field">
          <span>Telefone</span>
          <input id="personPhone-${safeId}" type="tel" value="${escapeAttr(user.phone || "")}" />
        </label>
        ${
          user.role === "athlete"
            ? `<label class="field">
                <span>Género</span>
                <select id="personGender-${safeId}">
                  ${renderGenderOptions(user.gender)}
                </select>
              </label>`
            : ""
        }
      </div>
      <div class="action-row">
        <button class="btn" data-action="save-person" data-user-id="${user.id}" type="button">Guardar alterações</button>
        <button class="btn secondary danger-action" data-action="delete-person" data-user-id="${user.id}" type="button">Apagar conta</button>
      </div>
    </div>
  `;
}

function renderDateTabs() {
  const selectedWorkout = getWorkout(app.state.selectedDate) || getTodayWorkout();
  const weekStart = startOfWeek(new Date(`${selectedWorkout.date}T12:00:00`));
  const weekStartIso = isoDate(weekStart);
  const immediatePrevWeek = isoDate(addDays(weekStart, -7));
  const immediateNextWeek = isoDate(addDays(weekStart, 7));
  const prevWeek = getAvailableWeekStart(weekStartIso, "previous");
  const nextWeek = getAvailableWeekStart(weekStartIso, "next");
  const weekWorkouts = getWeekWorkouts(weekStartIso);
  const hasPrev = Boolean(prevWeek);
  const hasNext = Boolean(nextWeek);
  const todayIso = isoDate(new Date());
  const hideRestDay = app.state.currentRole === "athlete" || (canManage() && app.state.activeView === "today");
  const visibleWeekWorkouts = hideRestDay
    ? weekWorkouts.filter((workout) => getDayIndexInWeek(workout.date, weekStartIso) !== 6)
    : weekWorkouts;
  return `
    <div class="week-tools">
      <button class="btn secondary" data-action="select-week" data-week-start="${prevWeek || immediatePrevWeek}" type="button" ${hasPrev ? "" : "disabled"}>
        Semana anterior
      </button>
      <div class="week-label">
        <strong>${escapeHtml(formatWeekRange(weekStartIso))}</strong>
        ${hideRestDay ? "" : `<span>${weekWorkouts.length} treinos</span>`}
      </div>
      <button class="btn secondary" data-action="select-week" data-week-start="${nextWeek || immediateNextWeek}" type="button" ${hasNext ? "" : "disabled"}>
        Próxima semana
      </button>
      ${
        canManage() && !hasWeek(immediatePrevWeek)
          ? `<button class="btn ghost" data-action="add-week" data-offset="-1" type="button">Criar semana anterior</button>`
          : ""
      }
      ${
        canManage() && !hasWeek(immediateNextWeek)
          ? `<button class="btn ghost" data-action="add-week" data-offset="1" type="button">Criar próxima semana</button>`
          : ""
      }
    </div>
    <div class="tabs" role="tablist" aria-label="Dias da semana">
      ${visibleWeekWorkouts
        .map((workout, index) => {
          const active = workout.date === app.state.selectedDate;
          const dayIndex = getDayIndexInWeek(workout.date, weekStartIso);
          const dayLabel = workout.date === todayIso ? "Hoje" : weekNames[dayIndex] || weekNames[index] || formatDateShort(workout.date);
          return `<button class="tab ${active ? "active" : ""}" data-action="select-date" data-date="${workout.date}" type="button">
            ${dayLabel}
          </button>`;
        })
        .join("")}
    </div>
  `;
}

function selectDate(date) {
  if (!isValidIsoDate(date) || !getWorkout(date)) {
    toast("Data inválida.");
    return;
  }
  if (date !== app.state.selectedDate) clearAdminProgrammingDraftDirty();
  app.ui.focusWorkoutZone = "";
  app.state.selectedDate = date;
  saveState();
  render();
}

function selectWeek(weekStart) {
  const weekWorkouts = getWeekWorkouts(weekStart);
  if (!weekWorkouts.length) return;
  if (weekWorkouts[0].date !== app.state.selectedDate) clearAdminProgrammingDraftDirty();
  app.ui.focusWorkoutZone = "";
  app.state.selectedDate = weekWorkouts[0].date;
  saveState();
  render();
}

function addWeek(offset) {
  if (!requireManage()) return;
  const selectedWorkout = getWorkout(app.state.selectedDate) || getTodayWorkout();
  const currentStart = startOfWeek(new Date(`${selectedWorkout.date}T12:00:00`));
  const targetStart = addDays(currentStart, offset * 7);
  const targetStartIso = isoDate(targetStart);
  if (!hasWeek(targetStartIso)) {
    const newWorkouts = createBlankWeekWorkouts(targetStart);
    app.state.workouts.push(...newWorkouts);
    app.state.classes.push(...newWorkouts.flatMap((workout) => createClassesForWorkout(workout)));
  }
  app.state.selectedDate = targetStartIso;
  if (!saveState()) return;
  toast(offset < 0 ? "Semana anterior criada." : "Próxima semana criada.");
  render();
}

function addBoundaryWeek(direction) {
  if (!requireManage()) return;
  const weekStarts = getAllWeekStarts();
  const fallback = startOfWeek(new Date(`${getTodayWorkout().date}T12:00:00`));
  const baseStartIso = direction === "previous" ? weekStarts[0] : weekStarts[weekStarts.length - 1];
  const baseStart = baseStartIso ? new Date(`${baseStartIso}T12:00:00`) : fallback;
  const targetStart = addDays(baseStart, direction === "previous" ? -7 : 7);
  const targetStartIso = isoDate(targetStart);
  if (!hasWeek(targetStartIso)) {
    const newWorkouts = createBlankWeekWorkouts(targetStart);
    app.state.workouts.push(...newWorkouts);
    app.state.classes.push(...newWorkouts.flatMap((workout) => createClassesForWorkout(workout)));
  }
  app.state.selectedDate = targetStartIso;
  app.state.activeAdminTab = "programming";
  if (!saveState()) return;
  toast(direction === "previous" ? "Semana anterior criada." : "Semana seguinte criada.");
  render();
}

function getWeekWorkouts(weekStartIso) {
  const weekStart = new Date(`${weekStartIso}T12:00:00`);
  const weekEndIso = isoDate(addDays(weekStart, 6));
  return app.state.workouts
    .filter((workout) => workout.date >= weekStartIso && workout.date <= weekEndIso)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function hasWeek(weekStartIso) {
  return getWeekWorkouts(weekStartIso).length > 0;
}

function getAvailableWeekStart(currentWeekStartIso, direction) {
  const weeks = getAllWeekStarts();
  if (direction === "previous") {
    return weeks.filter((weekStart) => weekStart < currentWeekStartIso).pop() || "";
  }
  return weeks.find((weekStart) => weekStart > currentWeekStartIso) || "";
}

function getAllWeekStarts() {
  return [
    ...new Set(
      app.state.workouts.map((workout) =>
        isoDate(startOfWeek(new Date(`${workout.date}T12:00:00`)))
      )
    ),
  ].sort();
}

function formatWeekRange(weekStartIso) {
  const start = new Date(`${weekStartIso}T12:00:00`);
  const end = addDays(start, 6);
  return `${formatDateShort(weekStartIso)} a ${formatDateShort(isoDate(end))}`;
}

function getDayIndexInWeek(date, weekStartIso) {
  const current = new Date(`${date}T12:00:00`);
  const start = new Date(`${weekStartIso}T12:00:00`);
  return Math.max(0, Math.min(6, Math.round((current - start) / (1000 * 60 * 60 * 24))));
}

function createBlankWeekWorkouts(weekStartDate) {
  return dayNames.map((dayName, index) => {
    const date = isoDate(addDays(weekStartDate, index));
    return {
      id: `w-${date}`,
      date,
      published: true,
      forceUnlocked: false,
      classesUnlocked: false,
      unlockTime: "20:00",
      accessCode: createWorkoutAccessCode(date),
      title: `Treino de ${dayName}`,
      strengthScoreType: "load",
      prType: "load",
      scoreType: "time",
      movement: "Movimento principal",
      blocks: {
        warmup: "Adicionar warm-up",
        strength: "Adicionar força / skill",
        metcon: "Adicionar metcon",
        notes: "Adicionar notas e opções scaled.",
      },
    };
  });
}

function createClassesForWorkout(workout) {
  const schedule = getClassScheduleForDate(workout.date);
  const slots = schedule.length ? schedule : defaultClassSchedule;
  return slots
    .filter((slot) => !isClassDeletedForDate(workout.date, slot.time))
    .map((slot) => createClassEntry(workout.date, slot.time, slot.duration, { recurring: true }));
}

function createClassEntry(date, time, duration = 60, options = {}) {
  const endTime = addMinutesToTime(time, duration);
  const classEntry = {
    id: options.custom ? `c-${date}-${time}-${uniqueId("slot")}` : `c-${date}-${time}`,
    date,
    time,
    endTime,
    duration,
    accessCode: createClassAccessCode({ date, time, endTime }),
    ended: false,
    attendees: [],
    present: [],
    absent: [],
  };
  if (options.custom) classEntry.custom = true;
  if ("recurring" in options) classEntry.recurring = options.recurring;
  return classEntry;
}

function selectAdminTab(tab) {
  if (!requireManage()) return;
  if ((tab || "programming") !== "programming") clearAdminProgrammingDraftDirty();
  app.state.activeAdminTab = tab || "programming";
  saveState();
  render();
}

function togglePrHistory(key) {
  app.state.expandedPrKey = app.state.expandedPrKey === key ? "" : key;
  saveState();
  render();
}

function viewFeedWorkout(feedId) {
  const item = app.state.feed.find((entry) => entry.id === feedId);
  const workout = item && app.state.workouts.find((entry) => entry.id === item.workoutId);
  if (!item || !workout) {
    toast("Nao encontrei o treino desta publicacao.");
    return;
  }
  if (app.state.currentRole === "athlete" && !getAccess(workout).unlocked) {
    toast("Este treino ainda nao esta disponivel para consulta.");
    return;
  }

  clearAdminProgrammingDraftDirty();
  app.state.selectedDate = workout.date;
  app.state.activeView = "today";
  app.state.expandedResultWorkoutId = "";
  app.state.expandedResultMode = "";
  app.ui.focusWorkoutZone = item.type === "pr" ? "strength" : "";
  saveState();
  render();

  if (app.ui.focusWorkoutZone && typeof document !== "undefined") {
    document.getElementById(`workout-zone-${app.ui.focusWorkoutZone}`)?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }
}

function toggleResultForm(workoutId, mode = "strength") {
  const isSamePanel = app.state.expandedResultWorkoutId === workoutId && app.state.expandedResultMode === mode;
  app.state.expandedResultWorkoutId = isSamePanel ? "" : workoutId;
  app.state.expandedResultMode = isSamePanel ? "" : mode;
  saveState();
  render();
}

function toggleResultComments(resultId, mode = "metcon") {
  const key = getResultCommentKey(resultId, mode);
  app.state.expandedResultCommentsKey = app.state.expandedResultCommentsKey === key ? "" : key;
  saveState();
  render();
}

function toggleClassRoster(classId) {
  if (!requireManage()) return;
  app.state.expandedClassRosterId = app.state.expandedClassRosterId === classId ? "" : classId;
  saveState();
  render();
}

function saveWorkout() {
  if (!requireManage()) return;
  const workout = getWorkout(app.state.selectedDate);
  if (!workout) return;
  const unlockTime = valueOf("workoutUnlock") || "20:00";
  const scoreType = valueOf("workoutScoreType") || "time";
  const strengthScoreType = valueOf("workoutStrengthScoreType") || "load";
  if (!isValidTimeOfDay(unlockTime)) {
    toast("Define uma hora de desbloqueio valida.");
    return;
  }
  if (!scoreTypes[scoreType] || scoreType === "quality") {
    toast("Escolhe um tipo de Metcon valido.");
    return;
  }
  if (!scoreTypes[strengthScoreType]) {
    toast("Escolhe um tipo de forca valido.");
    return;
  }
  workout.title = valueOf("workoutTitle");
  workout.strengthScoreType = strengthScoreType;
  workout.scoreType = scoreType;
  workout.movement = valueOf("workoutMovement");
  workout.prType = valueOf("workoutPrType") || "load";
  workout.unlockTime = unlockTime;
  workout.blocks = {
    warmup: valueOf("workoutWarmup"),
    strength: valueOf("workoutStrength"),
    metcon: valueOf("workoutMetcon"),
    notes: valueOf("workoutNotes"),
  };
  workout.strengthScoreType = getEffectiveStrengthScoreType(workout);
  if (!commitState("Treino guardado.")) return;
  clearAdminProgrammingDraftDirty();
  render();
}

function saveResult() {
  const workout = getWorkout(app.state.selectedDate) || getTodayWorkout();
  const user = getSessionUser();
  if (!user) {
    toast("Inicia sessao para registar resultados.");
    return;
  }
  if (user.role !== "athlete") {
    toast("Apenas atletas podem registar resultados.");
    return;
  }
  const access = getAccess(workout);
  const mode = app.state.expandedResultMode || "strength";
  const strengthType = getEffectiveStrengthScoreType(workout);
  if (!access.unlocked) {
    toast("O treino ainda está fechado para atletas.");
    return;
  }

  const strengthScore = valueOf("strengthScoreInput");
  const prRawValue = valueOf("prValueInput");
  const metconScoreResult = readMetconScoreInput(workout);
  if (mode === "metcon" && metconScoreResult.error) {
    toast(metconScoreResult.error);
    return;
  }
  const metconScore = metconScoreResult.score;
  const existing = getUserWorkoutResult(workout, user);
  const isQualityStrength = mode === "strength" && strengthType === "quality";
  const strengthSets =
    mode === "strength" && strengthType === "complex" ? readStrengthComplexSets() : isQualityStrength ? [] : existing?.strengthSets || [];
  const bestComplexLoad = mode === "strength" && strengthType === "complex" ? getBestCompletedComplexLoad(strengthSets) : "";
  const finalStrengthScore =
    isQualityStrength
      ? isChecked("strengthCompleteInput")
        ? "Qualidade concluída"
        : ""
      : mode === "strength" && strengthType === "complex"
      ? strengthScore || formatComplexStrengthScore(strengthSets, bestComplexLoad)
      : strengthScore;
  const finalPrRawValue = isQualityStrength ? "" : mode === "strength" && strengthType === "complex" ? prRawValue || bestComplexLoad : prRawValue;
  const hasStrengthResult = isQualityStrength
    ? Boolean(finalStrengthScore)
    : mode === "strength" && strengthType === "complex"
    ? Boolean(strengthScore || finalPrRawValue || bestComplexLoad)
    : Boolean(finalStrengthScore || finalPrRawValue);
  if (mode === "strength" && !hasStrengthResult) {
    toast(isQualityStrength ? "Confirma que concluíste o trabalho de qualidade." : "Regista a força antes de submeter.");
    return;
  }
  const strengthLoadError =
    mode === "strength" ? validateStrengthLoadInputs(finalPrRawValue, strengthSets, strengthType) : "";
  if (strengthLoadError) {
    toast(strengthLoadError);
    return;
  }
  if (mode === "metcon" && !metconScore) {
    toast("Regista o WOD antes de submeter.");
    return;
  }
  const payload = {
    workoutId: workout.id,
    workoutDate: workout.date,
    userId: user.id,
    strengthScore: mode === "strength" ? finalStrengthScore : existing?.strengthScore || "",
    strengthLoad:
      mode === "strength"
        ? !isQualityStrength && (prTypes[workout.prType || "load"]?.unit === "kg" || strengthType === "complex")
          ? finalPrRawValue
          : ""
        : existing?.strengthLoad || existing?.load || "",
    prType: workout.prType || "load",
    prRawValue: mode === "strength" ? finalPrRawValue : existing?.prRawValue || existing?.strengthLoad || existing?.load || "",
    strengthMovement: mode === "strength" ? valueOf("strengthMovementInput") || workout.movement : existing?.strengthMovement || workout.movement,
    strengthNotes: mode === "strength" ? valueOf("strengthNotesInput") : existing?.strengthNotes || "",
    strengthSets: mode === "strength" ? strengthSets : existing?.strengthSets || [],
    metconScore: mode === "metcon" ? metconScore : existing?.metconScore || existing?.score || "",
    metconLevel: mode === "metcon" ? valueOf("metconLevelInput") : existing?.metconLevel || existing?.level || "RX",
    metconNotes: mode === "metcon" ? valueOf("metconNotesInput") : existing?.metconNotes || existing?.notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let savedResult;
  if (existing) {
    Object.assign(existing, payload);
    savedResult = existing;
  } else {
    savedResult = { id: uniqueId("r"), reactionsByMode: createEmptyResultReactionModes(), comments: [], ...payload };
    app.state.results.push(savedResult);
  }

  app.state.feed.unshift({
    id: uniqueId("f"),
    type: "result",
    userId: user.id,
    workoutId: workout.id,
    text: formatResultFeedText(payload, workout),
    createdAt: new Date().toISOString(),
    reactions: createEmptyReactions(),
  });

  if (mode === "strength" && strengthType !== "quality") {
    const prCandidate = getStrengthPrCandidate(payload, workout);
    maybeUpdatePr(user.id, prCandidate.movement, prCandidate.rawValue, workout, savedResult.id, prCandidate);
  }

  app.state.expandedResultWorkoutId = "";
  app.state.expandedResultMode = "";
  app.state.selectedDate = workout.date;
  dedupeStoredResults();
  if (!commitState(`Resultado registado em ${formatDateShort(workout.date)}.`)) return;
  render();
}

function formatResultFeedText(result, workout) {
  const parts = [];
  if (result.strengthScore || result.prRawValue) {
    const strengthValue = result.strengthScore || `${prTypes[result.prType || workout.prType || "load"]?.label}: ${result.prRawValue}`;
    parts.push(`força ${strengthValue}`);
  }
  if (result.metconScore) {
    parts.push(`metcon ${result.metconScore}`);
  }
  return `registou ${parts.join(" e ")} em ${workout.title}`;
}

function getStrengthPrCandidate(result, workout) {
  const fallbackMovement = result.strengthMovement || workout.movement;
  if (getEffectiveStrengthScoreType(workout) === "complex") {
    const bestSet = getBestCompletedComplexSet(result.strengthSets);
    if (bestSet) {
      const reps = parseRepCount(bestSet.reps) || 1;
      return {
        movement: bestSet.movement || fallbackMovement,
        rawValue: formatPrNumber(estimateOneRepMax(numericLoad(bestSet.load), reps)),
        sourceLoad: bestSet.load,
        sourceReps: reps,
        estimated: reps > 1,
      };
    }
  }
  const load = result.prRawValue || result.strengthLoad || result.load || "";
  const reps = parseRepCount(result.strengthScore) || repsFromPrType(result.prType || workout.prType || "load");
  return {
    movement: fallbackMovement,
    rawValue: formatPrNumber(estimateOneRepMax(numericLoad(load), reps)),
    sourceLoad: load,
    sourceReps: reps,
    estimated: reps > 1,
  };
}

function parseRepCount(value) {
  const match = String(value || "").match(/(\d+(?:[.,]\d+)?)/);
  return match ? Number(match[1].replace(",", ".")) : 0;
}

function repsFromPrType(prType) {
  if (prType === "three_rm") return 3;
  if (prType === "five_rm") return 5;
  return 1;
}

function estimateOneRepMax(load, reps = 1) {
  if (!Number.isFinite(load) || load <= 0) return NaN;
  const safeReps = Number.isFinite(Number(reps)) && Number(reps) > 0 ? Number(reps) : 1;
  if (safeReps === 1) return load;
  return Math.round(load * (1 + safeReps / 30) * 10) / 10;
}

function formatPrNumber(value) {
  if (!Number.isFinite(value)) return "";
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}

function getPrSourceLoad(pr) {
  return pr?.sourceLoad || (prTypes[pr?.prType || "load"]?.unit === "kg" ? pr?.rawValue || pr?.value : "");
}

function getPrSourceReps(pr) {
  return pr?.sourceReps || 1;
}

function getPrComparableValue(pr, prType) {
  const config = prTypes[prType] || prTypes.load;
  if (config.unit === "kg") {
    const load = numericLoad(getPrSourceLoad(pr));
    if (Number.isFinite(load)) return load;
  }
  return Number(pr?.value);
}

function comparePrRecords(a, b, prType) {
  const config = prTypes[prType] || prTypes.load;
  const aComparable = getPrComparableValue(a, prType);
  const bComparable = getPrComparableValue(b, prType);
  if (Number.isFinite(aComparable) && Number.isFinite(bComparable) && aComparable !== bComparable) {
    return config.direction === "lower" ? aComparable - bComparable : bComparable - aComparable;
  }
  const aValue = Number(a?.value);
  const bValue = Number(b?.value);
  return config.direction === "lower" ? aValue - bValue : bValue - aValue;
}

function isBetterPrRecord(candidate, existing, prType) {
  return comparePrRecords(candidate, existing, prType) < 0;
}

function maybeUpdatePr(userId, movement, rawValue, workout, sourceResultId = "", candidate = {}) {
  const originalPrType = workout.prType || "load";
  const originalConfig = prTypes[originalPrType] || prTypes.load;
  const prType = originalConfig.unit === "kg" ? "one_rm" : originalPrType;
  const config = prTypes[prType] || prTypes.load;
  const value = parsePrValue(rawValue, prType);
  const movementKey = String(movement || "").toLowerCase();
  const legacyLinkedPrs = sourceResultId
    ? app.state.prs.filter(
        (pr) =>
          !pr.sourceResultId &&
          pr.userId === userId &&
          pr.date === workout.date &&
          pr.movement.toLowerCase() === movementKey &&
          (pr.prType || "load") === prType
      )
    : [];
  const linkedPr = (sourceResultId ? app.state.prs.find((pr) => pr.sourceResultId === sourceResultId) : null) || legacyLinkedPrs[0];
  const linkedPrIds = new Set([linkedPr?.id, ...legacyLinkedPrs.map((pr) => pr.id)].filter(Boolean));
  if (!movement || !rawValue || !Number.isFinite(value) || value <= 0) {
    if (linkedPr) removePr(linkedPr.id);
    legacyLinkedPrs.forEach((pr) => removePr(pr.id));
    return;
  }
  const existing = getBestPr(userId, movement, prType, {
    excludeSourceResultId: sourceResultId,
    excludePrIds: linkedPrIds,
  });

  const nextPr = {
      id: linkedPr?.id || uniqueId("pr"),
      userId,
      movement,
      prType,
      value,
      rawValue,
      unit: config.unit,
      estimated: Boolean(candidate.estimated),
      sourceLoad: candidate.sourceLoad || rawValue,
      sourceReps: candidate.sourceReps || repsFromPrType(originalPrType),
      date: workout.date,
      workoutId: workout.id,
      sourceResultId,
    };
  if (!existing || isBetterPrRecord(nextPr, existing, prType)) {
    if (linkedPr) {
      Object.assign(linkedPr, nextPr);
    } else {
      app.state.prs.push(nextPr);
      app.state.feed.unshift({
        id: uniqueId("f"),
        type: "pr",
        userId,
        workoutId: workout.id,
        text: `novo PR ${candidate.estimated ? "1RM estimado" : config.label} no ${movement}: ${formatPrValue({
          value,
          rawValue,
          unit: config.unit,
          prType,
        })}`,
        createdAt: new Date().toISOString(),
        reactions: createEmptyReactions(),
      });
    }
    legacyLinkedPrs
      .filter((pr) => pr.id !== linkedPr?.id)
      .forEach((pr) => removePr(pr.id));
  } else if (linkedPr) {
    removePr(linkedPr.id);
    legacyLinkedPrs.forEach((pr) => removePr(pr.id));
  }
  dedupePrsForUserDate(userId, workout.date);
}

function getBestPr(userId, movement, prType, options = {}) {
  const prs = app.state.prs.filter(
    (pr) =>
      pr.userId === userId &&
      pr.movement.toLowerCase() === movement.toLowerCase() &&
      (pr.prType || "load") === prType &&
      (!options.excludeSourceResultId || pr.sourceResultId !== options.excludeSourceResultId) &&
      (!options.excludePrIds || !options.excludePrIds.has(pr.id))
  );
  return prs.sort((a, b) => comparePrRecords(a, b, prType))[0];
}

function removePr(prId) {
  app.state.prs = app.state.prs.filter((pr) => pr.id !== prId);
}

function dedupePrsForUserDate(userId, date) {
  const groups = new Map();
  app.state.prs.forEach((pr) => {
    if (pr.userId !== userId || pr.date !== date) return;
    const key = `${pr.userId}|${pr.date}|${pr.movement.toLowerCase()}|${pr.prType || "load"}`;
    const current = groups.get(key);
    if (!current || isBetterPrRecord(pr, current, pr.prType || "load")) {
      groups.set(key, pr);
    }
  });
  const keepIds = new Set([...groups.values()].map((pr) => pr.id));
  app.state.prs = app.state.prs.filter((pr) => {
    if (pr.userId !== userId || pr.date !== date) return true;
    const key = `${pr.userId}|${pr.date}|${pr.movement.toLowerCase()}|${pr.prType || "load"}`;
    return keepIds.has(pr.id) || !groups.has(key);
  });
}

function isBetterPr(value, existingValue, prType) {
  const config = prTypes[prType] || prTypes.load;
  return config.direction === "lower" ? value < Number(existingValue) : value > Number(existingValue);
}

function parsePrValue(rawValue, prType) {
  if (!rawValue) return NaN;
  if (prType === "benchmark_time") return parseTimeScore(rawValue);
  return numericLoad(rawValue);
}

function formatPrValue(pr) {
  const prType = pr.prType || "load";
  const config = prTypes[prType] || prTypes.load;
  if (pr.rawValue) {
    return `${pr.rawValue}${config.unit && config.unit !== "tempo" && config.unit !== "score" ? ` ${config.unit}` : ""}`;
  }
  if (config.unit === "tempo") return secondsToTime(pr.value);
  return `${pr.value}${config.unit && config.unit !== "score" ? ` ${config.unit}` : ""}`;
}

function formatPrSourceValue(pr) {
  const prType = pr?.prType || "load";
  const config = prTypes[prType] || prTypes.load;
  if (config.unit !== "kg") return "";
  const sourceLoad = numericLoad(getPrSourceLoad(pr));
  if (!Number.isFinite(sourceLoad)) return "";
  const reps = Number(getPrSourceReps(pr)) || 1;
  const repLabel = reps === 1 ? "Rep" : "Reps";
  return `${formatPrNumber(reps)} ${repLabel} @ ${formatLoadNumber(sourceLoad)} kg`;
}

function formatLoadNumber(value) {
  const load = Number(value);
  if (!Number.isFinite(load)) return "";
  return load.toLocaleString("pt-PT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function toggleClass(classId, ended) {
  if (!requireManage()) return;
  const classEntry = app.state.classes.find((item) => item.id === classId);
  if (!classEntry) return;
  const workout = getWorkout(classEntry.date);
  classEntry.ended = ended;
  let message = ended ? "Aula marcada como terminada." : "Aula reaberta.";
  if (ended) {
    classEntry.endedAt = new Date().toISOString();
    app.state.feed.unshift({
      id: uniqueId("f"),
      type: "class",
      userId: getCurrentUser()?.id || "coach",
      workoutId: workout?.id,
      text: `terminou a aula das ${classEntry.time}`,
      createdAt: new Date().toISOString(),
      reactions: createEmptyReactions(),
    });
    if (areAllWorkoutClassesEnded(workout)) {
      if (workout) workout.classesUnlocked = true;
      message = "Todas as aulas terminaram. Treino desbloqueado para todos.";
    }
  } else {
    classEntry.endedAt = "";
    if (workout?.classesUnlocked) {
      workout.classesUnlocked = false;
      message = "Aula reaberta. Treino voltou a seguir a hora/PIN de desbloqueio.";
    }
  }
  if (!commitState(message)) return;
  flushSharedStateNow();
  render();
}

function refreshTrainingAccess() {
  if (app.online.enabled && app.online.client && !app.online.loading) {
    loadRemoteState({ background: false });
    return;
  }
  render();
}

function login() {
  if (isOnlineSyncPending()) {
    toast("Ainda estou a carregar as contas online. Espera uns segundos e tenta outra vez.");
    return;
  }
  const loginName = normalizeLoginName(valueOf("loginName"));
  const password = valueOf("loginPassword");
  const user = getUserByLoginName(loginName);
  if (!user && hasOnlineSyncFailed()) {
    toast("Nao consegui carregar as contas online neste dispositivo.");
    return;
  }
  if (!user || String(user.password || "") !== password) {
    toast("Dados de login incorretos.");
    return;
  }
  if (!isUserActive(user)) {
    toast("Conta desativada. Fala com o Admin.");
    return;
  }
  app.state.sessionUserId = user.id;
  app.state.currentRole = user.role;
  if (user.role === "athlete") {
    app.state.currentUserId = user.id;
    app.state.selectedDate = isoDate(new Date());
    app.state.activeView = "today";
  } else {
    app.state.currentStaffId = user.id;
    if (!app.state.activeView) app.state.activeView = "today";
  }
  const interactionNotice = markInteractionNotificationsAsRead(user);
  saveState();
  toast(
    interactionNotice ? `Bem-vindo, ${user.name}. ${interactionNotice}` : `Bem-vindo, ${user.name}.`,
    interactionNotice ? 6200 : 2400
  );
  render();
}

async function registerAthlete() {
  const name = valueOf("registerName");
  const loginName = normalizeLoginName(valueOf("registerLoginName"));
  const password = valueOf("registerPassword");
  const passwordConfirm = valueOf("registerPasswordConfirm");
  const email = valueOf("registerEmail");
  const phone = valueOf("registerPhone");
  const gender = normalizeGender(valueOf("registerGender"));

  if (!name) {
    toast("Escreve o teu nome.");
    return;
  }
  if (!loginName) {
    toast("Escolhe o nome de login.");
    return;
  }
  if (!requireOnlineAccountWriteReady()) return;
  if (isLoginNameTaken(loginName)) {
    toast("Esse nome de login já está em uso.");
    return;
  }
  if (!password) {
    toast("Define uma password.");
    return;
  }
  if (password !== passwordConfirm) {
    toast("As passwords não coincidem.");
    return;
  }

  const previousState = cloneStateForRollback();
  const id = uniqueAthleteId(name);
  const user = {
    id,
    name,
    loginName,
    role: "athlete",
    gender,
    classTime: "-",
    password,
    email,
    phone,
    selfRegistered: true,
    active: true,
    createdAt: new Date().toISOString(),
  };
  app.state.users.push(user);
  app.state.sessionUserId = user.id;
  app.state.currentRole = "athlete";
  app.state.currentUserId = user.id;
  app.state.activeView = "today";
  app.state.selectedDate = isoDate(new Date());
  if (!(await commitAccountState("Conta criada.", "Nao consegui guardar a conta na base online. Tenta novamente."))) {
    restoreStateAfterFailedAccountSave(previousState);
    render();
    return;
  }
  render();
}

function logout() {
  app.state.sessionUserId = "";
  saveState();
  render();
}

function bookClass(classId) {
  const user = getSessionUser();
  const classEntry = app.state.classes.find((item) => item.id === classId);
  if (!user || user.role !== "athlete" || !classEntry) return;
  const status = getBookingStatus(classEntry, user.id);
  if (!status.canBook) {
    toast(status.toast || "Ainda não podes reservar esta aula.");
    return;
  }
  getClassesForDate(classEntry.date).forEach((item) => {
    item.attendees = (item.attendees || []).filter((id) => id !== user.id);
    item.present = (item.present || []).filter((id) => id !== user.id);
    item.absent = (item.absent || []).filter((id) => id !== user.id);
  });
  classEntry.attendees = [...new Set([...(classEntry.attendees || []), user.id])];
  app.state.selectedDate = classEntry.date;
  if (!commitState(`Aula das ${classEntry.time} reservada.`)) return;
  render();
}

function cancelClass(classId) {
  const user = getSessionUser();
  const classEntry = app.state.classes.find((item) => item.id === classId);
  if (!user || user.role !== "athlete" || !classEntry) return;
  const status = getBookingStatus(classEntry, user.id);
  if (!status.canCancel) {
    toast(status.toast || "Já não podes cancelar esta reserva.");
    return;
  }
  classEntry.attendees = (classEntry.attendees || []).filter((id) => id !== user.id);
  classEntry.present = (classEntry.present || []).filter((id) => id !== user.id);
  classEntry.absent = (classEntry.absent || []).filter((id) => id !== user.id);
  if (!commitState(`Reserva das ${classEntry.time} cancelada.`)) return;
  render();
}

function addAthleteToClass(classId, selectId) {
  if (!requireManage()) return;
  const classEntry = app.state.classes.find((item) => item.id === classId);
  const athleteId = valueOf(selectId);
  const athlete = getUser(athleteId);
  if (!classEntry || !athlete || athlete.role !== "athlete") {
    toast("Escolhe um atleta.");
    return;
  }
  const existingClass = getBookedClass(classEntry.date, athlete.id);
  if (existingClass && existingClass.id !== classEntry.id) {
    toast(`${athlete.name} já tem reserva neste dia.`);
    return;
  }
  classEntry.attendees = [...new Set([...(classEntry.attendees || []), athlete.id])];
  classEntry.present = (classEntry.present || []).filter((id) => id !== athlete.id);
  classEntry.absent = (classEntry.absent || []).filter((id) => id !== athlete.id);
  app.state.expandedClassRosterId = classEntry.id;
  saveState();
  toast(`${athlete.name} adicionado à aula das ${classEntry.time}.`);
  render();
}

function addClass() {
  if (!requireManage()) return;
  const date = valueOf("newClassDate") || app.state.selectedDate || getTodayWorkout().date;
  const time = valueOf("newClassTime");
  const duration = Number(valueOf("newClassDuration") || 60);
  const repeatFuture = isChecked("newClassRepeatFuture");
  if (!isValidIsoDate(date)) {
    toast("Escolhe uma data válida.");
    return;
  }
  if (!time) {
    toast("Escolhe a hora da aula.");
    return;
  }
  if (!isValidTimeOfDay(time)) {
    toast("Escolhe uma hora de aula valida.");
    return;
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    toast("Define uma duração válida.");
    return;
  }
  if (!getWorkout(date)) {
    toast("Cria a programacao desse dia antes de adicionar aulas.");
    return;
  }
  const targetDates = [date, ...(repeatFuture ? getFutureSameWeekdayDates(date) : [])];
  const missingDates = targetDates.filter((targetDate) => !classExists(targetDate, time));
  if (!missingDates.length) {
    toast("Já existe uma aula nesse dia e hora.");
    return;
  }

  const datesWithHiddenClass = missingDates.filter((targetDate) =>
    app.state.classes.some((classEntry) => classEntry.date === targetDate && classEntry.time === time)
  );
  const datesToCreate = missingDates.filter((targetDate) => !datesWithHiddenClass.includes(targetDate));
  missingDates.forEach((targetDate) => clearDeletedClassMarker(targetDate, time));
  app.state.classes.push(
    ...datesToCreate.map((targetDate) =>
      createClassEntry(targetDate, time, duration, { custom: true, recurring: repeatFuture })
    )
  );
  app.state.selectedDate = date;
  app.state.activeAdminTab = "classes";
  const futureCount = missingDates.filter((targetDate) => targetDate > date).length;
  if (!commitState(
    futureCount
      ? `Aula adicionada e repetida em ${futureCount} semana${futureCount === 1 ? "" : "s"} seguinte${futureCount === 1 ? "" : "s"}.`
      : "Aula adicionada."
  )) return;
  render();
}

function deleteClass(classId) {
  if (!requireManage()) return;
  const classEntry = app.state.classes.find((item) => item.id === classId);
  if (!classEntry) return;
  const ok = window.confirm(`Remover a aula das ${classEntry.time} em ${formatDateShort(classEntry.date)}?`);
  if (!ok) return;
  markClassDeletedForDate(classEntry.date, classEntry.time);
  app.state.classes = app.state.classes.filter((item) => item.id !== classId);
  if (!commitState("Aula removida.")) return;
  render();
}

function toggleAttendance(classId, userId) {
  if (!requireManage()) return;
  const classEntry = app.state.classes.find((item) => item.id === classId);
  if (!classEntry) return;
  const nextStatus = (classEntry.present || []).includes(userId) ? "clear" : "present";
  setAttendance(classId, userId, nextStatus);
}

function setAttendance(classId, userId, status) {
  if (!requireManage()) return;
  const classEntry = app.state.classes.find((item) => item.id === classId);
  if (!classEntry) return;
  classEntry.attendees = classEntry.attendees || [];
  classEntry.present = classEntry.present || [];
  classEntry.absent = classEntry.absent || [];
  if (!classEntry.attendees.includes(userId)) {
    classEntry.attendees.push(userId);
  }
  classEntry.present = classEntry.present.filter((id) => id !== userId);
  classEntry.absent = classEntry.absent.filter((id) => id !== userId);
  if (status === "present") {
    classEntry.present.push(userId);
  }
  if (status === "absent") {
    classEntry.absent.push(userId);
  }
  app.state.expandedClassRosterId = classId;
  if (!saveState()) return;
  render();
}

function addAthlete() {
  addUser();
}

function togglePersonEditor(userId) {
  if (!canAdmin()) return;
  app.state.expandedPersonId = app.state.expandedPersonId === userId ? "" : userId;
  saveState();
  render();
}

async function savePerson(userId) {
  if (!canAdmin()) {
    toast("Apenas Admin pode alterar pessoas.");
    return;
  }
  if (!requireOnlineAccountWriteReady()) return;
  const user = getUser(userId);
  if (!user) return;
  const previousState = cloneStateForRollback();
  const safeId = domSafeId(user.id);
  const role = valueOf(`personRole-${safeId}`) || user.role;
  const active = valueOf(`personActive-${safeId}`) !== "inactive";
  const name = valueOf(`personName-${safeId}`);
  const loginName = normalizeLoginName(valueOf(`personLogin-${safeId}`));
  const password = valueOf(`personPassword-${safeId}`);
  const email = valueOf(`personEmail-${safeId}`);
  const phone = valueOf(`personPhone-${safeId}`);
  const gender = normalizeGender(valueOf(`personGender-${safeId}`));
  if (!isValidUserRole(role)) {
    toast("Escolhe um acesso valido.");
    return;
  }
  if (user.id === app.state.sessionUserId && !active) {
    toast("Nao podes desativar a tua propria conta.");
    return;
  }
  if (user.id === app.state.sessionUserId && role !== "admin") {
    toast("Nao podes retirar o teu proprio acesso Admin.");
    return;
  }
  if (wouldLeaveNoActiveAdmin(user.id, role, active)) {
    toast("Tem de existir pelo menos um Admin ativo.");
    return;
  }
  if (!name) {
    toast("Escreve o nome.");
    return;
  }
  if (!loginName) {
    toast("Define o nome de login.");
    return;
  }
  if (isLoginNameTaken(loginName, user.id)) {
    toast("Esse nome de login já está em uso.");
    return;
  }
  user.name = name;
  user.loginName = loginName;
  user.role = role;
  user.active = active;
  if (password) user.password = password;
  user.email = email;
  user.phone = phone;
  user.gender = role === "athlete" ? gender : "-";
  syncSelectedUsersAfterPeopleChange();
  if (!(await commitAccountState("Pessoa atualizada.", "Nao consegui guardar a alteracao na base online. Tenta novamente."))) {
    restoreStateAfterFailedAccountSave(previousState);
    render();
    return;
  }
  render();
}

async function deletePerson(userId) {
  if (!canAdmin()) {
    toast("Apenas Admin pode apagar pessoas.");
    return;
  }
  if (!requireOnlineAccountWriteReady()) return;
  const user = getUser(userId);
  if (!user) return;
  if (user.id === app.state.sessionUserId) {
    toast("Nao podes apagar a tua propria conta.");
    return;
  }
  if (wouldLeaveNoActiveAdmin(user.id, "", false)) {
    toast("Tem de existir pelo menos um Admin ativo.");
    return;
  }
  const ok = window.confirm(`Apagar a conta de ${user.name}? Esta acao remove tambem resultados, PRs, comentarios e reservas.`);
  if (!ok) return;
  const previousState = cloneStateForRollback();
  app.state.deletedUsers = mergeDeletedUserMarkers(app.state.deletedUsers, [{
    userId: user.id,
    deletedAt: new Date().toISOString(),
  }]);
  app.state.users = app.state.users.filter((item) => item.id !== user.id);
  removeUserData(user.id);
  app.state.expandedPersonId = "";
  syncSelectedUsersAfterPeopleChange();
  if (!(await commitAccountState("Conta apagada.", "Nao consegui guardar a remocao na base online. Tenta novamente."))) {
    restoreStateAfterFailedAccountSave(previousState);
    render();
    return;
  }
  render();
}

async function addUser() {
  if (!canAdmin()) {
    toast("Apenas Admin pode criar pessoas.");
    return;
  }
  if (!requireOnlineAccountWriteReady()) return;
  const role = valueOf("newUserRole") || "athlete";
  const name = valueOf("newUserName");
  const loginName = normalizeLoginName(valueOf("newUserLoginName"));
  const password = valueOf("newUserPassword");
  const email = valueOf("newUserEmail");
  const phone = valueOf("newUserPhone");
  const gender = normalizeGender(valueOf("newUserGender"));
  if (!name) {
    toast("Escreve o nome.");
    return;
  }
  if (!loginName) {
    toast("Define o nome de login.");
    return;
  }
  if (isLoginNameTaken(loginName)) {
    toast("Esse nome de login já está em uso.");
    return;
  }
  if (!password) {
    toast("Define uma password inicial.");
    return;
  }
  if (!isValidUserRole(role)) {
    toast("Escolhe um acesso valido.");
    return;
  }
  const previousState = cloneStateForRollback();
  const id = uniqueAthleteId(name);
  app.state.users.push({ id, name, loginName, role, gender: role === "athlete" ? gender : "-", classTime: "-", password, email, phone, active: true });
  if (role === "athlete") {
    app.state.currentUserId = id;
  } else {
    app.state.currentStaffId = id;
  }
  if (!(await commitAccountState(
    role === "athlete" ? "Atleta adicionado." : "Staff adicionado.",
    "Nao consegui guardar a nova conta na base online. Tenta novamente."
  ))) {
    restoreStateAfterFailedAccountSave(previousState);
    render();
    return;
  }
  render();
}

function setWorkoutUnlock(value, workoutId = "") {
  if (!requireManage()) return;
  const workout = app.state.workouts.find((item) => item.id === workoutId) || getWorkout(app.state.selectedDate) || getTodayWorkout();
  workout.forceUnlocked = value;
  app.state.selectedDate = workout.date;
  if (!commitState(value ? "Treino desbloqueado para atletas." : "Treino voltou a ficar bloqueado.")) return;
  render();
}

function generateMasterPin(workoutId) {
  if (!requireManage()) return;
  const workout = app.state.workouts.find((item) => item.id === workoutId) || getWorkout(app.state.selectedDate) || getTodayWorkout();
  const userId = valueOf("masterPinAthlete") || getAthletes()[0]?.id;
  if (!workout || !userId) {
    toast("Escolhe um atleta para gerar PIN.");
    return;
  }
  const previousState = cloneStateForRollback();
  const code = createMasterPinCode(workout.date, userId);
  app.state.masterPins = app.state.masterPins || [];
  app.state.masterPins.push({
    id: uniqueId("mp"),
    workoutId: workout.id,
    date: workout.date,
    userId,
    code,
    used: false,
    createdBy: getCurrentUser()?.id || "",
    createdAt: new Date().toISOString(),
  });
  if (!commitState()) {
    restoreStateAfterFailedAccountSave(previousState);
    return;
  }
  flushSharedStateNow();
  toast(`PIN master gerado: ${code}`);
  render();
}

function unlockWorkoutWithCode(date) {
  const user = getSessionUser();
  const code = normalizeAccessCode(valueOf("workoutAccessCodeInput"));
  if (!user || user.role !== "athlete") {
    toast("Inicia sessao como atleta para desbloquear o treino.");
    return;
  }
  if (!code) {
    toast("Escreve o PIN da aula.");
    return;
  }

  if (code.length === 6 && app.online.enabled && app.online.client && !app.online.loading) {
    return loadRemoteState({ background: false }).then(() => unlockWorkoutWithCodeFromState(date, code));
  }
  return unlockWorkoutWithCodeFromState(date, code);
}

function unlockWorkoutWithCodeFromState(date, code) {
  const workout = getWorkout(date) || getWorkout(app.state.selectedDate) || getTodayWorkout();
  const user = getSessionUser();
  if (!user || user.role !== "athlete") {
    toast("Inicia sessao como atleta para desbloquear o treino.");
    return;
  }
  if (!workout) {
    toast("Não encontrei treino para este dia.");
    return;
  }

  const masterPin = getMasterPinForAthleteCode(user.id, code);
  if (masterPin) {
    if (masterPin.used) {
      toast("Este PIN master já foi usado.");
      return;
    }
    const masterWorkout = getWorkoutForMasterPin(masterPin);
    if (!masterWorkout) {
      toast("Não encontrei o treino deste PIN master.");
      return;
    }
    const previousState = cloneStateForRollback();
    masterPin.used = true;
    masterPin.usedAt = new Date().toISOString();
    masterPin.usedBy = user.id;
    if (!unlockWorkoutForUser(masterWorkout, user, { method: "master-pin", masterPinId: masterPin.id })) {
      restoreStateAfterFailedAccountSave(previousState);
      return;
    }
    flushSharedStateNow();
    toast(`Treino desbloqueado com PIN master para ${formatDateShort(masterWorkout.date)}.`);
    render();
    return;
  }

  const matchingMasterPin = getMasterPinByCode(code);
  if (matchingMasterPin?.used) {
    toast("Este PIN master já foi usado.");
    return;
  }
  if (matchingMasterPin && getMasterPinUserId(matchingMasterPin) !== user.id) {
    toast("Este PIN master foi gerado para outro atleta.");
    return;
  }

  const classEntry = getClassForAccessCode(workout, code);
  if (!classEntry) {
    toast("PIN não pertence às aulas deste dia.");
    return;
  }
  const status = getClassAccessStatus(classEntry);
  if (!status.active) {
    toast(status.message);
    return;
  }
  app.state.selectedDate = workout.date;
  app.state.workoutUnlocks = app.state.workoutUnlocks || [];
  const exists = userHasWorkoutUnlock(user.id, workout.id);
  if (!exists) {
    app.state.workoutUnlocks.push({
      workoutId: workout.id,
      userId: user.id,
      classId: classEntry.id,
      createdAt: new Date().toISOString(),
      method: "class-pin",
    });
  }
  if (!commitState("Treino desbloqueado.")) return;
  render();
}

function unlockWorkoutForUser(workout, user, meta = {}) {
  app.state.selectedDate = workout.date;
  app.state.workoutUnlocks = app.state.workoutUnlocks || [];
  const exists = userHasWorkoutUnlock(user.id, workout.id);
  if (!exists) {
    app.state.workoutUnlocks.push({
      workoutId: workout.id,
      userId: user.id,
      createdAt: new Date().toISOString(),
      ...meta,
    });
  }
  return saveState();
}

function toggleFeedBoost(feedId) {
  const item = app.state.feed.find((entry) => entry.id === feedId);
  if (!item) return;
  if (!toggleBoost(item)) return;
  render();
}

function toggleResultBoost(resultId, mode = "metcon") {
  const result = app.state.results.find((entry) => entry.id === resultId);
  if (!result) return;
  const reactionMode = normalizeResultReactionMode(mode);
  const user = getCurrentUser();
  if (!user) {
    toast("Inicia sessão para dar Boost.");
    return;
  }
  const reactionsByMode = normalizeResultReactionModes(result);
  const alreadyGiven = hasBoostFrom(reactionsByMode[reactionMode], user.id);
  const nextReactions = getToggledBoostReactions(reactionsByMode[reactionMode]);
  if (!nextReactions) return;
  const previous = result.reactionsByMode;
  const previousNotifications = app.state.notifications;
  result.reactionsByMode = { ...reactionsByMode, [reactionMode]: nextReactions };
  if (!alreadyGiven) addResultInteractionNotification(result, user, "boost", reactionMode);
  if (!saveState()) {
    result.reactionsByMode = previous;
    app.state.notifications = previousNotifications;
    return;
  }
  flushSharedStateNow();
  render();
}

function toggleBoost(record) {
  const nextReactions = getToggledBoostReactions(record.reactions);
  if (!nextReactions) return false;
  const previous = record.reactions;
  record.reactions = nextReactions;
  if (saveState()) return true;
  record.reactions = previous;
  return false;
}

function getToggledBoostReactions(reactions) {
  const user = getCurrentUser();
  if (!user) {
    toast("Inicia sessão para dar Boost.");
    return null;
  }
  const normalized = normalizeReactions(reactions);
  const alreadyGiven = normalized.boostBy.includes(user.id);
  normalized.boostBy = alreadyGiven
    ? normalized.boostBy.filter((userId) => userId !== user.id)
    : [...normalized.boostBy, user.id];
  return normalized;
}

function addResultComment(resultId, inputId, mode = "metcon") {
  const result = app.state.results.find((entry) => entry.id === resultId);
  const user = getCurrentUser();
  const text = valueOf(inputId);
  if (!result || !user) return;
  if (!text) {
    toast("Escreve um comentário.");
    return;
  }
  const previousComments = result.comments;
  const previousNotifications = app.state.notifications;
  result.comments = normalizeResultComments(result.comments);
  result.comments.push({
    id: uniqueId("comment"),
    mode,
    userId: user.id,
    authorRole: user.role || "athlete",
    text: text.slice(0, 180),
    createdAt: new Date().toISOString(),
  });
  addResultInteractionNotification(result, user, "comment", mode);
  app.state.expandedResultCommentsKey = getResultCommentKey(resultId, mode);
  if (!saveState()) {
    result.comments = previousComments;
    app.state.notifications = previousNotifications;
    return;
  }
  flushSharedStateNow();
  toast("Comentário adicionado.");
  render();
}

function resetDemo() {
  const ok = window.confirm("Repor a demo e apagar dados guardados neste navegador?");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  app.state = createSeedState();
  saveState();
  toast("Demo reposta.");
  render();
}

function getAccess(workout) {
  if (!workout) {
    return { unlocked: false, shortLabel: "Sem treino", longLabel: "Não há treino selecionado." };
  }
  if (canManage()) {
    return { unlocked: true, shortLabel: "Staff vê tudo", longLabel: "Coach e admin veem a programação completa." };
  }
  if (!workout.published) {
    return {
      unlocked: false,
      shortLabel: "Rascunho",
      longLabel: "Este treino ainda não foi publicado pelo coach.",
    };
  }
  if (workout.forceUnlocked) {
    return {
      unlocked: true,
      shortLabel: "Desbloqueado pelo coach",
      longLabel: "O coach libertou este treino manualmente.",
    };
  }
  const user = getCurrentUser();
  if (user?.role === "athlete" && userHasWorkoutUnlock(user.id, workout.id)) {
    return {
      unlocked: true,
      shortLabel: "Desbloqueado por PIN",
      longLabel: "Este treino foi desbloqueado com o PIN da aula.",
    };
  }
  if (workout.classesUnlocked || areAllWorkoutClassesEnded(workout)) {
    return {
      unlocked: true,
      shortLabel: "Aulas terminadas",
      longLabel: "Todas as aulas deste dia foram terminadas pelo coach. O treino está disponível para todos os atletas.",
    };
  }
  const now = new Date();
  const unlockAt = localDateTime(workout.date, workout.unlockTime);
  if (now >= unlockAt) {
    return {
      unlocked: true,
      shortLabel: `Aberto desde ${workout.unlockTime}`,
      longLabel: `O treino está disponível desde as ${workout.unlockTime}.`,
    };
  }

  const classEntry = getAthleteClass(workout.date, user);
  if (SHOW_CLASS_FEATURES && classEntry) {
    const classEndsAt = localDateTime(workout.date, classEntry.endTime);
    const hasAttendance = (classEntry.present || []).includes(user.id);
    const hasAbsence = (classEntry.absent || []).includes(user.id);
    if (hasAttendance && (classEntry.ended || now >= classEndsAt)) {
      return {
        unlocked: true,
        shortLabel: "Aberto após aula",
        longLabel: "O treino ficou disponível porque a tua presença foi marcada e a aula já terminou.",
      };
    }
    if (hasAbsence) {
      return {
        unlocked: false,
        shortLabel: "Falta marcada",
        longLabel: `A tua falta foi marcada na aula das ${classEntry.time}. O treino abre às ${workout.unlockTime}.`,
      };
    }
    if (!hasAttendance) {
      return {
        unlocked: false,
        shortLabel: "Presença por confirmar",
        longLabel: `O treino abre após a tua presença ser marcada na aula das ${classEntry.time}, ou às ${workout.unlockTime}.`,
      };
    }
    return {
      unlocked: false,
      shortLabel: `Fecha até ${classEntry.endTime}`,
      longLabel: `A tua presença já está marcada. O treino fica disponível quando a aula das ${classEntry.time} terminar, ou às ${workout.unlockTime}.`,
    };
  }

  return {
    unlocked: false,
    ...getLockedAccessCopy(workout),
  };
}

function getSortedLeaderboard(workout, mode = "metcon") {
  const rows = getResultsForWorkout(workout.id).filter((result) =>
    mode === "strength" ? Boolean(getStrengthRankingScore(result, workout)) : Boolean(getMetconScore(result))
  );
  const type = mode === "strength" ? getEffectiveStrengthScoreType(workout) : workout.scoreType;
  return rows.sort((a, b) => {
    const left = getLeaderboardSortValue(a, workout, mode);
    const right = getLeaderboardSortValue(b, workout, mode);
    if (type === "time") return left - right;
    return right - left;
  });
}

function getLeaderboardSortValue(result, workout, mode) {
  const type = mode === "strength" ? getEffectiveStrengthScoreType(workout) : workout.scoreType;
  return mode === "strength" ? getStrengthSortValue(result, type) : scoreValue(getMetconScore(result), type);
}

function getMetconScore(result) {
  return result.metconScore || result.score || "";
}

function getMetconDetail(result) {
  const level = result.metconLevel || result.level || "RX";
  const notes = result.metconNotes || result.notes || "";
  return [level, notes].filter(Boolean).join(" · ");
}

function getStrengthScore(result, workout) {
  if (getEffectiveStrengthScoreType(workout) === "complex") {
    const currentRows = getStrengthComplexRows(workout, result);
    const bestLoad = result.prRawValue || result.strengthLoad || getBestCompletedComplexLoad(currentRows);
    const score = formatComplexStrengthScore(currentRows, bestLoad);
    if (score) return score;
  }
  if (result.strengthScore) return result.strengthScore;
  if (result.strengthLoad || result.load) return `${result.strengthLoad || result.load} kg`;
  if (getEffectiveStrengthScoreType(workout) === "complete" && result.strengthNotes) return "Completed";
  return "";
}

function getStrengthRankingScore(result, workout) {
  const type = getEffectiveStrengthScoreType(workout);
  if (type === "quality") return "";
  const prConfig = prTypes[result.prType || workout?.prType || "load"] || prTypes.load;
  const rawPrValue = result.prRawValue || result.strengthLoad || result.load || "";
  if (type === "complex" && rawPrValue) return formatScoreWithUnit(rawPrValue, "kg");
  if ((type === "load" || type === "reps" || type === "time") && rawPrValue) {
    return formatScoreWithUnit(rawPrValue, prConfig.unit);
  }
  return getStrengthScore(result, workout);
}

function getStrengthDetail(result, workout) {
  const movement = result.strengthMovement || workout.movement;
  const notes = result.strengthNotes || "";
  const prLabel = prTypes[result.prType || workout.prType || "load"]?.label || "";
  const rawPrValue = result.prRawValue || result.strengthLoad || result.load || "";
  const prValue = rawPrValue ? `${prLabel}: ${rawPrValue}` : "";
  const complexSummary =
    getEffectiveStrengthScoreType(workout) === "complex"
      ? getComplexSetsSummary(getStrengthComplexRows(workout, result))
      : "";
  return [movement, prValue, complexSummary, notes].filter(Boolean).join(" · ");
}

function getStrengthSortValue(result, type) {
  if (type === "complex") {
    const bestLoad = getBestCompletedComplexLoad(result.strengthSets) || result.prRawValue || result.strengthLoad || result.load;
    const value = Number(String(bestLoad || "").replace(",", ".").replace(/[^\d.]/g, ""));
    if (Number.isFinite(value)) return value;
  }
  if (result.prRawValue || result.strengthLoad || result.load) {
    const load = numericLoad(result.prRawValue || result.strengthLoad || result.load);
    if (Number.isFinite(load)) return load;
  }
  return scoreValue(getStrengthScore(result, null), type);
}

function getComplexSetsSummary(sets) {
  const normalized = normalizeComplexSets(sets);
  if (!normalized.length) return "";
  const completed = normalized.filter((row) => row.status === "done").length;
  const failed = normalized.filter((row) => row.status === "failed").length;
  return `${completed}/${normalized.length} sets completos${failed ? `, ${failed} falhado${failed > 1 ? "s" : ""}` : ""}`;
}

function formatScoreWithUnit(value, unit) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (unit === "kg" && !/\bkg\b/i.test(raw)) return `${raw} kg`;
  if (unit === "reps" && !/\breps?\b/i.test(raw)) return `${raw} reps`;
  return raw;
}

function getVisibleFeed() {
  return app.state.feed
    .filter((item) => {
      const workout = app.state.workouts.find((entry) => entry.id === item.workoutId);
      if (!workout) return true;
      return getAccess(workout).unlocked;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function dedupeResultRecords(results) {
  return dedupeResultRecordsWithIdMap(results).records;
}

function dedupeResultRecordsWithIdMap(results) {
  const groups = new Map();
  (results || []).forEach((result) => {
    const key = buildResultGroupKey(result);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(result);
  });

  const idMap = new Map();
  const records = [...groups.values()].map((items) => {
    if (items.length === 1) return items[0];
    const merged = mergeResultRecords(items);
    items.forEach((item) => {
      if (item.id && item.id !== merged.id) idMap.set(item.id, merged.id);
    });
    return merged;
  });

  return { records, idMap };
}

function buildResultGroupKey(result) {
  const resultDate = result?.workoutDate || getWorkoutDateFromId(result?.workoutId) || "";
  return [result?.userId || "", result?.workoutId || resultDate || ""].join("|");
}

function mergeResultRecords(records) {
  const sorted = [...records].sort((a, b) => resultTimestamp(a) - resultTimestamp(b));
  const latest = sorted[sorted.length - 1];
  const merged = {
    ...latest,
    comments: [],
    reactionsByMode: createEmptyResultReactionModes(),
  };

  sorted.forEach((result) => {
    if (result.workoutId) merged.workoutId = result.workoutId;
    if (result.workoutDate) merged.workoutDate = result.workoutDate;
    if (hasStrengthResult(result)) copyResultFields(merged, result, [
      "strengthScore",
      "strengthLoad",
      "load",
      "prType",
      "prRawValue",
      "strengthMovement",
      "strengthNotes",
      "strengthSets",
    ]);
    if (hasMetconResult(result)) copyResultFields(merged, result, [
      "metconScore",
      "score",
      "metconLevel",
      "level",
      "metconNotes",
      "notes",
    ]);
    merged.reactionsByMode = mergeResultReactionModes(merged.reactionsByMode, normalizeResultReactionModes(result));
    merged.comments = mergeComments(merged.comments, result.comments);
  });

  merged.id = latest.id;
  merged.createdAt = latest.createdAt || merged.createdAt;
  return merged;
}

function resultTimestamp(result) {
  const timestamp = new Date(result?.updatedAt || result?.createdAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function hasStrengthResult(result) {
  return Boolean(
    result?.strengthScore ||
      result?.strengthLoad ||
      result?.load ||
      result?.prRawValue ||
      normalizeComplexSets(result?.strengthSets).some((row) => row.load || row.reps || row.movement)
  );
}

function hasMetconResult(result) {
  return Boolean(result?.metconScore || result?.score);
}

function copyResultFields(target, source, fields) {
  fields.forEach((field) => {
    if (Array.isArray(source[field])) {
      if (source[field].length) target[field] = source[field];
      return;
    }
    if (source[field] !== undefined && source[field] !== null && source[field] !== "") {
      target[field] = source[field];
    }
  });
}

function mergeReactions(current = {}, next = {}) {
  const first = normalizeReactions(current);
  const second = normalizeReactions(next);
  return {
    legacyBoost: Math.max(first.legacyBoost, second.legacyBoost),
    boostBy: [...new Set([...first.boostBy, ...second.boostBy])],
  };
}

function createEmptyReactions() {
  return { legacyBoost: 0, boostBy: [] };
}

function createEmptyResultReactionModes() {
  return { strength: createEmptyReactions(), metcon: createEmptyReactions() };
}

function normalizeResultReactionMode(mode) {
  return mode === "strength" ? "strength" : "metcon";
}

function normalizeResultReactionModes(result) {
  const source = result?.reactionsByMode;
  if (source && typeof source === "object") {
    return {
      strength: normalizeReactions(source.strength),
      metcon: normalizeReactions(source.metcon),
    };
  }
  return {
    strength: createEmptyReactions(),
    metcon: normalizeReactions(result?.reactions),
  };
}

function mergeResultReactionModes(current, next) {
  const first = normalizeResultReactionModes({ reactionsByMode: current });
  const second = normalizeResultReactionModes({ reactionsByMode: next });
  return {
    strength: mergeReactions(first.strength, second.strength),
    metcon: mergeReactions(first.metcon, second.metcon),
  };
}

function getResultReactions(result, mode) {
  return normalizeResultReactionModes(result)[normalizeResultReactionMode(mode)];
}

function normalizeReactions(reactions) {
  const source = reactions && typeof reactions === "object" ? reactions : {};
  const boostBy = [
    ...new Set(
      (Array.isArray(source.boostBy) ? source.boostBy : Array.isArray(source.kudosBy) ? source.kudosBy : [])
        .map((userId) => String(userId || "").trim())
        .filter(Boolean)
    ),
  ];
  const numericValue = (value) => Math.max(0, Math.floor(Number(value) || 0));
  const hasExplicitLegacyBoost = Object.prototype.hasOwnProperty.call(source, "legacyBoost") || Object.prototype.hasOwnProperty.call(source, "legacyKudos");
  const hasBoostTotal = Object.prototype.hasOwnProperty.call(source, "boost") || Object.prototype.hasOwnProperty.call(source, "kudos");
  const legacyBoost = hasExplicitLegacyBoost
    ? numericValue(source.legacyBoost ?? source.legacyKudos)
    : hasBoostTotal
      ? Math.max(0, numericValue(source.boost ?? source.kudos) - boostBy.length)
      : numericValue(source.like) + numericValue(source.parabens) + numericValue(source.forca);
  return { legacyBoost, boostBy };
}

function getBoostCount(reactions) {
  const normalized = normalizeReactions(reactions);
  return normalized.legacyBoost + normalized.boostBy.length;
}

function hasBoostFrom(reactions, userId) {
  if (!userId) return false;
  return normalizeReactions(reactions).boostBy.includes(userId);
}

function mergeComments(current = [], next = []) {
  const comments = new Map();
  [...normalizeResultComments(current), ...normalizeResultComments(next)].forEach((comment) => {
    comments.set(comment.id || uniqueId("comment"), comment);
  });
  return [...comments.values()].sort((a, b) => resultTimestamp(a) - resultTimestamp(b));
}

function syncPrSourceResultIds(prs, idMap) {
  if (!idMap?.size) return;
  prs.forEach((pr) => {
    if (idMap.has(pr.sourceResultId)) pr.sourceResultId = idMap.get(pr.sourceResultId);
  });
}

function dedupeStoredResults() {
  const resultDedupe = dedupeResultRecordsWithIdMap(app.state.results || []);
  app.state.results = resultDedupe.records;
  syncPrSourceResultIds(app.state.prs || [], resultDedupe.idMap);
}

function getResultsForWorkout(workoutId) {
  const workout = app.state.workouts.find((entry) => entry.id === workoutId);
  if (app.state.currentRole === "athlete" && workout && !getAccess(workout).unlocked) return [];
  const workoutDate = workout?.date || getWorkoutDateFromId(workoutId);
  return dedupeResultRecords(app.state.results.filter((result) => isResultForWorkout(result, workoutId, workoutDate)));
}

function getResultsForUser(userId) {
  return app.state.results.filter((result) => result.userId === userId);
}

function getWorkoutForResult(result) {
  const resultDate = getResultWorkoutDate(result);
  return app.state.workouts.find(
    (workout) => workout.id === result.workoutId || (resultDate && workout.date === resultDate)
  );
}

function isResultForWorkout(result, workoutId, workoutDate) {
  if (!result) return false;
  if (workoutId && result.workoutId === workoutId) return true;
  if (workoutId && result.workoutId) return false;
  const resultDate = getResultWorkoutDate(result);
  return Boolean(workoutDate && resultDate && resultDate === workoutDate);
}

function getResultWorkoutDate(result, workouts = app.state?.workouts || []) {
  if (!result) return "";
  const workout = workouts.find((entry) => entry.id === result.workoutId);
  const idDate = workout?.date || getWorkoutDateFromId(result.workoutId);
  return idDate || result.workoutDate || "";
}

function getWorkoutDateFromId(workoutId) {
  const match = String(workoutId || "").match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function getResultComments(result, mode = "") {
  const comments = normalizeResultComments(result.comments);
  if (!mode) return comments;
  return comments.filter((comment) => comment.mode === mode);
}

function normalizeResultComments(comments) {
  if (!Array.isArray(comments)) return [];
  return comments.map((comment) => ({
    ...comment,
    mode: comment.mode === "strength" || comment.mode === "metcon" ? comment.mode : "metcon",
    authorRole: comment.authorRole || getUser(comment.userId)?.role || "athlete",
  }));
}

function normalizeNotifications(notifications) {
  if (!Array.isArray(notifications)) return [];
  const seen = new Set();
  return notifications
    .map((notification) => ({
      id: String(notification?.id || "").trim(),
      userId: String(notification?.userId || "").trim(),
      actorId: String(notification?.actorId || "").trim(),
      actorName: String(notification?.actorName || "").trim().slice(0, 80),
      type: notification?.type === "comment" ? "comment" : "boost",
      resultId: String(notification?.resultId || "").trim(),
      mode: normalizeResultReactionMode(notification?.mode),
      createdAt: String(notification?.createdAt || "").trim(),
      readAt: String(notification?.readAt || "").trim(),
    }))
    .filter((notification) => {
      if (!notification.id || !notification.userId || seen.has(notification.id)) return false;
      seen.add(notification.id);
      return true;
    });
}

function addResultInteractionNotification(result, actor, type, mode) {
  const recipientId = String(result?.userId || "").trim();
  if (!recipientId || !actor?.id || recipientId === actor.id) return;
  app.state.notifications = normalizeNotifications(app.state.notifications || []);
  app.state.notifications.push({
    id: uniqueId("notification"),
    userId: recipientId,
    actorId: actor.id,
    actorName: actor.name || "Membro da box",
    type: type === "comment" ? "comment" : "boost",
    resultId: result.id,
    mode: normalizeResultReactionMode(mode),
    createdAt: new Date().toISOString(),
    readAt: "",
  });
}

function markInteractionNotificationsAsRead(user) {
  if (!user || user.role !== "athlete") return "";
  const unread = normalizeNotifications(app.state.notifications || [])
    .filter((notification) => notification.userId === user.id && !notification.readAt)
    .sort((first, second) => String(second.createdAt).localeCompare(String(first.createdAt)));
  if (!unread.length) return "";

  const readIds = new Set(unread.map((notification) => notification.id));
  const readAt = new Date().toISOString();
  app.state.notifications = normalizeNotifications(app.state.notifications || []).map((notification) =>
    readIds.has(notification.id) ? { ...notification, readAt } : notification
  );

  const preview = unread
    .slice(0, 2)
    .map((notification) => {
      const actor = notification.actorName || getUser(notification.actorId)?.name || "Um membro da box";
      const target = notification.mode === "strength" ? "força" : "WOD";
      return notification.type === "comment"
        ? `${actor} comentou o teu resultado de ${target}.`
        : `${actor} deu Boost ao teu resultado de ${target}.`;
    })
    .join(" ");
  const countLabel = unread.length === 1 ? "nova interação" : "novas interações";
  const remaining = unread.length > 2 ? " Vê o ranking para mais detalhes." : "";
  return `Tens ${unread.length} ${countLabel}. ${preview}${remaining}`;
}

function getResultCommentKey(resultId, mode) {
  return `${resultId}-${mode || "metcon"}`;
}

function getUserWorkoutResult(workout, user) {
  if (!workout || !user) return null;
  return (
    app.state.results.find(
      (result) =>
        result.userId === user.id &&
        isResultForWorkout(result, workout.id, workout.date)
    ) || null
  );
}

function getWorkout(date) {
  return app.state.workouts.find((workout) => workout.date === date);
}

function getWorkoutAccessCode(workout) {
  if (!workout.accessCode) {
    workout.accessCode = createWorkoutAccessCode(workout.date);
  }
  return normalizeAccessCode(workout.accessCode);
}

function getClassAccessCode(classEntry) {
  if (!classEntry.accessCode) {
    classEntry.accessCode = createClassAccessCode(classEntry);
  }
  return normalizeAccessCode(classEntry.accessCode);
}

function createWorkoutAccessCode(date) {
  const digits = String(date || "")
    .replace(/\D/g, "")
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (index + 3), 0);
  return String((digits * 73 + 419) % 10000).padStart(4, "0");
}

function createClassAccessCode(classEntry) {
  const seed = `${classEntry.date || ""}-${classEntry.time || ""}-${classEntry.endTime || ""}-${classEntry.id || ""}`;
  let hash = 23;
  String(seed).split("").forEach((char) => {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  });
  return String((hash % 9000) + 1000);
}

function createMasterPinCode(date, userId) {
  return String(secureRandomInt(900000) + 100000);
}

function secureRandomInt(max) {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const values = new Uint32Array(1);
    cryptoApi.getRandomValues(values);
    return values[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function normalizeAccessCode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function getClassAccessStatus(classEntry, now = new Date()) {
  const opensAt = getClassAccessOpensAt(classEntry);
  const expiresAt = getClassAccessExpiresAt(classEntry);
  if (now < opensAt) {
    return {
      active: false,
      chip: "gold",
      label: `Válido às ${formatTimeOnly(opensAt)}`,
      message: `Este PIN só fica válido às ${formatTimeOnly(opensAt)}.`,
    };
  }
  if (now <= expiresAt) {
    return {
      active: true,
      chip: "green",
      label: `Válido até ${formatTimeOnly(expiresAt)}`,
      message: `PIN válido até ${formatTimeOnly(expiresAt)}.`,
    };
  }
  return {
    active: false,
    chip: "",
    label: `Expirou às ${formatTimeOnly(expiresAt)}`,
    message: `Este PIN expirou às ${formatTimeOnly(expiresAt)}.`,
  };
}

function getClassAccessWindowLabel(classEntry) {
  return `PIN válido das ${formatTimeOnly(getClassAccessOpensAt(classEntry))} às ${formatTimeOnly(getClassAccessExpiresAt(classEntry))}`;
}

function getClassAccessWindows(workout) {
  return getClassesForDate(workout.date)
    .map((classEntry) => ({
      classEntry,
      opensAt: getClassAccessOpensAt(classEntry),
      expiresAt: getClassAccessExpiresAt(classEntry),
    }))
    .sort((a, b) => a.opensAt - b.opensAt);
}

function getLockedAccessCopy(workout, now = new Date()) {
  if (SHOW_CLASS_FEATURES) {
    return {
      shortLabel: `Abre às ${workout.unlockTime}`,
      longLabel: `Marca uma aula para este dia ou espera pelas ${workout.unlockTime}.`,
    };
  }
  if (SHOW_STAFF_CLASS_TOOLS) {
    const windows = getClassAccessWindows(workout);
    const active = windows.find((item) => now >= item.opensAt && now <= item.expiresAt);
    if (active) {
      return {
        shortLabel: `PIN válido até ${formatTimeOnly(active.expiresAt)}`,
        longLabel: `Pede ao coach o PIN da aula. A janela atual fica válida até ${formatTimeOnly(active.expiresAt)}.`,
      };
    }
    const next = windows.find((item) => now < item.opensAt);
    if (next) {
      return {
        shortLabel: `PIN às ${formatTimeOnly(next.opensAt)}`,
        longLabel: `Pede ao coach o PIN da tua aula. A próxima janela de PIN abre às ${formatTimeOnly(next.opensAt)} e fecha às ${formatTimeOnly(next.expiresAt)}.`,
      };
    }
    if (windows.length) {
      return {
        shortLabel: `Abertura geral às ${workout.unlockTime}`,
        longLabel: `As janelas de PIN deste dia já terminaram. O treino abre automaticamente às ${workout.unlockTime}.`,
      };
    }
  }
  return {
    shortLabel: `Abre às ${workout.unlockTime}`,
    longLabel: `O treino fica visível às ${workout.unlockTime}.`,
  };
}

function getClassAccessOpensAt(classEntry) {
  return new Date(localDateTime(classEntry.date, classEntry.endTime).getTime() - CLASS_CODE_EARLY_MINUTES * 60 * 1000);
}

function getClassAccessExpiresAt(classEntry) {
  return new Date(localDateTime(classEntry.date, classEntry.endTime).getTime() + CLASS_CODE_GRACE_MINUTES * 60 * 1000);
}

function isClassAccessCodeActive(classEntry, now = new Date()) {
  return getClassAccessStatus(classEntry, now).active;
}

function getClassForAccessCode(workout, code) {
  return getClassesForDate(workout.date).find((classEntry) => getClassAccessCode(classEntry) === code) || null;
}

function getMasterPinsForWorkout(workout) {
  return (app.state.masterPins || [])
    .filter((pin) => pin.workoutId === workout.id || pin.date === workout.date)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getMasterPinUserId(pin) {
  return pin.userId || pin.athleteId || "";
}

function getMasterPinForAthleteCode(userId, code) {
  return (app.state.masterPins || []).find(
    (pin) => getMasterPinUserId(pin) === userId && normalizeAccessCode(pin.code) === code
  );
}

function getMasterPinByCode(code) {
  return (app.state.masterPins || []).find((pin) => normalizeAccessCode(pin.code) === code);
}

function getWorkoutForMasterPin(pin) {
  return app.state.workouts.find((workout) => workout.id === pin.workoutId) || getWorkout(pin.date);
}

function getValidMasterPin(workout, userId, code) {
  return (app.state.masterPins || []).find(
    (pin) =>
      !pin.used &&
      getMasterPinUserId(pin) === userId &&
      (pin.workoutId === workout.id || pin.date === workout.date) &&
      normalizeAccessCode(pin.code) === code
  );
}

function getMasterPinForCode(workout, code) {
  return (app.state.masterPins || []).find(
    (pin) =>
      (pin.workoutId === workout.id || pin.date === workout.date) &&
      normalizeAccessCode(pin.code) === code
  );
}

function userHasWorkoutUnlock(userId, workoutId) {
  return (app.state.workoutUnlocks || []).some((item) => item.userId === userId && item.workoutId === workoutId);
}

function buildQrBits(seed) {
  let hash = 0;
  String(seed).split("").forEach((char) => {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  });
  return Array.from({ length: 49 }, (_, index) => {
    const row = Math.floor(index / 7);
    const col = index % 7;
    const corner =
      (row < 2 && col < 2) ||
      (row < 2 && col > 4) ||
      (row > 4 && col < 2);
    return corner || Boolean((hash >> ((index + row + col) % 24)) & 1);
  });
}

function getTodayWorkout() {
  const today = isoDate(new Date());
  return getWorkout(today) || app.state.workouts[0];
}

function getUser(id) {
  return app.state.users.find((user) => user.id === id);
}

function getUserByLoginName(loginName) {
  const normalized = normalizeLoginName(loginName);
  return app.state.users.find((user) => normalizeLoginName(user.loginName || user.id || user.name) === normalized);
}

function isLoginNameTaken(loginName, ignoreUserId = "") {
  const normalized = normalizeLoginName(loginName);
  return app.state.users.some(
    (user) => user.id !== ignoreUserId && normalizeLoginName(user.loginName || user.id || user.name) === normalized
  );
}

function getSessionUser() {
  const user = getUser(app.state.sessionUserId);
  return isUserActive(user) ? user : null;
}

function getCurrentUser() {
  const sessionUser = getSessionUser();
  if (sessionUser) return sessionUser;
  if (app.state.currentRole === "athlete") {
    const currentUser = getUser(app.state.currentUserId);
    return isUserActive(currentUser) && currentUser?.role === "athlete" ? currentUser : getAthletes()[0];
  }
  const currentStaff = getUser(app.state.currentStaffId);
  return isUserActive(currentStaff) && (currentStaff?.role === "coach" || currentStaff?.role === "admin")
    ? currentStaff
    : getStaffUsers()[0] || getUser("coach");
}

function getAthletes() {
  return getAllAthletes().filter(isUserActive);
}

function getStaffUsers() {
  return getAllStaffUsers().filter(isUserActive);
}

function getAllAthletes() {
  return app.state.users.filter((user) => user.role === "athlete");
}

function getAllStaffUsers() {
  return app.state.users.filter((user) => user.role === "coach" || user.role === "admin");
}

function isUserActive(user) {
  return user?.active !== false;
}

function isValidUserRole(role) {
  return ["athlete", "coach", "admin"].includes(role);
}

function wouldLeaveNoActiveAdmin(userId, nextRole, nextActive) {
  return (
    app.state.users.filter((user) => {
      if (user.id === userId) return nextRole === "admin" && nextActive;
      return user.role === "admin" && isUserActive(user);
    }).length < 1
  );
}

function syncSelectedUsersAfterPeopleChange() {
  const currentAthlete = getUser(app.state.currentUserId);
  const currentStaff = getUser(app.state.currentStaffId);
  if (!isUserActive(currentAthlete) || currentAthlete?.role !== "athlete") {
    app.state.currentUserId = getAthletes()[0]?.id || "";
  }
  if (!isUserActive(currentStaff) || (currentStaff?.role !== "coach" && currentStaff?.role !== "admin")) {
    app.state.currentStaffId = getStaffUsers()[0]?.id || "";
  }
  const sessionUser = getUser(app.state.sessionUserId);
  if (app.state.sessionUserId && !isUserActive(sessionUser)) {
    app.state.sessionUserId = "";
    app.state.currentRole = "athlete";
    app.state.activeView = "today";
  } else if (sessionUser) {
    app.state.currentRole = sessionUser.role;
  }
}

function removeUserData(userId) {
  app.state.results = (app.state.results || []).filter((result) => result.userId !== userId);
  app.state.results.forEach((result) => {
    result.comments = normalizeResultComments(result.comments).filter((comment) => comment.userId !== userId);
    const reactionsByMode = normalizeResultReactionModes(result);
    result.reactionsByMode = {
      strength: removeBoostFrom(reactionsByMode.strength, userId),
      metcon: removeBoostFrom(reactionsByMode.metcon, userId),
    };
  });
  app.state.prs = (app.state.prs || []).filter((pr) => pr.userId !== userId);
  app.state.feed = (app.state.feed || [])
    .filter((item) => item.userId !== userId)
    .map((item) => ({ ...item, reactions: removeBoostFrom(item.reactions, userId) }));
  app.state.notifications = normalizeNotifications(app.state.notifications || []).filter(
    (notification) => notification.userId !== userId && notification.actorId !== userId
  );
  (app.state.classes || []).forEach((classEntry) => {
    classEntry.attendees = (classEntry.attendees || []).filter((id) => id !== userId);
    classEntry.present = (classEntry.present || []).filter((id) => id !== userId);
    classEntry.absent = (classEntry.absent || []).filter((id) => id !== userId);
  });
  app.state.workoutUnlocks = (app.state.workoutUnlocks || []).filter((item) => item.userId !== userId);
  app.state.masterPins = (app.state.masterPins || []).filter(
    (pin) => getMasterPinUserId(pin) !== userId && pin.createdBy !== userId && pin.usedBy !== userId
  );
}

function removeBoostFrom(reactions, userId) {
  const normalized = normalizeReactions(reactions);
  return {
    ...normalized,
    boostBy: normalized.boostBy.filter((id) => id !== userId),
  };
}

function roleLabel(role) {
  if (role === "athlete") return "Atleta";
  if (role === "coach") return "Coach";
  if (role === "admin") return "Admin";
  return "Pessoa";
}

function renderGenderOptions(selectedGender) {
  const selected = normalizeGender(selectedGender);
  return genderOptions
    .map((option) => `<option value="${option.value}" ${selected === option.value ? "selected" : ""}>${option.label}</option>`)
    .join("");
}

function genderLabel(gender) {
  return genderOptions.find((option) => option.value === normalizeGender(gender))?.label || "Feminino";
}

function normalizeGender(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "m" || raw === "masculino" || raw === "homem" || raw === "male") return "M";
  return "F";
}

function isValidIsoDate(date) {
  const raw = String(date || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const parsed = new Date(`${raw}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && isoDate(parsed) === raw;
}

function normalizeLoginName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "");
}

function classDeleteKey(date, time) {
  return `${String(date || "").trim()}|${String(time || "").trim()}`;
}

function normalizeDeletedUsers(entries = []) {
  const seen = new Set();
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => ({
      userId: String(entry?.userId || entry?.id || "").trim(),
      deletedAt: String(entry?.deletedAt || "").trim(),
    }))
    .filter((entry) => Boolean(entry.userId))
    .filter((entry) => {
      if (seen.has(entry.userId)) return false;
      seen.add(entry.userId);
      return true;
    });
}

function filterDeletedUsers(users = [], deletedUsers = []) {
  const deletedUserIds = new Set(normalizeDeletedUsers(deletedUsers).map((entry) => entry.userId));
  return (users || []).filter((user) => !deletedUserIds.has(String(user?.id || "")));
}

function normalizeDeletedClasses(entries = []) {
  const seen = new Set();
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => ({
      date: String(entry?.date || "").trim(),
      time: String(entry?.time || "").trim(),
    }))
    .filter((entry) => isValidIsoDate(entry.date) && isValidTimeOfDay(entry.time))
    .filter((entry) => {
      const key = classDeleteKey(entry.date, entry.time);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function isClassDeletedForDate(date, time) {
  const key = classDeleteKey(date, time);
  return normalizeDeletedClasses(app.state?.deletedClasses || []).some((entry) => classDeleteKey(entry.date, entry.time) === key);
}

function markClassDeletedForDate(date, time) {
  const normalized = normalizeDeletedClasses(app.state.deletedClasses || []);
  if (!normalized.some((entry) => entry.date === date && entry.time === time)) {
    normalized.push({ date, time });
  }
  app.state.deletedClasses = normalized;
}

function clearDeletedClassMarker(date, time) {
  const key = classDeleteKey(date, time);
  app.state.deletedClasses = normalizeDeletedClasses(app.state.deletedClasses || []).filter(
    (entry) => classDeleteKey(entry.date, entry.time) !== key
  );
}

function classExists(date, time) {
  return app.state.classes.some(
    (classEntry) => classEntry.date === date && classEntry.time === time && !isClassDeletedForDate(date, time)
  );
}

function getFutureSameWeekdayDates(date) {
  const weekday = getWeekdayNumber(date);
  return [
    ...new Set(
      app.state.workouts
        .map((workout) => workout.date)
        .filter((workoutDate) => workoutDate > date && getWeekdayNumber(workoutDate) === weekday)
    ),
  ].sort();
}

function getClassScheduleForDate(date) {
  const weekday = getWeekdayNumber(date);
  const targetDate = new Date(`${date}T12:00:00`);
  const schedule = new Map();
  [...(app.state?.classes || [])]
    .filter(
      (classEntry) =>
        classEntry.date !== date &&
        classEntry.recurring !== false &&
        getWeekdayNumber(classEntry.date) === weekday
    )
    .sort((a, b) => {
      const distanceA = Math.abs(new Date(`${a.date}T12:00:00`) - targetDate);
      const distanceB = Math.abs(new Date(`${b.date}T12:00:00`) - targetDate);
      if (distanceA !== distanceB) return distanceA - distanceB;
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.time.localeCompare(b.time);
    })
    .forEach((classEntry) => {
      if (!schedule.has(classEntry.time)) {
        schedule.set(classEntry.time, {
          time: classEntry.time,
          duration: getClassDuration(classEntry),
        });
      }
    });
  return [...schedule.values()].sort((a, b) => a.time.localeCompare(b.time));
}

function getClassDuration(classEntry) {
  const duration = Number(classEntry.duration);
  if (Number.isFinite(duration) && duration > 0) return duration;
  if (classEntry.time && classEntry.endTime) {
    const start = localDateTime("2026-01-01", classEntry.time);
    const end = localDateTime("2026-01-01", classEntry.endTime);
    const minutes = Math.round((end - start) / (1000 * 60));
    if (minutes > 0) return minutes;
  }
  return 60;
}

function getWeekdayNumber(date) {
  return new Date(`${date}T12:00:00`).getDay();
}

function canManage() {
  const sessionUser = getSessionUser();
  return sessionUser?.role === "coach" || sessionUser?.role === "admin";
}

function canAdmin() {
  return getSessionUser()?.role === "admin";
}

function getClassesForDate(date) {
  return app.state.classes
    .filter((item) => item.date === date && !isClassDeletedForDate(item.date, item.time))
    .sort((a, b) => a.time.localeCompare(b.time));
}

function areAllWorkoutClassesEnded(workout) {
  if (!workout) return false;
  const classes = getClassesForDate(workout.date);
  return classes.length > 0 && classes.every((classEntry) => classEntry.ended);
}

function getBookedClass(date, userId) {
  return getClassesForDate(date).find((item) => (item.attendees || []).includes(userId)) || null;
}

function getAthleteClass(date, user) {
  if (!user || user.role !== "athlete") return null;
  const classes = getClassesForDate(date);
  const attendedClass = classes.find((item) => (item.present || []).includes(user.id));
  if (attendedClass) return attendedClass;
  return getBookedClass(date, user.id);
}

function getBookingStatus(classEntry, userId) {
  const attendees = classEntry.attendees || [];
  const present = classEntry.present || [];
  const absent = classEntry.absent || [];
  const isBooked = attendees.includes(userId);
  const isPresent = present.includes(userId);
  const isAbsent = absent.includes(userId);
  const now = new Date();
  const startAt = localDateTime(classEntry.date, classEntry.time);
  const endAt = localDateTime(classEntry.date, classEntry.endTime);
  const opensAt = new Date(startAt.getTime() - BOOKING_WINDOW_HOURS * 60 * 60 * 1000);

  if (isPresent) {
    return {
      label: classEntry.ended || now >= endAt ? "Presença marcada · aula terminada" : "Presença marcada",
      canBook: false,
      canCancel: false,
      toast: "A presença já foi marcada pelo coach.",
    };
  }
  if (isAbsent) {
    return {
      label: "Falta marcada pelo coach",
      canBook: false,
      canCancel: false,
      toast: "A falta já foi marcada pelo coach.",
    };
  }
  if (classEntry.ended || now >= endAt) {
    return { label: "Aula terminada", canBook: false, canCancel: false, toast: "Esta aula já terminou." };
  }
  if (now >= startAt) {
    return { label: "Aula já começou", canBook: false, canCancel: false, toast: "A aula já começou." };
  }
  if (now < opensAt) {
    return {
      label: `Reserva abre ${formatDateTimeShort(opensAt)}`,
      canBook: false,
      canCancel: false,
      toast: `A reserva só abre ${BOOKING_WINDOW_HOURS}h antes da aula.`,
    };
  }
  if (isBooked) {
    return { label: "Reservada · podes cancelar antes do início", canBook: false, canCancel: true };
  }
  return { label: "Disponível para reserva", canBook: true, canCancel: false };
}

function scoreValue(score, type) {
  if (type === "time") return parseTimeScore(score);
  if (type === "rounds") return parseRoundsScore(score);
  if (type === "complete") return 1;
  const value = Number(String(score).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function parseTimeScore(score) {
  const normalized = normalizeTimeScore(score);
  if (!normalized) return 999999;
  const [minutes, seconds] = normalized.split(":").map(Number);
  return minutes * 60 + seconds;
}

function secondsToTime(value) {
  const total = Number(value);
  if (!Number.isFinite(total)) return "";
  const minutes = Math.floor(total / 60);
  const seconds = Math.round(total % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function parseRoundsScore(score) {
  const raw = String(score).trim().replace(",", ".");
  if (raw.includes("+")) {
    const [rounds, reps] = raw.split("+").map((part) => Number(part));
    return (Number.isFinite(rounds) ? rounds : 0) * 1000 + (Number.isFinite(reps) ? reps : 0);
  }
  const value = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function valueOf(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function isChecked(id) {
  return Boolean(document.getElementById(id)?.checked);
}

function uniqueId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniqueAthleteId(name) {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "atleta";
  let id = base;
  let count = 2;
  while (app.state.users.some((user) => user.id === id)) {
    id = `${base}-${count}`;
    count += 1;
  }
  return id;
}

function startOfWeek(date) {
  const clone = new Date(date);
  const day = (clone.getDay() + 6) % 7;
  clone.setDate(clone.getDate() - day);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function addDays(date, days) {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + days);
  return clone;
}

function isoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

function isValidTimeOfDay(time) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(time || "").trim());
}

function addMinutesToTime(time, minutes) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(2026, 0, 1, hour, minute + minutes, 0);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function daysBetween(leftDate, rightDate) {
  const left = new Date(`${leftDate}T00:00:00`);
  const right = new Date(`${rightDate}T00:00:00`);
  return Math.abs(Math.round((right - left) / (1000 * 60 * 60 * 24)));
}

function isWeekendDate(date) {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

function formatDateLong(date) {
  return new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function formatDateShort(date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${date}T12:00:00`));
}

function formatDateTimeShort(date) {
  return `${formatDateShort(isoDate(date))} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatTimeOnly(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function compactFeedText(text) {
  return text.length > 28 ? `${text.slice(0, 25)}...` : text;
}

function domSafeId(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toast(message, durationMs = 2400) {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), durationMs);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
