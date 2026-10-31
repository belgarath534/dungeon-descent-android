//═════════════════
// COMMAND CENTER
//═════════════════
var _ccScheduled = null; // scheduled command timer

function openCommandCenter() {
  var ov = document.getElementById('ov-command-center');
  if (!ov) return;
  ov.style.display = 'flex';
  // Show mic button if either the native plugin or the browser API is
  // available — was checking only the browser API, which iOS's WKWebView
  // never implements, so the mic button silently never appeared there.
  var micBtn = document.getElementById('cc-mic-btn');
  if (micBtn && _voiceRecognitionMode()) {
    micBtn.style.display = '';
  }
  setTimeout(function(){ var inp = document.getElementById('cc-input'); if(inp) inp.focus(); }, 100);
  say('Command Center open. Type a command and press Run, or tap the mic to speak. Type help to see all commands.');
}

function closeCommandCenter() {
  var ov = document.getElementById('ov-command-center');
  if (ov) ov.style.display = 'none';
  say('Command Center closed.');
}

function ccPrint(text, cls) {
  var out = document.getElementById('cc-output');
  if (!out) return;
  var line = document.createElement('div');
  line.className = cls || 'cc-line-info';
  line.textContent = text;
  out.appendChild(line);
  out.scrollTop = out.scrollHeight;
}

function runQuick(cmd) {
  var inp = document.getElementById('cc-input');
  if (inp) inp.value = cmd;
  executeCommand();
}

function parseTime(str) {
  // Parse time strings like "12am", "12pm", "23:00", "11:30pm"
  str = str.toLowerCase().trim();
  var now = new Date();
  var target = new Date();
  var match12 = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  var match24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (match12) {
    var h = parseInt(match12[1]);
    var m = parseInt(match12[2] || '0');
    if (match12[3] === 'pm' && h !== 12) h += 12;
    if (match12[3] === 'am' && h === 12) h = 0;
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  }
  if (match24) {
    target.setHours(parseInt(match24[1]), parseInt(match24[2]), 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  }
  return null;
}

function executeCommand() {
  var inp = document.getElementById('cc-input');
  if (!inp) return;
  var raw = inp.value.trim();
  if (!raw) return;
  inp.value = '';

  ccPrint('> ' + raw, 'cc-line-cmd');

  var cmd = raw.toLowerCase();
  var words = cmd.split(/\s+/);
  var verb = words[0];
  var args = words.slice(1).join(' ');

  // ── CHARACTER CREATION ──
  if (cmd === 'create character' || cmd === 'create' || cmd === 'new character') {
    ccStartCharacterCreation();
    return;
  }

  // ── If in character creation flow route to handler ──
  if (_ccStep) {
    ccHandleInput(raw);
    return;
  }

  // ── NAVIGATION ──
  if (verb === 'go' || verb === 'open' || verb === 'navigate') {
    var dest = args;
    var destinations = {
      'blacksmith': function(){ closeCommandCenter(); openBlacksmith(); ccPrint('Opening Blacksmith...', 'cc-line-ok'); },
      'spire': function(){ closeCommandCenter(); goTo('spire'); ccPrint('Opening The Spire...', 'cc-line-ok'); },
      'chronicles': function(){ closeCommandCenter(); goTo('chronicles'); ccPrint('Opening Chronicles...', 'cc-line-ok'); },
      'events': function(){ closeCommandCenter(); goTo('events'); ccPrint('Opening Events...', 'cc-line-ok'); },
      'bestiary': function(){ closeCommandCenter(); goTo('bestiary'); ccPrint('Opening Bestiary...', 'cc-line-ok'); },
      'settings': function(){ closeCommandCenter(); openSettings(); ccPrint('Opening Settings...', 'cc-line-ok'); },
      'menu': function(){ closeCommandCenter(); goTo('menu'); ccPrint('Going to main menu...', 'cc-line-ok'); },
      'highscore': function(){ closeCommandCenter(); goTo('highscore'); ccPrint('Opening High Score...', 'cc-line-ok'); },
      'hall of records': function(){ closeCommandCenter(); goTo('globalstats'); ccPrint('Opening Hall of Records...', 'cc-line-ok'); },
    };
    if (destinations[dest]) { destinations[dest](); say('Going to ' + dest + '.'); }
    else ccPrint('Unknown destination: "' + dest + '". Try: blacksmith, spire, chronicles, events, bestiary, settings, menu.', 'cc-line-err');
    return;
  }

  // ── AFK ──
  if (cmd === 'start afk' || cmd === 'afk' || cmd === 'endless descent') {
    closeCommandCenter();
    goTo('afk-setup');
    ccPrint('Opening Endless Descent...', 'cc-line-ok');
    say('Opening Endless Descent.');
    return;
  }

  if (cmd.startsWith('start afk at ') || cmd.startsWith('afk at ') || cmd.startsWith('schedule afk ')) {
    var timeStr = cmd.replace(/^(start afk at|afk at|schedule afk)\s*/, '');
    var targetTime = parseTime(timeStr);
    if (!targetTime) { ccPrint('Could not parse time "' + timeStr + '". Try: start afk at 12am, afk at 11:30pm', 'cc-line-err'); return; }
    var msUntil = targetTime - Date.now();
    var hoursUntil = Math.floor(msUntil / 3600000);
    var minsUntil = Math.floor((msUntil % 3600000) / 60000);
    if (_ccScheduled) { clearTimeout(_ccScheduled); }
    _ccScheduled = setTimeout(function(){
      goTo('afk-setup');
      say('Scheduled AFK run starting now. Good morning, Descender.');
      ccPrint('Scheduled AFK run launched!', 'cc-line-ok');
      _ccScheduled = null;
    }, msUntil);
    var timeLabel = targetTime.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    ccPrint('AFK run scheduled for ' + timeLabel + ' (' + hoursUntil + 'h ' + minsUntil + 'm from now).', 'cc-line-ok');
    say('AFK run scheduled for ' + timeLabel + '. ' + hoursUntil + ' hours and ' + minsUntil + ' minutes from now. Sleep well.');
    return;
  }

  if (cmd === 'cancel schedule' || cmd === 'cancel afk' || cmd === 'unschedule') {
    if (_ccScheduled) { clearTimeout(_ccScheduled); _ccScheduled = null; ccPrint('Scheduled command cancelled.', 'cc-line-ok'); say('Scheduled AFK run cancelled.'); }
    else { ccPrint('No scheduled command to cancel.', 'cc-line-err'); }
    return;
  }

  // ── DAILY DESCENT ──
  if (cmd === 'claim daily' || cmd === 'daily' || cmd === 'claim reward') {
    closeCommandCenter();
    checkDailyDescent();
    ccPrint('Opening Daily Descent reward...', 'cc-line-ok');
    say('Opening Daily Descent.');
    return;
  }

  // ── GOLD ──
  if (cmd === 'gold' || cmd === 'how much gold' || cmd === 'money') {
    var g = getGlobalGold();
    ccPrint('You have ' + g + ' gold.', 'cc-line-ok');
    say('You have ' + g + ' gold.');
    return;
  }

  // ── MUSIC ──
  if (cmd.startsWith('play ')) {
    var trackName = args;
    ccPrint('Attempting to play: ' + trackName + '...', 'cc-line-info');
    playTrack(trackName);
    say('Playing ' + trackName + '.');
    return;
  }
  if (cmd === 'stop music' || cmd === 'mute music' || cmd === 'pause music') {
    // stopMusic doesn't exist anywhere — as a bare undeclared identifier
    // (not a property access), referencing it at all threw a ReferenceError
    // immediately, even inside this && short-circuit. This is the same
    // inline pause pattern used everywhere else in the file.
    if (AUD && AUD.current && AUD.tracks && AUD.tracks[AUD.current]) { try { AUD.tracks[AUD.current].pause(); } catch(e){} }
    ccPrint('Music stopped.', 'cc-line-ok');
    say('Music stopped.');
    return;
  }

  // ── STATS ──
  if (cmd === 'stats' || cmd === 'my stats' || cmd === 'status') {
    var gold = getGlobalGold();
    var chars = CHARS.filter(function(c){ return c; }).length;
    var frags = parseInt(DDStore.getItem('dd_soul_fragments') || '0');
    var coins = parseInt(DDStore.getItem('dd_mystery_coins') || '0');
    ccPrint('Gold: ' + gold + 'g', 'cc-line-ok');
    ccPrint('Characters: ' + chars, 'cc-line-ok');
    ccPrint('Soul Fragments: ' + frags, 'cc-line-ok');
    ccPrint('Mystery Coins: ' + coins, 'cc-line-ok');
    say('Gold ' + gold + '. Characters ' + chars + '. Soul Fragments ' + frags + '. Mystery Coins ' + coins + '.');
    return;
  }

  // ── TIME ──
  if (cmd === 'time' || cmd === 'what time is it') {
    var now = new Date();
    var timeStr = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    ccPrint('Current time: ' + timeStr, 'cc-line-ok');
    say('The time is ' + timeStr + '.');
    return;
  }

  // ── REDEEM ──
  if (cmd.startsWith('redeem ') || cmd.startsWith('code ')) {
    var codeVal = args.toUpperCase();
    var fakeInput = { value: codeVal };
    var fakeMsg = { textContent:'', style:{color:''} };
    document.getElementById('redeem-code-input') && (document.getElementById('redeem-code-input').value = codeVal);
    redeemCode();
    var msg = document.getElementById('redeem-msg');
    if (msg) ccPrint(msg.textContent, msg.style.color === '#44aa44' ? 'cc-line-ok' : 'cc-line-err');
    return;
  }

  // ── HELP ──
  if (cmd === 'help' || cmd === '?' || cmd === 'commands') {
    var helpLines = [
      '── NAVIGATION ──────────────────',
      'go blacksmith         → Open Blacksmith',
      'go spire              → Open The Spire',
      'go chronicles         → Open Chronicles',
      'go events             → Open Events',
      'go bestiary           → Open Bestiary',
      'go settings           → Open Settings',
      '── CHARACTER ───────────────────',
      'create character      → Build a character in terminal',
      '── AFK ─────────────────────────',
      'start afk             → Launch AFK mode now',
      'start afk at 12am     → Schedule AFK at midnight',
      'start afk at 11:30pm  → Schedule at specific time',
      'cancel schedule       → Cancel scheduled command',
      '── REWARDS ─────────────────────',
      'claim daily           → Claim Daily Descent reward',
      'gold                  → Check your gold',
      'stats                 → Full account stats',
      'redeem DDBD26         → Redeem a code',
      '── MUSIC ───────────────────────',
      'play [track]          → Play a music track',
      'stop music            → Stop music',
      '── OTHER ───────────────────────',
      'time                  → Current time',
      'help                  → Show this list',
    ];
    helpLines.forEach(function(l){ ccPrint(l, 'cc-line-info'); });
    say('Help displayed. ' + helpLines.length + ' commands available.');
    return;
  }

  // ── UNKNOWN ──
  ccPrint('Unknown command: "' + raw + '". Type help to see all commands.', 'cc-line-err');
  say('Unknown command. Type help to see all available commands.');
}

// This used to check only window.SpeechRecognition/webkitSpeechRecognition,
// which iOS's WKWebView has never implemented (same gap the new Voice
// Commands feature was built to work around — see _voiceRecognitionMode()
// and _voiceCommandNative() above). Reusing that same native-plugin path
// here means the Command Center's own mic button now actually works on
// iOS too, instead of silently never showing up.
async function startVoiceCommand() {
  var mode = _voiceRecognitionMode();
  var micBtn = document.getElementById('cc-mic-btn');
  var inp = document.getElementById('cc-input');
  if (!mode) { ccPrint('Voice recognition not available on this device or browser.', 'cc-line-err'); return; }

  if (mode === 'native') {
    var SR = Capacitor.Plugins.SpeechRecognition;
    try {
      var perm = await SR.checkPermissions();
      if (perm.speechRecognition !== 'granted') {
        perm = await SR.requestPermissions();
        if (perm.speechRecognition !== 'granted') {
          ccPrint('Voice commands need microphone and speech recognition permission. Enable it in device Settings.', 'cc-line-err');
          say('Voice commands need microphone and speech recognition permission. Enable it in your device Settings.');
          return;
        }
      }
      if (micBtn) { micBtn.textContent = '🔴'; micBtn.style.borderColor = '#ff4444'; }
      say('Listening. Speak your command.');
      var result = await SR.start({ language: 'en-US', maxResults: 1, popup: false, partialResults: false });
      if (micBtn) { micBtn.textContent = '🎤'; micBtn.style.borderColor = '#333'; }
      var transcript = (result && result.matches && result.matches[0]) || '';
      if (!transcript) { ccPrint('Did not catch that. Try typing instead.', 'cc-line-err'); say('Did not catch that.'); return; }
      if (inp) inp.value = transcript;
      ccPrint('Heard: "' + transcript + '"', 'cc-line-info');
      executeCommand();
    } catch (e) {
      if (micBtn) { micBtn.textContent = '🎤'; micBtn.style.borderColor = '#333'; }
      console.warn('[DD] Command Center voice (native) failed:', e);
      ccPrint('Voice error. Try typing instead.', 'cc-line-err');
      say('Voice recognition error. Please type your command instead.');
    }
    return;
  }

  // Web fallback — browser build, real Chrome/Edge tab
  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRec();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  if (micBtn) { micBtn.textContent = '🔴'; micBtn.style.borderColor = '#ff4444'; }
  say('Listening. Speak your command.');
  recognition.start();
  recognition.onresult = function(event) {
    var transcript = event.results[0][0].transcript;
    if (inp) inp.value = transcript;
    if (micBtn) { micBtn.textContent = '🎤'; micBtn.style.borderColor = '#333'; }
    ccPrint('Heard: "' + transcript + '"', 'cc-line-info');
    executeCommand();
  };
  recognition.onerror = function(e) {
    if (micBtn) { micBtn.textContent = '🎤'; micBtn.style.borderColor = '#333'; }
    ccPrint('Voice error: ' + e.error + '. Try typing instead.', 'cc-line-err');
    say('Voice recognition error. Please type your command instead.');
  };
  recognition.onend = function() {
    if (micBtn) { micBtn.textContent = '🎤'; micBtn.style.borderColor = '#333'; }
  };
}
function toggleCommandCenter() {
  var current = DDStore.getItem('dd_command_center') !== 'off';
  var newVal = !current;
  DDStore.setItem('dd_command_center', newVal ? 'on' : 'off');
  var btn = document.getElementById('cc-toggle-btn');
  if (btn) { btn.textContent = newVal ? 'ON' : 'OFF'; btn.style.color = newVal ? '#44ff88' : '#888'; }
  var menuBtn = document.querySelector('.menu-btn[onclick="openCommandCenter()"]');
  if (menuBtn) menuBtn.style.display = newVal ? '' : 'none';
  say('Command Center ' + (newVal ? 'enabled. It now appears on the main menu.' : 'disabled. It has been removed from the main menu.'));
}

function initCommandCenterToggle() {
  var enabled = DDStore.getItem('dd_command_center') !== 'off';
  var btn = document.getElementById('cc-toggle-btn');
  if (btn) { btn.textContent = enabled ? 'ON' : 'OFF'; btn.style.color = enabled ? '#44ff88' : '#888'; }
  var menuBtn = document.querySelector('.menu-btn[onclick="openCommandCenter()"]');
  if (menuBtn) menuBtn.style.display = enabled ? '' : 'none';
}

// ── TERMINAL CHARACTER CREATOR ──
var _ccChar = {}; // character being built in terminal
var _ccStep = null; // current creation step

// These four lists are the terminal's own copy of what the real
// character-creation screen offers, kept in sync by hand — they went stale
// for a long time (6 classes and a whole dungeon added since, and the
// Profession step was never added here at all, so every terminal-created
// character silently got prof:'Wanderer', which isn't a real profession and
// grants no profession bonus). Cross-check against the class-card/data-prof
// buttons around line 2400-2650 if classes/races/dungeons/professions are
// added again later.
var _ccClasses = ['Warrior','Monk','Assassin','Paladin','Naturalist','Sorcerer','Necromancer','Berserker','Bard','Alchemist','BloodKnight','Druid','Warlock','DeathKnight','Ranger','Sentinel','Cleric','Wizard','Elementalist','VoidWalker','ShadowMage','TimeMage','Shaman','Arcanist'];
var _ccRaces = ['Human','Elf','Dwarf','Orc','Tiefling','Shade','Vampire','Goblin','Angel','Demon','Golem','Halfling','Dragonborn','Gnome','Merfolk'];
var _ccProfs = ['Blacksmith','Herbalist','Scholar','Mercenary','Gravedigger','Thief','Pilgrim','Grave Robber','Street Rat','Tinkerer','Warden'];
var _ccDungeons = ['Crypt of Malachar','The Ashbound Wastes','Frosthold Abyss','The Sunken Archives','The Hollow','The Whispering Forest','The Infernal Descent','The Abyssal Deep','The Shadow World'];
// ("Explorer" isn't a difficulty, and Ironblood and Insane were missing)
var _ccDiffs = ['Wanderer','Ironblood','Condemned','Forsaken','Nightmare','Endless','Insane'];

function ccStartCharacterCreation() {
  // It let a sixth character be made past the limit
  if (CHARS.length >= MAX_CHARS) { ccPrint('Maximum of ' + MAX_CHARS + ' characters. Delete one first.', 'cc-line-err'); return; }
  _ccChar = {};
  _ccStep = 'class';
  ccPrint('', 'cc-line-info');
  ccPrint('── CHARACTER CREATOR ───────────────', 'cc-line-cmd');
  ccPrint('Creating a new character through the terminal.', 'cc-line-info');
  ccPrint('Type a number or name. Type cancel to stop.', 'cc-line-info');
  ccPrint('', 'cc-line-info');
  ccShowClassOptions();
}

function ccShowClassOptions() {
  ccPrint('STEP 1 — Choose your Class:', 'cc-line-cmd');
  _ccClasses.forEach(function(cls, i) {
    ccPrint((i+1) + '. ' + cls + ' — ' + (_clsDescs[cls] || ''), 'cc-line-info');
  });
  ccPrint('', 'cc-line-info');
  say('Step 1. Choose your class. ' + _ccClasses.map(function(c,i){ return (i+1)+' '+c; }).join(', '));
}

function ccHandleInput(raw) {
  var input = raw.trim().toLowerCase();
  if (input === 'cancel' || input === 'quit' || input === 'exit') {
    _ccStep = null; _ccChar = {};
    ccPrint('Character creation cancelled.', 'cc-line-err');
    say('Character creation cancelled.'); return;
  }

  if (_ccStep === 'class') {
    var idx = parseInt(input) - 1;
    var cls = !isNaN(idx) && _ccClasses[idx] ? _ccClasses[idx]
            : _ccClasses.find(function(c){ return c.toLowerCase().startsWith(input); });
    if (!cls) { ccPrint('Invalid class. Type a number 1-' + _ccClasses.length + ' or a class name.', 'cc-line-err'); say('Invalid class. Try again.'); return; }
    _ccChar.cls = cls;
    ccPrint('✓ Class: ' + cls, 'cc-line-ok');
    _ccStep = 'race';
    ccPrint('', 'cc-line-info');
    ccPrint('STEP 2 — Choose your Race:', 'cc-line-cmd');
    _ccRaces.forEach(function(r, i){ ccPrint((i+1) + '. ' + r + ' — ' + (_raceDescs[r] || ''), 'cc-line-info'); });
    say('Step 2. Choose your race. ' + _ccRaces.map(function(r,i){ return (i+1)+' '+r; }).join(', '));
    return;
  }

  if (_ccStep === 'race') {
    var idx = parseInt(input) - 1;
    var race = !isNaN(idx) && _ccRaces[idx] ? _ccRaces[idx]
             : _ccRaces.find(function(r){ return r.toLowerCase().startsWith(input); });
    if (!race) { ccPrint('Invalid race. Type a number 1-' + _ccRaces.length + ' or a race name.', 'cc-line-err'); say('Invalid race. Try again.'); return; }
    _ccChar.race = race;
    ccPrint('✓ Race: ' + race, 'cc-line-ok');
    _ccStep = 'profession';
    ccPrint('', 'cc-line-info');
    ccPrint('STEP 3 — Choose your Profession:', 'cc-line-cmd');
    _ccProfs.forEach(function(p, i){ ccPrint((i+1) + '. ' + p + ' — ' + (_profDescs[p]||''), 'cc-line-info'); });
    say('Step 3. Choose your profession. ' + _ccProfs.map(function(p,i){ return (i+1)+' '+p; }).join(', '));
    return;
  }

  if (_ccStep === 'profession') {
    var idx = parseInt(input) - 1;
    var prof = !isNaN(idx) && _ccProfs[idx] ? _ccProfs[idx]
             : _ccProfs.find(function(p){ return p.toLowerCase().startsWith(input); });
    if (!prof) { ccPrint('Invalid profession. Type a number 1-' + _ccProfs.length + ' or a profession name.', 'cc-line-err'); say('Invalid profession. Try again.'); return; }
    _ccChar.prof = prof;
    ccPrint('✓ Profession: ' + prof, 'cc-line-ok');
    _ccStep = 'dungeon';
    ccPrint('', 'cc-line-info');
    ccPrint('STEP 4 — Choose your Dungeon:', 'cc-line-cmd');
    _ccDungeons.forEach(function(d, i){ ccPrint((i+1) + '. ' + d, 'cc-line-info'); });
    say('Step 4. Choose your dungeon. ' + _ccDungeons.map(function(d,i){ return (i+1)+' '+d; }).join(', '));
    return;
  }

  if (_ccStep === 'dungeon') {
    var idx = parseInt(input) - 1;
    var dng = !isNaN(idx) && _ccDungeons[idx] ? _ccDungeons[idx]
            : _ccDungeons.find(function(d){ return d.toLowerCase().includes(input); });
    if (!dng) { ccPrint('Invalid dungeon. Type a number 1-' + _ccDungeons.length + '.', 'cc-line-err'); say('Invalid dungeon. Try again.'); return; }
    _ccChar.dungeon = dng;
    ccPrint('✓ Dungeon: ' + dng, 'cc-line-ok');
    _ccStep = 'difficulty';
    ccPrint('', 'cc-line-info');
    ccPrint('STEP 5 — Choose your Difficulty:', 'cc-line-cmd');
    _ccDiffs.forEach(function(d, i){ ccPrint((i+1) + '. ' + d, 'cc-line-info'); });
    say('Step 5. Choose difficulty. 1 Wanderer, 2 Explorer, 3 Forsaken, 4 Condemned, 5 Nightmare.');
    return;
  }

  if (_ccStep === 'difficulty') {
    var idx = parseInt(input) - 1;
    var diff = !isNaN(idx) && _ccDiffs[idx] ? _ccDiffs[idx]
             : _ccDiffs.find(function(d){ return d.toLowerCase().startsWith(input); });
    if (!diff) { ccPrint('Invalid difficulty. Type 1-5.', 'cc-line-err'); say('Invalid difficulty. Try again.'); return; }
    _ccChar.diff = diff;
    ccPrint('✓ Difficulty: ' + diff, 'cc-line-ok');
    _ccStep = 'name';
    ccPrint('', 'cc-line-info');
    ccPrint('STEP 6 — What is your character\'s name?', 'cc-line-cmd');
    say('Step 6. What is your character name? Type it and press run.');
    return;
  }

  if (_ccStep === 'name') {
    if (!raw.trim()) { ccPrint('Please enter a name.', 'cc-line-err'); return; }
    _ccChar.name = raw.trim().substring(0, 20);
    ccPrint('✓ Name: ' + _ccChar.name, 'cc-line-ok');
    _ccStep = 'confirm';
    ccPrint('', 'cc-line-info');
    ccPrint('── CHARACTER SUMMARY ───────────────', 'cc-line-cmd');
    ccPrint('Name:       ' + _ccChar.name, 'cc-line-ok');
    ccPrint('Class:      ' + _ccChar.cls, 'cc-line-ok');
    ccPrint('Race:       ' + _ccChar.race, 'cc-line-ok');
    ccPrint('Profession: ' + _ccChar.prof, 'cc-line-ok');
    ccPrint('Dungeon:    ' + _ccChar.dungeon, 'cc-line-ok');
    ccPrint('Difficulty: ' + _ccChar.diff, 'cc-line-ok');
    ccPrint('', 'cc-line-info');
    ccPrint('Launch into AFK mode? Type yes or no.', 'cc-line-cmd');
    say('Character summary. ' + _ccChar.name + ' the ' + _ccChar.race + ' ' + _ccChar.cls + ', ' + _ccChar.prof + '. Dungeon: ' + _ccChar.dungeon + '. Difficulty: ' + _ccChar.diff + '. Launch into AFK mode? Type yes or no.');
    return;
  }

  if (_ccStep === 'confirm') {
    if (input === 'yes' || input === 'y') {
      // Create character and launch AFK
      var ch = {
        name: _ccChar.name, cls: _ccChar.cls, race: _ccChar.race,
        prof: _ccChar.prof, dungeon: _ccChar.dungeon, difficulty: _ccChar.diff,
        floor: 0, created: Date.now(), runMode: 'classic',
        earnedSpirits: [], levelPoints: 0
      };
      CHARS.push(ch);
      _charIdx = CHARS.length - 1;
      saveChars();
      ccPrint('', 'cc-line-info');
      ccPrint(_ccChar.name + ' created! Launching AFK mode...', 'cc-line-ok');
      // Read the name out before clearing _ccChar below — say() used to run
      // AFTER the reset and always spoke "undefined is ready" instead.
      var createdName = _ccChar.name;
      _ccStep = null; _ccChar = {};
      say(createdName + ' is ready. Launching Endless Descent.');
      setTimeout(function(){ closeCommandCenter(); goTo('afk-setup'); }, 1200);
    } else if (input === 'no' || input === 'n') {
      // Create character without launching AFK
      var ch = {
        name: _ccChar.name, cls: _ccChar.cls, race: _ccChar.race,
        prof: _ccChar.prof, dungeon: _ccChar.dungeon, difficulty: _ccChar.diff,
        floor: 0, created: Date.now(), runMode: 'classic',
        earnedSpirits: [], levelPoints: 0
      };
      CHARS.push(ch);
      _charIdx = CHARS.length - 1;
      saveChars();
      ccPrint(_ccChar.name + ' created and saved! Find them in your character list.', 'cc-line-ok');
      // Same fix as above — capture the name before _ccChar is cleared.
      var savedName = _ccChar.name;
      _ccStep = null; _ccChar = {};
      say(savedName + ' created and saved. You can find them in your character list.');
    } else {
      ccPrint('Type yes to launch AFK or no to save without launching.', 'cc-line-err');
    }
    return;
  }
}
// ── END TERMINAL CHARACTER CREATOR ──

// ── OFFLINE AFK CATCH-UP ──
function checkOfflineProgress() {
  var last = parseInt(DDStore.getItem('dd_last_seen') || '0');
  var now = Date.now();
  DDStore.setItem('dd_last_seen', String(now));
  if (!last) return;
  var hoursAway = (now - last) / 3600000;
  if (hoursAway < 1) return; // need at least 1 hour away
  var cappedHours = Math.min(hoursAway, 8); // cap at 8 hours
  var ch = CHARS[_charIdx] || CHARS[0];
  if (!ch) return;

  // Simulate AFK rewards
  var goldPerHour = 35 + (ch.level || 1) * 4;
  var goldEarned = Math.round(goldPerHour * cappedHours);
  var xpEarned = Math.round(cappedHours * 15);
  var killsEarned = Math.round(cappedHours * 8);
  var fragmentsEarned = Math.floor(cappedHours / 2);

  addGlobalGold(goldEarned);
  if (fragmentsEarned > 0) {
    var frags = parseInt(DDStore.getItem('dd_soul_fragments') || '0');
    DDStore.setItem('dd_soul_fragments', String(frags + fragmentsEarned));
  }

  var hoursText = cappedHours >= 2 ? Math.floor(cappedHours) + ' hours' : 'about an hour';
  var msg =
    '<div style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:0.2em;color:var(--gold-dim);margin-bottom:8px;">WELCOME BACK</div>' +
    '<div style="font-family:Cinzel,serif;font-size:0.82rem;color:var(--gold);margin-bottom:6px;">' + ch.name + ' rested for ' + hoursText + '.</div>' +
    '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:#888;line-height:2;">' +
    '💰 +' + goldEarned + ' gold earned<br>' +
    '☠ ~' + killsEarned + ' enemies defeated<br>' +
    (fragmentsEarned > 0 ? '✨ +' + fragmentsEarned + ' soul fragments<br>' : '') +
    '</div>';

  // Show popup
  setTimeout(function() {
    window.scrollTo(0, 0); // iOS: must be at top for fixed positioning to work
    var ov = document.getElementById('ov-offline-progress');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'ov-offline-progress';
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-modal', 'true');
      ov.setAttribute('aria-label', 'Offline progress');
      ov.style.cssText = 'display:flex;position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:99999;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;';
      document.body.appendChild(ov);
    } else {
      ov.style.display = 'flex';
    }
    ov.innerHTML =
      '<div style="max-width:380px;width:100%;background:#0a0800;border:1px solid var(--gold-dim);padding:24px;text-align:center;">' +
      msg +
      '<button onclick="document.getElementById(\'ov-offline-progress\').style.display=\'none\';" ' +
      'style="margin-top:16px;width:100%;padding:14px;background:#1a1000;border:2px solid var(--gold);color:var(--gold);font-family:Cinzel,serif;font-size:0.85rem;cursor:pointer;" ' +
      'aria-label="Continue">Continue →</button>' +
      '</div>';
    setTimeout(function() {
      var btn = ov.querySelector('button');
      if (btn) btn.focus();
    }, 100);
    say('Welcome back. ' + ch.name + ' rested for ' + hoursText + '. You earned ' + goldEarned + ' gold and ' + killsEarned + ' kills while away.');
  }, 2000);
}
// ── END OFFLINE AFK CATCH-UP ──

