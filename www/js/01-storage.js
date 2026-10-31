// ── DDStore — IndexedDB-backed storage, drop-in replacement for localStorage ──
// IndexedDB is the sole store of record. Nothing in the game reads or writes
// DDStore until DDStore.whenReady() has resolved — the entire early-boot sequence
// (and the handful of top-level state variables it hydrates, like the character
// list) is deferred behind that promise. Because nothing reads DDStore before it's
// ready, DDStore never needs to fall back to reading real localStorage while it
// waits, which means localStorage is never kept as a permanent mirror and never
// competes for its own small (~5-10MB) quota — everything lives in IndexedDB,
// which has a far larger quota, so long-running saves never run out of room.
// On first run for an existing player, anything already sitting in localStorage
// (from a version of the game that used it directly) is copied into IndexedDB
// once, then cleared — it's fully migrated and never read again after that.
// If this browser has no IndexedDB support at all, DDStore transparently falls
// back to using localStorage directly as the store, so the game still works —
// just bound by localStorage's normal quota, same as before IndexedDB existed.
// Parses a value read from storage, falling back safely if it's missing OR corrupted
// (a raw `JSON.parse(x || fallback)` only guards a missing key, not malformed content).
function _jsonParseSafe(str, fallbackStr) {
  try { return JSON.parse(str || fallbackStr); }
  catch (e) {
    try { return JSON.parse(fallbackStr); }
    catch (e2) { return null; }
  }
}

