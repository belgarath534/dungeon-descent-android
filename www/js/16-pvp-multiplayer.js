// ═══════════════════════════════════════════════════════
// PVP MULTIPLAYER — Firebase Realtime Database
// ═══════════════════════════════════════════════════════

var _mpRoomCode = null;
var _mpSelectedChar = null;
var _mpMyTurn = false;
var _mpConnected = false;
var _mpCurrentTrack = null;
var _mpMyId = null;
var _mpRoomRef = null;
var _mpRoomListener = null;
var _mpRole = null; // 'p1' or 'p2'

function mpGenId() {
  return Math.random().toString(36).substr(2, 8);
}

function mpGenRoomCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function mpUpdateTrack(track) {
  if (track && track !== _mpCurrentTrack) {
    _mpCurrentTrack = track;
    playTrack(track);
  }
}

function goToMultiplayer() {
  if (!window._fbRtdb) {
    mpSetStatus('Multiplayer unavailable. Firebase not connected.');
    say('Multiplayer unavailable. Firebase not connected.');
    return;
  }
  _mpConnected = true;
  if (!_mpMyId) _mpMyId = mpGenId();
  mpSetStatus('Connected. Select a character to begin.');
  mpRenderCharList();
}

function mpRenderCharList() {
  var list = document.getElementById('mp-char-list');
  if (!list) return;
  list.innerHTML = '';
  if (!CHARS || CHARS.length === 0) {
    list.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:rgba(255,255,255,0.4);">No characters found. Create one in solo mode first.</div>';
    return;
  }
  CHARS.forEach(function(ch) {
    if (ch.deleted) return;
    var btn = document.createElement('button');
    btn.className = 'btn-ghost';
    btn.style.cssText = 'text-align:left;font-size:0.7rem;padding:10px 14px;';
    btn.textContent = ch.name + ' — ' + ch.race + ' ' + ch.cls + ' · Lv ' + (ch.level||1) + ' · HP ' + (ch.maxHp||100);
    btn.setAttribute('aria-label', 'Select ' + ch.name + ' for PVP battle');
    btn.onclick = function() { mpSelectChar(ch); };
    list.appendChild(btn);
  });
}

function mpSelectChar(ch) {
  _mpSelectedChar = ch;
  var display = document.getElementById('mp-selected-char');
  if (display) {
    display.style.display = 'block';
    display.textContent = '✓ ' + ch.name + ' · ' + ch.race + ' ' + ch.cls + ' · Lv ' + (ch.level||1) + ' · HP ' + (ch.maxHp||100);
  }
  document.getElementById('mp-create-btn').disabled = false;
  document.getElementById('mp-join-btn').disabled = false;
  sfx('sfx-select');
  say(ch.name + ' selected. Create a room or join a friend.');
}

function mpGetCharData(ch) {
  if (!ch) return null;
  var atkRange = ATK_MAP[ch.cls] || [6,12];
  var baseAtk = Math.floor((atkRange[0] + atkRange[1]) / 2);
  return {
    name: ch.name || 'Warrior',
    cls: ch.cls || '',
    race: ch.race || '',
    level: ch.level || 1,
    maxHp: HP_MAP[ch.cls] || ch.maxHp || 100,
    hp: HP_MAP[ch.cls] || ch.maxHp || 100,
    maxSp: ch.maxSp || 20,
    sp: ch.maxSp || 20,
    atk: baseAtk,
    def: DEF_MAP[ch.cls] || 0,
    alive: true,
    defending: false,
    dungeon: ch.dungeon || 'Crypt of Malachar'
  };
}

function mpCreateRoom() {
  if (!_mpSelectedChar) { mpSetStatus('Select a character first.'); return; }
  var code = mpGenRoomCode();
  _mpRoomCode = code;
  _mpRole = 'p1';
  var charData = mpGetCharData(_mpSelectedChar);

  var roomData = {
    code: code,
    status: 'waiting',
    p1: { id: _mpMyId, char: charData, ready: false },
    p2: null,
    turn: null,
    action: null,
    createdAt: Date.now()
  };

  var ref = window._fbRtdb.ref('pvp_rooms/' + code);
  ref.set(roomData).then(function() {
    _mpRoomRef = ref;
    var codeDisplay = document.getElementById('mp-room-code-display');
    var codeEl = document.getElementById('mp-room-code');
    if (codeDisplay) codeDisplay.style.display = 'block';
    if (codeEl) codeEl.textContent = code;
    var readyBtn = document.getElementById('mp-ready-btn');
    if (readyBtn) readyBtn.style.display = 'block';
    mpSetStatus('Room created! Share code ' + code + ' with your opponent. Then both press Ready.');
    say('Room created. Your code is ' + code.split('').join(' ') + '. Share it with your opponent. Then both press Ready.');
    sfx('sfx-confirm');
    mpListenToRoom(code);

    // Auto-delete room after 10 minutes if unused
    setTimeout(function() {
      ref.once('value').then(function(snap) {
        if (snap.exists() && snap.val().status === 'waiting') ref.remove();
      }).catch(function(){});
    }, 600000);
  }).catch(function(err) {
    mpSetStatus('Failed to create room. Check your connection.');
    console.error('[PVP] Create room failed:', err);
  });
}

function mpJoinRoom() {
  if (!_mpSelectedChar) { mpSetStatus('Select a character first.'); return; }
  var input = document.getElementById('mp-code-input');
  var code = input ? input.value.trim().toUpperCase() : '';
  if (code.length !== 4) { mpSetStatus('Enter a valid 4 character room code.'); return; }

  var ref = window._fbRtdb.ref('pvp_rooms/' + code);
  ref.once('value').then(function(snap) {
    if (!snap.exists()) { mpSetStatus('Room not found. Check the code and try again.'); return; }
    var room = snap.val();
    if (room.status !== 'waiting') { mpSetStatus('Room is already full or in progress.'); return; }
    if (room.p2) { mpSetStatus('Room is already full.'); return; }

    _mpRoomCode = code;
    _mpRole = 'p2';
    _mpRoomRef = ref;

    var charData = mpGetCharData(_mpSelectedChar);
    ref.child('p2').set({ id: _mpMyId, char: charData, ready: false });
    ref.child('status').set('full');

    var readyBtn = document.getElementById('mp-ready-btn');
    if (readyBtn) readyBtn.style.display = 'block';
    mpSetStatus('Joined room ' + code + '! Press Ready when prepared to fight!');
    say('Joined room ' + code + '. Press Ready when prepared to fight.');
    sfx('sfx-confirm');
    mpListenToRoom(code);
  }).catch(function(err) {
    mpSetStatus('Failed to join room. Check your connection.');
    console.error('[PVP] Join room failed:', err);
  });
}

var _mpAnnouncedJoin = false;
function mpListenToRoom(code) {
  _mpAnnouncedJoin = false;
  if (_mpRoomListener) {
    try { window._fbRtdb.ref('pvp_rooms/' + (_mpRoomCode || code)).off('value', _mpRoomListener); } catch(e) {}
  }
  _mpRoomListener = window._fbRtdb.ref('pvp_rooms/' + code).on('value', function(snap) {
    if (!snap.exists()) {
      mpSetStatus('Room no longer exists.');
      return;
    }
    var room = snap.val();
    mpHandleRoomUpdate(room);
  });
}

function mpHandleRoomUpdate(room) {
  // Opponent joined notification
  if (room.status === 'full' && room.p1 && room.p2) {
    var opponentChar = _mpRole === 'p1' ? room.p2.char : room.p1.char;
    if (opponentChar) {
      var playersDisplay = document.getElementById('mp-players-display');
      if (playersDisplay) playersDisplay.style.display = 'block';
      mpRenderPlayers([
        Object.assign({}, _mpRole === 'p1' ? room.p1.char : room.p2.char, {isMe: true}),
        Object.assign({}, opponentChar, {isMe: false})
      ]);
    }
  }

  // Both ready — start battle
  if (room.status === 'full' && room.p1 && room.p2 && room.p1.ready && room.p2.ready && !room.battleStarted) {
    // Only p1 initiates the battle start to avoid race condition
    if (_mpRole === 'p1') {
      var firstTurn = Math.random() < 0.5 ? room.p1.id : room.p2.id;
      window._fbRtdb.ref('pvp_rooms/' + _mpRoomCode).update({
        battleStarted: true,
        turn: firstTurn,
        log: ['⚔️ The battle begins!'],
        p1: Object.assign({}, room.p1.char, {id: room.p1.id, ready: true}),
        p2: Object.assign({}, room.p2.char, {id: room.p2.id, ready: true})
      });
    }
    return;
  }

  // Battle in progress
  if (room.battleStarted) {
    mpShowBattleUI(room);
  }

  // Handle action
  if (room.pendingAction && room.pendingAction.actorId !== _mpMyId) {
    mpProcessOpponentAction(room);
  }

  // Battle over
  if (room.status === 'over') {
    mpHandleBattleOver(room);
    return;
  }

  // Rematch reset — battleStarted went back to false after a battle was over.
  // (An opponent joining for the first time also looks like this; only a room
  // with a rematch log is a rematch.)
  var _isRematch = room.log && JSON.stringify(room.log).indexOf('Rematch requested') !== -1;
  if (!room.battleStarted && room.status === 'full' && !_isRematch && room.p1 && room.p2) {
    if (!_mpAnnouncedJoin) { _mpAnnouncedJoin = true; mpSetStatus('Your opponent has joined! Press Ready when prepared to fight.'); say('Your opponent has joined. Press Ready when you are prepared to fight.'); }
    return;
  }
  if (!room.battleStarted && room.status === 'full') {
    var rematch = document.getElementById('mp-rematch-section');
    var actions = document.getElementById('mp-combat-actions');
    var readyBtn = document.getElementById('mp-ready-btn');
    var logEl = document.getElementById('mp-log-lines');
    if (rematch) rematch.style.display = 'none';
    if (actions) actions.style.display = 'none';
    if (readyBtn) { readyBtn.style.display = 'block'; readyBtn.disabled = false; readyBtn.textContent = '⚔️ Ready — FIGHT!'; readyBtn.focus(); }
    if (logEl && room.log) {
      var entries = Array.isArray(room.log) ? room.log : Object.values(room.log);
      logEl.innerHTML = entries.map(function(l) { return '<div tabindex="0">' + l + '</div>'; }).join('');
    }
    _mpMyTurn = false;
    mpSetStatus('Rematch! Press Ready when prepared to fight again.');
    say('Your opponent wants a rematch! Press the Ready button when you are prepared to fight again.');
    return;
  }
}

function mpReady() {
  if (!_mpRoomCode || !_mpRole) { say('Not in a room.'); return; }
  var btn = document.getElementById('mp-ready-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Waiting for opponent...'; }
  window._fbRtdb.ref('pvp_rooms/' + _mpRoomCode + '/' + _mpRole + '/ready').set(true);
  mpSetStatus('Ready! Waiting for opponent...');
  sfx('sfx-confirm');
}