// ── RUNES AND SCROLLS ──
var RUNE_DEFS = [
  { id:'rune-strength',    name:'Rune of Strength',    icon:'🔴', type:'rune', desc:'Grants +6 attack for the rest of this run.',       apply: function(){ DS.atkBonus += 6; addLog('🔴 Rune of Strength — +6 attack this run!'); say('Rune of Strength. Plus 6 attack for the rest of this run.'); } },
  { id:'rune-protection',  name:'Rune of Protection',  icon:'🔵', type:'rune', desc:'Grants +5 defense for the rest of this run.',      apply: function(){ DS.defBonus += 5; addLog('🔵 Rune of Protection — +5 defense this run!'); say('Rune of Protection. Plus 5 defense for the rest of this run.'); } },
  { id:'rune-speed',       name:'Rune of Speed',       icon:'🟡', type:'rune', desc:'Flee always succeeds for the rest of this run.',    apply: function(){ DS._runeSpeed = true; addLog('🟡 Rune of Speed — flee always succeeds!'); say('Rune of Speed. Flee guaranteed for the rest of this run.'); } },
  { id:'rune-fortune',     name:'Rune of Fortune',     icon:'🟢', type:'rune', desc:'+25% gold from all enemies this run.',              apply: function(){ DS._runeFortune = true; addLog('🟢 Rune of Fortune — +25% gold this run!'); say('Rune of Fortune. 25 percent bonus gold this run.'); } },
  { id:'rune-vitality',    name:'Rune of Vitality',    icon:'🟣', type:'rune', desc:'Permanently gain +20 max HP this run.',             apply: function(){ DS.maxHp += 20; DS.hp = Math.min(DS.maxHp, DS.hp + 20); updatePlayerBar(); addLog('🟣 Rune of Vitality — +20 max HP!'); say('Rune of Vitality. Plus 20 max HP.'); } },
];

var SCROLL_DEFS = [
  { id:'scroll-reveal',  name:'Scroll of Reveal',  icon:'📜', type:'scroll', desc:'Reveals the next 3 room types before you enter.',  apply: function(){
    if (!DS._floorRoomSequence) { say('No room data available yet.'); return; }
    var upcoming = DS._floorRoomSequence.slice(DS._floorRoomIdx, DS._floorRoomIdx + 3);
    if (!upcoming.length) { say('No more rooms to reveal on this floor.'); return; }
    DS._scrollReveal = 3;
    var names = upcoming.map(function(r){
      var sr = SPECIAL_ROOMS.find(function(s){ return s.type === r; });
      return sr ? sr.name : 'Combat Room';
    });
    var msg = '📜 Scroll of Reveal — Upcoming rooms: ' + names.join(', ') + '.';
    addLog(msg);
    say('Scroll of Reveal. Next ' + upcoming.length + ' rooms: ' + names.join(', ') + '.');
  }},
  { id:'scroll-smite',   name:'Scroll of Smite',   icon:'⚡', type:'scroll', desc:'Deals 80 unblockable damage to current enemy.',    apply: function(){ if(!DS.enemy){say('No enemy to smite.');return;} DS.enemy.hp=Math.max(0,DS.enemy.hp-80); updateEnemyBar(); addLog('⚡ Scroll of Smite — 80 unblockable damage!'); say('Scroll of Smite. 80 damage dealt.'); if(DS.enemy.hp<=0)setTimeout(function(){enemyDead();},300); } },
  { id:'scroll-mending', name:'Scroll of Mending', icon:'✨', type:'scroll', desc:'Heals 50% of max HP. Only works outside combat.',   apply: function(){ if(DS.inCombat){say('Cannot use outside of combat.');return;} var h=Math.round(DS.maxHp*0.5); DS.hp=Math.min(DS.maxHp,DS.hp+h); updatePlayerBar(); addLog('✨ Scroll of Mending — +'+h+' HP!'); say('Scroll of Mending. Healed '+h+' HP.'); } },
  { id:'scroll-knowledge',name:'Scroll of Knowledge',icon:'📚',type:'scroll', desc:'Reveals enemy stats and abilities before combat.',  apply: function(){
    // If in combat, reveal current enemy
    if (DS.enemy) {
      var e = DS.enemy;
      var spec = ENEMY_SPECIALS ? ENEMY_SPECIALS[e.name] : null;
      addLog('📚 ' + e.name + ': ' + e.hp + ' HP, ' + e.atk[0] + '-' + e.atk[1] + ' ATK' + (spec ? ' · ' + spec.name : '') + '.');
      say('Scroll of Knowledge. ' + e.name + ' has ' + e.hp + ' HP. Attack ' + e.atk[0] + ' to ' + e.atk[1] + (spec ? '. Special ability: ' + spec.name + '.' : '.'));
      return;
    }
    // Not in combat — reveal what enemy pool this floor uses
    var floorMsg = '📚 Floor ' + DS.floor + ' enemies range from ' + (DS.floor * 8) + ' to ' + (DS.floor * 20) + ' HP. Attack scales with floor depth.';
    addLog(floorMsg);
    say('Scroll of Knowledge. Floor ' + DS.floor + '. Enemies have roughly ' + (DS.floor * 8) + ' to ' + (DS.floor * 20) + ' HP.');
  }},
];

// ── END RUNES AND SCROLLS ──

// ── SET BONUS SYSTEM ──
var SET_BONUSES = [
  { id:'shadow', weapon:'shadow',  armor:'shadow',  name:'Shadow Set',   bonus:'15% dodge chance and +3 ATK',       apply: function(){ DS._shadowSet=true; DS.atkBonus+=3; } },
  { id:'fire',   weapon:'ember',   armor:'ember',   name:'Ember Set',    bonus:'+5 ATK and fire damage on every hit', apply: function(){ DS._emberSet=true; DS.atkBonus+=5; } },
  { id:'frost',  weapon:'frost',   armor:'frost',   name:'Frost Set',    bonus:'+4 DEF and freeze chance',            apply: function(){ DS._frostSet=true; DS.defBonus+=4; } },
  { id:'thorn',  weapon:'thorn',   armor:'bark',    name:'Forest Set',   bonus:'+3 ATK and +3 DEF from the curse',    apply: function(){ DS._thornSet=true; DS.atkBonus+=3; DS.defBonus+=3; } },
  { id:'void',   weapon:'void',    armor:'void',    name:'Void Set',     bonus:'+10 ATK and 10% life drain on hit',   apply: function(){ DS._voidSet=true; DS.atkBonus+=10; } },
];

function checkSetBonus() {
  var w = DS.equippedWeapon;
  var a = DS.equippedArmor;
  if (!w || !a) return;
  SET_BONUSES.forEach(function(set) {
    var wId = (w.id || '').toLowerCase();
    var aId = (a.id || '').toLowerCase();
    if (wId.includes(set.weapon) && aId.includes(set.armor)) {
      if (!DS['_set_' + set.id]) {
        DS['_set_' + set.id] = true;
        set.apply();
        addLog('✨ SET BONUS — ' + set.name + ' equipped! ' + set.bonus + '!');
        say('Set bonus unlocked! ' + set.name + '. ' + set.bonus + '.');
      }
    }
  });
}
// ── END SET BONUS ──

// ── END COMMAND CENTER ──

//═════════════════
// HOME SYSTEM
//═════════════════
var HOME_COST = 500;
var BED_COST = 75;
var HOME_SLEEP_ROOMS = 5;
var HOME_SKILL_COOLDOWN_MS = 3 * 60 * 1000;
var HOME_MAX_SKILL_LEVEL = 5;

function getHomeSave() { return _jsonParseSafe(DDStore.getItem('dd_home'), '{}'); }
function saveHome(o) { DDStore.setItem('dd_home', JSON.stringify(o)); }

function openHome() {
  var ov = document.getElementById('ov-home');
  if (!ov) return;
  showDungeonTip('first-home');
  // Show fireworks corner during July 4th
  var fwPanel = document.getElementById('home-fireworks-panel');
  if (fwPanel) fwPanel.style.display = getActiveEvent() === 'july4' ? '' : 'none';
  ov.style.display = 'flex';
  playTrack('home');
  renderHomeScreen();
  switchHomeTab('home');
  say('Home. Your dwelling on the edge of the dungeon. Rest, store gold, and upgrade your skills here.');
  setTimeout(function(){ var btn = ov.querySelector('button'); if(btn) btn.focus(); }, 100);
}

function closeHome() {
  var ov = document.getElementById('ov-home');
  if (ov) ov.style.display = 'none';
  if (DS && DS.dungeon) {
    playTrack(exploTrackForFloor(DS.floor));
  } else {
    playTrack(getMenuTrack());
  }
  say('Home closed. Back to the dungeon.');
}

