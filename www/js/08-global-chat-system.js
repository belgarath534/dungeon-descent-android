// ═══════════════════════════════════════════════════════
// GLOBAL CHAT SYSTEM
// ═══════════════════════════════════════════════════════

var _chatListener = null;
var _chatUsername = null;
var _chatOpen = false;

var CHAT_BAD_WORDS = ['fuck','shit','ass','bitch','cunt','dick','cock','pussy','nigger','nigga','faggot','fag','retard','whore','slut','bastard','piss','asshole','motherfucker','bullshit'];

function chatContainsBadWord(text) {
  var lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  // Whole words only ("class", "pass" and "assassin" were refused); the worst slurs still match anywhere
  var _cw = lower.split(/[^a-z0-9]+/);
  var _always = ['nigger','nigga','faggot','cunt','retard'];
  return CHAT_BAD_WORDS.some(function(w) { return _cw.indexOf(w) !== -1 || (_always.indexOf(w) !== -1 && lower.indexOf(w) !== -1); });
}

function chatGetUsername() {
  if (_chatUsername) return _chatUsername;
  var saved = DDStore.getItem('dd_chat_username');
  if (saved) { _chatUsername = saved; return saved; }
  return null;
}

function chatSetUsername() {
  var input = document.getElementById('chat-prompt-input');
  var errEl = document.getElementById('chat-prompt-error');
  var name = (input ? input.value : '').trim();
  if (!name || name.length < 2) { if (errEl) { errEl.textContent = 'Username must be at least 2 characters.'; } say('Username too short.'); return; }
  if (name.length > 20) { if (errEl) { errEl.textContent = 'Username too long. Max 20 characters.'; } return; }
  if (chatContainsBadWord(name)) { if (errEl) { errEl.textContent = 'That username is not allowed. Please choose another.'; } say('Username not allowed.'); return; }
  _chatUsername = name;
  DDStore.setItem('dd_chat_username', name);
  document.getElementById('chat-username-prompt').style.display = 'none';
  document.getElementById('chat-input-area').style.display = 'flex';
  say('Username set to ' + name + '. You can now chat.');
  chatLoadMessages();
}

function saveChatUsername() {
  var input = document.getElementById('chat-username-input');
  var statusEl = document.getElementById('chat-username-status');
  var name = (input ? input.value : '').trim();
  if (!name || name.length < 2) { if (statusEl) statusEl.textContent = 'Too short — minimum 2 characters.'; return; }
  if (chatContainsBadWord(name)) { if (statusEl) statusEl.textContent = 'That username is not allowed.'; return; }
  _chatUsername = name;
  DDStore.setItem('dd_chat_username', name);
  if (statusEl) { statusEl.textContent = 'Username saved: ' + name; statusEl.style.color = '#44cc88'; }
  say('Chat username saved as ' + name + '.');
}

function saveChatSettings() {
  var toggle = document.getElementById('chat-dungeon-toggle');
  var enabled = toggle ? toggle.checked : false;
  DDStore.setItem('dd_chat_dungeon', enabled ? '1' : '0');
  var btn = document.getElementById('dg-chat-btn');
  if (btn) btn.style.display = enabled ? '' : 'none';
  say('Dungeon chat button ' + (enabled ? 'enabled' : 'disabled') + '.');
}

function chatInit() {
  _chatOpen = true;
  var username = chatGetUsername();

  // Populate settings username input
  var settingsInput = document.getElementById('chat-username-input');
  if (settingsInput && username) settingsInput.value = username;

  // Load dungeon toggle state
  var toggle = document.getElementById('chat-dungeon-toggle');
  if (toggle) toggle.checked = DDStore.getItem('dd_chat_dungeon') === '1';

  // Show/hide prompt vs input
  if (!username) {
    document.getElementById('chat-username-prompt').style.display = '';
    document.getElementById('chat-input-area').style.display = 'none';
  } else {
    document.getElementById('chat-username-prompt').style.display = 'none';
    document.getElementById('chat-input-area').style.display = 'flex';
    chatLoadMessages();
  }

  // Character counter
  var input = document.getElementById('chat-input');
  var counter = document.getElementById('chat-char-count');
  if (input && counter) {
    input.oninput = function() {
      counter.textContent = input.value.length + ' / 200';
    };
  }
}

function chatLoadMessages() {
  if (!window._fbRtdb) return;
  var messagesEl = document.getElementById('chat-messages');
  if (!messagesEl) return;
  messagesEl.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#444;text-align:center;padding:20px;">Loading messages...</div>';

  // Clear existing listener
  if (_chatListener) {
    try { window._fbRtdb.ref('global_chat').off('value', _chatListener); } catch(e) {}
    _chatListener = null;
  }

  // Real time listener via RTDB
  var ref = window._fbRtdb.ref('global_chat').orderByChild('timestamp').limitToLast(50);
  _chatListener = function(snap) {
    if (!_chatOpen) return;
    var messages = [];
    snap.forEach(function(child) { messages.push(child.val()); });
    chatRenderMessages(messages);
  };
  ref.on('value', _chatListener, function(err) {
    console.warn('[Chat] RTDB error:', err);
    if (messagesEl) messagesEl.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#444;text-align:center;padding:20px;">Could not load messages. Check your connection.</div>';
  });
}

function chatRenderMessages(messages) {
  var messagesEl = document.getElementById('chat-messages');
  if (!messagesEl) return;
  var myUsername = chatGetUsername();
  var wasAtBottom = messagesEl.scrollHeight - messagesEl.scrollTop <= messagesEl.clientHeight + 50;

  if (!messages.length) {
    messagesEl.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#444;text-align:center;padding:20px;">No messages yet. Be the first to say something!</div>';
    return;
  }

  messagesEl.innerHTML = messages.map(function(msg) {
    var isMe = msg.username === myUsername;
    var time = msg.timestamp ? chatFormatTime(msg.timestamp) : '';
    return '<div style="padding:6px 0;border-bottom:1px solid #111;" tabindex="0" aria-label="' + msg.username + ' said ' + msg.message + ' ' + time + '">' +
      '<span style="font-family:Cinzel,serif;font-size:0.62rem;color:' + (isMe ? '#c8a832' : '#88aacc') + ';">' + chatEscape(msg.username) + '</span>' +
      '<span style="font-family:Cinzel,serif;font-size:0.55rem;color:#333;margin-left:6px;">' + time + '</span>' +
      '<div style="font-family:Cinzel,serif;font-size:0.68rem;color:#aaa;margin-top:2px;">' + chatEscape(msg.message) + '</div>' +
    '</div>';
  }).join('');

  // Auto scroll to bottom if was at bottom
  if (wasAtBottom) messagesEl.scrollTop = messagesEl.scrollHeight;
}

