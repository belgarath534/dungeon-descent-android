//═════════════════
// UTILITIES
//═════════════════
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function ri(a, b) { return rnd(a, b); }

function _saySR(msg) {
  // Always update aria-live region — works on web, JAWS, and as fallback
  var el = document.getElementById('aria-announce');
  el.textContent = '';
  setTimeout(function() { el.textContent = msg; }, 60);
  // Additionally use native ScreenReader.speak() on Capacitor iOS if VoiceOver is active
  // This is more reliable than aria-live for native apps
  if (window.Capacitor && typeof _screenReaderActive !== 'undefined' && _screenReaderActive && Capacitor.Plugins && Capacitor.Plugins.ScreenReader) {
    try {
      var srLang = (_translationLang === 'pt-BR') ? 'pt' : (_translationLang === 'es') ? 'es' : 'en';
      Capacitor.Plugins.ScreenReader.speak({ value: msg, language: srLang });
    } catch(e) {}
  }
}

//═════════════════
// AUDIO
//═════════════════
// Music tracks keyed by name. Loaded lazily on first play.
var AUD = {
  tracks: {},       // loaded Audio objects by track name
  current: null,    // name of currently playing track
  sfx: {},
  howls: {},        // Howler instances for sfx
  musicOn: true,
  sfxOn: true,
  ambientOn: true,
  vibrationOn: true,
  musicVol: 0.5,
  sfxVol: 0.6,
  ambientVol: 0.25,
  loaded: false,
  // Web Audio API system for iOS volume control
  ctx: null,           // AudioContext
  masterGain: null,    // master GainNode — volume slider controls this
  musicGain: null,     // music-specific GainNode
  sfxGain: null,       // sfx-specific GainNode
  ambientGain: null,   // ambient-specific GainNode
  currentSource: null, // currently playing AudioBufferSourceNode
  buffers: {},         // decoded AudioBuffer cache by track name
  sfxBuffers: {},      // decoded sfx AudioBuffer cache
  currentEl: null,     // fallback Audio element reference
};

// ── WEB AUDIO API INIT ──
// Called on first user gesture to create AudioContext (required by browsers)
var _webAudioReady = false;
function initWebAudio() {
  if (_webAudioReady || !window.AudioContext && !window.webkitAudioContext) return;
  // Ask iOS to configure its audio session for sustained gameplay audio
  // that coexists with other active audio (notably VoiceOver's own
  // speech) rather than the WebView's ambient default. No-ops cleanly on
  // web/Android since Capacitor.Plugins.AudioSession only exists on iOS.
  try {
    if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.AudioSession) {
      Capacitor.Plugins.AudioSession.configureForGameplay().catch(function(e) { console.warn('[DD] AudioSession config failed:', e); });
    }
  } catch(e) {}
  try {
    AUD.ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Master gain — volume slider controls this — WORKS on iOS
    AUD.masterGain = AUD.ctx.createGain();
    AUD.masterGain.gain.value = 1.0; // master at 100%, individual gains handle sub-volumes
    AUD.masterGain.connect(AUD.ctx.destination);
    // Music gain
    AUD.musicGain = AUD.ctx.createGain();
    AUD.musicGain.gain.value = AUD.musicVol;
    AUD.musicGain.connect(AUD.masterGain);
    // SFX gain
    AUD.sfxGain = AUD.ctx.createGain();
    AUD.sfxGain.gain.value = AUD.sfxVol;
    AUD.sfxGain.connect(AUD.masterGain);
    // Ambient gain
    AUD.ambientGain = AUD.ctx.createGain();
    AUD.ambientGain.gain.value = AUD.ambientVol;
    AUD.ambientGain.connect(AUD.masterGain);
    _webAudioReady = true;
    // Re-apply saved volumes immediately — do not trust default values
    AUD.musicGain.gain.setValueAtTime(AUD.musicVol, AUD.ctx.currentTime);
    AUD.sfxGain.gain.setValueAtTime(AUD.sfxVol, AUD.ctx.currentTime);
    AUD.ambientGain.gain.setValueAtTime(AUD.ambientVol, AUD.ctx.currentTime);
    console.log('[DD Audio] Web Audio API initialized. iOS volume control active.');
  } catch(e) {
    console.warn('[DD Audio] Web Audio API init failed, falling back to HTML Audio:', e);
  }
}

// Danger Radar — a short synthesized sonar ping, stereo-panned to a random
// side. No audio asset needed since it's an oscillator tone, not a sample.
// intensity (0-1) raises pitch and adds a second urgent beat above 0.5,
// so a sensed trap "feels" closer/more dangerous than a routine search.
function playRadarPing(intensity) {
  try {
    if (!AUD || !AUD.ctx) return;
    if (AUD.ctx.state === 'suspended') AUD.ctx.resume();
    var dir = Math.random() < 0.5 ? -0.6 : 0.6;
    var dest = AUD.sfxGain || AUD.ctx.destination;
    var vol = 0.35 * (AUD.sfxVol != null ? AUD.sfxVol : 0.8);
    var fire = function(delaySec) {
      var now = AUD.ctx.currentTime + delaySec;
      var osc = AUD.ctx.createOscillator();
      var gainNode = AUD.ctx.createGain();
      var panner = AUD.ctx.createStereoPanner ? AUD.ctx.createStereoPanner() : null;
      osc.type = 'sine';
      osc.frequency.value = 600 + intensity * 500;
      if (panner) { panner.pan.value = dir; osc.connect(gainNode); gainNode.connect(panner); panner.connect(dest); }
      else { osc.connect(gainNode); gainNode.connect(dest); }
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(vol, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.4);
    };
    fire(0);
    if (intensity > 0.5) fire(0.16);
  } catch(e) { console.warn('[DD Audio] radar ping error:', e); }
}

// Fetch and decode an audio file into an AudioBuffer (cached)
// BUGFIX: no size ceiling here meant a bad/oversized upload (one hosted track
// was found to be 60MB+ — 3x+ every other track in the game) would still get
// fully fetched and handed to decodeAudioData(), which on a real device
// expands a compressed MP3 into a raw PCM buffer many times larger still —
// a huge, sudden memory spike with no JS-catchable failure mode if it tips
// the browser over a resource limit. Skip decoding anything abnormally large
// and fail soft (silent track) instead of risking a crash.
var MAX_AUDIO_BUFFER_BYTES = 25 * 1024 * 1024; // largest legitimate track seen is ~18.5MB
function loadAudioBuffer(url, cache, key, callback) {
  if (cache[key]) { callback(cache[key]); return; }
  fetch(url)
    .then(function(r) {
      var len = parseInt(r.headers.get('content-length'), 10);
      if (len && len > MAX_AUDIO_BUFFER_BYTES) {
        throw new Error('Track "' + key + '" is ' + Math.round(len / 1024 / 1024) + 'MB — over the ' + Math.round(MAX_AUDIO_BUFFER_BYTES / 1024 / 1024) + 'MB safety limit, skipping to avoid a decode-time memory spike.');
      }
      return r.arrayBuffer();
    })
    .then(function(ab) {
      if (ab.byteLength > MAX_AUDIO_BUFFER_BYTES) {
        throw new Error('Track "' + key + '" body is ' + Math.round(ab.byteLength / 1024 / 1024) + 'MB — over the safety limit, skipping.');
      }
      return AUD.ctx.decodeAudioData(ab);
    })
    .then(function(buffer) {
      cache[key] = buffer;
      callback(buffer);
    })
    .catch(function(e) {
      console.warn('[DD Audio] Failed to load buffer:', key, e);
      callback(null);
    });
}

// Play a buffer through a GainNode — returns the source so it can be stopped
function playBuffer(buffer, gainNode, loop) {
  if (!buffer || !AUD.ctx || !gainNode) return null;
  try {
    if (AUD.ctx.state === 'suspended') AUD.ctx.resume();
    var source = AUD.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop || false;
    source.connect(gainNode);
    source._ended = false;
    source.onended = function() { source._ended = true; };
    source.start(0);
    return source;
  } catch(e) {
    console.warn('[DD Audio] playBuffer failed:', e);
    return null;
  }
}

// Map track names to file paths
// ── AUDIO BASE URL ──
// Audio files served from Cloudflare R2 (moved off Netlify/local due to site size limits)
var _AUDIO_BASE = 'https://firebasestorage.googleapis.com/v0/b/dungeon-descent-fbaf2.firebasestorage.app/o/audio%2F';
var _AUDIO_SUFFIX = '?alt=media';
var _AUDIO_END  = '';
var _AUDIO_LOCAL = 'audio/';
var _AUDIO_R2 = 'https://pub-a22a05b8dcb64f86b6bbb814578b93e4.r2.dev/';

function _audioUrl(filename) {
  // The iOS app bundles every track locally (www/audio/, synced into the
  // native app by `npx cap sync ios`) so the game has real audio with zero
  // internet — this is an audio-first accessibility game, so that matters.
  // The web build at dungeon-descent.org doesn't ship 275MB of audio to
  // every visitor, so it keeps streaming from Cloudflare R2 as before.
  if (window.Capacitor) return _AUDIO_LOCAL + filename;
  return _AUDIO_R2 + filename;
}

