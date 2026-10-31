//═════════════════
// EMBERS & INIT
//═════════════════
function spawnEmbers() {
  var c = document.getElementById('embers');
  for (var i = 0; i < 22; i++) {
    var e = document.createElement('div');
    e.className = 'ember';
    e.style.setProperty('--x', Math.random() * 100 + 'vw');
    e.style.setProperty('--dur', (6 + Math.random() * 8) + 's');
    e.style.setProperty('--delay', (Math.random() * 10) + 's');
    e.style.setProperty('--drift', ((Math.random() - 0.5) * 80) + 'px');
    c.appendChild(e);
  }
}

// Everything below touches DDStore-backed game state (characters, prefs, save
// data), so it all waits for IndexedDB to finish hydrating before running. This
// is the fix for the "characters disappear / tutorial and SR prompt reappear on
// refresh" bug: nothing reads storage until it's actually ready, so there's no
// window where a synchronous read can race ahead of IndexedDB and see nothing.
DDStore.whenReady().then(function() {
  // Hydrate the handful of top-level variables that used to read DDStore directly
  // at script-parse time (see their declarations above — each now starts with a
  // safe default and gets its real value here, once storage is actually ready).
  // Guarded the same way every OTHER CHARS-reload site in the file already is
  // (e.g. the save-import fix elsewhere this session) — this is the single
  // most critical one, since it gates this entire ~300-line startup block
  // (ember spawn, audio init listeners, Firebase auth init, everything below).
  // Malformed dd_chars JSON here used to throw synchronously and silently
  // skip the whole block instead of just falling back to an empty roster.
  try { CHARS = _jsonParseSafe(DDStore.getItem('dd_chars'), '[]'); } catch(e) { CHARS = []; }
  _chaosMode = DDStore.getItem('dd_chaos_mode') === '1';
  try { bestiaryKills = _jsonParseSafe(DDStore.getItem('dd_bestiary'), '{}'); } catch(e) { bestiaryKills = {}; }
  try { _earnedMilestones = _jsonParseSafe(DDStore.getItem('dd_milestones'), '{}'); } catch(e) { _earnedMilestones = {}; }
  _musicBoxTutorialSeen = DDStore.getItem('dd_mb_tutorial') === '1';
  var _shakePref = DDStore.getItem('dd_shake');
  if (_shakePref !== null) _shakeEnabled = _shakePref === '1';

  // checkWhatsNew() was fully built — version tag updates, migration animation,
  // the What's New popup itself — but never actually called from anywhere, so
  // the popup could never show. Called here now that storage is actually ready
  // (it reads dd_version_seen), same as everything else hydrated above it.
  checkWhatsNew();

  spawnEmbers();
  setTimeout(function(){ try { cleanupMusicPlayers(); } catch(e){} }, 1000);
  var _audioLoaded = false;
  function initAudio() {
    initWebAudio(); // Must run first so GainNode exists before music starts
    if (!_audioLoaded) {
      _audioLoaded = true;
      loadAudio();
      // Start menu music immediately on first touch — don't wait for goTo
      setTimeout(function() {
        if (AUD && AUD.musicOn && (!AUD.current || AUD.current === '')) {
          try { playTrack(getMenuTrack()); } catch(e) {}
        }
      }, 300);
    }
  }
  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('keydown', initAudio, { once: true });
  document.addEventListener('touchstart', initAudio, { once: true }); // iOS: first touch unlocks audio
  document.addEventListener('touchend', initAudio, { once: true });   // belt and braces

  // iOS Capacitor cold launch: start loading + playing immediately, no gesture needed.
  // Capacitor's WKWebView disables the media-autoplay-requires-gesture restriction,
  // so the plain <audio> fallback in _playTrackFallback() plays right away here.
  // (Only the raw Web Audio AudioContext needs a real gesture — that kicks in once
  // the user's first tap fires initWebAudio(), for GainNode-based volume control.)
  if (window.Capacitor && !_audioLoaded) {
    setTimeout(function() {
      if (!_audioLoaded) { _audioLoaded = true; loadAudio(); }
    }, 400);
  }

  // Resume Web Audio context + restart playback when app comes back from background.
  // iOS suspends (and sometimes silently kills) the audio context when the app is
  // backgrounded or the screen locks, and WKWebView can leave AudioContext.state
  // reporting 'running' even though it is actually dead — so always try to resume/
  // recreate rather than trusting the reported state.
  function _ddResumeAudioOnForeground() {
    if (!AUD) return;
    var cur = AUD.current;
    var ambKey = AUD._pausedAmbientKey;
    AUD._pausedAmbientKey = null;
    function restartPlayback() {
      if (AUD.musicOn && cur && !AUD.currentSource) {
        AUD.current = null;
        playTrack(cur);
      }
      if (AUD.ambientOn && ambKey) {
        try { playAmbient(ambKey); } catch(e) {}
      }
    }
    if (AUD.ctx) {
      AUD.ctx.resume().then(function() {
        if (AUD.ctx.state === 'running') {
          restartPlayback();
        } else {
          // Context is stuck (iOS killed the audio hardware session) — rebuild it.
          try { AUD.ctx.close(); } catch(e) {}
          AUD.ctx = null;
          _webAudioReady = false;
          initWebAudio();
          restartPlayback();
        }
      }).catch(function(e) {
        console.warn('[DD Audio] Failed to resume context, rebuilding:', e);
        try { AUD.ctx && AUD.ctx.close(); } catch(e2) {}
        AUD.ctx = null;
        _webAudioReady = false;
        initWebAudio();
        restartPlayback();
      });
    } else {
      restartPlayback();
    }
  }

  function _ddSuspendAudioOnBackground() {
    if (!AUD) return;
    // Remember what was playing so we can restore it exactly on foreground
    AUD._pausedAmbientKey = _ambientTrack;
    if (AUD.currentSource) {
      try { AUD.currentSource.stop(); } catch(e) {}
      AUD.currentSource = null;
    }
    if (AUD.ctx && AUD.ctx.state === 'running') {
      AUD.ctx.suspend().catch(function() {});
    }
    try { stopAmbient(); } catch(e) {}
    try { stopHunterMusic(); } catch(e) {}
    try {
      if (window._hunterMusicEl) { _hunterMusicEl.pause(); }
      if (window._heartbeatEl) { _heartbeatEl.pause(); }
    } catch(e) {}
  }

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      _ddResumeAudioOnForeground();
    } else {
      _ddSuspendAudioOnBackground();
    }
  });

  // Also handle Capacitor app state changes (when wrapped as native app)
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener('appStateChange', function(state) {
      if (state.isActive) {
        _ddResumeAudioOnForeground();
      } else {
        _ddSuspendAudioOnBackground();
      }
    });
  }

  var _safariAudioUnlocked = false;
  function unlockSafariAudio() {
    if (_safariAudioUnlocked) return;
    _safariAudioUnlocked = true;
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume().then(function() { ctx.close(); }).catch(function() {});
    } catch(e) {}
  }
  document.addEventListener('click', unlockSafariAudio, { once: true });
  document.addEventListener('touchstart', unlockSafariAudio, { once: true });
  // Load accessibility prefs on page load
  loadAccessPrefs();
  // Wrap saveChars() so every save also fires a background cloud sync
  // (no-ops until the player is actually signed in — see initAccountSync())
  try { initAccountSync(); } catch(e) {}
  updateGlobalGoldDisplay();
  updateDiamondDisplay();
  refreshInfernalCard();
  loadSavedLanguage();
  loadAchSoundSetting();
  setTimeout(function(){ updateMenuEnemyCount(); }, 2000);

  // Seasonal event startup
  (function() {
    var ev = getEventBonuses();
    var btn = document.getElementById('menu-btn-seasonal-shop');
    if (ev && ev.seasonalCurrency && btn) {
      btn.style.display = '';
      var icon = document.getElementById('menu-btn-seasonal-icon');
      var label = document.getElementById('menu-btn-seasonal-label');
      var names = { demonCoins:'Curse Shop', christmasCookies:'Santa Shop', harvestTokens:'Harvest Market' };
      var icons = { demonCoins:'💀', christmasCookies:'🎅', harvestTokens:'🌽' };
      if (icon) icon.textContent = icons[ev.seasonalCurrency] || '🎃';
      if (label) label.textContent = names[ev.seasonalCurrency] || 'Seasonal Shop';
    }
    if (ev && ev.forceAmbush) window._forceAmbushDay = true;
    updateSeasonalCurrencyDisplay();

    // Show Daily Descent badge
    var ddState = getDailyDescentState();
    if (ddState && ddState.streak > 0) initDailyDescentBadge();
    // Load music loop preference
    if (DDStore.getItem('dd_music_loop') === '1') {
      _loopModeOn = true;
      var b = document.getElementById('mp-loop-btn');
      if (b) { b.textContent = '🔁 Loop All: On'; b.classList.add('active'); b.setAttribute('aria-pressed','true'); }
    }
  })();

  if (ACCESS && ACCESS.selfVoice) initSelfVoiceNavigator();
  // Retry translation at multiple intervals to ensure it sticks
  if (typeof _translationEnabled !== 'undefined' && _translationEnabled) {
    setTimeout(function(){ translateMenuText(); }, 500);
    setTimeout(function(){ translateMenuText(); }, 1000);
    setTimeout(function(){ translateMenuText(); }, 2000);
    setTimeout(function(){ translateMenuText(); }, 3000);
  }
  checkSRPrompt();
  // Run banner update after DOM is ready, with retry
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      try { updateMenuEventBanner(); } catch(e) { console.warn('[DD] updateMenuEventBanner error:', e); }
      setTimeout(function(){ try { updateMenuEventBanner(); } catch(e){} }, 2000);
      setTimeout(function(){ try { updateMenuEventBanner(); } catch(e){} }, 6000);
    });
  } else {
    try { updateMenuEventBanner(); } catch(e) { console.warn('[DD] updateMenuEventBanner error:', e); }
    setTimeout(function(){ try { updateMenuEventBanner(); } catch(e){} }, 2000);
    setTimeout(function(){ try { updateMenuEventBanner(); } catch(e){} }, 6000);
  }
  initKeyCommands();
  loadGameplaySettings();
  // Initialize Firebase Auth
  (function() {
    try {
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        window._fbAuth = firebase.auth();
        window._fbDb = firebase.firestore();
        window._fbDb.settings({ databaseId: 'dungeon-descent' });
        window._fbRtdb = firebase.database();
        // Init global multiplayer systems AFTER _fbDb is ready

        // Auth helper functions
        window._fbSignIn = function(email, pw) {
          return window._fbAuth.signInWithEmailAndPassword(email, pw);
        };
        window._fbSignUp = function(email, pw) {
          return window._fbAuth.createUserWithEmailAndPassword(email, pw);
        };
        window._fbGoogleSignIn = function() {
          var provider = new firebase.auth.GoogleAuthProvider();
          return window._fbAuth.signInWithPopup(provider);
        };
        window._fbResetPassword = function(email) {
          return window._fbAuth.sendPasswordResetEmail(email);
        };
        window._fbSignOut = function() {
          return window._fbAuth.signOut();
        };

        // Save data to Firestore
        window._fbSaveData = async function(uid, data) {
          try {
            await window._fbDb.collection('saves').doc(uid).set(data, { merge: true });
            return true;
          } catch(e) {
            console.warn('Firestore save error:', e);
            return false;
          }
        };

        // Load data from Firestore
        window._fbLoadData = async function(uid) {
          try {
            var doc = await window._fbDb.collection('saves').doc(uid).get();
            return doc.exists ? doc.data() : null;
          } catch(e) {
            console.warn('Firestore load error:', e);
            return null;
          }
        };

        // Delete account data from Firestore
        window._fbDeleteAccount = async function() {
          var user = window._fbAuth.currentUser;
          if (!user) return;
          try {
            await window._fbDb.collection('saves').doc(user.uid).delete();
            await user.delete();
          } catch(e) {
            console.warn('Delete error:', e);
            throw e;
          }
        };

        window._fbAuth.onAuthStateChanged(function(user) {
          window._fbCurrentUser = user || null;
          updateAccountUI();
          // Update menu cloud status
          var menuCloud = document.getElementById('menu-cloud-status');
          if (menuCloud) {
            if (user) {
              var name = user.displayName || user.email || 'Signed in';
              var shortName = name.substring(0, 3).toUpperCase();
              menuCloud.textContent = '☁ ' + shortName;
              menuCloud.style.color = '#44ff88';
              menuCloud.style.opacity = '1';
            } else {
              menuCloud.textContent = '';
              menuCloud.style.opacity = '0';
            }
          }
          // Update connecting indicator
          var ind = document.getElementById('account-ready-indicator');
          if (ind) ind.textContent = user ? '✓ Connected' : '○ Not signed in';
          var fireInd = document.getElementById('firebase-ready-indicator');
          if (fireInd) fireInd.textContent = user ? '✓ Cloud connected — ' + (user.email || '') : '○ Cloud available — sign in to sync';
          // Auto sync on sign in
          if (user && typeof syncToCloud === 'function') {
            setTimeout(function() {
              syncToCloud().catch(function(e){ console.warn('Auto sync failed:', e); });
            }, 1500);
          }
        });
      }
    } catch(e) {
      console.warn('Firebase auth init error:', e);
    }
  })();
}).catch(function(e) {
  // DDStore.whenReady() itself structurally can't reject (its Promise
  // constructor never calls reject — every IndexedDB failure mode already
  // falls back to localStorage internally instead). This is purely a
  // defense-in-depth net for anything else in this large startup block
  // that might throw unexpectedly, so it at least surfaces in the console
  // instead of vanishing as a silent unhandled rejection.
  console.error('[DD] Startup hydration block threw:', e);
});

