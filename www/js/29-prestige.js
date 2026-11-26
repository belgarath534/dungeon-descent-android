// ═══════════════════════════════════════════════════════════════════════
// v12.0 — PRESTIGE (the same rules as the iPhone app's Prestige.swift)
// A character at level 10 (25 in Legacy, whose cap is 50 since 12.0.2) can start over at
// level 1 for a permanent star, up to 10. Each star is +5% max HP, +5%
// attack and +10% gold in every run; prestiging pays 1,000 gold a star and
// a Mystery Coin. The stars are on the character ("prestige"), so they
// travel with the cloud save between the web and the apps.
// ═══════════════════════════════════════════════════════════════════════

var PRESTIGE = { max: 10, hp: 0.05, atk: 0.05, gold: 0.10 };

// A hit with the stars' attack bonus: 5% a star on the whole hit, weapon
// included (always at least 1 more).
function prestigeHit(dmg) {
  var s = (typeof DS !== 'undefined' && DS._prestige) || 0;
  if (!(s > 0) || !(dmg > 0)) return dmg;
  return Math.max(dmg + 1, Math.round(dmg * (1 + PRESTIGE.atk * s)));
}

function prestigeStars(ch) { return Math.min(PRESTIGE.max, Math.max(0, parseInt(ch && ch.prestige, 10) || 0)); }
// 12.0.2: Legacy's level cap went up to 50, but a prestige still needs 25.
function prestigeCap(ch) { return Math.min(ch.levelCap || 10, 25, ch.runMode === 'legacy' ? 25 : 10); }
function prestigeBlocker(ch) {
  if (prestigeStars(ch) >= PRESTIGE.max) return ch.name + ' already has every star there is.';
  var lv = ch.persistLevel || 1, cap = prestigeCap(ch);
  if (lv < cap) return 'Reach level ' + cap + ' to prestige. ' + ch.name + ' is level ' + lv + '.';
  return null;
}
function _pPct(x, s) { return Math.round(x * s * 100); }

function askPrestige(i) {
  var ch = CHARS[i];
  if (!ch) return;
  var why = prestigeBlocker(ch);
  if (why) { say(why); return; }
  var next = prestigeStars(ch) + 1;
  var old = document.getElementById('prestige-dialog');
  if (old) old.remove();
  var d = document.createElement('div');
  d.id = 'prestige-dialog';
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-modal', 'true');
  d.setAttribute('aria-labelledby', 'prestige-title');
  d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;';
  d.innerHTML = '<div style="max-width:420px;background:#0a0a0a;border:1px solid #aa8800;padding:22px;">' +
    '<h2 id="prestige-title" style="font-family:\'Cinzel Decorative\',cursive;color:#ffdd44;font-size:1.1rem;margin-bottom:10px;">⭐ Prestige ' + _u119Esc(ch.name) + '?</h2>' +
    '<p style="font-family:\'Crimson Text\',serif;color:#ccc;margin-bottom:16px;">' + _u119Esc(ch.name) + ' goes back to level 1: level, experience, skills' +
    (ch.dungeonTier ? ' and the Legacy tier' : '') + '. In return, star ' + next + ' of ' + PRESTIGE.max + ': ' + _pPct(PRESTIGE.hp, next) +
    '% more health, ' + _pPct(PRESTIGE.atk, next) + '% more attack and ' + _pPct(PRESTIGE.gold, next) +
    '% more gold in every run, forever, plus ' + (1000 * next) + ' gold and a Mystery Coin now.</p>' +
    '<button class="menu-btn primary" id="prestige-yes" style="width:100%;margin-bottom:8px;">⭐ Prestige</button>' +
    '<button class="menu-btn" id="prestige-no" style="width:100%;">Not yet</button></div>';
  document.body.appendChild(d);
  document.getElementById('prestige-no').onclick = function() { d.remove(); say('Not yet.'); };
  document.getElementById('prestige-yes').onclick = function() { d.remove(); doPrestige(i); };
  setTimeout(function() { document.getElementById('prestige-yes').focus(); }, 100);
  say('Prestige ' + ch.name + '? Back to level 1 for star ' + next + '.');
}

