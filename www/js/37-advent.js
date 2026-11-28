// ════════════════════════════════════════════════════════════════════════════
// 12.3 — ADVENT CALENDAR. December 1 to 25: one door a day, a prize behind
// each, the biggest on Christmas. Missed doors can be opened any time until
// December 31. Saved per year in "dd_advent_<year>" (a list of opened days),
// so it travels with the cloud save. The apps use the same table
// (DungeonCore/Advent.swift).
// ════════════════════════════════════════════════════════════════════════════

var ADVENT_DAYS = [
  { day:1,  icon:'🎁', gold:500 },
  { day:2,  icon:'🧪', item:'greater', count:3 },
  { day:3,  icon:'🪙', coins:5 },
  { day:4,  icon:'💠', fragments:2 },
  { day:5,  icon:'🍪', gold:1000 },
  { day:6,  icon:'🧴', item:'antidote', count:3 },
  { day:7,  icon:'🪙', coins:10 },
  { day:8,  icon:'🏆', trophies:3 },
  { day:9,  icon:'💠', fragments:3 },
  { day:10, icon:'🎁', gold:1500 },
  { day:11, icon:'🧪', item:'greater', count:5 },
  { day:12, icon:'🪙', coins:10 },
  { day:13, icon:'🔥', item:'torch', count:2 },
  { day:14, icon:'💠', fragments:5 },
  { day:15, icon:'🎁', gold:2500 },
  { day:16, icon:'🏆', trophies:5 },
  { day:17, icon:'🪙', coins:15 },
  { day:18, icon:'💠', fragments:5 },
  { day:19, icon:'🧪', item:'greater', count:5 },
  { day:20, icon:'🎁', gold:4000 },
  { day:21, icon:'🪙', coins:20 },
  { day:22, icon:'💠', fragments:8 },
  { day:23, icon:'🏆', trophies:10 },
  { day:24, icon:'🌟', gold:7500, coins:25 },
  { day:25, icon:'🎄', item:'starfall', count:1, coins:50, trophies:10 },
];

var ADVENT_ITEMS = {
  greater:  { name:'Greater Potion', icon:'💊', type:'potion', heal:80, desc:'Restores 80 HP. Stronger brew.' },
  antidote: { name:'Antidote', icon:'🧴', type:'consumable', skyItem:'antidote', desc:'Clears all poison. Health potions don\'t.' },
  torch:    { name:'Root Torch', icon:'🔥', type:'consumable', skyItem:'rootTorch', desc:'Burns roots. Use it in a fight to stop a plant (or Queen Verdana) from regrowing.' },
  starfall: { name:'Starfall Blade', icon:'🌟', type:'weapon', atk:24, desc:'A blade forged from a star that fell on Christmas night. A gift from the Advent Calendar.' },
};

function adventNow() {
  var d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}
function adventKey(year) { return 'dd_advent_' + year; }
function adventOpened(year) { return _jsonParseSafe(DDStore.getItem(adventKey(year)), '[]'); }
function adventIsOn() {
  var n = adventNow();
  return n.month === 12 || DDStore.getItem('dd_dev_mode') === '1';
}
// A door opens on its day and stays open until December 31.
function adventCanOpen(day) {
  var n = adventNow();
  if (DDStore.getItem('dd_dev_mode') === '1') return true;
  return n.month === 12 && n.day >= day;
}

function adventPrizeText(p) {
  var parts = [];
  if (p.gold) parts.push(p.gold.toLocaleString() + ' gold');
  if (p.item) { var nm = ADVENT_ITEMS[p.item].name; parts.push(p.count > 1 ? p.count + ' ' + (p.item === 'torch' ? 'Root Torches' : nm + 's') : 'the ' + nm); }
  if (p.coins) parts.push(p.coins + ' Mystery Coins');
  if (p.fragments) parts.push(p.fragments + ' Soul Fragments');
  if (p.trophies) parts.push(p.trophies + ' trophies');
  return parts.join(', ');
}

function adventOpen(day) {
  var p = ADVENT_DAYS[day - 1];
  if (!p) return;
  var n = adventNow();
  var opened = adventOpened(n.year);
  if (opened.indexOf(day) !== -1) { say('Door ' + day + ' is already open. You got ' + adventPrizeText(p) + '.'); return; }
  if (!adventCanOpen(day)) { say('Door ' + day + ' opens on December ' + day + '.'); return; }
  if (p.gold) addGlobalGold(p.gold);
  if (p.coins) addMysteryCoin(p.coins);
  if (p.fragments) DDStore.setItem('dd_soul_fragments', String((parseInt(DDStore.getItem('dd_soul_fragments') || '0', 10) || 0) + p.fragments));
  if (p.trophies) addTrophies(p.trophies);
  if (p.item) for (var i = 0; i < (p.count || 1); i++) addToGlobalInventory(JSON.parse(JSON.stringify(ADVENT_ITEMS[p.item])));
  opened.push(day);
  DDStore.setItem(adventKey(n.year), JSON.stringify(opened));
  try { sfx(day === 25 ? 'sfx-ach-special' : 'sfx-loot'); } catch (e) {}
  try { updateTrophyDisplay(); } catch (e) {}
  var line = (day === 25 ? '🎄 Merry Christmas! ' : p.icon + ' ') + 'Door ' + day + ': ' + adventPrizeText(p) + '!';
  say(line + (day === 25 ? ' The Starfall Blade is in your items.' : ''));
  try { showToast(line, 'gold'); } catch (e) {}
  renderAdvent();
}