// --═
// THE SPIRE — Full System
// --═

var SPIRE = {
  floor: 1, hp: 300, maxHp: 300, atk: 20, def: 0,
  gold: 0, potions: 2, autoMode: false,
  charIdx: 0, active: false,
  interval: null, timerPct: 100,
  _autoMs: 4000,
};

var SPIRE_ENEMIES = {
  t1:  [ // floors 1-50
    { name:'Spire Rat',         icon:'🐀', hp:30,  atk:[4,8]   },
    { name:'Crumbling Golem',   icon:'🪨', hp:45,  atk:[5,10]  },
    { name:'Hollow Shade',      icon:'👤', hp:35,  atk:[6,11]  },
    { name:'Spire Bat',         icon:'🦇', hp:25,  atk:[5,9]   },
    { name:'Echo Crawler',      icon:'🔊', hp:28,  atk:[5,9],  summonCounter:0 },
    { name:'Spire Ember',       icon:'🔥', hp:30,  atk:[5,9],  burn:1, burnTurns:2 },
    { name:'Cracked Husk',      icon:'💀', hp:40,  atk:[3,6]   },
    { name:'Spire Wisp',        icon:'🔵', hp:20,  atk:[4,8]   },
  ],
  t2:  [ // floors 51-200
    { name:'Stone Sentinel',    icon:'🗿', hp:70,  atk:[10,16] },
    { name:'Ash Wraith',        icon:'💨', hp:60,  atk:[12,18] },
    { name:'Spire Knight',      icon:'⚔️', hp:80,  atk:[11,17] },
    { name:'Void Tendril',      icon:'🌑', hp:65,  atk:[13,19] },
    { name:'Mirror Stalker',    icon:'🪞', hp:55,  atk:[11,17], reflectPct:0.20 },
    { name:'Spire Soul Eater',  icon:'😈', hp:58,  atk:[10,16], lifesteal:true },
    { name:'Spire Phantom',     icon:'🌫️', hp:50,  atk:[11,18], dodgeChance:0.25 },
    { name:'Tower Stalker',     icon:'👁️', hp:52,  atk:[10,16], grows:true },
    { name:'Spire Drainer',     icon:'⬛', hp:55,  atk:[9,14],  drainsSP:true },
  ],
  t3:  [ // floors 201-500
    { name:'Crimson Warden',    icon:'🔴', hp:120, atk:[16,24] },
    { name:'Time Phantom',      icon:'⏳', hp:110, atk:[18,26] },
    { name:'Spire Colossus',    icon:'🏛️', hp:140, atk:[15,22] },
    { name:'Rift Stalker',      icon:'🌀', hp:100, atk:[20,28] },
    { name:'Spire Champion',    icon:'⚔️', hp:115, atk:[17,25], doubleStrike:true },
    { name:'The Ascending',     icon:'🧗', hp:105, atk:[16,24], immuneFirstHit:true },
    { name:'Spire Brute',       icon:'👹', hp:130, atk:[20,30], slowAtk:true },
    { name:'Fracture Shade',    icon:'🌑', hp:108, atk:[16,23], splitsAt50:true },
  ],
  t4:  [ // floors 501-1000
    { name:'Eternal Husk',    icon:'💀', hp:200, atk:[22,32] },
    { name:'Voidborn',        icon:'🌌', hp:180, atk:[25,35] },
    { name:'Spire Titan',     icon:'🗼', hp:220, atk:[20,30] },
    { name:'Consumed Soul',   icon:'😶', hp:190, atk:[24,34] },
  ],
  t5:  [ // floors 1001-1800
    { name:'Time Devourer',   icon:'⌛', hp:300, atk:[30,42] },
    { name:'The Forgotten',   icon:'🫥', hp:280, atk:[32,44] },
    { name:'Apex Construct',  icon:'🤖', hp:320, atk:[28,40] },
    { name:'Void Ancient',    icon:'🔮', hp:290, atk:[34,46] },
  ],
};