function renderHomeScreen() {
  var h = getHomeSave();
  var owned = !!h.owned;
  document.getElementById('home-buy-section').style.display = owned ? 'none' : '';
  document.getElementById('home-owned-section').style.display = owned ? '' : 'none';
  if (!owned) return;
  var safeEl = document.getElementById('home-safe-amount');
  var onhandEl = document.getElementById('home-safe-onhand');
  if (safeEl) safeEl.textContent = (h.safe || 0) + 'g';
  if (onhandEl) onhandEl.textContent = getGlobalGold() + 'g';
  var hasBed = !!h.bed;
  var bedBuy = document.getElementById('home-bed-section');
  var bedSleep = document.getElementById('home-sleep-section');
  if (bedBuy) bedBuy.style.display = hasBed ? 'none' : '';
  if (bedSleep) bedSleep.style.display = hasBed ? '' : 'none';
  if (hasBed) {
    var roomsSinceSlept = (DS.totalRooms||0) - (h.lastSleepRoom || 0);
    var canSleep = roomsSinceSlept >= HOME_SLEEP_ROOMS;
    var sleepBtn = document.getElementById('home-sleep-btn');
    var sleepStatus = document.getElementById('home-sleep-status');
    if (sleepBtn) { sleepBtn.disabled = !canSleep; sleepBtn.style.opacity = canSleep ? '1' : '0.4'; }
    if (sleepStatus) sleepStatus.textContent = canSleep
      ? 'The bed is ready. Sleep to fully restore HP and SP.'
      : 'Explore ' + (HOME_SLEEP_ROOMS - roomsSinceSlept) + ' more rooms before resting again.';
  }
  renderHomeSkills();
}

function buyHome() {
  var gold = getGlobalGold();
  var msg = document.getElementById('home-buy-msg');
  if (gold < HOME_COST) { if(msg) msg.textContent = 'Not enough gold. Need ' + HOME_COST + 'g, have ' + gold + 'g.'; say('Not enough gold.'); return; }
  spendGlobalGold(HOME_COST);
  var h = getHomeSave(); h.owned = true; h.safe = 0; saveHome(h);
  var homeBtn = document.getElementById('home-btn');
  if (homeBtn) homeBtn.style.display = '';
  sfx('sfx-unlock'); renderHomeScreen();
  say('Home purchased! Your dwelling is now available from the dungeon action buttons.');
  // Show fireworks corner if July 4th
  try { updateFireworksCornderBtn(); } catch(e2) {}
}

function buyBed() {
  var gold = getGlobalGold();
  var msg = document.getElementById('home-bed-buy-msg');
  if (gold < BED_COST) { if(msg) msg.textContent = 'Need ' + BED_COST + 'g.'; say('Not enough gold.'); return; }
  spendGlobalGold(BED_COST);
  var h = getHomeSave(); h.bed = true; saveHome(h);
  sfx('sfx-confirm'); renderHomeScreen();
  say('Bed purchased! Sleep at home to restore HP and SP fully.');
}

var HOME_DREAMS = [
  // Buff dreams
  { id:'warriors-dream',  type:'buff',  icon:'⚔️',  title:'A Warrior\'s Dream',       story:'You stand on a battlefield that stretches to every horizon. You have already won.',      buff:'ATK +3 for your next run.',         apply: function(){ DS.dreamAtkBonus = (DS.dreamAtkBonus||0) + 3; } },
  { id:'golden-dream',    type:'buff',  icon:'💰',  title:'The Golden Dream',          story:'Coins fall like rain. You catch them all. Your hands never fill.',                      buff:'Gold drops +30% for your next run.', apply: function(){ DS.dreamGoldMult = (DS.dreamGoldMult||1) * 1.30; } },
  { id:'iron-dream',      type:'buff',  icon:'🛡️',  title:'Iron Sleep',                story:'Your armor fuses to your skin in the dream. It does not hurt. It feels right.',        buff:'DEF +3 for your next run.',         apply: function(){ DS.dreamDefBonus = (DS.dreamDefBonus||0) + 3; } },
  { id:'healers-dream',   type:'buff',  icon:'❤️',  title:'The Healer\'s Grace',       story:'A figure you cannot name presses their hand to your chest. The wound closes.',         buff:'Potions heal 25% more next run.',   apply: function(){ DS.dreamPotionBoost = (DS.dreamPotionBoost||0) + 0.25; } },
  { id:'spirit-dream',    type:'buff',  icon:'✨',  title:'The Spirit Dream',          story:'Your spirit companion speaks to you in words you almost understand.',                    buff:'+15 max SP for your next run.',     apply: function(){ DS.dreamSpBonus = (DS.dreamSpBonus||0) + 15; } },
  { id:'fleet-dream',     type:'buff',  icon:'🏃',  title:'Swift as Shadow',           story:'You run through the dark and nothing catches you. Not tonight.',                        buff:'+10% flee chance next run.',        apply: function(){ DS.dreamFleeBonus = (DS.dreamFleeBonus||0) + 0.10; } },
  // Lore dreams
  { id:'void-lore',       type:'lore',  icon:'🌑',  title:'The Void Speaks',           story:'A voice from the dark: The dungeons are not places. They are tests. You were chosen.', buff:'No buff. The dungeon remembers.',   apply: function(){} },
  { id:'leviathan-lore',  type:'lore',  icon:'🌊',  title:'The Deep Memory',           story:'You see the Leviathan before it was a monster. It was something else entirely once.',  buff:'No buff. Knowledge has a cost.',    apply: function(){} },
  { id:'malachar-lore',   type:'lore',  icon:'💀',  title:'Malachar\'s Confession',    story:'The dead king speaks: I built the crypt to hide something. I am what I was hiding.',   buff:'No buff. The truth is its own reward.',apply: function(){} },
  { id:'crypt-lore',      type:'lore',  icon:'🕯️',  title:'Candlelight and Nothing',   story:'You see every adventurer who died in the dungeon before you. They are waiting.',       buff:'No buff. You are not alone.',       apply: function(){} },
  // Dark dreams
  { id:'nightmare-dream', type:'dark',  icon:'👁️',  title:'The Watching Dream',        story:'Something watched you sleep. It did not move. It was still watching when you woke.',   buff:'No buff. It knows your name now.',  apply: function(){} },
  { id:'falling-dream',   type:'dark',  icon:'🕳️',  title:'The Fall',                  story:'You fell for a long time. You never landed. You woke up on the floor.',                buff:'No buff. You feel rested somehow.', apply: function(){} },
];

function homeSleep() {
  var h = getHomeSave();
  var roomsSinceSlept = (DS.totalRooms||0) - (h.lastSleepRoom || 0);
  if (roomsSinceSlept < HOME_SLEEP_ROOMS) { say('Not enough rooms explored to sleep yet.'); return; }
  DS.hp = DS.maxHp; DS.sp = DS.maxSp;
  h.lastSleepRoom = DS.totalRooms || 0; saveHome(h);
  updatePlayerBar(); updateXPBar();
  sfx('sfx-confirm');

  // Pick a random dream
  var dream = HOME_DREAMS[Math.floor(Math.random() * HOME_DREAMS.length)];

  // The dream says "for your next run", but its effect was applied to the run
  // you were in. It is now saved and applied once when the next run starts.
  if (_charIdx !== null && CHARS[_charIdx]) { CHARS[_charIdx].dream = dream.id; CHARS[_charIdx].pendingDream = dream.id; saveChars(); }

  // Show dream modal
  var existingModal = document.getElementById('dream-modal');
  if (existingModal) existingModal.remove();
  var modal = document.createElement('div');
  modal.id = 'dream-modal';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-label','Dream');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,12,0.97);z-index:9000;display:flex;align-items:center;justify-content:center;padding:24px;';
  var typeColor = dream.type === 'buff' ? '#ffdd44' : dream.type === 'lore' ? '#aa88ff' : '#cc4444';
  var typeLabel = dream.type === 'buff' ? '✦ DREAM — BUFF' : dream.type === 'lore' ? '✦ DREAM — LORE' : '✦ DREAM — DARK';
  modal.innerHTML =
    '<div style="max-width:380px;width:100%;text-align:center;">' +
    '<div style="font-family:Cinzel,serif;font-size:0.55rem;letter-spacing:0.4em;color:' + typeColor + ';opacity:0.7;margin-bottom:16px;">' + typeLabel + '</div>' +
    '<div style="font-size:2.5rem;margin-bottom:12px;" aria-hidden="true">' + dream.icon + '</div>' +
    '<h2 style="font-family:\'Cinzel Decorative\',cursive;font-size:1rem;color:' + typeColor + ';margin-bottom:16px;">' + dream.title + '</h2>' +
    '<p style="font-family:Cinzel,serif;font-size:0.75rem;color:#c0b090;line-height:1.8;margin-bottom:20px;font-style:italic;">' + dream.story + '</p>' +
    '<div style="font-family:Cinzel,serif;font-size:0.68rem;color:' + typeColor + ';border:1px solid ' + typeColor + ';padding:10px 16px;margin-bottom:20px;opacity:0.85;">' + dream.buff + '</div>' +
    '<button onclick="document.getElementById(\'dream-modal\').remove();renderHomeScreen();" style="font-family:Cinzel,serif;font-size:0.7rem;letter-spacing:0.2em;padding:12px 28px;border:1px solid #444;background:transparent;color:#888;cursor:pointer;text-transform:uppercase;" aria-label="Wake up and close the dream">Wake Up</button>' +
    '</div>';
  document.body.appendChild(modal);
  setTimeout(function(){ var btn = modal.querySelector('button'); if(btn) btn.focus(); }, 80);
  say('You sleep deeply. HP and SP fully restored. ' + dream.title + '. ' + dream.story + ' ' + dream.buff);
}


function homeDeposit() {
  var input = document.getElementById('home-safe-input');
  var msg = document.getElementById('home-safe-msg');
  var amount = parseInt(input ? input.value : '0') || 0;
  if (amount <= 0) { if(msg) msg.textContent = 'Enter a valid amount.'; return; }
  var gold = getGlobalGold();
  if (amount > gold) { if(msg) msg.textContent = 'Only have ' + gold + 'g.'; return; }
  spendGlobalGold(amount);
  var h = getHomeSave(); h.safe = (h.safe || 0) + amount; saveHome(h);
  if (input) input.value = '';
  if (msg) msg.textContent = 'Deposited ' + amount + 'g. Safe: ' + h.safe + 'g.';
  say('Deposited ' + amount + ' gold. Safe holds ' + h.safe + ' gold.');
  renderHomeScreen();
}

function homeWithdraw() {
  var input = document.getElementById('home-safe-input');
  var msg = document.getElementById('home-safe-msg');
  var amount = parseInt(input ? input.value : '0') || 0;
  var h = getHomeSave();
  if (amount <= 0) { if(msg) msg.textContent = 'Enter a valid amount.'; return; }
  if (amount > (h.safe || 0)) { if(msg) msg.textContent = 'Safe only has ' + (h.safe||0) + 'g.'; return; }
  h.safe -= amount; saveHome(h);
  addGlobalGold(amount);
  if (input) input.value = '';
  if (msg) msg.textContent = 'Withdrew ' + amount + 'g. Safe remaining: ' + h.safe + 'g.';
  say('Withdrew ' + amount + ' gold from the safe.');
  renderHomeScreen();
}



// ── WEAPON FORGE SYSTEM ─────────────────────────────────────────────────────

var FORGE_MATERIALS = [
  { id:'iron-scrap',    name:'Iron Scrap',     icon:'🔩', desc:'Common metal. Found everywhere.',       rarity:'common'  },
  { id:'bone-shard',   name:'Bone Shard',      icon:'🦴', desc:'Brittle but sharp. From undead foes.',  rarity:'common'  },
  { id:'wolf-fang', enemyType:'beast',    name:'Wolf Fang',        icon:'🐺', desc:'Sharp and durable.',                    rarity:'common'  },
  { id:'goblin-gem',   name:'Goblin Gem',       icon:'💎', desc:'Stolen goods. Valuable.',               rarity:'uncommon'},
  { id:'frost-crystal',name:'Frost Crystal',   icon:'❄️', desc:'Icy shard from frozen foes.',           rarity:'uncommon'},
  { id:'fire-ember',   name:'Fire Ember',       icon:'🔥', desc:'Still burning somehow.',                rarity:'uncommon'},
  { id:'shadow-dust',  name:'Shadow Dust',      icon:'🌑', desc:'Left behind by shadow creatures.',      rarity:'rare'    },
  { id:'void-fragment',name:'Void Fragment',    icon:'🌀', desc:'Unstable essence of the void.',         rarity:'rare'    },
  { id:'dragon-scale', name:'Dragon Scale',     icon:'🐉', desc:'Nearly indestructible.',                rarity:'rare'    },
];

var FORGE_SPECIAL_EFFECTS = [
  { id:'burn',       name:'Burning',      desc:'15% chance to burn enemy for 5 dmg/turn for 3 turns.' },
  { id:'lifesteal',  name:'Life Steal',   desc:'Heal 10% of damage dealt.' },
  { id:'crit-boost', name:'Keen Edge',    desc:'+10% critical hit chance.' },
  { id:'poison',     name:'Venomous',     desc:'20% chance to poison enemy for 4 dmg/turn.' },
  { id:'gold-find',  name:'Lucky',        desc:'Enemies drop +5 gold on kill.' },
  { id:'sp-regen',   name:'Arcane',       desc:'Restore 2 SP each time you attack.' },
  { id:'armor-break',name:'Shattering',   desc:'Reduce enemy defense by 2 per hit.' },
  { id:'double-hit', name:'Swift',        desc:'10% chance to attack twice.' },
  { id:'thorns',     name:'Thorned',      desc:'Reflect 15% of damage taken back to enemy.' },
  { id:'execute',    name:'Executioner',  desc:'+50% damage to enemies below 25% HP.' },
];

var FORGE_RECIPES = [
  { id:'iron-blade',   name:'Iron Blade',   icon:'⚔️', atk:[8,14],  materials:{ 'iron-scrap':3 },                         desc:'A reliable blade forged from scrap metal.' },
  { id:'bone-dagger',  name:'Bone Dagger',  icon:'🦴', atk:[6,16],  materials:{ 'bone-shard':3 },                         desc:'Light and vicious. Fast strikes.' },
  { id:'fang-sword',   name:'Fang Sword',   icon:'🐺', atk:[10,18], materials:{ 'wolf-fang':2, 'iron-scrap':2 },          desc:'Serrated like a beasts jaw.' },
  { id:'frost-blade',  name:'Frost Blade',  icon:'❄️', atk:[12,20], materials:{ 'frost-crystal':2, 'iron-scrap':2 },      desc:'Chills to the bone.' },
  { id:'ember-sword',  name:'Ember Sword',  icon:'🔥', atk:[14,22], materials:{ 'fire-ember':2, 'iron-scrap':2 },         desc:'Burns with an inner fire.' },
  { id:'shadow-blade', name:'Shadow Blade', icon:'🌑', atk:[16,26], materials:{ 'shadow-dust':2, 'bone-shard':2 },        desc:'Strikes from the darkness.' },
  { id:'void-cleaver', name:'Void Cleaver', icon:'🌀', atk:[18,30], materials:{ 'void-fragment':2, 'goblin-gem':1 },      desc:'Tears through reality itself.' },
  { id:'dragon-blade', name:'Dragon Blade', icon:'🐉', atk:[22,36], materials:{ 'dragon-scale':2, 'fire-ember':1 },       desc:'The pinnacle of forged weapons.' },
];

function getForgeStash() { return _jsonParseSafe(DDStore.getItem('dd_forge_stash'), '{}'); }
function saveForgeStash(s) { DDStore.setItem('dd_forge_stash', JSON.stringify(s)); }
var _forgeCurrentWeapon = null;
var _forgeCurrentRecipe = null;
var _forgeEffectsOn = true;

// Drop material on kill — call from enemy death
function tryDropMaterial(floor) {
  if (Math.random() > 0.15) return; // 15% drop chance
  var pool = floor >= 8 ? FORGE_MATERIALS :
             floor >= 5 ? FORGE_MATERIALS.filter(function(m){ return m.rarity !== 'rare'; }) :
             FORGE_MATERIALS.filter(function(m){ return m.rarity === 'common'; });
  var mat = pool[Math.floor(Math.random() * pool.length)];
  var stash = getForgeStash();
  stash[mat.id] = (stash[mat.id] || 0) + 1;
  saveForgeStash(stash);
  addLog('📦 Material dropped: ' + mat.icon + ' ' + mat.name + '!');
}

function renderForgeTab() {
  var stash = getForgeStash();
  // Materials display
  var matEl = document.getElementById('forge-materials-display');
  if (matEl) {
    var matList = FORGE_MATERIALS.filter(function(m){ return (stash[m.id]||0) > 0; });
    matEl.innerHTML = matList.length === 0
      ? '<span style="color:#444;">None yet. Kill enemies to find materials.</span>'
      : matList.map(function(m){ return '<span style="margin-right:12px;">' + m.icon + ' ' + m.name + ' x' + stash[m.id] + '</span>'; }).join('');
  }
  // Recipes
  var recEl = document.getElementById('forge-recipes');
  if (!recEl) return;
  recEl.innerHTML = '';
  FORGE_RECIPES.forEach(function(recipe) {
    var canCraft = Object.keys(recipe.materials).every(function(mid){ return (stash[mid]||0) >= recipe.materials[mid]; });
    var reqText = Object.keys(recipe.materials).map(function(mid){
      var m = FORGE_MATERIALS.find(function(x){ return x.id === mid; });
      return (m ? m.icon + ' ' : '') + (m ? m.name : mid) + ' x' + recipe.materials[mid];
    }).join(', ');
    var div = document.createElement('div');
    div.style.cssText = 'padding:10px 12px;background:' + (canCraft?'#0a1a0a':'#080808') + ';border:1px solid ' + (canCraft?'#44aa44':'#222') + ';border-radius:2px;';
    div.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;">' +
        '<div>' +
          '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:' + (canCraft?'#44ff88':'#888') + ';">' + recipe.icon + ' ' + recipe.name + ' — ATK ' + recipe.atk.join('-') + '</div>' +
          '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#555;margin-top:2px;">' + reqText + '</div>' +
        '</div>' +
        '<button onclick="forgeCraft(\'' + recipe.id + '\')" ' + (canCraft?'':'disabled') + ' style="padding:6px 12px;background:' + (canCraft?'#0a1a0a':'#0a0a0a') + ';border:1px solid ' + (canCraft?'#44aa44':'#333') + ';color:' + (canCraft?'#44ff88':'#444') + ';font-family:Cinzel,serif;font-size:0.62rem;cursor:' + (canCraft?'pointer':'default') + ';" aria-label="Craft ' + recipe.name + '">' + (canCraft?'Craft':'Missing') + '</button>' +
      '</div>';
    recEl.appendChild(div);
  });
}

function forgeCraft(recipeId) {
  var recipe = FORGE_RECIPES.find(function(r){ return r.id === recipeId; });
  if (!recipe) return;
  var stash = getForgeStash();
  // Deduct materials
  Object.keys(recipe.materials).forEach(function(mid){
    stash[mid] = (stash[mid] || 0) - recipe.materials[mid];
    if (stash[mid] <= 0) delete stash[mid];
  });
  saveForgeStash(stash);
  // Build weapon
  var effect = _forgeEffectsOn ? FORGE_SPECIAL_EFFECTS[Math.floor(Math.random() * FORGE_SPECIAL_EFFECTS.length)] : null;
  _forgeCurrentWeapon = {
    id: recipe.id + '_' + Date.now(),
    name: recipe.name, icon: recipe.icon,
    type: 'weapon', atkBonus: recipe.atk[0],
    atkRange: recipe.atk, atkBase: recipe.atk.slice(), level: 1, isEquippable: true,
    desc: recipe.desc + (effect ? ' [' + effect.name + ': ' + effect.desc + ']' : ''),
    forgeEffect: effect ? effect.id : null,
    forgeEffectName: effect ? effect.name : null,
  };
  _forgeCurrentRecipe = recipe;
  // Show result
  var resultEl = document.getElementById('forge-result');
  var textEl = document.getElementById('forge-result-text');
  if (resultEl) resultEl.style.display = '';
  if (textEl) textEl.innerHTML =
    '<strong style="color:#ffdd44;">' + recipe.icon + ' ' + recipe.name + '</strong><br>' +
    'ATK: ' + recipe.atk.join(' – ') + '<br>' +
    (effect ? '✨ Effect: <strong style="color:#aa88ff;">' + effect.name + '</strong> — ' + effect.desc : '⚙️ No special effect.');
  renderForgeTab();
  say('Crafted ' + recipe.name + '! ATK ' + recipe.atk.join(' to ') + '. ' + (effect ? 'Special effect: ' + effect.name + '. ' + effect.desc : 'No special effect.'));
}