function mpShowBattleUI(room) {
  var toHide = ['mp-char-section','mp-selected-char','mp-room-section','mp-room-code-display','mp-ready-btn'];
  toHide.forEach(function(id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; });

  var log = document.getElementById('mp-combat-log');
  var actions = document.getElementById('mp-combat-actions');
  var playersDisplay = document.getElementById('mp-players-display');
  if (log) log.style.display = 'block';
  if (actions) { actions.style.display = 'flex'; actions.style.flexDirection = 'column'; }
  if (playersDisplay) playersDisplay.style.display = 'block';

  // Switch to battle music on first battle start
  try { mpUpdateTrack('boss'); } catch(e) {}
  if (room.p1 && room.p2) {
    var me = _mpRole === 'p1' ? room.p1 : room.p2;
    var opponent = _mpRole === 'p1' ? room.p2 : room.p1;
    mpRenderPlayers([
      Object.assign({}, me, {isMe: true}),
      Object.assign({}, opponent, {isMe: false})
    ]);
  }

  // Render log
  if (room.log) {
    var logEl = document.getElementById('mp-log-lines');
    if (logEl) {
      var entries = Array.isArray(room.log) ? room.log : Object.values(room.log);
      logEl.innerHTML = entries.map(function(l) {
        return '<div tabindex="0">' + l + '</div>';
      }).join('');
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  // Set turn
  var isMyTurn = room.turn === _mpMyId;
  mpSetMyTurn(isMyTurn);
}

function mpAction(action) {
  if (!_mpMyTurn) { mpSetStatus('Not your turn!'); sfx('sfx-select'); return; }
  if (!_mpRoomCode) return;

  var ref = window._fbRtdb.ref('pvp_rooms/' + _mpRoomCode);
  ref.once('value').then(function(snap) {
    if (!snap.exists()) return;
    var room = snap.val();
    var me = _mpRole === 'p1' ? room.p1 : room.p2;
    var opponent = _mpRole === 'p1' ? room.p2 : room.p1;
    if (!me || !opponent) return;

    var atkRange = ATK_MAP[_mpSelectedChar.cls] || [6,12];
    var dmg = Math.floor(Math.random() * (atkRange[1] - atkRange[0] + 1)) + atkRange[0];
    var logMsg = '';

    if (action === 'attack') {
      var finalDmg = opponent.defending ? Math.floor(dmg * 0.4) : dmg;
      opponent.hp = Math.max(0, (opponent.hp || 0) - finalDmg);
      logMsg = '⚔️ ' + me.name + ' attacks for ' + finalDmg + ' damage!' + (opponent.defending ? ' (blocked!)' : '');
    } else if (action === 'heavy') {
      var heavyDmg = Math.floor(dmg * 1.8);
      var finalHeavy = opponent.defending ? Math.floor(heavyDmg * 0.4) : heavyDmg;
      opponent.hp = Math.max(0, (opponent.hp || 0) - finalHeavy);
      logMsg = '💥 ' + me.name + ' heavy strikes for ' + finalHeavy + '!';
    } else if (action === 'defend') {
      me.defending = true;
      logMsg = '🛡️ ' + me.name + ' braces for the next hit.';
    } else if (action === 'skill') {
      // (skills could be used with 0 SP)
      if ((me.sp || 0) < 5) { mpSetStatus('Not enough SP for a skill — you need 5.'); say('Not enough SP. Skills cost 5 SP.'); return; }
      var skillDmg = Math.floor(dmg * 2.0);
      var finalSkill = opponent.defending ? Math.floor(skillDmg * 0.4) : skillDmg;
      opponent.hp = Math.max(0, (opponent.hp || 0) - finalSkill);
      me.sp = Math.max(0, (me.sp || 0) - 5);
      logMsg = '✨ ' + me.name + ' uses a skill for ' + finalSkill + ' damage!';
    } else if (action === 'taunt') {
      logMsg = '😤 ' + me.name + ' taunts: "You have been defeated!"';
    }

    // Reset defend after taking action (not on defend itself)
    if (action !== 'defend') me.defending = false;
    // Reset opponent defend after they get hit
    if (action !== 'defend') opponent.defending = false;

    // Check if opponent died
    var updates = {};
    var opKey = _mpRole === 'p1' ? 'p2' : 'p1';
    var myKey = _mpRole === 'p1' ? 'p1' : 'p2';
    updates[opKey] = opponent;
    updates[myKey] = me;

    // Add to log
    var currentLog = room.log ? (Array.isArray(room.log) ? room.log : Object.values(room.log)) : [];
    currentLog.push(logMsg);
    if (currentLog.length > 30) currentLog = currentLog.slice(-30);
    updates['log'] = currentLog;

    if (opponent.hp <= 0) {
      opponent.alive = false;
      updates[opKey] = opponent;
      updates['status'] = 'over';
      updates['winnerId'] = _mpMyId;
      updates['winnerName'] = me.name;
      updates['loserName'] = opponent.name;
      currentLog.push('💀 ' + opponent.name + ' has been defeated!');
      updates['log'] = currentLog;
    } else {
      // Switch turns
      updates['turn'] = opponent.id;
    }

    ref.update(updates);
    mpSetMyTurn(false);
    sfx(action === 'attack' ? 'sfx-attack' : action === 'heavy' ? 'sfx-heavy-hit' : action === 'skill' ? 'sfx-crit' : 'sfx-select');
  }).catch(function(err) {
    // No .catch() existed here at all — a failed read (network hiccup,
    // permission error) meant the action vanished with no feedback:
    // mpSetMyTurn(false) never ran, so the UI kept showing "YOUR TURN" and
    // enabled attack buttons even though nothing had actually happened,
    // with the player having no idea their action failed.
    console.error('[PVP] action failed:', err);
    mpSetStatus('Action failed — check your connection and try again.');
  });
}

function mpProcessOpponentAction(room) {
  // Opponent acted — just update UI, the listener handles the rest
  if (room.pendingAction) {
    mpLog('💬 ' + (room.pendingAction.log || ''));
    // Clear pending action so we don't process it again
    window._fbRtdb.ref('pvp_rooms/' + _mpRoomCode + '/pendingAction').remove();
  }
}

function mpHandleBattleOver(room) {
  var rematch = document.getElementById('mp-rematch-section');
  var actions = document.getElementById('mp-combat-actions');
  if (actions) actions.style.display = 'none';
  if (rematch) rematch.style.display = 'block';

  // When your opponent leaves mid-battle you win (you were told you lost)
  var isWinner = room.winnerId === _mpMyId || (room.opponentLeft && room.leftId !== _mpMyId && !room.winnerId);
  if (room.opponentLeft && isWinner && !room.winnerId) room.loserName = room.loserName || 'Your opponent, who left';
  if (isWinner) {
    mpSetStatus('🏆 YOU WIN! ' + (room.loserName || 'Your opponent') + ' has been defeated!');
    sfx('sfx-victory');
    say('Victory! You defeated ' + (room.loserName || 'your opponent') + '! You have been... the defeater.');
  } else {
    mpSetStatus('💀 You have been defeated by ' + (room.winnerName || 'your opponent') + '...');
    sfx('sfx-gameover');
    say('Defeated. ' + (room.winnerName || 'Your opponent') + ' wins. You have been defeated.');
  }
}

function mpEmote(emote) {
  if (!_mpRoomCode) return;
  var emoteMap = { gg:'GG! Well played.', nice:'Nice one!', lets_go:"Let's go!", defeated:'You have been defeated! 😂' };
  var msg = emoteMap[emote] || emote;
  var ref = window._fbRtdb.ref('pvp_rooms/' + _mpRoomCode + '/log');
  ref.once('value').then(function(snap) {
    var log = snap.val() ? (Array.isArray(snap.val()) ? snap.val() : Object.values(snap.val())) : [];
    var charData = mpGetCharData(_mpSelectedChar);
    log.push('💬 ' + (charData ? charData.name : 'Player') + ': ' + msg);
    ref.set(log);
  }).catch(function(err) { console.error('[PVP] emote failed:', err); });
  sfx('sfx-select');
}

function mpRematch() {
  if (!_mpRoomCode || !_mpRoomRef) return;
  // A battle in progress flattens room.p1/p2 from {id, char:{...}, ready}
  // down to the stats merged directly onto the entry (see the "both ready —
  // start battle" branch in mpHandleRoomUpdate). This used to only reset
  // the PRESSER's own slot back to the pre-battle shape — the opponent's
  // slot, and their stale ready:true from the finished battle, was left
  // untouched. The very next "both ready" check could then fire again using
  // Object.assign({}, room[role].char, ...) against an opponent entry that
  // no longer HAD a .char property at all, filling their stats with
  // undefined and effectively breaking the room for good — matching
  // "rematch doesn't start a new one, only a refresh fixes it."
  _mpRoomRef.once('value').then(function(snap) {
    if (!snap.exists()) return;
    var room = snap.val();
    var oppRole = _mpRole === 'p1' ? 'p2' : 'p1';
    var oppEntry = room[oppRole];
    var oppChar = oppEntry ? (oppEntry.char || oppEntry) : null;
    var updates = {};
    updates[_mpRole] = { id: _mpMyId, char: mpGetCharData(_mpSelectedChar), ready: false };
    if (oppEntry && oppChar) {
      updates[oppRole] = {
        id: oppEntry.id,
        char: Object.assign({}, oppChar, { hp: oppChar.maxHp, sp: oppChar.maxSp, alive: true, defending: false }),
        ready: false
      };
    }
    updates['status'] = 'full';
    updates['battleStarted'] = false;
    updates['turn'] = null;
    updates['log'] = ['🔄 Rematch requested! Both players press Ready to begin.'];
    updates['winnerId'] = null;
    updates['winnerName'] = null;
    updates['loserName'] = null;
    _mpRoomRef.update(updates);
  }).catch(function(err) { console.error('[PVP] rematch failed:', err); });

  // Reset UI fully — hide combat, show ready button
  var rematch = document.getElementById('mp-rematch-section');
  var actions = document.getElementById('mp-combat-actions');
  var readyBtn = document.getElementById('mp-ready-btn');
  var logEl = document.getElementById('mp-log-lines');
  if (rematch) rematch.style.display = 'none';
  if (actions) actions.style.display = 'none';
  if (readyBtn) { readyBtn.style.display = 'block'; readyBtn.disabled = false; readyBtn.textContent = '⚔️ Ready — FIGHT!'; readyBtn.focus(); }
  if (logEl) logEl.innerHTML = '<div tabindex="0">🔄 Rematch! Both players press Ready to begin.</div>';
  _mpMyTurn = false;
  mpSetStatus('Rematch! Press Ready when prepared to fight again.');
  say('Rematch! The Ready button is now available. Press it when you are prepared to fight again.');
  sfx('sfx-confirm');
}

function mpSetMyTurn(isMine) {
  _mpMyTurn = isMine;
  var indicator = document.getElementById('mp-turn-indicator');
  var actions = ['mp-attack-btn','mp-heavy-btn','mp-skill-btn','mp-defend-btn','mp-taunt-btn'];
  if (indicator) indicator.textContent = isMine ? '⚔️ YOUR TURN' : '⏳ Opponent turn...';
  actions.forEach(function(id) {
    var btn = document.getElementById(id);
    if (btn) btn.disabled = !isMine;
  });
  if (isMine) say('Your turn! Attack, Heavy Attack, Skill, Defend or Taunt.');
}

function mpSetStatus(msg) {
  var el = document.getElementById('mp-status');
  if (el) { el.textContent = msg; }
  say(msg);
}

function mpLog(msg) {
  var el = document.getElementById('mp-log-lines');
  if (!el) return;
  var line = document.createElement('div');
  line.textContent = msg;
  line.setAttribute('tabindex','0');
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function mpRenderPlayers(players) {
  var list = document.getElementById('mp-players-list');
  var display = document.getElementById('mp-players-display');
  if (!list || !players || players.length === 0) return;
  if (display) display.style.display = 'block';
  list.innerHTML = '';
  players.forEach(function(p) {
    var hpPct = Math.round(((p.hp || 0) / (p.maxHp || 100)) * 100);
    var barColor = hpPct > 50 ? '#44aa44' : hpPct > 25 ? '#aaaa44' : '#cc4444';
    var div = document.createElement('div');
    div.style.cssText = 'font-family:Cinzel,serif;font-size:0.65rem;padding:10px 12px;border:1px solid ' + (p.alive !== false ? '#333' : '#cc444466') + ';margin-bottom:4px;';
    div.setAttribute('tabindex','0');
    div.setAttribute('aria-label', (p.name||'Player') + ' HP ' + (p.hp||0) + ' of ' + (p.maxHp||100) + (p.isMe ? ' (you)' : ' (opponent)') + (p.defending ? ' defending' : ''));
    div.innerHTML =
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">' +
      '<span style="color:' + (p.alive !== false ? (p.isMe ? '#c8a832' : '#88aacc') : '#cc4444') + ';">' +
      (p.alive !== false ? '⚔️' : '💀') + ' ' + (p.name||'Player') + ' · ' + (p.cls||'') + (p.isMe ? ' (you)' : '') + (p.defending ? ' 🛡️' : '') + '</span>' +
      '<span style="color:#888;">' + (p.hp||0) + '/' + (p.maxHp||100) + ' HP</span>' +
      '</div>' +
      '<div style="height:4px;background:#111;border-radius:2px;">' +
      '<div style="height:4px;background:' + barColor + ';width:' + hpPct + '%;border-radius:2px;transition:width 0.3s;"></div>' +
      '</div>';
    list.appendChild(div);
  });
}

function mpLeave() {
  // Clean up room if we're the only one
  if (_mpRoomCode && _mpRoomRef) {
    window._fbRtdb.ref('pvp_rooms/' + _mpRoomCode).once('value').then(function(snap) {
      if (snap.exists()) {
        var room = snap.val();
        if (!room.battleStarted || room.status === 'over') {
          _mpRoomRef.remove().catch(function(){});
        } else {
          // Notify opponent we left
          _mpRoomRef.update({ status: 'over', opponentLeft: true, leftId: _mpMyId }).catch(function(){});
        }
      }
    }).catch(function(){});
  }
  // Clean up listener
  if (_mpRoomListener && _mpRoomCode) {
    try { window._fbRtdb.ref('pvp_rooms/' + _mpRoomCode).off('value', _mpRoomListener); } catch(e) {}
    _mpRoomListener = null;
  }
  _mpRoomCode = null;
  _mpSelectedChar = null;
  _mpMyTurn = false;
  _mpCurrentTrack = null;
  _mpRole = null;
  _mpRoomRef = null;
  playTrack(getMenuTrack());
  goTo('menu');
  sfx('sfx-select');
}

// ═══════════════════════════════════════════════════════
// HIDE AND SEEK — single player (BETA)
// Standalone mode — deliberately not built on DS/Hunter Mode, which are
// dungeon-run specific.
// ═══════════════════════════════════════════════════════
var HS = null;
var HS_EXPLORE_TRACK = 'hideseek-explore'; // "Tense Horror Music for Game" — Gustavo_Alivera (CC-BY)
var HS_CHASE_TRACK = 'hideseek-chase';     // "The Chase.wav" — joshuaempyre (CC-BY)
var HS_CHASE_THRESHOLD = 4; // distance at or below this switches to chase music
var HS_GRID_SIZE = 7; // 0-6 both axes — real 2D chase, not an abstract counter
var HS_ROOM_DESCS = [
  'A narrow hallway stretches ahead. The air is cold.',
  'You pass a door hanging off one hinge.',
  'Something scratches at the walls, far off.',
  'The floorboards creak with every step. You wince.',
  'A broken window lets in a sliver of moonlight.',
  'You hear breathing that is not yours.',
  'Dust hangs in the air, undisturbed until now.',
  'A hallway splits ahead. You pick one at random.',
  'Something moved, just at the edge of your hearing.',
  'The silence presses in on you.',
  'A chair lies on its side. You do not remember knocking it over.',
  'The walls narrow here. There is not much room to run.'
];

var HS_HIDE_ITEMS = [
  { name: 'Torn Curtain', icon: '🧥', desc: 'Something to pull over yourself.' },
  { name: 'Loose Floorboard', icon: '🪵', desc: 'A gap just big enough to slip into.' },
  { name: 'Old Coat Closet', icon: '🚪', desc: 'Cracked open. Room for one.' }
];

// A few far-from-start points to open on, for variety
var HS_MONSTER_STARTS = [
  { x: HS_GRID_SIZE - 1, y: 0 },
  { x: 0, y: HS_GRID_SIZE - 1 },
  { x: HS_GRID_SIZE - 1, y: HS_GRID_SIZE - 1 },
  { x: HS_GRID_SIZE - 1, y: Math.floor(HS_GRID_SIZE / 2) },
  { x: Math.floor(HS_GRID_SIZE / 2), y: HS_GRID_SIZE - 1 }
];

function hsNewState() {
  var m = HS_MONSTER_STARTS[Math.floor(Math.random() * HS_MONSTER_STARTS.length)];
  return {
    active: true,
    moves: 0,
    px: 0, py: 0,                 // you
    ex: HS_GRID_SIZE - 1, ey: HS_GRID_SIZE - 1, // the exit
    mx: m.x, my: m.y,             // it
    phase: 1,                     // 1 = quiet, 2 = chase music
    hideCooldown: 0,
    hidSuccessPending: false,     // your last Hide worked — skip its next move
    items: 0,                     // hiding spots found along the way
    moveLocked: false             // waiting out its footstep beat — far away only
  };
}

// Real chase distance/direction on the grid — not RNG. Every unhidden move
// it takes closes the gap on whichever axis is further, same model as the
// proven Stalker Floor mechanic (getStalkerDistance/getStalkerDirection).
// True while either a solo run or an active multiplayer run is in progress —
// the growl/footstep audio pipeline below is shared between both modes, so
// it checks this instead of the solo-only `HS` object directly.
function _hsIsActive() {
  return !!((HS && HS.active) || (_hsMP && _hsMP.active));
}
function hsDistance() {
  if (_hsMP && _hsMP.active) {
    var me = _hsMpMyPlayer(), mo = _hsMpMonster();
    if (!me || !mo) return 99;
    return Math.abs(me.x - mo.x) + Math.abs(me.y - mo.y);
  }
  if (!HS) return 99;
  return Math.abs(HS.px - HS.mx) + Math.abs(HS.py - HS.my);
}
function hsDirection() {
  if (_hsMP && _hsMP.active) {
    var me = _hsMpMyPlayer(), mo = _hsMpMonster();
    if (!me || !mo) return 'here';
    var mdx = mo.x - me.x, mdy = mo.y - me.y;
    if (mdx === 0 && mdy === 0) return 'here';
    if (Math.abs(mdx) >= Math.abs(mdy)) return mdx > 0 ? 'right' : 'left';
    return mdy > 0 ? 'ahead' : 'behind';
  }
  var dx = HS.mx - HS.px, dy = HS.my - HS.py;
  if (dx === 0 && dy === 0) return 'here';
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'ahead' : 'behind';
}
function hsMonsterAdvance() {
  var dx = HS.px - HS.mx, dy = HS.py - HS.my;
  if (dx === 0 && dy === 0) return;
  if (Math.abs(dx) >= Math.abs(dy)) HS.mx += dx > 0 ? 1 : -1;
  else HS.my += dy > 0 ? 1 : -1;
}

function hsStart() {
  if (_hsMP) { hsMpTeardown(); }
  HS = hsNewState();
  document.getElementById('hs-intro').style.display = 'none';
  document.getElementById('hs-mp-lobby').style.display = 'none';
  document.getElementById('hs-end').style.display = 'none';
  document.getElementById('hs-mp-end-results').style.display = 'none';
  document.getElementById('hs-mp-party-status').style.display = 'none';
  document.getElementById('hs-end-retry-btn').onclick = hsStart;
  document.getElementById('hs-play').style.display = 'block';
  var ev = document.getElementById('hs-event');
  ev.style.display = 'none'; ev.textContent = '';
  document.getElementById('hs-room-desc').textContent = 'You stand still, listening.';
  goTo('hideseek');
  hsSetMoveButtonsEnabled(true); // reset in case a prior run left them locked mid-wait
  hsUpdateUI();
  playTrack(HS_EXPLORE_TRACK);
  sfx('sfx-select');
  say('Hide and Seek begins. Something is in here with you — the Darkness Swallower. Find the way out before it finds you. Use North, South, East, or West to move, or Hide to try to lose it. Use headphones — you can hear which direction it is in.');
  setTimeout(function() { hsStartGrowlLoop(); }, 1500);
  initHS3DView();
}

function hsLeave() {
  hsStopGrowlLoop();
  _stopHS3DLoop();
  if (_hsMP) hsMpTeardown();
  var v3 = document.getElementById('hs-3d-view');
  if (v3) v3.style.display = 'none';
  HS = null;
  playTrack(getMenuTrack());
  goTo('menu');
  sfx('sfx-select');
}

function hsUpdateUI() {
  if (!HS) return;
  document.getElementById('hs-progress').textContent = 'Move ' + HS.moves;
  var dist = hsDistance();
  var badge = document.getElementById('hs-distance-badge');
  badge.textContent = dist + (dist === 1 ? ' room away' : ' rooms away');
  badge.style.borderColor = HS.phase === 2 ? '#cc3333' : '#663333';
  badge.style.color = HS.phase === 2 ? '#ff8888' : '#cc8888';
  var itemsBadge = document.getElementById('hs-items-badge');
  if (HS.items > 0) {
    itemsBadge.style.display = '';
    itemsBadge.textContent = '🫥 ' + HS.items;
  } else {
    itemsBadge.style.display = 'none';
  }
}

function hsCheckPhase() {
  if (!HS) return;
  var wantPhase = hsDistance() <= HS_CHASE_THRESHOLD ? 2 : 1;
  if (wantPhase !== HS.phase) {
    HS.phase = wantPhase;
    playTrack(wantPhase === 2 ? HS_CHASE_TRACK : HS_EXPLORE_TRACK);
  }
}

function hsAnnounceDistance(dist) {
  if (!HS) return;
  var msgs = { 6: 'You can hear it somewhere behind you.',
    4: 'It is getting closer. You should move faster.',
    2: 'It is right behind you. Hide, or run.',
    1: 'It is almost on you.' };
  if (msgs[dist]) say(msgs[dist]);
}

// ── SPATIAL GROWL — Darkness Swallower, same technique as Stalker Floor's
// startGrowlLoop/updateGrowlPosition (real StereoPannerNode panning, works on
// iOS with headphones), namespaced separately so it never touches Stalker's
// own state. This is the real signal: which direction it's in, and how close.
var _hsGrowlGain = null, _hsGrowlPanner = null, _hsGrowlSource = null;

function hsApplyGrowlPosition() {
  if (!_hsIsActive()) return;
  var dist = hsDistance();
  var dir = hsDirection();
  var vol = Math.max(0.15, 1 - (dist * 0.08));
  if (_hsGrowlGain) _hsGrowlGain.gain.value = vol * (AUD.sfxVol || 0.8);
  if (_hsGrowlPanner) {
    _hsGrowlPanner.pan.value = dir === 'right' ? 0.8 : dir === 'left' ? -0.8 : 0;
  }
}

function hsStartGrowlLoop() {
  if (!_hsIsActive()) return;
  try {
    if (!AUD || !AUD.ctx) return;
    if (AUD.ctx.state === 'suspended') AUD.ctx.resume();
    var gainNode = AUD.ctx.createGain();
    var panner = AUD.ctx.createStereoPanner ? AUD.ctx.createStereoPanner() : null;
    _hsGrowlGain = gainNode; _hsGrowlPanner = panner;
    hsApplyGrowlPosition();
    if (panner) { gainNode.connect(panner); panner.connect(AUD.ctx.destination); }
    else gainNode.connect(AUD.ctx.destination);
    fetch(_audioUrl('monster-growl.mp3')).then(function(r){ return r.arrayBuffer(); })
      .then(function(buf){ return AUD.ctx.decodeAudioData(buf); })
      .then(function(buffer){
        if (!_hsIsActive()) return;
        var source = AUD.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gainNode);
        source.start(0);
        _hsGrowlSource = source;
      }).catch(function(e){ console.warn('[HS] growl load failed:', e); });
  } catch(e) { console.warn('[HS] startGrowlLoop error:', e); }
}

function hsUpdateGrowl() {
  if (_hsGrowlGain || _hsGrowlPanner) hsApplyGrowlPosition();
}

function hsStopGrowlLoop() {
  try { if (_hsGrowlSource) { _hsGrowlSource.stop(); _hsGrowlSource = null; } } catch(e) {}
  _hsGrowlGain = null; _hsGrowlPanner = null;
}

// One discrete step sound for the Swallower's own advance — spatial, same
// technique as Stalker Floor's playSwallowerFootstep(), separate from the
// continuous growl loop above.
function hsPlayMonsterFootstep() {
  if (!_hsIsActive()) return;
  try {
    if (!AUD || !AUD.ctx) return;
    if (AUD.ctx.state === 'suspended') AUD.ctx.resume();
    var dist = hsDistance();
    var dir = hsDirection();
    var vol = Math.max(0.15, 1 - (dist * 0.08));
    var gainNode = AUD.ctx.createGain();
    gainNode.gain.value = vol * (AUD.sfxVol || 0.8);
    var panner = AUD.ctx.createStereoPanner ? AUD.ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = dir === 'right' ? 0.8 : dir === 'left' ? -0.8 : 0;
      gainNode.connect(panner);
      panner.connect(AUD.ctx.destination);
    } else {
      gainNode.connect(AUD.ctx.destination);
    }
    fetch(_audioUrl('monster-footstep.mp3')).then(function(r){ return r.arrayBuffer(); })
      .then(function(buf){ return AUD.ctx.decodeAudioData(buf); })
      .then(function(buffer){
        if (!_hsIsActive()) return;
        var source = AUD.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(gainNode);
        source.start(0);
      }).catch(function(e){ console.warn('[HS] footstep load failed:', e); });
  } catch(e) { console.warn('[HS] playMonsterFootstep error:', e); }
}

var HS_MOVE_LOCK_MS = 2200; // how long you wait out its footstep before moving again
var HS_MOVE_LOCK_FOOTSTEP_DELAY = 700;

function hsSetMoveButtonsEnabled(enabled) {
  document.querySelectorAll('#hs-play .dg-btn[onclick^="hsMove"]').forEach(function(b) { b.disabled = !enabled; });
}

// Forces a listening beat after a move — but only while it's far enough that
// the pause is atmosphere, not a penalty. Once it's close (chase phase),
// locking you out of moving while it closes in would just feel like the game
// cheating you out of a reaction — so it's skipped entirely there.
function hsApplyMoveLock() {
  if (!HS || !HS.active || HS.phase !== 1) return;
  HS.moveLocked = true;
  hsSetMoveButtonsEnabled(false);
  setTimeout(function() {
    if (!HS || !HS.active) return;
    hsPlayMonsterFootstep();
  }, HS_MOVE_LOCK_FOOTSTEP_DELAY);
  setTimeout(function() {
    if (!HS || !HS.active) return;
    HS.moveLocked = false;
    hsSetMoveButtonsEnabled(true);
  }, HS_MOVE_LOCK_MS);
}

function hsMove(dir) {
  if (_hsMP && _hsMP.active) { hsMpMove(dir); return; }
  if (!HS || !HS.active || HS.moveLocked) return;
  sfx('sfx-footstep');
  if (HS.hideCooldown > 0) HS.hideCooldown--;
  var moved = true;
  if (dir === 'north') { if (HS.py > 0) HS.py--; else moved = false; }
  else if (dir === 'south') { if (HS.py < HS_GRID_SIZE - 1) HS.py++; else moved = false; }
  else if (dir === 'west')  { if (HS.px > 0) HS.px--; else moved = false; }
  else if (dir === 'east')  { if (HS.px < HS_GRID_SIZE - 1) HS.px++; else moved = false; }
  if (!moved) { say('There is a wall that way. Try a different direction.'); return; }
  HS.moves++;
  // It closes in on every move — unless your last Hide bought you a free one
  if (HS.hidSuccessPending) HS.hidSuccessPending = false;
  else hsMonsterAdvance();
  hsUpdateGrowl();

  var desc = HS_ROOM_DESCS[Math.floor(Math.random() * HS_ROOM_DESCS.length)];
  document.getElementById('hs-room-desc').textContent = desc;
  var ev = document.getElementById('hs-event');
  ev.style.display = 'none'; ev.textContent = '';
  var foundItem = false;
  var item = null;
  if (HS.items < 2 && Math.random() < 0.20) {
    foundItem = true;
    item = HS_HIDE_ITEMS[Math.floor(Math.random() * HS_HIDE_ITEMS.length)];
    HS.items++;
    ev.style.display = 'block';
    ev.textContent = item.icon + ' You spot a ' + item.name + '. ' + item.desc;
  }
  hsCheckPhase();
  hsUpdateUI();
  _placeHS3DCamera(false);
  var dist = hsDistance();
  if (dist <= 0) { hsCaught(); return; }
  if (HS.px === HS.ex && HS.py === HS.ey) { hsEscape(); return; }
  say('Moving ' + dir + '. ' + desc + (foundItem ? ' You spot a ' + item.name + '. ' + item.desc + ' It will help you hide.' : ''));
  hsAnnounceDistance(dist);
  hsApplyMoveLock();
}

var HS_HIDE_BASE_CHANCE = 0.55;
var HS_HIDE_ITEM_BONUS = 0.25;

function hsHide() {
  if (_hsMP && _hsMP.active) { hsMpHide(); return; }
  if (!HS || !HS.active) return;
  var ev = document.getElementById('hs-event');
  if (HS.hideCooldown > 0) {
    // BUGFIX: this used to return without touching the event box, so a prior
    // failed Hide's "it senses you anyway" message just sat there — every
    // repeat tap while on cooldown looked like ANOTHER failure, when nothing
    // had actually happened yet. Show the cooldown state explicitly instead.
    ev.style.display = 'block';
    ev.textContent = '⏳ Still catching your breath from last time.';
    say('You just hid. Give it a moment before trying again.');
    return;
  }
  sfx('sfx-select');
  HS.hideCooldown = 1; // shorter now — hiding has a real cost: no progress toward the exit
  var usedItem = HS.items > 0;
  var chance = HS_HIDE_BASE_CHANCE + (usedItem ? HS_HIDE_ITEM_BONUS : 0);
  if (usedItem) HS.items--;
  ev.style.display = 'block';
  if (Math.random() < chance) {
    HS.hidSuccessPending = true; // your next move skips its advance — it lost you
    ev.textContent = usedItem
      ? '🫥 You duck out of sight and wait. It passes right by, unaware.'
      : '🫥 You hold your breath. It passes by, closer than you\'d like.';
    say((usedItem ? 'You hid using what you found. ' : 'You hid successfully. ') + 'It lost your trail — your next move is safe.');
  } else {
    hsMonsterAdvance(); // hiding failed — it still closes in, right now
    hsUpdateGrowl();
    ev.textContent = '🫥 You hide, but it senses you anyway.';
    var dist = hsDistance();
    say('It sensed you. Now ' + dist + (dist === 1 ? ' room' : ' rooms') + ' away.');
  }
  hsCheckPhase();
  hsUpdateUI();
  _refreshHS3DMonster();
  if (hsDistance() <= 0) { hsCaught(); return; }
}

function hsCaught() {
  HS.active = false;
  hsStopGrowlLoop();
  _stopHS3DLoop();
  var v3c = document.getElementById('hs-3d-view');
  if (v3c) v3c.style.display = 'none';
  sfx('sfx-death');
  vibe(VIBE.hunterCatch);
  document.getElementById('hs-play').style.display = 'none';
  document.getElementById('hs-end').style.display = 'block';
  document.getElementById('hs-end-title').textContent = 'Caught';
  document.getElementById('hs-end-text').textContent = 'It found you. Try again — the way out is different every time.';
  playTrack(getMenuTrack());
  say('Caught. It found you. Try again, or return to the menu.');
}

function hsEscape() {
  HS.active = false;
  hsStopGrowlLoop();
  _stopHS3DLoop();
  var v3e = document.getElementById('hs-3d-view');
  if (v3e) v3e.style.display = 'none';
  sfx('sfx-confirm');
  vibe(VIBE.fleeSuccess);
  document.getElementById('hs-play').style.display = 'none';
  document.getElementById('hs-end').style.display = 'block';
  document.getElementById('hs-end-title').textContent = 'Escaped';
  document.getElementById('hs-end-text').textContent = 'You made it out. It is still in there, waiting for the next one.';
  playTrack(getMenuTrack());
  say('You escaped. You made it out alive.');
}
// ── END HIDE AND SEEK ──

// ── HIDE AND SEEK — 3D MODE ──
// HS is a free 7x7 grid with no interior walls and a discrete move-lock
// pacing (a listening beat between moves) — nothing like a dungeon's room
// graph. Rather than force it into _room3D, it gets its own small scene:
// one open arena sized to the whole grid, a camera that teleports (with a
// fade) to the player's cell on every hsMove()/hsHide() the same way the
// original dungeon 3D Mode did before free-roam walking was added, and a
// crude, deliberately underdetailed monster mesh — the blind player only
// ever experiences the Swallower through the spatial growl/footstep audio
// that already exists; this is purely something a sighted friend watching
// the same screen can see, same as everywhere else 3D Mode shows up.
var _hs3D = { THREE:null, scene:null, camera:null, renderer:null, raf:null,
  yaw:0, pitch:0, ambient:null, monsterMesh:null, lamps:[], playerMeshes:{} };
var HS3D_TILE = 4;
var HS3D_WALL_H = 3.2;

function _hs3DWantsVisual() {
  return (!!(HS && HS.active) || !!(_hsMP && _hsMP.active)) && typeof isBetaOn === 'function' && isBetaOn('3dmode');
}
// Same "sighted play only" rule used everywhere else in 3D Mode — a screen
// reader player still gets the scene rendered (so they can show a friend),
// just not controls or a map they can't use.
function _hs3DWantsAimControls() {
  return !(ACCESS && ACCESS.srmode);
}
function _hs3DWantsMinimap() {
  return _hs3DWantsAimControls() && !!get3DSettings().minimap;
}

function initHS3DView() {
  if (!_hs3DWantsVisual()) return;
  var wrap = document.getElementById('hs-3d-view');
  if (!wrap) return;
  wrap.style.display = '';
  // The scene/renderer persist across HS runs within the same page load (see
  // below), so _setupHS3DScene only actually runs once — but srmode can
  // differ between one hsStart() and the next, so the hint has to be
  // re-synced on every call here rather than only the first time the scene
  // is actually built.
  var hint = document.getElementById('hs-3d-hint');
  if (hint) hint.style.display = _hs3DWantsAimControls() ? '' : 'none';
  _load3DEngine().then(function(THREE) {
    if (!_hs3DWantsVisual()) return; // player may have left before load finished
    if (!_hs3D.renderer) _setupHS3DScene(THREE);
    _placeHS3DCamera(true);
    _startHS3DLoop();
  }).catch(function(e) { console.warn('[DD] HS 3D visual load failed:', e); wrap.style.display = 'none'; });
}

function _setupHS3DScene(THREE) {
  _hs3D.THREE = THREE;
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05050a, 0.045);
  var wrapEl = document.getElementById('hs-3d-canvas-wrap');
  var w = wrapEl.clientWidth || 300, h = wrapEl.clientHeight || 220;
  var camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 60);
  camera.position.set(0, 1.6, 0);
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  wrapEl.innerHTML = '';
  wrapEl.appendChild(renderer.domElement);
  _hs3D.scene = scene; _hs3D.camera = camera; _hs3D.renderer = renderer;

  // Boosted well past what looked reasonable on a full-brightness desktop
  // preview — a real screen renders MeshStandardMaterial much darker than
  // it appears here, the same brightness gap the dungeon renderer hit
  // earlier this session (fixed there by roughly doubling every value).
  var ambient = new THREE.AmbientLight(0x453a4a, 1.25);
  scene.add(ambient);
  _hs3D.ambient = ambient;

  // One open floor/ceiling plane and four perimeter walls sized to the whole
  // HS_GRID_SIZE grid — matches hsMove()'s actual collision rule (only the
  // outer boundary blocks movement; there are no interior walls to place).
  var span = HS_GRID_SIZE * HS3D_TILE;
  var center = span / 2 - HS3D_TILE / 2;
  var floorMat = new THREE.MeshStandardMaterial({ color: 0x4a3c30, roughness: 0.95 });
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(span, span), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(center, 0, center);
  scene.add(floor);

  var ceilMat = new THREE.MeshStandardMaterial({ color: 0x1c1814, roughness: 1 });
  var ceil = new THREE.Mesh(new THREE.PlaneGeometry(span, span), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(center, HS3D_WALL_H, center);
  scene.add(ceil);

  var wallMat = new THREE.MeshStandardMaterial({ color: 0x5c4c3a, roughness: 0.9 });
  var wallGeoNS = new THREE.BoxGeometry(span + HS3D_TILE, HS3D_WALL_H, 0.3);
  var wallGeoEW = new THREE.BoxGeometry(0.3, HS3D_WALL_H, span + HS3D_TILE);
  [
    [center, -HS3D_TILE / 2, wallGeoNS], [center, span - HS3D_TILE / 2, wallGeoNS],
    [-HS3D_TILE / 2, center, wallGeoEW], [span - HS3D_TILE / 2, center, wallGeoEW]
  ].forEach(function(w) {
    var mesh = new THREE.Mesh(w[2], wallMat);
    mesh.position.set(w[0], HS3D_WALL_H / 2, w[1]);
    scene.add(mesh);
  });

  // A handful of flickering lamps scattered across the arena — bright enough
  // to actually see the space by (the dungeon renderer's original pass at
  // this looked fine in a full-brightness preview but rendered near-black on
  // a real screen — same fix applied here up front instead of after the
  // fact). One is always placed a tile off from the player's spawn point
  // (not directly overhead — a light immediately above the camera blows out
  // to solid white up close) so the opening view is never accidentally dark
  // no matter how the random scatter lands.
  _hs3D.lamps = [];
  var lampSpots = [[HS3D_TILE, HS3D_TILE]];
  for (var i = 0; i < 6; i++) {
    lampSpots.push([Math.random() * (HS_GRID_SIZE - 1) * HS3D_TILE, Math.random() * (HS_GRID_SIZE - 1) * HS3D_TILE]);
  }
  lampSpots.forEach(function(p) {
    var light = new THREE.PointLight(0xffaa55, 1.5, 9, 1.8);
    light.position.set(p[0], 2.4, p[1]);
    scene.add(light);
    _hs3D.lamps.push({ light: light, base: 1.5, phase: Math.random() * Math.PI * 2 });
  });

  // Exit marker — visible from a distance for a spectator, even though the
  // blind player is never told where it is ahead of reaching it. The exit is
  // always the same grid corner in both solo and multiplayer (see hsMove()
  // and hsMpMove()'s matching HS_GRID_SIZE-1 checks), so this uses that
  // constant directly rather than HS.ex/HS.ey — HS itself is never
  // initialized at all in a pure multiplayer session.
  var exitGx = HS_GRID_SIZE - 1, exitGy = HS_GRID_SIZE - 1;
  var exitLight = new THREE.PointLight(0x66ffcc, 1.6, 9, 2);
  exitLight.position.set(exitGx * HS3D_TILE, 2, exitGy * HS3D_TILE);
  scene.add(exitLight);
  var exitMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.06, 20),
    new THREE.MeshBasicMaterial({ color: 0x66ffcc, transparent: true, opacity: 0.5 })
  );
  exitMesh.position.set(exitGx * HS3D_TILE, 0.04, exitGy * HS3D_TILE);
  scene.add(exitMesh);

  // The Darkness Swallower — kept crude and silhouette-like on purpose. It's
  // only ever hidden from a spectator's eyes by distance culling, never by
  // detail; the blind player's real read on it stays entirely audio.
  // A stretched sphere (not CapsuleGeometry — not present in the bundled
  // Three.js build) gives a crude, faceless standing shape, fitting for
  // something the game never really lets you see clearly anyway.
  var monsterGroup = new THREE.Group();
  var bodyMat = new THREE.MeshStandardMaterial({ color: 0x0a0508, roughness: 1 });
  var body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), bodyMat);
  body.scale.set(1, 1.6, 1);
  body.position.y = 1.0;
  monsterGroup.add(body);
  var eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  [[-0.15, 1.35, 0.4], [0.15, 1.35, 0.4]].forEach(function(p) {
    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat);
    eye.position.set(p[0], p[1], p[2]);
    monsterGroup.add(eye);
  });
  scene.add(monsterGroup);
  _hs3D.monsterMesh = monsterGroup;

  _bindHS3DLook(renderer.domElement);
  window.addEventListener('resize', _resizeHS3DView);
}