var SPIRE_BOSSES = [
  { name:'The Gate Warden',    icon:'🚪', hp:150, atk:[12,18], floor:10,   pts:30,  msg:'The first door will not open itself.' },
  { name:'The Ashen Judge',    icon:'⚖️', hp:280, atk:[18,26], floor:50,   pts:60,  msg:'It has judged every climber before you.' },
  { name:'The Iron Sovereign', icon:'👑', hp:450, atk:[24,34], floor:100,  pts:100, msg:'A king of stone and silence.' },
  { name:'The Rift Weaver',    icon:'🌀', hp:650, atk:[28,38], floor:200,  pts:150, msg:'It unravels those who come too close.' },
  { name:'The Eternal Siege',  icon:'⚔️', hp:900, atk:[32,44], floor:300,  pts:200, msg:'It has been fighting something for centuries.' },
  { name:'The Void Throne',    icon:'🌑', hp:1200,atk:[36,50], floor:500,  pts:300, msg:'Something sits on it. You cannot quite see what.' },
  { name:'The Consumed',       icon:'😶', hp:1600,atk:[40,55], floor:750,  pts:400, msg:'It used to be someone who climbed like you.' },
  { name:'The Last Barrier',   icon:'🔒', hp:2000,atk:[44,60], floor:1000, pts:500, msg:'Beyond this, only the top remains.' },
  { name:'The Time Eater',     icon:'⏳', hp:3000,atk:[50,70], floor:1800, pts:1000,msg:'It has been waiting at the top since before the Spire existed.' },
];

var SPIRE_MILESTONES = {
  100:  { gold:50,  msg:'Floor 100 reached. The Spire acknowledges your persistence. +50 gold.' },
  200:  { gold:80,  msg:'Floor 200. The air grows thinner. Something watches from above. +80 gold.' },
  300:  { gold:100, msg:'Floor 300. Halfway to the silence. +100 gold.' },
  500:  { gold:150, msg:'Floor 500. The Spire shudders. +150 gold.' },
  750:  { gold:200, msg:'Floor 750. You should not be here. +200 gold.' },
  1000: { gold:300, msg:'Floor 1000. The summit is visible now. +300 gold.' },
  1500: { gold:400, msg:'Floor 1500. The Time Eater stirs. +400 gold.' },
};

