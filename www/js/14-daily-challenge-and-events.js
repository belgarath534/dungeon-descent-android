//═════════════════
// FEATURE 1: DAILY CHALLENGE REGISTRATION
//═════════════════
function getDCRegistration() {
  return _jsonParseSafe(DDStore.getItem('dd_dc_reg'), '{}');
}
function setDCRegistration(o) { DDStore.setItem('dd_dc_reg', JSON.stringify(o)); }

function isDCRegistered() {
  var reg = getDCRegistration();
  return reg.date === todayKey() && reg.registered === true;
}

function registerForDC() {
  var dc = getDailyChallenge();
  setDCRegistration({ date: todayKey(), registered: true, challengeId: dc.id });
  sfx('sfx-unlock');
  renderDCPanel();
  say('Registered for today\'s Daily Challenge: ' + dc.name + '. The modifier will apply when you enter a dungeon today. Complete the dungeon to earn 1 Mystery Coin.');
}

function declineDC() {
  setDCRegistration({ date: todayKey(), registered: false, challengeId: '' });
  renderDCPanel();
  say('Daily Challenge declined for today. You can still register from the Quests screen.');
}

function renderDCPanel() {
  var panel = document.getElementById('dc-register-panel');
  if (!panel) return;
  var dc = getDailyChallenge();
  var reg = getDCRegistration();
  var isReg = isDCRegistered();
  var isCompleted = getDailyChallengeCompleted();
  var status = isCompleted ? 'completed' : isReg ? 'registered' : 'not-registered';
  var statusText = isCompleted ? '✦ Completed' : isReg ? '✓ Registered' : 'Not Registered';

  var effectWarnings = {
    ironDay:      'WARNING: All enemies have 50% more HP.',
    glassCannon:  'WARNING: You start with half your maximum HP.',
    cursedDay:    'WARNING: Potions cannot be used during combat.',
    blessedDay:   'BONUS: Start with 3 potions and 30 extra gold.',
    nightmareDay: 'WARNING: Nightmare enemies invade all dungeon floors.',
    speedRun:     'MIXED: Double XP gain but enemies hit 25% harder.',
    hordeDay:     'WARNING: Combat encounter chance increased to 70%.'
  };

  // Build history
  var history = _jsonParseSafe(DDStore.getItem('dd_dc_history'), '[]');
  var historyHtml = history.length > 0
    ? '<div class="dc-history"><div class="dc-history-title">Recent Challenges</div>' +
      history.slice(-5).reverse().map(function(h){
        return '<div class="dc-history-row"><span style="color:var(--ash-light);font-family:Cinzel,serif;font-size:0.72rem;">' + h.name + '</span><span style="color:' + (h.completed ? '#7aaa7a' : 'var(--text-dim)') + ';font-family:Cinzel,serif;font-size:0.68rem;">' + (h.completed ? '✦ Coin Earned' : 'Not Completed') + '</span></div>';
      }).join('') + '</div>'
    : '';

  panel.innerHTML =
    '<div class="dc-register-box" aria-label="Today\'s Daily Challenge">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
        '<span style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:0.25em;color:var(--gold-dim);text-transform:uppercase;">Today\'s Challenge</span>' +
        '<span class="dc-status-badge ' + status + '" aria-label="Status: ' + statusText + '">' + statusText + '</span>' +
      '</div>' +
      '<div class="dc-modifier-name">' + dc.name + '</div>' +
      '<div class="dc-modifier-desc">' + dc.desc + '</div>' +
      '<div class="dc-modifier-effect">' + (effectWarnings[dc.effect] || dc.desc) + '</div>' +
      '<div class="dc-modifier-reward">🪙 Reward: 1 Mystery Coin for completing a dungeon today</div>' +
      (isCompleted
        ? '<p style="font-family:Cinzel,serif;font-size:0.78rem;color:#7aaa7a;margin-top:12px;">✦ Challenge complete! Mystery Coin earned. Come back tomorrow.</p>'
        : isReg
        ? '<p style="font-family:Cinzel,serif;font-size:0.78rem;color:var(--text-secondary);font-style:italic;margin-top:12px;">You are registered. Enter a dungeon and complete it to earn your coin.</p>' +
          '<button class="btn-ghost" onclick="declineDC()" aria-label="Cancel registration" style="margin-top:10px;font-size:0.65rem;padding:6px 14px;">Cancel Registration</button>'
        : '<button class="btn-gold" onclick="registerForDC()" aria-label="Register for today\'s Daily Challenge" style="margin-top:12px;">⚡ Register for Challenge</button>') +
    '</div>' +
    historyHtml;

  var announced = isCompleted ? 'Daily Challenge complete. Coin earned.' : isReg ? 'Registered for ' + dc.name + '. Enter a dungeon to complete it.' : 'Today\'s Daily Challenge: ' + dc.name + '. ' + dc.desc + ' Reward: 1 Mystery Coin. Press Register to opt in.';
  say(announced);
}

function applyDailyChallenge() {
  if (!isDCRegistered()) { DS.dailyChallenge = null; return; }
  var dc = getDailyChallenge();
  if (!dc) return;
  DS.dailyChallenge = dc.effect;
  if (dc.effect === 'glassCannon') { DS.hp = Math.floor(DS.maxHp / 2); DS.maxHp = DS.hp; }
  if (dc.effect === 'blessedDay') {
    DS.gold += 30; addGlobalGold(30);
    for (var i = 0; i < 3; i++) DS.inventory.push({name:'Health Potion',icon:'🧪',type:'potion',heal:40,desc:'Restores 40 HP.'});
  }
}

function checkDailyChallengeCompletion() {
  if (!isDCRegistered()) return;
  if (getDailyChallengeCompleted()) return;
  var dc = getDailyChallenge();
  if (!dc) return;
  completeDailyChallenge();
  var history = _jsonParseSafe(DDStore.getItem('dd_dc_history'), '[]');
  history.push({ date: todayKey(), name: dc.name, completed: true });
  if (history.length > 30) history = history.slice(-30);
  DDStore.setItem('dd_dc_history', JSON.stringify(history));
}

// Show registration popup when new day arrives
function checkNewDayDCPopup() {
  var reg = getDCRegistration();
  var dc = getDailyChallenge();
  if (reg.date && reg.date !== todayKey() && reg.registered) {
    // New day, was registered yesterday — ask about today
    var yesterday = reg.history || dc;
    // New day — just flag it so the Challenge tab shows the new challenge
    // Player can register from the Quests screen at their own pace
    setDCRegistration({ date: reg.date, registered: false, challengeId: '' });
  }
}

//═════════════════
// FEATURE 2: TRAP SYSTEM OVERHAUL
//═════════════════
var TRAP_TYPES = {
  crypt: [
    { name:'Poison Dart',   desc:'A dart laced with ancient venom strikes you.',    damage:8,  effect:'poison',  turns:3, msg:'Poison courses through you. 8 damage per turn for 3 turns.' },
    { name:'Bone Spike',    desc:'Bone spikes erupt from the floor beneath you.',   damage:20, effect:'none',    turns:0, msg:'Bone spikes tear through you for 20 damage!' },
    { name:'Soul Drain',    desc:'An ancient glyph saps your will.',                damage:0,  effect:'sp',      turns:0, msg:'Soul Drain! You lose 8 SP.' }
  ],
  ashbound: [
    { name:'Fire Jet',      desc:'A jet of superheated ash erupts from the wall.',  damage:12, effect:'burn',    turns:2, msg:'Fire Jet! Burns for 12 damage and 6 per turn for 2 turns.' },
    { name:'Magma Puddle',  desc:'You step into a concealed magma pool.',           damage:15, effect:'none',    turns:0, msg:'Magma Puddle! 15 damage. You smell burning.' }
  ],
  frosthold: [
    { name:'Ice Blast',     desc:'A burst of absolute cold freezes you momentarily.',damage:10,effect:'freeze',  turns:1, msg:'Ice Blast! 10 damage. You are frozen for 1 turn.' },
    { name:'Void Crack',    desc:'A rift opens and drags you back.',                damage:5,  effect:'pushback',turns:0, msg:'Void Crack! You are pushed back and take 5 damage.' }
  ],
  nightmare: [
    { name:'Reality Tear',  desc:'Something reaches through and tears at your mind.',damage:15,effect:'sp',      turns:0, msg:'Reality Tear! 15 damage and 10 SP drained.' },
    { name:'Void Pull',     desc:'The void pulls at your soul.',                    damage:18, effect:'none',    turns:0, msg:'Void Pull! 18 damage. Something is missing from you.' }
  ]
};

function getDungeonTrapPool() {
  if (DS.diff === 'Nightmare') return TRAP_TYPES.nightmare;
  if (DS.dungeon === 'The Ashbound Wastes') return TRAP_TYPES.ashbound;
  if (DS.dungeon === 'Frosthold Abyss') return TRAP_TYPES.frosthold;
  return TRAP_TYPES.crypt;
}

function triggerTrap() {
  var pool = getDungeonTrapPool();
  var trap = pool[Math.floor(Math.random() * pool.length)];
  sfx('sfx-trap');

  var totalDmg = trap.damage;
  DS.hp = Math.max(0, DS.hp - totalDmg);

  if (trap.effect === 'poison' || trap.effect === 'burn') {
    DS.trapDoT = { turns: trap.turns, dmg: trap.effect === 'burn' ? 6 : 8, name: trap.name };
  }
  if (trap.effect === 'sp') {
    DS.sp = Math.max(0, DS.sp - 8);
    updateXPBar();
  }
  if (trap.effect === 'freeze') {
    DS.frozen = true;
  }
  if (trap.effect === 'pushback' && DS.roomsOnFloor > 1) {
    DS.roomsOnFloor = Math.max(1, DS.roomsOnFloor - 1);
  }

  setEvent('danger', trap.name + ' — ' + trap.msg);
  say('Trap! ' + trap.name + '. ' + trap.msg + ' HP: ' + DS.hp + ' of ' + DS.maxHp + '.');
  updateTopBar();
  if (DS.hp <= 0) { handleDeath(); return; }
  return trap;
}

