"use strict";

const TV_CONFIG = (typeof window !== "undefined" && window.HPBOX_CONFIG) || {};
const TV_STORAGE_KEY = TV_CONFIG.storageKey || "hpbox-pilot-v1";
const TV_CACHE_STORAGE_KEY = `${TV_STORAGE_KEY}-tv-cache`;
const TV_HYROX_CACHE_KEY = `${TV_STORAGE_KEY}-tv-hyrox-cache`;
const TV_LEGACY_STORAGE_KEYS = ["box-board-prototype-v1"];
const TV_REFRESH_SECONDS = getRefreshSeconds();
const TV_CLASS_CODE_EARLY_MINUTES = 15;
const TV_CLASS_CODE_GRACE_MINUTES = 10;
const TV_SCORE_TYPES = {
  time: "Tempo",
  reps: "Reps",
  load: "Carga",
  complex: "Complexo",
  quality: "Qualidade",
  rounds: "Rounds + reps",
  complete: "Completed",
};
const TV_PR_TYPES = {
  load: "Carga",
  one_rm: "1RM",
  three_rm: "3RM",
  five_rm: "5RM",
  max_reps: "Máximo reps",
  benchmark_time: "Tempo",
  benchmark_score: "Score",
};

const tv = {
  state: null,
  updatedAt: "",
  source: "local",
  lastGoodState: null,
  els: {},
  refreshTimer: null,
  clockTimer: null,
  hyroxFitTimer: null,
};

document.addEventListener("DOMContentLoaded", () => {
  tv.els = {
    title: document.getElementById("tvTitle"),
    date: document.getElementById("tvDate"),
    clock: document.getElementById("tvClock"),
    status: document.getElementById("tvStatus"),
    workoutName: document.getElementById("workoutName"),
    workoutTags: document.getElementById("workoutTags"),
    workoutSections: document.getElementById("workoutSections"),
    classPin: document.getElementById("classPinPanel"),
    topResults: document.getElementById("topResults"),
    activityFeed: document.getElementById("activityFeed"),
    commentFeed: document.getElementById("commentFeed"),
    lastUpdated: document.getElementById("lastUpdated"),
    dayStrip: document.getElementById("tvDayStrip"),
  };
  applyVisualAssets();
  bindDayStrip();
  startClock();
  loadAndRender();
  tv.refreshTimer = window.setInterval(loadAndRender, TV_REFRESH_SECONDS * 1000);
});

function getRefreshSeconds() {
  const params = new URLSearchParams(window.location.search);
  const requested = Number(params.get("refresh") || "30");
  if (!Number.isFinite(requested)) return 30;
  return Math.min(Math.max(Math.round(requested), 15), 300);
}

function applyVisualAssets() {
  const assets = TV_CONFIG.visualAssets || {};
  const pairs = {
    "--hpbox-training-background-image": assets.background || "assets/training-bg-clean.png",
    "--hpbox-warmup-header-image": assets.warmupHeader || "assets/training-warm-up-header-clean.png",
    "--hpbox-strength-header-image": assets.strengthHeader || "assets/training-strength-header-clean.png",
    "--hpbox-wod-header-image": assets.wodHeader || "assets/training-wod-header-clean.png",
  };
  Object.entries(pairs).forEach(([key, value]) => {
    if (/^assets\/[A-Za-z0-9._/-]+\.png(?:\?v=[A-Za-z0-9._-]+)?$/i.test(String(value))) {
      document.documentElement.style.setProperty(key, `url("${value}")`);
    }
  });
  const filter = String(assets.warmupFilter || "none").trim();
  document.documentElement.style.setProperty(
    "--hpbox-warmup-filter",
    filter === "hue-rotate(88deg) saturate(1.12)" ? filter : "none"
  );
}

function bindDayStrip() {
  if (!tv.els.dayStrip) return;
  tv.els.dayStrip.addEventListener("click", (event) => {
    const button = event.target.closest("[data-date]");
    if (!button) return;
    setSelectedDate(button.dataset.date);
  });
}

function startClock() {
  updateClock();
  tv.clockTimer = window.setInterval(updateClock, 1000);
}

function updateClock() {
  if (!tv.els.clock) return;
  tv.els.clock.textContent = new Date().toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (tv.state) renderLiveClassPin(getDisplayContext(getSelectedDate()).workout);
}

async function loadAndRender() {
  setStatus("A atualizar");
  try {
    const loaded = await loadTvState();
    rememberTvSnapshot(loaded.state, loaded.updatedAt || new Date().toISOString(), loaded.source || "local");
    tv.state = normalizePublicState(loaded.state);
    tv.lastGoodState = tv.state;
    tv.updatedAt = loaded.updatedAt || new Date().toISOString();
    tv.source = loaded.source || "local";
    document.body.classList.remove("tv-error", "tv-stale");
    renderTv();
    setStatus(tv.source === "online" ? "Online" : "Local");
  } catch (error) {
    // Não trocar para um estado local vazio quando a ligação falha a meio da aula.
    // Mantém o último treino bom no ecrã para o HYROX não desaparecer no refresh automático.
    if (tv.state || tv.lastGoodState) {
      tv.state = tv.state || tv.lastGoodState;
      document.body.classList.add("tv-stale");
      document.body.classList.remove("tv-error");
      renderTv();
      setStatus("Ligação instável · último treino");
      return;
    }

    document.body.classList.add("tv-error");
    setStatus("Erro / cache");
    const local = loadLocalState();
    if (local.state) {
      tv.state = normalizePublicState(local.state);
      tv.lastGoodState = tv.state;
      tv.updatedAt = local.updatedAt || "";
      tv.source = local.source || "cache";
      renderTv();
    } else {
      renderError(error);
    }
  }
}