function getSpireSave() {
  try { return _jsonParseSafe(DDStore.getItem('dd_spire'), '{}'); } catch(e) { return {}; }
}
function saveSpireData(o) { DDStore.setItem('dd_spire', JSON.stringify(o)); }

function getSpireBestFloor() {
  return getSpireSave().bestFloor || 1;
}

function saveSpireBestFloor(floor) {
  var s = getSpireSave();
  s.bestFloor = Math.max(s.bestFloor || 1, floor);
  saveSpireData(s);
}

function initSpireSetup() {
  var best = getSpireBestFloor();
  var bestEl = document.getElementById('spire-best-floor');
  var barEl = document.getElementById('spire-progress-bar');
  var labelEl = document.getElementById('spire-progress-bar-label');
  setTimeout(function(){ injectCharSlider('spire-char-list'); }, 50);
  if (bestEl) bestEl.textContent = best;
  if (barEl) barEl.style.width = Math.min(100, (best / 1800) * 100) + '%';
  if (labelEl) labelEl.textContent = 'Floor ' + best + ' of 1800';

  var list = document.getElementById('spire-char-list');
  if (!list) return;
  list.innerHTML = '';
  if (!CHARS || CHARS.length === 0) {
    list.innerHTML = '<p style="font-family:Cinzel,serif;font-size:0.75rem;color:#555;text-align:center;">Create a character first to enter The Spire.</p>';
    return;
  }
  CHARS.forEach(function(ch, i) {
    if (!ch || !ch.name) return;
    var btn = document.createElement('button');
    btn.className = 'raid-char-btn' + (i === 0 ? ' selected' : '');
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
    btn.setAttribute('aria-label', ch.name + ', ' + ch.cls + ', Level ' + (ch.persistLevel||ch.level||1));
    btn.textContent = ch.name + ' — ' + ch.cls + ' (Lv ' + (ch.persistLevel||ch.level||1) + ')';
    btn.onclick = function() {
      list.querySelectorAll('.raid-char-btn').forEach(function(b) {
        b.setAttribute('aria-checked','false'); b.classList.remove('selected');
      });
      btn.setAttribute('aria-checked','true'); btn.classList.add('selected');
      SPIRE.charIdx = i;
      say(ch.name + ' selected for The Spire.');
    };
    if (i === 0) SPIRE.charIdx = 0;
    list.appendChild(btn);
  });

  // Restore auto toggle state
  updateSpireAutoToggleUI();
  say('The Spire. Your highest floor: ' + best + '. Choose your champion and enter. 1800 floors stand between you and The Time Eater.');
}

function toggleSpireAutoMode() {
  var ch = CHARS[SPIRE.charIdx];
  var persist = getCharPersistentLevel(SPIRE.charIdx);
  var charLevel = (persist && persist.level) || (ch && ch.level) || 1;

  // Level 5 requirement — must be earned outside The Spire
  if (!SPIRE.autoMode && charLevel < 5) {
    say('Auto Mode requires a Level 5 character. Your character is Level ' + charLevel + '. Keep descending and running AFK to level up, then return to unlock Auto Mode.');
    var msg = document.getElementById('spire-setup-msg');
    if (msg) msg.textContent = 'Auto Mode unlocks at Level 5. Current level: ' + charLevel + '.';
    return;
  }

  SPIRE.autoMode = !SPIRE.autoMode;
  var setupMsg = document.getElementById('spire-setup-msg');
  if (setupMsg) setupMsg.textContent = '';
  if (SPIRE.autoMode && !DDStore.getItem('dd_spire_auto_seen')) {
    DDStore.setItem('dd_spire_auto_seen', '1');
    say('Auto Mode enabled. The Spire will advance automatically every 4 seconds. You can still open the Blacksmith or return to the menu at any time by pressing the buttons at the bottom of the screen.');
  } else {
    say('Auto Mode ' + (SPIRE.autoMode ? 'enabled.' : 'disabled.'));
  }
  updateSpireAutoToggleUI();
}

function updateSpireAutoToggleUI() {
  var btn = document.getElementById('spire-auto-toggle');
  if (!btn) return;
  var ch = CHARS[SPIRE.charIdx];
  var persist = getCharPersistentLevel(SPIRE.charIdx);
  var charLevel = (persist && persist.level) || (ch && ch.level) || 1;
  var locked = charLevel < 5;

  if (locked) {
    btn.textContent = '🔒 Lv5';
    btn.style.background = '#0a0a0a';
    btn.style.borderColor = '#333';
    btn.style.color = '#555';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Auto Mode locked. Requires Level 5 character. Current level: ' + charLevel + '.');
  } else if (SPIRE.autoMode) {
    btn.textContent = 'ON';
    btn.style.background = '#0a1a00';
    btn.style.borderColor = '#44ff44';
    btn.style.color = '#44ff44';
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('aria-label', 'Auto mode on, press to disable');
  } else {
    btn.textContent = 'OFF';
    btn.style.background = '#0a0a00';
    btn.style.borderColor = '#336633';
    btn.style.color = '#44aa44';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Auto mode off, press to enable');
  }
}

function startSpire() {
  var ch = CHARS[SPIRE.charIdx];
  if (!ch || !ch.name) {
    var msg = document.getElementById('spire-setup-msg');
    if (msg) msg.textContent = 'Select a character first.';
    say('Select a character first.');
    return;
  }

  var best = getSpireBestFloor();
  var persist = getCharPersistentLevel(SPIRE.charIdx);

  SPIRE.floor = best;
  SPIRE.active = true;
  SPIRE.charName = ch.name;
  SPIRE.cls = ch.cls;
  SPIRE.maxHp = (HP_MAP[ch.cls] || 300) + ((persist.level || 1) - 1) * 25 + 150 + Math.floor(SPIRE.floor / 10) * 5;
  SPIRE.hp = SPIRE.maxHp;
  SPIRE.potions = 3 + Math.floor(SPIRE.floor / 100);

  // Apply equipped weapon/armor from global storage
  var _spireWepBonus = 0;
  var _spireDefBonus = 0;
  try {
    var _sw = _jsonParseSafe(DDStore.getItem('dd_equipped_weapon'), 'null');
    if (_sw) {
      var _swAtk = getWeaponAtk(_sw);
      if (Array.isArray(_swAtk)) _spireWepBonus = Math.floor((_swAtk[0] + _swAtk[1]) / 2);
    }
    var _sa = _jsonParseSafe(DDStore.getItem('dd_equipped_armor'), 'null');
    if (_sa) _spireDefBonus = _sa.defBase || _sa.defBonus || 0;
  } catch(e) {}

  SPIRE.atk = 20 + (ch.atkBonus || 0) + ((persist.level || 1) - 1) * 2 + _spireWepBonus;
  SPIRE.def = (ch.defBonus || 0) + _spireDefBonus;
  SPIRE.gold = getGlobalGold(); // Sync from global gold
  SPIRE._enemyActive = false;
  SPIRE._currentEnemy = null;
  SPIRE.interval = null;
  SPIRE.timerPct = 100;

  goTo('spire-combat');
  spireRenderUI();
  spireSpawnEnemy();
  playTrack('spire');
  say('Entering The Spire. ' + ch.name + '. Floor ' + SPIRE.floor + '. HP: ' + SPIRE.hp + '. ' + (SPIRE.autoMode ? 'Auto Mode active.' : 'Manual Mode. Defeat the enemy then press Next Floor.'));

  if (SPIRE.autoMode) spireStartAutoTimer();
}