//═════════════════
// FEATURE 3: ENEMY SPECIAL ABILITIES
//═════════════════
var ENEMY_SPECIALS = {
  'Death Knight':       { name:'Shield Slam',     chance:0.25, msg:'Shield Slam! Ignores your defense!',                          effect:'ignore-def'    },
  'Brood Mother':       { name:'Spawn',            chance:0.30, msg:'The Brood Mother spawns a small spider!',                    effect:'spawn'         },
  'The Watcher':        { name:'Vanish',           chance:0.20, msg:'The Watcher vanishes — you cannot hit it!',                  effect:'vanish'        },
  'Soul Eater':         { name:'Soul Drain',       chance:0.30, msg:'Soul Drain! Steals 6 SP from you.',                          effect:'sp-drain'      },
  'Crypt Banshee':      { name:'Wail',             chance:0.25, msg:'The Banshee wails — your next attack is weakened!',          effect:'weaken'        },
  'Void Stalker':       { name:'Phase Shift',      chance:0.20, msg:'Void Stalker phases out — no damage this turn!',             effect:'vanish'        },
  'Blizzard Wraith':    { name:'Freeze Touch',     chance:0.25, msg:'Freeze Touch! You are frozen and skip next action!',         effect:'freeze-player' },
  'The Unmaking':       { name:'Unmake',           chance:0.20, msg:'The Unmaking removes 15 HP from your maximum!',              effect:'reduce-maxhp'  },
  'Nightmare Colossus': { name:'Crush',            chance:0.25, msg:'CRUSH! Deals double damage this hit!',                       effect:'double-dmg'    },
  'Skeleton Warrior':   { name:'Bone Shield',      chance:0.30, msg:'Bone Shield — defense bypassed!',                           effect:'ignore-def'    },
  'Ancient Skeleton':   { name:'Deathblow',        chance:0.20, msg:'Ancient Deathblow — double damage!',                         effect:'double-dmg'    },
  'Bone Archer':        { name:'Pinning Shot',     chance:0.25, msg:'Pinning Shot — you skip your next turn!',                    effect:'freeze-player' },
  'Crimson Wraith':     { name:'Life Drain',       chance:0.30, msg:'Life Drain — reduces your max HP!',                          effect:'reduce-maxhp'  },
  'Shadow Wraith':      { name:'Fade',             chance:0.25, msg:'Shadow Wraith fades — unhittable this turn!',                effect:'vanish'        },
  'Hollow Wraith':      { name:'SP Drain',         chance:0.35, msg:'Hollow Wraith drains 8 SP!',                                 effect:'sp-drain'      },
  'Giant Spider':       { name:'Web Shot',         chance:0.30, msg:'Web Shot — you skip next action!',                           effect:'freeze-player' },
  'Cave Troll':         { name:'Wild Swing',       chance:0.25, msg:'Wild Swing — unblockable strike!',                           effect:'ignore-def'    },
  'Stone Golem':        { name:'Ground Slam',      chance:0.20, msg:'Ground Slam — double damage!',                               effect:'double-dmg'    },
  'Venom Crawler':      { name:'Toxic Spit',       chance:0.35, msg:'Toxic Spit — your attack is weakened!',                      effect:'weaken'        },
  'Lich':               { name:'Curse',            chance:0.25, msg:'Cursed! Reduces your max HP by 15!',                         effect:'reduce-maxhp'  },
  'Grave Robber':       { name:'Filch',            chance:0.30, msg:'Filch! Steals 6 SP!',                                        effect:'sp-drain'      },
  'Corpse Knight':      { name:'Rend',             chance:0.25, msg:'Rend — defense bypassed!',                                   effect:'ignore-def'    },
  'Infernal Hound':     { name:'Inferno Bite',     chance:0.30, msg:'Inferno Bite — ignores armor!',                              effect:'ignore-def'    },
  'Flame Elemental':    { name:'Flare Burst',      chance:0.25, msg:'Flare Burst — double fire damage!',                          effect:'double-dmg'    },
  'Ash Specter':        { name:'Smolder',          chance:0.30, msg:'Smoldering touch weakens your attack!',                      effect:'weaken'        },
  'Frost Revenant':     { name:'Glacial Touch',    chance:0.25, msg:'Glacial Touch — you are frozen!',                            effect:'freeze-player' },
  'Ice Witch':          { name:'Shatter',          chance:0.20, msg:'Shatter — double damage!',                                   effect:'double-dmg'    },
  'Frozen Knight':      { name:'Ice Wall',         chance:0.30, msg:'Ice Wall — your attack is weakened!',                        effect:'weaken'        },
  'Mirror Shade':       { name:'Reflection',       chance:0.35, msg:'Mirror Shade reflects — double damage!',                     effect:'double-dmg'    },
  'Hollow Preacher':    { name:'Dark Sermon',      chance:0.25, msg:'Dark Sermon — 8 SP drained!',                                effect:'sp-drain'      },
  'Corrupted Hunter':   { name:'Soul Pierce',      chance:0.30, msg:'Soul Pierce — bypasses all defenses!',                       effect:'ignore-def'    },
  'Abyssal Colossus':   { name:'Abyss Slam',       chance:0.25, msg:'Abyss Slam — void-infused, ignoring armor!',                 effect:'ignore-def'    },
  'Ancient Revenant':   { name:'Ancient Curse',    chance:0.20, msg:'Ancient Curse — reduces your max HP!',                       effect:'reduce-maxhp'  },
  'Archive Specter':    { name:'Knowledge Drain',  chance:0.30, msg:'Knowledge Drain — 8 SP stolen!',                             effect:'sp-drain'      },
  'Arctic Revenant':    { name:'Permafrost',       chance:0.25, msg:'Permafrost — you are frozen!',                               effect:'freeze-player' },
  'Armored Skeleton':   { name:'Iron Retaliation', chance:0.30, msg:'Iron Retaliation — double damage!',                          effect:'double-dmg'    },
  'Ash Crawler':        { name:'Ember Spit',       chance:0.30, msg:'Ember Spit — weakens your attack!',                          effect:'weaken'        },
  'Ashen Revenant':     { name:'Ash Cloud',        chance:0.25, msg:'Ash Cloud — your attack is weakened!',                       effect:'weaken'        },
  'Ashen Wisp':         { name:'Flicker',          chance:0.35, msg:'The Ashen Wisp flickers and vanishes!',                      effect:'vanish'        },
  'Avalanche Colossus': { name:'Avalanche',        chance:0.20, msg:'Avalanche — double damage!',                                 effect:'double-dmg'    },
  'Blighted Overseer':  { name:'Blight Mark',      chance:0.25, msg:'Blight Mark — reduces your max HP!',                         effect:'reduce-maxhp'  },
  'Bloated Librarian':  { name:'Toxic Burst',      chance:0.30, msg:'Toxic Burst — weakens your attack!',                         effect:'weaken'        },
  'Blood Golem':        { name:'Blood Surge',      chance:0.25, msg:'Blood Surge — ignores armor!',                               effect:'ignore-def'    },
  'Bone Colossus':      { name:'Bone Crush',       chance:0.20, msg:'Bone Crush — double damage!',                                effect:'double-dmg'    },
  'Bone Shard':         { name:'Splinter',         chance:0.40, msg:'Splinter — bone shards pierce your armor!',                  effect:'ignore-def'    },
  'Brittle Skeleton':   { name:'Shard Burst',      chance:0.35, msg:'Shard Burst — shatters through defense!',                    effect:'ignore-def'    },
  'Cave Bat':           { name:'Screech',          chance:0.30, msg:'Screech — weakens your next attack!',                        effect:'weaken'        },
  'Char Bat':           { name:'Fire Screech',     chance:0.30, msg:'Fire Screech — burning cry weakens you!',                    effect:'weaken'        },
  'Char Stalker':       { name:'Smoldering Claw',  chance:0.25, msg:'Smoldering Claw — burns through armor!',                    effect:'ignore-def'    },
  'Cinder Wraith':      { name:'Cinder Touch',     chance:0.30, msg:'Cinder Touch — reduces your max HP!',                        effect:'reduce-maxhp'  },
  'Creaking Step':      { name:'Sudden Lunge',     chance:0.35, msg:'Sudden Lunge — you freeze in surprise!',                     effect:'freeze-player' },
  'Crypt Rat':          { name:'Gnaw',             chance:0.40, msg:'Gnaw — relentless biting ignores armor!',                    effect:'ignore-def'    },
  'Crypt Spider':       { name:'Web Wrap',         chance:0.30, msg:'Web Wrap — you skip your next action!',                      effect:'freeze-player' },
  'Cursed Knight':      { name:'Cursed Blow',      chance:0.25, msg:'Cursed Blow — reduces your max HP!',                         effect:'reduce-maxhp'  },
  'Dark Priest':        { name:'Dark Prayer',      chance:0.25, msg:'Dark Prayer — 8 SP drained!',                                effect:'sp-drain'      },
  'Dark Tendril':       { name:'Entangle',         chance:0.35, msg:'Entangle — you skip your next turn!',                        effect:'freeze-player' },
  'Deep Cartographer':  { name:'Map the Weakness', chance:0.25, msg:'Mapped your weakness — ignores defense!',                    effect:'ignore-def'    },
  'Dread Knight':       { name:'Dread Charge',     chance:0.25, msg:'Dread Charge — double damage!',                              effect:'double-dmg'    },
  'Dread Sovereign':    { name:'Sovereign Decree', chance:0.20, msg:'Sovereign Decree — reduces your max HP!',                    effect:'reduce-maxhp'  },
  'Dread Wisp':         { name:'Dread Pulse',      chance:0.30, msg:'Dread Pulse — 8 SP drained!',                                effect:'sp-drain'      },
  'Drowned Archivist':  { name:'Waterlogged Tome', chance:0.25, msg:'Waterlogged Tome — defense bypassed!',                       effect:'ignore-def'    },
  'Drowned Chancellor': { name:'Tidal Command',    chance:0.20, msg:'Tidal Command — double damage!',                             effect:'double-dmg'    },
  'Drowned Scholar':    { name:'Ink Splash',       chance:0.30, msg:'Ink Splash — your attack is weakened!',                      effect:'weaken'        },
  'Ember Reaper':       { name:'Reaping Flame',    chance:0.25, msg:'Reaping Flame — ignores all armor!',                         effect:'ignore-def'    },
  'Ember Shade':        { name:'Ember Drift',      chance:0.30, msg:'Ember Drift — vanishes in ash!',                             effect:'vanish'        },
  'Flame Wraith':       { name:'Searing Touch',    chance:0.25, msg:'Searing Touch — reduces your max HP!',                       effect:'reduce-maxhp'  },
  'Flesh Amalgam':      { name:'Absorb',           chance:0.20, msg:'Absorb — the amalgam absorbs the hit!',                      effect:'vanish'        },
  'Flesh Wraith':       { name:'Flesh Drain',      chance:0.30, msg:'Flesh Drain — 8 SP stolen!',                                 effect:'sp-drain'      },
  'Frost Reaper':       { name:'Frozen Scythe',    chance:0.25, msg:'Frozen Scythe — freezes you solid!',                         effect:'freeze-player' },
  'Frost Shade':        { name:'Frost Drift',      chance:0.30, msg:'Frost Drift — vanishes into frost!',                         effect:'vanish'        },
  'Frostbite Hound':    { name:'Freezing Bite',    chance:0.30, msg:'Freezing Bite — weakens your attack!',                       effect:'weaken'        },
  'Frozen Banshee':     { name:'Ice Wail',         chance:0.25, msg:'Ice Wail — reduces your max HP!',                            effect:'reduce-maxhp'  },
  'Frozen Husk':        { name:'Crumble Shards',   chance:0.30, msg:'Crumble Shards — ignore your armor!',                        effect:'ignore-def'    },
  'Frozen Titan':       { name:'Glacial Stomp',    chance:0.20, msg:'Glacial Stomp — double damage!',                             effect:'double-dmg'    },
  'Glacial Knight':     { name:'Frost Lance',      chance:0.25, msg:'Frost Lance — piercing ice ignores defense!',                effect:'ignore-def'    },
  'Glacial Rat':        { name:'Icy Gnaw',         chance:0.35, msg:'Icy Gnaw — weakens your attack!',                            effect:'weaken'        },
  'Grand Archivist':    { name:'Forbidden Text',   chance:0.20, msg:'Forbidden Text — 10 SP drained!',                            effect:'sp-drain'      },
  'Grave Crawler':      { name:'Grave Soil',       chance:0.30, msg:'Grave Soil — blinds, weakens your attack!',                  effect:'weaken'        },
  'Grief Made Flesh':   { name:'Overwhelming Grief',chance:0.25,msg:'Overwhelming Grief — reduces your max HP!',                  effect:'reduce-maxhp'  },
  'Hollow Bride':       { name:'Vow of Silence',   chance:0.25, msg:'Vow of Silence — 8 SP drained!',                             effect:'sp-drain'      },
  'Hollow Colossus':    { name:'Hollow Slam',      chance:0.20, msg:'Hollow Slam — ignores all defense!',                         effect:'ignore-def'    },
  'Hollow Groom':       { name:'Empty Promise',    chance:0.25, msg:'Empty Promise — 8 SP drained!',                              effect:'sp-drain'      },
  'Hollow Shade':       { name:'Hollow Touch',     chance:0.30, msg:'Hollow Touch — vanishes before your strike!',                effect:'vanish'        },
  'Ice Shard':          { name:'Splinter Shot',    chance:0.40, msg:'Splinter Shot — ice pierces your armor!',                    effect:'ignore-def'    },
  'Ice Stalker':        { name:'Studied Strike',   chance:0.25, msg:'Studied Strike — defense bypassed!',                         effect:'ignore-def'    },
  'Infernal Brute':     { name:'Brute Force',      chance:0.25, msg:'Brute Force — double damage!',                               effect:'double-dmg'    },
  'Infernal Champion':  { name:'Champion Strike',  chance:0.20, msg:'Champion Strike — ignores defense!',                         effect:'ignore-def'    },
  'Infernal Colossus':  { name:'Inferno Stomp',    chance:0.20, msg:'Inferno Stomp — double damage!',                             effect:'double-dmg'    },
  'Infernal Ember':     { name:'Ember Burst',      chance:0.35, msg:'Ember Burst — weakens your attack!',                         effect:'weaken'        },
  'Infernal Overlord':  { name:'Overlord Command', chance:0.20, msg:'Overlord Command — reduces your max HP!',                    effect:'reduce-maxhp'  },
  'Ink Wraith':         { name:'Ink Blind',        chance:0.30, msg:'Ink Blind — your attack is weakened!',                       effect:'weaken'        },
  'Leviathan Spawn':    { name:'Tidal Slam',       chance:0.25, msg:'Tidal Slam — ignores your armor!',                           effect:'ignore-def'    },
  'Leviathan of the Deep':{ name:'Crushing Depth', chance:0.15, msg:'Crushing Depth — double damage!',                            effect:'double-dmg'    },
  'Malachar the Undying':{ name:'Undying Wrath',   chance:0.20, msg:'Undying Wrath — double damage!',                             effect:'double-dmg'    },
  'Molten Knight':      { name:'Molten Strike',    chance:0.25, msg:'Molten Strike — liquid fire ignores armor!',                 effect:'ignore-def'    },
  'Nightmare Rat':      { name:'Nightmare Gnaw',   chance:0.40, msg:'Nightmare Gnaw — gnaws through armor!',                      effect:'ignore-def'    },
  'Nightmare Shade':    { name:'Nightmare Touch',  chance:0.25, msg:'Nightmare Touch — vanishes into fear!',                      effect:'vanish'        },
  'Paper Shade':        { name:'Paper Cut',        chance:0.40, msg:'Paper Cut — a thousand cuts weaken you!',                    effect:'weaken'        },
  'Permafrost Crawler': { name:'Frost Grip',       chance:0.30, msg:'Frost Grip — frozen, skip next action!',                     effect:'freeze-player' },
  'Plague Hound':       { name:'Plague Bite',      chance:0.30, msg:'Plague Bite — infected wound weakens you!',                  effect:'weaken'        },
  'Plague Wraith':      { name:'Plague Touch',     chance:0.25, msg:'Plague Touch — reduces your max HP!',                        effect:'reduce-maxhp'  },
  'Plague of Cinders':  { name:'Cinder Plague',    chance:0.25, msg:'Cinder Plague — 8 SP drained!',                              effect:'sp-drain'      },
  'Rotting Ghoul':      { name:'Putrid Swipe',     chance:0.30, msg:'Putrid Swipe — rotten claws weaken you!',                    effect:'weaken'        },
  'Scorched Husk':      { name:'Ember Burst',      chance:0.30, msg:'Ember Burst — scorched explosion ignores armor!',            effect:'ignore-def'    },
  'Scream Without Source':{ name:'Sourceless Scream',chance:0.25,msg:'Sourceless Scream — reduces your max HP!',                  effect:'reduce-maxhp'  },
  'Shadow Architect':   { name:'Redesign',         chance:0.20, msg:'Redesign — weakens your attack!',                            effect:'weaken'        },
  'Shadow Creep':       { name:'Creep',            chance:0.35, msg:'Shadow Creep vanishes before your strike!',                  effect:'vanish'        },
  'Shadow Stalker':     { name:'Shadow Strike',    chance:0.25, msg:'Shadow Strike — ignores your defense!',                      effect:'ignore-def'    },
  'Slag Crawler':       { name:'Slag Spit',        chance:0.30, msg:'Slag Spit — weakens your attack!',                           effect:'weaken'        },
  'Slag Titan':         { name:'Slag Stomp',       chance:0.20, msg:'Slag Stomp — double damage!',                                effect:'double-dmg'    },
  'Soggy Sentinel':     { name:'Waterlog',         chance:0.30, msg:'Waterlog — you skip your next action!',                      effect:'freeze-player' },
  'Soul Harvester':     { name:'Harvest',          chance:0.25, msg:'Harvest — 8 SP taken from your soul!',                       effect:'sp-drain'      },
  'Soul Harvester Prime':{ name:'Grand Harvest',   chance:0.20, msg:'Grand Harvest — reduces your max HP!',                       effect:'reduce-maxhp'  },
  'The Almost':         { name:'Almost Touch',     chance:0.30, msg:'Almost Touch — nearly real, defense bypassed!',              effect:'ignore-def'    },
  'The Ashen King':     { name:'Royal Decree',     chance:0.20, msg:'Royal Decree — double damage!',                              effect:'double-dmg'    },
  'The Ashen Throne':   { name:'Throne Command',   chance:0.20, msg:'Throne Command — reduces your max HP!',                      effect:'reduce-maxhp'  },
  'The Bell Ringer':    { name:'Toll',             chance:0.25, msg:'The Bell tolls — 10 SP drained!',                            effect:'sp-drain'      },
  'The Bone Sovereign': { name:'Sovereign Shatter',chance:0.20, msg:'Sovereign Shatter — ignores your armor!',                    effect:'ignore-def'    },
  'The Caretaker':      { name:'Caretaking',       chance:0.25, msg:'Caretaking — weakens your attack!',                          effect:'weaken'        },
  'The Cinder Colossus':{ name:'Cinder Crash',     chance:0.20, msg:'Cinder Crash — double damage!',                              effect:'double-dmg'    },
  'The Damned':         { name:'Damnation',        chance:0.25, msg:'Damnation — reduces your max HP!',                           effect:'reduce-maxhp'  },
  'The Door Warden':    { name:'Door Slam',        chance:0.30, msg:'Door Slam — you are frozen in place!',                       effect:'freeze-player' },
  'The Drowned Curator':{ name:'Waterlogged',      chance:0.25, msg:'Waterlogged — your attack is weakened!',                     effect:'weaken'        },
  'The Dungeon Itself': { name:'Collapse',         chance:0.15, msg:'COLLAPSE — the dungeon deals double damage!',                effect:'double-dmg'    },
  'The Eternal Pyre':   { name:'Eternal Flame',    chance:0.20, msg:'Eternal Flame — reduces your max HP!',                       effect:'reduce-maxhp'  },
  'The Eternal Winter': { name:'Eternal Cold',     chance:0.20, msg:'Eternal Cold — you skip your next action!',                  effect:'freeze-player' },
  'The Forgotten':      { name:'Forgotten Touch',  chance:0.30, msg:'Forgotten Touch — 8 SP drained!',                            effect:'sp-drain'      },
  'The Frozen King':    { name:'Glacial Decree',   chance:0.20, msg:'Glacial Decree — double damage!',                            effect:'double-dmg'    },
  'The Glacial Sovereign':{ name:'Glacial Command',chance:0.20, msg:'Glacial Command — reduces your max HP!',                     effect:'reduce-maxhp'  },
  'The Grieving One':   { name:'Grief Strike',     chance:0.25, msg:'Grief Strike — 8 SP drained!',                               effect:'sp-drain'      },
  'The Groundskeeper':  { name:'Upkeep',           chance:0.25, msg:'Upkeep — weakens your attack!',                              effect:'weaken'        },
  'The Hard Void':      { name:'Void Pressure',    chance:0.25, msg:'Void Pressure — ignores all defense!',                       effect:'ignore-def'    },
  'The Hollow':         { name:'Hollow Impact',    chance:0.25, msg:'Hollow Impact — double damage!',                             effect:'double-dmg'    },
  'The Hollow Matron':  { name:'Matron Curse',     chance:0.20, msg:'Matron Curse — reduces your max HP!',                        effect:'reduce-maxhp'  },
  'The Hollow One':     { name:'One Strike',       chance:0.25, msg:'One Strike — ignores your armor!',                           effect:'ignore-def'    },
  'The House Itself':   { name:'House Rules',      chance:0.20, msg:'House Rules — the house always wins. Double damage!',        effect:'double-dmg'    },
  'The Infernal Architect':{ name:'Redesign',      chance:0.20, msg:'Redesign — rewrites your defenses down!',                    effect:'reduce-maxhp'  },
  'The Last Librarian': { name:'Final Volume',     chance:0.20, msg:'Final Volume — devastating power, double damage!',           effect:'double-dmg'    },
  'The Last Resident':  { name:'Last Stand',       chance:0.20, msg:'Last Stand — nothing to lose, ignores armor!',               effect:'ignore-def'    },
  'The Music Box':      { name:'Discordant Note',  chance:0.30, msg:'Discordant Note — 10 SP drained!',                           effect:'sp-drain'      },
  'The Nameless':       { name:'Nameless Blow',    chance:0.25, msg:'Nameless Blow — undefined force ignores defense!',           effect:'ignore-def'    },
  'The Nightmare Sovereign':{ name:'Nightmare Rule',chance:0.15,msg:'Nightmare Rule — double damage!',                            effect:'double-dmg'    },
  'The Oldest Guest':   { name:'Old Grudge',       chance:0.25, msg:'Old Grudge — reduces your max HP!',                          effect:'reduce-maxhp'  },
  'The Parlor Guest':   { name:'Polite Strike',    chance:0.30, msg:'Polite Strike — courteous but bypasses defense!',            effect:'ignore-def'    },
  'The Portrait':       { name:'Painted Reality',  chance:0.25, msg:'Painted Reality — distorts perception, weakens attack!',     effect:'weaken'        },
  'The Reflection':     { name:'Mirror Strike',    chance:0.30, msg:'Mirror Strike — your own force reflected back! Double damage!',effect:'double-dmg'  },
  'The Sunken Warden':  { name:'Warden Grab',      chance:0.25, msg:'Warden Grab — immobilized in the depths!',                   effect:'freeze-player' },
  'The Twin':           { name:'Twin Strike',      chance:0.30, msg:'Twin Strike — simultaneous blow ignores all defense!',       effect:'ignore-def'    },
  'The Uninvited Guest':{ name:'Uninvited',        chance:0.25, msg:'Uninvited — unwelcome presence drains 8 SP!',                effect:'sp-drain'      },
  'The Unnamed':        { name:'Unnamed Force',    chance:0.25, msg:'Unnamed Force — bypasses your armor!',                       effect:'ignore-def'    },
  'The Unraveling':     { name:'Unravel',          chance:0.25, msg:'Unravel — reduces your max HP!',                             effect:'reduce-maxhp'  },
  'The Void Below':     { name:'Void Pull',        chance:0.25, msg:'Void Pull — pulls you in, freezing you!',                    effect:'freeze-player' },
  'The Void Given Form':{ name:'Void Manifestation',chance:0.20,msg:'Void Manifestation — true void, double damage!',             effect:'double-dmg'    },
  'The Void King':      { name:'Void Sovereignty', chance:0.15, msg:'Void Sovereignty — ignores your armor!',                     effect:'ignore-def'    },
  'The Void Sovereign': { name:'Void Command',     chance:0.15, msg:'Void Command — reduces your max HP!',                        effect:'reduce-maxhp'  },
  'The Void Walker':    { name:'Void Step',        chance:0.25, msg:'Void Step — vanishes between dimensions!',                   effect:'vanish'        },
  'The Wall Crawler':   { name:'Wall Grab',        chance:0.30, msg:'Wall Grab — frozen in place!',                               effect:'freeze-player' },
  'The Weeping Child':  { name:'Wail',             chance:0.25, msg:'The Weeping Child wails — 8 SP drained!',                    effect:'sp-drain'      },
  'The Weeping Mother': { name:'Mothers Grief',    chance:0.20, msg:'Mothers Grief — reduces your max HP!',                     effect:'reduce-maxhp'  },
  'Tide Golem':         { name:'Tidal Crush',      chance:0.25, msg:'Tidal Crush — ignores your armor!',                          effect:'ignore-def'    },
  'Tomb Bat':           { name:'Tomb Screech',     chance:0.30, msg:'Tomb Screech — weakens your attack!',                        effect:'weaken'        },
  'Venom Spitter':      { name:'Venom Spray',      chance:0.35, msg:'Venom Spray — weakens your next attack!',                    effect:'weaken'        },
  'Void Frost':         { name:'Void Chill',       chance:0.30, msg:'Void Chill — freezes you solid!',                            effect:'freeze-player' },
  'Void Husk':          { name:'Husk Touch',       chance:0.30, msg:'Husk Touch — 8 SP drained!',                                 effect:'sp-drain'      },
  'Void Phantom':       { name:'Phantom Phase',    chance:0.25, msg:'Phantom Phase — vanishes!',                                  effect:'vanish'        },
  'Void Reaper':        { name:'Void Harvest',     chance:0.20, msg:'Void Harvest — 10 SP claimed!',                              effect:'sp-drain'      },
  'Void Reaper Spawn':  { name:'Spawn Slash',      chance:0.30, msg:'Spawn Slash — strikes through armor!',                       effect:'ignore-def'    },
  'Void Reaver':        { name:'Reave',            chance:0.25, msg:'Reave — tears through your defenses!',                       effect:'ignore-def'    },
  'Void Sentinel':      { name:'Sentinel Guard',   chance:0.25, msg:'Sentinel Guard — double damage!',                            effect:'double-dmg'    },
  'Void Shadow':        { name:'Shadow Meld',      chance:0.30, msg:'Shadow Meld — disappears!',                                  effect:'vanish'        },
  'Void Spawn':         { name:'Spawn Rush',       chance:0.35, msg:'Spawn Rush — chaotic attack ignores defense!',               effect:'ignore-def'    },
  'Void Wisp':          { name:'Wisp Drain',       chance:0.35, msg:'Wisp Drain — 6 SP stolen!',                                  effect:'sp-drain'      },
  'Void Wraith':        { name:'Void Wail',        chance:0.25, msg:'Void Wail — reduces your max HP!',                           effect:'reduce-maxhp'  },
  'Volcanic Revenant':  { name:'Volcanic Surge',   chance:0.25, msg:'Volcanic Surge — lava ignores armor!',                       effect:'ignore-def'    },
  'Wailing Wraith':     { name:'Wailing Touch',    chance:0.25, msg:'Wailing Touch — reduces your max HP!',                       effect:'reduce-maxhp'  },
  'Web Stalker':        { name:'Web Trap',         chance:0.30, msg:'Web Trap — skip your next action!',                          effect:'freeze-player' },
};

