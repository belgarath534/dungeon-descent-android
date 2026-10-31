//═════════════════
// RESTORED SESSION SYSTEMS
//═════════════════

// ── NIGHT MODE ──
function isNightTime() {
  var h = new Date().getHours();
  return h >= 20 || h < 8;
}

function isWhisperForest() { return DS.dungeon === 'The Whispering Forest'; }

function getMenuTrack() {
  var ev = getActiveEvent();
  if (ev === 'halloween') return 'menu-halloween';
  if (ev === 'friday13') return 'menu-halloween'; // Halloween music on Friday the 13th
  if (ev === 'christmas') return 'menu-christmas';
  if (ev === 'birthday') return 'menu-birthday';
  return 'menu';
}

// ── PAUSE MENU ──
var _paused = false;
var _escapeConfirmMode = false;

function openPauseMenu() {
  if (DS.inCombat) { say('Cannot pause during combat. Finish the fight first.'); return; }
  _paused = true;
  incrementAchievementStat('pauseMenuOpens', 1);
  var ov = document.getElementById('pause-menu');
  if (!ov) return;
  var nameEl = document.getElementById('pause-char-name');
  var infoEl = document.getElementById('pause-char-info');
  if (nameEl) nameEl.textContent = DS.name || 'Your Character';
  if (infoEl) infoEl.textContent = 'Floor ' + (DS.floor||1) + ' · ' + (DS.dungeon||'The Dungeon') + ' · ' + (DS.hp||0) + ' HP';
  try { updatePlaytimeDisplay(); } catch(e) {}
  // Update hunter status in pause menu
  var hunterStatus = document.getElementById('pause-hunter-status');
  if (hunterStatus) hunterStatus.textContent = (DS.hunterMode && DS.hunterAlive) ? 'ON 🏹' : 'OFF';
  var guideStatus = document.getElementById('pause-guide-status');
  if (guideStatus) guideStatus.textContent = DS.guideEnabled !== false ? 'ON' : 'OFF';
  ov.style.display = 'flex';
  setTimeout(function() { var f = ov.querySelector('button'); if (f) f.focus(); }, 100);
  var hunterPauseMsg = DS.hunterMode && DS.hunterAlive ? ' Hunter is ' + DS.hunterDist + ' rooms away.' : '';
  say('Game paused. ' + (DS.name||'Your character') + '. Floor ' + (DS.floor||1) + '.' + hunterPauseMsg + ' Options: Resume, Save, Settings, Quests, Main Menu.');
}

function closePauseMenu() {
  _paused = false;
  var ov = document.getElementById('pause-menu');
  if (ov) ov.style.display = 'none';
  say('Resumed.');
}

function pauseMenuReturn() {
  closePauseMenu();
  if (_charIdx !== null && CHARS[_charIdx]) { CHARS[_charIdx].floor = DS.floor||1; saveChars(); }
  stopAmbient();
  playTrack(getMenuTrack());
  goTo('menu');
  say('Returned to main menu. Progress saved.');
}

function quitGame() {
  closePauseMenu();
  // Save progress first
  if (_charIdx !== null && CHARS[_charIdx]) { CHARS[_charIdx].floor = DS.floor||1; saveChars(); }
  say('Progress saved. Closing game.');
  setTimeout(function() {
    // Try different close methods for different environments
    if (window.webkit && window.webkit.messageHandlers) {
      // iOS Capacitor
      try { window.webkit.messageHandlers.close.postMessage('close'); } catch(e) {}
    }
    if (window.Capacitor) {
      // Capacitor app
      try { window.Capacitor.Plugins.App.exitApp(); } catch(e) {}
    }
    // Web fallback — go to menu
    goTo('menu');
    say('Game saved. On web you can close the browser tab.');
  }, 800);
}

// ── CUSTOM TRACK SYSTEM ──
var _customTrackAudio = null;
var _customTrackActive = false;

function playCustomTrack(url, label, saved) {
  if (!url) { say('No audio source provided.'); return; }
  label = label || 'Custom Track';
  try {
    if (AUD && AUD.current && AUD.tracks && AUD.tracks[AUD.current]) { try { AUD.tracks[AUD.current].pause(); } catch(e){} }
    if (_customTrackAudio) { try { _customTrackAudio.pause(); _customTrackAudio.src = ''; _customTrackAudio = null; } catch(e){} }
    var statusEl = document.getElementById('custom-track-status');
    var stopBtn = document.getElementById('custom-track-stop');
    if (statusEl) { statusEl.textContent = '⏳ Loading...'; statusEl.style.display = 'block'; }
    var audio = new Audio();
    audio.loop = true;
    audio.volume = (AUD && AUD.musicVol) ? AUD.musicVol : 0.7;
    audio.addEventListener('canplaythrough', function() {
      audio.play().then(function() {
        _customTrackAudio = audio;
        _customTrackActive = true;
        audio.volume = (AUD && AUD.musicVol !== undefined) ? AUD.musicVol : 0.7;
        var shortLabel = label.length > 40 ? label.substring(0,40) + '...' : label;
        if (statusEl) { statusEl.textContent = '▶ Now playing: ' + shortLabel; statusEl.style.display = 'block'; }
        if (stopBtn) stopBtn.style.display = 'block';
        say('Custom track playing. ' + shortLabel + '.');
      }).catch(function() {
        if (statusEl) statusEl.textContent = '✕ Playback blocked. Tap the page first.';
      });
    }, { once: true });
    audio.addEventListener('error', function() {
      var msg = audio.error ? ['','Aborted','Network error','Format not supported','File not found or access denied'][audio.error.code] || 'Unknown error' : 'Unknown error';
      if (statusEl) { statusEl.textContent = '✕ Error: ' + msg; statusEl.style.display = 'block'; }
      say('Could not load audio. ' + msg);
      _customTrackAudio = null;
    });
    audio.src = url;
    audio.load();
  } catch(e) {
    say('Error setting up audio. ' + (e.message || ''));
  }
}

function stopCustomTrack() {
  if (_customTrackAudio) { try { _customTrackAudio.pause(); _customTrackAudio.currentTime = 0; } catch(e){} _customTrackAudio = null; }
  _customTrackActive = false;
  // Also stop YouTube if active
  if (typeof stopYouTubeTrack === 'function') stopYouTubeTrack();
  var statusEl = document.getElementById('custom-track-status');
  var stopBtn = document.getElementById('custom-track-stop');
  if (statusEl) statusEl.style.display = 'none';
  if (stopBtn) stopBtn.style.display = 'none';
  _customTrackActive = false;
  AUD.current = null;
  playTrack(getDungeonTrack() || getMenuTrack());
  say('Custom track stopped. Game music resumed.');
}

function loadCustomTrackFile(input) {
  var file = input.files[0];
  if (!file) return;
  var trackName = file.name.replace(/[.][^.]+$/, '');
  var nameEl = document.getElementById('custom-track-file-name');
  if (nameEl) nameEl.textContent = file.name;
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    var objectUrl = URL.createObjectURL(file);
    playCustomTrack(objectUrl, trackName, false);
    saveTrackToDB('track-' + Date.now(), trackName, null, objectUrl);
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var blob = new Blob([e.target.result], { type: file.type });
      var objectUrl = URL.createObjectURL(blob);
      playCustomTrack(objectUrl, trackName, false);
      saveTrackToDB('track-' + Date.now(), trackName, blob, null);
    } catch(err) {
      var fallbackUrl = URL.createObjectURL(file);
      playCustomTrack(fallbackUrl, trackName, false);
    }
  };
  reader.onerror = function() {
    var fallbackUrl = URL.createObjectURL(file);
    playCustomTrack(fallbackUrl, trackName, false);
    saveTrackToDB('track-' + Date.now(), trackName, null, fallbackUrl);
  };
  reader.readAsArrayBuffer(file);
}

function extractYouTubeId(url) {
  if (!url) return null;
  var m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  // BUGFIX: Shorts and Live links use a path segment instead of a ?v=
  // query param, so neither matched before — pasting either one silently
  // fell through to the broken "treat the YouTube page URL as a raw audio
  // file" path in loadCustomTrackURL() instead of recognizing it at all.
  m = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  return null;
}

var _ytActive = false;
var _ytVideoId = null;

