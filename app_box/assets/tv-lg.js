/* HPBOX TV LG v20 — HYROX body font equal to Crosstraining */
"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    var __defProp = Object.defineProperty;
    var __defProps = Object.defineProperties;
    var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
    var __getOwnPropSymbols = Object.getOwnPropertySymbols;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __propIsEnum = Object.prototype.propertyIsEnumerable;
    var __defNormalProp = function (obj, key, value) { return key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value }) : obj[key] = value; };
    var __spreadValues = function (a, b) {
        for (var prop in b || (b = {}))
            if (__hasOwnProp.call(b, prop))
                __defNormalProp(a, prop, b[prop]);
        if (__getOwnPropSymbols)
            for (var _i = 0, _e = __getOwnPropSymbols(b); _i < _e.length; _i++) {
                var prop = _e[_i];
                if (__propIsEnum.call(b, prop))
                    __defNormalProp(a, prop, b[prop]);
            }
        return a;
    };
    var __spreadProps = function (a, b) { return __defProps(a, __getOwnPropDescs(b)); };
    var __async = function (__this, __arguments, generator) {
        return new Promise(function (resolve, reject) {
            var fulfilled = function (value) {
                try {
                    step(generator.next(value));
                }
                catch (e) {
                    reject(e);
                }
            };
            var rejected = function (value) {
                try {
                    step(generator.throw(value));
                }
                catch (e) {
                    reject(e);
                }
            };
            var step = function (x) { return x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected); };
            step((generator = generator.apply(__this, __arguments)).next());
        });
    };

  // LG/WebOS legacy helpers
  if (!Array.from) Array.from = function (value, mapFn, thisArg) {
    var list = [];
    if (!value) return list;
    var length = typeof value.length === "number" ? value.length : 0;
    for (var i = 0; i < length; i++) list.push(mapFn ? mapFn.call(thisArg, value[i], i) : value[i]);
    return list;
  };
  if (!Array.prototype.find) Array.prototype.find = function (predicate, thisArg) {
    for (var i = 0; i < this.length; i++) if (predicate.call(thisArg, this[i], i, this)) return this[i];
    return undefined;
  };
  if (!Array.prototype.includes) Array.prototype.includes = function (search) {
    return this.indexOf(search) !== -1;
  };
  if (!String.prototype.includes) String.prototype.includes = function (search, start) {
    return this.indexOf(search, start || 0) !== -1;
  };
  if (!String.prototype.startsWith) String.prototype.startsWith = function (search, pos) {
    pos = pos || 0; return this.substr(pos, search.length) === search;
  };
  if (!String.prototype.padStart) String.prototype.padStart = function (targetLength, padString) {
    targetLength = targetLength >> 0; padString = String(padString || " ");
    if (this.length >= targetLength) return String(this);
    var pad = "";
    while (pad.length < targetLength - this.length) pad += padString;
    return pad.slice(0, targetLength - this.length) + String(this);
  };
  if (!Object.entries) Object.entries = function (obj) {
    var keys = Object.keys(obj || {}); var out = [];
    for (var i = 0; i < keys.length; i++) out.push([keys[i], obj[keys[i]]]);
    return out;
  };
  if (!Object.values) Object.values = function (obj) {
    var keys = Object.keys(obj || {}); var out = [];
    for (var i = 0; i < keys.length; i++) out.push(obj[keys[i]]);
    return out;
  };
  if (!Number.isFinite) Number.isFinite = function (value) { return typeof value === "number" && isFinite(value); };
  if (!Number.isNaN) Number.isNaN = function (value) { return value !== value; };
  if (window.Element && !Element.prototype.closest) Element.prototype.closest = function (selector) {
    var el = this;
    while (el) {
      var matches = el.matches || el.msMatchesSelector || el.webkitMatchesSelector;
      if (matches && matches.call(el, selector)) return el;
      el = el.parentElement;
    }
    return null;
  };
  function getQueryParam(name) {
    var query = String(window.location.search || "");
    if (query.charAt(0) === "?") query = query.slice(1);
    if (!query) return "";
    var parts = query.split("&");
    for (var i = 0; i < parts.length; i++) {
      var pair = parts[i].split("=");
      var key = decodeURIComponent((pair[0] || "").replace(/\+/g, " "));
      if (key === name) return decodeURIComponent((pair.slice(1).join("=") || "").replace(/\+/g, " "));
    }
    return "";
  }
  function hasQueryParam(name) {
    var query = String(window.location.search || "");
    if (query.charAt(0) === "?") query = query.slice(1);
    if (!query) return false;
    var parts = query.split("&");
    for (var i = 0; i < parts.length; i++) {
      var key = decodeURIComponent((parts[i].split("=")[0] || "").replace(/\+/g, " "));
      if (key === name) return true;
    }
    return false;
  }
  function replaceDateQueryParam(date) {
    try {
      if (!window.history || !window.history.replaceState) return;
      var href = String(window.location.href || "");
      var hashIndex = href.indexOf("#");
      var hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
      var noHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
      var questionIndex = noHash.indexOf("?");
      var base = questionIndex >= 0 ? noHash.slice(0, questionIndex) : noHash;
      var query = questionIndex >= 0 ? noHash.slice(questionIndex + 1) : "";
      var params = [];
      if (query) {
        var parts = query.split("&");
        for (var i = 0; i < parts.length; i++) {
          var key = decodeURIComponent((parts[i].split("=")[0] || "").replace(/\+/g, " "));
          if (key && key !== "date") params.push(parts[i]);
        }
      }
      var today = isoDate(new Date());
      if (date !== today) params.push("date=" + encodeURIComponent(date));
      var next = base + (params.length ? "?" + params.join("&") : "") + hash;
      window.history.replaceState({}, "", next);
    } catch (error) {}
  }

    var TV_CONFIG = typeof window !== "undefined" && window.HPBOX_CONFIG || {};
    var TV_STORAGE_KEY = TV_CONFIG.storageKey || "hpbox-pilot-v1";
    var TV_CACHE_STORAGE_KEY = "".concat(TV_STORAGE_KEY, "-tv-cache");
    var TV_HYROX_CACHE_KEY = "".concat(TV_STORAGE_KEY, "-tv-hyrox-cache");
    var TV_LEGACY_STORAGE_KEYS = ["box-board-prototype-v1"];
    var TV_REFRESH_SECONDS = getRefreshSeconds();
    var TV_HARD_RELOAD_MINUTES = 45;
    var TV_MODE_GRACE_SECONDS = 8;
    var TV_CLASS_CODE_EARLY_MINUTES = 15;
    var TV_CLASS_CODE_GRACE_MINUTES = 10;
    var TV_SCORE_TYPES = {
        time: "Tempo",
        reps: "Reps",
        load: "Carga",
        complex: "Complexo",
        quality: "Qualidade",
        rounds: "Rounds + reps",
        complete: "Completed"
    };
    var tv = {
        state: null,
        updatedAt: "",
        source: "local",
        lastGoodState: null,
        els: {},
        refreshTimer: null,
        clockTimer: null,
        hyroxFitTimer: null,
        contextTimer: null,
        hardReloadTimer: null,
        lastContextSignature: "",
        lastAutoMinute: "",
        lastMode: "",
        lastBoundaryKey: ""
    };
    document.addEventListener("DOMContentLoaded", function () {
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
            dayStrip: document.getElementById("tvDayStrip")
        };
        applyVisualAssets();
        bindDayStrip();
        startClock();
        loadAndRender();
        tv.refreshTimer = window.setInterval(loadAndRender, TV_REFRESH_SECONDS * 1e3);
        tv.contextTimer = window.setInterval(checkAutoContextChange, 10e3);
        scheduleHardReloadGuard();
    });
    function getRefreshSeconds() {
        var requested = Number(getQueryParam("refresh") || "30");
        if (!Number.isFinite(requested))
            return 30;
        return Math.min(Math.max(Math.round(requested), 15), 300);
    }
    function applyVisualAssets() {
        var assets = TV_CONFIG.visualAssets || {};
        var crossBackground = String(assets.crosstrainingBackground || "").trim();
        var genericBackground = String(assets.background || "").trim();
        var resolvedCrossBackground = crossBackground || (/training-bg-clean\.png(?:\?v=[A-Za-z0-9._-]+)?$/i.test(genericBackground) ? "assets/crosstraining-tv-background.png" : genericBackground || "assets/crosstraining-tv-background.png");
        var pairs = {
            "--hpbox-training-background-image": resolvedCrossBackground,
            "--hpbox-warmup-header-image": assets.warmupHeader || "assets/training-warm-up-header-clean.png",
            "--hpbox-strength-header-image": assets.strengthHeader || "assets/training-strength-header-clean.png",
            "--hpbox-wod-header-image": assets.wodHeader || "assets/training-wod-header-clean.png"
        };
        Object.entries(pairs).forEach(function (_e) {
            var key = _e[0], value = _e[1];
            if (/^assets\/[A-Za-z0-9._/-]+\.png(?:\?v=[A-Za-z0-9._-]+)?$/i.test(String(value))) {
                document.documentElement.style.setProperty(key, "url(\"".concat(value, "\")"));
            }
        });
        var filter = String(assets.warmupFilter || "none").trim();
        document.documentElement.style.setProperty("--hpbox-warmup-filter", filter === "hue-rotate(88deg) saturate(1.12)" ? filter : "none");
    }
    function setElementClass(element, className, shouldHave) {
        if (!element)
            return;
        if (shouldHave) {
            if (!element.classList.contains(className))
                element.classList.add(className);
        }
        else {
            if (element.classList.contains(className))
                element.classList.remove(className);
        }
    }

    function bindDayStrip() {
        if (!tv.els.dayStrip)
            return;
        tv.els.dayStrip.addEventListener("click", function (event) {
            var button = event.target.closest("[data-date]");
            if (!button)
                return;
            setSelectedDate(button.dataset.date);
        });
    }
    function startClock() {
        updateClock();
        tv.clockTimer = window.setInterval(updateClock, 1e3);
    }
    function pad2(value) {
        value = String(value);
        return value.length < 2 ? "0" + value : value;
    }

    function updateClock() {
        if (!tv.els.clock)
            return;
        var now = new Date();
        tv.els.clock.textContent = now.toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit"
        });
        if (tv.state) {
            var autoMinute = isoDate(now) + " " + pad2(now.getHours()) + ":" + pad2(now.getMinutes());
            var nextSignature = getTvContextSignature();
            var minuteChanged = tv.lastAutoMinute && autoMinute !== tv.lastAutoMinute;
            if (!getForcedMode() && minuteChanged) {
                tv.lastAutoMinute = autoMinute;
                // Nas LG, buscar dados frescos a cada mudança de minuto evita ficar preso numa aula antiga.
                loadAndRender();
                return;
            }
            if (nextSignature && tv.lastContextSignature && nextSignature !== tv.lastContextSignature) {
                tv.lastAutoMinute = autoMinute;
                renderTv();
                return;
            }
            tv.lastAutoMinute = tv.lastAutoMinute || autoMinute;
            renderLiveClassPin(getDisplayContext(getSelectedDate()).workout);
            maybeReloadAtClassBoundary(now);
        }
    }
    function checkAutoContextChange() {
        if (!tv.state)
            return;
        var nextSignature = getTvContextSignature();
        if (nextSignature && tv.lastContextSignature && nextSignature !== tv.lastContextSignature) {
            loadAndRender();
        }
        maybeReloadAtClassBoundary(new Date());
    }
    function getTvContextSignature() {
        var date = getSelectedDate();
        return buildTvContextSignature(date, getDisplayContext(date));
    }
    function buildTvContextSignature(date, context) {
        var activeClass = context && context.activeClass ? context.activeClass : null;
        return [
            date || "",
            context && context.mode || "cross",
            activeClass ? activeClass.id || "" : "",
            activeClass ? activeClass.time || "" : "",
            activeClass ? activeClass.endTime || "" : "",
            getForcedMode() || "auto"
        ].join("|");
    }
    function loadAndRender() {
        return __async(this, null, function () {
            var loaded, error_1, local;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        setStatus("A atualizar");
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, loadTvState()];
                    case 2:
                        loaded = _e.sent();
                        rememberTvSnapshot(loaded.state, loaded.updatedAt || ( /* @__PURE__ */new Date()).toISOString(), loaded.source || "local");
                        tv.state = normalizePublicState(loaded.state);
                        tv.lastGoodState = tv.state;
                        tv.updatedAt = loaded.updatedAt || ( /* @__PURE__ */new Date()).toISOString();
                        tv.source = loaded.source || "local";
                        document.body.classList.remove("tv-error", "tv-stale");
                        renderTv();
                        setStatus(tv.source === "online" ? "Online" : "Local");
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _e.sent();
                        if (tv.state || tv.lastGoodState) {
                            tv.state = tv.state || tv.lastGoodState;
                            document.body.classList.add("tv-stale");
                            document.body.classList.remove("tv-error");
                            renderTv();
                            setStatus("Liga\xE7\xE3o inst\xE1vel \xB7 \xFAltimo treino");
                            return [2 /*return*/];
                        }
                        document.body.classList.add("tv-error");
                        setStatus("Erro / cache");
                        local = loadLocalState();
                        if (local.state) {
                            tv.state = normalizePublicState(local.state);
                            tv.lastGoodState = tv.state;
                            tv.updatedAt = local.updatedAt || "";
                            tv.source = local.source || "cache";
                            renderTv();
                        }
                        else {
                            renderError(error_1);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function loadTvState() {
        return __async(this, null, function () {
            var restLoaded, _a, client, table, id, _e, data, error, supabaseError, local;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!shouldUseSupabase()) return [3 /*break*/, 8];
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, loadSupabaseViaRest()];
                    case 2:
                        restLoaded = _f.sent();
                        if (restLoaded && restLoaded.state)
                            return [2 /*return*/, restLoaded];
                        return [3 /*break*/, 4];
                    case 3:
                        supabaseError = _f.sent();
                        tv.lastOnlineError = supabaseError;
                        return [3 /*break*/, 4];
                    case 4:
                        if (!(((_a = window.supabase) == null ? void 0 : _a.createClient))) return [3 /*break*/, 8];
                        client = window.supabase.createClient(TV_CONFIG.supabaseUrl, TV_CONFIG.supabaseAnonKey);
                        table = TV_CONFIG.onlineStateTable || "hpbox_pilot_state";
                        id = TV_CONFIG.onlineStateId || "hpbox-pilot";
                        _f.label = 5;
                    case 5:
                        _f.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, withTimeout(client.from(table).select("payload, updated_at").eq("id", id).maybeSingle(), 12e3)];
                    case 6:
                        _e = _f.sent(), data = _e.data, error = _e.error;
                        if (error)
                            throw error;
                        if (data == null ? void 0 : data.payload)
                            return [2 /*return*/, { state: data.payload, updatedAt: data.updated_at, source: "online" }];
                        return [3 /*break*/, 8];
                    case 7:
                        supabaseError = _f.sent();
                        tv.lastOnlineError = supabaseError;
                        return [3 /*break*/, 8];
                    case 8:
                        local = loadLocalState();
                        if (local.state)
                            return [2 /*return*/, local];
                        if (tv.lastOnlineError)
                            throw tv.lastOnlineError;
                        throw new Error("Sem dados disponíveis para mostrar na TV.");
                }
            });
        });
    }

    function loadSupabaseViaRest() {
        return new Promise(function (resolve, reject) {
            try {
                var baseUrl = String(TV_CONFIG.supabaseUrl || "").replace(/\/$/, "");
                var table = encodeURIComponent(TV_CONFIG.onlineStateTable || "hpbox_pilot_state");
                var id = encodeURIComponent(TV_CONFIG.onlineStateId || "hpbox-pilot");
                var url = baseUrl + "/rest/v1/" + table + "?id=eq." + id + "&select=payload,updated_at&_tv=" + String((/* @__PURE__ */new Date()).getTime());
                var xhr = new XMLHttpRequest();
                var done = false;
                var timer = window.setTimeout(function () {
                    if (done) return;
                    done = true;
                    try { xhr.abort(); } catch (e) {}
                    reject(new Error("Tempo limite ao carregar dados REST."));
                }, 12e3);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState !== 4 || done) return;
                    done = true;
                    window.clearTimeout(timer);
                    if (xhr.status < 200 || xhr.status >= 300) {
                        reject(new Error("Supabase REST " + xhr.status));
                        return;
                    }
                    try {
                        var rows = JSON.parse(xhr.responseText || "[]");
                        var row = rows && rows.length ? rows[0] : null;
                        if (row && row.payload) {
                            resolve({ state: row.payload, updatedAt: row.updated_at, source: "online" });
                            return;
                        }
                        reject(new Error("Sem payload no Supabase REST."));
                    }
                    catch (e) {
                        reject(e);
                    }
                };
                xhr.open("GET", url, true);
                xhr.setRequestHeader("apikey", TV_CONFIG.supabaseAnonKey);
                xhr.setRequestHeader("Authorization", "Bearer " + TV_CONFIG.supabaseAnonKey);
                xhr.setRequestHeader("Accept", "application/json");
                try { xhr.setRequestHeader("Cache-Control", "no-cache"); } catch (e) {}
                try { xhr.setRequestHeader("Pragma", "no-cache"); } catch (e) {}
                xhr.send();
            }
            catch (e) {
                reject(e);
            }
        });
    }

    function shouldUseSupabase() {
        return TV_CONFIG.dataMode === "supabase" && Boolean(TV_CONFIG.supabaseUrl && TV_CONFIG.supabaseAnonKey);
    }
    function withTimeout(promise, ms) {
        return new Promise(function (resolve, reject) {
            var timer = window.setTimeout(function () { return reject(new Error("Tempo limite ao carregar dados.")); }, ms);
            Promise.resolve(promise).then(function (value) {
                window.clearTimeout(timer);
                resolve(value);
            }).catch(function (error) {
                window.clearTimeout(timer);
                reject(error);
            });
        });
    }
    function loadLocalState() {
        var _a;
        var keys = __spreadArray([TV_CACHE_STORAGE_KEY, TV_STORAGE_KEY], TV_LEGACY_STORAGE_KEYS, true);
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var key = keys_1[_i];
            try {
                var raw = (_a = window.localStorage) == null ? void 0 : _a.getItem(key);
                if (!raw)
                    continue;
                var parsed = JSON.parse(raw);
                var state = (parsed == null ? void 0 : parsed.state) && Array.isArray(parsed.state.workouts) ? parsed.state : parsed;
                if (state && Array.isArray(state.workouts)) {
                    return {
                        state: state,
                        updatedAt: (parsed == null ? void 0 : parsed.updatedAt) || state.updatedAt || "",
                        source: key === TV_CACHE_STORAGE_KEY ? "cache" : "local"
                    };
                }
            }
            catch (e) {
            }
        }
        return { state: null, updatedAt: "", source: "local" };
    }
    function rememberTvSnapshot(state, updatedAt, source) {
        if (updatedAt === void 0) { updatedAt = ""; }
        if (source === void 0) { source = ""; }
        var _a, _b;
        if (!state || !Array.isArray(state.workouts))
            return;
        try {
            (_a = window.localStorage) == null ? void 0 : _a.setItem(TV_CACHE_STORAGE_KEY, JSON.stringify({ state: state, updatedAt: updatedAt, source: source }));
        }
        catch (e) {
        }
        var hyroxWorkouts = Array.isArray(state.hyroxWorkouts) ? state.hyroxWorkouts.filter(function (workout) {
            var blocks = normalizeHyroxBlocks((workout == null ? void 0 : workout.blocks) || []).filter(function (block) { return !isCoachNotesBlock(block); });
            return (workout == null ? void 0 : workout.date) && blocks.length;
        }) : [];
        if (!hyroxWorkouts.length)
            return;
        try {
            (_b = window.localStorage) == null ? void 0 : _b.setItem(TV_HYROX_CACHE_KEY, JSON.stringify({ hyroxWorkouts: hyroxWorkouts, updatedAt: updatedAt }));
        }
        catch (e) {
        }
    }
    function loadCachedHyroxWorkouts() {
        var _a;
        try {
            var raw = (_a = window.localStorage) == null ? void 0 : _a.getItem(TV_HYROX_CACHE_KEY);
            if (!raw)
                return [];
            var parsed = JSON.parse(raw);
            var list = Array.isArray(parsed == null ? void 0 : parsed.hyroxWorkouts) ? parsed.hyroxWorkouts : [];
            return list.map(function (workout) { return ({
                id: String((workout == null ? void 0 : workout.id) || (workout == null ? void 0 : workout.date) || ""),
                date: String((workout == null ? void 0 : workout.date) || ""),
                title: String((workout == null ? void 0 : workout.title) || "HYROX Session"),
                blocks: normalizeHyroxBlocks((workout == null ? void 0 : workout.blocks) || [])
            }); }).filter(function (workout) { return workout.date; });
        }
        catch (e) {
            return [];
        }
    }
    function mergeHyroxWithCache(hyroxWorkouts) {
        if (hyroxWorkouts === void 0) { hyroxWorkouts = []; }
        var cached = loadCachedHyroxWorkouts();
        if (!cached.length)
            return hyroxWorkouts;
        var byDate = new Map(cached.map(function (workout) { return [workout.date, workout]; }));
        hyroxWorkouts.forEach(function (workout) {
            var publicBlocks = normalizeHyroxBlocks((workout == null ? void 0 : workout.blocks) || []).filter(function (block) { return !isCoachNotesBlock(block); });
            if ((workout == null ? void 0 : workout.date) && publicBlocks.length)
                byDate.set(workout.date, workout);
        });
        return Array.from(byDate.values()).sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    }
    function mergeTvListsById() {
        var lists = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            lists[_i] = arguments[_i];
        }
        var seen = {};
        var out = [];
        lists.forEach(function (list) {
            (Array.isArray(list) ? list : []).forEach(function (item, index) {
                if (!item)
                    return;
                var id = String(item.id || item.resultId || item.feedId || [item.workoutId, item.workoutDate || item.date, item.userId, item.createdAt, index].join("|")).trim();
                if (seen[id])
                    return;
                seen[id] = true;
                out.push(item);
            });
        });
        return out;
    }


    function collectNestedLgRecords(root, kind) {
        var out = [];
        var seen = [];
        function visit(value, depth) {
            if (!value || depth > 5) return;
            if (Array.isArray(value)) {
                for (var i = 0; i < value.length; i += 1) {
                    var item = value[i];
                    if (item && typeof item === "object") {
                        if (kind === "result" && isResultLikeLgRecord(item)) out.push(item);
                        else if (kind === "feed" && isFeedLikeLgRecord(item)) out.push(item);
                    }
                    visit(item, depth + 1);
                }
                return;
            }
            if (typeof value !== "object") return;
            if (seen.indexOf(value) >= 0) return;
            seen.push(value);
            for (var key in value) {
                if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
                if (/^(users|workouts|classes|hyroxWorkouts|prs)$/i.test(key)) continue;
                visit(value[key], depth + 1);
            }
        }
        visit(root, 0);
        return out;
    }
    function isResultLikeLgRecord(item) {
        if (!item || typeof item !== "object") return false;
        var hasUser = Boolean(item.userId || item.athleteId || item.userName || item.athleteName || item.teamUserIds);
        var hasScore = Boolean(item.metconScore || item.wodScore || item.score || item.strengthScore || item.strengthLoad || item.prRawValue || item.wodResult || item.metcon || item.wod || item.result);
        var hasContext = Boolean(item.workoutId || item.workoutDate || item.date || item.createdAt || item.updatedAt);
        return hasUser && hasScore && hasContext;
    }
    function isFeedLikeLgRecord(item) {
        if (!item || typeof item !== "object") return false;
        var text = item.text || item.description || item.body || item.message;
        var hasContext = Boolean(item.userId || item.userName || item.athleteName || item.createdAt || item.updatedAt || item.date);
        return Boolean(text && hasContext);
    }

    function normalizeTimeString(value) {
        var raw = String(value || "").trim();
        var match = raw.match(/(\d{1,2}:\d{2})/);
        if (!match) return "";
        var parts = match[1].split(":");
        var h = Number(parts[0]);
        var m = Number(parts[1]);
        if (!isFinite(h) || !isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) return "";
        return (h < 10 ? "0" + h : String(h)) + ":" + (m < 10 ? "0" + m : String(m));
    }
    function getTimeRangeFromValue(value) {
        var raw = String(value || "").trim();
        var matches = raw.match(/\d{1,2}:\d{2}/g) || [];
        return {
            start: matches.length ? normalizeTimeString(matches[0]) : "",
            end: matches.length > 1 ? normalizeTimeString(matches[1]) : ""
        };
    }
    function normalizeClassStartTime(classEntry) {
        var rawStart = String((classEntry == null ? void 0 : classEntry.time) || (classEntry == null ? void 0 : classEntry.startTime) || (classEntry == null ? void 0 : classEntry.start) || "").trim();
        var direct = normalizeTimeString(rawStart);
        if (direct) return direct;
        var range = getTimeRangeFromValue(rawStart);
        if (range.start) return range.start;
        range = getTimeRangeFromValue((classEntry == null ? void 0 : classEntry.label) || (classEntry == null ? void 0 : classEntry.title) || (classEntry == null ? void 0 : classEntry.name) || "");
        return range.start || "";
    }
    function minutesFromTime(value) {
        var time = normalizeTimeString(value);
        if (!time) return Number.NaN;
        var parts = time.split(":");
        return Number(parts[0]) * 60 + Number(parts[1]);
    }
    function isNowInsideClassMinutes(classEntry, now) {
        var startMinutes = minutesFromTime(classEntry.time);
        var endMinutes = minutesFromTime(classEntry.endTime);
        if (!isFinite(startMinutes) || !isFinite(endMinutes)) return false;
        var nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (endMinutes <= startMinutes) return nowMinutes >= startMinutes || nowMinutes < endMinutes;
        return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    }
    function compareClassesByStart(a, b) {
        var am = minutesFromTime(a.time);
        var bm = minutesFromTime(b.time);
        if (!isFinite(am)) am = 99999;
        if (!isFinite(bm)) bm = 99999;
        return am - bm;
    }

    function normalizeClassEndTime(classEntry) {
        var rawEnd = String((classEntry == null ? void 0 : classEntry.endTime) || (classEntry == null ? void 0 : classEntry.end) || "").trim();
        var directEnd = normalizeTimeString(rawEnd);
        if (directEnd) return directEnd;
        var rawRange = String((classEntry == null ? void 0 : classEntry.time) || (classEntry == null ? void 0 : classEntry.startTime) || (classEntry == null ? void 0 : classEntry.start) || "").trim();
        var range = getTimeRangeFromValue(rawRange);
        if (range.end) return range.end;
        range = getTimeRangeFromValue((classEntry == null ? void 0 : classEntry.label) || (classEntry == null ? void 0 : classEntry.title) || (classEntry == null ? void 0 : classEntry.name) || "");
        if (range.end) return range.end;
        var rawStart = normalizeClassStartTime(classEntry);
        if (!rawStart) return "";
        var duration = Number((classEntry == null ? void 0 : classEntry.duration) || (classEntry == null ? void 0 : classEntry.durationMinutes) || 60);
        if (!isFinite(duration) || duration <= 0) duration = 60;
        var parts = rawStart.split(":");
        var total = Number(parts[0]) * 60 + Number(parts[1]) + duration;
        total = ((total % 1440) + 1440) % 1440;
        var hours = Math.floor(total / 60);
        var minutes = total % 60;
        return (hours < 10 ? "0" + hours : String(hours)) + ":" + (minutes < 10 ? "0" + minutes : String(minutes));
    }

    function normalizePublicState(state) {
        var users = ((state == null ? void 0 : state.users) || []).map(function (user) { return ({
            id: String((user == null ? void 0 : user.id) || ""),
            name: String((user == null ? void 0 : user.name) || "Atleta").trim() || "Atleta",
            role: String((user == null ? void 0 : user.role) || "athlete"),
            gender: String((user == null ? void 0 : user.gender) || ""),
            active: (user == null ? void 0 : user.active) !== false
        }); });
        var normalizedHyroxWorkouts = Array.isArray(state == null ? void 0 : state.hyroxWorkouts) ? state.hyroxWorkouts.map(function (workout) { return ({
            id: String((workout == null ? void 0 : workout.id) || (workout == null ? void 0 : workout.date) || ""),
            date: String((workout == null ? void 0 : workout.date) || ""),
            title: String((workout == null ? void 0 : workout.title) || "HYROX Session"),
            blocks: normalizeHyroxBlocks((workout == null ? void 0 : workout.blocks) || [])
        }); }) : [];
        var mergedResults = mergeTvListsById(Array.isArray(state == null ? void 0 : state.results) ? state.results : [], Array.isArray(state == null ? void 0 : state.workoutResults) ? state.workoutResults : [], Array.isArray(state == null ? void 0 : state.scores) ? state.scores : [], Array.isArray(state == null ? void 0 : state.leaderboard) ? state.leaderboard : [], collectNestedLgRecords(state, "result"));
        var mergedFeed = mergeTvListsById(Array.isArray(state == null ? void 0 : state.feed) ? state.feed : [], Array.isArray(state == null ? void 0 : state.activityFeed) ? state.activityFeed : [], Array.isArray(state == null ? void 0 : state.activities) ? state.activities : [], collectNestedLgRecords(state, "feed"));
        return {
            users: users,
            workouts: Array.isArray(state == null ? void 0 : state.workouts) ? state.workouts : [],
            results: mergedResults,
            feed: mergedFeed,
            prs: Array.isArray(state == null ? void 0 : state.prs) ? state.prs : [],
            hyroxWorkouts: mergeHyroxWithCache(normalizedHyroxWorkouts),
            classes: Array.isArray(state == null ? void 0 : state.classes) ? state.classes.map(function (classEntry) { return ({
                id: String((classEntry == null ? void 0 : classEntry.id) || ""),
                date: String((classEntry == null ? void 0 : classEntry.date) || ""),
                time: normalizeClassStartTime(classEntry),
                endTime: normalizeClassEndTime(classEntry),
                duration: Number((classEntry == null ? void 0 : classEntry.duration) || 60),
                classType: normalizeClassType((classEntry == null ? void 0 : classEntry.classType) || (classEntry == null ? void 0 : classEntry.type) || (classEntry == null ? void 0 : classEntry.kind) || (classEntry == null ? void 0 : classEntry.trainingType) || (classEntry == null ? void 0 : classEntry.workoutType) || (classEntry == null ? void 0 : classEntry.classMode) || (classEntry == null ? void 0 : classEntry.title) || (classEntry == null ? void 0 : classEntry.name) || (classEntry == null ? void 0 : classEntry.label) || (classEntry == null ? void 0 : classEntry.category)),
                accessCode: String((classEntry == null ? void 0 : classEntry.accessCode) || ""),
                ended: Boolean(classEntry == null ? void 0 : classEntry.ended)
            }); }) : []
        };
    }
    function renderDebugPanel(date, context) {
        var old = document.getElementById("tvDebugPanel");
        if (getQueryParam("debug") !== "1") {
            if (old && old.parentNode) old.parentNode.removeChild(old);
            return;
        }
        var panel = old || document.createElement("div");
        panel.id = "tvDebugPanel";
        panel.className = "tv-debug-panel";
        var classes = getClassesForDate(date).map(function (c) { return String(c.time || "") + "-" + String(c.endTime || "") + " " + String(c.classType || "") + (c.ended ? " terminado" : ""); }).join(" | ");
        var now = new Date();
        panel.textContent = "DEBUG " + pad2(now.getHours()) + ":" + pad2(now.getMinutes()) + ":" + pad2(now.getSeconds()) + " · mode=" + (context.mode || "") + " · active=" + (context.activeClass ? context.activeClass.time + "-" + context.activeClass.endTime + " " + context.activeClass.classType : "none") + " · aulas=" + (classes || "0") + " · R=" + ((tv.state && tv.state.results || []).length) + " F=" + ((tv.state && tv.state.feed || []).length);
        if (!old) document.body.appendChild(panel);
    }

    function applyTvMode(isHyrox, mode, activeClass) {
        var body = document.body;
        if (!body) return;
        // Remoção/adicao explícita: mais fiável em LG/WebOS antigo do que toggle com segundo argumento.
        body.classList.remove("tv-hyrox-mode");
        body.classList.remove("tv-cross-mode");
        body.classList.remove("tv-debug-on");
        body.classList.remove("tv-debug-off");
        if (isHyrox) body.classList.add("tv-hyrox-mode");
        else body.classList.add("tv-cross-mode");
        body.classList.add(getQueryParam("debug") === "1" ? "tv-debug-on" : "tv-debug-off");
        body.setAttribute("data-tv-mode", isHyrox ? "hyrox" : "cross");
        body.setAttribute("data-active-class", activeClass ? String(activeClass.time || "") + "-" + String(activeClass.endTime || "") + " " + String(activeClass.classType || "") : "none");
        if (tv.lastMode && tv.lastMode !== mode) {
            clearHyroxLayoutFit();
            if (tv.els.workoutSections) {
                tv.els.workoutSections.innerHTML = "";
                tv.els.workoutSections.className = "workout-sections";
            }
        }
        tv.lastMode = mode;
    }

    function renderTv() {
        var date = getSelectedDate();
        var context = getDisplayContext(date);
        var workout = context.workout, hyroxWorkout = context.hyroxWorkout, activeClass = context.activeClass, mode = context.mode;
        tv.lastContextSignature = buildTvContextSignature(date, context);
        var isHyrox = mode === "hyrox";
        applyTvMode(isHyrox, mode, activeClass);
        tv.els.title.textContent = isHyrox ? "HYROX" : "Treino de hoje";
        tv.els.date.textContent = activeClass ? "".concat(formatDateLong(date), " \u00B7 ").concat(activeClass.time, "-").concat(activeClass.endTime) : formatDateLong(date);
        renderDayStrip(date);
        tv.els.lastUpdated.textContent = "\u00DAltima atualiza\u00E7\u00E3o: ".concat(formatDateTime(tv.updatedAt || ( /* @__PURE__ */new Date()).toISOString()));
        renderDebugPanel(date, context);
        if (String(getQueryParam("debug") || "") === "1") {
            tv.els.lastUpdated.textContent += " · Modo: " + mode + " · Aula: " + (activeClass ? (activeClass.time + "-" + activeClass.endTime + " " + activeClass.classType) : "sem aula ativa");
        }
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
            tv.els.workoutSections.innerHTML = "<article class=\"empty-tv-card\">Ainda n\u00E3o h\u00E1 treino para ".concat(escapeHtml(formatDateShort(date)), ".</article>");
            renderLiveClassPin(null);
            renderCommunity(null);
            return;
        }
        var blocks = normalizeWorkoutBlocks(workout);
        var workoutTitle = String(workout.title || "").trim();
        var showWorkoutTitle = workoutTitle && !/^treino$/i.test(workoutTitle);
        tv.els.workoutName.textContent = showWorkoutTitle ? workoutTitle : "";
        setElementClass(tv.els.workoutName, "is-hidden", !showWorkoutTitle);
        tv.els.workoutTags.innerHTML = renderTags([
            activeClass ? "Aula: ".concat(activeClass.time, "-").concat(activeClass.endTime) : "Cross",
            workout.movement,
            "For\u00E7a: ".concat(TV_SCORE_TYPES[workout.strengthScoreType || "load"] || "Carga"),
            "WOD: ".concat(TV_SCORE_TYPES[workout.scoreType || "time"] || "Score")
        ]);
        var hasWarmup = hasProgrammedWarmup(blocks.warmup);
        var hasStrength = hasProgrammedStrength(blocks.strength);
        tv.els.workoutSections.className = "workout-sections";
        setElementClass(tv.els.workoutSections, "no-warmup", !hasWarmup);
        setElementClass(tv.els.workoutSections, "no-strength", !hasStrength);
        tv.els.workoutSections.innerHTML = "\n    ".concat(hasWarmup ? renderBlock("warmup", "Warm Up", blocks.warmup) : "", "\n    ").concat(hasStrength ? renderBlock("strength", "Strength", blocks.strength) : "", "\n    ").concat(renderBlock("wod", "WOD", blocks.metcon || "Sem WOD programado."), "\n  ");
        renderLiveClassPin(workout);
        renderCommunity(workout);
    }
    function getDisplayContext(date) {
        var workout = getWorkoutForDate(date);
        var now = new Date();
        var forcedMode = getForcedMode();
        var activeClass = forcedMode ? null : getActiveClassForTv(date, now);
        var mode = forcedMode || normalizeClassType(activeClass ? activeClass.classType : "cross");
        // Segurança anti-lock: fora da janela horária real, nunca manter HYROX por cache visual no dia de hoje.
        if (!forcedMode && date === isoDate(now) && mode === "hyrox" && (!activeClass || !isNowInsideClassMinutes(activeClass, now))) {
            activeClass = null;
            mode = "cross";
        }
        // Quando estamos a ver sábado/outro dia por query, não há aula ativa.
        // Se esse dia tem HYROX público, a TV mostra HYROX em vez de cair sempre em Cross.
        if (!forcedMode && date !== isoDate(now) && hasPublicHyroxWorkoutForDate(date)) {
            var classes = getClassesForDate(date);
            var hasHyroxClass = classes.some(function (classEntry) { return normalizeClassType(classEntry.classType || classEntry.type || classEntry.kind || classEntry.title || classEntry.name) === "hyrox"; });
            var hasCrossWorkout = Boolean(workout && (workout.warmup || workout.strength || workout.wod));
            if (hasHyroxClass || !hasCrossWorkout) mode = "hyrox";
        }
        return {
            workout: workout,
            hyroxWorkout: getHyroxWorkoutForDate(date),
            activeClass: activeClass,
            mode: mode
        };
    }
    function getForcedMode() {
        /* TV LG v17: o link normal é sempre automático.
           Para testes manuais usar apenas ?force=hyrox ou ?force=cross.
           Ignoramos mode/tipo antigos para evitar a TV ficar presa em HYROX por cache/autocomplete. */
        var raw = String(getQueryParam("force") || getQueryParam("forcar") || getQueryParam("forçar") || "").trim().toLowerCase();
        if (!raw || raw === "auto" || raw === "automatico" || raw === "automático") return "";
        return normalizeClassType(raw);
    }
    function renderHyroxTv(hyroxWorkout, activeClass, date) {
        var workout = hyroxWorkout || createFallbackHyroxWorkout(date);
        var publicBlocks = normalizeHyroxBlocks(workout.blocks).filter(function (block) { return !isCoachNotesBlock(block); });
        var title = String(workout.title || "HYROX Session").trim();
        tv.els.workoutName.textContent = title;
        tv.els.workoutName.classList.remove("is-hidden");
        tv.els.workoutTags.innerHTML = renderTags([
            "HYROX",
            activeClass ? "".concat(activeClass.time, "-").concat(activeClass.endTime) : "Sem aula ativa",
            "".concat(publicBlocks.length, " blocos")
        ]);
        var countClass = publicBlocks.length ? " hyrox-count-".concat(Math.min(publicBlocks.length, 6)) : "";
        tv.els.workoutSections.className = "workout-sections hyrox-sections".concat(countClass);
        tv.els.workoutSections.innerHTML = publicBlocks.length ? publicBlocks.map(renderHyroxBlock).join("") : "<article class=\"empty-tv-card\">Ainda n\u00E3o h\u00E1 programa\u00E7\u00E3o HYROX p\u00FAblica para ".concat(escapeHtml(formatDateShort(date)), ".</article>");
    }
    function renderHyroxCommunity() {
        tv.els.topResults.innerHTML = emptySmall("Sem ranking em aulas HYROX.");
        tv.els.activityFeed.innerHTML = emptySmall("TV em modo HYROX.");
        if (tv.els.commentFeed)
            tv.els.commentFeed.innerHTML = "";
    }
    function renderHyroxBlock(block) {
        var title = block.title || getHyroxBlockTypeLabel(block.type);
        var duration = String(block.duration || "").trim();
        var body = cleanBlockText(block.content || "");
        var lines = body ? body.split("\n").filter(function (line) { return line.trim(); }).length : 0;
        var words = body ? body.split(/\s+/).filter(Boolean).length : 0;
        var densityClass = lines >= 12 || words >= 55 || body.length >= 320 ? " hyrox-extra-long" : lines >= 8 || words >= 38 || body.length >= 220 ? " hyrox-long" : "";
        return "\n    <article class=\"block-card hyrox-block hyrox-".concat(escapeAttr(normalizeHyroxBlockType(block.type))).concat(densityClass, "\">\n      <div class=\"block-head hyrox-block-head\">\n        <div>\n          <span>").concat(escapeHtml(getHyroxBlockTypeLabel(block.type)), "</span>\n          <h3>").concat(escapeHtml(title), "</h3>\n        </div>\n        ").concat(duration ? "<strong>".concat(escapeHtml(duration), "</strong>") : "", "\n      </div>\n      <div class=\"block-body hyrox-block-body\"><pre>").concat(escapeHtml(body || "Sem conte\xFAdo programado."), "</pre></div>\n    </article>\n  ");
    }
    function scheduleHyroxLayoutFit() {
        clearHyroxLayoutFit();
        tv.hyroxFitTimer = window.setTimeout(fitHyroxLayout, 80);
    }
    function clearHyroxLayoutFit() {
        if (tv.hyroxFitTimer)
            window.clearTimeout(tv.hyroxFitTimer);
        tv.hyroxFitTimer = null;
    }
    function fitHyroxLayout() {
        var sections = tv.els.workoutSections;
        if (!sections || !document.body.classList.contains("tv-hyrox-mode"))
            return;
        sections.classList.remove("hyrox-fit-tight", "hyrox-fit-ultra", "hyrox-scroll-fallback", "hyrox-block-scroll-fallback");
        sections.style.removeProperty("--hyrox-body-font");
        sections.style.removeProperty("--hyrox-title-font");
        sections.style.removeProperty("--hyrox-label-font");
        sections.style.removeProperty("--hyrox-duration-font");
        sections.style.removeProperty("--hyrox-body-pad");
        sections.style.removeProperty("--hyrox-head-pad");
        sections.style.removeProperty("--hyrox-line-height");
        var firstPre = sections.querySelector(".hyrox-block-body pre");
        var firstTitle = sections.querySelector(".hyrox-block-head h3");
        var firstLabel = sections.querySelector(".hyrox-block-head span");
        var firstDuration = sections.querySelector(".hyrox-block-head strong");
        if (!firstPre)
            return;
        var baseBodyFont = parseFloat(window.getComputedStyle(firstPre).fontSize) || 28;
        var baseTitleFont = firstTitle ? parseFloat(window.getComputedStyle(firstTitle).fontSize) || 34 : 34;
        var baseLabelFont = firstLabel ? parseFloat(window.getComputedStyle(firstLabel).fontSize) || 15 : 15;
        var baseDurationFont = firstDuration ? parseFloat(window.getComputedStyle(firstDuration).fontSize) || 18 : 18;
        var setScale = function (scale2) {
            var bodyFont = Math.max(31, Math.round(baseBodyFont * scale2));
            var titleFont = Math.max(17, Math.round(baseTitleFont * scale2));
            var labelFont = Math.max(9, Math.round(baseLabelFont * scale2));
            var durationFont = Math.max(10, Math.round(baseDurationFont * scale2));
            var lineHeight = scale2 < 0.82 ? "0.99" : "1.04";
            Array.from(sections.querySelectorAll(".hyrox-block-body pre")).forEach(function (el) { el.style.fontSize = bodyFont + "px"; el.style.lineHeight = lineHeight; });
            Array.from(sections.querySelectorAll(".hyrox-block-head h3")).forEach(function (el) { el.style.fontSize = titleFont + "px"; el.style.lineHeight = Math.max(18, titleFont + 2) + "px"; });
            Array.from(sections.querySelectorAll(".hyrox-block-head span")).forEach(function (el) { el.style.fontSize = labelFont + "px"; });
            Array.from(sections.querySelectorAll(".hyrox-block-head strong")).forEach(function (el) { el.style.fontSize = durationFont + "px"; });
        };
        var isSectionOverflowing = function () { return sections.scrollHeight > sections.clientHeight + 6 || sections.scrollWidth > sections.clientWidth + 6; };
        var isBlockOverflowing = function () { return Array.from(sections.querySelectorAll(".hyrox-block-body")).some(function (body) {
            var pre = body.querySelector("pre");
            if (!pre)
                return false;
            return pre.scrollHeight > body.clientHeight + 6 || pre.scrollWidth > body.clientWidth + 6;
        }); };
        var isOverflowing = function () { return isSectionOverflowing() || isBlockOverflowing(); };
        if (!isOverflowing())
            return;
        sections.classList.add("hyrox-fit-tight");
        var scale = 0.94;
        for (var i = 0; i < 10 && isOverflowing(); i += 1) {
            setScale(scale);
            scale -= 0.07;
            if (scale < 0.5)
                break;
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
    function scheduleHardReloadGuard() {
        if (tv.hardReloadTimer) window.clearInterval(tv.hardReloadTimer);
        tv.hardReloadTimer = window.setInterval(function () {
            if (getForcedMode()) return;
            var now = new Date();
            maybeReloadAtClassBoundary(now);
        }, 15e3);
    }
    function maybeReloadAtClassBoundary(now) {
        if (getForcedMode() || !tv.state) return;
        var date = isoDate(now);
        var classes = getClassesForDate(date);
        if (!classes.length) return;
        var nowMinutes = now.getHours() * 60 + now.getMinutes();
        var nowSeconds = now.getSeconds();
        for (var i = 0; i < classes.length; i += 1) {
            var start = minutesFromTime(classes[i].time);
            var end = minutesFromTime(classes[i].endTime);
            if (!isFinite(start) || !isFinite(end)) continue;
            var boundaryHit = false;
            if (nowMinutes === start && nowSeconds <= TV_MODE_GRACE_SECONDS) boundaryHit = true;
            if (nowMinutes === end && nowSeconds <= TV_MODE_GRACE_SECONDS) boundaryHit = true;
            if (!boundaryHit) continue;
            var key = date + "|" + String(classes[i].id || "") + "|" + classes[i].time + "|" + classes[i].endTime + "|" + nowMinutes;
            if (tv.lastBoundaryKey === key) return;
            tv.lastBoundaryKey = key;
            // A LG por vezes mantém CSS/JS em memória. No minuto da troca, forçamos nova leitura limpa.
            loadAndRender();
            return;
        }
    }

    function renderLiveClassPin(workout) {
        if (!tv.els.classPin)
            return;
        var selectedDate = (workout == null ? void 0 : workout.date) || getSelectedDate();
        var today = isoDate(/* @__PURE__ */ new Date());
        if (selectedDate !== today) {
            tv.els.classPin.classList.add("is-hidden");
            tv.els.classPin.innerHTML = "";
            return;
        }
        var pinTestMode = String(getQueryParam("pin") || "").toLowerCase() === "test" || String(getQueryParam("pin") || "") === "1";
        var classEntry = getClassPinToShowForTv(selectedDate);
        if (!classEntry && pinTestMode) {
            classEntry = getNearestClassForPinPreview(selectedDate);
        }
        if (!classEntry) {
            tv.els.classPin.classList.add("is-hidden");
            tv.els.classPin.innerHTML = "";
            return;
        }
        var code = getClassAccessCode(classEntry);
        var status = getClassPinStatusForTv(classEntry);
        if (pinTestMode && !isClassPinActive(classEntry, new Date())) {
            status.label = "Teste PIN · " + status.label;
        }
        tv.els.classPin.classList.remove("is-hidden", "is-expired", "is-waiting", "is-ended");
        if (status.tone)
            tv.els.classPin.classList.add(status.tone);
        tv.els.classPin.innerHTML = "\n    <div class=\"class-pin-heading\">\n      <span class=\"tv-kicker\">PIN da aula</span>\n      <strong>".concat(escapeHtml(classEntry.time), "-").concat(escapeHtml(classEntry.endTime), "</strong>\n    </div>\n    <div class=\"class-pin-code\">").concat(escapeHtml(code), "</div>\n    <div class=\"class-pin-meta\">").concat(escapeHtml(status.label), "</div>\n  ");
    }
    function getActiveClassForTv(date, now) {
        if (now === void 0) { now = new Date(); }
        var today = isoDate(now);
        if (date !== today) return null;
        var classes = getClassesForDate(date).filter(function (classEntry) { return !classEntry.ended; }).sort(compareClassesByStart);
        var active = [];
        for (var i = 0; i < classes.length; i += 1) {
            if (isNowInsideClassMinutes(classes[i], now)) active.push(classes[i]);
        }
        if (active.length) {
            // Se houver sobreposição acidental, ganha a aula com início mais recente.
            active.sort(function (a, b) { return minutesFromTime(b.time) - minutesFromTime(a.time); });
            return active[0];
        }
        var previewNext = String(getQueryParam("preview") || "").trim() === "1";
        if (!previewNext) return null;
        var nowMinutes = now.getHours() * 60 + now.getMinutes();
        return classes.find(function (classEntry) {
            var startMinutes = minutesFromTime(classEntry.time);
            return isFinite(startMinutes) && startMinutes > nowMinutes && startMinutes - nowMinutes <= 5;
        }) || null;
    }
    function getClassPinToShowForTv(date, now) {
        if (now === void 0) { now = new Date(); }
        var classes = getClassesForDate(date).sort(function (a, b) { return String(a.time || "").localeCompare(String(b.time || "")); });
        if (!classes.length)
            return null;
        return classes.find(function (classEntry) { return !classEntry.ended && isClassPinActive(classEntry, now); }) || null;
    }
    function getNearestClassForPinPreview(date, now) {
        if (now === void 0) { now = new Date(); }
        var classes = getClassesForDate(date).filter(function (classEntry) { return !classEntry.ended; });
        if (!classes.length)
            return null;
        classes.sort(function (a, b) {
            var aEnd = localDateTime(a.date, a.endTime || a.time).getTime();
            var bEnd = localDateTime(b.date, b.endTime || b.time).getTime();
            return Math.abs(aEnd - now.getTime()) - Math.abs(bEnd - now.getTime());
        });
        return classes[0] || null;
    }
    function getClassPinStatusForTv(classEntry, now) {
        if (now === void 0) { now = new Date(); }
        var opensAt = getClassAccessOpensAt(classEntry);
        var expiresAt = getClassAccessExpiresAt(classEntry);
        if (classEntry.ended)
            return { label: "Aula terminada", tone: "is-ended" };
        if (now < opensAt)
            return { label: "V\u00E1lido \u00E0s ".concat(formatTimeOnly(opensAt)), tone: "is-waiting" };
        if (now <= expiresAt)
            return { label: "V\u00E1lido at\u00E9 ".concat(formatTimeOnly(expiresAt)), tone: "" };
        return { label: "Expirado \u00E0s ".concat(formatTimeOnly(expiresAt)), tone: "is-expired" };
    }
    function renderCommunity(workout) {
        try {
            tv.els.topResults.innerHTML = renderTopResultsLgSafe(workout);
        }
        catch (error) {
            tv.els.topResults.innerHTML = emptyLgSafe("Erro a ler resultados.", error);
        }
        try {
            tv.els.activityFeed.innerHTML = renderActivityFeedLgSafe(workout);
        }
        catch (error) {
            tv.els.activityFeed.innerHTML = emptyLgSafe("Erro a ler live.", error);
        }
        if (tv.els.commentFeed)
            tv.els.commentFeed.innerHTML = renderCommentFeed(workout);
    }

    function renderTopResultsLgSafe(workout) {
        var rows = collectLgWodResults(workout, true).slice(0, 3);
        if (!rows.length) rows = collectLgFeedScores(workout).slice(0, 3);
        if (!rows.length) return emptyLgSafe("Sem resultados WOD.");
        return rows.map(function (result, index) {
            var value = result.__score || getLooseWodScore(result, workout) || "--";
            var name = result.__name || getLooseUserName(result) || "Atleta";
            var level = getShortResultLevel(result.metconLevel || result.level || result.version || "RX");
            return '<div class="score-row"><div class="score-rank">' + (index + 1) + '</div><div class="score-athlete"><div class="score-name"><span>' + escapeHtml(name) + '</span><span class="score-level">' + escapeHtml(level) + '</span></div></div><div class="score-value">' + escapeHtml(value) + '</div></div>';
        }).join("");
    }

    function renderActivityFeedLgSafe(workout) {
        var feed = collectLgFeedItems(workout).slice(0, 3);
        if (feed.length) {
            return feed.map(function (item) {
                var name = getLooseUserName(item) || "Atleta";
                var text = formatActivityTextForTv(item.text || item.description || item.body || item.message || "Registou atividade.");
                return '<article class="activity-row"><strong>' + escapeHtml(name) + '</strong><span>' + escapeHtml(formatDateTime(item.createdAt || item.updatedAt || item.date)) + '</span><p>' + escapeHtml(text) + '</p></article>';
            }).join("");
        }
        var results = collectLgWodResults(workout, false).slice(0, 3);
        if (!results.length) return emptyLgSafe("Sem atividade recente.");
        return results.map(function (result) {
            var name = getLooseUserName(result) || "Atleta";
            var score = result.__score || getLooseWodScore(result, workout) || "WOD";
            return '<article class="activity-row"><strong>' + escapeHtml(name) + '</strong><span>Resultado · ' + escapeHtml(formatDateTime(result.updatedAt || result.createdAt || result.date)) + '</span><p>WOD ' + escapeHtml(score) + '</p></article>';
        }).join("");
    }

    function collectLgWodResults(workout, sortForScore) {
        var direct = [];
        var all = tv.state && tv.state.results ? tv.state.results : [];
        for (var i = 0; i < all.length; i += 1) {
            var result = all[i];
            if (!result || typeof result !== "object") continue;
            var score = getLooseWodScore(result, workout);
            if (!score) continue;
            var copy = copyLgRecord(result);
            copy.__score = score;
            copy.__name = getLooseUserName(result);
            direct.push(copy);
        }
        var exact = [];
        if (workout) {
            for (var e = 0; e < direct.length; e += 1) {
                if (isLgResultForWorkout(direct[e], workout)) exact.push(direct[e]);
            }
        }
        var source = workout ? exact : direct;
        source.sort(function (a, b) {
            if (sortForScore && workout) {
                var compared = compareLgScores(a.__score, b.__score, workout.scoreType || "time");
                if (compared !== 0) return compared;
            }
            return String(b.updatedAt || b.createdAt || b.date || "").localeCompare(String(a.updatedAt || a.createdAt || a.date || ""));
        });
        return source;
    }

    function collectLgFeedScores(workout) {
        var feed = collectLgFeedItems(workout);
        var rows = [];
        for (var i = 0; i < feed.length; i += 1) {
            var item = feed[i];
            var text = item.text || item.description || item.body || item.message || "";
            var score = extractMetconScoreFromText(text, workout && workout.scoreType || "");
            if (!score) score = getLooseWodScore(item, workout);
            if (!score) continue;
            var copy = copyLgRecord(item);
            copy.__score = score;
            copy.__name = getLooseUserName(item);
            rows.push(copy);
        }
        return rows;
    }

    function collectLgFeedItems(workout) {
        var feed = tv.state && tv.state.feed ? tv.state.feed : [];
        var exact = [];
        var any = [];
        for (var i = 0; i < feed.length; i += 1) {
            var item = feed[i];
            if (!item || typeof item !== "object") continue;
            any.push(item);
            if (!workout || isLgResultForWorkout(item, workout)) exact.push(item);
        }
        var source = workout ? exact : any;
        source.sort(function (a, b) { return String(b.createdAt || b.updatedAt || b.date || "").localeCompare(String(a.createdAt || a.updatedAt || a.date || "")); });
        return source;
    }

    function isLgResultForWorkout(result, workout) {
        if (!result || !workout) return false;
        var workoutId = String(result.workoutId || result.wodId || result.sessionId || result.trainingId || result.workout_id || result.resultWorkoutId || (result.workout && result.workout.id) || (result.result && result.result.workoutId) || "");
        var workoutDate = String(workout.date || "").slice(0, 10);
        var resultDate = String(result.workoutDate || result.workout_date || result.date || result.day || (result.workout && result.workout.date) || (result.result && result.result.workoutDate) || "").slice(0, 10);
        var createdDate = String(result.createdAt || result.updatedAt || result.created_at || result.updated_at || "").slice(0, 10);
        var recordId = String(result.id || result.resultId || result.feedId || "");
        if (workoutId && String(workoutId) === String(workout.id || "")) return true;
        if (workoutId && workoutDate && String(workoutId).indexOf(workoutDate) >= 0) return true;
        if (recordId && String(workout.id || "") && recordId.indexOf(String(workout.id || "")) >= 0) return true;
        if (recordId && workoutDate && recordId.indexOf(workoutDate) >= 0) return true;
        if (resultDate && resultDate === workoutDate) return true;
        if (createdDate && createdDate === workoutDate) return true;
        return false;
    }

    function getLooseWodScore(result, workout) {
        if (!result) return "";
        var values = [];
        values.push(result.metconScore, result.wodScore, result.wodResult, result.resultScore, result.score, result.finalScore);
        if (result.metcon && typeof result.metcon === "object") values.push(result.metcon.score, result.metcon.result, result.metcon.time, result.metcon.reps);
        if (result.wod && typeof result.wod === "object") values.push(result.wod.score, result.wod.result, result.wod.time, result.wod.reps);
        if (result.result && typeof result.result === "object") values.push(result.result.metconScore, result.result.wodScore, result.result.score);
        for (var i = 0; i < values.length; i += 1) {
            var raw = String(values[i] || "").trim();
            if (!raw) continue;
            if (looksLikeStrengthOnlyResultText(raw)) continue;
            return isDnfScore(raw) ? "DNF" : normalizeExtractedScore(raw, workout && workout.scoreType || "") || raw;
        }
        var text = String(result.text || result.description || result.body || result.message || "");
        return extractMetconScoreFromText(text, workout && workout.scoreType || "");
    }

    function getLooseUserName(record) {
        if (!record) return "";
        if (record.__name) return record.__name;
        if (record.userName) return record.userName;
        if (record.athleteName) return record.athleteName;
        if (record.name && !record.role) return record.name;
        var userId = String(record.userId || record.athleteId || record.createdBy || "");
        var users = tv.state && tv.state.users ? tv.state.users : [];
        for (var i = 0; i < users.length; i += 1) {
            if (String(users[i].id || "") === userId) return users[i].name || "Atleta";
        }
        return "Atleta";
    }

    function compareLgScores(a, b, type) {
        var direction = String(type || "time") === "time" ? "lower" : "higher";
        var av = getLgComparableScore(a, type);
        var bv = getLgComparableScore(b, type);
        if (!isFinite(av) || !isFinite(bv) || av === bv) return 0;
        return direction === "lower" ? av - bv : bv - av;
    }

    function getLgComparableScore(value, type) {
        var raw = String(value || "").trim();
        if (isDnfScore(raw)) return String(type || "time") === "time" ? 999999999 : -999999999;
        if (/^\d{1,3}:\d{1,2}$/.test(raw)) {
            var parts = raw.split(":");
            return Number(parts[0]) * 60 + Number(parts[1]);
        }
        if (/^\d+\s*\+\s*\d+$/.test(raw)) {
            var match = raw.match(/^(\d+)\s*\+\s*(\d+)$/);
            return Number(match[1]) * 1000 + Number(match[2]);
        }
        var num = String(raw).replace(",", ".").match(/-?\d+(?:\.\d+)?/);
        return num ? Number(num[0]) : Number.NaN;
    }

    function copyLgRecord(record) {
        var copy = {};
        for (var key in record) {
            if (Object.prototype.hasOwnProperty.call(record, key)) copy[key] = record[key];
        }
        return copy;
    }

    function emptyLgSafe(text, error) {
        var extra = "";
        if (getQueryParam("debug") === "1" && tv.state) {
            var d = getSelectedDate();
            extra = " R:" + ((tv.state.results || []).length) + " F:" + ((tv.state.feed || []).length) + " D:" + d + (error ? " E:" + String(error.message || error).slice(0, 40) : "");
        }
        return '<div class="activity-row"><p>' + escapeHtml(text + extra) + '</p></div>';
    }
    function getClassesForDate(date) {
        var _a;
        var list = (((_a = tv.state) == null ? void 0 : _a.classes) || []);
        return list.filter(function (classEntry) {
            var classDate = String(classEntry.date || classEntry.day || classEntry.workoutDate || "").slice(0, 10);
            return classDate === date && classEntry.time && classEntry.endTime;
        }).map(function (classEntry) {
            if (!classEntry.classType) classEntry.classType = normalizeClassType(classEntry.type || classEntry.kind || classEntry.title || classEntry.name || classEntry.label || classEntry.category || "cross");
            return classEntry;
        });
    }
    function getClassAccessOpensAt(classEntry) {
        return new Date(localDateTime(classEntry.date, classEntry.endTime).getTime() - TV_CLASS_CODE_EARLY_MINUTES * 60 * 1e3);
    }
    function getClassAccessExpiresAt(classEntry) {
        return new Date(localDateTime(classEntry.date, classEntry.endTime).getTime() + TV_CLASS_CODE_GRACE_MINUTES * 60 * 1e3);
    }
    function isClassPinActive(classEntry, now) {
        if (now === void 0) { now = new Date(); }
        return now >= getClassAccessOpensAt(classEntry) && now <= getClassAccessExpiresAt(classEntry);
    }
    function getClassAccessCode(classEntry) {
        return normalizeAccessCode(classEntry.accessCode || createClassAccessCode(classEntry));
    }
    function createClassAccessCode(classEntry) {
        var seed = "".concat(classEntry.date || "", "-").concat(classEntry.time || "", "-").concat(classEntry.endTime || "", "-").concat(classEntry.id || "");
        var hash = 23;
        String(seed).split("").forEach(function (char) {
            hash = hash * 31 + char.charCodeAt(0) >>> 0;
        });
        return String(hash % 9e3 + 1e3);
    }
    function normalizeAccessCode(value) {
        return String(value || "").replace(/\D/g, "").slice(0, 6);
    }
    function localDateTime(date, time) {
        var safeTime = normalizeTimeString(time) || "00:00";
        return /* @__PURE__ */ new Date("".concat(date, "T").concat(safeTime, ":00"));
    }
    function renderBlock(kind, title, text) {
        var cleaned = cleanBlockText(text);
        var twoColumn = kind === "strength" && shouldSplitStrengthText(cleaned) || kind === "wod" && shouldSplitWodText(cleaned);
        var body = twoColumn ? renderTwoColumnText(cleaned) : kind === "wod" ? renderTextLines(cleaned) : '<pre>' + escapeHtml(cleaned) + '</pre>';
        return '<article class="block-card ' + escapeAttr(kind) + (twoColumn ? ' is-two-column' : '') + '"><div class="block-head"><h3>' + escapeHtml(title) + '</h3></div><div class="block-body">' + body + '</div></article>';
    }
    function hasProgrammedWarmup(text) {
        var cleaned = cleanBlockText(text);
        if (!cleaned)
            return false;
        var normalized = cleaned.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
        return !(/^sem\s+warm[-\s]?up\s+programado\.?$/.test(normalized) || /^adicionar\s+warm[-\s]?up\.?$/.test(normalized) || /^adicionar\s+aquecimento\.?$/.test(normalized));
    }
    function hasProgrammedStrength(text) {
        var cleaned = cleanBlockText(text);
        if (!cleaned)
            return false;
        var normalized = cleaned.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
        return !(/^sem\s+forca\.?$/.test(normalized) || /^sem\s+strength\.?$/.test(normalized) || /^sem\s+skill\.?$/.test(normalized) || /^sem\s+forca\s*\/\s*skill\.?$/.test(normalized) || /^sem\s+forca\s*\/\s*skill\s+programado\.?$/.test(normalized) || /^sem\s+forca\s+programad[oa]\.?$/.test(normalized) || /^sem\s+strength\s+programad[oa]\.?$/.test(normalized) || /^sem\s+skill\s+programad[oa]\.?$/.test(normalized) || /^adicionar\s+forca\s*\/\s*skill\.?$/.test(normalized) || /^adicionar\s+forca\.?$/.test(normalized) || /^adicionar\s+strength\.?$/.test(normalized) || /^adicionar\s+skill\.?$/.test(normalized));
    }
    function shouldSplitStrengthText(text) {
        var cleaned = cleanBlockText(text);
        if (!cleaned)
            return false;
        var lines = cleaned.split("\n").filter(function (line) { return line.trim(); });
        return lines.length >= 12 || cleaned.length >= 420;
    }
    function shouldSplitWodText(text) {
        var cleaned = cleanBlockText(text);
        if (!cleaned)
            return false;
        var lines = cleaned.split("\n").filter(function (line) { return line.trim(); });
        return lines.length >= 9 || cleaned.length >= 300;
    }
    function renderTwoColumnText(text) {
        var _e = splitTextForColumns(text), left = _e[0], right = _e[1];
        return '<div class="block-text-columns"><div class="block-text-column">' + renderTextLines(left) + '</div><div class="block-text-column">' + renderTextLines(right) + '</div></div>';
    }
    function renderTextLines(text) {
        var lines = String(text || "").split("\n");
        if (!lines.length)
            return "";
        return '<div class="block-text-lines">' + lines.map(function (line) {
            return String(line || "").trim() ? '<div class="block-text-line">' + escapeHtml(line) + '</div>' : '<div class="block-text-line blank">&nbsp;</div>';
        }).join("") + '</div>';
    }
    function splitTextForColumns(text) {
        var lines = cleanBlockText(text).split("\n");
        if (lines.length < 2)
            return [cleanBlockText(text), ""];
        var weights = lines.map(function (line) { return Math.max(1, Math.ceil(line.length / 34)); });
        var total = weights.reduce(function (sum, value) { return sum + value; }, 0);
        var target = total / 2;
        var acc = 0;
        var rawIndex = Math.floor(lines.length / 2);
        for (var index = 0; index < weights.length; index += 1) {
            acc += weights[index];
            if (acc >= target) {
                rawIndex = index + 1;
                break;
            }
        }
        var minIndex = Math.max(1, Math.floor(lines.length * 0.28));
        var maxIndex = Math.min(lines.length - 1, Math.ceil(lines.length * 0.72));
        var splitIndex = Math.min(Math.max(rawIndex, minIndex), maxIndex);
        var searchStart = Math.max(minIndex, splitIndex - 4);
        var searchEnd = Math.min(maxIndex, splitIndex + 4);
        var bestBlankIndex = -1;
        for (var index = searchStart; index <= searchEnd; index += 1) {
            if (lines[index] && lines[index].trim())
                continue;
            if (bestBlankIndex === -1 || Math.abs(index - splitIndex) < Math.abs(bestBlankIndex - splitIndex)) {
                bestBlankIndex = index;
            }
        }
        if (bestBlankIndex > 0)
            splitIndex = bestBlankIndex + 1;
        return [lines.slice(0, splitIndex).join("\n").trim(), lines.slice(splitIndex).join("\n").trim()];
    }
    function renderTags(tags) {
        return tags.map(function (tag) { return String(tag || "").trim(); }).filter(Boolean).slice(0, 4).map(function (tag) { return "<span class=\"tv-tag\">".concat(escapeHtml(tag), "</span>"); }).join("");
    }
    function renderTopResults(workout) {
        if (!workout)
            return emptySmall("Sem WOD selecionado.");
        var rows = getResultsForWorkout(workout).map(function (result) { return __spreadProps(__spreadValues({}, result), { __tvWodScore: getTvWodScore(result, workout) }); }).filter(function (result) { return result.__tvWodScore; }).sort(function (a, b) { return compareResults(a, b, workout); });
        if (!rows.length)
            rows = getFallbackWodResults(workout).sort(function (a, b) { return compareResults(a, b, workout); });
        if (!rows.length)
            rows = getFeedWodResults(workout);
        rows = rows.slice(0, 3);
        if (!rows.length)
            return emptySmall("Ainda sem resultados de WOD.");
        return rows.map(function (result, index) {
            var _a;
            var value = result.__tvWodScore || getTvWodScore(result, workout) || result.score || "--";
            var name = result.__tvName || (isTeamResult(result) ? formatTeamResultName(result, { compact: true }) : ((_a = getUser(result.userId)) == null ? void 0 : _a.name) || result.userName || "Atleta");
            var level = getShortResultLevel(result.metconLevel || result.level || "RX");
            return '<div class="score-row"><div class="score-rank">' + (index + 1) + '</div><div class="score-athlete"><div class="score-name"><span>' + escapeHtml(name) + '</span><span class="score-level">' + escapeHtml(level) + '</span></div></div><div class="score-value">' + escapeHtml(value) + '</div></div>';
        }).join("");
    }

    function getFallbackWodResults(workout) {
        var allResults = tv.state.results || [];
        var dated = allResults.filter(function (result) {
            var directDate = String(result.workoutDate || result.date || "").slice(0, 10);
            var createdDate = String(result.createdAt || result.updatedAt || "").slice(0, 10);
            return !workout || directDate === workout.date || createdDate === workout.date;
        });
        var source = dated.length ? dated : allResults;
        return source.map(function (result) { return __spreadProps(__spreadValues({}, result), { __tvWodScore: getTvWodScore(result, workout) }); }).filter(function (result) { return result.__tvWodScore && !looksLikeStrengthOnlyResultText(result.__tvWodScore); });
    }

    function getFeedWodResults(workout) {
        var items = (tv.state.feed || []).filter(function (item) {
            var directDate = String(item.date || item.workoutDate || "").slice(0, 10);
            var createdDate = String(item.createdAt || item.updatedAt || "").slice(0, 10);
            var itemWorkout = String(item.workoutId || "");
            if (!workout)
                return true;
            return directDate === workout.date || createdDate === workout.date || !itemWorkout || itemWorkout === workout.id || itemWorkout.indexOf(workout.date) >= 0;
        }).map(function (item) {
            var score = extractMetconScoreFromText(item.text || item.description || item.body || "", workout == null ? void 0 : workout.scoreType);
            var user = getUser(item.userId);
            return {
                id: item.id || "feed-" + String(item.createdAt || Math.random()),
                userId: item.userId,
                userName: (user == null ? void 0 : user.name) || item.userName || item.author || "Atleta",
                metconLevel: item.level || item.metconLevel || "RX",
                metconScore: score,
                __tvWodScore: score,
                __tvName: (user == null ? void 0 : user.name) || item.userName || item.author || "Atleta",
                createdAt: item.createdAt || item.updatedAt || ""
            };
        }).filter(function (result) { return result.__tvWodScore; });
        return items.sort(function (a, b) { return compareResults(a, b, workout); });
    }

    function getResultTeamUserIds(result) {
        if (result === void 0) { result = {}; }
        var ids = Array.isArray(result == null ? void 0 : result.teamUserIds) ? result.teamUserIds : [];
        var fallback = (result == null ? void 0 : result.userId) ? [result.userId] : [];
        return __spreadArray([], new Set(__spreadArray([], ids.length ? ids : fallback, true).map(function (id) { return String(id || "").trim(); }).filter(Boolean)), true);
    }
    function normalizeResultTeamMode(mode, teamUserIds) {
        if (teamUserIds === void 0) { teamUserIds = []; }
        var raw = String(mode || "individual").trim().toLowerCase();
        if (["team", "equipa", "equipas", "trio", "grupo", "grupos"].includes(raw) && teamUserIds.length >= 3)
            return "team";
        if (["pair", "pairs", "pares", "dupla", "duplas"].includes(raw) && teamUserIds.length >= 2)
            return "pair";
        return "individual";
    }
    function isTeamResult(result) {
        if (result === void 0) { result = {}; }
        return ["pair", "team"].includes(normalizeResultTeamMode(result.teamMode, getResultTeamUserIds(result)));
    }
    function formatTeamResultName(result, options) {
        if (options === void 0) { options = {}; }
        var _a;
        var names = getResultTeamUserIds(result).map(function (id) {
            var _a2;
            return (_a2 = getUser(id)) == null ? void 0 : _a2.name;
        }).filter(Boolean);
        if (!names.length)
            return ((_a = getUser(result == null ? void 0 : result.userId)) == null ? void 0 : _a.name) || "Team";
        if (!options.compact)
            return names.join(" + ");
        return names.map(compactPersonName).join(" + ");
    }
    function compactPersonName(name) {
        var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
        if (parts.length <= 1)
            return parts[0] || "Atleta";
        return "".concat(parts[0], " ").concat(parts[parts.length - 1][0], ".");
    }
    function getShortResultLevel(level) {
        var raw = String(level || "RX").trim().toLowerCase();
        if (raw.startsWith("adapt"))
            return "Adap";
        if (raw === "scaled" || raw === "scale" || raw === "sc")
            return "Scale";
        return "RX";
    }
    function isDnfScore(value) {
        return /^(dnf|did not finish)$/i.test(String(value || "").trim());
    }
    function getTvWodScore(result, workout) {
        var direct = getRawWodScoreFromResult(result, workout);
        if (direct)
            return direct;
        return extractMetconScoreFromRelatedFeed(result, workout);
    }
    function getRawWodScoreFromResult(result, workout) {
        if (!result)
            return "";
        var values = [];
        var keys = ["metconScore", "wodScore", "wodResult", "metconResult", "score", "result", "value", "time", "rounds", "reps"];
        for (var i = 0; i < keys.length; i += 1) {
            var key = keys[i];
            if (result[key] !== undefined && result[key] !== null)
                values.push(result[key]);
        }
        var nested = [result.metcon, result.wod, result.scoreData, result.metconData];
        for (var n = 0; n < nested.length; n += 1) {
            var obj = nested[n];
            if (!obj || typeof obj !== "object")
                continue;
            for (var k = 0; k < keys.length; k += 1) {
                var nestedKey = keys[k];
                if (obj[nestedKey] !== undefined && obj[nestedKey] !== null)
                    values.push(obj[nestedKey]);
            }
        }
        for (var index = 0; index < values.length; index += 1) {
            var score = normalizeExtractedScore(values[index], (workout == null ? void 0 : workout.scoreType) || "");
            if (score && !looksLikeStrengthOnlyResultText(score))
                return score;
        }
        return extractMetconScoreFromText(result.text || result.description || result.body || result.notes || "", (workout == null ? void 0 : workout.scoreType) || "");
    }
    function extractMetconScoreFromRelatedFeed(result, workout) {
        if (!result || !workout)
            return "";
        var userId = String(result.userId || "").trim();
        var workoutKeys = [String(workout.id || ""), String(workout.date || "")];
        var feed = tv.state.feed || [];
        var matches = feed.filter(function (item) {
            if (userId && String(item.userId || "").trim() !== userId)
                return false;
            var itemWorkout = String(item.workoutId || "").trim();
            var itemDate = String(item.date || item.workoutDate || item.createdAt || item.updatedAt || "").slice(0, 10);
            return !itemWorkout || workoutKeys.indexOf(itemWorkout) >= 0 || itemWorkout.indexOf(workout.date) >= 0 || itemDate === workout.date;
        }).sort(function (a, b) { return String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")); });
        for (var i = 0; i < matches.length; i += 1) {
            var score = extractMetconScoreFromText(matches[i].text || matches[i].description || matches[i].body || "", workout.scoreType);
            if (score)
                return score;
        }
        return "";
    }
    function extractMetconScoreFromText(text, scoreType) {
        if (scoreType === void 0) { scoreType = ""; }
        var raw = String(text || "").replace(/\r\n/g, "\n").trim();
        if (!raw)
            return "";
        if (/\b(dnf|did not finish)\b/i.test(raw))
            return "DNF";
        var compact = raw.replace(/\s+/g, " ").trim();
        var hasWodLabel = /(^|[^a-z0-9])(metcon|wod|resultado|score)([^a-z0-9]|$)/i.test(compact);
        var strengthOnly = looksLikeStrengthOnlyResultText(compact) && !hasWodLabel;
        if (strengthOnly)
            return "";
        var labelled = compact.match(/(?:^|[^a-z0-9])(metcon|wod|resultado|score)\s*(?:do\s*wod)?\s*[:·\-]?\s*(DNF|\d{1,3}:\d{1,2}|\d+\s*\+\s*\d+|\d+(?:[,.]\d+)?(?:\s*(?:reps|rep|rondas|rounds))?)/i);
        var candidate = labelled ? labelled[2] : "";
        if (!candidate) {
            if ((scoreType || "") === "time") {
                var time = compact.match(/\b\d{1,3}:\d{1,2}\b/);
                candidate = time ? time[0] : "";
            }
            else if ((scoreType || "") === "rounds") {
                var rounds = compact.match(/\b\d+\s*\+\s*\d+\b/);
                candidate = rounds ? rounds[0] : "";
            }
            else if (hasWodLabel) {
                var number = compact.match(/\b\d+(?:[,.]\d+)?\b/);
                candidate = number ? number[0] : "";
            }
        }
        return normalizeExtractedScore(candidate, scoreType);
    }
    function normalizeExtractedScore(value, scoreType) {
        var candidate = String(value || "").trim();
        if (!candidate)
            return "";
        if (isDnfScore(candidate))
            return "DNF";
        candidate = candidate.replace(/\s+/g, " ").replace(/,/g, ".").trim();
        if ((scoreType || "") === "time" || /^\d{1,3}:\d{1,2}$/.test(candidate)) {
            var time = candidate.match(/^(\d{1,3}):(\d{1,2})$/);
            if (time) {
                var seconds = Number(time[2]);
                return String(Number(time[1])) + ":" + (seconds < 10 ? "0" + seconds : String(seconds));
            }
        }
        if ((scoreType || "") === "rounds" || /^\d+\s*\+\s*\d+$/.test(candidate)) {
            var rounds = candidate.match(/^(\d+)\s*\+\s*(\d+)$/);
            if (rounds)
                return String(Number(rounds[1])) + "+" + String(Number(rounds[2]));
        }
        var cleaned = candidate.replace(/\s*(reps|rep|rondas|rounds)$/i, "").trim();
        if (/^-?\d+(?:\.\d+)?$/.test(cleaned))
            return cleaned;
        return candidate.length <= 18 ? candidate : "";
    }
    function looksLikeStrengthOnlyResultText(text) {
        var normalized = String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
        return /(^|\s)(forca|strength|skill|top set|sets completos)(\s|$)/.test(normalized) || /(^|\s)\d+\s*rm(\s|$)/.test(normalized) || /(^|\s)1\s*rm(\s|$)/.test(normalized) || /(^|\s)\d+(?:[,.]\d+)?\s*kg(\s|$)/.test(normalized);
    }
    function renderActivityFeed(workout) {
        var workoutIds = workout ? new Set([workout.id, workout.date].filter(Boolean)) : null;
        var latestItems = (tv.state.feed || []).filter(function (item) {
            if (!workoutIds || !workout)
                return true;
            var itemWorkout = String(item.workoutId || "");
            var itemDate = String(item.date || item.createdAt || "").slice(0, 10);
            return !itemWorkout || workoutIds.has(itemWorkout) || itemWorkout.indexOf(workout.date) >= 0 || itemDate === workout.date;
        }).sort(function (a, b) { return String(b.createdAt || "").localeCompare(String(a.createdAt || "")); });
        var seenActivity = /* @__PURE__ */ new Set();
        var uniqueActivity = latestItems.filter(function (item) {
            var userKey = String(item.userId || "").trim();
            var textKey = normalizeActivityText(item.text || item.type || "");
            var key = "".concat(userKey, "|").concat(textKey);
            if (seenActivity.has(key))
                return false;
            seenActivity.add(key);
            return true;
        });
        var seenAthletes = /* @__PURE__ */ new Set();
        var byAthlete = uniqueActivity.filter(function (item) {
            var userKey = String(item.userId || item.userName || item.author || "sem-atleta").trim();
            if (!userKey || seenAthletes.has(userKey))
                return false;
            seenAthletes.add(userKey);
            return true;
        });
        var items = byAthlete.slice(0, 3);
        if (!items.length)
            return renderActivityFromResults(workout);
        return items.map(function (item) {
            var user = getUser(item.userId);
            var type = item.type === "pr" ? "PR" : "Resultado";
            return "\n        <article class=\"activity-row\">\n          <strong>".concat(escapeHtml((user == null ? void 0 : user.name) || "Atleta"), "</strong>\n          <span>").concat(escapeHtml(type), " \u00B7 ").concat(escapeHtml(formatDateTime(item.createdAt)), "</span>\n          <p>").concat(escapeHtml(formatActivityTextForTv(item.text || "Registou atividade.")), "</p>\n        </article>\n      ");
        }).join("");
    }
    function renderActivityFromResults(workout) {
        var results = getFallbackWodResults(workout).sort(function (a, b) { return String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")); }).slice(0, 3);
        if (!results.length)
            return emptySmall("Sem atividade recente.");
        return results.map(function (result) {
            var user = getUser(result.userId);
            var score = result.__tvWodScore || getTvWodScore(result, workout) || "WOD";
            return '<article class="activity-row"><strong>' + escapeHtml((user == null ? void 0 : user.name) || result.userName || "Atleta") + '</strong><span>Resultado · ' + escapeHtml(formatDateTime(result.updatedAt || result.createdAt)) + '</span><p>WOD ' + escapeHtml(score) + '</p></article>';
        }).join("");
    }

    function normalizeActivityText(text) {
        return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim().slice(0, 120);
    }
    function formatActivityTextForTv(text) {
        var cleaned = String(text || "").replace(/^registou\s+/i, "").replace(/\s+/g, " ").trim();
        if (!cleaned)
            return "Atividade registada.";
        return cleaned.length > 88 ? "".concat(cleaned.slice(0, 85).trim(), "\u2026") : cleaned;
    }
    function renderCommentFeed(workout) {
        var comments = [];
        (tv.state.results || []).forEach(function (result) {
            if (workout && !isResultForWorkout(result, workout))
                return;
            (Array.isArray(result.comments) ? result.comments : []).forEach(function (comment) {
                comments.push(__spreadProps(__spreadValues({}, comment), { resultUserId: result.userId }));
            });
        });
        var latest = comments.filter(function (comment) { return String(comment.text || "").trim(); }).sort(function (a, b) { return String(b.createdAt || "").localeCompare(String(a.createdAt || "")); }).slice(0, 3);
        if (!latest.length)
            return emptySmall("Sem coment\xE1rios recentes.");
        return latest.map(function (comment) {
            var author = getUser(comment.userId);
            return "\n        <article class=\"activity-row\">\n          <strong>".concat(escapeHtml((author == null ? void 0 : author.name) || "Coach"), "</strong>\n          <span>").concat(escapeHtml(formatDateTime(comment.createdAt)), "</span>\n          <p>").concat(escapeHtml(comment.text), "</p>\n        </article>\n      ");
        }).join("");
    }
    function emptySmall(text) {
        return "<div class=\"activity-row\"><p>".concat(escapeHtml(text), "</p></div>");
    }
    function renderDayStrip(selectedDate) {
        if (!tv.els.dayStrip)
            return;
        var days = getWeekDates(selectedDate);
        var today = isoDate(/* @__PURE__ */ new Date());
        tv.els.dayStrip.innerHTML = days.map(function (date) {
            var active = date === selectedDate;
            var isToday = date === today;
            var day = /* @__PURE__ */ new Date("".concat(date, "T12:00:00"));
            var label = isToday ? "Hoje" : day.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "");
            var number = day.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
            var classes = ["tv-day-button", active ? "is-active" : "", isToday ? "is-today" : ""].filter(Boolean).join(" ");
            return "\n        <button class=\"".concat(classes, "\" type=\"button\" data-date=\"").concat(escapeAttr(date), "\">\n          <span>").concat(escapeHtml(label), "</span>\n          <strong>").concat(escapeHtml(number), "</strong>\n        </button>\n      ");
        }).join("");
    }
    function getWeekDates(selectedDate) {
        var selected = /* @__PURE__ */ new Date("".concat(selectedDate, "T12:00:00"));
        var dayIndex = selected.getDay();
        var mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
        var monday = new Date(selected);
        monday.setDate(selected.getDate() + mondayOffset);
        return Array.from({ length: 7 }, function (_, index) {
            var date = new Date(monday);
            date.setDate(monday.getDate() + index);
            return isoDate(date);
        });
    }
    function setSelectedDate(date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || "")))
            return;
        replaceDateQueryParam(date);
        renderTv();
    }
    function getSelectedDate() {
        var explicitDate = getExplicitSelectedDateFromQuery();
        if (explicitDate)
            return explicitDate;
        // Atalho prático: /tv-lg.html?force=hyrox passa a abrir a próxima sessão HYROX com conteúdo.
        // Assim, se o treino HYROX estiver no sábado, não fica preso ao dia de hoje.
        if (getForcedMode() === "hyrox") {
            var hyroxDate = getNearestHyroxWorkoutDate();
            if (hyroxDate)
                return hyroxDate;
        }
        return isoDate(/* @__PURE__ */ new Date());
    }

    function getExplicitSelectedDateFromQuery() {
        var requested = String(getQueryParam("date") || "").trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(requested))
            return requested;
        var dayParam = String(getQueryParam("day") || getQueryParam("dia") || "").trim();
        return resolveWeekdayQuery(dayParam);
    }

    function resolveWeekdayQuery(value) {
        var normalized = String(value || "").toLowerCase();
        try { normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (error) {}
        normalized = normalized.replace(/[^a-z0-9]/g, "");
        if (!normalized)
            return "";
        var map = {
            seg: 1, segunda: 1, monday: 1, mon: 1,
            ter: 2, terca: 2, tuesday: 2, tue: 2,
            qua: 3, quarta: 3, wednesday: 3, wed: 3,
            qui: 4, quinta: 4, thursday: 4, thu: 4,
            sex: 5, sexta: 5, friday: 5, fri: 5,
            sab: 6, sabado: 6, saturday: 6, sat: 6,
            dom: 0, domingo: 0, sunday: 0, sun: 0
        };
        if (!(normalized in map))
            return "";
        var today = /* @__PURE__ */ new Date();
        var target = map[normalized];
        var diff = target - today.getDay();
        if (diff < 0)
            diff += 7;
        var date = new Date(today);
        date.setDate(today.getDate() + diff);
        return isoDate(date);
    }

    function getNearestHyroxWorkoutDate() {
        var today = isoDate(/* @__PURE__ */ new Date());
        var stateList = tv.state && Array.isArray(tv.state.hyroxWorkouts) ? tv.state.hyroxWorkouts : [];
        var cachedList = loadCachedHyroxWorkouts();
        var source = stateList.concat(cachedList);
        var byDate = {};
        source.forEach(function (workout) {
            var date = String(workout && workout.date || "").slice(0, 10);
            if (!date)
                return;
            var blocks = normalizeHyroxBlocks(workout.blocks || []).filter(function (block) { return !isCoachNotesBlock(block); });
            if (blocks.length)
                byDate[date] = true;
        });
        var dates = Object.keys(byDate).sort();
        if (!dates.length)
            return "";
        if (dates.indexOf(today) >= 0)
            return today;
        for (var i = 0; i < dates.length; i += 1) {
            if (dates[i] >= today)
                return dates[i];
        }
        return dates[dates.length - 1] || "";
    }

    function hasPublicHyroxWorkoutForDate(date) {
        var stateList = tv.state && Array.isArray(tv.state.hyroxWorkouts) ? tv.state.hyroxWorkouts : [];
        var cachedList = loadCachedHyroxWorkouts();
        var source = stateList.concat(cachedList);
        for (var i = 0; i < source.length; i += 1) {
            var workout = source[i];
            if (String(workout && workout.date || "").slice(0, 10) !== date)
                continue;
            var blocks = normalizeHyroxBlocks(workout.blocks || []).filter(function (block) { return !isCoachNotesBlock(block); });
            if (blocks.length)
                return true;
        }
        return false;
    }
    function getWorkoutForDate(date) {
        return (tv.state.workouts || []).find(function (workout) { return workout.date === date; }) || null;
    }
    function getHyroxWorkoutForDate(date) {
        var current = (tv.state.hyroxWorkouts || []).find(function (workout) { return workout.date === date; });
        var currentPublicBlocks = current ? normalizeHyroxBlocks(current.blocks || []).filter(function (block) { return !isCoachNotesBlock(block); }) : [];
        if (current && currentPublicBlocks.length)
            return current;
        var cached = loadCachedHyroxWorkouts().find(function (workout) { return workout.date === date; });
        var cachedPublicBlocks = cached ? normalizeHyroxBlocks(cached.blocks || []).filter(function (block) { return !isCoachNotesBlock(block); }) : [];
        if (cached && cachedPublicBlocks.length)
            return cached;
        return current || createFallbackHyroxWorkout(date);
    }
    function createFallbackHyroxWorkout(date) {
        return {
            id: "hyrox-".concat(date),
            date: date,
            title: "HYROX Session",
            blocks: []
        };
    }
    function normalizeClassType(value) {
        var raw = String(value || "").trim().toLowerCase();
        if (raw.indexOf("hyrox") >= 0 || raw === "h" || raw === "hyrox365")
            return "hyrox";
        if (raw.indexOf("cross") >= 0 || raw.indexOf("crosstraining") >= 0 || raw === "crossfit" || raw === "wod")
            return "cross";
        return "cross";
    }
    function normalizeHyroxBlockType(value) {
        var raw = String(value || "part").trim().toLowerCase().replace(/[\s-]+/g, "_");
        if (["coach_notes", "coachnotes", "notes", "notas", "private", "privado"].includes(raw))
            return "coach_notes";
        if (["warmup", "warm_up", "aquecimento"].includes(raw))
            return "warmup";
        if (["finisher", "final"].includes(raw))
            return "finisher";
        if (["cooldown", "cool_down", "retorno", "alongamentos"].includes(raw))
            return "cooldown";
        return "part";
    }
    function getHyroxBlockTypeLabel(type) {
        var labels = { warmup: "Warmup", part: "Part", finisher: "Finisher", cooldown: "Cooldown", coach_notes: "Coach Notes" };
        return labels[normalizeHyroxBlockType(type)] || "Part";
    }
    function normalizeHyroxBlocks(blocks) {
        if (blocks === void 0) { blocks = []; }
        return (Array.isArray(blocks) ? blocks : []).map(function (block, index) { return ({
            id: String((block == null ? void 0 : block.id) || "hb-".concat(index)),
            type: normalizeHyroxBlockType(block == null ? void 0 : block.type),
            title: String((block == null ? void 0 : block.title) || getHyroxBlockTypeLabel(block == null ? void 0 : block.type)).trim(),
            duration: String((block == null ? void 0 : block.duration) || (block == null ? void 0 : block.scheme) || "").trim(),
            content: String((block == null ? void 0 : block.content) || (block == null ? void 0 : block.body) || (block == null ? void 0 : block.text) || "").replace(/\r\n/g, "\n").trim()
        }); });
    }
    function isCoachNotesBlock(block) {
        return normalizeHyroxBlockType(block == null ? void 0 : block.type) === "coach_notes" || /coach\s*notes/i.test(String((block == null ? void 0 : block.title) || ""));
    }
    function normalizeWorkoutBlocks(workout) {
        var _a, _b, _c, _d;
        return {
            warmup: ((_a = workout == null ? void 0 : workout.blocks) == null ? void 0 : _a.warmup) || (workout == null ? void 0 : workout.warmup) || "",
            strength: ((_b = workout == null ? void 0 : workout.blocks) == null ? void 0 : _b.strength) || (workout == null ? void 0 : workout.strength) || "",
            metcon: ((_c = workout == null ? void 0 : workout.blocks) == null ? void 0 : _c.metcon) || (workout == null ? void 0 : workout.metcon) || (workout == null ? void 0 : workout.wod) || "",
            notes: ((_d = workout == null ? void 0 : workout.blocks) == null ? void 0 : _d.notes) || (workout == null ? void 0 : workout.notes) || ""
        };
    }
    function cleanBlockText(text) {
        return String(text || "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    }
    function getResultsForWorkout(workout) {
        if (!workout)
            return [];
        var allResults = tv.state.results || [];
        var exact = allResults.filter(function (result) { return isResultForWorkout(result, workout); });
        if (exact.length)
            return exact;
        return allResults.filter(function (result) {
            var directDate = String(result.workoutDate || result.date || "").slice(0, 10);
            var createdDate = String(result.createdAt || result.updatedAt || "").slice(0, 10);
            return directDate === workout.date || createdDate === workout.date;
        });
    }
    function isResultForWorkout(result, workout) {
        if (!result || !workout)
            return false;
        if (result.workoutId && result.workoutId === workout.id)
            return true;
        var resultDate = result.workoutDate || getWorkoutDateFromId(result.workoutId);
        return Boolean(resultDate && resultDate === workout.date);
    }
    function getWorkoutDateFromId(workoutId) {
        var match = String(workoutId || "").match(/\d{4}-\d{2}-\d{2}/);
        return match ? match[0] : "";
    }
    function compareResults(a, b, workout) {
        var type = (workout == null ? void 0 : workout.scoreType) || "time";
        var aScore = getComparableScore(a, type);
        var bScore = getComparableScore(b, type);
        var bothComparable = Number.isFinite(aScore.value) && Number.isFinite(bScore.value);
        if (bothComparable && aScore.value !== bScore.value) {
            return aScore.direction === "lower" ? aScore.value - bScore.value : bScore.value - aScore.value;
        }
        return String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""));
    }
    function getComparableScore(result, type) {
        var raw = String(result.__tvWodScore || result.metconScore || result.score || result.strengthLoad || result.prRawValue || "").trim();
        if (isDnfScore(raw))
            return { value: type === "time" ? 999999999 : -999999999, direction: type === "time" ? "lower" : "higher" };
        if (type === "time")
            return { value: parseTimeToSeconds(raw), direction: "lower" };
        if (type === "rounds")
            return { value: parseRounds(raw), direction: "higher" };
        return { value: parseNumber(raw), direction: "higher" };
    }
    function parseTimeToSeconds(value) {
        var match = String(value || "").trim().match(/^(\d{1,3}):(\d{1,2})$/);
        if (!match)
            return Number.NaN;
        return Number(match[1]) * 60 + Number(match[2]);
    }
    function parseRounds(value) {
        var match = String(value || "").trim().match(/^(\d+)\s*\+\s*(\d+)$/);
        if (!match)
            return Number.NaN;
        return Number(match[1]) * 1e3 + Number(match[2]);
    }
    function parseNumber(value) {
        var match = String(value || "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : Number.NaN;
    }
    function getUser(userId) {
        return (tv.state.users || []).find(function (user) { return user.id === userId; }) || null;
    }
    function renderError(error) {
        tv.els.workoutName.textContent = "Erro ao carregar TV";
        tv.els.workoutName.classList.remove("is-hidden");
        tv.els.workoutTags.innerHTML = "";
        tv.els.workoutSections.innerHTML = "<article class=\"empty-tv-card\">".concat(escapeHtml((error == null ? void 0 : error.message) || "Erro desconhecido."), "</article>");
        tv.els.topResults.innerHTML = emptySmall("Sem dados.");
        tv.els.activityFeed.innerHTML = emptySmall("Sem dados.");
        if (tv.els.commentFeed)
            tv.els.commentFeed.innerHTML = emptySmall("Sem dados.");
        tv.els.lastUpdated.textContent = "\xDAltima atualiza\xE7\xE3o: --";
    }
    function setStatus(text) {
        if (tv.els.status)
            tv.els.status.textContent = text;
    }
    function isoDate(date) {
        var local = new Date(date.getTime() - date.getTimezoneOffset() * 6e4);
        return local.toISOString().slice(0, 10);
    }
    function formatDateLong(iso) {
        var date = /* @__PURE__ */ new Date("".concat(iso, "T12:00:00"));
        return date.toLocaleDateString("pt-PT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }
    function formatDateShort(iso) {
        var date = /* @__PURE__ */ new Date("".concat(iso, "T12:00:00"));
        return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
    }
    function formatDateTime(value) {
        if (!value)
            return "--";
        var date = new Date(value);
        if (Number.isNaN(date.getTime()))
            return "--";
        return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    }
    function formatTimeOnly(value) {
        var date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime()))
            return "--:--";
        return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    }
    function escapeHtml(value) {
        return String(value != null ? value : "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
    function escapeAttr(value) {
        return escapeHtml(value).replace(/`/g, "&#096;");
    }
})();