function checkEnemySpecial(e, rawDmg) {
  var special = ENEMY_SPECIALS[e.name];
  if (!special) return { dmg: rawDmg, skipPlayer: false };
  if (Math.random() > special.chance) return { dmg: rawDmg, skipPlayer: false };

  addLog('⚡ ' + special.msg);
  say(special.msg);

  if (special.effect === 'ignore-def') return { dmg: rawDmg, ignoreDef: true, skipPlayer: false };
  if (special.effect === 'vanish') { addLog(e.name + ' cannot be hit this turn.'); return { dmg: 0, skipPlayer: true, skipEnemy: true }; }
  if (special.effect === 'spawn') {
    addLog('A tiny spider joins the fight! +5 extra damage this turn.');
    return { dmg: rawDmg + 5, skipPlayer: false };
  }
  if (special.effect === 'sp-drain') { DS.sp = Math.max(0, DS.sp - 6); updateXPBar(); return { dmg: rawDmg, skipPlayer: false }; }
  if (special.effect === 'weaken')  { DS.atkBonus = Math.max(0, DS.atkBonus - 2); addLog('Your attack is weakened by 2.'); return { dmg: rawDmg, skipPlayer: false }; }
  if (special.effect === 'freeze-player') { DS.frozen = true; addLog('You are frozen! Your next action will fail.'); return { dmg: rawDmg, skipPlayer: false }; }
  if (special.effect === 'reduce-maxhp') { DS.maxHp = Math.max(20, DS.maxHp - 15); DS.hp = Math.min(DS.hp, DS.maxHp); updateTopBar(); return { dmg: rawDmg, skipPlayer: false }; }
  if (special.effect === 'double-dmg') return { dmg: rawDmg * 2, skipPlayer: false };
  return { dmg: rawDmg, skipPlayer: false };
}

// ── ENEMY MECHANIC FLAGS ──
// Runs after player hits enemy — handles Infernal + community enemy flags
function applyEnemyMechanicsOnHit(e, playerDmg) {
  if (!e) return playerDmg;
  // dodgeEvery — phases out every Nth hit (Smoke Wraith, Shadow Creep …); it was in the data but nothing read it
  if (e.dodgeEvery && playerDmg > 0) {
    e._hitsTaken = (e._hitsTaken || 0) + 1;
    if (e._hitsTaken % e.dodgeEvery === 0) {
      addLog(e.name + ' phases out of reality — your attack passes through!');
      say(e.name + ' phased out.');
      return 0;
    }
  }

  // immuneFirstHit — negate first hit
  if (e.immuneFirstHit && !e._firstHitDone) {
    e._firstHitDone = true;
    addLog(e.name + ' absorbs the first blow! Immune to the opening strike.');
    say(e.name + ' is immune to the first hit.');
    return 0;
  }

  // dodgeChance — chance to dodge
  if (e.dodgeChance && Math.random() < e.dodgeChance) {
    addLog(e.name + ' dodges the attack!');
    say(e.name + ' dodged!');
    return 0;
  }

  // hiddenName — reveal on first hit
  if (e.hiddenName && !e._revealed) {
    e._revealed = true;
    e.name = e.hiddenName;
    addLog('Its true name is revealed: ' + e.name + '!');
    say('True name revealed: ' + e.name);
    updateEnemyName();
  }

  // splitsAt50 — split into two enemies at 50% HP
  if (e.splitsAt50 && !e._hasSplit && e.hp <= e.maxHp * 0.5) {
    e._hasSplit = true;
    var splitHp = Math.floor(e.hp / 2);
    e.hp = splitHp;
    e.maxHp = splitHp;
    DS._splitEnemy = { name: e.name + ' (Fragment)', hp: splitHp, maxHp: splitHp, atk: e.atk, def: e.def || 0 };
    addLog('⚡ ' + e.name + ' SPLITS at half HP! A fragment emerges with ' + splitHp + ' HP. Current enemy reduced to ' + splitHp + ' HP.');
    say(e.name + ' splits into two at half HP.');
    updateEnemyBar();
  }

  // grows — gets stronger each turn
  if (e.grows) {
    e._growStacks = (e._growStacks || 0) + 1;
    e.atk = [Math.round(e.atk[0] * 1.05), Math.round(e.atk[1] * 1.05)];
    if (e._growStacks % 3 === 0) addLog(e.name + ' grows stronger! Attack increased.');
  }

  // hollowVampire — heals 8 HP when it hits the player (called after enemy attack lands)
  if (e.hollowVampire && playerDmg > 0) {
    var vHeal = 8;
    e.hp = Math.min(e.maxHp || e.hp + vHeal, e.hp + vHeal);
    updateEnemyBar();
    addLog('🧛 ' + e.name + ' drinks deep. +' + vHeal + ' HP restored.');
    say(e.name + ' heals ' + vHeal + ' HP from your blood.');
  }

  // hollowGhost — 30% chance to completely phase through the player's attack
  if (e.hollowGhost && Math.random() < 0.30) {
    addLog('👻 ' + e.name + ' phases through your attack. It is not entirely here.');
    say(e.name + ' phased through your attack. 30 percent chance each hit.');
    return 0;
  }

  return playerDmg;
}

