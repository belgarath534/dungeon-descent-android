//═════════════════
// TOURNAMENT SYSTEM
//═════════════════

// Tournament runs every 3 months for 7 days
// Seasons: Jan 1, Apr 1, Jul 1, Oct 1
var TOURNAMENT_BOSSES = [
  { id:'tournament-colossus', name:'The Eternal Colossus', icon:'🏛️', hp:500, atk:[20,35],
    desc:'An ancient construct from before the dungeons had names. It has been waiting.',
    phaseMsg2:'The Colossus awakens fully. The ground shakes.',
    phaseMsg3:'FINAL FORM — The Colossus burns with the light of a thousand defeated champions.' },
  { id:'tournament-void-sovereign', name:'The Void Sovereign', icon:'⬛', hp:480, atk:[22,38],
    desc:'Whatever rules the void between dungeons. It has a name but it will not say it.',
    phaseMsg2:'The Sovereign tears reality. Your skills cost double SP.',
    phaseMsg3:'FINAL FORM — The Void Sovereign becomes everything and nothing at once.' },
  { id:'tournament-ancient-king', name:'The Ancient King', icon:'👑', hp:520, atk:[18,32],
    desc:'He ruled before Malachar. Before the Crypt. Before everything. He is very tired of waiting.',
    phaseMsg2:'The Ancient King remembers who he was. He hits harder.',
    phaseMsg3:'FINAL FORM — The Ancient King dies as he lived. Loudly.' },
];