async function loadTvState() {
  if (shouldUseSupabase() && window.supabase?.createClient) {
    const client = window.supabase.createClient(TV_CONFIG.supabaseUrl, TV_CONFIG.supabaseAnonKey);
    const table = TV_CONFIG.onlineStateTable || "hpbox_pilot_state";
    const id = TV_CONFIG.onlineStateId || "hpbox-pilot";
    const { data, error } = await withTimeout(
      client.from(table).select("payload, updated_at").eq("id", id).maybeSingle(),
      12000
    );
    if (error) throw error;
    if (data?.payload) return { state: data.payload, updatedAt: data.updated_at, source: "online" };
  }
  const local = loadLocalState();
  if (local.state) return local;
  throw new Error("Sem dados disponíveis para mostrar na TV.");
}

function shouldUseSupabase() {
  return TV_CONFIG.dataMode === "supabase" && Boolean(TV_CONFIG.supabaseUrl && TV_CONFIG.supabaseAnonKey);
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Tempo limite ao carregar dados.")), ms);
    Promise.resolve(promise)
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function loadLocalState() {
  const keys = [TV_CACHE_STORAGE_KEY, TV_STORAGE_KEY, ...TV_LEGACY_STORAGE_KEYS];
  for (const key of keys) {
    try {
      const raw = window.localStorage?.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const state = parsed?.state && Array.isArray(parsed.state.workouts) ? parsed.state : parsed;
      if (state && Array.isArray(state.workouts)) {
        return {
          state,
          updatedAt: parsed?.updatedAt || state.updatedAt || "",
          source: key === TV_CACHE_STORAGE_KEY ? "cache" : "local",
        };
      }
    } catch {
      // Ignora dados locais estragados.
    }
  }
  return { state: null, updatedAt: "", source: "local" };
}

function rememberTvSnapshot(state, updatedAt = "", source = "") {
  if (!state || !Array.isArray(state.workouts)) return;
  try {
    window.localStorage?.setItem(TV_CACHE_STORAGE_KEY, JSON.stringify({ state, updatedAt, source }));
  } catch {
    // Se a TV não deixar guardar cache, continua a mostrar normalmente.
  }

  const hyroxWorkouts = Array.isArray(state.hyroxWorkouts) ? state.hyroxWorkouts.filter((workout) => {
    const blocks = normalizeHyroxBlocks(workout?.blocks || []).filter((block) => !isCoachNotesBlock(block));
    return workout?.date && blocks.length;
  }) : [];
  if (!hyroxWorkouts.length) return;
  try {
    window.localStorage?.setItem(TV_HYROX_CACHE_KEY, JSON.stringify({ hyroxWorkouts, updatedAt }));
  } catch {
    // Cache HYROX é só proteção extra.
  }
}

function loadCachedHyroxWorkouts() {
  try {
    const raw = window.localStorage?.getItem(TV_HYROX_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed?.hyroxWorkouts) ? parsed.hyroxWorkouts : [];
    return list.map((workout) => ({
      id: String(workout?.id || workout?.date || ""),
      date: String(workout?.date || ""),
      title: String(workout?.title || "HYROX Session"),
      blocks: normalizeHyroxBlocks(workout?.blocks || []),
    })).filter((workout) => workout.date);
  } catch {
    return [];
  }
}

function mergeHyroxWithCache(hyroxWorkouts = []) {
  const cached = loadCachedHyroxWorkouts();
  if (!cached.length) return hyroxWorkouts;
  const byDate = new Map(cached.map((workout) => [workout.date, workout]));
  hyroxWorkouts.forEach((workout) => {
    const publicBlocks = normalizeHyroxBlocks(workout?.blocks || []).filter((block) => !isCoachNotesBlock(block));
    if (workout?.date && publicBlocks.length) byDate.set(workout.date, workout);
  });
  return Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function normalizePublicState(state) {
  const users = (state?.users || []).map((user) => ({
    id: String(user?.id || ""),
    name: String(user?.name || "Atleta").trim() || "Atleta",
    role: String(user?.role || "athlete"),
    gender: String(user?.gender || ""),
    active: user?.active !== false,
  }));
  const normalizedHyroxWorkouts = Array.isArray(state?.hyroxWorkouts)
    ? state.hyroxWorkouts.map((workout) => ({
        id: String(workout?.id || workout?.date || ""),
        date: String(workout?.date || ""),
        title: String(workout?.title || "HYROX Session"),
        blocks: normalizeHyroxBlocks(workout?.blocks || []),
      }))
    : [];
  return {
    users,
    workouts: Array.isArray(state?.workouts) ? state.workouts : [],
    results: Array.isArray(state?.results) ? state.results : [],
    feed: Array.isArray(state?.feed) ? state.feed : [],
    prs: Array.isArray(state?.prs) ? state.prs : [],
    hyroxWorkouts: mergeHyroxWithCache(normalizedHyroxWorkouts),
    classes: Array.isArray(state?.classes)
      ? state.classes.map((classEntry) => ({
          id: String(classEntry?.id || ""),
          date: String(classEntry?.date || ""),
          time: String(classEntry?.time || ""),
          endTime: String(classEntry?.endTime || ""),
          duration: Number(classEntry?.duration || 60),
          classType: normalizeClassType(classEntry?.classType || classEntry?.type || classEntry?.kind),
          accessCode: String(classEntry?.accessCode || ""),
          ended: Boolean(classEntry?.ended),
        }))
      : [],
  };
}

function renderTv() {
  const date = getSelectedDate();
  const context = getDisplayContext(date);
  const { workout, hyroxWorkout, activeClass, mode } = context;
  const isHyrox = mode === "hyrox";
  document.body.classList.toggle("tv-hyrox-mode", isHyrox);
  tv.els.title.textContent = isHyrox ? "HYROX" : "Treino de hoje";
  tv.els.date.textContent = activeClass
    ? `${formatDateLong(date)} · ${activeClass.time}-${activeClass.endTime}`
    : formatDateLong(date);
  renderDayStrip(date);
  tv.els.lastUpdated.textContent = `Última atualização: ${formatDateTime(tv.updatedAt || new Date().toISOString())}`;

  if (isHyrox) {
    renderHyroxTv(hyroxWorkout, activeClass, date);
    renderLiveClassPin(workout);
    renderHyroxCommunity();
    scheduleHyroxLayoutFit();
    return;
  }
  clearHyroxLayoutFit();

  if (!workout) {
    tv.els.workoutName.textContent = "Sem treino programado";
    tv.els.workoutName.classList.remove("is-hidden");
    tv.els.workoutTags.innerHTML = "";
    tv.els.workoutSections.innerHTML = `<article class="empty-tv-card">Ainda não há treino para ${escapeHtml(formatDateShort(date))}.</article>`;
    renderLiveClassPin(null);
    renderCommunity(null);
    return;
  }

  const blocks = normalizeWorkoutBlocks(workout);
  const workoutTitle = String(workout.title || "").trim();
  const showWorkoutTitle = workoutTitle && !/^treino$/i.test(workoutTitle);
  tv.els.workoutName.textContent = showWorkoutTitle ? workoutTitle : "";
  tv.els.workoutName.classList.toggle("is-hidden", !showWorkoutTitle);
  tv.els.workoutTags.innerHTML = renderTags([
    activeClass ? `Aula: ${activeClass.time}-${activeClass.endTime}` : "Cross",
    workout.movement,
    `Força: ${TV_SCORE_TYPES[workout.strengthScoreType || "load"] || "Carga"}`,
    `WOD: ${TV_SCORE_TYPES[workout.scoreType || "time"] || "Score"}`,
  ]);
  const hasWarmup = hasProgrammedWarmup(blocks.warmup);
  const hasStrength = hasProgrammedStrength(blocks.strength);
  tv.els.workoutSections.className = "workout-sections";
  tv.els.workoutSections.classList.toggle("no-warmup", !hasWarmup);
  tv.els.workoutSections.classList.toggle("no-strength", !hasStrength);
  tv.els.workoutSections.innerHTML = `
    ${hasWarmup ? renderBlock("warmup", "Warm Up", blocks.warmup) : ""}
    ${hasStrength ? renderBlock("strength", "Strength", blocks.strength) : ""}
    ${renderBlock("wod", "WOD", blocks.metcon || "Sem WOD programado.")}
  `;
  renderLiveClassPin(workout);
  renderCommunity(workout);
}

function getDisplayContext(date) {
  const workout = getWorkoutForDate(date);
  const activeClass = getActiveClassForTv(date);
  const forcedMode = getForcedMode();
  const mode = forcedMode || normalizeClassType(activeClass?.classType || "cross");
  return {
    workout,
    hyroxWorkout: getHyroxWorkoutForDate(date),
    activeClass,
    mode,
  };
}

function getForcedMode() {
  const params = new URLSearchParams(window.location.search);
  const mode = normalizeClassType(params.get("mode") || params.get("tipo") || "");
  return params.has("mode") || params.has("tipo") ? mode : "";
}

function renderHyroxTv(hyroxWorkout, activeClass, date) {
  const workout = hyroxWorkout || createFallbackHyroxWorkout(date);
  const publicBlocks = normalizeHyroxBlocks(workout.blocks).filter((block) => !isCoachNotesBlock(block));
  const title = String(workout.title || "HYROX Session").trim();
  tv.els.workoutName.textContent = title;
  tv.els.workoutName.classList.remove("is-hidden");
  tv.els.workoutTags.innerHTML = renderTags([
    "HYROX",
    activeClass ? `${activeClass.time}-${activeClass.endTime}` : "Sem aula ativa",
    `${publicBlocks.length} blocos`,
  ]);
  const countClass = publicBlocks.length ? ` hyrox-count-${Math.min(publicBlocks.length, 6)}` : "";
  tv.els.workoutSections.className = `workout-sections hyrox-sections${countClass}`;
  tv.els.workoutSections.innerHTML = publicBlocks.length
    ? publicBlocks.map(renderHyroxBlock).join("")
    : `<article class="empty-tv-card">Ainda não há programação HYROX pública para ${escapeHtml(formatDateShort(date))}.</article>`;
}

function renderHyroxCommunity() {
  tv.els.topResults.innerHTML = emptySmall("Sem ranking em aulas HYROX.");
  tv.els.activityFeed.innerHTML = emptySmall("TV em modo HYROX.");
  if (tv.els.commentFeed) tv.els.commentFeed.innerHTML = "";
}

function renderHyroxBlock(block) {
  const title = block.title || getHyroxBlockTypeLabel(block.type);
  const duration = String(block.duration || "").trim();
  const body = cleanBlockText(block.content || "");
  const lines = body ? body.split("\n").filter((line) => line.trim()).length : 0;
  const words = body ? body.split(/\s+/).filter(Boolean).length : 0;
  const densityClass = lines >= 12 || words >= 55 || body.length >= 320 ? " hyrox-extra-long" : lines >= 8 || words >= 38 || body.length >= 220 ? " hyrox-long" : "";
  return `
    <article class="block-card hyrox-block hyrox-${escapeAttr(normalizeHyroxBlockType(block.type))}${densityClass}">
      <div class="block-head hyrox-block-head">
        <div>
          <span>${escapeHtml(getHyroxBlockTypeLabel(block.type))}</span>
          <h3>${escapeHtml(title)}</h3>
        </div>
        ${duration ? `<strong>${escapeHtml(duration)}</strong>` : ""}
      </div>
      <div class="block-body hyrox-block-body"><pre>${escapeHtml(body || "Sem conteúdo programado.")}</pre></div>
    </article>
  `;
}

function scheduleHyroxLayoutFit() {
  clearHyroxLayoutFit();
  tv.hyroxFitTimer = window.setTimeout(fitHyroxLayout, 80);
}

function clearHyroxLayoutFit() {
  if (tv.hyroxFitTimer) window.clearTimeout(tv.hyroxFitTimer);
  tv.hyroxFitTimer = null;
}

function fitHyroxLayout() {
  const sections = tv.els.workoutSections;
  if (!sections || !document.body.classList.contains("tv-hyrox-mode")) return;
  sections.classList.remove("hyrox-fit-tight", "hyrox-fit-ultra", "hyrox-scroll-fallback", "hyrox-block-scroll-fallback");
  sections.style.removeProperty("--hyrox-body-font");
  sections.style.removeProperty("--hyrox-title-font");
  sections.style.removeProperty("--hyrox-label-font");
  sections.style.removeProperty("--hyrox-duration-font");
  sections.style.removeProperty("--hyrox-body-pad");
  sections.style.removeProperty("--hyrox-head-pad");
  sections.style.removeProperty("--hyrox-line-height");

  const firstPre = sections.querySelector(".hyrox-block-body pre");
  const firstTitle = sections.querySelector(".hyrox-block-head h3");
  const firstLabel = sections.querySelector(".hyrox-block-head span");
  const firstDuration = sections.querySelector(".hyrox-block-head strong");
  if (!firstPre) return;

  const baseBodyFont = parseFloat(window.getComputedStyle(firstPre).fontSize) || 28;
  const baseTitleFont = firstTitle ? parseFloat(window.getComputedStyle(firstTitle).fontSize) || 34 : 34;
  const baseLabelFont = firstLabel ? parseFloat(window.getComputedStyle(firstLabel).fontSize) || 15 : 15;
  const baseDurationFont = firstDuration ? parseFloat(window.getComputedStyle(firstDuration).fontSize) || 18 : 18;

  const setScale = (scale) => {
    sections.style.setProperty("--hyrox-body-font", `${Math.max(13, Math.round(baseBodyFont * scale))}px`);
    sections.style.setProperty("--hyrox-title-font", `${Math.max(17, Math.round(baseTitleFont * scale))}px`);
    sections.style.setProperty("--hyrox-label-font", `${Math.max(9, Math.round(baseLabelFont * scale))}px`);
    sections.style.setProperty("--hyrox-duration-font", `${Math.max(10, Math.round(baseDurationFont * scale))}px`);
    sections.style.setProperty("--hyrox-body-pad", `${Math.max(7, Math.round(18 * scale))}px`);
    sections.style.setProperty("--hyrox-head-pad", `${Math.max(7, Math.round(16 * scale))}px`);
    sections.style.setProperty("--hyrox-line-height", scale < 0.82 ? "0.99" : "1.04");
  };

  const isSectionOverflowing = () => sections.scrollHeight > sections.clientHeight + 6 || sections.scrollWidth > sections.clientWidth + 6;
  const isBlockOverflowing = () => Array.from(sections.querySelectorAll(".hyrox-block-body")).some((body) => {
    const pre = body.querySelector("pre");
    if (!pre) return false;
    return pre.scrollHeight > body.clientHeight + 6 || pre.scrollWidth > body.clientWidth + 6;
  });
  const isOverflowing = () => isSectionOverflowing() || isBlockOverflowing();

  if (!isOverflowing()) return;
  sections.classList.add("hyrox-fit-tight");

  let scale = 0.94;
  for (let i = 0; i < 10 && isOverflowing(); i += 1) {
    setScale(scale);
    scale -= 0.07;
    if (scale < 0.50) break;
  }

  if (isOverflowing()) {
    sections.classList.add("hyrox-fit-ultra");
    setScale(0.48);
  }

  if (isSectionOverflowing()) {
    sections.classList.add("hyrox-scroll-fallback");
  }

  if (isBlockOverflowing()) {
    sections.classList.add("hyrox-block-scroll-fallback");
  }
}

function renderLiveClassPin(workout) {
  if (!tv.els.classPin) return;
  const selectedDate = workout?.date || getSelectedDate();
  const today = isoDate(new Date());
  if (selectedDate !== today) {
    tv.els.classPin.classList.add("is-hidden");
    tv.els.classPin.innerHTML = "";
    return;
  }

  const classEntry = getClassPinToShowForTv(selectedDate);

  if (!classEntry) {
    tv.els.classPin.classList.add("is-hidden");
    tv.els.classPin.innerHTML = "";
    return;
  }

  const code = getClassAccessCode(classEntry);
  const status = getClassPinStatusForTv(classEntry);
  tv.els.classPin.classList.remove("is-hidden", "is-expired", "is-waiting", "is-ended");
  if (status.tone) tv.els.classPin.classList.add(status.tone);
  tv.els.classPin.innerHTML = `
    <div class="class-pin-heading">
      <span class="tv-kicker">PIN da aula</span>
      <strong>${escapeHtml(classEntry.time)}-${escapeHtml(classEntry.endTime)}</strong>
    </div>
    <div class="class-pin-code">${escapeHtml(code)}</div>
    <div class="class-pin-meta">${escapeHtml(status.label)}</div>
  `;
}

function getActiveClassForTv(date, now = new Date()) {
  const today = isoDate(now);
  if (date !== today) return null;
  const classes = getClassesForDate(date).sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
  return classes.find((classEntry) => !classEntry.ended && now >= localDateTime(classEntry.date, classEntry.time) && now < localDateTime(classEntry.date, classEntry.endTime)) || null;
}

function getClassPinToShowForTv(date, now = new Date()) {
  const classes = getClassesForDate(date).sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
  if (!classes.length) return null;
  return classes.find((classEntry) => !classEntry.ended && isClassPinActive(classEntry, now)) || null;
}

function getClassPinStatusForTv(classEntry, now = new Date()) {
  const opensAt = getClassAccessOpensAt(classEntry);
  const expiresAt = getClassAccessExpiresAt(classEntry);
  if (classEntry.ended) return { label: "Aula terminada", tone: "is-ended" };
  if (now < opensAt) return { label: `Válido às ${formatTimeOnly(opensAt)}`, tone: "is-waiting" };
  if (now <= expiresAt) return { label: `Válido até ${formatTimeOnly(expiresAt)}`, tone: "" };
  return { label: `Expirado às ${formatTimeOnly(expiresAt)}`, tone: "is-expired" };
}

function renderCommunity(workout) {
  tv.els.topResults.innerHTML = renderTopResults(workout);
  tv.els.activityFeed.innerHTML = renderActivityFeed(workout);
  if (tv.els.commentFeed) tv.els.commentFeed.innerHTML = renderCommentFeed(workout);
}

function getClassesForDate(date) {
  return (tv.state?.classes || []).filter((classEntry) => classEntry.date === date && classEntry.time && classEntry.endTime);
}

function getClassAccessOpensAt(classEntry) {
  return new Date(localDateTime(classEntry.date, classEntry.endTime).getTime() - TV_CLASS_CODE_EARLY_MINUTES * 60 * 1000);
}

function getClassAccessExpiresAt(classEntry) {
  return new Date(localDateTime(classEntry.date, classEntry.endTime).getTime() + TV_CLASS_CODE_GRACE_MINUTES * 60 * 1000);
}

function isClassPinActive(classEntry, now = new Date()) {
  return now >= getClassAccessOpensAt(classEntry) && now <= getClassAccessExpiresAt(classEntry);
}

function getClassAccessCode(classEntry) {
  return normalizeAccessCode(classEntry.accessCode || createClassAccessCode(classEntry));
}

function createClassAccessCode(classEntry) {
  const seed = `${classEntry.date || ""}-${classEntry.time || ""}-${classEntry.endTime || ""}-${classEntry.id || ""}`;
  let hash = 23;
  String(seed).split("").forEach((char) => {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  });
  return String((hash % 9000) + 1000);
}

function normalizeAccessCode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function localDateTime(date, time) {
  return new Date(`${date}T${time || "00:00"}:00`);
}

function renderBlock(kind, title, text) {
  const cleaned = cleanBlockText(text);
  const twoColumn =
    (kind === "strength" && shouldSplitStrengthText(cleaned)) ||
    (kind === "wod" && shouldSplitWodText(cleaned));
  const body = twoColumn ? renderTwoColumnText(cleaned) : `<pre>${escapeHtml(cleaned)}</pre>`;
  return `
    <article class="block-card ${escapeAttr(kind)}${twoColumn ? " is-two-column" : ""}">
      <div class="block-head"><h3>${escapeHtml(title)}</h3></div>
      <div class="block-body">${body}</div>
    </article>
  `;
}

function hasProgrammedWarmup(text) {
  const cleaned = cleanBlockText(text);
  if (!cleaned) return false;
  const normalized = cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return !(
    /^sem\s+warm[-\s]?up\s+programado\.?$/.test(normalized) ||
    /^adicionar\s+warm[-\s]?up\.?$/.test(normalized) ||
    /^adicionar\s+aquecimento\.?$/.test(normalized)
  );
}

function hasProgrammedStrength(text) {
  const cleaned = cleanBlockText(text);
  if (!cleaned) return false;
  const normalized = cleaned
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return !(
    /^sem\s+forca\.?$/.test(normalized) ||
    /^sem\s+strength\.?$/.test(normalized) ||
    /^sem\s+skill\.?$/.test(normalized) ||
    /^sem\s+forca\s*\/\s*skill\.?$/.test(normalized) ||
    /^sem\s+forca\s*\/\s*skill\s+programado\.?$/.test(normalized) ||
    /^sem\s+forca\s+programad[oa]\.?$/.test(normalized) ||
    /^sem\s+strength\s+programad[oa]\.?$/.test(normalized) ||
    /^sem\s+skill\s+programad[oa]\.?$/.test(normalized) ||
    /^adicionar\s+forca\s*\/\s*skill\.?$/.test(normalized) ||
    /^adicionar\s+forca\.?$/.test(normalized) ||
    /^adicionar\s+strength\.?$/.test(normalized) ||
    /^adicionar\s+skill\.?$/.test(normalized)
  );
}

function shouldSplitStrengthText(text) {
  const cleaned = cleanBlockText(text);
  if (!cleaned) return false;
  const lines = cleaned.split("\n").filter((line) => line.trim());
  return lines.length >= 12 || cleaned.length >= 420;
}

function shouldSplitWodText(text) {
  const cleaned = cleanBlockText(text);
  if (!cleaned) return false;
  const lines = cleaned.split("\n").filter((line) => line.trim());
  return lines.length >= 10 || cleaned.length >= 340;
}

function renderTwoColumnText(text) {
  const [left, right] = splitTextForColumns(text);
  return `
    <div class="block-text-columns">
      <pre>${escapeHtml(left)}</pre>
      <pre>${escapeHtml(right)}</pre>
    </div>
  `;
}

function splitTextForColumns(text) {
  const lines = cleanBlockText(text).split("\n");
  if (lines.length < 2) return [cleanBlockText(text), ""];

  const weights = lines.map((line) => Math.max(1, Math.ceil(line.length / 34)));
  const total = weights.reduce((sum, value) => sum + value, 0);
  const target = total / 2;
  let acc = 0;
  let rawIndex = Math.floor(lines.length / 2);

  for (let index = 0; index < weights.length; index += 1) {
    acc += weights[index];
    if (acc >= target) {
      rawIndex = index + 1;
      break;
    }
  }

  const minIndex = Math.max(1, Math.floor(lines.length * 0.28));
  const maxIndex = Math.min(lines.length - 1, Math.ceil(lines.length * 0.72));
  let splitIndex = Math.min(Math.max(rawIndex, minIndex), maxIndex);

  const searchStart = Math.max(minIndex, splitIndex - 4);
  const searchEnd = Math.min(maxIndex, splitIndex + 4);
  let bestBlankIndex = -1;
  for (let index = searchStart; index <= searchEnd; index += 1) {
    if (lines[index] && lines[index].trim()) continue;
    if (bestBlankIndex === -1 || Math.abs(index - splitIndex) < Math.abs(bestBlankIndex - splitIndex)) {
      bestBlankIndex = index;
    }
  }
  if (bestBlankIndex > 0) splitIndex = bestBlankIndex + 1;

  return [lines.slice(0, splitIndex).join("\n").trim(), lines.slice(splitIndex).join("\n").trim()];
}

function renderTags(tags) {
  return tags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((tag) => `<span class="tv-tag">${escapeHtml(tag)}</span>`)
    .join("");
}

function renderTopResults(workout) {
  if (!workout) return emptySmall("Sem WOD selecionado.");
  const rows = getResultsForWorkout(workout)
    .map((result) => ({ ...result, __tvWodScore: getTvWodScore(result, workout) }))
    .filter((result) => result.__tvWodScore)
    .sort((a, b) => compareResults(a, b, workout))
    .slice(0, 3);

  if (!rows.length) return emptySmall("Ainda sem resultados de WOD.");

  return rows
    .map((result, index) => {
      const value = result.__tvWodScore || "--";
      const name = isTeamResult(result) ? formatTeamResultName(result, { compact: true }) : getUser(result.userId)?.name || "Atleta";
      const level = getShortResultLevel(result.metconLevel || result.level || "RX");
      return `
        <div class="score-row">
          <div class="score-rank">${index + 1}</div>
          <div class="score-athlete">
            <div class="score-name">
              <span>${escapeHtml(name)}</span>
              <span class="score-level">${escapeHtml(level)}</span>
            </div>
          </div>
          <div class="score-value">${escapeHtml(value)}</div>
        </div>
      `;
    })
    .join("");
}

function getResultTeamUserIds(result = {}) {
  const ids = Array.isArray(result?.teamUserIds) ? result.teamUserIds : [];
  const fallback = result?.userId ? [result.userId] : [];
  return [...new Set([...(ids.length ? ids : fallback)].map((id) => String(id || "").trim()).filter(Boolean))];
}

function normalizeResultTeamMode(mode, teamUserIds = []) {
  const raw = String(mode || "individual").trim().toLowerCase();
  if (["team", "equipa", "equipas", "trio", "grupo", "grupos"].includes(raw) && teamUserIds.length >= 3) return "team";
  if (["pair", "pairs", "pares", "dupla", "duplas"].includes(raw) && teamUserIds.length >= 2) return "pair";
  return "individual";
}

function isTeamResult(result = {}) {
  return ["pair", "team"].includes(normalizeResultTeamMode(result.teamMode, getResultTeamUserIds(result)));
}

function formatTeamResultName(result, options = {}) {
  const names = getResultTeamUserIds(result)
    .map((id) => getUser(id)?.name)
    .filter(Boolean);
  if (!names.length) return getUser(result?.userId)?.name || "Team";
  if (!options.compact) return names.join(" + ");
  return names.map(compactPersonName).join(" + ");
}

function compactPersonName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || "Atleta";
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function getShortResultLevel(level) {
  const raw = String(level || "RX").trim().toLowerCase();
  if (raw.startsWith("adapt")) return "Adap";
  if (raw === "scaled" || raw === "scale" || raw === "sc") return "Scale";
  return "RX";
}

function isDnfScore(value) {
  return /^(dnf|did not finish)$/i.test(String(value || "").trim());
}

function getTvWodScore(result, workout) {
  const metcon = String(result?.metconScore || "").trim();
  if (metcon) return isDnfScore(metcon) ? "DNF" : metcon;

  const generic = String(result?.score || "").trim();
  if (generic && !looksLikeStrengthOnlyResultText(generic)) return generic;

  return extractMetconScoreFromRelatedFeed(result, workout);
}

function extractMetconScoreFromRelatedFeed(result, workout) {
  if (!result || !workout) return "";
  const userId = String(result.userId || "").trim();
  const workoutKeys = new Set([workout.id, workout.date].filter(Boolean).map(String));

  const feedItem = (tv.state.feed || [])
    .filter((item) => {
      if (userId && String(item.userId || "").trim() !== userId) return false;
      const itemWorkout = String(item.workoutId || "").trim();
      return !itemWorkout || workoutKeys.has(itemWorkout) || itemWorkout.includes(workout.date);
    })
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .find((item) => extractMetconScoreFromText(item.text || "", workout.scoreType));

  return feedItem ? extractMetconScoreFromText(feedItem.text || "", workout.scoreType) : "";
}

function extractMetconScoreFromText(text, scoreType = "") {
  const raw = String(text || "").trim();
  if (!raw) return "";

  const afterMetcon = raw.match(/(?:^|)metcon\s+([^\s,;]+)/i);
  if (!afterMetcon) return "";

  const candidate = String(afterMetcon[1] || "").trim();
  if (!candidate) return "";
  if (isDnfScore(candidate)) return "DNF";

  if ((scoreType || "") === "time") {
    const time = candidate.match(/^(\d{1,3}):([0-5]?\d)$/);
    return time ? `${Number(time[1])}:${String(Number(time[2])).padStart(2, "0")}` : "";
  }

  if ((scoreType || "") === "rounds") {
    const rounds = candidate.match(/^(\d+)\+(\d+)$/);
    return rounds ? `${Number(rounds[1])}+${Number(rounds[2])}` : "";
  }

  return candidate;
}

function looksLikeStrengthOnlyResultText(text) {
  const normalized = String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return (
    /forca/.test(normalized) ||
    /strength/.test(normalized) ||
    /skill/.test(normalized) ||
    /top set/.test(normalized) ||
    /sets completos/.test(normalized) ||
    /\d+rm/.test(normalized) ||
    /1rm/.test(normalized) ||
    /kg/.test(normalized)
  );
}

function renderActivityFeed(workout) {
  const workoutIds = workout ? new Set([workout.id, workout.date].filter(Boolean)) : null;
  const latestItems = (tv.state.feed || [])
    .filter((item) => !workoutIds || !item.workoutId || workoutIds.has(item.workoutId) || String(item.workoutId).includes(workout.date))
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  const seenActivity = new Set();
  const uniqueActivity = latestItems.filter((item) => {
    const userKey = String(item.userId || "").trim();
    const textKey = normalizeActivityText(item.text || item.type || "");
    const key = `${userKey}|${textKey}`;
    if (seenActivity.has(key)) return false;
    seenActivity.add(key);
    return true;
  });

  const seenAthletes = new Set();
  const byAthlete = uniqueActivity.filter((item) => {
    const userKey = String(item.userId || item.userName || item.author || "sem-atleta").trim();
    if (!userKey || seenAthletes.has(userKey)) return false;
    seenAthletes.add(userKey);
    return true;
  });

  const items = byAthlete.slice(0, 3);

  if (!items.length) return emptySmall("Sem atividade recente.");

  return items
    .map((item) => {
      const user = getUser(item.userId);
      const type = item.type === "pr" ? "PR" : "Resultado";
      return `
        <article class="activity-row">
          <strong>${escapeHtml(user?.name || "Atleta")}</strong>
          <span>${escapeHtml(type)} · ${escapeHtml(formatDateTime(item.createdAt))}</span>
          <p>${escapeHtml(formatActivityTextForTv(item.text || "Registou atividade."))}</p>
        </article>
      `;
    })
    .join("");
}

function normalizeActivityText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .slice(0, 120);
}

function formatActivityTextForTv(text) {
  const cleaned = String(text || "")
    .replace(/^registou\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Atividade registada.";
  return cleaned.length > 88 ? `${cleaned.slice(0, 85).trim()}…` : cleaned;
}

function renderCommentFeed(workout) {
  const comments = [];
  (tv.state.results || []).forEach((result) => {
    if (workout && !isResultForWorkout(result, workout)) return;
    (Array.isArray(result.comments) ? result.comments : []).forEach((comment) => {
      comments.push({ ...comment, resultUserId: result.userId });
    });
  });

  const latest = comments
    .filter((comment) => String(comment.text || "").trim())
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, 3);

  if (!latest.length) return emptySmall("Sem comentários recentes.");

  return latest
    .map((comment) => {
      const author = getUser(comment.userId);
      return `
        <article class="activity-row">
          <strong>${escapeHtml(author?.name || "Coach")}</strong>
          <span>${escapeHtml(formatDateTime(comment.createdAt))}</span>
          <p>${escapeHtml(comment.text)}</p>
        </article>
      `;
    })
    .join("");
}

function emptySmall(text) {
  return `<div class="activity-row"><p>${escapeHtml(text)}</p></div>`;
}

function renderDayStrip(selectedDate) {
  if (!tv.els.dayStrip) return;
  const days = getWeekDates(selectedDate);
  const today = isoDate(new Date());
  tv.els.dayStrip.innerHTML = days
    .map((date) => {
      const active = date === selectedDate;
      const isToday = date === today;
      const day = new Date(`${date}T12:00:00`);
      const label = isToday ? "Hoje" : day.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "");
      const number = day.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
      const classes = ["tv-day-button", active ? "is-active" : "", isToday ? "is-today" : ""]
        .filter(Boolean)
        .join(" ");
      return `
        <button class="${classes}" type="button" data-date="${escapeAttr(date)}">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(number)}</strong>
        </button>
      `;
    })
    .join("");
}