// Runs on enemy's turn — handles drain, lifesteal, community mechanics
function applyEnemyMechanicsOnTurn(e, dmgToPlayer) {
  if (!e) return dmgToPlayer;

  // Shadow World mechanics
  if (DS.dungeon === 'The Shadow World') {
    dmgToPlayer = applyShadowEnemyMechanics(e, dmgToPlayer);
  }


  // Coward enemies — flee if player is too strong
  if (e.coward) {
    var hpPct = DS.hp / DS.maxHp;
    var killStreak = DS._killStreak || 0;
    var flees = hpPct >= 0.80 || killStreak >= 3;
    if (flees) {
      var goldDrop = e.gold ? (rnd(e.gold[0], e.gold[1])) : 0;
      if (goldDrop > 0) { DS.gold += goldDrop; addGlobalGold(goldDrop); updateTopBar(); }
      addLog('💨 ' + e.name + ' takes one look at you and runs! ' + (goldDrop > 0 ? 'It drops ' + goldDrop + ' gold in its panic.' : 'It drops nothing.'));
      say(e.name + ' flees in terror!' + (goldDrop > 0 ? ' Dropped ' + goldDrop + ' gold.' : ''));
      DS.kills = (DS.kills || 0) + 1;
      DS._killStreak = (DS._killStreak || 0) + 1;
      applySpiritOnKill();
      // In multi-combat just remove from array, don't wipe combat state
      if (_multiCombatActive) {
        var mIdx = _multiEnemies.indexOf(e);
        if (mIdx !== -1) _multiEnemies.splice(mIdx, 1);
        if (_multiEnemies.length === 0) { setTimeout(function(){ endMultiCombat(true, false); }, 400); }
        return 0;
      }
      DS.inCombat = false; DS.enemy = null;
      setTimeout(function(){ showDgPanels(true, false, false); enterRoom(); }, 600);
      return 0;
    }
  }

  // Leprechaun — steals gold instead of dealing damage
  if (e.stealsGold) {
    var stolen = Math.min(DS.gold || 0, 10);
    DS.gold = Math.max(0, (DS.gold||0) - stolen);
    addGlobalGold(-stolen);
    updateTopBar();
    addLog('🧝 The Leprechaun steals ' + stolen + ' gold! Kill it fast!');
    say('Leprechaun steals ' + stolen + ' gold!');
    return 0; // no HP damage
  }

  // Phantom Potion — untargetable, enemy attacks miss
  if (DS._phantomTurns && DS._phantomTurns > 0) {
    DS._phantomTurns--;
    addLog('👻 Phantom — enemy attack passes through you! ' + (DS._phantomTurns > 0 ? DS._phantomTurns + ' turns left.' : 'Phantom fades.'));
    say('Attack missed! Phantom active.');
    return 0;
  }

  // Gravity Tonic — enemy ATK reduced to 1
  if (DS._gravityTurns && DS._gravityTurns > 0) {
    DS._gravityTurns--;
    if (DS._gravityTurns <= 0) addLog('🌀 Gravity fades. Enemy ATK returns.');
    return 1;
  }

  // Fog Flask — 70% miss chance
  if (DS._fogTurns && DS._fogTurns > 0) {
    DS._fogTurns--;
    if (Math.random() < 0.70) {
      addLog('🌫️ ' + e.name + ' swings wildly through the fog — missed!');
      say('Enemy missed in the fog!');
      if (DS._fogTurns <= 0) addLog('🌫️ Fog clears.');
      return 0;
    }
    if (DS._fogTurns <= 0) addLog('🌫️ Fog clears.');
  }

  // Mirror Flask — reflect next hit
  if (DS._mirrorFlask) {
    DS._mirrorFlask = false;
    var reflectDmg = Math.round(dmgToPlayer * 0.8);
    e.hp = Math.max(0, e.hp - reflectDmg);
    updateEnemyBar();
    addLog('🪞 Mirror Flask reflects the hit! ' + reflectDmg + ' damage reflected back at ' + e.name + '!');
    say('Mirror Flask! Attack reflected for ' + reflectDmg + ' damage!');
    if (e.hp <= 0) { setTimeout(function(){ enemyDead(); }, 300); return 0; }
    return 0;
  }
  if (e.footballKick) {
    var ballDmg = Math.round((e.atk[0] + e.atk[1]) / 2) + Math.floor(Math.random() * 8);
    if (DS.defending) ballDmg = Math.floor(ballDmg * 0.5);
    DS.hp = Math.max(0, DS.hp - ballDmg);
    updatePlayerBar();
    addLog('⚽ O Craque kicks the ball! It hits you square in the face for ' + ballDmg + ' damage!');
    say('O Craque kicks the ball for ' + ballDmg + ' damage!');
    return 0; // already applied damage
  }
  // The Heartbreaker — charms you, forcing you to skip your next turn
  if (e.charmsPlayer && !DS._charmResisted) {
    var charmChance = 0.35;
    if (Math.random() < charmChance) {
      DS._playerCharmed = true;
      addLog('💘 The Heartbreaker fires a charm arrow! You are charmed — you will skip your next turn.');
      say('Charmed! You will skip your next turn.');
    }
  }
  if (e.isUnluckyOne) {
    if (Math.random() < 0.50) {
      var goldStolen = Math.min(DS.gold || 0, Math.floor(Math.random() * 30) + 10);
      DS.gold = Math.max(0, (DS.gold||0) - goldStolen);
      addGlobalGold(-goldStolen);
      updateTopBar();
      if (goldStolen > 0) { addLog('🔲 The Unlucky One takes ' + goldStolen + ' gold. It does not spend gold. It just takes.'); say('Gold stolen: ' + goldStolen); }
    }
  }
  if (e.goldFlee && Math.random() < 0.30) {
    addLog('💰 The Gold Goblin flees with its gold! It escaped.');
    say('The Gold Goblin escaped!');
    if (_multiCombatActive) {
      var mgIdx = _multiEnemies.indexOf(e);
      if (mgIdx !== -1) _multiEnemies.splice(mgIdx, 1);
      if (_multiEnemies.length === 0) { setTimeout(function(){ endMultiCombat(true, false); }, 400); }
      return 0;
    }
    DS.inCombat = false;
    DS.enemy = null;
    showDgPanels(true, false, false);
    enterRoom();
    return 0;
  }

  // Clurichaun boss — gets stronger each turn
  if (e.name === 'The Clurichaun') {
    e._rage = (e._rage || 0) + 1;
    dmgToPlayer = Math.round(dmgToPlayer * (1 + e._rage * 0.1));
    if (e._rage > 1) addLog('🍺 The Clurichaun rages! +'  + (e._rage * 10) + '% damage!');
  }

  // Mirror Shade — reflects player attack stat
  if (e.mirrorAtk) {
    var reflected = DS.atk[1] + (DS.atkBonus || 0);
    dmgToPlayer = Math.max(dmgToPlayer, reflected);
    addLog(e.name + ' reflects your own strength — hits for ' + dmgToPlayer + '!');
  }

  // Debt Collector — gold drain + timer
  if (e.drainGold) {
    var stolen = Math.min(DS.gold || 0, e.drainGold);
    DS.gold = Math.max(0, (DS.gold||0) - stolen);
    addGlobalGold(-stolen);
    updateTopBar();
    if (stolen > 0) addLog('💀 Debt Collector takes ' + stolen + ' gold! Pay your debts.');
    e._debtTurns = (e._debtTurns || 0) + 1;
    if (e._debtTurns >= (e.debtTimer || 5)) {
      var lostAll = DS.gold;
      DS.gold = 0;
      addLog('💀 DEBT COLLECTED! You lose all ' + lostAll + ' gold!');
      say('All gold lost to the Debt Collector!');
    }
  }

  // preventFlee — block flee action
  if (e.preventFlee && !e._fleeWarned) {
    e._fleeWarned = true;
    addLog('⚓ The Void Anchor holds you in place. Fleeing is impossible.');
  }

  // healAllies in multi-combat
  if (e.healsAllies && _multiCombatActive) {
    _multiEnemies.forEach(function(ally) {
      if (ally !== e && ally.hp > 0) {
        ally.hp = Math.min(ally.maxHp, ally.hp + e.healsAllies);
      }
    });
    addLog(e.name + ' preaches — all allies heal ' + e.healsAllies + ' HP!');
    renderMultiEnemies();
  }
  if (e.drainHpSp) {
    var drain = Math.round(e.drainHpSp);
    DS.hp = Math.max(1, DS.hp - drain);
    DS.sp = Math.max(0, DS.sp - drain);
    e.hp = Math.min(e.maxHp, e.hp + drain);
    updatePlayerBar(); updateXPBar(); updateEnemyBar();
    addLog(e.name + ' drains ' + drain + ' HP and SP from you!');
  }

  // drainsSP — drains SP only
  if (e.drainsSP) {
    var spDrain = Math.round(e.drainsSP);
    DS.sp = Math.max(0, DS.sp - spDrain);
    updateXPBar();
    addLog(e.name + ' drains ' + spDrain + ' SP!');
  }

  // lifesteal — heals enemy for % of damage
  if (e.lifesteal && dmgToPlayer > 0) {
    var heal = Math.round(dmgToPlayer * e.lifesteal);
    e.hp = Math.min(e.maxHp, e.hp + heal);
    updateEnemyBar();
    addLog(e.name + ' lifesteals ' + heal + ' HP!');
  }

  // drainGold (community mechanic)
  if (e.drainGold && dmgToPlayer > 0) {
    var stolen = Math.min(DS.gold || 0, e.drainGold);
    DS.gold = Math.max(0, (DS.gold || 0) - stolen);
    updateTopBar();
    if (stolen > 0) addLog(e.name + ' steals ' + stolen + ' gold!');
  }

  // slowAtk — enemy gets slower over time (reduces own damage)
  if (e.slowAtk) {
    e._slowStack = (e._slowStack || 0) + 1;
    if (e._slowStack % 2 === 0) {
      e.atk = [Math.max(1, e.atk[0] - 1), Math.max(1, e.atk[1] - 1)];
    }
  }

  // buffsOnTurn1 — first turn buff
  if (e.buffsOnTurn1 && !e._buffed) {
    e._buffed = true;
    e.atk = [Math.round(e.atk[0] * 1.5), Math.round(e.atk[1] * 1.5)];
    addLog(e.name + ' surges with power on its first turn! Attack boosted.');
  }

  // Community mechanic: healPerTurns
  if (e.healPerTurns) {
    var hp = e.healPerTurns;
    var every = e.every || 3;
    e._healTurn = (e._healTurn || 0) + 1;
    if (e._healTurn % every === 0) {
      e.hp = Math.min(e.maxHp, e.hp + hp.amount);
      updateEnemyBar();
      addLog(e.name + ' heals for ' + hp.amount + ' HP!');
    }
  }

  // Community mechanic: doubleStrike
  if (e.doubleStrike) {
    var bonus = rnd(e.atk[0], e.atk[1]);
    dmgToPlayer += bonus;
    addLog(e.name + ' strikes TWICE! Extra ' + bonus + ' damage!');
  }

  return dmgToPlayer;
}

function updateEnemyName() {
  var nameEl = document.getElementById('enemy-name');
  if (nameEl && DS.enemy) nameEl.textContent = DS.enemy.name;
}