var TRACK_FILES = {
  'menu':           _audioUrl('music-menu.mp3'),
  'menu-halloween': _audioUrl('music-halloween.mp3'),
  'menu-christmas': _audioUrl('music-christmas.mp3'),
  'floor1':  _audioUrl('music-floor1.mp3'),
  'floor2':  _audioUrl('music-floor2.mp3'),
  'floor3':  _audioUrl('music-floor3.mp3'),
  'floor4':  _audioUrl('music-floor4.mp3'),
  'boss':    _audioUrl('music-boss.mp3'),
  'battle':  _audioUrl('music-battle.mp3'),
  'raid':         _audioUrl('music-raid.mp3'),
  'raid-victory': _audioUrl('music-raid-victory.mp3'),
  'ash1':         _audioUrl('music-ashbound1.mp3'),
  'ash2':         _audioUrl('music-ashbound2.mp3'),
  'ash3':         _audioUrl('music-ashbound3.mp3'),
  'ash-boss':     _audioUrl('music-ashbound-boss.mp3'),
  'ash-battle':   _audioUrl('music-ashbound-battle.mp3'),
  'frost1':       _audioUrl('music-frosthold1.mp3'),
  'frost2':       _audioUrl('music-frosthold2.mp3'),
  'hideseek-explore': _audioUrl('music-hideseek-explore.mp3'),
  'hideseek-chase':   _audioUrl('music-hideseek-chase.mp3'),
  'frost3':       _audioUrl('music-frosthold3.mp3'),
  'frost-boss':   _audioUrl('music-frosthold-boss.mp3'),
  'frost-battle':    _audioUrl('music-frosthold-battle.mp3'),
  'music-box':       _audioUrl('music-box-melody.mp3'),
  'sunken1':         _audioUrl('music-sunken1.mp3'),
  'sunken2':         _audioUrl('music-sunken2.mp3'),
  'sunken3':         _audioUrl('music-sunken3.mp3'),
  'sunken-boss':     _audioUrl('music-sunken-boss.mp3'),
  'sunken-battle':   _audioUrl('music-sunken-battle.mp3'),
  'hollow1':         _audioUrl('music-hollow1.mp3'),
  // 'hollow2' intentionally omitted — music-hollow2.mp3 never uploaded
  // correctly (it's a saved 404 page, not audio); see the matching notes
  // on the dungeon-track pickers and in ALL_TRACKS_LOOP/MUSIC_CATALOGUE.
  'hollow3':         _audioUrl('music-hollow3.mp3'),
  'hollow-boss':     _audioUrl('music-hollow-boss.mp3'),
  'hollow-battle':   _audioUrl('music-hollow-battle.mp3'),
  'void-reaper':     _audioUrl('music-void-reaper.mp3'),
  'afk':             _audioUrl('music-afk.mp3'),
  'time-descender':  _audioUrl('music-time-descender.mp3'),
  'mine-explore':    _audioUrl('music-mine-explore.mp3'),
  'mine-combat':     _audioUrl('music-boss.mp3'),
  'whisper1':        _audioUrl('music-whisper1.mp3'),
  'whisper2':        _audioUrl('music-whisper2.mp3'),
  'whisper3':        _audioUrl('music-whisper3.mp3'),
  'whisper-boss':    _audioUrl('music-whisper-boss.mp3'),
  'whisper-battle':  _audioUrl('music-whisper-battle.mp3'),
  'bestiary':        _audioUrl('music-bestiary.mp3'),
  'help':            _audioUrl('music-help.mp3'),
  'chronicles':      _audioUrl('music-chronicles.mp3'),
  'blacksmith':      _audioUrl('music-blacksmith.mp3'),
  'graveyard':       _audioUrl('music-graveyard.mp3'),
  'spire':           _audioUrl('music-spire.mp3'),
  // The Time Eater's own fight music. It ships next to the game (not on the
  // audio bucket), so the web build loads it from its own audio/ folder.
  'time-eater':      (window.Capacitor ? _AUDIO_LOCAL : 'audio/') + 'music-time-eater.mp3',
  'home':            _audioUrl('music-home.mp3'),       // upload music-home.mp3 to use
  'menu-birthday':   _audioUrl('music-birthday.mp3'),   // upload music-birthday.mp3 to use
  'credits':         _audioUrl('music-credits.mp3'),

  'ambient-whisper':   _audioUrl('ambient-whisper.mp3'),
  'abyssal1':          _audioUrl('music-abyssal1.mp3'),
  'abyssal2':          _audioUrl('music-abyssal2.mp3'),
  'abyssal3':          _audioUrl('music-abyssal3.mp3'),
  'abyssal-boss':      _audioUrl('music-abyssal-boss.mp3'),
  'abyssal-boss-p2':   _audioUrl('music-abyssal-boss-phase2.mp3'),
  'abyssal-boss-p3':   _audioUrl('music-abyssal-boss-phase3.mp3'),
  'abyssal-boss-p4':   _audioUrl('music-abyssal-boss-phase4.mp3'),
  'abyssal-battle':    _audioUrl('music-abyssal-battle.mp3'),
  'ambient-abyssal':   _audioUrl('ambient-abyssal.mp3'),
  'infernal1':          _audioUrl('music-infernal1.mp3'),
  'infernal2':          _audioUrl('music-infernal2.mp3'),
  'infernal3':          _audioUrl('music-infernal3.mp3'),
  'infernal-boss':      _audioUrl('music-infernal-boss.mp3'),
  'infernal-battle':    _audioUrl('music-infernal-battle.mp3'),
  'ambient-infernal':   _audioUrl('ambient-infernal.mp3'),
  'codex':              _audioUrl('codex.mp3'),
  // ── THE SHADOW WORLD ──
  'shadow1':            _audioUrl('music-shadow1.mp3'),
  'shadow2':            _audioUrl('music-shadow2.mp3'),
  'shadow3':            _audioUrl('music-shadow3.mp3'),
  'shadow-boss':        _audioUrl('music-shadow-boss.mp3'),
  'shadow-battle':      _audioUrl('music-shadow-battle.mp3'),
  'ambient-shadow':     _audioUrl('ambient-shadow.mp3'),
  'shadow-stalker':     _audioUrl('shadow-world-thriller-score.mp3'), // Stalker Floor tension music
};

// Ambient sound tracks per dungeon
var AMBIENT_FILES = {
  'crypt':      _audioUrl('ambient-crypt.mp3'),
  'ashbound':   _audioUrl('ambient-ashbound.mp3'),
  'frosthold':  _audioUrl('ambient-frosthold.mp3'),
  'nightmare':  _audioUrl('ambient-nightmare.mp3'),
  'sunken':     _audioUrl('ambient-sunken.mp3'),
  'hollow':     _audioUrl('ambient-hollow.mp3'),
  'whisper':    _audioUrl('ambient-whisper.mp3'),
  'infernal':   _audioUrl('ambient-infernal.mp3'),
  'abyssal':    _audioUrl('ambient-abyssal.mp3'),
  'shadow':     _audioUrl('ambient-shadow.mp3'),
  'mine':       _audioUrl('music-mine-ambient.mp3')
};
var _ambientTrack = null;
var _ambientAudio = null;

// Which exploration track plays for each floor number (dungeon-aware)
function exploTrackForFloor(floor) {
  var dungeon = DS && DS.dungeon;
  if (dungeon === 'The Ashbound Wastes') {
    if (floor <= 3)               return 'ash1';
    if (floor >= 4 && floor <= 6) return 'ash2';
    if (floor >= 7 && floor <= 9) return 'ash3';
    if (floor >= 10)              return 'ash-boss';
    return 'ash1';
  }
  if (dungeon === 'Frosthold Abyss') {
    if (floor <= 3)               return 'frost1';
    if (floor >= 4 && floor <= 6) return 'frost2';
    if (floor >= 7 && floor <= 9) return 'frost3';
    if (floor >= 10)              return 'frost-boss';
    return 'frost1';
  }
  if (dungeon === 'The Sunken Archives') {
    if (floor <= 3)               return 'sunken1';
    if (floor >= 4 && floor <= 6) return 'sunken2';
    if (floor >= 7 && floor <= 9) return 'sunken3';
    if (floor >= 10)              return 'sunken-boss';
    return 'sunken1';
  }
  if (dungeon === 'The Hollow') {
    // TEMP: music-hollow2.mp3 is the broken 60MB+ upload that was crashing
    // the page — reuse hollow1 for the rest of the exploration floors until
    // a correctly-sized hollow2 (and hollow3, same rollout) is uploaded.
    if (floor <= 9)  return 'hollow1';
    if (floor >= 10) return 'hollow-boss';
    return 'hollow1';
  }
  if (dungeon === 'The Whispering Forest') {
    if (floor <= 3)               return 'whisper1';
    if (floor >= 4 && floor <= 6) return 'whisper2';
    if (floor >= 7 && floor <= 9) return 'whisper3';
    if (floor >= 10)              return 'whisper-boss';
    return 'whisper1';
  }
  if (dungeon === 'The Abyssal Deep') {
    if (floor <= 3)               return 'abyssal1';
    if (floor >= 4 && floor <= 6) return 'abyssal2';
    if (floor >= 7 && floor <= 9) return 'abyssal3';
    if (floor >= 10)              return 'abyssal-boss';
    return 'abyssal1';
  }
  if (dungeon === 'The Infernal Descent') {
    if (floor <= 3)               return 'infernal1';
    if (floor >= 4 && floor <= 6) return 'infernal2';
    if (floor >= 7 && floor <= 9) return 'infernal3';
    if (floor >= 10)              return 'infernal-boss';
    return 'infernal1';
  }
  if (dungeon === 'The Shadow World') {
    if (floor <= 3)               return 'shadow1';
    if (floor >= 4 && floor <= 6) return 'shadow2';
    if (floor >= 7 && floor <= 9) return 'shadow3';
    if (floor >= 10)              return 'shadow-boss';
    return 'shadow1';
  }
  if (floor === 1)               return 'floor1';
  if (floor >= 2 && floor <= 4)  return 'floor2';
  if (floor >= 5 && floor <= 6)  return 'floor3';
  if (floor >= 7 && floor <= 9)  return 'floor4';
  if (floor >= 10)               return 'boss';
  return 'floor1';
}

// Battle track also dungeon-aware
function battleTrack() {
  if (DS && DS.dungeon === 'The Ashbound Wastes')  return 'ash-battle';
  if (DS && DS.dungeon === 'Frosthold Abyss')      return 'frost-battle';
  if (DS && DS.dungeon === 'The Sunken Archives')  return 'sunken-battle';
  if (DS && DS.dungeon === 'The Hollow')           return 'hollow-battle';
  if (DS && DS.dungeon === 'The Whispering Forest') return 'whisper-battle';
  if (DS && DS.dungeon === 'The Infernal Descent')   return 'infernal-battle';
  if (DS && DS.dungeon === 'The Abyssal Deep')         return 'abyssal-battle';
  if (DS && DS.dungeon === 'The Shadow World')         return 'shadow-battle';
  return 'battle';
}

function saveAudioPrefs() {
  DDStore.setItem('dd_audio', JSON.stringify({
    musicOn: AUD.musicOn, sfxOn: AUD.sfxOn, ambientOn: AUD.ambientOn, vibrationOn: AUD.vibrationOn,
    musicVol: AUD.musicVol, sfxVol: AUD.sfxVol, ambientVol: AUD.ambientVol
  }));
}

function loadAudioPrefs() {
  // Show iOS volume notice if on iPhone/iPad
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  var iosNotice = document.getElementById('ios-vol-notice');
  if (iosNotice && isIOS) iosNotice.style.display = '';
  // Second iOS-only tip (device volume buttons) — was given the same id as
  // the one above, so getElementById('ios-vol-notice') always resolved to
  // the FIRST div and this one could never be shown by any code.
  var iosNotice2 = document.getElementById('ios-vol-notice-2');
  if (iosNotice2 && isIOS) iosNotice2.style.display = '';
  try {
    var rawPrefs = DDStore.getItem('dd_audio');
    // If DDStore missed it (e.g. IndexedDB evicted on iOS), try the localStorage backup
    if (!rawPrefs) {
      try { rawPrefs = window.localStorage.getItem('dd_backup_dd_audio'); } catch(e) {}
    }
    var prefs = JSON.parse(rawPrefs || 'null');
    AUD.musicOn      = prefs.musicOn      !== undefined ? prefs.musicOn      : true;
    AUD.sfxOn        = prefs.sfxOn        !== undefined ? prefs.sfxOn        : true;
    AUD.vibrationOn  = prefs.vibrationOn  !== undefined ? prefs.vibrationOn  : true;
    AUD.ambientOn = prefs.ambientOn !== undefined ? prefs.ambientOn : true;
    AUD.musicVol  = prefs.musicVol  !== undefined ? prefs.musicVol  : 0.7;
    AUD.sfxVol    = prefs.sfxVol    !== undefined ? prefs.sfxVol    : 0.8;
    AUD.ambientVol= prefs.ambientVol!== undefined ? prefs.ambientVol: 0.35;
    // Sync GainNodes to loaded values — initWebAudio may have run before prefs loaded
    if (AUD.musicGain) AUD.musicGain.gain.setValueAtTime(AUD.musicVol, AUD.ctx ? AUD.ctx.currentTime : 0);
    if (AUD.sfxGain) AUD.sfxGain.gain.setValueAtTime(AUD.sfxVol, AUD.ctx ? AUD.ctx.currentTime : 0);
    if (AUD.ambientGain) AUD.ambientGain.gain.setValueAtTime(AUD.ambientVol, AUD.ctx ? AUD.ctx.currentTime : 0);
    // If Web Audio is already initialized, sync gain nodes to saved values now
    if (AUD.ctx && AUD.musicGain) AUD.musicGain.gain.setValueAtTime(AUD.musicVol, AUD.ctx.currentTime);
    if (AUD.ctx && AUD.sfxGain) AUD.sfxGain.gain.setValueAtTime(AUD.sfxVol, AUD.ctx.currentTime);
    if (AUD.ctx && AUD.ambientGain) AUD.ambientGain.gain.setValueAtTime(AUD.ambientVol, AUD.ctx.currentTime);
    // Sync UI
    var mt = document.getElementById('music-toggle');
    if (mt) { mt.textContent = AUD.musicOn ? 'On' : 'Off'; mt.classList.toggle('on', AUD.musicOn); mt.setAttribute('aria-pressed', String(AUD.musicOn)); }
    var st = document.getElementById('sfx-toggle');
    if (st) { st.textContent = AUD.sfxOn ? 'On' : 'Off'; st.classList.toggle('on', AUD.sfxOn); st.setAttribute('aria-pressed', String(AUD.sfxOn)); }
    var at = document.getElementById('ambient-toggle');
    if (at) { at.textContent = AUD.ambientOn ? 'On' : 'Off'; at.classList.toggle('on', AUD.ambientOn); at.setAttribute('aria-pressed', String(AUD.ambientOn)); }
    var mv = document.getElementById('music-vol');
    if (mv) { mv.value = Math.round(AUD.musicVol * 100); document.getElementById('music-vol-val').textContent = mv.value + '%'; }
    var sv = document.getElementById('sfx-vol');
    if (sv) { sv.value = Math.round(AUD.sfxVol * 100); document.getElementById('sfx-vol-val').textContent = sv.value + '%'; }
    var av = document.getElementById('ambient-vol');
    if (av) { av.value = Math.round(AUD.ambientVol * 100); document.getElementById('ambient-vol-val').textContent = av.value + '%'; }
  } catch(e) {}
}