// Same load-bearing passive:false + preventDefault() as the dungeon's
// _bind3DLook — without it a real device's native scroll competes with (and
// usually wins over) the camera drag. Kept as its own small copy rather than
// generalizing _bind3DLook, since that function hardcodes _room3D's yaw/pitch
// and this scene has its own separate camera state.
function _bindHS3DLook(el) {
  var dragging = false, lastX = 0, lastY = 0, activeId = null;
  function onMove(x, y) {
    var dx = x - lastX, dy = y - lastY;
    lastX = x; lastY = y;
    _hs3D.yaw -= dx * 0.006;
    _hs3D.pitch = Math.max(-1.0, Math.min(1.0, _hs3D.pitch - dy * 0.006));
  }
  el.style.touchAction = 'none';
  el.addEventListener('touchstart', function(e) {
    e.preventDefault();
    var t = e.changedTouches[0];
    dragging = true; activeId = t.identifier; lastX = t.clientX; lastY = t.clientY;
  }, { passive: false });
  el.addEventListener('touchmove', function(e) {
    if (!dragging) return;
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === activeId) onMove(t.clientX, t.clientY);
    }
  }, { passive: false });
  el.addEventListener('touchend', function() { dragging = false; });
  el.addEventListener('touchcancel', function() { dragging = false; });
  el.addEventListener('mousedown', function(e) { dragging = true; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener('mousemove', function(e) { if (dragging) onMove(e.clientX, e.clientY); });
  window.addEventListener('mouseup', function() { dragging = false; });
}

function _hs3DCellCenter(gx, gy) { return { x: gx * HS3D_TILE, z: gy * HS3D_TILE }; }

// Movement here is still the existing discrete North/South/East/West grid
// step (not free-roam walking) — HS's listening-beat pacing depends on moves
// being discrete, so the camera teleports behind a quick fade exactly like
// dungeon 3D Mode did before free-roam walking was added there.
function _placeHS3DCamera(instant) {
  var mySource = _hsMP && _hsMP.active ? _hsMpMyPlayer() : HS;
  if (!mySource) return;
  var myGx = _hsMP && _hsMP.active ? mySource.x : mySource.px;
  var myGy = _hsMP && _hsMP.active ? mySource.y : mySource.py;
  var wrap = document.getElementById('hs-3d-view');
  var isShowing = !!(wrap && wrap.style.display !== 'none');
  if (!_hs3D.camera || !isShowing) {
    // Same self-healing rule as the dungeon 3D fix earlier this session —
    // initHS3DView() only ever gets called from hsStart(), so toggling 3D
    // Mode on mid-run would otherwise leave every future move silently
    // no-op-ing here forever. Checking isShowing (not just whether a
    // camera object exists) matters because the scene/renderer persist
    // across HS runs — a camera can already exist from an earlier session
    // even though this run started with 3D Mode off and the view is
    // currently hidden. initHS3DView() is async (loads Three.js) and safe
    // to call repeatedly; once ready it places the camera itself, so this
    // just kicks that off and returns rather than placing anything here.
    if (_hs3DWantsVisual()) initHS3DView();
    return;
  }
  var p = _hs3DCellCenter(myGx, myGy);
  function place() {
    _hs3D.camera.position.set(p.x, 1.6, p.z);
    // A fixed yaw pointed the camera straight at the nearest boundary wall
    // whenever the player was near a grid edge (spawn is a corner — two
    // units from a wall in two directions). Facing the arena's center
    // instead keeps the opening/every-move view looking into open space
    // rather than a close-up wall face, in any cell.
    var mid = (HS_GRID_SIZE - 1) / 2;
    var centerWorld = _hs3DCellCenter(mid, mid);
    var dx = centerWorld.x - p.x, dz = centerWorld.z - p.z;
    _hs3D.yaw = (dx === 0 && dz === 0) ? 0 : Math.atan2(-dx, -dz);
    _hs3D.pitch = 0;
    _refreshHS3DMonster();
    _refreshHS3DPlayers();
  }
  if (instant || !_hs3D.renderer) { place(); return; }
  var fade = document.getElementById('hs-3d-fade');
  if (fade) fade.style.opacity = '1';
  setTimeout(function() {
    place();
    if (fade) setTimeout(function() { fade.style.opacity = '0'; }, 30);
  }, 220);
}

// Repositions the monster mesh and refreshes the minimap without moving the
// camera — used after Hide (the player didn't move, but the monster still
// might have) as well as internally by _placeHS3DCamera.
function _refreshHS3DMonster() {
  var monster = _hsMP && _hsMP.active ? _hsMpMonster() : (HS ? { x: HS.mx, y: HS.my } : null);
  if (!_hs3D.monsterMesh || !monster) { _renderHS3DMinimap(); return; }
  var p = _hs3DCellCenter(monster.x, monster.y);
  _hs3D.monsterMesh.position.set(p.x, 0, p.z);
  // Only rendered within a real distance — an open arena has no walls to
  // hide behind, so distance culling is what keeps "is it close" a visual
  // surprise for a spectator too, not just an audio one.
  _hs3D.monsterMesh.visible = hsDistance() <= 5;
  _renderHS3DMinimap();
}

// Multiplayer only — keeps one small colored avatar per teammate (never for
// yourself; you ARE the camera) in sync with their live position. Unlike the
// monster, teammates are never distance-culled: seeing where your party is
// matters for coordinating, and there's no tension to protect by hiding them.
function _hs3DColorForPlayerId(id) {
  var hash = 0;
  for (var i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  var palette = [0x66ccff, 0xff8866, 0x88ff66, 0xffdd44, 0xdd88ff, 0xff66aa];
  return palette[hash % palette.length];
}
function _buildHS3DPlayerAvatar(id) {
  var THREE = _hs3D.THREE;
  var group = new THREE.Group();
  var mat = new THREE.MeshStandardMaterial({ color: _hs3DColorForPlayerId(id), roughness: 0.8 });
  var body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), mat);
  body.scale.set(1, 1.5, 1);
  body.position.y = 0.9;
  group.add(body);
  return group;
}
function _clearHS3DPlayerMeshes() {
  if (_hs3D.scene) {
    Object.keys(_hs3D.playerMeshes).forEach(function(id) { _hs3D.scene.remove(_hs3D.playerMeshes[id]); });
  }
  _hs3D.playerMeshes = {};
}
function _refreshHS3DPlayers() {
  if (!_hs3D.scene || !_hsMP || !_hsMP.active || !_hsMP.room || !_hsMP.room.state) return;
  var players = _hsMP.room.state.players || {};
  var myId = _hsMP.myId;
  var seen = {};
  Object.keys(players).forEach(function(id) {
    if (id === myId) return; // never render my own avatar — I'm the camera
    seen[id] = true;
    var p = players[id];
    var mesh = _hs3D.playerMeshes[id];
    if (!mesh) {
      mesh = _buildHS3DPlayerAvatar(id);
      _hs3D.scene.add(mesh);
      _hs3D.playerMeshes[id] = mesh;
    }
    var pos = _hs3DCellCenter(p.x, p.y);
    mesh.position.x = pos.x;
    mesh.position.z = pos.z;
    mesh.visible = !p.escaped; // escaped teammates have stepped out of the scene entirely
    // A caught teammate crumples down rather than standing — a cheap, clear
    // visual cue that doesn't need its own animation state.
    mesh.rotation.z = p.caught ? Math.PI / 2.2 : 0;
    mesh.position.y = p.caught ? 0.3 : 0;
  });
  // Drop meshes for anyone no longer in the room — shouldn't normally happen
  // mid-run, but keeps this self-healing regardless.
  Object.keys(_hs3D.playerMeshes).forEach(function(id) {
    if (!seen[id]) { _hs3D.scene.remove(_hs3D.playerMeshes[id]); delete _hs3D.playerMeshes[id]; }
  });
}

function _startHS3DLoop() {
  if (_hs3D.raf || !_hs3D.renderer) return;
  var clock = new _hs3D.THREE.Clock();
  var frameCount = 0, fpsAccum = 0;
  function loop() {
    _hs3D.raf = requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.1);
    var t = clock.elapsedTime;
    _hs3D.lamps.forEach(function(l) {
      l.light.intensity = l.base + Math.sin(t * 6 + l.phase) * 0.15;
    });
    if (_hs3D.monsterMesh && _hs3D.monsterMesh.visible) {
      _hs3D.monsterMesh.rotation.y = t * 0.6; // slow idle turn — kept crude on purpose, not a walk cycle
    }
    _hs3D.camera.rotation.order = 'YXZ';
    _hs3D.camera.rotation.y = _hs3D.yaw;
    _hs3D.camera.rotation.x = _hs3D.pitch;
    _hs3D.renderer.render(_hs3D.scene, _hs3D.camera);
    var s3 = get3DSettings();
    var fpsEl = document.getElementById('hs-3d-fps');
    if (s3.fpsCounter) {
      frameCount++; fpsAccum += dt;
      if (fpsAccum >= 0.5) {
        if (fpsEl) { fpsEl.style.display = ''; fpsEl.textContent = Math.round(frameCount / fpsAccum) + ' FPS'; }
        frameCount = 0; fpsAccum = 0;
      }
    } else if (fpsEl) { fpsEl.style.display = 'none'; }
  }
  loop();
}

function _stopHS3DLoop() {
  if (_hs3D.raf) { cancelAnimationFrame(_hs3D.raf); _hs3D.raf = null; }
}

