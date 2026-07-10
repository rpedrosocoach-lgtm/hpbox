(function (window) {
  "use strict";

  var SECTION_KEYS = [
    "meta",
    "users",
    "movements",
    "workouts",
    "hyroxWorkouts",
    "classes",
    "deletedUsers",
    "deletedClasses",
    "results",
    "prs",
    "feed",
    "notifications",
    "workoutUnlocks",
    "masterPins",
  ];
  var ARRAY_SECTIONS = SECTION_KEYS.filter(function (section) { return section !== "meta"; });

  function normalizedMode(mode) {
    return String(mode || "hybrid").toLowerCase();
  }

  function isHybridMode(mode) {
    return normalizedMode(mode) === "hybrid";
  }

  function shouldTrySectionedRemoteState(mode) {
    mode = normalizedMode(mode);
    return ["hybrid", "sectioned", "sections", "split"].indexOf(mode) >= 0;
  }

  function shouldAllowLegacyRemoteStateFallback(mode) {
    mode = normalizedMode(mode);
    return mode !== "sectioned" && mode !== "sections" && mode !== "split-only";
  }

  function isMissingRemoteTableError(error) {
    var code = String((error && error.code) || "").toUpperCase();
    var text = [error && error.message, error && error.details, error && error.hint]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return code === "42P01" || code === "PGRST205" || text.indexOf("does not exist") >= 0 || text.indexOf("schema cache") >= 0;
  }

  function withTimeout(promise, ms, timeoutLabel) {
    return new Promise(function (resolve, reject) {
      var timer = window.setTimeout(function () { reject(new Error(timeoutLabel || "remote-timeout")); }, ms || 12000);
      Promise.resolve(promise)
        .then(function (value) {
          window.clearTimeout(timer);
          resolve(value);
        })
        .catch(function (error) {
          window.clearTimeout(timer);
          reject(error);
        });
    });
  }

  function createSectionedRemoteRows(payload, options) {
    var safePayload = payload || {};
    var updatedAt = (options && options.updatedAt) || new Date().toISOString();
    var stateId = (options && options.onlineStateId) || "hpbox-pilot";
    var currentVersion = (options && options.currentVersion) || 20;
    return SECTION_KEYS.map(function (section) {
      var sectionPayload;
      if (section === "meta") sectionPayload = { version: safePayload.version || currentVersion };
      else if (ARRAY_SECTIONS.indexOf(section) >= 0) sectionPayload = Array.isArray(safePayload[section]) ? safePayload[section] : [];
      else sectionPayload = safePayload[section] || null;
      return {
        state_id: stateId,
        section: section,
        payload: sectionPayload,
        updated_at: updatedAt,
      };
    });
  }

  function assemblePayloadFromRemoteSections(rows, currentVersion) {
    if (!Array.isArray(rows) || !rows.length) return null;
    var payload = { version: currentVersion || 20 };
    ARRAY_SECTIONS.forEach(function (section) { payload[section] = []; });
    rows.forEach(function (row) {
      var section = String((row && row.section) || "").trim();
      if (!section) return;
      var value = row && row.payload;
      if (section === "meta") {
        payload.version = Number((value && value.version) || payload.version || currentVersion || 20);
        return;
      }
      if (ARRAY_SECTIONS.indexOf(section) >= 0) payload[section] = Array.isArray(value) ? value : [];
    });
    if (!Array.isArray(payload.users) || !Array.isArray(payload.workouts)) return null;
    return payload;
  }

  function maxRemoteUpdatedAt(rows) {
    return (rows || [])
      .map(function (row) { return String((row && row.updated_at) || ""); })
      .filter(Boolean)
      .sort()
      .pop() || "";
  }

  function recordUpdatedAt(record, fallback) {
    var raw = record && (record.updatedAt || record.modifiedAt || record.createdAt || record.endedAt);
    var parsed = raw ? new Date(raw).getTime() : 0;
    if (isFinite(parsed) && parsed > 0) return parsed;
    var fallbackParsed = fallback ? new Date(fallback).getTime() : 0;
    return isFinite(fallbackParsed) ? fallbackParsed : 0;
  }

  function normalizeKeyPart(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function dateFromRecord(record) {
    record = record || {};
    var direct = String(record.date || record.workoutDate || "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
    var match = String(record.id || record.workoutId || "").match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : "";
  }


  function hasDuplicateDatedRecords(records) {
    var seen = {};
    return (records || []).some(function (record) {
      var key = dateFromRecord(record) || String((record && record.id) || "");
      if (!key) return false;
      if (seen[key]) return true;
      seen[key] = true;
      return false;
    });
  }

  function remoteRecordKey(section, record, index) {
    record = record || {};
    if (section === "users") return normalizeKeyPart(record.id || record.loginName || record.name);
    if (section === "movements") return normalizeKeyPart(record.id || record.name);
    if (section === "workouts" || section === "hyroxWorkouts") return normalizeKeyPart(dateFromRecord(record) || record.id);
    if (section === "classes") return normalizeKeyPart(record.id || [record.date, record.time].join("|"));
    if (section === "deletedUsers") return normalizeKeyPart(record.userId || record.id);
    if (section === "deletedClasses") return normalizeKeyPart([record.date, record.time].join("|"));
    if (section === "results") return normalizeKeyPart(record.id || [record.userId, record.workoutId || record.workoutDate, record.createdAt].join("|"));
    if (section === "prs") return normalizeKeyPart(record.id || [record.userId, record.movementId || record.movement, record.prType, record.date, record.rawValue || record.value].join("|"));
    if (section === "feed" || section === "notifications") return normalizeKeyPart(record.id);
    if (section === "workoutUnlocks") return normalizeKeyPart(record.id || [record.userId || record.athleteId, record.date || record.workoutDate || record.workoutId].join("|"));
    if (section === "masterPins") return normalizeKeyPart(record.id || record.code);
    return normalizeKeyPart(record.id || JSON.stringify(record) || index);
  }

  function pickNewerRemoteRecord(first, second, firstUpdatedAt, secondUpdatedAt) {
    var firstTime = recordUpdatedAt(first, firstUpdatedAt);
    var secondTime = recordUpdatedAt(second, secondUpdatedAt);
    if (secondTime > firstTime) return second;
    if (firstTime > secondTime) return first;
    return String(secondUpdatedAt || "") > String(firstUpdatedAt || "") ? second : first;
  }

  function isPlaceholderWorkoutText(value) {
    var text = String(value || "").trim();
    if (!text) return true;
    return /^(adicionar(?:\s|$)|movimento principal$|treino de (segunda|terça|quarta|quinta|sexta|sábado|domingo)$)/i.test(text);
  }

  function remoteWorkoutContentScore(record) {
    record = record || {};
    var blocks = record.blocks && typeof record.blocks === "object" ? record.blocks : {};
    var keys = ["warmup", "strength", "strengthPublicNotes", "strengthNotes", "metcon", "notes"];
    var score = 0;
    if (!isPlaceholderWorkoutText(record.title)) score += 3;
    if (!isPlaceholderWorkoutText(record.movement)) score += 2;
    keys.forEach(function (key) {
      var value = String(blocks[key] || "").trim();
      if (value && !isPlaceholderWorkoutText(value)) score += key === "strengthNotes" || key === "notes" ? 2 : 3;
    });
    if (record.strengthPlan && record.strengthPlan.rows && record.strengthPlan.rows.length) score += 4;
    return score;
  }

  function remoteWorkoutOwnTimestamp(record) {
    var raw = record && (record.updatedAt || record.modifiedAt || record.createdAt || record.endedAt);
    var parsed = raw ? new Date(raw).getTime() : 0;
    return isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function mergeRemoteWorkoutPair(first, second, section) {
    first = first || {};
    second = second || {};
    var firstTime = remoteWorkoutOwnTimestamp(first);
    var secondTime = remoteWorkoutOwnTimestamp(second);
    var firstScore = remoteWorkoutContentScore(first);
    var secondScore = remoteWorkoutContentScore(second);
    var newer = first;
    var older = second;
    if (secondTime > firstTime) {
      newer = second;
      older = first;
    } else if (firstTime === secondTime && secondScore > firstScore) {
      newer = second;
      older = first;
    }

    var newerScore = remoteWorkoutContentScore(newer);
    var olderScore = remoteWorkoutContentScore(older);
    var explicitClear = Boolean(newer.programmingClearedAt || newer.contentClearedAt || newer.clearedAt);
    var contentSource = olderScore > newerScore && !explicitClear ? older : newer;
    var fallbackSource = contentSource === newer ? older : newer;
    var date = dateFromRecord(contentSource) || dateFromRecord(fallbackSource);
    var canonicalPrefix = section === "hyroxWorkouts" ? "hyrox-" : "w-";
    var canonicalId = date ? canonicalPrefix + date : "";
    var ids = [contentSource.id, fallbackSource.id].filter(Boolean);
    var id = ids.filter(function (candidate) { return candidate === canonicalId; })[0] || ids[0] || canonicalId;
    var merged = Object.assign({}, older, newer, { id: id, date: date });

    if (section === "workouts") {
      var olderBlocks = older.blocks && typeof older.blocks === "object" ? older.blocks : {};
      var newerBlocks = newer.blocks && typeof newer.blocks === "object" ? newer.blocks : {};
      var blockKeys = ["warmup", "strength", "strengthPublicNotes", "strengthNotes", "metcon", "notes"];
      merged.blocks = Object.assign({}, olderBlocks, newerBlocks);
      blockKeys.forEach(function (key) {
        var newerValue = String(newerBlocks[key] == null ? "" : newerBlocks[key]);
        var olderValue = String(olderBlocks[key] == null ? "" : olderBlocks[key]);
        if (!newerValue.trim() && olderValue.trim() && !explicitClear) merged.blocks[key] = olderBlocks[key];
        var preferredValue = String((contentSource.blocks && contentSource.blocks[key]) || "").trim();
        if (preferredValue && !isPlaceholderWorkoutText(preferredValue)) merged.blocks[key] = contentSource.blocks[key];
      });
      ["title", "movement", "movementId"].forEach(function (key) {
        var preferred = String(contentSource[key] || "").trim();
        var fallback = String(fallbackSource[key] || "").trim();
        if (preferred && !isPlaceholderWorkoutText(preferred)) merged[key] = contentSource[key];
        else if ((!String(merged[key] || "").trim() || isPlaceholderWorkoutText(merged[key])) && fallback) merged[key] = fallbackSource[key];
      });
      if (contentSource !== newer) {
        ["published", "forceUnlocked", "classesUnlocked", "unlockTime", "scoreType", "strengthScoreType", "prType", "teamMode"].forEach(function (key) {
          if (contentSource[key] !== undefined) merged[key] = contentSource[key];
        });
      }
      if (contentSource.strengthPlan) merged.strengthPlan = contentSource.strengthPlan;
    }

    return merged;
  }

  function mergeRemoteArraySection(section, firstRecords, secondRecords, firstUpdatedAt, secondUpdatedAt) {
    var merged = new Map();
    (firstRecords || []).forEach(function (record, index) {
      var key = remoteRecordKey(section, record, index);
      if (key) merged.set(key, record);
    });
    (secondRecords || []).forEach(function (record, index) {
      var key = remoteRecordKey(section, record, index);
      if (!key) return;
      var existing = merged.get(key);
      if (!existing) {
        merged.set(key, record);
        return;
      }
      merged.set(
        key,
        section === "workouts" || section === "hyroxWorkouts"
          ? mergeRemoteWorkoutPair(existing, record, section)
          : pickNewerRemoteRecord(existing, record, firstUpdatedAt, secondUpdatedAt)
      );
    });
    return Array.from(merged.values());
  }

  function mergeRemotePayloadSnapshots(first, second, currentVersion) {
    var firstPayload = (first && first.payload) || {};
    var secondPayload = (second && second.payload) || {};
    var payload = {
      version: Math.max(Number(firstPayload.version || 0), Number(secondPayload.version || 0), Number(currentVersion || 20)),
    };
    ARRAY_SECTIONS.forEach(function (section) {
      payload[section] = mergeRemoteArraySection(
        section,
        Array.isArray(firstPayload[section]) ? firstPayload[section] : [],
        Array.isArray(secondPayload[section]) ? secondPayload[section] : [],
        first && first.updatedAt,
        second && second.updatedAt
      );
    });
    return payload;
  }

  async function fetchSectionedRemotePayload(client, options) {
    var table = options.onlineStateSectionsTable || "hpbox_pilot_state_sections";
    var stateId = options.onlineStateId || "hpbox-pilot";
    var request = client.from(table).select("section,payload,updated_at").eq("state_id", stateId);
    var result = await withTimeout(request, options.timeoutMs, "remote-load-timeout");
    if (result.error) throw result.error;
    var payload = assemblePayloadFromRemoteSections(result.data || [], options.currentVersion || 20);
    return payload
      ? { payload: payload, updatedAt: maxRemoteUpdatedAt(result.data), mode: "sectioned", tableAvailable: true }
      : { payload: null, updatedAt: "", mode: "sectioned", tableAvailable: true };
  }

  async function fetchLegacyRemotePayload(client, options) {
    var table = options.onlineStateTable || "hpbox_pilot_state";
    var stateId = options.onlineStateId || "hpbox-pilot";
    var request = client.from(table).select("payload, updated_at").eq("id", stateId).maybeSingle();
    var result = await withTimeout(request, options.timeoutMs, "remote-load-timeout");
    if (result.error) throw result.error;
    return result.data && result.data.payload
      ? { payload: result.data.payload, updatedAt: result.data.updated_at || "", mode: "legacy", tableAvailable: true }
      : { payload: null, updatedAt: "", mode: "legacy", tableAvailable: true };
  }

  async function fetchHybridRemotePayload(client, options) {
    var sectioned = null;
    var legacy = null;
    var sectionedError = null;
    var legacyError = null;
    var sectionedTableMissing = false;

    try {
      sectioned = await fetchSectionedRemotePayload(client, options);
    } catch (error) {
      sectionedError = error;
      sectionedTableMissing = isMissingRemoteTableError(error);
    }

    try {
      legacy = await fetchLegacyRemotePayload(client, options);
    } catch (error) {
      legacyError = error;
    }

    if (sectioned && sectioned.payload && legacy && legacy.payload) {
      var mergedPayload = mergeRemotePayloadSnapshots(sectioned, legacy, options.currentVersion || 20);
      return {
        payload: mergedPayload,
        updatedAt: [sectioned.updatedAt, legacy.updatedAt].filter(Boolean).sort().pop() || "",
        mode: "hybrid",
        needsSave:
          String(sectioned.updatedAt || "") !== String(legacy.updatedAt || "") ||
          hasDuplicateDatedRecords((sectioned.payload && sectioned.payload.workouts) || []) ||
          hasDuplicateDatedRecords((legacy.payload && legacy.payload.workouts) || []) ||
          hasDuplicateDatedRecords((sectioned.payload && sectioned.payload.hyroxWorkouts) || []) ||
          hasDuplicateDatedRecords((legacy.payload && legacy.payload.hyroxWorkouts) || []),
      };
    }

    if (sectioned && sectioned.payload) {
      return {
        payload: sectioned.payload,
        updatedAt: sectioned.updatedAt || "",
        mode: "sectioned",
        needsSave: !legacyError,
      };
    }

    if (legacy && legacy.payload) {
      return {
        payload: legacy.payload,
        updatedAt: legacy.updatedAt || "",
        mode: "legacy",
        needsSave: !sectionedTableMissing && !sectionedError,
      };
    }

    if (legacyError && sectionedError && !sectionedTableMissing) throw legacyError;
    if (legacyError && !sectionedTableMissing) throw legacyError;
    if (sectionedError && !sectionedTableMissing) throw sectionedError;
    return { payload: null, updatedAt: "", mode: sectionedTableMissing ? "legacy" : "hybrid", needsSave: false };
  }

  async function fetchRemotePayload(client, options) {
    options = options || {};
    if (isHybridMode(options.remoteStateMode)) return fetchHybridRemotePayload(client, options);
    if (shouldTrySectionedRemoteState(options.remoteStateMode)) {
      try {
        var sectioned = await fetchSectionedRemotePayload(client, options);
        if (sectioned.payload) return sectioned;
        if (!shouldAllowLegacyRemoteStateFallback(options.remoteStateMode)) return sectioned;
      } catch (error) {
        if (!shouldAllowLegacyRemoteStateFallback(options.remoteStateMode) || !isMissingRemoteTableError(error)) throw error;
      }
    }
    return fetchLegacyRemotePayload(client, options);
  }

  async function saveSectionedRemotePayload(client, payload, options) {
    var table = options.onlineStateSectionsTable || "hpbox_pilot_state_sections";
    var request = client
      .from(table)
      .upsert(createSectionedRemoteRows(payload, options), { onConflict: "state_id,section" });
    var result = await withTimeout(request, options.timeoutMs, "remote-save-timeout");
    if (result.error) throw result.error;
    return { mode: "sectioned" };
  }

  async function saveLegacyRemotePayload(client, payload, options) {
    var table = options.onlineStateTable || "hpbox_pilot_state";
    var request = client.from(table).upsert(
      {
        id: options.onlineStateId || "hpbox-pilot",
        payload: payload,
        updated_at: options.updatedAt || new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    var result = await withTimeout(request, options.timeoutMs, "remote-save-timeout");
    if (result.error) throw result.error;
    return { mode: "legacy" };
  }

  async function saveHybridRemotePayload(client, payload, options) {
    var legacySaved = false;
    var sectionedSaved = false;
    var legacyError = null;
    var sectionedError = null;

    try {
      await saveLegacyRemotePayload(client, payload, options);
      legacySaved = true;
    } catch (error) {
      legacyError = error;
    }

    try {
      await saveSectionedRemotePayload(client, payload, options);
      sectionedSaved = true;
    } catch (error) {
      if (!isMissingRemoteTableError(error)) sectionedError = error;
    }

    if (legacySaved && sectionedSaved) return { mode: "hybrid" };
    if (legacySaved) return { mode: "legacy" };
    if (sectionedSaved) return { mode: "sectioned" };
    throw legacyError || sectionedError || new Error("remote-save-failed");
  }

  async function saveRemotePayload(client, payload, options) {
    options = options || {};
    if (isHybridMode(options.remoteStateMode)) return saveHybridRemotePayload(client, payload, options);
    if (shouldTrySectionedRemoteState(options.remoteStateMode)) {
      try {
        return await saveSectionedRemotePayload(client, payload, options);
      } catch (error) {
        if (!shouldAllowLegacyRemoteStateFallback(options.remoteStateMode) || !isMissingRemoteTableError(error)) throw error;
      }
    }
    return saveLegacyRemotePayload(client, payload, options);
  }

  window.HPBOX_STATE_SYNC = {
    fetchRemotePayload: fetchRemotePayload,
    saveRemotePayload: saveRemotePayload,
    isMissingRemoteTableError: isMissingRemoteTableError,
    mergeRemotePayloadSnapshots: mergeRemotePayloadSnapshots,
  };
})(window);