function getWeekDates(selectedDate) {
  const selected = new Date(`${selectedDate}T12:00:00`);
  const dayIndex = selected.getDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = new Date(selected);
  monday.setDate(selected.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return isoDate(date);
  });
}

function setSelectedDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return;
  const url = new URL(window.location.href);
  const today = isoDate(new Date());
  if (date === today) url.searchParams.delete("date");
  else url.searchParams.set("date", date);
  window.history.replaceState({}, "", url);
  renderTv();
}

function getSelectedDate() {
  const params = new URLSearchParams(window.location.search);
  const requested = String(params.get("date") || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(requested)) return requested;
  return isoDate(new Date());
}

function getWorkoutForDate(date) {
  return (tv.state.workouts || []).find((workout) => workout.date === date) || null;
}

function getHyroxWorkoutForDate(date) {
  const current = (tv.state.hyroxWorkouts || []).find((workout) => workout.date === date);
  const currentPublicBlocks = current ? normalizeHyroxBlocks(current.blocks || []).filter((block) => !isCoachNotesBlock(block)) : [];
  if (current && currentPublicBlocks.length) return current;
  const cached = loadCachedHyroxWorkouts().find((workout) => workout.date === date);
  const cachedPublicBlocks = cached ? normalizeHyroxBlocks(cached.blocks || []).filter((block) => !isCoachNotesBlock(block)) : [];
  if (cached && cachedPublicBlocks.length) return cached;
  return current || createFallbackHyroxWorkout(date);
}