function openAdvent() {
  var ov = document.getElementById('advent-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'advent-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-labelledby', 'advent-title');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9998;overflow-y:auto;padding:20px;';
    document.body.appendChild(ov);
  }
  ov.style.display = 'block';
  renderAdvent();
  var t = document.getElementById('advent-title'); if (t) t.focus();
}
function closeAdvent() {
  var ov = document.getElementById('advent-overlay'); if (ov) ov.style.display = 'none';
  var b = document.getElementById('advent-menu-btn'); if (b) b.focus();
}

function renderAdvent() {
  var ov = document.getElementById('advent-overlay'); if (!ov) return;
  var n = adventNow(), opened = adventOpened(n.year);
  var ready = ADVENT_DAYS.filter(function(p){ return adventCanOpen(p.day) && opened.indexOf(p.day) === -1; }).length;
  var html = '<div style="max-width:520px;margin:0 auto;">' +
    '<h2 id="advent-title" tabindex="-1" style="font-family:Cinzel,serif;color:#ffd27a;text-align:center;margin:0 0 6px;">🎄 Advent Calendar</h2>' +
    '<p style="font-family:Cinzel,serif;font-size:0.75rem;color:#bbb;text-align:center;margin:0 0 14px;">A door opens every day from December 1 to 25. Missed one? Open it any time until December 31. ' +
    (ready ? ready + ' door' + (ready === 1 ? '' : 's') + ' ready to open.' : 'No doors ready right now.') + '</p>' +
    '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">';
  ADVENT_DAYS.forEach(function(p) {
    var isOpen = opened.indexOf(p.day) !== -1, can = adventCanOpen(p.day);
    var label = 'Door ' + p.day + (isOpen ? ', opened: ' + adventPrizeText(p) : can ? ', ready to open' : ', opens December ' + p.day) + (p.day === 25 ? '. The Christmas door.' : '');
    html += '<button onclick="adventOpen(' + p.day + ')" aria-label="' + label.replace(/"/g, '&quot;') + '" style="aspect-ratio:1;font-family:Cinzel,serif;border-radius:6px;cursor:pointer;' +
      (isOpen ? 'background:#16301a;border:1px solid #3a7a40;color:#9fdc9f;' : can ? 'background:#3a1010;border:2px solid #ffd27a;color:#ffd27a;' : 'background:#111;border:1px solid #333;color:#666;') + '">' +
      '<div style="font-size:1.2rem;" aria-hidden="true">' + (isOpen ? p.icon : can ? '🎁' : '🔒') + '</div><div style="font-size:0.75rem;">' + p.day + '</div></button>';
  });
  html += '</div><button class="btn btn-secondary" onclick="closeAdvent()" style="width:100%;margin-top:16px;">Close</button></div>';
  ov.innerHTML = html;
}

// The menu button, shown in December.
(function adventMenuButton() {
  function place() {
    var menu = document.getElementById('screen-menu');
    if (!menu || document.getElementById('advent-menu-btn')) return;
    var vr = document.getElementById('vr-menu-btn');
    var b = document.createElement('button');
    b.id = 'advent-menu-btn';
    b.className = 'menu-btn';
    b.setAttribute('onclick', 'openAdvent()');
    b.setAttribute('aria-label', 'Advent Calendar, open a door every day in December');
    b.style.cssText = 'display:none;width:100%;max-width:280px;margin:4px auto 8px;border-color:#ffd27a;color:#ffd27a;';
    b.textContent = '🎄 Advent Calendar';
    if (vr && vr.parentNode) vr.parentNode.insertBefore(b, vr.nextSibling); else menu.insertBefore(b, menu.firstChild);
  }
  function refresh() {
    place();
    var b = document.getElementById('advent-menu-btn'); if (!b) return;
    b.style.display = adventIsOn() ? '' : 'none';
    if (adventIsOn()) {
      var n = adventNow(), opened = adventOpened(n.year);
      var ready = ADVENT_DAYS.filter(function(p){ return adventCanOpen(p.day) && opened.indexOf(p.day) === -1; }).length;
      b.textContent = '🎄 Advent Calendar' + (ready ? ' (' + ready + ')' : '');
      b.setAttribute('aria-label', 'Advent Calendar. ' + (ready ? ready + ' door' + (ready === 1 ? '' : 's') + ' ready to open.' : 'No doors ready right now.'));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh); else refresh();
  var orig = window.goTo;
  if (typeof orig === 'function' && !orig._advent) {
    window.goTo = function(id) { var r = orig.apply(this, arguments); if (id === 'menu') setTimeout(refresh, 300); return r; };
    window.goTo._advent = true;
  }
  setTimeout(refresh, 3000);
})();
