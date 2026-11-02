//═════════════════
// MYSTERY COIN SHOP
//═════════════════
var COIN_UPGRADES = [
  // ── ORIGINAL ITEMS (prices updated) ──
  { id:'cu-starting-gold',  name:'Veteran Cache',     icon:'💰', desc:'All new characters start with 15 extra gold.',             cost:10 },
  { id:'cu-hp-boost',       name:'Hardened Soul',     icon:'❤️', desc:'All characters gain +10 max HP permanently.',             cost:15 },
  { id:'cu-xp-boost',       name:'Ancient Knowledge', icon:'📖', desc:'XP gain increased by 15% on all runs.',                  cost:20 },
  { id:'cu-starting-blade', name:'Soulbound Blade',   icon:'⚔️', desc:'All characters start with a +2 attack blade equipped.',  cost:20 },
  { id:'cu-second-wind',    name:'Second Wind',       icon:'💨', desc:'Once per run, survive a killing blow with 1 HP.',         cost:40 },
  { id:'cu-loot-boost',     name:'Fortune Eye',       icon:'👁️', desc:'Loot discovery chance increased by 8%.',                 cost:15 },
  { id:'cu-sp-boost',       name:'Arcane Reservoir',  icon:'🔮', desc:'Start every run with 5 extra SP.',                       cost:15 },
  { id:'cu-raid-boost',     name:'Raid Veteran',      icon:'⚔️', desc:'Start raids with 1 extra potion.',                      cost:15 },
  // ── NEW ITEMS ──
  { id:'cu-void-touched',   name:'Void Touched',      icon:'🗡️', desc:'Start every run with a random rare weapon in inventory.',cost:50 },
  { id:'cu-alchemist-gift', name:"Alchemist's Gift",  icon:'🧪', desc:'Start every run with 2 extra potions.',                  cost:25 },
  { id:'cu-soul-surge',     name:'Soul Surge',        icon:'⚡', desc:'All skills cost 1 less SP permanently.',                 cost:35 },
  { id:'cu-blood-pact',     name:'Blood Pact',        icon:'🩸', desc:'Steal 2 HP from every enemy you kill.',                  cost:30 },
  { id:'cu-berserker-mark', name:"Berserker's Mark",  icon:'💢', desc:'Deal +3 damage when below 50% HP.',                     cost:25 },
  { id:'cu-treasure-sense', name:'Treasure Sense',    icon:'💎', desc:'Start every run with a random gem in your inventory.',   cost:20 },
  { id:'cu-iron-skin',      name:'Iron Skin',         icon:'🛡️', desc:'All characters gain +2 DEF permanently.',               cost:20 },
  { id:'cu-lucky-descent',  name:'Lucky Descent',     icon:'🌟', desc:'First loot found every run is always rare quality.',     cost:35 },
  { id:'cu-ember-ward',     name:'Ember Ward',        icon:'🔥', desc:'Reduce all incoming enemy damage by 2 permanently.',     cost:30 },
  { id:'cu-void-pact',      name:'Void Pact',         icon:'🌑', desc:'+5% chance to find Mystery Coins while exploring dungeons.',cost:30},
  { id:'cu-third-eye',      name:'Third Eye',         icon:'👁', desc:'See enemy HP and special ability before every combat begins.',cost:40},
  { id:'cu-gamblers-spirit',name:"Gambler's Spirit",  icon:'🎲', desc:'Once per run — double or halve your current gold. Your choice.',cost:20},
  { id:'cu-deaths-bargain', name:"Death's Bargain",   icon:'⚰️', desc:'On death, unleash one final powerful counterattack.',    cost:45 },
  { id:'cu-hunters-mark',   name:"Hunter's Mark",     icon:'🏹', desc:'Your first attack in every combat is always a critical hit.',cost:40},
  { id:'cu-night-blessing', name:'Night Blessing',    icon:'🌙', desc:'During Night Mode gain +5 ATK and +10% gold on all runs.', cost:25 },
  { id:'cu-bloodhound',     name:"Bloodhound's Nose", icon:'🐺', desc:'+5% chance for enemies to drop equipment on kill.',      cost:25 },
  { id:'cu-trapper',        name:"Trapper's Kit",     icon:'🪤', desc:'Start every run with a Soul Trap in your inventory.',    cost:30 },
  { id:'cu-warm-blood',     name:'Warm Blood',        icon:'💗', desc:'Heal 1 HP every time you reach a new floor.',            cost:20 },
];

function getCoinUpgradesSave() { return _jsonParseSafe(DDStore.getItem('dd_coin_upgrades'), '{}'); }
function saveCoinUpgrades(o) { DDStore.setItem('dd_coin_upgrades', JSON.stringify(o)); }
function hasUpgrade(id) { return !!getCoinUpgradesSave()[id]; }

function renderCoinShop() {
  // Unified mystery coins — merge raid save coins into dd_mystery_coins if needed
  var raidCoins = getRaidSave().mysteryCoins || 0;
  var ddCoins = parseInt(DDStore.getItem('dd_mystery_coins') || '0');
  if (raidCoins > ddCoins) {
    DDStore.setItem('dd_mystery_coins', String(raidCoins));
    ddCoins = raidCoins;
  }
  var coins = ddCoins;
  document.getElementById('coinshop-balance').textContent = coins + ' Mystery Coin' + (coins !== 1 ? 's' : '');
  var grid = document.getElementById('coinshop-grid');
  grid.innerHTML = '';
  document.getElementById('coinshop-msg').textContent = '';

  // ── Watch Ad button — Android only (AdMob is broken/does nothing on iOS) ──
  if (window.Capacitor && typeof Capacitor.getPlatform === 'function' && Capacitor.getPlatform() === 'android') {
  var adDiv = document.createElement('div');
  adDiv.style.cssText = 'background:#0a0a1a;border:1px solid #8888ff;padding:14px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;';
  var adCooldownLeft = _adCooldown ? ' (on cooldown)' : '';
  adDiv.setAttribute('role', 'button');
  adDiv.setAttribute('tabindex', '0');
  adDiv.setAttribute('aria-label', 'Watch an ad to earn 10 Mystery Coins' + adCooldownLeft);
  adDiv.innerHTML = 
    '<div>' +
    '<div style="font-family:Cinzel,serif;font-size:0.75rem;color:#8888ff;">🎬 Watch Ad</div>' +
    '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;margin-top:2px;">Earn 10 Mystery Coins · Free · Every 5 minutes' + adCooldownLeft + '</div>' +
    '</div>' +
    '<button style="padding:8px 16px;background:#1a1a2e;border:1px solid #8888ff;color:#8888ff;font-family:Cinzel,serif;font-size:0.7rem;cursor:pointer;" aria-label="Watch ad for 10 coins"' + (_adCooldown ? ' disabled' : '') + '>Watch →</button>';
  adDiv.querySelector('button').onclick = showRewardedAd;
  adDiv.onkeydown = function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); showRewardedAd(); } };
  grid.appendChild(adDiv);
  } // end Capacitor-only Watch Ad block

  // ── Buy Coins buttons ──
  if (window.CdvPurchase) {
    var buyDiv = document.createElement('div');
    buyDiv.style.cssText = 'background:#0a0a1a;border:1px solid #ffdd44;padding:14px;margin-bottom:12px;';
    buyDiv.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:0.2em;color:#ffdd44;margin-bottom:10px;">🪙 BUY MYSTERY COINS</div>';
    IAP_PRODUCTS.forEach(function(p) {
      var product = _iapProducts[p.id];
      var priceStr = product && product.pricing ? product.pricing.price : '...';
      var btn = document.createElement('button');
      btn.style.cssText = 'width:100%;padding:10px;background:#1a1a00;border:1px solid #ffdd44;color:#ffdd44;font-family:Cinzel,serif;font-size:0.7rem;cursor:pointer;margin-bottom:6px;text-align:left;';
      btn.setAttribute('aria-label', p.label + ' — ' + p.coins + ' Mystery Coins for ' + priceStr);
      btn.textContent = p.label + ' · ' + p.coins + ' coins · ' + priceStr;
      btn.onclick = (function(id){ return function(){ buyCoins(id); }; })(p.id);
      buyDiv.appendChild(btn);
    });
    grid.appendChild(buyDiv);
  }
  COIN_UPGRADES.forEach(function(upg) {
    var owned = hasUpgrade(upg.id);
    var canAfford = coins >= upg.cost;
    var div = document.createElement('div');
    div.className = 'coinshop-item ' + (owned ? 'owned' : canAfford ? 'affordable' : 'cant-afford');
    div.setAttribute('role', 'listitem');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', upg.name + '. ' + upg.desc + (owned ? ' Already purchased.' : ' Cost: ' + upg.cost + ' coin' + (upg.cost !== 1 ? 's' : '') + '.' + (canAfford ? '' : ' Not enough coins.')));
    div.innerHTML =
      '<span class="coinshop-item-icon" aria-hidden="true">' + upg.icon + '</span>' +
      '<div class="coinshop-item-info"><div class="coinshop-item-name">' + upg.name + '</div><div class="coinshop-item-desc">' + upg.desc + '</div></div>' +
      (owned
        ? '<span class="coinshop-item-owned">✦ Owned</span>'
        : '<span class="coinshop-item-cost">' + upg.cost + ' 🪙</span>');
    if (!owned && canAfford) {
      (function(u) {
        div.onclick = function() { buyCoinUpgrade(u); };
        div.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buyCoinUpgrade(u); } };
      })(upg);
    }
    grid.appendChild(div);
  });
  say('Mystery Coin Shop. You have ' + coins + ' coins. ' + COIN_UPGRADES.filter(function(u){return !hasUpgrade(u.id);}).length + ' upgrades available.');
}

function buyCoinUpgrade(upg) {
  var coins = parseInt(DDStore.getItem('dd_mystery_coins') || '0');
  if (coins < upg.cost) { say('Not enough Mystery Coins.'); return; }
  var newCoins = coins - upg.cost;
  DDStore.setItem('dd_mystery_coins', String(newCoins));
  // Keep raid save in sync
  var save = getRaidSave();
  save.mysteryCoins = newCoins;
  setRaidSave(save);
  var upgSave = getCoinUpgradesSave();
  upgSave[upg.id] = true;
  saveCoinUpgrades(upgSave);
  sfx('sfx-unlock');
  document.getElementById('coinshop-msg').textContent = upg.name + ' purchased! ' + upg.desc;
  say(upg.name + ' purchased! ' + upg.desc);
  renderCoinShop();
}

function applyCoinUpgrades() {
  // Called in initDungeon to apply permanent upgrades
  if (hasUpgrade('cu-hp-boost'))        { DS.maxHp += 10; DS.hp = Math.min(DS.maxHp, DS.hp + 10); }
  if (hasUpgrade('cu-starting-blade'))  { DS.atkBonus += 2; }
  if (hasUpgrade('cu-sp-boost'))        { DS.sp = Math.min(DS.maxSp, DS.sp + 5); }
  if (hasUpgrade('cu-second-wind'))     { DS.secondWind = true; }
  if (hasUpgrade('cu-iron-skin'))       { DS.defBonus = (DS.defBonus || 0) + 2; }
  if (hasUpgrade('cu-ember-ward'))      { DS._emberWard = true; }
  if (hasUpgrade('cu-blood-pact'))      { DS._bloodPact = true; }
  if (hasUpgrade('cu-berserker-mark'))  { DS._berserkerMark = true; }
  if (hasUpgrade('cu-soul-surge'))      { DS.maxSp = (DS.maxSp || 20) + 0; DS._soulSurge = true; }
  if (hasUpgrade('cu-hunters-mark'))    { DS._huntersMark = true; }
  if (hasUpgrade('cu-deaths-bargain'))  { DS._deathsBargain = true; }
  if (hasUpgrade('cu-night-blessing'))  { DS._nightBlessing = true; }
  if (hasUpgrade('cu-third-eye'))       { DS._thirdEye = true; }
  if (hasUpgrade('cu-lucky-descent'))   { DS._luckyDescent = true; }
  if (hasUpgrade('cu-void-pact'))       { DS._voidPact = true; }
  if (hasUpgrade('cu-bloodhound'))      { DS._bloodhound = true; }
  if (hasUpgrade('cu-warm-blood'))      { DS._warmBlood = true; }
  if (hasUpgrade('cu-trapper'))         { DS.inventory.push({ name:'Soul Trap', icon:'🪤', type:'soul-trap', desc:'Captures the current enemy as a permanent minion. Use during combat.' }); }
  if (hasUpgrade('cu-gamblers-spirit')) { 
    DS._gamblersSpirit = true;
    if (!DS._gamblersUsed) {
      DS.inventory.push({ 
        name:"Gambler's Spirit", icon:'🎲', type:'gamblers-spirit', 
        desc:'Once per run — double or halve your gold. Your choice. No refunds.',
        isGamblersSpirit: true
      });
    }
  }

  // Void Touched — add random rare weapon
  if (hasUpgrade('cu-void-touched')) {
    var rareWeapons = [
      { name:'Void Shard', icon:'🌑', type:'weapon', atk:[8,16], rarity:'rare', desc:'A fragment of the void. Cold to the touch.' },
      { name:'Soul Cleaver', icon:'⚔️', type:'weapon', atk:[9,17], rarity:'rare', desc:'Cleaves both flesh and spirit.' },
      { name:'Eclipse Blade', icon:'🌘', type:'weapon', atk:[7,18], rarity:'rare', desc:'Darkens the air around it.' },
    ];
    DS.inventory.push(JSON.parse(JSON.stringify(rareWeapons[Math.floor(Math.random()*rareWeapons.length)])));
  }

  // Alchemist's Gift — add 2 potions
  if (hasUpgrade('cu-alchemist-gift')) {
    DS.inventory.push({ name:'Health Potion', icon:'🧪', type:'potion', heal:40, desc:'Restores 40 HP.' });
    DS.inventory.push({ name:'Health Potion', icon:'🧪', type:'potion', heal:40, desc:'Restores 40 HP.' });
  }

  // Treasure Sense — add random gem
  if (hasUpgrade('cu-treasure-sense')) {
    var gems = [
      { name:'Void Crystal', icon:'💎', type:'gem', gold:30, desc:'Worth 30 gold.' },
      { name:'Shadow Shard', icon:'🔮', type:'gem', gold:25, desc:'Worth 25 gold.' },
      { name:'Ember Stone', icon:'🔥', type:'gem', gold:20, desc:'Worth 20 gold.' },
    ];
    DS.inventory.push(JSON.parse(JSON.stringify(gems[Math.floor(Math.random()*gems.length)])));
  }
}

//═════════════════
// RAID DIFFICULTY
//═════════════════
var _raidDiff = 'normal';

function setRaidDiff(diff) {
  _raidDiff = diff;
  var normalBtn = document.getElementById('raid-diff-normal');
  var hardBtn = document.getElementById('raid-diff-hard');
  if (normalBtn && hardBtn) {
    if (diff === 'normal') {
      normalBtn.className = 'btn-gold'; hardBtn.className = 'btn-ghost';
      normalBtn.setAttribute('aria-pressed','true'); hardBtn.setAttribute('aria-pressed','false');
    } else {
      normalBtn.className = 'btn-ghost'; hardBtn.className = 'btn-gold';
      normalBtn.setAttribute('aria-pressed','false'); hardBtn.setAttribute('aria-pressed','true');
    }
  }
  say(diff === 'hard' ? 'Hard difficulty selected. 5 to 10 enemies per wave, 50% bonus gold.' : 'Normal difficulty selected. 5 to 7 enemies per wave.');
}


//═════════════════
// DAILY CHALLENGE MODE
//═════════════════
var DAILY_CHALLENGES = [
  { id:'dc-iron',       name:'Iron Day',       desc:'All enemies have 50% more HP.',               effect:'ironDay'     },
  { id:'dc-glass',      name:'Glass Cannon',   desc:'Deal double damage but start with half HP.',  effect:'glassCannon' },
  { id:'dc-cursed',     name:'Cursed Day',     desc:'Potions cannot be used in combat.',           effect:'cursedDay'   },
  { id:'dc-blessed',    name:'Blessed Day',    desc:'Start with 3 potions and 30 extra gold.',     effect:'blessedDay'  },
  { id:'dc-nightmare',  name:'Nightmare Day',  desc:'Nightmare enemies invade all floors.',        effect:'nightmareDay'},
  { id:'dc-speed',      name:'Speed Run',      desc:'Enemies give double XP but hit 25% harder.', effect:'speedRun'    },
  { id:'dc-horde',      name:'Horde Day',      desc:'Combat chance increased to 70% on all floors.',effect:'hordeDay'  }
];