function loadAudio() {
  AUD.loaded = true;
  AUD.howls = {};
  loadAudioPrefs();
  // Preload SFX
  var sfxNames = ['sfx-select','sfx-confirm','sfx-hover','sfx-footstep','sfx-search','sfx-loot',
   'sfx-trap','sfx-attack','sfx-crit','sfx-heavy-hit','sfx-heavy-miss',
   'sfx-hurt','sfx-death','sfx-enemy-die','sfx-potion','sfx-purchase',
   'sfx-stairs','sfx-victory','sfx-gameover','sfx-unlock','sfx-levelup',
   'sfx-sanity-warning','sfx-sanity-critical','sfx-eagle-cry','sfx-firework',
   'sfx-zombie-groan','sfx-vampire-laugh','sfx-ghost-scream',
   'sfx-enemy-undead','sfx-enemy-fire','sfx-enemy-ice','sfx-enemy-aquatic',
   'sfx-enemy-horror','sfx-enemy-beast','sfx-enemy-demon','sfx-enemy-leviathan','sfx-enemy-shadow',
   'sfx-boss-undead','sfx-boss-fire','sfx-boss-ice','sfx-boss-aquatic',
   'sfx-boss-horror','sfx-boss-beast','sfx-boss-demon','sfx-boss-leviathan','sfx-boss-shadow',
   'sfx-ach-gold','sfx-ach-silver','sfx-ach-special'];

  // Most sfx are hosted as .mp3 — these specific ones are .wav on the host.
  var SFX_WAV_NAMES = ['sfx-ach-special', 'sfx-footstep'];

  // Some sfx are hosted on R2 without the "sfx-" prefix — map internal name to actual R2 filename.
  var SFX_FILE_OVERRIDES = { 'sfx-ghost-scream': 'ghost-scream', 'sfx-zombie-groan': 'zombie-groan', 'sfx-vampire-laugh': 'vampire-evil-laugh' };

  sfxNames.forEach(function(n) {
    var ext = SFX_WAV_NAMES.indexOf(n) !== -1 ? '.wav' : '.mp3';
    var fileBase = SFX_FILE_OVERRIDES[n] || n;
    try {
      // Use Howler if available — fixes iOS volume control
      if (window.Howl) {
        AUD.howls[n] = new Howl({
          src: [_audioUrl(fileBase + ext)],
          volume: AUD.sfxVol,
          preload: true,
          onloaderror: function() {
            // Fallback to regular Audio on load error
            try {
              var local = new Audio(_AUDIO_LOCAL + fileBase + ext);
              local.volume = AUD.sfxVol;
              AUD.sfx[n] = local;
            } catch(e2) {}
          }
        });
      } else {
        // Fallback to regular Audio
        var sfxAudio = new Audio(_audioUrl(fileBase + ext));
        sfxAudio.volume = AUD.sfxVol;
        sfxAudio.onerror = function() {
          try {
            var local = new Audio(_AUDIO_LOCAL + fileBase + ext);
            local.volume = AUD.sfxVol;
            AUD.sfx[n] = local;
          } catch(e2) {}
        };
        AUD.sfx[n] = sfxAudio;
      }
    } catch(e) {}
  });

  // If Howler loaded, also use it for music via global volume control
  if (window.Howler) {
    Howler.volume(AUD.musicVol);
  }

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  // On iOS, delay music start until after initWebAudio runs so we always use Web Audio GainNode
  if (isIOS) {
    if (AUD.musicOn) setTimeout(function() { playTrack(getMenuTrack()); }, 100);
  } else {
    if (AUD.musicOn) playTrack(getMenuTrack());
  }
}

function getTrack(name) {
  if (!AUD.tracks[name]) {
    // Special handling for embedded base64 tracks
    if (name === 'hunter-theme') {
      try {
        if (typeof _HUNTER_AUDIO === 'undefined' || !_HUNTER_AUDIO.music) return null;
        var ha = new Audio(_HUNTER_AUDIO.music);
        ha.loop = true;
        ha.volume = AUD.musicVol;
        AUD.tracks[name] = ha;
        return ha;
      } catch(e) { return null; }
    }
    var path = TRACK_FILES[name];
    if (!path) return null;
    try {
      var a = new Audio(path);
      a.loop = true;
      a.volume = AUD.musicVol;
      // If local audio fails on Android, fall back to Supabase
      a.onerror = function() {
        console.error('[DD Audio] Primary audio FAILED for "' + name + '" at path: ' + path);
        // path is whatever _audioUrl() built — the local bundle path on the
        // native app, or the R2 CDN URL on web. Pull the bare filename back
        // out (whichever prefix is actually present) and try the other one.
        var fname = path.indexOf(_AUDIO_R2) === 0 ? path.slice(_AUDIO_R2.length)
          : path.indexOf(_AUDIO_LOCAL) === 0 ? path.slice(_AUDIO_LOCAL.length) : path;
        var fallbackPath = window.Capacitor
          ? _AUDIO_R2 + fname     // native app: bundled file failed, stream from R2
          : _AUDIO_LOCAL + fname; // website: R2 failed, try a local copy if one exists
        console.warn('[DD] Primary audio failed for ' + name + ', trying fallback: ' + fallbackPath);
        var fallback = new Audio(fallbackPath);
        fallback.loop = true;
        fallback.volume = AUD.musicVol;
        fallback.onerror = function() {
          console.error('[DD Audio] BOTH sources failed for "' + name + '". Primary: ' + path + ' | Fallback: ' + fallbackPath + '. File may be missing or misnamed.');
        };
        AUD.tracks[name] = fallback;
        if (AUD.current === name && AUD.musicOn) {
          fallback.play().catch(function(){});
        }
      };
      AUD.tracks[name] = a;
    } catch(e) { return null; }
  }
  return AUD.tracks[name];
}

var _howlMusic = null;
var _howlMusicName = null;
var _pendingTrack = null; // guard against async audio overlap

function playTrack(name) {
  if (!AUD.loaded) return;
  if (!AUD.musicOn) { AUD.current = name; return; }
  if (_customTrackActive || _ytActive) { AUD.current = name; return; }
  // Don't restart if same track is already playing — check both Web Audio and Howler
  if (AUD.current === name) {
    // Web Audio: BufferSource is active if it exists and hasn't ended
    if (AUD.currentSource && !AUD.currentSource._ended) return;
    // Howler: check if playing
    if (_howlMusic && _howlMusic.playing()) return;
  }

  // Stop current Web Audio source
  if (AUD.currentSource) {
    try { AUD.currentSource.stop(); } catch(e) {}
    AUD.currentSource = null;
  }
  // Stop Howler fallback
  if (_howlMusic) {
    try { _howlMusic.stop(); _howlMusic.unload(); } catch(e) {}
    _howlMusic = null;
  }
  // Stop HTML Audio fallback
  var old = AUD.current ? AUD.tracks[AUD.current] : null;
  if (old) { try { old.pause(); old.currentTime = 0; } catch(e) {} }

  AUD.current = name;
  var url = TRACK_FILES[name];
  if (!url) return;

  // Web Audio API path — GainNode works on iOS ✅
  if (_webAudioReady && AUD.ctx && AUD.musicGain) {
    // Resume context if suspended (iOS requires this)
    if (AUD.ctx.state === 'suspended') AUD.ctx.resume();
    _pendingTrack = name; // mark what we want to play
    loadAudioBuffer(url, AUD.buffers, name, function(buffer) {
      // If another track was requested while we were loading, abort this one
      if (_pendingTrack !== name || AUD.current !== name) {
        return; // stale load — discard silently
      }
      _pendingTrack = null;
      if (!buffer) {
        // Failed — fall back
        _playTrackFallback(name, url);
        return;
      }
      // Stop anything still playing before we start the new source
      if (AUD.currentSource) { try { AUD.currentSource.stop(); } catch(e) {} AUD.currentSource = null; }
      AUD.currentSource = playBuffer(buffer, AUD.musicGain, true);
      // Force gain to saved value immediately after starting — iOS can reset it
      if (AUD.musicGain) AUD.musicGain.gain.setValueAtTime(AUD.musicVol, AUD.ctx.currentTime);
    });
    return;
  }

  // Fallback path
  _playTrackFallback(name, url);
  // Update now playing display if music player is open
  setTimeout(function() { if (typeof mpUpdateNowPlaying !== 'undefined') mpUpdateNowPlaying(); }, 100);
}

