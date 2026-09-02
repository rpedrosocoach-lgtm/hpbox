(function (window) {
  "use strict";

  var SECTION_KEYS = [
    "meta",
    "users",
    "movements",
    "benchmarks",
    "workouts",
    "hyroxWorkouts",
    "classes",
    "deletedUsers",
    "deletedClasses",
    "deletedWeeks",
    "deletedFeed",
    "results",
    "resultEvents",
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
    var currentVersion = (options && options.currentVersion) || 22;
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
    var payload = { version: currentVersion || 22 };
    ARRAY_SECTIONS.forEach(function (section) { payload[section] = []; });
    rows.forEach(function (row) {
      var section = String((row && row.section) || "").trim();
      if (!section) return;
      var value = row && row.payload;
      if (section === "meta") {
        payload.version = Number((value && value.version) || payload.version || currentVersion || 22);
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

  function remoteRecordKey(section, record, index) {
    record = record || {};
    if (section === "users") return normalizeKeyPart(record.id || record.loginName || record.name);
    if (section === "movements") return normalizeKeyPart(record.id || record.name);
    if (section === "benchmarks") return normalizeKeyPart(record.id || record.name);
    if (section === "workouts" || section === "hyroxWorkouts") return normalizeKeyPart(record.id || record.date);
    if (section === "classes") return normalizeKeyPart(record.id || [record.date, record.time].join("|"));
    if (section === "deletedUsers") return normalizeKeyPart(record.userId || record.id);
    if (section === "deletedClasses") return normalizeKeyPart([record.date, record.time].join("|"));
    if (section === "deletedWeeks") return normalizeKeyPart(record.weekStart || record.date);
    if (section === "deletedFeed") return normalizeKeyPart(record.key || record.id || record.feedId);
    if (section === "results") return normalizeKeyPart(record.id || [record.userId, record.workoutId || record.workoutDate, record.createdAt].join("|"));
    if (section === "resultEvents") return normalizeKeyPart(record.id || [record.resultId, record.action, record.mode, record.createdAt].join("|"));
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

  function mergeNewerRemoteRecord(section, first, second, firstUpdatedAt, secondUpdatedAt) {
    var newest = pickNewerRemoteRecord(first, second, firstUpdatedAt, secondUpdatedAt);
    if (section !== "workouts") return newest;
    var older = newest === first ? second : first;
    var olderBlocks = older && typeof older.blocks === "object" ? older.blocks : {};
    var newestBlocks = newest && typeof newest.blocks === "object" ? newest.blocks : {};
    return Object.assign({}, older, newest, {
      blocks: Object.assign({}, olderBlocks, newestBlocks),
    });
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
      merged.set(key, existing ? mergeNewerRemoteRecord(section, existing, record, firstUpdatedAt, secondUpdatedAt) : record);
    });
    return Array.from(merged.values());
  }

  function mergeRemotePayloadSnapshots(first, second, currentVersion) {
    var firstPayload = (first && first.payload) || {};
    var secondPayload = (second && second.payload) || {};
    var payload = {
      version: Math.max(Number(firstPayload.version || 0), Number(secondPayload.version || 0), Number(currentVersion || 22)),
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
    var payload = assemblePayloadFromRemoteSections(result.data || [], options.currentVersion || 22);
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
      var mergedPayload = mergeRemotePayloadSnapshots(sectioned, legacy, options.currentVersion || 22);
      return {
        payload: mergedPayload,
        updatedAt: [sectioned.updatedAt, legacy.updatedAt].filter(Boolean).sort().pop() || "",
        mode: "hybrid",
        needsSave: String(sectioned.updatedAt || "") !== String(legacy.updatedAt || ""),
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