function _resizeHS3DView() {
  if (!_hs3D.renderer) return;
  var wrapEl = document.getElementById('hs-3d-canvas-wrap');
  if (!wrapEl) return;
  var w = wrapEl.clientWidth || 300, h = wrapEl.clientHeight || 220;
  _hs3D.camera.aspect = w / h;
  _hs3D.camera.updateProjectionMatrix();
  _hs3D.renderer.setSize(w, h);
}

// Plain 7x7 grid map — no fog of war (there's nothing to hide; the whole
// arena is one open room with no interior walls) — showing the exit and,
// distance-gated the same as the 3D scene itself, the monster. A screen
// reader player never sees this (see _hs3DWantsMinimap), so revealing the
// exit ahead of time here isn't spoiling anything the blind playthrough
// itself relies on discovering.
function _renderHS3DMinimap() {
  var wrap = document.getElementById('hs-3d-minimap');
  if (!wrap) return;
  var mp = _hsMP && _hsMP.active;
  var me = mp ? _hsMpMyPlayer() : HS;
  if (!_hs3DWantsMinimap() || !me) { wrap.style.display = 'none'; return; }
  var canvas = document.getElementById('hs-3d-minimap-canvas');
  if (!canvas) return;
  wrap.style.display = 'block';
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  var pad = 6;
  var cell = (W - pad * 2) / HS_GRID_SIZE;
  function sx(gx) { return pad + (gx + 0.5) * cell; }
  function sy(gy) { return pad + (gy + 0.5) * cell; }

  ctx.strokeStyle = 'rgba(120,100,80,0.18)';
  ctx.lineWidth = 1;
  for (var i = 0; i <= HS_GRID_SIZE; i++) {
    ctx.beginPath(); ctx.moveTo(pad + i * cell, pad); ctx.lineTo(pad + i * cell, H - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, pad + i * cell); ctx.lineTo(W - pad, pad + i * cell); ctx.stroke();
  }

  ctx.fillStyle = '#66ffcc';
  ctx.beginPath(); ctx.arc(sx(HS_GRID_SIZE - 1), sy(HS_GRID_SIZE - 1), cell * 0.28, 0, Math.PI * 2); ctx.fill();

  var monster = mp ? _hsMpMonster() : { x: HS.mx, y: HS.my };
  if (monster && hsDistance() <= 5) {
    ctx.fillStyle = '#ff3333';
    ctx.beginPath(); ctx.arc(sx(monster.x), sy(monster.y), cell * 0.3, 0, Math.PI * 2); ctx.fill();
  }

  // Teammates — small colored dots matching their 3D avatar color, skipped
  // once escaped (they've stepped out of the run entirely).
  if (mp && _hsMP.room && _hsMP.room.state && _hsMP.room.state.players) {
    var players = _hsMP.room.state.players;
    Object.keys(players).forEach(function(id) {
      if (id === _hsMP.myId) return;
      var p = players[id];
      if (p.escaped) return;
      ctx.fillStyle = '#' + _hs3DColorForPlayerId(id).toString(16).padStart(6, '0');
      ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), cell * 0.22, 0, Math.PI * 2); ctx.fill();
    });
  }

  var myGx = mp ? me.x : me.px, myGy = mp ? me.y : me.py;
  ctx.fillStyle = '#ffcc44';
  ctx.beginPath(); ctx.arc(sx(myGx), sy(myGy), cell * 0.32, 0, Math.PI * 2); ctx.fill();
}
// ── END HIDE AND SEEK — 3D MODE ──

// ── HIDE AND SEEK — MULTIPLAYER (co-op, up to 5 players) ──
// Reuses the PVP Arena's exact room-code pattern (Firebase RTDB, 4-char
// codes, ref.on('value') listeners) under its own hs_rooms/<code> path.
// The monster has no single authoritative host — it always advances toward
// whichever eligible player is nearest (ties broken by lowest player id),
// which every client computes identically from the same synced state, and
// every state change (a move, a hide) goes through a single Firebase
// transaction() covering the whole `state` subtree (players + monster +
// items together) so two players moving at once can't corrupt or
// double-advance it: since the outcome is deterministic given the state,
// even a transaction retry converges on the same answer.
//
// Caught is "down," not eliminated — walking onto a caught teammate's cell
// rescues them. The run only ends once nobody is left both un-caught and
// un-escaped.
//
// Scoped out of this pass: the 3D visual (animating up to 5 avatars in that
// scene is real extra work of its own) and presence/disconnect detection
// (if a player just closes the app mid-run, teammates only notice because
// that player stops moving — there's no onDisconnect() cleanup yet).
var _hsMP = null; // null when not in a multiplayer session

function _hsMpName() {
  var found = (typeof CHARS !== 'undefined' ? CHARS : []).filter(function(c) { return !c.deleted; })[0];
  return (found && found.name) ? found.name : 'Player' + Math.floor(Math.random() * 900 + 100);
}

function hsShowMpLobby() {
  if (!window._fbRtdb) {
    say('Multiplayer unavailable. Firebase not connected.');
    document.getElementById('hs-mp-status').textContent = 'Multiplayer unavailable. Firebase not connected.';
    return;
  }
  // This is also the "Try Again" destination after a multiplayer run ends,
  // which left a real bug: _hsMP just got overwritten with a fresh object
  // here without ever detaching the FINISHED room's listener first. That
  // orphaned listener stays attached to the old (over) room and, if
  // Firebase resends the current value on socket reconnect (which it does),
  // fires again and stomps the brand new session's state with the old
  // room's — making a new game look like it silently refuses to start,
  // recoverable only by a full page refresh.
  if (_hsMP && _hsMP.roomListener && _hsMP.code) {
    try { window._fbRtdb.ref('hs_rooms/' + _hsMP.code).off('value', _hsMP.roomListener); } catch(e) {}
  }
  _hsMP = { myId: mpGenId(), myName: _hsMpName(), code: null, roomRef: null, roomListener: null,
    room: null, isHost: false, active: false, ended: false, lastSeenSeq: 0, lobbySnapshot: {} };
  document.getElementById('hs-intro').style.display = 'none';
  document.getElementById('hs-mp-lobby').style.display = 'block';
  document.getElementById('hs-mp-status').textContent = '';
  document.getElementById('hs-mp-room-code-display').style.display = 'none';
  document.getElementById('hs-mp-ready-btn').style.display = 'none';
  document.getElementById('hs-mp-start-btn').style.display = 'none';
  document.getElementById('hs-mp-players-list').innerHTML = '';
  document.getElementById('hs-mp-selected-char').style.display = 'none';
  hsMpRenderCharList();
  sfx('sfx-select');
  say('Hide and Seek multiplayer. Up to five players. Create a room or join one with a code.');
}

// Reuses CHARS (the player's saved solo characters) the same way PVP Arena's
// character picker does, but kept as its own copy rather than sharing PVP's
// mp-char-list/_mpSelectedChar state — a player could have both screens'
// state alive if they navigate between them, and keeping the two
// multiplayer systems independent avoids any cross-contamination.
function hsMpRenderCharList() {
  var section = document.getElementById('hs-mp-char-section');
  var createBtn = document.getElementById('hs-mp-create-btn');
  var joinBtn = document.getElementById('hs-mp-join-btn');
  var chars = (typeof CHARS !== 'undefined' ? CHARS : []).filter(function(c) { return !c.deleted; });
  if (chars.length === 0) {
    // Nothing to pick from — fall back to the generated name and let
    // Create/Join work immediately rather than blocking on a picker that
    // has nothing in it.
    section.style.display = 'none';
    createBtn.disabled = false;
    joinBtn.disabled = false;
    return;
  }
  section.style.display = 'block';
  createBtn.disabled = true;
  joinBtn.disabled = true;
  var list = document.getElementById('hs-mp-char-list');
  list.innerHTML = '';
  chars.forEach(function(ch) {
    var btn = document.createElement('button');
    btn.className = 'btn-ghost';
    btn.style.cssText = 'text-align:left;font-size:0.7rem;padding:10px 14px;';
    btn.textContent = ch.name + ' — ' + ch.race + ' ' + ch.cls + ' · Lv ' + (ch.level || 1);
    btn.setAttribute('aria-label', 'Play as ' + ch.name);
    btn.onclick = function() { hsMpSelectChar(ch); };
    list.appendChild(btn);
  });
}

function hsMpSelectChar(ch) {
  if (!_hsMP) return;
  _hsMP.myName = ch.name;
  var display = document.getElementById('hs-mp-selected-char');
  display.style.display = 'block';
  display.textContent = '✓ Playing as ' + ch.name + ' — ' + ch.race + ' ' + ch.cls;
  document.getElementById('hs-mp-create-btn').disabled = false;
  document.getElementById('hs-mp-join-btn').disabled = false;
  sfx('sfx-select');
  say(ch.name + ' selected.');
}

function hsMpCreateRoom() {
  if (!_hsMP) return;
  var code = mpGenRoomCode();
  _hsMP.code = code;
  _hsMP.isHost = true;
  var lobby = {};
  lobby[_hsMP.myId] = { name: _hsMP.myName, ready: false };
  var ref = window._fbRtdb.ref('hs_rooms/' + code);
  ref.set({ code: code, hostId: _hsMP.myId, createdAt: Date.now(), status: 'waiting', lobby: lobby })
    .then(function() {
      _hsMP.roomRef = ref;
      document.getElementById('hs-mp-room-code-display').style.display = 'block';
      document.getElementById('hs-mp-room-code').textContent = code;
      document.getElementById('hs-mp-ready-btn').style.display = 'block';
      document.getElementById('hs-mp-start-btn').style.display = 'block';
      document.getElementById('hs-mp-status').textContent = 'Room created! Share code ' + code + '.';
      say('Room created. Your code is ' + code.split('').join(' ') + '. Share it with up to four friends.');
      sfx('sfx-confirm');
      hsMpListenRoom(code);
      // Auto-delete if it never gets used
      setTimeout(function() {
        ref.once('value').then(function(snap) {
          if (snap.exists() && snap.val().status === 'waiting') ref.remove();
        }).catch(function() {});
      }, 600000);
    }).catch(function(err) {
      document.getElementById('hs-mp-status').textContent = 'Failed to create room. Check your connection.';
      console.error('[HS-MP] create room failed:', err);
    });
}

function hsMpJoinRoom() {
  if (!_hsMP) return;
  var input = document.getElementById('hs-mp-code-input');
  var code = input ? input.value.trim().toUpperCase() : '';
  if (code.length !== 4) { document.getElementById('hs-mp-status').textContent = 'Enter a valid 4 character room code.'; return; }
  var ref = window._fbRtdb.ref('hs_rooms/' + code);
  ref.once('value').then(function(snap) {
    if (!snap.exists()) { document.getElementById('hs-mp-status').textContent = 'Room not found.'; return; }
    var room = snap.val();
    if (room.status !== 'waiting') { document.getElementById('hs-mp-status').textContent = 'That run already started.'; return; }
    var count = Object.keys(room.lobby || {}).length;
    if (count >= 5) { document.getElementById('hs-mp-status').textContent = 'Room is full (5 players).'; return; }
    _hsMP.code = code;
    _hsMP.isHost = false;
    _hsMP.roomRef = ref;
    ref.child('lobby/' + _hsMP.myId).set({ name: _hsMP.myName, ready: false });
    document.getElementById('hs-mp-ready-btn').style.display = 'block';
    document.getElementById('hs-mp-status').textContent = 'Joined room ' + code + '.';
    say('Joined room ' + code + '.');
    sfx('sfx-confirm');
    hsMpListenRoom(code);
  }).catch(function(err) {
    document.getElementById('hs-mp-status').textContent = 'Failed to join room. Check your connection.';
    console.error('[HS-MP] join room failed:', err);
  });
}

function hsMpListenRoom(code) {
  if (_hsMP.roomListener) { try { window._fbRtdb.ref('hs_rooms/' + code).off('value', _hsMP.roomListener); } catch(e) {} }
  _hsMP.roomListener = window._fbRtdb.ref('hs_rooms/' + code).on('value', function(snap) {
    hsMpHandleRoomUpdate(snap.exists() ? snap.val() : null);
  });
}

function hsMpReady() {
  if (!_hsMP || !_hsMP.code || !_hsMP.roomRef) return;
  _hsMP.roomRef.child('lobby/' + _hsMP.myId + '/ready').set(true);
  var btn = document.getElementById('hs-mp-ready-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Ready'; }
  sfx('sfx-confirm');
}

function hsMpHostStart() {
  if (!_hsMP || !_hsMP.isHost || !_hsMP.room) return;
  var lobby = _hsMP.room.lobby || {};
  var ids = Object.keys(lobby);
  if (ids.length < 1) return;
  // Not a hard minimum — five is only a max, and the host can technically
  // start alone — but that's clearly not the point of this mode, so nudge
  // rather than block: require one more press once nothing's changed.
  if (ids.length === 1 && !_hsMP.soloStartConfirmed) {
    _hsMP.soloStartConfirmed = true;
    document.getElementById('hs-mp-status').textContent = 'Starting alone — Hide and Seek is built for playing with friends. Press Start again to go anyway.';
    say('Starting alone. Hide and Seek is built for playing with friends. Press Start again to go anyway.');
    return;
  }
  var players = {};
  ids.forEach(function(id) {
    players[id] = { name: lobby[id].name, x: 0, y: 0, caught: false, escaped: false, hiddenUntil: 0, hideCooldownUntil: 0 };
  });
  var m = HS_MONSTER_STARTS[Math.floor(Math.random() * HS_MONSTER_STARTS.length)];
  _hsMP.roomRef.update({
    status: 'started',
    state: { players: players, monster: { x: m.x, y: m.y }, items: 0, moveSeq: 0, status: 'active', lastEvent: null }
  }).catch(function(err) { console.error('[HS-MP] start failed:', err); });
}

function hsMpLeaveLobby() {
  // _hsMP.code is set synchronously in hsMpCreateRoom()/hsMpJoinRoom() before
  // their Firebase write resolves — roomRef only gets set once that write
  // actually succeeds. Leaving right after a failed create (bad connection,
  // a permission error) would otherwise crash here on a null roomRef.
  if (_hsMP && _hsMP.code && _hsMP.roomRef) {
    _hsMP.roomRef.child('lobby/' + _hsMP.myId).remove().catch(function(){});
    if (_hsMP.isHost) {
      // Host bailing before start — the room is useless without them, clean it up.
      _hsMP.roomRef.once('value').then(function(snap) {
        if (snap.exists() && snap.val().status === 'waiting') _hsMP.roomRef.remove();
      }).catch(function(){});
    }
  }
  hsMpTeardown();
  document.getElementById('hs-mp-lobby').style.display = 'none';
  document.getElementById('hs-intro').style.display = 'block';
  sfx('sfx-select');
}

function hsMpTeardown() {
  if (_hsMP && _hsMP.roomListener && _hsMP.code) {
    try { window._fbRtdb.ref('hs_rooms/' + _hsMP.code).off('value', _hsMP.roomListener); } catch(e) {}
  }
  hsStopGrowlLoop();
  _hsMP = null;
}

// ── Shared state helpers — used both by the transactions below and by the
// reused hsDistance()/hsDirection() growl-audio functions. ──
function _hsMpMyPlayer() {
  if (!_hsMP || !_hsMP.room || !_hsMP.room.state) return null;
  return _hsMP.room.state.players ? _hsMP.room.state.players[_hsMP.myId] : null;
}
function _hsMpMonster() {
  return (_hsMP && _hsMP.room && _hsMP.room.state) ? _hsMP.room.state.monster : null;
}
function hsMpPlayerName(room, id) {
  var p = room && room.state && room.state.players && room.state.players[id];
  return (p && p.name) || 'A player';
}

// Nearest eligible (not caught, not escaped, not currently hidden for this
// advance) player to the monster — pure function of `state`, so every
// client's transaction callback computes the exact same answer given the
// same inputs. Ties broken by lowest player id for full determinism.
function _hsMpComputeNearestTarget(state, seq) {
  var best = null, bestDist = Infinity;
  Object.keys(state.players).sort().forEach(function(id) {
    var p = state.players[id];
    if (p.caught || p.escaped) return;
    if (p.hiddenUntil && p.hiddenUntil > seq) return;
    var d = Math.abs(p.x - state.monster.x) + Math.abs(p.y - state.monster.y);
    if (d < bestDist) { bestDist = d; best = p; }
  });
  return best;
}
function _hsMpAdvanceMonsterToward(state, target) {
  var caughtIds = [];
  if (!target) return caughtIds;
  var mo = state.monster;
  var mdx = target.x - mo.x, mdy = target.y - mo.y;
  if (mdx !== 0 || mdy !== 0) {
    if (Math.abs(mdx) >= Math.abs(mdy)) mo.x += mdx > 0 ? 1 : -1;
    else mo.y += mdy > 0 ? 1 : -1;
  }
  Object.keys(state.players).forEach(function(id) {
    var p = state.players[id];
    if (!p.escaped && !p.caught && p.x === mo.x && p.y === mo.y) { p.caught = true; caughtIds.push(id); }
  });
  return caughtIds;
}
function _hsMpAnyoneStillPlaying(state) {
  return Object.keys(state.players).some(function(id) {
    var p = state.players[id];
    return !p.caught && !p.escaped;
  });
}

function hsMpMove(dir) {
  if (!_hsMP || !_hsMP.active || !_hsMP.roomRef) return;
  sfx('sfx-footstep');
  var myId = _hsMP.myId;
  _hsMP.roomRef.child('state').transaction(function(state) {
    if (!state || !state.players || !state.players[myId] || state.status === 'over') return state;
    var me = state.players[myId];
    if (me.caught || me.escaped) return state;
    var nx = me.x, ny = me.y, moved = true;
    if (dir === 'north') { if (ny > 0) ny--; else moved = false; }
    else if (dir === 'south') { if (ny < HS_GRID_SIZE - 1) ny++; else moved = false; }
    else if (dir === 'west')  { if (nx > 0) nx--; else moved = false; }
    else if (dir === 'east')  { if (nx < HS_GRID_SIZE - 1) nx++; else moved = false; }
    state.moveSeq = (state.moveSeq || 0) + 1;
    if (!moved) { state.lastEvent = { type: 'wall', by: myId, seq: state.moveSeq }; return state; }
    me.x = nx; me.y = ny;

    var rescued = null;
    Object.keys(state.players).forEach(function(id) {
      if (id === myId) return;
      var p = state.players[id];
      if (p.caught && !p.escaped && p.x === nx && p.y === ny) { p.caught = false; rescued = id; }
    });

    var foundItem = false;
    if ((state.items || 0) < 5 && Math.random() < 0.20) { state.items = (state.items || 0) + 1; foundItem = true; }

    var escapedNow = false;
    if (nx === HS_GRID_SIZE - 1 && ny === HS_GRID_SIZE - 1) { me.escaped = true; escapedNow = true; }

    var target = _hsMpComputeNearestTarget(state, state.moveSeq);
    var caughtIds = _hsMpAdvanceMonsterToward(state, target);

    if (!_hsMpAnyoneStillPlaying(state)) state.status = 'over';
    state.lastEvent = { type: 'move', by: myId, dir: dir, seq: state.moveSeq,
      foundItem: foundItem, rescued: rescued, escaped: escapedNow, caught: caughtIds };
    return state;
  }, function(error, committed) {
    if (error) { console.warn('[HS-MP] move transaction failed:', error); return; }
    // Only MY OWN successful move should fade/reposition the camera — the
    // realtime listener (hsMpRenderPartyStatus, on every room update)
    // already keeps teammates' avatars and the monster in sync regardless
    // of who moved; re-fading the camera on every teammate's move too would
    // be jarring and wrong.
    if (committed) _placeHS3DCamera(false);
  });
}