function _playTrackFallback(name, url) {
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  // On iOS, Howler html5 audio ignores volume (hardware locked) — always use Web Audio
  if (isIOS && AUD.ctx && AUD.musicGain) {
    if (AUD.ctx.state === 'suspended') AUD.ctx.resume();
    _pendingTrack = name;
    loadAudioBuffer(url, AUD.buffers, name, function(buffer) {
      if (_pendingTrack !== name || AUD.current !== name) return; // stale load
      _pendingTrack = null;
      if (!buffer) return;
      if (AUD.currentSource) { try { AUD.currentSource.stop(); } catch(e) {} AUD.currentSource = null; }
      AUD.musicGain.gain.setValueAtTime(AUD.musicVol, AUD.ctx.currentTime);
      AUD.currentSource = playBuffer(buffer, AUD.musicGain, true);
    });
    return;
  }
  // Native Capacitor app: skip Howler for music. Howler has its own internal
  // "autoUnlock" gate that silently queues .play() until it sees a user gesture
  // on document — that's a browser-autoplay-policy safety net, but Capacitor's
  // WKWebView already disables the user-action-for-playback requirement, so a
  // plain <audio> element (below) plays immediately on cold launch with no
  // gesture needed. Howler stays for the plain web build, where the browser's
  // real autoplay policy applies and Howler's cross-browser handling helps.
  if (window.Howl && !window.Capacitor) {
    _howlMusic = new Howl({
      src: [url],
      volume: AUD.musicVol,
      loop: true,
      html5: true,
      onplay: function() {
        // iOS ignores volume set at creation on html5 Howls — must set after play starts
        if (_howlMusic) _howlMusic.volume(AUD.musicVol);
      },
      onloaderror: function() {
        _howlMusic = null;
        var track = getTrack(name);
        if (track) { track.volume = AUD.musicVol; track.currentTime = 0; AUD.currentEl = track; track.play().catch(function(){}); }
      }
    });
    _howlMusic.play();
    _howlMusicName = name;
  } else {
    var track = getTrack(name);
    if (!track) return;
    track.volume = AUD.musicVol;
    track.currentTime = 0;
    AUD.currentEl = track;
    window._currentTrackEl = track;
    track.play().catch(function(){});
  }
}

function sfxHover(e) {
  if (e.target && e.target.classList.contains('menu-btn')) sfx('sfx-hover');
}

function playAmbient(key) {
  // Stop current ambient
  if (_ambientAudio) {
    try { _ambientAudio.pause(); _ambientAudio.currentTime = 0; } catch(e) {}
  }
  if (!key || !AUD.musicOn) { _ambientAudio = null; return; }
  var path = AMBIENT_FILES[key];
  if (!path) { _ambientAudio = null; return; }
  if (!AUD.ambientOn) { _ambientAudio = null; return; }
  try {
    _ambientAudio = new Audio(path);
    _ambientAudio.loop = true;
    _ambientAudio.volume = AUD.ambientVol !== undefined ? AUD.ambientVol : 0.35;
    // Fallback — if primary fails try the other source
    _ambientAudio.onerror = function() {
      var filename = path.indexOf(_AUDIO_R2) === 0 ? path.slice(_AUDIO_R2.length)
        : path.indexOf(_AUDIO_LOCAL) === 0 ? path.slice(_AUDIO_LOCAL.length) : path;
      var fallbackPath = window.Capacitor ? _AUDIO_R2 + filename : _AUDIO_LOCAL + filename;
      try {
        _ambientAudio = new Audio(fallbackPath);
        _ambientAudio.loop = true;
        _ambientAudio.volume = AUD.ambientVol !== undefined ? AUD.ambientVol : 0.35;
        _ambientAudio.play().catch(function(){});
      } catch(e2) {}
    };
    _ambientAudio.play().catch(function(){});
    _ambientTrack = key;
  } catch(e) { _ambientAudio = null; }
}

function stopAmbient() {
  if (_ambientAudio) {
    try { _ambientAudio.pause(); _ambientAudio.currentTime = 0; } catch(e) {}
    _ambientAudio = null; _ambientTrack = null;
  }
}

function getAmbientKey() {
  if (!DS || !DS.dungeon) return null;
  if (DS.diff === 'Nightmare')             return 'nightmare';
  if (DS.dungeon === 'The Ashbound Wastes') return 'ashbound';
  if (DS.dungeon === 'Frosthold Abyss')     return 'frosthold';
  if (DS.dungeon === 'The Sunken Archives') return 'sunken';
  if (DS.dungeon === 'The Hollow')          return 'hollow';
  if (DS.dungeon === 'The Whispering Forest') return 'whisper';
  if (DS.dungeon === 'The Infernal Descent')   return 'infernal';
  if (DS.dungeon === 'The Abyssal Deep')         return 'abyssal';
  if (DS.dungeon === 'The Shadow World')         return 'shadow';
  return 'crypt';
}

function sfx(n) {
  if (!AUD.sfxOn) return;
  try {
    // Use Howler if available (fixes iOS volume control)
    if (window.Howl && AUD.howls && AUD.howls[n]) {
      AUD.howls[n].volume(AUD.sfxVol);
      AUD.howls[n].play();
      return;
    }
    var s = AUD.sfx[n]; if (s) { s.currentTime = 0; s.play().catch(function(){}); }
  } catch(e) {}
}

// All game tracks in order for looping
var ALL_TRACKS_LOOP = [
  'menu','floor1','floor2','floor3','floor4','battle','boss',
  'ash1','ash2','ash3','ash-battle','ash-boss',
  'frost1','frost2','frost3','frost-battle','frost-boss',
  'sunken1','sunken2','sunken3','sunken-battle','sunken-boss',
  'hollow1','hollow3','hollow-battle','hollow-boss', // hollow2 omitted — see TRACK_FILES note
  'whisper1','whisper2','whisper3','whisper-battle','whisper-boss',
  'infernal1','infernal2','infernal3','infernal-battle','infernal-boss',
  'bestiary','blacksmith','chronicles','help','afk',
  'menu-halloween','menu-christmas','void-reaper','time-descender'
];
var _loopIndex = 0;
var _loopModeOn = false;

function toggleMusicLoop() {
  _loopModeOn = !_loopModeOn;
  DDStore.setItem('dd_music_loop', _loopModeOn ? '1' : '0');
  // Update button in music player
  var b = document.getElementById('mp-loop-btn');
  if (b) {
    b.textContent = '🔁 Loop All: ' + (_loopModeOn ? 'On' : 'Off');
    b.classList.toggle('active', _loopModeOn);
    b.setAttribute('aria-pressed', String(_loopModeOn));
    b.setAttribute('aria-label', 'Loop all songs, currently ' + (_loopModeOn ? 'on' : 'off'));
  }
  if (_loopModeOn) {
    _loopIndex = 0;
    playLoopTrack();
    say('Loop mode on. Playing through all ' + ALL_TRACKS_LOOP.length + ' game tracks in order.');
  } else {
    say('Loop mode off. Music returns to normal.');
  }
}

function playLoopTrack() {
  if (!_loopModeOn || !AUD.musicOn) return;
  var trackName = ALL_TRACKS_LOOP[_loopIndex];
  var track = getTrack(trackName);
  if (!track) { advanceLoopTrack(); return; }
  // Stop current
  Object.keys(AUD.tracks).forEach(function(k){ var t = AUD.tracks[k]; if (t) { t.pause(); t.currentTime = 0; } });
  AUD.current = trackName;
  track.volume = AUD.musicVol;
  track.loop = false;
  track.play().catch(function(){});
  track.onended = function() { if (_loopModeOn) advanceLoopTrack(); };
  say('Now playing: ' + trackName.replace(/-/g,' ') + '. Track ' + (_loopIndex + 1) + ' of ' + ALL_TRACKS_LOOP.length + '.');
}

function advanceLoopTrack() {
  _loopIndex = (_loopIndex + 1) % ALL_TRACKS_LOOP.length;
  playLoopTrack();
}

function toggleMusic() {
  AUD.musicOn = !AUD.musicOn;
  var b = document.getElementById('music-toggle');
  b.textContent = AUD.musicOn ? 'On' : 'Off';
  b.classList.toggle('on', AUD.musicOn);
  b.setAttribute('aria-pressed', String(AUD.musicOn));
  b.setAttribute('aria-label', 'Music toggle currently ' + (AUD.musicOn ? 'on' : 'off'));
  if (AUD.musicOn) {
    // Resume — replay current track through Howler
    if (AUD.current) playTrack(AUD.current);
  } else {
    // Stop Howler music
    if (_howlMusic) { try { _howlMusic.stop(); } catch(e) {} }
    // Also stop regular Audio fallbacks
    Object.keys(AUD.tracks).forEach(function(k) {
      var t = AUD.tracks[k]; if (t) t.pause();
    });
  }
  saveAudioPrefs();
  say('Music ' + (AUD.musicOn ? 'enabled' : 'disabled'));
}

function toggleAmbient() {
  AUD.ambientOn = !AUD.ambientOn;
  var b = document.getElementById('ambient-toggle');
  b.textContent = AUD.ambientOn ? 'On' : 'Off';
  b.classList.toggle('on', AUD.ambientOn);
  b.setAttribute('aria-pressed', String(AUD.ambientOn));
  b.setAttribute('aria-label', 'Ambient sound toggle currently ' + (AUD.ambientOn ? 'on' : 'off'));
  if (AUD.ambientOn) {
    // Resume ambient if in dungeon
    var ambKey = getAmbientKey();
    if (ambKey) playAmbient(ambKey);
  } else {
    stopAmbient();
  }
  saveAudioPrefs();
  say('Ambient sound ' + (AUD.ambientOn ? 'enabled' : 'disabled'));
}

function toggleSFX() {
  AUD.sfxOn = !AUD.sfxOn;
  var b = document.getElementById('sfx-toggle');
  b.textContent = AUD.sfxOn ? 'On' : 'Off';
  b.classList.toggle('on', AUD.sfxOn);
  b.setAttribute('aria-pressed', String(AUD.sfxOn));
  b.setAttribute('aria-label', 'Sound effects toggle currently ' + (AUD.sfxOn ? 'on' : 'off'));
  saveAudioPrefs();
  say('Sound effects ' + (AUD.sfxOn ? 'enabled' : 'disabled'));
}

function updateVol(sid, vid, type) {
  var el = document.getElementById(sid);
  var vel = document.getElementById(vid);
  if (!el) return;
  var v = el.value;
  if (vel) vel.textContent = v + '%';
  el.setAttribute('aria-label', (type === 'music' ? 'Music' : type === 'ambient' ? 'Ambient' : 'Sound effects') + ' volume ' + v + ' percent');
  if (type === 'music') {
    AUD.musicVol = v / 100;
    // Live in-place volume update — works on iOS too, matching puzzle-master's behavior.
    if (AUD.musicGain) AUD.musicGain.gain.setValueAtTime(AUD.musicVol, AUD.ctx ? AUD.ctx.currentTime : 0);
    if (_howlMusic) _howlMusic.volume(AUD.musicVol);
    if (window.Howler) Howler.volume(AUD.musicVol);
    // HTML Audio fallback always
    if (AUD.tracks) Object.keys(AUD.tracks).forEach(function(k) { var t = AUD.tracks[k]; if (t) t.volume = AUD.musicVol; });
    if (AUD.currentEl) AUD.currentEl.volume = AUD.musicVol;
    if (window._currentTrackEl) window._currentTrackEl.volume = AUD.musicVol;
  } else if (type === 'ambient') {
    AUD.ambientVol = v / 100;
    if (_ambientAudio) _ambientAudio.volume = AUD.ambientVol;
  } else {
    AUD.sfxVol = v / 100;
    // Update Howler sfx instances
    if (window.Howl && AUD.howls) Object.keys(AUD.howls).forEach(function(k) {
      if (AUD.howls[k]) AUD.howls[k].volume(AUD.sfxVol);
    });
    // Also update regular Audio fallbacks
    if (AUD.sfx) Object.keys(AUD.sfx).forEach(function(k) {
      var s = AUD.sfx[k]; if (s) s.volume = AUD.sfxVol;
    });
  }
  saveAudioPrefs();
}

//═════════════════
// SCREENS
//═════════════════
var _currentScreen = 'menu'; // track current screen for back button