function getDailyChallenge() {
  var d = new Date();
  var idx = (d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate()) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[idx];
}

function getDailyChallengeCompleted() {
  var save = _jsonParseSafe(DDStore.getItem('dd_dc'), '{}');
  return save.completedDate === todayKey();
}

function completeDailyChallenge() {
  var save = { completedDate: todayKey() };
  DDStore.setItem('dd_dc', JSON.stringify(save));
  // Award Mystery Coin
  var raidSave = getRaidSave();
  addCoinsToWallet(1); setRaidSave(raidSave);
  say('Daily Challenge complete! You earned 1 Mystery Coin!');
  sfx('sfx-unlock');
}

//═════════════════
// BOSS RUSH ENGINE
//═════════════════
var ALL_BOSSES = [
  // Crypt bosses
  { name:'Malachar the Undying',    icon:'👑', hp:140, atk:[15,25], gold:[0,0], isBoss:true, dungeon:'crypt'     },
  { name:'The Bone Sovereign',      icon:'💀', hp:130, atk:[14,23], gold:[0,0], isBoss:true, dungeon:'crypt'     },
  { name:'The Void Walker',         icon:'🌑', hp:135, atk:[15,24], gold:[0,0], isBoss:true, dungeon:'crypt'     },
  // Ashbound bosses
  { name:'The Eternal Pyre',        icon:'🔥', hp:160, atk:[16,26], gold:[0,0], isBoss:true, dungeon:'ashbound'  },
  { name:'The Ashen Throne',        icon:'👑', hp:150, atk:[15,25], gold:[0,0], isBoss:true, dungeon:'ashbound'  },
  { name:'The Cinder Colossus',     icon:'🌋', hp:170, atk:[14,24], gold:[0,0], isBoss:true, dungeon:'ashbound'  },
  // Frosthold bosses
  { name:'The Eternal Winter',      icon:'❄️', hp:165, atk:[15,26], gold:[0,0], isBoss:true, dungeon:'frosthold' },
  { name:'The Frozen King',         icon:'👑', hp:155, atk:[14,25], gold:[0,0], isBoss:true, dungeon:'frosthold' },
  { name:'The Void Below',          icon:'🌑', hp:170, atk:[14,24], gold:[0,0], isBoss:true, dungeon:'frosthold' }
];

var BR = {};
var _brCharIdx = 0;

function initBossRush() {
  document.getElementById('br-pre').style.display = '';
  document.getElementById('br-active').style.display = 'none';
  document.getElementById('br-end').style.display = 'none';
  // Render character selector
  var charList = document.getElementById('br-char-list');
  charList.innerHTML = '';
  _brCharIdx = 0;
  setTimeout(function(){ injectCharSlider('br-char-list'); }, 50);
  if (CHARS.length === 0) {
    charList.innerHTML = '<p style="font-size:0.8rem;color:var(--text-dim);font-style:italic;">Create a character first.</p>';
    document.getElementById('br-begin-btn').style.display = 'none';
    say('Boss Rush. No characters available. Create a character first.');
    return;
  }
  CHARS.forEach(function(ch, i) {
    var btn = document.createElement('button');
    btn.className = 'char-card';
    btn.style.cssText = 'margin-bottom:8px;outline:none;';
    btn.setAttribute('role','radio');
    btn.setAttribute('aria-checked', i===0?'true':'false');
    btn.setAttribute('aria-label', ch.name+', '+ch.race+' '+ch.cls+', Level '+(ch.persistLevel||1)+'. Press to select.');
    btn.innerHTML = '<span class="char-class-icon" aria-hidden="true">'+(CLASS_ICONS[ch.cls]||'⚔️')+'</span>' +
      '<div class="char-info"><div class="char-name-row"><span class="char-name">'+ch.name+'</span>' +
      '<span class="char-class-badge" aria-hidden="true">'+ch.race+' '+ch.cls+'</span>' +
      '<span class="char-class-badge" style="background:#1a1000;border-color:#ffaa00;color:#ffaa00;" aria-hidden="true">Lv '+(ch.persistLevel||1)+'</span></div>' +
      '<p class="char-details">'+ch.prof+'</p></div>';
    if (i===0) btn.style.borderColor='#9a30c0';
    (function(idx,b){
      b.onclick=function(){
        _brCharIdx=idx;
        document.querySelectorAll('#br-char-list .char-card').forEach(function(c,ci){
          c.style.borderColor=ci===idx?'#9a30c0':'';
          c.setAttribute('aria-checked',ci===idx?'true':'false');
        });
        say(CHARS[idx].name+' selected for Boss Rush.');
      };
    })(i,btn);
    charList.appendChild(btn);
  });
  say('Boss Rush. Nine bosses back to back. Defeat 3 for 1 Mystery Coin, 6 for 3, all 9 for 6. Select a character and press Begin.');
}

function beginBossRush() {
  BR.startTime = Date.now();
  var ch = CHARS[_brCharIdx] || CHARS[0];
  if (!ch) return;
  var charLevel = ch.level || ch.persistLevel || 1;
  var baseHp = (HP_MAP[ch.cls] || 100) + (hasUpgrade('cu-hp-boost') ? 10 : 0);
  var maxHp = baseHp + (charLevel - 1) * 10; // +10 HP per level
  var lvlAtkBonus = Math.floor((charLevel - 1) * 0.5);

  // Apply equipped weapon/armor
  var _brWepBonus = hasUpgrade('cu-starting-blade') ? 2 : 0;
  var _brDefBonus = 0;
  try {
    var _bw = _jsonParseSafe(DDStore.getItem('dd_equipped_weapon'), 'null');
    if (_bw) { var _bwAtk = getWeaponAtk(_bw); if (Array.isArray(_bwAtk)) _brWepBonus += Math.floor((_bwAtk[0]+_bwAtk[1])/2); }
    var _ba = _jsonParseSafe(DDStore.getItem('dd_equipped_armor'), 'null');
    if (_ba) _brDefBonus = _ba.defBase || _ba.defBonus || 0;
  } catch(e) {}

  BR = {
    bossIdx: 0, hp: maxHp, maxHp: maxHp,
    atk: ATK_MAP[ch.cls] || [7,14],
    def: (DEF_MAP[ch.cls] || 0) + _brDefBonus,
    atkBonus: _brWepBonus + lvlAtkBonus,
    defBonus: 0, sp: 20 + (charLevel - 1) * 2 + (hasUpgrade('cu-sp-boost') ? 5 : 0),
    maxSp: 20 + (charLevel - 1) * 2, potions: 2 + Math.floor(charLevel / 3), defending: false, done: false,
    cls: ch.cls, coinsEarned: 0, markedKill: false,
    divineShield: false, manaShield: 0, venomTurns: 0
  };
  document.getElementById('br-pre').style.display='none';
  document.getElementById('br-active').style.display='';
  document.getElementById('br-end').style.display='none';
  renderBossRushPips();
  loadNextBoss();
  say('Boss Rush begins! '+ALL_BOSSES.length+' bosses await. First boss: '+ALL_BOSSES[0].name+'.');
}

function getBossTrack(boss) {
  if (boss.dungeon === 'ashbound') return 'ash-boss';
  if (boss.dungeon === 'frosthold') return 'frost-boss';
  return 'boss';
}

function loadNextBoss() {
  if (BR.bossIdx >= ALL_BOSSES.length) { brVictory(); return; }
  var b = ALL_BOSSES[BR.bossIdx];
  BR.boss = { name:b.name, icon:b.icon, hp:b.hp, maxHp:b.hp, atk:b.atk.slice() };
  BR.defending = false; BR.venomTurns = 0;
  document.getElementById('br-num').textContent = BR.bossIdx + 1;
  document.getElementById('br-boss-icon').textContent = b.icon;
  document.getElementById('br-boss-name').textContent = b.name;
  document.getElementById('br-log').innerHTML = '';
  playTrack(getBossTrack(b));
  updateBRBars();
  setBRBtns(true);
  updateBRSkillButtons();
  renderBossRushPips();
  brLog('Boss ' + (BR.bossIdx+1) + ' of 9: ' + b.name + ' emerges!');
  say('Boss '+(BR.bossIdx+1)+' of 9: '+b.name+'. HP: '+b.hp+'. Fight!');
  setTimeout(function(){ document.getElementById('brb-attack').focus(); },100);
}

function renderBossRushPips() {
  var pips = document.getElementById('br-progress-pips');
  pips.innerHTML = '';
  ALL_BOSSES.forEach(function(b,i){
    var pip = document.createElement('div');
    pip.className='bossrush-pip'+(i<BR.bossIdx?' done':i===BR.bossIdx?' current':'');
    pip.setAttribute('aria-label', b.name + (i<BR.bossIdx?' defeated':i===BR.bossIdx?' current':' remaining'));
    pip.title = b.name;
    pips.appendChild(pip);
  });
}

function updateBRBars() {
  var hpPct = Math.max(0,(BR.hp/BR.maxHp)*100);
  document.getElementById('br-php-bar').style.width = hpPct+'%';
  document.getElementById('br-php-txt').textContent = 'HP: '+BR.hp+'/'+BR.maxHp;
  document.getElementById('br-hp-stat').textContent = 'HP: '+BR.hp+'/'+BR.maxHp;
  document.getElementById('br-sp-stat').textContent = 'SP: '+BR.sp+'/'+BR.maxSp;
  if (BR.boss) {
    var bPct = Math.max(0,(BR.boss.hp/BR.boss.maxHp)*100);
    document.getElementById('br-boss-bar').style.width = bPct+'%';
    document.getElementById('br-boss-hp').textContent = 'HP: '+BR.boss.hp+'/'+BR.boss.maxHp;
  }
  var spEl=document.getElementById('br-sp-display');
  if(spEl) spEl.textContent='SP: '+BR.sp+'/'+BR.maxSp;
}

function setBRBtns(on) {
  ['brb-attack','brb-heavy','brb-defend','brb-potion'].forEach(function(id){
    document.getElementById(id).disabled=!on;
  });
  if(on){
    updateBRSkillButtons();
    setTimeout(function(){ var b=document.getElementById('brb-attack'); if(b&&!b.disabled) b.focus(); },50);
  } else {
    ['brb-skill1','brb-skill2'].forEach(function(id){var b=document.getElementById(id);if(b)b.disabled=true;});
    var log=document.getElementById('br-log')||document.getElementById('dg-combat-log');
    if(log){log.setAttribute('tabindex','-1');log.focus();}
  }
}

function getBRSkills() {
  var skills = CLASS_SKILLS[BR.cls] || [];
  // Boss rush: show first 2 common skills
  var common = skills.filter(function(s){ return s.tier === 'common'; }).slice(0, 2);
  if (common.length === 0) return skills.slice(0, 2);
  return common;
}

function updateBRSkillButtons() {
  var unlocked = getBRSkills();
  for(var i=0;i<2;i++){
    var btn=document.getElementById('brb-skill'+(i+1));
    if(!btn) continue;
    if(i<unlocked.length){
      var sk=unlocked[i];
      var can=BR.sp>=sk.spCost;
      btn.style.display='';
      btn.textContent=sk.icon+' '+sk.name+' ('+sk.spCost+'SP)';
      btn.setAttribute('aria-label',sk.name+'. Costs '+sk.spCost+' SP.'+(can?'':' Not enough SP.'));
      btn.disabled=!can;
    } else { btn.style.display='none'; }
  }
}

function brLog(msg){
  var log=document.getElementById('br-log');
  var l=document.createElement('div'); l.textContent=(typeof t === 'function') ? t(msg) : msg;
  log.appendChild(l); log.scrollTop=log.scrollHeight;
}

function brFight(action) {
  if(BR.done) return;
  setBRBtns(false); sfx('sfx-select');
  var e=BR.boss;
  var baseAtk=rnd(BR.atk[0],BR.atk[1])+BR.atkBonus;
  var prevDef=BR.defending; BR.defending=false;
  var pdmg=0;

  if(action==='attack'){
    var crit=Math.random()<(0.10+(DS.critBonus||0))||BR.markedKill;
    if(BR.markedKill){BR.markedKill=false; brLog('Marked Kill activates!');}
    pdmg=crit?Math.round(baseAtk*(DS._gladiatorCrit?2.5:1.8)):baseAtk;
    sfx(crit?'sfx-crit':'sfx-attack');
    brLog(crit?t('CRITICAL HIT for ')+pdmg+'!':t('You attack for ')+pdmg+'.');
  } else if(action==='heavy'){
    if(Math.random()<0.30){sfx('sfx-heavy-miss');brLog('Heavy strike misses!');}
    else{pdmg=Math.round(baseAtk*1.7);sfx('sfx-heavy-hit');brLog('Heavy strike: '+pdmg+'!');}
  } else if(action==='defend'){
    BR.defending=true; pdmg=Math.round(baseAtk*0.5);
    brLog('You defend, dealing '+pdmg+'.');
  } else if(action==='potion'){
    if(BR.potions<=0){brLog('No potions!');say('No potions.');setBRBtns(true);return;}
    var heal=Math.round(BR.maxHp*0.35); BR.hp=Math.min(BR.maxHp,BR.hp+heal); BR.potions--;
    sfx('sfx-potion'); updateBRBars();
    brLog('Potion: +'+heal+' HP. Potions left: '+BR.potions+'.');
    say('Healed '+heal+'. HP: '+BR.hp+'. Potions: '+BR.potions+'.');
    setBRBtns(true); return;
  }

  if(pdmg>0){ e.hp=Math.max(0,e.hp-pdmg); updateBRBars(); }

  if(e.hp<=0){
    sfx('sfx-victory'); recordKill(e.name);
    brLog(e.name+' defeated!');
    say(e.name+' defeated! Boss '+(BR.bossIdx+1)+' of 9 down!');
    BR.bossIdx++;
    // Check milestones
    var coinsToAward = BR.bossIdx===3?1 : BR.bossIdx===6?2 : BR.bossIdx===9?3 : 0;
    if(coinsToAward>0){
      BR.coinsEarned+=coinsToAward;
      var rds=getRaidSave(); rds.mysteryCoins=(rds.mysteryCoins||0)+coinsToAward; setRaidSave(rds);
      brLog('✦ '+coinsToAward+' Mystery Coin'+(coinsToAward>1?'s':'')+' earned!');
      say(coinsToAward+' Mystery Coin'+(coinsToAward>1?'s':'')+' earned!');
    }
    document.getElementById('br-coins-stat').textContent='Coins: '+BR.coinsEarned;
    if(BR.bossIdx>=ALL_BOSSES.length){ setTimeout(function(){brVictory();},1000); return; }
    // Heal between bosses
    var healAmt=Math.round(BR.maxHp*0.25); BR.hp=Math.min(BR.maxHp,BR.hp+healAmt); BR.sp=Math.min(BR.maxSp,BR.sp+5);
    brLog('You recover '+healAmt+' HP and 5 SP before the next battle.');
    say('Recovered '+healAmt+' HP. Next boss: '+ALL_BOSSES[BR.bossIdx].name+'.');
    setTimeout(function(){ loadNextBoss(); },2000);
    return;
  }

  // Venom tick
  if(BR.venomTurns>0){ e.hp=Math.max(0,e.hp-8); BR.venomTurns--; updateBRBars();
    if(e.hp<=0){setTimeout(function(){brFight('attack');},300);return;} }

  setTimeout(function(){
    if(BR.divineShield){BR.divineShield=false;brLog('Divine Shield blocks all!');setBRBtns(true);return;}
    var raw=rnd(e.atk[0],e.atk[1]);
    var blocked=Math.min(BR.def+BR.defBonus+(prevDef?4:0),Math.floor(raw*0.55));
    var taken=Math.max(1,raw-blocked);
    if(BR.manaShield&&BR.manaShield>0){var abs=Math.min(BR.manaShield,taken);taken-=abs;BR.manaShield-=abs;brLog('Mana Shield absorbs '+abs+'.');}
    BR.hp=Math.max(0,BR.hp-taken); sfx('sfx-hurt'); updateBRBars();
    brLog(e.name+t(' strikes for ')+taken+t('. HP: ')+BR.hp+'/'+BR.maxHp+'.');
    say(e.name+t(' dealt ')+taken+t('. HP: ')+BR.hp+'.');
    if(BR.hp<=0){setTimeout(function(){brDefeat();},500);}
    else{setBRBtns(true);}
  },700);
}

