// ═══════════════════════════════════════════════════════════════════════
// v12.0 — THE BATTLE PASS (the same rules and save as the iPhone app's
// BattlePass.swift, so the pass travels with the cloud save)
// An 8-week season of 50 tiers (500 Pass XP each), earned by playing, never
// bought. Everything gives Pass XP; five weekly quests (the same for every
// player) give 250 more each; each tier pays as you reach it: gold, Mystery
// Coins and Soul Fragments every 5th tier, season titles at 25 and 50.
// ═══════════════════════════════════════════════════════════════════════

var BP = {
  tiers: 50, perTier: 500, questXP: 250, seasonDays: 56,
  first: Date.UTC(2026, 10, 23), // Monday 23 November 2026
  xp: { kill: 5, elite: 15, boss: 60, floor: 10, clear: 150, worldboss: 10, weekly: 100, endless: 2, spire: 5, daily: 50 },
  pool: [
    { id: 'kills', text: 'Defeat 60 enemies', target: 60 },
    { id: 'elites', text: 'Defeat 8 elite enemies', target: 8 },
    { id: 'bosses', text: 'Defeat 3 bosses', target: 3 },
    { id: 'floors', text: 'Reach 25 new floors in dungeon runs', target: 25 },
    { id: 'clears', text: 'Clear 2 dungeons', target: 2 },
    { id: 'worldboss', text: 'Strike the World Boss 15 times', target: 15 },
    { id: 'weekly', text: 'Finish a Weekly Ladder run', target: 1 },
    { id: 'endless', text: 'Descend 50 floors in Endless Descent', target: 50 },
    { id: 'spire', text: 'Climb 15 floors of The Spire', target: 15 }
  ]
};

function bpSeason(now) {
  now = now || Date.now();
  var span = BP.seasonDays * 86400000;
  var n = Math.max(0, Math.floor((now - BP.first) / span));
  var start = BP.first + n * span;
  return { number: n + 1, start: start, end: start + span, key: 'dd_pass_s' + (n + 1),
           daysLeft: Math.max(0, Math.ceil((start + span - now) / 86400000)) };
}

// This ISO week (UTC) and its five quests: the same seed as the app.
function bpQuests(now) {
  var d = new Date(now || Date.now());
  var day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  var dow = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - dow + 3);
  var y = day.getUTCFullYear();
  var jan4 = new Date(Date.UTC(y, 0, 4));
  var w = 1 + Math.round(((day - jan4) / 86400000 - 3 + (jan4.getUTCDay() + 6) % 7) / 7);
  var pool = BP.pool.slice(), picked = [], s = y * 100 + w + 9000000;
  while (picked.length < 5 && pool.length) {
    var i = Math.floor(_seededRandom(s) * pool.length) % pool.length;
    picked.push(pool.splice(i, 1)[0]);
    s++;
  }
  return { week: y + '-W' + (w < 10 ? '0' : '') + w, quests: picked };
}

function bpReward(t, season) {
  if (t === 50) return [{ title: 'S' + season + 'Legend' }, { coins: 10, fragments: 5 }];
  if (t === 25) return [{ title: 'S' + season + 'Veteran' }, { coins: 5, fragments: 3 }];
  if (t % 5 === 0) return [{ coins: 3, fragments: 2 }];
  return [{ gold: 150 + 25 * t }];
}
function bpRewardText(r) {
  return r.map(function(x) {
    return x.gold ? x.gold + ' gold' : x.title ? 'the title ' + x.title : x.coins + ' Mystery Coins and ' + x.fragments + ' Soul Fragments';
  }).join(' and ');
}
function bpPay(r) {
  r.forEach(function(x) {
    if (x.gold) addGlobalGold(x.gold);
    if (x.coins) { try { addCoinsToWallet(x.coins); } catch (e) {} }
    if (x.fragments) DDStore.setItem('dd_soul_fragments', String((parseInt(DDStore.getItem('dd_soul_fragments') || '0', 10) || 0) + x.fragments));
    if (x.title) {
      var t = _jsonParseSafe(DDStore.getItem('dd_unlocked_titles'), '[]');
      if (t.indexOf(x.title) === -1) { t.push(x.title); DDStore.setItem('dd_unlocked_titles', JSON.stringify(t)); }
    }
  });
}