function goTo(id) {
  _currentScreen = id; // update current screen tracker
  // Only remove active class — never touch inline display styles
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  var el = document.getElementById('screen-' + id);
  if (!el) { console.error('goTo: screen not found: screen-' + id); return; }
  el.classList.add('active');
  if (id !== 'mine') el.scrollTop = 0;
  window.scrollTo(0, 0); // iOS: reset page scroll on every screen transition
  // Defer heavy renders so the screen transition is immediate on iOS
  if (id === 'charlist') { setTimeout(function(){ renderCharList(); refreshDungeonUnlocks(); setTimeout(function(){ checkDungeonUnlockPopups(); }, 600); }, 50); }
  if (id === 'deathlog') setTimeout(function(){ renderDeathLog(); }, 50);
  if (id === 'graveyard') setTimeout(function(){ renderGraveyard(); }, 50);
  if (id === 'challenges') setTimeout(function(){ initChallenges(); }, 50);
  if (id === 'obituary') setTimeout(function(){ loadObituary('obituary-list'); }, 200);
  if (id === 'mine') setTimeout(function(){
    try {
      // Ensure CHARS is hydrated before rendering
      if (!CHARS || !CHARS.length) {
        try { CHARS = _jsonParseSafe(DDStore.getItem('dd_chars'), '[]'); } catch(e) { CHARS = []; }
      }
      mineInitScreen();
    } catch(e) { console.warn('[Mine] init error:', e); }
  }, 200);
  if (id === 'menu') {
    keepAwakeOff(); // allow sleep when back at menu
    cancelComebackNotif();
    if (!_notifScheduled) setTimeout(function(){ scheduleAllNotifications(); }, 2000);
    initGooglePlayGames();
    initAdMob();
    initIAP();
    initStatusBar();
    initNetwork();
    initShakeToAttack();
    initScreenReader();
    clearBadge();
    initBackButton(); // handle Android back button properly
    setTimeout(function(){ updateMenuEnemyCount(); }, 500);
    // Show badge if daily dungeon not completed today
    var _dailySeed = typeof _getDailyDungeonSeed === 'function' ? _getDailyDungeonSeed() : null;
    if (_dailySeed && !DDStore.getItem('dd_daily_' + _dailySeed)) {
      showDailyBadge();
    } else {
      clearBadge();
    }
    setTimeout(function(){ initDailyDescentBadge(); }, 800);
    setTimeout(function(){ initBirthdayEvent(); }, 900);
    setTimeout(function(){ initCommandCenterToggle(); }, 1000);
    setTimeout(function(){ try { checkOfflineProgress(); } catch(e){} }, 1500);
    setTimeout(function(){ try { retroactiveAchievementRewards(); updateTrophyDisplay(); updateFamiliarBadge(); } catch(e){} }, 2000);
    setTimeout(function(){
      try {
        // Retroactive Spire floor achievement check
        var spSave = getSpireSave();
        if (spSave && spSave.bestFloor) {
          updateAchievementStat('spireBestFloor', spSave.bestFloor);
        }
        // Retroactive won classes check
        var wonCls = _jsonParseSafe(DDStore.getItem('dd_won_classes'), '[]');
        if (wonCls.length > 0) updateAchievementStat('uniqueClassesWon', wonCls.length);
        // Retroactive forge count
        var fc2 = parseInt(DDStore.getItem('dd_forge_count')||'0');
        if (fc2 > 0) checkAchievements();
        // Retroactive minion count
        var minions = _jsonParseSafe(DDStore.getItem('dd_minions'), '[]');
        if (minions.length > 0) checkAchievements();
        // Retroactive trophy milestone check
        checkAchievements();
      } catch(e){}
    }, 2500);
  }
  if (id === 'creation') refreshDungeonUnlocks();
  if (id === 'bestiary') { try { renderBestiary(); } catch(e) { console.error('renderBestiary:',e.message); } }
  if (id === 'raid') { try { initRaidScreen(); } catch(e) { console.error('initRaidScreen:',e.message); } }
  if (id === 'void-reaper') {
    // Local void reaper only
  }
  if (id === 'afk-setup') initAFKSetup();
  if (id === 'afk-shop') renderAFKShop();
  if (id === 'spire') initSpireSetup();
  if (id === 'tournament') { try { renderTournamentScreen(); } catch(e) { console.error('tournament:',e.message); } }
  if (id === 'dungeon') {
    document.getElementById('dg-end').style.display = 'none';
    setTimeout(function(){ if (DS && !DS._floorRoomSequence) generateFloorRooms(); }, 100);
    setTimeout(function(){
      if (DS && shouldUse3DMode() && !DS._roomGraph) generate3DRoomGraph();
      if (DS && shouldUse3DMode() && DS._roomGraph) {
        var startCell = DS._roomGraph.cells[_room3DKey(DS._gridPos.gx, DS._gridPos.gy)];
        init3DView();
        play3DExitCues(startCell);
      }
    }, 100);
    setTimeout(function(){ try { initHomeButton(); } catch(e){} }, 200);
    keepAwakeOn(); // screen stays on during dungeon runs
  }
  if (id === 'quests') { _achVisibleCount = _achPageSize; try { renderQuestsScreen(); } catch(e) { console.error('quests:',e.message); } }
  if (id === 'coinshop') { try { renderCoinShop(); } catch(e) { console.error('coinshop:',e.message); } }
  if (id === 'whatsnew') { say('What is New screen. Patch notes for every version.'); }
  if (id === 'credits') { try { playTrack('credits'); } catch(e2) {} }
  if (id === 'chronicles') { try { initChronicles(); } catch(e) { console.error('chronicles:',e.message); } say('The Chronicles.'); }
  if (id === 'multiplayer') { try { goToMultiplayer(); } catch(e) { console.error('multiplayer:',e.message); } say('Multiplayer. Select a character to begin.'); }
  if (id === 'arcane-shop') { say('Arcane Shop. Browse spell scrolls and the Spell Book.'); }
  if (id === 'seasonal-shop') { say('Seasonal Shop. Browse limited-time items.'); }
  if (id === 'spell-book') { say('Spell Book.'); }
  if (id === 'bounty') { try { renderBountyBoard(); } catch(e) { console.error('bounty:',e.message); } }
  if (id === 'hunting') { try { loadHuntingGrounds(); } catch(e) { console.error('hunting:',e.message); } }
  if (id === 'siege') {
    try {
      loadSiegeHub();
    } catch(e) {
      console.error('siege error:', e.message, e.stack);
      say('Siege error: ' + e.message);
      var sw = document.querySelector('.siege-wrap');
      if (sw) sw.innerHTML = '<p style="font-family:Cinzel,serif;color:#cc4444;padding:20px;">Error loading The Siege: ' + e.message + '</p><button onclick="goTo(\'menu\')" style="padding:10px;margin:10px;">Back to Menu</button>';
    }
  }
  if (id === 'siege-battle') { /* started via startSiege() */ }
  if (id === 'siege-result') { /* shown via showSiegeResult() */ }
  if (id === 'globalstats') { try { renderGlobalStats(); } catch(e) { console.error('globalstats:',e.message); } say('Hall of Records.'); }
  if (id === 'credits') { say('Credits. Dungeon Descent. Created by Leo. Built with Claude. Certified by the DDDI.'); }
  if (id === 'events') { setTimeout(function(){ try { renderEventsScreen(); } catch(e){} }, 100); say('Seasonal Events.'); }
  if (id === 'story-library') {

    say('Story Library. Read stories written by other players or write your own.');
  }
  if (id === 'read-story') {
    say('Reading story.');
  }
  if (id === 'highscore') {
    setTimeout(function(){
      // Step 1: Show score tab panel
      var sp = document.getElementById('hs-panel-score');
      var lp = document.getElementById('hs-panel-leaderboard');
      var ip = document.getElementById('hs-panel-inbox');
      if (sp) sp.style.display = '';
      if (lp) lp.style.display = 'none';
      if (ip) ip.style.display = 'none';
      // Step 2: Set tab active styles
      var tabs = ['score','leaderboard','inbox'];
      tabs.forEach(function(t) {
        var b = document.getElementById('hs-tab-' + t);
        if (b) { b.style.borderBottom = t==='score'?'2px solid #ffdd44':'2px solid transparent'; b.style.color = t==='score'?'#ffdd44':'#666'; b.setAttribute('aria-selected',t==='score'?'true':'false'); }
      });
      // Step 3: Render score data
      try {
        var s = _jsonParseSafe(DDStore.getItem('dd_score'), '{"total":0,"breakdown":{}}');
        var total = s.total || 0;
        var rank = SCORE_RANKS[0];
        for (var i=0;i<SCORE_RANKS.length;i++){ if(total>=SCORE_RANKS[i].min) rank=SCORE_RANKS[i]; }
        var te = document.getElementById('hs-total'); if(te) te.textContent = total.toLocaleString();
        var re2 = document.getElementById('hs-rank'); if(re2){ re2.textContent='RANK: '+rank.label; re2.style.color=rank.color; }
        var ge = document.getElementById('hs-gold-balance'); if(ge) ge.textContent = '💰 '+getGlobalGold().toLocaleString()+'g  |  🏆 '+getTrophies()+' trophies';
        var ce = document.getElementById('hs-categories');
        if(ce){
          var bd=s.breakdown||{};
          var defs=[{key:'enemy_kills',label:'Enemy Kills',icon:'⚔️'},{key:'boss_kills',label:'Boss Kills',icon:'👑'},{key:'elite_kills',label:'Elite Kills',icon:'★'},{key:'dungeon_clears',label:'Dungeon Completions',icon:'🏰'},{key:'achievements',label:'Achievements',icon:'✨'},{key:'gold_earned',label:'Gold Collected',icon:'🪙'},{key:'floors_reached',label:'Floors Explored',icon:'🗺️'},{key:'boss_rush',label:'Boss Rush',icon:'⚡'}];
          ce.innerHTML='';
          var shown=0;
          defs.forEach(function(d){
            var pts=bd[d.key]||0; if(!pts) return; shown++;
            var row=document.createElement('div'); row.className='score-category'; row.setAttribute('tabindex','0');
            row.setAttribute('aria-label',d.label+': '+pts.toLocaleString()+' points');
            row.innerHTML='<span class="score-cat-name">'+d.icon+' '+d.label+'</span><span class="score-cat-pts">'+pts.toLocaleString()+' pts</span>';
            ce.appendChild(row);
          });
          if(!shown) ce.innerHTML='<p style="font-size:0.82rem;color:var(--text-dim);font-style:italic;text-align:center;padding:20px;">Play the game to earn score points.</p>';
        }
        // Step 4: announce + focus
        say('High Score. Total: '+total.toLocaleString()+' points. Rank: '+rank.label);
        setTimeout(function(){ var t2=document.getElementById('hs-tab-score'); if(t2) t2.focus(); },150);
      } catch(e){ console.error('hs render error:',e); say('High Score loaded.'); }
    }, 100);
  }
  if (id === 'runsummary') { /* rendered before goTo */ }
  applyHeadingsIfEnabled();
  if (id === 'bossrush') initBossRush();
  // Music per screen
  if (id === 'menu' || id === 'charlist' || id === 'creation') {
    playTrack(getMenuTrack());
  } else if (id === 'bestiary') {
    playTrack('bestiary');
  } else if (id === 'help') {
    playTrack('help');
  } else if (id === 'chat') {
    playTrack('home');
    try { chatInit(); } catch(e) {}
  } else if (id === 'enemy-creator') {
    playTrack('bestiary');
    try { ecInit(); } catch(e) {}
  } else if (id === 'codex') {
    playTrack('codex');
    try { renderCodex(); } catch(e) { console.error('renderCodex:', e); }
  } else if (id === 'chronicles') {
    playTrack('chronicles');
  } else if (id === 'spire' || id === 'spire-combat') {
    playTrack('spire');
  } else if (id === 'graveyard') {
    playTrack('graveyard');
  } else if (id === 'dungeon') {
    // Make sure something is playing on screen entry — the exploration
    // track for the current floor. Combat overrides this with battleTrack()
    // itself via startCombat(); this path should never reach for the battle
    // track directly, or every dungeon entry (including just returning from
    // Inventory/Settings, not just a fresh run) would open on battle music.
    if (AUD.musicOn && DS && typeof exploTrackForFloor === 'function') {
      playTrack(exploTrackForFloor(DS.floor));
    }
  } else if (id === 'runsummary' || id === 'deathlog') {
    // Stop all music on death/run end screens
    if (AUD.currentSource) { try { AUD.currentSource.stop(); } catch(e) {} AUD.currentSource = null; }
    if (_howlMusic) { try { _howlMusic.stop(); _howlMusic.unload(); } catch(e) {} _howlMusic = null; }
  }
  if (id === 'menu') {
    setTimeout(checkNewDayDCPopup, 500);
    updateMenuEventBanner();
    // check67 removed
    // Sync notifications button state
    var notifIcon = document.getElementById('menu-notif-icon');
    var notifLabel = document.getElementById('menu-notif-label');
    var notifBtn = document.getElementById('menu-notif-btn');
    var notifOn = !ACCESS.notificationsOff;
    if (notifIcon) notifIcon.textContent = notifOn ? '🔔' : '🔕';
    if (notifLabel) notifLabel.textContent = notifOn ? 'Notifications On' : 'Notifications Off';
    if (notifBtn) notifBtn.setAttribute('aria-label', 'Achievement notifications currently ' + (notifOn ? 'on' : 'off') + ', press to toggle');
  }
  setTimeout(function() {
    var h = el.querySelector('h1,h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  }, 80);
  var screenNames = {menu:'Main menu',charlist:'Character selection',creation:'Character creation',dungeon:'Dungeon',bestiary:'Bestiary',raid:'Daily Raid',spire:'The Spire','spire-combat':'The Spire Combat','spire-death':'Fallen in The Spire','spire-victory':'The Time Eater Defeated'};
  say('Navigated to ' + (screenNames[id] || id) + '.');
  if (typeof _translationEnabled !== 'undefined' && _translationEnabled) {
    setTimeout(function(){ translateMenuText(); }, 150);
  }
}
function goHome() { stopAmbient(); playTrack(getMenuTrack()); goTo('menu'); }


//═════════════════
// OVERLAYS
//═════════════════
var _ovStack = [];
var _ovLastFocus = null;

function openOv(id) {
  _ovLastFocus = document.activeElement;
  var el = document.getElementById(id);
  el.classList.add('open');
  _ovStack.push(id);
  setTimeout(function() {
    var first = el.querySelector('button, input');
    if (first) first.focus();
  }, 60);
}

function closeOv(id) {
  document.getElementById(id).classList.remove('open');
  _ovStack = _ovStack.filter(function(x) { return x !== id; });
  if (_ovLastFocus) _ovLastFocus.focus();
  say('Dialog closed.');
}

document.addEventListener('keydown', function(e) {
  var top = _ovStack[_ovStack.length - 1];
  if (e.key === 'Escape' && top) { closeOv(top); return; }
  if (!top) return;
  var ov = document.getElementById(top);
  var focusable = Array.from(ov.querySelectorAll('button:not([disabled]),input[type="range"]'));
  if (!focusable.length) return;
  var fi = focusable[0], la = focusable[focusable.length - 1];
  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === fi) { e.preventDefault(); la.focus(); }
    else if (!e.shiftKey && document.activeElement === la) { e.preventDefault(); fi.focus(); }
  }
});

document.addEventListener('keydown', function(e) {
  if (_ovStack.length) return;
  var card = e.target.closest('.class-card,.race-card,.prof-card,.dungeon-card:not(.locked),.diff-card');
  if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); card.click(); }
});