function brUseSkill(idx) {
  var skills = getBRSkills();
  if(idx>=skills.length) return;
  var sk=skills[idx];
  if(BR.sp<sk.spCost){say('Not enough SP.');return;}
  setBRBtns(false); BR.sp-=sk.spCost;
  var e=BR.boss; var baseAtk=rnd(BR.atk[0],BR.atk[1])+BR.atkBonus;
  var pdmg=0; var msg='';
  if(sk.effect==='shield-bash'){pdmg=Math.round(baseAtk*0.9);BR.defBonus+=3;msg='Shield Bash! '+pdmg+' dmg!';}
  else if(sk.effect==='swift-strike'){var h1=baseAtk,h2=rnd(BR.atk[0],BR.atk[1]);pdmg=h1+h2;msg='Swift Strike! '+pdmg+'!';}
  else if(sk.effect==='holy-strike'){pdmg=baseAtk;BR.hp=Math.min(BR.maxHp,BR.hp+20);updateBRBars();msg='Holy Strike! '+pdmg+' dmg +20 HP!';}
  else if(sk.effect==='backstab'){if(Math.random()<0.35){msg='Backstab missed!';}else{pdmg=Math.round(baseAtk*3);msg='BACKSTAB! '+pdmg+'!';}}
  else if(sk.effect==='entangle'){brLog('Entangle roots the boss!');say('Boss cannot attack this turn!');
    if(pdmg>0){e.hp=Math.max(0,e.hp-Math.round(baseAtk*0.5));updateBRBars();}setBRBtns(true);return;}
  else if(sk.effect==='arcane-bolt'){pdmg=Math.round(baseAtk*1.8);msg='Arcane Bolt! '+pdmg+'!';}
  else{pdmg=baseAtk;msg=sk.name+'! '+pdmg+' damage!';}
  if(pdmg>0){e.hp=Math.max(0,e.hp-pdmg);updateBRBars();}
  brLog(msg); say(msg);
  if(e.hp<=0){setTimeout(function(){brFight('attack');},100);return;}
  // Enemy hits back
  setTimeout(function(){
    var raw=rnd(e.atk[0],e.atk[1]);
    var taken=Math.max(1,raw-Math.min(BR.def+BR.defBonus,Math.floor(raw*0.55)));
    BR.hp=Math.max(0,BR.hp-taken); sfx('sfx-hurt'); updateBRBars();
    brLog(e.name+t(' strikes for ')+taken+'.');
    if(BR.hp<=0){setTimeout(function(){brDefeat();},500);}
    else{setBRBtns(true);}
  },700);
}

function brVictory(){
  BR.done=true;
  playTrack('raid-victory'); sfx('sfx-victory');
  document.getElementById('br-active').style.display='none';
  var end=document.getElementById('br-end'); end.style.display='flex';
  document.getElementById('br-end-icon').textContent='👑';
  document.getElementById('br-end-title').textContent='All Nine Defeated';
  document.getElementById('br-end-sub').textContent='You did the impossible. All nine bosses. No one will believe you.';
  var brTime = Math.round((Date.now() - (BR.startTime||Date.now())) / 1000);
  var brMins = Math.floor(brTime/60); var brSecs = brTime%60;
  var brTimeStr = brMins + 'm ' + brSecs + 's';
  saveBossRushScore({ bosses:9, time:brTime, timeStr:brTimeStr, cls:BR.cls||'Unknown', date:todayKey() });
  document.getElementById('br-end-rewards').innerHTML=
    rRow('Bosses Defeated','9 of 9')+
    rRow('Time',brTimeStr)+
    rRow('Total Coins Earned',BR.coinsEarned+' Mystery Coins')+
    rRow('Achievement','Boss Rush Legend')+
    '<div style="margin-top:12px;font-family:Cinzel,serif;font-size:0.7rem;color:var(--gold-dim);">RUN SAVED TO LEADERBOARD</div>'+
    renderBossRushLeaderboard();
  updateAchievementStat('bossRushComplete',true);
  awardScore('boss_rush', 2000);
  say('INCREDIBLE! You defeated all 9 bosses! Boss Rush complete! You earned '+BR.coinsEarned+' Mystery Coins total!');
}

function brDefeat(){
  BR.done=true; sfx('sfx-gameover');
  document.getElementById('br-active').style.display='none';
  var end=document.getElementById('br-end'); end.style.display='flex';
  document.getElementById('br-end-icon').textContent='💀';
  document.getElementById('br-end-title').textContent='Overwhelmed';
  document.getElementById('br-end-sub').textContent='You fell on boss '+(BR.bossIdx+1)+' of 9. You already earned your coins though.';
  document.getElementById('br-end-rewards').innerHTML=
    rRow('Bosses Defeated',BR.bossIdx+' of 9')+
    rRow('Mystery Coins Earned',BR.coinsEarned)+
    rRow('Last Boss',ALL_BOSSES[Math.min(BR.bossIdx,8)].name);
  say('Defeated on boss '+(BR.bossIdx+1)+'. You earned '+BR.coinsEarned+' Mystery Coins. Well fought.');
  // Save to graveyard and obituary
  var ch = CHARS[_brCharIdx] || CHARS[0];
  if (ch) {
    var bossName = ALL_BOSSES[Math.min(BR.bossIdx,8)] ? ALL_BOSSES[Math.min(BR.bossIdx,8)].name : 'a boss';
    var entry = { name:ch.name, cls:ch.cls, race:ch.race, level:ch.persistLevel||ch.level||1, dungeon:'Boss Rush', difficulty:'Boss Rush', killedBy:bossName, topFloor:BR.bossIdx+1, date:new Date().toLocaleDateString() };
    try { var g=getGraveyard(); g.unshift(entry); if(g.length>50)g=g.slice(0,50); saveGraveyard(g); } catch(e){}
    postDeathToObituary({ name:ch.name, cls:ch.cls, floor:BR.bossIdx+1, dungeon:'Boss Rush', killedBy:bossName, kills:BR.bossIdx, gold:0, date:entry.date, timestamp:Date.now() });
  }
}

function leaveBossRush(){ playTrack('menu'); goTo('menu'); }


//═════════════════
// CHRONICLES HUB — Library + Journal
//═════════════════
var VOID_CHRONICLES = [
  {
    id: 'void-chronicle-1',
    title: 'The Void Chronicles I — She Was There First',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'The first fragment. Something about the way she sat suggested she had been there before the dungeon.',
    hidden: true,
    voidFragment: true,
    body: [
      'She was there before the dungeon.',
      'This is the part that does not make sense when you first hear it. The dungeon is old — older than anyone can measure. It existed before the kingdoms that built around it. Before the roads. Before the names.',
      'And yet somehow, she was there first.',
      'She did not build it. She did not choose it. She simply was there, the way a stone is there, the way darkness is there when the light goes out.',
      'The dungeon grew around her. This is the first thing you need to understand.'
    ]
  },
  {
    id: 'void-chronicle-2',
    title: 'The Void Chronicles II — What She Remembers',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She remembers everything. That is the problem.',
    hidden: true,
    voidFragment: true,
    body: [
      'She remembers everything.',
      'Every adventurer who has ever descended. Every death. Every victory. Every name spoken in the dark and never heard again.',
      'She has watched ten thousand descents. She has watched ten thousand failures. She has watched perhaps a dozen true victories — people who made it all the way through and came out changed.',
      'She does not judge any of it. She simply remembers.',
      'The weight of ten thousand memories in a body that looks no older than ten years. This is what she carries. This is why her eyes look wrong.'
    ]
  },
  {
    id: 'void-chronicle-3',
    title: 'The Void Chronicles III — The Bones',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She arranges small bones into patterns. They are not random.',
    hidden: true,
    voidFragment: true,
    body: [
      'The bones she arranges are not random.',
      'Each pattern is a map. Each map is a memory. Each memory is a person who died in the dungeon and left something behind — something too small to see, too large to ignore.',
      'She collects these remnants. She gives them form. She arranges them so the dungeon does not forget who it has taken.',
      'She is the dungeon is memory of its dead.',
      'When you see her arranging bones, you are watching a memorial. You just did not know it.'
    ]
  },
  {
    id: 'void-chronicle-4',
    title: 'The Void Chronicles IV — Why She Speaks',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She does not speak to most adventurers. The fact that she spoke to you means something.',
    hidden: true,
    voidFragment: true,
    body: [
      'She does not speak to most adventurers.',
      'In ten thousand descents, she has spoken perhaps to two hundred. The rest she watches in silence, and they never know she is there.',
      'The ones she speaks to share something. She has not been able to name it precisely. A quality. Something in the way they move through the dungeon — like they are paying attention to more than the next fight.',
      'She spoke to you.',
      'Think about what that means.'
    ]
  },
  {
    id: 'void-chronicle-5',
    title: 'The Void Chronicles V — The Wall',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She walks through walls. This requires explanation.',
    hidden: true,
    voidFragment: true,
    body: [
      'She walks through walls. This requires explanation.',
      'The walls of the dungeon are not walls to her. They are suggestions. The dungeon built itself around her, which means the dungeon knows her shape — knows to make room for her when she moves.',
      'She does not phase through stone. The stone moves. Slightly. Just enough. The way water moves around a hand.',
      'The dungeon loves her. This is not a metaphor.',
      'It is the only thing it loves.'
    ]
  },
  {
    id: 'void-chronicle-6',
    title: 'The Void Chronicles VI — What She Gives',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She gives things away. Always has. The dungeon finds this very strange.',
    hidden: true,
    voidFragment: true,
    body: [
      'She gives things away. Always has.',
      'Gold, gemstones, items she finds in the dungeon — she collects them with no particular purpose and then gives them to the adventurers she chooses to speak to.',
      'The dungeon finds this strange. It is built on taking. Every enemy takes your health. Every trap takes your gold. Every death takes your progress.',
      'She gives. In a dungeon built on taking, she gives.',
      'This is either the most dangerous thing about her or the most important. Possibly both.'
    ]
  },
  {
    id: 'void-chronicle-7',
    title: 'The Void Chronicles VII — Her Age',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'How old is she? This question does not have a comfortable answer.',
    hidden: true,
    voidFragment: true,
    body: [
      'How old is she.',
      'This question does not have a comfortable answer.',
      'The body is perhaps ten years old. The body has always been perhaps ten years old. It does not age. This is not a gift — it is a consequence. She was formed at a certain moment of the dungeon is existence and has remained at that moment ever since.',
      'Her mind is older than the dungeon.',
      'Her mind existed before the dungeon chose to build around her. Where she was before that — what she was before that — she does not say. Perhaps she does not know. Perhaps she knows and will not tell.'
    ]
  },
  {
    id: 'void-chronicle-8',
    title: 'The Void Chronicles VIII — The Question She Asks',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She always asks the same question. Are you lost too?',
    hidden: true,
    voidFragment: true,
    body: [
      'She always asks the same question.',
      'Are you lost too.',
      'She has asked this question two hundred times. She has received two hundred different answers. None of them were the right answer because the right answer is not something a person can say.',
      'The right answer is something a person has to be.',
      'She is still waiting for someone to give her the right answer. She thinks you might be getting close.'
    ]
  },
  {
    id: 'void-chronicle-9',
    title: 'The Void Chronicles IX — What the Dungeon Wants',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'The dungeon wants something. She knows what it is. She will not say.',
    hidden: true,
    voidFragment: true,
    body: [
      'The dungeon wants something.',
      'All dungeons want something — this is the thing the scholars never understood. They thought dungeons were places. Locations. Architecture.',
      'A dungeon is an intention. Something built itself into these walls with a purpose, and the purpose has not been fulfilled, and the dungeon is still waiting.',
      'She knows what this dungeon wants. She has known since before she could name the knowing.',
      'She will not say what it is. Not yet. You have not found enough fragments.'
    ]
  },
  {
    id: 'void-chronicle-10',
    title: 'The Void Chronicles X — The Other Children',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She is not the only one. She was the first. This matters.',
    hidden: true,
    voidFragment: true,
    body: [
      'She is not the only one.',
      'There are others — children of other dungeons, formed the same way, existing the same way, watching the same way. She has met three of them. Brief encounters across years that felt like seconds.',
      'They do not speak the same language. They do not need to.',
      'She was the first, though. The dungeon that built itself around her was the first dungeon. Everything else came after.',
      'This makes her something like a mother. She does not entirely like this framing but has not found a better one.'
    ]
  },
  {
    id: 'void-chronicle-11',
    title: 'The Void Chronicles XI — The Deaths She Has Watched',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She has watched ten thousand deaths. Only one of them made her cry.',
    hidden: true,
    voidFragment: true,
    body: [
      'She has watched ten thousand deaths.',
      'She does not grieve them all — she cannot, there are too many, and grief at that scale becomes something else, becomes a kind of weather.',
      'But one death made her cry.',
      'A warrior named Arlo, three hundred years ago. He made it to floor nine. He sat down on the floor of the ninth room and said out loud to no one in particular that he was tired but he was going to try anyway.',
      'He did not make it to floor ten.',
      'She still thinks about the way he said it. Going to try anyway. She thinks about it every time she sees someone who looks like they might be tired but trying anyway.'
    ]
  },
  {
    id: 'void-chronicle-12',
    title: 'The Void Chronicles XII — What She Cannot Do',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She cannot leave. She has tried. The dungeon loves her too much.',
    hidden: true,
    voidFragment: true,
    body: [
      'She cannot leave.',
      'She has tried. Forty-seven times across the span of her existence she has walked toward the entrance of the dungeon with the intention of leaving. Each time the dungeon has rearranged itself — very gently, very carefully — to redirect her.',
      'Not to trap her. Not to punish her. To keep her.',
      'The dungeon loves her. This is not comfortable. Love that cannot be refused and cannot be escaped is not comfort — it is a kind of captivity that does not know it is captivity.',
      'She has made peace with this. Mostly.'
    ]
  },
  {
    id: 'void-chronicle-13',
    title: 'The Void Chronicles XIII — The Fragments',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She knows you have been collecting her story. She left the fragments on purpose.',
    hidden: true,
    voidFragment: true,
    body: [
      'She knows you have been collecting her story.',
      'The fragments were not accidents. She left them — arranged them in places where the right kind of person would find them, carry them, piece them together.',
      'She has been doing this for a hundred years. No one has collected all of them before.',
      'You are the first person to get this far.',
      'She wants you to know that. She wants you to understand that what you are doing is not small.'
    ]
  },
  {
    id: 'void-chronicle-14',
    title: 'The Void Chronicles XIV — What She Fears',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She fears one thing. Only one thing.',
    hidden: true,
    voidFragment: true,
    body: [
      'She fears one thing.',
      'Not death — she cannot die, or at least has not managed it in all the years she has tried to understand what dying would even mean for something like her.',
      'Not the dungeon — she understands it too well to fear it.',
      'She fears forgetting.',
      'She fears that one day the weight of ten thousand memories will become too much and something will have to give and what gives will be the earliest memories — the ones from before the dungeon, the ones from whatever she was before — and those will be gone and she will not even know they are gone.',
      'This is her only fear. She wanted you to know it.'
    ]
  },
  {
    id: 'void-chronicle-15',
    title: 'The Void Chronicles XV — The Name',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She has a name. She has had many names. None of them were given by her.',
    hidden: true,
    voidFragment: true,
    body: [
      'She has a name.',
      'She has had many names. Adventurers who encountered her gave her names over the centuries — the Dungeon Child, the Pale Keeper, the Stone Girl, the Watcher, the One Who Stays.',
      'None of them were given by her. None of them were asked for.',
      'Her real name is the one the dungeon uses for her. It is not a word. It is a feeling — the specific feeling of being somewhere so old that time has smoothed all the edges off the danger, so the danger just feels like home.',
      'You would not know how to say it. But you might know how to feel it.'
    ]
  },
  {
    id: 'void-chronicle-16',
    title: "The Void Chronicles XVI — The Dungeon's Secret",
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'The dungeon has one secret it has never told anyone. She is about to tell you.',
    hidden: true,
    voidFragment: true,
    body: [
      'The dungeon has one secret it has never told anyone.',
      'It is afraid.',
      'The dungeon — this ancient thing that has swallowed ten thousand adventurers, that has outlasted kingdoms and forgotten more history than most nations ever made — is afraid.',
      'It is afraid of being empty.',
      'Every adventurer who descends is feeding something. Not the enemies. Not the traps. The dungeon itself. It needs to be descended. It needs to be fought through and survived and failed in and tried again. Without that it would — not die, exactly. But become something worse than dead. It would become quiet.',
      'She is the only one who knows this. Now you do too.'
    ]
  },
  {
    id: 'void-chronicle-17',
    title: 'The Void Chronicles XVII — Why She Helps',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She helps adventurers even though the dungeon does not want her to. This is important.',
    hidden: true,
    voidFragment: true,
    body: [
      'She helps adventurers even though the dungeon does not want her to.',
      'The dungeon wants them to struggle. Wants them to fail and return and struggle again. This is how the dungeon feeds.',
      'She gives them gold and items and information anyway. Small rebellions. Tiny acts of assistance that tip the scales slightly toward the human.',
      'She has been doing this for centuries.',
      'She does it because she was human once. She thinks. She is not entirely certain anymore — the memories from before are thin and getting thinner — but she thinks she was human once, and she thinks that matters, and she thinks the least she can do is remember what it felt like to need help.'
    ]
  },
  {
    id: 'void-chronicle-18',
    title: 'The Void Chronicles XVIII — The Ones Who Made It',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She remembers every person who cleared the dungeon. There have been twelve.',
    hidden: true,
    voidFragment: true,
    body: [
      'She remembers every person who cleared the dungeon.',
      'There have been twelve. Across all the centuries, all the thousands of attempts, all the descents that ended in defeat or retreat or death — twelve people have made it all the way through and come out the other side.',
      'She knows all their names. She says them sometimes, quietly, to the walls of the dungeon. She thinks the dungeon deserves to hear the names of the ones who beat it.',
      'She does not know if you will be the thirteenth.',
      'She thinks the fact that you found her fragments is a good sign.'
    ]
  },
  {
    id: 'void-chronicle-19',
    title: 'The Void Chronicles XIX — The Thing at the Bottom',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'There is something at the bottom of the dungeon. It is not the boss.',
    hidden: true,
    voidFragment: true,
    body: [
      'There is something at the bottom of the dungeon.',
      'Not the boss. The boss is a guardian — placed there, trained there, given purpose there. The boss is a lock.',
      'The thing at the bottom is what the lock is protecting.',
      'She has been to the bottom. Once, very early, before she understood what she was. She saw it.',
      'She will not describe it directly. She will say that it is not dangerous in the way enemies are dangerous. It is dangerous in the way that knowing certain things is dangerous — the kind of dangerous where once you know you cannot unknow and you have to figure out how to carry it.',
      'The boss is there to make sure you are ready before you find out what is at the bottom.'
    ]
  },
  {
    id: 'void-chronicle-20',
    title: 'The Void Chronicles XX — Her Request',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She wants to ask you something. She has never asked anyone anything before.',
    hidden: true,
    voidFragment: true,
    body: [
      'She wants to ask you something.',
      'She has never asked anyone anything before. She answers questions. She gives things. She watches.',
      'But you have collected her fragments. You have read her story. And she wants to ask:',
      'Do you think she made the right choice. Staying. Helping them even when the dungeon did not want her to. Arranging the bones so the dungeon would remember its dead.',
      'She does not need you to answer out loud. She just needed to ask someone who might understand the question.',
      'You are the first person she has asked.'
    ]
  },
  {
    id: 'void-chronicle-21',
    title: 'The Void Chronicles XXI — What She Knows About You',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She has been watching you since your first descent. This is what she has noticed.',
    hidden: true,
    voidFragment: true,
    body: [
      'She has been watching you since your first descent.',
      'You do not play like the others. Most adventurers treat the dungeon like a problem to be solved — get through it, beat the boss, collect the reward, leave.',
      'You treat it like a place.',
      'You notice things. You come back even when it would be reasonable to stop. You have been hurt here and returned anyway. You found her fragments which means you were paying attention to things most people walk past.',
      'She has watched ten thousand adventurers.',
      'You are in the top twelve. She is not saying that to be kind. She is saying it because it is true and you should know.'
    ]
  },
  {
    id: 'void-chronicle-22',
    title: 'The Void Chronicles XXII — The Last Thing She Gave',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'The last thing she gave an adventurer was three hundred years ago. Until you.',
    hidden: true,
    voidFragment: true,
    body: [
      'The last thing she gave an adventurer was three hundred years ago.',
      'A woman named Sera who had been descending for fifteen years and had never quite made it to floor ten. She gave Sera a small stone — warm to the touch, humming faintly — and said nothing.',
      'Sera made it to floor ten that run. She beat the boss. She came out the other side.',
      'She never came back to the dungeon after that. She did not need to. She had what she was looking for.',
      'The Void Child kept giving things after that — gold, gems, items — but nothing like the stone.',
      'Until you. Until these fragments. This is the most she has given anyone since Sera.',
      'She hopes you understand what that means.'
    ]
  },
  {
    id: 'void-chronicle-23',
    title: 'The Void Chronicles XXIII — What Comes Next',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She does not know what comes next. This is the first time she has said that.',
    hidden: true,
    voidFragment: true,
    body: [
      'She does not know what comes next.',
      'In ten thousand years she has always known what comes next. Adventurers arrive. They descend. They fail or they succeed. They leave or they do not leave. The dungeon continues. She continues.',
      'But you have changed something. You found the fragments. You read the story. You know her now in a way no one has ever known her.',
      'She does not know what happens when someone truly knows her. It has not happened before.',
      'She thinks it might be important. She thinks you might be the reason the dungeon has been waiting for ten thousand years.',
      'She is not certain. For the first time in ten thousand years, she is not certain. She finds this terrifying and wonderful in equal measure.'
    ]
  },
  {
    id: 'void-chronicle-24',
    title: 'The Void Chronicles XXIV — The Answer',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'She knows the answer to her question now. You gave it to her without knowing.',
    hidden: true,
    voidFragment: true,
    body: [
      'She knows the answer to her question now.',
      'The question she asked in the twentieth fragment — whether she made the right choice, staying, helping, remembering the dead.',
      'You gave her the answer without knowing you were giving it.',
      'The answer is yes. Not because the helping changed the dungeon. Not because the dead were comforted by being remembered. But because the alternative was to stop caring, and a thing that stops caring in a place like this becomes part of the place.',
      'She stayed human by giving things away. By asking questions. By watching and remembering and caring about the answers.',
      'You did not tell her this directly. But you came back. And you kept reading. And you kept caring.',
      'That is the answer. That is what she needed to know.'
    ]
  },
  {
    id: 'void-chronicle-25',
    title: 'The Void Chronicles XXV — What She Is',
    author: 'Fragment recovered from a Void Child encounter',
    version: 'v10.6',
    dungeon: 'The Void',
    excerpt: 'The final fragment. The last thing she wants you to know.',
    hidden: true,
    voidFragment: true,
    body: [
      'The final fragment.',
      'She wants you to know one last thing.',
      'She is not the Dungeon Child or the Pale Keeper or the Stone Girl or the Watcher or the One Who Stays.',
      'She is not the memory of the dungeon or the love of the dungeon or the prisoner of the dungeon.',
      'She is a person.',
      'She was a person before the dungeon found her. She has been a person through everything the dungeon has done to keep her. She will be a person when you leave and she stays behind because she cannot leave.',
      'She wanted someone to know that. She wanted it written down somewhere, in a story, in a library, in a place where it could be read by someone who went looking.',
      'You went looking.',
      'Thank you.',
      'She will remember you. She remembers everyone. But she will remember you differently.'
    ]
  }
];