function getTournamentSeason() {
  var now = new Date();
  var month = now.getMonth(); // 0-11
  var year = now.getFullYear();
  // Seasons start Jan 1, Apr 1, Jul 1, Oct 1
  var seasonStarts = [
    new Date(year, 0, 1),   // Jan
    new Date(year, 3, 1),   // Apr
    new Date(year, 6, 1),   // Jul
    new Date(year, 9, 1),   // Oct
  ];
  // Find current season
  var seasonIdx = 0;
  for (var i = seasonStarts.length - 1; i >= 0; i--) {
    if (now >= seasonStarts[i]) { seasonIdx = i; break; }
  }
  var seasonStart = seasonStarts[seasonIdx];
  var tournamentEnd = new Date(seasonStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  var isActive = now >= seasonStart && now < tournamentEnd;
  // Pick boss based on season index
  var boss = TOURNAMENT_BOSSES[seasonIdx % TOURNAMENT_BOSSES.length];
  return {
    active: isActive,
    seasonIdx: seasonIdx,
    seasonStart: seasonStart,
    tournamentEnd: tournamentEnd,
    boss: boss,
    seasonName: ['Winter', 'Spring', 'Summer', 'Autumn'][seasonIdx] + ' ' + year,
    hoursLeft: isActive ? Math.max(0, Math.ceil((tournamentEnd - now) / 3600000)) : 0,
    // (from October the next season wrapped to January of this year, so the countdown went negative)
    daysUntil: !isActive ? Math.ceil(((seasonIdx === 3 ? new Date(year + 1, 0, 1) : seasonStarts[seasonIdx + 1]).getTime() - now.getTime()) / 86400000) : 0,
  };
}

function getTournamentSave() {
  return _jsonParseSafe(DDStore.getItem('dd_tournament'), '{}');
}
function saveTournament(o) { DDStore.setItem('dd_tournament', JSON.stringify(o)); }

function getTournamentBestScore() {
  var s = getTournamentSave();
  var season = getTournamentSeason();
  return s['season_' + season.seasonIdx + '_' + season.seasonStart.getFullYear()] || 0;
}

function saveTournamentScore(score) {
  var s = getTournamentSave();
  var season = getTournamentSeason();
  var key = 'season_' + season.seasonIdx + '_' + season.seasonStart.getFullYear();
  if (!s[key] || score > s[key]) {
    s[key] = score;
    saveTournament(s);
    // Upload to Firebase leaderboard
    uploadTournamentScore(score);
  }
}

// Never show an email address — older entries still have one in this field
function tnShownName(s) {
  var n = s.name || s.email || 'Anonymous';
  return n.indexOf('@') !== -1 ? n.split('@')[0].replace(/[^A-Za-z0-9]/g, '').slice(0, 3) + '***' : n;
}

async function uploadTournamentScore(score) {
  var user = getFirebaseUser();
  if (!user || !window._fbDb) return;
  var season = getTournamentSeason();
  var key = 'season_' + season.seasonIdx + '_' + season.seasonStart.getFullYear();
  try {
    await window._fbDb.collection('tournament').doc(key)
      .collection('scores').doc(user.uid)
      .set({
        uid: user.uid,
        // The leaderboard stored and showed players' real email addresses; it now
        // keeps the leaderboard name (the field name stays for older app versions)
        email: getLeaderboardName(user) || 'Anonymous',
        name: getLeaderboardName(user) || 'Anonymous',
        score: score,
        updatedAt: Date.now(),
        seasonName: season.seasonName,
      });
    console.log('Tournament score uploaded:', score);
  } catch(e) { console.error('Tournament upload failed:', e); }
}

async function loadTournamentLeaderboard() {
  var season = getTournamentSeason();
  var key = 'season_' + season.seasonIdx + '_' + season.seasonStart.getFullYear();
  try {
    if (!window._fbDb) return [];
    var snap = await window._fbDb.collection('tournament').doc(key)
      .collection('scores').orderBy('score', 'desc').limit(10).get();
    var results = [];
    snap.forEach(function(doc) { results.push(doc.data()); });
    return results;
  } catch(e) { console.error('Leaderboard load failed:', e); return []; }
}

// ── TOURNAMENT COMBAT ──
var TN = {};

function startTournament() {
  var season = getTournamentSeason();
  if (!season.active) { say('The tournament is not currently active.'); return; }
  var ch = CHARS[TN.charIdx || 0];
  if (!ch || !ch.name) { say('Please select a character first.'); return; }

  var boss = season.boss;
  var maxHp = (HP_MAP[ch.cls] || 100) + 30;

  TN = {
    charIdx: TN.charIdx || 0,
    charName: ch.name,
    cls: ch.cls,
    hp: maxHp, maxHp: maxHp,
    atk: [12, 22],
    atkBonus: ch.atkBonus || 0,
    defBonus: ch.defBonus || 0,
    bossHp: boss.hp, bossTotalHp: boss.hp,
    boss: boss,
    phase: 1,
    damageDealt: 0,
    turnsUsed: 0,
    active: true,
  };

  goTo('tournament-combat');
  renderTNCombat();
  playTrack('boss');
  say('Tournament fight begins! Face ' + boss.name + '. HP: ' + boss.hp + '. Deal as much damage as possible. Your damage score is what counts.');
  setTimeout(function() {
    var btn = document.querySelector('#screen-tournament-combat .tn-btn');
    if (btn) btn.focus();
  }, 200);
}

function renderTNCombat() {
  var bpct = Math.max(0, Math.round((TN.bossHp / TN.bossTotalHp) * 100));
  var ppct = Math.max(0, Math.round((TN.hp / TN.maxHp) * 100));
  document.getElementById('tn-boss-name').textContent = TN.boss.icon + ' ' + TN.boss.name;
  document.getElementById('tn-boss-hp').textContent = TN.bossHp + ' / ' + TN.bossTotalHp + ' HP';
  document.getElementById('tn-boss-bar').style.width = bpct + '%';
  document.getElementById('tn-player-hp').textContent = TN.hp + ' / ' + TN.maxHp + ' HP';
  document.getElementById('tn-player-bar').style.width = ppct + '%';
  document.getElementById('tn-score').textContent = 'Damage: ' + TN.damageDealt;

  // Phase label
  var phaseEl = document.getElementById('tn-phase');
  if (phaseEl) phaseEl.textContent = TN.phase === 1 ? 'Phase 1' : TN.phase === 2 ? 'Phase 2' : 'Final Phase';
}

function tnAttack(type) {
  if (!TN.active) return;

  // Player attack
  var base = rnd(TN.atk[0], TN.atk[1]) + TN.atkBonus;
  if (type === 'heavy') {
    if (Math.random() < 0.30) {
      base = 0;
      addTNLog('Heavy strike misses!');
      say('Heavy strike missed.');
    } else {
      base = Math.round(base * 1.7);
    }
  }
  if (type === 'defend') base = Math.round(base * 0.4);

  TN.bossHp = Math.max(0, TN.bossHp - base);
  TN.damageDealt += base;
  // Contribute to global VR
  TN.turnsUsed++;

  var msg = type === 'heavy' && base > 0 ? t('Heavy strike — ') + base + t(' damage!') :
            type === 'defend' ? t('Defend and counter — ') + base + t(' damage.') :
            t('Attack — ') + base + t(' damage!');
  addTNLog(msg, 'good');
  say(msg + t(' Boss HP: ') + TN.bossHp + t('. Total damage: ') + TN.damageDealt + '.');

  // Phase transitions
  if (TN.bossHp <= Math.round(TN.bossTotalHp * 0.66) && TN.phase === 1) {
    TN.phase = 2;
    var p2msg = TN.boss.phaseMsg2 || 'Phase 2!';
    addTNLog('⚡ ' + p2msg, 'bad');
    say('Phase 2. ' + p2msg);
  }
  if (TN.bossHp <= Math.round(TN.bossTotalHp * 0.33) && TN.phase === 2) {
    TN.phase = 3;
    var p3msg = TN.boss.phaseMsg3 || 'Final phase!';
    addTNLog('⚡ ' + p3msg, 'bad');
    say('Final phase. ' + p3msg);
  }

  // Boss defeated
  if (TN.bossHp <= 0) {
    tnVictory(); return;
  }

  // Boss counterattack
  var bAtk = rnd(TN.boss.atk[0], TN.boss.atk[1]);
  if (TN.phase === 2) bAtk = Math.round(bAtk * 1.25);
  if (TN.phase === 3) bAtk = Math.round(bAtk * 1.5);
  var def = TN.defBonus;
  if (type === 'defend') bAtk = Math.max(1, Math.round(bAtk * 0.4));
  var taken = Math.max(1, bAtk - def);
  TN.hp = Math.max(0, TN.hp - taken);
  addTNLog(TN.boss.name + t(' strikes for ') + taken + '.', 'bad');
  say(TN.boss.name + t(' attacks for ') + taken + t('. Your HP: ') + TN.hp + '.');

  renderTNCombat();

  if (TN.hp <= 0) { tnDeath(); return; }
}

function addTNLog(msg, type) {
  var log = document.getElementById('tn-log');
  if (!log) return;
  var div = document.createElement('div');
  div.style.color = type === 'good' ? '#a0e0ff' : type === 'bad' ? '#ff8888' : '#aaa';
  div.textContent = (typeof t === 'function') ? t(msg) : msg;
  log.insertBefore(div, log.firstChild);
}

function tnVictory() {
  TN.active = false;
  playTrack('menu');
  // Calculate score — damage + speed bonus + survival bonus
  var speedBonus = Math.max(0, 500 - (TN.turnsUsed * 10));
  var survivalBonus = Math.round((TN.hp / TN.maxHp) * 300);
  var totalScore = TN.damageDealt + speedBonus + survivalBonus;

  saveTournamentScore(totalScore);

  document.getElementById('tn-result-title').textContent = '👑 Boss Defeated!';
  document.getElementById('tn-result-score').textContent = totalScore + ' pts';
  document.getElementById('tn-result-breakdown').innerHTML =
    'Damage: ' + TN.damageDealt + ' pts<br>' +
    'Speed bonus: ' + speedBonus + ' pts<br>' +
    'Survival bonus: ' + survivalBonus + ' pts';
  document.getElementById('tn-result-best').textContent = 'Your best this season: ' + getTournamentBestScore() + ' pts';
  document.getElementById('screen-tournament-result').style.display = '';
  document.getElementById('screen-tournament-combat').classList.remove('active');
  document.getElementById('screen-tournament-result').classList.add('active');

  say('Victory! Total score: ' + totalScore + ' points. Damage: ' + TN.damageDealt + '. Speed bonus: ' + speedBonus + '. Survival bonus: ' + survivalBonus + '. Score uploaded to leaderboard.');

  // Award mystery coins for beating the boss
  var raidSave = getRaidSave();
  addCoinsToWallet(5);
  saveRaidData(raidSave);
  incrementAchievementStat('tournamentWins', 1);
  checkAchievements();
}

function tnDeath() {
  TN.active = false;
  playTrack('menu');
  // Still save score — damage dealt counts even if you died
  var totalScore = TN.damageDealt;
  saveTournamentScore(totalScore);

  document.getElementById('tn-result-title').textContent = '💀 Defeated';
  document.getElementById('tn-result-score').textContent = totalScore + ' pts';
  document.getElementById('tn-result-breakdown').innerHTML =
    'Damage dealt: ' + TN.damageDealt + ' pts<br>No speed or survival bonus.';
  document.getElementById('tn-result-best').textContent = 'Your best this season: ' + getTournamentBestScore() + ' pts';
  document.getElementById('screen-tournament-result').style.display = '';
  document.getElementById('screen-tournament-combat').classList.remove('active');
  document.getElementById('screen-tournament-result').classList.add('active');

  say('Defeated. Your damage score of ' + totalScore + ' points has been recorded. Try again to improve your score.');
}

function renderTournamentScreen() {
  var season = getTournamentSeason();
  var best = getTournamentBestScore();

  var statusEl = document.getElementById('tn-status');
  var bossEl = document.getElementById('tn-boss-preview');
  var startBtn = document.getElementById('tn-start-btn');
  var charList = document.getElementById('tn-char-list');
  var lbEl = document.getElementById('tn-leaderboard');
  setTimeout(function(){ injectCharSlider('tn-char-list'); }, 50);

  if (statusEl) {
    if (season.active) {
      statusEl.innerHTML = '<span style="color:#ffdd44;">🏆 ' + season.seasonName + ' Tournament — ACTIVE</span><br>' +
        '<span style="font-size:0.7rem;color:#888;">' + season.hoursLeft + ' hours remaining</span>';
      say('Tournament active. ' + season.seasonName + '. ' + season.hoursLeft + ' hours remaining.');
    } else {
      statusEl.innerHTML = '<span style="color:#888;">Next tournament in ' + season.daysUntil + ' days</span>';
      say('Tournament not active. Next tournament in ' + season.daysUntil + ' days.');
    }
  }

  if (bossEl && season.boss) {
    bossEl.innerHTML = '<div style="font-size:2rem;">' + season.boss.icon + '</div>' +
      '<div style="font-family:Cinzel,serif;color:#ffdd44;">' + season.boss.name + '</div>' +
      '<div style="font-size:0.7rem;color:#888;margin-top:4px;">' + season.boss.desc + '</div>' +
      '<div style="font-size:0.7rem;color:#aaa;margin-top:4px;">HP: ' + season.boss.hp + '</div>';
  }

  if (best > 0 && lbEl) {
    lbEl.innerHTML = '<div style="color:#888;font-size:0.7rem;font-family:Cinzel,serif;">Your best this season: <span style="color:#ffdd44;">' + best + ' pts</span></div>';
  }

  // Render char list
  if (charList) {
    charList.innerHTML = '';
    CHARS.forEach(function(ch, i) {
      if (!ch || !ch.name) return;
      var btn = document.createElement('button');
      btn.className = 'raid-char-btn' + (i === 0 ? ' selected' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
      btn.setAttribute('aria-label', ch.name + ', ' + ch.cls + ', Level ' + (ch.persistLevel||1));
      btn.textContent = ch.name + ' — ' + ch.cls + ' (Lv ' + (ch.persistLevel||1) + ')';
      btn.onclick = function() {
        document.querySelectorAll('#tn-char-list .raid-char-btn').forEach(function(b) {
          b.setAttribute('aria-checked', 'false'); b.classList.remove('selected');
        });
        btn.setAttribute('aria-checked', 'true'); btn.classList.add('selected');
        TN.charIdx = i;
      };
      if (i === 0) TN.charIdx = 0;
      charList.appendChild(btn);
    });
  }

  if (startBtn) startBtn.disabled = !season.active;

  // Load leaderboard async
  if (season.active && lbEl) {
    loadTournamentLeaderboard().then(function(scores) {
      if (scores.length === 0) return;
      var html = '<div style="font-family:Cinzel,serif;font-size:0.6rem;letter-spacing:0.2em;color:#888;margin-bottom:8px;">TOP SCORES THIS SEASON</div>';
      scores.forEach(function(s, i) {
        html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #1a1a1a;">' +
          '<span style="color:' + (i===0?'#ffdd44':i===1?'#aaaaaa':i===2?'#cc8844':'#666') + ';">' +
          (i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)) + ' ' + tnShownName(s) + '</span>' +
          '<span style="color:#ffdd44;">' + s.score + ' pts</span></div>';
      });
      if (lbEl) lbEl.innerHTML = html;
      say('Leaderboard loaded. Top score: ' + scores[0].score + ' points by ' + tnShownName(scores[0]));
    });
  }
}


//═════════════════
// CHARACTER TRAITS
//═════════════════
var CLASS_TRAITS = {
  'Warrior':    { name:'Battle Hardened',  desc:'+1 attack every 3 floors. Hits harder the deeper you go.' },
  'Monk':       { name:'Iron Body',         desc:'Defense doubles when HP drops below 30%.' },
  'Assassin':   { name:'First Blood',       desc:'First hit every combat is always a critical strike.' },
  'Paladin':    { name:'Divine Presence',   desc:'Weeping Child always auto-soothed. Holy skills 20% stronger.' },
  'Naturalist': { name:'One With The Wild', desc:'Hollow weather bonuses doubled.' },
  'Sorcerer':   { name:'Glass Cannon',      desc:'Skills cost 3 less SP. Max HP capped at 80%.' },
  'Necromancer':{ name:'Death Follows',     desc:'15% chance a killed enemy fights for you next room.' },
  'Berserker':  { name:'No Retreat',        desc:'Cannot flee. Damage increases as HP drops.' },
  'Bard':       { name:'Silver Tongue',     desc:'Enemies have a 10% chance to leave without fighting.' },
  'Alchemist':  { name:'Master Brewer',     desc:'Potions heal double. Starts with 2 extra potions.' },
  'BloodKnight':{ name:'Blood Harvest',     desc:'Gains 5 HP from every kill. Loses 2 HP each floor.' },
  'Druid':      { name:'Nature\'s Bond',   desc:'+3 HP per room in The Hollow.' },
  'Warlock':    { name:'Soul Drain',        desc:'Drains 5 HP from every kill to heal yourself.' },
  'DeathKnight':{ name:'Undying Resolve',   desc:'Survive one killing blow per run at 1 HP.' },
  'Ranger':     { name:'Opening Shot',      desc:'First hit every combat deals 75% bonus damage. +15% flee chance.' },
  'Sentinel':   { name:'Iron Bulwark',      desc:'Take 25% less damage from all sources. Deal 20% less damage. Built to outlast.' },
  'Cleric':     { name:'Sacred Healer',     desc:'Potions heal triple. Can only carry one potion at a time.' },
  'Wizard':       { name:'Arcane Study',       desc:'Reveals enemy HP and attack range at combat start. Starts each run with a Spell Scroll.' },
  'Elementalist': { name:'Elemental Mastery',  desc:'Fire, ice and lightning spells deal 40% more damage. Starts with one elemental scroll.' },
  'VoidWalker':   { name:'Void Touched',       desc:'Void spells never miss. 15% chance to phase through enemy attacks completely.' },
  'ShadowMage':   { name:'Shadow Affinity',    desc:'Shadow spells cost 0 cooldown turns. Attacks from darkness deal +25% damage.' },
  'TimeMage':     { name:'Time Mastery',       desc:'Time spells have 3 turn cooldown instead of 6. First combat each floor always wins initiative.' },
  'Shaman':       { name:'Earth Bond',         desc:'Earthshake always buffs you. Weather effects give double bonuses. +4 DEF outdoors.' },
  'Arcanist':     { name:'Pure Arcane',        desc:'All spells cast at full power regardless of class. Learns any scroll at 95% success rate.' },
};

function applyClassTraits(ch) {
  if (!ACCESS.classTraits) return;
  var trait = CLASS_TRAITS[ch.cls];
  if (!trait) return;
  switch(ch.cls) {
    case 'Sorcerer':
      DS.maxHp = Math.round(DS.maxHp * 0.80);
      DS.hp = Math.min(DS.hp, DS.maxHp);
      DS.traitSpDiscount = 3;
      break;
    case 'Alchemist':
      DS.potionMult = (DS.potionMult||1) * 2;
      DS.inventory.push({name:'Health Potion',icon:'🧪',type:'potion',heal:40,desc:'Restores 40 HP.'});
      DS.inventory.push({name:'Health Potion',icon:'🧪',type:'potion',heal:40,desc:'Restores 40 HP.'});
      break;
    case 'BloodKnight': DS.bloodKnightTrait = true; break;
    case 'Druid':       DS.druidHollowTrait = true; break;
    case 'Warlock':     DS.warlockDrainTrait = true; break;
    case 'DeathKnight': DS.deathKnightRevive = true; break;
    case 'Cleric':
      DS.potionMult = (DS.potionMult||1) * 3;
      DS.clericTrait = true;
      break;
    case 'Berserker':   DS.berserkerTrait = true; break;
    case 'Assassin':    DS.assassinFirstBlood = true; break;
    case 'Wizard':
      DS.inventory.push({name:'Spell Scroll',icon:'📜',type:'sp-potion',sp:40,desc:'Arcane scroll. Restores 40 SP.'});
      DS.wizardStudy = true;
      break;
    case 'Elementalist':
      DS._elementalist = true;
      DS.inventory.push({name:'Elemental Scroll',icon:'🔥',type:'scroll',spellId:'soulfire',desc:'An elemental spell scroll.'});
      break;
    case 'VoidWalker':
      DS._voidWalker = true;
      DS._voidPhaseChance = 0.15;
      break;
    case 'ShadowMage':
      DS._shadowMage = true;
      DS._shadowCooldownFree = true;
      break;
    case 'TimeMage':
      DS._timeMage = true;
      DS._timeMageCooldownReduction = true;
      break;
    case 'Shaman':
      DS._shaman = true;
      DS._earthshakeAlwaysBuff = true;
      // +4 DEF outdoors (the Ashbound Wastes, Frosthold and the Whispering Forest) — never applied
      if (['The Ashbound Wastes','Frosthold Abyss','The Whispering Forest'].indexOf(DS.dungeon) !== -1) DS.defBonus += 4;
      break;
    case 'Arcanist':
      DS._arcanist = true;
      DS._arcanistFullPower = true;
      break;
  }
  setTimeout(function() {
    setEvent('good', '✦ Class Trait: ' + trait.name + ' — ' + trait.desc);
    say('Class trait. ' + trait.name + '. ' + trait.desc);
  }, 3000);
}

function applyTraitPerFloor() {
  if (!ACCESS.classTraits) return;
  if (DS.cls === 'Warrior' && DS.floor % 3 === 0) {
    DS.atkBonus += 1;
    addRunLog('Battle Hardened — +1 attack. Total: ' + DS.atkBonus, 'good');
  }
  if (DS.bloodKnightTrait) {
    DS.hp = Math.max(1, DS.hp - 2);
    updatePlayerBar();
    addLog('Blood Harvest — -2 HP this floor.');
  }
  // (Nature's Bond says "+3 HP per room"; it healed once a floor — now in enterRoom)
  if (DS.cls === 'Dragonborn' && ACCESS.classTraits) {
    DS.dragonbornBonus = 1 + (DS.floor * 0.05);
  }
}

function applyTraitOnKill(enemy) {
  if (!ACCESS.classTraits) return;
  if (DS.warlockDrainTrait) {
    DS.hp = Math.min(DS.maxHp, DS.hp + 5);
    updatePlayerBar();
    addLog('Soul Drain — +5 HP from ' + enemy.name + '.');
  }
  if (DS.bloodKnightTrait) {
    DS.hp = Math.min(DS.maxHp, DS.hp + 5);
    updatePlayerBar();
    addLog('Blood Harvest — +5 HP from kill.');
  }
  if (DS.cls === 'Necromancer' && Math.random() < 0.15) {
    DS.necroRaisedEnemy = true;
    addLog('Death Follows — ' + enemy.name + ' will rise to serve you next room.');
    addRunLog('Necromancer raised ' + enemy.name, 'good');
  }
}