//═════════════════
// FEATURE 4: DUNGEON EVENTS SYSTEM
//═════════════════
var DUNGEON_EVENTS = [
  { id:'abyssal-singing', weight:2, type:'encounter',
    dungeons: ['The Abyssal Deep'],
    title:'The Singing',
    text:'From somewhere below, a voice drifts upward through the water. Beautiful. Wrong. A Siren call.',
    choices: [
      { label:'Follow the voice', outcome: function(){
        if (Math.random() < 0.5) {
          var item = {name:'Coral Charm',icon:'🪸',type:'rune',desc:'A charm from the deep. +8 ATK for 5 turns.',atkBoost:8,turns:5};
          DS.inventory.push(item); renderInv();
          setEvent('good','You find a Coral Charm where the voice led. It is beautiful. You take it.');
          say('You followed the singing and found a Coral Charm. Plus 8 ATK for 5 turns.');
        } else {
          var siren = {name:'Siren',icon:'🧜',hp:65,maxHp:65,atk:[12,20],gold:[9,17],sirenCharm:0.30,desc:'She was waiting.'};
          DS.enemy = siren;
          setEvent('danger','The voice belonged to a Siren. It was waiting. It is no longer singing.');
          say('The voice belonged to a Siren. Combat begins.');
          setTimeout(function(){ startCombat(false); }, 1000);
        }
      }},
      { label:'Ignore it', outcome: function(){
        setEvent('good','You walk past the corridor. The singing fades. You feel watched.');
        say('You ignore the singing. You continue deeper.');
      }},
    ]
  },
  { id:'abyssal-crack', weight:2, type:'event',
    dungeons: ['The Abyssal Deep'],
    title:'Pressure Crack',
    text:'A crack runs through the wall. Water seeps through it. The pressure here could shatter the room at any moment.',
    choices: [
      { label:'Seal the crack (costs 10 HP)', outcome: function(){
        if (DS.hp > 10) {
          DS.hp -= 10; updatePlayerBar();
          var g = 25 + DS.floor * 5;
          DS.gold += g; addGlobalGold(g);
          setEvent('good','You seal the crack with your hands. It costs you. The room holds. You find ' + g + ' gold in the wall as it seals.');
          say('Sealed the crack. Lost 10 HP. Found ' + g + ' gold.');
        } else {
          setEvent('bad','You are too weak to seal it. The crack widens.');
          say('Not enough HP to seal the crack.');
        }
      }},
      { label:'Leave it', outcome: function(){
        DS.hp = Math.max(1, DS.hp - 5); updatePlayerBar();
        setEvent('bad','The crack widens as you pass. The pressure punishes your indifference. Minus 5 HP.');
        say('The crack widens. Minus 5 HP from the pressure.');
      }},
    ]
  },
  { id:'abyssal-ship', weight:2, type:'event',
    dungeons: ['The Abyssal Deep'],
    title:'The Sunken Ship',
    text:'A wrecked vessel is wedged between the walls. Old. Very old. The hull is intact enough to search.',
    choices: [
      { label:'Search the ship', outcome: function(){
        var roll = Math.random();
        if (roll < 0.4) {
          var items = [{name:'Health Potion',icon:'🧪',type:'potion',heal:40,desc:'Restores 40 HP.'},{name:'Greater Potion',icon:'💊',type:'potion',heal:80,desc:'Restores 80 HP.'},{name:'Spirit Tonic',icon:'🔵',type:'sp-potion',sp:15,desc:'Restores 15 SP.'}];
          var found = items[Math.floor(Math.random()*items.length)];
          DS.inventory.push(found); renderInv();
          setEvent('good','Inside the hull you find a ' + found.name + '. The crew left in a hurry.');
          say('Found ' + found.name + ' in the sunken ship.');
        } else if (roll < 0.7) {
          var g = 30 + DS.floor * 8;
          DS.gold += g; addGlobalGold(g);
          setEvent('good','The captains chest is still sealed. Inside: ' + g + ' gold and nothing else. The captain valued simplicity.');
          say('Found ' + g + ' gold in the captains chest.');
        } else {
          setEvent('danger','Something was living in the ship. It is not happy.');
          var e = ABYSSAL_ENEMIES.t2[Math.floor(Math.random()*ABYSSAL_ENEMIES.t2.length)];
          var enemy = {name:e.name,icon:e.icon,hp:e.hp,maxHp:e.hp,atk:e.atk,gold:e.gold};
          DS.enemy = enemy;
          setTimeout(function(){ startCombat(false); }, 800);
        }
      }},
      { label:'Pass by', outcome: function(){
        setEvent('good','You leave the ship undisturbed. It earned its rest.');
        say('You pass by the sunken ship.');
      }},
    ]
  },
  { id:'abyssal-shrine', weight:2, type:'event',
    dungeons: ['The Abyssal Deep'],
    title:'Bioluminescent Shrine',
    text:'A glowing altar rises from the ocean floor. Ancient. The light it produces is alive.',
    choices: [
      { label:'Pray at the shrine', outcome: function(){
        var roll = Math.random();
        if (roll < 0.33) {
          DS.hp = Math.min(DS.maxHp, DS.hp + 30); updatePlayerBar();
          setEvent('good','The shrine heals you. Plus 30 HP. The light dims slightly after. A fair trade.');
          say('The shrine heals you for 30 HP.');
        } else if (roll < 0.66) {
          DS.sp = Math.min(DS.maxSp, DS.sp + 20); updateXPBar();
          setEvent('good','The shrine restores your spirit. Plus 20 SP. The ocean approves.');
          say('The shrine restores 20 SP.');
        } else {
          DS.atkBonus = (DS.atkBonus||0) + 3;
          setEvent('good','The shrine grants strength. Plus 3 ATK permanently this run.');
          say('The shrine grants plus 3 ATK for this run.');
        }
      }},
      { label:'Ignore it', outcome: function(){
        setEvent('good','You leave the shrine alone. It continues to glow behind you as you walk away.');
        say('You pass by the shrine.');
      }},
    ]
  },
  { id:'abyssal-witness', weight:1, type:'encounter',
    dungeons: ['The Abyssal Deep'],
    title:'The Witness',
    text:'A shark drifts from the dark. Large. Calm. It circles you slowly. It does not attack immediately. It watches. It has been watching for a long time.',
    choices: [
      { label:'Fight the shark', outcome: function(){
        triggerTheWitness();
      }},
    ]
  },

  { id:'julio', weight:1, type:'encounter', getWeight: function(){ var ev = getEventBonuses(); return (ev && ev.julioTriple) ? 3 : 1; },
    title:'A Familiar Stranger',
    text:'A figure sits in the corner of the room. He does not look up. His name tag reads: JULIO. You have no idea who this is or how he got here.',
    choices: [
      { label:'Talk to Julio', outcome: function(){
        incrementAchievementStat('julioFound', 1);
        familiarRecognizeJulio();
        julioRestoresSanity();
        var jFrag = collectJulioFragment();
        if (jFrag) {
          setTimeout(function() {
            setEvent('encounter', 'Julio hands you something as you talk. ' + jFrag.text + ' You have collected ' + getJulioFragments().length + ' of ' + JULIO_FRAGMENTS.length + ' fragments.');
            say('Julio fragment collected. ' + jFrag.text);
          }, 2000);
        }
        var julioCount = getAchievementStats().julioFound || 0;
        // Third or more encounter — Julio acknowledges you
        var msgs = julioCount >= 3 ? [
          'He looks up. For the first time, he looks directly at you. "You keep finding me," he says. "That is either very good or very bad." He does not say which.',
          '"You again," he says. He does not sound surprised. He sounds like someone who has never been surprised by anything. "Sit down." There is nowhere to sit. You sit anyway.',
          'He slides something across the floor. It is the DDDI founding charter. Your name is on it. You have never signed anything. "You were always going to be here," he says.',
          '"I have been here longer than the dungeon," he says. "I will be here after it ends." He hands you a Greater Potion. "You look like you need this more than I do."',
        ] : [
          'He looks up slowly. "The audit went well," he says. Then he is gone.',
          'He slides a potion across the floor without looking at you. You gain a Health Potion.',
          '"Three hundred fifty-nine million years," he says quietly. "Give or take." He does not elaborate.',
          'He hands you a crumpled note. It reads: COMPLIANCE IS MANDATORY. The handwriting is yours somehow.',
          'He nods once. You feel 10 HP restored. He returns to staring at the wall.',
          '"The Department is watching," he says. "It is always watching." He gestures vaguely at everything.',
        ];
        var roll = Math.floor(Math.random() * msgs.length);
        var msg = msgs[roll];
        if (roll === 1 && julioCount < 3) DS.inventory.push({name:'Health Potion',icon:'🧪',type:'potion',heal:40,desc:'Restores 40 HP.'});
        if (julioCount >= 3 && roll === 3) DS.inventory.push({name:'Greater Potion',icon:'💊',type:'potion',heal:80,desc:'Restores 80 HP.'});
        if (roll === 4) { DS.hp = Math.min(DS.maxHp, DS.hp + 10); updatePlayerBar(); }
        updateTopBar();
        setEvent('good', msg);
        say('Julio. ' + msg);
        addRunLog('Encountered Julio. ' + msg, 'good');
      }},
      { label:'Offer Julio gold', outcome: function(){
        if (DS.gold >= 10) {
          DS.gold -= 10; spendGlobalGold(10); updateTopBar();
          var outcomes = [
            'He accepts the gold without comment. Your max HP increases by 5.',
            'He looks at the gold. He looks at you. He puts it in his pocket. Nothing happens. Nothing was supposed to happen.',
            'He refuses. "The DDDI does not accept bribes," he says. "The DDDI accepts compliance." Your gold is returned.',
            'He takes the gold and hands you a Spirit Tonic in return.',
          ];
          var roll = Math.floor(Math.random() * outcomes.length);
          if (roll === 0) { DS.maxHp += 5; DS.hp = Math.min(DS.maxHp, DS.hp + 5); updatePlayerBar(); }
          if (roll === 2) { DS.gold += 10; addGlobalGold(10); updateTopBar(); }
          if (roll === 3) { DS.inventory.push({name:'Spirit Tonic',icon:'🔵',type:'sp-potion',sp:15,desc:'Restores 15 SP.'}); }
          setEvent('good', outcomes[roll]);
          say(outcomes[roll]);
        } else {
          setEvent('bad', 'You do not have enough gold. Julio watches you search your pockets. He says nothing. This is somehow worse.');
          say('Not enough gold. Julio is watching.');
        }
      }},
      { label:'Leave quietly', outcome: function(){
        var msgs = [
          'You back away slowly. He watches you go. His expression does not change. It never changes.',
          'As you leave you hear him say: "Noted." You do not know what he noted. You do not ask.',
          'You leave. When you glance back the room is empty. The name tag is on the floor.',
          'He waves. It is the most unsettling wave you have ever seen.',
        ];
        var msg = msgs[Math.floor(Math.random() * msgs.length)];
        setEvent('', msg);
        say(msg);
        addRunLog('Left Julio behind. ' + msg, 'info');
      }}
    ]
  },
  { id:'shrine',    weight:3, type:'shrine',
    title:'Ancient Shrine',
    text:'A crumbling shrine stands here, still faintly warm. Something about it feels like an offer.',
    choices: [
      { label:'Pray at the shrine', outcome: function(){
        var buff = ['hp','atk','def','sp'][Math.floor(Math.random()*4)];
        if(buff==='hp'){DS.hp=Math.min(DS.maxHp,DS.hp+20);say('The shrine restores 20 HP.');setEvent('shrine','The shrine warmth heals you. +20 HP.');}
        else if(buff==='atk'){DS.atkBonus+=2;say('The shrine sharpens your strikes. +2 attack.');setEvent('shrine','Your weapon feels keener. +2 attack bonus.');}
        else if(buff==='def'){DS.defBonus+=2;say('The shrine strengthens you. +2 defense.');setEvent('shrine','Your resolve hardens. +2 defense bonus.');}
        else{DS.sp=Math.min(DS.maxSp,DS.sp+8);updateXPBar();say('The shrine restores 8 SP.');setEvent('shrine','Your mind clears. +8 SP.');}
        updateTopBar();
      }},
      { label:'Leave it alone', outcome: function(){ setEvent('','You leave the shrine undisturbed.'); say('You pass the shrine by.'); }}
    ]
  },
  { id:'chest',     weight:3, type:'mystery',
    title:'Mysterious Chest',
    text:'A chest sits in the middle of the room. It was not here last time someone passed through. Or if it was, it moved.',
    choices: [
      { label:'Open the chest', outcome: function(){
        if(Math.random()<0.35){
          // Mimic!
          var mimicDmg = rnd(10,20);
          DS.hp=Math.max(0,DS.hp-mimicDmg);
          sfx('sfx-hurt'); updateTopBar();
          setEvent('danger','MIMIC! The chest attacks for '+mimicDmg+' damage!');
          say('Mimic! The chest bites you for '+mimicDmg+' damage. HP: '+DS.hp+'.');
          if(DS.hp<=0) handleDeath();
        } else {
          var g=rnd(15,35); DS.gold+=g; addGlobalGold(g);
          sfx('sfx-loot'); vibe(VIBE.loot); updateTopBar();
          setEvent('good','The chest contains '+g+' gold and something that smells like old paper.');
          say('Found '+g+' gold in the chest.');
          updateDailyQuestProgress('gold',g);
        }
      }},
      { label:'Leave it', outcome: function(){ setEvent('','You leave the chest. Some decisions are wisdom.'); say('You leave the chest alone. Probably wise.'); }}
    ]
  },
  { id:'wounded',   weight:2, type:'encounter',
    title:'Wounded Adventurer',
    text:'A figure slumps against the wall. Still breathing. Their eyes find yours and they hold up one hand — not attacking. Asking.',
    choices: [
      { label:'Give them a potion', outcome: function(){
        var pots=DS.inventory.filter(function(i){return i.type==='potion';});
        if(pots.length===0){setEvent('encounter','You have no potions to give. They nod and close their eyes.');say('No potions to give.');}
        else{
          DS.inventory.splice(DS.inventory.indexOf(pots[0]),1);
          var xpGain=40; gainXP(xpGain);
          setEvent('encounter','They drink it and their color returns. They press a coin into your hand and point down a side passage. +40 XP.');
          say('You helped them. Gained 40 XP.');
          sfx('sfx-unlock');
        }
      }},
      { label:'Keep moving', outcome: function(){ setEvent('encounter','You step over them and keep moving. The dungeon does not judge. Probably.'); say('You keep moving.'); }}
    ]
  },
  { id:'inscription',weight:2, type:'encounter',
    title:'Ancient Inscription',
    text:'Words carved into the wall in a language older than this kingdom. You can read three of them. They say something about what is below.',
    choices: [
      { label:'Study the inscription', outcome: function(){
        var xp=rnd(20,35); gainXP(xp);
        // In the Sunken Archives this is the lore fragment the daily quest asks for (nothing counted it)
        if (DS.dungeon === 'The Sunken Archives') { try { updateDailyQuestProgress('fragment', 1); } catch (eQ) {} addLog('📜 You found a lore fragment in the inscription.'); }
        setEvent('encounter','You spend time translating. Most of it is a warning. Some of it is a map. +'+xp+' XP.');
        say('Studied the inscription. Gained '+xp+' experience.');
      }},
      { label:'Move on', outcome: function(){ setEvent('','The inscription watches you leave. Inscriptions cannot watch. You are fairly certain.'); say('You leave the inscription.'); }}
    ]
  },

  // ── THE SHADOW WORLD EVENTS ──────────────────────────────────────────────

  { id:'shadow-mirror', weight:3, type:'encounter',
    dungeons: ['The Shadow World'],
    title:'The Mirror',
    text:'A mirror stands in the corridor. It should not be here. It shows you — but the version in the mirror is at full health. It looks at you with something like pity. It offers you a deal.',
    choices: [
      { label:'Accept the deal', outcome: function(){
        var oldHp = DS.hp;
        DS.hp = DS.maxHp;
        updatePlayerBar();
        addCorruption(2, 'The Mirror');
        setEvent('good','Your reflection smiles as you trade places. You are at full health. Something is different now.');
        say('You accepted. Full health restored. But 2 corruption stacks added. The mirror is empty now.');
      }},
      { label:'Ignore it', outcome: function(){
        setEvent('','You walk past. The mirror shows your reflection walking in the opposite direction. You do not look back.');
        say('You ignore the mirror. Your reflection walks away.');
      }},
      { label:'Shatter it', outcome: function(){
        if (Math.random() < 0.5) {
          var reward = {name:'Mirror Shard',icon:'🔷',type:'rune',desc:'A shard of the shadow mirror. +15 ATK for 3 turns when used.',atkBoost:15,turns:3};
          DS.inventory.push(reward); renderInv();
          setEvent('good','The mirror shatters. Something bright falls from it. You pick up a Mirror Shard.');
          say('You shattered the mirror and found a Mirror Shard. Plus 15 ATK for 3 turns.');
        } else {
          addCorruption(1, 'Mirror shards');
          setEvent('danger','The shards cut you as they fall. Shadow seeps from the cracks into you.');
          say('The mirror shatters and the shards cut you. 1 corruption stack added.');
        }
      }}
    ]
  },

  { id:'shadow-voice', weight:3, type:'encounter',
    dungeons: ['The Shadow World'],
    title:'The Voice',
    text:'You hear your own voice coming from the next room. It says something you have not said yet. It sounds frightened. You recognize the words — you will say them eventually. The question is when.',
    choices: [
      { label:'Follow the voice', outcome: function(){
        if (Math.random() < 0.6) {
          DS.gold += 120;
          updateTopBar();
          setEvent('good','You find a cache of gold where the voice led. You understand now. Your future self was trying to help.');
          say('You followed your voice and found 120 gold. Your future self was guiding you.');
        } else {
          var e = {name:'The Echo',icon:'🔄',hp:80,maxHp:80,atk:[10,18],gold:[12,20],isEcho:true,corruptOnHit:1,desc:'It was imitating your voice. It has been waiting.'};
          DS.enemy = e; DS.inCombat = true; DS.defending = false;
          playTrack(battleTrack()); updateEnemyBar(); updatePlayerBar(); setCombatBtns(true); updateSkillButtons();
          addLog('The voice was not yours. An Echo steps out of the dark.');
          say('The voice was a trap. An Echo ambushes you. It adds corruption on hit.');
        }
      }},
      { label:'Ignore it and move on', outcome: function(){
        setEvent('','You keep walking. Behind you, your voice says the frightened words anyway. You do not hear what they were.');
        say('You ignore the voice and move on. You will never know what it was trying to say.');
      }}
    ]
  },

  { id:'shadow-handwriting', weight:3, type:'encounter',
    dungeons: ['The Shadow World'],
    title:'The Handwriting',
    text:'Notes on the wall. Your handwriting. You have no memory of writing them. They describe the next enemy in precise detail — its weaknesses, its patterns, how it moves. You do not know how you knew this.',
    choices: [
      { label:'Read the notes carefully', outcome: function(){
        DS._shadowNotes = true;
        setEvent('good','You study the notes. Your next attack this floor is guaranteed to be a critical hit.');
        say('You read the notes. Your next attack is a guaranteed critical hit. You already knew this somehow.');
        addLog('📝 Shadow Notes — next attack is a guaranteed critical hit.');
      }},
      { label:'Ignore them', outcome: function(){
        setEvent('','You walk past. The notes fade as you leave, as if they were only there for you.');
        say('You ignore the notes. They were only for you anyway.');
      }}
    ]
  },

  { id:'shadow-offering', weight:3, type:'encounter',
    dungeons: ['The Shadow World'],
    title:'The Offering',
    text:'Something left on the floor. It was not there a moment ago. It is wrapped in shadow cloth. It is addressed to you — your name, your class, your current floor. Whatever left it knows exactly who you are.',
    choices: [
      { label:'Take it', outcome: function(){
        var hasOfferingCloth = DS.inventory.some(function(i){ return i.shadowItem === 'offeringCloth'; });
        var roll = hasOfferingCloth ? 0 : Math.random();
        if (hasOfferingCloth) addLog('🩶 Offering Cloth — the shadow guarantees its gift is real.');
        if (roll < 0.33) {
          var loot = SHADOW_LOOT[Math.floor(Math.random() * SHADOW_LOOT.length)];
          var item = Object.assign({}, loot);
          DS.inventory.push(item); renderInv();
          addToGlobalInventory(item);
          setEvent('good','Inside — ' + item.name + '. The offering was genuine. You are not sure that is a good thing.');
          say('You found ' + item.name + ' inside the offering.');
        } else if (roll < 0.66) {
          DS.gold += 80;
          updateTopBar();
          setEvent('good','Inside — 80 gold. The shadow knows what you need. That is terrifying.');
          say('The offering contained 80 gold.');
        } else {
          addCorruption(2, 'The Offering');
          setEvent('danger','Inside — nothing. The shadow was empty. The corruption was in the act of taking.');
          say('The offering was empty. Taking it added 2 corruption stacks.');
        }
      }},
      { label:'Leave it', outcome: function(){
        setEvent('','You walk past. When you look back, it is gone. It was only ever meant for you.');
        say('You leave the offering. It disappears as you walk away.');
      }}
    ]
  },

  // ── THE SECURITY ROOM — Camera event ──
  { id:'shadow-security-room', weight:2, type:'encounter',
    dungeons: ['The Shadow World'],
    title:'The Security Room',
    text:'',
    choices: [],
    customTrigger: function() {
      showSecurityRoomEvent();
      return true;
    }
  },

  // ── THE TWO DOORS — Full screen forced choice ──
  { id:'shadow-two-doors', weight:2, type:'encounter',
    dungeons: ['The Shadow World'],
    title:'The Two Doors',
    text:'',
    choices: [],
    customTrigger: function() {
      showTwoDoorsEvent();
      return true; // signals that this event handles its own UI
    }
  }
];