function forgeReroll() {
  if (!_forgeCurrentWeapon || !_forgeEffectsOn) return;
  var stash = getForgeStash();
  if ((stash['iron-scrap'] || 0) < 2) {
    var msg = document.getElementById('forge-msg');
    if (msg) { msg.textContent = 'Need 2 Iron Scraps to reroll.'; setTimeout(function(){ msg.textContent=''; }, 2500); }
    say('Not enough Iron Scraps to reroll. Need 2.');
    return;
  }
  stash['iron-scrap'] -= 2;
  if (stash['iron-scrap'] <= 0) delete stash['iron-scrap'];
  saveForgeStash(stash);
  var effect = FORGE_SPECIAL_EFFECTS[Math.floor(Math.random() * FORGE_SPECIAL_EFFECTS.length)];
  _forgeCurrentWeapon.forgeEffect = effect.id;
  _forgeCurrentWeapon.forgeEffectName = effect.name;
  _forgeCurrentWeapon.desc = (_forgeCurrentRecipe ? _forgeCurrentRecipe.desc : _forgeCurrentWeapon.desc.split(' [')[0]) + ' [' + effect.name + ': ' + effect.desc + ']';
  var textEl = document.getElementById('forge-result-text');
  if (textEl) textEl.innerHTML =
    '<strong style="color:#ffdd44;">' + _forgeCurrentWeapon.icon + ' ' + _forgeCurrentWeapon.name + '</strong><br>' +
    'ATK: ' + (_forgeCurrentWeapon.atkRange || [_forgeCurrentWeapon.atkBonus, _forgeCurrentWeapon.atkBonus+6]).join(' – ') + '<br>' +
    '✨ Effect: <strong style="color:#aa88ff;">' + effect.name + '</strong> — ' + effect.desc;
  renderForgeTab();
  say('Rerolled! New effect: ' + effect.name + '. ' + effect.desc);
}

function forgeKeep() {
  if (!_forgeCurrentWeapon) return;
  var gInv = getGlobalInventory();
  // A run keeps one weapon per name, so a second forged weapon of the same name vanished
  var _names = gInv.filter(function(i){ return i.type === 'weapon'; }).map(function(i){ return i.name; });
  if (_names.indexOf(_forgeCurrentWeapon.name) !== -1) {
    var _base = _forgeCurrentWeapon.name + ' (' + (_forgeCurrentWeapon.forgeEffectName || 'Forged') + ')';
    var _nm = _base, _n = 2;
    while (_names.indexOf(_nm) !== -1) { _nm = _base + ' ' + _n; _n++; }
    _forgeCurrentWeapon.name = _nm;
  }
  gInv.push(_forgeCurrentWeapon);
  saveGlobalInventory(gInv);
  // Track forge count for achievement
  var fc = parseInt(DDStore.getItem('dd_forge_count')||'0') + 1;
  DDStore.setItem('dd_forge_count', fc);
  checkAchievements();
  var resultEl = document.getElementById('forge-result');
  if (resultEl) resultEl.style.display = 'none';
  var msg = document.getElementById('forge-msg');
  if (msg) { msg.textContent = _forgeCurrentWeapon.name + ' added to your inventory!'; setTimeout(function(){ msg.textContent=''; }, 3000); }
  say(_forgeCurrentWeapon.name + ' added to your global inventory. Equip it from the Blacksmith.');
  _forgeCurrentWeapon = null;
  _forgeCurrentRecipe = null;
  renderForgeTab();
}

// ══════════════════════════════════════════
// ⛏ THE MINE SYSTEM
// ══════════════════════════════════════════
var _mineState = {
  active: false,
  charIdx: null,
  depth: 1,
  hand: [],
  chest: [],
  hasChest: false,
  hp: 100,
  maxHp: 100,
  inCombat: false,
  enemy: null,
  digsOnFloor: 0,
  _defending: false,
  _heavyPenalty: false,
  _wasMilestoneBoss: false,
  _buffed: false,
  _shielded: false
};

var MINE_MAX_CARRY = 15;

var MINE_LOOT_TABLES = [
  // depth 1-2: common
  { depth: [1,2], items: [
    { name:'Gold Nugget', icon:'🪨', type:'mine-gold', value:15, weight:30 },
    { name:'Gun Barrel', icon:'🔩', type:'gun-part', partId:'barrel', weight:20 },
    { name:'Gun Stock', icon:'🪵', type:'gun-part', partId:'stock', weight:20 },
    { name:'Mystery Coin', icon:'🪙', type:'mine-coin', value:1, weight:25 },
    { name:'Iron Chunk', icon:'🪨', type:'mine-gold', value:8, weight:30 },
    { name:'Trigger Assembly', icon:'🔧', type:'gun-part', partId:'trigger', weight:15 },
    { name:'Health Potion', icon:'🧪', type:'mine-potion', heal:40, weight:15 },
  ]},
  // depth 3-4: uncommon
  { depth: [3,4], items: [
    { name:'Gold Vein', icon:'✨', type:'mine-gold', value:35, weight:25 },
    { name:'Firing Mechanism', icon:'⚙️', type:'gun-part', partId:'mechanism', weight:20 },
    { name:'Mystery Coins ×2', icon:'🪙', type:'mine-coin', value:2, weight:20 },
    { name:'Diamond Shard', icon:'💎', type:'mine-diamond', value:1, weight:15 },
    { name:'Gun Barrel', icon:'🔩', type:'gun-part', partId:'barrel', weight:20 },
    { name:'Potion Ingredient', icon:'🌿', type:'mine-ingredient', weight:15 },
    { name:'Health Potion', icon:'🧪', type:'mine-potion', heal:40, weight:18 },
    { name:'Strong Potion', icon:'🧪', type:'mine-potion', heal:70, weight:8 },
  ]},
  // depth 5+: rare
  { depth: [5,99], items: [
    { name:'Diamond', icon:'💎', type:'mine-diamond', value:2, weight:20 },
    { name:'Large Gold Vein', icon:'🏆', type:'mine-gold', value:80, weight:20 },
    { name:'Diamonds ×3', icon:'💎', type:'mine-diamond', value:3, weight:10 },
    { name:'Mystery Coins ×5', icon:'🪙', type:'mine-coin', value:5, weight:15 },
    { name:'Rare Gun Part', icon:'⚙️', type:'gun-part', partId:'mechanism', weight:15 },
    { name:'Firing Mechanism', icon:'⚙️', type:'gun-part', partId:'mechanism', weight:15 },
    { name:'Alchemy Herb', icon:'🌿', type:'mine-ingredient', weight:10 },
    { name:'Treasure Cache', icon:'📦', type:'mine-gold', value:120, weight:5 },
    { name:'Health Potion', icon:'🧪', type:'mine-potion', heal:40, weight:12 },
    { name:'Strong Potion', icon:'🧪', type:'mine-potion', heal:70, weight:10 },
    { name:'Mega Potion', icon:'🧪', type:'mine-potion', heal:120, weight:4 },
  ]}
];

var MINE_ENEMIES = [
  // depth 1-2
  { name:'Cave Rat',       icon:'🐀', hp:18,  atk:[2,5],  gold:8,   depth:[1,2] },
  { name:'Rock Beetle',    icon:'🪲', hp:22,  atk:[3,6],  gold:10,  depth:[1,2] },
  { name:'Mine Bat',       icon:'🦇', hp:15,  atk:[4,7],  gold:7,   depth:[1,3] },
  { name:'Dust Shade',     icon:'🌫️', hp:14,  atk:[3,6],  gold:6,   depth:[1,3], dodgeEvery:3 },
  { name:'Tunnel Snake',   icon:'🐍', hp:20,  atk:[3,7],  gold:9,   depth:[1,3], poisonChance:0.20 },
  { name:'Pickaxe Ghost',  icon:'⛏️', hp:16,  atk:[3,6],  gold:7,   depth:[1,3] },
  // depth 2-4
  { name:'Cave Troll',     icon:'👹', hp:45,  atk:[6,12], gold:20,  depth:[2,4] },
  { name:'Stone Golem',    icon:'🗿', hp:60,  atk:[8,14], gold:25,  depth:[3,5], immuneFirstHit:true },
  { name:'Mine Wraith',    icon:'👻', hp:35,  atk:[10,16],gold:18,  depth:[3,5] },
  { name:'Iron Sprite',    icon:'✨', hp:28,  atk:[5,10], gold:12,  depth:[2,4], drainsSP:true },
  { name:'The Collapsed',  icon:'🪨', hp:40,  atk:[7,12], gold:15,  depth:[2,4] },
  { name:'Crystal Wolf',   icon:'🐺', hp:38,  atk:[8,13], gold:16,  depth:[3,5], grows:true },
  { name:'Shaft Lurker',   icon:'🌑', hp:32,  atk:[7,13], gold:14,  depth:[3,5], dodgeEvery:3 },
  { name:'Vein Horror',    icon:'🩸', hp:42,  atk:[8,14], gold:18,  depth:[4,6], lifesteal:true },
  // depth 5+
  { name:'Deep Crawler',   icon:'🕷️', hp:80,  atk:[12,20],gold:35,  depth:[5,99] },
  { name:'Ore Demon',      icon:'😈', hp:100, atk:[15,25],gold:50,  depth:[5,99], burn:3, burnTurns:2 },
  { name:'Diamond Golem',  icon:'💎', hp:90,  atk:[13,22],gold:45,  depth:[5,99], immuneFirstHit:true, physResist:0.20 },
  { name:'Mine Boss',      icon:'💀', hp:150, atk:[18,30],gold:100, depth:[5,99], isBoss:true },
  { name:'Forgotten Foreman',icon:'👷',hp:120, atk:[16,26],gold:80,  depth:[4,99], isElite:true, grows:true },
  // Milestone bosses — spawned at specific depths, not randomly
  { name:'The Foreman\'s Ghost',  icon:'👻', hp:180,  atk:[14,22], gold:150, depth:[10,10], isBoss:true, isMilestone:true, milestoneDepth:10,  lore:'He ran this mine for forty years. He never left.' },
  { name:'The Cave King',         icon:'👑', hp:280,  atk:[20,32], gold:250, depth:[20,20], isBoss:true, isMilestone:true, milestoneDepth:20,  lore:'Something claimed the deepest tunnels as its kingdom long before you arrived.' },
  { name:'The Deep Hunger',       icon:'🕳️', hp:420,  atk:[28,44], gold:400, depth:[30,30], isBoss:true, isMilestone:true, milestoneDepth:30,  lore:'It has been waiting in the dark since before the mine existed. It is very hungry.' },
  { name:'The Vein Titan',        icon:'⛰️', hp:600,  atk:[36,55], gold:600, depth:[50,50], isBoss:true, isMilestone:true, milestoneDepth:50,  lore:'The mountain itself has decided you have gone far enough.' },
  { name:'The Mine\'s Heart',     icon:'❤️', hp:900,  atk:[48,72], gold:1000,depth:[100,100],isBoss:true,isMilestone:true, milestoneDepth:100, lore:'You found it. The thing at the center of everything. It does not want to be found.' },
];

var MINE_ATMOSPHERES = [
  'The tunnels stretch before you. Pickaxe rings echo off stone.',
  'A cold draft carries the smell of earth and iron.',
  'Faint glimmers in the rock face catch your eye.',
  'Water drips somewhere deep below.',
  'The walls narrow. Something skitters in the dark.',
  'Veins of ore shimmer faintly in your torchlight.',
  'The deeper tunnels breathe with an ancient stillness.',
  'Your boots crunch on broken stone. Wealth awaits the patient.',
];

function mineGetLootTable() {
  var d = _mineState.depth;
  var tables = MINE_LOOT_TABLES.filter(function(t) { return d >= t.depth[0] && d <= t.depth[1]; });
  if (!tables.length) tables = [MINE_LOOT_TABLES[MINE_LOOT_TABLES.length-1]];
  // Pick last matching table (deepest applicable)
  return tables[tables.length-1].items;
}

function mineWeightedPick(items) {
  var total = items.reduce(function(s,i){ return s + i.weight; }, 0);
  var r = Math.random() * total;
  var cum = 0;
  for (var i = 0; i < items.length; i++) {
    cum += items[i].weight;
    if (r <= cum) return items[i];
  }
  return items[items.length-1];
}

function mineUpdateStatusBar() {
  var gEl = document.getElementById('mine-gold-display');
  var dEl = document.getElementById('mine-diamond-display');
  var cEl = document.getElementById('mine-coin-display');
  var depEl = document.getElementById('mine-depth-display');
  if (gEl) gEl.textContent = getGlobalGold().toLocaleString();
  if (dEl) dEl.textContent = getDiamonds();
  if (cEl) {
    try {
      var raidCoins = (typeof getRaidSave === 'function') ? (getRaidSave().mysteryCoins || 0) : 0;
      cEl.textContent = raidCoins;
    } catch(e) { cEl.textContent = '0'; }
  }
  if (depEl) depEl.textContent = _mineState.depth;
}

function mineUpdateCarryBar() {
  var count = _mineState.hand.length;
  var pct = (count / MINE_MAX_CARRY) * 100;
  var bar = document.getElementById('mine-carry-bar');
  var countEl = document.getElementById('mine-carry-count');
  if (bar) { bar.style.width = pct + '%'; bar.style.background = pct >= 100 ? '#cc2222' : pct >= 70 ? '#cc8800' : 'linear-gradient(90deg,#8b6914,#c8a832)'; }
  if (countEl) countEl.textContent = count;
}

function mineRenderHand() {
  var el = document.getElementById('mine-hand-items');
  if (!el) return;
  if (_mineState.hand.length === 0) { el.textContent = 'Nothing yet. Start mining!'; return; }
  // Group items
  var groups = {};
  _mineState.hand.forEach(function(item) {
    var key = item.name;
    if (!groups[key]) groups[key] = { item: item, count: 0 };
    groups[key].count++;
  });
  el.innerHTML = Object.keys(groups).map(function(k) {
    var g = groups[k];
    return '<span style="margin-right:12px;">' + g.item.icon + ' ' + g.item.name + (g.count > 1 ? ' ×' + g.count : '') + '</span>';
  }).join('');
}

function mineAddLog(text, color) {
  var log = document.getElementById('mine-log');
  if (!log) return;
  var line = document.createElement('div');
  line.style.color = color || '#888';
  line.textContent = (typeof t === 'function') ? t(text) : text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
  // Keep page scroll position — don't let DOM changes jump to top
  try {
    var inner = document.getElementById('mine-inner');
    if (inner) { var y = inner.getBoundingClientRect().top + window.scrollY; window.scrollTo({ top: Math.max(0, y - 20), behavior: 'instant' }); }
  } catch(e) {}
}