function hsMpHide() {
  if (!_hsMP || !_hsMP.active || !_hsMP.roomRef) return;
  sfx('sfx-select');
  var myId = _hsMP.myId;
  _hsMP.roomRef.child('state').transaction(function(state) {
    if (!state || !state.players || !state.players[myId] || state.status === 'over') return state;
    var me = state.players[myId];
    if (me.caught || me.escaped) return state;
    if (me.hideCooldownUntil && me.hideCooldownUntil >= (state.moveSeq || 0)) {
      state.lastEvent = { type: 'hide-cooldown', by: myId, seq: (state.moveSeq || 0) };
      return state;
    }
    state.moveSeq = (state.moveSeq || 0) + 1;
    me.hideCooldownUntil = state.moveSeq;
    var usedItem = (state.items || 0) > 0;
    var chance = 0.55 + (usedItem ? 0.25 : 0);
    if (usedItem) state.items = (state.items || 0) - 1;
    var caughtIds = [];
    if (Math.random() < chance) {
      me.hiddenUntil = state.moveSeq + 1;
      state.lastEvent = { type: 'hide-success', by: myId, usedItem: usedItem, seq: state.moveSeq };
    } else {
      var target = _hsMpComputeNearestTarget(state, state.moveSeq);
      caughtIds = _hsMpAdvanceMonsterToward(state, target);
      state.lastEvent = { type: 'hide-fail', by: myId, seq: state.moveSeq, caught: caughtIds };
    }
    if (!_hsMpAnyoneStillPlaying(state)) state.status = 'over';
    return state;
  }, function(error) { if (error) console.warn('[HS-MP] hide transaction failed:', error); });
}

function hsMpHandleRoomUpdate(room) {
  if (!_hsMP) return;
  _hsMP.room = room;
  if (!room) { say('The room was closed.'); hsMpLeaveLobby(); return; }
  if (room.status === 'waiting') {
    hsMpRenderLobby(room);
    return;
  }
  if (!_hsMP.active) { _hsMP.active = true; hsMpEnterPlayUI(room); }
  if (room.state && room.state.status === 'over') {
    if (!_hsMP.ended) { _hsMP.ended = true; hsMpEnterEndUI(room); }
    return;
  }
  hsMpHandleNewEvent(room);
  hsMpRenderPartyStatus(room);
  hsMpCheckPhase(room);
}

function hsMpRenderLobby(room) {
  var list = document.getElementById('hs-mp-players-list');
  if (!list) return;
  var lobby = room.lobby || {};
  var ids = Object.keys(lobby);

  // Announce joins/leaves by diffing against the last snapshot — the listener
  // just re-delivers the whole lobby object on every change, so without this
  // a new player showing up (or someone leaving) was completely silent.
  var prev = _hsMP.lobbySnapshot || {};
  ids.forEach(function(id) {
    if (id !== _hsMP.myId && !prev[id]) say(lobby[id].name + ' joined the lobby.');
  });
  Object.keys(prev).forEach(function(id) {
    if (id !== _hsMP.myId && !lobby[id]) say(prev[id] + ' left the lobby.');
  });
  var snapshot = {};
  ids.forEach(function(id) { snapshot[id] = lobby[id].name; });
  _hsMP.lobbySnapshot = snapshot;

  list.innerHTML = ids.map(function(id) {
    var p = lobby[id];
    var you = id === _hsMP.myId ? ' (you)' : '';
    return '<div>' + (p.ready ? '✓' : '…') + ' ' + p.name + you + '</div>';
  }).join('');
  document.getElementById('hs-mp-status').textContent = ids.length + ' of 5 players — ' + ids.filter(function(id){ return lobby[id].ready; }).length + ' ready.';
}

function hsMpEnterPlayUI(room) {
  document.getElementById('hs-mp-lobby').style.display = 'none';
  document.getElementById('hs-end').style.display = 'none';
  document.getElementById('hs-mp-party-status').style.display = 'block';
  document.getElementById('hs-play').style.display = 'block';
  document.getElementById('hs-room-desc').textContent = 'You stand still, listening.';
  document.getElementById('hs-end-retry-btn').onclick = hsShowMpLobby;
  var count = Object.keys((room.state && room.state.players) || {}).length;
  goTo('hideseek');
  _hsMP.currentTrack = HS_EXPLORE_TRACK;
  playTrack(HS_EXPLORE_TRACK);
  sfx('sfx-select');
  say('Hide and Seek begins. ' + count + ' players. Find the way out together — walk onto a caught teammate to rescue them.');
  setTimeout(function() { hsStartGrowlLoop(); }, 1500);
  // Meshes from a previous room (different teammate ids) would otherwise
  // linger forever in the shared, persistent scene.
  _clearHS3DPlayerMeshes();
  initHS3DView();
  hsMpRenderPartyStatus(room);
}

function hsMpAnnounceDistance(dist) {
  var msgs = { 6: 'You can hear it somewhere behind you.', 4: 'It is getting closer.', 2: 'It is right behind you. Hide, or run.', 1: 'It is almost on you.' };
  if (msgs[dist]) say(msgs[dist]);
}

function hsMpHandleNewEvent(room) {
  var ev = room.state && room.state.lastEvent;
  if (!ev || ev.seq === _hsMP.lastSeenSeq) return;
  _hsMP.lastSeenSeq = ev.seq;
  var isMe = ev.by === _hsMP.myId;
  var name = hsMpPlayerName(room, ev.by);
  if (ev.type === 'wall') {
    if (isMe) say('There is a wall that way.');
  } else if (ev.type === 'move') {
    if (isMe) {
      var parts = ['Moving ' + ev.dir + '.'];
      if (ev.foundItem) parts.push('You spot something that will help you hide.');
      if (ev.escaped) parts.push('You made it to the exit! You escaped.');
      say(parts.join(' '));
      if (!ev.escaped) hsMpAnnounceDistance(hsDistance());
    } else if (ev.escaped) {
      say(name + ' escaped!');
    }
    if (ev.rescued) {
      if (ev.rescued === _hsMP.myId) say('You were rescued' + (isMe ? '' : ' by ' + name) + '.');
      else say(hsMpPlayerName(room, ev.rescued) + ' was rescued' + (isMe ? '' : ' by ' + name) + '.');
    }
    (ev.caught || []).forEach(function(id) {
      if (id === _hsMP.myId) say('It caught you! Wait for a teammate to reach you.');
      else say(hsMpPlayerName(room, id) + ' was caught!');
    });
  } else if (ev.type === 'hide-cooldown') {
    if (isMe) say('Still catching your breath from last time.');
  } else if (ev.type === 'hide-success') {
    if (isMe) say('You hid successfully. The next advance will pass you by.');
  } else if (ev.type === 'hide-fail') {
    if (isMe) say('It sensed you.');
    (ev.caught || []).forEach(function(id) {
      if (id === _hsMP.myId) say('It caught you! Wait for a teammate to reach you.');
      else say(hsMpPlayerName(room, id) + ' was caught!');
    });
  }
  hsUpdateGrowl();
}

function hsMpRenderPartyStatus(room) {
  var box = document.getElementById('hs-mp-party-status');
  if (!box || !room.state || !room.state.players) return;
  var players = room.state.players;
  var lines = Object.keys(players).map(function(id) {
    var p = players[id];
    var you = id === _hsMP.myId ? ' (you)' : '';
    var status = p.escaped ? '🚪 escaped' : p.caught ? '⛓️ caught' : '🚶 exploring';
    return p.name + you + ' — ' + status;
  });
  box.innerHTML = '🫥 ' + (room.state.items || 0) + ' shared hiding spot' + (room.state.items === 1 ? '' : 's') + '<br>' + lines.join('<br>');
  // Keeps every teammate's 3D avatar (position, caught/escaped state) and the
  // monster in sync on every room update — not just after MY OWN moves —
  // so teammates walking around actually show up moving in the scene.
  _refreshHS3DPlayers();
  _refreshHS3DMonster();
  var badge = document.getElementById('hs-distance-badge');
  if (badge && !_hsMpMyPlayer()) return;
  if (badge) {
    var me = _hsMpMyPlayer();
    if (me && !me.caught && !me.escaped) {
      var dist = hsDistance();
      badge.textContent = dist + (dist === 1 ? ' room away' : ' rooms away');
    } else if (me && me.caught) {
      badge.textContent = 'caught — wait for rescue';
    } else if (me && me.escaped) {
      badge.textContent = 'escaped';
    }
  }
}

// Switches everyone's music the moment ANY active player is close — a
// shared party threat cue rather than a purely personal one, since the
// party succeeds or fails together.
function hsMpCheckPhase(room) {
  if (!room.state || !room.state.players || !room.state.monster) return;
  var mo = room.state.monster;
  var minDist = Infinity;
  Object.keys(room.state.players).forEach(function(id) {
    var p = room.state.players[id];
    if (p.caught || p.escaped) return;
    var d = Math.abs(p.x - mo.x) + Math.abs(p.y - mo.y);
    if (d < minDist) minDist = d;
  });
  var wantChase = minDist <= HS_CHASE_THRESHOLD;
  var wantTrack = wantChase ? HS_CHASE_TRACK : HS_EXPLORE_TRACK;
  if (_hsMP.currentTrack !== wantTrack) { _hsMP.currentTrack = wantTrack; playTrack(wantTrack); }
}

function hsMpEnterEndUI(room) {
  hsStopGrowlLoop();
  _stopHS3DLoop();
  var v3mp = document.getElementById('hs-3d-view');
  if (v3mp) v3mp.style.display = 'none';
  document.getElementById('hs-play').style.display = 'none';
  document.getElementById('hs-end').style.display = 'block';
  var players = (room.state && room.state.players) || {};
  var ids = Object.keys(players);
  var escapedCount = ids.filter(function(id) { return players[id].escaped; }).length;
  var allCaught = escapedCount === 0;
  document.getElementById('hs-end-title').textContent = allCaught ? 'Caught' : (escapedCount === ids.length ? 'Escaped' : 'Some Made It Out');
  document.getElementById('hs-end-text').textContent = allCaught
    ? 'It found everyone. Try again — the way out is different every time.'
    : 'The run is over. Here is how everyone fared:';
  var resultsBox = document.getElementById('hs-mp-end-results');
  resultsBox.style.display = 'block';
  resultsBox.innerHTML = ids.map(function(id) {
    var p = players[id];
    var you = id === _hsMP.myId ? ' (you)' : '';
    return (p.escaped ? '🚪' : '⛓️') + ' ' + p.name + you + ' — ' + (p.escaped ? 'escaped' : 'caught');
  }).join('<br>');
  playTrack(getMenuTrack());
  sfx(allCaught ? 'sfx-death' : 'sfx-confirm');
  say((allCaught ? 'Everyone was caught. ' : 'Run over. ') + escapedCount + ' of ' + ids.length + ' players escaped.');
}
// ── END HIDE AND SEEK — MULTIPLAYER ──

// -- SPELL SYSTEM --

var SPELL_COOLDOWN_NORMAL = 3;   // turns
var SPELL_COOLDOWN_POWERFUL = 6; // turns

var POWERFUL_SPELLS = ['time-stop','redeemed-souls','final-boss','legend-of-echoes','shadow-blast','lose-reality','grave-pact','void-collapse-sp','shadow-blast-sp'];

function hasSpellBookNow() {
  var ch = _charIdx !== null ? CHARS[_charIdx] : null;
  return !!((DS && DS.spellBook) || (ch && ch.spellBook));
}

var ARCANE_SHOP_ITEMS = [
  // Spell Book
  { id:'spell-book',     name:'Spell Book',           icon:'📖', cost:200,  type:'book',   rarity:'common',
    desc:'Allows magic classes to learn spells permanently. Required to build a spellbook.',
    apply: function() {
      // The book was only set on the current run, so from the menu it failed and
      // in a run it was forgotten when the run ended. It now lives on the character.
      var _bookCh = _charIdx !== null ? CHARS[_charIdx] : null;
      if (!hasSpellBookNow()) {
        DS.spellBook = true;
        if (_bookCh) _bookCh.spellBook = true;
        saveChars(); addLog('📖 Spell Book acquired. Magic classes can now learn spells permanently.'); say('Spell Book acquired.');
      }
      else { say('You already have a Spell Book.'); }
    }
  },
  // Common scrolls
  { id:'scroll-soulfire',   name:'Scroll of Soulfire',    icon:'🔥', cost:80,   type:'scroll', rarity:'common',  spellId:'soulfire',
    desc:'Common. Burns the enemy soul — ignores defense. 1.6x damage.' },
  { id:'scroll-void-bolt',  name:'Scroll of Void Bolt',   icon:'💜', cost:80,   type:'scroll', rarity:'common',  spellId:'void-bolt',
    desc:'Common. Darkness energy — 1.5x damage, 25% stun chance.' },
  { id:'scroll-frost-lance',name:'Scroll of Frost Lance',  icon:'❄️', cost:80,   type:'scroll', rarity:'common',  spellId:'frost-lance',
    desc:'Common. Freeze the enemy — they skip their next attack.' },
  { id:'scroll-blood-shield',name:'Scroll of Blood Shield',icon:'🛡️', cost:90,   type:'scroll', rarity:'common',  spellId:'blood-shield',
    desc:'Common. Absorb the next hit completely.' },
  { id:'scroll-agony',      name:'Scroll of Agony',        icon:'🔥', cost:100,  type:'scroll', rarity:'common',  spellId:'agony',
    desc:'Common. Curse with fire — 15 damage per turn for 3 turns. Fail: YOU burn for 25 per turn.' },
  { id:'scroll-fireball',   name:'Scroll of Fireball',     icon:'🔥', cost:90,   type:'scroll', rarity:'common',  spellId:'fireball',
    desc:'Common. 70% hits enemy for big damage. 30% miss — fireball returns. Defend fast.' },
  { id:'scroll-earthshake', name:'Scroll of Earthshake',   icon:'🌍', cost:85,   type:'scroll', rarity:'common',  spellId:'earthshake',
    desc:'Common. Shake the earth — damage + random buff or debuff.' },
  { id:'scroll-mirror-soul',name:'Scroll of Mirror Soul',  icon:'🪞', cost:95,   type:'scroll', rarity:'common',  spellId:'mirror-soul',
    desc:'Common. Reflect the last hit back at full damage.' },
  // Rare scrolls
  { id:'scroll-soul-bound', name:'Scroll of Soul Bound',   icon:'🔗', cost:350,  type:'scroll', rarity:'rare',    spellId:'soul-bound',
    desc:'Rare. Control the enemy for 1-3 turns. Death Knight controls undead permanently.' },
  { id:'scroll-soul-echo',  name:'Scroll of Soul Echo',    icon:'👁️', cost:300,  type:'scroll', rarity:'rare',    spellId:'soul-echo',
    desc:'Rare. Predict enemy attack — roll % to block it fully or partially.' },
  { id:'scroll-void-echo',  name:'Scroll of Void Echo',    icon:'🌑', cost:320,  type:'scroll', rarity:'rare',    spellId:'void-echo',
    desc:'Rare. +50% ATK and Fury. Fail: enemy also gets +25% ATK and Fury.' },
  { id:'scroll-extraction', name:'Scroll of Extraction',   icon:'⚗️', cost:380,  type:'scroll', rarity:'rare',    spellId:'extraction',
    desc:'Rare. 20% control enemy attack. Fail: Void Curse weakens all your attacks.' },
  { id:'scroll-blood-price',name:'Scroll of Blood Price',  icon:'🩸', cost:350,  type:'scroll', rarity:'rare',    spellId:'blood-price',
    desc:'Rare. Spend your HP to deal massive damage. You choose the sacrifice.' },
  { id:'scroll-grave-pact', name:'Scroll of Grave Pact',   icon:'⚰️', cost:400,  type:'scroll', rarity:'rare',    spellId:'grave-pact',
    desc:'Rare. Drop to 1 HP. Become unkillable and deal 2x damage for 3 turns.' },
  // Legendary scrolls
  { id:'scroll-time-stop',  name:'Scroll of Time Stop',    icon:'⌛', cost:1200, type:'scroll', rarity:'legendary', spellId:'time-stop',
    desc:'Legendary. 50/50 — attack 3 times uninterrupted OR instant defeat.' },
  { id:'scroll-shadow-blast',name:'Scroll of Shadow Blast', icon:'👤', cost:1000, type:'scroll', rarity:'legendary', spellId:'shadow-blast',
    desc:'Legendary. 30-40% control a void spirit. Fail: spirit defeats YOU instantly.' },
  { id:'scroll-legend-echoes',name:'Scroll of Legend of Echoes',icon:'🌀',cost:1500,type:'scroll',rarity:'legendary',spellId:'legend-of-echoes',
    desc:'Legendary. Fight an Echo of yourself in 5 minutes. Win: -30% damage all run. Lose: everything.' },
  { id:'scroll-redeemed-souls',name:'Scroll of Redeemed Souls',icon:'☀️',cost:2000,type:'scroll',rarity:'legendary',spellId:'redeemed-souls',
    desc:'Legendary. 50% steal enemy HP. 30% they steal yours. 20% mutual drain. Either wins.' },
  { id:'scroll-final-boss', name:'Scroll of The Final Boss', icon:'👑', cost:1800, type:'scroll', rarity:'legendary', spellId:'final-boss',
    desc:'Legendary. Boss only. Success: one massive free attack. Fail: lose ALL buffs and items.' },
  { id:'scroll-lose-reality',name:'Scroll of Lose Reality',  icon:'🌀', cost:1600, type:'scroll', rarity:'legendary', spellId:'lose-reality',
    desc:'Legendary. 5 minute timer. Kill the enemy or cease to exist. Win: massive reward + another scroll.' },
  // Additional common scrolls
  { id:'scroll-shadow-step', name:'Scroll of Shadow Step',   icon:'🌑', cost:80,   type:'scroll', rarity:'common',  spellId:'shadow-step',
    desc:'Common. Guaranteed escape from any combat.' },
  { id:'scroll-time-echo',   name:'Scroll of Time Echo',     icon:'⏰', cost:90,   type:'scroll', rarity:'common',  spellId:'time-echo',
    desc:'Common. Repeat your last attack instantly for free.' },
  { id:'scroll-chain-curse', name:'Scroll of Chain Curse',   icon:'⛓️', cost:95,   type:'scroll', rarity:'common',  spellId:'chain-curse',
    desc:'Common. Every enemy hit reflects 50% damage back for 3 turns.' },
  { id:'scroll-dungeon-echo',name:'Scroll of Dungeon Echo',  icon:'🏰', cost:100,  type:'scroll', rarity:'common',  spellId:'dungeon-echo',
    desc:'Common. Ask the dungeon one question. 50% answer. Fail: Tornado deals 60 damage to you.' },
  { id:'scroll-the-tornado', name:'Scroll of The Tornado',   icon:'🌪️', cost:110,  type:'scroll', rarity:'common',  spellId:'the-tornado',
    desc:'Common. 80 damage to enemy but 40 damage to you. Pure chaos.' },
  // Additional rare scrolls
  { id:'scroll-time-fracture',name:'Scroll of Time Fracture',icon:'⏰', cost:340,  type:'scroll', rarity:'rare',    spellId:'time-fracture',
    desc:'Rare. Auto-dodge next enemy attack. 40% chance your next attack also slows.' },
  { id:'scroll-the-hunger',  name:'Scroll of The Hunger',    icon:'🖤', cost:360,  type:'scroll', rarity:'rare',    spellId:'the-hunger',
    desc:'Rare. Heal 15 HP per kill for 3 kills. After 3: hunger drains 15 HP per turn.' },
  { id:'scroll-void-anchor', name:'Scroll of Void Anchor',   icon:'⚓', cost:320,  type:'scroll', rarity:'rare',    spellId:'void-anchor',
    desc:'Rare. Enemy cannot attack for 2 turns. You also cannot use items those turns.' },
  { id:'scroll-phantom-step',name:'Scroll of Phantom Step',  icon:'👻', cost:300,  type:'scroll', rarity:'rare',    spellId:'phantom-step',
    desc:'Rare. Become intangible — next 2 hits pass through you. Cannot attack while intangible.' },
  { id:'scroll-curse-ruin',  name:'Scroll of Curse of Ruin', icon:'💔', cost:380,  type:'scroll', rarity:'rare',    spellId:'curse-of-ruin',
    desc:'Rare. Enemy ATK permanently reduced 40% for fight. Costs massive SP.' },
  { id:'scroll-the-last-word',name:'Scroll of The Last Word',icon:'🗡️', cost:350,  type:'scroll', rarity:'rare',    spellId:'the-last-word',
    desc:'Rare. Only at below 20 HP. Deals damage equal to your MISSING HP.' },
  { id:'scroll-nightmare',   name:'Scroll of Nightmare Weave',icon:'😱',cost:360,  type:'scroll', rarity:'rare',    spellId:'nightmare-weave',
    desc:'Rare. Enemy frozen in fear for 1 turn. Fail: fear reflects — you freeze and they get a free hit.' },
  { id:'scroll-blood-oath',  name:'Scroll of Blood Oath',    icon:'🩸', cost:400,  type:'scroll', rarity:'rare',    spellId:'blood-oath',
    desc:'Rare. Next 3 attacks cannot miss, deal 150% damage. After: take 20 HP damage per oath attack.' },
  { id:'scroll-soul-fracture',name:'Scroll of Soul Fracture',icon:'💥', cost:350,  type:'scroll', rarity:'rare',    spellId:'soul-fracture',
    desc:'Rare. Split enemy into 2 at 40% stats for 1 turn. Kill both: massive gold. Kill one: other reforms stronger.' },
  { id:'scroll-dungeon-wrath',name:'Scroll of Dungeon\'s Wrath',icon:'🏰',cost:280,type:'scroll', rarity:'rare',   spellId:'dungeon-wrath',
    desc:'Rare. Deals 10 damage per floor you are on. Weak early. Devastating on floor 10.' },
  { id:'scroll-soul-leash',  name:'Scroll of Soul Leash',    icon:'🔗', cost:380,  type:'scroll', rarity:'rare',    spellId:'soul-leash',
    desc:'Rare. Tether your soul to the enemy. They die: you heal 50% of their max HP. You die: they also die.' },
  { id:'scroll-the-reckoning',name:'Scroll of The Reckoning',icon:'⚖️', cost:360,  type:'scroll', rarity:'rare',   spellId:'the-reckoning',
    desc:'Rare. Deals damage equal to total damage enemy dealt to you this fight.' },
  { id:'scroll-curse-echoes', name:'Scroll of Curse of Echoes',icon:'👁️',cost:340, type:'scroll', rarity:'rare',   spellId:'curse-echoes',
    desc:'Rare. Every enemy attack also damages themselves at 30% for 3 turns.' },
  { id:'scroll-the-sacrifice',name:'Scroll of The Sacrifice', icon:'💔', cost:320,  type:'scroll', rarity:'rare',   spellId:'the-sacrifice',
    desc:'Rare. Instantly kill any non-boss enemy. You lose 40% current HP.' },
  // Additional legendary scrolls
  { id:'scroll-void-mirror',  name:'Scroll of Void Mirror',   icon:'🖤', cost:1400, type:'scroll', rarity:'legendary', spellId:'void-mirror',
    desc:'Legendary. For 2 turns — your weaknesses become strengths and strengths become weaknesses.' },
  { id:'scroll-abyss-stares', name:'Scroll of The Abyss Stares Back',icon:'👁️',cost:1300,type:'scroll',rarity:'legendary',spellId:'abyss-stares',
    desc:'Legendary. 40% enemy loses 50% ATK forever. 60% YOU lose 50% ATK forever. Cannot be undone.' },
  { id:'scroll-phantom-army', name:'Scroll of Phantom Army',  icon:'👻', cost:1100, type:'scroll', rarity:'legendary', spellId:'phantom-army',
    desc:'Legendary. 3 ghosts each deal 15 damage. 30% chance each misses. Could deal 45 or 0.' },
  { id:'scroll-the-last-laugh',name:'Scroll of The Last Laugh',icon:'😈',cost:1200, type:'scroll', rarity:'legendary', spellId:'last-laugh',
    desc:'Legendary. Only at enemy below 10% HP. Instant kill. Miscalculate: enemy heals to 50% HP.' },
  { id:'scroll-shattered-reality',name:'Scroll of Shattered Reality',icon:'🔮',cost:1500,type:'scroll',rarity:'legendary',spellId:'shattered-reality',
    desc:'Legendary. Enemy ATK becomes their DEF and DEF becomes ATK for 1 turn.' },
  { id:'scroll-the-forgotten',name:'Scroll of The Forgotten',  icon:'🌫️', cost:1000, type:'scroll', rarity:'legendary', spellId:'the-forgotten',
    desc:'Legendary. Enemy forgets you exist for 2 turns — no attacks. Break it by attacking.' },
  { id:'scroll-soul-drain',   name:'Scroll of Soul Drain',     icon:'💀', cost:900,  type:'scroll', rarity:'legendary', spellId:'soul-drain',
    desc:'Legendary. Steal HP directly from the enemy for 2 turns.' },
  { id:'scroll-the-unwritten',name:'Scroll of The Unwritten',  icon:'❓', cost:500,  type:'scroll', rarity:'legendary', spellId:'the-unwritten',
    desc:'Legendary. Random effect. Could be incredible. Could be catastrophic. Find out.' },
  { id:'scroll-void-collapse', name:'Scroll of Void Collapse',  icon:'🌑', cost:1100, type:'scroll', rarity:'legendary', spellId:'void-collapse',
    desc:'Legendary. Massive damage. 20% hits back on you too.' },
];

