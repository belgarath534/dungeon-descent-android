// ═══════════════════════════════════════════════════════════════════════
// v12.0 — CLOUD SYNC: the whole save, between the web and the apps
//
// The cloud save ("saves/{uid}") carried only 12 keys, so gold, Endless
// Descent, the inventory, spells, guns and the rest never travelled. It now
// also has, written together with the old fields (which older app versions
// still read and write):
//   full     every dd_ key except this device's own settings, as JSON
//   savedAt  when it was written (ms)        savedBy  "web", "ios", "mac"…
// This browser remembers the savedAt it last matched (dd_sync_last) and when
// its own save last changed (dd_sync_dirty_at), and on opening the game:
//   • a newer cloud save and nothing played here since → it loads by itself
//   • progress here the cloud doesn't have → it goes up
//   • both changed → the player chooses
// It used to upload on every page load, which could overwrite newer progress
// from a phone. The same rules as the iPhone app (CloudSync.swift).
// ═══════════════════════════════════════════════════════════════════════

var CS = {
  lastKey: 'dd_sync_last',
  dirtyKey: 'dd_sync_dirty_at',
  deviceOnly: ['dd_presence_id', 'dd_dev_mode', 'dd_lang', 'dd_notif_prefs', 'dd_icloud_backup_enabled',
               'dd_last_seen', 'dd_version_seen', 'dd_shake', 'dd_music_loop'],
  // Saved by just having the game open, not by playing: synced, but not
  // progress (or every device looks changed and the game keeps asking).
  passive: ['dd_total_playtime'],
  maxBytes: 900000,
  launchDone: false,
  lastCheck: 0
};

function csSynced(k) {
  return k && k.indexOf('dd_') === 0 && k.indexOf('dd_sync_') !== 0 && CS.deviceOnly.indexOf(k) === -1;
}
function csProgress(k) { return csSynced(k) && CS.passive.indexOf(k) === -1; }
function csNum(v) { var n = Number(v); return isNaN(n) ? 0 : n; }

// Note when the save changes (not this browser's own settings).
(function() {
  var _set = DDStore.setItem, _remove = DDStore.removeItem;
  DDStore.setItem = function(k, v) {
    if (csProgress(k) && DDStore.getItem(k) !== String(v)) _set.call(DDStore, CS.dirtyKey, String(Date.now()));
    return _set.apply(DDStore, arguments);
  };
  DDStore.removeItem = function(k) {
    if (csProgress(k) && DDStore.getItem(k) !== null) _set.call(DDStore, CS.dirtyKey, String(Date.now()));
    return _remove.apply(DDStore, arguments);
  };
})();

function csFull() {
  var out = {};
  (DDStore.keysList ? DDStore.keysList() : []).forEach(function(k) {
    if (csSynced(k)) { var v = DDStore.getItem(k); if (v !== null) out[k] = v; }
  });
  var s = JSON.stringify(out);
  return s.length <= CS.maxBytes ? s : null;
}

function csDecide(cloudAt, last, dirty) {
  var cloudNewer = cloudAt > last, localChanged = dirty > last;
  if (cloudNewer && !localChanged) return 'pull';
  if (cloudNewer && localChanged) return 'ask';
  if (localChanged) return 'push';
  return 'nothing';
}