function confirmQuit() {
  document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Cinzel,serif;color:#7a6018;font-size:.8rem;letter-spacing:.3em;text-transform:uppercase;">The dungeon claims another soul.</div>';
}

//═════════════════
// CHARACTER STORAGE
//═════════════════
var MAX_CHARS = 5;
var CHARS = []; // real value hydrated in the DDStore.whenReady() callback further down

// ── GLOBAL GOLD SYSTEM ──
// Shared gold wallet across all game modes
function getGlobalGold() {
  var val = parseInt(DDStore.getItem('dd_global_gold') || '0');
  return isNaN(val) ? 0 : Math.max(0, val);
}
function setGlobalGold(amount) {
  var safe = isNaN(amount) ? 0 : Math.max(0, Math.floor(amount));
  DDStore.setItem('dd_global_gold', safe.toString());
  updateGlobalGoldDisplay();
}
function addGlobalGold(amount) {
  var safeAmount = isNaN(amount) ? 0 : amount;
  setGlobalGold(getGlobalGold() + safeAmount);
  // Keep DS.gold in sync if in dungeon
  if (typeof DS !== 'undefined' && DS.inCombat !== undefined) {
    DS.gold = getGlobalGold();
  }
  // Track total gold ever earned
  var total = parseInt(DDStore.getItem('dd_total_gold_ever') || '0') + amount;
  DDStore.setItem('dd_total_gold_ever', String(total));
  // Check gold achievements
  var current = getGlobalGold();
  if (current >= 300) awardAchievement('ach-gold-hoarder');
  if (current >= 1000) awardAchievement('ach-gold-rich');
}

function spendGlobalGold(amount) {
  var current = getGlobalGold();
  if (current < amount) return false;
  setGlobalGold(current - amount);
  // Track total gold ever spent
  var spent = parseInt(DDStore.getItem('dd_total_gold_spent') || '0') + amount;
  DDStore.setItem('dd_total_gold_spent', String(spent));
  // Check spend achievements
  if (spent >= 600) awardAchievement('ach-big-spender');
  if (spent >= 7000) awardAchievement('ach-whale');
  return true;
}
function updateGlobalGoldDisplay() {
  var g = getGlobalGold();
  document.querySelectorAll('.global-gold-display').forEach(function(el) {
    el.textContent = g + 'g';
  });
}

// ══════════════════════════════════════════
// 💎 DIAMOND CURRENCY SYSTEM
// ══════════════════════════════════════════
function getDiamonds() {
  var val = parseInt(DDStore.getItem('dd_diamonds') || '0');
  return isNaN(val) ? 0 : Math.max(0, val);
}
function setDiamonds(amount) {
  var safe = isNaN(amount) ? 0 : Math.max(0, Math.floor(amount));
  try { DDStore.setItem('dd_diamonds', safe.toString()); } catch(e) { console.warn('[DD] setDiamonds failed:', e); }
  updateDiamondDisplay();
}
function addDiamonds(amount) {
  if (!amount || isNaN(amount) || amount <= 0) return;
  setDiamonds(getDiamonds() + amount);
}
function spendDiamonds(amount) {
  var current = getDiamonds();
  if (current < amount) return false;
  setDiamonds(current - amount);
  return true;
}
function updateDiamondDisplay() {
  var d = getDiamonds();
  document.querySelectorAll('.global-diamond-display').forEach(function(el) { el.textContent = d; });
  // Update topbar diamond if in dungeon
  var topEl = document.getElementById('dg-diamond-val');
  if (topEl) topEl.textContent = d + '💎';
}

// ── GUN PARTS (crafting materials) ──
function getGunParts() {
  try { return _jsonParseSafe(DDStore.getItem('dd_gun_parts'), '{}'); } catch(e) { return {}; }
}
function saveGunParts(parts) {
  try { DDStore.setItem('dd_gun_parts', JSON.stringify(parts)); } catch(e) { console.warn('[DD] saveGunParts failed:', e); }
}
function addGunPart(partId) {
  try {
    var parts = getGunParts();
    parts[partId] = (parts[partId] || 0) + 1;
    saveGunParts(parts);
  } catch(e) { console.warn('[DD] addGunPart failed:', e); }
}
function spendGunParts(partIds) {
  // partIds = array of part ids needed e.g. ['barrel','mechanism','stock','trigger']
  try {
    var parts = getGunParts();
    for (var i = 0; i < partIds.length; i++) {
      if (!parts[partIds[i]] || parts[partIds[i]] < 1) return false;
    }
    partIds.forEach(function(p) { parts[p]--; });
    saveGunParts(parts);
    return true;
  } catch(e) { console.warn('[DD] spendGunParts failed:', e); return false; }
}

var GUN_PARTS_DEFS = [
  { id: 'barrel',    name: 'Gun Barrel',         icon: '🔩', desc: 'A steel barrel. Part of a gun.' },
  { id: 'mechanism', name: 'Firing Mechanism',    icon: '⚙️', desc: 'The internal firing component.' },
  { id: 'stock',     name: 'Gun Stock',           icon: '🪵', desc: 'A wooden stock for grip and stability.' },
  { id: 'trigger',   name: 'Trigger Assembly',    icon: '🔧', desc: 'The trigger and firing pin assembly.' }
];