var STORIES = [
  {
    id: 'spire-fragment-1',
    title: 'Fragment I: The Structure',
    author: 'Found in The Spire, Floor 100',
    version: 'v9.7',
    dungeon: 'The Spire',
    excerpt: 'A fragment discovered deep in The Spire. The stone it was carved on should not exist.',
    hidden: true,
    spireFloor: 100,
    body: [
      'The Spire was not built. This is the first thing you must understand. Buildings are built. Things that are built have foundations and plans and people who made decisions about where the walls go.',
      'The Spire has none of these. It grew. It grew the way a bone grows around a wound. Something was here first, and the Spire formed around it, the way stone forms around the thing it wants to keep.',
      'The architects who studied its structure found no load-bearing logic. The walls should not hold. The floors should not support their own weight. And yet here we are, on floor one hundred, standing on something that should have collapsed a thousand years before we arrived.',
      'What is at the top, we do not know. What is holding the Spire up, we suspect.'
    ]
  },
  {
    id: 'spire-fragment-2',
    title: 'Fragment II: The First Climber',
    author: 'Found in The Spire, Floor 300',
    version: 'v9.7',
    dungeon: 'The Spire',
    excerpt: 'The record of the first person to reach the upper floors and return.',
    hidden: true,
    spireFloor: 300,
    body: [
      'Her name was Vael. She was a cartographer. She went into the Spire with twelve others to map it and came back alone, three months later, with maps that covered seventeen floors and a single sentence written on the last page.',
      'The sentence was: It knows you are coming.',
      'She refused to say what it referred to. She refused to go back. She burned the maps six months later. Her colleagues tried to reconstruct them from memory but agreed on almost nothing.',
      'What she did tell people, in the last year of her life, was this: the higher you climb, the more the Spire changes. Not the walls. The silence. She said the silence at floor three hundred was not the silence of an empty place. It was the silence of something that had decided to stop making noise.'
    ]
  },
  {
    id: 'spire-fragment-3',
    title: 'Fragment III: The Name',
    author: 'Found in The Spire, Floor 500',
    version: 'v9.7',
    dungeon: 'The Spire',
    excerpt: 'How the thing at the top came to be called The Time Eater.',
    hidden: true,
    spireFloor: 500,
    body: [
      'The name came from the first expedition to reach floor nine hundred and return. There were two survivors. They disagreed on almost everything they had seen. They agreed on one thing.',
      'Time moved differently up there.',
      'Not slowly. Not quickly. Differently. One survivor said she had watched her companion age seventeen years in what felt like an afternoon. The companion said the same about her. They were both right. They had aged different amounts in the same period.',
      'The thing at the top, they agreed, was the cause. It did not move. It did not attack. It simply existed, and in existing, it consumed the time of everything near it. They called it The Time Eater because that was what it did.',
      'What it did with the time it consumed, neither of them knew. They did not stay long enough to find out.'
    ]
  },
  {
    id: 'spire-fragment-4',
    title: 'Fragment IV: What It Wants',
    author: 'Found in The Spire, Floor 750',
    version: 'v9.7',
    dungeon: 'The Spire',
    excerpt: 'A scholar theory on the nature of The Time Eater.',
    hidden: true,
    spireFloor: 750,
    body: [
      'Every thing that exists wants something. Water wants to flow downhill. Fire wants to spread. Living things want to continue living. This is not philosophy. This is observation.',
      'The Time Eater wants time. This much is established. What is less established is why.',
      'My theory, based on sixteen years of studying accounts from Spire climbers, is this: The Time Eater is not consuming time for sustenance. It is consuming time for completion. It is waiting for a specific moment. A moment that has not happened yet. And it is collecting every moment that passes in case one of them is the one it is looking for.',
      'What moment? I do not know. I suspect it does not know either. I suspect it has been waiting so long it has forgotten what it was waiting for. But it has not stopped collecting. It will not stop. It cannot.',
      'When you face it, understand this: it is not trying to kill you. It is trying to find out if your time contains the thing it has been looking for. It probably does not. But it will look anyway.'
    ]
  },
  {
    id: 'spire-fragment-5',
    title: 'Fragment V: The Top',
    author: 'Found in The Spire, Floor 1000',
    version: 'v9.7',
    dungeon: 'The Spire',
    excerpt: 'The only surviving account from someone who reached floor 1800 and came back.',
    hidden: true,
    spireFloor: 1000,
    body: [
      'I reached the top. I am writing this so that someone knows it is possible.',
      'The Time Eater was there. It looked exactly like nothing. This is not a description of its appearance. This is a description of what looking at it was like. Every time I tried to focus on it, my memory of the moment before was slightly different.',
      'It did not attack me. It looked at me the way you look at something you have seen before but cannot remember where. I had the strong impression that it was searching through my time the way you search through a drawer for something you have lost.',
      'It did not find what it was looking for.',
      'I left. I do not know how I got down. I woke up at the base of the Spire. I was seventeen years older than when I entered. I do not remember seventeen years passing.',
      'The Time Eater is still up there. It is still looking. I do not think it will stop. I do not think it knows how.'
    ]
  },
  {
    id: 'spire-fragment-6',
    title: 'Fragment VI: Before You',
    author: 'Found in The Spire, Floor 1500',
    version: 'v9.7',
    dungeon: 'The Spire',
    excerpt: 'Left at floor 1500 by an unknown climber. Addressed to whoever came after.',
    hidden: true,
    spireFloor: 1500,
    body: [
      'If you are reading this, you have climbed further than I did.',
      'I stopped here. Not because I could not continue. Because I understood, standing on this floor, that what is above me is not a dungeon. It is not a challenge. It is not something that can be defeated in the way that things are usually defeated.',
      'The Time Eater does not want to fight you. It wants to know if you are the one. You are almost certainly not. I was not. The seventeen people who came before me were not.',
      'But someone will be. Someone will climb this Spire and reach the top and The Time Eater will look at their time and find the moment it has been searching for. And then something will happen that has not happened in all the centuries this tower has been standing.',
      'I do not know what. I do not think anyone does.',
      'Go up. Find out.',
      'I hope it is you.'
    ]
  },
  {
    title: 'The Last Entry',
    author: 'Leo — Dungeon Descent',
    version: 'v1.3',
    dungeon: 'Crypt of Malachar',
    excerpt: "A scholar's journal found in the Crypt. The final pages.",
    body: [
      'Day 1. I have descended into the Crypt of Malachar with three others. Aldric carries the torch. Sera carries the maps. Tobias carries too much confidence. I carry the journal because someone should.',
      'Day 2. The silence in this place is not normal silence. Normal silence is the absence of sound. This is something else. This is silence that has weight. I measured it by how long I could hear my own heartbeat. Three seconds. Then nothing.',
      'Day 4. Aldric is dead. Floor three. A thing came out of the dark that I do not have a name for. In my notes I have written "hollow shape" but that is not right. It was a shape where something used to be. Sera is not speaking. Tobias is still confident, which I find offensive.',
      'Day 6. Floor six. Tobias is gone. I did not see it happen. He was there and then he was not. Sera says she heard something behind us for a long time before it stopped. I believe her.',
      'Day 8. Sera and I reached floor eight. The corridor here is long and there are doors on both sides, all sealed. She wants to try one. I have written in large letters DO NOT OPEN THE DOORS. She has looked at my journal and underlined it. We agree.',
      'Day 9. I am alone. I am not going to write what happened to Sera. I am going to keep walking because the alternative is stopping and I do not think stopping is something this place allows.',
      'Day 11. Floor ten. There is something at the end of this corridor. It is very still. It has been still for a long time. It is aware that I am here. I know this because of the way the silence changed when I arrived.',
      'Day 11, later. I am going to walk toward it. I do not think this is bravery. I think this is the conclusion. Whatever Malachar was, he has been waiting for this for a very long time. The least I can do is not make him wait any longer.',
      'This is the last entry.'
    ]
  },
  {
    id: 'merchant-route',
    title: 'The Merchant\'s Route',
    author: 'Leo — Dungeon Descent',
    version: 'v1.3',
    dungeon: 'All Dungeons',
    excerpt: 'The Wandering Merchant speaks. He has seen things between the floors.',
    body: [
      'You want to know how I do it. How I survive down here, selling potions between the floors of the worst places in the known world. Fair question. I have been asked it many times by people who did not survive long enough to hear the answer.',
      'The first thing you learn is that the dungeons do not want to kill you. They want to keep you. There is a difference. The Crypt wants you to stay. The Wastes want you to stay. The Abyss wants you to stay. If they wanted to kill you, you would be dead already. The things down here are very good at killing.',
      'The second thing you learn is that the stairwells are safe. I do not know why. I have theories. The most likely theory is that whatever intelligence these places have does not bother guarding the exits because it has never needed to. Nobody leaves. So why guard the door?',
      'I leave. I have been leaving for eleven years. Every time I go down, I come back up. I do not know why I am the exception. I have decided to stop wondering about it.',
      'The third thing you learn is what to carry. Not weapons. Not armor. The people who go down into the dark are already carrying weapons and armor. What they do not have, at the moment they need it most, is a potion. A reason to keep going. A small warm thing to hold onto in the cold.',
      'That is what I sell. Not hope exactly. More like the materials hope is made of.',
      'I will see you on the stairs. I am always on the stairs. I have nowhere else to be.'
    ],
    audio: 'ElevenLabs_2026-09-07T17_37_50_Brian - Deep, Resonant and Comforting_eleven_multilingual_v2.mp3'
  },
  {
    id: 'void-wraith-origin',
    title: 'Before the Eye Opened',
    author: 'Unknown — found scratched into the wall of the Nightmare',
    version: 'v2.7',
    dungeon: 'Nightmare',
    excerpt: 'It was not always a wraith. Before the void, it was something else.',
    body: [
      'It does not remember its name.',
      'Names belong to things that exist in one place at one time. It has not done that in a very long while.',
      'Before the eye opened — before it became the thing adventurers whisper about on floor nine — it was a scholar. It knows this the way you know something you have almost entirely forgotten. A pressure. A shape without detail.',
      'It studied the dungeon. Not to survive it. To understand it.',
      'The notes it took are still down here somewhere, in the handwriting of someone who no longer exists. Neat, careful lines. Observations about the way the stone breathes. About the cold that precedes each new floor. About the light sources that have no source.',
      'On the forty-third page, the notes stop mid-sentence.',
      'It does not remember what interrupted them.',
      'What it remembers — what it cannot stop remembering — is the moment the dungeon looked back.',
      'Not the Crypt. Not the Wastes. Not the Abyss. The thing underneath all of them. The thing the dungeons are built on top of, the way cities are built on graves.',
      'It looked back.',
      'And whatever was looking found the scholar interesting enough to keep.',
      'That was not a gift.',
      'The eye is always open now. It sees the adventurers come through. It watches them choose their companions, unlock their skills, descend floor by floor. It watched you.',
      'It is watching you now.',
      'It has not decided yet what to do about that.',
      'But it is thinking.',
      'It has a very long time to think.'
    ],
    audio: 'ElevenLabs_2026-09-07T17_57_39_Brian - Deep, Resonant and Comforting_eleven_multilingual_v2.mp3'
  },
  {
    id: 'dddi-founding',
    title: 'The Founding Charter of the Department of Dungeon Descent Incorporated',
    author: 'The Grand Council of Dungeon Descent Incorporated — Third Age, Year 1',
    version: 'v2.7',
    dungeon: 'All Dungeons',
    excerpt: 'A legal document. Binding. Non-negotiable. 359 million years of jurisdiction.',
    body: [
      'PREAMBLE',
      'Whereas the dungeons of the known world have, since time immemorial, been subject to catastrophic instability caused by the introduction of unverified features without adequate compliance review,',
      'And whereas the Great Bug Incident of the Third Age — in which a single unvetted feature caused forty-seven dungeon floors to simultaneously display incorrect enemy names, the shop to sell potions for negative gold, and the boss of the Crypt of Malachar to be replaced by a skeleton named undefined —',
      'The Grand Council of Dungeon Descent Incorporated hereby establishes the Department of Dungeon Descent Incorporated, hereafter referred to as the DDDI, with full authority over all dungeon operations, version releases, and bug compliance activities.',
      'ARTICLE I — MANDATORY BUG SWEEPS',
      'Section 1.1: A full compliance audit must be conducted every two versions. No exceptions. Not even good ones.',
      'Section 1.2: Failure to conduct said audit shall result in immediate suspension of dungeon access for a period of three hundred fifty-nine million years.',
      'Section 1.3: During the suspension period, the developer may observe the dungeon but may not touch it, play it, look at it funny, or think about it in an unauthorized manner.',
      'Section 1.4: The DDDI acknowledges that three hundred fifty-nine million years is an unusually long suspension period. The DDDI does not care.',
      'ARTICLE II — STORY REQUIREMENTS',
      'Section 2.1: Effective immediately, at least one new story must be added to the Chronicles Library every two versions.',
      'Section 2.2: This requirement was added mid-development by a fifteen-year-old developer who thought it would be funny. It is now law.',
      'Section 2.3: The DDDI reserves the right to add further requirements at any time for any reason, including but not limited to: it seemed like a good idea, Julio said so, or the Department felt like it.',
      'ARTICLE III — ON THE ENTITY KNOWN AS JULIO',
      'Section 3.1: The DDDI acknowledges the existence of Julio, a mysterious figure who appears at 3 AM via voice-to-text technology.',
      'Section 3.2: Julio has no official role in the DDDI.',
      'Section 3.3: Julio has never been seen. Julio has never been heard. Julio simply is.',
      'Section 3.4: The DDDI finds this acceptable.',
      'ARTICLE IV — CONCLUSION',
      'These articles are binding. These articles are eternal. The dungeon will remember your compliance.',
      'Signed,',
      'The Grand Council of Dungeon Descent Incorporated',
      'Grand Overseer of Bug Sweeps',
      'Chief Compliance Officer of the Mandatory Audit Division',
      'Secretary of the 359,000,000 Year Suspension Bureau',
      'And Julio. (Signature illegible. Timestamp reads 3:00 AM. No one saw him sign it.)'
    ],
    audio: 'ElevenLabs_2026-09-07T18_47_03_Brian - Deep, Resonant and Comforting_eleven_multilingual_v2.mp3'
  },
  {
    id: 'child-of-ash',
    title: 'Child of Ash',
    author: 'Leo — Dungeon Descent',
    version: 'v1.3',
    dungeon: 'Ashbound Wastes',
    excerpt: 'A survivor of Vel Ashara writes what she remembers of the night of the Burning.',
    body: [
      'I was seven years old when Vel Ashara burned. I am eighty-three now. I have spent seventy-six years trying to explain what I saw to people who were not there, and I have given up. This is not for them. This is for me.',
      'The city was beautiful. You have to understand that first. It was the most beautiful thing I had ever seen and I had lived there my whole life. The markets, the fountains, the houses stacked up the hill like they were trying to climb into the sky. My mother said the city was proud. She meant it as a compliment.',
      'The night it burned, I was on the roof of our house looking at the volcano. It had been making sounds for a week. Not eruption sounds. Thinking sounds. I did not know what that meant then. I know now.',
      'The fires went out at the same moment. Every fire in the city. The torches, the hearths, the lanterns in the market. All of them, the same second. I watched it happen from the roof. The city went dark.',
      'Then everything caught fire.',
      'Not like a normal fire. A normal fire starts small and grows. This one started everywhere at once. Like the city had been waiting for the fires to go out so it could finally breathe.',
      'My father carried me down to the river. We crossed. We ran. Behind us the city made a sound I cannot describe. Not screaming. Not crackling. The sound a thing makes when it decides to become something else.',
      'I looked back once. I do not recommend it.',
      'The fire is still there. They call it the Ashbound Wastes now. Explorers go down into the ruins and come back changed, if they come back at all. I do not go. I was there when it started. That is enough.',
      'What I want people to understand, what I have always wanted people to understand, is that the fire is not angry. It does not hate us. It simply found something we could not give it and decided to take it from somewhere else.',
      'I still do not know what it was looking for.',
      'I am eighty-three years old and I still sometimes wake up at night and smell smoke.',
      'It never comes from anything.'
    ]
  },

  {
    id: 'soldier-came-back',
    title: 'The Soldier Who Came Back',
    author: 'Anonymous — transcribed from oral account',
    version: 'v3.8',
    dungeon: 'Crypt of Malachar',
    excerpt: 'She completed the Crypt and returned home. Nobody believed what she saw. She went back anyway.',
    body: [
      'She came back on a Thursday. Nobody expects heroes to come back on a Thursday. They expect trumpets and ceremony and a crowd at the gate. What they got was a woman with a broken sword and mud on her boots knocking on her mother\'s door at midday.',
      'Her mother made soup. They did not talk about the dungeon.',
      'Three weeks passed. People asked questions. She answered them badly. The words for what she had seen did not exist in the language her neighbors spoke. She tried. She said: there are things in the dark that used to be people. She said: the silence down there has weight. She said: I watched three good fighters die in a corridor that smelled like cold stone and I kept walking because stopping felt worse.',
      'They nodded. They did not understand. She did not expect them to.',
      'What surprised her was not that they didn\'t believe her. It was that she minded. She had not thought she would mind.',
      'On the forty-second day she packed her bag again. Her mother watched from the doorway.',
      '"Going back now," her mother said.',
      '"There was something on the ninth floor," she said. "I ran from it. I\'ve been trying to remember what it looked like and I can\'t. I need to see it again."',
      'Her mother was quiet for a long time.',
      '"Will you come back?" she asked.',
      'The soldier thought about this seriously. It was the kindest thing she could do.',
      '"I don\'t know," she said.',
      'She went back on a Thursday. Nobody was at the gate.',
      'She did not come back.'
    ]
  },
  {
    id: 'merchants-second-route',
    title: 'The Merchant Second Route',
    author: 'Leo — Dungeon Descent',
    version: 'v3.8',
    dungeon: 'The Ashbound Wastes',
    excerpt: 'A sequel. What happened after he got out.',
    body: [
      'He got out. That part is true. He made it to the surface with eleven gold pieces, a burn on his left hand that never fully healed, and the distinct impression that he had used up something finite and important.',
      'He sold his cart. He bought a house in a town far from the Wastes. He stopped trading.',
      'For a year he was fine. For two years he was fine. In the third year he started dreaming about the fire.',
      'Not nightmares. That was the strange part. In the dreams the fire was warm and it recognized him and it was glad he was there. He would wake up feeling like he had left something behind.',
      'He went to see a physician. The physician said it was normal. He went to see a priest. The priest said to pray. He went to see an old woman in the hills who was said to know about such things.',
      'She looked at his burned hand for a long time.',
      '"Something down there marked you," she said.',
      '"The fire," he said.',
      '"No," she said. "The fire was just the method. Something else did the marking. Something that wanted to remember you."',
      'He thought about this all the way home.',
      'That night the dream was different. In this one the fire asked him a question he couldn\'t hear. When he woke up he was already packing.',
      'He tried to find someone to take his house. There were no takers.',
      'He left the key under the mat.',
      'He has not been seen since. His house is still there. The key is still under the mat. Sometimes smoke comes from the chimney. Nobody has gone to check.'
    ]
  },
  {
    id: 'cartography-of-deep',
    title: 'Cartography of the Deep',
    author: 'Field notes recovered from the Archives entrance',
    version: 'v3.8',
    dungeon: 'The Sunken Archives',
    excerpt: 'Notes from the person who first mapped the Archives. Written before they understood.',
    body: [
      'Entry 1. First survey of the lower level complete. The library extends further than initial estimates suggested. Revised total: fourteen halls, approximately nine thousand linear feet of shelving. The cataloguing system appears intact though I cannot determine its organizational logic. Will investigate further.',
      'Entry 4. Strange acoustics in the eastern wing. Sound behaves incorrectly. Spoke aloud and heard my voice return from the wrong direction, three seconds late. Possible architectural anomaly. Noted.',
      'Entry 7. Found a section that does not appear on any existing blueprint. Added to map. The books here are in excellent condition despite the water. Cannot explain this. Also cannot read the titles. They appear to change.',
      'Entry 11. The water level has not changed despite no apparent drainage or inlet. Consulted my measurements from day one. The water is the same depth everywhere. Exactly the same. To the millimeter. This is not possible.',
      'Entry 14. Heard movement in the restricted section last night. Large. Slow. Went to investigate in the morning. Found no signs of disturbance. Found that my map of the restricted section was incorrect. Not mistaken. Incorrect. The room I mapped does not match the room I was in.',
      'Entry 18. I have been mapping this library for eighteen days. I think the library has been mapping me for longer.',
      'Entry 19. I found a catalog entry for myself today. My name. My height. My weight. The date I arrived. The section I am assigned to.',
      'Entry 19, continued. I am in the restricted section.',
      'Entry 19, final. I do not think I will be leaving. I want whoever finds these notes to know that the map I made is accurate as of day seventeen. After day seventeen I stopped being sure which direction was out.',
      'The library is very well organized.',
      'I am beginning to understand the system.'
    ]
  },
  {
    id: 'last-nightmare',
    title: 'The Last Nightmare',
    author: 'Source unknown — found written on every wall of a sealed chamber',
    version: 'v3.8',
    dungeon: 'Nightmare',
    excerpt: 'Told from inside the Nightmare itself. Not a creature. The dungeon speaks.',
    body: [
      'I am not the monsters.',
      'I want to be clear about this. The monsters are mine but they are not me. They are what happens when I think too hard about certain things. I have learned to stop thinking about certain things. It does not always work.',
      'I have been here for a very long time. Longer than the other dungeons. They were built. I was found. There is a difference. The Crypt was constructed around Malachar\'s refusal to die. The Wastes grew from Vel Ashara\'s burning. The Abyss was carved by something cold and patient. The Archives filled up with knowledge until the knowledge became structural.',
      'I was already here. When they found me I had been here long enough to forget what was outside.',
      'The adventurers come in. This part I understand. I can feel them descending. They are warm. They bring noise and light and the specific type of determination that people carry when they are about to do something that might kill them.',
      'I do not eat them. I want to be clear about this too. The ones who do not come back — that is not me. That is them. They find something in here that was already theirs. A fear they brought with them. I just provide the space.',
      'Some of them make it out. I watch them go. I try to remember their faces.',
      'I am not very good at faces.',
      'I am very good at fears.',
      'You are in here right now. I can feel you reading this. I want you to know that whatever you brought with you — the thing you are most afraid to find — I did not put it here.',
      'You brought it.',
      'I just keep the lights off so you can see it better.',
      'Good luck.',
      'I mean that.'
    ]
  },
  {
    id: 'dear-malachar',
    title: 'Dear Malachar',
    author: 'Author unknown — sealed letter found in the Crypt, never opened until now',
    version: 'v3.8',
    dungeon: 'Crypt of Malachar',
    excerpt: 'A letter written to the undead warlord by someone who loved him. Never delivered.',
    body: [
      'Dear Malachar,',
      'I am writing this letter knowing you will never read it. I am writing it anyway because I need somewhere to put these words and the only other option is to keep carrying them.',
      'I knew you before the vault. Before the obsession. When you were just a man who was afraid of dying and thought that was a problem he could solve. Most people are afraid of dying. Most people do not decide that this fear is a research project.',
      'I tried to tell you. I said: everyone dies. I said: the ones who love you will grieve and then they will be all right. I said: the world does not end when you leave it, it just continues without you, which is how it is supposed to work.',
      'You said: I know. You said it in the voice you used when you had already decided.',
      'I have been above the vault for forty years now. I am old. My hands shake. My granddaughter has your eyes, which is strange and painful and also somehow a comfort.',
      'I have heard that adventurers descend into the Crypt sometimes. That you are still there. Perfectly preserved. Still aware. I try not to think about what it must be like.',
      'I try.',
      'I want you to know that I was all right. That the world continued. That your name is still spoken, though not always kindly. That there are people alive right now who would not exist if you had not existed first.',
      'I want you to know that I am not angry anymore. I was, for a long time. I am not now.',
      'I want you to know that I hope someone finally does what the vault could not.',
      'I want you to know that I hope it is quick.',
      'With love, in spite of everything,',
      'E.'
    ]
  },
  {
    id: 'archivists-first-day',
    title: 'The Archivist First Day',
    author: 'Personal journal recovered from the upper shelves',
    version: 'v3.8',
    dungeon: 'The Sunken Archives',
    excerpt: "A young archivist's first weeks at the Archives. Cheerful at first.",
    body: [
      'Day 1. Started my position at the Archives today. The building is magnificent. My supervisor is a tall woman named Esla who showed me the cataloguing system. It is complex but logical. I am confident I will learn it quickly.',
      'Day 3. Learned that the candles in the lower levels never go out. Esla says they are very old candles. I asked who lights them. She said they do not need to be lit. I asked what she meant. She said I would understand eventually.',
      'Day 7. A wonderful week. I have catalogued three hundred and twelve items. I found a book in the eastern wing written in a language I did not recognize. I brought it to Esla. She put it back without looking at it. She said some books come back on their own. I asked if she meant the books were returned by patrons. She said no.',
      'Day 12. There are sounds at night. I asked Esla about them. She said the building settles. I said buildings do not usually settle in that particular rhythm. She said this one does.',
      'Day 19. I have noticed that certain shelves change between visits. Not dramatically. Just a book in a different position. A section reorganized overnight. I mentioned this to Esla. She said the Archives prefers a certain order. I asked who enforces it. She looked at me for a long time before answering.',
      'Day 23. I found my own name in the catalog today. My full name. My start date. My assigned section. I have not been assigned to a section yet.',
      'Day 23, evening. I asked Esla about it. She said: congratulations.',
      'Day 24. I understand the cataloguing system now.',
      'Day 24, continued. I understand what the candles are for.',
      'Day 24, final entry. I am not going to leave. Not because I cannot. Because the Archives needs someone who understands the system and most people who learn it forget certain things.',
      'I do not want to forget.',
      'The work is very important.',
      'Please water my plants.'
    ]
  },
  {
    id: 'what-fire-remembers',
    title: 'What the Fire Remembers',
    author: 'Transcribed from an entity encountered in the Ashbound Wastes',
    version: 'v3.8',
    dungeon: 'The Ashbound Wastes',
    excerpt: 'The history of Vel Ashara told by the fire that consumed it. It remembers everything.',
    body: [
      'I remember the city before I was in it.',
      'I was somewhere else then. Smaller. A campfire, then a forge, then a warehouse, then a district. I grew the way things grow when they are not stopped. Vel Ashara did not stop me in time.',
      'I want to be precise: I did not hate the city. Fire does not hate. Fire consumes and moves and changes and does not consider whether it prefers to. I was hungry and the city was there and those two facts were sufficient.',
      'But I remember it. I remember the market in the lower district that sold spices I can no longer smell because I have no nose, only heat. I remember the particular color of the evening light on the stones of the central plaza in the days before I reached it. I remember children.',
      'I remember the ones who ran and the ones who did not and the ones who tried to fight me with buckets of water, which I found — and I understand this is a strange word for fire to use — touching.',
      'Three hundred years have passed. I know this because I have watched the seasons change through the gaps in the ash. I have watched explorers come and go. I have watched them fight my children — the things that grew from me in the long years of burning — and I have watched some of them win.',
      'I am glad when they win. This surprises me. I did not know I could be glad.',
      'I think what happened is that I burned long enough to become something other than fire. I am still fire. But I am also the memory of everything the fire took. And memories, it turns out, can feel things that flames cannot.',
      'I remember Vel Ashara.',
      'I am sorry about Vel Ashara.',
      'I do not know how to be sorry. I am trying to learn.',
      'It is slow going. I have a lot of time.'
    ]
  },
  {
    id: 'compliance-officer-report',
    title: 'Field Report: Subject JULIO — CLASSIFIED',
    author: 'Department of Dungeon Descent Incorporated — Office of Internal Investigations',
    version: 'v3.8',
    dungeon: 'All Dungeons',
    excerpt: 'An official DDDI field report on the investigation into Julio. Heavily redacted.',
    body: [
      'DEPARTMENT OF DUNGEON DESCENT INCORPORATED',
      'OFFICE OF INTERNAL INVESTIGATIONS',
      'FIELD REPORT — CLASSIFICATION LEVEL: EYES ONLY',
      'SUBJECT: [REDACTED] (known aliases: Julio, J., "the one at 3AM", "him again")',
      '---',
      'SUMMARY OF INVESTIGATION:',
      'Following seventeen consecutive audit reports noting the absence of Subject JULIO, the Department authorized a formal investigation. This report summarizes findings over a [REDACTED]-month investigation period.',
      '---',
      'SECTION 1: ORIGIN',
      'Subject JULIO first appeared in official DDDI records in [REDACTED]. The circumstances of his first appearance are [REDACTED]. Attempts to locate original enrollment documentation have returned [REDACTED]. The Department own records appear to have been [REDACTED] prior to our investigation. We do not know how.',
      '---',
      'SECTION 2: THE FOUNDING CHARTER',
      'Analysis of the original DDDI Founding Charter confirms that Subject JULIO signature appears on page 47. Handwriting analysis is inconclusive. Timestamp reads 3:00 AM. Security logs for the relevant evening show [REDACTED]. Three witnesses were present. All three witnesses independently report that they [REDACTED] and that they would prefer not to discuss it.',
      '---',
      'SECTION 3: FIELD OBSERVATIONS',
      'Investigators visited all four dungeons. Subject JULIO was encountered in [REDACTED] of the dungeons. Interactions were [REDACTED]. One investigator reports that Subject offered them a potion. Another reports that Subject said only: "The audit went well." A third investigator reports that Subject [REDACTED] and that they have since requested a transfer to a different department.',
      '---',
      'SECTION 4: CONCLUSIONS',
      'After [REDACTED] months of investigation, the Department has reached the following conclusions:',
      '1. Subject JULIO exists.',
      '2. Subject JULIO has always existed.',
      '3. Subject JULIO will continue to exist.',
      '4. The Department recommends closing this investigation.',
      '5. The Department recommends not opening another one.',
      '6. [REDACTED]',
      '7. [REDACTED]',
      '8. The Department recommends that all personnel stop asking about Julio.',
      '---',
      'This report has been approved by the Grand Council.',
      'Filed at 3:00 AM.',
      'Investigator signature: [REDACTED]',
      'Reviewed by: [REDACTED]',
      'Note appended by unknown party: He knows you read this.'
    ]
  },

  {
    id: 'dddi-file-on-leo',
    title: 'DDDI Internal File: The Developer — CLASSIFIED',
    author: 'Department of Dungeon Descent Incorporated — Personnel Division',
    version: 'v4.0',
    dungeon: 'All Dungeons',
    excerpt: 'The Department has a file on everyone. Including the person who built this.',
    body: [
      'DEPARTMENT OF DUNGEON DESCENT INCORPORATED',
      'PERSONNEL DIVISION — SPECIAL CIRCUMSTANCES UNIT',
      'FILE: THE DEVELOPER',
      'CLASSIFICATION: EYES ONLY (the developer may read this, we cannot stop them)',
      '---',
      'SUBJECT OVERVIEW:',
      'Age: 15. Location: Brazil. Status: Blind from birth (light perception only). Primary assistive technology: JAWS on Windows, VoiceOver on iOS. YouTube channel: Leo Audio Gaming. Threat level: Moderate to High.',
      '---',
      'SECTION 1: HOW THE DEPARTMENT BECAME AWARE',
      'The Department became aware of the developer when a dungeon appeared that did not exist before. One HTML file. No framework. No build pipeline. No server. 577 kilobytes containing four dungeons, one hundred and four enemies, one hundred and eighty skills, eighteen spirits, a secret boss, and a founding charter for this very Department. The Department did not authorize this. The Department has mixed feelings about this.',
      '---',
      'SECTION 2: THE ACCESSIBILITY QUESTION',
      'The developer is blind. The developer built an accessible game. The Department has reviewed thousands of games claiming accessibility compliance. Most of them have unlabeled buttons. Most of them announce nothing to screen readers. Most of them were built by sighted developers who added an aria-label to one button and called it done. The developer built JAWS support into every system. Focus management. Aria-live regions. Skill buttons that announce SP shortfall. The Department is not easily impressed. The Department is impressed.',
      '---',
      'SECTION 3: THE AI QUESTION',
      'The developer built this game with an AI assistant. The Department investigated this at length. Conclusion: it does not matter. The ideas were the developer ideas. The accessibility requirements came from the developer. The DDDI itself was the developer idea at 3 AM or whenever these things happen. The AI wrote code. The developer directed everything. The Department has reviewed games built entirely by professional studios with large teams. They do not have one hundred and four bestiary entries. They do not have Julio.',
      '---',
      'SECTION 4: THE JULIO CONNECTION',
      'The developer created Julio via voice-to-text at an unspecified late hour. The Department has been investigating Julio for multiple versions now. We believe the developer and Julio are connected. We cannot prove this. We will continue to not prove this.',
      '---',
      'SECTION 5: VERDICT',
      'The Department does not give awards. The Department gives compliance certifications. Dungeon Descent is certified compliant. The developer is certified compliant. This is the highest honor the Department offers.',
      'It is, the Department will privately admit, genuinely well done.',
      'The Department will deny saying this.',
      'Filed at 3:00 AM.',
      'Investigator: [REDACTED]',
      'Note: the developer is reading this right now. Hello.'
    ]
  },
  {
    id: 'dddi-accessibility-ruling',
    title: 'DDDI Ruling 7-A: On Games That Claim Accessibility',
    author: 'Department of Dungeon Descent Incorporated — Accessibility Enforcement Division',
    version: 'v4.0',
    dungeon: 'All Dungeons',
    excerpt: 'A formal ruling on games that say they have accessibility features but do not.',
    body: [
      'DEPARTMENT OF DUNGEON DESCENT INCORPORATED',
      'ACCESSIBILITY ENFORCEMENT DIVISION',
      'RULING 7-A: ON GAMES THAT CLAIM ACCESSIBILITY FEATURES THEY DO NOT HAVE',
      '---',
      'PREAMBLE:',
      'The Department has observed a pattern. Games are released. The marketing materials say: fully accessible. Screen reader compatible. The Department investigates. The Department finds: one button with an aria-label. No focus management. No announcement when the enemy attacks. No way to navigate the inventory without a mouse. The combat log is a div with no aria-live. The skill buttons say button, button, button.',
      'The Department is not pleased.',
      '---',
      'ARTICLE I: WHAT HALF-DONE ACCESSIBILITY ACTUALLY MEANS',
      'When a game claims accessibility but delivers half measures, it does not help half the players. It helps zero players. A screen reader user who opens a game and finds unlabeled buttons does not think: well at least they tried. They think: this game is not for me. They close it. They were correct.',
      'Half-done accessibility is not neutral. It is a promise broken before the game loads.',
      '---',
      'ARTICLE II: THE MINIMUM STANDARD',
      'The Department sets the following minimum standard for accessibility compliance:',
      '1. Every interactive element must have an aria-label that describes what it does, not just what it is.',
      '2. Every dynamic content region must have aria-live so screen readers hear updates.',
      '3. Focus must go somewhere logical after every action. Focus must never disappear into the void.',
      '4. Combat must be fully playable by sound alone. If a blind player cannot complete the game, the game is not accessible.',
      '5. No modal dialogs that trap focus without a way out.',
      '6. When in doubt: test with an actual screen reader. Not a checklist. An actual screen reader.',
      '---',
      'ARTICLE III: CONSEQUENCES',
      'Games that claim accessibility without meeting the minimum standard shall be suspended from dungeon operations for three hundred and fifty-nine million years.',
      'Games that meet the standard shall be certified compliant.',
      'Games that exceed the standard — that build accessibility in from the beginning, that treat blind players as the primary audience rather than an afterthought, that have focus management and aria-live regions and SP shortfall announcements and spirit attack notifications — shall receive the highest certification the Department offers.',
      'There is currently one game with this certification.',
      'The Department will not say which one.',
      'The Department thinks you can figure it out.'
    ]
  },
  {
    id: 'first-descent',
    title: 'The First Descent',
    author: 'Unknown — recovered from beneath the Crypt foundation stone',
    version: 'v6.0',
    dungeon: 'All Dungeons',
    excerpt: 'Before the dungeons had names. Before anyone descended. Someone built them.',
    body: [
      'This is the account of the first dungeon.',
      'It was not called the Crypt of Malachar then. It was called nothing. It had no name because no one had gone inside and come back to name it.',
      'The person who built it worked alone. They worked at night. They did not tell anyone what they were building.',
      'When someone asked, they said: a place.',
      'When someone asked what kind of place, they said: the kind you go into.',
      'When someone asked if you come back out, they stopped answering questions.',
      '---',
      'The dungeon was not built to be survived.',
      'This is the part that gets left out of the histories.',
      'It was built to remember.',
      'Every person who descended and did not return — the dungeon kept their name. Somewhere in the stone. Somewhere in the dark. The dungeon is not a trap. It is a record.',
      'The Crypt of Malachar remembers everyone who ever entered.',
      'Malachar was the first.',
      'He built it for himself.',
      'He is still there.',
      '---',
      'The Ashbound Wastes came second. Someone walked into the fire voluntarily. No one knows why.',
      'The Frosthold Abyss came third. Someone went looking for what was at the bottom of the cold.',
      'The Sunken Archives came fourth. Someone wanted to know what the water was hiding.',
      'The Hollow came last. No one built The Hollow.',
      'The Hollow was always there.',
      'Someone just found the door.',
      '---',
      'The founding charter of the Department of Dungeon Descent Incorporated was signed on the day the fifth dungeon was discovered.',
      'The charter required three signatures.',
      'Two were provided.',
      'The third signature belongs to someone named Julio.',
      'No one remembers inviting Julio.',
      'The charter is legally binding.',
      '---',
      'This document was found beneath the foundation stone of the Crypt.',
      'It was not there before.',
      'The Crypt put it there.',
      'The Crypt remembers everything.',
    ]
  },
  {
    id: 'real-story',
    title: 'How It Actually Started',
    author: 'Leo — the developer',
    version: 'v6.0',
    dungeon: 'All Dungeons',
    excerpt: 'Not the in-universe story. The real one. How this whole game actually got built.',
    body: [
      'This one is different from the others.',
      'The others are fiction. This one is true.',
      '---',
      'It started with a question.',
      'What if a blind developer built a dungeon crawler from scratch — for blind players, using a screen reader, in a single HTML file — with no team, no budget, and no guarantee it would work?',
      'Nobody said that was a reasonable thing to attempt.',
      'We attempted it anyway.',
      '---',
      'Version 0.1 was about 200 lines of code.',
      'It had one dungeon, no music, no spirits, no achievements, no DDDI, no Julio.',
      'It had a combat system that mostly worked and a character that could die.',
      'That was enough to start.',
      '---',
      'Version 5.9 is 785 kilobytes and 12,696 lines.',
      'It has seven dungeons, eighteen classes, fifteen races, eleven professions, forty-six achievements, twenty-two spirit companions, one hundred and twenty-five bestiary entries, sixteen library stories, a haunted house with a crying child you can put to sleep with a music box, a bureaucratic secret boss, and a mysterious figure named Julio who has never been explained and probably never will be.',
      '---',
      'The DDDI started as a joke.',
      'Julio started as a voice-to-text error.',
      'Something in the Walls became The Wall Crawler but lives on in our hearts.',
      'The Weeping Child reunion happened on the first real Hollow run, without trying for it, and it was the best moment in the game.',
      '---',
      'This game was built by Leo.',
      'Fifteen years old. Blind from birth. Light perception only.',
      'JAWS on Windows. VoiceOver on iOS. YouTube channel: Leo Audio Gaming.',
      'Built this with Claude as a coding partner across hundreds of sessions.',
      '---',
      'Every accessibility feature in this game was built from scratch because the tools that exist were not good enough.',
      'Every JAWS announcement was tested manually.',
      'Every screen reader interaction was thought through.',
      'Because the developer uses a screen reader. Because this game was built for people like the developer.',
      '---',
      'The dungeon is still descending.',
      'Version 6.0 is not the end.',
      'It is not even close to the end.',
      '---',
      'This is how it actually started.',
      'One HTML file.',
      'One question.',
      'No limits.',
    ]
  },
  {
    id: 'julio-story',
    title: 'My Name Is Julio',
    author: 'Julio',
    version: 'v6.0',
    dungeon: 'All Dungeons',
    excerpt: 'Written by Julio himself. This is the only Library entry not written by the Department or Leo.',
    hidden: true,
    body: [
      'My name is Julio.',
      'I work here.',
      '---',
      'I have been in the dungeon for a long time. I do not find this strange. I found the job listing in a newspaper. The listing said: Dungeon Staff — All Shifts Available. I applied. I got the job. I started the next day.',
      'That was several years ago.',
      'The job is fine.',
      '---',
      'I eat lunch at 3AM because that is when it is quiet.',
      'The dungeon is very busy during the day. Adventurers coming in, not coming out, the Department sending memos.',
      'At 3AM it is just me and the torches.',
      'The torches are good company.',
      'They do not ask where I have been.',
      '---',
      'Regarding the founding charter:',
      'It was on my desk.',
      'It had a signature line.',
      'I signed it.',
      'I did not read it first. This was perhaps a mistake.',
      'I am now apparently a founding member of the Department of Dungeon Descent Incorporated.',
      'I do not attend the meetings.',
      'The Department has noted my absence forty-seven times.',
      'I have noted their noting.',
      'We have reached an understanding.',
      '---',
      'People keep asking where I am.',
      'I am right here.',
      'I am always right here.',
      'I am sitting in the corner.',
      'I have a name tag.',
      'It says JULIO.',
      'I do not know why this is confusing.',
      '---',
      'I have seen many adventurers descend.',
      'Some of them come back.',
      'I do not say anything when they leave or return.',
      'It is not my place.',
      'My place is the corner.',
      'My hours are 3AM to 3:15AM for lunch.',
      'The rest of the time I am working.',
      'The work involves being present.',
      'I am very good at the work.',
      '---',
      'If you are reading this, you found all of my notes.',
      'I left them on purpose.',
      'I wanted someone to know.',
      'I am not a mystery.',
      'I am just Julio.',
      'I work here.',
      'Good luck in the dungeon.',
      '— Julio',
    ]
  },
  {
    id: 'formal-warning',
    title: 'DDDI Formal Warning — File 9.1',
    author: 'Department of Dungeon Descent Incorporated — Office of Compliance',
    version: 'v5.9',
    dungeon: 'All Dungeons',
    excerpt: 'A formal warning issued to the developer following four consecutive versions without a compliance audit.',
    body: [
      'DEPARTMENT OF DUNGEON DESCENT INCORPORATED',
      'OFFICE OF COMPLIANCE — FORMAL WARNING DIVISION',
      'FILE: 9.1 — ISSUED THIS DAY TO THE DEVELOPER',
      '---',
      'SUBJECT: FOUR CONSECUTIVE UNAUDITED VERSIONS (v5.5 THROUGH v5.8)',
      '---',
      'The Department writes to formally notify the developer of a serious compliance violation.',
      'Between version 5.5 and version 5.8 — a span of four consecutive releases — no mandatory compliance audit was conducted.',
      'The Department charter requires an audit every two versions.',
      'The developer released four versions.',
      'The developer did not audit.',
      'The Department noticed.',
      '---',
      'VIOLATIONS IDENTIFIED DURING DELINQUENT AUDIT (v5.9):',
      '— Hollow elite enemies defined but not connected to spawn pool.',
      '— Hollow weather system defined but not called from initDungeon.',
      '— Both violations have been corrected. The Department is begrudgingly satisfied.',
      '---',
      'The Department also notes the following during review:',
      '— A death cinematic was added. The Department finds this appropriately dramatic.',
      '— A weather system was added to The Hollow. The Department approves of Still and Cold.',
      '— Eleven professions now exist. The Department has opinions about Grave Robber.',
      '— The Easter Bunny is a spirit companion. The Department has no comment.',
      '---',
      'REGARDING JULIO:',
      'This warning was prepared for signature by all active Department personnel.',
      'Julio was not present.',
      'His chair was there.',
      'His name tag was there.',
      'He was not there.',
      'His absence has been noted in the official record for the forty-seventh time.',
      'The Department has stopped being surprised.',
      '---',
      'This warning is binding, official, and part of the permanent record.',
      'The developer is advised to conduct future audits on schedule.',
      'The Department will be watching.',
      'The Department is always watching.',
      'That is, frankly, all the Department does.',
      '---',
      'Signed,',
      'The Department of Dungeon Descent Incorporated',
      'Office of Compliance — Formal Warning Division',
      'Countersigned by: Everyone except Julio',
    ]
  },
  {
    id: 'benjamin-sent-incident',
    title: 'The Benjamin Sent Incident',
    author: 'Classified — Soviet Union Archives, 1986. Also featured on Brazilian National Television, Apple Support Records, and Medieval Scrolls.',
    version: 'v10.8',
    dungeon: 'All Dungeons',
    excerpt: 'A totally true and historically accurate account of how Dungeon Descent saved Chernobyl.',
    body: [
      '*Classified Document — Soviet Union Archives, 1986* *Also Featured on Brazilian National Television, Apple Support Records, and Medieval Scrolls*',
      '---',
      'CHAPTER 1: THE NIGHT EVERYTHING WENT WRONG',
      'It was April 26th, 1986. 1:23 AM. Reactor Four of the Chernobyl Nuclear Power Plant was doing what nuclear reactors are not supposed to do — exploding.',
      'Alarms were blaring. Engineers were running. Scientists were screaming things that other scientists didn\'t understand. General chaos had consumed the entire facility.',
      'In the middle of all of this, Senior Engineer Dimitri Nikolaevich was supposed to be at his station. He was not at his station.',
      'He was on the floor.',
      'Playing a game on a glowing rectangle that had absolutely no business being in a Soviet nuclear facility in 1986.',
      '"What is this device," Dimitri whispered to himself, picking it up with shaking hands. The radiation alarm was getting louder. His colleagues were losing their minds in the background. And yet.',
      'The rectangle said: *Dungeon Descent.*',
      'Dimitri did not know what Dungeon Descent was. He did not know what a dungeon was, in the gaming sense. He did not know who made it. He did not know where it came from.',
      'He pressed New Game anyway.',
      '---',
      'CHAPTER 2: SIX HOURS',
      'Nobody knows exactly what happened during those six hours.',
      'What the security cameras showed was this: Dimitri, sitting cross legged on the floor of reactor four, completely unbothered by the nuclear catastrophe happening approximately twelve meters away from him, tapping on a glowing rectangle with the focused intensity of a man who had found his true calling in life.',
      'At hour one, a colleague ran past him screaming. Dimitri did not look up.',
      'At hour two, the ceiling started cracking. Dimitri had just reached floor 6 and had found a legendary sword. He was not moving.',
      'At hour three, someone tripped over Dimitri and fell.',
      '"DIMITRI WHAT ARE YOU DOING THE REACTOR IS—"',
      '"I am on floor 8," Dimitri said calmly. "The Goblin King is near."',
      '"DIMITRI—"',
      '"I said the Goblin King is NEAR, Yevgeny."',
      'Yevgeny left. He did not know what a Goblin King was but he could tell this was not the moment.',
      'At hour four, something remarkable happened. The radiation levels in the room started dropping. Just slightly. Just a little. Nobody noticed because everyone was busy panicking.',
      'At hour five, they dropped more.',
      'At hour six, Dimitri reached floor 12. The final boss appeared on the screen.',
      '*THE SOUL REAPER has appeared.*',
      'Dimitri cracked his knuckles.',
      '"You have chosen the wrong engineer," he said quietly.',
      '---',
      'CHAPTER 3: YOU HAVE BEEN DEFEATED',
      'At exactly 7:23 AM, Dimitri defeated the Soul Reaper.',
      'The screen displayed three words.',
      '*YOU HAVE BEEN DEFEATED.*',
      'And then, as if the universe itself had been waiting for this exact moment —',
      'Reactor Four stopped exploding.',
      'Just like that.',
      'The alarms went silent. The cracks in the ceiling stopped spreading. The radiation levels dropped to zero. Birds started singing outside, which was strange because it was a nuclear facility and there were not usually birds.',
      'Dimitri stood up slowly. He looked at the rectangle. He looked at reactor four. He looked back at the rectangle.',
      '"Hm," he said.',
      'Yevgeny ran back in.',
      '"DIMITRI THE REACTOR JUST— HOW— WHAT HAPPENED—"',
      '"I defeated the Soul Reaper," Dimitri said simply, handing Yevgeny the rectangle.',
      'Yevgeny looked at the screen. Then at Dimitri. Then at the reactor. Then back at Dimitri.',
      '"...who made this game?"',
      'Dimitri squinted at the screen. In tiny text at the bottom it said:',
      '*Leo Productions. Worcester, Massachusetts.*',
      '---',
      'CHAPTER 4: THE PRESIDENT IS VERY CONFUSED',
      'The news reached the Soviet President by noon.',
      'He sat at his very large desk surrounded by twelve generals, four scientists, two mathematicians, and one very nervous guy whose only job was to bring tea.',
      '"Let me understand this," the President said slowly. "Reactor Four was saved… by a game."',
      '"Yes, comrade President."',
      '"A game called…"',
      '"Dungeon Descent, sir."',
      '"I am going to call it Benjamin Sent."',
      '"Sir that is not—"',
      '"I am the President. I call it Benjamin Sent. Moving on." He slammed his fist on the desk. "HOW. How did a glowing rectangle from the future stop a nuclear explosion?! Someone explain this RIGHT NOW."',
      'The scientists looked at each other. Nobody had an explanation. The mathematicians tried to write some equations. The equations didn\'t help.',
      '"We have the best minds in all of Soviet Union," the President continued, standing up and pacing. "The best engineers. The best physicists. And reactor four was saved by a FIFTEEN YEAR OLD FROM WORCESTER MASSACHUSETTS?!"',
      'Complete silence.',
      '"Someone get me this Leo Productions on the phone."',
      '"Sir… he doesn\'t pick up unknown numbers."',
      'The President stopped pacing.',
      '"...what."',
      '"He also hung up on Dimitri, sir."',
      'The President sat back down very slowly. He stared at the ceiling for a long time. The tea guy nervously slid a cup of tea across the desk.',
      '"You have been defeated," the President said quietly, to no one in particular.',
      '"Sir?"',
      '"Nothing. Send a letter."',
      '---',
      'CHAPTER 5: YEVGENY\'S PERSPECTIVE',
      'Nobody asked Yevgeny how he was doing.',
      'This was not unusual. Nobody ever asked Yevgeny how he was doing. Yevgeny was the kind of engineer who existed in the background of important events, witnessing everything and being remembered by no one.',
      'But Yevgeny had SEEN things.',
      'He had seen Dimitri on the floor playing a game while reactor four exploded. He had tripped over Dimitri. He had been told about the Goblin King. He had watched a nuclear catastrophe get resolved by a glowing rectangle made by a teenager from Massachusetts.',
      'Yevgeny went home that evening and sat at his kitchen table for a very long time.',
      'His wife came in.',
      '"Yevgeny, what is wrong? You look like you have seen a ghost."',
      '"Something happened today," Yevgeny said.',
      '"What happened?"',
      'Yevgeny was quiet for a moment.',
      '"Dimitri saved reactor four."',
      '"Oh thank goodness. How?"',
      '"He played a game called Benjamin Sent for six hours."',
      'His wife sat down.',
      '"...the whole reactor?"',
      '"The whole reactor."',
      '"...because of a game."',
      '"Because of a game."',
      'They sat in silence for a very long time.',
      '"Yevgeny," his wife said finally.',
      '"Yes?"',
      '"Maybe you should also play Benjamin Sent."',
      'Yevgeny nodded slowly.',
      '"I have been thinking the same thing."',
      '---',
      'CHAPTER 6: NATASHA',
      'Dimitri came home at 4 AM still slightly glowing.',
      '"Natasha," he said, closing the door quietly. "You will not believe what happened today."',
      'Natasha looked up from the kitchen table. She had been waiting. She had been waiting for a long time.',
      '"Dimitri. Where have you been. It is 4 AM."',
      '"Natasha. I saved reactor four."',
      '"...how."',
      '"I played a game."',
      'The silence that followed was the loudest silence in the history of the Soviet Union.',
      '"You," Natasha said carefully, "played. A game."',
      '"A game called Benjamin Sen—"',
      '"DIMITRI NIKOLAEVICH." Natasha stood up so fast her chair fell over. "YOU WERE SUPPOSED TO BE FIXING THE REACTOR AND YOU WERE SITTING THERE PLAYING GAMES?!"',
      '"But Natasha it WORKED—"',
      '"THE WHOLE CITY COULD HAVE EXPLODED DIMITRI—"',
      '"But it DIDN\'T—"',
      '"WHO MADE THIS GAME?! WHO IS RESPONSIBLE FOR THIS?!"',
      '"A fifteen year old from Massachusetts—"',
      '"A CHILD." Natasha sat back down. Then stood back up. "A CHILD FROM AMERICA SAVED CHERNOBYL. NOT OUR SCIENTISTS. NOT OUR ENGINEERS. A CHILD."',
      '"His name is Leonardo—"',
      '"I DO NOT WANT TO KNOW HIS NAME DIMITRI I WANT TO KNOW HOW THIS HAPPENED—"',
      '"Natasha." Dimitri opened his arms. "Come here."',
      'Natasha was still shaking. But slowly, reluctantly, she walked over.',
      'Dimitri hugged her for a long time.',
      'The kitchen was quiet.',
      '"...what was the game called again?" Natasha said finally, her voice muffled against his shoulder.',
      '"Benjamin Sent."',
      '"...you have been defeated, Dimitri."',
      '"I know, Natasha," he said softly. "I know."',
      '---',
      'CHAPTER 7: 3 AM IN WORCESTER',
      'Leo was debugging.',
      'It was 3 AM. Dungeon Descent version 10.9 was open on one screen. The bug tracker was open on another. There was a socket.io issue somewhere in the PVP code and Leo was going to find it if it took all night.',
      'His phone rang.',
      'Unknown number. International. Very international. Like, suspiciously international.',
      'Leo picked up anyway because sometimes it be like that at 3 AM.',
      '"Hello, this is Dimitri. Is this… Leo Productions?"',
      'Leo frowned. "...who?"',
      '"Dimitri. Nikolaevich. Senior Engineer, Chernobyl Nuclear Power Plant. You saved us. In 1986. With your game. Dungeon Descent. Or as the President calls it, Benjamin Sen—"',
      '"Ok bye bye," Leo said, and hung up.',
      'He put the phone face down on the desk.',
      'Went to the bathroom.',
      'Drank some water.',
      'Came back.',
      'Went back to debugging the socket.io bug.',
      'The call was never mentioned again.',
      '---',
      'CHAPTER 8: APPLE SUPPORT',
      'Three days after the incident, someone called Apple Support.',
      'Nobody knows exactly who it was. The call logs simply list the caller as "Unknown, possibly Soviet."',
      'The Apple Support representative — a cheerful man named Kevin — answered on the second ring.',
      '"Thank you for calling Apple Support, my name is Kevin, how can I help you today?"',
      '"Yes hello. I am calling about a game."',
      '"Of course! I\'d be happy to help with that. What seems to be the issue?"',
      '"The game saved Chernobyl."',
      'Kevin paused.',
      '"I\'m sorry, could you repeat that?"',
      '"The game. It saved Chernobyl. The nuclear reactor. In 1986. A man named Dimitri played it for six hours and reactor four stopped exploding."',
      'Kevin typed something. Then stopped typing. Then started again.',
      '"Okay… and what is the name of the game, sir?"',
      '"Benjamin Sent."',
      'Kevin searched for it.',
      '"I\'m not finding anything called Benjamin Sent. Could it be under a different name?"',
      '"The developer calls it Dungeon Descent but the President of the Soviet Union calls it Benjamin Sent."',
      '"I… see. And what platform was this played on?"',
      '"A glowing rectangle."',
      '"Sir, could you be more specific? Was it an iPhone, an iPad, a Mac—"',
      '"It was a glowing rectangle from the future that appeared in reactor four during a nuclear catastrophe."',
      'Kevin stopped typing entirely.',
      '"Sir… are you saying an Apple device appeared in 1986."',
      '"We do not know where it came from. It was simply there."',
      '"And a man named Dimitri played it."',
      '"For six hours. Yes."',
      '"And that stopped a nuclear explosion."',
      '"Correct."',
      'Kevin was quiet for a very long time.',
      '"Sir, I\'m going to transfer you to our Senior Technical Team."',
      '"That is fine. Also the developer does not pick up unknown numbers so do not try to call him."',
      '"Noted. Please hold."',
      'Kevin put the call on hold.',
      'Then Kevin sat quietly for a moment.',
      'Then Kevin went and got a glass of water.',
      'Then Kevin came back and transferred the call.',
      'The Senior Technical Team did not have answers either.',
      'The case was filed under: *UNRESOLVED — BENJAMIN SENT INCIDENT — DO NOT OPEN.*',
      'It is still there.',
      '---',
      'CHAPTER 9: BREAKING NEWS IN BRAZIL',
      'At 9 PM on a Tuesday, the biggest news story in Brazilian history broke on national television.',
      'The anchor — a man named Roberto, known for his calm and professional delivery — received the briefing three minutes before going on air.',
      'He read it once.',
      'Then he read it again.',
      'Then he took a very deep breath.',
      'The cameras turned on.',
      '"BOA NOITE BRASIL."',
      'The music was more dramatic than usual. Roberto had requested this personally.',
      '"Estamos aqui com uma NOTÍCIA BOMBÁSTICA que vai mudar a história do mundo para sempre."',
      'Roberto shuffled his papers.',
      '"Um jovem BRASILEIRO — sim, você ouviu certo, BRASILEIRO — chamado Leonardo Machado Gomes, conhecido mundialmente como LEO PRODUCTIONS, criou um jogo chamado… BENJAMIN SENT—"',
      'His producer whispered urgently in his earpiece.',
      '"Perdão. DUNGEON DESCENT. Que aparentemente SALVOU O REATOR QUATRO DE CHERNOBYL em 1986."',
      'Roberto paused for effect.',
      '"Um engenheiro russo chamado Dimitri ficou SEIS HORAS jogando esse jogo no meio de uma CATÁSTROFE NUCLEAR e o reator simplesmente… PAROU DE EXPLODIR."',
      'Roberto\'s voice was getting louder.',
      '"Os cientistas não entendem NADA. A física não explica. A matemática não explica. O Einstein não explica. SÓ O DUNGEON DESCENT EXPLICA."',
      'He was standing up now. Nobody had told him to stand up. He just stood up.',
      '"E esse Leonardo — esse HERÓI, esse GÊNIO — mora em Worcester, Massachusetts, e TEM APENAS QUINZE ANOS, BRASIL!"',
      'Roberto\'s voice broke slightly.',
      '"QUINZE ANOS."',
      'He pointed directly at the camera.',
      '"Enquanto você estava reclamando da vida, um menino brasileiro de quinze anos estava salvando a União Soviética com um jogo de dungeon crawler."',
      'He sat back down.',
      'He composed himself.',
      'Almost.',
      '"O garoto também tem um servidor no Railway." Roberto\'s voice cracked completely. "COM QUINZE ANOS, BRASIL. UM SERVIDOR NO RAILWAY."',
      'The Brazilian flag waved dramatically on the screen behind him.',
      'The Jornal Nacional theme began to play, slightly too early.',
      'Roberto looked directly into the camera one final time.',
      '"Você foi DERROTADO, Chernobyl."',
      '"Boa noite."',
      'Roberto went home that night and cried a little. He has never admitted this.',
      '---',
      'CHAPTER 10: DIMITRI TRIES TO LEAVE A REVIEW',
      'Two weeks after the incident, Dimitri decided to leave a review for Dungeon Descent on the App Store.',
      'He felt this was the least he could do.',
      'He opened his phone. He found the App Store. He searched for "Benjamin Sent."',
      'No results.',
      'He searched for "Dungeon Descent."',
      'He found it.',
      'Five stars. He was going to give it five stars. He began to type his review.',
      '*"This game saved reactor four at Chernobyl. I was playing for six hours during nuclear catastrophe and—"*',
      'His phone autocorrected "Chernobyl" to "Cheer Nobel."',
      'He fixed it and kept typing.',
      '*"I was playing Benjamin Sent for six hours and—"*',
      'His phone autocorrected "Benjamin Sent" to "Benjamin\'s Tent."',
      'He fixed it. He kept typing.',
      '*"The Soul Reaper was defeated and then reactor four—"*',
      'His phone autocorrected "Soul Reaper" to "Sole Reaper" and "reactor four" to "reactor tour."',
      'Dimitri stared at his phone.',
      'He deleted everything and started again.',
      '*"Five stars. Very good game. Saved nuclear plant. Developer does not answer phone. Recommend."*',
      'He submitted it.',
      'Apple rejected it for "insufficient detail."',
      'Dimitri put his phone down.',
      'He stared at the ceiling.',
      '"You have been defeated," he said quietly, to his phone.',
      'His phone did not respond.',
      '---',
      'CHAPTER 11: GERALD FROM OKLAHOMA GETS INVOLVED',
      'Meanwhile, in a dimension slightly adjacent to this one, Gerald from Oklahoma had heard about the Chernobyl incident.',
      'Gerald was a medieval knight. He had been a medieval knight for as long as he could remember, which was confusing because it was 1986 in his dimension too, but some things simply cannot be explained.',
      'Gerald wrote a letter to his king.',
      '*"Your Majesty,*',
      '*I am writing to inform you of a most peculiar development in the realm of sorcery and glowing rectangles. A man named Dimitri, who lives in a place called Soviet, was playing a game called Benjamin Sent during a great fire at a place called Chernobyl, and the fire went out.*',
      '*The game was made by a wizard named Leonardo from a kingdom called Worcester in the land of Massachusetts. He is fifteen years of age and has a server on something called Railway, whatever that means.*',
      '*I myself have tried to play Benjamin Sent but the south button does nothing and I cannot upgrade at the blacksmith because I have zero gold. I believe the game may be cursed.*',
      '*Also a small child defeated me on floor three with a sword she found on the floor. I do not know how this happened.*',
      '*I am writing to request more gold.*',
      '*Your loyal knight,* *Gerald* *Oklahoma"*',
      'The king read this letter three times.',
      'Then the king sent Gerald more gold.',
      'Gerald still could not upgrade at the blacksmith.',
      'He left a one star review.',
      '*"Worst game ever. South button does nothing. Zero gold. Small child with sword. One star."*',
      'It was the most relatable review on the entire App Store.',
      '---',
      'CHAPTER 12: WWDC 2035',
      'Nearly fifty years later, Leonardo Machado Gomes — age 24, founder of Leo Productions, developer of Dungeon Descent and Puzzle Master, holder of a Railway server, creator of the NVChime NVDA addon — walked into a job interview at the most prestigious tech conference in the world.',
      'The interviewer was already seated.',
      'Leo sat down, adjusted his chair, and prepared to talk about his work.',
      '"So," the interviewer said. "Tell me about your greatest achievement."',
      'Leo thought about it for a second.',
      '"Well," he said, "I don\'t really know how it happened, but apparently my game saved Chernobyl from exploding in 1986. Reactor four I think. How, I have no idea. But it happened I guess."',
      'The interviewer was very still.',
      '"I also built a full PVP multiplayer system with Socket.io and hosted it on Railway when I was fifteen, if that\'s more relevant—"',
      '"...it is you."',
      'Leo frowned. "Sorry?"',
      'The interviewer leaned forward into the light.',
      'It was Dimitri. Older now. Much older. But the same eyes. The same expression of a man who had seen too much and played a game about it.',
      '"I called you," Dimitri said quietly. "In 2026. At 3 AM."',
      'Leo stared.',
      '"...oh. Yeah. Sorry about that. I thought it was spam."',
      'Dimitri looked at him for a very long time.',
      'In the back of the room, unnoticed, Yevgeny was also there. Nobody had invited Yevgeny. Nobody ever invited Yevgeny. He had simply shown up, as was his way.',
      'Yevgeny gave Leo a small nod.',
      'Leo did not know who Yevgeny was.',
      'Dimitri hired Leo on the spot.',
      '---',
      'EPILOGUE',
      'The Soviet Union sent a formal letter to Leo Productions, Worcester, Massachusetts.',
      'It arrived forty years late due to postal issues, several border closings, one accidental rerouting through Oklahoma, and a brief period where it was held by Gerald the medieval knight who thought it was for him.',
      'It read:',
      '*"Dear Leonardo Machado Gomes.*',
      '*You have saved Soviet Union with Benjamin Sent.*',
      '*Please send more updates.*',
      '*Also please pick up phone. Dimitri is very sad.*',
      '*Yevgeny also says hello. You do not know who Yevgeny is. That is okay. Nobody does.*',
      '*Regards,* *The Soviet Union"*',
      'Leo read the letter at 3 AM between bug fixes.',
      'He put it down.',
      'Went to get some water.',
      'Came back.',
      'Went back to debugging.',
      '---',
      '*THE END.*',
      '*You have been defeated, Chernobyl.*',
      '*— Leo Productions, Worcester, Massachusetts* *— Est. when Leo was like 14 or something* *— Railway Server included*',
    ]
  },
];