function doPrestige(i) {
  var ch = CHARS[i];
  if (!ch || prestigeBlocker(ch)) return;
  var s = prestigeStars(ch) + 1;
  ch.prestige = s;
  ch.persistLevel = 1;
  ch.persistXp = 0;
  ch.persistSkills = [];
  ch.lpSpent = {};
  // A run in progress brought the old level back when resumed, so the
  // prestige looked like it hadn't worked. It ends here (the apps too).
  ch.midRunSave = null;
  ch.floor = 1;
  if (ch.dungeonTier) ch.dungeonTier = 1;
  saveChars();
  addGlobalGold(1000 * s);
  try { addCoinsToWallet(1); } catch (e) {}
  try { sfx('ach-gold'); } catch (e) {}
  renderCharList();
  say(ch.name + ' is reborn with ' + s + ' star' + (s === 1 ? '' : 's') + '. Back to level 1, now with ' + _pPct(PRESTIGE.hp, s) +
      '% more health, ' + _pPct(PRESTIGE.atk, s) + '% more attack and ' + _pPct(PRESTIGE.gold, s) +
      '% more gold in every run. You earn ' + (1000 * s) + ' gold and a Mystery Coin.');
}

(function() {
  // The character list: a star badge and a Prestige button on each card.
  // (renderCharList builds the cards a tick later, in _renderCharListInner.)
  var _render = _renderCharListInner;
  _renderCharListInner = function() {
    var r = _render.apply(this, arguments);
    try {
      document.querySelectorAll('#char-list .char-btns-row, .char-card .char-btns-row').forEach(function(row) {
        if (row.querySelector('.prestige-btn')) return;
        var play = row.querySelector('button[onclick*="playChar("]');
        var m = play && /playChar\((\d+)\)/.exec(play.getAttribute('onclick'));
        if (!m) return;
        var i = parseInt(m[1], 10), ch = CHARS[i];
        if (!ch) return;
        var s = prestigeStars(ch);
        var card = row.closest('[aria-label]');
        if (s > 0) {
          var nameRow = card && card.querySelector('.char-name-row');
          if (nameRow && !nameRow.querySelector('.prestige-badge')) {
            var b = document.createElement('span');
            b.className = 'char-class-badge prestige-badge';
            b.style.cssText = 'background:#1a1400;border-color:#aa8800;color:#ffdd44;';
            b.textContent = '★ Prestige ' + s;
            nameRow.appendChild(b);
          }
          // After the list's own label refresh (100ms), or it would be lost.
          if (card) setTimeout(function() {
            var l = card.getAttribute('aria-label') || '';
            if (l.indexOf('Prestige ') === -1) card.setAttribute('aria-label', l.replace('. Level ', '. Prestige ' + s + ' stars. Level '));
          }, 180);
        }
        if (s >= PRESTIGE.max) return;
        var btn = document.createElement('button');
        btn.className = 'char-btn prestige-btn';
        btn.style.cssText = 'color:#ffdd44;border-color:#aa8800;';
        btn.textContent = '⭐ Prestige';
        btn.setAttribute('aria-label', prestigeBlocker(ch) ? 'Prestige ' + ch.name + ', at level ' + prestigeCap(ch)
          : 'Prestige ' + ch.name + ': back to level 1 for a permanent star');
        btn.onclick = function(e) { e.stopPropagation(); askPrestige(i); };
        var del = row.querySelector('.char-btn.red');
        row.insertBefore(btn, del || null);
      });
    } catch (e) { console.warn('[prestige] card', e); }
    return r;
  };

  // A run: the stars' health and attack, and more gold from enemies.
  var _init = initDungeon;
  initDungeon = function(ch) {
    var r = _init.apply(this, arguments);
    try {
      var s = prestigeStars(ch);
      DS._prestige = s;
      if (s > 0) {
        DS.maxHp = Math.round((DS.maxHp || 100) * (1 + PRESTIGE.hp * s));
        DS.hp = DS.maxHp;
        // 12.2: attack goes on every hit (prestigeHit), not the base range,
        // where 5% of 5 to 8 rounded to nothing and players saw no change.
        setTimeout(function() {
          addLog('⭐ Prestige ' + s + ' — +' + _pPct(PRESTIGE.hp, s) + '% health, +' + _pPct(PRESTIGE.atk, s) + '% attack, +' + _pPct(PRESTIGE.gold, s) + '% gold.');
        }, 400);
      }
    } catch (e) { console.warn('[prestige] run', e); }
    return r;
  };
  var _fx = fxPlayerDamage;
  fxPlayerDamage = function() { return prestigeHit(_fx.apply(this, arguments)); };
  var _gold = resolveGold;
  resolveGold = function(val) {
    var g = _gold.apply(this, arguments);
    if (typeof DS !== 'undefined' && DS._prestige > 0) g = Math.round(g * (1 + PRESTIGE.gold * DS._prestige));
    return g;
  };
})();