function mineCombatLog(text, color) {
  var log = document.getElementById('mine-combat-log');
  if (!log) return;
  var line = document.createElement('div');
  line.style.color = color || '#aaa';
  line.textContent = (typeof t === 'function') ? t(text) : text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function mineUpdateEnemyBar() {
  var e = _mineState.enemy;
  if (!e) return;
  var pct = Math.max(0, (e.hp / e.maxHp) * 100);
  var bar = document.getElementById('mine-enemy-bar');
  var txt = document.getElementById('mine-enemy-hp-text');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = e.name + ' HP: ' + e.hp + '/' + e.maxHp;
}

function mineUpdatePlayerBar() {
  var pct = Math.max(0, (_mineState.hp / _mineState.maxHp) * 100);
  var bar = document.getElementById('mine-player-bar');
  var txt = document.getElementById('mine-player-hp-text');
  if (bar) { bar.style.width = pct + '%'; bar.style.background = pct < 25 ? '#cc2222' : pct < 50 ? '#cc8800' : '#44cc44'; }
  if (txt) txt.textContent = 'Your HP: ' + _mineState.hp + '/' + _mineState.maxHp;
}

// Mine enemy moves (v11.7.3).
function mineEnemyMoveText(e) {
  if (e.dodgeEvery) return 'It phases out of reach every ' + (e.dodgeEvery === 3 ? 'third' : e.dodgeEvery + 'th') + ' hit.';
  if (e.poisonChance) return 'Its bite can poison you.';
  if (e.immuneFirstHit) return 'It shrugs off the first blow' + (e.physResist ? ' and resists your strikes.' : '.');
  if (e.drainsSP) return 'It drains your focus — your skills can be blocked for a turn.';
  if (e.grows) return 'It grows stronger every turn.';
  if (e.lifesteal) return 'It heals from the blood it draws.';
  if (e.burn) return 'Its strikes burn.';
  return '';
}
// Your damage on a Mine enemy: first-hit immunity, phasing and resistance.
function mineHitEnemy(dmg, physical) {
  var e = _mineState.enemy;
  e._hits = (e._hits || 0) + 1;
  if (e.immuneFirstHit && e._hits === 1) { mineCombatLog('🛡 ' + e.name + ' absorbs the first blow!', '#888'); return 0; }
  if (e.dodgeEvery && e._hits % e.dodgeEvery === 0) { mineCombatLog('🌫 ' + e.name + ' phases out — your attack passes through!', '#888'); return 0; }
  if (physical && e.physResist) dmg = Math.round(dmg * (1 - e.physResist));
  return dmg;
}

// After a Mine enemy's hit: poison, burn, lifesteal, drain and growth.
function mineEnemyMoves(dealt) {
  var e = _mineState.enemy;
  if (!e) return;
  if (_mineState._dot && _mineState._dot.turns > 0 && _mineState.hp > 0) {
    _mineState._dot.turns--;
    _mineState.hp = Math.max(1, _mineState.hp - _mineState._dot.dmg);
    mineCombatLog(_mineState._dot.icon + ' ' + _mineState._dot.dmg + ' damage. (' + _mineState._dot.turns + ' turns left)', '#cc6644');
  }
  if (dealt > 0 && e.poisonChance && Math.random() < e.poisonChance) { _mineState._dot = { dmg: 6, turns: 3, icon: '🐍' }; mineCombatLog('🐍 You are poisoned!', '#88cc44'); }
  if (dealt > 0 && e.burn) { _mineState._dot = { dmg: e.burn, turns: e.burnTurns || 2, icon: '🔥' }; mineCombatLog('🔥 You are burning!', '#ff6622'); }
  if (dealt > 0 && e.lifesteal) { var ls = Math.max(1, Math.round(dealt * 0.3)); e.hp = Math.min(e.maxHp, e.hp + ls); mineCombatLog('🩸 ' + e.name + ' drinks ' + ls + ' HP.', '#cc4444'); mineUpdateEnemyBar(); }
  if (e.drainsSP && Math.random() < 0.35) { _mineState._skillsBlocked = 1; mineCombatLog('✨ ' + e.name + ' drains your focus — no skills next turn.', '#aa88ff'); }
  if (e.grows) { e.atk = [Math.round(e.atk[0] * 1.05), Math.round(e.atk[1] * 1.05)]; }
  mineUpdatePlayerBar();
}

function mineSpawnEnemy() {
  var d = _mineState.depth;
  var pool = MINE_ENEMIES.filter(function(e) { return d >= e.depth[0] && d <= e.depth[1]; });
  if (!pool.length) return;
  var template = pool[Math.floor(Math.random() * pool.length)];
  _mineState.enemy = {
    name: template.name,
    icon: template.icon,
    hp: template.hp,
    maxHp: template.hp,
    atk: template.atk.slice(),
    gold: template.gold,
    isBoss: template.isBoss || false,
    // The special moves were written on the template but never copied onto the enemy
    dodgeEvery: template.dodgeEvery || 0, poisonChance: template.poisonChance || 0,
    immuneFirstHit: !!template.immuneFirstHit, drainsSP: !!template.drainsSP, grows: !!template.grows,
    lifesteal: !!template.lifesteal, burn: template.burn || 0, burnTurns: template.burnTurns || 0,
    physResist: template.physResist || 0, _hits: 0
  };
  _mineState.inCombat = true;
  try { playTrack('mine-combat'); } catch(e) {} // ambient keeps playing underneath
  // Show combat area, hide dig area
  document.getElementById('mine-combat-area').style.display = '';
  document.getElementById('mine-dig-area').style.display = 'none';
  document.getElementById('mine-combat-log').innerHTML = '';
  mineUpdateEnemyBar();
  mineUpdatePlayerBar();
  var nameEl = document.getElementById('mine-enemy-name');
  if (nameEl) nameEl.textContent = _mineState.enemy.icon + ' ' + _mineState.enemy.name;
  mineAddLog('⚠️ A ' + _mineState.enemy.name + ' blocks your path!', '#cc4444');
  var _mineMove = mineEnemyMoveText(_mineState.enemy);
  if (_mineMove) mineCombatLog('⚡ ' + _mineMove, '#cc88ff');
  say('Enemy encountered in the mine! ' + _mineState.enemy.name + '. HP: ' + _mineState.enemy.hp + '. ' + (_mineMove ? _mineMove + ' ' : '') + 'Attack or flee.');
}

function getMineSkills(ch) {
  if (!ch || !ch.cls) return [];
  // Skills are saved as persistSkills on the character after a run, fallback to unlockedSkills
  var skills = ch.persistSkills || ch.unlockedSkills || [];
  if (!skills.length) return [];
  var allSkills = CLASS_SKILLS[ch.cls] || [];
  return allSkills.filter(function(s) {
    return skills.indexOf(s.effect) !== -1;
  }).slice(0, 6);
}

function mineUseSkill(sk, ch) {
  if (!_mineState.inCombat || !_mineState.enemy) return;
  var e = _mineState.enemy;
  var atkRange = ATK_MAP[ch.cls] || [6,12];
  var lvl = ch.level || 1;
  var baseDmg = Math.floor(((atkRange[0] + atkRange[1]) / 2) * (1 + (lvl-1) * 0.05));
  var effect = sk.effect;
  var acted = true;

  // Handle each skill effect category
  if (effect === 'heal' || effect === 'second-wind' || effect === 'divine-shield' ||
      effect === 'iron-will' || effect === 'fortify' || effect === 'inner-focus') {
    // Healing/defensive skills
    var healAmt = Math.floor(_mineState.maxHp * 0.35);
    _mineState.hp = Math.min(_mineState.maxHp, _mineState.hp + healAmt);
    mineUpdatePlayerBar();
    mineCombatLog(sk.icon + ' ' + sk.name + '! Restored ' + healAmt + ' HP.', '#44cc88');
    say(sk.name + '. Restored ' + healAmt + ' HP.');

  } else if (effect === 'shield' || effect === 'bone-shield') {
    // Shield — reduce next hit by 80%
    _mineState._shielded = true;
    mineCombatLog(sk.icon + ' ' + sk.name + '! Next hit reduced by 80%.', '#4488ff');
    say(sk.name + '. Shielded for this turn.');

  } else if (effect === 'smoke-bomb' || effect === 'venom' || effect === 'curse') {
    // Debuff — weaken enemy attack
    e._weakened = true;
    mineCombatLog(sk.icon + ' ' + sk.name + '! Enemy weakened — attacks reduced.', '#aa88ff');
    say(sk.name + '. Enemy weakened.');

  } else if (effect === 'buff' || effect === 'battlecry' || effect === 'war-cry' ||
             effect === 'battle-hymn' || effect === 'focus' || effect === 'unlimited-power') {
    // Buff — boost next attack
    _mineState._buffed = true;
    mineCombatLog(sk.icon + ' ' + sk.name + '! Your next attack hits twice as hard!', '#ffdd44');
    say(sk.name + '. Next attack boosted.');
    acted = false; // buff doesn't trigger enemy turn

  } else {
    // Offensive skill — damage based on skill tier
    var multiplier = sk.tier === 'legendary' ? 3.0 : sk.tier === 'rare' ? 2.2 : 1.6;
    var skillDmg = Math.floor(baseDmg * multiplier);
    e.hp = Math.max(0, e.hp - skillDmg);
    mineUpdateEnemyBar();
    mineCombatLog(sk.icon + ' ' + sk.name + '! ' + skillDmg + ' damage!', '#ffaa44');
    say(sk.name + '. ' + skillDmg + ' damage to ' + e.name + '.');
  }

  // Check enemy death
  if (e.hp <= 0) {
    var gold = e.gold;
    addGlobalGold(gold);
    try {
      var eid = 'mine-' + e.name.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-');
      bestiaryKills[eid] = (bestiaryKills[eid] || 0) + 1;
      DDStore.setItem('dd_bestiary', JSON.stringify(bestiaryKills));
    } catch(ex) {}
    mineCombatLog('💀 ' + e.name + ' defeated! +' + gold + ' gold.', '#44cc44');
    say(e.name + ' defeated! ' + gold + ' gold earned.');
    _mineState.inCombat = false;
    _mineState.enemy = null;
    _mineState._defending = false;
    _mineState._heavyPenalty = false;
    _mineState._buffed = false;
    _mineState._shielded = false;
    mineUpdateStatusBar();
    try { playTrack('mine-explore'); } catch(ex) {}
    setTimeout(function() {
      document.getElementById('mine-combat-area').style.display = 'none';
      document.getElementById('mine-dig-area').style.display = '';
      if (_mineState._wasMilestoneBoss) {
        mineCollectItem({ name:'Mega Potion', icon:'🧪', type:'mine-potion', heal:120, weight:1 });
        mineCollectItem({ name:'Diamonds ×3', icon:'💎', type:'mine-diamond', value:3, weight:1 });
        mineAddLog('👑 Milestone boss defeated! Special loot dropped.', '#ffdd44');
        _mineState._wasMilestoneBoss = false;
      } else if (Math.random() < 0.5) {
        if (Math.random() < 0.25) {
          mineCollectItem({ name:'Health Potion', icon:'🧪', type:'mine-potion', heal:40, weight:1 });
        } else {
          mineCollectItem(mineWeightedPick(mineGetLootTable()));
        }
      }
    }, 800);
    return;
  }

  // Enemy hits back if we acted offensively
  if (acted) {
    setTimeout(function() {
      if (!_mineState.inCombat || !_mineState.enemy) return;
      var eDmg = Math.floor(Math.random() * (e.atk[1] - e.atk[0] + 1)) + e.atk[0];
      if (e._weakened) { eDmg = Math.floor(eDmg * 0.6); e._weakened = false; }
      if (_mineState._shielded) { eDmg = Math.floor(eDmg * 0.2); _mineState._shielded = false; }
      _mineState.hp = Math.max(0, _mineState.hp - eDmg);
      mineUpdatePlayerBar();
      mineCombatLog('💥 ' + e.name + ' hits you for ' + eDmg + '!', '#cc4444');
      say(e.name + ' hits you for ' + eDmg + '. HP: ' + _mineState.hp);
      if (_mineState.hp <= 0) {
        mineCombatLog('💀 You were defeated. Surfacing...', '#cc2222');
        _mineState.hand = [];
        setTimeout(function() { mineSurface(true); }, 1200);
      }
    }, 500);
  }
}

function mineCombatAction(action) {
  if (!_mineState.inCombat || !_mineState.enemy) return;
  var chars = CHARS && CHARS.length ? CHARS : (function(){ try { return _jsonParseSafe(DDStore.getItem('dd_chars'), '[]'); } catch(e) { return []; } })();
  var ch = chars[_mineState.charIdx];
  if (!ch) return;

  // Use character's actual stats
  var lvl = ch.level || 1;
  var atkRange = ATK_MAP[ch.cls] || [6,12];
  var baseDmg = Math.floor(Math.random() * (atkRange[1] - atkRange[0] + 1)) + atkRange[0];
  // Scale damage with level
  baseDmg = Math.floor(baseDmg * (1 + (lvl - 1) * 0.05));

  if (action === 'attack') {
    var dmg = baseDmg;
    if (_mineState._buffed) { dmg = Math.floor(dmg * 2); _mineState._buffed = false; }
    dmg = mineHitEnemy(dmg, true);
    _mineState.enemy.hp = Math.max(0, _mineState.enemy.hp - dmg);
    mineUpdateEnemyBar();
    mineCombatLog('⚔ ' + t('You hit ') + _mineState.enemy.name + t(' for ') + dmg + t(' damage!'), '#ffdd44');
    say(t('You hit ') + _mineState.enemy.name + t(' for ') + dmg + t(' damage.'));

  } else if (action === 'heavy') {
    // Heavy strike — 1.8x damage but enemy hits back harder
    var heavyDmg = mineHitEnemy(Math.floor(baseDmg * 1.8), true);
    _mineState.enemy.hp = Math.max(0, _mineState.enemy.hp - heavyDmg);
    mineUpdateEnemyBar();
    mineCombatLog(t('💥 HEAVY STRIKE! You slam ') + _mineState.enemy.name + t(' for ') + heavyDmg + t(' damage!'), '#ff9900');
    say(t('Heavy strike! You hit ') + _mineState.enemy.name + t(' for ') + heavyDmg + t(' damage.'));
    _mineState._heavyPenalty = true; // enemy hits harder this turn

  } else if (action === 'defend') {
    // Defend — skip attack, reduce incoming damage by 60% this turn
    _mineState._defending = true;
    mineCombatLog('🛡 You brace for impact! Defense up this turn.', '#4488ff');
    say('You defend. Incoming damage reduced this turn.');

  } else if (action === 'gun') {
    // Gun attack — use globally equipped gun from DDStore
    var gunDef = getEquippedGun();
    if (!gunDef) {
      mineCombatLog('🔫 No gun equipped! Equip one from the Blacksmith.', '#cc4444');
      say('No gun equipped.');
      return;
    }
    // The Mine's gun fired every turn; it now charges, empties and reloads like everywhere else
    if (_gunState.onCooldown) { mineCombatLog('🔫 Your gun is reloading.', '#888'); say('Your gun is reloading.'); return; }
    if (!_gunState.charged) {
      _gunState.charged = true; _gunState.shotsLeft = gunDef.shots || 1;
      mineCombatLog('🔫 ' + (gunDef.name || 'Gun') + ' charged — ' + _gunState.shotsLeft + ' shot' + (_gunState.shotsLeft > 1 ? 's' : '') + ' ready.', '#88ddff');
      say((gunDef.name || 'Gun') + ' charged.');
      return;
    }
    _gunState.shotsLeft--;
    if (_gunState.shotsLeft <= 0) { _gunState.charged = false; if (gunDef.cooldown) startGunCooldown(gunDef.cooldown); }
    var gunDmg = mineHitEnemy(Math.floor(Math.random() * (gunDef.dmg[1] - gunDef.dmg[0] + 1)) + gunDef.dmg[0], false);
    _mineState.enemy.hp = Math.max(0, _mineState.enemy.hp - gunDmg);
    mineUpdateEnemyBar();
    mineCombatLog('🔫 ' + (gunDef.name || 'Gun') + ' — ' + gunDmg + ' damage to ' + _mineState.enemy.name + '!', '#88ddff');
    say('You shoot ' + _mineState.enemy.name + ' with ' + (gunDef.name || 'your gun') + ' for ' + gunDmg + ' damage.');

  } else if (action === 'potion') {
    // Use a potion from mine inventory
    var potIdx = _mineState.hand.findIndex(function(i) { return i.type === 'mine-potion' || i.name === 'Health Potion'; });
    if (potIdx === -1) {
      mineCombatLog('🧪 No potions in hand!', '#cc4444');
      say('No potions available.');
      return;
    }
    var pot = _mineState.hand.splice(potIdx, 1)[0];
    var heal = pot.heal || 40;
    _mineState.hp = Math.min(_mineState.maxHp, _mineState.hp + heal);
    mineUpdatePlayerBar();
    mineCombatLog('🧪 You drink a potion and recover ' + heal + ' HP!', '#44cc88');
    say('You drink a potion and recover ' + heal + ' HP. Current HP: ' + _mineState.hp);
    // Potion doesn't end turn — enemy still attacks
    setTimeout(function() {
      if (!_mineState.inCombat || !_mineState.enemy) return;
      var eDmg = Math.floor(Math.random() * (_mineState.enemy.atk[1] - _mineState.enemy.atk[0] + 1)) + _mineState.enemy.atk[0];
      _mineState.hp = Math.max(0, _mineState.hp - eDmg);
      mineUpdatePlayerBar();
      mineCombatLog('💥 ' + _mineState.enemy.name + ' hits you for ' + eDmg + ' while you drink!', '#cc4444');
      if (_mineState.hp <= 0) {
        mineCombatLog('💀 You were defeated. Surfacing...', '#cc2222');
        say('You were defeated in the mine. Surfacing with chest items only.');
        _mineState.hand = [];
        setTimeout(function() { mineSurface(true); }, 1200);
      }
    }, 500);
    return;

  } else if (action === 'skill') {
    if (_mineState._skillsBlocked > 0) { _mineState._skillsBlocked = 0; mineCombatLog('✨ Your focus is drained — no skills this turn.', '#aa88ff'); say('Your focus is drained. No skills this turn.'); return; }
    var mineSkills = getMineSkills(ch);
    if (!mineSkills.length) {
      mineCombatLog('✨ No skills unlocked yet!', '#886644');
      say('No skills unlocked yet.');
      return;
    }
    mineCombatLog('✨ Choose a skill:', '#aa88ff');
    var combatLog = document.getElementById('mine-combat-log');
    mineSkills.forEach(function(sk) {
      var btn = document.createElement('button');
      btn.style.cssText = 'display:block;width:100%;margin:3px 0;padding:6px 10px;background:#0a0800;border:1px solid #554488;color:#aa88ff;font-family:Cinzel,serif;font-size:0.65rem;cursor:pointer;text-align:left;';
      btn.textContent = sk.icon + ' ' + sk.name + ' — ' + sk.desc;
      btn.setAttribute('aria-label', 'Use skill ' + sk.name);
      btn.classList.add('mine-skill-btn');
      btn.onclick = function() {
        combatLog.querySelectorAll('.mine-skill-btn').forEach(function(b){ b.remove(); });
        mineUseSkill(sk, ch);
      };
      if (combatLog) combatLog.appendChild(btn);
    });
    say('Choose a skill. ' + mineSkills.map(function(s){ return s.name; }).join(', '));
    return;

  } else if (action === 'flee') {
    if (Math.random() < 0.6) {
      mineCombatLog('🏃 You fled successfully!', '#44cc44');
      say('You fled from ' + _mineState.enemy.name + '.');
      mineAddLog('🏃 Fled from ' + _mineState.enemy.name + '.', '#888');
      _mineState.inCombat = false;
      _mineState.enemy = null;
      try { playTrack('mine-explore'); } catch(e) {}
      document.getElementById('mine-combat-area').style.display = 'none';
      document.getElementById('mine-dig-area').style.display = '';
    } else {
      mineCombatLog('❌ Flee failed! ' + _mineState.enemy.name + ' blocks you.', '#cc4444');
      var eDmg2 = Math.floor(Math.random() * (_mineState.enemy.atk[1] - _mineState.enemy.atk[0] + 1)) + _mineState.enemy.atk[0];
      _mineState.hp = Math.max(0, _mineState.hp - eDmg2);
      mineUpdatePlayerBar();
      mineCombatLog('💥 ' + _mineState.enemy.name + ' hits you for ' + eDmg2 + ' while fleeing!', '#cc4444');
      say('Flee failed. ' + _mineState.enemy.name + ' hits you for ' + eDmg2 + '.');
      if (_mineState.hp <= 0) {
        mineCombatLog('💀 You were defeated. Surfacing...', '#cc2222');
        _mineState.hand = [];
        setTimeout(function() { mineSurface(true); }, 1200);
      }
    }
    return;
  }

  // Check if enemy died after attack/heavy/gun
  if (_mineState.enemy && _mineState.enemy.hp <= 0) {
    var gold = _mineState.enemy.gold;
    addGlobalGold(gold);
    try {
      // Recorded by name: "Mine Bat" became "mine-mine-bat", which the Bestiary never shows
      var _mineSlug = _mineState.enemy.name.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-');
      var mineEnemyId = _mineSlug.indexOf('mine-') === 0 ? _mineSlug : 'mine-' + _mineSlug;
      bestiaryKills[mineEnemyId] = (bestiaryKills[mineEnemyId] || 0) + 1;
      DDStore.setItem('dd_bestiary', JSON.stringify(bestiaryKills));
    } catch(e) {}
    mineCombatLog('💀 ' + _mineState.enemy.name + ' defeated! +' + gold + ' gold.', '#44cc44');
    say(_mineState.enemy.name + ' defeated! You gained ' + gold + ' gold.');
    mineAddLog('💀 You defeated a ' + _mineState.enemy.name + '.', '#44cc44');
    _mineState.inCombat = false;
    _mineState.enemy = null;
    _mineState._defending = false;
    _mineState._heavyPenalty = false;
    mineUpdateStatusBar();
    try { playTrack('mine-explore'); } catch(e) {}
    setTimeout(function() {
      document.getElementById('mine-combat-area').style.display = 'none';
      document.getElementById('mine-dig-area').style.display = '';
      // Milestone boss — guaranteed special loot
      if (_mineState._wasMilestoneBoss) {
        mineCollectItem({ name:'Mega Potion', icon:'🧪', type:'mine-potion', heal:120, weight:1 });
        mineCollectItem({ name:'Diamonds ×3', icon:'💎', type:'mine-diamond', value:3, weight:1 });
        mineAddLog('👑 Milestone boss defeated! Special loot dropped.', '#ffdd44');
        _mineState._wasMilestoneBoss = false;
      } else if (Math.random() < 0.5) {
        var loot = mineWeightedPick(mineGetLootTable());
        if (Math.random() < 0.25) {
          mineCollectItem({ name:'Health Potion', icon:'🧪', type:'mine-potion', heal:40, weight:1 });
        } else {
          mineCollectItem(loot);
        }
      }
    }, 800);
    return;
  }

  // Enemy counter-attacks
  setTimeout(function() {
    if (!_mineState.inCombat || !_mineState.enemy) return;
    var eDmg = Math.floor(Math.random() * (_mineState.enemy.atk[1] - _mineState.enemy.atk[0] + 1)) + _mineState.enemy.atk[0];
    // Apply heavy penalty — enemy hits 30% harder
    if (_mineState._heavyPenalty) { eDmg = Math.floor(eDmg * 1.3); _mineState._heavyPenalty = false; }
    // Apply defend reduction — 60% less damage
    if (_mineState._defending) { eDmg = Math.floor(eDmg * 0.4); _mineState._defending = false; }
    _mineState.hp = Math.max(0, _mineState.hp - eDmg);
    mineUpdatePlayerBar();
    mineCombatLog('💥 ' + _mineState.enemy.name + t(' hits you for ') + eDmg + '!', '#cc4444');
    mineEnemyMoves(eDmg);
    say(_mineState.enemy.name + t(' hits you for ') + eDmg + t(' damage. Your HP: ') + _mineState.hp);
    if (_mineState.hp <= 0) {
      mineCombatLog('💀 You were defeated. Surfacing...', '#cc2222');
      say('You were defeated in the mine. Surfacing with chest items only.');
      mineAddLog('💀 You were defeated. Lost hand items. Surfacing.', '#cc2222');
      _mineState.hand = [];
      setTimeout(function() { mineSurface(true); }, 1200);
    }
  }, 500);
}

function mineCollectItem(item) {
  if (_mineState.hand.length >= MINE_MAX_CARRY) {
    mineAddLog('🎒 Hands full! Drop off at chest or surface first.', '#cc8800');
    say('Your hands are full. Surface or use the chest.');
    return false;
  }
  _mineState.hand.push(item);
  mineUpdateCarryBar();
  mineRenderHand();
  // Show chest button at depth 3+
  if (_mineState.depth >= 3) {
    _mineState.hasChest = true;
    var chestBtn = document.getElementById('mine-chest-btn');
    if (chestBtn) chestBtn.style.display = '';
  }
  return true;
}

function mineDig() {
  if (_mineState.inCombat) { say('Finish the fight first!'); return; }
  if (_mineState.hand.length >= MINE_MAX_CARRY) {
    say('Your hands are full. Surface or use the chest.');
    mineAddLog('🎒 Hands full! You cannot carry more.', '#cc8800');
    return;
  }

  var btn = document.getElementById('mine-dig-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⛏ Mining...'; }

  setTimeout(function() {
    if (btn) { btn.disabled = false; btn.textContent = '⛏ Mine'; }

    _mineState.digsOnFloor++;

    // Enemy spawn chance scales with depth
    var enemyChance = 0.08 + (_mineState.depth * 0.03);
    if (Math.random() < enemyChance) {
      mineSpawnEnemy();
      return;
    }

    // Empty swing chance
    if (Math.random() < 0.15) {
      var emptys = ['Nothing but rock.', 'Solid stone. Keep digging.', 'Your pick sparks against hard ore.', 'Empty. Try again.'];
      var msg = emptys[Math.floor(Math.random() * emptys.length)];
      mineAddLog('🪨 ' + msg, '#555');
      say(msg);
      return;
    }

    // Loot drop
    var numItems = Math.random() < 0.3 ? 2 : 1;
    for (var i = 0; i < numItems; i++) {
      if (_mineState.hand.length >= MINE_MAX_CARRY) break;
      var loot = mineWeightedPick(mineGetLootTable());
      var collected = mineCollectItem(loot);
      if (collected) {
        mineAddLog(loot.icon + ' Found: ' + loot.name + '!', '#c8a832');
        say('Found ' + loot.name + '!');
      }
    }

    // Update atmosphere occasionally
    if (_mineState.digsOnFloor % 5 === 0) {
      var atm = MINE_ATMOSPHERES[Math.floor(Math.random() * MINE_ATMOSPHERES.length)];
      var atmEl = document.getElementById('mine-atmosphere');
      if (atmEl) atmEl.textContent = atm;
    }
  }, 1500);
}

function mineDescend() {
  if (_mineState.inCombat) { say('Finish the fight first!'); return; }
  _mineState.depth++;
  var _prevMineMax = getAchievementStats().mineMaxDepth || 0;
  if (_mineState.depth > _prevMineMax) updateAchievementStat('mineMaxDepth', _mineState.depth);
  _mineState.digsOnFloor = 0;
  // Restore some HP on descend
  _mineState.hp = Math.min(_mineState.maxHp, _mineState.hp + 10);
  mineUpdateStatusBar();
  mineUpdatePlayerBar();

  // Check for milestone boss
  var milestoneBoss = MINE_ENEMIES.find(function(e) { return e.isMilestone && e.milestoneDepth === _mineState.depth; });
  if (milestoneBoss) {
    mineAddLog('⚠️ Something stirs in the darkness below. A presence. Old. Heavy. Wrong.', '#cc2222');
    say('You feel something wrong at depth ' + _mineState.depth + '. A boss awaits.');
    setTimeout(function() {
      // Force spawn the milestone boss
      _mineState.enemy = {
        name: milestoneBoss.name,
        icon: milestoneBoss.icon,
        hp: milestoneBoss.hp,
        maxHp: milestoneBoss.hp,
        atk: milestoneBoss.atk,
        gold: milestoneBoss.gold,
        isBoss: true,
        isMilestone: true,
        lore: milestoneBoss.lore
      };
      _mineState.inCombat = true;
      _mineState._wasMilestoneBoss = true;
      try { playTrack('mine-combat'); } catch(e) {}
      document.getElementById('mine-combat-area').style.display = '';
      document.getElementById('mine-dig-area').style.display = 'none';
      document.getElementById('mine-combat-log').innerHTML = '';
      mineUpdateEnemyBar();
      mineUpdatePlayerBar();
      var nameEl = document.getElementById('mine-enemy-name');
      if (nameEl) nameEl.textContent = milestoneBoss.icon + ' ' + milestoneBoss.name;
      mineCombatLog('💀 ' + milestoneBoss.name.toUpperCase() + ' blocks your path!', '#cc2222');
      if (milestoneBoss.lore) mineCombatLog('📖 "' + milestoneBoss.lore + '"', '#886644');
      say('Milestone boss! ' + milestoneBoss.name + '. HP: ' + milestoneBoss.hp + '. This is a powerful enemy.');
      // Track in bestiary
      try {
        var bId = 'mine-' + milestoneBoss.name.toLowerCase().replace(/[^a-z0-9]/g,'-').replace(/-+/g,'-');
        bestiaryKills[bId] = bestiaryKills[bId] || 0; // register without incrementing until killed
        DDStore.setItem('dd_bestiary', JSON.stringify(bestiaryKills));
      } catch(e) {}
    }, 800);
    return;
  }

  mineAddLog('⬇ Descending to depth ' + _mineState.depth + '...', '#6699bb');
  say('Descending to depth ' + _mineState.depth + '. Enemies are stronger. Loot is rarer and better.');
  var atmEl = document.getElementById('mine-atmosphere');
  if (atmEl) atmEl.textContent = 'Depth ' + _mineState.depth + '. The air is colder. The darkness is thicker.';
}

function mineOpenChest() {
  if (!_mineState.hasChest) return;
  // Move hand items into chest, freeing hands
  var moved = _mineState.hand.length;
  _mineState.hand.forEach(function(item) { _mineState.chest.push(item); });
  _mineState.hand = [];
  mineUpdateCarryBar();
  mineRenderHand();
  mineAddLog('📦 Stored ' + moved + ' item' + (moved !== 1 ? 's' : '') + ' in the chest. Hands free!', '#aa8844');
  say('Stored ' + moved + ' items in the mine chest. Your hands are free.');
}

function mineSurface(defeated) {
  // Collect everything — hand + chest
  var allItems = _mineState.hand.concat(_mineState.chest);
  var goldEarned = 0;
  var diamondsEarned = 0;
  var coinsEarned = 0;
  var partsFound = {};

  var potionsFound = 0;
  allItems.forEach(function(item) {
    if (item.type === 'mine-gold') { goldEarned += item.value || 0; }
    else if (item.type === 'mine-diamond') { diamondsEarned += item.value || 0; }
    else if (item.type === 'mine-coin') { coinsEarned += item.value || 0; }
    else if (item.type === 'mine-potion') { potionsFound++; }
    else if (item.type === 'gun-part') {
      addGunPart(item.partId);
      partsFound[item.partId] = (partsFound[item.partId] || 0) + 1;
    } else if (item.type === 'mine-ingredient') {
      try { addAlchemyIngredient && addAlchemyIngredient('herb'); } catch(e) {}
    }
  });

  if (goldEarned > 0) addGlobalGold(goldEarned);
  if (diamondsEarned > 0) addDiamonds(diamondsEarned);
  if (coinsEarned > 0) {
    addMysteryCoin(coinsEarned); // Mine coins went missing: written past the synced counter
  }
  // Save unused potions to global inventory
  if (potionsFound > 0) {
    var globalInv = getGlobalInventory();
    allItems.filter(function(i) { return i.type === 'mine-potion'; }).forEach(function(pot) {
      globalInv.push({
        id: 'mine-potion-' + Date.now() + '-' + Math.random().toString(36).substr(2,5),
        name: pot.name || 'Health Potion',
        icon: pot.icon || '🧪',
        type: 'potion',
        heal: pot.heal || 40,
        desc: 'Restores ' + (pot.heal || 40) + ' HP. Found in the Mine.',
        fromMine: true
      });
    });
    saveGlobalInventory(globalInv);
  }

  // Show summary
  var summary = defeated ? '💀 You were defeated!\n\n' : '⬆ You surfaced from the mine.\n\n';
  summary += 'Depth reached: ' + _mineState.depth + '\n';
  if (goldEarned) summary += '💰 Gold: +' + goldEarned + '\n';
  if (diamondsEarned) summary += '💎 Diamonds: +' + diamondsEarned + '\n';
  if (coinsEarned) summary += '🪙 Mystery Coins: +' + coinsEarned + '\n';
  if (potionsFound) summary += '🧪 Potions saved to inventory: ' + potionsFound + '\n';
  var partNames = { barrel:'Gun Barrel', mechanism:'Firing Mechanism', stock:'Gun Stock', trigger:'Trigger Assembly' };
  Object.keys(partsFound).forEach(function(p) {
    summary += '🔩 ' + (partNames[p] || p) + ': +' + partsFound[p] + '\n';
  });
  if (allItems.length === 0) summary += 'Nothing found this run.';

  // Show proper summary screen
  var iconEl  = document.getElementById('mine-summary-icon');
  var titleEl = document.getElementById('mine-summary-title');
  var depthEl = document.getElementById('mine-summary-depth');
  var lootEl  = document.getElementById('mine-summary-loot');
  if (iconEl)  iconEl.textContent  = defeated ? '💀' : '⛏';
  if (titleEl) { titleEl.textContent = defeated ? 'You Were Defeated' : 'Surfaced Safely'; titleEl.style.color = defeated ? '#aa4444' : '#c8a832'; }
  if (depthEl) depthEl.textContent = 'DEPTH REACHED: ' + _mineState.depth;
  if (lootEl) {
    var lines = [];
    if (goldEarned)     lines.push('<div>💰 Gold <span style="float:right;color:#c8a832;">+' + goldEarned + '</span></div>');
    if (diamondsEarned) lines.push('<div>💎 Diamonds <span style="float:right;color:#88ddff;">+' + diamondsEarned + '</span></div>');
    if (coinsEarned)    lines.push('<div>🪙 Mystery Coins <span style="float:right;color:#cc8844;">+' + coinsEarned + '</span></div>');
    if (potionsFound)   lines.push('<div>🧪 Potions → Inventory <span style="float:right;color:#44cc88;">+' + potionsFound + '</span></div>');
    var partNames = { barrel:'Gun Barrel', mechanism:'Firing Mechanism', stock:'Gun Stock', trigger:'Trigger Assembly' };
    Object.keys(partsFound).forEach(function(p) {
      lines.push('<div>🔩 ' + (partNames[p]||p) + ' <span style="float:right;color:#aaa;">+' + partsFound[p] + '</span></div>');
    });
    if (!lines.length) lines.push('<div style="color:#444;text-align:center;">Nothing found this run.</div>');
    if (defeated) lines.push('<div style="color:#886666;font-size:0.65rem;margin-top:8px;">Hand items lost on defeat.</div>');
    lootEl.innerHTML = lines.join('');
  }
  goTo('mine-summary');
  var sayMsg = (defeated ? 'Defeated in the mine. ' : 'Surfaced from the mine. ') +
    (goldEarned ? goldEarned + ' gold earned. ' : '') +
    (diamondsEarned ? diamondsEarned + ' diamonds. ' : '') +
    'Depth reached: ' + _mineState.depth + '.';
  say(sayMsg);
  setTimeout(function() { var btn = document.querySelector('#screen-mine-summary .menu-btn'); if (btn) btn.focus(); }, 200);

  // Reset mine state
  _mineState.active = false;
  _mineState.hand = [];
  _mineState.chest = [];
  _mineState.hasChest = false;
  _mineState.depth = 1;
  _mineState.digsOnFloor = 0;
  _mineState.inCombat = false;
  _mineState.enemy = null;

  try { stopAmbient(); playTrack(getMenuTrack()); } catch(e) {}
  updateGlobalGoldDisplay();
  updateDiamondDisplay();
  // Note: goTo('mine-summary') was already called above — don't call goTo('mine') here
}

function mineExit() {
  // The chest is lost too when you leave without surfacing; the warning only mentioned your hands.
  var _chestN = (_mineState.chest && _mineState.chest.length) || 0;
  if (_mineState.active && (_mineState.hand.length > 0 || _chestN > 0)) {
    showChoiceModal(
      '⚠ Leave the Mine?',
      'You still have ' + _mineState.hand.length + ' item' + (_mineState.hand.length === 1 ? '' : 's') + ' in your hands and ' + _chestN + ' in your chest. Leave now and lose them all, or surface first to keep them.',
      [
        { label: 'Leave (lose items)', action: function() {
          _mineState.hand = [];
          _mineState.active = false;
          goTo('menu');
        }},
        { label: 'Stay in mine', action: function() { /* do nothing */ } }
      ]
    );
    return;
  }
  _mineState.active = false;
  goTo('menu');
}

function mineInitScreen() {
  try {
    var charselect = document.getElementById('mine-panel-charselect');
    var active = document.getElementById('mine-panel-active');
    if (charselect) charselect.style.display = '';
    if (active) active.style.display = 'none';
  } catch(e) {}
  try { mineUpdateStatusBar(); } catch(e) {}
  try { renderMineCharSelect(); } catch(e) { console.warn('[Mine] renderMineCharSelect error:', e); }
}

function renderMineCharSelect() {
  var list = document.getElementById('mine-char-list');
  if (!list) { console.warn('[Mine] mine-char-list element not found'); return; }
  list.innerHTML = '';
  var chars = (CHARS && CHARS.length) ? CHARS : (function(){ try { return _jsonParseSafe(DDStore.getItem('dd_chars'), '[]'); } catch(e) { return []; } })();
  if (!chars || chars.length === 0) {
    list.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;">No characters yet. Create one first from the main menu.</div>';
    return;
  }
  chars.forEach(function(ch, i) {
    if (!ch || !ch.name) return;
    var btn = document.createElement('button');
    btn.style.cssText = 'width:100%;padding:10px 14px;background:#0a0800;border:1px solid #443300;color:#c8a832;font-family:Cinzel,serif;font-size:0.7rem;cursor:pointer;text-align:left;margin-bottom:4px;';
    btn.textContent = '⚔ ' + ch.name + ' — ' + (ch.cls || 'Unknown') + ' · ' + (ch.race || '');
    btn.setAttribute('aria-label', 'Send ' + ch.name + ' the ' + (ch.cls || '') + ' into the mine');
    (function(idx) { btn.onclick = function() { mineStart(idx); }; })(i);
    list.appendChild(btn);
  });
}

function mineStart(charIdx) {
  var chars = CHARS && CHARS.length ? CHARS : (function(){ try { return _jsonParseSafe(DDStore.getItem('dd_chars'), '[]'); } catch(e) { return []; } })();
  var ch = chars[charIdx];
  if (!ch) return;
  _mineState.charIdx = charIdx;
  _mineState.active = true;
  _mineState.depth = 1;
  _mineState.digsOnFloor = 0;
  _mineState.hand = [];
  _mineState.chest = [];
  _mineState.hasChest = false;
  _mineState.inCombat = false;
  _mineState.enemy = null;
  _mineState._defending = false;
  _mineState._heavyPenalty = false;
  // Set HP from character class AND level
  var lvl = ch.level || 1;
  var maxHp = HP_MAP[ch.cls] || 100;
  maxHp = Math.floor(maxHp * (1 + (lvl - 1) * 0.04)); // 4% more HP per level
  _mineState.maxHp = maxHp;
  _mineState.hp = maxHp;

  document.getElementById('mine-panel-charselect').style.display = 'none';
  document.getElementById('mine-panel-active').style.display = '';
  document.getElementById('mine-combat-area').style.display = 'none';
  document.getElementById('mine-dig-area').style.display = '';
  document.getElementById('mine-log').innerHTML = '';
  document.getElementById('mine-chest-btn').style.display = 'none';

  var atmEl = document.getElementById('mine-atmosphere');
  if (atmEl) atmEl.textContent = MINE_ATMOSPHERES[0];

  mineUpdateStatusBar();
  mineUpdateCarryBar();
  mineUpdatePlayerBar();
  mineRenderHand();

  mineAddLog('⛏ ' + ch.name + ' enters the mine at depth 1.', '#c8a832');
  say(ch.name + ' enters the mine. Mine for resources, descend for better loot, surface to collect. Watch your hands — you can only carry 15 items.');
  try { playAmbient('mine'); } catch(e) {}
  try { playTrack('mine-explore'); } catch(e) {}
}

// ── HOME TABS ──────────────────────────────────────────────────────────────
var _homeTab = 'home';
function switchHomeTab(tab) {
  _homeTab = tab;
  var tabs = ['home','spirits','minions','forge','alchemy','elixirs','gunshop'];
  tabs.forEach(function(t) {
    var btn = document.getElementById('htab-' + t);
    var panel = document.getElementById('htab-panel-' + t);
    var active = t === tab;
    if (btn) {
      btn.style.background = active ? '#1a1000' : '#080808';
      btn.style.borderColor = active ? '#cc9944' : '#333';
      btn.style.color = active ? '#cc9944' : '#666';
    }
    if (panel) panel.style.display = active ? '' : 'none';
  });
  if (tab === 'minions') renderMinionList();
  if (tab === 'forge') { renderForgeTab(); document.getElementById('forge-result').style.display='none'; }
  if (tab === 'alchemy') renderAlchemyTab();
  if (tab === 'elixirs') renderElixirVendor();
  if (tab === 'gunshop') renderHomeGunWorkshop();
}

function renderHomeGunWorkshop() {
  var diamonds = getDiamonds();
  var parts = getGunParts();
  var owned = getOwnedGuns();
  var equipped = getEquippedGun();

  // Diamond display
  var diaEl = document.getElementById('home-gun-diamond-display');
  if (diaEl) diaEl.textContent = '💎 Diamonds: ' + diamonds;

  // Parts display
  var partsEl = document.getElementById('home-gun-parts-display');
  if (partsEl) {
    var hasAnyParts = GUN_PARTS_DEFS.some(function(p) { return (parts[p.id] || 0) > 0; });
    if (!hasAnyParts) {
      partsEl.textContent = 'No parts yet. Defeat enemies in dungeons to find gun parts (8% drop chance).';
    } else {
      partsEl.innerHTML = GUN_PARTS_DEFS.map(function(p) {
        var count = parts[p.id] || 0;
        return '<span style="color:' + (count > 0 ? '#ffaa00' : '#444') + ';margin-right:14px;">' + p.icon + ' ' + p.name + ': ' + count + '</span>';
      }).join('');
    }
  }

  // Craft list
  var craftList = document.getElementById('home-gun-craft-list');
  if (craftList) {
    craftList.innerHTML = '';
    GUN_DEFS.forEach(function(gun) {
      if (owned.indexOf(gun.id) !== -1) return; // already owned
      // Count required parts
      var partCount = {};
      gun.craftParts.forEach(function(p) { partCount[p] = (partCount[p] || 0) + 1; });
      var canCraft = Object.keys(partCount).every(function(p) { return (parts[p] || 0) >= partCount[p]; });
      var partReq = Object.keys(partCount).map(function(p) {
        var def = GUN_PARTS_DEFS.find(function(d) { return d.id === p; });
        var have = parts[p] || 0;
        var need = partCount[p];
        return (def ? def.icon : '🔩') + ' ' + (def ? def.name : p) + ' ' + have + '/' + need;
      }).join(' · ');

      var div = document.createElement('div');
      div.style.cssText = 'border:1px solid ' + (canCraft ? '#cc8800' : '#222') + ';padding:10px;background:#0a0800;';
      div.innerHTML =
        '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:' + (canCraft ? '#ffaa00' : '#555') + ';margin-bottom:4px;">' + gun.icon + ' ' + gun.name + '</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.58rem;color:#666;margin-bottom:6px;">' + partReq + '</div>';
      var btn = document.createElement('button');
      btn.disabled = !canCraft;
      btn.style.cssText = 'font-family:Cinzel,serif;font-size:0.65rem;padding:7px 12px;background:#0a0800;border:1px solid ' + (canCraft ? '#ffaa00' : '#333') + ';color:' + (canCraft ? '#ffaa00' : '#444') + ';cursor:' + (canCraft ? 'pointer' : 'default') + ';';
      btn.textContent = canCraft ? '⚙️ Craft ' + gun.name : 'Need more parts';
      btn.setAttribute('aria-label', canCraft ? 'Craft ' + gun.name : 'Need more parts to craft ' + gun.name);
      (function(g) {
        btn.onclick = function() { craftGunFromParts(g.id); };
      })(gun);
      div.appendChild(btn);
      craftList.appendChild(div);
    });
    if (craftList.children.length === 0) {
      craftList.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;">You own all available guns!</div>';
    }
  }

  // Owned guns list
  var ownedList = document.getElementById('home-gun-owned-list');
  if (ownedList) {
    if (owned.length === 0) {
      ownedList.textContent = 'No guns yet. Craft them here or buy from the Blacksmith.';
    } else {
      ownedList.innerHTML = '';
      owned.forEach(function(gunId) {
        var gun = getGunDef(gunId);
        if (!gun) return;
        var isEquipped = equipped && equipped.id === gunId;
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border:1px solid ' + (isEquipped ? '#ff6622' : '#333') + ';padding:8px;margin-bottom:6px;';
        row.innerHTML = '<span style="font-family:Cinzel,serif;font-size:0.68rem;color:' + (isEquipped ? '#ff6622' : '#ffaa00') + ';">' + gun.icon + ' ' + gun.name + (isEquipped ? ' ✓' : '') + '</span>';
        var eBtn = document.createElement('button');
        eBtn.style.cssText = 'font-family:Cinzel,serif;font-size:0.62rem;padding:5px 10px;background:#0a0800;border:1px solid ' + (isEquipped ? '#ff6622' : '#44aa44') + ';color:' + (isEquipped ? '#ff6622' : '#44aa44') + ';cursor:pointer;';
        eBtn.textContent = isEquipped ? 'Unequip' : 'Equip';
        (function(g, eq) {
          eBtn.onclick = function() {
            if (eq) { unequipGun(); say(g.name + ' unequipped.'); }
            else { equipGun(g.id); say(g.name + ' equipped. A gun button will appear in combat.'); }
            renderHomeGunWorkshop();
          };
        })(gun, isEquipped);
        row.appendChild(eBtn);
        ownedList.appendChild(row);
      });
    }
  }
}

function craftGunFromParts(gunId) {
  var gun = getGunDef(gunId);
  if (!gun) return;
  if (hasGun(gunId)) { say('You already own the ' + gun.name + '.'); return; }
  var partCount = {};
  gun.craftParts.forEach(function(p) { partCount[p] = (partCount[p] || 0) + 1; });
  var partsNeeded = [];
  Object.keys(partCount).forEach(function(p) {
    for (var i = 0; i < partCount[p]; i++) partsNeeded.push(p);
  });
  if (!spendGunParts(partsNeeded)) {
    say('Not enough parts to craft the ' + gun.name + '.');
    return;
  }
  addOwnedGun(gunId);
  sfx('sfx-unlock');
  say('You crafted the ' + gun.name + '! Equip it below.');
  renderHomeGunWorkshop();
}

// ── MINION SYSTEM ───────────────────────────────────────────────────────────
function getMinions() { return _jsonParseSafe(DDStore.getItem('dd_minions'), '[]'); }
function saveMinions(m) { DDStore.setItem('dd_minions', JSON.stringify(m)); }
function getActiveMinion() { return DDStore.getItem('dd_active_minion') || null; }
function setActiveMinion(id) { if (id) DDStore.setItem('dd_active_minion', id); else DDStore.removeItem('dd_active_minion'); }

function captureMinion(enemy) {
  var minions = getMinions();
  if (minions.find(function(m){ return m.id === enemy.id; })) {
    say('You already have a ' + enemy.name + ' as a minion.');
    return false;
  }
  // The Help screen says you can keep up to 8; nothing checked it.
  if (minions.length >= 8) {
    say('You already have 8 minions, the most you can keep. Release one at your Home first.');
    return false;
  }
  // Elite-sourced minions are a real tier up, not just a stat bump — see
  // the crit chance in minionCombatAttack() too.
  var isElite = !!enemy.isElite;
  var scalePct = isElite ? 0.85 : 0.60;
  var minion = {
    id: enemy.id || ('minion_' + Date.now()),
    name: enemy.name,
    icon: enemy.icon || '👾',
    atk: Math.max(1, Math.floor((enemy.atk || enemy.atkBase || 5) * scalePct)),
    tier: isElite ? 'elite' : 'common',
    capturedOn: Date.now()
  };
  minions.push(minion);
  saveMinions(minions);
  say('You captured ' + (isElite ? 'an Elite ' : 'a ') + minion.name + '! Find them in your Home under Minions.');
  showToast((isElite ? '⭐👾 Elite ' : '👾 ') + minion.name + ' captured!', 'green');
  return true;
}

function renderMinionList() {
  var container = document.getElementById('home-minion-list');
  if (!container) return;
  var minions = getMinions();
  var activeId = getActiveMinion();
  if (minions.length === 0) {
    container.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.68rem;color:#444;text-align:center;padding:24px 0;">No minions yet. Use a Soul Trap in combat to capture enemies.</div>';
    return;
  }
  container.innerHTML = minions.map(function(m) {
    var isActive = m.id === activeId;
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:' + (isActive ? '#0a1a0a' : '#080808') + ';border:1px solid ' + (isActive ? '#44aa44' : '#222') + ';margin-bottom:6px;border-radius:2px;">' +
      '<span style="font-size:1.4rem;" aria-hidden="true">' + m.icon + '</span>' +
      '<div style="flex:1;">' +
        '<div style="font-family:Cinzel,serif;font-size:0.72rem;color:' + (isActive ? '#44ff88' : '#aaa') + ';">' + m.name + (m.tier === 'elite' ? ' <span style="font-size:0.6rem;color:#cc88ff;border:1px solid #884499;padding:1px 5px;">ELITE</span>' : '') + (isActive ? ' <span style="font-size:0.6rem;color:#44aa44;">[ACTIVE]</span>' : '') + '</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#555;">ATK: ' + m.atk + ' per round</div>' +
      '</div>' +
      '<button onclick="toggleMinion(\'' + m.id + '\')" style="padding:6px 10px;background:' + (isActive ? '#0a1a0a' : '#0a0a0a') + ';border:1px solid ' + (isActive ? '#44aa44' : '#444') + ';color:' + (isActive ? '#44ff88' : '#888') + ';font-family:Cinzel,serif;font-size:0.62rem;cursor:pointer;" aria-label="' + (isActive ? 'Deactivate' : 'Activate') + ' ' + m.name + '">' + (isActive ? 'Deactivate' : 'Activate') + '</button>' +
      '<button onclick="releaseMinion(\'' + m.id + '\')" style="padding:6px 8px;background:#0a0808;border:1px solid #330000;color:#884444;font-family:Cinzel,serif;font-size:0.62rem;cursor:pointer;margin-left:4px;" aria-label="Release ' + m.name + '">✕</button>' +
    '</div>';
  }).join('');
}

function toggleMinion(id) {
  var activeId = getActiveMinion();
  if (activeId === id) {
    setActiveMinion(null);
    var msg = document.getElementById('home-minion-msg');
    if (msg) { msg.textContent = 'Minion deactivated.'; setTimeout(function(){ msg.textContent=''; }, 2000); }
  } else {
    setActiveMinion(id);
    var minions = getMinions();
    var m = minions.find(function(x){ return x.id === id; });
    var msg = document.getElementById('home-minion-msg');
    if (msg && m) { msg.textContent = m.name + ' will fight with you!'; setTimeout(function(){ msg.textContent=''; }, 2500); }
    say(m ? m.name + ' activated. They will fight alongside you.' : 'Minion activated.');
  }
  renderMinionList();
}

function releaseMinion(id) {
  var minions = getMinions().filter(function(m){ return m.id !== id; });
  saveMinions(minions);
  var activeId = getActiveMinion();
  if (activeId === id) setActiveMinion(null);
  renderMinionList();
}

// Minion attacks during combat — call this at end of each combat round
function minionCombatAttack(enemy) {
  var activeId = getActiveMinion();
  if (!activeId) return;
  var minions = getMinions();
  var m = minions.find(function(x){ return x.id === activeId; });
  if (!m) return;
  var dmg = m.atk + Math.floor(Math.random() * 4);
  if (m.tier === 'elite' && Math.random() < 0.10) {
    dmg *= 2;
    enemy.hp = Math.max(0, (enemy.hp || 0) - dmg);
    addLog('⭐ ' + m.name + ' lands a devastating critical for ' + dmg + ' damage!');
  } else {
    enemy.hp = Math.max(0, (enemy.hp || 0) - dmg);
    addLog('👾 ' + m.name + ' attacks for ' + dmg + ' damage!');
  }
}

function renderHomeSkills() {
  var container = document.getElementById('home-skill-list');
  if (!container) return;
  container.innerHTML = '';
  var ch = _charIdx !== null ? CHARS[_charIdx] : null;
  if (!ch) { container.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;">No active character.</div>'; return; }
  var h = getHomeSave();
  var skillLevels = h.skillLevels || {};
  var now = Date.now();
  var onCooldown = now < (h.skillCooldownUntil || 0);
  var upgradeCount = h.upgradeCount || 0;
  var classSkills = CLASS_SKILLS && CLASS_SKILLS[ch.cls] ? CLASS_SKILLS[ch.cls].slice(0, 8) : [];
  if (!classSkills.length) { container.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;">No upgradeable skills found.</div>'; return; }
  classSkills.forEach(function(skill) {
    var skillId = (ch.cls + '_' + skill.name).replace(/\s/g,'_');
    var currentLevel = skillLevels[skillId] || 1;
    var maxed = currentLevel >= HOME_MAX_SKILL_LEVEL;
    var upgradeCost = currentLevel * 80;
    var canAfford = getGlobalGold() >= upgradeCost;
    var canUpgrade = !maxed && !onCooldown && upgradeCount < HOME_MAX_SKILL_LEVEL && canAfford;
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px;background:#050505;border:1px solid #111;gap:8px;';
    var info = document.createElement('div');
    info.style.flex = '1';
    info.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:#aaa;">' + skill.icon + ' ' + skill.name + '</div>' +
      '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#555;">Lv ' + currentLevel + ' / ' + HOME_MAX_SKILL_LEVEL + (maxed ? ' — MAXED' : '') + '</div>';
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:6px 10px;background:#050505;border:1px solid ' + (canUpgrade?'#44aaff':'#222') + ';color:' + (canUpgrade?'#44aaff':'#333') + ';font-family:Cinzel,serif;font-size:0.62rem;cursor:' + (canUpgrade?'pointer':'default') + ';white-space:nowrap;';
    btn.textContent = maxed ? 'Maxed' : (upgradeCost + 'g ↑');
    btn.disabled = !canUpgrade;
    btn.setAttribute('aria-label', skill.name + ' level ' + currentLevel + '. ' + (maxed ? 'Maxed.' : 'Upgrade for ' + upgradeCost + ' gold.'));
    btn.onclick = function(){ homeUpgradeSkill(skillId, skill.name, upgradeCost, currentLevel); };
    row.appendChild(info); row.appendChild(btn); container.appendChild(row);
  });
  if (onCooldown) {
    var minsLeft = Math.ceil(((h.skillCooldownUntil||0) - now) / 60000);
    var cdDiv = document.createElement('div');
    cdDiv.style.cssText = 'font-family:Cinzel,serif;font-size:0.62rem;color:#555;text-align:center;padding:6px;';
    cdDiv.textContent = '⏳ Cooldown — ' + minsLeft + ' min remaining.';
    container.appendChild(cdDiv);
  }
}

function homeUpgradeSkill(skillId, skillName, cost, currentLevel) {
  var msg = document.getElementById('home-skill-msg');
  var h = getHomeSave();
  var now = Date.now();
  if (now < (h.skillCooldownUntil || 0)) { if(msg) msg.textContent = 'On cooldown.'; return; }
  if ((h.upgradeCount||0) >= HOME_MAX_SKILL_LEVEL) { if(msg) msg.textContent = 'Max upgrades reached — wait 3 minutes.'; return; }
  if (currentLevel >= HOME_MAX_SKILL_LEVEL) { if(msg) msg.textContent = skillName + ' is maxed.'; return; }
  if (getGlobalGold() < cost) { if(msg) msg.textContent = 'Not enough gold.'; return; }
  spendGlobalGold(cost);
  if (!h.skillLevels) h.skillLevels = {};
  h.skillLevels[skillId] = currentLevel + 1;
  h.upgradeCount = (h.upgradeCount || 0) + 1;
  if (h.upgradeCount >= HOME_MAX_SKILL_LEVEL) { h.skillCooldownUntil = now + HOME_SKILL_COOLDOWN_MS; h.upgradeCount = 0; }
  saveHome(h);
  if (!DS.skillLevels) DS.skillLevels = {};
  DS.skillLevels[skillId] = h.skillLevels[skillId];
  if (msg) msg.textContent = skillName + ' upgraded to level ' + (currentLevel+1) + '!';
  sfx('sfx-unlock'); renderHomeSkills();
  say(skillName + ' upgraded to level ' + (currentLevel+1) + '.');
}

function homeCreateSkillOrbs() {
  var h = getHomeSave();
  if (!h.skillLevels || !Object.keys(h.skillLevels).length) return;
  var ch = _charIdx !== null ? CHARS[_charIdx] : null;
  if (!ch) return;
  var orbs = _jsonParseSafe(DDStore.getItem('dd_skill_orbs'), '[]');
  Object.keys(h.skillLevels).forEach(function(skillId) {
    var level = h.skillLevels[skillId];
    if (level > 1) {
      var parts = skillId.split('_');
      orbs.push({ id:skillId, skillName:parts.slice(1).join(' '), className:parts[0], level:level, fromChar:ch.name, created:Date.now() });
    }
  });
  DDStore.setItem('dd_skill_orbs', JSON.stringify(orbs));
  h.skillLevels = {}; h.upgradeCount = 0; saveHome(h);
  if (orbs.length > 0) addLog('✨ Skill Orbs created from ' + ch.name + '\'s upgraded skills. Check your global inventory.');
}

function initHomeButton() {
  // Home button always visible — screen shows Buy Home or Home facilities
  var homeBtn = document.getElementById('home-btn');
  if (homeBtn) homeBtn.style.display = '';
}
function useSkillOrb(item, idx) {
  var ch = _charIdx !== null ? CHARS[_charIdx] : null;
  if (!ch) { say('No active character.'); return; }
  if (item.className !== ch.cls) {
    say('This orb is for a ' + item.className + '. Your character is a ' + ch.cls + '. You need to play the same class to use this orb.');
    addLog('❌ Skill Orb requires a ' + item.className + '. You are a ' + ch.cls + '.');
    return;
  }
  // Apply skill level to character
  if (!ch.skillLevels) ch.skillLevels = {};
  ch.skillLevels[item.id] = item.level;
  if (!DS.skillLevels) DS.skillLevels = {};
  DS.skillLevels[item.id] = item.level;
  DS.inventory.splice(idx, 1);
  // Remove from global skill orbs
  var orbs = _jsonParseSafe(DDStore.getItem('dd_skill_orbs'), '[]');
  orbs = orbs.filter(function(o){ return !(o.id === item.id && o.fromChar === item.fromChar); });
  DDStore.setItem('dd_skill_orbs', JSON.stringify(orbs));
  saveChars(); renderInv(); saveProgress();
  addLog('✨ Skill Orb used — ' + item.skillName + ' is now level ' + item.level + '!');
  say('Skill Orb used. ' + item.skillName + ' upgraded to level ' + item.level + ' from ' + item.fromChar + '.');
  sfx('sfx-unlock');
}
// ── END HOME SYSTEM ──

// ── CORRUPTION SYSTEM ──
var _corruptionTimer = null;
var _corruption = 0;

function startCorruptionSystem() {
  // A resumed run keeps its corruption (it lived only in memory and reset on quit)
  _corruption = DS._forestCorruptionSaved || 0;
  DS._forestCorruptionSaved = 0;
  updateCorruptionBar();
  if (_corruptionTimer) clearInterval(_corruptionTimer);
  _corruptionTimer = setInterval(function() {
    if (!DS.inCombat && isWhisperForest()) addCorruption(1, false);
  }, 8000);
}

function stopCorruptionSystem() {
  if (_corruptionTimer) clearInterval(_corruptionTimer);
  _corruptionTimer = null;
}

function addCorruption(amount, announce) {
  // The Shadow World's events (the Mirror, the Offering, the Two Doors) added
  // their corruption here, which does nothing outside the Whispering Forest.
  if (DS.dungeon === 'The Shadow World' && typeof addShadowCorruption === 'function') {
    addShadowCorruption(Math.max(1, Math.round(amount)), typeof announce === 'string' ? announce : 'The dungeon');
    return;
  }
  if (!isWhisperForest()) return;
  var prev = _corruption;
  _corruption = Math.min(100, _corruption + amount);
  updateCorruptionBar();
  if (prev < 50 && _corruption >= 50) { say('Warning. Corruption at 50 percent.'); }
  else if (prev < 75 && _corruption >= 75) { sfx('sfx-sanity-warning'); say('Danger. Corruption at 75 percent. Find the Music Box or use a potion.'); }
  else if (prev < 90 && _corruption >= 90) { sfx('sfx-sanity-critical'); say('WARNING. Corruption at 90 percent. You are almost lost.'); }
  if (_corruption >= 100) triggerCorruptionDeath();
}

function reduceCorruption(amount) {
  _corruption = Math.max(0, _corruption - amount);
  updateCorruptionBar();
}

function updateCorruptionBar() {
  var wrap = document.getElementById('corruption-bar-wrap');
  var bar = document.getElementById('corruption-bar');
  var label = document.getElementById('corruption-label');
  var pct = Math.round(_corruption);
  var showing = isWhisperForest();
  if (wrap) wrap.style.display = showing ? 'block' : 'none';
  if (label) label.style.display = showing ? 'block' : 'none';
  if (bar) {
    bar.style.width = pct + '%';
    var col = pct < 50 ? '#2d8a2d' : pct < 75 ? '#a07000' : '#8a0000';
    bar.style.background = 'linear-gradient(90deg,' + col + ',' + col + 'aa)';
  }
  if (label) label.textContent = pct + '%';
  if (wrap) { wrap.setAttribute('aria-valuenow', pct); wrap.setAttribute('aria-label','Corruption ' + pct + ' percent'); }
}

function triggerCorruptionDeath() {
  stopCorruptionSystem();
  // The meter stayed full, so every 8-second tick took another life
  _corruption = 0; updateCorruptionBar();
  DS.hp = 0;
  addLog('The corruption consumes you. The forest claims another soul.');
  say('Fully corrupted. The forest takes you. Death.');
  setTimeout(function(){ handleDeath(); }, 800);
}

// ── FUNCTION ALIASES & STUBS ──
// levelUp is an alias for checkLevelUp
function levelUp() {
  vibe(VIBE.levelUp);
  setTimeout(companionOnLevelUp, 800);
  setTimeout(function(){ showDungeonTip('first-levelup'); }, 1000); checkLevelUp(); }

// playerDead is an alias for handleDeath  
function playerDead() {
  onPlayerDeathCorruption(); // Add corruption on death if opted in
  handleDeath();
}

// saveRaidData is an alias for setRaidSave
function saveRaidData(o) { setRaidSave(o); }

// initKeyCommands is defined in keyboard section below

// applyCustomSpiritAbility — applies spirit ability effects in combat
function applyCustomSpiritAbility(abilityId, trigger) {
  if (!DS.activeSpirit || !DS.activeSpirit.isCustomBuilt) return 0;
  if (DS.activeSpirit.abilityId !== abilityId) return 0;
  var dmg = 0;
  var ab = DS.activeSpirit.abilityId;
  if (trigger === 'onKill') {
    if (ab === 'heal-kill') { DS.hp = Math.min(DS.maxHp, DS.hp+8); updatePlayerBar(); addLog('Spirit heals 8 HP.'); }
    if (ab === 'sp-kill') { DS.sp = Math.min(DS.maxSp||100, (DS.sp||0)+3); addLog('Spirit restores 3 SP.'); }
  }
  if (trigger === 'onAttack') {
    if (ab === 'bonus-dmg' && Math.random() < 0.20) { dmg = Math.round((DS.atk[0]+DS.atk[1])/2*0.5); addLog('Surge Strike! +' + dmg + ' bonus damage.'); }
    if (ab === 'instakill' && DS.enemy && DS.enemy.hp < DS.enemy.maxHp*0.2 && Math.random() < 0.10) { DS.enemy.hp = 0; addLog('Final Judgment! Enemy finished.'); say('Final Judgment!'); }
  }
  if (trigger === 'onCombatStart') {
    if (ab === 'poison-start') { DS.venomTurns = Math.max(DS.venomTurns||0, 3); addLog('Venom Aura — enemy poisoned.'); }
    if (ab === 'block') { DS._spiritBlockActive = true; }
  }
  return dmg;
}

// Time Descender — rare two-phase floor-6+ encounter (see version notes):
// defeat the Descender itself here, then survive The Clock (phase 2, handled
// by timeDescenderPhaseTwo()/timeDescenderClockHit() further down). These two
// were stub passthroughs to checkTimeDescender()/showTimeDescender() — neither
// function existed anywhere in the codebase, so rollTimeDescender() always
// returned false and the whole advertised encounter could never fire. Mirrors
// rollMedusaSpawn()/triggerMedusa()'s pattern immediately above it in the roll order.
function rollTimeDescender() {
  if (DS.timeDescenderEncounteredThisRun) return false;
  var inRaid = (typeof RD !== 'undefined' && RD.active);
  if (inRaid) return false;
  if (DS.floor < 6) return false;
  return Math.random() < 0.15;
}

function triggerTimeDescender() {
  DS.timeDescenderEncounteredThisRun = true;
  DS._inTimeDescenderFight = true;
  DS._timeDescenderPhase = 1;

  var hp = 70 + (DS.floor * 4);
  DS.enemy = {
    name: 'The Time Descender',
    icon: '⏳',
    hp: hp, maxHp: hp,
    atk: [14, 24],
    gold: [0, 0],
    isTimeDescender: true,
    phase: 1,
  };

  DS.inCombat = true;
  showDgPanels(false, true, false);
  document.getElementById('dg-combat-title').textContent = '⏳ ' + t('The Time Descender');
  document.getElementById('dg-enemy-icon').textContent = '⏳';
  document.getElementById('dg-enemy-name').textContent = t('The Time Descender');
  document.getElementById('dg-combat-log').innerHTML = '';
  updateEnemyBar(); updatePlayerBar();
  setCombatBtns(true);
  addLog('⏳ Time fractures. The Time Descender emerges, unbound by the dungeon\'s usual rules.');
  addRunLog('Encountered the Time Descender.', 'special');
  say('The Time Descender appears. A rare encounter. Defeat it to force its second phase, The Clock. Attack, heavy, defend, or flee.');
  setTimeout(function() { document.getElementById('cbtn-attack').focus(); }, 100);
}


// ── KEYBOARD COMMANDS ──
var _isDesktop = true;

function initKeyCommands() {
  document.addEventListener('keydown', function(e) {
    var dbg = document.getElementById('key-debug');

    var tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    var inInput = (tag === 'input' || tag === 'textarea' || tag === 'select');
    if (inInput) return;

    var key = e.key;
    var alt = e.altKey;
    var ctrlShift = e.ctrlKey && e.shiftKey;
    var dungeonEl = document.getElementById('screen-dungeon');
    var inDungeon = dungeonEl && dungeonEl.classList.contains('active');

    // ── ALT+PAGE UP/DOWN — master volume ──
    if (alt && key === 'PageUp') {
      e.preventDefault();
      var newVol = Math.min(1.0, (AUD.musicVol || 0.7) + 0.10);
      AUD.musicVol = newVol; AUD.sfxVol = newVol;
      Object.keys(AUD.tracks).forEach(function(k) { try { if (AUD.tracks[k]) AUD.tracks[k].volume = newVol; } catch(e2){} });
      if (AUD.musicGain) try { AUD.musicGain.gain.value = newVol; } catch(e2){}
      if (_customTrackAudio) try { _customTrackAudio.volume = newVol; } catch(e2){}
      var mv = document.getElementById('music-vol'); var sv = document.getElementById('sfx-vol');
      var mvv = document.getElementById('music-vol-val'); var svv = document.getElementById('sfx-vol-val');
      var pct = Math.round(newVol * 100);
      if (mv) mv.value = pct; if (sv) sv.value = pct;
      if (mvv) mvv.textContent = pct + '%'; if (svv) svv.textContent = pct + '%';
      say('Volume ' + pct + ' percent.'); return;
    }
    if (alt && key === 'PageDown') {
      e.preventDefault();
      var newVol2 = Math.max(0.0, (AUD.musicVol || 0.7) - 0.10);
      AUD.musicVol = newVol2; AUD.sfxVol = newVol2;
      Object.keys(AUD.tracks).forEach(function(k) { try { if (AUD.tracks[k]) AUD.tracks[k].volume = newVol2; } catch(e2){} });
      if (AUD.musicGain) try { AUD.musicGain.gain.value = newVol2; } catch(e2){}
      if (_customTrackAudio) try { _customTrackAudio.volume = newVol2; } catch(e2){}
      var mv2 = document.getElementById('music-vol'); var sv2 = document.getElementById('sfx-vol');
      var mvv2 = document.getElementById('music-vol-val'); var svv2 = document.getElementById('sfx-vol-val');
      var pct2 = Math.round(newVol2 * 100);
      if (mv2) mv2.value = pct2; if (sv2) sv2.value = pct2;
      if (mvv2) mvv2.textContent = pct2 + '%'; if (svv2) svv2.textContent = pct2 + '%';
      if (newVol2 === 0) say('Volume muted.'); else say('Volume ' + pct2 + ' percent.'); return;
    }

    // ── BACKSPACE — pause menu ──
    if (key === 'Backspace') {
      if (inDungeon) {
        e.preventDefault();
        if (_paused) { closePauseMenu(); } else { openPauseMenu(); }
        return;
      }
    }

    // ── ESCAPE — confirm quit ──
    if (key === 'Escape') {
      e.preventDefault();
      var escOv = document.getElementById('escape-confirm-overlay');
      if (escOv && escOv.style.display === 'flex') { closeEscapeConfirm(); say('Staying in dungeon.'); return; }
      var openOvs = document.querySelectorAll('.overlay.open, .ov-overlay.open, .settings-panel.open');
      if (openOvs.length > 0) { var last = openOvs[openOvs.length-1]; if (last) last.classList.remove('open'); say('Closed.'); return; }
      if (inDungeon && DS.inCombat) { say('Cannot leave during combat.'); return; }
      if (inDungeon) { showEscapeConfirmOverlay(); return; }
      goTo('menu'); say('Main menu.'); return;
    }

    // ── NAVIGATION (Ctrl+Shift) ──
    if (ctrlShift) {
      switch(key.toLowerCase()) {
        case 'h': e.preventDefault(); goTo('menu'); playTrack(getMenuTrack()); say('Main menu.'); break;
        case 'p': e.preventDefault(); goTo('charlist'); say('Character list.'); break;
        case 'b': e.preventDefault(); goTo('bestiary'); say('Bestiary.'); break;
        case 'q': e.preventDefault(); goTo('quests'); say('Quests.'); break;
        case 'e': e.preventDefault(); goTo('events'); say('Events.'); break;
        case 's': e.preventDefault(); openSettings(); say('Settings.'); break;
        case 'r': e.preventDefault(); goTo('highscore'); say('High score.'); break;
        case 'l': e.preventDefault(); goTo('chronicles'); say('Chronicles.'); break;
        case 'i':
          e.preventDefault();
          if (inDungeon) { try { toggleInv(); say('Inventory.'); } catch(e2){} } // openInventory() doesn't exist — toggleInv() is the real function, used everywhere else including the same shortcut elsewhere
          break;
        case 'k':
          e.preventDefault();
          try { openSpellBook(); say('Spell Book.'); } catch(e2){}
          break;
        case 'a':
          e.preventDefault();
          try { openArcaneShop(); say('Arcane Shop.'); } catch(e2){}
          break;
        case 'm':
          e.preventDefault();
          if (inDungeon) { try { openSeasonalShop(); say('Seasonal Shop.'); } catch(e2){} }
          break;
        case 'n':
          e.preventDefault();
          var menuEl = document.getElementById('screen-menu');
          if (menuEl && menuEl.classList.contains('active')) {
            goTo('charlist');
            setTimeout(function(){ var nb = document.getElementById('btn-new-char'); if (nb) { nb.click(); say('New character.'); } }, 200);
          }
          break;
      }
      return;
    }

    // ── ALT+ARROW — bestiary tabs ──
    if (alt && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      var bestiaryEl = document.getElementById('screen-bestiary');
      if (bestiaryEl && bestiaryEl.classList.contains('active')) {
        e.preventDefault();
        var filters = ['all','crypt','ash','frost','sunken','hollow','nightmare','elite','whisper'];
        var cur = window._bestiaryFilter || 'all';
        var idx = filters.indexOf(cur);
        if (key === 'ArrowRight') idx = (idx+1) % filters.length;
        else idx = (idx-1+filters.length) % filters.length;
        if (typeof filterBestiary === 'function') filterBestiary(filters[idx]);
        return;
      }
    }

    // ── ALT+1-9 — skills ──
    if (alt && inDungeon && key >= '1' && key <= '9') {
      e.preventDefault();
      var skillIdx = parseInt(key) - 1;
      var skills = DS.unlockedSkills || [];
      if (skillIdx >= skills.length) { say('No skill in slot ' + key + '.'); return; }
      var skillId = skills[skillIdx];
      var skillBtn = document.getElementById('skill-btn-' + skillId) || document.querySelector('[data-skill="' + skillId + '"]');
      if (skillBtn && !skillBtn.disabled) { skillBtn.click(); say('Skill ' + key + '.'); }
      else if (skillBtn && skillBtn.disabled) { say('Not enough SP.'); }
      else if (typeof useSkill === 'function') { useSkill(skillId); }
      return;
    }

    // ── ALT+key COMBAT ──
    if (alt && inDungeon && DS.inCombat && !_chimeraActive) {
      switch(key.toLowerCase()) {
        case 'a': e.preventDefault(); var atk=document.getElementById('cbtn-attack'); if(atk&&!atk.disabled){atk.click();say('Attack.');} break;
        case 'h': e.preventDefault(); var heavy=document.getElementById('cbtn-heavy'); if(heavy&&!heavy.disabled){heavy.click();say('Heavy strike.');} break;
        case 'd': e.preventDefault(); if(DS.runModNoDefend){say('Cannot defend in Berserk Mode.');return;} var def=document.getElementById('cbtn-defend'); if(def&&!def.disabled){def.click();say('Defend.');} break;
        case 'p': e.preventDefault(); var pot=document.getElementById('cbtn-potion'); if(pot&&!pot.disabled){pot.click();say('Potion.');} break;
        case 'f': e.preventDefault(); var flee=document.getElementById('cbtn-flee'); if(flee&&!flee.disabled){flee.click();say('Flee.');} break;
        case 'e': e.preventDefault(); var examine=document.getElementById('cbtn-examine'); if(examine&&!examine.disabled){examine.click();say('Examine.');} break;
        case 's': e.preventDefault(); var spellBtn=document.getElementById('cbtn-spells'); if(spellBtn&&!spellBtn.disabled){spellBtn.click();say('Spells.');} break;
        case '1': e.preventDefault(); var sk1=document.getElementById('cbtn-skill1'); if(sk1&&!sk1.disabled){sk1.click();say('Skill 1.');} break;
        case '2': e.preventDefault(); var sk2=document.getElementById('cbtn-skill2'); if(sk2&&!sk2.disabled){sk2.click();say('Skill 2.');} break;
        case '3': e.preventDefault(); var sk3=document.getElementById('cbtn-skill3'); if(sk3&&!sk3.disabled){sk3.click();say('Skill 3.');} break;
      }
      return;
    }

    // ── ALT+key BOSS RUSH ──
    var brEl = document.getElementById('screen-bossrush');
    var inBR = brEl && brEl.classList.contains('active');
    if (alt && inBR) {
      switch(key.toLowerCase()) {
        case 'a': e.preventDefault(); var bra=document.getElementById('brb-attack'); if(bra&&!bra.disabled){bra.click();say('Boss Rush attack.');} break;
        case 'h': e.preventDefault(); var brh=document.getElementById('brb-heavy'); if(brh&&!brh.disabled){brh.click();say('Boss Rush heavy strike.');} break;
        case 'd': e.preventDefault(); var brd=document.getElementById('brb-defend'); if(brd&&!brd.disabled){brd.click();say('Boss Rush defend.');} break;
        case 'p': e.preventDefault(); var brp=document.getElementById('brb-potion'); if(brp&&!brp.disabled){brp.click();say('Boss Rush potion.');} break;
      }
      return;
    }

    // ── ALT+key SPIRE ──
    var spireEl = document.getElementById('screen-spire-combat');
    var inSpire = spireEl && spireEl.classList.contains('active');
    if (alt && inSpire) {
      switch(key.toLowerCase()) {
        case 'a': e.preventDefault(); spireAttack('attack'); say('Spire attack.'); break;
        case 'h': e.preventDefault(); spireAttack('heavy'); say('Spire heavy strike.'); break;
        case 'd': e.preventDefault(); spireAttack('defend'); say('Spire defend.'); break;
        case 'p': e.preventDefault(); spireAttack('potion'); say('Spire potion.'); break;
        case 'r': e.preventDefault();
          if(SPIRE){ say('Floor ' + SPIRE.floor + '. HP ' + SPIRE.hp + ' of ' + SPIRE.maxHp + '. Gold ' + SPIRE.gold + '.'); }
          break;
      }
      return;
    }

    // ── ALT+key RAID ──
    var raidEl = document.getElementById('screen-raid');
    var inRaid = raidEl && raidEl.classList.contains('active');
    if (alt && inRaid) {
      switch(key.toLowerCase()) {
        case 'a': e.preventDefault(); var ra=document.querySelector('#screen-raid #cbtn-attack'); if(ra&&!ra.disabled){ra.click();say('Raid attack.');} break;
        case 'h': e.preventDefault(); var rh=document.querySelector('#screen-raid #cbtn-heavy'); if(rh&&!rh.disabled){rh.click();say('Raid heavy strike.');} break;
        case 'd': e.preventDefault(); var rd=document.querySelector('#screen-raid #cbtn-defend'); if(rd&&!rd.disabled){rd.click();say('Raid defend.');} break;
        case 'p': e.preventDefault(); var rp=document.querySelector('#screen-raid #cbtn-potion'); if(rp&&!rp.disabled){rp.click();say('Raid potion.');} break;
      }
      return;
    }

    // ── ALT+key EXPLORE ──
    if (alt && inDungeon && !DS.inCombat) {
      switch(key.toLowerCase()) {
        case 'n': e.preventDefault(); if(typeof enterRoom==='function'){enterRoom();say('Next room.');} break;
        case 'e': e.preventDefault(); if(typeof echoLocate==='function'){echoLocate();} break;
        case 'i': e.preventDefault(); toggleInv(); say('Inventory.'); break;
        case 's': e.preventDefault(); if(typeof manualSave==='function'){manualSave();} break;
        case 'k': e.preventDefault(); var sb2=document.getElementById('skill-book-btn'); if(sb2){sb2.click();say('Skill book.');} break;
        case 'c': e.preventDefault(); if(typeof showStats==='function'){showStats();say('Character stats.');} break;
        case 'r': e.preventDefault();
          var floor=DS.floor||1,kills=DS.kills||0,gold=DS.gold||0,hp=DS.hp||0,maxHp=DS.maxHp||100;
          say('Floor '+floor+'. Kills '+kills+'. Gold '+gold+'. HP '+hp+' of '+maxHp+'.');
          break;
      }
    }
  });
  setTimeout(function(){
    say('Keyboard commands enabled. See Help for full list.');
  }, 6000); // After loading screen finishes (5s) + buffer
}


function loadHighScore() {
  try { renderHighScore(); } catch(e) { console.error('renderHighScore failed:', e); }
  try { switchHSTab('score'); } catch(e) { console.error('switchHSTab failed:', e); }
  // Try loading from cloud if signed in
  try {
    if (getFirebaseUser && getFirebaseUser() && window._fbDb) {
      window._fbDb.collection('scores').doc(getFirebaseUser().uid).get().then(function(doc) {
        if (doc && doc.exists && doc.data && doc.data().total) {
          var cloudTotal = doc.data().total;
          var localData = getScoreData();
          if (cloudTotal > (localData.total || 0)) {
            DDStore.setItem('dd_score', JSON.stringify(doc.data()));
            try { renderHighScore(); } catch(e2) {}
            say('Cloud score loaded.');
          }
        }
      }).catch(function(e){ console.warn('Score cloud load error:', e); });
    }
  } catch(e) { console.warn('Score cloud error:', e); }
}