function spireRestFloor() {
  SPIRE._enemyActive = false;
  spireFloorRewards();
  var loreBits = [
    'The Time Eater has no name it gave itself. The name came from the first climber who reached floor 900 and came back down. No one knows what they saw.',
    'The Spire predates every map of this region. Cartographers draw around it. They do not draw it.',
    'Every 100 years, someone reaches the top. The records stop there. The person does not come back to continue them.',
    'The enemies in the upper floors are not native to the Spire. They wandered in from somewhere else and could not find the way out.',
    'The Time Eater does not sleep. It does not need to. It has been waiting so long that waiting has become the same as existing.',
  ];
  var lore = loreBits[Math.floor(SPIRE.floor / 50) % loreBits.length];

  // Heal scales with floor depth — 40% at low floors, 60% at high floors
  var healPct = Math.min(0.60, 0.40 + (SPIRE.floor / 1800) * 0.20);
  var heal = Math.round(SPIRE.maxHp * healPct);
  SPIRE.hp = Math.min(SPIRE.maxHp, SPIRE.hp + heal);

  // Refill 1 potion on rest floors
  SPIRE.potions = Math.min(SPIRE.potions + 1, 10);

  // Small gold reward
  var goldBonus = 20 + SPIRE.floor;
  SPIRE.gold += goldBonus;
  addGlobalGold(goldBonus);

  spireLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '#333');
  spireLog('🕯 REST FLOOR ' + SPIRE.floor, '#e0c080');
  spireLog('You find a moment of stillness in the Spire.', '#888');
  spireLog('❤ Restored ' + heal + ' HP. HP: ' + SPIRE.hp + '/' + SPIRE.maxHp + '.', '#44ff88');
  spireLog('💰 +' + goldBonus + ' gold found.', '#ffdd44');
  spireLog('📖 ' + lore, '#666');

  saveSpireBestFloor(SPIRE.floor);
  spireRenderUI();

  document.getElementById('spire-action-btns').style.display = 'none';
  document.getElementById('spire-next-wrap').style.display = 'flex';

  if (SPIRE.autoMode) {
    spireLog('Auto Mode: advancing in 4 seconds...', '#555');
    spireStartAutoTimer();
  }

  say('Rest floor ' + SPIRE.floor + '. You recover ' + heal + ' HP and find ' + goldBonus + ' gold. ' + lore + ' Press Next Floor to continue.');
}

function spireGetEnemyPool() {
  var f = SPIRE.floor;
  // Boss floors
  for (var i = SPIRE_BOSSES.length - 1; i >= 0; i--) {
    if (f === SPIRE_BOSSES[i].floor) return null; // signal boss floor
  }
  var tier = f <= 50 ? 't1' : f <= 200 ? 't2' : f <= 500 ? 't3' : f <= 1000 ? 't4' : 't5';
  return SPIRE_ENEMIES[tier];
}

function spireGetBoss() {
  for (var i = 0; i < SPIRE_BOSSES.length; i++) {
    if (SPIRE.floor === SPIRE_BOSSES[i].floor) return SPIRE_BOSSES[i];
  }
  return null;
}

function spireSpawnEnemy() {
  // A rest floor every tenth floor — except boss floors, which are all
  // multiples of ten, so the rest floor always won and only The Time Eater
  // ever appeared.
  if (SPIRE.floor > 0 && SPIRE.floor % 10 === 0 && !spireGetBoss()) {
    spireRestFloor();
    return;
  }

  var boss = spireGetBoss();
  // Logarithmic scaling — steep early, levels off at high floors
  // Floor 100: ~2x | Floor 500: ~3.5x | Floor 1000: ~4.8x | Floor 1800: ~6x
  var floorMult = 1 + Math.log(1 + (SPIRE.floor - 1) * 0.05);

  if (boss) {
    SPIRE._currentEnemy = {
      name: boss.name, icon: boss.icon, isBoss: true,
      hp: Math.round(boss.hp * floorMult),
      maxHp: Math.round(boss.hp * floorMult),
      atk: [Math.round(boss.atk[0] * floorMult), Math.round(boss.atk[1] * floorMult)],
    };
    spireLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '#333');
    if (boss.floor === 1800) playTrack('time-eater');
    spireLog('⚡ BOSS FLOOR — ' + boss.icon + ' ' + boss.name, '#ffaa44');
    spireLog(boss.msg, '#888');
    spireLog('Boss HP: ' + SPIRE._currentEnemy.hp + ' | Your HP: ' + SPIRE.hp + '/' + SPIRE.maxHp, '#666');
    spireLog('Use Attack, Heavy Strike, or Defend to fight.', '#555');
    say('Floor ' + SPIRE.floor + '. Boss encounter. ' + boss.name + '. ' + boss.msg + ' Boss HP: ' + SPIRE._currentEnemy.hp + '. Your HP: ' + SPIRE.hp + '. Use Attack, Heavy Strike, or Defend.');
  } else {
    var pool = spireGetEnemyPool();
    var base = pool[Math.floor(Math.random() * pool.length)];
    SPIRE._currentEnemy = {
      name: base.name, icon: base.icon, isBoss: false,
      hp: Math.round(base.hp * floorMult),
      maxHp: Math.round(base.hp * floorMult),
      atk: [Math.round(base.atk[0] * floorMult), Math.round(base.atk[1] * floorMult)],
    };
    spireLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '#222');
    spireLog('Floor ' + SPIRE.floor + ' — ' + SPIRE._currentEnemy.icon + ' ' + SPIRE._currentEnemy.name + ' appears.', '#e0c080');
    spireLog('Enemy HP: ' + SPIRE._currentEnemy.hp + ' | Your HP: ' + SPIRE.hp + '/' + SPIRE.maxHp, '#666');
    say('Floor ' + SPIRE.floor + '. ' + SPIRE._currentEnemy.name + ' appears. Enemy HP: ' + SPIRE._currentEnemy.hp + '. Your HP: ' + SPIRE.hp + ' of ' + SPIRE.maxHp + '. Use Attack, Heavy Strike, or Defend.');
  }

  SPIRE._enemyActive = true;
  document.getElementById('spire-next-wrap').style.display = 'none';
  document.getElementById('spire-action-btns').style.display = 'grid';
  spireRenderUI();
}