function bpLoad(now) {
  var p = _jsonParseSafe(DDStore.getItem(bpSeason(now).key), '{}') || {};
  p.xp = p.xp || 0; p.paid = p.paid || 0; p.quest = p.quest || {}; p.questsDone = p.questsDone || [];
  var wk = bpQuests(now).week;
  if (p.week !== wk) { p.week = wk; p.quest = {}; p.questsDone = []; }
  return p;
}
function bpTier(p) { return Math.min(BP.tiers, Math.floor(p.xp / BP.perTier)); }
function bpInto(p) { return bpTier(p) >= BP.tiers ? BP.perTier : p.xp % BP.perTier; }

// Something happened: Pass XP, quest progress and any tier rewards.
function bpRecord(ev, opts) {
  opts = opts || {};
  var now = Date.now(), p = bpLoad(now), lines = [], newTier = false;
  var gained = ev === 'kill' ? (opts.boss ? BP.xp.boss : opts.elite ? BP.xp.elite : BP.xp.kill) : (BP.xp[ev] || 0);
  bpQuests(now).quests.forEach(function(q) {
    if (p.questsDone.indexOf(q.id) !== -1) return;
    var counts = (q.id === 'kills' && ev === 'kill') || (q.id === 'elites' && ev === 'kill' && opts.elite) ||
      (q.id === 'bosses' && ev === 'kill' && opts.boss) || (q.id === 'floors' && ev === 'floor') ||
      (q.id === 'clears' && ev === 'clear') || (q.id === 'worldboss' && ev === 'worldboss') ||
      (q.id === 'weekly' && ev === 'weekly') || (q.id === 'endless' && ev === 'endless') || (q.id === 'spire' && ev === 'spire');
    if (!counts) return;
    p.quest[q.id] = (p.quest[q.id] || 0) + 1;
    if (p.quest[q.id] >= q.target) {
      p.questsDone.push(q.id);
      gained += BP.questXP;
      lines.push('📜 Weekly quest complete: ' + q.text + '! +' + BP.questXP + ' Pass XP.');
    }
  });
  p.xp += gained;
  var season = bpSeason(now).number;
  while (p.paid < bpTier(p)) {
    p.paid++;
    var r = bpReward(p.paid, season);
    bpPay(r);
    newTier = true;
    lines.push('🏆 Battle Pass tier ' + p.paid + '! You earn ' + bpRewardText(r) + '.');
  }
  DDStore.setItem(bpSeason(now).key, JSON.stringify({ xp: p.xp, paid: p.paid, week: p.week, quest: p.quest, questsDone: p.questsDone }));
  if (lines.length) {
    bpChime(newTier ? 'sfx-pass-tier' : 'sfx-pass-quest');
    setTimeout(function() { say(lines.join(' ')); try { showToast(lines[lines.length - 1], 'gold'); } catch (e) {} }, 600);
  }
}

// The pass's own two chimes live on the site (audio/), not the music host.
var _bpAudio = {};
function bpChime(name) {
  if (typeof AUD !== 'undefined' && !AUD.sfxOn) return;
  try {
    var a = _bpAudio[name] || (_bpAudio[name] = new Audio('audio/' + name + '.wav'));
    a.volume = (typeof AUD !== 'undefined' && AUD.sfxVol) || 0.7;
    a.currentTime = 0;
    a.play().catch(function() {});
  } catch (e) {}
}