function getSpellLearnChance(cls) {
  var magicClasses = ['Wizard','Sorcerer','Mage','Arcanist','Elementalist','VoidWalker','ShadowMage','TimeMage'];
  var semiMagic = ['Warlock','Necromancer','Druid','Cleric','Shaman'];
  if (cls === 'Arcanist') return 0.95;
  if (magicClasses.indexOf(cls) !== -1) return 0.75;
  if (semiMagic.indexOf(cls) !== -1) return 0.45;
  return 0.18;
}

function isMagicClass(cls) {
  var magic = ['Wizard','Sorcerer','Arcanist','Elementalist','VoidWalker','ShadowMage','TimeMage','Warlock','Necromancer','Druid','Cleric','Shaman'];
  return magic.indexOf(cls) !== -1;
}

function getLearnedSpells() {
  if (_charIdx === null) return [];
  return CHARS[_charIdx].learnedSpells || [];
}

function hasLearnedSpell(spellId) {
  return getLearnedSpells().indexOf(spellId) !== -1;
}

function learnSpell(spellId) {
  if (_charIdx === null) return;
  if (!CHARS[_charIdx].learnedSpells) CHARS[_charIdx].learnedSpells = [];
  if (!hasLearnedSpell(spellId)) {
    CHARS[_charIdx].learnedSpells.push(spellId);
    saveChars();
  }
}

var _arcaneShopOrigin = 'menu';

function openArcaneShop() {
  var activeSc = document.querySelector('.screen.active');
  var activeId = activeSc ? activeSc.id : '';
  _arcaneShopOrigin = (activeId === 'screen-dungeon' || activeId === 'screen-battle') ? 'dungeon' : 'menu';
  var gold = DS ? (DS.gold || 0) : (_charIdx !== null && CHARS[_charIdx] ? (CHARS[_charIdx].gold || 0) : 0);
  var goldEl = document.getElementById('as-gold');
  if (goldEl) goldEl.textContent = '💰 ' + gold + ' gold';

  var sbStatus = document.getElementById('as-spellbook-status');
  var hasBook = hasSpellBookNow();
  var cls = DS ? DS.cls : (_charIdx !== null && CHARS[_charIdx] ? CHARS[_charIdx].cls : '');
  if (sbStatus) {
    if (hasBook) sbStatus.textContent = '📖 ' + t('Spell Book owned · ') + Math.round(getSpellLearnChance(cls)*100) + t('% learn chance as ') + cls;
    else sbStatus.textContent = t('No Spell Book — buy one to learn spells permanently');
  }

  var list = document.getElementById('as-items');
  if (list) {
    list.innerHTML = '';
    ARCANE_SHOP_ITEMS.forEach(function(item) {
      var canAfford = gold >= item.cost;
      var alreadyLearned = item.type === 'scroll' && hasLearnedSpell(item.spellId);
      var rarityColor = item.rarity === 'legendary' ? '#ffdd44' : item.rarity === 'rare' ? '#aa66ff' : '#888';
      var btn = document.createElement('button');
      btn.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px 14px;background:#0a0010;border:1px solid ' + rarityColor + ';width:100%;cursor:pointer;text-align:left;opacity:' + (canAfford && !alreadyLearned ? '1' : '0.5') + ';margin-bottom:2px;';
      btn.setAttribute('aria-label', t(item.name) + '. ' + t(item.desc) + '. ' + t('Cost') + ' ' + item.cost + ' ' + t('gold') + '.' + (alreadyLearned ? ' ' + t('Already learned.') : '') + (canAfford ? '' : ' ' + t('Cannot afford.')));
      btn.innerHTML =
        '<span style="font-size:1.4rem;" aria-hidden="true">' + item.icon + '</span>' +
        '<div style="flex:1;">' +
          '<div style="font-family:Cinzel,serif;font-size:0.72rem;color:' + rarityColor + ';">' + t(item.name) + ' <span style="font-size:0.55rem;opacity:0.7;">[' + t(item.rarity.toUpperCase()) + ']</span></div>' +
          '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#888;margin-top:2px;">' + t(item.desc) + '</div>' +
        '</div>' +
        '<span style="font-family:Cinzel,serif;font-size:0.7rem;color:#ffdd44;white-space:nowrap;">' + (alreadyLearned ? '✅ ' + t('Known') : item.cost + 'g') + '</span>';
      if (alreadyLearned) {
        btn.disabled = true;
      } else {
        btn.onclick = function() {
          var currentGold = DS ? DS.gold : (_charIdx !== null ? CHARS[_charIdx].gold : 0);
          if (currentGold < item.cost) { say('Not enough gold. Need ' + item.cost + ' gold.'); sfx('sfx-select'); return; }
          // Deduct gold from the correct source — DS.gold during a run, CHARS gold from menu
          if (DS && DS.gold !== undefined) {
            DS.gold = Math.max(0, (DS.gold || 0) - item.cost);
            spendGlobalGold(item.cost);
            updateTopBar();
          } else if (_charIdx !== null && CHARS[_charIdx]) {
            CHARS[_charIdx].gold = Math.max(0, (CHARS[_charIdx].gold || 0) - item.cost);
          }
          saveChars(); sfx('sfx-purchase');
          if (item.type === 'book') {
            item.apply();
          } else {
            var cls2 = DS ? DS.cls : (_charIdx !== null && CHARS[_charIdx] ? CHARS[_charIdx].cls : '');
            var hasBook2 = hasSpellBookNow();
            if (hasBook2 && isMagicClass(cls2)) {
              var chance = getSpellLearnChance(cls2);
              if (Math.random() < chance) {
                learnSpell(item.spellId);
                if (DS) addLog('✨ ' + item.name + ' learned permanently!');
                say(item.name + ' learned permanently! It is now in your spell book.');
              } else {
                if (DS) addLog('📜 Failed to learn ' + item.name + '. Scroll consumed.');
                say('Failed to learn ' + item.name + '. The scroll dissolved.');
              }
            } else {
              seasonalGive({ name: item.name, icon: item.icon, type:'scroll', spellId: item.spellId, desc: item.desc });
              saveChars();
              say(item.name + ' added to inventory. One time use in combat.');
            }
          }
          var newGold = DS ? DS.gold : (_charIdx !== null ? CHARS[_charIdx].gold : 0);
          if (goldEl) goldEl.textContent = '💰 ' + newGold + ' gold';
          btn.querySelector('span:last-child').textContent = '✅ Bought';
          btn.disabled = true; btn.style.opacity = '0.5';
        };
      }
      list.appendChild(btn);
    });
  }

  goTo('arcane-shop');
  say('Arcane Shop. ' + ARCANE_SHOP_ITEMS.length + ' items. You have ' + gold + ' gold.');
}

function closeArcaneShop() {
  sfx('sfx-select');
  if (_arcaneShopOrigin === 'dungeon') {
    goTo('dungeon');
  } else {
    goTo('menu');
  }
}

// -- SPELL BOOK SCREEN --
var _spellBookOrigin = 'menu';

function openSpellBook() {
  sfx('sfx-select');
  // Remember where we came from
  var currentScreen = document.querySelector('.screen.active');
  var activeSc = document.querySelector('.screen.active');
  var activeId = activeSc ? activeSc.id : '';
  _spellBookOrigin = (activeId === 'screen-dungeon' || activeId === 'screen-battle') ? 'dungeon' : (activeId === 'screen-arcane-shop') ? 'arcane-shop' : 'menu';

  var learned = getLearnedSpells();
  var list = document.getElementById('spellbook-list');
  var empty = document.getElementById('spellbook-empty');
  var info = document.getElementById('spellbook-class-info');

  var cls = DS ? DS.cls : (_charIdx !== null && CHARS[_charIdx] ? CHARS[_charIdx].cls : '');
  var hasBook = hasSpellBookNow();
  var learnChance = Math.round(getSpellLearnChance(cls) * 100);

  if (info) {
    if (hasBook && cls) info.textContent = '📖 ' + cls + ' · ' + learnChance + '% learn chance · ' + learned.length + ' spell' + (learned.length !== 1 ? 's' : '') + ' learned';
    else if (cls) info.textContent = cls + ' · No Spell Book owned · ' + learned.length + ' spell' + (learned.length !== 1 ? 's' : '') + ' learned';
    else info.textContent = learned.length + ' spell' + (learned.length !== 1 ? 's' : '') + ' learned';
  }

  if (list) {
    list.innerHTML = '';
    if (learned.length === 0) {
      if (empty) empty.style.display = '';
      list.style.display = 'none';
    } else {
      if (empty) empty.style.display = 'none';
      list.style.display = 'flex';
      learned.forEach(function(spellId) {
        var spellItem = ARCANE_SHOP_ITEMS.find(function(i){ return i.spellId === spellId; });
        if (!spellItem) return;
        var isPowerful = POWERFUL_SPELLS.indexOf(spellId) !== -1;
        var rarityColor = spellItem.rarity === 'legendary' ? '#ffdd44' : spellItem.rarity === 'rare' ? '#aa66ff' : '#aaaaaa';
        var cooldownLabel = isPowerful ? '6-turn cooldown' : '3-turn cooldown';
        var entry = document.createElement('div');
        entry.setAttribute('role', 'listitem');
        entry.setAttribute('aria-label', spellItem.name + '. ' + spellItem.desc + '. ' + spellItem.rarity + '. ' + cooldownLabel + '.');
        entry.style.cssText = 'display:flex;align-items:flex-start;gap:12px;padding:14px;background:#0a0010;border:1px solid ' + rarityColor + ';';
        entry.innerHTML =
          '<span style="font-size:1.4rem;" aria-hidden="true">' + spellItem.icon + '</span>' +
          '<div style="flex:1;">' +
            '<div style="font-family:Cinzel,serif;font-size:0.72rem;color:' + rarityColor + ';">' + spellItem.name +
              ' <span style="font-size:0.55rem;opacity:0.7;">[' + spellItem.rarity.toUpperCase() + ']</span></div>' +
            '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#888;margin-top:4px;line-height:1.5;">' + spellItem.desc + '</div>' +
            '<div style="font-family:Cinzel,serif;font-size:0.55rem;color:#555;margin-top:4px;">' + (isPowerful ? '⚡ Powerful — 6 turn cooldown' : '· 3 turn cooldown') + '</div>' +
          '</div>';
        list.appendChild(entry);
      });
    }
  }

  goTo('spell-book');
  say('Spell Book. ' + learned.length + ' spell' + (learned.length !== 1 ? 's' : '') + ' learned.' + (learned.length > 0 ? ' Swipe to browse.' : ' Visit the Arcane Shop to learn spells.'));
}

function closeSpellBook() {
  sfx('sfx-select');
  if (_spellBookOrigin === 'arcane-shop') goTo('arcane-shop');
  else if (_spellBookOrigin === 'dungeon') goTo('dungeon');
  else goTo('menu');
}

// Show spells button in combat if character has learned spells
function updateCombatSpellBtn() {
  var btn = document.getElementById('cbtn-spells');
  if (!btn) return;
  var learned = getLearnedSpells();
  btn.style.display = (learned.length > 0) ? '' : 'none';
}

// Open spell casting panel in combat
function openCombatSpells() {
  var learned = getLearnedSpells();
  if (learned.length === 0) { say('No spells learned. Visit the Arcane Shop.'); return; }

  // Check cooldown
  if (DS._spellCooldown && DS._spellCooldown > 0) {
    say('Spells on cooldown. ' + DS._spellCooldown + ' turns remaining.');
    return;
  }

  // Build spell list overlay
  var existing = document.getElementById('combat-spell-panel');
  if (existing) existing.remove();

  var panel = document.createElement('div');
  panel.id = 'combat-spell-panel';
  panel.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.96);z-index:8500;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:20px;overflow-y:auto;';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-label','Choose a spell to cast');

  var html = '<div style="max-width:400px;width:100%;">' +
    '<div style="font-family:Cinzel,serif;font-size:0.6rem;letter-spacing:0.3em;color:#aa66ff;margin-bottom:16px;text-align:center;">✨ CAST A SPELL</div>';

  learned.forEach(function(spellId) {
    var spellItem = ARCANE_SHOP_ITEMS.find(function(i){ return i.spellId === spellId; });
    if (!spellItem) return;
    var isPowerful = POWERFUL_SPELLS.indexOf(spellId) !== -1;
    html += '<button onclick="castSpell(\'' + spellId + '\')" style="display:flex;align-items:center;gap:10px;padding:12px;background:#0a0010;border:1px solid #aa66ff;width:100%;cursor:pointer;margin-bottom:8px;text-align:left;" aria-label="Cast ' + spellItem.name + '. ' + spellItem.desc + (isPowerful ? '. Powerful spell — 6 turn cooldown.' : '. 3 turn cooldown.') + '">' +
      '<span style="font-size:1.4rem;" aria-hidden="true">' + spellItem.icon + '</span>' +
      '<div style="flex:1;">' +
        '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:#cc88ff;">' + spellItem.name + ' ' + (isPowerful ? '<span style="font-size:0.55rem;color:#ffdd44;">[POWERFUL — 6 turns]</span>' : '<span style="font-size:0.55rem;color:#888;">[3 turns]</span>') + '</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.58rem;color:#666;margin-top:2px;">' + spellItem.desc + '</div>' +
      '</div>' +
    '</button>';
  });

  html += '<button onclick="document.getElementById(\'combat-spell-panel\').remove()" style="width:100%;padding:12px;background:transparent;border:1px solid #333;color:#666;font-family:Cinzel,serif;font-size:0.7rem;cursor:pointer;margin-top:4px;" aria-label="Cancel spell casting">Cancel</button></div>';
  panel.innerHTML = html;
  document.body.appendChild(panel);
  var firstBtn = panel.querySelector('button');
  if (firstBtn) firstBtn.focus();
  say('Spell casting. ' + learned.length + ' spells available. Choose one to cast.');
}

function castSpell(spellId) {
  var panel = document.getElementById('combat-spell-panel');
  if (panel) panel.remove();

  // BUGFIX: castSpell() was the only combat entry point (unlike doFight/useSkill)
  // with no inCombat/enemy guard, and it committed the cooldown + cast count before
  // ever checking whether there was a fight to cast into — a spell used outside
  // combat, or after DS.enemy was cleared by a special-encounter handler, burned a
  // cooldown for nothing instead of being rejected.
  if (!DS.inCombat || !DS.enemy) { say('No enemy to target.'); return; }

  var isPowerful = POWERFUL_SPELLS.indexOf(spellId) !== -1;
  DS._spellCooldown = isPowerful ? SPELL_COOLDOWN_POWERFUL : SPELL_COOLDOWN_NORMAL;
  DS._spellCastCount = (DS._spellCastCount || 0) + 1;

  var spellItem = ARCANE_SHOP_ITEMS.find(function(i){ return i.spellId === spellId; });
  var spellName = spellItem ? spellItem.name : spellId;

  // Spell subclass passives (they only set flags): spell power, cooldowns, Stormcaller's longer freeze
  var _spE = DS.enemy, _spHpBefore = _spE ? _spE.hp : 0;
  applySpellEffect(spellId, spellName);
  try {
    var _spPow = spellSubclassPower(spellId, _spE);
    if (_spE && _spPow > 1 && _spE.hp > 0 && _spE.hp < _spHpBefore) {
      var _spExtra = Math.round((_spHpBefore - _spE.hp) * (_spPow - 1));
      _spE.hp = Math.max(0, _spE.hp - _spExtra);
      addLog('✨ Your path empowers the spell: +' + _spExtra + ' damage.');
      updateEnemyBar();
      if (_spE.hp <= 0) setTimeout(function(){ enemyDead(); }, 500);
    }
    // Echo Staff — "spells cast twice, the second for 50%" (only a description before)
    if (_spE && _spE.hp > 0 && _spE.hp < _spHpBefore && DS.equippedWeapon && /^(.* )?Echo Staff/.test(DS.equippedWeapon.name || '')) {
      var _echo = Math.max(1, Math.round((_spHpBefore - _spE.hp) * 0.5));
      _spE.hp = Math.max(0, _spE.hp - _echo);
      addLog('🔮 The Echo Staff repeats the spell for ' + _echo + ' damage!');
      updateEnemyBar();
      if (_spE.hp <= 0) setTimeout(function(){ enemyDead(); }, 500);
    }
    var _spStunBefore = fxGet().stun;
    spellPostEffects(spellId);
    if (DS._stormcaller && fxGet().stun > _spStunBefore) fxGet().stun++;
    if (spellFreeCooldown(spellId)) DS._spellCooldown = 0;
  } catch (e) {}
}