function createFallbackHyroxWorkout(date) {
  return {
    id: `hyrox-${date}`,
    date,
    title: "HYROX Session",
    blocks: [],
  };
}

function normalizeClassType(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (["hyrox", "h", "hyrox365"].includes(raw)) return "hyrox";
  if (["cross", "crossfit", "wod"].includes(raw)) return "cross";
  return "cross";
}

function normalizeHyroxBlockType(value) {
  const raw = String(value || "part").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["coach_notes", "coachnotes", "notes", "notas", "private", "privado"].includes(raw)) return "coach_notes";
  if (["warmup", "warm_up", "aquecimento"].includes(raw)) return "warmup";
  if (["finisher", "final"].includes(raw)) return "finisher";
  if (["cooldown", "cool_down", "retorno", "alongamentos"].includes(raw)) return "cooldown";
  return "part";
}

function getHyroxBlockTypeLabel(type) {
  const labels = { warmup: "Warmup", part: "Part", finisher: "Finisher", cooldown: "Cooldown", coach_notes: "Coach Notes" };
  return labels[normalizeHyroxBlockType(type)] || "Part";
}

function normalizeHyroxBlocks(blocks = []) {
  return (Array.isArray(blocks) ? blocks : [])
    .map((block, index) => ({
      id: String(block?.id || `hb-${index}`),
      type: normalizeHyroxBlockType(block?.type),
      title: String(block?.title || getHyroxBlockTypeLabel(block?.type)).trim(),
      duration: String(block?.duration || block?.scheme || "").trim(),
      content: String(block?.content || block?.body || block?.text || "").replace(/\r\n/g, "\n").trim(),
    }));
}