// Puts a cloud save into this browser, then reloads so every screen and
// number picks it up.
function csApply(data, message) {
  var full = {};
  try { full = data.full ? JSON.parse(data.full) : {}; } catch (e) { full = {}; }
  // The old fields on top: they're written together, and an older app may
  // have written only those since.
  var old = { chars: 'dd_chars', unlocks: 'dd_unlocks', achievements: 'dd_achievements', globalStats: 'dd_global_stats',
    coinUpgrades: 'dd_coin_upgrades', raidData: 'dd_raid', medusa: 'dd_medusa', voidReaper: 'dd_void_reaper',
    username: 'dd_username', titleTag: 'dd_title_tag', srPromptSeen: 'dd_sr_prompt_seen', accessSettings: 'dd_access' };
  Object.keys(old).forEach(function(f) { if (data[f]) full[old[f]] = data[f]; });
  Object.keys(full).forEach(function(k) { if (csSynced(k) && typeof full[k] === 'string') DDStore.setItem(k, full[k]); });
  // Loading isn't progress: this browser now matches the cloud. An old cloud
  // save has no savedAt: mark it 1, not 0. With 0, the next page load saw an
  // unsynced browser again, loaded the same save and reloaded, forever (the
  // "Migration complete" screen over and over).
  var mark = String(csNum(data.savedAt) || 1);
  DDStore.setItem(CS.lastKey, mark);
  DDStore.setItem(CS.dirtyKey, mark);
  try { DDStore.flushNow(); } catch (e) {}
  try { sessionStorage.setItem('dd_sync_message', message || 'Loaded your newer save from your other device.'); } catch (e) {}
  // Safety net: never reload twice within 30 seconds, whatever the reason.
  var lastReload = 0;
  try { lastReload = Number(sessionStorage.getItem('dd_sync_reloaded_at')) || 0; } catch (e) {}
  if (Date.now() - lastReload < 30000) {
    console.warn('[sync] skipped a second reload in a row; the save is loaded, refresh by hand if anything looks old');
    return;
  }
  try { sessionStorage.setItem('dd_sync_reloaded_at', String(Date.now())); } catch (e) {}
  setTimeout(function() { location.reload(); }, 600);
}

async function csPush(silent) {
  var user = getFirebaseUser();
  if (!user || !window._fbDb) return false;
  var savedAt = Date.now();
  var data = {
    chars: DDStore.getItem('dd_chars'), unlocks: DDStore.getItem('dd_unlocks'),
    achievements: DDStore.getItem('dd_achievements'), globalStats: DDStore.getItem('dd_global_stats'),
    coinUpgrades: DDStore.getItem('dd_coin_upgrades'), raidData: DDStore.getItem('dd_raid'),
    medusa: DDStore.getItem('dd_medusa'), voidReaper: DDStore.getItem('dd_void_reaper'),
    username: DDStore.getItem('dd_username'), titleTag: DDStore.getItem('dd_title_tag'),
    srPromptSeen: DDStore.getItem('dd_sr_prompt_seen'), accessSettings: DDStore.getItem('dd_access')
  };
  var full = csFull();
  if (full) { data.full = full; data.savedAt = savedAt; data.savedBy = 'web'; }
  try {
    await window._fbDb.collection('saves').doc(user.uid).set(data, { merge: true });
    if (full) DDStore.setItem(CS.lastKey, String(savedAt));
    return true;
  } catch (e) { console.warn('[sync] upload failed', e); return false; }
}

function csAsk(data) {
  var old = document.getElementById('sync-choice');
  if (old) old.remove();
  var d = document.createElement('div');
  d.id = 'sync-choice';
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-modal', 'true');
  d.setAttribute('aria-labelledby', 'sync-choice-title');
  d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;';
  var from = data.savedBy === 'web' ? 'another browser' : data.savedBy === 'mac' ? 'your Mac' : data.savedBy === 'vision' ? 'your Apple Vision Pro' : 'your iPhone or iPad';
  d.innerHTML = '<div style="max-width:420px;background:#0a0a0a;border:1px solid #443300;padding:22px;">' +
    '<h2 id="sync-choice-title" style="font-family:\'Cinzel Decorative\',cursive;color:#ffdd44;font-size:1.1rem;margin-bottom:10px;">Choose a save</h2>' +
    '<p style="font-family:\'Crimson Text\',serif;color:#ccc;margin-bottom:16px;">You played here and on ' + from +
    ' since they last matched. The cloud save replaces what\'s in this browser. Keeping this browser\'s save uploads it over the cloud one.</p>' +
    '<button class="menu-btn primary" id="sync-use-cloud" style="width:100%;margin-bottom:8px;">☁ Use the cloud save</button>' +
    '<button class="menu-btn" id="sync-keep-here" style="width:100%;">💻 Keep this browser\'s save</button></div>';
  document.body.appendChild(d);
  document.getElementById('sync-use-cloud').onclick = function() { d.remove(); csApply(data, 'Your cloud save is loaded.'); };
  document.getElementById('sync-keep-here').onclick = async function() {
    d.remove();
    var ok = await csPush(false);
    say(ok ? 'Kept this browser\'s save and uploaded it to the cloud.' : 'Upload failed. Check your connection.');
  };
  setTimeout(function() { document.getElementById('sync-use-cloud').focus(); }, 100);
  say('You played here and on ' + from + '. Choose which save to keep.');
}