function spireRenderUI() {
  var e = SPIRE._currentEnemy;
  if (e) {
    document.getElementById('spire-enemy-name').textContent = e.icon + ' ' + e.name + (e.isBoss ? ' ⚡ BOSS' : '');
    document.getElementById('spire-enemy-hp').textContent = 'HP: ' + e.hp + ' / ' + e.maxHp;
    document.getElementById('spire-enemy-bar').style.width = Math.max(0, (e.hp / e.maxHp) * 100) + '%';
  }
  document.getElementById('spire-floor-label').textContent = 'Floor ' + SPIRE.floor + ' of 1800';
  document.getElementById('spire-hp-display').textContent = 'HP: ' + SPIRE.hp + '/' + SPIRE.maxHp;
  document.getElementById('spire-gold-display').textContent = SPIRE.gold + 'g';
  document.getElementById('spire-hp-bar').style.width = Math.max(0, (SPIRE.hp / SPIRE.maxHp) * 100) + '%';
  document.getElementById('spire-potion-count').textContent = SPIRE.potions;
  // Status region
  var statusEl = document.getElementById('spire-status-region');
  if (statusEl) {
    if (SPIRE._enemyActive && e) {
      statusEl.textContent = 'Floor ' + SPIRE.floor + ' — Fighting: ' + e.name + (e.isBoss ? ' (BOSS)' : '') + ' | Enemy HP: ' + e.hp + '/' + e.maxHp + ' | Your HP: ' + SPIRE.hp + '/' + SPIRE.maxHp;
    } else if (!SPIRE._enemyActive) {
      statusEl.textContent = 'Floor ' + SPIRE.floor + ' cleared. Press Next Floor to advance' + (SPIRE.autoMode ? ' (Auto Mode active)' : '') + '.';
    }
  }
  // Auto bar
  var autoWrap = document.getElementById('spire-auto-bar-wrap');
  if (autoWrap) autoWrap.style.display = SPIRE.autoMode ? '' : 'none';
  // Gun button
  try { updateSpireGunButton(); } catch(e) {}
}

function spireLog(msg, color) {
  var log = document.getElementById('spire-log');
  if (!log) return;
  var div = document.createElement('div');
  div.style.color = color || '#aaa';
  div.textContent = msg;
  log.insertBefore(div, log.firstChild);
}

function spireAttack(type) {
  if (!SPIRE._enemyActive || !SPIRE._currentEnemy) return;
  if (SPIRE.autoMode) {
    spireStopAutoTimer();
    SPIRE.autoMode = false;
    updateSpireAutoToggleUI();
    spireLog('Auto Mode paused — you took manual control.', '#888');
  }
  spireDoPlayerTurn(type);
}

function spireDoPlayerTurn(type) {
  var e = SPIRE._currentEnemy;
  if (!e) return;

  var base = Math.max(1, rnd(SPIRE.atk - 2, SPIRE.atk + 8));
  if (type === 'heavy') {
    if (Math.random() < 0.30) {
      spireLog('Heavy strike misses!', '#ff8888');
      say('Heavy strike missed.');
      base = 0;
    } else {
      base = Math.round(base * 1.7);
    }
  }
  if (type === 'defend') base = Math.round(base * 0.4);

  if (base > 0) {
    e.hp = Math.max(0, e.hp - base);
    spireLog(type === 'heavy' ? 'Heavy strike — ' + base + ' damage!' : type === 'defend' ? 'Defend and counter — ' + base + '.' : 'Attack — ' + base + ' damage!', '#a0e0ff');
    say((type === 'heavy' ? 'Heavy strike' : type === 'defend' ? 'Defend' : 'Attack') + ' — ' + base + ' damage. Enemy HP: ' + e.hp + '.');
  }
  spireRenderUI();

  if (e.hp <= 0) { spireEnemyDefeated(); return; }

  // Enemy hits back
  var eDmg = Math.max(1, rnd(e.atk[0], e.atk[1]) - SPIRE.def);
  if (type === 'defend') eDmg = Math.max(1, Math.round(eDmg * 0.4));
  SPIRE.hp = Math.max(0, SPIRE.hp - eDmg);
  spireLog(e.name + ' strikes for ' + eDmg + '. HP: ' + SPIRE.hp + '/' + SPIRE.maxHp + '.', '#ff8888');
  say(e.name + ' attacks for ' + eDmg + '. Your HP: ' + SPIRE.hp + '.');
  spireRenderUI();

  // Auto potion at 40% HP — triggered earlier so you do not die instantly
  if (SPIRE.hp <= Math.round(SPIRE.maxHp * 0.40) && SPIRE.potions > 0) {
    var heal = Math.round(SPIRE.maxHp * 0.50);
    SPIRE.hp = Math.min(SPIRE.maxHp, SPIRE.hp + heal);
    SPIRE.potions--;
    spireLog('🧪 Auto-potion used. HP: ' + SPIRE.hp + '/' + SPIRE.maxHp + '. ' + SPIRE.potions + ' left.', '#44ff88');
    say('Auto potion. HP: ' + SPIRE.hp + '. Potions left: ' + SPIRE.potions + '.');
    spireRenderUI();
  }

  if (SPIRE.hp <= 0) { spireDeath(); }
}

function spireUsePotion() {
  if (SPIRE.potions <= 0) { say('No potions left.'); return; }
  var heal = Math.round(SPIRE.maxHp * 0.45);
  SPIRE.hp = Math.min(SPIRE.maxHp, SPIRE.hp + heal);
  SPIRE.potions--;
  spireLog('🧪 Potion used. Restored ' + heal + ' HP. HP: ' + SPIRE.hp + '/' + SPIRE.maxHp + '.', '#44ff88');
  say('Potion used. HP now ' + SPIRE.hp + '. Potions left: ' + SPIRE.potions + '.');
  spireRenderUI();
}

function updateSpireGunButton() {
  var btn = document.getElementById('spire-btn-gun');
  if (!btn) return;
  var gun = getEquippedGun();
  if (!gun || !SPIRE || !SPIRE._enemyActive) { btn.style.display = 'none'; return; }
  btn.style.display = '';
  if (_gunState.onCooldown) {
    btn.disabled = true;
    btn.textContent = '🔫 Reloading... ' + _gunState.cooldownSeconds + 's';
    btn.style.borderColor = '#555'; btn.style.color = '#555';
  } else if (_gunState.charged && _gunState.shotsLeft > 0) {
    btn.disabled = false;
    btn.textContent = '🔫 Shoot' + (_gunState.shotsLeft > 1 ? ' (' + _gunState.shotsLeft + ' left)' : '');
    btn.style.borderColor = '#ff4400'; btn.style.color = '#ff6622';
  } else {
    btn.disabled = false;
    btn.textContent = '🔫 Charge Gun';
    btn.style.borderColor = '#cc8800'; btn.style.color = '#ffaa00';
  }
}