var SPELL_FIRE = ['soulfire', 'agony', 'fireball'];
var SPELL_VOID = ['void-bolt', 'void-echo', 'void-anchor', 'void-mirror', 'void-collapse', 'extraction'];
var SPELL_SHADOW = ['shadow-step', 'shadow-blast', 'nightmare-weave', 'phantom-step', 'the-forgotten', 'soul-drain'];
function spellSubclassPower(id, e) {
  var m = 1;
  if (DS._pureMagic) m *= 1.5;
  if (DS._firelord && SPELL_FIRE.indexOf(id) !== -1) m *= 1.6;
  if (DS._earthbound && id === 'earthshake') m *= 1.8;
  // Elementalist — fire, ice and lightning spells +40% (never read)
  if (DS._elementalist && (SPELL_FIRE.indexOf(id) !== -1 || id === 'frost-lance' || id === 'earthshake')) m *= 1.4;
  if (DS._voidBorn && SPELL_VOID.indexOf(id) !== -1 && e && /Ghost|Spirit|Wraith|Spect|Phantom|Shade|Wisp|Banshee/.test(e.name || '')) m *= 1.5;
  return m;
}
// Phase Walker: void spells free on floors 8–10; Night Shroud: shadow spells free at night;
// Spell Weaver: two spells before the cooldown starts.
function spellFreeCooldown(id) {
  if (DS._phaseWalker && SPELL_VOID.indexOf(id) !== -1 && DS.floor >= 8 && DS.floor <= 10) return true;
  // Shadow Mage — shadow spells cost no cooldown (never read)
  if (DS._shadowCooldownFree && SPELL_SHADOW.indexOf(id) !== -1) return true;
  // Time Mage — time spells: 3 turns of cooldown instead of 6
  if (DS._timeMageCooldownReduction && ['time-stop','time-echo','time-fracture'].indexOf(id) !== -1 && DS._spellCooldown > 3) DS._spellCooldown = 3;
  if (DS._nightShroud && SPELL_SHADOW.indexOf(id) !== -1 && isNightTime()) return true;
  if (DS._spellWeaver) { DS._weaveCount = (DS._weaveCount || 0) + 1; if (DS._weaveCount % 2 === 1) return true; }
  return false;
}

// ── SPELL FOLLOW-THROUGH (v11.7.3) ──
// Most spells set a flag after their message that nothing ever read: Frost
// Lance's freeze, Blood Shield, Phantom Step, Void Anchor, Chain Curse, Soul
// Drain, The Forgotten, Blood Oath, Soul Bound, Nightmare Weave, Curse of
// Echoes, Void Mirror, Time Fracture, The Hunger, Soul Leash, Soul Echo,
// Extraction, Void Bolt's stun and the Fireball that comes back. Each flag is
// turned into the effect its scroll describes.
function spellPostEffects(spellId) {
  var f = fxGet();
  var stunFor = Math.max(DS._enemyStunned || 0, DS._enemyFrozen || 0, DS._enemyAnchored || 0, DS._enemyNightmare || 0);
  if (stunFor > 0) f.stun = Math.max(f.stun, stunFor);
  DS._enemyStunned = 0; DS._enemyFrozen = 0; DS._enemyAnchored = 0; DS._enemyNightmare = 0;
  if (DS._enemyForgot) { f.forgotten = DS._enemyForgot; DS._enemyForgot = 0; }
  if (DS._playerFrozen) { DS.frozen = true; DS._playerFrozen = 0; }
  if (DS._bloodShield) { f.dodge += 1; DS._bloodShield = false; }
  if (DS._phantomStep) { f.dodge += DS._phantomStep; DS._phantomStep = 0; }
  if (DS._dodgeNext) { f.dodge += 1; DS._dodgeNext = false; }
  if (DS._soulEchoPerfect) { f.dodge += 1; DS._soulEchoPerfect = false; }
  if (DS._soulEchoPartial) { f.soften = 1 - DS._soulEchoPartial; f.softenHits = 1; DS._soulEchoPartial = 0; }
  if (DS._chainCurse) { f.thorns = 0.5; f.thornsTurns = DS._chainCurse; DS._chainCurse = 0; }
  if (DS._soulDrain) { f.soulDrain = DS._soulDrain; DS._soulDrain = 0; }
  if (DS._enemyControlled) { f.controlled = DS._enemyControlled; DS._enemyControlled = 0; }
  if (DS._extractControl) { f.controlled = Math.max(f.controlled || 0, 1); DS._extractControl = false; }
  if (DS._bloodOath) { f.bloodOath = DS._bloodOath; DS._bloodOath = 0; }
  if (DS._curseEchoes) { f.curseEchoes = DS._curseEchoes; DS._curseEchoes = 0; }
  if (DS._voidMirror) { f.voidMirror = DS._voidMirror; DS._voidMirror = 0; }
  if (DS._soulLeash) { f.soulLeash = true; DS._soulLeash = false; }
  if (DS._hungerActive) { DS._hungerKills = 3; DS._hungerActive = 0; }
  if (DS._furyActive) {
    var fury = Math.floor(DS.atk[1] * 0.5);
    f.fightAtk += fury; DS.atkBonus += fury; DS._furyActive = false;
  }
  if (DS._fireballReturn > 0) { f.fireballReturn = DS._fireballReturn; DS._fireballReturn = 0; }
}