function bpStatus() {
  var s = bpSeason(), p = bpLoad(), t = bpTier(p);
  return 'Season ' + s.number + ', tier ' + t + ' of ' + BP.tiers + '. ' +
    (t >= BP.tiers ? 'Every tier is yours.' : bpInto(p) + ' of ' + BP.perTier + ' XP to the next.') + ' ' + s.daysLeft + ' days left.';
}

// ── THE SCREEN ──
function openBattlePass() {
  var el = document.getElementById('screen-battlepass');
  if (!el) {
    el = document.createElement('div');
    el.id = 'screen-battlepass';
    el.className = 'screen';
    el.setAttribute('role', 'main');
    el.setAttribute('aria-label', 'Battle Pass');
    var anchor = document.getElementById('screen-void-reaper');
    (anchor && anchor.parentNode ? anchor.parentNode : document.body).insertBefore(el, anchor || null);
  }
  goTo('battlepass');
  bpRender(false);
  var p = bpLoad();
  say('Battle Pass. ' + bpStatus() + ' ' + p.questsDone.length + ' of 5 weekly quests done.');
}

function bpRender(showAll) {
  var el = document.getElementById('screen-battlepass');
  if (!el) return;
  var s = bpSeason(), p = bpLoad(), t = bpTier(p), wk = bpQuests();
  var next = t < BP.tiers ? bpRewardText(bpReward(t + 1, s.number)) : '';
  var html = '<div style="max-width:440px;margin:0 auto;padding:20px 16px;">' +
    '<div class="screen-header"><button class="back-btn" onclick="goTo(\'menu\')" aria-label="Back to main menu">← Menu</button>' +
    '<h2 class="screen-title" style="color:#ffdd44;">🏆 Battle Pass</h2></div>' +
    '<p style="font-family:\'Crimson Text\',serif;font-style:italic;color:#aaa;margin-bottom:12px;">Season ' + s.number + ' · ' + s.daysLeft + ' days left · earned by playing, never bought</p>' +
    '<div tabindex="0" aria-label="' + _u119Esc(bpStatus() + (next ? ' Next reward: ' + next + '.' : '')) + '" style="border:1px solid #443300;padding:12px;margin-bottom:14px;">' +
      '<div aria-hidden="true" style="font-family:Cinzel,serif;font-size:0.75rem;letter-spacing:0.2em;color:#ffdd44;">TIER ' + t + ' OF ' + BP.tiers + '</div>' +
      '<div aria-hidden="true" style="background:#111;height:10px;margin:6px 0;"><div style="background:#ffdd44;height:100%;width:' + Math.round(bpInto(p) / BP.perTier * 100) + '%;"></div></div>' +
      '<div aria-hidden="true" style="font-family:Cinzel,serif;font-size:0.7rem;color:#aaa;">' + (t >= BP.tiers ? 'Every tier is yours this season.' : bpInto(p) + ' / ' + BP.perTier + ' XP to tier ' + (t + 1)) + '</div>' +
      (next ? '<div aria-hidden="true" style="font-family:\'Crimson Text\',serif;color:#44cc88;">Next: ' + _u119Esc(next) + '</div>' : '') +
    '</div>' +
    '<h3 style="font-family:Cinzel,serif;font-size:0.7rem;letter-spacing:0.2em;color:var(--gold-dim);">📜 THIS WEEK\'S QUESTS</h3>' +
    '<p style="font-family:\'Crimson Text\',serif;font-style:italic;font-size:0.8rem;color:#666;">+' + BP.questXP + ' Pass XP each. New quests every Monday.</p>' +
    wk.quests.map(function(q) {
      var done = p.questsDone.indexOf(q.id) !== -1, have = Math.min(q.target, p.quest[q.id] || 0);
      return '<div tabindex="0" aria-label="' + _u119Esc(q.text + (done ? '. Done.' : '. ' + have + ' of ' + q.target + '.')) + '" style="display:flex;justify-content:space-between;font-family:\'Crimson Text\',serif;padding:4px 0;color:' + (done ? '#44cc88' : '#bbb') + ';">' +
        '<span aria-hidden="true">' + (done ? '✓ ' : '• ') + _u119Esc(q.text) + '</span><span aria-hidden="true">' + (done ? 'Done' : have + ' / ' + q.target) + '</span></div>';
    }).join('') +
    '<h3 style="font-family:Cinzel,serif;font-size:0.7rem;letter-spacing:0.2em;color:var(--gold-dim);margin-top:12px;">HOW TO EARN PASS XP</h3>' +
    '<p style="font-family:\'Crimson Text\',serif;color:#aaa;font-size:0.85rem;">Enemies 5, elites 15, bosses 60 · each new floor 10 · clearing a dungeon 150 · World Boss strike 10 · Weekly Ladder run 100 · Endless Descent floor 2 · Spire floor 5 · daily quest 50.</p>' +
    '<button class="menu-btn" style="width:100%;margin-top:8px;" onclick="bpRender(' + (!showAll) + ')">' + (showAll ? 'Hide the rewards' : '🎁 Every tier\'s reward') + '</button>';
  if (showAll) {
    for (var i = 1; i <= BP.tiers; i++) {
      var r = bpRewardText(bpReward(i, s.number)), got = i <= p.paid;
      html += '<div aria-label="Tier ' + i + ', ' + (got ? 'earned' : 'not yet') + ': ' + _u119Esc(r) + '" tabindex="0" style="font-family:\'Crimson Text\',serif;font-size:0.85rem;color:' + (got ? '#44cc88' : '#aaa') + ';">' +
        '<span aria-hidden="true">' + (got ? '✓' : '○') + ' Tier ' + i + ': ' + _u119Esc(r) + '</span></div>';
    }
  }
  el.innerHTML = html + '</div>';
}