var _activeEvent = null;

function rollDungeonEvent() {
  // The Watching — no event rooms this run (announced, never applied)
  if (DS.runModNoEvents) return null;
  // 10% chance per room
  if (Math.random() > 0.10) return false;
  var pool = [];
  DUNGEON_EVENTS.forEach(function(e){
    // Dungeon-specific events — only appear in their dungeon
    if (e.dungeons && e.dungeons.indexOf(DS.dungeon) === -1) return;
    // Non-specific events should not appear in Abyssal Deep or Shadow World
    if (!e.dungeons && (DS.dungeon === 'The Abyssal Deep' || DS.dungeon === 'The Shadow World')) return;
    var w = (e.getWeight ? e.getWeight() : e.weight) || 1;
    for(var i=0;i<w;i++) pool.push(e);
  });
  if (pool.length === 0) return false;
  var ev = pool[Math.floor(Math.random()*pool.length)];
  _activeEvent = ev;

  // Custom trigger — event handles its own UI (e.g. Two Doors)
  if (ev.customTrigger) {
    return ev.customTrigger();
  }

  // Show event with choices
  setEvent('encounter', ev.title + ' — ' + ev.text);
  var actionsHtml = ev.choices.map(function(c,i){
    return '<button class="dg-act-btn" onclick="resolveEvent('+i+')" aria-label="'+c.label+'" style="margin-top:6px;">'+c.label+'</button>';
  }).join('');
  document.getElementById('dg-event').innerHTML += '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">'+actionsHtml+'</div>';
  say('Special event: ' + ev.title + '. ' + ev.text + ' ' + ev.choices.map(function(c){return c.label;}).join(' or ') + '.');
  return true;
}

function resolveEvent(choiceIdx) {
  if (!_activeEvent) return;
  var choice = _activeEvent.choices[choiceIdx];
  if (choice && choice.outcome) choice.outcome();
  _activeEvent = null;
  saveProgress();
}

// ── THE TWO DOORS — Full screen forced choice ─────────────────────────────
var _DOOR_DESCS = [
  ['A door that looks exactly like every other door you have ever opened.',
   'A door with no handle. You are not sure how it opens. You are not sure it does.'],
  ['A door that is slightly warm to the touch.',
   'A door that has your name carved into it in handwriting you do not recognize.'],
  ['A door with light coming from under it. The light is the wrong color.',
   'A door that sounds like it is breathing. Very slowly. Very deeply.'],
  ['A door made of something that is not wood and is not stone.',
   'A door that was not there when you entered this corridor.'],
  ['A door that feels like it is watching you decide.',
   'A door that opens before you touch it, then closes when you step back.'],
];

function showTwoDoorsEvent() {
  var _existing = document.getElementById('two-doors-overlay');
  if (_existing) { var _eb = _existing.querySelector('button'); if (_eb) _eb.focus(); return; }
  // Hide dungeon panels completely
  showDgPanels(false, false, false);

  var desc = _DOOR_DESCS[Math.floor(Math.random() * _DOOR_DESCS.length)];

  var ov = document.createElement('div');
  ov.id = 'two-doors-overlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'The Two Doors');
  ov.style.cssText = 'position:fixed;inset:0;background:#000;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;';

  ov.innerHTML =
    '<div style="font-family:Cinzel,serif;font-size:0.6rem;letter-spacing:0.4em;color:#9966cc;margin-bottom:16px;">THE SHADOW WORLD</div>' +
    '<div style="font-family:Cinzel,serif;font-size:1.1rem;color:#cc88ff;margin-bottom:24px;">Two Doors</div>' +
    '<div style="font-family:Cinzel,serif;font-size:0.72rem;color:#666;text-align:center;max-width:320px;line-height:1.8;margin-bottom:32px;">The corridor ends in two doors. There is no going back. You must choose one. The dungeon does not offer alternatives.</div>' +
    '<div style="width:100%;max-width:380px;display:flex;flex-direction:column;gap:16px;">' +
      '<button onclick="chooseDoor(0)" style="padding:20px 16px;background:#0a0008;border:2px solid #9966cc;color:#cc88ff;font-family:Cinzel,serif;font-size:0.72rem;cursor:pointer;text-align:left;line-height:1.7;" aria-label="Door One: ' + desc[0] + '">' +
        '<div style="color:#9966cc;margin-bottom:6px;font-size:0.6rem;letter-spacing:0.2em;">DOOR ONE</div>' +
        desc[0] +
      '</button>' +
      '<button onclick="chooseDoor(1)" style="padding:20px 16px;background:#0a0008;border:2px solid #663399;color:#aa66dd;font-family:Cinzel,serif;font-size:0.72rem;cursor:pointer;text-align:left;line-height:1.7;" aria-label="Door Two: ' + desc[1] + '">' +
        '<div style="color:#9966cc;margin-bottom:6px;font-size:0.6rem;letter-spacing:0.2em;">DOOR TWO</div>' +
        desc[1] +
      '</button>' +
    '</div>';

  document.body.appendChild(ov);
  say('The Two Doors. You must choose. Door one: ' + desc[0] + '. Door two: ' + desc[1] + '. There is no going back.');
  setTimeout(function(){ var btn = ov.querySelector('button'); if (btn) btn.focus(); }, 100);
}

// ── SECURITY ROOM — Camera Event ──
var _securityRoomTimer = null;
var _securityRoomSwallowerDir = null;

function showSecurityRoomEvent() {
  var _existing = document.getElementById('security-room-overlay');
  if (_existing) { var _eb = _existing.querySelector('button'); if (_eb) _eb.focus(); return; }
  showDgPanels(false, false, false);
  _activeEvent = null;

  // Pick which camera has the Darkness Swallower
  var dirs = ['north', 'south', 'east', 'west'];
  _securityRoomSwallowerDir = dirs[Math.floor(Math.random() * dirs.length)];
  var opposites = { north:'south', south:'north', east:'west', west:'east' };
  var escapeDir = opposites[_securityRoomSwallowerDir];
  var timeLeft = 15;

  var ov = document.createElement('div');
  ov.id = 'security-room-overlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'Security Room — find the Darkness Swallower');
  ov.style.cssText = 'position:fixed;inset:0;background:#000;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center;';

  var swallowerIcon = '<div style="position:absolute;bottom:8px;right:8px;font-size:1.4rem;opacity:0.85;" aria-hidden="true">🌑</div>';

  function makeCameraHTML(dir) {
    var isSwallower = dir === _securityRoomSwallowerDir;
    var feedContent = isSwallower
      ? '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative;">' +
          '<div style="font-size:2.2rem;opacity:0.7;filter:blur(1px);" aria-hidden="true">🌑</div>' +
          '<div style="position:absolute;bottom:4px;left:0;right:0;font-family:Cinzel,serif;font-size:0.45rem;color:#ff3333;letter-spacing:0.1em;">DETECTED</div>' +
        '</div>'
      : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">' +
          '<div style="font-size:0.5rem;color:#333;font-family:Cinzel,serif;letter-spacing:0.1em;">NO SIGNAL</div>' +
        '</div>';
    return '<div style="background:#0a0a0a;border:1px solid #222;border-radius:3px;padding:6px;position:relative;min-height:70px;display:flex;flex-direction:column;">' +
      '<div style="font-family:Cinzel,serif;font-size:0.45rem;color:#555;letter-spacing:0.2em;margin-bottom:4px;text-transform:uppercase;">CAM ' + dir.toUpperCase() + '</div>' +
      '<div style="flex:1;background:#050505;border:1px solid #111;border-radius:2px;min-height:50px;position:relative;overflow:hidden;">' +
        feedContent +
      '</div>' +
    '</div>';
  }

  ov.innerHTML =
    '<div style="font-family:Cinzel,serif;font-size:0.55rem;letter-spacing:0.4em;color:#9966cc;margin-bottom:10px;">THE SHADOW WORLD</div>' +
    '<div style="font-family:Cinzel,serif;font-size:1rem;color:#cc88ff;margin-bottom:6px;">Security Room</div>' +
    '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#666;max-width:320px;line-height:1.7;margin-bottom:14px;">Four cameras. The Darkness Swallower is on one feed. Find it — then escape the opposite direction.</div>' +
    '<div style="font-family:Cinzel,serif;font-size:1.1rem;color:#ff4444;margin-bottom:14px;" id="sec-timer" aria-live="off">:15</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;max-width:340px;margin-bottom:16px;">' +
      makeCameraHTML('north') +
      makeCameraHTML('south') +
      makeCameraHTML('east') +
      makeCameraHTML('west') +
    '</div>' +
    '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#555;margin-bottom:14px;">Escape in the <strong style="color:#cc88ff;">opposite</strong> direction from the Darkness Swallower.</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;max-width:280px;">' +
      '<button onclick="securityRoomEscape(\'north\')" style="padding:12px;background:#0a0008;border:1px solid #663399;color:#cc88ff;font-family:Cinzel,serif;font-size:0.65rem;cursor:pointer;" aria-label="Escape north">↑ North</button>' +
      '<button onclick="securityRoomEscape(\'south\')" style="padding:12px;background:#0a0008;border:1px solid #663399;color:#cc88ff;font-family:Cinzel,serif;font-size:0.65rem;cursor:pointer;" aria-label="Escape south">↓ South</button>' +
      '<button onclick="securityRoomEscape(\'east\')"  style="padding:12px;background:#0a0008;border:1px solid #663399;color:#cc88ff;font-family:Cinzel,serif;font-size:0.65rem;cursor:pointer;" aria-label="Escape east">→ East</button>' +
      '<button onclick="securityRoomEscape(\'west\')"  style="padding:12px;background:#0a0008;border:1px solid #663399;color:#cc88ff;font-family:Cinzel,serif;font-size:0.65rem;cursor:pointer;" aria-label="Escape west">← West</button>' +
    '</div>';

  document.body.appendChild(ov);

  // Play growl on the swallower camera direction for screen readers
  try {
    var pan = { north: -0.2, south: 0.2, east: 0.8, west: -0.8 }[_securityRoomSwallowerDir] || 0;
    if (AUD && AUD.ctx) {
      var gainNode = AUD.ctx.createGain();
      var panNode = AUD.ctx.createStereoPanner ? AUD.ctx.createStereoPanner() : null;
      gainNode.gain.value = 0.6;
      if (panNode) { panNode.pan.value = pan; gainNode.connect(panNode); panNode.connect(AUD.ctx.destination); }
      else { gainNode.connect(AUD.ctx.destination); }
      var snd = AUD.sfx && AUD.sfx['sfx-growl'];
      if (snd) { var src = AUD.ctx.createMediaElementSource ? null : AUD.ctx.createBufferSource(); }
    }
    // Fallback: just play the growl sfx normally
    sfx('sfx-growl');
  } catch(e) {}

  say('Security Room. Four camera feeds — North, South, East, West. Listen for the growl — it plays from the camera where the Darkness Swallower is. Then escape the opposite direction. You have 15 seconds. The growl is coming from the ' + _securityRoomSwallowerDir + '.');

  // Focus first button
  setTimeout(function() {
    var btn = ov.querySelector('button');
    if (btn) btn.focus();
  }, 100);

  // Countdown timer
  _securityRoomTimer = setInterval(function() {
    timeLeft--;
    var timerEl = document.getElementById('sec-timer');
    if (timerEl) {
      timerEl.textContent = ':' + (timeLeft < 10 ? '0' : '') + timeLeft;
      if (timeLeft <= 5) timerEl.style.color = '#ff2222';
    }
    // Only announce at 10 and 5 seconds — not every second
    if (timeLeft === 10) say('10 seconds remaining.');
    if (timeLeft === 5) say('5 seconds. Hurry.');
    if (timeLeft <= 0) {
      clearInterval(_securityRoomTimer);
      _securityRoomTimer = null;
      securityRoomCaught('time');
    }
  }, 1000);
}

function securityRoomEscape(chosenDir) {
  if (_securityRoomTimer) { clearInterval(_securityRoomTimer); _securityRoomTimer = null; }
  var ov = document.getElementById('security-room-overlay');
  if (ov) ov.remove();

  var opposites = { north:'south', south:'north', east:'west', west:'east' };
  var correctEscape = opposites[_securityRoomSwallowerDir];

  if (chosenDir === correctEscape) {
    // Success — reward
    var loot = SHADOW_LOOT[Math.floor(Math.random() * SHADOW_LOOT.length)];
    var item = Object.assign({}, loot);
    DS.inventory.push(item); renderInv();
    addToGlobalInventory(item);
    DS.gold += 50;
    updateTopBar();
    showDgPanels(true, false, false);
    setEvent('good', '📹 You spotted the Darkness Swallower on the ' + _securityRoomSwallowerDir + ' camera and fled ' + chosenDir + '. You escaped. The room rewards the aware. +' + item.name + ', +50 gold.');
    say('You escaped! The Darkness Swallower was on the ' + _securityRoomSwallowerDir + ' camera. You fled ' + chosenDir + '. You found ' + item.name + ' and 50 gold.');
    sfx('sfx-loot'); vibe(VIBE.loot);
    addLog('📹 Security Room — escaped correctly. Found ' + item.name + '.');
    _securityRoomSwallowerDir = null;
    enterRoom();
  } else {
    securityRoomCaught('wrong');
  }
}