function chatFormatTime(timestamp) {
  var now = Date.now();
  var diff = Math.floor((now - timestamp) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function chatEscape(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function chatSend() {
  var input = document.getElementById('chat-input');
  var message = (input ? input.value : '').trim();
  var username = chatGetUsername();

  if (!username) { say('Please set a username first.'); return; }
  if (!message) { say('Please type a message first.'); return; }
  if (message.length > 200) { say('Message too long. Maximum 200 characters.'); return; }
  if (chatContainsBadWord(message)) {
    say('Your message contains inappropriate content and was not sent.');
    if (input) input.value = '';
    return;
  }
  if (!window._fbRtdb) { say('Chat unavailable. Check your connection.'); return; }

  var data = {
    username: username,
    message: message,
    timestamp: Date.now()
  };

  window._fbRtdb.ref('global_chat').push(data).catch(function(err) {
    console.error('[Chat] Send failed:', err);
    say('Failed to send message. Check your connection.');
  });

  if (input) { input.value = ''; }
  var counter = document.getElementById('chat-char-count');
  if (counter) counter.textContent = '0 / 200';
}

function chatClose() {
  _chatOpen = false;
  if (_chatListener) {
    try { window._fbRtdb.ref('global_chat').off('value', _chatListener); } catch(e) {}
    _chatListener = null;
  }
  goTo('menu');
}

function chatOpenFromDungeon() {
  // Open chat overlay from dungeon without leaving
  goTo('chat');
}

// Apply dungeon chat button visibility on load
try {
  window.addEventListener('load', function() {
    setTimeout(function() {
      var btn = document.getElementById('dg-chat-btn');
      if (btn) btn.style.display = DDStore.getItem('dd_chat_dungeon') === '1' ? '' : 'none';
      // Pre-fill settings username
      var settingsInput = document.getElementById('chat-username-input');
      var saved = DDStore.getItem('dd_chat_username');
      if (settingsInput && saved) settingsInput.value = saved;
      var toggle = document.getElementById('chat-dungeon-toggle');
      if (toggle) toggle.checked = DDStore.getItem('dd_chat_dungeon') === '1';
    }, 1000);
  });
} catch(e) {}

// ═══════════════════════════════════════════════════════
// LIVE PLAYER PRESENCE
// ═══════════════════════════════════════════════════════

var _presenceRef = null;
var _presenceListener = null;

function initPresence() {
  if (!window._fbRtdb) return;
  try {
    var uid = _mpMyId || (function() {
      var id = DDStore.getItem('dd_presence_id');
      if (!id) { id = Math.random().toString(36).substr(2, 12); DDStore.setItem('dd_presence_id', id); }
      return id;
    })();

    // Write presence with timestamp
    _presenceRef = window._fbRtdb.ref('presence/' + uid);
    _presenceRef.set({ online: true, t: Date.now() });

    // Remove on disconnect
    _presenceRef.onDisconnect().remove();

    // Refresh every 2 minutes to stay alive
    setInterval(function() {
      if (_presenceRef) _presenceRef.set({ online: true, t: Date.now() }).catch(function(){});
    }, 120000);

    // Listen to total count
    _presenceListener = window._fbRtdb.ref('presence').on('value', function(snap) {
      var count = 0;
      var now = Date.now();
      snap.forEach(function(child) {
        var d = child.val();
        // Only count players active in last 5 minutes
        if (d && d.t && (now - d.t) < 300000) count++;
      });
      var el = document.getElementById('menu-online-count');
      if (el) {
        el.textContent = count > 0 ? '⚔ ' + count + ' player' + (count !== 1 ? 's' : '') + ' online' : '';
        el.setAttribute('aria-label', count + ' players currently online');
      }
    });
  } catch(e) {
    console.warn('[Presence] Failed:', e);
  }
}

// Clean up stale presence entries (older than 5 min) — runs once on load
function cleanStalePresence() {
  if (!window._fbRtdb) return;
  try {
    window._fbRtdb.ref('presence').once('value').then(function(snap) {
      var now = Date.now();
      snap.forEach(function(child) {
        var d = child.val();
        if (d && d.t && (now - d.t) > 300000) {
          child.ref.remove().catch(function(){});
        }
      });
    }).catch(function(){});
  } catch(e) {}
}

function renderBestiary() {
  var grid = document.getElementById('bestiary-grid');
  if (!grid) return;
  // Show loading message first
  grid.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:#555;text-align:center;padding:30px;" aria-live="polite">Loading bestiary...</div>';
  // Defer actual render so loading message shows first
  setTimeout(function() { renderBestiaryActual(); }, 80);
}

// Bestiary lists get rendered in bounded batches — dumping all 372 entries into
// the DOM at once (each with its own role="listitem", tabindex, and long
// aria-label) is fine for a sighted player on a phone, but it's a well-known way
// to bog down a screen reader's accessibility tree, especially on lower-power
// assistive-tech hardware like a Braille notetaker. _bestiaryVisibleCount caps how
// many of the currently filtered entries actually get rendered; a "Load More"
// button (added below the grid when there's more to show) grows it in the same
// bounded steps instead of everything landing at once.
var _bestiaryPageSize = 40;
var _bestiaryVisibleCount = 40;

function renderBestiaryActual() {
  var grid = document.getElementById('bestiary-grid');
  if (!grid) return;
  grid.innerHTML = '';
  var unlocked = 0;
  var total = BESTIARY_DATA.length;
  var allEntries = BESTIARY_DATA;
  if (_bestiaryFilter && _bestiaryFilter !== 'all') {
    if (_bestiaryFilter === 'elite') {
      allEntries = allEntries.filter(function(e){ return e.isElite; });
    } else if (_bestiaryFilter.indexOf('type-') === 0) {
      var typeKey = _bestiaryFilter.replace('type-', '');
      allEntries = allEntries.filter(function(e){ return e.enemyType === typeKey; });
    } else {
      allEntries = allEntries.filter(function(e){ return e.dungeon === _bestiaryFilter; });
    }
  }
  // Apply search filter
  if (_bestiarySearchTerm) {
    allEntries = allEntries.filter(function(e){
      return e.name.toLowerCase().indexOf(_bestiarySearchTerm) !== -1 ||
             (e.desc && e.desc.toLowerCase().indexOf(_bestiarySearchTerm) !== -1) ||
             (e.tier && e.tier.toLowerCase().indexOf(_bestiarySearchTerm) !== -1);
    });
  }
  // Unlocked count reflects the full filtered set, even though only a bounded
  // batch of it actually gets rendered below.
  allEntries.forEach(function(entry) {
    if (bestiaryKills[entry.id] || 0) unlocked++;
  });
  var visibleEntries = allEntries.slice(0, _bestiaryVisibleCount);
  var html = '';
  visibleEntries.forEach(function(entry) {
    var kills = bestiaryKills[entry.id] || 0;
    var revealed = kills > 0;
    var isNightmareEntry = entry.dungeon === 'nightmare';
    var isSunkenEntry = entry.dungeon === 'sunken';
    var isEliteEntry = entry.isElite;

    var borderColor = isEliteEntry ? (revealed ? 'var(--gold)' : '#6a5a20')
      : isNightmareEntry ? '#4a0a4a'
      : isSunkenEntry ? '#2a4a7a'
      : '';
    var styleStr = borderColor ? 'style="border-left-color:' + borderColor + '"' : '';
    var cardClass = 'be-card ' + (revealed ? 'unlocked' : 'locked');

    if (revealed) {
      var milestoneHtml = '';
      var m = BESTIARY_MILESTONES[entry.id];
      if (m) {
        var earned = _earnedMilestones[entry.id];
        var pct = Math.min(100, (kills/m.kills)*100);
        milestoneHtml = '<div class="be-kill-bar-wrap"><div class="be-kill-bar" style="width:'+pct+'%"></div></div>' +
          '<div class="be-milestone ' + (earned?'earned':'') + '">' + (earned?'✦ ':'') + m.reward + (earned?'':' ('+kills+'/'+m.kills+')')+'</div>';
      }
      html += '<div class="' + cardClass + '" ' + styleStr + ' role="listitem" tabindex="0" aria-label="' + t(entry.name) + '. ' + t(entry.tier) + '. ' + t(entry.desc) + ' ' + t('Defeated') + ' ' + kills + ' ' + t('time' + (kills!==1?'s':'')) + '.">' +
        (entry.isBoss ? '<span class="be-badge boss" aria-hidden="true">BOSS</span>' : '') +
        (entry.isElite ? '<span class="be-badge" style="background:rgba(201,162,39,0.15);color:var(--gold);border-color:var(--gold-dim);" aria-hidden="true">★ ELITE</span>' : '') +
        '<span class="be-icon" aria-hidden="true">' + entry.icon + '</span>' +
        '<div class="be-name">' + t(entry.name) + '</div>' +
        '<div class="be-tier">' + t(entry.tier) + '</div>' +
        '<p class="be-desc">' + t(entry.desc) + '</p>' +
        '<div class="be-kills">' + t('Defeated') + ': ' + kills + ' ' + t('time' + (kills!==1?'s':'')) + '</div>' +
        milestoneHtml + '</div>';
    } else {
      var nightmareLocked = isNightmareEntry;
      var lockedName = nightmareLocked ? 'It has no name' : 'Unknown Creature';
      var lockedDesc = nightmareLocked ? 'The dungeon refuses to speak of this. Face it in Nightmare Mode to reveal the truth.' : 'Venture deeper to reveal this entry.';
      html += '<div class="' + cardClass + '" ' + styleStr + ' role="listitem" tabindex="0" aria-label="' + t(lockedName) + '. ' + t(entry.tier) + '. ' + t(lockedDesc) + '">' +
        '<span class="be-icon" aria-hidden="true">' + (nightmareLocked ? '🟣' : '❓') + '</span>' +
        '<div class="be-name"' + (nightmareLocked?' style="color:#7a207a;"':'') + '>' + t(lockedName) + '</div>' +
        '<div class="be-tier">' + t(entry.tier) + '</div>' +
        '<p class="be-desc">' + t(lockedDesc) + '</p>' +
        '<div class="be-kills">' + t('Not yet encountered') + '</div></div>';
    }
  });

  grid.innerHTML = html;
  document.getElementById('be-count').textContent = String(unlocked);
  document.getElementById('be-total').textContent = String(allEntries.length);
  if (allEntries.length > visibleEntries.length) {
    var loadMoreBtn = document.createElement('button');
    loadMoreBtn.type = 'button';
    loadMoreBtn.className = 'btn-ghost';
    loadMoreBtn.style.cssText = 'width:100%;margin-top:8px;padding:10px;font-family:Cinzel,serif;font-size:0.68rem;';
    var remaining = allEntries.length - visibleEntries.length;
    loadMoreBtn.textContent = 'Load More (' + remaining + ' remaining)';
    loadMoreBtn.setAttribute('aria-label', 'Load ' + Math.min(_bestiaryPageSize, remaining) + ' more entries. ' + remaining + ' remaining.');
    loadMoreBtn.onclick = function() {
      _bestiaryVisibleCount += _bestiaryPageSize;
      renderBestiaryActual();
      var firstNew = grid.children[visibleEntries.length];
      if (firstNew) firstNew.focus();
    };
    grid.appendChild(loadMoreBtn);
  }
  applyHeadingsIfEnabled();
  if (allEntries.length === 0) {
    var noResults = document.createElement('div');
    noResults.style.cssText = 'font-family:Cinzel,serif;font-size:0.7rem;color:#555;text-align:center;padding:30px;';
    noResults.textContent = _bestiarySearchTerm ? 'No enemies found for "' + _bestiarySearchTerm + '".' : 'No enemies in this category yet.';
    grid.appendChild(noResults);
    say(_bestiarySearchTerm ? 'No results for ' + _bestiarySearchTerm : 'No enemies found.');
    return;
  }

  say(_bestiarySearchTerm
    ? allEntries.length + ' results for ' + _bestiarySearchTerm + '. ' + unlocked + ' revealed.' + (allEntries.length > visibleEntries.length ? ' Showing first ' + visibleEntries.length + '.' : '')
    : 'Bestiary. ' + unlocked + ' of ' + allEntries.length + ' enemies revealed.' + (allEntries.length > visibleEntries.length ? ' Showing first ' + visibleEntries.length + '. Load More button available at the end of the list.' : ''));


}


//═════════════════
// CLASS SKILLS
//═════════════════
var CLASS_SKILLS = {
  Warrior: [
    // Common (levels 1-4)
    { name:'Shield Bash',    icon:'🛡️', desc:'Slam your shield, dealing damage and reducing enemy next attack.',       spCost:8,  tier:'common',  effect:'shield-bash'    },
    { name:'War Cry',        icon:'📣', desc:'Battle cry empowers next attack for 2x damage.',                          spCost:10, tier:'common',  effect:'war-cry'        },
    { name:'Iron Stance',    icon:'🦵', desc:'Plant your feet — gain +4 defense for 2 turns.',                          spCost:8,  tier:'common',  effect:'iron-stance'    },
    { name:'Taunt',          icon:'😤', desc:'Force the enemy to attack recklessly — their next hit deals half damage.', spCost:7,  tier:'common',  effect:'taunt'          },
    { name:'Weapon Throw',   icon:'🗡️', desc:'Throw your weapon for a ranged strike dealing 1.2x damage.',              spCost:9,  tier:'common',  effect:'weapon-throw'   },
    // Rare (levels 4-7)
    { name:'Last Stand',     icon:'💢', desc:'Below 30% HP, unleash a devastating strike for 3x damage.',               spCost:15, tier:'rare',    effect:'last-stand'     },
    { name:'Battle Hardened',icon:'⚔️', desc:'Permanently gain +3 max HP this run.',                                    spCost:12, tier:'rare',    effect:'battle-hardened'},
    { name:'Overwhelm',      icon:'🌊', desc:'Strike twice — each hit deals 0.8x damage.',                              spCost:14, tier:'rare',    effect:'overwhelm'      },
    { name:'Fortify',        icon:'🏰', desc:'Reduce all incoming damage by 35% for 3 turns.',                          spCost:13, tier:'rare',    effect:'fortify'        },
    { name:'Execute',        icon:'⚡', desc:'Enemy below 25% HP? Execute for guaranteed critical hit.',                spCost:14, tier:'rare',    effect:'execute'        },
    // Legendary (levels 7-10)
    { name:'Unstoppable',    icon:'🔥', desc:'For 2 turns, cannot be killed below 1 HP.',                               spCost:20, tier:'legendary',effect:'unstoppable'   },
    { name:'Warlord',        icon:'👑', desc:'Every kill this combat restores 10 HP and 3 SP.',                         spCost:18, tier:'legendary',effect:'warlord'       },
    { name:'Titan Smash',    icon:'💥', desc:'Massive strike dealing 4x damage but costs 15 HP.',                       spCost:18, tier:'legendary',effect:'titan-smash'   },
    { name:'Battlecry',      icon:'🦁', desc:'Doubles your attack for the rest of combat.',                             spCost:22, tier:'legendary',effect:'battlecry'     },
    { name:'Indomitable',    icon:'🛡️', desc:'Fully restore HP once per combat.',                                        spCost:25, tier:'legendary',effect:'indomitable'  }
  ],
  Monk: [
    { name:'Swift Strike',   icon:'⚡', desc:'Strike twice in rapid succession for full damage each hit.',              spCost:10, tier:'common',  effect:'swift-strike'   },
    { name:'Inner Focus',    icon:'🧘', desc:'Center yourself, restoring 15 HP and 10 SP.',                            spCost:8,  tier:'common',  effect:'inner-focus'    },
    { name:'Wind Step',      icon:'💨', desc:'Dodge the next enemy attack completely.',                                  spCost:9,  tier:'common',  effect:'wind-step'      },
    { name:'Ki Pulse',       icon:'✨', desc:'Release inner energy dealing 1.5x damage, ignores armor.',               spCost:10, tier:'common',  effect:'ki-pulse'       },
    { name:'Meditate',       icon:'🌸', desc:'Restore 8 SP and heal 10 HP.',                                           spCost:5,  tier:'common',  effect:'meditate'       },
    { name:'Pressure Point', icon:'👊', desc:'Strike a vital point, ignoring all enemy defense.',                       spCost:12, tier:'rare',    effect:'pressure-point' },
    { name:'Iron Body',      icon:'💪', desc:'Harden your body — +5 defense permanently this run.',                    spCost:14, tier:'rare',    effect:'iron-body'      },
    { name:'Thousand Cuts',  icon:'🗡️', desc:'Strike 4 times for 0.5x damage each hit.',                               spCost:15, tier:'rare',    effect:'thousand-cuts'  },
    { name:'Spirit Shield',  icon:'🔵', desc:'Create a shield that absorbs 30 damage.',                                 spCost:13, tier:'rare',    effect:'spirit-shield'  },
    { name:'Zen Strike',     icon:'☯️', desc:'Your next 3 attacks cannot miss.',                                        spCost:14, tier:'rare',    effect:'zen-strike'     },
    { name:'Transcendence',  icon:'🌟', desc:'Enter a state of perfect focus — double all damage for 2 turns.',        spCost:20, tier:'legendary',effect:'transcendence' },
    { name:'Soul Surge',     icon:'💫', desc:'Unleash your full inner power for 3.5x damage.',                         spCost:22, tier:'legendary',effect:'soul-surge'    },
    { name:'One With All',   icon:'🌊', desc:'Restore all SP and heal 25 HP.',                                         spCost:18, tier:'legendary',effect:'one-with-all'  },
    { name:'Iron Fist',      icon:'🥊', desc:'Your fists tear through armor — deal 2.5x damage.',                      spCost:20, tier:'legendary',effect:'iron-fist'     },
    { name:'Enlightenment',  icon:'☀️', desc:'Permanently increase max SP by 10 this run.',                            spCost:25, tier:'legendary',effect:'enlightenment' }
  ],
  Assassin: [
    { name:'Backstab',       icon:'🗡️', desc:'Strike from shadows for 3x damage, 35% miss chance.',                   spCost:12, tier:'common',  effect:'backstab'       },
    { name:'Smoke Bomb',     icon:'💨', desc:'Vanish in smoke. Guaranteed escape from combat.',                        spCost:8,  tier:'common',  effect:'smoke-bomb'     },
    { name:'Poison Blade',   icon:'🐍', desc:'Coat your blade — next hit applies 3-turn poison.',                      spCost:9,  tier:'common',  effect:'poison-blade'   },
    { name:'Shadowstep',     icon:'🌑', desc:'Phase through the enemy — your next attack cannot miss.',                spCost:10, tier:'common',  effect:'shadowstep'     },
    { name:'Cheap Shot',     icon:'🎯', desc:'Strike a weak point — enemy skips their next turn.',                     spCost:11, tier:'common',  effect:'cheap-shot'     },
    { name:'Marked Kill',    icon:'🎯', desc:'Mark your target — next attack guaranteed critical.',                    spCost:15, tier:'rare',    effect:'marked-kill'    },
    { name:'Shadow Clone',   icon:'👥', desc:'Create a shadow — doubles your next attack.',                            spCost:14, tier:'rare',    effect:'shadow-clone'   },
    { name:'Death Mark',     icon:'💀', desc:'Enemy takes 50% more damage for 3 turns.',                               spCost:13, tier:'rare',    effect:'death-mark'     },
    { name:'Serrated Blade', icon:'🗡️', desc:'Your attacks cause bleeding — 5 damage per turn for 4 turns.',          spCost:14, tier:'rare',    effect:'serrated-blade' },
    { name:'Ambush',         icon:'🌒', desc:'Double damage if enemy is above 75% HP.',                                spCost:13, tier:'rare',    effect:'ambush'         },
    { name:'Assassinate',    icon:'☠️', desc:'Instant kill if enemy is below 20% HP.',                                 spCost:20, tier:'legendary',effect:'assassinate'   },
    { name:'Shadow Form',    icon:'🕷️', desc:'Become untargetable — enemy misses for 2 turns.',                       spCost:22, tier:'legendary',effect:'shadow-form'   },
    { name:'Fan of Knives',  icon:'🗡️', desc:'Unleash 5 rapid strikes for 0.6x damage each.',                         spCost:20, tier:'legendary',effect:'fan-of-knives' },
    { name:'Lethal Tempo',   icon:'⚡', desc:'Each consecutive attack this combat deals 15% more damage.',            spCost:18, tier:'legendary',effect:'lethal-tempo'  },
    { name:'Death Sentence', icon:'💀', desc:'Your next attack deals damage equal to 40% of enemy max HP.',           spCost:25, tier:'legendary',effect:'death-sentence'}
  ],
  Paladin: [
    { name:'Holy Strike',    icon:'✨', desc:'Channel divine power — strike for damage and heal 20 HP.',              spCost:10, tier:'common',  effect:'holy-strike'    },
    { name:'Divine Shield',  icon:'🔮', desc:'Block ALL incoming damage this turn.',                                   spCost:12, tier:'common',  effect:'divine-shield'  },
    { name:'Consecrate',     icon:'✝️', desc:'Blessed ground — reduce all incoming damage by 20% for 3 turns.',       spCost:9,  tier:'common',  effect:'consecrate'     },
    { name:'Lay on Hands',   icon:'🤲', desc:'Touch of healing — restore 35 HP instantly.',                           spCost:10, tier:'common',  effect:'lay-on-hands'   },
    { name:'Holy Light',     icon:'💛', desc:'Blind the enemy — their next 2 attacks deal half damage.',              spCost:8,  tier:'common',  effect:'holy-light'     },
    { name:'Smite',          icon:'⚡', desc:'Call down divine wrath for massive holy damage.',                        spCost:18, tier:'rare',    effect:'smite'          },
    { name:'Aura of Faith',  icon:'😇', desc:'Permanent aura — restore 5 HP at the start of each turn.',             spCost:14, tier:'rare',    effect:'aura-of-faith'  },
    { name:'Sacred Blade',   icon:'⚔️', desc:'Bless your weapon — deal 2x damage for 3 attacks.',                    spCost:15, tier:'rare',    effect:'sacred-blade'   },
    { name:'Holy Nova',      icon:'💥', desc:'Release holy energy — deals 1.5x damage and heals you for half.',       spCost:16, tier:'rare',    effect:'holy-nova'      },
    { name:'Judgment',       icon:'⚖️', desc:'Judge the enemy — deal damage equal to their defense value times 5.',  spCost:14, tier:'rare',    effect:'judgment'       },
    { name:'Resurrection',   icon:'💖', desc:'Return from death once per run with 50% HP.',                           spCost:25, tier:'legendary',effect:'resurrection'  },
    { name:'Archangel',      icon:'👼', desc:'Transform briefly — triple attack and defense for 2 turns.',            spCost:22, tier:'legendary',effect:'archangel'     },
    { name:'Divine Wrath',   icon:'☀️', desc:'Unleash all divine power — 5x damage but ends all SP.',                spCost:20, tier:'legendary',effect:'divine-wrath'  },
    { name:'Sanctuary',      icon:'🛡️', desc:'Cannot take more than 10 damage per hit for 3 turns.',                 spCost:20, tier:'legendary',effect:'sanctuary'     },
    { name:'Holy Crusade',   icon:'⚔️', desc:'Each holy attack this combat heals you for 15 HP.',                    spCost:18, tier:'legendary',effect:'holy-crusade'  }
  ],
  Naturalist: [
    { name:'Entangle',       icon:'🌿', desc:'Roots enemy — they skip their next counterattack.',                      spCost:8,  tier:'common',  effect:'entangle'       },
    { name:'Venom',          icon:'🐍', desc:'Apply poison — 8 damage per turn for 3 turns.',                         spCost:10, tier:'common',  effect:'venom'          },
    { name:'Pack Bond',      icon:'🐺', desc:'Call a wolf ally — attacks with you this turn for bonus damage.',        spCost:9,  tier:'common',  effect:'pack-bond'      },
    { name:'Nature Mend',    icon:'🍃', desc:'Draw power from nature — heal 20 HP.',                                  spCost:8,  tier:'common',  effect:'nature-mend'    },
    { name:'Camouflage',     icon:'🌳', desc:'Blend with surroundings — enemy has 40% miss chance next turn.',         spCost:9,  tier:'common',  effect:'camouflage'     },
    { name:'Call of Wild',   icon:'🐺', desc:'Summon a spirit beast to attack for 2x your base attack.',              spCost:15, tier:'rare',    effect:'call-wild'      },
    { name:'Thorns',         icon:'🌵', desc:'Surround yourself with thorns — reflect 30% of damage received.',       spCost:13, tier:'rare',    effect:'thorns'         },
    { name:'Plague',         icon:'🦠', desc:'Infect the enemy — they lose 10 HP per turn for 4 turns.',              spCost:14, tier:'rare',    effect:'plague'         },
    { name:'Predator',       icon:'🐆', desc:'Strike with animal fury — 2.5x damage.',                                spCost:14, tier:'rare',    effect:'predator'       },
    { name:'Swarm',          icon:'🐝', desc:'Unleash a swarm — enemy cannot act for 1 turn.',                        spCost:15, tier:'rare',    effect:'swarm'          },
    { name:'Ancient Grove',  icon:'🌲', desc:'Summon ancient power — heal 40 HP and deal 2x damage.',                 spCost:20, tier:'legendary',effect:'ancient-grove' },
    { name:'Apex Predator',  icon:'🦁', desc:'Channel apex predator energy — 4x damage.',                             spCost:22, tier:'legendary',effect:'apex-predator' },
    { name:'Plague Lord',    icon:'☣️', desc:'Infect with lethal plague — 20 damage per turn for 5 turns.',           spCost:20, tier:'legendary',effect:'plague-lord'   },
    { name:'Nature Wrath',   icon:'🌪️', desc:'Summon a storm of nature — 3x damage ignoring all defenses.',          spCost:22, tier:'legendary',effect:'nature-wrath'  },
    { name:'One With Nature',icon:'🌍', desc:'Become one with the dungeon — restore all HP.',                         spCost:25, tier:'legendary',effect:'one-nature'    }
  ],
  Sorcerer: [
    { name:'Arcane Bolt',    icon:'🔮', desc:'Fire a bolt of arcane energy bypassing defense.',                        spCost:10, tier:'common',  effect:'arcane-bolt'    },
    { name:'Mana Shield',    icon:'💙', desc:'Convert 10 SP into a barrier absorbing 25 damage.',                     spCost:8,  tier:'common',  effect:'mana-shield'    },
    { name:'Frost Bolt',     icon:'❄️', desc:'Freeze the enemy — they deal 30% less damage next turn.',               spCost:9,  tier:'common',  effect:'frost-bolt'     },
    { name:'Arcane Surge',   icon:'⚡', desc:'Overcharge your magic — 1.6x damage but costs 5 HP.',                  spCost:10, tier:'common',  effect:'arcane-surge'   },
    { name:'Mana Tap',       icon:'🔵', desc:'Draw from the arcane — restore 12 SP.',                                 spCost:5,  tier:'common',  effect:'mana-tap'       },
    { name:'Obliterate',     icon:'💥', desc:'Channel all remaining SP into a blast — damage scales with SP.',        spCost:20, tier:'rare',    effect:'obliterate'     },
    { name:'Chain Lightning', icon:'⚡', desc:'Lightning bounces — deal 1.5x damage and stun 1 turn.',               spCost:15, tier:'rare',    effect:'chain-lightning'},
    { name:'Arcane Armor',   icon:'🔷', desc:'Crystallize magical armor — absorb up to 40 damage.',                   spCost:14, tier:'rare',    effect:'arcane-armor'   },
    { name:'Gravity Well',   icon:'🌑', desc:'Trap the enemy — they cannot deal critical hits for 3 turns.',          spCost:13, tier:'rare',    effect:'gravity-well'   },
    { name:'Spell Weave',    icon:'🌀', desc:'Weave two spells — deal 1.3x damage twice.',                            spCost:16, tier:'rare',    effect:'spell-weave'    },
    { name:'Singularity',    icon:'🌌', desc:'Create a singularity — deals damage equal to 50% enemy max HP.',        spCost:22, tier:'legendary',effect:'singularity'   },
    { name:'Time Stop',      icon:'⏱️', desc:'Stop time briefly — attack 3 times before enemy can react.',            spCost:25, tier:'legendary',effect:'time-stop'     },
    { name:'Void Blast',     icon:'🕳️', desc:'Channel the void — 5x damage, costs 20 HP.',                           spCost:20, tier:'legendary',effect:'void-blast'    },
    { name:'Arcane Nova',    icon:'💫', desc:'Release nova of pure magic — deal 3x damage to enemy.',                 spCost:22, tier:'legendary',effect:'arcane-nova'   },
    { name:'Unlimited Power',icon:'⚡', desc:'Remove all SP limits — your next 3 skills cost 0 SP.',                 spCost:18, tier:'legendary',effect:'unlimited-power'}
  ],
  Necromancer: [
    { name:'Death Touch',    icon:'💀', desc:'Touch of death — deal 1.4x damage and steal 5 SP from enemy.',         spCost:10, tier:'common',  effect:'death-touch'    },
    { name:'Raise Dead',     icon:'🧟', desc:'Raise the last fallen enemy as a minion — attacks with you once.',      spCost:12, tier:'common',  effect:'raise-dead'     },
    { name:'Life Drain',     icon:'🩸', desc:'Drain life — deal damage and heal for half the amount.',               spCost:10, tier:'common',  effect:'life-drain'     },
    { name:'Bone Shield',    icon:'🦴', desc:'Form a bone shield — absorb up to 20 damage.',                          spCost:8,  tier:'common',  effect:'bone-shield'    },
    { name:'Curse',          icon:'😈', desc:'Curse the enemy — they take 15% more damage for 3 turns.',             spCost:9,  tier:'common',  effect:'curse'          },
    { name:'Soul Harvest',   icon:'💜', desc:'Harvest enemy soul — deal 1.8x damage and restore 8 SP.',              spCost:14, tier:'rare',    effect:'soul-harvest'   },
    { name:'Corpse Explosion',icon:'💥', desc:'Explode a fallen enemy — deal massive damage based on their max HP.',  spCost:15, tier:'rare',    effect:'corpse-explosion'},
    { name:'Undying',        icon:'☠️', desc:'Become undying briefly — cannot die for 1 turn.',                       spCost:16, tier:'rare',    effect:'undying'        },
    { name:'Necrotic Bolt',  icon:'🌑', desc:'Fire decaying magic — ignores all defense.',                           spCost:13, tier:'rare',    effect:'necrotic-bolt'  },
    { name:'Plague Carrier', icon:'🦠', desc:'Infect with dark plague — 12 damage per turn for 4 turns.',            spCost:14, tier:'rare',    effect:'plague-carrier' },
    { name:'Army of Dead',   icon:'💀', desc:'Raise an army — attack 4 times for 0.7x damage each.',                spCost:22, tier:'legendary',effect:'army-of-dead'  },
    { name:'Death Pact',     icon:'🩸', desc:'Sacrifice 30 HP to deal 5x damage.',                                   spCost:20, tier:'legendary',effect:'death-pact'    },
    { name:'Soul Storm',     icon:'🌪️', desc:'Unleash every harvested soul — massive AoE dealing 3x damage.',        spCost:25, tier:'legendary',effect:'soul-storm'    },
    { name:'Lich Form',      icon:'👑', desc:'Transform into a Lich — double all stats for 3 turns.',                spCost:22, tier:'legendary',effect:'lich-form'     },
    { name:'Death Coil',     icon:'☠️', desc:'Coil of death energy — deals 2x damage and heals 25 HP.',              spCost:20, tier:'legendary',effect:'death-coil'    }
  ],
  Berserker: [
    { name:'Reckless Strike',icon:'🪓', desc:'Wild swing dealing 1.6x damage but taking 5 HP.',                      spCost:8,  tier:'common',  effect:'reckless-strike'},
    { name:'Rage',           icon:'😡', desc:'Enter rage — +4 attack for next 3 turns.',                             spCost:10, tier:'common',  effect:'rage'           },
    { name:'War Stomp',      icon:'🦶', desc:'Stomp the ground — enemy staggers, skips next turn.',                  spCost:9,  tier:'common',  effect:'war-stomp'      },
    { name:'Blood Frenzy',   icon:'🩸', desc:'Frenzy attack — deal 1.3x damage for each 10% HP missing.',            spCost:10, tier:'common',  effect:'blood-frenzy'   },
    { name:'Headbutt',       icon:'💥', desc:'Savage headbutt — 1.4x damage and reduces enemy defense.',             spCost:9,  tier:'common',  effect:'headbutt'       },
    { name:'Rampage',        icon:'🔥', desc:'Go on a rampage — attack twice with growing power.',                   spCost:14, tier:'rare',    effect:'rampage'        },
    { name:'Undying Rage',   icon:'💢', desc:'Below 30% HP? Deal 3x damage — pure fury.',                            spCost:15, tier:'rare',    effect:'undying-rage'   },
    { name:'Savage Blow',    icon:'🪓', desc:'Devastating blow — 2.5x damage, ignores 50% of defense.',              spCost:16, tier:'rare',    effect:'savage-blow'    },
    { name:'War Cry',        icon:'📣', desc:'Terrifying cry — reduces enemy damage by 30% for 2 turns.',            spCost:13, tier:'rare',    effect:'berserker-cry'  },
    { name:'Relentless',     icon:'⚡', desc:'Cannot be slowed — guaranteed to move first this turn.',               spCost:12, tier:'rare',    effect:'relentless'     },
    { name:'Wrath Incarnate',icon:'☄️', desc:'Become pure wrath — 4x damage at the cost of all defense.',           spCost:20, tier:'legendary',effect:'wrath-incarnate'},
    { name:'Death Wish',     icon:'💀', desc:'Risk it all — deal damage equal to missing HP times 3.',               spCost:22, tier:'legendary',effect:'death-wish'    },
    { name:'Berserker God',  icon:'👑', desc:'Ascend to berserker godhood — immune to damage for 1 turn then 4x.',   spCost:25, tier:'legendary',effect:'berserker-god' },
    { name:'Endless Rage',   icon:'🔥', desc:'Rage never ends — double attack speed for 3 turns.',                   spCost:20, tier:'legendary',effect:'endless-rage'  },
    { name:'Final Blow',     icon:'💥', desc:'One strike with everything — deal 6x damage but end combat SP.',        spCost:18, tier:'legendary',effect:'final-blow'    }
  ],
  Bard: [
    { name:'Battle Hymn',    icon:'🎵', desc:'Inspiring song — your next attack deals 1.5x damage.',                 spCost:8,  tier:'common',  effect:'battle-hymn'    },
    { name:'Dissonance',     icon:'🎶', desc:'Jarring chord — enemy loses 3 defense this turn.',                     spCost:7,  tier:'common',  effect:'dissonance'     },
    { name:'Soothing Melody',icon:'🎼', desc:'Calming song — restore 18 HP.',                                        spCost:9,  tier:'common',  effect:'soothing-melody'},
    { name:'Taunt Song',     icon:'😏', desc:'Mockery melody — enemy attacks recklessly, 25% miss chance.',          spCost:8,  tier:'common',  effect:'taunt-song'     },
    { name:'Rhythmic Strike',icon:'🥁', desc:'Strike in rhythm — deals 1.2x damage and restores 5 SP.',              spCost:9,  tier:'common',  effect:'rhythmic-strike'},
    { name:'War Ballad',     icon:'⚔️', desc:'Epic war song — your attack is doubled for 2 turns.',                  spCost:14, tier:'rare',    effect:'war-ballad'     },
    { name:'Lullaby',        icon:'😴', desc:'Put the enemy to sleep — they miss their next turn.',                   spCost:13, tier:'rare',    effect:'lullaby'        },
    { name:'Discord',        icon:'💔', desc:'Chaos chord — confuse enemy to deal 1.8x damage to itself.',           spCost:15, tier:'rare',    effect:'discord'        },
    { name:'Heroic Verse',   icon:'📜', desc:'Sing of heroes — permanently gain +5 max HP this run.',               spCost:14, tier:'rare',    effect:'heroic-verse'   },
    { name:'Anthem',         icon:'🎺', desc:'Rally anthem — restore 15 HP and 10 SP.',                              spCost:13, tier:'rare',    effect:'anthem'         },
    { name:'Song of Doom',   icon:'💀', desc:'Death song — enemy takes 3x damage from your next 2 attacks.',        spCost:20, tier:'legendary',effect:'song-of-doom'  },
    { name:'Requiem',        icon:'🌹', desc:'Funeral song — deal damage equal to 45% of enemy max HP.',             spCost:22, tier:'legendary',effect:'requiem'       },
    { name:'Epic Tale',      icon:'📖', desc:'Tell your epic — every kill this run permanently boosts your ATK.',    spCost:20, tier:'legendary',effect:'epic-tale'     },
    { name:'Maestro',        icon:'🎭', desc:'Become the maestro — all skills cost 0 SP for 3 turns.',              spCost:25, tier:'legendary',effect:'maestro'       },
    { name:'Grand Finale',   icon:'🎆', desc:'End with everything — deal 5x damage.',                                spCost:22, tier:'legendary',effect:'grand-finale'  }
  ],
  Alchemist: [
    { name:'Acid Flask',     icon:'🧪', desc:'Throw acid — deals 1.4x damage and reduces enemy defense.',            spCost:9,  tier:'common',  effect:'acid-flask'     },
    { name:'Healing Brew',   icon:'💊', desc:'Craft a quick healing brew — restore 25 HP.',                          spCost:8,  tier:'common',  effect:'healing-brew'   },
    { name:'Smoke Grenade',  icon:'💨', desc:'Throw smoke — enemy has 35% miss chance next turn.',                   spCost:9,  tier:'common',  effect:'smoke-grenade'  },
    { name:'Transmute',      icon:'⚗️', desc:'Transmute 10 gold into raw power — deal 1.5x damage.',                spCost:7,  tier:'common',  effect:'transmute'      },
    { name:'Sticky Bomb',    icon:'💣', desc:'Plant a bomb — explodes next turn for 1.8x damage.',                   spCost:10, tier:'common',  effect:'sticky-bomb'    },
    { name:'Explosive Flask',icon:'💥', desc:'Large explosion — 2x damage ignoring defense.',                        spCost:14, tier:'rare',    effect:'explosive-flask'},
    { name:'Philosopher Stone',icon:'💎',desc:'Touch of the stone — convert HP into SP at 2:1 ratio.',              spCost:12, tier:'rare',    effect:'philosopher-stone'},
    { name:'Elixir of Rage', icon:'🔴', desc:'Drink battle elixir — triple damage but take 10 HP this turn.',        spCost:15, tier:'rare',    effect:'elixir-of-rage' },
    { name:'Corrosion',      icon:'☣️', desc:'Corrode armor — enemy loses ALL defense for 3 turns.',                spCost:16, tier:'rare',    effect:'corrosion'      },
    { name:'Chain Reaction', icon:'⚡', desc:'Trigger chain — deal 1.2x damage 3 times.',                           spCost:15, tier:'rare',    effect:'chain-reaction' },
    { name:'Nova Bomb',      icon:'🌟', desc:'Detonation — deals damage equal to 60% of enemy max HP.',             spCost:22, tier:'legendary',effect:'nova-bomb'     },
    { name:'Grand Transmutation',icon:'✨',desc:'Transmute everything — deal 4x damage.',                           spCost:20, tier:'legendary',effect:'grand-transmute'},
    { name:'Immortality Serum',icon:'💉',desc:'Inject serum — cannot die for 2 turns.',                             spCost:25, tier:'legendary',effect:'immortality-serum'},
    { name:'Plague Bomb',    icon:'🦠', desc:'Devastating plague — 15 damage per turn for 6 turns.',                spCost:22, tier:'legendary',effect:'plague-bomb'   },
    { name:'Unstable Formula',icon:'☢️', desc:'Experimental formula — massive random damage (1x to 6x).',           spCost:18, tier:'legendary',effect:'unstable-formula'}
  ],
  BloodKnight: [
    { name:'Blood Strike',   icon:'🩸', desc:'Sacrifice 8 HP to deal 2x damage.',                                   spCost:8,  tier:'common',  effect:'blood-strike'   },
    { name:'Crimson Slash',  icon:'⚔️', desc:'Slash dealing 1.4x damage, heals 5 HP on hit.',                       spCost:9,  tier:'common',  effect:'crimson-slash'  },
    { name:'Life Tap',       icon:'❤️', desc:'Tap into life force — convert 15 HP into 15 SP.',                     spCost:5,  tier:'common',  effect:'life-tap'       },
    { name:'Blood Bath',     icon:'💉', desc:'Bathed in enemy blood — gain +3 attack for this combat.',              spCost:10, tier:'common',  effect:'blood-bath'     },
    { name:'Hemorrhage',     icon:'🩸', desc:'Cause enemy to bleed — 8 damage per turn for 3 turns.',               spCost:9,  tier:'common',  effect:'hemorrhage'     },
    { name:'Sanguine Fury',  icon:'🔥', desc:'Fury of blood — sacrifice 20 HP for 3x damage.',                      spCost:14, tier:'rare',    effect:'sanguine-fury'  },
    { name:'Blood Armor',    icon:'🛡️', desc:'Crystallize blood into armor — absorb 35 damage.',                    spCost:15, tier:'rare',    effect:'blood-armor'    },
    { name:'Crimson Nova',   icon:'💥', desc:'Blood nova explosion — 2x damage to enemy.',                           spCost:16, tier:'rare',    effect:'crimson-nova'   },
    { name:'Vein Tap',       icon:'💜', desc:'Drain enemy veins — steal 15 HP from enemy.',                          spCost:14, tier:'rare',    effect:'vein-tap'       },
    { name:'Exsanguinate',   icon:'☠️', desc:'Drain all blood — deal 1.8x damage, enemy bleeds for 3 turns.',       spCost:15, tier:'rare',    effect:'exsanguinate'   },
    { name:'Blood God',      icon:'👑', desc:'Become blood incarnate — 5x damage, heal for half dealt.',             spCost:22, tier:'legendary',effect:'blood-god'     },
    { name:'Crimson Storm',  icon:'🌪️', desc:'Storm of crimson — attack 5 times for 0.8x damage.',                  spCost:20, tier:'legendary',effect:'crimson-storm' },
    { name:'Exanguination',  icon:'💀', desc:'Ultimate drain — deal damage equal to 35% of enemy max HP.',          spCost:22, tier:'legendary',effect:'exanguination'  },
    { name:'Blood Pact',     icon:'🩸', desc:'Dark pact — sacrifice 40 HP to deal 6x damage.',                      spCost:18, tier:'legendary',effect:'blood-pact'    },
    { name:'Immortal Blood', icon:'❤️', desc:'Your blood is eternal — regenerate 10 HP per turn for 4 turns.',      spCost:20, tier:'legendary',effect:'immortal-blood'}
  ],
  Druid: [
    { name:'Nature Bolt',    icon:'🍃', desc:'Hurl a bolt of nature energy — 1.3x damage.',                          spCost:8,  tier:'common',  effect:'nature-bolt'    },
    { name:'Regrowth',       icon:'🌱', desc:'Channel nature — heal 20 HP.',                                         spCost:9,  tier:'common',  effect:'regrowth'       },
    { name:'Thorn Whip',     icon:'🌿', desc:'Thorned vine — 1.4x damage and reduces enemy attack.',                 spCost:9,  tier:'common',  effect:'thorn-whip'     },
    { name:'Beast Form',     icon:'🐻', desc:'Shift to beast — gain +4 attack and +2 defense for 2 turns.',          spCost:10, tier:'common',  effect:'beast-form'     },
    { name:'Rejuvenate',     icon:'💚', desc:'Renewing touch — restore 8 SP and 12 HP.',                             spCost:8,  tier:'common',  effect:'rejuvenate'     },
    { name:'Moonfire',       icon:'🌙', desc:'Lunar beam — 2x damage ignoring 30% of defense.',                      spCost:14, tier:'rare',    effect:'moonfire'       },
    { name:'Spirit Form',    icon:'👻', desc:'Shift to spirit — heal 30 HP, become untargetable next turn.',         spCost:15, tier:'rare',    effect:'spirit-form'    },
    { name:'Barkskin',       icon:'🌲', desc:'Harden skin into bark — reduce all damage by 40% for 2 turns.',        spCost:13, tier:'rare',    effect:'barkskin'       },
    { name:'Sunfire',        icon:'☀️', desc:'Solar strike — 1.8x damage and burns for 8/turn for 3 turns.',        spCost:15, tier:'rare',    effect:'sunfire'        },
    { name:'Wild Growth',    icon:'🌺', desc:'Wild regeneration — heal 10 HP per turn for 3 turns.',                 spCost:14, tier:'rare',    effect:'wild-growth'    },
    { name:'Avatar of Nature',icon:'🌍',desc:'Become nature — triple attack and massive defense for 2 turns.',       spCost:22, tier:'legendary',effect:'avatar-nature' },
    { name:'Ancient Wrath',  icon:'⚡', desc:'Ancient fury — 4x damage ignoring all defense.',                       spCost:20, tier:'legendary',effect:'ancient-wrath' },
    { name:'Balance',        icon:'☯️', desc:'Restore perfect balance — fully heal and restore all SP.',             spCost:25, tier:'legendary',effect:'balance'       },
    { name:'Stormcall',      icon:'🌩️', desc:'Call a storm — deals 3x damage and stuns for 1 turn.',                spCost:22, tier:'legendary',effect:'stormcall'     },
    { name:'Verdant Tide',   icon:'🌊', desc:'Tidal wave of nature — 2.5x damage plus 20 HP heal.',                  spCost:20, tier:'legendary',effect:'verdant-tide'  }
  ]
  ,
  Warlock: [
    { name:'Dark Pact',      icon:'🧿', desc:'Strike a dark deal — 1.5x damage, drain 10 HP from self.',   spCost:8,  tier:'common',   effect:'dark-pact'     },
    { name:'Soul Rend',      icon:'💜', desc:'Tear at the soul — 1.4x damage, steal 8 HP from enemy.',     spCost:9,  tier:'common',   effect:'soul-rend'     },
    { name:'Hex',            icon:'🔮', desc:'Curse the enemy — they take 50% more damage for 2 turns.',   spCost:8,  tier:'common',   effect:'hex'           },
    { name:'Void Grasp',     icon:'⬛', desc:'Void tendrils — 1.3x damage and reduce enemy attack.',       spCost:9,  tier:'common',   effect:'void-grasp'    },
    { name:'Life Leech',     icon:'🩸', desc:'Drain life — deal 1.2x damage and heal for half dealt.',     spCost:10, tier:'common',   effect:'life-leech'    },
    { name:'Shadow Bolt',    icon:'🌑', desc:'A bolt of pure shadow — 2x damage ignoring defense.',        spCost:14, tier:'rare',     effect:'shadow-bolt'   },
    { name:'Demonic Surge',  icon:'😈', desc:'Channel demonic power — 1.8x damage and +3 attack this combat.', spCost:13, tier:'rare', effect:'demonic-surge' },
    { name:'Soul Cage',      icon:'🔒', desc:'Trap the enemy soul — they cannot act for 1 turn.',          spCost:12, tier:'rare',     effect:'soul-cage'     },
    { name:'Eldritch Blast', icon:'💥', desc:'Eldritch energy — 2.5x damage to a random target.',          spCost:15, tier:'rare',     effect:'eldritch-blast'},
    { name:'Pact of Blood',  icon:'💉', desc:'Blood pact — sacrifice 25 HP for 3x damage.',                spCost:14, tier:'rare',     effect:'pact-of-blood' },
    { name:'Void Collapse',  icon:'🕳️', desc:'Collapse reality — 4x damage ignoring all defense.',        spCost:22, tier:'legendary',effect:'void-collapse' },
    { name:'Soul Storm',     icon:'⚡', desc:'Unleash all stolen souls — damage scales with kills this run.',spCost:20, tier:'legendary',effect:'warlock-soul-storm'},
    { name:'Elder Invocation',icon:'👁️',desc:'Invoke the Elder — triple stats for 2 turns.',              spCost:25, tier:'legendary',effect:'elder-invocation'},
    { name:'Oblivion',       icon:'🌀', desc:'Oblivion — deal damage equal to 70% of enemy max HP.',       spCost:22, tier:'legendary',effect:'oblivion'      },
    { name:'Final Pact',     icon:'💀', desc:'The last pact — sacrifice all HP above 1 for massive damage.',spCost:18, tier:'legendary',effect:'final-pact'   },
  ],
  DeathKnight: [
    { name:'Death Coil',     icon:'💀', desc:'Coil of death energy — 1.4x damage and heal 15 HP.',        spCost:9,  tier:'common',   effect:'dk-death-coil' },
    { name:'Unholy Strike',  icon:'⚔️', desc:'Strike with unholy force — 1.5x damage.',                  spCost:8,  tier:'common',   effect:'unholy-strike' },
    { name:'Death Grip',     icon:'🖐️', desc:'Grip of death — 1.2x damage, enemy attack reduced 30%.',   spCost:8,  tier:'common',   effect:'death-grip'    },
    { name:'Bone Armor',     icon:'🦴', desc:'Armor of bone — absorb up to 30 damage.',                   spCost:9,  tier:'common',   effect:'bone-armor'    },
    { name:'Soul Strike',    icon:'👻', desc:'Strike the soul directly — 1.6x damage ignoring defense.',  spCost:10, tier:'common',   effect:'soul-strike'   },
    { name:'Corpse Walk',    icon:'🧟', desc:'Rise from near-death — if below 30% HP, heal 25 HP.',       spCost:12, tier:'rare',     effect:'corpse-walk'   },
    { name:'Dark Resurrection',icon:'⬆',desc:'Prepare to rise — survive the next killing blow at 5 HP.',spCost:14, tier:'rare',     effect:'dark-resurrection'},
    { name:'Necrotic Strike',icon:'☠️', desc:'Necrotic energy — 2x damage and apply poison 3 turns.',    spCost:13, tier:'rare',     effect:'necrotic-strike'},
    { name:'Army of Darkness',icon:'👥',desc:'Raise the dead — 4 undead each strike for damage.',        spCost:15, tier:'rare',     effect:'army-darkness' },
    { name:'Death Nova',     icon:'💥', desc:'Nova of death — 2.5x damage in a burst.',                   spCost:14, tier:'rare',     effect:'death-nova'    },
    { name:'Undying',        icon:'♾️', desc:'Cannot die for 2 turns.',                                   spCost:20, tier:'legendary',effect:'dk-undying'    },
    { name:'Dark Ascension', icon:'👑', desc:'Ascend — double all stats for 3 turns.',                    spCost:22, tier:'legendary',effect:'dark-ascension'},
    { name:'Death and Decay',icon:'🌑', desc:'Decay everything — deals 5x damage, costs 30 HP.',         spCost:20, tier:'legendary',effect:'death-decay'   },
    { name:'Apocalypse',     icon:'🔱', desc:'Four horsemen — four strikes of 1.5x each.',                spCost:22, tier:'legendary',effect:'apocalypse'    },
    { name:'Eternal Darkness',icon:'⬛',desc:'Become darkness — restore all HP and deal 3x damage.',     spCost:25, tier:'legendary',effect:'eternal-darkness'},
  ],
  Ranger: [
    { name:'Aimed Shot',     icon:'🎯', desc:'Precise shot — 1.6x damage, cannot miss.',                  spCost:9,  tier:'common',   effect:'aimed-shot'    },
    { name:'Rapid Fire',     icon:'🏹', desc:'Loose two arrows — two hits of 0.9x each.',                 spCost:8,  tier:'common',   effect:'rapid-fire'    },
    { name:'Hunter\'s Mark', icon:'🎯', desc:'Mark the prey — next attack deals double damage.',           spCost:8,  tier:'common',   effect:'mark-kill'     },
    { name:'Shadow Step',    icon:'🌑', desc:'Step into shadow — guaranteed flee this turn.',              spCost:7,  tier:'common',   effect:'shadow-step'   },
    { name:'Barbed Arrow',   icon:'🩸', desc:'Barbed tip — enemy bleeds for 3 turns, 5 damage each.',     spCost:10, tier:'common',   effect:'venom-strike'  },
    { name:'Eagle Eye',      icon:'👁️', desc:'Eagle sight — next 2 attacks deal 1.5x damage.',           spCost:12, tier:'rare',     effect:'eagle-eye'     },
    { name:'Pin Down',       icon:'📌', desc:'Pin to the wall — enemy cannot attack next turn.',           spCost:11, tier:'rare',     effect:'wing-gust'     },
    { name:'Rain of Arrows', icon:'🌧️', desc:'Arrow storm — 3 rapid strikes of 0.8x each.',              spCost:13, tier:'rare',     effect:'dragon-rush'   },
    { name:'Predator',       icon:'🐆', desc:'Hunt mode — +50% damage for 2 turns.',                      spCost:14, tier:'rare',     effect:'draconic-surge'},
    { name:'True Strike',    icon:'⚡', desc:'Unblockable — ignores all defense.',                         spCost:14, tier:'rare',     effect:'fire-breath'   },
    { name:'Killshot',       icon:'💀', desc:'Lethal shot — 4x damage, triple on marked targets.',         spCost:20, tier:'legendary',effect:'dragonstrike'  },
    { name:'Phantom Volley', icon:'👻', desc:'Ghost arrows — 5x damage that bypasses all resistances.',   spCost:22, tier:'legendary',effect:'apocalyptic-fire'},
    { name:'Death from Afar',icon:'☠️', desc:'Legendary precision — 60% of enemy max HP as damage.',      spCost:22, tier:'legendary',effect:'world-ender'   },
    { name:'Hunter\'s End',  icon:'🏆', desc:'The hunt ends — triple attack and crit guaranteed.',         spCost:25, tier:'legendary',effect:'true-dragon-form'},
  ],
  Sentinel: [
    { name:'Shield Wall',    icon:'🛡️', desc:'Raise shield — absorb all damage for 1 turn.',              spCost:8,  tier:'common',   effect:'scale-shield'  },
    { name:'Taunt',          icon:'📢', desc:'Taunt enemy — they must attack you, take 20% less damage.',  spCost:7,  tier:'common',   effect:'taunt'         },
    { name:'Iron Stance',    icon:'⚓', desc:'Plant feet — cannot flee, take 40% less damage 2 turns.',   spCost:9,  tier:'common',   effect:'fortify'       },
    { name:'Counter',        icon:'↩️', desc:'Counter stance — reflect 30% of next hit back.',            spCost:8,  tier:'common',   effect:'molten-scales' },
    { name:'War Cry',        icon:'😤', desc:'Intimidating roar — enemy attack reduced by half 2 turns.', spCost:10, tier:'common',   effect:'dragon-fear'   },
    { name:'Bulwark',        icon:'🏰', desc:'Become a fortress — +8 defense for 3 turns.',               spCost:12, tier:'rare',     effect:'barkskin'      },
    { name:'Retribution',    icon:'⚖️', desc:'Righteous payback — deal damage equal to damage taken.',    spCost:11, tier:'rare',     effect:'retribution'   },
    { name:'Unbreakable',    icon:'💎', desc:'Cannot be reduced below 1 HP this turn.',                   spCost:13, tier:'rare',     effect:'dk-undying'    },
    { name:'Earthquake',     icon:'🌍', desc:'Slam the ground — 2x damage to all enemies.',               spCost:14, tier:'rare',     effect:'death-nova'    },
    { name:'Sanctuary',      icon:'✨', desc:'Divine protection — cap all damage at 10 for 3 turns.',      spCost:14, tier:'rare',     effect:'sanctuary'     },
    { name:'Last Stand',     icon:'🔱', desc:'Near death power — triple damage when below 25% HP.',        spCost:20, tier:'legendary',effect:'apocalypse'    },
    { name:'Siege Breaker',  icon:'💥', desc:'Legendary slam — 4x damage, ignores defense entirely.',     spCost:22, tier:'legendary',effect:'dark-ascension'},
    { name:'Eternal Guard',  icon:'♾️', desc:'Become immortal for 3 turns — all damage negated.',         spCost:25, tier:'legendary',effect:'eternal-darkness'},
    { name:'Colossus',       icon:'🗿', desc:'Ascend to colossus — double HP and triple defense 2 turns.',spCost:22, tier:'legendary',effect:'death-decay'   },
  ],
  Cleric: [
    { name:'Holy Light',     icon:'✨', desc:'Healing light — restore 25 HP.',                            spCost:8,  tier:'common',   effect:'cleric-holy-light'},
    { name:'Sacred Strike',  icon:'✝️', desc:'Strike with holy power — 1.3x damage.',                    spCost:8,  tier:'common',   effect:'sacred-strike'  },
    { name:'Bless',          icon:'🙏', desc:'Divine blessing — +3 defense and +2 attack this combat.',  spCost:9,  tier:'common',   effect:'bless'           },
    { name:'Smite Evil',     icon:'⚡', desc:'Smite the enemy — 1.5x damage.',                           spCost:9,  tier:'common',   effect:'cleric-smite'   },
    { name:'Prayer',         icon:'📿', desc:'Pray for guidance — restore 8 SP and 12 HP.',              spCost:0,  tier:'common',   effect:'prayer'          },
    { name:'Divine Barrier', icon:'🔵', desc:'Holy barrier — absorb up to 40 damage.',                   spCost:12, tier:'rare',     effect:'divine-barrier' },
    { name:'Consecrate Ground',icon:'💛',desc:'Consecrate — reduce incoming damage 30% for 3 turns.',    spCost:13, tier:'rare',     effect:'consecrate-ground'},
    { name:'Holy Word',      icon:'📖', desc:'Holy word of power — 2x damage and stun 1 turn.',          spCost:14, tier:'rare',     effect:'holy-word'       },
    { name:'Mass Heal',      icon:'💚', desc:'Massive healing — restore 45 HP.',                         spCost:15, tier:'rare',     effect:'mass-heal'       },
    { name:'Angel Guard',    icon:'👼', desc:'Angel guardian — cannot take more than 8 damage per hit for 3 turns.', spCost:14, tier:'rare', effect:'angel-guard'},
    { name:'Miracle',        icon:'🌟', desc:'Divine miracle — fully restore HP.',                       spCost:22, tier:'legendary',effect:'miracle'         },
    { name:'Holy Crusade',   icon:'⚔️', desc:'Crusade — each attack heals 20 HP for 3 turns.',          spCost:20, tier:'legendary',effect:'cleric-crusade'  },
    { name:'Divine Judgment',icon:'⚖️', desc:'Judgment — damage based on 5x your defense stat.',        spCost:20, tier:'legendary',effect:'divine-judgment' },
    { name:'Resurrection',   icon:'⬆️', desc:'Prepare resurrection — survive death once with 50% HP.',  spCost:18, tier:'legendary',effect:'cleric-resurrection'},
    { name:'Wrath of God',   icon:'☄️', desc:'Wrath of God — 5x damage, consume all SP.',               spCost:25, tier:'legendary',effect:'wrath-of-god'    },
  ],
  Wizard: [
    { name:'Arcane Bolt',    icon:'⚡', desc:'Fire a bolt of arcane energy — 1.4x damage.',               spCost:7,  tier:'common',   effect:'arcane-bolt'     },
    { name:'Arcane Study',   icon:'📖', desc:'Study the enemy — reveal exact HP and attack range.',       spCost:5,  tier:'common',   effect:'arcane-study'    },
    { name:'Mana Shield',    icon:'🔵', desc:'Arcane barrier — absorb up to 35 damage.',                  spCost:10, tier:'common',   effect:'mana-shield'     },
    { name:'Spell Surge',    icon:'🌀', desc:'Surge of power — next spell costs 0 SP.',                   spCost:0,  tier:'common',   effect:'spell-surge'     },
    { name:'Frost Nova',     icon:'❄️', desc:'Freeze the enemy — skip their next attack.',                spCost:11, tier:'common',   effect:'frost-nova'      },
    { name:'Arcane Missiles',icon:'✨', desc:'Fire 3 missiles — each deals 0.6x damage.',                 spCost:12, tier:'rare',     effect:'arcane-missiles' },
    { name:'Time Warp',      icon:'⏳', desc:'Warp time — take two actions this turn.',                   spCost:15, tier:'rare',     effect:'time-warp'       },
    { name:'Polymorph',      icon:'🐸', desc:'Polymorph the enemy — halve their attack for 3 turns.',    spCost:13, tier:'rare',     effect:'polymorph'       },
    { name:'Mana Drain',     icon:'💧', desc:'Drain arcane energy — restore 20 SP from the enemy.',      spCost:0,  tier:'rare',     effect:'mana-drain'      },
    { name:'Arcane Explosion',icon:'💥',desc:'Arcane explosion — 2.5x damage to all this turn.',         spCost:18, tier:'rare',     effect:'arcane-explosion'},
    { name:'Spellsteal',     icon:'🧿', desc:'Steal the enemy\'s power — +5 attack permanently this run.',spCost:14, tier:'legendary',effect:'spellsteal'      },
    { name:'Arcane Singularity',icon:'🌑',desc:'Singularity — deal damage equal to enemy\'s current HP / 2.',spCost:22,tier:'legendary',effect:'arcane-singularity'},
    { name:'Time Stop',      icon:'⏱️', desc:'Stop time — skip 2 enemy turns completely.',               spCost:20, tier:'legendary',effect:'time-stop'       },
    { name:'Meteor',         icon:'☄️', desc:'Call a meteor — 4x damage. Enemies below 30% HP are instantly defeated.',spCost:24,tier:'legendary',effect:'meteor'},
    { name:'Arcane Mastery', icon:'🔮', desc:'Mastery — all spells deal +50% damage for rest of run.',   spCost:20, tier:'legendary',effect:'arcane-mastery'  },
  ],
  Elementalist: [
    { name:'Fireball',        icon:'🔥', desc:'Hurl a fireball — 1.8x damage. 20% chance to burn for 3 turns.',        spCost:10, tier:'common',   effect:'fireball'         },
    { name:'Ice Shard',       icon:'❄️', desc:'Shard of ice — slows enemy, reducing their next attack by 30%.',         spCost:9,  tier:'common',   effect:'ice-shard'        },
    { name:'Lightning Bolt',  icon:'⚡', desc:'Strike with lightning — 1.5x damage, always crits on wet enemies.',      spCost:10, tier:'common',   effect:'lightning-bolt'   },
    { name:'Flame Shield',    icon:'🛡️', desc:'Surround yourself in fire — attackers take 10 fire damage per hit.',     spCost:11, tier:'common',   effect:'flame-shield'     },
    { name:'Frost Armor',     icon:'🧊', desc:'+6 DEF for 3 turns. Enemies who hit you slow down.',                     spCost:10, tier:'common',   effect:'frost-armor'      },
    { name:'Chain Lightning', icon:'⛈️', desc:'Lightning chains — hits enemy for 1.5x then bounces for 0.8x.',          spCost:14, tier:'rare',     effect:'chain-lightning'  },
    { name:'Meteor Shower',   icon:'🌠', desc:'Rain meteors — 3 hits of 0.8x damage each.',                             spCost:15, tier:'rare',     effect:'meteor-shower'    },
    { name:'Blizzard',        icon:'🌨️', desc:'Blizzard — enemy misses their next 2 attacks.',                          spCost:14, tier:'rare',     effect:'blizzard'         },
    { name:'Inferno',         icon:'🌋', desc:'Continuous fire damage — 15 per turn for 3 turns.',                       spCost:13, tier:'rare',     effect:'inferno'          },
    { name:'Storm Call',      icon:'🌩️', desc:'Call a storm — +40% damage to all attacks for 2 turns.',                 spCost:16, tier:'rare',     effect:'storm-call'       },
    { name:'Elemental Burst', icon:'💥', desc:'All elements at once — 3x damage, random elemental effect.',             spCost:20, tier:'legendary',effect:'elemental-burst'  },
    { name:'Absolute Zero',   icon:'🧊', desc:'Freeze enemy completely — they cannot act for 3 turns.',                  spCost:22, tier:'legendary',effect:'absolute-zero'    },
    { name:'Solar Flare',     icon:'☀️', desc:'Blind the enemy — they miss for 3 turns and take 2x damage.',            spCost:20, tier:'legendary',effect:'solar-flare'      },
    { name:'Thunderstrike',   icon:'⚡', desc:'Ultimate lightning — 4x damage, ignores all defense.',                   spCost:24, tier:'legendary',effect:'thunderstrike'    },
    { name:'Elemental Mastery',icon:'🔮',desc:'All elemental attacks deal double damage for rest of run.',               spCost:22, tier:'legendary',effect:'elemental-mastery'},
  ],
  VoidWalker: [
    { name:'Void Strike',     icon:'🌑', desc:'Strike from the void — 1.6x damage, ignores half of enemy defense.',     spCost:10, tier:'common',   effect:'void-strike'      },
    { name:'Phase',           icon:'👻', desc:'Phase through next attack — take zero damage.',                           spCost:9,  tier:'common',   effect:'phase'            },
    { name:'Void Pulse',      icon:'💜', desc:'Pulse of void energy — 1.4x damage, heals you for 10 HP.',               spCost:10, tier:'common',   effect:'void-pulse'       },
    { name:'Dark Step',       icon:'🌒', desc:'Step into darkness — next attack deals 2x damage from stealth.',         spCost:11, tier:'common',   effect:'dark-step'        },
    { name:'Null Field',      icon:'⚫', desc:'Nullify enemy — their defense drops to 0 for 2 turns.',                  spCost:10, tier:'common',   effect:'null-field'       },
    { name:'Void Drain',      icon:'🌀', desc:'Drain void energy — steal 8 SP from enemy, deal 1.2x damage.',           spCost:12, tier:'rare',     effect:'void-drain'       },
    { name:'Shadow Meld',     icon:'🌑', desc:'Meld with shadows — heal 20 HP and restore 10 SP.',                      spCost:14, tier:'rare',     effect:'shadow-meld'      },
    { name:'Void Rupture',    icon:'💥', desc:'Tear reality — 2.5x damage, enemy loses 5 ATK permanently.',             spCost:15, tier:'rare',     effect:'void-rupture'     },
    { name:'Entropy',         icon:'♾️', desc:'Entropy hits — each attack this turn deals 10% more than the last.',     spCost:13, tier:'rare',     effect:'entropy'          },
    { name:'Oblivion',        icon:'🕳️', desc:'Send enemy to oblivion briefly — skip their next 2 turns.',             spCost:16, tier:'rare',     effect:'oblivion'         },
    { name:'Void Collapse',   icon:'🌑', desc:'Collapse reality — 4x damage, takes 20% back as self damage.',           spCost:20, tier:'legendary',effect:'void-collapse'    },
    { name:'Phase Form',      icon:'👁️', desc:'Full phase — immune to all damage for 2 turns.',                        spCost:22, tier:'legendary',effect:'phase-form'       },
    { name:'Annihilation',    icon:'💀', desc:'Annihilate — deal damage equal to enemy missing HP.',                    spCost:20, tier:'legendary',effect:'annihilation'     },
    { name:'Void Mastery',    icon:'🌑', desc:'+3 ATK and +3 DEF permanently. Void empowers your every action.',        spCost:18, tier:'legendary',effect:'void-mastery'     },
    { name:'The Void',        icon:'⚫', desc:'Become the void — all attacks deal double for rest of run.',              spCost:25, tier:'legendary',effect:'the-void'         },
  ],
  ShadowMage: [
    { name:'Shadow Bolt',     icon:'🖤', desc:'Bolt of shadow — 1.5x damage, 25% chance to curse enemy.',               spCost:9,  tier:'common',   effect:'shadow-bolt'      },
    { name:'Darkness',        icon:'🌑', desc:'Plunge into darkness — enemy misses next attack.',                        spCost:8,  tier:'common',   effect:'darkness'         },
    { name:'Shadow Touch',    icon:'👆', desc:'Draining touch — deal 1.2x damage and steal 5 HP.',                      spCost:9,  tier:'common',   effect:'shadow-touch'     },
    { name:'Nightmare',       icon:'😱', desc:'Inflict nightmare — enemy attacks randomly, hitting itself 50% of time.', spCost:11, tier:'common',   effect:'nightmare'        },
    { name:'Shroud',          icon:'🌫️', desc:'Shroud yourself — reduce all incoming damage by 30% for 3 turns.',       spCost:10, tier:'common',   effect:'shroud'           },
    { name:'Soul Rend',       icon:'💔', desc:'Tear the soul — 2x damage, reduces enemy max HP by 10.',                 spCost:14, tier:'rare',     effect:'soul-rend'        },
    { name:'Shadow Clone',    icon:'👥', desc:'Create a shadow — your next attack copies for 60% damage.',               spCost:13, tier:'rare',     effect:'shadow-clone-sm'  },
    { name:'Dark Pact',       icon:'📜', desc:'Pact with darkness — +5 ATK permanently, -5 max HP.',                   spCost:12, tier:'rare',     effect:'dark-pact'        },
    { name:'Cursed Touch',    icon:'☠️', desc:'Curse the enemy — they take 15% more damage from all sources.',          spCost:14, tier:'rare',     effect:'cursed-touch'     },
    { name:'Shadow World',    icon:'🌑', desc:'Enter shadow world — immune to damage for 1 turn, attack twice after.',  spCost:16, tier:'rare',     effect:'shadow-world'     },
    { name:'Shadow Storm',    icon:'⛈️', desc:'Storm of shadows — 5 hits at 0.7x damage each.',                        spCost:20, tier:'legendary',effect:'shadow-storm'     },
    { name:'Dark Ascension',  icon:'👑', desc:'+10 ATK and +10 DEF from shadow energy. Ascend beyond limit.',           spCost:22, tier:'legendary',effect:'dark-ascension'   },
    { name:'Void Shadow',     icon:'🌑', desc:'Shadow meets void — 3.5x damage, enemy cursed for rest of combat.',      spCost:20, tier:'legendary',effect:'void-shadow'      },
    { name:'Night Terror',    icon:'😈', desc:'Ultimate fear — enemy attack drops to 0 for 3 turns.',                   spCost:22, tier:'legendary',effect:'night-terror'     },
    { name:'Shadow Mastery',  icon:'🖤', desc:'All shadow attacks deal triple damage for rest of run.',                  spCost:25, tier:'legendary',effect:'shadow-mastery'   },
  ],
  TimeMage: [
    { name:'Slow',            icon:'🐌', desc:'Slow time around enemy — their attack speed halved for 3 turns.',        spCost:9,  tier:'common',   effect:'slow'             },
    { name:'Haste',           icon:'⚡', desc:'Accelerate yourself — attack twice this turn.',                          spCost:10, tier:'common',   effect:'haste'            },
    { name:'Rewind',          icon:'↩️', desc:'Rewind the last hit — undo 15 damage taken this combat.',               spCost:11, tier:'common',   effect:'rewind'           },
    { name:'Time Skip',       icon:'⏭️', desc:'Skip ahead — enemy skips their next turn.',                             spCost:10, tier:'common',   effect:'time-skip'        },
    { name:'Temporal Sight',  icon:'👁️', desc:'See the future — preview enemy next attack and take 50% less damage.',  spCost:8,  tier:'common',   effect:'temporal-sight'   },
    { name:'Time Lock',       icon:'🔒', desc:'Lock the enemy in time — frozen for 2 turns, take 1.5x damage.',        spCost:14, tier:'rare',     effect:'time-lock'        },
    { name:'Chronostrike',    icon:'⏱️', desc:'Strike across time — hit twice, each at full damage.',                   spCost:15, tier:'rare',     effect:'chronostrike'     },
    { name:'Paradox',         icon:'🔄', desc:'Create a paradox — your next attack happens twice simultaneously.',      spCost:14, tier:'rare',     effect:'paradox'          },
    { name:'Age',             icon:'💀', desc:'Age the enemy — reduce their ATK and DEF by 5 permanently.',             spCost:13, tier:'rare',     effect:'age'              },
    { name:'Time Surge',      icon:'⚡', desc:'Surge through time — +4 ATK for 4 turns.',                               spCost:12, tier:'rare',     effect:'time-surge'       },
    { name:'Time Stop',       icon:'⏹️', desc:'Stop time completely — 2 free attacks, enemy cannot respond.',          spCost:20, tier:'legendary',effect:'time-stop-tm'     },
    { name:'Temporal Rift',   icon:'🌀', desc:'Rift in time — 3.5x damage, enemy sent back to start of combat.',        spCost:22, tier:'legendary',effect:'temporal-rift'    },
    { name:'Chrono Mastery',  icon:'⏰', desc:'You exist outside time — immune to all debuffs for rest of run.',         spCost:20, tier:'legendary',effect:'chrono-mastery'   },
    { name:'Rewrite',         icon:'✏️', desc:'Rewrite the fight — reset enemy HP to what it was 3 turns ago.',         spCost:24, tier:'legendary',effect:'rewrite'          },
    { name:'Eternity',        icon:'♾️', desc:'Enter eternity — all cooldowns reset, all SP restored.',                  spCost:25, tier:'legendary',effect:'eternity'         },
  ],
  Shaman: [
    { name:'Earthshake',      icon:'🌍', desc:'Shake the earth — 1.6x damage, 40% chance to stun for 1 turn.',         spCost:10, tier:'common',   effect:'earthshake-sk'    },
    { name:'Spirit Heal',     icon:'💚', desc:'Call on spirits — heal 25 HP.',                                          spCost:8,  tier:'common',   effect:'spirit-heal'      },
    { name:'Nature\'s Wrath', icon:'🌿', desc:'Wrath of nature — 1.4x damage, 30% chance to poison for 3 turns.',      spCost:9,  tier:'common',   effect:'natures-wrath'    },
    { name:'Stone Skin',      icon:'🪨', desc:'Skin of stone — +8 DEF for 3 turns.',                                   spCost:10, tier:'common',   effect:'stone-skin'       },
    { name:'Spirit Call',     icon:'👻', desc:'Call a spirit — deals 20 damage automatically this turn.',               spCost:9,  tier:'common',   effect:'spirit-call'      },
    { name:'Totemic Strike',  icon:'🪃', desc:'Strike with totem power — 2x damage, heals 10 HP.',                     spCost:13, tier:'rare',     effect:'totemic-strike'   },
    { name:'Earthquake',      icon:'🌋', desc:'Full earthquake — 2.5x damage, enemy stunned for 1 turn.',               spCost:15, tier:'rare',     effect:'earthquake'       },
    { name:'Ancestral Guard', icon:'🛡️', desc:'Ancestors protect — reduce all damage taken by 50% for 2 turns.',       spCost:14, tier:'rare',     effect:'ancestral-guard'  },
    { name:'Storm Totem',     icon:'⛈️', desc:'Totem deals 12 damage to enemy every turn for 3 turns.',                spCost:13, tier:'rare',     effect:'storm-totem'      },
    { name:'Earth Barrier',   icon:'🪨', desc:'Earthen wall — absorb up to 40 damage.',                                 spCost:14, tier:'rare',     effect:'earth-barrier'    },
    { name:'Volcano',         icon:'🌋', desc:'Summon a volcano — 4x damage, burns for 10 per turn for 3 turns.',       spCost:20, tier:'legendary',effect:'volcano'          },
    { name:'World Shatter',   icon:'💥', desc:'Shatter the world — 3.5x damage to all enemies this floor.',             spCost:22, tier:'legendary',effect:'world-shatter'    },
    { name:'Spirit Army',     icon:'👻', desc:'Army of spirits — 5 spirits each deal 15 damage this turn.',             spCost:20, tier:'legendary',effect:'spirit-army'      },
    { name:'Earth Mastery',   icon:'🌍', desc:'Earth obeys — all earth skills deal double. +5 DEF permanently.',        spCost:18, tier:'legendary',effect:'earth-mastery'    },
    { name:'Gaia\'s Wrath',   icon:'🌏', desc:'Gaia herself attacks — deals 5x damage. Once per run only.',             spCost:25, tier:'legendary',effect:'gaias-wrath'      },
  ],
  Arcanist: [
    { name:'Arcane Bolt',     icon:'✨', desc:'Pure arcane energy — 1.5x damage, ignores all elemental resistance.',   spCost:9,  tier:'common',   effect:'arcane-bolt'      },
    { name:'Mana Shield',     icon:'🔵', desc:'Shield of pure magic — absorb up to 25 damage.',                        spCost:8,  tier:'common',   effect:'mana-shield'      },
    { name:'Arcane Pulse',    icon:'💫', desc:'Pulse of arcane — 1.3x damage to enemy, restore 8 SP.',                 spCost:7,  tier:'common',   effect:'arcane-pulse'     },
    { name:'Spell Echo',      icon:'🔄', desc:'Echo the last skill used — cast it again for free.',                    spCost:10, tier:'common',   effect:'spell-echo'       },
    { name:'Arcane Eye',      icon:'👁️', desc:'See all — reveal enemy stats, weakness, and next move.',               spCost:6,  tier:'common',   effect:'arcane-eye'       },
    { name:'Arcane Storm',    icon:'⛈️', desc:'Storm of pure magic — 2x damage, 30% chance to stun.',                 spCost:13, tier:'rare',     effect:'arcane-storm'     },
    { name:'Spell Steal',     icon:'🧿', desc:'Steal arcane power — copy enemy ability for 1 turn.',                   spCost:14, tier:'rare',     effect:'spell-steal-arc'  },
    { name:'Arcane Surge',    icon:'💥', desc:'Surge of power — next spell costs 0 SP and deals +50% damage.',         spCost:12, tier:'rare',     effect:'arcane-surge'     },
    { name:'Mana Burn',       icon:'🔥', desc:'Burn enemy mana — deal damage equal to their SP.',                      spCost:13, tier:'rare',     effect:'mana-burn'        },
    { name:'Arcane Armor',    icon:'🛡️', desc:'+10 DEF from arcane protection for 3 turns.',                          spCost:12, tier:'rare',     effect:'arcane-armor'     },
    { name:'Pure Destruction',icon:'💀', desc:'Pure arcane destruction — 4x damage, no class modifiers needed.',       spCost:20, tier:'legendary',effect:'pure-destruction' },
    { name:'Arcane Singularity',icon:'🌑',desc:'Singularity — deal damage = enemy current HP divided by 2.',          spCost:22, tier:'legendary',effect:'arc-singularity'  },
    { name:'Spell Mastery',   icon:'🔮', desc:'All spells cost half SP and deal +40% damage for rest of run.',         spCost:20, tier:'legendary',effect:'spell-mastery'    },
    { name:'Arcane Overload', icon:'⚡', desc:'Overload — deal 5x damage, but lose 30 HP.',                            spCost:22, tier:'legendary',effect:'arcane-overload'  },
    { name:'Omnimancy',       icon:'✨', desc:'Master all magic — randomly cast any spell effect for free each turn.', spCost:25, tier:'legendary',effect:'omnimancy'        },
  ],
  DeathKnight: [
    { name:'Death Strike',    icon:'💀', desc:'Strike of death — 1.5x damage, heals 5 HP.',                            spCost:10, tier:'common',   effect:'death-strike'     },
    { name:'Bone Shield',     icon:'🦴', desc:'Shield of bones — +5 DEF for 3 turns.',                                 spCost:9,  tier:'common',   effect:'bone-shield'      },
    { name:'Death Grip',      icon:'🤚', desc:'Grip of death — enemy cannot flee or use skills for 1 turn.',           spCost:10, tier:'common',   effect:'death-grip'       },
    { name:'Plague',          icon:'🦠', desc:'Infect the enemy — 8 damage per turn for 4 turns.',                     spCost:9,  tier:'common',   effect:'plague'           },
    { name:'Unholy Ground',   icon:'☠️', desc:'Unholy ground — enemy takes 10 extra damage each turn they attack.',    spCost:10, tier:'common',   effect:'unholy-ground'    },
    { name:'Death Coil',      icon:'🌀', desc:'Coil of death — 2x damage or heal 25 HP. Your choice.',                spCost:14, tier:'rare',     effect:'death-coil'       },
    { name:'Army of Dead',    icon:'💀', desc:'Raise the dead — 3 undead attack for 12 each.',                         spCost:15, tier:'rare',     effect:'army-of-dead'     },
    { name:'Unholy Frenzy',   icon:'😤', desc:'+6 ATK for 3 turns. You also take 5 extra damage per hit.',             spCost:13, tier:'rare',     effect:'unholy-frenzy'    },
    { name:'Corpse Explosion', icon:'💥',desc:'Explode a fallen enemy — 2.5x damage to current enemy.',                spCost:14, tier:'rare',     effect:'corpse-explosion' },
    { name:'Death Pact',      icon:'⚔️', desc:'Pact with death — sacrifice 20 HP for +10 ATK permanently this run.',  spCost:12, tier:'rare',     effect:'death-pact'       },
    { name:'Apocalypse',      icon:'☢️', desc:'Apocalyptic strike — 4x damage, all enemies take 20 additional damage.',spCost:20,tier:'legendary',effect:'apocalypse'       },
    { name:'Lichform',        icon:'💀', desc:'Become a lich — immune to death once per run.',                         spCost:22, tier:'legendary',effect:'lichform'         },
    { name:'Soul Harvest',    icon:'🌀', desc:'Harvest all fallen souls — heal 50 HP.',                               spCost:18, tier:'legendary',effect:'soul-harvest-dk'  },
    { name:'Death and Decay', icon:'☠️', desc:'Decay everything — enemy loses 5 ATK and DEF each turn for 5 turns.',  spCost:20, tier:'legendary',effect:'death-and-decay'  },
    { name:'The Lich King',   icon:'👑', desc:'Become the Lich King — +15 ATK, +15 DEF, immune to debuffs.',          spCost:25, tier:'legendary',effect:'the-lich-king'    },
  ],
};




// XP needed per level
var XP_TABLE = [0, 100, 220, 380, 580, 820, 1100, 1430, 1810, 2240, 9999];
// XP given by enemy tier
var ENEMY_XP = { t1:15, t2:28, t3:45, boss:120 };

function getEnemyTier(enemyName) {
  var dungeon = DS.dungeon;
  var pool = dungeon === 'The Ashbound Wastes' ? ASH_ENEMIES
           : dungeon === 'Frosthold Abyss'     ? FROST_ENEMIES
           : ENEMIES;
  var t1names = pool.t1.map(function(e){return e.name;});
  var t2names = pool.t2.map(function(e){return e.name;});
  if (t1names.indexOf(enemyName) !== -1) return 't1';
  if (t2names.indexOf(enemyName) !== -1) return 't2';
  // Check boss pools
  var bossPool = pool.bossPool || [];
  for (var b = 0; b < bossPool.length; b++) {
    if (bossPool[b].name === enemyName) return 'boss';
  }
  return 't3';
}

// ── NEW RANDOM SKILL SYSTEM ──
// DS.unlockedSkills = array of skill effect strings unlocked this run
// DS.skillPool = remaining skills not yet offered

function initSkillPool() {
  var allSkills = CLASS_SKILLS[DS.cls] || [];
  DS.unlockedSkills = [];
  DS.skillPool = allSkills.map(function(s){ return s.effect; });
  // Shuffle pool
  for (var i = DS.skillPool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = DS.skillPool[i]; DS.skillPool[i] = DS.skillPool[j]; DS.skillPool[j] = tmp;
  }
  // Grant starting skill — remove from pool and add to unlocked
  var startingSkills = {"Warrior": "shield-bash", "Monk": "swift-strike", "Assassin": "backstab", "Paladin": "holy-strike", "Naturalist": "entangle", "Wizard": "arcane-bolt", "Ranger": "aimed-shot", "Necromancer": "raise-dead", "Sorcerer": "fireball", "Warlock": "eldritch-blast", "Sentinel": "sentinel-strike", "Dragonborn": "flame-breath"};
  var startSkill = startingSkills[DS.cls];
  // The Sorcerer's was Fireball (an Elementalist skill) and the Sentinel's a
  // skill that doesn't exist, and 12 classes had none: they all started with
  // no skill. Any class without a valid one now starts with its first.
  if ((!startSkill || DS.skillPool.indexOf(startSkill) === -1) && allSkills.length) startSkill = allSkills[0].effect;
  if (startSkill && DS.skillPool.indexOf(startSkill) !== -1) {
    DS.skillPool.splice(DS.skillPool.indexOf(startSkill), 1);
    DS.unlockedSkills.push(startSkill);
    var sk = getSkillByEffect(startSkill);
    if (sk) {
      addLog('✨ Starting skill unlocked: ' + sk.name + '!');
      say('Starting skill: ' + sk.name + '. ' + (sk.desc || ''));
    }
  }
}

function getUnlockedSkills() {
  var allSkills = CLASS_SKILLS[DS.cls] || [];
  if (!DS.unlockedSkills) return [];
  return allSkills.filter(function(s){ return DS.unlockedSkills.indexOf(s.effect) !== -1; });
}

function getSkillByEffect(effect) {
  var allSkills = CLASS_SKILLS[DS.cls] || [];
  return allSkills.find(function(s){ return s.effect === effect; });
}

function offerSkillChoices() {
  // Pick 3 random skills from pool, weighted by tier availability
  var allSkills = CLASS_SKILLS[DS.cls] || [];
  var pool = DS.skillPool || [];
  if (pool.length === 0) return null;

  // Get up to 3 candidates from pool
  var candidates = [];
  var poolCopy = pool.slice();

  // Weight by level: early levels prefer common, later prefer rare/legendary
  var preferLegendary = DS.level >= 7;
  var preferRare = DS.level >= 4;

  // Try to get one of each tier if possible
  var tiers = ['common', 'rare', 'legendary'];
  tiers.forEach(function(tier) {
    if (candidates.length >= 3) return;
    var tierSkills = poolCopy.filter(function(eff) {
      var sk = getSkillByEffect2(DS.cls, eff);
      return sk && sk.tier === tier;
    });
    if (tierSkills.length > 0) {
      var pick = tierSkills[Math.floor(Math.random() * tierSkills.length)];
      candidates.push(pick);
      poolCopy.splice(poolCopy.indexOf(pick), 1);
    }
  });

  // Fill remaining slots randomly
  while (candidates.length < 3 && poolCopy.length > 0) {
    var idx = Math.floor(Math.random() * poolCopy.length);
    candidates.push(poolCopy[idx]);
    poolCopy.splice(idx, 1);
  }

  return candidates;
}

function getSkillByEffect2(cls, effect) {
  var allSkills = CLASS_SKILLS[cls] || [];
  return allSkills.find(function(s){ return s.effect === effect; });
}

function showSkillChoice(candidates) {
  if (!candidates || candidates.length === 0) {
    closeLevelUp(); return;
  }
  var grid = document.getElementById('skill-choice-grid');
  grid.innerHTML = '';
  document.getElementById('skill-choice-sub').textContent =
    'Level ' + DS.level + ' reached. Choose one skill to unlock. The others are gone.';

  candidates.forEach(function(eff) {
    var sk = getSkillByEffect2(DS.cls, eff);
    if (!sk) return;
    var card = document.createElement('button');
    card.className = 'skill-choice-card ' + sk.tier;
    card.setAttribute('aria-label', sk.name + '. ' + sk.tier + '. ' + sk.desc + ' Costs ' + sk.spCost + ' SP.');
    card.innerHTML =
      '<div class="skill-choice-name">' + sk.icon + ' ' + sk.name +
      ' <span class="skill-tier-badge ' + sk.tier + '">' + sk.tier + '</span></div>' +
      '<div class="skill-choice-desc">' + sk.desc + '</div>' +
      '<div class="skill-choice-cost">Cost: ' + sk.spCost + ' SP</div>';
    (function(effect, skillName, skillDesc) {
      card.onclick = function() { pickSkill(effect, skillName, skillDesc, candidates); };
    })(eff, sk.name, sk.desc);
    grid.appendChild(card);
  });

  document.getElementById('skill-choice-overlay').classList.add('open');
  say('New skill available! Level ' + DS.level + '. Choose one of ' + candidates.length + ' skills. ' +
    candidates.map(function(e){ var s=getSkillByEffect2(DS.cls,e); return s?s.name:''; }).join(', ') + '.');
  setTimeout(function() {
    var first = grid.querySelector('.skill-choice-card');
    if (first) first.focus();
  }, 80);
}

function pickSkill(effect, name, desc, allCandidates) {
  // Add chosen skill to unlocked
  if (!DS.unlockedSkills) DS.unlockedSkills = [];
  DS.unlockedSkills.push(effect);

  // Remove ALL offered candidates from pool (not just chosen)
  allCandidates.forEach(function(eff) {
    var idx = DS.skillPool.indexOf(eff);
    if (idx !== -1) DS.skillPool.splice(idx, 1);
  });

  document.getElementById('skill-choice-overlay').classList.remove('open');
  updateSkillButtons();
  say('You unlocked: ' + name + '. ' + desc + ' Continuing your descent.');
  addRunLog('Unlocked skill: ' + name, 'good');
}



function updateSkillButtons() {
  var unlocked = getUnlockedSkills();
  // Show up to 5 skill buttons in dungeon combat
  for (var i = 0; i < 5; i++) {
    var btnId = 'cbtn-skill' + (i+1);
    var btn = document.getElementById(btnId);
    if (!btn) {
      // Create additional skill buttons if needed
      if (i >= 3) {
        var container = document.querySelector('.dg-combat-actions');
        if (container) {
          btn = document.createElement('button');
          btn.id = btnId;
          btn.className = 'dg-skill-btn';
          btn.setAttribute('onclick', 'useSkill(' + i + ')');
          btn.style.display = 'none';
          container.appendChild(btn);
        }
      }
      if (!btn) continue;
    }
    if (i < unlocked.length) {
      var sk = unlocked[i];
      var canAfford = DS.sp >= sk.spCost;
      btn.style.display = '';
      btn.textContent = sk.icon + ' ' + sk.name + ' (' + sk.spCost + 'SP)';
      btn.setAttribute('aria-label', sk.name + '. ' + sk.tier + ' skill. ' + sk.desc + ' Costs ' + sk.spCost + ' SP. You have ' + DS.sp + ' SP. ' + (canAfford ? 'Press to use.' : 'Not enough SP — need ' + (sk.spCost - DS.sp) + ' more.'));
      btn.disabled = !canAfford || !DS.inCombat;
    } else {
      btn.style.display = 'none';
    }
  }
}

// Helper — call at end of buff/utility skills in multi-combat to trigger enemy turns
// Every class skill's spec (the Swift version's SkillTable).
var SKILL_SPECS = {
  'Warrior/shield-bash': {"dmg":0.9,"hits":1,"fight":[0,3]},
  'Warrior/war-cry': {"dmg":2.0,"hits":1},
  'Warrior/iron-stance': {"buff":[0,4,2]},
  'Warrior/taunt': {"soften":[0.5,1]},
  'Warrior/weapon-throw': {"dmg":1.2,"hits":1},
  'Warrior/last-stand': {"dmg":1.0,"hits":1,"lowHp":[0.3,3.0]},
  'Warrior/battle-hardened': {"free":1,"perm":[0,0,3,0]},
  'Warrior/overwhelm': {"dmg":0.8,"hits":2},
  'Warrior/fortify': {"reduce":[0.35,3]},
  'Warrior/execute': {"dmg":1.0,"hits":1,"execute":[0.25,3.0]},
  'Warrior/unstoppable': {"unstoppable":2},
  'Warrior/warlord': {"warlord":1},
  'Warrior/titan-smash': {"dmg":4.0,"hits":1,"selfDmg":15},
  'Warrior/battlecry': {"special":"battlecry"},
  'Warrior/indomitable': {"healPct":1,"once":1},
  'Monk/swift-strike': {"dmg":1.0,"hits":2},
  'Monk/inner-focus': {"free":1,"heal":15,"sp":10},
  'Monk/wind-step': {"free":1,"dodge":1},
  'Monk/ki-pulse': {"dmg":1.5,"hits":1},
  'Monk/meditate': {"free":1,"sp":8,"heal":10},
  'Monk/pressure-point': {"special":"pressure-point"},
  'Monk/iron-body': {"perm":[0,5,0,0]},
  'Monk/thousand-cuts': {"dmg":0.5,"hits":4},
  'Monk/spirit-shield': {"free":1,"shield":30},
  'Monk/zen-strike': {"free":1,"empower":[1.5,3]},
  'Monk/transcendence': {"empower":[2.0,2]},
  'Monk/soul-surge': {"dmg":3.5,"hits":1},
  'Monk/one-with-all': {"free":1,"spFull":1,"heal":25},
  'Monk/iron-fist': {"dmg":2.5,"hits":1},
  'Monk/enlightenment': {"free":1,"perm":[0,0,0,10]},
  'Assassin/backstab': {"dmg":3.0,"hits":1,"miss":0.35},
  'Assassin/smoke-bomb': {"free":1,"escape":1},
  'Assassin/poison-blade': {"dmg":1.0,"hits":1,"dot":[8,3,1]},
  'Assassin/shadowstep': {"free":1,"empower":[1.5,1]},
  'Assassin/cheap-shot': {"dmg":0.8,"hits":1,"stun":[1,1]},
  'Assassin/marked-kill': {"free":1,"markCrit":1},
  'Assassin/shadow-clone': {"dmg":2.0,"hits":1},
  'Assassin/death-mark': {"free":1,"vuln":[0.5,3,1]},
  'Assassin/serrated-blade': {"dmg":1.0,"hits":1,"dot":[5,4,1]},
  'Assassin/ambush': {"dmg":1.0,"hits":1,"ambush":[0.75,2.0]},
  'Assassin/assassinate': {"dmg":1.0,"hits":1,"killBelow":0.2},
  'Assassin/shadow-form': {"free":1,"dodge":2},
  'Assassin/fan-of-knives': {"dmg":0.6,"hits":5},
  'Assassin/lethal-tempo': {"special":"lethal-tempo"},
  'Assassin/death-sentence': {"pctMax":0.4},
  'Paladin/holy-strike': {"dmg":1.0,"hits":1,"heal":20},
  'Paladin/divine-shield': {"free":1,"dodge":1},
  'Paladin/consecrate': {"free":1,"reduce":[0.2,3]},
  'Paladin/lay-on-hands': {"free":1,"heal":35},
  'Paladin/holy-light': {"free":1,"soften":[0.5,2]},
  'Paladin/smite': {"dmg":2.5,"hits":1},
  'Paladin/aura-of-faith': {"free":1,"regen":[5,99]},
  'Paladin/sacred-blade': {"free":1,"empower":[2.0,3]},
  'Paladin/holy-nova': {"dmg":1.5,"hits":1,"lifesteal":0.5},
  'Paladin/judgment': {"special":"judgment"},
  'Paladin/resurrection': {"free":1,"resurrect":1},
  'Paladin/archangel': {"special":"archangel"},
  'Paladin/divine-wrath': {"dmg":5.0,"hits":1,"drainSP":1},
  'Paladin/sanctuary': {"free":1,"cap":[10,3]},
  'Paladin/holy-crusade': {"free":1,"crusade":[15,99]},
  'Naturalist/entangle': {"dmg":0.5,"hits":1,"stun":[1,1]},
  'Naturalist/venom': {"free":1,"dot":[8,3,1]},
  'Naturalist/pack-bond': {"dmg":1.3,"hits":1},
  'Naturalist/nature-mend': {"free":1,"heal":20},
  'Naturalist/camouflage': {"free":1,"enemyMiss":0.4},
  'Naturalist/call-wild': {"dmg":2.0,"hits":1},
  'Naturalist/thorns': {"free":1,"thorns":[0.3,99]},
  'Naturalist/plague': {"free":1,"dot":[10,4,1]},
  'Naturalist/predator': {"dmg":2.5,"hits":1},
  'Naturalist/swarm': {"dmg":1.0,"hits":1,"stun":[1,1]},
  'Naturalist/ancient-grove': {"dmg":2.0,"hits":1,"heal":40},
  'Naturalist/apex-predator': {"dmg":4.0,"hits":1},
  'Naturalist/plague-lord': {"free":1,"dot":[20,5,1]},
  'Naturalist/nature-wrath': {"dmg":3.0,"hits":1},
  'Naturalist/one-nature': {"free":1,"healPct":1},
  'Sorcerer/arcane-bolt': {"dmg":1.8,"hits":1},
  'Sorcerer/mana-shield': {"free":1,"shield":25},
  'Sorcerer/frost-bolt': {"dmg":1.0,"hits":1,"soften":[0.7,1]},
  'Sorcerer/arcane-surge': {"dmg":1.6,"hits":1,"selfDmg":5},
  'Sorcerer/mana-tap': {"free":1,"sp":12},
  'Sorcerer/obliterate': {"special":"obliterate"},
  'Sorcerer/chain-lightning': {"dmg":1.5,"hits":1,"stun":[1,1]},
  'Sorcerer/arcane-armor': {"free":1,"shield":40},
  'Sorcerer/gravity-well': {"free":1,"soften":[0.85,3]},
  'Sorcerer/spell-weave': {"dmg":1.3,"hits":2},
  'Sorcerer/singularity': {"pctMax":0.5},
  'Sorcerer/time-stop': {"dmg":1.0,"hits":3,"stun":[1,1]},
  'Sorcerer/void-blast': {"dmg":5.0,"hits":1,"selfDmg":20},
  'Sorcerer/arcane-nova': {"dmg":3.0,"hits":1},
  'Sorcerer/unlimited-power': {"free":1,"freeSkills":3},
  'Necromancer/death-touch': {"dmg":1.4,"hits":1,"sp":5},
  'Necromancer/raise-dead': {"dmg":0.8,"hits":1},
  'Necromancer/life-drain': {"dmg":1.2,"hits":1,"lifesteal":0.5},
  'Necromancer/bone-shield': {"free":1,"shield":20},
  'Necromancer/curse': {"free":1,"vuln":[0.15,3,1]},
  'Necromancer/soul-harvest': {"dmg":1.8,"hits":1,"sp":8},
  'Necromancer/corpse-explosion': {"pctMax":0.35},
  'Necromancer/undying': {"free":1,"unstoppable":1},
  'Necromancer/necrotic-bolt': {"dmg":1.6,"hits":1},
  'Necromancer/plague-carrier': {"free":1,"dot":[12,4,1]},
  'Necromancer/army-of-dead': {"dmg":0.7,"hits":4},
  'Necromancer/death-pact': {"dmg":5.0,"hits":1,"selfDmg":30},
  'Necromancer/soul-storm': {"dmg":3.0,"hits":1},
  'Necromancer/lich-form': {"special":"lich-form"},
  'Necromancer/death-coil': {"dmg":2.0,"hits":1,"heal":25},
  'Berserker/reckless-strike': {"dmg":1.6,"hits":1,"selfDmg":5},
  'Berserker/rage': {"free":1,"buff":[4,0,3]},
  'Berserker/war-stomp': {"dmg":0.8,"hits":1,"stun":[1,1]},
  'Berserker/blood-frenzy': {"special":"blood-frenzy"},
  'Berserker/headbutt': {"dmg":1.4,"hits":1,"weaken":0.8},
  'Berserker/rampage': {"dmg":1.5,"hits":2},
  'Berserker/undying-rage': {"dmg":1.0,"hits":1,"lowHp":[0.3,3.0]},
  'Berserker/savage-blow': {"dmg":2.5,"hits":1},
  'Berserker/berserker-cry': {"free":1,"soften":[0.7,2]},
  'Berserker/relentless': {"dmg":1.3,"hits":1},
  'Berserker/wrath-incarnate': {"special":"wrath-incarnate"},
  'Berserker/death-wish': {"special":"death-wish"},
  'Berserker/berserker-god': {"special":"berserker-god"},
  'Berserker/endless-rage': {"free":1,"empower":[2.0,3]},
  'Berserker/final-blow': {"dmg":6.0,"hits":1,"drainSP":1},
  'Bard/battle-hymn': {"dmg":1.5,"hits":1},
  'Bard/dissonance': {"free":1,"fight":[0,3],"weaken":0.85},
  'Bard/soothing-melody': {"free":1,"heal":18},
  'Bard/taunt-song': {"free":1,"enemyMiss":0.25},
  'Bard/rhythmic-strike': {"dmg":1.2,"hits":1,"sp":5},
  'Bard/war-ballad': {"free":1,"empower":[2.0,2]},
  'Bard/lullaby': {"stun":[1,1]},
  'Bard/discord': {"special":"discord"},
  'Bard/heroic-verse': {"free":1,"perm":[0,0,5,0]},
  'Bard/anthem': {"free":1,"heal":15,"sp":10},
  'Bard/song-of-doom': {"free":1,"empower":[3.0,2]},
  'Bard/requiem': {"pctMax":0.45},
  'Bard/epic-tale': {"special":"epic-tale"},
  'Bard/maestro': {"free":1,"freeSkills":3},
  'Bard/grand-finale': {"dmg":5.0,"hits":1},
  'Alchemist/acid-flask': {"dmg":1.4,"hits":1,"weaken":0.85},
  'Alchemist/healing-brew': {"free":1,"heal":25},
  'Alchemist/smoke-grenade': {"free":1,"enemyMiss":0.35},
  'Alchemist/transmute': {"special":"transmute"},
  'Alchemist/sticky-bomb': {"special":"sticky-bomb"},
  'Alchemist/explosive-flask': {"dmg":2.0,"hits":1},
  'Alchemist/philosopher-stone': {"special":"philosopher-stone"},
  'Alchemist/elixir-of-rage': {"dmg":3.0,"hits":1,"selfDmg":10},
  'Alchemist/corrosion': {"free":1,"weaken":0.5},
  'Alchemist/chain-reaction': {"dmg":1.2,"hits":3},
  'Alchemist/nova-bomb': {"pctMax":0.6},
  'Alchemist/grand-transmute': {"dmg":4.0,"hits":1},
  'Alchemist/immortality-serum': {"free":1,"unstoppable":2},
  'Alchemist/plague-bomb': {"free":1,"dot":[15,6,1]},
  'Alchemist/unstable-formula': {"special":"unstable-formula"},
  'BloodKnight/blood-strike': {"dmg":2.0,"hits":1,"selfDmg":8},
  'BloodKnight/crimson-slash': {"dmg":1.4,"hits":1,"heal":5},
  'BloodKnight/life-tap': {"special":"life-tap"},
  'BloodKnight/blood-bath': {"free":1,"fight":[3,0]},
  'BloodKnight/hemorrhage': {"dmg":1.0,"hits":1,"dot":[8,3,1]},
  'BloodKnight/sanguine-fury': {"dmg":3.0,"hits":1,"selfDmg":20},
  'BloodKnight/blood-armor': {"free":1,"shield":35},
  'BloodKnight/crimson-nova': {"dmg":2.0,"hits":1},
  'BloodKnight/vein-tap': {"special":"vein-tap"},
  'BloodKnight/exsanguinate': {"dmg":1.8,"hits":1,"dot":[8,3,1]},
  'BloodKnight/blood-god': {"dmg":5.0,"hits":1,"lifesteal":0.5},
  'BloodKnight/crimson-storm': {"dmg":0.8,"hits":5},
  'BloodKnight/exanguination': {"pctMax":0.35},
  'BloodKnight/blood-pact': {"dmg":6.0,"hits":1,"selfDmg":40},
  'BloodKnight/immortal-blood': {"free":1,"regen":[10,4]},
  'Druid/nature-bolt': {"dmg":1.3,"hits":1},
  'Druid/regrowth': {"free":1,"heal":20},
  'Druid/thorn-whip': {"dmg":1.4,"hits":1,"weaken":0.85},
  'Druid/beast-form': {"free":1,"buff":[4,2,2]},
  'Druid/rejuvenate': {"free":1,"sp":8,"heal":12},
  'Druid/moonfire': {"dmg":2.0,"hits":1},
  'Druid/spirit-form': {"free":1,"heal":30,"dodge":1},
  'Druid/barkskin': {"free":1,"reduce":[0.4,2]},
  'Druid/sunfire': {"dmg":1.8,"hits":1,"dot":[8,3,1]},
  'Druid/wild-growth': {"free":1,"regen":[10,3]},
  'Druid/avatar-nature': {"special":"avatar-nature"},
  'Druid/ancient-wrath': {"dmg":4.0,"hits":1},
  'Druid/balance': {"free":1,"healPct":1,"spFull":1},
  'Druid/stormcall': {"dmg":3.0,"hits":1,"stun":[1,1]},
  'Druid/verdant-tide': {"dmg":2.5,"hits":1,"heal":20},
  'Warlock/dark-pact': {"dmg":1.5,"hits":1,"selfDmg":10},
  'Warlock/soul-rend': {"dmg":1.4,"hits":1,"heal":8},
  'Warlock/hex': {"free":1,"vuln":[0.5,2,1]},
  'Warlock/void-grasp': {"dmg":1.3,"hits":1,"weaken":0.8},
  'Warlock/life-leech': {"dmg":1.2,"hits":1,"lifesteal":0.5},
  'Warlock/shadow-bolt': {"dmg":2.0,"hits":1},
  'Warlock/demonic-surge': {"dmg":1.8,"hits":1,"fight":[3,0]},
  'Warlock/soul-cage': {"stun":[1,1]},
  'Warlock/eldritch-blast': {"dmg":2.5,"hits":1},
  'Warlock/pact-of-blood': {"dmg":3.0,"hits":1,"selfDmg":25},
  'Warlock/void-collapse': {"dmg":4.0,"hits":1},
  'Warlock/warlock-soul-storm': {"special":"soul-storm"},
  'Warlock/elder-invocation': {"special":"elder-invocation"},
  'Warlock/oblivion': {"pctMax":0.7},
  'Warlock/final-pact': {"special":"final-pact"},
  'DeathKnight/death-strike': {"dmg":1.5,"hits":1,"heal":5},
  'DeathKnight/bone-shield': {"free":1,"buff":[0,5,3]},
  'DeathKnight/death-grip': {"dmg":1.2,"hits":1,"weaken":0.7},
  'DeathKnight/plague': {"free":1,"dot":[8,4,1]},
  'DeathKnight/unholy-ground': {"free":1,"dot":[10,5,1]},
  'DeathKnight/death-coil': {"dmg":2.0,"hits":1,"heal":25},
  'DeathKnight/army-of-dead': {"flat":36},
  'DeathKnight/unholy-frenzy': {"free":1,"buff":[6,0,3]},
  'DeathKnight/corpse-explosion': {"dmg":2.5,"hits":1},
  'DeathKnight/death-pact': {"free":1,"selfDmg":20,"perm":[10,0,0,0]},
  'DeathKnight/apocalypse': {"dmg":4.0,"hits":1,"flat":20},
  'DeathKnight/lichform': {"free":1,"resurrect":1},
  'DeathKnight/soul-harvest-dk': {"free":1,"heal":50},
  'DeathKnight/death-and-decay': {"free":1,"decay":[5,5]},
  'DeathKnight/the-lich-king': {"free":1,"fight":[15,15],"debuffImmune":1},
  'Ranger/aimed-shot': {"dmg":1.6,"hits":1},
  'Ranger/rapid-fire': {"dmg":0.9,"hits":2},
  'Ranger/mark-kill': {"free":1,"empower":[2.0,1]},
  'Ranger/shadow-step': {"free":1,"escape":1},
  'Ranger/venom-strike': {"dmg":1.0,"hits":1,"dot":[5,3,1]},
  'Ranger/eagle-eye': {"free":1,"empower":[1.5,2]},
  'Ranger/wing-gust': {"dmg":0.5,"hits":1,"stun":[1,1]},
  'Ranger/dragon-rush': {"dmg":0.8,"hits":3},
  'Ranger/draconic-surge': {"free":1,"empower":[1.5,2]},
  'Ranger/fire-breath': {"dmg":1.5,"hits":1},
  'Ranger/dragonstrike': {"special":"killshot"},
  'Ranger/apocalyptic-fire': {"dmg":5.0,"hits":1},
  'Ranger/world-ender': {"pctMax":0.6},
  'Ranger/true-dragon-form': {"free":1,"empower":[3.0,1],"markCrit":1},
  'Sentinel/scale-shield': {"free":1,"dodge":1},
  'Sentinel/taunt': {"free":1,"reduce":[0.2,2]},
  'Sentinel/fortify': {"free":1,"reduce":[0.4,2]},
  'Sentinel/molten-scales': {"free":1,"thorns":[0.3,1]},
  'Sentinel/dragon-fear': {"free":1,"soften":[0.5,2]},
  'Sentinel/barkskin': {"free":1,"buff":[0,8,3]},
  'Sentinel/retribution': {"special":"retribution"},
  'Sentinel/dk-undying': {"free":1,"unstoppable":1},
  'Sentinel/death-nova': {"dmg":2.0,"hits":1},
  'Sentinel/sanctuary': {"free":1,"cap":[10,3]},
  'Sentinel/apocalypse': {"dmg":1.0,"hits":1,"lowHp":[0.25,3.0]},
  'Sentinel/dark-ascension': {"dmg":4.0,"hits":1},
  'Sentinel/eternal-darkness': {"free":1,"dodge":3},
  'Sentinel/death-decay': {"special":"colossus"},
  'Cleric/cleric-holy-light': {"free":1,"heal":25},
  'Cleric/sacred-strike': {"dmg":1.3,"hits":1},
  'Cleric/bless': {"free":1,"fight":[2,3]},
  'Cleric/cleric-smite': {"dmg":1.5,"hits":1},
  'Cleric/prayer': {"free":1,"sp":8,"heal":12},
  'Cleric/divine-barrier': {"free":1,"shield":40},
  'Cleric/consecrate-ground': {"free":1,"reduce":[0.3,3]},
  'Cleric/holy-word': {"dmg":2.0,"hits":1,"stun":[1,1]},
  'Cleric/mass-heal': {"free":1,"heal":45},
  'Cleric/angel-guard': {"free":1,"cap":[8,3]},
  'Cleric/miracle': {"free":1,"healPct":1},
  'Cleric/cleric-crusade': {"free":1,"crusade":[20,3]},
  'Cleric/divine-judgment': {"special":"judgment"},
  'Cleric/cleric-resurrection': {"free":1,"resurrect":1},
  'Cleric/wrath-of-god': {"dmg":5.0,"hits":1,"drainSP":1},
  'Wizard/arcane-bolt': {"dmg":1.4,"hits":1},
  'Wizard/arcane-study': {"free":1,"reveal":1},
  'Wizard/mana-shield': {"free":1,"shield":35},
  'Wizard/spell-surge': {"free":1,"freeSkills":1},
  'Wizard/frost-nova': {"stun":[1,1]},
  'Wizard/arcane-missiles': {"dmg":0.6,"hits":3},
  'Wizard/time-warp': {"dmg":1.0,"hits":2},
  'Wizard/polymorph': {"free":1,"soften":[0.5,3]},
  'Wizard/mana-drain': {"free":1,"sp":20},
  'Wizard/arcane-explosion': {"dmg":2.5,"hits":1},
  'Wizard/spellsteal': {"free":1,"perm":[5,0,0,0]},
  'Wizard/arcane-singularity': {"pctHp":0.5},
  'Wizard/time-stop': {"stun":[2,1]},
  'Wizard/meteor': {"dmg":4.0,"hits":1,"killBelow":0.3},
  'Wizard/arcane-mastery': {"free":1,"mastery":[0.5,0,0]},
  'Elementalist/fireball': {"dmg":1.8,"hits":1,"dot":[6,3,0.2]},
  'Elementalist/ice-shard': {"dmg":1.0,"hits":1,"soften":[0.7,1]},
  'Elementalist/lightning-bolt': {"dmg":1.5,"hits":1},
  'Elementalist/flame-shield': {"free":1,"retaliate":10},
  'Elementalist/frost-armor': {"free":1,"buff":[0,6,3]},
  'Elementalist/chain-lightning': {"dmg":2.3,"hits":1},
  'Elementalist/meteor-shower': {"dmg":0.8,"hits":3},
  'Elementalist/blizzard': {"free":1,"dodge":2},
  'Elementalist/inferno': {"free":1,"dot":[15,3,1]},
  'Elementalist/storm-call': {"free":1,"empower":[1.4,2]},
  'Elementalist/elemental-burst': {"special":"elemental-burst"},
  'Elementalist/absolute-zero': {"stun":[3,1]},
  'Elementalist/solar-flare': {"free":1,"dodge":3,"vuln":[1.0,3,1]},
  'Elementalist/thunderstrike': {"dmg":4.0,"hits":1},
  'Elementalist/elemental-mastery': {"free":1,"mastery":[1.0,0,0]},
  'VoidWalker/void-strike': {"dmg":1.6,"hits":1},
  'VoidWalker/phase': {"free":1,"dodge":1},
  'VoidWalker/void-pulse': {"dmg":1.4,"hits":1,"heal":10},
  'VoidWalker/dark-step': {"free":1,"empower":[2.0,1]},
  'VoidWalker/null-field': {"free":1,"vuln":[0.25,2,1]},
  'VoidWalker/void-drain': {"dmg":1.2,"hits":1,"sp":8},
  'VoidWalker/shadow-meld': {"free":1,"heal":20,"sp":10},
  'VoidWalker/void-rupture': {"dmg":2.5,"hits":1,"weakenBy":5},
  'VoidWalker/entropy': {"dmg":0.9,"hits":3},
  'VoidWalker/oblivion': {"stun":[2,1]},
  'VoidWalker/void-collapse': {"dmg":4.0,"hits":1,"recoil":0.2},
  'VoidWalker/phase-form': {"free":1,"dodge":2},
  'VoidWalker/annihilation': {"missing":1.0},
  'VoidWalker/void-mastery': {"free":1,"perm":[3,3,0,0]},
  'VoidWalker/the-void': {"free":1,"mastery":[0,1.0,0]},
  'ShadowMage/shadow-bolt': {"dmg":1.5,"hits":1,"vuln":[0.15,3,0.25]},
  'ShadowMage/darkness': {"free":1,"dodge":1},
  'ShadowMage/shadow-touch': {"dmg":1.2,"hits":1,"heal":5},
  'ShadowMage/nightmare': {"free":1,"confuse":[0.5,2]},
  'ShadowMage/shroud': {"free":1,"reduce":[0.3,3]},
  'ShadowMage/soul-rend': {"dmg":2.0,"hits":1,"shrink":10},
  'ShadowMage/shadow-clone-sm': {"free":1,"empower":[1.6,1]},
  'ShadowMage/dark-pact': {"free":1,"perm":[5,0,-5,0]},
  'ShadowMage/cursed-touch': {"free":1,"vuln":[0.15,99,1]},
  'ShadowMage/shadow-world': {"free":1,"dodge":1,"empower":[2.0,1]},
  'ShadowMage/shadow-storm': {"dmg":0.7,"hits":5},
  'ShadowMage/dark-ascension': {"free":1,"fight":[10,10]},
  'ShadowMage/void-shadow': {"dmg":3.5,"hits":1,"vuln":[0.15,99,1]},
  'ShadowMage/night-terror': {"free":1,"dodge":3},
  'ShadowMage/shadow-mastery': {"free":1,"mastery":[2.0,0,0]},
  'TimeMage/slow': {"free":1,"soften":[0.5,3]},
  'TimeMage/haste': {"dmg":1.0,"hits":2},
  'TimeMage/rewind': {"special":"rewind"},
  'TimeMage/time-skip': {"stun":[1,1]},
  'TimeMage/temporal-sight': {"free":1,"reduce":[0.5,1]},
  'TimeMage/time-lock': {"stun":[2,1],"vuln":[0.5,2,1]},
  'TimeMage/chronostrike': {"dmg":1.0,"hits":2},
  'TimeMage/paradox': {"free":1,"empower":[2.0,1]},
  'TimeMage/age': {"free":1,"weakenBy":5},
  'TimeMage/time-surge': {"free":1,"buff":[4,0,4]},
  'TimeMage/time-stop-tm': {"dmg":1.0,"hits":2,"stun":[1,1]},
  'TimeMage/temporal-rift': {"dmg":3.5,"hits":1},
  'TimeMage/chrono-mastery': {"free":1,"debuffImmune":1},
  'TimeMage/rewrite': {"special":"rewrite"},
  'TimeMage/eternity': {"free":1,"spFull":1},
  'Shaman/earthshake-sk': {"dmg":1.6,"hits":1,"stun":[1,0.4]},
  'Shaman/spirit-heal': {"free":1,"heal":25},
  'Shaman/natures-wrath': {"dmg":1.4,"hits":1,"dot":[8,3,0.3]},
  'Shaman/stone-skin': {"free":1,"buff":[0,8,3]},
  'Shaman/spirit-call': {"flat":20},
  'Shaman/totemic-strike': {"dmg":2.0,"hits":1,"heal":10},
  'Shaman/earthquake': {"dmg":2.5,"hits":1,"stun":[1,1]},
  'Shaman/ancestral-guard': {"free":1,"reduce":[0.5,2]},
  'Shaman/storm-totem': {"free":1,"dot":[12,3,1]},
  'Shaman/earth-barrier': {"free":1,"shield":40},
  'Shaman/volcano': {"dmg":4.0,"hits":1,"dot":[10,3,1]},
  'Shaman/world-shatter': {"dmg":3.5,"hits":1},
  'Shaman/spirit-army': {"flat":75},
  'Shaman/earth-mastery': {"free":1,"perm":[0,5,0,0],"mastery":[1.0,0,0]},
  'Shaman/gaias-wrath': {"dmg":5.0,"hits":1,"once":1},
  'Arcanist/arcane-bolt': {"dmg":1.5,"hits":1},
  'Arcanist/mana-shield': {"free":1,"shield":25},
  'Arcanist/arcane-pulse': {"dmg":1.3,"hits":1,"sp":8},
  'Arcanist/spell-echo': {"special":"spell-echo"},
  'Arcanist/arcane-eye': {"free":1,"reveal":1},
  'Arcanist/arcane-storm': {"dmg":2.0,"hits":1,"stun":[1,0.3]},
  'Arcanist/spell-steal-arc': {"special":"spell-steal"},
  'Arcanist/arcane-surge': {"free":1,"freeSkills":1,"empower":[1.5,1]},
  'Arcanist/mana-burn': {"special":"mana-burn"},
  'Arcanist/arcane-armor': {"free":1,"buff":[0,10,3]},
  'Arcanist/pure-destruction': {"dmg":4.0,"hits":1},
  'Arcanist/arc-singularity': {"pctHp":0.5},
  'Arcanist/spell-mastery': {"free":1,"mastery":[0.4,0,1]},
  'Arcanist/arcane-overload': {"dmg":5.0,"hits":1,"selfDmg":30},
  'Arcanist/omnimancy': {"special":"omnimancy"},
};

// ── SKILL EFFECTS ENGINE (v11.7.3) ──
// Every class skill now runs from its spec in SKILL_SPECS, the same numbers the
// Swift version uses, so each one does what its description says:
//  - 105 skills had no handler at all: they cost SP, did nothing and gave the
//    enemy a free hit.
//  - "This combat" and "for N turns" buffs were added for the rest of the run
//    and stacked without limit.
//  - Classes that share an effect name (Bone Shield, Taunt, Arcane Bolt …) all
//    ran the same code, whatever their own description said.
// DS._fx holds this fight's timed effects and is cleared when a fight starts or ends.
function fxReset() {
  // The Shapeshifter's Mask copies an ability for this combat only (it lasted forever)
  DS._maskImmune = false; DS._maskCorrupt = false; DS._maskRevive = false; DS._maskGrow = false; DS._maskGrowBonus = 0;
  DS._maskDodge = false; DS._maskWeb = false; DS._maskReflect = false; DS._maskLurker = false; DS._maskMimic = false;
  DS._maskCommand = false; DS._maskSpirit = false; DS._maskFear = false;
  var f = DS._fx;
  if (f) {
    // Undo stat changes that only last for the fight.
    DS.atkBonus -= (f.fightAtk || 0) + (f.buffTurns > 0 ? (f.buffAtk || 0) : 0);
    DS.defBonus -= (f.fightDef || 0) + (f.buffTurns > 0 ? (f.buffDef || 0) : 0);
    if (f.fightCrit) DS.critBonus = (DS.critBonus || 0) - f.fightCrit;
    if (f.fightFlee) DS.fleeBonus = (DS.fleeBonus || 0) - f.fightFlee;
    if (f.fightLuck) DS.luckBonus = (DS.luckBonus || 0) - f.fightLuck;
  }
  DS._fx = { stun: 0, dodge: 0, soften: 1, softenHits: 0, reduce: 0, reduceTurns: 0,
    empower: 1, empowerCount: 0, vuln: 0, vulnTurns: 0, dot: 0, dotTurns: 0,
    buffAtk: 0, buffDef: 0, buffTurns: 0, fightAtk: 0, fightDef: 0, retaliate: 0,
    confuse: 0, confuseTurns: 0, decay: 0, decayTurns: 0, damageTaken: 0, recentHits: [],
    enemyMiss: 0, cap: 0, capTurns: 0, unstoppable: 0, regen: 0, regenTurns: 0, thorns: 0, thornsTurns: 0,
    crusade: 0, crusadeTurns: 0, warlord: false, stickyBomb: 0, lethalTempo: 0 };
}
function fxGet() { if (!DS._fx) fxReset(); return DS._fx; }

// Attack and defense potions that last a few turns (counted on enemy turns).
function fxTempStat(kind, amt, turns) {
  var key = kind === 'atk' ? '_tempAtk' : '_tempDef';
  var cur = DS[key];
  if (cur && cur.turns > 0) { if (kind === 'atk') DS.atkBonus -= cur.n; else DS.defBonus -= cur.n; }
  DS[key] = { n: amt, turns: turns };
  if (kind === 'atk') DS.atkBonus += amt; else DS.defBonus += amt;
}
function fxTickTemp() {
  ['_tempAtk', '_tempDef'].forEach(function(key) {
    var t = DS[key];
    if (!t || t.turns <= 0) return;
    t.turns--;
    if (t.turns === 0) {
      if (key === '_tempAtk') DS.atkBonus -= t.n; else DS.defBonus -= t.n;
      addLog(key === '_tempAtk' ? 'Your attack boost wears off.' : 'Your defense boost wears off.');
    }
  });
}
// The Poison Dart (and other trap poison, and burns) promised damage every turn but never ticked.
function fxTickTrapPoison() {
  var p = DS.trapDoT;
  if (!p || !(p.turns > 0) || DS.hp <= 0) return;
  p.turns--;
  DS.hp = Math.max(1, DS.hp - p.dmg);
  addLog('☠️ ' + p.name + ' — ' + p.dmg + ' damage. (' + p.turns + ' turns left)');
  updatePlayerBar();
  if (p.turns <= 0) DS.trapDoT = null;
}
function fxFightBonus(kind) {
  var f = DS._fx;
  if (!f) return 0;
  return kind === 'atk' ? (f.fightAtk || 0) + (f.buffTurns > 0 ? (f.buffAtk || 0) : 0)
                        : (f.fightDef || 0) + (f.buffTurns > 0 ? (f.buffDef || 0) : 0);
}

// ── SUBCLASS PASSIVES (v11.7.3) ──
// The subclass screen saved a flag for each path, but nothing read the flags of
// Wind Walker, Shadow, Poisoner, Crusader, Beast Caller, Archmage, Hawkeye,
// Trapper, Death Knight, Hex Blade, Dragon Ascendant, Brewmaster, Plague
// Bearer, Phase Walker, Night Shroud, Paradox or Spirit Caller. They now do
// what their descriptions say.
var SUB_UNDEAD = ['Hollow Shade','Brittle Skeleton','Wailing Wraith','Armored Skeleton','Bone Colossus','Death Knight','Soul Harvester','Malachar the Undying'];
var SUB_BEASTS = [['🐺', 'wolf'], ['🐻', 'bear'], ['🦅', 'hawk'], ['🐍', 'serpent'], ['🐗', 'boar']];

// Forge effects (Burning, Life Steal, Keen Edge, Venomous, Lucky, Arcane,
// Shattering, Swift, Thorned, Executioner) were written on the weapon and
// never used in a fight.
function forgeFx() { return DS.equippedWeapon && DS.equippedWeapon.forgeEffect; }
function forgeDamage(e, dmg) {
  var fx = forgeFx();
  if (!fx || !e || !(dmg > 0)) return dmg;
  if (fx === 'execute' && e.hp / Math.max(1, e.maxHp || e.hp) < 0.25) { addLog('🔨 Executioner — +50% damage to the weakened foe!'); return Math.round(dmg * 1.5); }
  // Enemies have no defense to lower, so Shattering cracks their guard: +2 a hit, up to 10
  if (fx === 'armor-break') { e._shatter = Math.min(10, (e._shatter || 0) + 2); return dmg + e._shatter; }
  return dmg;
}
function forgeAfterHit(e, dmg) {
  var fx = forgeFx();
  if (!fx || !e || !(dmg > 0)) return;
  var f = fxGet();
  if (fx === 'burn' && e.hp > 0 && Math.random() < 0.15) { f.dot = Math.max(f.dot, 5); f.dotTurns = Math.max(f.dotTurns, 3); addLog('🔥 Your blade sets ' + e.name + ' burning — 5 damage a turn for 3 turns!'); }
  if (fx === 'poison' && e.hp > 0 && Math.random() < 0.20) { f.dot = Math.max(f.dot, 4); f.dotTurns = Math.max(f.dotTurns, 3); addLog('🐍 Venom seeps in — ' + e.name + ' is poisoned!'); }
  if (fx === 'lifesteal' && DS.hp < DS.maxHp) { var h = Math.max(1, Math.round(dmg * 0.10)); DS.hp = Math.min(DS.maxHp, DS.hp + h); updatePlayerBar(); addLog('🩸 Life Steal heals ' + h + ' HP.'); }
  if (fx === 'sp-regen') { DS.sp = Math.min(DS.maxSp, DS.sp + 2); updateXPBar(); }
  if (fx === 'double-hit' && e.hp > 0 && Math.random() < 0.10) { e.hp = Math.max(0, e.hp - dmg); updateEnemyBar(); addLog('⚡ Swift — you strike twice for another ' + dmg + '!'); }
}

// After your attack lands.
function subOnHit(e, dmg) {
  if (!e || !(dmg > 0) || e.hp <= 0) return;
  var f = fxGet();
  if (DS._poisoner) { f.dot = f.dotTurns > 0 ? Math.min(20, f.dot + 4) : 4; f.dotTurns = 3; addLog('🐍 ' + e.name + ' is poisoned!'); }
  else if (DS._dragonAscendant && Math.random() < 0.20) { f.dot = Math.max(8, f.dotTurns > 0 ? f.dot : 0); f.dotTurns = 3; addLog('🐉 Flame breath! ' + e.name + ' is burning!'); }
  else if (DS._plagueBearerSub && Math.random() < 0.25) { f.dot = Math.max(5, f.dotTurns > 0 ? f.dot : 0); f.dotTurns = 3; addLog('☠️ ' + e.name + ' is diseased!'); }
  if (DS._hexBlade) { f.vuln = Math.max(f.vuln, 0.35); f.vulnTurns = Math.max(f.vulnTurns, 3); }
  if (DS._trapper && !f.trapperDone) {
    f.trapperDone = true;
    if (Math.random() < 0.30) { f.stun = Math.max(f.stun, 1); addLog('🪤 Trap sprung! ' + e.name + ' is stunned!'); }
  }
  if (DS._vampireLord) { var vl = Math.max(1, Math.floor(dmg / 5)); DS.hp = Math.min(DS.maxHp, DS.hp + vl); updatePlayerBar(); }
  if (DS._beastCaller) {
    var b = SUB_BEASTS[(DS._beast || 0) % SUB_BEASTS.length];
    var bd = rnd(8, 14);
    e.hp = Math.max(0, e.hp - bd);
    addLog(b[0] + ' Your ' + b[1] + ' attacks for ' + bd + ' damage!');
    updateEnemyBar();
  }
}

// The enemy's hit, before it lands: Wind Walker and Phase Walker dodges.
function subDodges() {
  // Halfling — 15% of attacks slip past (set, never read)
  if (DS.halflingDodge && ACCESS.classTraits && Math.random() < 0.15) { addLog('🍃 You slip out of the way!'); return true; }
  // Void Walker — Void Touched: 15% to phase through an attack (never read)
  if (DS._voidWalker && Math.random() < (DS._voidPhaseChance || 0.15)) { addLog('🌌 You phase through the attack!'); return true; }
  if (DS._windWalker && Math.random() < 0.15) { addLog('💨 You dodge the attack!'); return true; }
  if (DS._phaseWalker && Math.random() < 0.20) { addLog('👁️ You phase through the attack!'); return true; }
  return false;
}

// Your damage, after a skill or an attack: empower, vulnerable and skill mastery.
function fxPlayerDamage(dmg, isSkill) {
  if (!isSkill && DS._abyssalLostTurn) { DS._abyssalLostTurn = false; return 0; }
  if (!(dmg > 0)) return dmg;
  // Mask: corruption on hit — your next attack deals 10 more for each stack
  if (!isSkill && DS._maskCorrupt) { var _mc = 10 * (DS._maskCorruptStacks || 1); DS._maskCorrupt = false; dmg += _mc; addLog('🎭 Mask: corruption bursts out — +' + _mc + ' damage!'); }
  var f = fxGet();
  var m = 1;
  if (f.empowerCount > 0) { m *= f.empower; f.empowerCount--; }
  if (!isSkill && f.forgotten > 0) { f.forgotten = 0; addLog('🌫️ You strike — and the enemy remembers you.'); }
  if (!isSkill && f.bloodOath > 0) {
    f.bloodOath--; m *= 1.5;
    DS.hp = Math.max(1, DS.hp - 20); updatePlayerBar();
    addLog('🩸 Blood Oath strike! 150% damage — the oath takes 20 HP.');
  }
  if (f.vulnTurns > 0) m *= 1 + f.vuln;
  if (isSkill && DS._skillMastery) m *= 1 + DS._skillMastery;
  if (DS._allMastery) m *= 1 + DS._allMastery;
  if (isSkill && DS._archmage) m *= 1.20;
  // Paladin — Divine Presence: holy skills 20% stronger (never applied)
  if (isSkill && DS.cls === 'Paladin' && ACCESS.classTraits && DS._lastSkill && /holy|divine|smite|judg|consecrat|bless|light|sacred/i.test(DS._lastSkill.name + ' ' + DS._lastSkill.effect)) m *= 1.20;
  // Shadow Mage — attacks from darkness (at night) deal +25%
  if (!isSkill && DS._shadowMage && isNightTime()) m *= 1.25;
  if (f.crusadeTurns > 0 && f.crusade > 0) {
    if (f.crusadeTurns < 99) f.crusadeTurns--;
    DS.hp = Math.min(DS.maxHp, DS.hp + f.crusade); updatePlayerBar();
    addLog('Holy Crusade heals ' + f.crusade + ' HP.');
  }
  var out = m === 1 ? dmg : Math.round(dmg * m);
  if (!isSkill) {
    out = forgeDamage(DS.enemy, out); subOnHit(DS.enemy, out); forgeAfterHit(DS.enemy, out);
    if (f.ally && DS.enemy && DS.enemy.hp > 0) { var _ad = rnd(f.ally.atk[0], f.ally.atk[1]); DS.enemy.hp = Math.max(0, DS.enemy.hp - _ad); updateEnemyBar(); addLog((f.ally.ghost ? '🌼 The ' : '💀 Your risen ') + f.ally.name + ' strikes for ' + _ad + '!'); }
  }
  return out;
}

// The start of the enemy's turn. Returns 'dead' if its damage over time killed
// it, or { skip, mult }. fromAttack: the normal-attack path, which never
// checked Shadow Form, Wind Step or Holy Light (only the skill path did).
function fxEnemyTurn(e, fromAttack) {
  var f = fxGet();
  // Warden — shrugs off the first freeze or poison each floor (the flag was never read)
  if (DS.wardenImmune && !DS._wardenUsedFloor && (DS.frozen || (DS.trapDoT && DS.trapDoT.turns > 0))) {
    DS._wardenUsedFloor = true; DS.frozen = false; DS.trapDoT = null;
    addLog('🛡 Warden — you shrug off the effect.');
  }
  // Golem — shrugs off poison and freezing (burns still get through)
  if (DS.golemRace && ACCESS.classTraits) { DS.frozen = false; if (DS.trapDoT && !/burn/i.test(DS.trapDoT.name || '')) DS.trapDoT = null; }
  if (DS._debuffImmune || f.debuffTurns > 0) { DS.frozen = false; DS.trapDoT = null; if (f.debuffTurns > 0) f.debuffTurns--; }
  fxTickTemp();
  fxTickTrapPoison();
  if (e._cursed > 0) {
    e._cursed--;
    if (e._cursed === 0 && e._preCurseAtk) { e.atk = e._preCurseAtk; e._preCurseAtk = null; addLog('The curse on ' + e.name + ' fades.'); }
  }
  if (f.buffTurns > 0) {
    f.buffTurns--;
    if (f.buffTurns === 0) {
      DS.atkBonus -= f.buffAtk; DS.defBonus -= f.buffDef; f.buffAtk = 0; f.buffDef = 0;
      addLog('Your skill buff fades.');
    }
  }
  if (f.vulnTurns > 0 && f.vulnTurns < 99) f.vulnTurns--;
  if (f.regenTurns > 0 && DS.hp > 0) {
    f.regenTurns--;
    DS.hp = Math.min(DS.maxHp, DS.hp + f.regen); updatePlayerBar();
    addLog('You regenerate ' + f.regen + ' HP.');
  }
  if (f.stickyBomb > 0) {
    var boom = f.stickyBomb; f.stickyBomb = 0;
    e.hp = Math.max(0, e.hp - boom);
    addLog('💥 The sticky bomb explodes for ' + boom + ' damage!');
    updateEnemyBar();
    if (e.hp <= 0) return 'dead';
  }
  if (f.dotTurns > 0) {
    f.dotTurns--;
    e.hp = Math.max(0, e.hp - f.dot);
    addLog(e.name + ' takes ' + f.dot + ' damage over time. (' + f.dotTurns + ' turns left)');
    updateEnemyBar();
    if (e.hp <= 0) return 'dead';
  }
  if (f.decayTurns > 0) {
    f.decayTurns--;
    e.atk = [Math.max(1, e.atk[0] - f.decay), Math.max(1, e.atk[1] - f.decay)];
    addLog('Death and Decay saps ' + e.name + "'s strength.");
  }
  // Spirit Caller — the spirit heals 8 HP each turn of a fight
  if (DS._spiritCaller && DS.hp > 0 && DS.hp < DS.maxHp) { DS.hp = Math.min(DS.maxHp, DS.hp + 8); updatePlayerBar(); addLog('🌀 Your spirit heals you for 8 HP.'); }
  // The boss timer's minion strikes too
  if (f.bossMinion && DS.hp > 0) {
    var _bm = rnd(f.bossMinion.atk[0], f.bossMinion.atk[1]);
    DS.hp = Math.max(1, DS.hp - _bm); updatePlayerBar();
    addLog('👹 The ' + f.bossMinion.name + ' strikes for ' + _bm + '!');
  }
  // Mask: Void Web — 8 damage every turn of the fight (it was never woven)
  if (DS._maskWeb) {
    e.hp = Math.max(0, e.hp - 8); updateEnemyBar();
    addLog('🕸️ Your void web deals 8 damage to ' + e.name + '.');
    if (e.hp <= 0) return 'dead';
  }
  if (f.soulDrain > 0) {
    f.soulDrain--;
    var steal = Math.min(e.hp, Math.max(8, Math.round(e.maxHp * 0.12)));
    e.hp -= steal; DS.hp = Math.min(DS.maxHp, DS.hp + steal);
    addLog('💀 Soul Drain steals ' + steal + ' HP from ' + e.name + '!');
    updateEnemyBar(); updatePlayerBar();
    if (e.hp <= 0) return 'dead';
  }
  if (f.fireballReturn > 0) {
    var fb = f.fireballReturn; f.fireballReturn = 0;
    if (DS.defending) addLog('🔥 The fireball comes back — you defend and it scatters!');
    else { DS.hp = Math.max(1, DS.hp - fb); addLog('🔥 Your missed fireball comes back for ' + fb + ' damage!'); updatePlayerBar(); }
  }
  if (DS._hungerDrain > 0 && DS.hp > 0) {
    DS._hungerDrain--;
    DS.hp = Math.max(1, DS.hp - 15); updatePlayerBar();
    addLog('🖤 The Hunger drains 15 HP.');
  }
  if (f.forgotten > 0) {
    f.forgotten--;
    addLog('🌫️ ' + e.name + ' has forgotten you exist.');
    return { skip: true, mult: 1 };
  }
  if (f.controlled > 0) {
    if (f.controlled < 99) f.controlled--;
    var ctl = rnd(e.atk[0], e.atk[1]);
    e.hp = Math.max(0, e.hp - ctl);
    addLog('🕸️ Under your control, ' + e.name + ' strikes itself for ' + ctl + '!');
    updateEnemyBar();
    if (e.hp <= 0) return 'dead';
    return { skip: true, mult: 1 };
  }
  if (f.stun > 0) {
    f.stun--;
    addLog(e.name + ' cannot act this turn!');
    say(e.name + ' is stunned.');
    return { skip: true, mult: 1 };
  }
  if (subDodges()) return { skip: true, mult: 1 };
  // Time Stop (spell) and the Time Potion: the enemy loses its turns (the counter was never read)
  if (DS._timeStop > 0) { DS._timeStop--; addLog('⌛ Time is stopped — ' + e.name + ' cannot act. (' + DS._timeStop + ' left)'); return { skip: true, mult: 1 }; }
  if (f.dodge > 0) {
    f.dodge--;
    addLog('You avoid ' + e.name + "'s attack completely!");
    say('Attack dodged.');
    return { skip: true, mult: 1 };
  }
  if (fromAttack) {
    if (DS.shadowForm && DS.shadowForm > 0) {
      DS.shadowForm--;
      addLog('Shadow Form! Enemy attack passes through you harmlessly. (' + DS.shadowForm + ' turns left)');
      return { skip: true, mult: 1 };
    }
    if (DS.windStep) {
      DS.windStep = false;
      addLog('Wind Step! You dodge the attack completely.');
      return { skip: true, mult: 1 };
    }
  }
  if (f.confuseTurns > 0) {
    f.confuseTurns--;
    if (Math.random() < f.confuse) {
      var selfHit = rnd(e.atk[0], e.atk[1]);
      e.hp = Math.max(0, e.hp - selfHit);
      addLog(e.name + ' is lost in a nightmare and strikes itself for ' + selfHit + '!');
      updateEnemyBar();
      if (e.hp <= 0) return 'dead';
      return { skip: true, mult: 1 };
    }
  }
  if (f.enemyMiss > 0) {
    var missP = f.enemyMiss; f.enemyMiss = 0;
    if (Math.random() < missP) { addLog(e.name + ' misses you!'); return { skip: true, mult: 1 }; }
  }
  var mult = 1;
  if (fromAttack && DS.holyLight && DS.holyLight > 0) {
    mult *= 0.5; DS.holyLight--;
    addLog('Holy Light blinds the enemy — attack halved! (' + DS.holyLight + ' turns left)');
  }
  if (f.softenHits > 0) { mult *= f.soften; f.softenHits--; }
  // Speed Run daily challenge — enemies hit 25% harder (never applied)
  if (DS.dailyChallenge === 'speedRun') mult *= 1.25;
  // Frozen Floors (-20%) and Death March (+25%) enemy damage
  if (DS.runModEnemyDmgMult && DS.runModEnemyDmgMult !== 1) mult *= DS.runModEnemyDmgMult;
  // Blood Moon — you take 25% more damage (shown, never applied)
  var _evTake = getEventBonuses();
  if (_evTake && _evTake.takesMore) mult *= 1 + _evTake.takesMore;
  if (f.reduceTurns > 0) { mult *= 1 - f.reduce; f.reduceTurns--; }
  return { skip: false, mult: mult };
}

// After the enemy's hit lands: Rewind and Retribution remember it, and
// Flame Shield burns the attacker. Returns true if that killed it.
function fxAfterTaken(e, taken) {
  var f = fxGet();
  if (f.capTurns > 0) {
    f.capTurns--;
    if (taken > f.cap) { DS.hp = Math.min(DS.maxHp, DS.hp + (taken - f.cap)); taken = f.cap; addLog('No hit can do more than ' + f.cap + '.'); }
  }
  // Forge: Thorned — 15% of the damage you take goes back
  if (forgeFx() === 'thorns' && taken > 0 && e && e.hp > 0) { var _ft = Math.round(taken * 0.15); if (_ft > 0) { e.hp = Math.max(0, e.hp - _ft); updateEnemyBar(); addLog('🌵 Your thorned blade reflects ' + _ft + ' damage!'); if (e.hp <= 0) return true; } }
  // Burning Dungeon — every hit burns for 2 more
  if (DS.runModFireDmg && taken > 0) { DS.hp = Math.max(0, DS.hp - 2); taken += 2; }
  // Fever Run (+15% damage taken) and Ancient Curse (1 HP per enemy attack, whatever your defense)
  var _dwT = getDungeonWeather();
  if (_dwT && _dwT.playerDmgTaken && taken > 0) { var _fe = Math.round(taken * (_dwT.playerDmgTaken - 1)); if (_fe > 0) { DS.hp = Math.max(0, DS.hp - _fe); taken += _fe; } }
  if (_dwT && _dwT.cursedArmor && e) { DS.hp = Math.max(0, DS.hp - 1); taken += 1; }
  if (f.voidMirror > 0 && taken > 0) {
    f.voidMirror--;
    DS.hp = Math.min(DS.maxHp, DS.hp + taken * 2);
    addLog('🪞 Void Mirror — the blow heals you for ' + taken + ' instead!');
    taken = 0;
  }
  if (f.curseEchoes > 0 && taken > 0 && e && e.hp > 0) {
    f.curseEchoes--;
    var echo = Math.max(1, Math.round(taken * 0.30));
    e.hp = Math.max(0, e.hp - echo);
    addLog('🔁 Curse of Echoes — ' + e.name + ' takes ' + echo + ' of its own damage!');
    updateEnemyBar();
    if (e.hp <= 0) return true;
  }
  if (DS.hp <= 0 && f.unstoppable > 0) { DS.hp = 1; addLog('Unstoppable! Death refused.'); }
  // Paradox — once per fight, the killing blow is rewound
  if (DS.hp <= 0 && DS._paradox && !f.paradoxUsed) { f.paradoxUsed = true; DS.hp = Math.max(1, taken); addLog('🔄 Paradox! Time rewinds one turn — death never happened.'); }
  if (f.unstoppable > 0) f.unstoppable--;
  if (f.thornsTurns > 0 && f.thorns > 0 && taken > 0 && e && e.hp > 0) {
    if (f.thornsTurns < 99) f.thornsTurns--;
    var tb = Math.round(taken * f.thorns);
    if (tb > 0) { e.hp = Math.max(0, e.hp - tb); addLog(tb + ' damage is reflected back at ' + e.name + '!'); updateEnemyBar(); if (e.hp <= 0) return true; }
  }
  updatePlayerBar();
  // burn — Cinder Hound and Ember Knight burn you on every hit (never applied before)
  if (taken > 0 && e && e.burn && !DS._debuffImmune && !(DS.trapDoT && DS.trapDoT.turns > 0)) {
    DS.trapDoT = { turns: e.burnTurns || 2, dmg: e.burn, name: '🔥 Burning' };
    addLog('🔥 You are burning: ' + e.burn + ' damage per turn.');
  }
  if (taken > 0) {
    f.damageTaken += taken;
    f.recentHits.push(taken);
    if (f.recentHits.length > 3) f.recentHits.shift();
  }
  if (f.retaliate > 0 && taken > 0 && e && e.hp > 0) {
    e.hp = Math.max(0, e.hp - f.retaliate);
    addLog(f.retaliate + ' damage is reflected back at ' + e.name + '!');
    updateEnemyBar();
    return e.hp <= 0;
  }
  return false;
}

// Runs a skill from SKILL_SPECS. Returns null when the skill has no spec, or
// { dmg, msg, free, done } (done: the skill already finished the turn).
function runSkillSpec(skill, e, baseAtk) {
  var s = SKILL_SPECS[DS.cls + '/' + skill.effect];
  if (!s) return null;
  var f = fxGet();
  var r = { dmg: 0, msg: (skill.icon ? skill.icon + ' ' : '') + skill.name + '!', free: !!s.free, done: false };
  if (s.once) {
    DS._onceSkills = DS._onceSkills || {};
    if (DS._onceSkills[skill.effect]) {
      DS.sp = Math.min(DS.maxSp, DS.sp + skill.spCost);
      updateXPBar();
      r.msg = skill.name + ' can only be used once per run.';
      r.done = true;
      return r;
    }
    DS._onceSkills[skill.effect] = true;
  }
  // Spell Echo repeats your last skill.
  if (s.special === 'spell-echo') {
    var last = DS._lastSkill && SKILL_SPECS[DS.cls + '/' + DS._lastSkill.effect];
    if (!DS._lastSkill || DS._lastSkill.effect === skill.effect) {
      r.msg = 'Spell Echo has nothing to repeat yet.'; r.free = true; return r;
    }
    var echoed = runSkillSpec(DS._lastSkill, e, baseAtk) || { dmg: Math.round(baseAtk * 1.5), msg: '', free: false };
    echoed.msg = 'Spell Echo repeats ' + DS._lastSkill.name + '! ' + echoed.msg;
    return echoed;
  }
  DS._lastSkill = skill;

  var dmg = 0;
  if (s.miss && Math.random() < s.miss) {
    r.msg += ' It misses!';
  } else {
  var mult = s.dmg || 0;
  if (s.lowHp) mult = DS.hp <= DS.maxHp * s.lowHp[0] ? s.lowHp[1] : mult;
  if (s.execute && e.hp <= e.maxHp * s.execute[0]) mult = s.execute[1];
  if (s.ambush && e.hp >= e.maxHp * s.ambush[0]) mult = s.ambush[1];
  if (mult > 0) dmg = Math.round(baseAtk * mult) * (s.hits || 1);
  if (s.pctMax) dmg += Math.round(e.maxHp * s.pctMax);
  if (s.pctHp) dmg += Math.round(e.hp * s.pctHp);
  if (s.missing) dmg += Math.round((e.maxHp - e.hp) * s.missing);
  if (s.flat) dmg += s.flat;
  if (s.killBelow && e.hp <= e.maxHp * s.killBelow) { dmg = Math.max(dmg, e.hp); r.msg += ' Instant kill!'; }
  switch (s.special) {
    case 'epic-tale':
      var legend = Math.min(20, DS.kills || 0);
      f.fightAtk += legend; DS.atkBonus += legend; dmg += baseAtk;
      r.msg += ' Your legend grows: +' + legend + ' attack this fight.'; break;
    case 'retribution':
      dmg += f.damageTaken; r.msg += ' Payback for ' + f.damageTaken + ' damage taken.'; break;
    case 'rewind':
      var back = Math.min(15, f.damageTaken, DS.maxHp - DS.hp);
      DS.hp += back; r.free = true; r.msg += ' ' + back + ' damage undone.'; break;
    case 'rewrite':
      var undo = f.recentHits.reduce(function(a, b) { return a + b; }, 0);
      undo = Math.min(undo, DS.maxHp - DS.hp);
      DS.hp += undo; f.recentHits = []; r.free = true;
      r.msg += ' The last 3 hits are rewritten: +' + undo + ' HP.'; break;
    case 'elemental-burst':
      var roll = Math.floor(Math.random() * 3);
      if (roll === 0) { f.stun = Math.max(f.stun, 1); r.msg += ' Frost: the enemy is frozen!'; }
      else if (roll === 1) { f.dot = 10; f.dotTurns = 3; r.msg += ' Fire: burning for 3 turns!'; }
      else { f.vuln = 0.3; f.vulnTurns = 2; r.msg += ' Lightning: the enemy is shocked!'; }
      dmg += Math.round(baseAtk * 3); break;
    case 'spell-steal':
      if (f.buffTurns > 0) { DS.atkBonus -= f.buffAtk; DS.defBonus -= f.buffDef; }
      f.buffAtk = Math.round(e.atk[1] / 2); f.buffDef = 0; f.buffTurns = 1; DS.atkBonus += f.buffAtk;
      r.msg += ' You steal ' + e.name + "'s power."; dmg += Math.round(baseAtk * 1.2); break;
    case 'mana-burn':
      dmg += Math.round(e.maxHp * 0.2); break;
    case 'omnimancy':
      var o = Math.floor(Math.random() * 4);
      if (o === 0) { r.msg += ' Destruction!'; dmg += baseAtk * 3; }
      else if (o === 1) { var h = Math.min(30, DS.maxHp - DS.hp); DS.hp += h; r.msg += ' Restoration: +' + h + ' HP.'; }
      else if (o === 2) { DS.manaShield = (DS.manaShield || 0) + 30; r.msg += ' Protection: a 30-point shield.'; }
      else { f.stun = Math.max(f.stun, 1); r.msg += ' Control: the enemy is frozen in place.'; }
      break;
  }
  var totalDef = (DS.def || 0) + (DS.defBonus || 0);
  switch (s.special) {
    case 'pressure-point': dmg += baseAtk + totalDef; break;
    case 'judgment': dmg += totalDef * 5; break;
    case 'obliterate': dmg += DS.sp * 4 + baseAtk; DS.sp = 0; r.msg += ' All remaining SP channeled.'; break;
    case 'blood-frenzy': dmg += Math.round(baseAtk * (1 + (1 - DS.hp / Math.max(1, DS.maxHp)))); break;
    case 'death-wish': dmg += (DS.maxHp - DS.hp) * 3; break;
    case 'transmute':
      if (DS.gold >= 10) { DS.gold -= 10; spendGlobalGold(10); r.msg += ' 10 gold transmuted.'; dmg += Math.round(baseAtk * 1.5); }
      else { r.msg += ' Not enough gold — a normal strike.'; dmg += baseAtk; }
      break;
    case 'unstable-formula': var um = 1 + Math.floor(Math.random() * 6); r.msg += ' ' + um + 'x multiplier!'; dmg += baseAtk * um; break;
    case 'discord': dmg += Math.round(e.atk[1] * 1.8); break;
    case 'lethal-tempo': f.lethalTempo += 0.15; dmg += Math.round(baseAtk * (1 + f.lethalTempo)); break;
    case 'philosopher-stone':
      var conv = Math.max(0, Math.min(20, DS.hp - 1)); DS.hp -= conv; DS.sp = Math.min(DS.maxSp, DS.sp + Math.round(conv / 2));
      r.msg += ' Converted ' + conv + ' HP to ' + Math.round(conv / 2) + ' SP.'; r.free = true; break;
    case 'life-tap':
      var tap = Math.max(0, Math.min(15, DS.hp - 1)); DS.hp -= tap; DS.sp = Math.min(DS.maxSp, DS.sp + tap);
      r.msg += ' ' + tap + ' HP converted to SP.'; r.free = true; break;
    case 'vein-tap': DS.hp = Math.min(DS.maxHp, DS.hp + 15); r.msg += ' Stole 15 HP.'; r.free = true; dmg += 15; break;
    case 'final-pact': dmg += (DS.hp - 1) * 3; DS.hp = 1; r.msg += ' All HP sacrificed.'; break;
    case 'sticky-bomb': f.stickyBomb = Math.round(baseAtk * 1.8); r.msg += ' A bomb is planted. It explodes next turn for ' + f.stickyBomb + '.'; r.free = true; break;
    case 'battlecry': var bc = Math.round(DS.atk[1] * 0.5); f.fightAtk += bc; DS.atkBonus += bc; r.msg += ' Attack doubled for the rest of the fight.'; break;
    case 'archangel': case 'lich-form': case 'elder-invocation': case 'avatar-nature':
      if (f.buffTurns > 0) { DS.atkBonus -= f.buffAtk; DS.defBonus -= f.buffDef; }
      f.buffAtk = (s.special === 'avatar-nature' || s.special === 'elder-invocation') ? baseAtk * 2 : baseAtk;
      f.buffDef = s.special === 'avatar-nature' ? 8 : 5;
      f.buffTurns = s.special === 'lich-form' ? 3 : 2;
      DS.atkBonus += f.buffAtk; DS.defBonus += f.buffDef;
      r.msg += ' Power surges for ' + f.buffTurns + ' turns.'; break;
    case 'berserker-god': f.unstoppable = Math.max(f.unstoppable, 1); var bg = Math.round(baseAtk * 1.5); f.fightAtk += bg; DS.atkBonus += bg; r.msg += ' Immune to death next turn and massively empowered.'; break;
    case 'wrath-incarnate': f.fightDef -= DS.defBonus; DS.defBonus = 0; r.msg += ' All bonus defense sacrificed.'; dmg += Math.round(baseAtk * 4); break;
    case 'soul-storm': dmg += baseAtk + (DS.kills || 0) * 2; break;
    case 'killshot': dmg += Math.round(baseAtk * 4 * (1 + (DS.floor || 1) * 0.05)); break;
    case 'colossus':
      if (f.buffTurns > 0) { DS.atkBonus -= f.buffAtk; DS.defBonus -= f.buffDef; }
      f.buffAtk = 0; f.buffDef = totalDef * 2; f.buffTurns = 2; DS.defBonus += f.buffDef;
      var ch = Math.min(DS.maxHp - DS.hp, Math.round(DS.maxHp * 0.25)); DS.hp += ch;
      r.msg += ' Defense tripled for 2 turns, +' + ch + ' HP.'; r.free = true; break;
  }
  }
  if (s.markCrit) DS.markedKill = true;
  // Home skill upgrades: +10% damage per level above 1 (the level was saved and never read).
  var homeLvl = getHomeSkillLevel(skill.name);
  if (homeLvl > 1 && dmg > 0) dmg = Math.round(dmg * (1 + 0.10 * (homeLvl - 1)));
  if (dmg > 0) r.msg += (s.hits > 1 ? ' ' + s.hits + ' hits for ' : ' ') + dmg + ' damage.';

  // Your side
  if (s.selfDmg) { DS.hp = Math.max(1, DS.hp - s.selfDmg); r.msg += ' Costs ' + s.selfDmg + ' HP.'; }
  if (s.recoil && dmg > 0) { var rb = Math.round(dmg * s.recoil); DS.hp = Math.max(1, DS.hp - rb); r.msg += ' ' + rb + ' damage rebounds on you.'; }
  var healAmt = (s.heal || 0) + Math.round(dmg * (s.lifesteal || 0)) + Math.round(DS.maxHp * (s.healPct || 0));
  var hl = Math.min(healAmt, DS.maxHp - DS.hp); if (hl > 0) { DS.hp += hl; r.msg += ' +' + hl + ' HP.'; }
  if (s.sp || s.spFull) {
    var spBefore = DS.sp;
    DS.sp = s.spFull ? DS.maxSp : Math.min(DS.maxSp, DS.sp + s.sp);
    if (DS.sp > spBefore) r.msg += ' +' + (DS.sp - spBefore) + ' SP.';
  }
  if (s.drainSP) { DS.sp = 0; r.msg += ' All SP consumed.'; }
  if (s.perm) {
    DS.atkBonus += s.perm[0]; DS.defBonus += s.perm[1];
    if (s.perm[2]) { DS.maxHp += s.perm[2]; DS.hp += s.perm[2]; }
    if (s.perm[3]) { DS.maxSp += s.perm[3]; DS.sp += s.perm[3]; }
    var pp = [];
    if (s.perm[0]) pp.push('+' + s.perm[0] + ' attack');
    if (s.perm[1]) pp.push('+' + s.perm[1] + ' defense');
    if (s.perm[2]) pp.push('+' + s.perm[2] + ' max HP');
    if (s.perm[3]) pp.push('+' + s.perm[3] + ' max SP');
    r.msg += ' Permanent: ' + pp.join(', ') + '.';
  }
  if (s.fight) {
    f.fightAtk += s.fight[0]; f.fightDef += s.fight[1];
    DS.atkBonus += s.fight[0]; DS.defBonus += s.fight[1];
    r.msg += ' +' + s.fight[0] + ' attack and +' + s.fight[1] + ' defense this fight.';
  }
  if (s.buff) {
    if (f.buffTurns > 0) { DS.atkBonus -= f.buffAtk; DS.defBonus -= f.buffDef; }
    f.buffAtk = s.buff[0]; f.buffDef = s.buff[1]; f.buffTurns = s.buff[2];
    DS.atkBonus += f.buffAtk; DS.defBonus += f.buffDef;
    r.msg += ' ' + [f.buffAtk ? '+' + f.buffAtk + ' attack' : '', f.buffDef ? '+' + f.buffDef + ' defense' : '']
      .filter(Boolean).join(' and ') + ' for ' + f.buffTurns + ' turns.';
  }
  if (s.shield) { DS.manaShield = (DS.manaShield || 0) + s.shield; r.msg += ' Shield absorbs up to ' + DS.manaShield + ' damage.'; }
  if (s.dodge) { f.dodge += s.dodge; r.msg += s.dodge === 1 ? ' The next attack will miss you.' : ' The next ' + s.dodge + ' attacks will miss you.'; }
  if (s.reduce) { f.reduce = s.reduce[0]; f.reduceTurns = s.reduce[1]; r.msg += ' Damage taken -' + Math.round(s.reduce[0] * 100) + '% for ' + s.reduce[1] + ' turns.'; }
  if (s.enemyMiss) { f.enemyMiss = s.enemyMiss; r.msg += ' ' + Math.round(s.enemyMiss * 100) + '% chance the enemy misses.'; }
  if (s.cap) { f.cap = s.cap[0]; f.capTurns = s.cap[1]; r.msg += ' No hit can do more than ' + s.cap[0] + ' for ' + s.cap[1] + ' turns.'; }
  if (s.unstoppable) { f.unstoppable = s.unstoppable; r.msg += ' You cannot die for ' + s.unstoppable + ' turn' + (s.unstoppable === 1 ? '' : 's') + '.'; }
  if (s.regen) { f.regen = s.regen[0]; f.regenTurns = s.regen[1]; r.msg += ' Regenerating ' + s.regen[0] + ' HP per turn.'; }
  if (s.thorns) { f.thorns = s.thorns[0]; f.thornsTurns = s.thorns[1]; r.msg += ' ' + Math.round(s.thorns[0] * 100) + '% of damage reflected.'; }
  if (s.crusade) { f.crusade = s.crusade[0]; f.crusadeTurns = s.crusade[1]; r.msg += ' Each hit heals ' + s.crusade[0] + ' HP.'; }
  if (s.warlord) { f.warlord = true; r.msg += ' Kills this fight restore 10 HP and 3 SP.'; }
  if (s.resurrect) { DS.resurrection = true; r.msg += ' You will rise once at 50% HP.'; }
  if (s.retaliate) { f.retaliate = s.retaliate; r.msg += ' Attackers take ' + s.retaliate + ' damage.'; }
  if (s.freeSkills) { DS.unlimitedPower = (DS.unlimitedPower || 0) + s.freeSkills; r.msg += ' Next skill costs 0 SP.'; }
  if (s.empower) { f.empower = s.empower[0]; f.empowerCount = s.empower[1]; r.msg += ' Your next ' + (s.empower[1] === 1 ? 'attack deals' : s.empower[1] + ' attacks deal') + ' ' + s.empower[0] + 'x damage.'; }
  if (s.mastery) {
    DS._skillMastery = (DS._skillMastery || 0) + s.mastery[0];
    DS._allMastery = (DS._allMastery || 0) + s.mastery[1];
    if (s.mastery[2]) DS._halfCostSkills = true;
    r.msg += ' Empowered for the rest of the run.';
  }
  if (s.debuffImmune) { DS._debuffImmune = true; DS.frozen = false; DS.trapDoT = null; r.msg += ' Immune to debuffs.'; }
  if (s.escape) {
    fxReset();
    DS.inCombat = false;
    playTrack(exploTrackForFloor(DS.floor));
    showDgPanels(true, false, false);
    setEvent('', r.msg + ' You escape!');
    say(r.msg + ' You escape!');
    setCombatBtns(true);
    r.done = true;
    return r;
  }

  // The enemy's side
  if (s.stun && Math.random() < s.stun[1]) {
    f.stun = Math.max(f.stun, s.stun[0]);
    r.msg += s.stun[0] === 1 ? ' ' + e.name + ' is stunned!' : ' ' + e.name + ' loses ' + s.stun[0] + ' turns!';
  }
  if (s.dot && Math.random() < s.dot[2]) { f.dot = s.dot[0]; f.dotTurns = s.dot[1]; r.msg += ' ' + s.dot[0] + ' damage per turn for ' + s.dot[1] + ' turns.'; }
  if (s.weaken && s.weaken < 1) { e.atk = [Math.max(1, Math.round(e.atk[0] * s.weaken)), Math.max(1, Math.round(e.atk[1] * s.weaken))]; r.msg += ' ' + e.name + "'s attack is weakened."; }
  if (s.shrink) { e.maxHp = Math.max(1, e.maxHp - s.shrink); e.hp = Math.min(e.hp, e.maxHp); }
  if (s.weakenBy) { e.atk = [Math.max(1, e.atk[0] - s.weakenBy), Math.max(1, e.atk[1] - s.weakenBy)]; r.msg += ' ' + e.name + "'s attack is weakened."; }
  if (s.soften) { f.soften = s.soften[0]; f.softenHits = s.soften[1]; r.msg += ' Its next ' + (s.soften[1] === 1 ? 'hit is' : s.soften[1] + ' hits are') + ' weakened.'; }
  if (s.vuln && Math.random() < s.vuln[2]) { f.vuln = s.vuln[0]; f.vulnTurns = s.vuln[1]; r.msg += ' It takes ' + Math.round(s.vuln[0] * 100) + '% more damage' + (s.vuln[1] >= 99 ? '.' : ' for ' + s.vuln[1] + ' turns.'); }
  if (s.confuse) { f.confuse = s.confuse[0]; f.confuseTurns = s.confuse[1]; r.msg += ' Its mind is clouded.'; }
  if (s.decay) { f.decay = s.decay[0]; f.decayTurns = s.decay[1]; r.msg += ' It weakens every turn.'; }
  if (s.reveal) r.msg += ' ' + e.name + ': ' + e.hp + ' of ' + e.maxHp + ' HP, hits for ' + e.atk[0] + ' to ' + e.atk[1] + '.';
  // A stun that lands this turn also stops this turn's counter-attack.
  if (f.stun > 0 && !r.free) { f.stun--; r.free = true; }
  updatePlayerBar(); updateXPBar();
  r.dmg = dmg;
  return r;
}

function getHomeSkillLevel(skillName) {
  try {
    var h = getHomeSave();
    var id = (DS.cls + '_' + skillName).replace(/\s/g, '_');
    return (h && h.skillLevels && h.skillLevels[id]) || 1;
  } catch (e) { return 1; }
}

function useSkill(idx) {
  var unlocked = getUnlockedSkills();
  if (idx >= unlocked.length) return;
  var skill = unlocked[idx];
  if (DS.sp < skill.spCost) { say('Not enough SP. You need ' + skill.spCost + ' SP but have ' + DS.sp + '.'); return; }
  if (!DS.inCombat) { say('Skills can only be used in combat.'); return; }
  setTimeout(function(){ showDungeonTip('first-skill'); }, 800);
  // Daily Quest — track unique skills used this run (dq-skills-3's 'skilluse'
  // type had no call site anywhere, so that quest could never be completed)
  if (!DS._skillsUsedThisRun) DS._skillsUsedThisRun = [];
  if (DS._skillsUsedThisRun.indexOf(skill.name) === -1) {
    DS._skillsUsedThisRun.push(skill.name);
    updateDailyQuestProgress('skilluse', 1);
  }
  // BUGFIX: same combat-state-desync guard as doFight() — DS.inCombat can be true
  // with DS.enemy missing (e.g. after a special-encounter handler clears the enemy
  // without ending combat), which would otherwise crash below and freeze combat.
  if (!DS.enemy && !_multiCombatActive) {
    DS.inCombat = false;
    setCombatBtns(true);
    try { showDgPanels(true, false, false); enterRoom(); } catch(eRecover) {}
    return;
  }

  // Multi-enemy — route offensive skills through target selector
  if (_multiCombatActive && skill.effect !== 'heal' && skill.effect !== 'shield' && skill.effect !== 'buff'
      && skill.effect !== 'inner-focus' && skill.effect !== 'smoke-bomb' && skill.effect !== 'marked-kill'
      && skill.effect !== 'divine-shield' && skill.effect !== 'unlimited-power' && skill.effect !== 'bone-shield'
      && skill.effect !== 'curse' && skill.effect !== 'undying' && skill.effect !== 'plague-carrier'
      && skill.effect !== 'gravity-well' && skill.effect !== 'venom' && skill.effect !== 'battle-hymn'
      && skill.effect !== 'battlecry' && skill.effect !== 'war-cry' && skill.effect !== 'focus'
      && skill.effect !== 'second-wind' && skill.effect !== 'iron-will' && skill.effect !== 'fortify') {
    _pendingAction = 'skill-' + idx;
    showTargetSelector();
    return;
  }

  // Track whether we're in multi-combat for post-skill enemy turn routing
  var _wasMulti = _multiCombatActive;

  // In multi-combat, temporarily wrap setCombatBtns so any early return triggers enemy turns
  var _origSetCombatBtns = setCombatBtns;
  if (_wasMulti) {
    setCombatBtns = function(on) {
      _origSetCombatBtns(on);
      if (on && _multiCombatActive) {
        setCombatBtns = _origSetCombatBtns; // restore immediately
        setTimeout(function(){ multiEnemiesTakeTurns(); }, 400);
      }
    };
  }
  setCombatBtns(false);
  // Unlimited power makes skills free
  var traitDisc = (ACCESS.classTraits && DS.traitSpDiscount) ? DS.traitSpDiscount : 0;
  // Gnome race — skills cost 2 less SP
  var gnomeDisc = (DS.gnomeRace && ACCESS.classTraits) ? 2 : 0;
  var _weatherSpDiscount = getDungeonWeatherSpDiscount();
  var _abyssalSpDiscount = (DS.dungeon === 'The Abyssal Deep' && getAbyssalWeather() && getAbyssalWeather().spDiscount) ? getAbyssalWeather().spDiscount : 0;
  // Abyssal silence check
  if (DS.dungeon === 'The Abyssal Deep' && applyAbyssalSilence()) { 
    if (_wasMulti) setCombatBtns = _origSetCombatBtns;
    say('Your skills are silenced!'); return; 
  }
  var _drownedTomeDisc = DS.inventory ? DS.inventory.reduce(function(sum, i){ return sum + (i.spellDiscount || 0); }, 0) : 0;
  var _apocalypseWeapon = DS.equippedWeapon && DS.equippedWeapon.rarityEffect === 'apocalypse';
  var actualCost = ((DS.unlimitedPower && DS.unlimitedPower > 0) || _apocalypseWeapon) ? 0 : Math.max(0, skill.spCost - (DS.tinkererDiscount||0) - traitDisc - gnomeDisc - _weatherSpDiscount - _abyssalSpDiscount - (DS._soulSurge ? 1 : 0) - _drownedTomeDisc);
  if (DS._halfCostSkills) actualCost = Math.floor(actualCost / 2);
  // Corruption 75% — skills can backfire (the flag was set and never read)
  if (DS._skillsBackfire && Math.random() < 0.15) {
    DS.sp -= Math.min(DS.sp, actualCost); updateXPBar();
    var _bfHurt = Math.max(1, Math.round(DS.maxHp * 0.10));
    DS.hp = Math.max(1, DS.hp - _bfHurt); updatePlayerBar();
    addLog('☠ The corruption twists ' + skill.name + ' — it backfires! You take ' + _bfHurt + ' damage.');
    say('The corruption twists ' + skill.name + '. It backfires. You take ' + _bfHurt + ' damage.');
    if (_wasMulti) setCombatBtns = _origSetCombatBtns;
    setCombatBtns(true); updateSkillButtons(); return;
  }
  // Archmage — skills cost 2 less (the flag was never read)
  if (DS._archmage) actualCost = Math.max(0, actualCost - 2);
  // Battle Hymn — every skill sings: +5 attack for your next 3 attacks
  if (DS._battleHymn) DS._battleHymnTurns = 3;
  if (DS.unlimitedPower && DS.unlimitedPower > 0) DS.unlimitedPower--;
  DS.sp -= actualCost;
  updateXPBar();
  var e = DS.enemy;
  var baseAtk = rnd(DS.atk[0], DS.atk[1]) + DS.atkBonus + (DS._bossRelicAtkBonus || 0);
  var _evBns2 = getEventBonuses();
  if (_evBns2 && _evBns2.atkBoost) baseAtk = Math.round(baseAtk * (1 + _evBns2.atkBoost));
  if (DS.dailyChallenge === 'glassCannon') baseAtk = Math.round(baseAtk * 2.0);
  var msg = '';
  var playerDmg = 0;
  var skipEnemyTurn = false;
  var _specQuiet = false;

  // Every skill runs from its spec (SKILL_SPECS); the handlers below are only
  // a fallback for a skill without one.
  var _spec = runSkillSpec(skill, e, baseAtk);
  if (_spec && _spec.done) {
    if (_spec.msg && DS.inCombat) { addLog(_spec.msg); say(_spec.msg); setCombatBtns(true); updateSkillButtons(); }
    if (_wasMulti) setCombatBtns = _origSetCombatBtns;
    return;
  }
  if (_spec) { playerDmg = _spec.dmg; msg = _spec.msg; if (_spec.free) { skipEnemyTurn = true; _specQuiet = true; } }
  else if (skill.effect === 'shield-bash') {
    playerDmg = Math.round(baseAtk * 0.9);
    DS.defBonus += 3;
    msg = 'Shield Bash! You deal ' + playerDmg + ' damage and gain +3 defense this combat.';
  } else if (skill.effect === 'war-cry') {
    DS.atkBonus += Math.round(baseAtk * 0.5);
    msg = 'War Cry! Your attack power surges. Next hit empowered.';
    playerDmg = Math.round(baseAtk * 2.0);
    msg = 'War Cry! You unleash a powerful strike for ' + playerDmg + ' damage!';
  } else if (skill.effect === 'last-stand') {
    if (DS.hp <= DS.maxHp * 0.30) {
      playerDmg = Math.round(baseAtk * 3.0);
      msg = 'LAST STAND! Near death, you fight with everything you have — ' + playerDmg + ' damage!';
    } else {
      playerDmg = baseAtk;
      msg = 'Last Stand is most powerful below 30% HP. You deal ' + playerDmg + ' damage.';
    }
  } else if (skill.effect === 'swift-strike') {
    var hit1 = baseAtk; var hit2 = rnd(DS.atk[0], DS.atk[1]) + DS.atkBonus;
    playerDmg = hit1 + hit2;
    msg = 'Swift Strike! Two rapid hits — ' + hit1 + ' and ' + hit2 + ' — total ' + playerDmg + ' damage!';
  } else if (skill.effect === 'inner-focus') {
    DS.hp = Math.min(DS.maxHp, DS.hp + 15);
    DS.sp = Math.min(DS.maxSp, DS.sp + 10);
    msg = 'Inner Focus. You restore 15 HP and 10 SP.';
    updatePlayerBar(); updateXPBar();
    addLog(msg); say(msg + ' HP: ' + DS.hp + '. SP: ' + DS.sp + '.');
    setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'pressure-point') {
    playerDmg = rnd(DS.atk[0], DS.atk[1]) + DS.atkBonus + DS.def + DS.defBonus;
    msg = 'Pressure Point! Striking a vital spot for ' + playerDmg + ' damage, ignoring defense!';
  } else if (skill.effect === 'backstab') {
    if (Math.random() < 0.35) {
      msg = 'Backstab misses! The enemy spotted your approach.';
      playerDmg = 0;
    } else {
      playerDmg = Math.round(baseAtk * 3.0);
      msg = 'BACKSTAB! Strike from the shadows for ' + playerDmg + ' damage!';
    }
  } else if (skill.effect === 'smoke-bomb') {
    DS.inCombat = false;
    if (_multiCombatActive) endMultiCombat(false, true);
    playTrack(exploTrackForFloor(DS.floor));
    showDgPanels(true, false, false);
    setEvent('', 'Smoke Bomb! You vanish before the enemies can react.');
    say('Smoke Bomb! You escape successfully.');
    if (_wasMulti) setCombatBtns = _origSetCombatBtns;
    setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'marked-kill') {
    DS.markedKill = true;
    msg = 'Target marked. Your next attack is guaranteed to critically hit.';
    addLog(msg); say(msg);
    setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'holy-strike') {
    playerDmg = baseAtk;
    DS.hp = Math.min(DS.maxHp, DS.hp + 20);
    msg = 'Holy Strike! Deal ' + playerDmg + ' damage and restore 20 HP.';
    updatePlayerBar();
  } else if (skill.effect === 'divine-shield') {
    DS.divineShield = true;
    msg = 'Divine Shield activated. All damage blocked this turn.';
    addLog(msg); say(msg);
    setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'smite') {
    playerDmg = Math.round(baseAtk * 2.5);
    msg = 'SMITE! Divine wrath descends for ' + playerDmg + ' damage!';
  } else if (skill.effect === 'entangle') {
    skipEnemyTurn = true;
    playerDmg = Math.round(baseAtk * 0.5);
    msg = 'Entangle! Roots hold the enemy in place — they cannot counterattack this turn!';
  } else if (skill.effect === 'venom') {
    DS.venomTurns = 3;
    msg = 'Venom applied! The enemy will take 8 poison damage for 3 turns.';
    addLog(msg); say(msg);
    setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'call-wild') {
    playerDmg = Math.round(baseAtk * 2.0);
    msg = 'Call of the Wild! A spirit beast strikes for ' + playerDmg + ' damage!';
  } else if (skill.effect === 'arcane-bolt') {
    playerDmg = Math.round(baseAtk * 1.8);
    msg = 'Arcane Bolt! Pure magic deals ' + playerDmg + ' damage, bypassing defense!';
  } else if (skill.effect === 'mana-shield') {
    DS.manaShield = 25;
    msg = 'Mana Shield raised. Absorbs up to 25 damage.';
    addLog(msg); say(msg);
    setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'obliterate') {
    playerDmg = Math.round(DS.sp * 4 + baseAtk);
    DS.sp = 0;
    msg = 'OBLITERATE! You channel all remaining SP — ' + playerDmg + ' devastating damage!';
    updateXPBar();

  // ── WARRIOR NEW SKILLS ──
  } else if (skill.effect === 'iron-stance') {
    DS.defBonus += 4; msg = 'Iron Stance! +4 defense for this combat.';
  } else if (skill.effect === 'taunt') {
    DS.taunted = 2; msg = 'Taunt! Enemy attacks recklessly — next hit halved.';
  } else if (skill.effect === 'weapon-throw') {
    playerDmg = Math.round(baseAtk * 1.2); msg = 'Weapon Throw! ' + playerDmg + ' ranged damage!';
  } else if (skill.effect === 'battle-hardened') {
    DS.maxHp += 3; DS.hp = Math.min(DS.maxHp, DS.hp + 3); updatePlayerBar(); msg = 'Battle Hardened! +3 max HP permanently.';
  } else if (skill.effect === 'overwhelm') {
    playerDmg = Math.round(baseAtk * 0.8) * 2; msg = 'Overwhelm! Two strikes for ' + Math.round(baseAtk*0.8) + ' each!';
  } else if (skill.effect === 'fortify') {
    DS.fortify = 3; msg = 'Fortify! Incoming damage reduced 35% for 3 turns.';
  } else if (skill.effect === 'execute') {
    if (e.hp <= e.maxHp * 0.25) { playerDmg = Math.round(baseAtk * 3); msg = 'EXECUTE! Enemy below 25% — ' + playerDmg + ' damage!'; }
    else { playerDmg = baseAtk; msg = 'Execute: enemy not low enough. Normal strike for ' + playerDmg + '.'; }
  } else if (skill.effect === 'unstoppable') {
    DS.unstoppable = 2; msg = 'Unstoppable! Cannot be killed for 2 turns!';
  } else if (skill.effect === 'warlord') {
    DS.warlord = true; msg = 'Warlord! Each kill this combat restores 10 HP and 3 SP.';
  } else if (skill.effect === 'titan-smash') {
    playerDmg = Math.round(baseAtk * 4); DS.hp = Math.max(1, DS.hp - 15); updatePlayerBar(); msg = 'TITAN SMASH! ' + playerDmg + ' damage — costs 15 HP!';
  } else if (skill.effect === 'battlecry') {
    DS.atkBonus += Math.round(DS.atk[1] * 0.5); msg = 'Battlecry! Attack doubled for rest of combat!';
  } else if (skill.effect === 'indomitable') {
    DS.hp = DS.maxHp; updatePlayerBar(); msg = 'Indomitable! HP fully restored!';

  // ── MONK NEW SKILLS ──
  } else if (skill.effect === 'wind-step') {
    DS.windStep = true; msg = 'Wind Step! Next enemy attack dodged completely.';
  } else if (skill.effect === 'ki-pulse') {
    playerDmg = Math.round(baseAtk * 1.5); msg = 'Ki Pulse! ' + playerDmg + ' damage ignoring armor!';
  } else if (skill.effect === 'meditate') {
    DS.sp = Math.min(DS.maxSp, DS.sp + 8); DS.hp = Math.min(DS.maxHp, DS.hp + 10); updatePlayerBar(); updateXPBar(); msg = 'Meditate! +8 SP and +10 HP.';
    addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'iron-body') {
    DS.defBonus += 5; msg = 'Iron Body! +5 permanent defense this run.';
  } else if (skill.effect === 'thousand-cuts') {
    playerDmg = Math.round(baseAtk * 0.5) * 4; msg = 'Thousand Cuts! Four strikes of ' + Math.round(baseAtk*0.5) + ' each!';
  } else if (skill.effect === 'spirit-shield') {
    DS.manaShield = 30; msg = 'Spirit Shield! Absorbs up to 30 damage.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'zen-strike') {
    DS.zenStrike = 3; msg = 'Zen Strike! Next 3 attacks cannot miss.';
    addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'transcendence') {
    DS.transcendence = 2; msg = 'Transcendence! Double damage for 2 turns.';
  } else if (skill.effect === 'soul-surge') {
    playerDmg = Math.round(baseAtk * 3.5); msg = 'Soul Surge! ' + playerDmg + ' damage!';
  } else if (skill.effect === 'one-with-all') {
    DS.sp = DS.maxSp; DS.hp = Math.min(DS.maxHp, DS.hp + 25); updatePlayerBar(); updateXPBar(); msg = 'One With All! SP restored and +25 HP.';
    addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'iron-fist') {
    playerDmg = Math.round(baseAtk * 2.5); msg = 'Iron Fist! ' + playerDmg + ' crushing damage!';
  } else if (skill.effect === 'enlightenment') {
    DS.maxSp += 10; DS.sp = Math.min(DS.maxSp, DS.sp + 10); updateXPBar(); msg = 'Enlightenment! Max SP increased by 10 permanently.';
    addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;

  // ── ASSASSIN NEW SKILLS ──
  } else if (skill.effect === 'poison-blade') {
    DS.venomTurns = 3; playerDmg = baseAtk; msg = 'Poison Blade! ' + playerDmg + ' damage and poison applied!';
  } else if (skill.effect === 'shadowstep') {
    DS.zenStrike = 1; msg = 'Shadowstep! Next attack cannot miss.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'cheap-shot') {
    skipEnemyTurn = true; playerDmg = Math.round(baseAtk * 0.8); msg = 'Cheap Shot! Enemy stunned — skips next turn!';
  } else if (skill.effect === 'shadow-clone') {
    playerDmg = Math.round(baseAtk * 2); msg = 'Shadow Clone! Double strike for ' + playerDmg + '!';
  } else if (skill.effect === 'death-mark') {
    DS.deathMark = 3; msg = 'Death Mark! Enemy takes 50% more damage for 3 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'serrated-blade') {
    DS.venomTurns = 4; playerDmg = baseAtk; msg = 'Serrated Blade! Bleeding applied — 5 per turn for 4 turns.';
  } else if (skill.effect === 'ambush') {
    playerDmg = e.hp >= e.maxHp * 0.75 ? Math.round(baseAtk * 2) : baseAtk;
    msg = 'Ambush! ' + (e.hp >= e.maxHp * 0.75 ? 'Enemy full HP — 2x damage! ' : 'Enemy already damaged. ') + playerDmg + '!';
  } else if (skill.effect === 'assassinate') {
    if (e.hp <= e.maxHp * 0.20) { e.hp = 0; msg = 'ASSASSINATE! Instant kill!'; }
    else { playerDmg = baseAtk; msg = 'Assassinate: enemy not low enough. Strike for ' + playerDmg + '.'; }
  } else if (skill.effect === 'shadow-form') {
    DS.shadowForm = 2; msg = 'Shadow Form! Untargetable for 2 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'fan-of-knives') {
    playerDmg = Math.round(baseAtk * 0.6) * 5; msg = 'Fan of Knives! Five strikes of ' + Math.round(baseAtk*0.6) + '!';
  } else if (skill.effect === 'lethal-tempo') {
    DS.lethalTempo = (DS.lethalTempo || 0) + 0.15; playerDmg = Math.round(baseAtk * (1 + DS.lethalTempo));
    msg = 'Lethal Tempo! Growing power — ' + playerDmg + ' damage!';
  } else if (skill.effect === 'death-sentence') {
    playerDmg = Math.round(e.maxHp * 0.40); msg = 'Death Sentence! ' + playerDmg + ' damage (40% of max HP)!';

  // ── PALADIN NEW SKILLS ──
  } else if (skill.effect === 'consecrate') {
    DS.consecrate = 3; msg = 'Consecrate! Incoming damage reduced 20% for 3 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'lay-on-hands') {
    DS.hp = Math.min(DS.maxHp, DS.hp + 35); updatePlayerBar(); msg = 'Lay on Hands! +35 HP restored.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'holy-light') {
    DS.holyLight = 2; msg = 'Holy Light! Enemy blinded — next 2 attacks halved.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'aura-of-faith') {
    DS.auraOfFaith = true; msg = 'Aura of Faith! Regenerating 5 HP per turn.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'sacred-blade') {
    DS.sacredBlade = 3; msg = 'Sacred Blade! Next 3 attacks deal 2x damage.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'holy-nova') {
    playerDmg = Math.round(baseAtk * 1.5); DS.hp = Math.min(DS.maxHp, DS.hp + Math.round(playerDmg/2)); updatePlayerBar(); msg = 'Holy Nova! ' + playerDmg + ' damage and healed ' + Math.round(playerDmg/2) + ' HP!';
  } else if (skill.effect === 'judgment') {
    playerDmg = (DS.def + DS.defBonus) * 5; msg = 'Judgment! ' + playerDmg + ' damage based on your defense!';
  } else if (skill.effect === 'resurrection') {
    DS.resurrection = true; msg = 'Resurrection prepared! You will survive death once with 50% HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'archangel') {
    DS.archangel = 2; DS.atkBonus += baseAtk; DS.defBonus += 5; msg = 'ARCHANGEL! Triple combat power for 2 turns!';
  } else if (skill.effect === 'divine-wrath') {
    playerDmg = Math.round(baseAtk * 5); DS.sp = 0; updateXPBar(); msg = 'DIVINE WRATH! ' + playerDmg + ' — all SP consumed!';
  } else if (skill.effect === 'sanctuary') {
    DS.sanctuary = 3; msg = 'Sanctuary! Cannot take more than 10 damage per hit for 3 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'holy-crusade') {
    DS.holyCrusade = true; msg = 'Holy Crusade! Each attack now heals 15 HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;

  // ── NATURALIST NEW SKILLS ──
  } else if (skill.effect === 'pack-bond') {
    playerDmg = Math.round(baseAtk * 1.3); msg = 'Pack Bond! Wolf ally attacks with you — ' + playerDmg + '!';
  } else if (skill.effect === 'nature-mend') {
    DS.hp = Math.min(DS.maxHp, DS.hp + 20); updatePlayerBar(); msg = 'Nature Mend! +20 HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'camouflage') {
    DS.camouflage = true; msg = 'Camouflage! Enemy has 40% miss chance next turn.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'thorns') {
    DS.thorns = true; msg = 'Thorns! Reflect 30% of incoming damage.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'plague') {
    DS.venomTurns = 4; msg = 'Plague! Enemy infected — 10 damage per turn for 4 turns.';
    addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'predator') {
    playerDmg = Math.round(baseAtk * 2.5); msg = 'Predator! ' + playerDmg + ' animal fury damage!';
  } else if (skill.effect === 'swarm') {
    skipEnemyTurn = true; playerDmg = baseAtk; msg = 'Swarm! Enemy cannot act this turn!';
  } else if (skill.effect === 'ancient-grove') {
    DS.hp = Math.min(DS.maxHp, DS.hp + 40); updatePlayerBar(); playerDmg = Math.round(baseAtk * 2); msg = 'Ancient Grove! +40 HP and ' + playerDmg + ' damage!';
  } else if (skill.effect === 'apex-predator') {
    playerDmg = Math.round(baseAtk * 4); msg = 'APEX PREDATOR! ' + playerDmg + ' damage!';
  } else if (skill.effect === 'plague-lord') {
    DS.venomTurns = 5; msg = 'Plague Lord! Lethal plague — 20 damage/turn for 5 turns!';
    addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'nature-wrath') {
    playerDmg = Math.round(baseAtk * 3); msg = 'Nature Wrath! ' + playerDmg + ' ignoring all defenses!';
  } else if (skill.effect === 'one-nature') {
    DS.hp = DS.maxHp; updatePlayerBar(); msg = 'One With Nature! HP fully restored!'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;

  // ── SORCERER NEW SKILLS ──
  } else if (skill.effect === 'frost-bolt') {
    playerDmg = baseAtk; DS.frostBolt = true; msg = 'Frost Bolt! ' + playerDmg + ' damage. Enemy attack reduced next turn.';
  } else if (skill.effect === 'arcane-surge') {
    playerDmg = Math.round(baseAtk * 1.6); DS.hp = Math.max(1, DS.hp - 5); updatePlayerBar(); msg = 'Arcane Surge! ' + playerDmg + ' damage — costs 5 HP.';
  } else if (skill.effect === 'mana-tap') {
    DS.sp = Math.min(DS.maxSp, DS.sp + 12); updateXPBar(); msg = 'Mana Tap! +12 SP restored.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'chain-lightning') {
    playerDmg = Math.round(baseAtk * 1.5); skipEnemyTurn = true; msg = 'Chain Lightning! ' + playerDmg + ' and enemy stunned!';
  } else if (skill.effect === 'arcane-armor') {
    DS.manaShield = 40; msg = 'Arcane Armor! Absorbs 40 damage.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'gravity-well') {
    DS.gravityWell = 3; msg = 'Gravity Well! Enemy cannot crit for 3 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'spell-weave') {
    playerDmg = Math.round(baseAtk * 1.3) * 2; msg = 'Spell Weave! Two strikes of ' + Math.round(baseAtk*1.3) + '!';
  } else if (skill.effect === 'singularity') {
    playerDmg = Math.round(e.maxHp * 0.50); msg = 'Singularity! ' + playerDmg + ' — 50% of enemy max HP!';
  } else if (skill.effect === 'time-stop') {
    playerDmg = baseAtk * 3; skipEnemyTurn = true; msg = 'TIME STOP! Three attacks before enemy reacts — ' + playerDmg + '!';
  } else if (skill.effect === 'void-blast') {
    playerDmg = Math.round(baseAtk * 5); DS.hp = Math.max(1, DS.hp - 20); updatePlayerBar(); msg = 'Void Blast! ' + playerDmg + ' — costs 20 HP!';
  } else if (skill.effect === 'arcane-nova') {
    playerDmg = Math.round(baseAtk * 3); msg = 'Arcane Nova! ' + playerDmg + ' pure magic damage!';
  } else if (skill.effect === 'unlimited-power') {
    DS.unlimitedPower = 3; msg = 'UNLIMITED POWER! Next 3 skills cost 0 SP!'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;

  // ── NECROMANCER SKILLS ──
  } else if (skill.effect === 'death-touch') {
    playerDmg = Math.round(baseAtk * 1.4); DS.sp = Math.min(DS.maxSp, DS.sp + 5); updateXPBar(); msg = 'Death Touch! ' + playerDmg + ' damage, stole 5 SP!';
  } else if (skill.effect === 'raise-dead') {
    playerDmg = Math.round(baseAtk * 0.8); msg = 'Raise Dead! Undead minion strikes for ' + playerDmg + '!';
  } else if (skill.effect === 'life-drain') {
    playerDmg = Math.round(baseAtk * 1.2); var drained = Math.round(playerDmg/2); DS.hp = Math.min(DS.maxHp, DS.hp+drained); updatePlayerBar(); msg = 'Life Drain! ' + playerDmg + ' damage, healed ' + drained + ' HP!';
  } else if (skill.effect === 'bone-shield') {
    DS.manaShield = 20; msg = 'Bone Shield! Absorbs 20 damage.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'curse') {
    DS.deathMark = 3; msg = 'Curse! Enemy takes 15% more damage for 3 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'soul-harvest') {
    playerDmg = Math.round(baseAtk * 1.8); DS.sp = Math.min(DS.maxSp, DS.sp + 8); updateXPBar(); msg = 'Soul Harvest! ' + playerDmg + ' damage, +8 SP!';
  } else if (skill.effect === 'corpse-explosion') {
    playerDmg = Math.round(e.maxHp * 0.35); msg = 'Corpse Explosion! ' + playerDmg + ' — 35% of enemy max HP!';
  } else if (skill.effect === 'undying') {
    DS.unstoppable = 1; msg = 'Undying! Cannot die for 1 turn.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'necrotic-bolt') {
    playerDmg = Math.round(baseAtk * 1.6); msg = 'Necrotic Bolt! ' + playerDmg + ' ignoring all defense!';
  } else if (skill.effect === 'plague-carrier') {
    DS.venomTurns = 4; msg = 'Plague Carrier! Dark plague — 12 per turn for 4 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'army-of-dead') {
    playerDmg = Math.round(baseAtk * 0.7) * 4; msg = 'Army of Dead! Four undead strikes of ' + Math.round(baseAtk*0.7) + '!';
  } else if (skill.effect === 'death-pact') {
    DS.hp = Math.max(1, DS.hp - 30); updatePlayerBar(); playerDmg = Math.round(baseAtk * 5); msg = 'Death Pact! Sacrificed 30 HP — ' + playerDmg + ' damage!';
  } else if (skill.effect === 'soul-storm') {
    playerDmg = Math.round(baseAtk * 3); msg = 'Soul Storm! ' + playerDmg + ' devastating damage!';
  } else if (skill.effect === 'lich-form') {
    DS.atkBonus += baseAtk; DS.defBonus += 5; DS.lichForm = 3; msg = 'LICH FORM! Double stats for 3 turns!';
  } else if (skill.effect === 'death-coil') {
    playerDmg = Math.round(baseAtk * 2); DS.hp = Math.min(DS.maxHp, DS.hp + 25); updatePlayerBar(); msg = 'Death Coil! ' + playerDmg + ' damage and +25 HP!';

  // ── BERSERKER SKILLS ──
  } else if (skill.effect === 'reckless-strike') {
    playerDmg = Math.round(baseAtk * 1.6); DS.hp = Math.max(1, DS.hp - 5); updatePlayerBar(); msg = 'Reckless Strike! ' + playerDmg + ' — costs 5 HP!';
  } else if (skill.effect === 'rage') {
    DS.atkBonus += 4; msg = 'Rage! +4 attack for this combat.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'war-stomp') {
    skipEnemyTurn = true; playerDmg = Math.round(baseAtk * 0.8); msg = 'War Stomp! Enemy staggers — skips turn!';
  } else if (skill.effect === 'blood-frenzy') {
    var missingHpPct = 1 - (DS.hp / DS.maxHp); var mult = 1 + missingHpPct;
    playerDmg = Math.round(baseAtk * mult); msg = 'Blood Frenzy! ' + playerDmg + ' — fury from ' + Math.round(missingHpPct*100) + '% missing HP!';
  } else if (skill.effect === 'headbutt') {
    playerDmg = Math.round(baseAtk * 1.4); e.atk = e.atk.map(function(v){return Math.round(v*0.8);}); msg = 'Headbutt! ' + playerDmg + ' and reduced enemy attack!';
  } else if (skill.effect === 'rampage') {
    playerDmg = Math.round(baseAtk * 1.5) * 2; msg = 'Rampage! Two powerful strikes — ' + playerDmg + '!';
  } else if (skill.effect === 'undying-rage') {
    playerDmg = DS.hp <= DS.maxHp * 0.30 ? Math.round(baseAtk * 3) : baseAtk;
    msg = 'Undying Rage! ' + (DS.hp <= DS.maxHp * 0.30 ? 'ENRAGED — ' : '') + playerDmg + '!';
  } else if (skill.effect === 'savage-blow') {
    playerDmg = Math.round(baseAtk * 2.5); msg = 'Savage Blow! ' + playerDmg + ' — devastating!';
  } else if (skill.effect === 'berserker-cry') {
    DS.taunted = 2; msg = 'War Cry! Enemy damage reduced 30% for 2 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'relentless') {
    playerDmg = Math.round(baseAtk * 1.3); msg = 'Relentless! First strike — ' + playerDmg + '!';
  } else if (skill.effect === 'wrath-incarnate') {
    playerDmg = Math.round(baseAtk * 4); DS.defBonus = 0; msg = 'WRATH INCARNATE! ' + playerDmg + ' — all defense sacrificed!';
  } else if (skill.effect === 'death-wish') {
    var missing = DS.maxHp - DS.hp; playerDmg = missing * 3; msg = 'Death Wish! ' + playerDmg + ' — from ' + missing + ' missing HP!';
  } else if (skill.effect === 'berserker-god') {
    DS.unstoppable = 1; DS.atkBonus += Math.round(baseAtk * 1.5); msg = 'BERSERKER GOD! Immune next turn, massively empowered!';
  } else if (skill.effect === 'endless-rage') {
    DS.endlessRage = 3; msg = 'Endless Rage! Double attack speed for 3 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'final-blow') {
    playerDmg = Math.round(baseAtk * 6); DS.sp = 0; updateXPBar(); msg = 'FINAL BLOW! ' + playerDmg + ' — all SP consumed!';

  // ── BARD SKILLS ──
  } else if (skill.effect === 'battle-hymn') {
    playerDmg = Math.round(baseAtk * 1.5); msg = 'Battle Hymn! Inspiring strike — ' + playerDmg + '!';
  } else if (skill.effect === 'dissonance') {
    DS.defBonus += 3; e.atk = e.atk.map(function(v){return Math.round(v*0.85);}); msg = 'Dissonance! Enemy defense and attack reduced.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'soothing-melody') {
    DS.hp = Math.min(DS.maxHp, DS.hp + 18); updatePlayerBar(); msg = 'Soothing Melody! +18 HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'taunt-song') {
    DS.camouflage = true; msg = 'Taunt Song! Enemy mocked — 40% miss chance.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'rhythmic-strike') {
    playerDmg = Math.round(baseAtk * 1.2); DS.sp = Math.min(DS.maxSp, DS.sp + 5); updateXPBar(); msg = 'Rhythmic Strike! ' + playerDmg + ' and +5 SP!';
  } else if (skill.effect === 'war-ballad') {
    DS.battlecryActive = 2; msg = 'War Ballad! Attack doubled for 2 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'lullaby') {
    skipEnemyTurn = true; msg = 'Lullaby! Enemy falls asleep — misses their turn.';
  } else if (skill.effect === 'discord') {
    playerDmg = Math.round(e.atk[1] * 1.8); msg = 'Discord! Confusion — enemy strikes itself for ' + playerDmg + '!';
  } else if (skill.effect === 'heroic-verse') {
    DS.maxHp += 5; DS.hp = Math.min(DS.maxHp, DS.hp + 5); updatePlayerBar(); msg = 'Heroic Verse! +5 max HP this run.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'anthem') {
    DS.hp = Math.min(DS.maxHp, DS.hp + 15); DS.sp = Math.min(DS.maxSp, DS.sp + 10); updatePlayerBar(); updateXPBar(); msg = 'Anthem! +15 HP and +10 SP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'song-of-doom') {
    DS.sacredBlade = 2; msg = 'Song of Doom! Next 2 attacks deal 3x damage.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'requiem') {
    playerDmg = Math.round(e.maxHp * 0.45); msg = 'Requiem! ' + playerDmg + ' — 45% of max HP!';
  } else if (skill.effect === 'maestro') {
    DS.unlimitedPower = 3; msg = 'Maestro! All skills free for 3 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'grand-finale') {
    playerDmg = Math.round(baseAtk * 5); msg = 'GRAND FINALE! ' + playerDmg + ' — everything!';

  // ── ALCHEMIST SKILLS ──
  } else if (skill.effect === 'acid-flask') {
    playerDmg = Math.round(baseAtk * 1.4); e.atk = e.atk.map(function(v){return Math.round(v*0.85);}); msg = 'Acid Flask! ' + playerDmg + ' damage, enemy corroded!';
  } else if (skill.effect === 'healing-brew') {
    DS.hp = Math.min(DS.maxHp, DS.hp + 25); updatePlayerBar(); msg = 'Healing Brew! +25 HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'smoke-grenade') {
    DS.camouflage = true; msg = 'Smoke Grenade! Enemy has 35% miss chance.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'transmute') {
    if (DS.gold >= 10) { DS.gold -= 10; spendGlobalGold(10); playerDmg = Math.round(baseAtk * 1.5); updateTopBar(); msg = 'Transmute! Spent 10 gold — ' + playerDmg + ' damage!'; }
    else { playerDmg = baseAtk; msg = 'Transmute: not enough gold. Normal strike for ' + playerDmg + '.'; }
  } else if (skill.effect === 'sticky-bomb') {
    DS.stickyBomb = Math.round(baseAtk * 1.8); msg = 'Sticky Bomb planted! Explodes next turn for ' + DS.stickyBomb + '!'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'explosive-flask') {
    playerDmg = Math.round(baseAtk * 2); msg = 'Explosive Flask! ' + playerDmg + ' ignoring defense!';
  } else if (skill.effect === 'philosopher-stone') {
    var convert = Math.min(20, DS.hp - 1); DS.hp -= convert; DS.sp = Math.min(DS.maxSp, DS.sp + Math.round(convert/2)); updatePlayerBar(); updateXPBar(); msg = 'Philosopher Stone! Converted ' + convert + ' HP to ' + Math.round(convert/2) + ' SP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'elixir-of-rage') {
    playerDmg = Math.round(baseAtk * 3); DS.hp = Math.max(1, DS.hp - 10); updatePlayerBar(); msg = 'Elixir of Rage! ' + playerDmg + ' damage — costs 10 HP!';
  } else if (skill.effect === 'corrosion') {
    e.atk = e.atk.map(function(v){return Math.round(v*0.5);}); DS.corrosion = 3; msg = 'Corrosion! Enemy loses ALL defense for 3 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'chain-reaction') {
    playerDmg = Math.round(baseAtk * 1.2) * 3; msg = 'Chain Reaction! Three strikes of ' + Math.round(baseAtk*1.2) + '!';
  } else if (skill.effect === 'nova-bomb') {
    playerDmg = Math.round(e.maxHp * 0.60); msg = 'Nova Bomb! ' + playerDmg + ' — 60% of enemy max HP!';
  } else if (skill.effect === 'grand-transmute') {
    playerDmg = Math.round(baseAtk * 4); msg = 'Grand Transmutation! ' + playerDmg + '!';
  } else if (skill.effect === 'immortality-serum') {
    DS.unstoppable = 2; msg = 'Immortality Serum! Cannot die for 2 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'plague-bomb') {
    DS.venomTurns = 6; msg = 'Plague Bomb! 15 damage per turn for 6 turns!'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'unstable-formula') {
    var multi = Math.floor(Math.random() * 6) + 1; playerDmg = Math.round(baseAtk * multi); msg = 'Unstable Formula! Random ' + multi + 'x multiplier — ' + playerDmg + '!';

  // ── BLOOD KNIGHT SKILLS ──
  } else if (skill.effect === 'blood-strike') {
    DS.hp = Math.max(1, DS.hp - 8); updatePlayerBar(); playerDmg = Math.round(baseAtk * 2); msg = 'Blood Strike! Sacrificed 8 HP — ' + playerDmg + '!';
  } else if (skill.effect === 'crimson-slash') {
    playerDmg = Math.round(baseAtk * 1.4); DS.hp = Math.min(DS.maxHp, DS.hp + 5); updatePlayerBar(); msg = 'Crimson Slash! ' + playerDmg + ' and healed 5 HP!';
  } else if (skill.effect === 'life-tap') {
    var sacrifice = Math.min(15, DS.hp - 1); DS.hp -= sacrifice; DS.sp = Math.min(DS.maxSp, DS.sp + sacrifice); updatePlayerBar(); updateXPBar(); msg = 'Life Tap! ' + sacrifice + ' HP converted to SP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'blood-bath') {
    DS.atkBonus += 3; msg = 'Blood Bath! +3 attack for this combat.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'hemorrhage') {
    DS.venomTurns = 3; playerDmg = baseAtk; msg = 'Hemorrhage! ' + playerDmg + ' and bleeding for 3 turns!';
  } else if (skill.effect === 'sanguine-fury') {
    DS.hp = Math.max(1, DS.hp - 20); updatePlayerBar(); playerDmg = Math.round(baseAtk * 3); msg = 'Sanguine Fury! Sacrificed 20 HP — ' + playerDmg + '!';
  } else if (skill.effect === 'blood-armor') {
    DS.manaShield = 35; msg = 'Blood Armor! Crystallized blood absorbs 35 damage.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'crimson-nova') {
    playerDmg = Math.round(baseAtk * 2); msg = 'Crimson Nova! ' + playerDmg + ' explosion!';
  } else if (skill.effect === 'vein-tap') {
    var stolen = 15; e.hp = Math.max(0, e.hp - stolen); DS.hp = Math.min(DS.maxHp, DS.hp + stolen); updatePlayerBar(); updateTopBar(); msg = 'Vein Tap! Stole ' + stolen + ' HP from enemy!'; addLog(msg); say(msg);
    if (e.hp <= 0) { setTimeout(function(){enemyDead();},500); return; }
    setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'exsanguinate') {
    playerDmg = Math.round(baseAtk * 1.8); DS.venomTurns = 3; msg = 'Exsanguinate! ' + playerDmg + ' and bleeding for 3 turns!';
  } else if (skill.effect === 'blood-god') {
    playerDmg = Math.round(baseAtk * 5); DS.hp = Math.min(DS.maxHp, DS.hp + Math.round(playerDmg/2)); updatePlayerBar(); msg = 'BLOOD GOD! ' + playerDmg + ' and healed ' + Math.round(playerDmg/2) + ' HP!';
  } else if (skill.effect === 'crimson-storm') {
    playerDmg = Math.round(baseAtk * 0.8) * 5; msg = 'Crimson Storm! Five strikes of ' + Math.round(baseAtk*0.8) + '!';
  } else if (skill.effect === 'exanguination') {
    playerDmg = Math.round(e.maxHp * 0.35); msg = 'Exanguination! ' + playerDmg + ' — 35% of max HP!';
  } else if (skill.effect === 'blood-pact') {
    DS.hp = Math.max(1, DS.hp - 40); updatePlayerBar(); playerDmg = Math.round(baseAtk * 6); msg = 'Blood Pact! Sacrificed 40 HP — ' + playerDmg + '!';
  } else if (skill.effect === 'immortal-blood') {
    DS.auraOfFaith = true; msg = 'Immortal Blood! Regenerating 10 HP per turn.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;

  // ── DRUID SKILLS ──
  } else if (skill.effect === 'nature-bolt') {
    playerDmg = Math.round(baseAtk * 1.3); msg = 'Nature Bolt! ' + playerDmg + ' nature damage!';
  } else if (skill.effect === 'regrowth') {
    DS.hp = Math.min(DS.maxHp, DS.hp + 20); updatePlayerBar(); msg = 'Regrowth! +20 HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'thorn-whip') {
    playerDmg = Math.round(baseAtk * 1.4); e.atk = e.atk.map(function(v){return Math.round(v*0.85);}); msg = 'Thorn Whip! ' + playerDmg + ' and reduced enemy attack!';
  } else if (skill.effect === 'beast-form') {
    DS.atkBonus += 4; DS.defBonus += 2; msg = 'Beast Form! +4 attack, +2 defense for this combat.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'rejuvenate') {
    DS.sp = Math.min(DS.maxSp, DS.sp + 8); DS.hp = Math.min(DS.maxHp, DS.hp + 12); updatePlayerBar(); updateXPBar(); msg = 'Rejuvenate! +8 SP and +12 HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'moonfire') {
    playerDmg = Math.round(baseAtk * 2); msg = 'Moonfire! ' + playerDmg + ' lunar damage!';
  } else if (skill.effect === 'spirit-form') {
    DS.hp = Math.min(DS.maxHp, DS.hp + 30); updatePlayerBar(); DS.windStep = true; msg = 'Spirit Form! +30 HP and untargetable next turn.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'barkskin') {
    DS.barkskin = 2; msg = 'Barkskin! Damage reduced 40% for 2 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'sunfire') {
    playerDmg = Math.round(baseAtk * 1.8); DS.venomTurns = 3; msg = 'Sunfire! ' + playerDmg + ' and burns for 8/turn!';
  } else if (skill.effect === 'wild-growth') {
    DS.wildGrowth = 3; msg = 'Wild Growth! Regenerating 10 HP per turn for 3 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'avatar-nature') {
    DS.atkBonus += baseAtk * 2; DS.defBonus += 8; msg = 'Avatar of Nature! Triple power for 2 turns!';
  } else if (skill.effect === 'ancient-wrath') {
    playerDmg = Math.round(baseAtk * 4); msg = 'Ancient Wrath! ' + playerDmg + ' ignoring all defense!';
  } else if (skill.effect === 'balance') {
    DS.hp = DS.maxHp; DS.sp = DS.maxSp; updatePlayerBar(); updateXPBar(); msg = 'Balance! HP and SP fully restored!'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;
  } else if (skill.effect === 'stormcall') {
    playerDmg = Math.round(baseAtk * 3); skipEnemyTurn = true; msg = 'Stormcall! ' + playerDmg + ' and enemy stunned!';
  } else if (skill.effect === 'verdant-tide') {
    playerDmg = Math.round(baseAtk * 2.5); DS.hp = Math.min(DS.maxHp, DS.hp + 20); updatePlayerBar(); msg = 'Verdant Tide! ' + playerDmg + ' and +20 HP!';
  }

  // ── WARLOCK SKILLS ──
  if (skill.effect === 'dark-pact')       { playerDmg = Math.round(baseAtk*1.5); DS.hp = Math.max(1, DS.hp-10); updatePlayerBar(); msg = 'Dark Pact! '+playerDmg+' damage — cost 10 HP!'; }
  else if (skill.effect === 'soul-rend')  { playerDmg = Math.round(baseAtk*1.4); DS.hp = Math.min(DS.maxHp, DS.hp+8); updatePlayerBar(); msg = 'Soul Rend! '+playerDmg+' damage, stole 8 HP!'; }
  else if (skill.effect === 'hex')        { DS.deathMark = 2; msg = 'Hex! Enemy takes 50% more damage for 2 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return; }
  else if (skill.effect === 'void-grasp') { playerDmg = Math.round(baseAtk*1.3); e.atk = e.atk.map(function(v){return Math.round(v*0.8);}); msg = 'Void Grasp! '+playerDmg+' and enemy weakened!'; }
  else if (skill.effect === 'life-leech') { playerDmg = Math.round(baseAtk*1.2); DS.hp = Math.min(DS.maxHp, DS.hp+Math.round(playerDmg/2)); updatePlayerBar(); msg = 'Life Leech! '+playerDmg+' damage, healed '+Math.round(playerDmg/2)+'!'; }
  else if (skill.effect === 'shadow-bolt'){ playerDmg = Math.round(baseAtk*2); msg = 'Shadow Bolt! '+playerDmg+' shadow damage!'; }
  else if (skill.effect === 'demonic-surge'){playerDmg = Math.round(baseAtk*1.8); DS.atkBonus+=3; msg = 'Demonic Surge! '+playerDmg+' and +3 attack!'; }
  else if (skill.effect === 'soul-cage')  { skipEnemyTurn=true; msg = 'Soul Cage! Enemy trapped — misses their turn!'; }
  else if (skill.effect === 'eldritch-blast'){playerDmg=Math.round(baseAtk*2.5); msg='Eldritch Blast! '+playerDmg+' damage!';}
  else if (skill.effect === 'pact-of-blood'){DS.hp=Math.max(1,DS.hp-25); updatePlayerBar(); playerDmg=Math.round(baseAtk*3); msg='Pact of Blood! Sacrificed 25 HP — '+playerDmg+'!';}
  else if (skill.effect === 'void-collapse'){playerDmg=Math.round(baseAtk*4); msg='Void Collapse! '+playerDmg+' — reality tears!';}
  else if (skill.effect === 'warlock-soul-storm'){playerDmg=Math.round(baseAtk*3); msg='Soul Storm! '+playerDmg+' from all harvested souls!';}
  else if (skill.effect === 'elder-invocation'){DS.atkBonus+=baseAtk*2; DS.defBonus+=5; msg='Elder Invocation! Triple power for 2 turns!';}
  else if (skill.effect === 'oblivion')   {playerDmg=Math.round(e.maxHp*0.7); msg='Oblivion! '+playerDmg+' — 70% of max HP!';}
  else if (skill.effect === 'final-pact') {playerDmg=Math.round((DS.hp-1)*3); DS.hp=1; updatePlayerBar(); msg='Final Pact! Sacrificed all HP — '+playerDmg+'!';}
  // ── DEATH KNIGHT SKILLS ──
  else if (skill.effect === 'dk-death-coil'){playerDmg=Math.round(baseAtk*1.4); DS.hp=Math.min(DS.maxHp,DS.hp+15); updatePlayerBar(); msg='Death Coil! '+playerDmg+' damage +15 HP!';}
  else if (skill.effect === 'unholy-strike'){playerDmg=Math.round(baseAtk*1.5); msg='Unholy Strike! '+playerDmg+'!';}
  else if (skill.effect === 'death-grip') {playerDmg=Math.round(baseAtk*1.2); e.atk=e.atk.map(function(v){return Math.round(v*0.7);}); msg='Death Grip! '+playerDmg+' and enemy weakened 30%!';}
  else if (skill.effect === 'bone-armor') {DS.manaShield=30; msg='Bone Armor! Absorbs 30 damage.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'soul-strike') {playerDmg=Math.round(baseAtk*1.6); msg='Soul Strike! '+playerDmg+' ignoring defense!';}
  else if (skill.effect === 'corpse-walk') {if(DS.hp<=DS.maxHp*0.30){DS.hp=Math.min(DS.maxHp,DS.hp+25); updatePlayerBar(); msg='Corpse Walk! Rose from near-death +25 HP!';}else{msg='Corpse Walk has full effect below 30% HP.';} addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'dark-resurrection'){DS.secondWind=true; msg='Dark Resurrection prepared! Will survive next death at 5 HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'necrotic-strike'){playerDmg=Math.round(baseAtk*2); DS.venomTurns=3; msg='Necrotic Strike! '+playerDmg+' and necrotic poison 3 turns!';}
  else if (skill.effect === 'army-darkness'){playerDmg=Math.round(baseAtk*0.7)*4; msg='Army of Darkness! Four undead strike for '+Math.round(baseAtk*0.7)+' each!';}
  else if (skill.effect === 'death-nova') {playerDmg=Math.round(baseAtk*2.5); msg='Death Nova! '+playerDmg+'!';}
  else if (skill.effect === 'dk-undying') {DS.unstoppable=2; msg='Undying! Cannot die for 2 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'dark-ascension'){DS.atkBonus+=baseAtk; DS.defBonus+=5; msg='Dark Ascension! Double stats for 3 turns!';}
  else if (skill.effect === 'death-decay'){playerDmg=Math.round(baseAtk*5); DS.hp=Math.max(1,DS.hp-30); updatePlayerBar(); msg='Death and Decay! '+playerDmg+' — costs 30 HP!';}
  else if (skill.effect === 'apocalypse') {playerDmg=Math.round(baseAtk*1.5)*4; msg='Apocalypse! Four horsemen — '+playerDmg+' total!';}
  else if (skill.effect === 'eternal-darkness'){DS.hp=DS.maxHp; updatePlayerBar(); playerDmg=Math.round(baseAtk*3); msg='Eternal Darkness! HP restored and '+playerDmg+' damage!';}
  // ── DRAGONBORN SKILLS ──
  else if (skill.effect === 'fire-breath'){playerDmg=Math.round(baseAtk*1.5); msg='Fire Breath! '+playerDmg+' fire damage ignoring defense!';}
  else if (skill.effect === 'dragon-claw'){playerDmg=Math.round(baseAtk*1.4); msg='Dragon Claw! '+playerDmg+'!';}
  else if (skill.effect === 'scale-shield'){DS.manaShield=25; msg='Scale Shield! Absorbs 25 damage.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'wing-gust') {skipEnemyTurn=true; playerDmg=Math.round(baseAtk*0.5); msg='Wing Gust! '+playerDmg+' and enemy stunned!';}
  else if (skill.effect === 'draconic-surge'){playerDmg=Math.round(baseAtk*1.3); DS.atkBonus+=2; msg='Draconic Surge! '+playerDmg+' and +2 attack!';}
  else if (skill.effect === 'inferno')   {playerDmg=Math.round(baseAtk*2); msg='Inferno! '+playerDmg+' — scorching!';}
  else if (skill.effect === 'dragon-fear'){e.atk=e.atk.map(function(v){return Math.round(v*0.5);}); msg='Dragon Fear! Enemy attack halved.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'ancient-flame'){playerDmg=Math.round(baseAtk*2.5); DS.venomTurns=3; msg='Ancient Flame! '+playerDmg+' and burn 3 turns!';}
  else if (skill.effect === 'dragon-rush'){playerDmg=Math.round(baseAtk*0.8)*3; msg='Dragon Rush! Three strikes of '+Math.round(baseAtk*0.8)+'!';}
  else if (skill.effect === 'molten-scales'){DS.thorns=true; msg='Molten Scales! Reflect 50% incoming damage.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'dragonstrike'){var dFloor=DS.floor||1; playerDmg=Math.round(baseAtk*4*(1+dFloor*0.05)); msg='Dragonstrike! '+playerDmg+' — scaled by floor '+dFloor+'!';}
  else if (skill.effect === 'apocalyptic-fire'){playerDmg=Math.round(baseAtk*5); msg='Apocalyptic Fire! '+playerDmg+'!';}
  else if (skill.effect === 'true-dragon-form'){DS.atkBonus+=baseAtk*2; DS.defBonus+=6; msg='True Dragon Form! Triple power!';}
  else if (skill.effect === 'world-ender'){playerDmg=Math.round(e.maxHp*0.6); msg='World Ender! '+playerDmg+' — 60% of max HP!';}
  else if (skill.effect === 'dragon-god'){DS.hp=DS.maxHp; updatePlayerBar(); playerDmg=Math.round(baseAtk*3); msg='Dragon God! HP restored and '+playerDmg+'!';}
  // ── CLERIC SKILLS ──
  else if (skill.effect === 'cleric-holy-light'){DS.hp=Math.min(DS.maxHp,DS.hp+25); updatePlayerBar(); msg='Holy Light! +25 HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'sacred-strike'){playerDmg=Math.round(baseAtk*1.3); msg='Sacred Strike! '+playerDmg+'!';}
  else if (skill.effect === 'bless')      {DS.defBonus+=3; DS.atkBonus+=2; msg='Bless! +3 defense and +2 attack.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'cleric-smite'){playerDmg=Math.round(baseAtk*1.5); msg='Smite! '+playerDmg+' holy damage!';}
  else if (skill.effect === 'prayer')     {DS.sp=Math.min(DS.maxSp,DS.sp+8); DS.hp=Math.min(DS.maxHp,DS.hp+12); updatePlayerBar(); updateXPBar(); msg='Prayer! +8 SP and +12 HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'divine-barrier'){DS.manaShield=40; msg='Divine Barrier! Absorbs 40 damage.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'consecrate-ground'){DS.consecrate=3; msg='Consecrate Ground! 30% less damage for 3 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'holy-word')  {playerDmg=Math.round(baseAtk*2); skipEnemyTurn=true; msg='Holy Word! '+playerDmg+' and enemy stunned!';}
  else if (skill.effect === 'mass-heal')  {DS.hp=Math.min(DS.maxHp,DS.hp+45); updatePlayerBar(); msg='Mass Heal! +45 HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'angel-guard'){DS.sanctuary=3; msg='Angel Guard! Cannot take more than 8 damage for 3 turns.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'miracle')    {DS.hp=DS.maxHp; updatePlayerBar(); msg='Miracle! HP fully restored!'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'cleric-crusade'){DS.holyCrusade=true; msg='Holy Crusade! Each attack heals 20 HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'divine-judgment'){playerDmg=(DS.def+DS.defBonus)*5; msg='Divine Judgment! '+playerDmg+' based on defense!';}
  else if (skill.effect === 'cleric-resurrection'){DS.resurrection=true; msg='Resurrection! Will survive death with 50% HP.'; addLog(msg); say(msg); setCombatBtns(true); updateSkillButtons(); return;}
  else if (skill.effect === 'wrath-of-god'){playerDmg=Math.round(baseAtk*5); DS.sp=0; updateXPBar(); msg='WRATH OF GOD! '+playerDmg+' — all SP consumed!';}

  playerDmg = fxPlayerDamage(playerDmg, true);
  if (playerDmg > 0) {
    e.hp = Math.max(0, e.hp - playerDmg);
    updateEnemyBar();
  }
  addLog(msg);
  say(msg);

  if (e.hp <= 0) { setTimeout(function() { enemyDead(); }, 500); if (_wasMulti) setCombatBtns = _origSetCombatBtns; return; }

  // BUGFIX: useSkill() never checked boss phase transitions either — skills are a
  // primary damage source for most classes, so boss fights won by skill spam alone
  // silently skipped phase buffs/messages and The Infernal's weak-point mechanic.
  // Same gap as doFight()/applySpellEffect(); mirror the fix here.
  if (e.isBoss && e.hp > 0 && !_multiCombatActive && checkBossPhase()) {
    if (_wasMulti) setCombatBtns = _origSetCombatBtns;
    setCombatBtns(true); updateSkillButtons(); return;
  }

  if (skipEnemyTurn) {
    if (!_specQuiet) addLog('The enemy struggles against the roots, unable to strike back.');
    if (_wasMulti) setCombatBtns = _origSetCombatBtns;
    setCombatBtns(true); updateSkillButtons(); return;
  }

  // If in multi-combat, route to multi enemy turns instead of single
  if (_multiCombatActive) {
    setCombatBtns = _origSetCombatBtns;
    setTimeout(function(){ multiEnemiesTakeTurns(); }, 600);
    return;
  }

  // Normal enemy counterattack
  setTimeout(function() {
    if (DS.divineShield) {
      DS.divineShield = false;
      addLog('Divine Shield absorbs the attack completely!');
      say('Divine Shield blocked all damage.');
      setCombatBtns(true); updateSkillButtons(); return;
    }
    // Distorted — uses special turn
    if (DS.enemy && DS.enemy.isDistorted) { distortedTurn(); return; }
    var _fxT = fxEnemyTurn(e, false);
    if (_fxT === 'dead') { setTimeout(function() { enemyDead(); }, 300); return; }
    if (_fxT.skip) { setCombatBtns(true); updateSkillButtons(); return; }
    var rawDmg = rnd(e.atk[0], e.atk[1]);
    rawDmg = Math.round(rawDmg * _fxT.mult);
    var diffMult = DS.diff === 'Forsaken' ? 1.5 : DS.diff === 'Condemned' ? 1.25 : DS.diff === 'Ironblood' ? 1.1 : 1.0;
    rawDmg = Math.round(rawDmg * diffMult);

    // ── SKILL FLAG CHECKS (enemy attack phase) ──

    // Medusa gaze decay
    checkMedusaGazeDecay();
    // Petrified — skip turn
    if (DS.petrified) {
      DS.petrified = false;
      addLog('You are still petrified — you cannot move this turn.');
      say('Still petrified. You cannot move.');
      updatePlayerBar();
      return;
    }
    // Medusa Serpent Guard — absorbs one hit
    if (DS.medusaGuardActive) {
      DS.medusaGuardActive = false;
      addLog('🐍 Medusa intercepts the attack! Serpent Guard blocks the hit.');
      say('Medusa blocks the attack. Serpent Guard used.');
      updatePlayerBar();
      return;
    }
    // Shadow Form — enemy misses entirely
    if (DS.shadowForm && DS.shadowForm > 0) {
      DS.shadowForm--;
      addLog('Shadow Form! Enemy attack passes through you harmlessly. (' + DS.shadowForm + ' turns left)');
      say('Shadow Form blocked the attack. ' + DS.shadowForm + ' turns remaining.');
      setCombatBtns(true); updateSkillButtons(); return;
    }
    // Wind Step — dodge once
    if (DS.windStep) {
      DS.windStep = false;
      addLog('Wind Step! You dodge the attack completely.');
      say('Wind Step — attack dodged!');
      setCombatBtns(true); updateSkillButtons(); return;
    }
    // Camouflage — 40% miss chance
    if (DS.camouflage && Math.random() < 0.40) {
      DS.camouflage = false;
      addLog('Camouflage! Enemy missed you.');
      say('Enemy missed — Camouflage worked!');
      setCombatBtns(true); updateSkillButtons(); return;
    }
    DS.camouflage = false;
    // Holy Light — enemy attacks halved for 2 turns
    if (DS.holyLight && DS.holyLight > 0) {
      rawDmg = Math.round(rawDmg * 0.5);
      DS.holyLight--;
      addLog('Holy Light blinds the enemy — attack halved! (' + DS.holyLight + ' turns left)');
    }
    // Archangel — player stats boosted (apply on their turn, reduce counter here)
    if (DS.archangel && DS.archangel > 0) {
      DS.archangel--;
      if (DS.archangel === 0) {
        DS.atkBonus = Math.max(0, DS.atkBonus - Math.round(DS.atk[1]));
        DS.defBonus = Math.max(0, DS.defBonus - 5);
        addLog('Archangel fades. Stats return to normal.');
      }
    }
    // Barkskin — reduce damage
    if (DS.barkskin && DS.barkskin > 0) { rawDmg = Math.round(rawDmg * 0.60); DS.barkskin--; }
    // Fortify — reduce damage 35%
    if (DS.fortify && DS.fortify > 0) { rawDmg = Math.round(rawDmg * 0.65); DS.fortify--; }
    // Consecrate — reduce damage 20%
    if (DS.consecrate && DS.consecrate > 0) { rawDmg = Math.round(rawDmg * 0.80); DS.consecrate--; }
    // Sanctuary — cap damage at 10
    if (DS.sanctuary && DS.sanctuary > 0) { rawDmg = Math.min(rawDmg, 10); DS.sanctuary--; }
    // Unstoppable — cannot die
    if (DS.unstoppable && DS.unstoppable > 0) { DS.unstoppable--; }

    var defVal = DS.def + DS.defBonus;
    var blocked = Math.min(defVal, Math.floor(rawDmg * 0.60));
    var taken = Math.max(1, rawDmg - blocked);

    // Mana Shield absorbs damage
    if (DS.manaShield && DS.manaShield > 0) {
      var absorbed = Math.min(DS.manaShield, taken);
      taken -= absorbed;
      DS.manaShield -= absorbed;
      if (DS.manaShield <= 0) DS.manaShield = 0;
      if (taken > 0) addLog('Mana Shield absorbs ' + absorbed + '. You take ' + taken + ' damage.');
      else { addLog('Mana Shield absorbs all ' + absorbed + ' damage!'); taken = 0; }
    } else {
      addLog(e.name + ' strikes for ' + taken + ' damage.');
    }

    DS.hp = Math.max(0, DS.hp - taken);
    if (DS.hp <= 0 && DS.unstoppable && DS.unstoppable >= 0) { DS.hp = 1; addLog('Unstoppable! Death refused.'); }
    updatePlayerBar();
    if (fxAfterTaken(e, taken) && DS.hp > 0) { setTimeout(function() { enemyDead(); }, 300); return; }
    // Insane Mode — sanity drains on every hit
    if (_insaneMode && taken > 0) {
      var sd = taken > 15 ? 8 : taken > 8 ? 4 : 2;
      drainSanity(sd, false);
    }

    // Thorns — reflect 30% back
    if (DS.thorns && taken > 0) {
      var reflected = Math.round(taken * 0.30);
      e.hp = Math.max(0, e.hp - reflected);
      updateEnemyBar();
      addLog('Thorns reflect ' + reflected + ' damage back!');
      if (e.hp <= 0) { setTimeout(function(){enemyDead();},300); return; }
    }
    // Aura of Faith / Wild Growth / Immortal Blood — regen
    if (DS.auraOfFaith) { DS.hp = Math.min(DS.maxHp, DS.hp + 5); updatePlayerBar(); addLog('Aura of Faith: +5 HP regen.'); }
    if (DS.wildGrowth && DS.wildGrowth > 0) { DS.hp = Math.min(DS.maxHp, DS.hp + 10); updatePlayerBar(); DS.wildGrowth--; addLog('Wild Growth: +10 HP. (' + DS.wildGrowth + ' turns left)'); }

    say(e.name + ' dealt ' + taken + '. Your HP: ' + DS.hp + '.');
    if (DS.hp <= 0) { setTimeout(function() { handleDeath(); }, 600); }
    else { setCombatBtns(true); updateSkillButtons(); }
  }, 700);
}

// ── XP AND LEVELING ──
function gainXP(amount) {
  if (!DS || !DS.level) return; // not in a run
  if (isNaN(amount) || amount <= 0) return;
  var evBonus = getEventBonuses();
  if (evBonus && evBonus.xpMult) amount = Math.round(amount * evBonus.xpMult);
  var dcBonus = DS.dailyChallenge === 'speedRun' ? 2.0 : 1.0;
  amount = Math.round(amount * dcBonus);
  if (DS.pilgrimProf) amount = Math.round(amount * 1.15);
  if (DS.backstoryXPBonus) amount = Math.round(amount * (1 + DS.backstoryXPBonus));
  if (DS._xpBoost && DS._xpBoost.floors > 0) amount = Math.round(amount * DS._xpBoost.mult);
  // The Watching's double XP and the Pilgrim's +15% set DS.xpBoost, which nothing read
  if (DS.xpBoost && DS.xpBoost !== 1) amount = Math.round(amount * DS.xpBoost);
  // Safety — make sure xp is a valid number
  if (isNaN(DS.xp) || DS.xp === undefined || DS.xp === null) DS.xp = 0;
  DS.xp += amount;
  checkLevelUp();
  updateXPBar();
}

function checkLevelUp() {
  var cap = DS.levelCap || 10;
  if (DS.level >= cap) return;
  var needed = XP_TABLE[Math.min(DS.level, XP_TABLE.length - 1)];
  var leveledUp = false;
  while (DS.xp >= needed && DS.level < cap) {
    DS.xp -= needed;
    DS.level++;
    needed = XP_TABLE[Math.min(DS.level, XP_TABLE.length - 1)];
    leveledUp = true;
    // Angel — heals 15 HP each level
    if (DS.angelRace && ACCESS.classTraits) DS.hp = Math.min(DS.maxHp, DS.hp + 15);
    // Last Hope: +5 SP per level up (promised, never given)
    if (DS.backstorySPBonus) { DS.maxSp += DS.backstorySPBonus; DS.sp = Math.min(DS.maxSp, DS.sp + DS.backstorySPBonus); }
  }
  if (leveledUp) triggerLevelUp();
  // At cap — announce it once
  if (DS.level >= cap && !DS._capAnnouncedThisRun) {
    DS._capAnnouncedThisRun = true;
    addLog('⭐ Level cap reached! You are at maximum level ' + cap + '.');
    say('Level cap reached. You are at maximum level ' + cap + '.');
  }
}

var LP_STATS = [
  { id:'strength',     label:'⚔️ Strength',      desc:'+2 ATK — hit harder',                    apply: function(){ DS.atkBonus = (DS.atkBonus||0) + 2; } },
  { id:'stamina',      label:'❤️ Stamina',        desc:'+10 max HP — survive longer',            apply: function(){ DS.maxHp += 10; DS.hp = Math.min(DS.maxHp, DS.hp + 10); updatePlayerBar(); } },
  { id:'defense',      label:'🛡️ Defense',        desc:'+2 DEF — reduce damage taken',           apply: function(){ DS.defBonus = (DS.defBonus||0) + 2; } },
  { id:'intelligence', label:'🧠 Intelligence',   desc:'+5 max SP — more skill energy',          apply: function(){ DS.maxSp = (DS.maxSp||20) + 5; DS.sp = Math.min(DS.maxSp, (DS.sp||0) + 5); updateXPBar(); } },
  { id:'agility',      label:'🏃 Agility',        desc:'+3% crit chance and +5% flee chance',    apply: function(){ DS.fleeBonus = (DS.fleeBonus||0) + 0.05; DS.critBonus = (DS.critBonus||0) + 0.03; } },
  { id:'luck',         label:'🍀 Luck',           desc:'+10% gold drops and better loot',        apply: function(){ DS.luckBonus = (DS.luckBonus||0) + 0.10; } },
];

function triggerLevelUp() {
  // Give 3 Level Points — add to any unspent ones from before
  DS.levelPoints = (DS.levelPoints || 0) + 3;

  var lvlTitle = document.getElementById('levelup-title');
  var lvlSub   = document.getElementById('levelup-sub');
  var lvlStats = document.getElementById('levelup-stats');
  if (lvlTitle) lvlTitle.textContent = '⬆ Level ' + DS.level + '!';
  if (lvlSub)   lvlSub.textContent   = DS.name + ' grows stronger. You have ' + DS.levelPoints + ' Level Point' + (DS.levelPoints !== 1 ? 's' : '') + ' to spend.';
  if (lvlStats) lvlStats.textContent = '';

  var pointsSection = document.getElementById('levelup-points-section');
  if (pointsSection) {
    pointsSection.style.display = '';
    renderLevelPointButtons();
  }

  var skillSection = document.getElementById('levelup-skill-section');
  if (skillSection) skillSection.style.display = 'none';

  var lvlOv = document.getElementById('ov-levelup');
  if (lvlOv) lvlOv.classList.add('open');
  say('Level up! You are now level ' + DS.level + '. You have ' + DS.levelPoints + ' Level Points. Spend them to increase your stats. Unspent points carry over.');
  // Show subclass choice at level 5
  if (DS.level === 5 && !DS._subclass) {
    setTimeout(function(){ showSubclassChoice(); }, 500);
  }
  addRunLog('Reached level ' + DS.level, 'good');
  updateTopBar();
  updateAchievementStat('maxLevel', DS.level);
  checkAchievements();
  // Save level immediately so it persists even if player dies or quits this run
  try { saveCharPersistentLevel(DS.level, DS.xp, DS.unlockedSkills, DS.maxHp, DS.atkBonus, _charIdx); } catch(e) {}
  setTimeout(function(){ var btn = document.querySelector('#lp-stat-buttons button'); if(btn) btn.focus(); }, 100);
}

function getEnemyEmergeMessage(enemy) {
  var name = enemy.name || 'Something';
  var type = (enemy.name || '').toLowerCase();
  var floor = DS.floor || 1;

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  if (type.includes('skeleton') || type.includes('bone')) return pick([
    name + ' rattles to life. The bones should not move like that. They do anyway.',
    name + ' assembles itself from the floor. Piece by piece. Deliberately.',
    name + ' stands. You hear every joint click into place.',
    name + ' turns toward you. It has no eyes. It finds you anyway.',
    name + ' rises. The bones are old but the intent behind them is not.',
    name + ' steps forward. The sound it makes should not come from something dead.',
    name + ' emerges from the wall. The bones were part of it. Now they are not.',
    name + ' lurches upright. Whatever animates it is very old and very awake.',
  ]);

  if (type.includes('wraith') || type.includes('shade') || type.includes('ghost')) return pick([
    name + ' drifts through the wall. The cold arrives before it does.',
    name + ' materializes from the dark. It was already here.',
    name + ' appears without a sound. Silence where there should be movement.',
    name + ' passes through solid stone like it is not there. For it, it is not.',
    name + ' coalesces from the shadows. Not from darkness — from the absence of something.',
    name + ' slides into view. Its form blurs at the edges like a bad memory.',
    name + ' emerges. The temperature drops six degrees in a second.',
    name + ' manifests. You feel it before you see it — a wrongness in the air.',
  ]);

  if (type.includes('bat')) return pick([
    name + ' drops from the ceiling. You heard nothing until it was already moving.',
    name + ' unfolds from the dark above. How long was it there?',
    name + ' launches from a crevice. Silent until it is not.',
    name + ' descends. The wingbeats are wrong. Too quiet. Too controlled.',
    name + ' dives from the shadows above. You never saw it land up there.',
    name + ' emerges from a crack in the ceiling. More wait behind it.',
  ]);

  if (type.includes('spider') || type.includes('web')) return pick([
    name + ' descends on a thread you did not see until now.',
    name + ' drops from the ceiling on silk that should not hold its weight.',
    name + ' skitters from the wall. Eight eyes. All of them on you.',
    name + ' crawls from a web you walked through. The web was not there before.',
    name + ' emerges from a crack, legs first, one at a time, slowly.',
    name + ' appears. The web trembled first. Then stopped. Then this.',
    name + ' lowers itself directly in front of you. Patient. Waiting.',
  ]);

  if (type.includes('ghoul') || type.includes('zombie') || type.includes('husk')) return pick([
    name + ' lurches forward. It smells of old earth and something that used to be alive.',
    name + ' shambles from the dark. Its movement is wrong in ways you cannot name.',
    name + ' rises from the floor. It was lying still. You walked past it.',
    name + ' staggers toward you. The hunger on it is ancient and absolute.',
    name + ' emerges. Whatever it was before, it is only this now.',
    name + ' moves. Slow. Patient. It does not need to hurry.',
    name + ' drags itself from the corridor. Reaching before it has fully arrived.',
  ]);

  if (type.includes('knight') || type.includes('warrior') || type.includes('guard')) return pick([
    name + ' steps into the light. Armor scarred. Purpose unchanged.',
    name + ' advances from the shadow. The armor is old. The movement is not.',
    name + ' blocks the corridor. It has been waiting for you specifically.',
    name + ' raises its weapon. No hesitation. No greeting. Only intent.',
    name + ' emerges. The sound of armor in the dark is its own kind of warning.',
    name + ' stands ready. Something once gave it orders. It never stopped following them.',
    name + ' approaches. A soldier past death, carrying out a mission that outlasted everything.',
  ]);

  if (type.includes('mage') || type.includes('witch') || type.includes('sorcerer')) return pick([
    name + ' raises a hand. The air smells of burning before anything happens.',
    name + ' appears. Reality stutters slightly at its edges.',
    name + ' steps from the shadows, already casting.',
    name + ' materializes. The temperature in the room shifts. Not from cold or heat. From intent.',
    name + ' emerges. The light bends wrong around it.',
    name + ' arrives. Something in your mind recognizes it as dangerous before your eyes do.',
    name + ' stands before you. Its eyes are already glowing.',
  ]);

  if (type.includes('rat') || type.includes('crawler')) return pick([
    name + ' scurries from a crack in the wall. There are more behind it.',
    name + ' emerges from the dark, low to the ground and fast.',
    name + ' rushes from a gap in the stone. You hear more following.',
    name + ' darts from shadow to shadow before committing to an attack.',
    name + ' skitters into view. Small. Quick. Dangerous in the way all small things are.',
  ]);

  if (type.includes('reaper') || type.includes('death')) return pick([
    name + ' materializes from the dark. It was already here. You simply could not see it.',
    name + ' appears. Death has been in this room the whole time.',
    name + ' manifests beside you. Not in front. Beside.',
    name + ' coalesces from nothing. The air where it stands has always been waiting for it.',
    name + ' steps forward. Unhurried. It has all the time you do not.',
  ]);

  if (type.includes('giant') || type.includes('golem') || type.includes('colossus')) return pick([
    name + ' fills the corridor. The floor shakes beneath its weight.',
    name + ' moves. The sound arrives before it does.',
    name + ' emerges. The doorframe cracks as it passes through.',
    name + ' steps forward. Each footfall sends vibrations through the stone.',
    name + ' rises. You feel it before you see it.',
  ]);

  // Floor depth fallback messages
  if (floor <= 3) return pick([
    name + ' steps from the shadows. It has been waiting.',
    name + ' blocks your path. It does not intend to move.',
    name + ' turns toward you. You have its full attention now.',
    name + ' emerges from a doorway you did not notice. There is no retreat.',
    name + ' appears. Something about its posture says it has done this before.',
    name + ' moves into the light. It was in the dark by choice.',
  ]);
  if (floor <= 6) return pick([
    name + ' was already in the room. You walked into its territory.',
    name + ' rises from the floor as if it grew there. Maybe it did.',
    name + ' has been following you. It chose now to reveal itself.',
    name + ' slides out of the dark. The air becomes heavier.',
    name + ' steps forward from a wall you thought was solid.',
    name + ' appears. At this depth, enemies do not wander. They are placed.',
  ]);
  return pick([
    name + ' coalesces from the dungeon itself. This deep, the walls are alive.',
    name + ' has survived everything that came before you. It is still here.',
    name + ' regards you with something beyond hunger. It recognizes what you are.',
    name + ' steps forward. At this depth, every enemy has earned its place.',
    name + ' emerges. You are in its home now. It knows every corner.',
    name + ' arrives. The dungeon sent it specifically. For you.',
    name + ' materializes. This deep, you have entered its domain entirely.',
  ]);
}

function renderLevelPointButtons() {
  var container = document.getElementById('lp-stat-buttons');
  var remaining = document.getElementById('lp-remaining');
  if (!container) return;
  container.innerHTML = '';
  if (remaining) remaining.textContent = DS.levelPoints || 0;

  LP_STATS.forEach(function(stat) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;';

    var btn = document.createElement('button');
    btn.style.cssText = 'flex:1;padding:8px 12px;background:#0a0800;border:1px solid ' + ((DS.levelPoints||0) > 0 ? '#ffaa44' : '#333') + ';color:' + ((DS.levelPoints||0) > 0 ? '#ffaa44' : '#555') + ';font-family:Cinzel,serif;font-size:0.7rem;cursor:' + ((DS.levelPoints||0) > 0 ? 'pointer' : 'default') + ';text-align:left;';
    btn.innerHTML = '<span>' + stat.label + '</span> <span style="color:#888;font-size:0.62rem;margin-left:8px;">' + stat.desc + '</span>';
    btn.setAttribute('aria-label', stat.label + '. ' + stat.desc + '. Tap to spend 1 Level Point.');
    btn.disabled = (DS.levelPoints || 0) <= 0;

    btn.onclick = function() {
      if ((DS.levelPoints || 0) <= 0) { say('No Level Points remaining.'); return; }
      stat.apply();
      DS.levelPoints--;
      // Save to character
      if (_charIdx !== null && CHARS[_charIdx]) {
        if (!CHARS[_charIdx].lpSpent) CHARS[_charIdx].lpSpent = {};
        CHARS[_charIdx].lpSpent[stat.id] = (CHARS[_charIdx].lpSpent[stat.id] || 0) + 1;
        CHARS[_charIdx].levelPoints = DS.levelPoints;
        saveChars();
      }
      renderLevelPointButtons();
      updateTopBar();
      sfx('sfx-confirm');
      say(stat.label + ' increased. ' + (DS.levelPoints || 0) + ' Level Points remaining.');
    };

    row.appendChild(btn);
    container.appendChild(row);
  });
}

function closeLevelUp() {
  document.getElementById('ov-levelup').classList.remove('open');
  // Now show skill choice
  var candidates = offerSkillChoices();
  if (candidates && candidates.length > 0) {
    showSkillChoice(candidates);
  } else {
    say('Continuing your descent. No more skills available.');
  }
}

function updateXPBar() {
  if (!DS.level) return;
  var lvl = DS.level;
  var needed = XP_TABLE[Math.min(lvl, 10)];
  var pct = lvl >= 10 ? 100 : Math.min(100, (DS.xp / needed) * 100);
  var xpBar    = document.getElementById('dg-xp-bar');
  var xpText   = document.getElementById('dg-xp-text');
  var lvlBadge = document.getElementById('dg-level-badge');
  var spBar    = document.getElementById('dg-sp-bar');
  var spText   = document.getElementById('dg-sp-text');
  if (xpBar)    xpBar.style.width         = pct + '%';
  if (xpText)   xpText.textContent        = lvl >= 10 ? 'MAX' : DS.xp + '/' + needed;
  if (lvlBadge) lvlBadge.textContent      = 'Lv ' + lvl;
  var spPct = Math.max(0, (DS.sp / DS.maxSp) * 100);
  if (spBar)  spBar.style.width           = spPct + '%';
  if (spText) spText.textContent          = DS.sp + '/' + DS.maxSp;
}