function applySpellEffect(spellId, spellName) {
  var e = DS.enemy;
  if (!e) { say('No enemy to target.'); return; }
  var baseDmg = Math.floor((DS.atk || 10) * 1.6);

  switch(spellId) {
    case 'soulfire':
      var dmg = Math.floor(baseDmg * 1.6);
      e.hp = Math.max(0, e.hp - dmg);
      addLog('🔥 Soulfire! ' + dmg + ' damage ignoring defense!');
      say('Soulfire! ' + dmg + ' soul damage.');
      break;
    case 'void-bolt':
      var dmg2 = Math.floor(baseDmg * 1.5);
      e.hp = Math.max(0, e.hp - dmg2);
      if (Math.random() < 0.25) { DS._enemyStunned = 1; addLog('💜 Void Bolt! ' + dmg2 + ' damage. Enemy stunned!'); say('Void Bolt! Enemy stunned for 1 turn.'); }
      else { addLog('💜 Void Bolt! ' + dmg2 + ' damage.'); say('Void Bolt! ' + dmg2 + ' damage.'); }
      break;
    case 'frost-lance':
      var dmg3 = Math.floor(baseDmg * 1.3);
      e.hp = Math.max(0, e.hp - dmg3);
      DS._enemyFrozen = 1;
      addLog('❄️ Frost Lance! ' + dmg3 + ' damage. Enemy frozen!');
      say('Frost Lance! Enemy frozen — they skip their next attack.');
      break;
    case 'blood-shield':
      DS._bloodShield = true;
      addLog('🛡️ Blood Shield! Next hit absorbed completely.');
      say('Blood Shield! The next hit will be absorbed completely.');
      break;
    case 'agony':
      if (Math.random() < 0.55) {
        DS._enemyBurning = { dmg: 15, turns: 3 };
        addLog('🔥 Agony! Enemy burns for 15 damage per turn for 3 turns!');
        say('Agony! Enemy cursed with burning agony.');
      } else {
        DS._playerBurning = { dmg: 25, turns: 3 };
        addLog('🔥 Agony backfired! YOU burn for 25 damage per turn!');
        say('Agony backfired. You burn for 25 damage per turn for 3 turns.');
      }
      break;
    case 'fireball':
      if (Math.random() < 0.70) {
        var dmg4 = Math.floor(baseDmg * 1.8);
        e.hp = Math.max(0, e.hp - dmg4);
        addLog('🔥 Fireball! ' + dmg4 + ' fire damage!');
        say('Fireball hits! ' + dmg4 + ' fire damage!');
      } else {
        addLog('🔥 Fireball missed! It\'s coming back — DEFEND NOW!');
        say('Fireball missed! It is coming back at you. Defend or take full damage!');
        DS._fireballReturn = Math.floor(baseDmg * 1.8);
        setTimeout(function() {
          if (DS._fireballReturn && DS.defending) {
            var reflected = Math.floor(DS._fireballReturn * 0.5);
            DS.hp = Math.max(0, DS.hp - reflected);
            addLog('🛡️ Defended! Took ' + reflected + ' reflected fireball damage.');
          } else if (DS._fireballReturn) {
            DS.hp = Math.max(0, DS.hp - DS._fireballReturn);
            addLog('🔥 Fireball hits you for ' + DS._fireballReturn + ' damage!');
          }
          DS._fireballReturn = 0;
          updatePlayerBar();
          // checkPlayerDeath() doesn't exist anywhere in this codebase —
          // every other combat-damage site uses this exact guarded
          // handleDeath() pattern instead. Without it, a fatal fireball
          // backfire threw a ReferenceError instead of ending the run.
          if (DS.hp <= 0) { handleDeath(); }
        }, 2000);
        setCombatBtns(true);
        updatePlayerBar();
        updateEnemyBar();
        return;
      }
      break;
    case 'mirror-soul':
      var lastHit = DS._lastEnemyHit || 0;
      if (lastHit > 0) {
        e.hp = Math.max(0, e.hp - lastHit);
        addLog('🪞 Mirror Soul! Reflected ' + lastHit + ' damage back!');
        say('Mirror Soul! Reflected ' + lastHit + ' damage at the enemy.');
      } else {
        addLog('🪞 Mirror Soul fizzled — no hit to reflect.');
        say('Mirror Soul fizzled. No recent hit to reflect.');
      }
      break;
    case 'soul-bound':
      if (Math.random() < 0.50) {
        DS._enemyControlled = (DS.cls === 'DeathKnight' && e.enemyType === 'undead') ? 99 : Math.floor(Math.random() * 2) + 1;
        addLog('🔗 Soul Bound! Enemy controlled for ' + DS._enemyControlled + ' turn(s)!');
        say('Soul Bound! Enemy under your control for ' + DS._enemyControlled + ' turns.');
      } else {
        addLog('🔗 Soul Bound failed! The soul resisted.');
        say('Soul Bound failed. The soul was too strong.');
      }
      break;
    case 'grave-pact':
      DS._gravePact = 3;
      DS._gravePactHp = DS.hp;
      DS.hp = 1;
      DS._gravePactActive = true;
      addLog('⚰️ Grave Pact! HP dropped to 1. Unkillable for 3 turns, 2x damage!');
      say('Grave Pact! You drop to 1 HP but become unkillable for 3 turns with double damage.');
      updatePlayerBar();
      break;
    case 'blood-price':
      var sacrifice = Math.min(DS.hp - 1, Math.floor(DS.maxHp * 0.3));
      var bpDmg = sacrifice * 3;
      DS.hp = Math.max(1, DS.hp - sacrifice);
      e.hp = Math.max(0, e.hp - bpDmg);
      addLog('🩸 Blood Price! Spent ' + sacrifice + ' HP for ' + bpDmg + ' damage!');
      say('Blood Price. Spent ' + sacrifice + ' HP. Dealt ' + bpDmg + ' damage.');
      updatePlayerBar();
      break;
    case 'time-stop':
      // Time Lord — time obeys you: Time Stop always works
      if (DS._timeLord || Math.random() < 0.50) {
        DS._timeStop = 3;
        addLog('⌛ Time Stop! 3 free attacks — enemy cannot respond!');
        say('Time Stop! Time freezes. You have 3 free attacks.');
      } else {
        addLog('⌛ Time Stop failed. Time rejected you. Instant defeat.');
        say('Time Stop failed. Time itself defeated you.');
        setTimeout(function(){ handleDeath(); }, 1000);
      }
      setCombatBtns(true);
      updatePlayerBar();
      updateEnemyBar();
      return;
    case 'redeemed-souls':
      var roll = Math.random();
      if (roll < 0.50) {
        var stolen = e.hp;
        DS.hp = Math.min(DS.maxHp, DS.hp + stolen);
        e.hp = 0;
        addLog('☀️ Redeemed Souls! Stole ' + stolen + ' HP from enemy!');
        say('Redeemed Souls! You stole the enemy\'s life force.');
        updatePlayerBar();
      } else if (roll < 0.80) {
        var lostHp = DS.hp;
        e.hp = Math.min(e.maxHp || e.hp + lostHp, (e.maxHp || e.hp) + lostHp);
        DS.hp = 1;
        addLog('☀️ Redeemed Souls backfired! Enemy stole your HP!');
        say('Redeemed Souls backfired. The enemy stole your life force.');
        updatePlayerBar();
      } else {
        var mutual = Math.floor(Math.min(DS.hp, e.hp) * 0.5);
        DS.hp = Math.max(0, DS.hp - mutual);
        e.hp = Math.max(0, e.hp - mutual);
        addLog('☀️ Redeemed Souls — mutual drain! Both lost ' + mutual + ' HP!');
        say('Redeemed Souls mutual drain. Both lost ' + mutual + ' HP.');
        updatePlayerBar();
      }
      break;
    case 'final-boss':
      if (!e.isBoss) { say('The Final Boss can only be cast on bosses.'); DS._spellCooldown = 0; return; }
      var hpPct = e.hp / (e.maxHp || e.hp);
      var chance = hpPct > 0.5 ? 0.10 : hpPct > 0.25 ? 0.35 : hpPct > 0.10 ? 0.60 : 0.85;
      if (Math.random() < chance) {
        var fbDmg = Math.floor(baseDmg * 3.5);
        e.hp = Math.max(0, e.hp - fbDmg);
        addLog('👑 THE FINAL BOSS! ' + fbDmg + ' unstoppable damage!');
        say('The Final Boss! ' + fbDmg + ' devastating damage.');
      } else {
        // (this took your skills away for the whole run; the scroll says buffs)
        DS._buffActive = false; DS._gravePactActive = false;
        fxReset();
        if (DS._tempAtk && DS._tempAtk.turns > 0) { DS.atkBonus -= DS._tempAtk.n; DS._tempAtk = null; }
        if (DS._tempDef && DS._tempDef.turns > 0) { DS.defBonus -= DS._tempDef.n; DS._tempDef = null; }
        addLog('👑 The Final Boss laughed. All your buffs are stripped!');
        say('The Final Boss failed. The boss stripped all your buffs. Fight with raw power alone.');
      }
      break;
    case 'void-collapse':
    case 'void-collapse-sp':
      var vcDmg = Math.floor(baseDmg * 3.5);
      var vcSelf = Math.floor(vcDmg * 0.20);
      e.hp = Math.max(0, e.hp - vcDmg);
      DS.hp = Math.max(1, DS.hp - vcSelf);
      addLog('🌑 Void Collapse! ' + vcDmg + ' damage! You take ' + vcSelf + ' back.');
      say('Void Collapse! Devastating damage but you take ' + vcSelf + ' back.');
      updatePlayerBar();
      break;
    case 'soul-drain':
      DS._soulDrain = 2;
      addLog('💀 Soul Drain! Stealing HP from enemy for 2 turns.');
      say('Soul Drain! Stealing life force from the enemy.');
      break;
    case 'shadow-step':
      DS.inCombat = false;
      addLog('🌑 Shadow Step! Escaped combat.');
      say('Shadow Step! You vanished from combat.');
      setCombatBtns(false);
      setTimeout(function(){ try { enterRoom(); } catch(e2){} }, 800);
      return;
    case 'time-echo':
      if (DS._lastAttackDmg) {
        e.hp = Math.max(0, e.hp - DS._lastAttackDmg);
        addLog('⏰ Time Echo! Repeated last attack for ' + DS._lastAttackDmg + ' damage!');
        say('Time Echo! Last attack repeated for ' + DS._lastAttackDmg + ' damage.');
      } else { addLog('⏰ Time Echo fizzled — no previous attack to echo.'); }
      break;
    case 'chain-curse':
      DS._chainCurse = 3;
      addLog('⛓️ Chain Curse! Enemy attacks reflect 50% for 3 turns.');
      say('Chain Curse! Every enemy hit reflects 50 percent back for 3 turns.');
      break;
    case 'dungeon-echo':
      if (Math.random() < 0.50) {
        // (enemies have no defense to lower, so this did nothing; it now lays them open)
        fxGet().vuln = Math.max(fxGet().vuln, 0.30); fxGet().vulnTurns = Math.max(fxGet().vulnTurns, 3);
        addLog('🏰 Dungeon Echo! The dungeon answered. The enemy takes 30% more damage for 3 turns.');
        say('Dungeon Echo! The dungeon answered your question.');
      } else {
        var tDmg = 60;
        DS.hp = Math.max(0, DS.hp - tDmg);
        addLog('🌪️ Dungeon went rogue! Tornado deals ' + tDmg + ' to you!');
        say('Dungeon Echo failed! The Tornado struck you for ' + tDmg + ' damage.');
        updatePlayerBar();
      }
      break;
    case 'the-tornado':
      var tornadoDmg = 80; var tornadoSelf = 40;
      e.hp = Math.max(0, e.hp - tornadoDmg);
      DS.hp = Math.max(0, DS.hp - tornadoSelf);
      addLog('🌪️ The Tornado! ' + tornadoDmg + ' to enemy, ' + tornadoSelf + ' to you!');
      say('The Tornado! ' + tornadoDmg + ' enemy damage, ' + tornadoSelf + ' self damage.');
      updatePlayerBar();
      break;
    case 'time-fracture':
      DS._dodgeNext = true;
      addLog('⏰ Time Fracture! Next enemy attack auto-dodged.');
      say('Time Fracture! Next enemy attack will be dodged.');
      break;
    case 'the-hunger':
      DS._hungerActive = 3;
      addLog('🖤 The Hunger! Heal 15 HP per kill for 3 kills. Then it feeds on you.');
      say('The Hunger awakened. Heal 15 HP per kill for 3 kills.');
      break;
    case 'void-anchor':
      DS._enemyAnchored = 2;
      addLog('⚓ Void Anchor! Enemy cannot attack for 2 turns.');
      say('Void Anchor! Enemy frozen for 2 turns.');
      break;
    case 'phantom-step':
      DS._phantomStep = 2;
      addLog('👻 Phantom Step! Next 2 hits pass through you.');
      say('Phantom Step! Next 2 enemy hits will miss you completely.');
      break;
    case 'curse-of-ruin':
      if (e.atk) e.atk = Array.isArray(e.atk) ? [Math.floor(e.atk[0]*0.6), Math.floor(e.atk[1]*0.6)] : Math.floor(e.atk*0.6);
      addLog('💔 Curse of Ruin! Enemy ATK permanently reduced 40%!');
      say('Curse of Ruin! Enemy attack power reduced permanently.');
      break;
    case 'the-last-word':
      if (DS.hp <= Math.floor(DS.maxHp * 0.20)) {
        var lwDmg = DS.maxHp - DS.hp;
        e.hp = Math.max(0, e.hp - lwDmg);
        addLog('🗡️ The Last Word! ' + lwDmg + ' damage from missing HP!');
        say('The Last Word! ' + lwDmg + ' damage from desperation.');
      } else { addLog('🗡️ The Last Word requires below 20% HP.'); DS._spellCooldown = 0; }
      break;
    case 'nightmare-weave':
      if (Math.random() < 0.50) {
        DS._enemyNightmare = 1;
        addLog('😱 Nightmare Weave! Enemy frozen in terror.');
        say('Nightmare Weave! Enemy paralyzed by fear for 1 turn.');
      } else {
        DS._playerFrozen = 1;
        addLog('😱 Nightmare reflected! You are frozen — enemy gets free hit!');
        say('Nightmare Weave reflected! You are frozen.');
      }
      break;
    case 'blood-oath':
      DS._bloodOath = 3;
      addLog('🩸 Blood Oath! Next 3 attacks unstoppable 150% damage. Debt paid after.');
      say('Blood Oath! 3 unstoppable attacks. Pay 20 HP per attack after.');
      break;
    case 'soul-fracture':
      var sfDmg = Math.floor(baseDmg * 2.5);
      e.hp = Math.max(0, e.hp - sfDmg);
      addLog('💥 Soul Fracture! ' + sfDmg + ' damage.');
      say('Soul Fracture! ' + sfDmg + ' damage dealt.');
      break;
    case 'dungeon-wrath':
      var dwDmg = (DS.floor || 1) * 10;
      e.hp = Math.max(0, e.hp - dwDmg);
      addLog('🏰 Dungeon\'s Wrath! Floor ' + DS.floor + ' × 10 = ' + dwDmg + ' damage!');
      say('Dungeon\'s Wrath! ' + dwDmg + ' damage.');
      break;
    case 'soul-leash':
      DS._soulLeash = true;
      addLog('🔗 Soul Leash! Tethered to enemy soul.');
      say('Soul Leash! Your soul is tethered to the enemy.');
      break;
    case 'the-reckoning':
      var recDmg = DS._totalDamageTaken || 0;
      if (recDmg > 0) {
        e.hp = Math.max(0, e.hp - recDmg);
        addLog('⚖️ The Reckoning! ' + recDmg + ' returned!');
        say('The Reckoning! ' + recDmg + ' damage returned.');
      } else { addLog('⚖️ The Reckoning fizzled.'); }
      break;
    case 'curse-echoes':
      DS._curseEchoes = 3;
      addLog('👁️ Curse of Echoes! Enemy hurts themselves each attack for 3 turns.');
      say('Curse of Echoes! Enemy will hurt themselves every time they attack.');
      break;
    case 'the-sacrifice':
      if (!e.isBoss) {
        var hpCost2 = Math.floor(DS.hp * 0.40);
        DS.hp = Math.max(1, DS.hp - hpCost2);
        e.hp = 0;
        addLog('💔 The Sacrifice! Enemy killed. You lost ' + hpCost2 + ' HP.');
        say('The Sacrifice. Enemy slain. You paid ' + hpCost2 + ' HP.');
        updatePlayerBar();
      } else { addLog('💔 The Sacrifice cannot kill bosses.'); DS._spellCooldown = 0; }
      break;
    case 'shadow-blast':
      var sbChance = DS.cls === 'ShadowMage' || DS.cls === 'VoidWalker' ? 0.65 : DS.cls === 'DeathKnight' ? 0.50 : 0.35;
      if (Math.random() < sbChance) {
        var sbDmg = Math.floor(baseDmg * 3.0);
        e.hp = Math.max(0, e.hp - sbDmg);
        addLog('👤 Shadow Blast! Spirit controlled — ' + sbDmg + ' massive damage!');
        say('Shadow Blast! You controlled the spirit. ' + sbDmg + ' devastating damage.');
      } else {
        addLog('👤 Shadow Blast failed! The spirit turned on you. Instant defeat.');
        say('Shadow Blast failed. The spirit cannot be controlled. It defeated you instantly.');
        setTimeout(function(){ handleDeath(); }, 1000);
      }
      setCombatBtns(true);
      updatePlayerBar();
      updateEnemyBar();
      return;
    case 'void-mirror':
      DS._voidMirror = 2;
      addLog('🖤 Void Mirror! Reality reversed for 2 turns.');
      say('Void Mirror! Your weaknesses become strengths for 2 turns.');
      break;
    case 'abyss-stares':
      if (Math.random() < 0.40) {
        if (e.atk) e.atk = Array.isArray(e.atk) ? [Math.floor(e.atk[0]*0.5), Math.floor(e.atk[1]*0.5)] : Math.floor(e.atk*0.5);
        addLog('👁️ Abyss Stares Back! Enemy ATK halved permanently!');
        say('The Abyss stared back at the enemy. Their attack is permanently halved.');
      } else {
        DS.atkBonus = (DS.atkBonus||0) - Math.floor((DS.atk||10) * 0.5);
        addLog('👁️ Abyss reflected on YOU. Your ATK halved!');
        say('The Abyss stared back at you. Your attack is permanently halved.');
      }
      break;
    case 'phantom-army':
      var paTotal = 0;
      for (var pa = 0; pa < 3; pa++) { if (Math.random() > 0.30) { e.hp = Math.max(0, e.hp - 15); paTotal += 15; } }
      addLog('👻 Phantom Army! ' + paTotal + ' total ghost damage!');
      say('Phantom Army! ' + paTotal + ' total damage from ghosts.');
      break;
    case 'last-laugh':
      if ((e.hp / (e.maxHp || e.hp)) <= 0.10) {
        e.hp = 0;
        addLog('😈 The Last Laugh! Enemy instantly defeated!');
        say('The Last Laugh! Enemy eliminated.');
      } else {
        e.hp = Math.floor((e.maxHp || e.hp) * 0.50);
        addLog('😈 Last Laugh failed — enemy healed to 50%!');
        say('The Last Laugh failed. Enemy healed to 50 percent HP.');
      }
      break;
    case 'shattered-reality':
      var tmpAtk = Array.isArray(e.atk) ? Math.floor((e.atk[0]+e.atk[1])/2) : (e.atk||10);
      var tmpDef = e.def || 0;
      e.atk = tmpDef; e.def = tmpAtk;
      addLog('🔮 Shattered Reality! Enemy ATK and DEF swapped!');
      say('Shattered Reality! Enemy attack and defense swapped for this turn.');
      break;
    case 'the-forgotten':
      DS._enemyForgot = 2;
      addLog('🌫️ The Forgotten! Enemy forgets you for 2 turns.');
      say('The Forgotten. Enemy cannot see you for 2 turns.');
      break;
    case 'the-unwritten':
      var uwEffects = ['heal','dmg','buff','stun','gold'];
      var uwPick = uwEffects[Math.floor(Math.random() * uwEffects.length)];
      if (uwPick === 'heal') { DS.hp = Math.min(DS.maxHp, DS.hp + 40); updatePlayerBar(); addLog('❓ The Unwritten: Healed 40 HP!'); say('The Unwritten healed you 40 HP.'); }
      else if (uwPick === 'dmg') { var uwDmg = Math.floor(baseDmg*2.5); e.hp = Math.max(0, e.hp-uwDmg); addLog('❓ The Unwritten: '+uwDmg+' damage!'); say('The Unwritten dealt '+uwDmg+' damage.'); }
      else if (uwPick === 'buff') { DS.atkBonus=(DS.atkBonus||0)+8; addLog('❓ The Unwritten: +8 ATK!'); say('The Unwritten granted plus 8 attack.'); }
      else if (uwPick === 'stun') { DS._enemyStunned=2; addLog('❓ The Unwritten: Enemy stunned 2 turns!'); say('The Unwritten stunned the enemy.'); }
      else { DS.gold=(DS.gold||0)+100; if(CHARS[_charIdx])CHARS[_charIdx].gold=(CHARS[_charIdx].gold||0)+100; addLog('❓ The Unwritten: 100 gold!'); say('The Unwritten gave you 100 gold.'); }
      break;
    case 'lose-reality':
      addLog('🌀 Lose Reality! 5 minutes to kill the enemy!');
      say('Lose Reality! You have 5 minutes to defeat the enemy or you cease to exist.');
      DS._loseRealityTimer = Date.now() + 5*60*1000;
      DS._loseRealityInterval = setInterval(function() {
        if (!DS._loseRealityTimer) { clearInterval(DS._loseRealityInterval); return; }
        var rem = Math.ceil((DS._loseRealityTimer - Date.now()) / 60000);
        if (rem > 0) { addLog('🌀 Reality slipping. '+rem+' minute(s) remaining.'); say('Reality slipping. '+rem+' minutes remaining.'); }
        else { clearInterval(DS._loseRealityInterval); DS._loseRealityTimer=0; if(DS.inCombat&&DS.enemy&&DS.enemy.hp>0){ addLog('🌀 You ceased to exist.'); setTimeout(function(){handleDeath();},1000); } }
      }, 60000);
      break;
    case 'soul-echo':
      var seChance = isMagicClass(DS.cls) ? 0.55 : 0.30;
      var seRoll = Math.random();
      if (seRoll < seChance * 0.33) { DS._soulEchoPerfect=true; addLog('👁️ Soul Echo — perfect! Next hit blocked!'); say('Soul Echo perfect prediction! Next hit blocked.'); }
      else if (seRoll < seChance) { DS._soulEchoPartial=0.60; addLog('👁️ Soul Echo — partial. Next hit 60% reduced.'); say('Soul Echo partial. Next hit reduced 60 percent.'); }
      else { addLog('👁️ Soul Echo failed.'); say('Soul Echo failed. Future unclear.'); }
      break;
    case 'void-echo':
      DS.atkBonus=(DS.atkBonus||0)+Math.floor((DS.atk||10)*0.50);
      DS._furyActive=true;
      if (Math.random()<0.50) { addLog('🌑 Void Echo! +50% ATK and Fury!'); say('Void Echo! Plus 50 percent attack and Fury.'); }
      else { if(e.atk)e.atk=Array.isArray(e.atk)?[Math.floor(e.atk[0]*1.25),Math.floor(e.atk[1]*1.25)]:Math.floor(e.atk*1.25); addLog('🌑 Void Echo failed! Enemy also powered up!'); say('Void Echo failed. Enemy powered up too.'); }
      break;
    case 'extraction':
      if (Math.random()<0.20) { DS._extractControl=true; addLog('⚗️ Extraction! Controlling enemy\'s next attack.'); say('Extraction success! You control the enemy\'s next hit.'); }
      else { DS._voidCurse=true; addLog('⚗️ Extraction failed! Void Curse — attacks weakened!'); say('Extraction failed. Void Curse cripples your attacks until next floor.'); }
      break;
    case 'earthshake':
      var esDmg = Math.floor(baseDmg * 1.6);
      // Shaman bonus — always buffs
      var esRoll = Math.random();
      var esIsShaman = DS.cls === 'Shaman';
      e.hp = Math.max(0, e.hp - esDmg);
      if (esIsShaman || esRoll < 0.40) {
        // Buff: stun enemy
        DS._enemyStunned = 1;
        addLog('🌍 Earthshake! ' + esDmg + ' damage. The ground trembles — enemy stunned!');
        say('Earthshake! ' + esDmg + ' damage. Enemy stunned for one turn.');
      } else if (esRoll < 0.65) {
        // Buff: defence boost
        DS.defBonus = (DS.defBonus || 0) + 5;
        addLog('🌍 Earthshake! ' + esDmg + ' damage. Stone rises to protect you — +5 DEF!');
        say('Earthshake! ' + esDmg + ' damage. Stone armour grants plus 5 defence.');
      } else if (esRoll < 0.80) {
        // Neutral: just damage
        addLog('🌍 Earthshake! ' + esDmg + ' damage. The earth cracks beneath the enemy.');
        say('Earthshake! ' + esDmg + ' damage.');
      } else {
        // Backfire: knockback damages you too
        var selfDmg = Math.floor(esDmg * 0.3);
        DS.hp = Math.max(1, DS.hp - selfDmg);
        updatePlayerBar();
        addLog('🌍 Earthshake backfired! ' + esDmg + ' to enemy but ' + selfDmg + ' to you from the shockwave!');
        say('Earthshake backfired! You take ' + selfDmg + ' shockwave damage.');
      }
      break;
    case 'legend-of-echoes':
      // Legendary — fight an echo of yourself. Win: permanent -30% damage taken. Lose: instant death.
      var echoAtk = DS.atk || 10;
      var echoHp  = DS.maxHp || DS.hp || 50;
      var playerWins = Math.random() < 0.55; // slight favour to player
      if (playerWins) {
        DS._legendEchoShield = true; // permanent flag: -30% damage taken rest of run
        addLog('🌀 Legend of Echoes! You faced your Echo and won. Damage taken reduced by 30% for the rest of this run!');
        say('Legend of Echoes! You defeated your own Echo. Damage taken reduced by thirty percent for the rest of this run.');
      } else {
        // Instant death — no mercy, it\'s legendary
        DS.hp = 0;
        updatePlayerBar();
        addLog('🌀 Legend of Echoes! Your Echo was stronger. You have been consumed.');
        say('Legend of Echoes! Your Echo overpowered you. You have been defeated.');
        setTimeout(function(){ handleDeath(); }, 800);
        return;
      }
      break;
    default:
      addLog('✨ ' + spellName + ' cast! Effects incoming.');
      say(spellName + ' cast!');
      break;
  }

  setCombatBtns(true);
  updatePlayerBar();
  updateEnemyBar();

  // Multi-combat spell handling
  if (_multiCombatActive) {
    if (e.hp <= 0) {
      // Remove dead enemy from array
      var mDeadIdx = _multiEnemies.indexOf(e);
      if (mDeadIdx !== -1) {
        addLog('☠ ' + e.name + ' destroyed by spell!');
        say(e.name + ' defeated!');
        var gDrop = resolveGold(e.gold);
        if (DS._runeFortune) gDrop = Math.round(gDrop * 1.25);
        DS.gold += gDrop; DS.kills++;
        addGlobalGold(gDrop);
        updateTopBar();
        applySpiritOnKill();
        _multiEnemies.splice(mDeadIdx, 1);
      }
      renderMultiEnemies();
      if (_multiEnemies.length === 0) {
        setTimeout(function(){ endMultiCombat(true, false); }, 600);
      } else {
        setTimeout(function(){ multiEnemiesTakeTurns(); }, 600);
      }
    } else {
      // Enemy survived — trigger enemy turns
      renderMultiEnemies();
      setCombatBtns(false);
      setTimeout(function(){ multiEnemiesTakeTurns(); }, 600);
    }
    return;
  }

  // BUGFIX: applySpellEffect() never checked boss phase transitions, so bosses
  // damaged purely by spells silently skipped attack-multiplier buffs, phase
  // messages, and The Infernal dungeon's weak-point mechanic — same gap fixed
  // in doFight() for basic attacks. Check unconditionally here too.
  if (e.isBoss && e.hp > 0 && checkBossPhase()) {
    updateSkillButtons();
    return;
  }

  if (e.hp <= 0) { setTimeout(function(){ enemyDead(); }, 500); }
  // Extra safety — if enemy died from spell, ensure buttons re-enable after transition
  if (e.hp <= 0) {
    setTimeout(function() {
      if (DS && DS.inCombat && DS.enemy && DS.enemy.hp > 0 && DS.hp > 0) {
        var atk = document.getElementById('cbtn-attack');
        if (atk && atk.disabled) { setCombatBtns(true); }
      }
    }, 2000);
  }
}

// Tick spell cooldown each turn
function tickSpellCooldown() {
  if (DS._spellCooldown && DS._spellCooldown > 0) {
    DS._spellCooldown--;
    if (DS._spellCooldown === 0) {
      addLog('✨ Spells ready.');
      say('Spells ready to cast again.');
    }
  }
  // Tick burning effects
  if (DS._enemyBurning) {
    if (DS.enemy) DS.enemy.hp = Math.max(0, DS.enemy.hp - DS._enemyBurning.dmg);
    DS._enemyBurning.turns--;
    addLog('🔥 Agony burns enemy for ' + DS._enemyBurning.dmg + ' damage!');
    if (DS._enemyBurning.turns <= 0) DS._enemyBurning = null;
    if (DS.enemy && DS.enemy.hp <= 0) { setTimeout(function(){ enemyDead(); }, 500); return; }
  }
  if (DS._playerBurning) {
    DS.hp = Math.max(0, DS.hp - DS._playerBurning.dmg);
    DS._playerBurning.turns--;
    addLog('🔥 Agony burns you for ' + DS._playerBurning.dmg + ' damage!');
    updatePlayerBar();
    if (DS._playerBurning.turns <= 0) DS._playerBurning = null;
    if (DS.hp <= 0) { setTimeout(function(){ handleDeath(); }, 500); return; }
  }
  // Tick grave pact
  if (DS._gravePact && DS._gravePact > 0) {
    DS._gravePact--;
    if (DS._gravePact === 0) {
      DS._gravePactActive = false;
      DS.hp = DS._gravePactHp || DS.hp;
      addLog('⚰️ Grave Pact ended. HP restored to ' + DS.hp + '.');
      updatePlayerBar();
    }
  }
}

// Scroll drops from enemies
function checkSpellScrollDrop() {
  if (!DS.inCombat) return;
  var dropChance = 0.05; // 5% base
  if (DS.cls === 'Arcanist' || DS.cls === 'Wizard') dropChance = 0.10;
  if (Math.random() > dropChance) return;

  // Pick a random common or rare scroll based on floor
  var pool = DS.floor >= 7 ? ARCANE_SHOP_ITEMS.filter(function(i){ return i.type === 'scroll' && i.rarity !== 'legendary'; })
           : ARCANE_SHOP_ITEMS.filter(function(i){ return i.type === 'scroll' && i.rarity === 'common'; });
  if (pool.length === 0) return;

  var scroll = pool[Math.floor(Math.random() * pool.length)];
  if (DS.inventory) DS.inventory.push({
    name: scroll.name, icon: scroll.icon, type: 'scroll',
    spellId: scroll.spellId, desc: scroll.desc, rarity: scroll.rarity
  });
  addLog('📜 ' + scroll.name + ' dropped! [' + scroll.rarity.toUpperCase() + ']');
  say('Spell scroll dropped! ' + scroll.name + '. ' + scroll.rarity + ' rarity. Check your inventory.');
  sfx('sfx-loot');
}

// -- MUSIC PLAYER DEDUP CLEANUP --
function cleanupMusicPlayers() {
  try {
    // Clean global inventory
    var globalInv = getGlobalInventory();
    var foundGlobal = false;
    var cleanGlobal = globalInv.filter(function(i) {
      if (i.type === 'music-player') {
        if (!foundGlobal) { foundGlobal = true; return true; }
        return false;
      }
      return true;
    });
    if (cleanGlobal.length !== globalInv.length) {
      DDStore.setItem('dd_global_inv', JSON.stringify(cleanGlobal));
    }
    // Clean all character inventories
    if (CHARS && CHARS.length) {
      var changed = false;
      CHARS.forEach(function(ch) {
        if (!ch || !ch.inventory) return;
        var found = false;
        var clean = ch.inventory.filter(function(i) {
          if (i.type === 'music-player') {
            if (!found) { found = true; return true; }
            changed = true; return false;
          }
          return true;
        });
        ch.inventory = clean;
      });
      if (changed) saveChars();
    }
    // Set the permanent flag if they own one
    if (foundGlobal) DDStore.setItem('dd_mp_owned', '1');
  } catch(e) {}
}

// -- PLAYTIME TRACKER --
var _playtimeStart = Date.now();

function getStoredPlaytime() {
  return parseInt(DDStore.getItem('dd_total_playtime') || '0', 10);
}

function savePlaytime() {
  var sessionMs = Date.now() - _playtimeStart;
  var stored = getStoredPlaytime();
  DDStore.setItem('dd_total_playtime', stored + sessionMs);
  _playtimeStart = Date.now();
}

function formatPlaytime(ms) {
  var totalSecs = Math.floor(ms / 1000);
  var hours = Math.floor(totalSecs / 3600);
  var mins = Math.floor((totalSecs % 3600) / 60);
  var secs = totalSecs % 60;
  if (hours > 0) return hours + 'h ' + mins + 'm ' + secs + 's';
  if (mins > 0) return mins + 'm ' + secs + 's';
  return secs + 's';
}

function getTotalPlaytime() {
  return getStoredPlaytime() + (Date.now() - _playtimeStart);
}

function updatePlaytimeDisplay() {
  var el = document.getElementById('pause-playtime');
  if (el) el.textContent = '🕐 Total playtime: ' + formatPlaytime(getTotalPlaytime());
}

setInterval(function() { try { savePlaytime(); } catch(e) {} }, 30000);
window.addEventListener('beforeunload', function() { try { savePlaytime(); } catch(e) {} try { DDStore.flushNow(); } catch(e) {} });
// iOS Safari doesn't reliably fire beforeunload — pagehide and a tab going
// hidden are the events that actually fire there, so flush debounced saves
// on those too instead of risking losing the last few seconds of progress.
window.addEventListener('pagehide', function() { try { DDStore.flushNow(); } catch(e) {} });
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'hidden') { try { DDStore.flushNow(); } catch(e) {} }
});