function securityRoomCaught(reason) {
  if (_securityRoomTimer) { clearInterval(_securityRoomTimer); _securityRoomTimer = null; }
  var ov = document.getElementById('security-room-overlay');
  if (ov) ov.remove();

  var dmg = Math.round(DS.maxHp * 0.30);
  DS.hp = Math.max(1, DS.hp - dmg);
  updatePlayerBar();
  addShadowCorruption(1, 'Security Room');
  showDgPanels(true, false, false);

  var msg = reason === 'time'
    ? '📹 Time ran out. The Darkness Swallower was on the ' + _securityRoomSwallowerDir + ' camera. It was already behind you.'
    : '📹 Wrong direction. The Darkness Swallower was on the ' + _securityRoomSwallowerDir + ' camera. You ran straight toward it.';
  setEvent('danger', msg + ' ' + dmg + ' shadow damage. 1 corruption stack.');
  say(reason === 'time'
    ? 'Time ran out. The Darkness Swallower was on the ' + _securityRoomSwallowerDir + ' camera. ' + dmg + ' shadow damage. 1 corruption stack.'
    : 'Wrong direction. The Darkness Swallower was on the ' + _securityRoomSwallowerDir + ' camera. You ran toward it. ' + dmg + ' shadow damage. 1 corruption stack.');
  sfx('sfx-hit'); vibe(VIBE.hit);
  addLog('📹 Security Room — ' + (reason === 'time' ? 'time ran out' : 'wrong direction') + '. ' + dmg + ' damage.');
  _securityRoomSwallowerDir = null;
  enterRoom();
}

function chooseDoor(doorIdx) {
  var ov = document.getElementById('two-doors-overlay');
  if (ov) ov.remove();
  _activeEvent = null;

  var hasDoorKey = DS.inventory.some(function(i){ return i.shadowItem === 'doorKey'; });
  var roll = hasDoorKey ? 0 : Math.random();
  if (hasDoorKey) addLog('🗝️ Door Key — the good path is revealed.');
  if (roll < 0.4) {
    // Good outcome — chest with loot
    var loot = SHADOW_LOOT[Math.floor(Math.random() * SHADOW_LOOT.length)];
    var item = Object.assign({}, loot);
    DS.inventory.push(item); renderInv();
    addToGlobalInventory(item);
    DS.gold += 60;
    updateTopBar();
    showDgPanels(true, false, false);
    setEvent('good', '🚪 Door ' + (doorIdx + 1) + ' opens into a small room. A chest. Inside — ' + item.name + ' and 60 gold. The other door was probably worse.');
    say('You chose door ' + (doorIdx + 1) + ' and found a chest. You got ' + item.name + ' and 60 gold.');
    sfx('sfx-loot'); vibe(VIBE.loot);
    enterRoom();
  } else if (roll < 0.75) {
    // Combat outcome — enemy behind the door
    showDgPanels(false, true, false);
    var tier = DS.floor <= 3 ? 't1' : DS.floor <= 6 ? 't2' : 't3';
    var pool = SHADOW_ENEMIES[tier] || SHADOW_ENEMIES.t1;
    var template = pool[Math.floor(Math.random() * pool.length)];
    DS.enemy = Object.assign({}, template);
    DS.enemy.maxHp = DS.enemy.hp;
    DS.enemy = applyTierScaling(DS.enemy);
    DS.inCombat = true; DS.defending = false;
    playTrack(battleTrack());
    updateEnemyBar(); updatePlayerBar(); setCombatBtns(true); updateSkillButtons();
    addLog('🚪 Door ' + (doorIdx + 1) + ' opens. Something was waiting behind it.');
    say('Door ' + (doorIdx + 1) + ' opens. ' + DS.enemy.name + ' was waiting. Fight.');
  } else {
    // Corruption/neutral outcome
    addCorruption(1, 'The Wrong Door');
    showDgPanels(true, false, false);
    setEvent('danger', '🚪 Door ' + (doorIdx + 1) + ' opens into darkness. Something passes through you as you enter. Shadow corruption +1.');
    say('Door ' + (doorIdx + 1) + ' opens into nothing. Something passes through you. 1 corruption stack added.');
    enterRoom();
  }
  saveProgress();
}

//═════════════════
// FEATURE 5: BESTIARY KILL MILESTONES
//═════════════════
var BESTIARY_MILESTONES = {
  'hollow-shade':    { kills:10, reward:'Plus 1 defense vs undead.',    effect:'undeadDef'   },
  'crypt-rat':       { kills:15, reward:'Plus 5% loot find chance.',     effect:'lootChance'  },
  'death-knight':    { kills:5,  reward:'Plus 5 max HP permanently.',    effect:'hpUp'        },
  'malachar':        { kills:1,  reward:'Plus 10 max HP permanently.',   effect:'hpUpBig'     },
  'plague-hound':    { kills:10, reward:'Potions heal 10% more.',        effect:'potionUp'    },
  'soul-harvester':  { kills:5,  reward:'Plus 2 SP regen per room.',     effect:'spRegen'     },
  'bone-colossus':   { kills:3,  reward:'Plus 3 defense permanently.',   effect:'defUp'       },
  'cinder-wraith':   { kills:10, reward:'Plus 1 attack vs fire enemies.',effect:'fireAtk'     },
  'eternal-pyre':    { kills:1,  reward:'Plus 15 max HP permanently.',   effect:'hpUpBig2'    },
  'frost-shade':     { kills:10, reward:'Plus 1 defense vs ice enemies.',effect:'iceRes'      },
  'the-hollow':      { kills:5,  reward:'Plus 5 SP max permanently.',    effect:'spUp'        },
  'dungeon-itself':  { kills:1,  reward:'Plus 20 max HP permanently.',   effect:'hpUpNM'      },
  // Sunken Archives
  'drowned-archivist':{ kills:10, reward:'Plus 5 SP max permanently.',   effect:'spUp2'       },
  'tide-golem':       { kills:5,  reward:'Plus 3 defense permanently.',  effect:'defUp2'      },
  'drowned-curator':  { kills:1,  reward:'Plus 15 max HP permanently.',  effect:'hpUpSunken'  },
  'leviathan-deep':   { kills:1,  reward:'Plus 2 attack permanently.',   effect:'atkUpSunken' },
  // Hollow
  'hollow-bride':     { kills:10, reward:'Plus 1 defense permanently.',  effect:'defHollow'   },
  'behind-the-door':  { kills:5,  reward:'Plus 5 max HP permanently.',   effect:'hpHollow'    },
  'grieving-one':     { kills:1,  reward:'Plus 10 max HP permanently.',  effect:'hpBossHollow'},
  'weeping-child':    { kills:3,  reward:'Plus 3 SP max permanently.',   effect:'spHollow'    },
  // Nightmare additions
  'grief-made-flesh': { kills:5,  reward:'Plus 2 attack permanently.',   effect:'atkNM2'      },
  'the-almost':       { kills:10, reward:'Potions heal 15% more.',       effect:'potionNM'    },
};

var _earnedMilestones = {}; // real value hydrated in the DDStore.whenReady() callback
function saveMilestones() { DDStore.setItem('dd_milestones', JSON.stringify(_earnedMilestones)); }

function checkBestiaryMilestone(id) {
  var m = BESTIARY_MILESTONES[id];
  if (!m) return;
  if (_earnedMilestones[id]) return; // already earned
  var kills = bestiaryKills[id] || 0;
  if (kills >= m.kills) {
    _earnedMilestones[id] = true;
    saveMilestones();
    sfx('sfx-unlock');
    say('Bestiary Milestone! ' + id.replace(/-/g,' ') + ' — ' + m.reward);
    setEvent('good', '✦ Bestiary Milestone Unlocked: ' + m.reward);
    applyMilestoneEffect(m.effect);
  }
}

function applyMilestoneEffect(effect) {
  // Applied permanently via localStorage — checked on run start
  var effects = _jsonParseSafe(DDStore.getItem('dd_milestone_effects'), '{}');
  effects[effect] = (effects[effect] || 0) + 1;
  DDStore.setItem('dd_milestone_effects', JSON.stringify(effects));
}

function getMilestoneEffects() {
  return _jsonParseSafe(DDStore.getItem('dd_milestone_effects'), '{}');
}

function applyMilestoneBuffs() {
  var e = getMilestoneEffects();
  if (e.hpUp)     { DS.maxHp += 5;  DS.hp = Math.min(DS.maxHp, DS.hp + 5); }
  if (e.hpUpBig)  { DS.maxHp += 10; DS.hp = Math.min(DS.maxHp, DS.hp + 10); }
  if (e.hpUpBig2) { DS.maxHp += 15; DS.hp = Math.min(DS.maxHp, DS.hp + 15); }
  if (e.hpUpNM)   { DS.maxHp += 20; DS.hp = Math.min(DS.maxHp, DS.hp + 20); }
  if (e.defUp)    { DS.defBonus += 3; }
  if (e.spUp)     { DS.maxSp += 5; DS.sp = Math.min(DS.maxSp, DS.sp + 5); }
}


//═════════════════
// ACHIEVEMENT TOAST
//═════════════════
var _toastTimeout = null;

function showToast(msg, type) {
  // Simple toast notification
  var existing = document.getElementById('dd-toast');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.id = 'dd-toast';
  var bg = type === 'red' ? '#2a0000' : type === 'blue' ? '#001a2a' : type === 'gold' ? '#1a1200' : '#0a1a0a';
  var border = type === 'red' ? '#ff4444' : type === 'blue' ? '#4488ff' : type === 'gold' ? '#cc9944' : '#44ff88';
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:' + bg + ';border:1px solid ' + border + ';color:' + border + ';font-family:Cinzel,serif;font-size:0.7rem;padding:10px 20px;z-index:99998;border-radius:2px;text-align:center;max-width:80vw;pointer-events:none;';
  toast.textContent = msg;
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  setTimeout(function(){ if (toast.parentNode) toast.remove(); }, 3500);
}

function showAchievementToast(ach) {
  if (ach && ach.name) setTimeout(function(){ companionOnAchievement(ach.name); }, 2000);
  // Remove existing toast if any
  var existing = document.getElementById('ach-toast-el');
  if (existing) existing.remove();
  if (_toastTimeout) clearTimeout(_toastTimeout);

  var toast = document.createElement('div');
  toast.className = 'ach-toast';
  toast.id = 'ach-toast-el';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML =
    '<span class="ach-toast-icon" aria-hidden="true">' + ach.icon + '</span>' +
    '<div class="ach-toast-text">' +
      '<div class="ach-toast-label">Achievement Unlocked</div>' +
      '<div class="ach-toast-name">' + ach.name + '</div>' +
      '<div class="ach-toast-desc">' + ach.desc + '</div>' +
    '</div>';
  document.body.appendChild(toast);

  // Auto dismiss after 4 seconds
  _toastTimeout = setTimeout(function() {
    var el = document.getElementById('ach-toast-el');
    if (el) el.remove();
  }, 4000);
}


//═════════════════
// GLOBAL STATS TRACKING
//═════════════════
function getGlobalStats() {
  try { return _jsonParseSafe(DDStore.getItem('dd_global_stats'), '{}'); } catch(e) { return {}; }
}
function saveGlobalStats(s) { try { DDStore.setItem('dd_global_stats', JSON.stringify(s)); } catch(e) { console.warn('[DD] saveGlobalStats failed:', e); } }

function trackGlobalStat(key, amount) {
  try {
    var s = getGlobalStats();
    s[key] = (s[key] || 0) + amount;
    saveGlobalStats(s);
  } catch(e) { console.warn('[DD] trackGlobalStat failed:', e); }
}

function setGlobalStatMax(key, val) {
  try {
    var s = getGlobalStats();
    s[key] = Math.max(s[key] || 0, val);
    saveGlobalStats(s);
  } catch(e) { console.warn('[DD] setGlobalStatMax failed:', e); }
}

// Awards definition
var GLOBAL_AWARDS = [
  { id:'ga-kills-100',   name:'Century Slayer',     icon:'⚔️', desc:'Defeat 100 enemies total.',          stat:'totalKills',    target:100,  reward:'1 Mystery Coin',    rewardFn: function(){ addMysteryCoin(1); }},
  { id:'ga-kills-500',   name:'Mass Exterminator',  icon:'💀', desc:'Defeat 500 enemies total.',          stat:'totalKills',    target:500,  reward:'3 Mystery Coins',   rewardFn: function(){ addMysteryCoin(3); }},
  { id:'ga-runs-10',     name:'Seasoned Descender', icon:'🏰', desc:'Complete 10 dungeon runs.',          stat:'runsCompleted', target:10,   reward:'2 Mystery Coins',   rewardFn: function(){ addMysteryCoin(2); }},
  { id:'ga-runs-25',     name:'Veteran Explorer',   icon:'👑', desc:'Complete 25 dungeon runs.',          stat:'runsCompleted', target:25,   reward:'5 Mystery Coins',   rewardFn: function(){ addMysteryCoin(5); }},
  { id:'ga-raids-5',     name:'Raid Survivor',      icon:'⚔️', desc:'Win 5 raids.',                      stat:'raidsWon',      target:5,    reward:'2 Mystery Coins',   rewardFn: function(){ addMysteryCoin(2); }},
  { id:'ga-gold-1000',   name:'Gilded Adventurer',  icon:'💰', desc:'Earn 1000 total gold.',              stat:'totalGold',     target:1000, reward:'+10 Max HP forever',rewardFn: function(){ applyMilestoneEffect('hpUp'); }},
  { id:'ga-gold-5000',   name:'Lord of Gold',       icon:'🪙', desc:'Earn 5000 total gold.',              stat:'totalGold',     target:5000, reward:'5 Mystery Coins',   rewardFn: function(){ addMysteryCoin(5); }},
  { id:'ga-deaths-10',   name:'Stubborn Soul',      icon:'💔', desc:'Die 10 times and keep coming back.', stat:'totalDeaths',   target:10,   reward:'1 Mystery Coin',    rewardFn: function(){ addMysteryCoin(1); }},
  { id:'ga-deaths-50',   name:'The Unkillable',     icon:'🩸', desc:'Die 50 times total.',                stat:'totalDeaths',   target:50,   reward:'Second Wind free',  rewardFn: function(){ applyMilestoneEffect('secondWind'); }},
  { id:'ga-floors-50',   name:'Deep Diver',         icon:'🪜', desc:'Descend 50 floors total.',           stat:'totalFloors',   target:50,   reward:'1 Mystery Coin',    rewardFn: function(){ addMysteryCoin(1); }},
  { id:'ga-floors-100',  name:'Abyss Walker',       icon:'🌑', desc:'Descend 100 floors total.',          stat:'totalFloors',   target:100,  reward:'3 Mystery Coins',   rewardFn: function(){ addMysteryCoin(3); }},
  { id:'ga-crits-50',    name:'Critical Eye',       icon:'🎯', desc:'Land 50 critical hits.',             stat:'totalCrits',    target:50,   reward:'+2 Attack forever', rewardFn: function(){ applyMilestoneEffect('atkUp'); }},
];