function spireGunAction() {
  if (!SPIRE._enemyActive || !SPIRE._currentEnemy) return;
  var gun = getEquippedGun();
  if (!gun || _gunState.onCooldown) return;

  if (!_gunState.charged) {
    _gunState.charged = true;
    _gunState.shotsLeft = gun.shots;
    _playGunSfx('charge');
    spireLog('🔫 ' + gun.name + ' charged. Ready to fire.', '#ffaa00');
    say(gun.name + ' charged. Ready to shoot.');
    setTimeout(function() {
      sfx('sfx-unlock');
      updateSpireGunButton();
    }, 150);
  } else if (_gunState.shotsLeft > 0) {
    var e = SPIRE._currentEnemy;
    _gunState.shotsLeft--;
    var dmg = Math.floor(Math.random() * (gun.dmgMax - gun.dmgMin + 1)) + gun.dmgMin;
    dmg = Math.max(1, Math.round(dmg * (1 + (SPIRE.atkBonus || 0) / 100)));
    _playGunSfx('shot');
    e.hp = Math.max(0, e.hp - dmg);
    spireLog('🔫 ' + gun.name + ' fires! ' + dmg + ' damage! Enemy HP: ' + e.hp + '.', '#ffaa00');
    say(gun.name + ' fires for ' + dmg + ' damage. Enemy HP: ' + e.hp + '.');
    spireRenderUI();

    if (e.hp <= 0) {
      resetGunState();
      spireEnemyDefeated();
      return;
    }

    // Enemy counter-attacks
    var eDmg = Math.max(1, rnd(e.atk[0], e.atk[1]) - SPIRE.def);
    SPIRE.hp = Math.max(0, SPIRE.hp - eDmg);
    spireLog(e.name + ' strikes back for ' + eDmg + '. HP: ' + SPIRE.hp + '/' + SPIRE.maxHp + '.', '#ff8888');
    say(e.name + ' attacks for ' + eDmg + '. Your HP: ' + SPIRE.hp + '.');
    spireRenderUI();

    if (SPIRE.hp <= 0) { resetGunState(); spireDeath(); return; }

    if (_gunState.shotsLeft <= 0) {
      _gunState.charged = false;
      startGunCooldown(gun.cooldown);
    }
    updateSpireGunButton();
  }
}

// Milestone gold and the every-tenth-floor drops, once per floor. They only
// ran after a kill, and every tenth floor was a rest floor, so they never ran.
function spireFloorRewards() {
  if (SPIRE._rewardedFloor === SPIRE.floor) return;
  SPIRE._rewardedFloor = SPIRE.floor;
  // Check milestone
  if (SPIRE_MILESTONES[SPIRE.floor]) {
    var ms = SPIRE_MILESTONES[SPIRE.floor];
    SPIRE.gold += ms.gold;
    addGlobalGold(ms.gold);
    spireLog('🏆 MILESTONE: ' + ms.msg, '#ffaa00');
    sfx('sfx-levelup');
    spireRenderUI();
  }

  // Every 10 floors — drop diamonds, mystery coins, or gun parts
  if (SPIRE.floor % 10 === 0) {
    var floorDepth = Math.floor(SPIRE.floor / 100); // 0-17
    // Diamonds — chance scales with depth
    var diaChance = 0.20 + (floorDepth * 0.03); // 20% at floor 10, up to ~70% at floor 1000+
    if (Math.random() < diaChance) {
      var diaAmt = Math.max(1, Math.floor(floorDepth * 0.5) + 1); // 1 early, up to ~9 deep
      addDiamonds(diaAmt);
      spireLog('💎 Floor ' + SPIRE.floor + ' drop: ' + diaAmt + ' diamond' + (diaAmt > 1 ? 's' : '') + '!', '#88ddff');
      say('Diamond drop! ' + diaAmt + ' diamond' + (diaAmt > 1 ? 's' : '') + ' found on floor ' + SPIRE.floor + '.');
    }
    // Mystery coins — every 10 floors, small chance
    var coinChance = 0.25 + (floorDepth * 0.02);
    if (Math.random() < coinChance) {
      var coinAmt = Math.random() < 0.3 ? 2 : 1;
      addMysteryCoin(coinAmt);
      spireLog('🪙 Floor ' + SPIRE.floor + ' drop: ' + coinAmt + ' mystery coin' + (coinAmt > 1 ? 's' : '') + '!', '#ffcc44');
      say('Mystery coin drop! ' + coinAmt + ' mystery coin' + (coinAmt > 1 ? 's' : '') + ' found.');
    }
    // Gun parts — small chance every 10 floors
    if (Math.random() < 0.15) {
      var spirePartDefs = GUN_PARTS_DEFS;
      var spirePart = spirePartDefs[Math.floor(Math.random() * spirePartDefs.length)];
      addGunPart(spirePart.id);
      spireLog(spirePart.icon + ' Floor ' + SPIRE.floor + ' drop: ' + spirePart.name + '!', '#ffaa44');
      say('Gun part found! ' + spirePart.name + ' on floor ' + SPIRE.floor + '.');
    }
  }


}

function spireEnemyDefeated() {
  SPIRE._enemyActive = false;
  var e = SPIRE._currentEnemy;
  var goldDrop = Math.round(3 + SPIRE.floor * 0.5);
  SPIRE.gold += goldDrop;
  addGlobalGold(goldDrop); // (it was added twice)
  spireLog(e.icon + ' ' + e.name + ' defeated! +' + goldDrop + 'g. Your HP: ' + SPIRE.hp + '/' + SPIRE.maxHp + '.', '#44ff88');
  spireRenderUI();

  spireFloorRewards();

  // Check Spire lore fragment unlock
  var fragmentFloors = [100,300,500,750,1000,1500];
  if (fragmentFloors.indexOf(SPIRE.floor) !== -1) {
    var frag = null;
    for (var fi = 0; fi < STORIES.length; fi++) {
      if (STORIES[fi].spireFloor === SPIRE.floor) { frag = STORIES[fi]; break; }
    }
    if (frag) {
      spireLog('Lore fragment discovered. ' + frag.title + ' added to The Chronicles.', '#aaaaff');
      say('Lore fragment discovered. ' + frag.title + ' has been added to The Chronicles Library.');
    }
  }

  // Save best floor
  saveSpireBestFloor(SPIRE.floor);

  // Check victory
  if (SPIRE.floor === 1800) { spireVictory(); return; }

  document.getElementById('spire-action-btns').style.display = 'none';
  document.getElementById('spire-next-wrap').style.display = 'flex';

  if (SPIRE.autoMode) {
    spireLog('Auto Mode: advancing to floor ' + (SPIRE.floor + 1) + ' in 4 seconds...', '#888');
    say(e.name + ' defeated. Plus ' + goldDrop + ' gold. Auto Mode advancing to floor ' + (SPIRE.floor + 1) + ' shortly.');
    spireStartAutoTimer();
  } else {
    spireLog('Press Next Floor to advance to floor ' + (SPIRE.floor + 1) + '.', '#e0c080');
    say(e.name + ' defeated. Plus ' + goldDrop + ' gold. Your HP: ' + SPIRE.hp + ' of ' + SPIRE.maxHp + '. Press Next Floor to continue. You can also open the Blacksmith before advancing.');
  }
}