function isCoachNotesBlock(block) {
  return normalizeHyroxBlockType(block?.type) === "coach_notes" || /coach\s*notes/i.test(String(block?.title || ""));
}

function normalizeWorkoutBlocks(workout) {
  return {
    warmup: workout?.blocks?.warmup || workout?.warmup || "",
    strength: workout?.blocks?.strength || workout?.strength || "",
    metcon: workout?.blocks?.metcon || workout?.metcon || workout?.wod || "",
    notes: workout?.blocks?.notes || workout?.notes || "",
  };
}

function cleanBlockText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getResultsForWorkout(workout) {
  if (!workout) return [];
  return (tv.state.results || []).filter((result) => isResultForWorkout(result, workout));
}

function isResultForWorkout(result, workout) {
  if (!result || !workout) return false;
  if (result.workoutId && result.workoutId === workout.id) return true;
  const resultDate = result.workoutDate || getWorkoutDateFromId(result.workoutId);
  return Boolean(resultDate && resultDate === workout.date);
}

function getWorkoutDateFromId(workoutId) {
  const match = String(workoutId || "").match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function compareResults(a, b, workout) {
  const type = workout?.scoreType || "time";
  const aScore = getComparableScore(a, type);
  const bScore = getComparableScore(b, type);
  const bothComparable = Number.isFinite(aScore.value) && Number.isFinite(bScore.value);
  if (bothComparable && aScore.value !== bScore.value) {
    return aScore.direction === "lower" ? aScore.value - bScore.value : bScore.value - aScore.value;
  }
  return String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""));
}