// ── GUN DEFINITIONS ──
var GUN_DEFS = [
  {
    id: 'flintlock',
    name: 'Flintlock Pistol',
    icon: '🔫',
    tier: 1,
    dmgMin: 18, dmgMax: 28,
    shots: 1,          // shots before needing recharge
    cooldown: 15,      // seconds after all shots used
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'A classic single-shot flintlock. Reliable, slow. Must recharge after every shot.',
    diamondCost: 5,
    craftParts: ['barrel','mechanism','stock','trigger']
  },
  {
    id: 'revolver',
    name: 'Revolver',
    icon: '🔫',
    tier: 2,
    dmgMin: 28, dmgMax: 42,
    shots: 1,
    cooldown: 12,
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'A six-chamber revolver. More power, slightly faster cooldown than the flintlock.',
    diamondCost: 10,
    craftParts: ['barrel','mechanism','stock','trigger']
  },
  {
    id: 'sawedoff',
    name: 'Sawed-Off Shotgun',
    icon: '💥',
    tier: 3,
    dmgMin: 45, dmgMax: 70,
    shots: 1,
    cooldown: 18,
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'Devastating at close range. Highest single-shot damage but longest cooldown.',
    diamondCost: 18,
    craftParts: ['barrel','barrel','mechanism','trigger']
  },
  {
    id: 'repeater',
    name: 'Repeater Rifle',
    icon: '🔫',
    tier: 4,
    dmgMin: 32, dmgMax: 48,
    shots: 3,
    cooldown: 15,
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'Fire 3 shots before reloading. Solid damage, good rhythm.',
    diamondCost: 28,
    craftParts: ['barrel','mechanism','mechanism','stock','trigger']
  },
  {
    id: 'autorifle',
    name: 'Automatic Rifle',
    icon: '⚡',
    tier: 5,
    dmgMin: 40, dmgMax: 58,
    shots: 5,
    cooldown: 20,
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'Five shots before reload. High sustained damage output.',
    diamondCost: 45,
    craftParts: ['barrel','barrel','mechanism','mechanism','stock','trigger']
  },
  {
    id: 'ak47',
    name: 'AK-47',
    icon: '☠️',
    tier: 6,
    dmgMin: 65, dmgMax: 95,
    shots: 8,
    cooldown: 25,
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'The god of guns. 8 shots before reload. Highest damage in the game. Extremely rare.',
    diamondCost: 80,
    craftParts: ['barrel','barrel','mechanism','mechanism','mechanism','stock','stock','trigger']
  },
  {
    id: 'musket',
    name: 'Musket',
    icon: '🔫',
    tier: 2,
    dmgMin: 55, dmgMax: 80,
    shots: 1,
    cooldown: 22,
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'Old school single shot. Massive damage but the longest cooldown of any single shot weapon. One shot, one kill.',
    diamondCost: 14,
    craftParts: ['barrel','stock','trigger']
  },
  {
    id: 'doublebarrel',
    name: 'Double Barrel Shotgun',
    icon: '💥',
    tier: 3,
    dmgMin: 38, dmgMax: 55,
    shots: 2,
    cooldown: 16,
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'Two barrels, two shots, then reload. More controlled than the sawed-off. Two bangs before the silence.',
    diamondCost: 20,
    craftParts: ['barrel','barrel','stock','trigger']
  },
  {
    id: 'sniper',
    name: 'Sniper Rifle',
    icon: '🎯',
    tier: 5,
    dmgMin: 70, dmgMax: 100,
    shots: 1,
    cooldown: 20,
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'Highest single shot damage in the game. One bullet. Make it count.',
    diamondCost: 50,
    craftParts: ['barrel','barrel','mechanism','stock','trigger']
  },
  {
    id: 'machinepistol',
    name: 'Machine Pistol',
    icon: '⚡',
    tier: 4,
    dmgMin: 15, dmgMax: 25,
    shots: 10,
    cooldown: 18,
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'Weak per shot but 10 shots before reloading. Sustained pressure. Never lets the enemy breathe.',
    diamondCost: 35,
    craftParts: ['barrel','mechanism','mechanism','stock','trigger']
  },
  {
    id: 'crossbow',
    name: 'Crossbow',
    icon: '🏹',
    tier: 2,
    dmgMin: 25, dmgMax: 40,
    shots: 1,
    cooldown: 10,
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'Silent. Deadly. Fastest cooldown of any gun. A fantasy weapon in a dark dungeon — it fits perfectly.',
    diamondCost: 12,
    craftParts: ['barrel','stock','trigger']
  },
  {
    id: 'magnum',
    name: 'Magnum',
    icon: '🔫',
    tier: 3,
    dmgMin: 40, dmgMax: 60,
    shots: 1,
    cooldown: 13,
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'The revolver\'s bigger, angrier brother. More damage, slightly longer cooldown. A serious weapon.',
    diamondCost: 22,
    craftParts: ['barrel','mechanism','stock','trigger']
  },
  {
    id: 'glock',
    name: 'Glock',
    icon: '🔫',
    tier: 3,
    dmgMin: 22, dmgMax: 35,
    shots: 3,
    cooldown: 11,
    chargeSfx: 'sfx-charge-gun',
    readySfx: 'sfx-unlock',
    shootSfx: 'sfx-gun-shot',
    desc: 'Reliable, fast, no nonsense. 3 shots before reload, short cooldown. The everyday carry of dungeon weapons.',
    diamondCost: 18,
    craftParts: ['barrel','mechanism','stock','trigger']
  }
];

function getGunDef(id) {
  return GUN_DEFS.find(function(g) { return g.id === id; }) || null;
}

// ── OWNED GUNS ──
function getOwnedGuns() {
  try { return _jsonParseSafe(DDStore.getItem('dd_owned_guns'), '[]'); } catch(e) { return []; }
}
function saveOwnedGuns(guns) {
  try { DDStore.setItem('dd_owned_guns', JSON.stringify(guns)); } catch(e) { console.warn('[DD] saveOwnedGuns failed:', e); }
}
function addOwnedGun(gunId) {
  var guns = getOwnedGuns();
  if (guns.indexOf(gunId) === -1) guns.push(gunId);
  saveOwnedGuns(guns);
}
function hasGun(gunId) {
  return getOwnedGuns().indexOf(gunId) !== -1;
}

// ── EQUIPPED GUN ──
function getEquippedGun() {
  var id = DDStore.getItem('dd_equipped_gun') || null;
  return id ? getGunDef(id) : null;
}
function equipGun(gunId) {
  try { DDStore.setItem('dd_equipped_gun', gunId); } catch(e) {}
  updateGunCombatButton();
}
function unequipGun() {
  try { DDStore.removeItem('dd_equipped_gun'); } catch(e) {}
  updateGunCombatButton();
}

// Global inventory — shared across all modes
function getGlobalInventory() {
  try { return _jsonParseSafe(DDStore.getItem('dd_global_inv'), '[]'); } catch(e) { return []; }
}
function cleanupLocalStorage() {
  try {
    // Trim graveyard to 10 entries max
    var g = getGraveyard();
    if (g.length > 10) saveGraveyard(g.slice(0, 10));
    // Trim run logs
    var chars = _jsonParseSafe(DDStore.getItem('dd_chars'), '[]');
    chars.forEach(function(ch) {
      if (ch.runLog && ch.runLog.length > 20) ch.runLog = ch.runLog.slice(-20);
      if (ch.journalLog && ch.journalLog.length > 20) ch.journalLog = ch.journalLog.slice(-20);
    });
    DDStore.setItem('dd_chars', JSON.stringify(chars));
    // Remove stale event keys older than 30 days
    var now = Date.now();
    DDStore.keysList().forEach(function(k) {
      if (k.startsWith('dd_event_popup_seen_')) {
        var dateStr = k.replace('dd_event_popup_seen_', '');
        var d = new Date(dateStr);
        if (!isNaN(d) && (now - d.getTime()) > 30 * 24 * 60 * 60 * 1000) {
          DDStore.removeItem(k);
        }
      }
    });
  } catch(e) {
    console.warn('Storage cleanup error:', e.message);
  }
}
function saveGlobalInventory(inv) {
  try {
    DDStore.setItem('dd_global_inv', JSON.stringify(inv));
  } catch(e) {
    if (e.name === 'QuotaExceededError') {
      try {
        cleanupLocalStorage();
        DDStore.setItem('dd_global_inv', JSON.stringify(inv));
      } catch(e2) {
        console.warn('Storage full — could not save global inventory:', e2.message);
      }
    }
  }
}
function addToGlobalInventory(item) {
  var inv = getGlobalInventory();
  // Prevent duplicates for singleton item types (music-player, enchanter, soul-trap, skill-orb)
  // These should never stack in global inventory.
  // BUGFIX: this array only ever listed 'music-player', so every run completion
  // re-added the player's ENTIRE current weapon/armor/enchanter/soul-trap
  // collection into global inventory unconditionally (initDungeon() seeds a new
  // run's inventory FROM global inventory, so that collection already contained
  // everything from every prior run). Each completed run roughly doubled these
  // counts, compounding over time into inventories with thousands of duplicate
  // entries of the same handful of items — real memory/serialization weight on
  // every autosave, and a plausible cause of crashes on long-running saves.
  var singletonTypes = ['music-player', 'enchanter', 'soul-trap', 'skill-orb'];
  if (singletonTypes.indexOf(item.type) !== -1) {
    var alreadyExists = inv.some(function(i){ return i.type === item.type; });
    if (alreadyExists) return; // don't add another one
  }
  // Weapons and armor are unique by name — same rule searchRoom() already
  // applies when loot is found directly, now applied consistently here too.
  if (item.type === 'weapon' || item.type === 'armor') {
    var alreadyHasNamed = inv.some(function(i){ return i.type === item.type && i.name === item.name; });
    if (alreadyHasNamed) return;
  }
  inv.push(item);
  saveGlobalInventory(inv);
}

// One-time cleanup for inventories already bloated by the addToGlobalInventory
// dedup bug above — collapses repeated weapon/armor/singleton-type entries down
// to one each, keeping every other item (potions, materials, etc.) untouched.
// Safe to call on any inventory array; a clean array passes through unchanged.
function dedupeInventoryArray(arr) {
  if (!arr || !arr.length) return arr || [];
  var singletonTypes = ['music-player', 'enchanter', 'soul-trap', 'skill-orb'];
  var seenSingleton = {};
  var seenNamed = {};
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    var item = arr[i];
    if (!item) continue;
    if (singletonTypes.indexOf(item.type) !== -1) {
      if (seenSingleton[item.type]) continue;
      seenSingleton[item.type] = true;
    } else if (item.type === 'weapon' || item.type === 'armor') {
      var key = item.type + '::' + item.name;
      if (seenNamed[key]) continue;
      seenNamed[key] = true;
    }
    out.push(item);
  }
  return out;
}
// ── END GLOBAL GOLD SYSTEM ──
var _deleteIdx = null;
var _charIdx = null;

function saveChars() {
  try {
    var data = JSON.stringify(CHARS);
    DDStore.setItem('dd_chars', data);
  } catch(e) {
    console.error('[DD Save] saveChars FAILED:', e.message);
    // localStorage might be full — try clearing old data
    if (e.name === 'QuotaExceededError') {
      console.error('[DD Save] localStorage quota exceeded! Trying to clear space...');
      try {
        DDStore.removeItem('dd_event_popup_seen');
        DDStore.removeItem('dd_version_seen');
        DDStore.setItem('dd_chars', JSON.stringify(CHARS));
        console.log('[DD Save] Retry succeeded after clearing space.');
      } catch(e2) {
        console.error('[DD Save] Retry also failed:', e2.message);
      }
    }
  }
}

var CLASS_ICONS = { Warrior:'⚔️', Monk:'🥋', Assassin:'🗡️', Paladin:'🛡️', Naturalist:'🌿', Sorcerer:'🔮', Necromancer:'💀', Berserker:'🪓', Bard:'🎵', Alchemist:'⚗️', BloodKnight:'🩸', Druid:'🌙', Warlock:'🧿', DeathKnight:'💀', Ranger:'🏹', Sentinel:'🛡', Cleric:'✝️', Wizard:'🧙' };
var CLASS_ICONS_ORIG = { Warrior:'⚔️', Monk:'🥋', Assassin:'🗡️', Paladin:'🛡️', Naturalist:'🌿', Sorcerer:'🔮', Necromancer:'💀', Berserker:'🪓', Bard:'🎵', Alchemist:'⚗️', BloodKnight:'🩸', Druid:'🌙' };
var DIFF_CLASS = { Wanderer:'diff-Wanderer', Ironblood:'diff-Ironblood', Condemned:'diff-Condemned', Forsaken:'diff-Forsaken', Nightmare:'diff-Nightmare', Endless:'diff-Endless', Insane:'diff-Nightmare' };

function renderCharList() {
  var list = document.getElementById('char-list');
  var importBtn = document.getElementById('import-char-btn');
  var newBtn = document.getElementById('new-char-btn');
  var limitNote = document.getElementById('char-limit-note');

  if (importBtn) importBtn.style.display = CHARS.length < 5 ? '' : 'none';

  // Clear first, then rebuild after a tick — forces JAWS to invalidate its virtual buffer
  list.innerHTML = '';
  list.removeAttribute('aria-label');
  setTimeout(function() {
    list.setAttribute('aria-label', 'Character list');
    _renderCharListInner(list, importBtn, newBtn, limitNote);
  }, 50);
}