function spireNextFloor() {
  spireStopAutoTimer();
  SPIRE.floor++;
  saveSpireBestFloor(SPIRE.floor);
  document.getElementById('spire-next-wrap').style.display = 'none';
  spireSpawnEnemy();
  if (SPIRE.autoMode) spireStartAutoTimer();
}

function spireStartAutoTimer() {
  spireStopAutoTimer();
  var bar = document.getElementById('spire-auto-bar');
  if (bar) { bar.style.transition = 'none'; bar.style.width = '100%'; }
  setTimeout(function() {
    if (bar) { bar.style.transition = 'width ' + (SPIRE._autoMs/1000) + 's linear'; bar.style.width = '0%'; }
  }, 50);
  SPIRE.interval = setTimeout(function() {
    if (!SPIRE.active || !SPIRE.autoMode) return;
    if (SPIRE._enemyActive) {
      say('Auto Mode — attacking ' + (SPIRE._currentEnemy ? SPIRE._currentEnemy.name : 'enemy') + '.');
      spireDoPlayerTurn('attack');
      if (SPIRE._enemyActive) spireStartAutoTimer();
    } else {
      say('Auto Mode — advancing to floor ' + (SPIRE.floor + 1) + '.');
      spireNextFloor();
    }
  }, SPIRE._autoMs);
}

function spireStopAutoTimer() {
  if (SPIRE.interval) { clearTimeout(SPIRE.interval); SPIRE.interval = null; }
  var bar = document.getElementById('spire-auto-bar');
  if (bar) { bar.style.transition = 'none'; bar.style.width = '100%'; }
}

function spireDeath() {
  SPIRE.active = false;
  spireStopAutoTimer();
  saveSpireBestFloor(SPIRE.floor);

  // Save to graveyard and obituary
  var ch = SPIRE.charIdx !== undefined ? CHARS[SPIRE.charIdx] : null;
  if (ch) {
    var entry = { name:ch.name, cls:ch.cls, race:ch.race, level:ch.persistLevel||ch.level||1, dungeon:'The Spire', difficulty:'Spire', killedBy:'The Spire, Floor '+SPIRE.floor, topFloor:SPIRE.floor, date:new Date().toLocaleDateString() };
    try { var g=getGraveyard(); g.unshift(entry); if(g.length>50)g=g.slice(0,50); saveGraveyard(g); } catch(e){}
    postDeathToObituary({ name:ch.name, cls:ch.cls, floor:SPIRE.floor, dungeon:'The Spire', killedBy:'The Spire at Floor '+SPIRE.floor, kills:0, gold:SPIRE.gold||0, date:entry.date, timestamp:Date.now() });
  }

  var deathMsgs = [
    'The Spire remembers everyone who fell. It does not mourn them.',
    'You will try again. The Spire has always known this.',
    'The floor you reached is saved. The Spire will be waiting.',
    'Something higher up noticed you before you stopped moving.',
  ];

  goTo('spire-death');
  document.getElementById('spire-death-floor').textContent = 'Fell on Floor ' + SPIRE.floor;
  document.getElementById('spire-death-msg').textContent = deathMsgs[Math.floor(Math.random() * deathMsgs.length)];
  document.getElementById('spire-death-best').textContent = 'Floor ' + getSpireBestFloor();
  playTrack(getMenuTrack());
  say('You have fallen on floor ' + SPIRE.floor + '. Your progress is saved. You can ascend again from floor ' + getSpireBestFloor() + '.');
}

function spireVictory() {
  SPIRE.active = false;
  spireStopAutoTimer();
  saveSpireBestFloor(1800);

  // Award legendary reward for defeating The Time Eater
  if (CHARS[SPIRE.charIdx]) {
    var ch = CHARS[SPIRE.charIdx];
    // 1000 gold
    ch.gold = (ch.gold || 0) + 1000;
    addGlobalGold(1000);
    // 25 Mystery Coins — they went on the character, where the Coin Shop never looks
    addMysteryCoin(25);
    // 25% Blacksmith discount for 2 hours
    var discountExpiry = Date.now() + (2 * 60 * 60 * 1000);
    DDStore.setItem('dd_blacksmith_discount', JSON.stringify({
      pct: 0.25,
      expires: discountExpiry,
      source: 'Time Eater'
    }));
    saveChars(); // saveGame() doesn't exist — same class of bug as the Void Reaper fix earlier
    awardAchievement('ach-time-eater');
  }

  goTo('spire-victory');
  playTrack(getMenuTrack());
  sfx('sfx-levelup');
  say('THE TIME EATER IS DEFEATED. You have climbed all 1800 floors of The Spire. 1000 gold awarded. 25 Mystery Coins awarded. 25 percent Blacksmith discount active for 2 hours. You have conquered The Spire. This has never been done before.');
}

function openBlacksmithFromSpire() {
  // Store spire state, open blacksmith, return to spire
  spireStopAutoTimer();
  openBlacksmith();
  // Override close button to return to spire
  var closeBtn = document.querySelector('#ov-blacksmith button[onclick="closeBlacksmith()"]');
  if (closeBtn) {
    closeBtn.setAttribute('aria-label', 'Close blacksmith and return to The Spire');
    closeBtn.textContent = '← Back to The Spire';
  }
}

function spireOpenSettings() {
  spireStopAutoTimer();
  openSettings();
}

function spireReturnToMenu() {
  spireStopAutoTimer();
  SPIRE.active = false;
  saveSpireBestFloor(SPIRE.floor);
  try { resetGunState(); } catch(e) {}
  goTo('menu');
  say('Progress saved. You can return to The Spire anytime from the main menu.');
}

// ── END THE SPIRE ──