// launch: opening the game (or signing in). Otherwise coming back to the
// tab: a newer save only loads when nothing changed here, never mid-run.
async function csCheck(launch) {
  var user = getFirebaseUser();
  if (!user || !window._fbDb) return;
  if (!launch && Date.now() - CS.lastCheck < 300000) return;
  CS.lastCheck = Date.now();
  var data = null;
  try {
    var snap = await window._fbDb.collection('saves').doc(user.uid).get();
    data = snap.exists ? snap.data() : null;
  } catch (e) { console.warn('[sync] check failed', e); return; }
  if (!data || (!data.chars && !data.full)) { await csPush(true); return; }
  var savedAt = csNum(data.savedAt);
  var last = csNum(DDStore.getItem(CS.lastKey));
  var dirty = csNum(DDStore.getItem(CS.dirtyKey));
  // Nothing played here yet: there's nothing to lose.
  if ((!CHARS || !CHARS.length) && last === 0) dirty = 0;
  // An old cloud save (no savedAt) and a browser that never synced.
  var cloudAt = savedAt > 0 ? savedAt : (last === 0 ? 1 : 0);
  var decision = csDecide(cloudAt, last, dirty);
  var inRun = typeof _currentScreen !== 'undefined' && _currentScreen && _currentScreen !== 'menu' && _currentScreen !== 'charlist';
  if (decision === 'pull' && (launch || !inRun)) csApply(data);
  else if (decision === 'ask' && launch) csAsk(data);
  else if (decision === 'push') await csPush(true);
}

// The old sync: the first call after the page opens (the sign-in listener
// calls it) is the launch check; after that it uploads, the whole save now.
(function() {
  var _old = syncToCloud;
  syncToCloud = async function(silent) {
    if (!CS.launchDone && getFirebaseUser()) {
      CS.launchDone = true;
      return csCheck(true);
    }
    // The background sync (silent) only when something changed.
    if (silent && csNum(DDStore.getItem(CS.dirtyKey)) <= csNum(DDStore.getItem(CS.lastKey))) return;
    if (!getFirebaseUser()) return _old.apply(this, arguments);
    var indicator = document.getElementById('account-sync-indicator');
    if (!silent) {
      say('Syncing your save data to the cloud. Please wait.');
      if (indicator) { indicator.textContent = '⏳ Syncing...'; indicator.style.color = '#ffaa44'; }
    }
    var ok = await csPush(silent);
    if (!silent) {
      if (indicator) {
        indicator.textContent = ok ? '✓ Synced to cloud!' : '✗ Sync failed. Try again.';
        indicator.style.color = ok ? '#44ff88' : '#ff4444';
        setTimeout(function() { if (indicator) indicator.textContent = ''; }, 3000);
      }
      say(ok ? 'Sync complete. Your whole save is backed up to the cloud.' : 'Sync failed. Check your connection and try again.');
    }
  };
  var _load = loadFromCloud;
  loadFromCloud = async function() {
    var user = getFirebaseUser();
    if (!user || !window._fbDb) return _load.apply(this, arguments);
    say('Loading your save data from the cloud. Please wait.');
    try {
      var snap = await window._fbDb.collection('saves').doc(user.uid).get();
      if (!snap.exists) { say('No cloud save found. Starting fresh.'); return false; }
      csApply(snap.data(), 'Load complete. Your save data has been restored from the cloud.');
      return true;
    } catch (e) { say('Load failed. Check your connection.'); return false; }
  };
})();

// Coming back to the tab; and going away uploads progress.
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible') csCheck(false);
  else if (getFirebaseUser() && csNum(DDStore.getItem(CS.dirtyKey)) > csNum(DDStore.getItem(CS.lastKey))) csPush(true);
});

// After a reload that loaded a save, say so.
(function() {
  var msg = null;
  try { msg = sessionStorage.getItem('dd_sync_message'); sessionStorage.removeItem('dd_sync_message'); } catch (e) {}
  if (msg) setTimeout(function() { say(msg); try { showToast('☁ ' + msg, 'green'); } catch (e) {} }, 4000);
})();