function loadYouTubeTrack(videoId, label) {
  stopCustomTrack();
  _ytActive = true;
  _ytVideoId = videoId;

  var wrap = document.getElementById('yt-player-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  wrap.style.cssText = 'position:fixed;bottom:60px;left:0;right:0;z-index:800;background:#0a0010;border-top:1px solid #330066;padding:10px 16px;display:flex;align-items:center;gap:12px;';
  // BUGFIX: this div starts as aria-hidden="true" in its base HTML (it's
  // an empty 1x1px offscreen placeholder until a track loads). Only its
  // inline style ever got reset here — aria-hidden stayed true even once
  // it was visually on-screen, so the entire player (including its own
  // Play button) was invisible to VoiceOver/TalkBack no matter what URL
  // was loaded. This is very likely why it "didn't work" at all.
  wrap.removeAttribute('aria-hidden');

  var embedBase = 'https://www.youtube-nocookie.com/embed/' + videoId +
    '?mute=0&loop=1&playlist=' + videoId +
    '&controls=1&modestbranding=1&rel=0&origin=' + encodeURIComponent(window.location.origin || 'https://dungen-descent.org');

  var iframe = document.createElement('iframe');
  iframe.width = '160';
  iframe.height = '90';
  // BUGFIX: autoplay=1 combined with mute=0 is blocked by virtually every
  // mobile browser/WebView's autoplay policy — it silently never starts,
  // with no error. Loading without autoplay, then setting a fresh src
  // with autoplay=1 inside the Play button's own click handler below,
  // counts as triggered-by-a-real-user-gesture and reliably works instead.
  iframe.src = embedBase;
  iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('aria-label', 'YouTube player — ' + (label || videoId) + '.');
  iframe.style.cssText = 'border:none;flex-shrink:0;border-radius:4px;';

  var info = document.createElement('div');
  info.style.cssText = 'flex:1;font-family:Cinzel,serif;font-size:0.65rem;color:#aa44ff;line-height:1.6;';
  info.innerHTML = '<div style="color:#cc88ff;">🎵 ' + (label || 'YouTube Track') + '</div>';

  // Real, first-class Play button — reachable and clearly labeled for
  // VoiceOver/TalkBack, rather than relying on reaching into YouTube's
  // own iframe controls (cross-origin iframe accessibility is unreliable,
  // and its controls only appear once the video has already loaded).
  var playBtn = document.createElement('button');
  playBtn.textContent = '▶ Play';
  playBtn.style.cssText = 'padding:8px 14px;background:#1a0022;border:1px solid #44cc88;color:#44cc88;font-family:Cinzel,serif;font-size:0.68rem;cursor:pointer;flex-shrink:0;border-radius:4px;';
  playBtn.setAttribute('aria-label', 'Play ' + (label || 'YouTube track'));
  playBtn.onclick = function() {
    iframe.src = embedBase + '&autoplay=1';
    say('Playing ' + (label || 'YouTube track') + '.');
  };

  var stopBtn = document.createElement('button');
  stopBtn.textContent = '✕ Stop';
  stopBtn.style.cssText = 'padding:8px 14px;background:#1a0022;border:1px solid #aa44ff;color:#aa44ff;font-family:Cinzel,serif;font-size:0.68rem;cursor:pointer;flex-shrink:0;border-radius:4px;';
  stopBtn.setAttribute('aria-label', 'Stop YouTube track and return to game music');
  stopBtn.onclick = function() { stopCustomTrack(); say('YouTube track stopped. Game music resumed.'); };

  wrap.appendChild(iframe);
  wrap.appendChild(info);
  wrap.appendChild(playBtn);
  wrap.appendChild(stopBtn);

  // Update status in settings panel
  var statusEl = document.getElementById('custom-track-status');
  var gameStopBtn = document.getElementById('custom-track-stop');
  if (statusEl) { statusEl.style.display = ''; statusEl.textContent = '▶ YouTube: ' + (label || videoId); }
  if (gameStopBtn) gameStopBtn.style.display = '';

  say('YouTube track loaded: ' + (label || videoId) + '. A Play button now appears at the bottom of the screen — press it to start audio.');
}

function stopYouTubeTrack() {
  _ytActive = false;
  _ytVideoId = null;
  var wrap = document.getElementById('yt-player-wrap');
  if (wrap) { wrap.innerHTML = ''; wrap.style.display = 'none'; wrap.setAttribute('aria-hidden', 'true'); }
}

function loadCustomTrackURL() {
  var input = document.getElementById('custom-track-url');
  if (!input) return;
  var url = input.value.trim();
  if (!url) { say('Please paste a URL first.'); return; }

  // Check if it is a YouTube URL
  var ytId = extractYouTubeId(url);
  if (ytId) {
    var label = 'YouTube Track';
    loadYouTubeTrack(ytId, label);
    DDStore.setItem('dd_custom_track_url', url);
    DDStore.setItem('dd_custom_track_yt', ytId);
    return;
  }
  // BUGFIX: a YouTube-domain URL this game doesn't recognize the shape of
  // (Shorts/Live are now handled above, but future URL shapes or a bad
  // paste could still slip through) used to fall straight into the
  // "regular audio URL" path below, which tries to play the YouTube page
  // itself as an audio file — fails with no useful explanation. Catch any
  // youtube.com/youtu.be/music.youtube.com URL here and say so clearly
  // instead of silently misfiring.
  if (/youtube\.com|youtu\.be/i.test(url)) {
    say("That looks like a YouTube link, but I couldn't find a video ID in it. Try copying the link directly from the Share button on the video.");
    return;
  }

  // Regular audio URL
  playCustomTrack(url, url, true);
  var shortName = url.split('/').pop().split('?')[0].replace(/[.][^.]+$/, '') || 'Custom Track';
  saveTrackToDB('track-' + Date.now(), shortName, null, url);
}

function checkSavedCustomTrack() {
  var saved = DDStore.getItem('dd_custom_track_url');
  if (saved) { var urlInput = document.getElementById('custom-track-url'); if (urlInput) urlInput.value = saved; }
}

// ── INDEXEDDB TRACK FUNCTIONS ──
function getAllTracksFromDB(callback) {
  initTrackDB(function(db) {
    if (!db) { callback([]); return; }
    try {
      var tx = db.transaction('tracks', 'readonly');
      var req = tx.objectStore('tracks').getAll();
      req.onsuccess = function() { callback(req.result || []); };
      req.onerror = function() { callback([]); };
    } catch(e) { callback([]); }
  });
}

function saveTrackToDB(id, name, blob, url) {
  initTrackDB(function(db) {
    if (!db) { say('Could not access storage.'); return; }
    try {
      var tx = db.transaction('tracks', 'readwrite');
      var record = { id: id, name: name, date: Date.now() };
      if (blob && blob instanceof Blob) record.blob = blob;
      if (url) record.url = url;
      var req = tx.objectStore('tracks').put(record);
      req.onsuccess = function() {
        say('Track saved as ' + name + '.');
        incrementAchievementStat('savedTracks', 1);
        checkAchievements();
        renderMyTracks();
      };
      req.onerror = function() { say('Could not save track. Storage may be full.'); };
    } catch(e) { say('Error saving track.'); }
  });
}

function deleteTrackFromDB(id) {
  initTrackDB(function(db) {
    if (!db) return;
    var tx = db.transaction('tracks', 'readwrite');
    tx.objectStore('tracks').delete(id);
    tx.oncomplete = function() { say('Track deleted.'); renderMyTracks(); };
  });
}

function playTrackFromDB(track) {
  // Stop everything first — game music, YouTube, other custom tracks
  if (_customTrackActive || _ytActive) stopCustomTrack();
  mpStop();
  if (AUD.current) {
    var gameTrack = AUD.tracks[AUD.current];
    if (gameTrack) { try { gameTrack.pause(); } catch(e) {} }
  }
  if (track.blob) { playCustomTrack(URL.createObjectURL(track.blob), track.name, false); }
  else if (track.url) {
    var ytId = extractYouTubeId(track.url);
    if (ytId) { loadYouTubeTrack(ytId, track.name); }
    else { playCustomTrack(track.url, track.name, false); }
  }
}

// ── GAMEPLAY SETTINGS ──
function loadGameplaySettings() {
  var prefs = _jsonParseSafe(DDStore.getItem('dd_menu_prefs'), '{}');
  MENU_TOGGLE_ITEMS.forEach(function(item) {
    var el = document.getElementById(item.id);
    if (el) el.style.display = (prefs[item.id] === false) ? 'none' : '';
  });
  var modOn = DDStore.getItem('dd_run_modifiers') !== '0';
  var btn = document.getElementById('run-modifier-toggle');
  if (btn) {
    btn.textContent = modOn ? 'On' : 'Off';
    btn.className = 'toggle-btn ' + (modOn ? 'on' : '');
    btn.setAttribute('aria-pressed', String(modOn));
  }
}

function openHideMenuPanel() {
  closeSettingsPanel('gameplay');
  setTimeout(function() {
    var panel = document.getElementById('settings-panel-hidemenu');
    if (panel) { panel.classList.add('open'); renderMenuToggles(); say('Hide menu items.'); }
  }, 100);
}

// community enemy system removed

function previewAchSound(soundId) {
  sfx(soundId);
  say('Previewing: ' + soundId.replace('sfx-', '').replace('-', ' ') + '.');
}

function setAchSound(soundId) {
  DDStore.setItem('dd_ach_sound', soundId);
  // Update button states
  ['unlock','levelup','victory'].forEach(function(s) {
    var btn = document.getElementById('ach-sound-btn-' + s);
    if (btn) {
      var isSelected = soundId === 'sfx-' + s;
      btn.textContent = isSelected ? '✅ Selected' : 'Select';
      btn.style.borderColor = isSelected ? '#ffdd44' : '#44aa44';
      btn.style.color = isSelected ? '#ffdd44' : '#44aa44';
    }
  });
  var names = { 'sfx-unlock':'Classic Unlock', 'sfx-levelup':'Level Up Fanfare', 'sfx-victory':'Victory Chime' };
  var el = document.getElementById('ach-sound-current');
  if (el) el.textContent = 'Current: ' + (names[soundId] || soundId);
  sfx(soundId);
  say((names[soundId] || soundId) + ' selected as achievement sound.');
}

function loadAchSoundSetting() {
  var saved = DDStore.getItem('dd_ach_sound') || 'sfx-unlock';
  setAchSound(saved);
}

function getAchSound() {
  return DDStore.getItem('dd_ach_sound') || 'sfx-unlock';
}

// ── ACHIEVEMENT TIERS ──
// A handful of the rarest, most narratively significant achievements are
// hand-picked as 'special' regardless of their reward value. Everything else
// is derived from its existing gold reward, which already tracked rarity
// loosely (50/150/250/400) — this just makes that grouping explicit.
var ACH_SPECIAL_IDS = ['ach-void-reaper', 'ach-witness', 'ach-dddi-boss', 'ach-bossrush',
  'ach-ngplus3', 'ach-all-stories', 'ach-trilogy', 'ach-kills-1000', 'ach-abyssal-boss'];

function getAchievementTier(ach) {
  if (!ach) return 'normal';
  if (ach.id && ACH_SPECIAL_IDS.indexOf(ach.id) !== -1) return 'special';
  var gold = ach.gold || 50;
  if (gold >= 300) return 'gold';
  if (gold >= 200) return 'silver';
  if (gold >= 100) return 'bronze';
  return 'normal';
}

var ACH_TIER_LABELS = { normal: 'Normal', bronze: 'Bronze', silver: 'Silver', gold: 'Gold', special: 'Special' };
var ACH_TIER_COLORS = { normal: '#999', bronze: '#cd7f32', silver: '#c0c0c0', gold: '#e0c080', special: '#cc88ff' };

// Bronze/Normal reuse an existing in-game sound (respects the player's sound
// pack preference via getAchSound()); Silver/Gold/Special get their own
// dedicated stingers.
function playAchievementUnlockSound(ach) {
  var tier = getAchievementTier(ach);
  if (tier === 'special') sfx('sfx-ach-special');
  else if (tier === 'gold') sfx('sfx-ach-gold');
  else if (tier === 'silver') sfx('sfx-ach-silver');
  else sfx(getAchSound());
  return tier;
}




function updateMenuEnemyCount() {
  // Count base enemies
  var baseCount = 0;
  if (typeof ENEMIES !== 'undefined') {
    Object.values(ENEMIES).forEach(function(dungeon) {
      if (Array.isArray(dungeon)) baseCount += dungeon.length;
    });
  }
  if (baseCount === 0) baseCount = 219; // fallback

  var el = document.getElementById('menu-enemy-count');
  if (el) el.textContent = baseCount + ' enemies across 7 dungeons';
}

function renderSpiritCreationStep() {
  var grid = document.getElementById('cp8-spirit-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // Collect all available spirits
  var allEarned = [];
  CHARS.forEach(function(ch) {
    if (ch && ch.earnedSpirits) ch.earnedSpirits.forEach(function(id){ if (allEarned.indexOf(id)===-1) allEarned.push(id); });
  });

  var rareAvail = RARE_SPIRITS.filter(function(s){ return allEarned.indexOf(s.id) !== -1; });
  var eliteAvail = ELITE_SPIRITS.filter(function(s){ return allEarned.indexOf(s.id) !== -1; });
  var customAvail = getCustomSpiritsWithFunctions();
  var available = STARTER_SPIRITS.concat(rareAvail).concat(eliteAvail).concat(customAvail);

  available.forEach(function(spirit) {
    var isSelected = NC.spirit === spirit.id;
    var btn = document.createElement('button');
    btn.className = 'diff-card';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    btn.setAttribute('aria-label', spirit.name + '. ' + spirit.ability);
    btn.style.cssText = 'text-align:left;border-color:' + (isSelected ? 'var(--gold)' : '#333') + ';background:' + (isSelected ? 'rgba(201,162,39,0.08)' : '') + ';';
    btn.innerHTML =
      '<div style="font-family:Cinzel,serif;font-size:0.78rem;color:' + (isSelected?'var(--gold)':'#e0c080') + ';">' + spirit.icon + ' ' + spirit.name +
      (spirit.rarity==='rare' ? ' <span style="font-size:0.55rem;color:var(--gold);border:1px solid var(--gold-dim);padding:1px 4px;">RARE</span>' : '') +
      (spirit.rarity==='elite' ? ' <span style="font-size:0.55rem;color:#cc88ff;border:1px solid #884499;padding:1px 4px;">ELITE</span>' : '') +
      (spirit.isCustomBuilt ? ' <span style="font-size:0.55rem;color:#44aaff;border:1px solid #224488;padding:1px 4px;">CUSTOM</span>' : '') +
      '</div>' +
      '<div style="font-family:Cinzel,serif;font-size:0.62rem;color:#666;margin-top:3px;">✦ ' + spirit.ability + '</div>';
    btn.onclick = function() {
      NC.spirit = spirit.id;
      renderSpiritCreationStep();
      say(spirit.name + ' selected. ' + spirit.ability);
    };
    grid.appendChild(btn);
  });

  say('Spirit selection. ' + available.length + ' spirits available. ' + (rareAvail.length + eliteAvail.length + customAvail.length) + ' earned spirits unlocked.');
}

function pickCorruption(enabled) {
  NC.corruption = enabled;
  var offBtn = document.getElementById('corruption-off-btn');
  var onBtn = document.getElementById('corruption-on-btn');
  if (offBtn) { offBtn.style.borderColor = enabled ? '#444' : 'var(--gold)'; offBtn.setAttribute('aria-checked', enabled ? 'false' : 'true'); }
  if (onBtn) { onBtn.style.borderColor = enabled ? '#7a207a' : '#444'; onBtn.setAttribute('aria-checked', enabled ? 'true' : 'false'); }
  say(enabled ? 'Corruption Mode ON. Every death darkens your soul.' : 'Standard Mode. No corruption.');
}

function pickRunMode(mode) {
  NC.runMode = mode;

  var classic = document.getElementById('mode-classic');
  var legacy = document.getElementById('mode-legacy');
  if (classic) { classic.setAttribute('aria-checked', mode === 'classic' ? 'true' : 'false'); classic.style.borderColor = mode === 'classic' ? '#aa8844' : '#333'; }
  if (legacy) { legacy.setAttribute('aria-checked', mode === 'legacy' ? 'true' : 'false'); legacy.style.borderColor = mode === 'legacy' ? '#6644aa' : '#333'; }

  var desc = document.getElementById('run-mode-desc');
  if (desc) {
    if (mode === 'classic') {
      desc.textContent = 'Classic Run selected. You will start fresh at Level 1 every time you descend. Die and your journey ends. The roguelike experience.';
    } else {
      desc.textContent = 'Legacy Mode selected. Your level carries over between runs. Complete this dungeon to raise its tier. Die and you keep your level but the dungeon resets. Build one legend over a long time.';
    }
  }
  say(mode === 'classic' ? 'Classic Run selected. Fresh start every run.' : 'Legacy Mode selected. Your level persists between runs.');
}

function applyTierScaling(enemy) {
  // Chaos Mode (secret console code) — getChaosGoldMult() already randomizes
  // gold at the enemyDead() payout, but the matching enemy-strength half,
  // getChaosEnemyMult(), was never actually applied anywhere.
  var chaosMult = getChaosEnemyMult();
  if (!DS._tierHpMult && !DS._tierAtkMult && chaosMult === 1) return enemy;
  var hpMult = (DS._tierHpMult || 1) * chaosMult;
  var atkMult = (DS._tierAtkMult || 1) * chaosMult;
  enemy.hp = Math.round(enemy.hp * hpMult);
  enemy.maxHp = enemy.hp;
  if (Array.isArray(enemy.atk)) {
    enemy.atk = [Math.round(enemy.atk[0] * atkMult), Math.round(enemy.atk[1] * atkMult)];
  }
  // Gold boost
  if (DS._tierGoldMult && enemy.gold) {
    enemy.gold = Math.round(enemy.gold * DS._tierGoldMult);
  }
  return enemy;
}

function toggleRunModifiers() {
  var current = DDStore.getItem('dd_run_modifiers') !== '0';
  DDStore.setItem('dd_run_modifiers', current ? '0' : '1');
  loadGameplaySettings();
  say('Run modifiers ' + (current ? 'disabled.' : 'enabled.'));
}

// ── SPIRIT BUILDER ──
var SB_ICONS = ['🐺','🦅','🌑','🔥','💀','⚡','🌿','👁️','🌊','🐉','🦋','❄️'];
var SB_ABILITIES = [
  { id:'heal-kill',    label:'Soul Mend',        desc:'Restore 8 HP on every kill.',                     passiveDesc:'Soul Mend' },
  { id:'bonus-dmg',   label:'Surge Strike',      desc:'20% chance to deal bonus damage each attack.',    passiveDesc:'Surge Strike' },
  { id:'sp-kill',     label:'Essence Drain',     desc:'Restore 3 SP on every kill.',                     passiveDesc:'Essence Drain' },
  { id:'block',       label:'Spirit Ward',       desc:'15% chance to block incoming damage completely.',  passiveDesc:'Spirit Ward' },
  { id:'gold-boost',  label:"Fortune's Veil",    desc:'Earn 25% more gold from all sources.',             passiveDesc:"Fortune's Veil" },
  { id:'poison-start',label:'Venom Aura',        desc:'Poison the enemy at the start of every combat.',   passiveDesc:'Venom Aura' },
  { id:'instakill',   label:'Final Judgment',    desc:'10% chance to finish enemies below 20% HP.',       passiveDesc:'Final Judgment' },
  { id:'corruption',  label:'Purifying Song',    desc:'Reduce corruption by 5% each floor.',              passiveDesc:'Purifying Song' },
  { id:'xp-boost',    label:'Scholar\'s Mark',   desc:'Earn 20% more XP from all sources.',               passiveDesc:"Scholar's Mark" },
  { id:'crit-boost',  label:'Predator\'s Eye',   desc:'Increase critical hit chance by 15%.',             passiveDesc:"Predator's Eye" },
  { id:'def-boost',   label:'Iron Veil',         desc:'Gain +4 DEF permanently while active.',            passiveDesc:'Iron Veil' },
  { id:'atk-boost',   label:'Wrath Brand',       desc:'Gain +3 ATK permanently while active.',            passiveDesc:'Wrath Brand' },
  { id:'flee-boost',  label:'Wind Step',         desc:'Increase flee chance by 30%.',                     passiveDesc:'Wind Step' },
  { id:'heal-floor',  label:'Floor Blessing',    desc:'Restore 10 HP at the start of each new floor.',    passiveDesc:'Floor Blessing' },
  { id:'sp-regen',    label:'Mana Spring',       desc:'Restore 2 SP at the start of each combat.',        passiveDesc:'Mana Spring' },
  { id:'luck-boost',  label:'Lucky Charm',       desc:'Increase luck by 10, improving loot drops.',       passiveDesc:'Lucky Charm' },
  { id:'lifesteal',   label:'Blood Pact',        desc:'Steal 10% of damage dealt as HP.',                 passiveDesc:'Blood Pact' },
  { id:'tank',        label:'Stone Skin',        desc:'Reduce all incoming damage by 3.',                  passiveDesc:'Stone Skin' },
  { id:'double-gold', label:'Gilded Touch',      desc:'10% chance to double gold from any source.',       passiveDesc:'Gilded Touch' },
  { id:'burn-start',  label:'Ember Spirit',      desc:'Burn the enemy for 2 turns at combat start.',      passiveDesc:'Ember Spirit' },
];
var _sbSelectedIcon = '🐺';
var _sbSelectedAbility = null;

function openSpiritBuilder() {
  var frags = parseInt(DDStore.getItem('dd_soul_fragments') || '0');
  var ov = document.getElementById('spirit-builder-overlay');
  if (!ov) return;
  ov.style.display = 'flex';
  var countEl = document.getElementById('sb-fragment-count');
  if (countEl) countEl.textContent = frags + ' of 25 Soul Fragments collected.';
  var form = document.getElementById('sb-form');
  var notEnough = document.getElementById('sb-not-enough');
  if (frags >= 25) {
    if (form) form.style.display = 'block';
    if (notEnough) notEnough.style.display = 'none';
    renderSBIcons(); renderSBAbilities();
    say('Spirit Builder. You have ' + frags + ' fragments. Name your spirit, choose an icon and ability, then press Build.');
  } else {
    if (form) form.style.display = 'none';
    if (notEnough) notEnough.style.display = 'block';
    var pct = Math.round((frags/25)*100);
    var bar = document.getElementById('sb-progress-bar');
    var txt = document.getElementById('sb-progress-text');
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = frags + ' of 25. ' + (25-frags) + ' more needed.';
    say('Spirit Builder. ' + frags + ' of 25 fragments. Keep killing enemies.');
  }
}

function closeSpiritBuilder() {
  var ov = document.getElementById('spirit-builder-overlay');
  if (ov) ov.style.display = 'none';
}

function renderSBIcons() {
  var grid = document.getElementById('sb-icon-grid');
  if (!grid) return;
  grid.innerHTML = '';
  SB_ICONS.forEach(function(icon) {
    var btn = document.createElement('button');
    btn.style.cssText = 'font-size:1.6rem;padding:8px;background:' + (icon===_sbSelectedIcon?'rgba(201,162,39,0.15)':'transparent') + ';border:2px solid ' + (icon===_sbSelectedIcon?'var(--gold)':'var(--border-dim)') + ';cursor:pointer;border-radius:4px;';
    btn.textContent = icon;
    btn.setAttribute('aria-label', 'Select icon ' + icon);
    btn.onclick = function() { _sbSelectedIcon = icon; renderSBIcons(); say('Icon ' + icon + ' selected.'); };
    grid.appendChild(btn);
  });
}

function renderSBAbilities() {
  var list = document.getElementById('sb-ability-list');
  if (!list) return;
  list.innerHTML = '';
  SB_ABILITIES.forEach(function(ab) {
    var selected = _sbSelectedAbility === ab.id;
    var btn = document.createElement('button');
    btn.style.cssText = 'width:100%;text-align:left;padding:10px 12px;margin-bottom:6px;background:' + (selected?'rgba(201,162,39,0.08)':'transparent') + ';border:1px solid ' + (selected?'var(--gold)':'var(--border-dim)') + ';cursor:pointer;';
    btn.setAttribute('aria-label', ab.label + '. ' + ab.desc);
    btn.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.78rem;color:' + (selected?'var(--gold)':'var(--text-secondary)') + ';">' + ab.label + '</div><div style="font-size:0.7rem;color:var(--text-dim);font-style:italic;">' + ab.desc + '</div>';
    btn.onclick = function() { _sbSelectedAbility = ab.id; renderSBAbilities(); say(ab.label + ' selected.'); };
    list.appendChild(btn);
  });
}

function getCustomSpiritFunctions(abilityId) {
  switch(abilityId) {
    case 'heal-kill':
      return {
        onKill: function() { DS.hp = Math.min(DS.maxHp, DS.hp + 8); updateTopBar(); addLog('✨ Spirit heals 8 HP on kill!'); },
        onAttack: null, onCombatStart: null
      };
    case 'bonus-dmg':
      return {
        onAttack: function(baseAtk) { return Math.random() < 0.20 ? Math.floor(baseAtk * 0.4) : 0; },
        onKill: null, onCombatStart: null
      };
    case 'sp-kill':
      return {
        onKill: function() { DS.sp = Math.min(DS.maxSp||100, (DS.sp||0) + 3); updateXPBar(); addLog('✨ Spirit restores 3 SP on kill!'); },
        onAttack: null, onCombatStart: null
      };
    case 'block':
      return {
        onCombatStart: function() {
          DS._spiritBlockChance = 0.15;
          addLog('✨ Spirit Ward active — 15% chance to block attacks.');
        },
        onAttack: null, onKill: null
      };
    case 'gold-boost':
      // (+25% is applied to kill gold where it's counted; this onKill paid it a second time)
      return { onKill: null, onAttack: null, onCombatStart: null };
    case 'poison-start':
      return {
        onCombatStart: function() {
          if (DS.enemy) { DS.enemy._poisoned = true; DS.enemy._poisonTurns = 4; DS.enemy._poisonDmg = 5; }
          addLog('✨ Venom Aura — enemy poisoned for 4 turns!');
        },
        onAttack: null, onKill: null
      };
    case 'instakill':
      return {
        onAttack: function(baseAtk, enemyName) {
          if (DS.enemy && DS.enemy.hp <= DS.enemy.maxHp * 0.20 && Math.random() < 0.10) {
            var remaining = DS.enemy.hp;
            DS.enemy.hp = 0;
            addLog('✨ Final Judgment — instant kill!');
            return remaining;
          }
          return 0;
        },
        onKill: null, onCombatStart: null
      };
    case 'corruption':
      // "5% each floor" — it also cleaned some on every kill (the floor version is in nextFloor)
      return { onKill: null, onAttack: null, onCombatStart: null };
    case 'xp-boost':
      return {
        onKill: function() { gainXP(Math.floor((ENEMY_XP[getEnemyTier(DS.enemy ? DS.enemy.name : '')] || 20) * 0.20)); addLog('✨ Scholar\'s Mark — bonus XP!'); },
        onAttack: null, onCombatStart: null
      };
    case 'crit-boost':
      return {
        // Chances are fractions: adding 15 made every hit a crit. It lasts the fight (fxReset undoes fightCrit).
        onCombatStart: function() { DS.critBonus = (DS.critBonus || 0) + 0.15; fxGet().fightCrit = (fxGet().fightCrit || 0) + 0.15; addLog('✨ Predator\'s Eye — +15% crit chance!'); },
        onAttack: null, onKill: null
      };
    case 'def-boost':
      return {
        // (re-added every fight, so defense kept climbing; now it's +4 while the fight lasts)
        onCombatStart: function() { DS.defBonus = (DS.defBonus || 0) + 4; fxGet().fightDef += 4; updateTopBar(); addLog('✨ Iron Veil — +4 DEF!'); },
        onAttack: null, onKill: null
      };
    case 'atk-boost':
      return {
        onCombatStart: function() { DS.atkBonus = (DS.atkBonus || 0) + 3; fxGet().fightAtk += 3; updateTopBar(); addLog('✨ Wrath Brand — +3 ATK!'); },
        onAttack: null, onKill: null
      };
    case 'flee-boost':
      return {
        onCombatStart: function() { DS.fleeBonus = (DS.fleeBonus || 0) + 0.30; fxGet().fightFlee = (fxGet().fightFlee || 0) + 0.30; addLog('✨ Wind Step — flee chance +30%!'); },
        onAttack: null, onKill: null
      };
    case 'heal-floor':
      return {
        onCombatStart: function() {
          if (DS._spiritHealedThisFloor) return;
          DS._spiritHealedThisFloor = true;
          DS.hp = Math.min(DS.maxHp, DS.hp + 10);
          updatePlayerBar(); addLog('✨ Floor Blessing — restored 10 HP!');
        },
        onAttack: null, onKill: null
      };
    case 'sp-regen':
      return {
        onCombatStart: function() { DS.sp = Math.min(DS.maxSp||100, (DS.sp||0) + 2); updateXPBar(); addLog('✨ Mana Spring — +2 SP!'); },
        onAttack: null, onKill: null
      };
    case 'luck-boost':
      return {
        onCombatStart: function() { DS.luckBonus = (DS.luckBonus || 0) + 0.10; fxGet().fightLuck = (fxGet().fightLuck || 0) + 0.10; addLog('✨ Lucky Charm — +10% luck!'); },
        onAttack: null, onKill: null
      };
    case 'lifesteal':
      return {
        onAttack: function(baseAtk) {
          var steal = Math.floor(baseAtk * 0.10);
          if (steal > 0) { DS.hp = Math.min(DS.maxHp, DS.hp + steal); updatePlayerBar(); addLog('✨ Blood Pact — stole ' + steal + ' HP!'); }
          return 0;
        },
        onKill: null, onCombatStart: null
      };
    case 'tank':
      return {
        onCombatStart: function() { DS._emberWard = true; addLog('✨ Stone Skin — damage reduced by 3!'); },
        onAttack: null, onKill: null
      };
    case 'double-gold':
      return {
        onKill: function() {
          if (Math.random() < 0.10 && DS.enemy) {
            var g = DS.enemy.gold ? DS.enemy.gold[1] : 5;
            gainGold(g); addLog('✨ Gilded Touch — gold doubled! +' + g + 'g!');
          }
        },
        onAttack: null, onCombatStart: null
      };
    case 'burn-start':
      return {
        onCombatStart: function() {
          if (DS.enemy) { DS.enemy._burned = true; DS.enemy._burnTurns = 2; DS.enemy._burnDmg = 6; }
          addLog('✨ Ember Spirit — enemy burning for 2 turns!');
        },
        onAttack: null, onKill: null
      };
    default:
      return { onAttack: null, onKill: null, onCombatStart: null };
  }
}

function confirmBuildSpirit() {
  var inp = document.getElementById('sb-name-input');
  var name = inp ? inp.value.trim() : '';
  if (!name) { say('Please enter a name.'); if (inp) inp.focus(); return; }
  if (!_sbSelectedAbility) { say('Please choose an ability.'); return; }
  var frags = parseInt(DDStore.getItem('dd_soul_fragments') || '0');
  if (frags < 25) { say('Not enough fragments.'); return; }
  var abilityDef = SB_ABILITIES.find(function(a){ return a.id === _sbSelectedAbility; });
  if (!abilityDef) return;

  var spiritId = 'custom-' + name.toLowerCase().replace(/[^a-z0-9]/g,'-') + '-' + Date.now();
  var fns = getCustomSpiritFunctions(_sbSelectedAbility);

  var customSpirit = {
    id: spiritId, name: name, icon: _sbSelectedIcon, rarity: 'rare', isCustomBuilt: true,
    abilityId: _sbSelectedAbility, desc: 'A spirit forged from 25 Soul Fragments. ' + abilityDef.desc,
    ability: abilityDef.desc, passiveDesc: abilityDef.passiveDesc,
    onAttack: fns.onAttack, onCombatStart: fns.onCombatStart, onKill: fns.onKill
  };

  var customs = _jsonParseSafe(DDStore.getItem('dd_custom_spirits'), '[]');
  // Store without functions (cannot serialize functions to JSON)
  var storable = Object.assign({}, customSpirit, { onAttack: null, onCombatStart: null, onKill: null });
  customs.push(storable);
  DDStore.setItem('dd_custom_spirits', JSON.stringify(customs));
  DDStore.setItem('dd_soul_fragments', String(Math.max(0, frags - 25)));

  // Add to ALL characters' earnedSpirits so it shows in picker regardless of which char is selected
  CHARS.forEach(function(ch) {
    if (!ch) return;
    if (!ch.earnedSpirits) ch.earnedSpirits = [];
    if (ch.earnedSpirits.indexOf(spiritId) === -1) ch.earnedSpirits.push(spiritId);
  });
  // Also add to current char if set
  if (_charIdx !== null && CHARS[_charIdx]) {
    if (!CHARS[_charIdx].earnedSpirits) CHARS[_charIdx].earnedSpirits = [];
    if (CHARS[_charIdx].earnedSpirits.indexOf(spiritId) === -1) CHARS[_charIdx].earnedSpirits.push(spiritId);
  }
  saveChars();

  incrementAchievementStat('customSpiritBuilt', 1);
  checkAchievements();
  awardScore('achievements', 500);
  sfx('sfx-unlock');
  closeSpiritBuilder();
  say('Spirit created! ' + _sbSelectedIcon + ' ' + name + '. ' + abilityDef.desc + ' Equip it from the spirit picker next run.');
  _sbSelectedAbility = null;
  if (inp) inp.value = '';
}

// ── CHIMERA SYSTEM ──
var _chimeraActive = false;
var _chimeraParts = [];

var CHIMERA_VARIANTS = {
  default: {
    name: 'The Chimera', icon: '🐉', gold: [15,25],
    parts: [
      { id:'head',  name:'Lion Head',    icon:'🦁', hp:45, maxHp:45, atk:[10,18], desc:'Strikes with crushing force.' },
      { id:'body',  name:'Goat Body',    icon:'🐐', hp:35, maxHp:35, atk:[6,12],  desc:'Regenerates 8 HP per turn.', regenPerTurn:8 },
      { id:'tail',  name:'Serpent Tail', icon:'🐍', hp:25, maxHp:25, atk:[5,10],  desc:'Poisons you every turn.', poisonsPlayer:true },
    ]
  },
  whisper: {
    name: 'The Corrupted Chimera', icon: '🌑', gold: [30,50],
    parts: [
      { id:'maw',    name:'The Corrupted Maw',  icon:'🌑', hp:80, maxHp:80, atk:[14,22], desc:'Corrupts on every hit.', corruptsOnHit:15 },
      { id:'thorns', name:'The Thornbound',     icon:'🌿', hp:65, maxHp:65, atk:[10,18], desc:'Reflects 25% damage back.', reflectPct:0.25 },
      { id:'shell',  name:'The Hollow Shell',   icon:'💀', hp:50, maxHp:50, atk:[8,14],  desc:'Summons enemy if ignored.', summonCounter:0 },
    ]
  }
};

function spawnChimera(variant) {
  var def = CHIMERA_VARIANTS[variant] || CHIMERA_VARIANTS.default;
  _chimeraActive = true;
  _chimeraParts = def.parts.map(function(p){ return Object.assign({}, p, {hp:p.maxHp, summonCounter:p.summonCounter||0}); });
  DS.inCombat = true; DS.defending = false;
  DS.chimeraVariant = variant; DS.chimeraGold = def.gold;
  showDgPanels(false, false, false);
  renderChimeraScreen(def);
  sfx('sfx-enemy-die');
  var partNames = _chimeraParts.map(function(p){ return p.name + ' ' + p.hp + ' HP'; }).join(', ');
  say('The Chimera appears! ' + partNames + '. Select a part to attack.');
}

function renderChimeraScreen(def) {
  def = def || CHIMERA_VARIANTS[DS.chimeraVariant] || CHIMERA_VARIANTS.default;
  var eventEl = document.getElementById('dg-event');
  if (!eventEl) return;
  eventEl.style.display = '';
  var aliveParts = _chimeraParts.filter(function(p){ return p.hp > 0; });
  var html = '<div style="font-family:Cinzel,serif;font-size:0.8rem;color:var(--gold);margin-bottom:12px;">' + def.icon + ' ' + def.name + '</div>';
  aliveParts.forEach(function(part) {
    var pct = Math.round((part.hp/part.maxHp)*100);
    var col = pct>60?'#4a8a4a':pct>30?'#8a7a00':'#8a0000';
    html += '<div style="margin-bottom:8px;"><div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:2px;">' + part.icon + ' ' + part.name + ' — ' + part.hp + '/' + part.maxHp + ' HP</div><div style="height:4px;background:#111;border:1px solid #333;"><div style="height:100%;width:' + pct + '%;background:' + col + ';"></div></div><div style="font-size:0.62rem;color:var(--text-dim);font-style:italic;">' + part.desc + '</div></div>';
  });
  html += '<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;" id="chimera-btns">';
  aliveParts.forEach(function(part) {
    html += '<button class="dg-act-btn" onclick="chimeraAttack(\'' + part.id + '\')" aria-label="Attack ' + part.name + ', ' + part.hp + ' HP">⚔ Attack ' + part.icon + ' ' + part.name + ' (' + part.hp + ' HP)</button>';
  });
  html += '<button class="dg-act-btn" onclick="chimeraDefend()" aria-label="Defend against the chimera, reduce incoming damage">🛡 Defend</button></div>';
  eventEl.innerHTML = html;
  setTimeout(function() { var f = eventEl.querySelector('.dg-act-btn'); if (f) f.focus(); }, 100);
}

function chimeraAttack(partId) {
  var part = _chimeraParts.find(function(p){ return p.id===partId && p.hp>0; });
  if (!part) { say('That part is already destroyed.'); return; }
  
  // Full damage calculation synced with single combat
  var baseAtk = rnd(DS.atk[0] + (DS.atkBonus||0), DS.atk[1] + (DS.atkBonus||0));
  var _evBns = getEventBonuses();
  if (_evBns && _evBns.atkBoost) baseAtk = Math.round(baseAtk * (1 + _evBns.atkBoost));
  var _dwMult = getDungeonWeatherPlayerAtkMult();
  if (_dwMult !== 1) baseAtk = Math.round(baseAtk * _dwMult);
  if (DS._ironFist && !DS.equippedWeapon) baseAtk = Math.round(baseAtk * 1.20);
  if (DS._avenger && DS.hp <= DS.maxHp * 0.25) baseAtk = Math.round(baseAtk * 2.0);
  if (DS._wildfire && Math.random() < 0.25) { baseAtk = Math.round(baseAtk * 2.0); addLog('🔥 Wild Surge!'); }
  if (DS._berserkerSub) baseAtk += Math.floor((DS.maxHp - DS.hp) / 10);
  if (DS._spellblade) baseAtk += Math.floor((DS.sp||0) / 10);
  if (DS._berserkerMark && DS.hp <= DS.maxHp * 0.5) baseAtk += 3;
  if (DS._huntersMarkReady) { baseAtk = Math.round(baseAtk * 1.5); DS._huntersMarkReady = false; addLog("🏹 Hunter's Mark!"); }
  if (DS._nightBlessing && isNightTime()) baseAtk += 5;
  if (DS.dailyChallenge === 'glassCannon') baseAtk = Math.round(baseAtk * 2.0);
  if (DS.zenStrike && DS.zenStrike > 0) { baseAtk = Math.round(baseAtk * 1.5); DS.zenStrike--; }
  if (DS.transcendence && DS.transcendence > 0) { baseAtk = Math.round(baseAtk * 2); DS.transcendence--; }
  if (DS.sacredBlade && DS.sacredBlade > 0) { baseAtk = Math.round(baseAtk * 2); DS.sacredBlade--; }
  if (DS.battlecryActive && DS.battlecryActive > 0) { baseAtk = Math.round(baseAtk * 2); DS.battlecryActive--; }
  var crit = Math.random() < 0.12;
  var dmg = Math.round(baseAtk * (crit ? 1.8 : (0.8 + Math.random() * 0.4)));
  if (crit) addLog('💥 CRIT!');
  if (part.reflectPct) { var ref = Math.round(dmg*part.reflectPct); DS.hp = Math.max(0,DS.hp-ref); updatePlayerBar(); addLog('Thornbound reflects ' + ref + ' damage!'); }
  part.hp = Math.max(0, part.hp-dmg);
  addLog('Hit ' + part.name + ' for ' + dmg + '. ' + part.hp + ' HP left.');
  say('Hit ' + part.name + ' for ' + dmg + '. ' + part.hp + ' left.');
  sfx('sfx-hit');
  if (part.hp <= 0) { addLog(part.name + ' destroyed!'); say(part.name + ' destroyed!'); sfx('sfx-enemy-die'); }
  var alive = _chimeraParts.filter(function(p){ return p.hp>0; });
  if (alive.length === 0) { chimeraVictory(); return; }
  setTimeout(function(){ chimeraEnemyTurn(); }, 700);
}

function chimeraDefend() {
  DS.defending = true;
  addLog('You brace against the Chimera.');
  say('Defending.');
  setTimeout(function(){ chimeraEnemyTurn(); }, 400);
}

function chimeraEnemyTurn() {
  var alive = _chimeraParts.filter(function(p){ return p.hp>0; });
  var log = [];
  alive.forEach(function(part) {
    if (part.regenPerTurn) { part.hp = Math.min(part.maxHp, part.hp+part.regenPerTurn); log.push('Goat Body regenerates ' + part.regenPerTurn + ' HP.'); }
    if (part.poisonsPlayer) { var pd=8; DS.hp=Math.max(0,DS.hp-pd); log.push('Serpent Tail poisons for ' + pd + '.'); }
    if (part.corruptsOnHit && isWhisperForest()) { addCorruption(part.corruptsOnHit,false); log.push('+' + part.corruptsOnHit + '% corruption.'); }
    var rd = Math.round(part.atk[0]+Math.random()*(part.atk[1]-part.atk[0]));
    if (DS.defending) rd = Math.round(rd*0.5);
    DS.hp = Math.max(0, DS.hp-rd);
    log.push(part.name + ' hits for ' + rd + '.');
  });
  DS.defending = false;
  updatePlayerBar();
  log.forEach(function(l){ addLog(l); });
  say(log.join(' '));
  if (DS.hp <= 0) { _chimeraActive = false; setTimeout(function(){ handleDeath(); }, 600); return; }
  renderChimeraScreen();
}

function chimeraVictory() {
  _chimeraActive = false; DS.inCombat = false;
  var g = DS.chimeraGold ? (DS.chimeraGold[0]+Math.floor(Math.random()*(DS.chimeraGold[1]-DS.chimeraGold[0]))) : 20;
  gainGold(g); DS.kills++; trackGlobalStat('totalKills',1); incrementAchievementStat('totalKills',1);
  incrementAchievementStat('chimeraKills',1); awardScore('enemy_kills',200);
  recordKill(DS.chimeraVariant==='whisper'?'The Corrupted Chimera':'The Chimera');
  sfx('sfx-victory');
  // Chimera is a boss-tier encounter — award boss XP
  gainXP(ENEMY_XP['boss'] || 120);
  addLog('Chimera defeated! +' + g + 'g. XP gained!');
  say('Chimera defeated! Earned ' + g + ' gold and experience.');
  showDgPanels(true,false,false);
  setEvent('good','The Chimera collapses. All parts destroyed.');
  checkAchievements();
  setTimeout(function(){ enterRoom(); }, 2000);
}

// ── ALCHEMY SYSTEM ──────────────────────────────────────────────────────────

var ALCHEMY_INGREDIENTS = [
  { id:'bone-powder',    name:'Bone Powder',     icon:'🦴', cost:8,  desc:'Ground from undead remains. Common drop from skeleton enemies.' },
  { id:'glowing-shroom', name:'Glowing Mushroom', icon:'🍄', cost:10, desc:'Found in dark dungeon corners. Bioluminescent properties.' },
  { id:'blood-vial',     name:'Blood Vial',       icon:'🩸', cost:12, desc:'Carefully collected from fallen enemies. Rare drop.' },
  { id:'void-herb',      name:'Void Herb',        icon:'🌿', cost:14, desc:'Grows only in void-touched dungeons. Resonates with dark magic.' },
  { id:'crystal-dust',   name:'Crystal Dust',     icon:'💎', cost:10, desc:'Ground from dungeon crystals. Magical conductor.' },
  { id:'ember-shard',    name:'Ember Shard',      icon:'🔥', cost:12, desc:'Drops from fire enemies. Still warm to the touch.' },
  { id:'frost-crystal',  name:'Frost Crystal',    icon:'❄️', cost:12, desc:'Drops from ice enemies. Never melts.' },
  { id:'shadow-essence', name:'Shadow Essence',   icon:'🌑', cost:15, desc:'Extracted from shadow creatures. Absorbs light.' },
  { id:'venom-gland',    name:'Venom Gland',      icon:'🐍', cost:10, desc:'Removed from serpent enemies. Handle with care.' },
  { id:'storm-spark',    name:'Storm Spark',      icon:'⚡', cost:18, desc:'Rare lightning fragment. Crackles with energy.' },
  { id:'moon-petal',     name:'Moon Petal',       icon:'🌸', cost:16, desc:'Blooms only in the deepest floors. Calming properties.' },
  { id:'iron-dust',      name:'Iron Dust',        icon:'⚙️', cost:6,  desc:'Ground iron from forge scraps. Fortifying.' },
  { id:'corrupted-core', name:'Corrupted Core',   icon:'💜', cost:20, desc:'From corrupted enemies. Unstable but powerful.' },
  { id:'golden-honey',   name:'Golden Honey',     icon:'🍯', cost:14, desc:'From the dungeon hives. Sweet and restorative.' },
];

var ALCHEMY_RECIPES = [
  // Basic heals
  { id:'basic-health',  name:'Health Potion',      icon:'🧪', ingredients:{'bone-powder':1,'golden-honey':1},
    desc:'Restores 40 HP.',
    craft: function(isAlchemist){ return {name:'Health Potion',icon:'🧪',type:'potion',heal:isAlchemist?60:40,desc:'Restores '+(isAlchemist?60:40)+' HP.'}; } },
  { id:'greater-health', name:'Greater Potion',    icon:'💊', ingredients:{'glowing-shroom':1,'bone-powder':1,'golden-honey':1},
    desc:'Restores 80 HP. Alchemists: 120 HP.',
    craft: function(isAlchemist){ return {name:'Greater Potion',icon:'💊',type:'potion',heal:isAlchemist?120:80,desc:'Restores '+(isAlchemist?120:80)+' HP.'}; } },
  // SP potions
  { id:'spirit-tonic',  name:'Spirit Tonic',       icon:'🔵', ingredients:{'crystal-dust':1,'void-herb':1},
    desc:'Restores 20 SP. Alchemists: 35 SP.',
    craft: function(isAlchemist){ return {name:'Spirit Tonic',icon:'🔵',type:'sp-potion',sp:isAlchemist?35:20,desc:'Restores '+(isAlchemist?35:20)+' SP.'}; } },
  // Status effect potions
  { id:'bloodfire',     name:'Bloodfire Potion',   icon:'🔥', ingredients:{'blood-vial':1,'ember-shard':1},
    desc:'Restores 50 HP. Burns the next enemy for 8 damage per turn for 3 turns.',
    craft: function(isAlchemist){ return {name:'Bloodfire Potion',icon:'🔥',type:'potion',heal:isAlchemist?70:50,applyEffect:'burn-next',desc:'Heals and burns next enemy.'}; },
    alchemistOnly: false },
  { id:'glacier-tonic', name:'Glacier Tonic',      icon:'❄️', ingredients:{'frost-crystal':1,'crystal-dust':1},
    desc:'Restores 50 HP. Stuns the next enemy for 1 turn.',
    craft: function(isAlchemist){ return {name:'Glacier Tonic',icon:'❄️',type:'potion',heal:isAlchemist?65:50,applyEffect:'stun-next',desc:'Heals and stuns next enemy.'}; } },
  { id:'void-draught',  name:'Void Draught',       icon:'🌑', ingredients:{'void-herb':1,'shadow-essence':1},
    desc:'Restores 40 HP. Grants +10 ATK for 4 turns.',
    craft: function(isAlchemist){ return {name:'Void Draught',icon:'🌑',type:'potion',heal:isAlchemist?55:40,applyEffect:'atk-boost',atkBoost:isAlchemist?15:10,boostTurns:4,desc:'Heals and boosts ATK.'}; } },
  { id:'antidote',      name:'Antidote',           icon:'💚', ingredients:{'venom-gland':1,'moon-petal':1},
    desc:'Cures poison and restores 30 HP.',
    craft: function(isAlchemist){ return {name:'Antidote',icon:'💚',type:'potion',heal:isAlchemist?50:30,applyEffect:'cure-poison',desc:'Cures poison and heals.'}; } },
  { id:'berserker-brew',name:'Berserker Brew',     icon:'💢', ingredients:{'blood-vial':1,'storm-spark':1},
    desc:'No HP restore. +25 ATK for 5 turns. Pure rage in a bottle.',
    craft: function(isAlchemist){ return {name:'Berserker Brew',icon:'💢',type:'potion',heal:0,applyEffect:'atk-boost',atkBoost:isAlchemist?35:25,boostTurns:5,desc:'Massive ATK boost. No healing.'}; } },
  { id:'ironflesh',     name:'Ironflesh Tonic',    icon:'⚙️', ingredients:{'iron-dust':2,'crystal-dust':1},
    desc:'Restores 30 HP. +10 DEF for 4 turns.',
    craft: function(isAlchemist){ return {name:'Ironflesh Tonic',icon:'⚙️',type:'potion',heal:isAlchemist?45:30,applyEffect:'def-boost',defBoost:isAlchemist?15:10,boostTurns:4,desc:'Heals and boosts DEF.'}; } },
  { id:'shadow-cloak',  name:'Shadow Cloak',       icon:'🌒', ingredients:{'shadow-essence':2,'void-herb':1},
    desc:'No heal. 40% chance to dodge the next 3 attacks.',
    craft: function(isAlchemist){ return {name:'Shadow Cloak',icon:'🌒',type:'potion',heal:0,applyEffect:'dodge-buff',dodgeChance:isAlchemist?0.55:0.40,dodgeTurns:isAlchemist?4:3,desc:'Grants dodge chance for several turns.'}; } },
  { id:'storm-draught', name:'Storm Draught',      icon:'⚡', ingredients:{'storm-spark':1,'crystal-dust':1},
    desc:'Restores 35 HP. Next attack crits guaranteed.',
    craft: function(isAlchemist){ return {name:'Storm Draught',icon:'⚡',type:'potion',heal:isAlchemist?50:35,applyEffect:'next-crit',desc:'Heals and guarantees next crit.'}; } },
  { id:'corrupted-brew',name:'Corrupted Brew',     icon:'💜', ingredients:{'corrupted-core':1,'blood-vial':1},
    desc:'Deals 40 damage to enemy. Heals you for same amount. Dangerous.',
    craft: function(isAlchemist){ return {name:'Corrupted Brew',icon:'💜',type:'potion',heal:0,applyEffect:'life-steal',stealAmt:isAlchemist?60:40,desc:'Steals life from enemy.'}; },
    alchemistOnly: false },
  // Tactical potions
  { id:'mirror-flask-r',  name:'Mirror Flask',      icon:'🪞', ingredients:{'crystal-dust':1,'shadow-essence':1},
    desc:'Reflects next enemy attack back at them.',
    craft: function(isAlch){ return {name:'Mirror Flask',icon:'🪞',type:'mirror-flask',desc:'Reflects next enemy attack.'}; } },
  { id:'phantom-potion-r',name:'Phantom Potion',    icon:'👻', ingredients:{'void-herb':1,'moon-petal':1},
    desc:'Untargetable for 2 turns. Alchemists: 3 turns.',
    craft: function(isAlch){ return {name:'Phantom Potion',icon:'👻',type:'phantom-potion',phantomTurns:isAlch?3:2,desc:'Untargetable for '+(isAlch?3:2)+' turns.'}; } },
  { id:'gravity-tonic-r', name:'Gravity Tonic',     icon:'🌀', ingredients:{'crystal-dust':2,'iron-dust':1},
    desc:'Enemy ATK drops to 1 for 3 turns.',
    craft: function(isAlch){ return {name:'Gravity Tonic',icon:'🌀',type:'gravity-tonic',gravityTurns:isAlch?4:3,desc:'Crushes enemy ATK for '+(isAlch?4:3)+' turns.'}; } },
  { id:'leech-brew-r',    name:'Leech Brew',        icon:'🩸', ingredients:{'blood-vial':1,'void-herb':1},
    desc:'30% life steal per hit for 4 turns.',
    craft: function(isAlch){ return {name:'Leech Brew',icon:'🩸',type:'leech-brew',leechPct:isAlch?0.45:0.30,leechTurns:isAlch?5:4,desc:'Life steal per hit for '+(isAlch?5:4)+' turns.'}; } },
  { id:'rage-tonic-r',    name:'Rage Tonic',        icon:'💢', ingredients:{'ember-shard':1,'storm-spark':1},
    desc:'Triple ATK, double damage taken for 3 turns.',
    craft: function(isAlch){ return {name:'Rage Tonic',icon:'💢',type:'rage-tonic',rageTurns:isAlch?4:3,desc:'Triple ATK for '+(isAlch?4:3)+' turns.'}; } },
  { id:'fog-flask-r',     name:'Fog Flask',         icon:'🌫️', ingredients:{'shadow-essence':1,'glowing-shroom':1},
    desc:'Enemy 70% miss chance for 3 turns.',
    craft: function(isAlch){ return {name:'Fog Flask',icon:'🌫️',type:'fog-flask',fogTurns:isAlch?4:3,desc:'Enemy misses 70% for '+(isAlch?4:3)+' turns.'}; } },
  { id:'time-potion-r',   name:'Time Potion',       icon:'⌛', ingredients:{'crystal-dust':2,'moon-petal':1},
    desc:'2 free attacks this turn. Alchemists: 3.',
    craft: function(isAlch){ return {name:'Time Potion',icon:'⌛',type:'time-potion',freeAttacks:isAlch?3:2,desc:(isAlch?3:2)+' free attacks this turn.'}; },
    alchemistOnly: false },
  { id:'corruption-flask-r',name:'Corruption Flask',icon:'💜', ingredients:{'corrupted-core':1,'void-herb':1},
    desc:'20 corruption damage to enemy per turn for 4 turns.',
    craft: function(isAlch){ return {name:'Corruption Flask',icon:'💜',type:'corruption-flask',corrDmg:isAlch?30:20,corrTurns:isAlch?5:4,desc:'Corruption damage per turn.'}; } },
  // Alchemist exclusive
  { id:'elixir-of-life', name:'Elixir of Life',   icon:'✨', ingredients:{'glowing-shroom':2,'moon-petal':2,'golden-honey':2},
    desc:'ALCHEMIST ONLY. Fully restores HP and SP.',
    craft: function(){ return {name:'Elixir of Life',icon:'✨',type:'potion',heal:9999,restoreSP:true,desc:'Fully restores HP and SP.'}; },
    alchemistOnly: true },
  { id:'philosophers',   name:"Philosopher's Brew", icon:'⭐', ingredients:{'corrupted-core':1,'storm-spark':1,'shadow-essence':1,'crystal-dust':1},
    desc:'ALCHEMIST ONLY. +5 permanent ATK, DEF, and SP for this run.',
    craft: function(){ return {name:"Philosopher's Brew",icon:'⭐',type:'potion',heal:0,applyEffect:'perm-buff',desc:'Permanent stat boost this run.'}; },
    alchemistOnly: true },
];

function getAlchemyIngredients() {
  return _jsonParseSafe(DDStore.getItem('dd_alchemy_ingredients'), '{}');
}
function saveAlchemyIngredients(ing) {
  DDStore.setItem('dd_alchemy_ingredients', JSON.stringify(ing));
}
function addAlchemyIngredient(id, amount) {
  var ing = getAlchemyIngredients();
  ing[id] = (ing[id] || 0) + (amount || 1);
  saveAlchemyIngredients(ing);
}

function isAlchemistClass() {
  var cls = DS ? DS.cls : (_charIdx !== null && CHARS[_charIdx] ? CHARS[_charIdx].cls : '');
  return cls === 'Alchemist';
}

function renderAlchemyTab() {
  var ing = getAlchemyIngredients();
  var isAlch = isAlchemistClass();
  var gold = getGlobalGold();

  // Intro text
  var introEl = document.getElementById('alchemy-intro');
  if (introEl) {
    introEl.textContent = isAlch
      ? '⚗️ Alchemist detected. Full recipe access. Your potions are stronger than normal.'
      : 'Craft potions from ingredients. As a non-Alchemist your results are weaker and some recipes are locked.';
  }

  // Ingredient shop
  var shopEl = document.getElementById('alchemy-shop-list');
  if (shopEl) {
    shopEl.innerHTML = '';
    ALCHEMY_INGREDIENTS.forEach(function(item) {
      var owned = ing[item.id] || 0;
      var btn = document.createElement('div');
      btn.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px;background:#0a000a;border:1px solid #2a002a;';
      btn.innerHTML =
        '<span style="font-size:1.1rem;" aria-hidden="true">' + item.icon + '</span>' +
        '<div style="flex:1;">' +
          '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#cc88ff;">' + item.name + ' <span style="color:#555;">×' + owned + '</span></div>' +
          '<div style="font-family:Cinzel,serif;font-size:0.58rem;color:#555;">' + item.desc + '</div>' +
        '</div>' +
        '<button onclick="buyAlchemyIngredient(\'' + item.id + '\')" aria-label="Buy ' + item.name + ' for ' + item.cost + ' gold" style="padding:4px 10px;background:#1a001a;border:1px solid #cc88ff;color:#cc88ff;font-family:Cinzel,serif;font-size:0.58rem;cursor:pointer;">' + item.cost + 'g</button>';
      shopEl.appendChild(btn);
    });
  }

  // Ingredients display
  var ingEl = document.getElementById('alchemy-ingredients-display');
  if (ingEl) {
    var keys = Object.keys(ing).filter(function(k){ return ing[k] > 0; });
    if (keys.length === 0) {
      ingEl.textContent = 'None yet. Buy from the shop or find them in dungeons.';
    } else {
      ingEl.textContent = keys.map(function(k) {
        var def = ALCHEMY_INGREDIENTS.find(function(i){ return i.id === k; });
        return (def ? def.icon + ' ' + def.name : k) + ' ×' + ing[k];
      }).join('  ·  ');
    }
  }

  // Recipes
  var recEl = document.getElementById('alchemy-recipes-list');
  if (recEl) {
    recEl.innerHTML = '';
    ALCHEMY_RECIPES.forEach(function(recipe) {
      if (recipe.alchemistOnly && !isAlch) return; // hide locked recipes from non-alchemists
      var canCraft = Object.keys(recipe.ingredients).every(function(k){ return (ing[k]||0) >= recipe.ingredients[k]; });
      var ingList = Object.keys(recipe.ingredients).map(function(k) {
        var def = ALCHEMY_INGREDIENTS.find(function(i){ return i.id === k; });
        var have = ing[k] || 0;
        var need = recipe.ingredients[k];
        var color = have >= need ? '#44ff88' : '#ff4444';
        return '<span style="color:' + color + ';">' + (def ? def.icon : '') + ' ' + (def ? def.name : k) + ' ×' + need + '</span>';
      }).join(' + ');

      var row = document.createElement('div');
      row.style.cssText = 'padding:10px;background:#0a000a;border:1px solid ' + (recipe.alchemistOnly ? '#9944ff' : '#2a002a') + ';';
      row.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
          '<span style="font-size:1.2rem;" aria-hidden="true">' + recipe.icon + '</span>' +
          '<div style="flex:1;">' +
            '<div style="font-family:Cinzel,serif;font-size:0.68rem;color:#cc88ff;">' + recipe.name + (recipe.alchemistOnly ? ' <span style="font-size:0.55rem;color:#9944ff;">[ALCHEMIST ONLY]</span>' : '') + '</div>' +
            '<div style="font-family:Cinzel,serif;font-size:0.58rem;color:#555;margin-top:2px;">' + recipe.desc + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.6rem;margin-bottom:8px;">' + ingList + '</div>' +
        '<button onclick="craftAlchemyPotion(\'' + recipe.id + '\')" aria-label="Craft ' + recipe.name + '" ' +
          (canCraft ? '' : 'disabled') +
          ' style="width:100%;padding:6px;background:' + (canCraft ? '#1a001a' : '#080808') + ';border:1px solid ' + (canCraft ? '#cc88ff' : '#333') + ';color:' + (canCraft ? '#cc88ff' : '#444') + ';font-family:Cinzel,serif;font-size:0.62rem;cursor:' + (canCraft ? 'pointer' : 'default') + ';">⚗️ Craft</button>';
      recEl.appendChild(row);
    });
  }
}

// ── ELIXIR VENDOR — sell spare elixirs, buy a rotating daily elixir ──
var VENDOR_ELIXIRS = [
  { name:'Volcanic Elixir', icon:'🌋', healPct:0.65, desc:'Restores 65% of max HP. A rare find in the wastes.' },
  { name:'Void Elixir', icon:'🌑', healPct:0.65, desc:'Restores 65% of max HP. Brewed from the abyss itself.' },
  { name:'Elixir of the Depths', icon:'💧', healPct:0.60, desc:'Restores 60% of max HP. Drawn from an eternal spring below the Archives.' },
  { name:'Hollow Elixir', icon:'🩶', healPct:0.55, desc:'Restores 55% of max HP. Left behind by someone who no longer needs it.' },
  { name:'Hellfire Elixir', icon:'🔱', healPct:0.65, desc:'Restores 65% of max HP. Distilled from infernal flame — somehow healing.' },
  { name:'Sylvan Elixir', icon:'🌿', healPct:0.60, desc:'Restores 60% of max HP. Pressed from the oldest flowers in the forest.' },
  { name:'Shadow Elixir', icon:'🌑', healPct:0.65, desc:'Restores 65% of max HP. Brewed from the dark between worlds. Glows faintly wrong.' },
  { name:'Gravebound Elixir', icon:'💀', healPct:0.60, desc:'Restores 60% of max HP. Bottled in the Crypt of Malachar.' },
  { name:'Frostbound Elixir', icon:'🧊', healPct:0.65, desc:'Restores 65% of max HP. Brewed by the vendor from ice they swear came from the Frosthold Abyss. Vendor exclusive.' },
  { name:'Tidal Elixir', icon:'🌊', healPct:0.60, desc:'Restores 60% of max HP. Drawn from the Abyssal Deep.' },
];
var VENDOR_ELIXIR_SELL_PRICE = 25;
var VENDOR_ELIXIR_BUY_PRICE = 55;

function getVendorDailyElixir() {
  var d = new Date();
  var dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return VENDOR_ELIXIRS[dayOfYear % VENDOR_ELIXIRS.length];
}

function vendorBoughtToday() {
  return DDStore.getItem('dd_elixir_vendor_last_buy') === todayKey();
}

function renderElixirVendor() {
  var listEl = document.getElementById('elixir-vendor-sell-list');
  if (listEl && DS && DS.inventory) {
    var counts = {};
    DS.inventory.forEach(function(item) {
      if (item.type === 'elixir') counts[item.name] = (counts[item.name] || 0) + 1;
    });
    var names = Object.keys(counts);
    if (names.length === 0) {
      listEl.textContent = 'No spare elixirs to sell. Find them on dungeon floors.';
    } else {
      listEl.innerHTML = '';
      names.forEach(function(name) {
        var item = DS.inventory.find(function(i){ return i.type === 'elixir' && i.name === name; });
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px;background:#0a000a;border:1px solid #2a002a;';
        row.innerHTML =
          '<span style="font-size:1.1rem;" aria-hidden="true">' + item.icon + '</span>' +
          '<div style="flex:1;font-family:Cinzel,serif;font-size:0.65rem;color:#ffcc66;">' + item.name + ' <span style="color:#555;">×' + counts[name] + '</span></div>' +
          '<button onclick="sellVendorElixir(\'' + name.replace(/'/g, "\\'") + '\')" aria-label="Sell ' + name + ' for ' + VENDOR_ELIXIR_SELL_PRICE + ' gold" style="padding:4px 10px;background:#1a1000;border:1px solid #ffcc66;color:#ffcc66;font-family:Cinzel,serif;font-size:0.58rem;cursor:pointer;">' + VENDOR_ELIXIR_SELL_PRICE + 'g</button>';
        listEl.appendChild(row);
      });
    }
  }

  var dailyEl = document.getElementById('elixir-vendor-daily');
  if (dailyEl) {
    var daily = getVendorDailyElixir();
    var bought = vendorBoughtToday();
    dailyEl.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;padding:8px;background:#0a000a;border:1px solid #443300;margin-bottom:8px;">' +
        '<span style="font-size:1.3rem;" aria-hidden="true">' + daily.icon + '</span>' +
        '<div style="flex:1;">' +
          '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#ffcc66;">' + daily.name + '</div>' +
          '<div style="font-family:Cinzel,serif;font-size:0.58rem;color:#555;">' + daily.desc + '</div>' +
        '</div>' +
      '</div>' +
      '<button onclick="buyVendorDailyElixir()" ' + (bought ? 'disabled' : '') + ' aria-label="' +
        (bought ? 'Already bought today\'s elixir. Come back tomorrow.' : 'Buy today\'s elixir, ' + daily.name + ', for ' + VENDOR_ELIXIR_BUY_PRICE + ' gold') +
        '" style="width:100%;padding:8px;background:' + (bought ? '#080808' : '#1a1000') + ';border:1px solid ' + (bought ? '#333' : '#ffcc66') + ';color:' + (bought ? '#444' : '#ffcc66') + ';font-family:Cinzel,serif;font-size:0.62rem;cursor:' + (bought ? 'default' : 'pointer') + ';">' +
        (bought ? '✓ Bought Today' : '🛒 Buy — ' + VENDOR_ELIXIR_BUY_PRICE + 'g') + '</button>';
  }
}

function sellVendorElixir(name) {
  if (!DS || !DS.inventory) return;
  var idx = DS.inventory.findIndex(function(i){ return i.type === 'elixir' && i.name === name; });
  if (idx === -1) return;
  DS.inventory.splice(idx, 1);
  addGlobalGold(VENDOR_ELIXIR_SELL_PRICE);
  sfx('sfx-select');
  say('Sold ' + name + ' for ' + VENDOR_ELIXIR_SELL_PRICE + ' gold.');
  renderElixirVendor();
  updateTopBar();
}

function buyVendorDailyElixir() {
  if (vendorBoughtToday()) { say('Already bought the elixir vendor\'s special today. Come back tomorrow.'); return; }
  var gold = getGlobalGold();
  if (gold < VENDOR_ELIXIR_BUY_PRICE) { say('Not enough gold. Need ' + VENDOR_ELIXIR_BUY_PRICE + 'g.'); return; }
  var daily = getVendorDailyElixir();
  spendGlobalGold(VENDOR_ELIXIR_BUY_PRICE);
  DDStore.setItem('dd_elixir_vendor_last_buy', todayKey());
  var elixir = { name: daily.name, icon: daily.icon, type: 'elixir', healPct: daily.healPct, desc: daily.desc };
  if (DS && DS.inventory) {
    DS.inventory.push(elixir);
    renderInv();
  } else {
    var stored = _jsonParseSafe(DDStore.getItem('dd_alchemy_stored'), '[]');
    stored.push(elixir);
    DDStore.setItem('dd_alchemy_stored', JSON.stringify(stored));
  }
  sfx('sfx-confirm');
  say('Bought ' + daily.name + ' from the vendor.');
  renderElixirVendor();
  updateTopBar();
}

function buyAlchemyIngredient(id) {
  var def = ALCHEMY_INGREDIENTS.find(function(i){ return i.id === id; });
  if (!def) return;
  var gold = getGlobalGold();
  if (gold < def.cost) { say('Not enough gold. Need ' + def.cost + 'g.'); return; }
  spendGlobalGold(def.cost);
  addAlchemyIngredient(id, 1);
  sfx('sfx-select');
  say('Bought ' + def.name + '.');
  renderAlchemyTab();
}

function craftAlchemyPotion(recipeId) {
  var recipe = ALCHEMY_RECIPES.find(function(r){ return r.id === recipeId; });
  if (!recipe) return;
  var ing = getAlchemyIngredients();
  var isAlch = isAlchemistClass();

  if (recipe.alchemistOnly && !isAlch) { say('This recipe requires the Alchemist class.'); return; }
  var canCraft = Object.keys(recipe.ingredients).every(function(k){ return (ing[k]||0) >= recipe.ingredients[k]; });
  if (!canCraft) { say('Not enough ingredients.'); return; }

  // Spend ingredients
  Object.keys(recipe.ingredients).forEach(function(k){ ing[k] = (ing[k]||0) - recipe.ingredients[k]; });
  saveAlchemyIngredients(ing);

  // For non-alchemists on standard recipes — 20% chance of random effect instead
  var potion;
  if (!isAlch && !recipe.alchemistOnly && Math.random() < 0.20) {
    // Random result
    var basicPotions = [
      {name:'Unstable Brew',icon:'🧪',type:'potion',heal:25,desc:'Something went wrong. Heals 25 HP.'},
      {name:'Mystery Tonic',icon:'❓',type:'potion',heal:50,desc:'Tastes odd. Heals 50 HP.'},
      {name:'Lucky Accident',icon:'🍀',type:'potion',heal:0,applyEffect:'next-crit',desc:'Somehow gives next crit.'},
    ];
    potion = basicPotions[Math.floor(Math.random() * basicPotions.length)];
    var resultEl = document.getElementById('alchemy-result');
    var resultText = document.getElementById('alchemy-result-text');
    if (resultEl) resultEl.style.display = '';
    if (resultText) resultText.textContent = 'Something went wrong with the brew... You got: ' + potion.icon + ' ' + potion.name + '. ' + potion.desc;
    say('Unstable brew! You got a ' + potion.name + ' instead.');
  } else {
    potion = recipe.craft(isAlch);
    var resultEl = document.getElementById('alchemy-result');
    var resultText = document.getElementById('alchemy-result-text');
    if (resultEl) resultEl.style.display = '';
    if (resultText) resultText.textContent = 'Crafted: ' + potion.icon + ' ' + potion.name + '. ' + potion.desc + (isAlch ? ' (Alchemist bonus applied!)' : '');
    say('Crafted ' + potion.name + '!' + (isAlch ? ' Alchemist bonus applied.' : ''));
  }

  // Add to inventory
  if (DS && DS.inventory) {
    DS.inventory.push(potion);
    renderInv();
  } else {
    // Store for next run if not in dungeon
    var stored = _jsonParseSafe(DDStore.getItem('dd_alchemy_stored'), '[]');
    stored.push(potion);
    DDStore.setItem('dd_alchemy_stored', JSON.stringify(stored));
    say('Potion stored. It will be available in your next dungeon run.');
  }

  sfx('sfx-confirm');
  renderAlchemyTab();
}

// Apply special potion effects when used
function applyPotionEffect(potion) {
  if (!potion.applyEffect) return;
  switch (potion.applyEffect) {
    case 'burn-next':
      DS._potionBurnNext = true;
      addLog('🔥 Bloodfire active — next enemy will burn for 3 turns!');
      break;
    case 'stun-next':
      DS._potionStunNext = true;
      addLog('❄️ Glacier Tonic active — next enemy will be stunned 1 turn!');
      break;
    case 'atk-boost':
      DS.atkBonus = (DS.atkBonus || 0) + (potion.atkBoost || 10);
      DS._atkBoostTurns = (DS._atkBoostTurns || 0) + (potion.boostTurns || 4);
      DS._lastAtkBoost = potion.atkBoost || 10;
      addLog('💢 ATK +'  + potion.atkBoost + ' for ' + potion.boostTurns + ' turns!');
      say('ATK boosted by ' + potion.atkBoost + ' for ' + potion.boostTurns + ' turns.');
      updatePlayerBar();
      break;
    case 'def-boost':
      DS.defBonus = (DS.defBonus || 0) + (potion.defBoost || 10);
      DS._defBoostTurns = (DS._defBoostTurns || 0) + (potion.boostTurns || 4);
      DS._lastDefBoost = potion.defBoost || 10;
      addLog('⚙️ DEF +' + potion.defBoost + ' for ' + potion.boostTurns + ' turns!');
      say('DEF boosted by ' + potion.defBoost + ' for ' + potion.boostTurns + ' turns.');
      updatePlayerBar();
      break;
    case 'cure-poison':
      DS.venomTurns = 0;
      DS.poisoned = false;
      addLog('💚 Poison cured!');
      say('Poison cured!');
      break;
    case 'next-crit':
      DS.markedKill = true;
      addLog('⚡ Next attack is guaranteed to critically hit!');
      say('Next attack is a guaranteed crit.');
      break;
    case 'dodge-buff':
      DS._dodgeBuff = potion.dodgeChance;
      DS._dodgeBuffTurns = potion.dodgeTurns;
      addLog('🌒 Shadow Cloak! ' + Math.round(potion.dodgeChance * 100) + '% dodge for ' + potion.dodgeTurns + ' turns!');
      say('Shadow Cloak active. Dodge chance boosted for ' + potion.dodgeTurns + ' turns.');
      break;
    case 'life-steal':
      var steal = Math.min(DS.enemy ? DS.enemy.hp : 0, potion.stealAmt);
      if (DS.enemy) DS.enemy.hp = Math.max(0, DS.enemy.hp - steal);
      DS.hp = Math.min(DS.maxHp, DS.hp + steal);
      addLog('💜 Corrupted Brew! Stole ' + steal + ' life from ' + (DS.enemy ? DS.enemy.name : 'enemy') + '!');
      say('Life steal! Stole ' + steal + ' HP from enemy.');
      updatePlayerBar(); updateEnemyBar();
      if (DS.enemy && DS.enemy.hp <= 0) setTimeout(function(){ enemyDead(); }, 300);
      break;
    case 'perm-buff':
      DS.atkBonus = (DS.atkBonus || 0) + 5;
      DS.defBonus = (DS.defBonus || 0) + 5;
      DS.maxSp = (DS.maxSp || 20) + 5;
      DS.sp = Math.min(DS.maxSp, DS.sp + 5);
      addLog('⭐ Philosopher\'s Brew! +5 ATK, +5 DEF, +5 Max SP permanently this run!');
      say('Philosopher\'s Brew! Permanent stats boosted for this run.');
      updatePlayerBar();
      break;
    case 'restoreSP':
      DS.sp = DS.maxSp;
      updatePlayerBar();
      break;
  }
  // Full restore (Elixir of Life)
  if (potion.heal >= 9999) {
    DS.hp = DS.maxHp;
    if (potion.restoreSP) DS.sp = DS.maxSp;
    updatePlayerBar();
    addLog('✨ Elixir of Life! Fully restored!');
    say('Elixir of Life! HP and SP fully restored.');
  }
}

// Tick ATK/DEF boost turns
// Drop ingredients from enemies (10% chance per kill)
function alchemyDropOnKill(enemy) {
  if (Math.random() > 0.10) return;
  var pool = [];
  if (enemy.seasonal === 'halloween' || (enemy.name && enemy.name.toLowerCase().indexOf('skeleton') !== -1) || (enemy.name && enemy.name.toLowerCase().indexOf('bone') !== -1) || (enemy.name && enemy.name.toLowerCase().indexOf('undead') !== -1)) pool.push('bone-powder');
  if (enemy.seasonal === 'stpatricks' || (enemy.name && enemy.name.toLowerCase().indexOf('void') !== -1)) pool.push('void-herb');
  if (enemy.name && (enemy.name.toLowerCase().indexOf('shadow') !== -1 || enemy.name.toLowerCase().indexOf('shade') !== -1)) pool.push('shadow-essence');
  if (enemy.name && (enemy.name.toLowerCase().indexOf('fire') !== -1 || enemy.name.toLowerCase().indexOf('flame') !== -1 || enemy.name.toLowerCase().indexOf('ember') !== -1)) pool.push('ember-shard');
  if (enemy.name && (enemy.name.toLowerCase().indexOf('frost') !== -1 || enemy.name.toLowerCase().indexOf('ice') !== -1 || enemy.name.toLowerCase().indexOf('frozen') !== -1)) pool.push('frost-crystal');
  if (enemy.name && (enemy.name.toLowerCase().indexOf('serpent') !== -1 || enemy.name.toLowerCase().indexOf('snake') !== -1 || enemy.name.toLowerCase().indexOf('cobra') !== -1 || enemy.name.toLowerCase().indexOf('venom') !== -1)) pool.push('venom-gland');
  if (enemy.name && enemy.name.toLowerCase().indexOf('corrupt') !== -1) pool.push('corrupted-core');
  // Always add some common ones
  pool.push('bone-powder'); pool.push('glowing-shroom'); pool.push('golden-honey');
  var drop = pool[Math.floor(Math.random() * pool.length)];
  var def = ALCHEMY_INGREDIENTS.find(function(i){ return i.id === drop; });
  addAlchemyIngredient(drop, 1);
  if (def) addLog('🧪 Found: ' + def.icon + ' ' + def.name + ' (Alchemy ingredient)');
}

// ── END ALCHEMY SYSTEM ──────────────────────────────────────────────────────
function spawnTheShade() {
  DS.enemy = { name:'The Shade', icon:'🌑', hp:289, maxHp:289, atk:[18,28], gold:[40,70], isShadeElite:true };
  DS.inCombat = true; DS.defending = false;
  showDgPanels(false,true,false);
  document.getElementById('dg-enemy-icon').textContent = '🌑';
  document.getElementById('dg-enemy-name').textContent = t('The Shade');
  updateEnemyBar(); updatePlayerBar(); setCombatBtns(true); updateSkillButtons();
  addLog('Something darker than darkness steps from the wall. The Shade. 289 HP.');
  say('The Shade appears. 289 HP. Attacks for 18 to 28. Sometimes strikes multiple times.');
  sfx('sfx-enemy-die');
  setTimeout(function() { var a = document.getElementById('cbtn-attack'); if (a) a.focus(); }, 200);
}

function applyShadeSpecialHit(dmg) {
  if (!DS.enemy || !DS.enemy.isShadeElite) return dmg;
  if (Math.random() < 0.30) {
    var hits = [dmg, Math.round(dmg*0.6), Math.round(dmg*0.4)];
    var total = hits.reduce(function(a,b){return a+b;},0);
    addLog('The Shade strikes THREE times! ' + hits.join(' + ') + ' = ' + total + '!');
    say('Triple strike! ' + total + ' total damage!');
    if (DS.diff==='Insane' && typeof DS.sanity!=='undefined') { DS.sanity=Math.max(0,DS.sanity-15); updateSanityBar(); addLog('-15 sanity.'); }
    if (isWhisperForest()) { addCorruption(20,true); }
    return total;
  }
  if (DS.diff==='Insane' && typeof DS.sanity!=='undefined') { DS.sanity=Math.max(0,DS.sanity-8); updateSanityBar(); }
  if (isWhisperForest()) { addCorruption(12,true); }
  return dmg;
}


function gainGold(amount) {
  if (!amount || amount <= 0) return;
  var g = Math.round(amount);
  if (DS.goblinGold) g = Math.round(g * 1.25);
  if (isNightTime()) g = Math.round(g * 1.50);
  if (DS.runModGoldBoost) g = Math.round(g * DS.runModGoldBoost);
  if (DS.activeSpirit && DS.activeSpirit.isCustomBuilt && DS.activeSpirit.abilityId === 'gold-boost') g = Math.round(g * 1.25);
  DS.gold += g; addGlobalGold(g);
  updateTopBar();
  if (typeof awardScore === 'function') awardScore('gold_earned', g);
}


// ── CINCO DE MAYO EXCLUSIVE WEAPON ──
var CINCO_WEAPON = {
  id:'taco-blade', name:'El Taco Blade', icon:'🌮', type:'weapon', weaponType:'sword',
  level:1, cost:75, atkBase:[8,16], isEquippable:true, cincoExclusive:true,
  desc:'A blade forged on Cinco de Mayo. Only available May 5th. Hits hard and smells like cilantro.'
};

// ── ENCHANTER ITEMS ──
function tryDropEnchanter() {
  if (Math.random() < 0.025) {
    var enchanter = { name:'Enchanter', icon:'✨', type:'enchanter', charges:3, desc:'Rare crystal. Use at the Blacksmith for 3 free weapon upgrades.' };
    DS.inventory.push(enchanter);
    addToGlobalInventory(enchanter);
    addLog('✨ Enchanter dropped! Use at the Blacksmith to upgrade for free.');
    say('Enchanter found! Rare crystal — grants 3 free weapon upgrades at the Blacksmith.');
    sfx('sfx-loot');
  }
}

function useEnchanter(forceFromMenu) {
  var useGlobal = forceFromMenu || DS._fromMenu;
  var inv = useGlobal ? getGlobalInventory() : DS.inventory;
  var idx = -1;
  for (var i = 0; i < inv.length; i++) { if (inv[i].type === 'enchanter' && inv[i].charges > 0) { idx = i; break; } }
  if (idx === -1) return false;
  inv[idx].charges--;
  if (inv[idx].charges <= 0) inv.splice(idx, 1);
  if (useGlobal) saveGlobalInventory(inv);
  else DS.inventory = inv;
  return true;
}

function useMusicPlayerItem() {
  var ov = document.getElementById('ov-music-player');
  var panel = document.getElementById('ov-music-panel');
  if (!ov || !panel) { goTo('chronicles'); setTimeout(function(){ switchChroniclesTab('music'); }, 300); return; }

  // Build music player content in overlay panel
  panel.innerHTML = '';

  // Player controls
  var controls = document.createElement('div');
  controls.className = 'music-player';
  controls.innerHTML =
    '<div class="mp-now-playing">NOW PLAYING</div>' +
    '<div class="mp-track-name" id="ov-mp-track-name">Select a track below</div>' +
    '<div class="mp-controls">' +
      '<button class="mp-btn" onclick="mpPlay()" aria-label="Play selected track">▶ Play</button>' +
      '<button class="mp-btn" onclick="mpStop()" aria-label="Stop music">■ Stop</button>' +
      '<button class="mp-btn" id="ov-mp-loop-btn" onclick="toggleMusicLoop()" aria-label="Loop all songs">🔁 Loop All: Off</button>' +
    '</div>';
  panel.appendChild(controls);

  // Group tracks
  var grouped = {};
  var order = [];
  MUSIC_CATALOGUE.forEach(function(t) {
    if (!grouped[t.dungeon]) { grouped[t.dungeon] = []; order.push(t.dungeon); }
    grouped[t.dungeon].push(t);
  });
  order.forEach(function(dungeon) {
    var sec = document.createElement('div');
    sec.className = 'mp-section';
    var title = document.createElement('div');
    title.className = 'mp-section-title';
    title.textContent = dungeon.toUpperCase();
    sec.appendChild(title);
    grouped[dungeon].forEach(function(track) {
      var btn = document.createElement('button');
      btn.className = 'mp-track-btn';
      btn.setAttribute('aria-label', track.label);
      btn.dataset.key = track.key;
      btn.innerHTML = '<span>' + track.label + '</span>';
      btn.onclick = function() { mpSelect(this); };
      sec.appendChild(btn);
    });
    panel.appendChild(sec);
  });

  ov.style.display = 'flex';
  say('Music Player open. Select a track to play. Tap Back to Dungeon to return to your run.');
  setTimeout(function(){ var b = ov.querySelector('button'); if(b) b.focus(); }, 100);
}

function closeMusicPlayerOverlay() {
  var ov = document.getElementById('ov-music-player');
  if (ov) ov.style.display = 'none';
  say('Music Player closed. Returning to dungeon.');
}

//═════════════════
// BIRTHDAY EVENT SYSTEM
//═════════════════
var BIRTHDAY_CODES = {
  'DDBD26': { year:2026, gold:1000, discount:0.15 },
  'DDBD27': { year:2027, gold:1000, discount:0.15 },
  'DDBD28': { year:2028, gold:1000, discount:0.15 },
};

var BIRTHDAY_SPIRIT = {
  id:'birthday-spirit', name:'The Founder', icon:'🎂', rarity:'legendary',
  ability:'Once per floor — deals damage equal to 10% of enemy max HP.',
  desc:'Born on the day Dungeon Descent launched. It remembers the beginning.',
  isCustomBuilt:false
};

var GOLDEN_SWORD = {
  id:'golden-sword', name:'The Golden Sword', icon:'🗡️', type:'weapon',
  weaponType:'sword', level:5, atkBase:[15,25], isEquippable:true,
  desc:'Forged on the first birthday of Dungeon Descent. Exists in only one copy per player.',
  birthdayExclusive:true
};

function isBirthday() {
  var now = new Date();
  return now.getMonth() === 2 && now.getDate() === 23;
}

function initBirthdayEvent() {
  if (!isBirthday()) return;
  var badge = document.getElementById('menu-birthday-badge');
  if (badge) badge.style.display = '';
  playTrack('menu-birthday');
  say('Happy Birthday Dungeon Descent! One year of descending. Tap the birthday badge to celebrate.');
}

function openBirthdayScreen() {
  var ov = document.getElementById('ov-birthday');
  if (!ov) return;
  ov.style.display = 'flex';
  var codeSection = document.getElementById('birthday-code-section');
  if (codeSection) codeSection.style.display = 'none';
  say('Birthday screen. Dungeon Descent. Born March 23 2025. Built by Leo Productions. Tap Claim Birthday Reward.');
  setTimeout(function(){ var btn = ov.querySelector('button'); if(btn) btn.focus(); }, 100);
}

function closeBirthdayScreen() {
  var ov = document.getElementById('ov-birthday');
  if (ov) ov.style.display = 'none';
  playTrack(getMenuTrack());
}

function claimBirthdayReward() {
  var claimed = DDStore.getItem('dd_birthday_claimed_2026');
  if (claimed) {
    var cs = document.getElementById('birthday-code-section');
    if (cs) cs.style.display = '';
    say('Already claimed. Here is your code again. D D B D 2 6.');
    return;
  }
  addGlobalGold(500);
  DDStore.setItem('dd_birthday_claimed_2026', 'true');
  var cs = document.getElementById('birthday-code-section');
  if (cs) cs.style.display = '';
  sfx('sfx-unlock');
  say('Birthday reward claimed! 500 gold added. Your code is D D B D 2 6. Go to Settings, Redeem Code, enter it for the full birthday package.');
}

function copyBirthdayCode() {
  var code = 'DDBD26';
  var msg = document.getElementById('birthday-copy-msg');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(function(){
      if(msg) msg.textContent = '✓ Copied!';
      say('Code copied. Go to Settings then Redeem Code and paste it.');
      setTimeout(function(){ if(msg) msg.textContent=''; }, 2500);
    }).catch(function(){
      if(msg) msg.textContent = 'Type manually: DDBD26';
      say('Code is D D B D 2 6. Type it in Settings, Redeem Code.');
    });
  } else {
    if(msg) msg.textContent = 'Type manually: DDBD26';
    say('Code is D D B D 2 6. Go to Settings, Redeem Code.');
  }
}

function openRedeemCode() {
  openSettingsPanel('redeem');
  setTimeout(function(){ var inp = document.getElementById('redeem-code-input'); if(inp) inp.focus(); }, 200);
  say('Redeem Code. Enter your code and tap Redeem.');
}

function openSendFeedback() {
  openSettingsPanel('feedback');
  setTimeout(function(){ var inp = document.getElementById('feedback-message'); if(inp) inp.focus(); }, 200);
  say('Send Feedback. Choose a type, write your message, and tap Send.');
}

// Reuses the same Formspree endpoint the support.html contact form posts
// to, so feedback from in-game and from the website both land in the
// same inbox. Sends the signed-in player's email as _replyto (if
// signed in) so replying in the inbox reaches them directly — same
// convention as the website form, and the same bug that form had
// (_replyto hardcoded to the dev's own address) is deliberately not
// repeated here.
async function sendFeedback() {
  var typeSel = document.getElementById('feedback-type');
  var msgInput = document.getElementById('feedback-message');
  var statusEl = document.getElementById('feedback-msg');
  var btn = document.getElementById('feedback-submit-btn');
  if (!msgInput || !statusEl) return;
  var message = msgInput.value.trim();
  if (!message) { statusEl.textContent = 'Please write a message first.'; statusEl.style.color = '#ff4444'; say('Please write a message first.'); return; }

  var user = getFirebaseUser();
  var email = (user && user.email) ? user.email : 'no-reply@dungen-descent.org';
  var payload = {
    type: typeSel ? typeSel.value : 'Something else',
    message: message,
    email: email,
    platform: (window.Capacitor && typeof Capacitor.getPlatform === 'function') ? Capacitor.getPlatform() : 'web',
    gameVersion: (typeof CURRENT_VERSION !== 'undefined') ? CURRENT_VERSION : 'unknown',
    _replyto: email,
  };

  if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
  statusEl.textContent = '';
  try {
    var response = await fetch('https://formspree.io/f/mkjnkenn', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Formspree error: ' + response.status);
    msgInput.value = '';
    statusEl.style.color = '#44ff88';
    statusEl.textContent = '✅ Sent. Thank you!';
    say('Feedback sent. Thank you!');
  } catch(e) {
    statusEl.style.color = '#ff4444';
    statusEl.textContent = 'Could not send. Check your connection and try again.';
    say('Could not send feedback. Check your connection and try again.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📨 Send'; }
  }
}

function redeemCode() {
  var input = document.getElementById('redeem-code-input');
  var msg = document.getElementById('redeem-msg');
  if (!input || !msg) return;
  var code = input.value.trim().toUpperCase();
  if (!code) { msg.textContent='Please enter a code.'; msg.style.color='#ff4444'; say('Please enter a code.'); return; }

  // ── SHADOW REALM ──
  if (code === 'SHADOW') {
    input.value = '';
    msg.textContent = '';
    closeSettingsPanel('redeem');
    closeSettings();
    setTimeout(function() { openShadowRealmIntro(); }, 300);
    return;
  }

  // Secret console codes — work from redeem box too
  if (_SECRET_CODES && _SECRET_CODES[code]) {
    input.value = '';
    msg.textContent = '...';
    msg.style.color = '#00ff00';
    closeSettingsPanel('redeem');
    setTimeout(function() {
      openConsole();
      setTimeout(function(){ consoleLog('> ' + code); executeCode(code); }, 400);
    }, 300);
    return;
  }

  // Birthday codes (DDBD26, DDBD27 etc)
  if (BIRTHDAY_CODES[code]) {
    if (DDStore.getItem('dd_redeemed_' + code)) { msg.textContent='Already redeemed on this device.'; msg.style.color='#ff4444'; say('Code already redeemed.'); return; }
    var data = BIRTHDAY_CODES[code];
    addGlobalGold(data.gold);
    DDStore.setItem('dd_blacksmith_discount', JSON.stringify({pct:data.discount,source:'Birthday '+data.year}));
    var inv = getGlobalInventory();
    if (!inv.some(function(i){ return i.id==='golden-sword'; })) addToGlobalInventory(Object.assign({}, GOLDEN_SWORD));
    if (!RARE_SPIRITS.some(function(s){ return s.id==='birthday-spirit'; })) RARE_SPIRITS.push(BIRTHDAY_SPIRIT);
    CHARS.forEach(function(ch){ if(!ch)return; if(!ch.earnedSpirits)ch.earnedSpirits=[]; if(ch.earnedSpirits.indexOf('birthday-spirit')===-1)ch.earnedSpirits.push('birthday-spirit'); });
    saveChars();
    DDStore.setItem('dd_redeemed_' + code, 'true');
    input.value='';
    msg.textContent='Birthday code redeemed! +' + data.gold + 'g, 15% Blacksmith discount, The Golden Sword, The Founder spirit!';
    msg.style.color='#44aa44'; sfx('sfx-unlock');
    say('Birthday code redeemed! ' + data.gold + ' gold and exclusive rewards unlocked!'); return;
  }

  // Void Reaper codes (VOID-XXXX-XXXX)
  var redeemed = _jsonParseSafe(DDStore.getItem('dd_redeemed_codes'), '[]');
  if (redeemed.indexOf(code) !== -1) { msg.textContent='Already redeemed.'; msg.style.color='#ff4444'; say('Already redeemed.'); return; }
  if (code.match(/^VOID-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
    var seed = 0;
    for (var i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) & 0xffff;
    var prize = REWARD_CODE_PRIZES[seed % REWARD_CODE_PRIZES.length];
    prize.apply();
    redeemed.push(code);
    DDStore.setItem('dd_redeemed_codes', JSON.stringify(redeemed));
    input.value='';
    msg.textContent='Void code redeemed! You received: ' + prize.label + '.';
    msg.style.color='#44aa44'; sfx('sfx-unlock');
    say('Void code redeemed! You received ' + prize.label + '.'); return;
  }

  msg.textContent='Invalid code. Birthday codes look like DDBD26. Void Reaper codes look like VOID-XXXX-XXXX.';
  msg.style.color='#ff4444'; say('Invalid code. Check spelling and try again.');
}
