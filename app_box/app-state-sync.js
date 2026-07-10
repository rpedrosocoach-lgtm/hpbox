(function (window) {
  "use strict";

  var SECTION_KEYS = [
    "meta",
    "users",
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

  function shouldTrySectionedRemoteState(mode) {
    mode = String(mode || "hybrid").toLowerCase();
    return ["hybrid", "sectioned", "sections", "split"].indexOf(mode) >= 0;
  }

  function shouldAllowLegacyRemoteStateFallback(mode) {
    mode = String(mode || "hybrid").toLowerCase();
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
    var currentVersion = (options && options.currentVersion) || 18;
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
    var payload = { version: currentVersion || 18 };
    ARRAY_SECTIONS.forEach(function (section) { payload[section] = []; });
    rows.forEach(function (row) {
      var section = String((row && row.section) || "").trim();
      if (!section) return;
      var value = row && row.payload;
      if (section === "meta") {
        payload.version = Number((value && value.version) || payload.version || currentVersion || 18);
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

  async function fetchSectionedRemotePayload(client, options) {
    var table = options.onlineStateSectionsTable || "hpbox_pilot_state_sections";
    var stateId = options.onlineStateId || "hpbox-pilot";
    var request = client.from(table).select("section,payload,updated_at").eq("state_id", stateId);
    var result = await withTimeout(request, options.timeoutMs, "remote-load-timeout");
    if (result.error) throw result.error;
    var payload = assemblePayloadFromRemoteSections(result.data || [], options.currentVersion || 18);
    return payload
      ? { payload: payload, updatedAt: maxRemoteUpdatedAt(result.data), mode: "sectioned" }
      : { payload: null, updatedAt: "", mode: "sectioned" };
  }

  async function fetchLegacyRemotePayload(client, options) {
    var table = options.onlineStateTable || "hpbox_pilot_state";
    var stateId = options.onlineStateId || "hpbox-pilot";
    var request = client.from(table).select("payload, updated_at").eq("id", stateId).maybeSingle();
    var result = await withTimeout(request, options.timeoutMs, "remote-load-timeout");
    if (result.error) throw result.error;
    return result.data && result.data.payload
      ? { payload: result.data.payload, updatedAt: result.data.updated_at || "", mode: "legacy" }
      : { payload: null, updatedAt: "", mode: "legacy" };
  }

  async function fetchRemotePayload(client, options) {
    options = options || {};
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

  async function saveRemotePayload(client, payload, options) {
    options = options || {};
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
  };
})(window);