function getComparableScore(result, type) {
  const raw = String(result.__tvWodScore || result.metconScore || result.score || result.strengthLoad || result.prRawValue || "").trim();
  if (isDnfScore(raw)) return { value: type === "time" ? 999999999 : -999999999, direction: type === "time" ? "lower" : "higher" };
  if (type === "time") return { value: parseTimeToSeconds(raw), direction: "lower" };
  if (type === "rounds") return { value: parseRounds(raw), direction: "higher" };
  return { value: parseNumber(raw), direction: "higher" };
}

function parseTimeToSeconds(value) {
  const match = String(value || "").trim().match(/^(\d{1,3}):(\d{1,2})$/);
  if (!match) return Number.NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

function parseRounds(value) {
  const match = String(value || "").trim().match(/^(\d+)\s*\+\s*(\d+)$/);
  if (!match) return Number.NaN;
  return Number(match[1]) * 1000 + Number(match[2]);
}

function parseNumber(value) {
  const match = String(value || "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

function getUser(userId) {
  return (tv.state.users || []).find((user) => user.id === userId) || null;
}

function renderError(error) {
  tv.els.workoutName.textContent = "Erro ao carregar TV";
  tv.els.workoutName.classList.remove("is-hidden");
  tv.els.workoutTags.innerHTML = "";
  tv.els.workoutSections.innerHTML = `<article class="empty-tv-card">${escapeHtml(error?.message || "Erro desconhecido.")}</article>`;
  tv.els.topResults.innerHTML = emptySmall("Sem dados.");
  tv.els.activityFeed.innerHTML = emptySmall("Sem dados.");
  if (tv.els.commentFeed) tv.els.commentFeed.innerHTML = emptySmall("Sem dados.");
  tv.els.lastUpdated.textContent = "Última atualização: --";
}

function setStatus(text) {
  if (tv.els.status) tv.els.status.textContent = text;
}

function isoDate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDateLong(iso) {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(iso) {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
}

function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function formatTimeOnly(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
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