function _renderCharListInner(list, importBtn, newBtn, limitNote) {

  if (CHARS.length === 0) {
    var empty = document.createElement('div');
    empty.style.cssText = 'padding:32px;text-align:center;border:1px solid var(--border-dim);';
    empty.innerHTML = '<p style="font-family:Cinzel,serif;font-size:.75rem;color:var(--text-dim);">No champions yet. Create your first character.</p>';
    list.appendChild(empty);
  } else {
    CHARS.forEach(function(ch, i) {
      try {
      var card = document.createElement('div');
      card.className = 'char-card';
      card.setAttribute('role', 'listitem');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-atomic', 'true');
      card.id = 'char-card-' + i + '-' + Date.now();

      var icon = CLASS_ICONS[ch.cls] || '⚔️';
      var dc = DIFF_CLASS[ch.difficulty] || '';
      var notStarted = !ch.floor || ch.floor === 0;
      var charLevel = ch.persistLevel || 1;

      // Status
      var statusHtml = ch.completed
        ? '<span style="color:#7aaa7a;">✦ Completed — ' + ch.dungeon + '</span>'
        : notStarted
          ? '<span style="color:var(--text-dim);font-style:italic;">Ready to descend.</span>'
          : '<span>Floor ' + ch.floor + ' / 10</span>';

      // Legacy Mode tier badge
      var legacyBadge = (ch.runMode === 'legacy')
        ? '<span style="font-family:Cinzel,serif;font-size:0.6rem;color:#aa66ff;background:rgba(100,50,200,0.15);border:1px solid #6644aa;padding:2px 8px;margin-left:6px;">🌑 Legacy · Tier ' + (ch.dungeonTier || 1) + '</span>'
        : '';

      // Stat row
      var maxHp = HP_MAP[ch.cls] || 100;
      var atkRange = ATK_MAP[ch.cls] || [6,12];
      var statRow = '<div class="char-stat-row">' +
        '<span class="char-stat-pip hi">HP ' + maxHp + '</span>' +
        '<span class="char-stat-pip hi">ATK ' + atkRange[0] + '-' + atkRange[1] + '</span>' +
        '<span class="char-stat-pip">DEF ' + (DEF_MAP[ch.cls]||0) + '</span>' +
        (ch.ngPlus ? '<span class="char-stat-pip hi">NG+</span>' : '') +
        '</div>';

      // Spirit badge
      var spiritCount = ch.earnedSpirits ? ch.earnedSpirits.length : 0;
      var spiritBadge = spiritCount > 0
        ? '<span class="char-spirit-badge">✦ ' + spiritCount + ' Spirit' + (spiritCount > 1 ? 's' : '') + ' Earned</span>'
        : '';

      // Death log
      var deathHtml = '';
      if (ch.deathLog && ch.deathLog.length > 0) {
        deathHtml = '<div class="death-log">';
        ch.deathLog.slice(-2).forEach(function(d) {
          deathHtml += '<div class="death-entry">' +
            '<span class="death-entry-icon">☠</span>' +
            '<span class="death-entry-text">Floor ' + d.floor + ' — ' + d.killedBy + '</span>' +
            '</div>';
        });
        deathHtml += '</div>';
      }

      // Play button label
      var playLabel = '⚔ Play';
      try { if (hasMidRunSave(ch)) playLabel = '▶ Resume'; else if (ch.completed) playLabel = '✦ NG+'; } catch(e2) {}

      // A character imported from an export code saved before some field
      // existed (race/prof/difficulty/dungeon/cls weren't always all part
      // of the character object across every past version) comes back
      // from JSON.parse missing that key entirely — and unlike the lookups
      // above (CLASS_ICONS[ch.cls]||'⚔️', etc.), these were concatenated
      // straight into the card's text AND its aria-label with no fallback,
      // so a missing field didn't just look blank — it printed and spoke
      // the literal word "undefined". Character List is the single most
      // common screen in the game, so this is exactly the kind of thing
      // that reads as "the game is broken."
      var safeName = ch.name || 'Unnamed';
      var safeCls = ch.cls || 'Unknown Class';
      var safeRace = ch.race || 'Unknown Race';
      var safeProf = ch.prof || 'Unknown Profession';
      var safeDungeon = ch.dungeon || 'Unknown Dungeon';
      var safeDifficulty = ch.difficulty || 'Unknown';

      card.innerHTML =
        '<span class="char-class-icon" aria-hidden="true">' + icon + '</span>' +
        '<div class="char-info">' +
          '<div class="char-name-row">' +
            '<span class="char-name">' + safeName + '</span>' +
            '<span class="char-class-badge">' + safeCls + '</span>' +
            '<span class="char-class-badge" style="background:#1a1000;border-color:#ffaa00;color:#ffaa00;" aria-label="Level ' + charLevel + '">Lv ' + charLevel + '</span>' +
            legacyBadge +
          '</div>' +
          '<p class="char-details">' + safeRace + ' · ' + safeProf + ' · ' + safeDungeon + getEndlessBestStr(ch) + '</p>' +
          '<div class="char-status">' + statusHtml +
            ' <span class="char-diff-badge ' + dc + '">' + safeDifficulty + '</span>' +
          '</div>' +
          statRow +
          spiritBadge +
          deathHtml +
          '<div class="char-btns-row">' +
            '<button class="char-btn play" onclick="event.stopPropagation();playChar(' + i + ')" aria-label="' + playLabel + ' ' + safeName + ' Level ' + charLevel + ' ' + safeCls + '">' + playLabel + '</button>' +
            '<button class="char-btn" onclick="event.stopPropagation();viewCharStats(' + i + ')" aria-label="View stats for ' + safeName + '">📊 Stats</button>' +
            '<button class="char-btn" onclick="event.stopPropagation();exportCharacter(' + i + ')" aria-label="Export ' + safeName + '">📤 Export</button>' +
            '<button class="char-btn red" onclick="event.stopPropagation();askDelete(' + i + ')" aria-label="Delete ' + safeName + '">🗑 Delete</button>' +
          '</div>' +
        '</div>';

      var backstoryLabel = ch.backstoryName ? ' Origin: ' + ch.backstoryName + '.' : '';
      var fullAriaLabel = safeName + ' the ' + safeRace + ' ' + safeCls + '. Level ' + charLevel + '. ' + safeDungeon + '. ' + safeDifficulty + '.' + backstoryLabel;
      card.setAttribute('aria-label', fullAriaLabel);
      card.setAttribute('aria-atomic', 'true');
      // Force JAWS to re-read updated label by briefly toggling role
      setTimeout(function() {
        card.setAttribute('aria-label', fullAriaLabel);
      }, 100);
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playChar(i); }
      });

      list.appendChild(card);
      } catch(err) {
        // If a card crashes log it but keep rendering others
        var errCard = document.createElement('div');
        errCard.style.cssText = 'padding:12px;border:1px solid #6a2020;color:#c06060;font-size:0.75rem;margin-bottom:8px;';
        errCard.textContent = 'Error loading character ' + (ch.name||'Unknown') + '. Data may be corrupted.';
        errCard.setAttribute('tabindex','0');
        list.appendChild(errCard);
        say('Warning: character ' + (ch.name||'Unknown') + ' could not load. Data may be corrupted.');
      }
    });
  }

  var atLimit = CHARS.length >= MAX_CHARS;
  if (newBtn) newBtn.style.display = atLimit ? 'none' : 'flex';
  if (limitNote) limitNote.textContent = atLimit ? 'Maximum of ' + MAX_CHARS + ' characters. Delete one to create a new legend.' : '';
  // Update slider
  _charListSliderIdx = Math.min(_charListSliderIdx, Math.max(0, CHARS.length - 1));
  updateCharListSlider();
  say('Character list updated. ' + CHARS.length + ' character' + (CHARS.length !== 1 ? 's' : '') + ' available.');
}

function playChar(i) {
  sfx('sfx-confirm');
  _charIdx = i;
  var ch = CHARS[i];

  // NG+ completed run
  if (ch.completed) {
    _pendingNGPlus = i;
    document.getElementById('ov-confirm-title').textContent = 'Start New Game Plus?';
    document.getElementById('ov-confirm-text').textContent = ch.name + ' has completed ' + ch.dungeon + '. Start a New Game Plus run? Enemies will be stronger.';
    document.getElementById('ov-confirm-ok').textContent = 'Begin NG+';
    document.getElementById('ov-confirm-ok').onclick = function() { closeOv('ov-confirm'); startNGPlus(i); };
    document.getElementById('ov-confirm-cancel').textContent = '← Back';
    document.getElementById('ov-confirm-cancel').onclick = function() { closeOv('ov-confirm'); };
    openOv('ov-confirm'); return;
  }

  // Mid-run save exists — offer resume
  if (hasMidRunSave(ch)) {
    document.getElementById('ov-confirm-title').textContent = 'Resume Your Run?';
    document.getElementById('ov-confirm-text').textContent =
      ch.name + ' was on floor ' + ch.midRunSave.floor + ' with ' + ch.midRunSave.hp + ' HP when you left. Resume exactly where you were?';
    document.getElementById('ov-confirm-ok').textContent = '▶ Resume Run';
    document.getElementById('ov-confirm-ok').onclick = function() {
      closeOv('ov-confirm');
      goTo('dungeon');
      setTimeout(function() {
        restoreMidRun(ch);
        updateTopBar(); updatePlayerBar(); updateXPBar();
        renderInv(); updateSkillButtons(); updateSpiritDisplay();
        setEvent('good', 'Run resumed. Welcome back, ' + DS.name + '. Floor ' + DS.floor + '.');
        say('Run resumed. Floor ' + DS.floor + ' with ' + DS.hp + ' HP. ' + DS.kills + ' enemies slain.');
      }, 300);
    };
    document.getElementById('ov-confirm-cancel').textContent = '✦ Start Fresh';
    document.getElementById('ov-confirm-cancel').onclick = function() {
      closeOv('ov-confirm');
      CHARS[i].midRunSave = null; saveChars();
      goTo('dungeon');
      setTimeout(function() { showQuestPopup(); }, 300);
    };
    openOv('ov-confirm'); return;
  }

  // Normal new run
  say(ch.name + ' descends into ' + ch.dungeon + '. Good luck.');
  initDungeon(ch);
  goTo('dungeon');
  setTimeout(function() { showQuestPopup(); }, 150);
}

function startNewChar() {
  if (CHARS.length >= MAX_CHARS) { say('Maximum characters reached. Delete one first.'); return; }
  sfx('sfx-select');
  resetCreation();
  goTo('creation');
}

function cancelCreation() { sfx('sfx-select'); goTo('charlist'); }

function askDelete(i) {
  _deleteIdx = i;
  document.getElementById('ov-delete-text').textContent = '"' + CHARS[i].name + '" will be lost to the dark forever. This cannot be undone.';
  openOv('ov-delete');
  say('Delete confirmation for ' + CHARS[i].name + '. Press Delete to confirm or Keep to cancel.');
}

function confirmDelete() {
  if (_deleteIdx === null) return;
  var name = CHARS[_deleteIdx].name;
  addToGraveyard(CHARS[_deleteIdx]);
  CHARS.splice(_deleteIdx, 1);
  saveChars();
  _deleteIdx = null;
  closeOv('ov-delete');
  renderCharList();
  say(name + ' has been deleted.');
}