// ── HOOKS: Pass XP from what the game already counts ──
(function() {
  var _track = trackGlobalStat;
  trackGlobalStat = function(key, amount) {
    var r = _track.apply(this, arguments);
    try {
      if (key === 'totalKills') {
        var e = (typeof DS !== 'undefined' && DS.enemy) || {};
        bpRecord('kill', { elite: !!e.isElite, boss: !!e.isBoss });
      } else if (key === 'totalFloors') bpRecord('floor');
      else if (key === 'runsCompleted') bpRecord('clear');
    } catch (err) { console.warn('[pass]', err); }
    return r;
  };
  var _inc = incrementAchievementStat;
  incrementAchievementStat = function(key) {
    var r = _inc.apply(this, arguments);
    if (key === 'dailyQuestsComplete') { try { bpRecord('daily'); } catch (err) {} }
    return r;
  };
  var _spire = spireNextFloor;
  spireNextFloor = function() { var r = _spire.apply(this, arguments); try { bpRecord('spire'); } catch (err) {} return r; };
  var _strike = wbStrike;
  wbStrike = function() {
    var before = wbUsed(wbDay());
    var r = _strike.apply(this, arguments);
    if (wbUsed(wbDay()) > before) { try { bpRecord('worldboss'); } catch (err) {} }
    return r;
  };
  var _weekly = weeklyDone;
  weeklyDone = function() {
    var was = typeof DS !== 'undefined' && DS._weeklyRun;
    var r = _weekly.apply(this, arguments);
    if (was) { try { bpRecord('weekly'); } catch (err) {} }
    return r;
  };
  // Endless Descent: each new floor.
  var _afkUI = updateAFKUI, _afkFloor = null;
  updateAFKUI = function() {
    var r = _afkUI.apply(this, arguments);
    try {
      if (typeof AFK !== 'undefined' && AFK.running) {
        if (_afkFloor !== null && AFK.floor > _afkFloor) { for (var i = _afkFloor; i < AFK.floor; i++) bpRecord('endless'); }
        _afkFloor = AFK.floor;
      } else _afkFloor = null;
    } catch (err) {}
    return r;
  };
})();