function addMysteryCoin(n) {
  var cur = parseInt(DDStore.getItem('dd_mystery_coins') || '0');
  DDStore.setItem('dd_mystery_coins', String(cur + n));
  // Keep raid save in sync
  var save = getRaidSave();
  save.mysteryCoins = parseInt(DDStore.getItem('dd_mystery_coins') || '0');
  setRaidSave(save);
}

// Unified coin add — use this everywhere instead of directly touching raidSave.mysteryCoins
function addCoinsToWallet(n) {
  var cur = parseInt(DDStore.getItem('dd_mystery_coins') || '0');
  var newTotal = cur + n;
  DDStore.setItem('dd_mystery_coins', String(newTotal));
  var save = getRaidSave();
  save.mysteryCoins = newTotal;
  setRaidSave(save);
}

function getClaimedAwards() {
  return _jsonParseSafe(DDStore.getItem('dd_claimed_awards'), '[]');
}
function saveClaimedAwards(a) { DDStore.setItem('dd_claimed_awards', JSON.stringify(a)); }

function claimAward(elOrId) {
  var awardId = typeof elOrId === 'string' ? elOrId : elOrId.getAttribute('data-award');
  var award = GLOBAL_AWARDS.find(function(a){ return a.id === awardId; });
  if (!award) return;
  var claimed = getClaimedAwards();
  if (claimed.indexOf(awardId) !== -1) return;
  claimed.push(awardId);
  saveClaimedAwards(claimed);
  award.rewardFn();
  sfx('sfx-unlock');
  say('Award claimed: ' + award.name + '. Reward: ' + award.reward + '!');
  renderGlobalStats();
}

function renderGlobalStats() {
  // Emergency fallback test
  var statsPanel = document.getElementById('gs-stats-panel');
  var awardsPanel = document.getElementById('gs-awards-panel');
  var legendsPanel = document.getElementById('gs-legends-panel');
  if (!statsPanel) { console.error('gs-stats-panel NOT FOUND'); return; }
  statsPanel.innerHTML = '<p style="color:#888;font-family:Cinzel,serif;font-size:0.7rem;padding:10px;">Loading stats...</p>';
  say('Hall of Records loaded.');
  var s = getGlobalStats();
  var claimed = getClaimedAwards();
  if (!awardsPanel) return;

  // Derive some stats from CHARS
  var totalChars = CHARS.length;
  var completedRuns = CHARS.filter(function(c){ return c.completed; }).length;
  var favClass = (function(){
    var counts = {};
    CHARS.forEach(function(c){ counts[c.cls] = (counts[c.cls]||0)+1; });
    var best = null, bestN = 0;
    Object.keys(counts).forEach(function(k){ if(counts[k]>bestN){bestN=counts[k];best=k;} });
    return best || 'None yet';
  })();

  // Stats grid
  statsPanel.innerHTML =
    '<div class="gs-section" aria-label="Lifetime stats">' +
      '<div class="gs-section-title">Lifetime Statistics</div>' +
      '<div class="gs-grid">' +
        gsStatBox('Total Kills', s.totalKills||0, true) +
        gsStatBox('Total Gold', (s.totalGold||0)+'g') +
        gsStatBox('Total Deaths', s.totalDeaths||0) +
        gsStatBox('Floors Descended', s.totalFloors||0) +
        gsStatBox('Runs Started', s.runsStarted||0) +
        gsStatBox('Runs Completed', s.runsCompleted||0) +
        gsStatBox('Raids Won', s.raidsWon||0) +
        gsStatBox('Critical Hits', s.totalCrits||0) +
        gsStatBox('Potions Drunk', s.totalPotions||0) +
        gsStatBox('Best Floor', s.bestFloor||0) +
        gsStatBox('Characters', totalChars) +
        gsStatBox('Fav Class', favClass) +
      '</div>' +
    '</div>';

  // Awards
  var awardsHtml = '<div class="gs-section" aria-label="Milestone Awards">' +
    '<div class="gs-section-title">Milestone Awards</div>';

  GLOBAL_AWARDS.forEach(function(award) {
    var current = s[award.stat] || 0;
    var pct = Math.min(100, (current / award.target) * 100);
    var isClaimed = claimed.indexOf(award.id) !== -1;
    var isClaimable = current >= award.target && !isClaimed;

    awardsHtml += '<div class="gs-award ' + (isClaimable?'claimable':isClaimed?'claimed':'') + '" ' +
      'aria-label="' + award.name + '. ' + award.desc + ' Progress: ' + current + ' of ' + award.target + '. ' +
      (isClaimed ? 'Claimed.' : isClaimable ? 'Ready to claim! Reward: '+award.reward+'.' : 'Reward: '+award.reward+'.') + '">' +
      '<span class="gs-award-icon" aria-hidden="true">' + award.icon + '</span>' +
      '<div class="gs-award-info">' +
        '<div class="gs-award-name">' + award.name + '</div>' +
        '<div class="gs-award-desc">' + award.desc + '</div>' +
        '<div class="gs-award-progress">' + current + ' / ' + award.target +
          (isClaimed ? ' — Reward: ' + award.reward : '') + '</div>' +
        '<div class="gs-award-bar-wrap"><div class="gs-award-bar" style="width:'+pct+'%"></div></div>' +
      '</div>' +
      (isClaimable
        ? '<button class="gs-claim-btn" onclick="claimAward(this)" data-award="'+award.id+'" aria-label="Claim reward: '+award.reward+'">✦ Claim</button>'
        : isClaimed
        ? '<span class="gs-claimed-badge">✦ Claimed</span>'
        : '') +
    '</div>';
  });

  awardsHtml += '</div>';
  awardsPanel.innerHTML = awardsHtml;

  // Count claimable for announcement
  var claimable = GLOBAL_AWARDS.filter(function(a){
    return (s[a.stat]||0) >= a.target && claimed.indexOf(a.id) === -1;
  }).length;
  say('Hall of Records. ' + (s.totalKills||0) + ' total kills. ' + (s.runsCompleted||0) + ' runs completed. ' +
    (claimable > 0 ? claimable + ' award' + (claimable>1?'s':'') + ' ready to claim!' : 'No new awards ready.'));
}

function gsStatBox(k, v, big) {
  return '<div class="gs-stat"><div class="gs-stat-key">'+k+'</div>' +
    '<div class="gs-stat-val'+(big?' big':'')+'">'+v+'</div></div>';
}

//═════════════════
// ACCESSIBILITY OPTIONS
//═════════════════
var ACCESS = {
  verbose: true,
  combat: true,
  motion: false,
  srmode: true,
  headings: false,
  notificationsOff: false,
  selfVoice: false,
  selfVoiceRate: 1.0,
  classTraits: true,
};

function loadAccessPrefs() {
  try {
    var saved = _jsonParseSafe(DDStore.getItem('dd_access'), 'null');
    if (saved) {
      ACCESS.verbose  = saved.verbose  !== undefined ? saved.verbose  : true;
      ACCESS.combat   = saved.combat   !== undefined ? saved.combat   : true;
      ACCESS.motion   = saved.motion   !== undefined ? saved.motion   : false;
      ACCESS.srmode   = saved.srmode   !== undefined ? saved.srmode   : true;
      ACCESS.headings        = saved.headings        !== undefined ? saved.headings        : false;
      ACCESS.notificationsOff = saved.notificationsOff !== undefined ? saved.notificationsOff : false;
      ACCESS.selfVoice = saved.selfVoice !== undefined ? saved.selfVoice : false;
      ACCESS.selfVoiceRate = saved.selfVoiceRate !== undefined ? saved.selfVoiceRate : 1.0;
      ACCESS.classTraits = saved.classTraits !== undefined ? saved.classTraits : true;
    }
    // Apply reduced motion
    if (ACCESS.motion) applyReducedMotion(true);
    if (ACCESS.headings) setTimeout(function(){ injectHeadings(); }, 500);
    // Sync UI buttons
    ['verbose','combat','motion','srmode','headings','notificationsOff','selfVoice','classTraits'].forEach(function(key) {
      var btn = document.getElementById('access-'+key);
      if (btn) {
        var on = ACCESS[key];
        btn.textContent = on ? 'On' : 'Off';
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-pressed', String(on));
      }
    });
  } catch(e) {}
}

function saveAccessPrefs() {
  DDStore.setItem('dd_access', JSON.stringify(ACCESS));
}

function toggleSelfVoice() {
  ACCESS.selfVoice = !ACCESS.selfVoice;
  var btn = document.getElementById('access-selfVoice');
  if (btn) { btn.textContent = ACCESS.selfVoice ? 'On' : 'Off'; btn.className = 'toggle-btn ' + (ACCESS.selfVoice ? 'on' : 'off'); btn.setAttribute('aria-pressed', ACCESS.selfVoice); }
  var rateRow = document.getElementById('ao-rate-row');
  if (rateRow) rateRow.style.display = ACCESS.selfVoice ? '' : 'none';
  if (ACCESS.selfVoice) {
    initSelfVoiceNavigator();
    say('Self voice enabled. The game will now speak out loud. Every button tap will be announced.');
  } else if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
  saveAccessPrefs();
}

function adjustSelfVoiceRate(delta) {
  ACCESS.selfVoiceRate = Math.min(2.0, Math.max(0.5, (ACCESS.selfVoiceRate || 1.0) + delta));
  ACCESS.selfVoiceRate = Math.round(ACCESS.selfVoiceRate * 4) / 4;
  var d = document.getElementById('sv-rate-display');
  if (d) d.textContent = ACCESS.selfVoiceRate.toFixed(1);
  saveAccessPrefs();
  say('Speech rate ' + ACCESS.selfVoiceRate);
}

function toggleAccessOption(key) {
  ACCESS[key] = !ACCESS[key];
  var btn = document.getElementById('access-'+key);
  if (btn) {
    btn.textContent = ACCESS[key] ? 'On' : 'Off';
    btn.classList.toggle('on', ACCESS[key]);
    btn.setAttribute('aria-pressed', String(ACCESS[key]));
    btn.setAttribute('aria-label', btn.getAttribute('aria-label').replace(/currently (on|off)/, 'currently ' + (ACCESS[key]?'on':'off')));
  }
  if (key === 'motion') applyReducedMotion(ACCESS[key]);
  if (key === 'headings') applyHeadings(ACCESS[key]);
  saveAccessPrefs();
  var keyNames = { verbose:'Verbose mode', combat:'Combat announcements', motion:'Reduced motion', srmode:'Screen reader mode', headings:'Screen reader headings', notificationsOff:'Achievement visual notifications' };
  say((keyNames[key]||key) + ' ' + (ACCESS[key] ? 'enabled. Use H key in JAWS to jump between sections.' : 'disabled.'));
}

function applyReducedMotion(on) {
  var embers = document.getElementById('embers');
  var grain = document.querySelector('.grain');
  var vignette = document.querySelector('.vignette');
  if (embers) embers.style.display = on ? 'none' : '';
  if (grain) grain.style.animation = on ? 'none' : '';
  if (vignette) vignette.style.animation = on ? 'none' : '';
  // Stop torch flicker
  document.querySelectorAll('.torch-flame').forEach(function(t){
    t.style.animation = on ? 'none' : '';
  });
}

function say(msg) {
  if (!msg) return;
  if (!ACCESS.verbose && msg.indexOf('Floor ') === 0) return;
  if (!ACCESS.combat && (
    msg.indexOf('damage') !== -1 ||
    msg.indexOf('struck') !== -1 ||
    msg.indexOf('dealt') !== -1 ||
    msg.indexOf('misses') !== -1
  )) return;
  // Translate if enabled — check T table first, fallback to original
  var finalMsg = (_translationEnabled && _translationLang !== 'en' && typeof t === 'function') ? (t(msg) || msg) : msg;
  _saySR(finalMsg);
  if (ACCESS.selfVoice && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(finalMsg);
    u.lang = _translationLang === 'pt-BR' ? 'pt-BR' : 'en-US';
    u.rate = ACCESS.selfVoiceRate || 1.0;
    window.speechSynthesis.speak(u);
  }
}

// ── SELF VOICE — Full navigation announcer ──
// Announces every button tap for users without a screen reader
var _selfVoiceEnabled = false;
var _lastAnnouncedEl = null;

function initSelfVoiceNavigator() {
  if (_selfVoiceEnabled) return;
  _selfVoiceEnabled = true;

  // Announce on button/link click BEFORE action fires
  document.addEventListener('click', function(e) {
    if (!ACCESS || !ACCESS.selfVoice) return;
    var el = e.target;
    // Walk up to find the interactive element
    while (el && el !== document.body) {
      if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') {
        var label = el.getAttribute('aria-label') || el.textContent.trim();
        if (label && label !== _lastAnnouncedEl) {
          _lastAnnouncedEl = label;
          // Translate the label
          var translated = t(label);
          speakSelfVoice(translated);
          setTimeout(function(){ _lastAnnouncedEl = null; }, 1000);
        }
        break;
      }
      el = el.parentElement;
    }
  }, true); // capture phase so we speak before action fires

  // Announce on focus change (keyboard/swipe navigation)
  document.addEventListener('focusin', function(e) {
    if (!ACCESS || !ACCESS.selfVoice) return;
    var el = e.target;
    if (!el) return;
    var label = el.getAttribute('aria-label') || el.textContent.trim().substring(0, 100);
    var role = el.getAttribute('role') || el.tagName.toLowerCase();
    if (label && (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT' || el.tagName === 'SELECT')) {
      var translated = t(label);
      speakSelfVoice(translated + (role === 'radio' ? '. ' + t('Press to select') : ''));
    }
  });

  // Swipe detection for mobile navigation
  var _touchStartX = 0;
  var _touchStartY = 0;
  document.addEventListener('touchstart', function(e) {
    _touchStartX = e.touches[0].clientX;
    _touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    if (!ACCESS || !ACCESS.selfVoice) return;
    var dx = e.changedTouches[0].clientX - _touchStartX;
    var dy = e.changedTouches[0].clientY - _touchStartY;
    var absDx = Math.abs(dx);
    var absDy = Math.abs(dy);

    // Swipe detection — announce current focused element
    if (absDx > 50 || absDy > 50) {
      var focused = document.activeElement;
      if (focused && focused !== document.body) {
        var label = focused.getAttribute('aria-label') || focused.textContent.trim().substring(0, 80);
        if (label) speakSelfVoice(t(label));
      }
    }
  }, { passive: true });
}

function speakSelfVoice(text) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = _translationLang === 'pt-BR' ? 'pt-BR' : 'en-US';
  u.rate = (ACCESS && ACCESS.selfVoiceRate) ? ACCESS.selfVoiceRate : 1.0;
  window.speechSynthesis.speak(u);
}
// ── END SELF VOICE NAVIGATOR ──