var DDStore = (function() {
  var DB_NAME = 'dd_game_db';
  var STORE_NAME = 'kv';
  var DB_VERSION = 1;
  var cache = {};
  var ready = false;
  var db = null;
  var usingLocalStorageFallback = false;

  function realGet(k) {
    try { return window.localStorage.getItem(k); } catch (e) { return null; }
  }
  function realSet(k, v) {
    try { window.localStorage.setItem(k, v); } catch (e) {}
  }
  function realRemove(k) {
    try { window.localStorage.removeItem(k); } catch (e) {}
  }
  function realKeysList() {
    try { return Object.keys(window.localStorage); } catch (e) { return []; }
  }

  function getItem(key) {
    return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : null;
  }

  // BUGFIX: setItem() used to open a brand-new IndexedDB readwrite transaction
  // for every single call. Autosaves fire very frequently during normal play
  // (every room, every search, every combat action) and some of the values
  // being written (dd_chars especially) can be hundreds of KB — a burst of
  // game state changes close together (finishing a floor, descending, the
  // shop opening) could fire several of these large writes within the same
  // second, each its own transaction. That's exactly the kind of write
  // pressure real WebKit/IndexedDB has known crash-prone edges around, in a
  // way a desktop testing environment's different IndexedDB implementation
  // never reproduces. Batch rapid writes into one transaction instead.
  var pendingWrites = {};
  var flushTimer = null;
  var FLUSH_DELAY = 400;

  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(flushPending, FLUSH_DELAY);
  }

  function flushPending() {
    flushTimer = null;
    if (!db) return;
    var keys = Object.keys(pendingWrites);
    if (!keys.length) return;
    var batch = pendingWrites;
    pendingWrites = {};
    try {
      var tx = db.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      keys.forEach(function(k) {
        var v = batch[k];
        if (v === null) store.delete(k);
        else store.put(v, k);
      });
      tx.onerror = function() { console.warn('[DDStore] batch write failed for', keys.join(',')); };
    } catch (e) { console.warn('[DDStore] batch write exception:', e.message); }
  }

  function flushPendingNow() {
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    flushPending();
  }

  function setItem(key, value) {
    value = String(value);
    cache[key] = value;
    if (usingLocalStorageFallback) { realSet(key, value); return; }
    idbPut(key, value);
  }

  function removeItem(key) {
    delete cache[key];
    if (usingLocalStorageFallback) { realRemove(key); return; }
    idbDelete(key);
  }

  function keyAt(i) {
    var keys = Object.keys(cache);
    return keys[i] !== undefined ? keys[i] : null;
  }

  function keysList() {
    return Object.keys(cache);
  }

  function idbPut(key, value) {
    if (!db) return;
    pendingWrites[key] = value;
    scheduleFlush();
  }

  function idbDelete(key) {
    if (!db) return;
    pendingWrites[key] = null;
    scheduleFlush();
  }

  function migrateFromLocalStorage() {
    // One-time: fold any pre-existing localStorage data into IndexedDB, then clear
    // it. Nothing reads localStorage synchronously anymore, so it's safe to free
    // that quota back up immediately instead of keeping it around as a mirror.
    try {
      var keys = realKeysList();
      var migrated = 0;
      keys.forEach(function(k) {
        if (!Object.prototype.hasOwnProperty.call(cache, k)) {
          var v = realGet(k);
          if (v !== null) {
            cache[k] = v;
            idbPut(k, v);
            migrated++;
          }
        }
      });
      // Wipe all keys except dd_lang — that one must stay in localStorage so the
      // early-boot translation script (which runs before DDStore is ready) can
      // still read the player's language preference on every page load.
      keys.forEach(function(k) { if (k !== 'dd_lang') realRemove(k); });
      if (migrated) console.log('[DDStore] Migrated ' + migrated + ' key(s) from localStorage to IndexedDB.');
    } catch (e) {
      console.warn('[DDStore] migration exception:', e.message);
    }
  }

  function init() {
    return new Promise(function(resolve) {
      function useLocalStorageFallback(reason) {
        console.warn('[DDStore] ' + reason + ' — falling back to localStorage directly.');
        usingLocalStorageFallback = true;
        realKeysList().forEach(function(k) { cache[k] = realGet(k); });
        ready = true;
        resolve();
      }

      if (!window.indexedDB) { useLocalStorageFallback('IndexedDB not available'); return; }

      var req;
      try {
        req = window.indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        useLocalStorageFallback('IndexedDB open threw: ' + e.message);
        return;
      }
      req.onupgradeneeded = function(e) {
        var _db = e.target.result;
        if (!_db.objectStoreNames.contains(STORE_NAME)) {
          _db.createObjectStore(STORE_NAME);
        }
      };
      req.onerror = function() { useLocalStorageFallback('IndexedDB open failed'); };
      req.onsuccess = function(e) {
        db = e.target.result;
        try {
          var tx = db.transaction(STORE_NAME, 'readonly');
          var cursorReq = tx.objectStore(STORE_NAME).openCursor();
          cursorReq.onsuccess = function(ev) {
            var cursor = ev.target.result;
            if (cursor) {
              cache[cursor.key] = cursor.value;
              cursor.continue();
            } else {
              migrateFromLocalStorage();
              restoreFromBackup();
              ready = true;
              resolve();
            }
          };
          cursorReq.onerror = function() {
            migrateFromLocalStorage();
            restoreFromBackup();
            ready = true;
            resolve();
          };
        } catch (e2) {
          useLocalStorageFallback('cursor read exception: ' + e2.message);
        }
      };
    });
  }

  var readyPromise = init();

  // Best-effort: ask the browser not to evict this origin's storage under disk
  // pressure. Chrome/Firefox (and Android's WebView, which is Chromium-based —
  // what the packaged app actually runs on) honor this reasonably well. It does
  // NOT bypass Safari's own Intelligent Tracking Prevention storage cap for an
  // ordinary browser tab — that's a separate, stricter policy with no page-side
  // opt-out — but it's free, safe, and can only help elsewhere.
  try {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(function(granted) {
        console.log('[DDStore] Persistent storage ' + (granted ? 'granted' : 'not granted') + '.');
        if (!granted) {
          // Not granted — set up periodic backup to localStorage as safety net
          console.warn('[DDStore] Persistent storage not granted. Using localStorage backup for critical data.');
        }
      }).catch(function() {});
    }
  } catch (e) {}

  // ── CRITICAL DATA BACKUP ──
  // Mirror dd_chars to localStorage every time it's saved so we can restore
  // if IndexedDB gets evicted by the browser under storage pressure.
  // BUGFIX: this used to write synchronously to localStorage on every single
  // save — dd_chars alone can run hundreds of KB on a long-lived save, and a
  // real device's synchronous localStorage write cost for a large value is
  // nontrivial main-thread work, repeated on essentially every room/action.
  // Debounced the same way the IndexedDB write below is batched.
  var _backupPending = {};
  var _backupTimer = null;
  var BACKUP_FLUSH_DELAY = 400;
  function flushBackupsNow() {
    if (_backupTimer) { clearTimeout(_backupTimer); _backupTimer = null; }
    var keys = Object.keys(_backupPending);
    keys.forEach(function(k) {
      try { window.localStorage.setItem('dd_backup_' + k, _backupPending[k]); } catch(e) {}
    });
    _backupPending = {};
  }
  var _origSetItem = setItem;
  function setItemWithBackup(k, v) {
    _origSetItem(k, v);
    // Keep a localStorage backup of the most critical keys
    if (k === 'dd_chars' || k === 'dd_global_gold' || k === 'dd_diamonds' || k === 'dd_achievements' || k === 'dd_global_stats' || k === 'dd_owned_guns' || k === 'dd_audio') {
      _backupPending[k] = v;
      if (!_backupTimer) _backupTimer = setTimeout(flushBackupsNow, BACKUP_FLUSH_DELAY);
    }
  }
  setItem = setItemWithBackup;

  // On init — if IndexedDB came up empty but we have a localStorage backup, restore it
  function restoreFromBackup() {
    var backupKeys = ['dd_chars','dd_global_gold','dd_diamonds','dd_achievements','dd_global_stats','dd_owned_guns','dd_audio'];
    var restored = 0;
    backupKeys.forEach(function(k) {
      if (!cache[k]) {
        var backup = null;
        try { backup = window.localStorage.getItem('dd_backup_' + k); } catch(e) {}
        if (backup) {
          cache[k] = backup;
          idbPut(k, backup);
          restored++;
          console.log('[DDStore] Restored ' + k + ' from localStorage backup.');
        }
      }
    });
    if (restored > 0) console.log('[DDStore] Restored ' + restored + ' key(s) from backup. IndexedDB may have been evicted.');
  }

  return {
    getItem: getItem,
    setItem: setItemWithBackup,
    removeItem: removeItem,
    key: keyAt,
    keysList: keysList,
    get length() { return keysList().length; },
    isReady: function() { return ready; },
    whenReady: function() { return readyPromise; },
    // Force any debounced IndexedDB/localStorage-backup writes out immediately —
    // call before the page might actually go away (unload, backgrounding).
    flushNow: function() { flushPendingNow(); flushBackupsNow(); }
  };
})();
