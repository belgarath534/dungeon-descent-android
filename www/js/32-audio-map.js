// ═══════════════════════════════════════════════════════════════════════
// 12.0 AUDIO MAP — the floor played as sounds, then a spoken summary.
// In 3D Mode every room you know of sounds from where it is (panned left or
// right, a little higher in front of you and lower behind). Otherwise the
// floor plays left to right like a progress bar: the rooms behind you, you,
// the rooms ahead, then the stairs (or the boss). Same cues and words as
// the iPhone app's Audio Map.
// ═══════════════════════════════════════════════════════════════════════
var AUDIO_MAP_GAP = 0.22;
var AUDIO_MAP_MAX = 18;
var _audioMapUntil = 0;

function _audioMapPT() { return typeof _translationLang !== 'undefined' && _translationLang === 'pt-BR' && _translationEnabled; }

function audioMapLegend() {
  return _audioMapPT()
    ? 'Uma nota grave e suave é uma sala onde você já esteve, um bipe mais agudo é uma sala onde você ainda não entrou, notas descendo são a escada e um rosnado grave é o chefe.'
    : "A soft low note is a room you've been in, a brighter blip is a room you haven't entered, falling notes are the stairs and a deep growl is the boss.";
}

// The cues ({kind, x, z}) and the summary for the run as it stands.
function buildAudioMap() {
  var pt = _audioMapPT();
  var bossFloor = DS._dailyMod_earlyBoss ? 7 : 10;
  var isBoss = DS.floor >= bossFloor && DS.diff !== 'Endless';
  var needed = DS.floorRoomsNeeded || 6;
  var onFloor = DS.roomsOnFloor || 0;
  var left = Math.max(0, needed - onFloor);
  var cues = [{ kind: 'you', x: 0, z: 0 }];
  var s = pt ? 'Mapa sonoro. Andar ' + DS.floor + '.' : 'Audio map. Floor ' + DS.floor + '.';
  var g = (typeof shouldUse3DMode === 'function' && shouldUse3DMode()) ? DS._roomGraph : null;
  var endName = isBoss ? (pt ? 'o chefe' : 'the boss') : (pt ? 'a escada' : 'the stairs');

  if (g && DS._gridPos) {
    var hx = DS._gridPos.gx, hy = DS._gridPos.gy;
    var known = {}, list = [];
    Object.keys(g.cells).forEach(function(k) {
      var c = g.cells[k];
      if (!c.visited) return;
      if (!known[k]) { known[k] = true; list.push({ c: c, visited: true }); }
    });
    Object.keys(g.cells).forEach(function(k) {
      var c = g.cells[k];
      if (!c.visited) return;
      ROOM3D_DIRS.forEach(function(d) {
        if (!c.doors[d.name]) return;
        var nk = _room3DKey(c.gx + d.dx, c.gy + d.dy), n = g.cells[nk];
        if (n && !n.visited && !known[nk]) { known[nk] = true; list.push({ c: n, visited: false }); }
      });
    });
    var explored = list.filter(function(r) { return r.visited; }).length;
    var open = list.length - explored;
    list.filter(function(r) { return !(r.c.gx === hx && r.c.gy === hy); })
      .sort(function(a, b) {
        var da = Math.abs(a.c.gx - hx) + Math.abs(a.c.gy - hy), db = Math.abs(b.c.gx - hx) + Math.abs(b.c.gy - hy);
        return da - db || a.c.gx - b.c.gx || a.c.gy - b.c.gy;
      })
      .slice(0, AUDIO_MAP_MAX - 3)
      .forEach(function(r) { cues.push({ kind: r.visited ? 'explored' : 'unexplored', x: (r.c.gx - hx) * 2, z: (r.c.gy - hy) * 2 }); });
    s += pt ? ' ' + explored + ' sala(s) exploradas, ' + open + ' onde você ainda não entrou.'
            : ' ' + explored + ' room' + (explored === 1 ? '' : 's') + ' explored, ' + open + " you haven't entered yet.";
    if (left === 0) cues.push({ kind: isBoss ? 'boss' : 'stairs', x: 0, z: -1 });
    if (left > 0) s += pt ? ' Faltam ' + left + ' sala(s) para encontrar; depois, ' + endName + '.'
                          : ' ' + left + ' more room' + (left === 1 ? '' : 's') + ' to find before ' + endName + '.';
  } else {
    var total = Math.min(AUDIO_MAP_MAX - 3, Math.max(1, needed));
    var done = Math.min(onFloor, total), slots = total + 2;
    var px = function(i) { return -4 + 8 * i / (slots - 1); };
    cues = [];
    for (var i = 0; i < done; i++) cues.push({ kind: 'explored', x: px(i), z: 0 });
    cues.push({ kind: 'you', x: px(done), z: 0 });
    for (var j = done; j < total; j++) cues.push({ kind: 'unexplored', x: px(j + 1), z: 0 });
    cues.push({ kind: isBoss ? 'boss' : 'stairs', x: 4, z: 0 });
    if (left > 0) s += pt ? ' ' + onFloor + ' sala(s) atrás de você, ' + left + ' à frente, e depois ' + endName + '.'
                          : ' ' + onFloor + ' room' + (onFloor === 1 ? '' : 's') + ' behind you, ' + left + ' ahead, then ' + endName + '.';
  }
  if (left === 0) s += isBoss ? (pt ? ' O chefe está aqui.' : ' The boss is here.')
                              : (pt ? ' O andar acabou: a escada está aberta.' : ' The floor is done: the stairs are open.');
  if (DS.inCombat && DS.enemy && DS.enemy.hp > 0) {
    cues.push({ kind: 'enemy', x: 0, z: -2 });
    s += pt ? ' ' + DS.enemy.name + ' está na sua frente.' : ' ' + DS.enemy.name + ' is in front of you.';
  }
  if (DS.hunterMode && DS.hunterAlive) {
    var hd = Math.max(1, Math.min(10, DS.hunterDist || 10));
    cues.push({ kind: 'hunter', x: 0, z: hd });
    s += pt ? ' O caçador está a ' + hd + ' sala(s) atrás de você.' : ' The hunter is ' + hd + ' room' + (hd === 1 ? '' : 's') + ' behind you.';
  }
  return { cues: cues.slice(0, AUDIO_MAP_MAX), summary: s };
}