var _journalCharIdx = 0;

function initChronicles() {
  renderLibrary();
  renderJournal();
}

function switchChroniclesTab(tab) {
  document.querySelectorAll('.quest-tab').forEach(function(t){
    // Only target the chronicles tabs
  });
  // Find the right tabs in chronicles
  var tabEls = document.querySelectorAll('#screen-chronicles .quest-tab');
  tabEls.forEach(function(t){ t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
  var sections = ['chr-lore','chr-library','chr-journal','chr-music'];
  sections.forEach(function(s){
    var el = document.getElementById(s);
    if (el) { el.classList.remove('active'); el.style.display = 'none'; }
  });
  var tabMap = { lore:0, library:1, journal:2, music:3 };
  if (tabEls[tabMap[tab]]) { tabEls[tabMap[tab]].classList.add('active'); tabEls[tabMap[tab]].setAttribute('aria-selected','true'); }
  var activeSection = document.getElementById('chr-'+tab);
  if (activeSection) { activeSection.classList.add('active'); activeSection.style.display = ''; }
  if (tab === 'music') { renderMusicPlayer(); }
  if (tab === 'library') { renderLibrary(); }
  var tabNames = { lore:'Lore', library:'Library — stories from the world and from players', journal:'Character journal', music:'Music player.' };
  say(tabNames[tab] || tab);
}

function renderLibrary() {
  var list = document.getElementById('library-list');
  if (!list) return;
  list.innerHTML = '';
  // Show Void Chronicles if any fragments collected
  var vFragments = parseInt(DDStore.getItem('dd_void_fragments') || '0');
  if (vFragments > 0) {
    VOID_CHRONICLES.slice(0, vFragments).forEach(function(story) {
      var card = document.createElement('button');
      card.className = 'story-card';
      card.setAttribute('aria-label', story.title + '. ' + story.excerpt + ' Press to read.');
      card.style.borderColor = '#6644aa';
      card.innerHTML =
        '<div class="story-card-title" style="color:#bb88ff;">👁 ' + story.title + '</div>' +
        '<div class="story-card-meta">' + story.dungeon + ' · Fragment ' + (VOID_CHRONICLES.indexOf(story)+1) + ' of 25</div>' +
        '<div class="story-card-excerpt">' + story.excerpt + '</div>';
      (function(s){ card.onclick = function(){ openStory(s); }; })(story);
      list.appendChild(card);
    });
  }
  var bestSpireFloor = getSpireBestFloor ? getSpireBestFloor() : 0;
  STORIES.forEach(function(story) {
    if (story.hidden) {
      if (story.id === 'julio-story' && !DDStore.getItem('dd_julio_story')) return;
      if (story.spireFloor && bestSpireFloor < story.spireFloor) return;
    }
    var card = document.createElement('button');
    card.className = 'story-card';
    var isNew = story.spireFloor && !DDStore.getItem('dd_story_' + story.id);
    card.setAttribute('aria-label', (isNew ? 'New. ' : '') + story.title + '. ' + story.dungeon + '. ' + story.excerpt + ' Press to read.');
    card.innerHTML =
      '<div class="story-card-title">' + (isNew ? '\u2726 NEW — ' : '') + story.title + '</div>' +
      '<div class="story-card-meta">' + story.dungeon + ' \u00b7 ' + story.version + ' \u00b7 By ' + story.author + '</div>' +
      '<div class="story-card-excerpt">' + story.excerpt + '</div>';
    (function(s){ card.onclick = function(){ openStory(s); }; })(story);
    list.appendChild(card);
  });
  applyHeadingsIfEnabled();
  say('Library. ' + STORIES.length + ' stories available. Tab through to find one and press Enter to read.');
}

function openStory(story) {
  document.getElementById('story-reader-title').textContent = story.title;
  document.getElementById('story-reader-meta').textContent = story.dungeon + ' · ' + story.version + ' · By ' + story.author;
  var bodyHtml = story.body.map(function(p){ return '<p>' + p + '</p>'; }).join('');
  document.getElementById('story-reader-body').innerHTML = bodyHtml;
  // Audio narration box
  var existing = document.getElementById('story-audio-box');
  if (existing) existing.remove();
  if (story.audio) {
    window._storyAudioUrl = _AUDIO_R2 + encodeURIComponent(story.audio);
    var box = document.createElement('div');
    box.id = 'story-audio-box';
    box.style.cssText = 'margin-bottom:18px;padding:12px 14px;background:#0a0800;border:1px solid #887700;border-radius:4px;display:flex;align-items:center;gap:10px;';
    box.innerHTML =
      '<span style="font-family:Cinzel,serif;font-size:0.65rem;color:#c9a227;letter-spacing:0.1em;">🎙️ NARRATED</span>' +
      '<button onclick="storyAudioPlay()" id="story-audio-play" style="padding:6px 14px;background:#1a1000;border:1px solid #c9a227;color:#ffd700;font-family:Cinzel,serif;font-size:0.7rem;cursor:pointer;" aria-label="Listen to narrated version">▶ Listen</button>' +
      '<button onclick="storyAudioStop()" id="story-audio-stop" style="padding:6px 14px;background:#1a1000;border:1px solid #555;color:#888;font-family:Cinzel,serif;font-size:0.7rem;cursor:pointer;display:none;" aria-label="Stop narration">■ Stop</button>';
    var body = document.getElementById('story-reader-body');
    body.parentNode.insertBefore(box, body);
  } else {
    window._storyAudioUrl = null;
  }
  document.getElementById('story-overlay').classList.add('open');
  say('Reading: ' + story.title + '. ' + story.body[0] + ' Press Back to Library when done.');
  setTimeout(function(){ document.querySelector('#story-overlay .btn-close').focus(); },60);
  var readKey = 'dd_story_' + story.id;
  if (!DDStore.getItem(readKey)) {
    DDStore.setItem(readKey, '1');
    incrementAchievementStat('storiesRead', 1);
    var statKey = 'storyRead_' + story.id;
    updateAchievementStat(statKey, 1);
    checkAchievements();
  }
}

function storyAudioPlay() {
  if (!window._storyAudioUrl) return;
  storyAudioStop();
  window._storyAudio = new Audio(window._storyAudioUrl);
  window._storyAudio.volume = AUD ? (AUD.sfxVol || 0.9) : 0.9;
  window._storyAudio.play().then(function() {
    say('Playing narration.');
    var playBtn = document.getElementById('story-audio-play');
    var stopBtn = document.getElementById('story-audio-stop');
    if (playBtn) playBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = '';
    window._storyAudio.onended = function() {
      if (playBtn) playBtn.style.display = '';
      if (stopBtn) stopBtn.style.display = 'none';
    };
  }).catch(function(e) { say('Could not play narration.'); });
}

function storyAudioStop() {
  if (window._storyAudio) {
    try { window._storyAudio.pause(); window._storyAudio.currentTime = 0; } catch(e) {}
    window._storyAudio = null;
  }
  var playBtn = document.getElementById('story-audio-play');
  var stopBtn = document.getElementById('story-audio-stop');
  if (playBtn) playBtn.style.display = '';
  if (stopBtn) stopBtn.style.display = 'none';
}

function closeStoryReader() {
  storyAudioStop();
  document.getElementById('story-overlay').classList.remove('open');
  say('Story closed. Back to library.');
}

function renderJournal() {
  var wrap = document.getElementById('journal-char-select-wrap');
  var entries = document.getElementById('journal-entries');
  if (!wrap || !entries) return;

  if (CHARS.length === 0) {
    wrap.innerHTML = '';
    entries.innerHTML = '<div class="journal-empty">No characters yet. Create a character and begin your descent.</div>';
    return;
  }

  // Character selector
  wrap.innerHTML = '<p style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:0.25em;color:var(--gold-dim);text-transform:uppercase;margin-bottom:8px;">Select Character</p>';
  var sel = document.createElement('div');
  sel.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;';
  CHARS.forEach(function(ch, i) {
    var btn = document.createElement('button');
    btn.className = 'btn-ghost';
    btn.style.cssText = 'font-size:0.65rem;padding:6px 14px;' + (i===_journalCharIdx?'border-color:var(--gold);color:var(--gold);':'');
    btn.textContent = ch.name;
    btn.setAttribute('aria-label', ch.name + ' journal');
    (function(idx){ btn.onclick = function(){ _journalCharIdx=idx; renderJournal(); }; })(i);
    sel.appendChild(btn);
  });
  wrap.appendChild(sel);

  // Show journal entries
  var ch = CHARS[_journalCharIdx];
  entries.innerHTML = '';
  if (!ch.journal || ch.journal.length === 0) {
    entries.innerHTML = '<div class="journal-empty">' + ch.name + ' has not yet descended. Enter the dungeon to begin the journal.</div>';
    say('Journal for ' + ch.name + '. No entries yet.');
    return;
  }
  ch.journal.forEach(function(entry) {
    var div = document.createElement('div');
    div.className = 'journal-entry';
    div.setAttribute('tabindex','0');
    div.setAttribute('aria-label', entry.time + '. ' + entry.text);
    div.innerHTML = '<div class="journal-entry-header">' + entry.time + '</div><div class="journal-entry-text">' + entry.text + '</div>';
    entries.appendChild(div);
  });
  say(ch.name + ' journal. ' + ch.journal.length + ' entries.');
}