// Plays the cues in stereo, one every AUDIO_MAP_GAP seconds.
function playAudioMap(map) {
  map.cues.forEach(function(c, i) {
    var t = i * AUDIO_MAP_GAP;
    var pan = Math.max(-1, Math.min(1, c.x / 4));
    var lift = c.z < -0.5 ? 1.12 : c.z > 0.5 ? 0.88 : 1;
    switch (c.kind) {
      case 'you': _echoOsc('sine', 660, pan, t, 0.16, 0.45); _echoOsc('sine', 990, pan, t + 0.06, 0.12, 0.25); break;
      case 'explored': _echoOsc('sine', 294 * lift, pan, t, 0.18, 0.4); break;
      case 'unexplored': _echoOsc('square', 740 * lift, pan, t, 0.07, 0.18); break;
      case 'stairs': [784, 587, 392].forEach(function(f, k) { _echoOsc('sine', f, pan, t + k * 0.09, 0.12, 0.35); }); break;
      case 'boss': _echoOsc('sawtooth', 62, pan, t, 0.6, 0.45); _echoOsc('sawtooth', 93, pan, t + 0.05, 0.5, 0.25); break;
      case 'enemy': _echoOsc('sawtooth', 165, pan, t, 0.28, 0.3); break;
      case 'hunter': _echoOsc('sine', 70, pan, t, 0.35, 0.6); break;
    }
  });
}

function audioMap() {
  if (!DS) return;
  var now = Date.now();
  if (now < _audioMapUntil) return;
  if (window.AUD && !AUD.ctx && typeof initWebAudio === 'function') { try { initWebAudio(); } catch (e) {} }
  if (window.AUD && AUD.ctx && AUD.ctx.state === 'suspended') { try { AUD.ctx.resume(); } catch (e) {} }
  var map = buildAudioMap();
  var length = map.cues.length * AUDIO_MAP_GAP + 0.5;
  _audioMapUntil = now + length * 1000;
  playAudioMap(map);
  if (typeof vibe === 'function' && typeof VIBE !== 'undefined' && VIBE.echoPing) vibe(VIBE.echoPing);
  var first = false;
  try { first = !localStorage.getItem('dd_audio_map_heard'); localStorage.setItem('dd_audio_map_heard', '1'); } catch (e) {}
  setTimeout(function() { say(map.summary + (first ? ' ' + audioMapLegend() : '')); }, length * 1000);
}

// Alt+M in the dungeon.
document.addEventListener('keydown', function(e) {
  if (!e.altKey || (e.key || '').toLowerCase() !== 'm') return;
  var tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  var dg = document.getElementById('screen-dungeon');
  if (!dg || !dg.classList.contains('active')) return;
  e.preventDefault();
  audioMap();
});
