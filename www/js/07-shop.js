//═════════════════
// SHOP
//═════════════════

var SHOP_STOCK = [
  { name:'Soul Trap', icon:'🪤', type:'soul-trap', cost:60, desc:'Captures the current enemy as a permanent minion. Use during combat.' },
  { name:'Health Potion',     icon:'🧪', type:'potion',      heal:40,  cost:12, desc:'Restores 40 HP.' },
  { name:'Greater Potion',    icon:'💊', type:'potion',      heal:80,  cost:22, desc:'Restores 80 HP. Stronger brew.' },
  { name:'Spirit Tonic',      icon:'🔵', type:'sp-potion',   sp:15,    cost:14, desc:'Restores 15 SP immediately.' },
  { name:'Greater Tonic',     icon:'💙', type:'sp-potion',   sp:30,    cost:24, desc:'Restores 30 SP. Concentrated essence.' },
  { name:'Iron Flask',        icon:'🛡️', type:'def-potion',  def:3,   turns:3, cost:16, desc:'Grants +3 defense for 3 turns.' },
  { name:'Berserker Draught', icon:'⚔️', type:'atk-potion',  atk:4,   turns:3, cost:18, desc:'Grants +4 attack for 3 turns.' },
  { name:'Lucky Potion',      icon:'🍀', type:'luck-potion',          cost:20, desc:'Next 3 enemy kills drop double gold.' },
  { name:'Fire Potion',       icon:'🔥', type:'fire-potion',          cost:25, desc:'Deals 40% of target max HP as fire damage. Ignores defense.' },
  { name:'Curse Potion',      icon:'☠️', type:'curse-potion',         cost:18, desc:'Halves enemy attack for 3 turns.' },
  { name:'Swift Potion',      icon:'💨', type:'swift-potion',         cost:22, desc:'Guarantees flee for 2 turns. Perfect escape.' },
  { name:'Cursed Vial',       icon:'🌀', type:'cursed',               cost:3,  desc:'Unpredictable effects. Cheap for a reason.' },
  { name:'Mirror Flask',      icon:'🪞', type:'mirror-flask',          cost:30, desc:'Reflects the next enemy attack back at them.' },
  { name:'Phantom Potion',    icon:'👻', type:'phantom-potion',        cost:35, desc:'Become untargetable for 2 turns. Enemy attacks pass through you.' },
  { name:'Gravity Tonic',     icon:'🌀', type:'gravity-tonic',         cost:28, desc:'Crushes enemy ATK to 1 for 3 turns.' },
  { name:'Leech Brew',        icon:'🩸', type:'leech-brew',            cost:32, desc:'Heals 30% of every hit you deal for 4 turns.' },
  { name:'Rage Tonic',        icon:'💢', type:'rage-tonic',            cost:38, desc:'Triple ATK but double incoming damage for 3 turns.' },
  { name:'Fog Flask',         icon:'🌫️', type:'fog-flask',            cost:25, desc:'Enemy has 70% chance to miss for 3 turns.' },
  { name:'Time Potion',       icon:'⌛', type:'time-potion',           cost:45, desc:'2 free attacks this turn. Enemy cannot respond.' },
  { name:'Corruption Flask',  icon:'💜', type:'corruption-flask',      cost:33, desc:'Deals 20 corruption damage to enemy each turn for 4 turns.' },
  { name:'Warding Bell',      icon:'🔔', type:'warding-bell',          cost:20, desc:'Rings out the next time you search a room with a trap, letting you step around it. One use.' },
  { name:'Phoenix Feather',   icon:'🪶', type:'phoenix-feather',       cost:150,desc:'If you would die while carrying this, it ignites instead — you are reborn at 30% HP. Consumed automatically. One use.' },
  { name:'Elixir of Life',    icon:'✨', type:'heal',        healPct:0.6, cost:35, desc:'Restores 60% of max HP instantly.' },
  { name:'Gravebound Elixir', icon:'💀', type:'heal',        healPct:0.6, cost:35, desc:'Restores 60% of max HP instantly.' },
  { name:'Tidal Elixir',      icon:'🌊', type:'heal',        healPct:0.6, cost:35, desc:'Restores 60% of max HP instantly.' },
  { name:'Bloodstone',        icon:'🔴', type:'gem',         gold:20,  cost:0,  desc:'Worth 20 gold. Sell it at the Blacksmith.' },
  // Weapons
  { id:'shop-iron-sword',    name:'Iron Sword',    icon:'⚔️', type:'weapon', weaponType:'sword',  level:1, atkBase:[5,10], cost:45,  isEquippable:true, desc:'A reliable sword.' },
  { id:'shop-shadow-dagger', name:'Shadow Dagger', icon:'🔪', type:'weapon', weaponType:'dagger', level:1, atkBase:[5,9],  cost:55,  isEquippable:true, desc:'Fast and precise.' },
  { id:'shop-oak-staff',     name:'Oak Staff',     icon:'🪄', type:'weapon', weaponType:'staff',  level:1, atkBase:[4,8],  cost:50,  isEquippable:true, desc:'Channels arcane energy.' },
  { id:'shop-battle-axe',    name:'Battle Axe',    icon:'🪓', type:'weapon', weaponType:'axe',    level:1, atkBase:[7,13], cost:70,  isEquippable:true, desc:'Heavy but devastating.' },
  // Armor
  { id:'shop-leather-vest',  name:'Leather Vest',  icon:'🦺', type:'armor',  armorType:'light',   level:1, defBase:3, cost:40, isEquippable:true, desc:'+3 defense.' },
  { id:'shop-chain-mail',    name:'Chain Mail',     icon:'⛓️', type:'armor',  armorType:'medium',  level:1, defBase:5, cost:65, isEquippable:true, desc:'+5 defense.' },
  // Runes
  { id:'rune-strength',   name:'Rune of Strength',   icon:'🔴', type:'rune', cost:30, desc:'+6 attack for the rest of this run.' },
  { id:'rune-protection', name:'Rune of Protection', icon:'🔵', type:'rune', cost:28, desc:'+5 defense for the rest of this run.' },
  { id:'rune-vitality',   name:'Rune of Vitality',   icon:'🟣', type:'rune', cost:32, desc:'+20 max HP this run.' },
  // Scrolls
  { id:'scroll-smite',    name:'Scroll of Smite',    icon:'⚡', type:'scroll', cost:35, desc:'80 unblockable damage to current enemy.' },
  { id:'scroll-mending',  name:'Scroll of Mending',  icon:'✨', type:'scroll', cost:30, desc:'Heals 50% max HP outside combat.' },
  { id:'scroll-reveal',   name:'Scroll of Reveal',   icon:'📜', type:'scroll', cost:22, desc:'Reveals the next 3 room types.' },
];

var shopSession = [];

function openShop() {
  // Daily modifier "Stripped": the shop does not appear (nothing read the flag)
  if (DS._dailyMod_noShop) {
    say('Stripped — no merchant today. Continuing your descent.');
    addLog('🚫 Stripped: the merchant is gone.');
    setTimeout(function() { enterRoom(); }, 600);
    return;
  }
  showDungeonTip('first-shop');
  // Use dungeon-specific shop stock
  var baseStock = DS.dungeon === 'The Ashbound Wastes' ? ASH_SHOP_STOCK
                : DS.dungeon === 'Frosthold Abyss'       ? FROST_SHOP_STOCK
                : DS.dungeon === 'The Sunken Archives'   ? SUNKEN_SHOP_STOCK
                : DS.dungeon === 'The Hollow'            ? HOLLOW_SHOP_STOCK
                : SHOP_STOCK;
  var stock = JSON.parse(JSON.stringify(baseStock));
  shopSession = [];
  var picks = [];
  while (picks.length < 4 && stock.length > 0) {
    var idx = Math.floor(Math.random() * stock.length);
    picks.push(stock.splice(idx, 1)[0]);
  }
  shopSession = picks.map(function(item) { return Object.assign({}, item, { sold: false }); });

  // Inject 1 class-specific item
  var classItem = getClassShopItem();
  if (classItem) shopSession.push(Object.assign({}, classItem, { sold: false }));

  // Add Music Player ONLY if player has never owned one globally
  var hasMusicPlayer = DS.inventory.some(function(i){ return i.type==='music-player'; }) ||
                       getGlobalInventory().some(function(i){ return i.type==='music-player'; }) ||
                       DDStore.getItem('dd_mp_owned') === '1';
  if (!hasMusicPlayer) {
    shopSession.push({ name:'Music Player', icon:'🎵', type:'music-player', cost:50, desc:'Opens the music player from your inventory mid-dungeon. Never fight in silence again.', sold:false });
  }

  renderShop();
  var ov = document.getElementById('ov-shop');
  ov.classList.add('open');
  setTimeout(function() {
    var first = ov.querySelector('button');
    if (first) first.focus();
  }, 60);
  say('The Wandering Merchant. You have ' + DS.gold + ' gold. ' + shopSession.length + ' items available. Tab through each item to hear its name, description, and price. Press an item button to buy it.');
}

function renderShop() {
  var nightDisc = shopNightDiscount();
  document.getElementById('shop-gold-display').textContent = '💰 ' + DS.gold + 'g' + (nightDisc ? (getActiveEvent() === 'nightmarket' && !isNightTime() ? '  🏮 Night Market — 25% off' : '  🌙 Night Discount Active') : '');
  document.getElementById('shop-msg').textContent = '';
  var list = document.getElementById('shop-items');
  list.innerHTML = '';
  shopSession.forEach(function(item, i) {
    var rawCost = shopItemCost(item);
    var finalCost = nightDisc ? Math.floor(rawCost * 0.75) : rawCost;
    var canAfford = DS.gold >= finalCost;
    // Row container
    var row = document.createElement('div');
    row.className = 'shop-item' + (item.sold ? ' sold' : (!canAfford ? ' cant-afford' : ''));
    row.setAttribute('role', 'listitem');
    // Icon
    var iconEl = document.createElement('span');
    iconEl.className = 'shop-item-icon'; iconEl.setAttribute('aria-hidden','true');
    iconEl.textContent = item.icon;
    // Info
    var infoEl = document.createElement('div');
    infoEl.className = 'shop-item-info';
    infoEl.innerHTML = '<div class="shop-item-name">' + t(item.name) + (item.sold ? ' <span style="color:#555;font-size:0.6rem;">[SOLD]</span>' : '') + '</div>' +
      '<div class="shop-item-desc">' + t(item.desc) + '</div>';
    // Cost + buy button
    var rightEl = document.createElement('div');
    rightEl.style.cssText = 'display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;';
    var costEl = document.createElement('span');
    costEl.className = 'shop-item-cost';
    costEl.setAttribute('aria-hidden','true');
    costEl.textContent = item.sold ? '—' : finalCost + 'g';
    if (nightDisc && !item.sold) {
      costEl.innerHTML = '<span style="text-decoration:line-through;color:#555;font-size:0.65rem;">' + item.cost + 'g</span> <span style="color:#6ab0f0;">🌙' + finalCost + 'g</span>';
    }
    rightEl.appendChild(costEl);
    if (!item.sold) {
      var buyBtn = document.createElement('button');
      buyBtn.className = 'shop-buy-btn';
      buyBtn.disabled = !canAfford;
      buyBtn.textContent = canAfford ? t('Buy') : t('Too costly');
      var ariaLabel = t(item.name) + '. ' + t(item.desc) + '. ' + t('Cost') + ': ' + finalCost + ' ' + t('gold') + '.' + (canAfford ? ' ' + t('Press to buy.') : ' ' + t('Cannot afford.'));
      buyBtn.setAttribute('aria-label', ariaLabel);
      (function(idx){ buyBtn.onclick = function(e){ e.stopPropagation(); buyItem(idx); }; })(i);
      rightEl.appendChild(buyBtn);
    }
    row.appendChild(iconEl);
    row.appendChild(infoEl);
    row.appendChild(rightEl);
    list.appendChild(row);
  });
}

// Gold Curse — potions cost double (announced, never applied)
function shopItemCost(item) {
  var c = item.cost || 0;
  if (DS.runModPotionCostMult && /potion|elixir/.test(item.type || '')) c = c * DS.runModPotionCostMult;
  return c;
}

function buyItem(i) {
  var item = shopSession[i];
  if (!item || item.sold) return;
  if (DS.runModPotionCostMult && /potion|elixir/.test(item.type || '') && !item._curseCost) { item._curseCost = true; item.cost = shopItemCost(item); }
  if (DS.gold < item.cost && !(DS.activeSpirit && DS.activeSpirit.isMarketSprite)) {
    document.getElementById('shop-msg').textContent = 'Not enough gold. You need ' + item.cost + 'g.';
    say('Not enough gold. You need ' + item.cost + ' gold. You have ' + DS.gold + '.');
    return;
  }
  var finalCost = shopNightDiscount() ? Math.floor(item.cost * 0.75) : item.cost;
  if (DS.activeSpirit && DS.activeSpirit.isMarketSprite) {
    finalCost = Math.max(1, Math.round(finalCost * 0.80));
    if (finalCost < item.cost) addLog('Market Sprite negotiates — price reduced to ' + finalCost + 'g!');
    // Mark the discount as spent the moment it's actually used, not just at
    // run victory — otherwise swapping away and back to Market Sprite
    // mid-run (see the reactivation fee in openPauseSpirits()) never
    // actually gates anything, since the flag wouldn't be set yet.
    if (_charIdx !== null && CHARS[_charIdx] && !CHARS[_charIdx].marketSpriteUsed) {
      CHARS[_charIdx].marketSpriteUsed = true;
      saveChars();
    }
  }
  if (shopNightDiscount() && finalCost < item.cost) addLog('🌙 Night discount applied — ' + finalCost + 'g instead of ' + item.cost + 'g.');
  if (DS.gold < finalCost) {
    document.getElementById('shop-msg').textContent = 'Not enough gold. You need ' + finalCost + 'g.';
    say('Not enough gold. You need ' + finalCost + ' gold.');
    return;
  }
  DS.gold -= finalCost; spendGlobalGold(finalCost);
  item.sold = true;
  sfx('sfx-purchase'); vibe(VIBE.shopBuy);

  if (item.type === 'potion') {
    DS.inventory.push({ name:item.name, icon:item.icon, type:'potion', heal:item.heal, desc:item.desc });
    document.getElementById('shop-msg').textContent = 'Purchased ' + item.name + '. Added to inventory.';
    say('Bought ' + item.name + '. Gold remaining: ' + DS.gold + '.');
  } else if (item.type === 'heal') {
    DS.inventory.push({ name:item.name, icon:item.icon, type:'elixir', healPct:item.healPct, desc:item.desc });
    document.getElementById('shop-msg').textContent = 'Purchased ' + item.name + '. Added to your Potions inventory.';
    say('Bought ' + item.name + '. Elixir added to inventory. Gold remaining: ' + DS.gold + '.');
  } else if (item.type === 'weapon') {
    var weaponItem = Object.assign({}, item);
    DS.inventory.push(weaponItem);
    if (item.isEquippable) {
      addToGlobalInventory(weaponItem);
      document.getElementById('shop-msg').textContent = 'Bought ' + item.name + '. Open inventory to equip it.';
      say('Bought ' + item.name + '. Check your inventory to equip it. Gold remaining: ' + DS.gold + '.');
    } else {
      // Legacy atkBonus weapon
      DS.atkBonus += (item.atkBonus || 0);
      document.getElementById('shop-msg').textContent = 'You equip the ' + item.name + '. Attack increased.';
      say('Bought ' + item.name + '. Gold remaining: ' + DS.gold + '.');
    }
  } else if (item.type === 'armor') {
    var armorItem = Object.assign({}, item);
    DS.inventory.push(armorItem);
    if (item.isEquippable) {
      addToGlobalInventory(armorItem);
      document.getElementById('shop-msg').textContent = 'Bought ' + item.name + '. Open inventory to equip it.';
      say('Bought ' + item.name + '. Check your inventory to equip it. Gold remaining: ' + DS.gold + '.');
    } else {
      DS.defBonus += (item.defBonus || 0);
      document.getElementById('shop-msg').textContent = 'You equip the ' + item.name + '. Defense increased.';
      say('Bought ' + item.name + '. Gold remaining: ' + DS.gold + '.');
    }
  } else if (item.type === 'ring') {
    DS.inventory.push({ name:item.name, icon:item.icon, type:'ring', effect:item.effect, desc:item.desc });
    document.getElementById('shop-msg').textContent = 'Purchased ' + item.name + '. Added to inventory.';
    say('Bought ' + item.name + '. Gold remaining: ' + DS.gold + '.');
  } else if (item.type === 'music-player') {
    var mp = { name:'Music Player', icon:'🎵', type:'music-player', desc:'Use from inventory to open the music player mid-dungeon.' };
    DS.inventory.push(mp);
    addToGlobalInventory(mp);
    DDStore.setItem('dd_mp_owned', '1');
    document.getElementById('shop-msg').textContent = 'Purchased Music Player. Use it from your inventory.';
    say('Bought Music Player for ' + finalCost + ' gold. Use it from your inventory to play music. Gold remaining: ' + DS.gold + '.');
  } else if (item.type === 'enchanter') {
    var enc = { name:'Enchanter', icon:'✨', type:'enchanter', charges:3, desc:'3 free weapon upgrades at the Blacksmith.' };
    DS.inventory.push(enc);
    addToGlobalInventory(enc);
    document.getElementById('shop-msg').textContent = 'Purchased Enchanter. 3 free weapon upgrades available.';
    say('Bought Enchanter. Use it at the Blacksmith for 3 free upgrades. Gold remaining: ' + DS.gold + '.');
  } else if (item.type === 'soul-trap') {
    var st = { name:'Soul Trap', icon:'🪤', type:'soul-trap', desc:'Captures the current enemy as a permanent minion. Use during combat.' };
    DS.inventory.push(st);
    addToGlobalInventory(st);
    document.getElementById('shop-msg').textContent = 'Purchased Soul Trap. Use it during combat to capture an enemy.';
    say('Bought Soul Trap for ' + finalCost + ' gold. Use it during combat to capture an enemy as a minion. Gold remaining: ' + DS.gold + '.');
  } else {
    // Generic item fallback
    var genericItem = Object.assign({}, item);
    DS.inventory.push(genericItem);
    document.getElementById('shop-msg').textContent = 'Purchased ' + item.name + '. Added to inventory.';
    say('Bought ' + item.name + '. Gold remaining: ' + DS.gold + '.');
  }

  updateTopBar();
  saveProgress();
  renderShop();
}

function toggleShopSell() {
  var section = document.getElementById('shop-sell-section');
  if (!section) return;
  var isOpen = section.style.display !== 'none';
  section.style.display = isOpen ? 'none' : '';
  if (!isOpen) renderShopSell();
  say(isOpen ? 'Sell section closed.' : 'Sell section opened. Tab through your items to sell them.');
}

function renderShopSell() {
  var list = document.getElementById('shop-sell-list');
  if (!list) return;
  list.innerHTML = '';
  var inv = DS.inventory || [];
  if (!inv.length) {
    list.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.68rem;color:#555;padding:8px;">Nothing in inventory to sell.</div>';
    return;
  }
  inv.forEach(function(item, idx) {
    var price = getSellPrice(item);
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1a1a00;';
    row.setAttribute('tabindex','0');
    row.setAttribute('aria-label', item.name + '. Sell for ' + price + ' gold.');
    var info = document.createElement('div');
    info.style.cssText = 'flex:1;font-family:Cinzel,serif;font-size:0.68rem;color:#cc9944;';
    info.textContent = (item.icon||'') + ' ' + item.name;
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:4px 10px;background:#1a0800;border:1px solid #aa6622;color:#cc8844;font-family:Cinzel,serif;font-size:0.62rem;cursor:pointer;';
    btn.textContent = price + 'g';
    btn.setAttribute('aria-label', 'Sell ' + item.name + ' for ' + price + ' gold');
    btn.onclick = function() {
      DS.inventory.splice(idx, 1);
      DS.gold += price;
      addGlobalGold(price);
      updateTopBar();
      var totalSells = parseInt(DDStore.getItem('dd_total_sells')||'0') + 1;
      DDStore.setItem('dd_total_sells', String(totalSells));
      if (totalSells >= 1) awardAchievement('ach-first-sale');
      if (totalSells >= 5) awardAchievement('ach-merchant');
      if (totalSells >= 20) awardAchievement('ach-black-market');
      sfx('sfx-purchase'); vibe(VIBE.shopBuy);
      say('Sold ' + item.name + ' for ' + price + ' gold. You now have ' + DS.gold + ' gold.');
      document.getElementById('shop-gold-display').textContent = 'Your gold: ' + DS.gold + 'g';
      renderShopSell();
    };
    row.appendChild(info);
    row.appendChild(btn);
    list.appendChild(row);
  });
}

function closeShop() {
  document.getElementById('ov-shop').classList.remove('open');
  say('You leave the merchant. Continuing your descent.');
  setTimeout(function() { enterRoom(); }, 300);
}

function refreshShopItems() {
  var cost = 50;
  if (DS.gold < cost) { say('Not enough gold. Refresh costs 50 gold.'); sfx('sfx-select'); return; }
  DS.gold -= cost;
  sfx('sfx-purchase'); vibe(VIBE.shopBuy);
  // Rebuild shop session with new items
  var baseStock = DS.dungeon === 'The Ashbound Wastes' ? ASH_SHOP_STOCK
                : DS.dungeon === 'Frosthold Abyss'       ? FROST_SHOP_STOCK
                : DS.dungeon === 'The Sunken Archives'   ? SUNKEN_SHOP_STOCK
                : DS.dungeon === 'The Hollow'            ? HOLLOW_SHOP_STOCK
                : SHOP_STOCK;
  var stock = JSON.parse(JSON.stringify(baseStock));
  var picks = [];
  while (picks.length < 4 && stock.length > 0) {
    var idx = Math.floor(Math.random() * stock.length);
    picks.push(stock.splice(idx, 1)[0]);
  }
  shopSession = picks.map(function(item) { return Object.assign({}, item, { sold: false }); });
  var classItem = getClassShopItem();
  if (classItem) shopSession.push(Object.assign({}, classItem, { sold: false }));
  // Re-render shop items
  renderShopItems();
  updateGlobalGoldDisplay();
  var msg = document.getElementById('shop-msg');
  if (msg) msg.textContent = 'Shop refreshed! 50 gold spent.';
  say('Shop refreshed. New items available. 50 gold spent. You have ' + DS.gold + ' gold remaining.');
}

function getShopDiscount() {
  var disc = 0;
  // Night time (or the Night Market): 25% off
  if (shopNightDiscount()) disc += 0.25;
  // Dwarf race: 10% shop discount
  if (DS && DS.race === 'Dwarf') disc += 0.10;
  // Market Sprite spirit: 20% discount
  if (DS && DS.activeSpirit && DS.activeSpirit.isMarketSprite) disc += 0.20;
  // Blacksmith stored discount (from Time Eater reward, reward codes, etc.)
  try {
    var bsRaw = DDStore ? DDStore.getItem('dd_blacksmith_discount') : null;
    if (bsRaw) {
      var bsData = JSON.parse(bsRaw);
      if (bsData && bsData.pct && (!bsData.expires || Date.now() < bsData.expires)) {
        disc += bsData.pct;
      }
    }
  } catch(e) {}
  return Math.min(disc, 0.75); // cap at 75% off
}

function renderShopItems() {
  var list = document.getElementById('shop-items');
  if (!list) return;
  list.innerHTML = '';
  shopSession.forEach(function(item, i) {
    var discount = getShopDiscount();
    var finalCost = Math.round(item.cost * (1 - discount));
    var canAfford = DS.gold >= finalCost;
    var div = document.createElement('div');
    div.className = 'shop-item' + (item.sold ? ' sold' : '') + (canAfford ? '' : ' cant-afford');
    div.setAttribute('tabindex', '0');
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', t(item.name) + '. ' + t(item.desc) + '. ' + t('Cost') + ': ' + finalCost + ' ' + t('gold') + '.' + (item.sold ? ' ' + t('Sold.') : '') + (canAfford ? '' : ' ' + t('Cannot afford.')));
    div.innerHTML =
      '<span class="shop-item-icon" aria-hidden="true">' + item.icon + '</span>' +
      '<div class="shop-item-info"><div class="shop-item-name">' + t(item.name) + '</div><div class="shop-item-desc">' + t(item.desc) + '</div></div>' +
      '<span class="shop-item-cost">' + (item.sold ? '✓ ' + t('Sold') : finalCost + 'g') + '</span>';
    if (!item.sold) {
      div.onclick = function() { buyItem(i); };
      div.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') buyItem(i); };
    }
    list.appendChild(div);
  });
}


// RAID ENGINE
var RPOOL = [
  {name:'Hollow Shade',     icon:'👻', hp:30, atk:[5,11], gold:[2,4]},
  {name:'Crypt Rat',        icon:'🐀', hp:20, atk:[4,8],  gold:[1,3]},
  {name:'Brittle Skeleton', icon:'💀', hp:35, atk:[6,12], gold:[2,5]},
  {name:'Grave Crawler',    icon:'🦂', hp:25, atk:[5,9],  gold:[1,4]},
  {name:'Tomb Bat',         icon:'🦇', hp:18, atk:[4,8],  gold:[1,3]},
  {name:'Rotting Ghoul',    icon:'🧟', hp:38, atk:[6,11], gold:[2,5]},
  {name:'Ashen Wisp',       icon:'🌫️', hp:22, atk:[5,10], gold:[1,4]},
  {name:'Bone Shard',       icon:'🦴', hp:28, atk:[6,11], gold:[2,4]},
  {name:'Wailing Wraith',   icon:'👁️', hp:45, atk:[8,15], gold:[3,7]},
  {name:'Armored Skeleton', icon:'🗡️', hp:55, atk:[9,16], gold:[4,9]},
  {name:'Plague Hound',     icon:'🐺', hp:38, atk:[7,14], gold:[3,6]},
  {name:'Crypt Banshee',    icon:'👻', hp:50, atk:[9,16], gold:[4,8]},
  {name:'Shadow Stalker',   icon:'🌑', hp:42, atk:[8,15], gold:[4,7]},
  {name:'Cursed Knight',    icon:'🛡️', hp:62, atk:[9,17], gold:[5,10]},
  {name:'Plague Wraith',    icon:'☠️', hp:48, atk:[8,15], gold:[4,8]},
  {name:'Bone Archer',      icon:'🏹', hp:35, atk:[10,18],gold:[4,8]},
  {name:'Death Knight',     icon:'⚔️', hp:70, atk:[11,19],gold:[7,13]},
  {name:'Bone Colossus',    icon:'🦴', hp:80, atk:[13,22],gold:[9,16]},
  {name:'Soul Harvester',   icon:'🌑', hp:62, atk:[12,20],gold:[6,12]},
  {name:'Void Reaper',      icon:'💀', hp:72, atk:[12,21],gold:[8,14]},
  {name:'Ancient Revenant', icon:'🧟', hp:78, atk:[13,20],gold:[9,15]},
  {name:'Nightmare Shade',  icon:'😱', hp:65, atk:[12,22],gold:[7,13]},
  {name:'Blood Golem',      icon:'🔴', hp:88, atk:[12,19],gold:[9,15]},
  {name:'Crypt Spider',     icon:'🕷️', hp:40, atk:[8,16], gold:[4,8]},
  {name:'Venom Spitter',    icon:'🕸️', hp:32, atk:[9,17], gold:[3,7]},
  {name:'Web Stalker',      icon:'🕷️', hp:80, atk:[13,22],gold:[8,15]},
  {name:'Brood Mother',     icon:'🕸️', hp:90, atk:[12,20],gold:[9,16]},
  // Ashbound Wastes enemies in raid pool
  {name:'Cinder Wraith',    icon:'🔥', hp:28, atk:[6,12], gold:[2,5]},
  {name:'Ash Crawler',      icon:'🌋', hp:24, atk:[5,10], gold:[1,4]},
  {name:'Scorched Husk',    icon:'💀', hp:35, atk:[7,13], gold:[2,6]},
  {name:'Ember Shade',      icon:'✨', hp:20, atk:[6,11], gold:[1,4]},
  {name:'Char Bat',         icon:'🦇', hp:18, atk:[5,9],  gold:[1,3]},
  {name:'Slag Crawler',     icon:'🪲', hp:30, atk:[6,12], gold:[2,5]},
  {name:'Molten Knight',    icon:'⚔️', hp:60, atk:[10,18],gold:[5,10]},
  {name:'Plague of Cinders',icon:'💨', hp:45, atk:[9,17], gold:[4,8]},
  {name:'Char Stalker',     icon:'👁️', hp:50, atk:[9,16], gold:[4,9]},
  {name:'Blighted Overseer',icon:'👺', hp:65, atk:[10,19],gold:[6,11]},
  {name:'Ashen Revenant',   icon:'🧟', hp:55, atk:[9,17], gold:[5,9]},
  {name:'Flame Wraith',     icon:'👻', hp:48, atk:[10,18],gold:[4,8]},
  {name:'Volcanic Revenant',icon:'🌋', hp:80, atk:[13,23],gold:[9,16]},
  {name:'Infernal Colossus',icon:'💀', hp:95, atk:[14,24],gold:[10,18]},
  {name:'Ember Reaper',     icon:'☠️', hp:75, atk:[13,24],gold:[8,15]},
  // Frosthold Abyss enemies in raid pool
  {name:'Frost Shade',        icon:'❄️', hp:28, atk:[5,11], gold:[2,5]},
  {name:'Ice Shard',          icon:'🧊', hp:30, atk:[6,12], gold:[2,5]},
  {name:'Frozen Husk',        icon:'💀', hp:35, atk:[6,12], gold:[2,6]},
  {name:'Cave Bat',           icon:'🦇', hp:18, atk:[4,8],  gold:[1,3]},
  {name:'Permafrost Crawler', icon:'🦂', hp:25, atk:[5,10], gold:[1,4]},
  {name:'Blizzard Wraith',    icon:'👻', hp:48, atk:[8,16], gold:[4,8]},
  {name:'Glacial Knight',     icon:'⚔️', hp:58, atk:[9,17], gold:[5,10]},
  {name:'Frostbite Hound',    icon:'🐺', hp:40, atk:[8,15], gold:[3,7]},
  {name:'Frozen Banshee',     icon:'👁️', hp:45, atk:[9,16], gold:[4,8]},
  {name:'Arctic Revenant',    icon:'🧟', hp:55, atk:[9,16], gold:[5,9]},
  {name:'Avalanche Colossus', icon:'🏔️', hp:88, atk:[13,23],gold:[10,18]},
  {name:'Frost Reaper',       icon:'☠️', hp:75, atk:[12,22],gold:[8,15]},
  {name:'Frozen Titan',       icon:'🧊', hp:92, atk:[14,23],gold:[10,17]},
  {name:'Void Frost',         icon:'💀', hp:78, atk:[13,24],gold:[9,16]}
];
var RAID_BOSS_TEMPLATE = {name:'The Undying Legion',icon:'💀',hp:150,atk:[14,24],gold:[40,60],isRaidBoss:true};

var RD = {};

// Day keys look like "2026-10-5"; Safari (the iPhone app) can't parse one-digit
// months or days, so a missed day never reset the streak. Parse them by hand and
// count calendar days.
function parseDayKey(k){var p=String(k||'').split('-').map(Number);return (p.length===3&&!isNaN(p[0]))?new Date(p[0],p[1]-1,p[2]):new Date(k);}
function calendarDaysBetween(a,b){var x=new Date(a.getFullYear(),a.getMonth(),a.getDate()),y=new Date(b.getFullYear(),b.getMonth(),b.getDate());return Math.round((y-x)/86400000);}
function todayKey(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function getRaidSave(){return _jsonParseSafe(DDStore.getItem('dd_raid'), '{}');}
function setRaidSave(o){DDStore.setItem('dd_raid',JSON.stringify(o));}
function raidDoneToday(){return getRaidSave().completedDate===todayKey();}

// Old initRaidScreen and beginRaid removed — new versions below in Raid Character Selection section

function startWave(){
  RD.defending=false; RD.curIdx=0;
  var count = _raidDiff === 'hard' ? ri(5,10) : ri(5,7);
  var scale=1+(RD.wave-1)*0.18;
  RD.enemies=[];
  for(var i=0;i<count;i++){
    if(RD.wave===5&&i===count-1){
      var boss=JSON.parse(JSON.stringify(RAID_BOSS_TEMPLATE));
      boss.maxHp=boss.hp; boss.curHp=boss.hp; RD.enemies.push(boss);
    } else {
      var t=RPOOL[ri(0,RPOOL.length-1)];
      var e=JSON.parse(JSON.stringify(t));
      e.hp=Math.round(e.hp*scale); e.maxHp=e.hp; e.curHp=e.hp;
      e.atk=e.atk.map(function(v){return Math.round(v*scale);});
      RD.enemies.push(e);
    }
  }
  document.getElementById('rw-num').textContent=RD.wave;
  document.getElementById('rw-arena-lbl').textContent='Wave '+RD.wave+' of 5 — '+RD.enemies.length+' enemies';
  document.getElementById('rw-log').innerHTML='';
  renderRaidGrid(); updateRaidHp(); setRaidBtns(true);
  rLog('Wave '+RD.wave+' begins! '+RD.enemies.length+' enemies surge forward.');
  say('Wave '+RD.wave+' of 5. '+RD.enemies.length+' enemies in this wave. Currently facing: '+RD.enemies[0].name+'. Use attack, heavy strike, defend, or potion to fight.');
  setTimeout(function(){document.getElementById('rb-attack').focus();},100);
}

function renderRaidGrid(){
  var g=document.getElementById('rw-grid'); g.innerHTML='';
  RD.enemies.forEach(function(e,i){
    var s=document.createElement('div');
    s.className='raid-slot'+(e.curHp<=0?' dead':'');
    s.setAttribute('aria-label',e.name+(e.curHp<=0?', defeated':', HP '+e.curHp+' of '+e.maxHp));
    s.innerHTML='<span class="raid-slot-icon" aria-hidden="true">'+e.icon+'</span>'+
      '<span class="raid-slot-name">'+(e.curHp<=0?'✓ ':'')+e.name+'</span>'+
      '<div class="raid-slot-hpw"><div class="raid-slot-hpf" style="width:'+Math.max(0,(e.curHp/e.maxHp)*100)+'%"></div></div>';
    g.appendChild(s);
  });
  var alive=RD.enemies.filter(function(e){return e.curHp>0;}).length;
  document.getElementById('rw-enemies').textContent=alive+' remaining';
}

function updateRaidHp(){
  var pct=Math.max(0,(RD.hp/RD.maxHp)*100);
  document.getElementById('rw-phpbar').style.width=pct+'%';
  document.getElementById('rw-phptxt').textContent='HP: '+RD.hp+' / '+RD.maxHp;
  document.getElementById('rw-phptxt').setAttribute('aria-label','Your health: '+RD.hp+' of '+RD.maxHp);
  document.getElementById('rw-hp').textContent='HP: '+RD.hp+'/'+RD.maxHp;
  document.getElementById('rw-gold').textContent=RD.gold+'g';
  document.getElementById('rw-potions').textContent=RD.potions;
}

function rLog(msg){
  var log=document.getElementById('rw-log');
  var l=document.createElement('div'); l.textContent=(typeof t === 'function') ? t(msg) : msg;
  log.appendChild(l); log.scrollTop=log.scrollHeight;
}

function getActiveEnemy(){
  // Always return the FIRST alive enemy - no index tracking needed
  for(var i=0;i<RD.enemies.length;i++){
    if(RD.enemies[i].curHp>0) return RD.enemies[i];
  }
  return null;
}

function aliveCount(){
  return RD.enemies.filter(function(e){return e.curHp>0;}).length;
}

function raidFight(action){
  if(RD.done) return;
  setRaidBtns(false); sfx('sfx-select');

  var e=getActiveEnemy();
  if(!e){ waveComplete(); return; }

  var baseAtk=ri(RD.atk[0],RD.atk[1])+RD.atkBonus;
  var prevDef=RD.defending; RD.defending=false;
  var pdmg=0;

  if(action==='attack'){
    var crit=Math.random()<(0.10+(DS.critBonus||0));
    pdmg=crit?Math.round(baseAtk*(DS._gladiatorCrit?2.5:1.8)):baseAtk;
    sfx(crit?'sfx-crit':'sfx-attack');
    rLog(crit?t('CRITICAL HIT on ')+e.name+t(' for ')+pdmg+'!':t('You attack ')+e.name+t(' for ')+pdmg+'.');
  } else if(action==='heavy'){
    if(Math.random()<0.30){
      sfx('sfx-heavy-miss');
      rLog('Heavy strike misses '+e.name+'!');
    } else {
      pdmg=Math.round(baseAtk*1.7);
      sfx('sfx-heavy-hit');
      rLog('Heavy strike hits '+e.name+' for '+pdmg+'!');
    }
  } else if(action==='defend'){
    RD.defending=true;
    pdmg=Math.round(baseAtk*0.4);
    rLog('You defend, striking '+e.name+' for '+pdmg+'.');
  } else if(action==='potion'){
    if(RD.potions<=0){
      rLog('No potions left!'); say('No potions remaining.'); setRaidBtns(true); return;
    }
    var heal=Math.round(RD.maxHp*0.35);
    RD.hp=Math.min(RD.maxHp,RD.hp+heal); RD.potions--;
    sfx('sfx-potion'); updateRaidHp();
    rLog('You drink a potion. +'+heal+' HP. Potions left: '+RD.potions+'.');
    say('Healed '+heal+' HP. HP: '+RD.hp+'. Potions: '+RD.potions+'.');
    setRaidBtns(true); return;
  } else if(action==='_gunCounter'){
    // Gun already dealt damage — just trigger enemy counter-attack
    pdmg = 0;
  }

  // Apply player damage
  if(pdmg>0){
    e.curHp=Math.max(0,e.curHp-pdmg);
    renderRaidGrid();
  }

  // Enemy killed?
  if(e.curHp<=0){
    sfx('sfx-enemy-die');
    try { tryDropMaterial(RD.wave || 1); } catch(e2){}
    recordKill(e.name);
    var g=ri(e.gold[0],e.gold[1]);
    if (_raidDiff === 'hard') g = Math.round(g * 1.5);
    RD.gold+=g;
    rLog(e.name+' falls! +'+g+'g');
    updateRaidHp();
    var remaining=aliveCount();
    setTimeout(function(){
      if(remaining<=0){
        waveComplete();
      } else {
        var next=getActiveEnemy();
        rLog(remaining+' enemy'+(remaining!==1?'ies':'')+' remaining. Now facing '+next.name+'!');
        say(e.name+' defeated. '+remaining+' remaining. Now facing '+next.name+'. HP: '+next.curHp+'.');
        setRaidBtns(true);
      }
    },600);
    return;
  }

  // Enemy counterattack
  setTimeout(function(){
    var raw=ri(e.atk[0],e.atk[1]);
    var dv=RD.def+RD.defBonus+(prevDef?4:0);
    var blk=Math.min(dv,Math.floor(raw*0.55));
    var taken=Math.max(1,raw-blk);
    RD.hp=Math.max(0,RD.hp-taken);
    sfx('sfx-hurt'); updateRaidHp();
    rLog(e.name+t(' strikes you for ')+taken+t(' damage. HP: ')+RD.hp+'/'+RD.maxHp+'.');
    say(e.name+t(' dealt ')+taken+t('. Your HP: ')+RD.hp+'.');
    if(RD.hp<=0){ setTimeout(function(){raidDefeat();},500); }
    else { setRaidBtns(true); }
  },650);
}

function waveComplete(){
  // Double check all dead
  if(aliveCount()>0){ setRaidBtns(true); return; }
  sfx('sfx-enemy-die');
  rLog('Wave '+RD.wave+' cleared! All enemies defeated.');
  say('Wave '+RD.wave+' cleared!');
  if(RD.wave>=5){
    setTimeout(function(){raidVictory();},800);
  } else {
    RD.wave++;
    var wh=Math.round(RD.maxHp*0.20);
    RD.hp=Math.min(RD.maxHp,RD.hp+wh);
    RD.potions++;
    updateRaidHp();
    say('Wave cleared! Healed '+wh+' HP and received 1 potion. Wave '+RD.wave+' of 5 starting in 3 seconds. Potions: '+RD.potions+'.');
    rLog('Wave cleared. You recover '+wh+' HP and find a potion. Wave '+RD.wave+' incoming...');
    setTimeout(function(){startWave();},3000);
  }
}

function getRaidTier() {
  var data = getRaidSave();
  var total = data.totalRaidsWon || 0;
  if (total >= 5) return 3;
  if (total >= 3) return 2;
  return 1;
}

function raidVictory(){
  RD.done=true;
  playTrack('raid-victory'); sfx('sfx-victory'); vibe(VIBE.bossKill);
  var data=getRaidSave();
  data.completedDate=todayKey();
  data.totalRaidsWon = (data.totalRaidsWon||0) + 1;
  var tier = getRaidTier();
  var coinReward = tier === 3 ? 3 : tier === 2 ? 2 : 1;
  data.mysteryCoins=(data.mysteryCoins||0)+coinReward;
  data.totalGold=(data.totalGold||0)+RD.gold;
  setRaidSave(data);
  trackGlobalStat('raidsWon', 1);
  document.getElementById('raid-active').style.display='none';
  var end=document.getElementById('raid-end'); end.style.display='flex';
  document.getElementById('re-icon').textContent='👑';
  var t=document.getElementById('re-title'); t.className='raid-end-title victory'; t.textContent='Raid Complete!';
  document.getElementById('re-sub').textContent='You survived all five waves. The horde has been repelled — for now.';
  var tierNames = ['','Standard','Veteran','Nightmare'];
  var tierCoins = tier === 3 ? 3 : tier === 2 ? 2 : 1;
  document.getElementById('re-rewards').innerHTML=
    rRow('Raid Tier', 'Tier ' + tier + ' — ' + tierNames[tier])+
    rRow('Gold Earned',RD.gold+'g')+
    rRow('Mystery Coins',tierCoins + ' (Tier bonus)')+
    rRow('Total Mystery Coins',data.mysteryCoins)+
    rRow('Total Raids Won', data.totalRaidsWon)+
    rRow('Waves Survived','5 of 5');
  incrementAchievementStat('raidsComplete', 1);
  say('Raid complete! You earned '+RD.gold+' gold and a Mystery Coin. Total coins: '+data.mysteryCoins+'. Press Main Menu to return.');
}

function raidDefeat(){
  RD.done=true; sfx('sfx-gameover');
  document.getElementById('raid-active').style.display='none';
  var end=document.getElementById('raid-end'); end.style.display='flex';
  document.getElementById('re-icon').textContent='💀';
  var t=document.getElementById('re-title'); t.className='raid-end-title defeat'; t.textContent='Overwhelmed';
  document.getElementById('re-sub').textContent='The horde was too great. Come back tomorrow and try again.';
  document.getElementById('re-rewards').innerHTML=
    rRow('Wave Reached',RD.wave+' of 5')+
    rRow('Gold Earned',RD.gold+'g (lost)')+
    rRow('Mystery Coin','Not earned')+
    rRow('Try Again','Tomorrow');
  say('Defeated on wave '+RD.wave+'. Come back tomorrow to try again.');
  // Save to graveyard and obituary
  var ch = RD.charIdx !== undefined ? CHARS[RD.charIdx] : null;
  if (ch) {
    var entry = { name:ch.name, cls:ch.cls, race:ch.race, level:ch.persistLevel||ch.level||1, dungeon:'Daily Raid', difficulty:'Raid', killedBy:'Wave '+RD.wave+' horde', topFloor:RD.wave, date:new Date().toLocaleDateString() };
    try { var g=getGraveyard(); g.unshift(entry); if(g.length>50)g=g.slice(0,50); saveGraveyard(g); } catch(e){}
    postDeathToObituary({ name:ch.name, cls:ch.cls, floor:RD.wave, dungeon:'Daily Raid', killedBy:'Wave '+RD.wave+' horde', kills:RD.kills||0, gold:RD.gold||0, date:entry.date, timestamp:Date.now() });
  }
}

function rRow(k,v){return '<div class="raid-rrow"><span class="raid-rk">'+k+'</span><span class="raid-rv">'+v+'</span></div>';}

function leaveRaid(){playTrack(getMenuTrack()); goTo('menu');}

//═════════════════
// BESTIARY
//═════════════════

var BESTIARY_DATA = [
  // Tier 1 — Floors 1-3
  { id:'hollow-shade', enemyType:'undead',     name:'Hollow Shade',        icon:'👻', tier:'Floor 1-3',  desc:'A wisp of cold mist that drifts silently. Its touch drains warmth from living flesh. The Crypt is full of them, remnants of those who died afraid.' },
  { id:'crypt-rat', enemyType:'beast',        name:'Crypt Rat',            icon:'🐀', tier:'Floor 1-3',  desc:'Enormous rats bred in total darkness over centuries. They have no eyes. They do not need them. They find you by the sound of your heartbeat.' },
  { id:'brittle-skeleton', enemyType:'undead', name:'Brittle Skeleton',     icon:'💀', tier:'Floor 1-3',  desc:'The oldest dead. Their bones should have turned to dust long ago. Something in this place refuses to let them rest.' },
  { id:'grave-crawler', enemyType:'beast',    name:'Grave Crawler',        icon:'🦂', tier:'Floor 1-3',  desc:'An ancient parasite that feeds on the residue of death magic. Where the dead walk, these follow.' },
  { id:'tomb-bat', enemyType:'beast',         name:'Tomb Bat',             icon:'🦇', tier:'Floor 1-3',  desc:'Blind creatures that navigate by the screams of the dead. They are drawn to the living because silence follows them everywhere they go.' },
  { id:'rotting-ghoul', enemyType:'undead',    name:'Rotting Ghoul',        icon:'🧟', tier:'Floor 1-3',  desc:'Not fully dead, not fully alive. They hunger endlessly but cannot remember what they hungers for. They attack out of confusion as much as malice.' },
  { id:'ashen-wisp', enemyType:'spirit',       name:'Ashen Wisp',           icon:'🌫️', tier:'Floor 1-3',  desc:'The remnant of a soul that burned away in grief. It wanders the crypt searching for something it cannot name, destroying anything that reminds it of what it lost.' },
  { id:'bone-shard', enemyType:'undead',       name:'Bone Shard',           icon:'🦴', tier:'Floor 1-3',  desc:'A fragment of a greater skeleton, given its own terrible hunger. Too small to reason with. Too sharp to ignore.' },
  // Tier 2 — Floors 4-6
  { id:'wailing-wraith', enemyType:'undead',   name:'Wailing Wraith',       icon:'👁️', tier:'Floor 4-6',  desc:'The echo of a violent death, given form. It does not attack you. It shares its final moments with you, over and over, until you break.' },
  { id:'armored-skeleton', enemyType:'undead', name:'Armored Skeleton',     icon:'🗡️', tier:'Floor 4-6',  desc:'Malachar former soldiers. They remember their oath, nothing else. They will follow their last order until their bones are powder.' },
  { id:'plague-hound', enemyType:'beast',     name:'Plague Hound',         icon:'🐺', tier:'Floor 4-6',  desc:'Once loyal war hounds. The plague did not spare them. It just changed what they were loyal to.' },
  { id:'crypt-banshee', enemyType:'undead',    name:'Crypt Banshee',        icon:'👻', tier:'Floor 4-6',  desc:'A noblewoman who died in the crypt during the siege. She screams not in pain but in fury. She has been screaming for three hundred years.' },
  { id:'shadow-stalker', enemyType:'spirit',   name:'Shadow Stalker',       icon:'🌑', tier:'Floor 4-6',  desc:'It does not cast a shadow. It IS the shadow. It detaches from the walls only when it has chosen its prey, and it never chooses wrong.' },
  { id:'cursed-knight', enemyType:'undead',    name:'Cursed Knight',        icon:'🛡️', tier:'Floor 4-6',  desc:'A warrior who swore an oath on cursed ground. The oath bound him to the crypt forever. He fights not to kill you, but because fighting is the only thing that makes him forget.' },
  { id:'plague-wraith', enemyType:'undead',    name:'Plague Wraith',        icon:'☠️', tier:'Floor 4-6',  desc:'Where the Plague Hound carries the sickness in its body, the Plague Wraith IS the sickness. It spreads disease through the air around it without ever needing to touch you.' },
  { id:'bone-archer', enemyType:'undead',      name:'Bone Archer',          icon:'🏹', tier:'Floor 4-6',  desc:'It never misses. Not because it is skilled, but because it has fired the same shot one hundred thousand times and has nothing else left to learn.' },
  { id:'crypt-spider', enemyType:'beast',     name:'Crypt Spider',         icon:'🕷️', tier:'Floor 4-6',  desc:'Spiders found their way into the Crypt centuries ago. The death magic changed them. They are larger now. Quieter. They learned that the dead do not struggle, and prefer their prey the same way.' },
  { id:'venom-spitter', enemyType:'beast',    name:'Venom Spitter',        icon:'🕸️', tier:'Floor 4-6',  desc:'It does not bite. It does not need to. The venom it projects dissolves stone. What it does to flesh is not something worth describing.' },
  // Tier 3 — Floors 7-9
  { id:'death-knight', enemyType:'undead',     name:'Death Knight',         icon:'⚔️', tier:'Floor 7-9',  desc:'Generals of Malachar army. Gifted with eternal life as reward. None asked for it. All wish they could die.' },
  { id:'bone-colossus', enemyType:'undead',    name:'Bone Colossus',        icon:'🦴', tier:'Floor 7-9',  desc:'Dozens of skeletons fused into one monstrous form by old death magic. The bones belong to different people. All of them scream.' },
  { id:'soul-harvester', enemyType:'spirit',   name:'Soul Harvester',       icon:'🌑', tier:'Floor 7-9',  desc:'It does not kill you. It collects the part of you that makes you yourself, and adds it to its collection.' },
  { id:'void-reaper', enemyType:'demon',      name:'Void Reaper',          icon:'💀', tier:'Floor 7-9',  desc:'Something dragged from the space between death and whatever comes after. It should not exist here. It should not exist anywhere. Yet here it is, looking at you.' },
  { id:'ancient-revenant', enemyType:'undead', name:'Ancient Revenant',     icon:'🧟', tier:'Floor 7-9',  desc:'Older than Malachar himself. It predates the crypt. When the vault was built around it, it simply waited. It has been waiting longer than this kingdom has existed.' },
  { id:'nightmare-shade', enemyType:'spirit',  name:'Nightmare Shade',      icon:'😱', tier:'Floor 7-9',  desc:'It wears the face of your worst memory. You know it is not real. Knowing does not help.' },
  { id:'blood-golem',      name:'Blood Golem',          icon:'🔴', tier:'Floor 7-9',  desc:'Constructed from the blood of every warrior who has ever fallen in this crypt. It grows stronger with every life the dungeon claims. There have been many lives.' },
  { id:'web-stalker',      name:'Web Stalker',          icon:'🕷️', tier:'Floor 7-9',  desc:'The largest spider in the Crypt. It has been here long enough to web entire corridors. Some of the things caught in those webs are still alive. They wish they were not.' },
  { id:'brood-mother',     name:'Brood Mother',         icon:'🕸️', tier:'Floor 7-9',  desc:'The origin of every spider in the Crypt. She has been laying eggs in the dark for two hundred years. She is very protective of her children. She has a great many children.' },
  // Bosses
  { id:'malachar',         name:'Malachar the Undying', icon:'👑', tier:'Boss, Floor 10', desc:'The warlord who refused death and was given something worse. He has sat in this crypt for a thousand years, perfectly still, perfectly aware, waiting for someone worth killing.', isBoss:true },
  { id:'bone-sovereign',   name:'The Bone Sovereign',   icon:'💀', tier:'Boss, Floor 10', desc:'Not a general but a king. He ruled the dead long before Malachar arrived. He tolerated the warlord. He does not tolerate you.', isBoss:true },
  { id:'void-walker',      name:'The Void Walker',      icon:'🌑', tier:'Boss, Floor 10', desc:'Something from outside the known world. It walked through a crack that opened when Malachar died and could not find the crack again. It has been looking for it ever since.', isBoss:true },
  { id:'undying-legion',   name:'The Undying Legion',   icon:'💀', tier:'Raid Boss',       desc:'Not one creature but many — the shattered souls of every army Malachar ever destroyed, fused into a single unstoppable force. It appears only when the dead are truly restless. Defeat it once and it will return tomorrow, rebuilt from the fallen.', isBoss:true },
  // Ashbound Wastes enemies
  { id:'cinder-wraith', enemyType:'spirit',    name:'Cinder Wraith',        icon:'🔥', tier:'Ashbound 1-3',  desc:'A soul that was burned alive and refused to move on. It still burns. It will always burn. It shares that experience with you whether you want it to or not.' },
  { id:'ash-crawler',      name:'Ash Crawler',          icon:'🌋', tier:'Ashbound 1-3',  desc:'A creature of compressed ash given terrible life by the same force that destroyed the city. It leaves a trail of fine gray powder wherever it goes.' },
  { id:'scorched-husk', enemyType:'demon',    name:'Scorched Husk',        icon:'💀', tier:'Ashbound 1-3',  desc:'What remains of a person after the fire has taken everything worth taking. The body still moves. There is nothing inside it that remembers why.' },
  { id:'ember-shade', enemyType:'spirit',      name:'Ember Shade',          icon:'✨', tier:'Ashbound 1-3',  desc:'A dying ember given awareness. It knows it is dying. It has been dying for three hundred years. It resents anything that is not.' },
  { id:'char-bat',         name:'Char Bat',             icon:'🦇', tier:'Ashbound 1-3',  desc:'The bats of this place survived by eating ash for generations. They are not what bats should be anymore. Their wings leave burn marks on what they touch.' },
  { id:'slag-crawler',     name:'Slag Crawler',         icon:'🪲', tier:'Ashbound 1-3',  desc:'Born in the moment the city melted. It is partly metal, partly stone, partly something that has no name. It is very slow. It does not need to be fast.' },
  { id:'molten-knight',    name:'Molten Knight',        icon:'⚔️', tier:'Ashbound 4-6',  desc:'The armor and the soldier fused in the moment of the disaster. Neither survived. Both are still here. It fights because that is what soldiers do.' },
  { id:'plague-of-cinders',name:'Plague of Cinders',   icon:'💨', tier:'Ashbound 4-6',  desc:'Not an individual creature but a colony — thousands of burning fragments moving as one. You cannot fight it so much as survive it.' },
  { id:'char-stalker',     name:'Char Stalker',         icon:'👁️', tier:'Ashbound 4-6',  desc:'It hunts by heat. Your warmth is a beacon to it in the dead gray world of the Wastes. The only way to hide from it is to become as cold as the ash.' },
  { id:'blighted-overseer',name:'Blighted Overseer',   icon:'👺', tier:'Ashbound 4-6',  desc:'It used to give orders. It used to have people to give orders to. Now it wanders the ruins of its authority, still issuing commands to the ash.' },
  { id:'ashen-revenant',   name:'Ashen Revenant',      icon:'🧟', tier:'Ashbound 4-6',  desc:'A citizen who refused to leave when the fire came. They stayed because this was their home. It is still their home. It always will be.' },
  { id:'flame-wraith', enemyType:'spirit',     name:'Flame Wraith',         icon:'👻', tier:'Ashbound 4-6',  desc:'Like the Wailing Wraith of the Crypt, but born of fire rather than cold. It does not share its final moments. It shares the sensation of burning.' },
  { id:'volcanic-revenant',name:'Volcanic Revenant',   icon:'🌋', tier:'Ashbound 7-9',  desc:'Not a person transformed. Something that was never a person. It was born in the eruption, made of the same force that leveled the city. It is not angry. It simply destroys.' },
  { id:'infernal-colossus',name:'Infernal Colossus',   icon:'💀', tier:'Ashbound 7-9',  desc:'Like the Bone Colossus of the Crypt, but composed of fused slag, melted armor, and the calcified remains of an entire city block.' },
  { id:'the-ashen-king',   name:'The Ashen King',      icon:'👑', tier:'Ashbound 7-9',  desc:'He refused to flee. He died on his throne. Three hundred years later he is still on it, though the throne has fused to his body and his body has fused to the floor.' },
  { id:'slag-titan',       name:'Slag Titan',          icon:'🔴', tier:'Ashbound 7-9',  desc:'The largest thing in the Wastes. It was built from everything the fire left behind that was too dense to become ash. It is not alive. It does not need to be.' },
  { id:'ember-reaper',     name:'Ember Reaper',        icon:'☠️', tier:'Ashbound 7-9',  desc:'Death in the Ashbound Wastes does not look like the robed figure people imagine. It looks like this. It has always looked like this.' },
  { id:'eternal-pyre',     name:'The Eternal Pyre',    icon:'🔥', tier:'Boss, Ashbound Floor 10', desc:'The fire that destroyed the city was never extinguished. Over centuries it became aware. It does not want to hurt you. It simply wants to share what it is. What it is, is burning.', isBoss:true },
  { id:'ashen-throne',     name:'The Ashen Throne',     icon:'👑', tier:'Boss, Ashbound Floor 10', desc:'He refused to flee when the fire came. He died on his throne. Three centuries later the throne and the ruler are one thing — a molten seat of authority with nothing left to rule.', isBoss:true },
  { id:'cinder-colossus',  name:'The Cinder Colossus',  icon:'🌋', tier:'Boss, Ashbound Floor 10', desc:'Built from everything the eruption left behind that was too dense to become ash. It is not a creature. It is the collapse given legs. It is still collapsing.', isBoss:true },
  // Frosthold Abyss enemies
  { id:'frost-shade', enemyType:'spirit',        name:'Frost Shade',          icon:'❄️', tier:'Frosthold 1-3', desc:'A ghost that has been frozen so long it has forgotten it was ever warm. It reaches for living heat not to harm but to remember. The reaching harms anyway.' },
  { id:'glacial-rat',        name:'Glacial Rat',           icon:'🐀', tier:'Frosthold 1-3', desc:'They have lived in the abyss long enough that warmth is foreign to them. They bite because warmth angers them. They cannot explain why.' },
  { id:'ice-shard',          name:'Ice Shard',             icon:'🧊', tier:'Frosthold 1-3', desc:'Not a creature. A weapon the Abyss made for itself. It moves with intent. That is enough.' },
  { id:'frozen-husk',        name:'Frozen Husk',           icon:'💀', tier:'Frosthold 1-3', desc:'A body preserved perfectly by the cold for longer than any record tracks. Whatever was inside it when it froze is gone. Something else moved in.' },
  { id:'cave-bat',           name:'Cave Bat',              icon:'🦇', tier:'Frosthold 1-3', desc:'The darkness here is different from other darknesses. The bats that live in it have changed accordingly. They do not avoid the cold. They carry it.' },
  { id:'permafrost-crawler', name:'Permafrost Crawler',    icon:'🦂', tier:'Frosthold 1-3', desc:'Lives in the rock below the ice. It surfaces only when something warmer than it passes by. Nothing warmer than it lives here. Until now.' },
  { id:'blizzard-wraith', enemyType:'spirit',    name:'Blizzard Wraith',       icon:'👻', tier:'Frosthold 4-6', desc:'Formed from snowstorms that fell so deep into the Abyss they never melted. The storm became aware. It has been searching for a way out ever since.' },
  { id:'glacial-knight',     name:'Glacial Knight',        icon:'⚔️', tier:'Frosthold 4-6', desc:'A soldier who descended into the Abyss centuries ago and was absorbed by it. The ice did not kill him. It improved him. He does not agree.' },
  { id:'frostbite-hound', enemyType:'beast',    name:'Frostbite Hound',       icon:'🐺', tier:'Frosthold 4-6', desc:'Its bite does not wound so much as freeze. The affected area stops belonging to you. You can watch it happen and there is nothing you can do.' },
  { id:'frozen-banshee',     name:'Frozen Banshee',        icon:'👁️', tier:'Frosthold 4-6', desc:'Its scream does not carry sound. It carries cold. The kind of cold that reaches things sound cannot.' },
  { id:'ice-stalker',        name:'Ice Stalker',           icon:'🌑', tier:'Frosthold 4-6', desc:'It is the same color as the ice it moves through. You will not see it coming. You will only feel the temperature change.' },
  { id:'arctic-revenant',    name:'Arctic Revenant',       icon:'🧟', tier:'Frosthold 4-6', desc:'Died in the cold and was preserved so well that death could not take hold properly. It has been between states for so long it no longer remembers which one it prefers.' },
  { id:'avalanche-colossus', name:'Avalanche Colossus',    icon:'🏔️', tier:'Frosthold 7-9', desc:'Born when a section of the mountain decided it was tired of staying still. It has not stopped moving since. Everything in its path becomes part of it.' },
  { id:'frost-reaper',       name:'Frost Reaper',          icon:'☠️', tier:'Frosthold 7-9', desc:'Death in the Frosthold Abyss wears a different face than in the warm world. Colder. More patient. More certain of the outcome.' },
  { id:'glacial-sovereign',  name:'The Glacial Sovereign', icon:'👑', tier:'Frosthold 7-9', desc:'It was the first thing the cold made when it became aware. It has been here since before the mountain. It will be here after.' },
  { id:'frozen-titan',       name:'Frozen Titan',          icon:'🧊', tier:'Frosthold 7-9', desc:'Something impossibly old encased in ice so ancient it has crystallized into something that is not quite ice anymore. Breaking the ice only made it angry.' },
  { id:'void-frost',         name:'Void Frost',            icon:'💀', tier:'Frosthold 7-9', desc:'Not from this world. Not from any world. It came through a crack in the deep ice that opened once and should have closed. It did not close.' },
  { id:'eternal-winter',     name:'The Eternal Winter',    icon:'❄️', tier:'Boss, Frosthold Floor 10', desc:'The cold is not a temperature here. It is a living thing that has waited for something warm to arrive for a thousand years. Now something warm has arrived.', isBoss:true },
  { id:'frozen-king',        name:'The Frozen King',       icon:'👑', tier:'Boss, Frosthold Floor 10', desc:'He descended into the Abyss a thousand years ago believing he could conquer it. The Abyss agreed to keep him forever instead. He has been awake inside the ice the entire time.', isBoss:true },
  { id:'void-below',         name:'The Void Below',        icon:'🌑', tier:'Boss, Frosthold Floor 10', desc:'There is something beneath the Frosthold Abyss that is not ice, not stone, not cold. It has been pressing upward since before humans discovered fire. It is very close to the surface now.', isBoss:true, dungeon:'frost' },

  // ── THE SUNKEN ARCHIVES ──
  { id:'drowned-archivist', enemyType:'undead',  name:'Drowned Archivist',     icon:'📚', tier:'Archives 1-3',  desc:'A librarian who refused to leave when the water came. Still filing. Still cataloguing. Still here.', dungeon:'sunken' },
  { id:'ink-wraith', enemyType:'spirit',         name:'Ink Wraith',            icon:'🖤', tier:'Archives 1-3',  desc:'The concentrated will of a thousand unfinished manuscripts. It wants to be completed.', dungeon:'sunken' },
  { id:'bloated-librarian',  name:'Bloated Librarian',     icon:'📖', tier:'Archives 1-3',  desc:'Three hundred years of submersion have not improved their disposition.', dungeon:'sunken' },
  { id:'paper-shade', enemyType:'spirit',        name:'Paper Shade',           icon:'📄', tier:'Archives 1-3',  desc:'A creature made entirely of waterlogged pages. The text is still legible. You cannot read it fast enough.', dungeon:'sunken' },
  { id:'soggy-sentinel',     name:'Soggy Sentinel',        icon:'🧟', tier:'Archives 1-3',  desc:'Posted here to guard a section that no longer exists. Has not received updated orders.', dungeon:'sunken' },
  { id:'deep-cartographer',  name:'Deep Cartographer',     icon:'🗺️', tier:'Archives 4-6', desc:'It has mapped every inch of the Archives. Including the parts that should not exist.', dungeon:'sunken' },
  { id:'tide-golem',         name:'Tide Golem',            icon:'🌊', tier:'Archives 4-6',  desc:'Assembled from the water itself. The Archives needed better security. This was the solution.', dungeon:'sunken' },
  { id:'drowned-scholar',    name:'Drowned Scholar',       icon:'🎓', tier:'Archives 4-6',  desc:'Knew too much. The Archives decided to keep them.', dungeon:'sunken' },
  { id:'archive-specter',    name:'Archive Specter',       icon:'👻', tier:'Archives 4-6',  desc:'The ghost of someone who came looking for a specific book. Never found it. Never left.', dungeon:'sunken' },
  { id:'leviathan-spawn',    name:'Leviathan Spawn',       icon:'🦑', tier:'Archives 4-6',  desc:'The main attraction is still in the deepest chamber. These are just its thoughts.', dungeon:'sunken' },
  { id:'sunken-warden',      name:'The Sunken Warden',     icon:'⚓', tier:'Archives 7-9',  desc:'Appointed by whoever ran this place before the flooding. The appointment has not expired.', dungeon:'sunken' },
  { id:'grand-archivist',    name:'Grand Archivist',       icon:'📜', tier:'Archives 7-9',  desc:'The most senior librarian. Has read everything. Is not at peace with what it learned.', dungeon:'sunken' },
  { id:'abyssal-colossus',   name:'Abyssal Colossus',      icon:'🌊', tier:'Archives 7-9',  desc:'Built from the weight of three hundred years of accumulated water pressure.', dungeon:'sunken' },
  { id:'drowned-curator',    name:'The Drowned Curator',   icon:'📚', tier:'Boss, Archives 10', desc:'It has read every book in the Archives. The experience was not positive.', dungeon:'sunken', isBoss:true },
  { id:'leviathan-deep',     name:'Leviathan of the Deep', icon:'🦑', tier:'Boss, Archives 10', desc:'The Archives were built around it. This distinction matters.', dungeon:'sunken', isBoss:true },
  { id:'last-librarian',     name:'The Last Librarian',    icon:'📖', tier:'Boss, Archives 10', desc:'She stayed. She has had a very long time to be angry about it.', dungeon:'sunken', isBoss:true },

  // ── NEW NIGHTMARE ENEMIES ──
  { id:'the-unnamed',        name:'The Unnamed',           icon:'❓', tier:'Nightmare 1-3',  desc:'It had a name once. The dungeon took it. It wants it back.', dungeon:'nightmare' },
  { id:'scream-without',     name:'Scream Without Source', icon:'💢', tier:'Nightmare 1-3',  desc:'Not an enemy. Not a creature. Just a sound that has learned to hurt people.', dungeon:'nightmare' },
  { id:'the-almost',         name:'The Almost',            icon:'🌫️', tier:'Nightmare 1-3', desc:'Almost a person. Almost recognizable. Almost something you have seen before.', dungeon:'nightmare' },
  { id:'hollow-colossus',    name:'Hollow Colossus',       icon:'🫙', tier:'Nightmare 4-6',  desc:'An enormous emptiness that has learned to walk.', dungeon:'nightmare' },
  { id:'the-unraveling',     name:'The Unraveling',        icon:'🌀', tier:'Nightmare 4-6',  desc:'It is coming apart. It would like your help. You should not help it.', dungeon:'nightmare' },
  { id:'grief-made-flesh',   name:'Grief Made Flesh',      icon:'💔', tier:'Nightmare 4-6',  desc:'You do not want to know whose grief this was.', dungeon:'nightmare' },

  // ── CRYPT OF MALACHAR — Normal Enemies ──
  { id:'crypt-brittle-skeleton', enemyType:'undead',  name:'Brittle Skeleton',   icon:'💀', tier:'Crypt 1-3',   dungeon:'crypt', desc:'The first thing you face. Held together by something older than bone.' },
  { id:'crypt-tomb-bat',          name:'Tomb Bat',           icon:'🦇', tier:'Crypt 1-3',   dungeon:'crypt', desc:'Blind but not deaf. It finds you by the sound of your breathing.' },
  { id:'crypt-crypt-rat',         name:'Crypt Rat',          icon:'🐀', tier:'Crypt 1-3',   dungeon:'crypt', desc:'Feeds on the dead. Has been down here so long it no longer reacts to light.' },
  { id:'crypt-crypt-spider', enemyType:'beast',      name:'Crypt Spider',       icon:'🕷️', tier:'Crypt 1-4',   dungeon:'crypt', desc:'The webs are old. The spider is older. It has been waiting specifically for you.' },
  { id:'crypt-rotting-ghoul', enemyType:'undead',     name:'Rotting Ghoul',      icon:'🧟', tier:'Crypt 2-4',   dungeon:'crypt', desc:'Was someone. Now it is hunger wearing a shape.' },
  { id:'crypt-grave-crawler',     name:'Grave Crawler',      icon:'🪱', tier:'Crypt 2-4',   dungeon:'crypt', desc:'Erupts from the floor. The crypt floor is not safe to walk on.' },
  { id:'crypt-bone-archer',       name:'Bone Archer',        icon:'🏹', tier:'Crypt 2-5',   dungeon:'crypt', desc:'Fires from a distance. The arrows are its own ribs. It does not run out.' },
  { id:'crypt-bone-shard',        name:'Bone Shard',         icon:'🦴', tier:'Crypt 2-5',   dungeon:'crypt', desc:'A fragment of something larger. It is sharper than it looks.' },
  { id:'crypt-wailing-wraith', enemyType:'spirit',    name:'Wailing Wraith',     icon:'👻', tier:'Crypt 3-6',   dungeon:'crypt', desc:'The sound arrives before it does. By the time you hear it, it is already too close.' },
  { id:'crypt-hollow-shade', enemyType:'spirit',      name:'Hollow Shade',       icon:'👤', tier:'Crypt 3-6',   dungeon:'crypt', desc:'No face. No voice. It copies your movements one second behind.' },
  { id:'crypt-shadow-stalker',    name:'Shadow Stalker',     icon:'🌑', tier:'Crypt 3-6',   dungeon:'crypt', desc:'It does not attack immediately. It watches. Then it moves.' },
  { id:'crypt-plague-hound', enemyType:'beast',      name:'Plague Hound',       icon:'🐕', tier:'Crypt 3-7',   dungeon:'crypt', desc:'Loyal to death. Whatever it was bonded to has been gone a long time.' },
  { id:'crypt-venom-spitter',     name:'Venom Spitter',      icon:'🐍', tier:'Crypt 4-7',   dungeon:'crypt', desc:'The venom is not fast. It just waits inside you.' },
  { id:'crypt-armored-skeleton', enemyType:'undead',  name:'Armored Skeleton',   icon:'🛡️', tier:'Crypt 4-7',   dungeon:'crypt', desc:'Someone buried it in full armor. That was a mistake.' },
  { id:'crypt-plague-wraith', enemyType:'spirit',     name:'Plague Wraith',      icon:'☠️', tier:'Crypt 4-8',   dungeon:'crypt', desc:'It passed through the living so many times that it became something in between.' },
  { id:'crypt-crypt-banshee',     name:'Crypt Banshee',      icon:'😱', tier:'Crypt 5-8',   dungeon:'crypt', desc:'The scream does not hurt your ears. It hurts something deeper.' },
  { id:'crypt-web-stalker',       name:'Web Stalker',        icon:'🕸️', tier:'Crypt 5-8',   dungeon:'crypt', desc:'The whole ceiling is a web. You walked into it before you saw it.' },
  { id:'crypt-ancient-revenant',  name:'Ancient Revenant',   icon:'💀', tier:'Crypt 5-9',   dungeon:'crypt', desc:'Died so long ago it has forgotten it is dead. It is angry about this.' },
  { id:'crypt-cursed-knight',     name:'Cursed Knight',      icon:'⚔️', tier:'Crypt 5-9',   dungeon:'crypt', desc:'Oath-bound to guard a tomb that no longer exists. Still following orders.' },
  { id:'crypt-blood-golem',       name:'Blood Golem',        icon:'🩸', tier:'Crypt 6-9',   dungeon:'crypt', desc:'Built from the blood of those who came before you. It grows with each failure.' },
  { id:'crypt-soul-harvester',    name:'Soul Harvester',     icon:'⚰️', tier:'Crypt 6-9',   dungeon:'crypt', desc:'It does not kill you. It takes something else. You do not notice until later.' },
  { id:'crypt-ashen-wisp', enemyType:'spirit',        name:'Ashen Wisp',         icon:'✨', tier:'Crypt 6-9',   dungeon:'crypt', desc:'It used to light the crypt for the living. The living are gone. It kept working.' },
  { id:'crypt-nightmare-shade', enemyType:'spirit',   name:'Nightmare Shade',    icon:'😨', tier:'Crypt — Elite', dungeon:'crypt', isElite:true, desc:'It is not real. It is made of what you are afraid of. That distinction stops mattering quickly.' },
  { id:'crypt-void-reaper',       name:'Void Reaper',        icon:'🌑', tier:'Crypt — Elite', dungeon:'crypt', isElite:true, desc:'Comes from beyond the dungeon. It was not summoned. It arrived on its own.' },
  { id:'crypt-brood-mother',      name:'Brood Mother',       icon:'🕷️', tier:'Crypt — Elite', dungeon:'crypt', isElite:true, desc:'She has been down here long enough to fill every room with her children.' },
  { id:'crypt-bone-colossus',     name:'Bone Colossus',      icon:'💀', tier:'Crypt — Boss',  dungeon:'crypt', isBoss:true, desc:'Every skeleton in the crypt eventually becomes part of it.' },
  { id:'crypt-bone-sovereign',    name:'The Bone Sovereign', icon:'👑', tier:'Crypt — Boss',  dungeon:'crypt', isBoss:true, desc:'The last king of the crypt. Still ruling. The kingdom is gone but the throne is not.' },
  { id:'crypt-void-walker-boss',  name:'The Void Walker',    icon:'🌑', tier:'Crypt — Boss',  dungeon:'crypt', isBoss:true, desc:'It came through a door that no longer exists. It cannot find its way back. It blames you.' },
  { id:'crypt-malachar',          name:'Malachar the Undying',icon:'👑',tier:'Crypt — Boss',  dungeon:'crypt', isBoss:true, desc:'He built the crypt. He filled it. He is still here. He has been waiting for someone worth fighting.' },

  // ── ELITE ENEMIES ──
  { id:'ancient-death-knight',name:'Ancient Death Knight', icon:'⚔️', tier:'Elite — Crypt',   desc:'Has been a Death Knight since before the Crypt was built. Was here first.', dungeon:'crypt', isElite:true },
  { id:'eternal-warden-elite',name:'The Eternal Warden',  icon:'🛡️', tier:'Elite — Crypt',   desc:'Has never taken a day off. Has never been asked to.', dungeon:'crypt', isElite:true },

  // ── THE ASHBOUND WASTES — Normal Enemies ──
  { id:'ash-ash-crawler',        name:'Ash Crawler',        icon:'🐛', tier:'Ashbound 1-3',  dungeon:'ash', desc:'Moves through the ash the way water moves through sand. You cannot hear it coming.' },
  { id:'ash-char-bat',           name:'Char Bat',           icon:'🦇', tier:'Ashbound 1-3',  dungeon:'ash', desc:'Its wings are on fire. It has adapted. This is concerning.' },
  { id:'ash-ember-shard',        name:'Ember Shard',        icon:'🔥', tier:'Ashbound 1-4',  dungeon:'ash', desc:'A fragment of something that burned completely. It is still burning.' },
  { id:'ash-slag-crawler',       name:'Slag Crawler',       icon:'🌋', tier:'Ashbound 2-4',  dungeon:'ash', desc:'Moves through molten rock. The heat does not bother it. Everything about you does.' },
  { id:'ash-flame-wraith', enemyType:'spirit',       name:'Flame Wraith',       icon:'🔥', tier:'Ashbound 2-5',  dungeon:'ash', desc:'A ghost that caught fire and never stopped burning. The fire is the ghost now.' },
  { id:'ash-ember-shade', enemyType:'spirit',        name:'Ember Shade',        icon:'💫', tier:'Ashbound 2-5',  dungeon:'ash', desc:'Moves faster in the heat. The Ashbound Wastes are always hot.' },
  { id:'ash-ashen-blade',        name:'Ashen Blade',        icon:'⚔️', tier:'Ashbound 3-6',  dungeon:'ash', desc:'Someone dropped this sword in the ash long ago. The ash got into it. Now it fights on its own.' },
  { id:'ash-scorched-husk',      name:'Scorched Husk',      icon:'🧟', tier:'Ashbound 3-6',  dungeon:'ash', desc:'Was a person. The wastes do this. It takes a long time. They are still in there somewhere.' },
  { id:'ash-cinder-wraith', enemyType:'spirit',      name:'Cinder Wraith',      icon:'✨', tier:'Ashbound 3-7',  dungeon:'ash', desc:'Feeds on heat. This dungeon has an infinite supply. It is never hungry.' },
  { id:'ash-ember-reaper',       name:'Ember Reaper',       icon:'💀', tier:'Ashbound 4-7',  dungeon:'ash', desc:'Harvests what the wastes leave behind. There is always something left behind.' },
  { id:'ash-molten-knight',      name:'Molten Knight',      icon:'🛡️', tier:'Ashbound 4-8',  dungeon:'ash', desc:'Its armor melted. Its body filled the space. It is the armor now.' },
  { id:'ash-volcanic-revenant',  name:'Volcanic Revenant',  icon:'🌋', tier:'Ashbound 5-8',  dungeon:'ash', desc:'Died in an eruption. The eruption brought it back. Gratitude was not its first feeling.' },
  { id:'ash-plague-of-cinders',  name:'Plague of Cinders',  icon:'🔥', tier:'Ashbound 5-9',  dungeon:'ash', isElite:true, desc:'Not one enemy. A swarm of burning fragments that act as one. You cannot fight fire with a sword.' },
  { id:'ash-ashen-revenant',     name:'Ashen Revenant',     icon:'💀', tier:'Ashbound 5-9',  dungeon:'ash', isElite:true, desc:'Dies and reforms from the ash. You must destroy all the ash at once.' },
  { id:'ash-slag-titan',         name:'Slag Titan',         icon:'🌋', tier:'Ashbound — Elite', dungeon:'ash', isElite:true, desc:'Rose from the magma so long ago that the magma has cooled around its feet. It pulled free anyway.' },
  { id:'ash-blighted-overseer',  name:'Blighted Overseer',  icon:'👁️', tier:'Ashbound — Elite', dungeon:'ash', isElite:true, desc:'Watched the wastes form from above. Has been watching ever since. It has seen everything.' },
  { id:'ash-infernal-colossus',  name:'Infernal Colossus',  icon:'🔱', tier:'Ashbound — Elite', dungeon:'ash', isElite:true, desc:'Built from the bones of the wastes itself. The wastes needed a guardian. This is what it made.' },
  { id:'ash-titan-elite',        name:'Ash Titan',          icon:'🔥', tier:'Elite — Ashbound', desc:'The fire did not just burn this creature. It became this creature.', dungeon:'ash', isElite:true },
  { id:'vel-ashara-chosen',      name:'Vel Ashara Chosen',  icon:'🌋', tier:'Elite — Ashbound', desc:'Selected by the fire itself. The honor is not reciprocated.', dungeon:'ash', isElite:true },
  { id:'ash-eternal-pyre',       name:'The Eternal Pyre',   icon:'🔥', tier:'Ashbound — Boss', dungeon:'ash', isBoss:true, desc:'Has been burning since before the dungeon was built. The dungeon was built around it.' },
  { id:'ash-ashen-throne',       name:'The Ashen Throne',   icon:'👑', tier:'Ashbound — Boss', dungeon:'ash', isBoss:true, desc:'A ruler who refused to leave when the kingdom burned. The kingdom is ash. The ruler remains.' },
  { id:'ash-cinder-colossus',    name:'The Cinder Colossus',icon:'🌋', tier:'Ashbound — Boss', dungeon:'ash', isBoss:true, desc:'Absorbs the molten floor when it rages. Grows larger with each phase. There is no ceiling.' },
  { id:'ash-ashen-king',         name:'The Ashen King',     icon:'👑', tier:'Ashbound — Boss', dungeon:'ash', isBoss:true, desc:'Burned his own kingdom to keep it from enemies. Burned himself last. Regrets nothing.' },
  { id:'the-chimera-special',    name:'The Chimera',        icon:'🐉', tier:'Special',         dungeon:'nightmare', desc:'Lion head. Goat body. Serpent tail. Each part fights independently. Destroy all three to win.' },
  { id:'easter-bunny-enemy',     name:'The Easter Bunny',   icon:'🐰', tier:'Seasonal',        dungeon:'crypt', desc:'A large rabbit in a bow tie. Has a basket of eggs. Appears only during Easter.' },
  { id:'glacier-warden-elite',name:'Glacier Warden',       icon:'🧊', tier:'Elite — Frosthold', desc:'Older than the ice. The ice grew around it like a house.', dungeon:'frost', isElite:true },
  { id:'frost-sovereign',     name:'The Frost Sovereign',  icon:'❄️', tier:'Elite — Frosthold', desc:'Rules the cold. The cold has not objected.', dungeon:'frost', isElite:true },

  // ── FROSTHOLD ABYSS — Full enemy list ──
  { id:'frost-glacial-rat',      name:'Glacial Rat',        icon:'🐀', tier:'Frosthold 1-3',  dungeon:'frost', desc:'Survived down here by eating whatever the cold left behind. There is always something left behind.' },
  { id:'frost-cave-bat',         name:'Cave Bat',           icon:'🦇', tier:'Frosthold 1-3',  dungeon:'frost', desc:'Blind in the dark, blind in the ice. It navigates by the cold itself.' },
  { id:'frost-ice-shard',        name:'Ice Shard',          icon:'🧊', tier:'Frosthold 1-4',  dungeon:'frost', desc:'A fragment of the glacier that learned to move. It is still learning.' },
  { id:'frost-frost-crystal',    name:'Frost Crystal',      icon:'💎', tier:'Frosthold 1-4',  dungeon:'frost', desc:'Grows in the dark. By the time you see it, it has already grown into you.' },
  { id:'frost-permafrost-crawler',name:'Permafrost Crawler', icon:'🐛', tier:'Frosthold 2-5', dungeon:'frost', desc:'Moves through the ice the way worms move through soil. The ice is always frozen. It is always moving.' },
  { id:'frost-frostbite-hound', enemyType:'beast',  name:'Frostbite Hound',    icon:'🐕', tier:'Frosthold 2-5',  dungeon:'frost', desc:'Its bite does not hurt immediately. The cold does the work later.' },
  { id:'frost-frost-shade', enemyType:'spirit',      name:'Frost Shade',        icon:'👤', tier:'Frosthold 2-6',  dungeon:'frost', desc:'The cold preserves things. Including things that should not be preserved.' },
  { id:'frost-ice-stalker',      name:'Ice Stalker',        icon:'🌑', tier:'Frosthold 3-6',  dungeon:'frost', desc:'Follows at a distance. The distance is always exactly the same. You cannot lose it.' },
  { id:'frost-frozen-husk',      name:'Frozen Husk',        icon:'🧟', tier:'Frosthold 3-6',  dungeon:'frost', desc:'Was an explorer. The cold got into them before they got out. They are not coming out.' },
  { id:'frost-glacial-knight',   name:'Glacial Knight',     icon:'⚔️', tier:'Frosthold 3-7',  dungeon:'frost', desc:'Their armor froze to their body centuries ago. They stopped noticing.' },
  { id:'frost-frozen-blade',     name:'Frozen Blade',       icon:'🗡️', tier:'Frosthold 4-7',  dungeon:'frost', desc:'The sword froze mid-swing and kept swinging. The wielder is long gone.' },
  { id:'frost-blizzard-wraith', enemyType:'spirit',  name:'Blizzard Wraith',    icon:'❄️', tier:'Frosthold 4-8',  dungeon:'frost', desc:'Made of the storm itself. It does not have a body. The blizzard is the body.' },
  { id:'frost-arctic-revenant',  name:'Arctic Revenant',    icon:'💀', tier:'Frosthold 4-8',  dungeon:'frost', desc:'Died in the cold and came back colder. The resurrection did not warm it.' },
  { id:'frost-frozen-banshee',   name:'Frozen Banshee',     icon:'😱', tier:'Frosthold 5-9',  dungeon:'frost', isElite:true, desc:'Its scream does not carry sound. It carries cold. The kind of cold that reaches things sound cannot.' },
  { id:'frost-frost-reaper',     name:'Frost Reaper',       icon:'💀', tier:'Frosthold 5-9',  dungeon:'frost', isElite:true, desc:'Harvests the frozen dead. The abyss keeps producing them. It is never out of work.' },
  { id:'frost-void-frost',       name:'Void Frost',         icon:'🌑', tier:'Frosthold — Elite', dungeon:'frost', isElite:true, desc:'The void and the cold found each other in the deep abyss. They are inseparable now.' },
  { id:'frost-frozen-titan',     name:'Frozen Titan',       icon:'🏔️', tier:'Frosthold — Elite', dungeon:'frost', isElite:true, desc:'So large the ice grew around it like a mountain. Still moving. Very slowly.' },
  { id:'frost-avalanche-colossus',name:'Avalanche Colossus',icon:'🌨️', tier:'Frosthold — Elite', dungeon:'frost', isElite:true, desc:'It does not attack. It falls. The difference matters less than you would hope.' },
  { id:'frost-eternal-winter',   name:'The Eternal Winter', icon:'❄️', tier:'Frosthold — Boss', dungeon:'frost', isBoss:true, desc:'It was not always cold in the abyss. Then the Eternal Winter arrived. Nothing else did after that.' },
  { id:'frost-frozen-king',      name:'The Frozen King',    icon:'👑', tier:'Frosthold — Boss', dungeon:'frost', isBoss:true, desc:'The ice encasing him cracks when he is angry. He is always angry. The ice is always cracking.' },
  { id:'frost-glacial-sovereign',name:'The Glacial Sovereign',icon:'👑',tier:'Frosthold — Boss', dungeon:'frost', isBoss:true, desc:'The abyss itself answers to it. The abyss has been answering for a very long time.' },
  { id:'frost-void-below',       name:'The Void Below',     icon:'🌑', tier:'Frosthold — Boss', dungeon:'frost', isBoss:true, desc:'It came up through the ice floor. The floor did not stop it. Neither did the cold. Neither will you.' },

  // ── SUNKEN ARCHIVES — Missing entries ──
  { id:'sunken-archive-phantom', name:'Archive Phantom',    icon:'👻', tier:'Archives 2-4',   dungeon:'sunken', desc:'The ghost of a researcher who cannot remember what they were researching. Still looking.' },
  { id:'sunken-barnacle-armor',  name:'Barnacle Armor',     icon:'🦪', tier:'Archives 2-5',   dungeon:'sunken', desc:'The armor was abandoned in the flooding. Something moved in. It fits perfectly.' },
  { id:'sunken-drowned-paladin', name:'Drowned Paladin',    icon:'🛡️', tier:'Archives 3-6',   dungeon:'sunken', desc:'Died protecting an archive that no longer exists. Still protecting it.' },
  { id:'sunken-abyssal-hunter',  name:'Abyssal Hunter',     icon:'🦑', tier:'Archives 3-6',   dungeon:'sunken', desc:'Came up from below the archives. What is below the archives is not documented.' },
  { id:'sunken-ink-shade', enemyType:'spirit',       name:'Ink Shade',          icon:'🖋️', tier:'Archives 3-7',   dungeon:'sunken', desc:'Made entirely of spilled ink. The archives had a lot of ink. The flood did the rest.' },
  { id:'sunken-waterlogged-blade',name:'Waterlogged Blade', icon:'⚔️', tier:'Archives 4-7',   dungeon:'sunken', desc:'The sword rusted. Then it came alive. Rust and all.' },
  { id:'sunken-drowned-paladin2', name:'Drowned Chancellor',icon:'📜', tier:'Archives 4-8',   dungeon:'sunken', isElite:true, desc:'Ran the archives before the flooding. Now runs the underwater version. Standards have slipped.' },
  { id:'sunken-abyssal-colossus2',name:'Abyssal Colossus',  icon:'🌊', tier:'Archives — Elite', dungeon:'sunken', isElite:true, desc:'Rose from the deepest part of the archive basement. The basement was not supposed to have a deepest part.' },
  { id:'sunken-one-that-watches2',name:'The One That Watches',icon:'👁️',tier:'Archives — Elite', dungeon:'sunken', isElite:true, desc:'Catalogued everything in the archives. Including you, the moment you arrived.' },
  { id:'sunken-last-librarian',  name:'The Last Librarian', icon:'📚', tier:'Archives — Boss', dungeon:'sunken', isBoss:true, desc:'Everyone else left. It stayed. It was responsible for the collection. The collection is still here.' },
  { id:'sunken-drowned-curator', name:'The Drowned Curator',icon:'🌊', tier:'Archives — Boss', dungeon:'sunken', isBoss:true, desc:'The original curator refused to leave when the flooding started. The flooding started three hundred years ago.' },

  { id:'head-archivist',      name:'The Head Archivist',   icon:'📚', tier:'Elite — Archives',  desc:'Responsible for everything in the Archives. Including you, now.', dungeon:'sunken', isElite:true },
  { id:'leviathan-scout',     name:'Leviathan Scout',      icon:'🦑', tier:'Elite — Archives',  desc:'A small piece of something very large. Relative terms.', dungeon:'sunken', isElite:true },
  { id:'first-fear',          name:'The First Fear',       icon:'😱', tier:'Elite — Nightmare', desc:'Not your first fear specifically. The original.', dungeon:'nightmare', isElite:true },
  { id:'void-champion-be',    name:'Void Champion',        icon:'🌑', tier:'Elite — Nightmare', desc:'The void has very high standards. This one met them.', dungeon:'nightmare', isElite:true },
  { id:'one-that-watches',    name:'The One That Watches', icon:'👁️', tier:'Elite — Nightmare', desc:'Has been watching since before you arrived. Will continue after you leave.', dungeon:'nightmare', isElite:true },

  // ── THE HOLLOW ──
  { id:'parlor-guest',       name:'The Parlor Guest',     icon:'🪑', tier:'Hollow 1-3',    desc:'Has been sitting in that chair for a very long time. Will not be asked to leave.', dungeon:'hollow' },
  { id:'hollow-bride', enemyType:'spirit',       name:'Hollow Bride',         icon:'👰', tier:'Hollow 1-3',    desc:'Still in the dress. Still waiting. The groom is somewhere in the house. She is not looking for him.', dungeon:'hollow' },
  { id:'the-portrait',       name:'The Portrait',         icon:'🖼️', tier:'Hollow 1-3',   desc:'It was painted before the house was abandoned. The eyes in the painting were not always looking at you.', dungeon:'hollow' },
  { id:'creaking-step',      name:'Creaking Step',        icon:'🪜', tier:'Hollow 1-3',    desc:'Not a person. Not a creature. A step that has learned to move by itself. It is looking for feet.', dungeon:'hollow' },
  { id:'the-reflection',     name:'The Reflection',       icon:'🪞', tier:'Hollow 1-3',    desc:'It started appearing in mirrors three weeks after the family left. It is still there.', dungeon:'hollow' },
  { id:'the-risen', enemyType:'undead',          name:'The Risen',            icon:'🧟', tier:'Hollow 1-3',    desc:'It was buried in the grounds. Something called it back. It did not come back the same.', dungeon:'hollow' },
  { id:'door-warden',        name:'The Door Warden', icon:'🚪', tier:'Hollow 4-6', desc:'You have been hearing it for three floors. You have finally opened the right door.', dungeon:'hollow' },
  { id:'groundskeeper',      name:'The Groundskeeper',    icon:'⚰️', tier:'Hollow 4-6',   desc:'Kept the grounds in perfect condition for thirty years after everyone left. Has opinions about trespassers.', dungeon:'hollow' },
  { id:'hollow-groom',       name:'Hollow Groom',         icon:'🤵', tier:'Hollow 4-6',   desc:'Found what he was looking for. It was not the bride.', dungeon:'hollow' },
  { id:'the-bell-ringer',    name:'The Bell Ringer',      icon:'🔔', tier:'Hollow 4-6',   desc:'The bell has not stopped ringing since the house was abandoned. Nobody is sure what it is calling.', dungeon:'hollow' },
  { id:'wall-crawler',       name:'The Wall Crawler', icon:'🧱', tier:'Hollow 4-6', desc:'Has been in the walls longer than the house has been standing. Was here first. Is very patient.', dungeon:'hollow' },
  { id:'pale-guest', enemyType:'undead',          name:'The Pale Guest',       icon:'🧛', tier:'Hollow 4-6',    desc:'Has not eaten in a long time. Has been waiting for someone to come through the door.', dungeon:'hollow' },
  { id:'oldest-guest',       name:'The Oldest Guest',     icon:'💀', tier:'Hollow 7-9',   desc:'Was invited to a party in 1887. The party ended. The guest did not.', dungeon:'hollow' },
  { id:'hollow-matron',      name:'The Hollow Matron',    icon:'👵', tier:'Hollow 7-9',   desc:'Ran the house for forty years. Still does. Her definition of the house has expanded considerably.', dungeon:'hollow' },
  { id:'the-caretaker',      name:'The Caretaker',        icon:'🗝️', tier:'Hollow 7-9',  desc:'Has every key. Every room. Every secret. Has been waiting for someone to ask the right question.', dungeon:'hollow' },
  { id:'the-unfinished', enemyType:'spirit',      name:'The Unfinished',       icon:'👻', tier:'Hollow 7-9',    desc:'Did not finish what it started before it died. Is still trying. Your attacks do not always find it.', dungeon:'hollow' },
  { id:'weeping-child',      name:'The Weeping Child',    icon:'😢', tier:'Hollow Special', desc:'Has been crying for a very long time. Can be soothed. Can also be fought. The first option is better for everyone.', dungeon:'hollow' },
  { id:'grieving-one',       name:'The Grieving One',     icon:'😭', tier:'Boss, Hollow Floor 10', desc:'What grief becomes when it has nowhere to go for long enough.', dungeon:'hollow', isBoss:true },
  { id:'house-itself',       name:'The House Itself',     icon:'🏚️', tier:'Boss, Hollow Floor 10', desc:'The house is not a location. It has decided you are staying.', dungeon:'hollow', isBoss:true },
  { id:'last-resident',      name:'The Last Resident',    icon:'🕯️', tier:'Boss, Hollow Floor 10', desc:'Has been alone here for a very long time. Does not want to be alone anymore.', dungeon:'hollow', isBoss:true },
  { id:'uninvited-guest',    name:'The Uninvited Guest',  icon:'🧍', tier:'Hollow 1-3',    desc:'Was not in the room when you entered. Is in the room now. Has always been in the room.', dungeon:'hollow' },
  { id:'the-twin',           name:'The Twin',             icon:'👤', tier:'Hollow 1-3',    desc:'Looks exactly like you. Has your stats. Is not you. Knows it is not you. Does not care.', dungeon:'hollow' },
  { id:'music-box',          name:'The Music Box',        icon:'🎵', tier:'Hollow 4-6',    desc:'Plays a melody. Each note deals damage. You cannot attack while the music plays. You can only wait.', dungeon:'hollow' },
  { id:'easter-bunny-enemy', name:'The Easter Bunny',     icon:'🐰', tier:'Easter Event',   desc:'A large rabbit in a bow tie. Has a basket of eggs. Can be fought, adopted, or released. Appears only during Easter.', dungeon:'crypt' },
  { id:'jack-lantern',       name:'Jack Lantern',          icon:'🎃', tier:'Halloween',      desc:'A pumpkin that learned to walk. It is very proud of this.', dungeon:'nightmare' },
  { id:'the-scarecrow',      name:'The Scarecrow',         icon:'🧟', tier:'Halloween',      desc:'It was put here to scare things away. It is now the thing that needs scaring.', dungeon:'nightmare' },
  { id:'candy-wraith', enemyType:'spirit',       name:'Candy Wraith',          icon:'🍬', tier:'Halloween',      desc:'Something went wrong at the candy factory.', dungeon:'nightmare' },
  { id:'pumpkin-king',       name:'The Pumpkin King',      icon:'👑', tier:'Halloween',      desc:'King of the pumpkins. The pumpkins did not ask for a king.', dungeon:'nightmare' },
  { id:'grave-fog',          name:'Grave Fog',             icon:'🌫️', tier:'Halloween',      desc:'The fog has opinions. This is new.', dungeon:'nightmare' },
  { id:'the-scarecrow',      name:'The Scarecrow',         icon:'🧟', tier:'Halloween',      desc:'It was put here to scare things away.', dungeon:'nightmare' },
  { id:'scream-without-source', name:'Scream Without Source', icon:'😱', tier:'Nightmare',   desc:'You hear it before you see it. Then you realize there is nothing to see.', dungeon:'nightmare' },
  { id:'the-almost',         name:'The Almost',            icon:'👤', tier:'Nightmare',      desc:'It almost looks like something you recognize. Almost.', dungeon:'nightmare' },
  { id:'the-unnamed',        name:'The Unnamed',           icon:'❓', tier:'Nightmare',      desc:'It has no name because naming it would mean acknowledging it exists.', dungeon:'nightmare' },
  { id:'hollow-colossus',    name:'Hollow Colossus',       icon:'🗿', tier:'Nightmare',      desc:'Big. Empty inside. Somehow that makes it worse.', dungeon:'nightmare' },
  { id:'the-unraveling',     name:'The Unraveling',        icon:'🌀', tier:'Nightmare',      desc:'Reality around it is coming undone. So are you.', dungeon:'nightmare' },
  { id:'grief-made-flesh',   name:'Grief Made Flesh',      icon:'💔', tier:'Nightmare',      desc:'Grief is not supposed to have teeth.', dungeon:'nightmare' },
  { id:'void-stalker',       name:'Void Stalker',          icon:'🌑', tier:'Nightmare',      desc:'It follows you between rooms. You cannot see it. You can feel it.', dungeon:'nightmare' },
  { id:'the-damned',         name:'The Damned',            icon:'💀', tier:'Nightmare',      desc:'They know what they did. They remember everything.', dungeon:'nightmare' },
  { id:'void-reaver',        name:'Void Reaver',           icon:'⚫', tier:'Nightmare',      desc:'It eats the parts of you that make you you.', dungeon:'nightmare' },
  { id:'dread-sovereign',    name:'Dread Sovereign',       icon:'👁️', tier:'Nightmare Boss', desc:'It has been waiting for you specifically.', dungeon:'nightmare' },
  { id:'soul-harvester-prime',name:'Soul Harvester Prime', icon:'💀', tier:'Nightmare Boss', desc:'It has collected many souls. It wants yours.', dungeon:'nightmare' },
  { id:'dungeon-itself',     name:'The Dungeon Itself',    icon:'🏰', tier:'Nightmare Boss', desc:'The dungeon is alive. It always was.', dungeon:'nightmare' },
  { id:'nightmare-sovereign',name:'The Nightmare Sovereign',icon:'👑',tier:'Nightmare Boss', desc:'King of everything you fear. Every fear. Not just yours.', dungeon:'nightmare' },
  { id:'void-given-form',    name:'The Void Given Form',   icon:'🌌', tier:'Nightmare Boss', desc:'The void stopped being abstract.', dungeon:'nightmare' },
  { id:'nightmare-colossus', name:'Nightmare Colossus',    icon:'😱', tier:'Nightmare',      desc:'Your nightmare got bigger.', dungeon:'nightmare' },
  { id:'hollow-patriarch',   name:'The Hollow Patriarch',  icon:'🎩', tier:'Hollow Elite',   desc:'Head of the house. The others defer to him.', dungeon:'hollow', isElite:true },
  { id:'seance-master',      name:'The Séance Master',     icon:'🕯️', tier:'Hollow Elite',   desc:'She has been holding the séance for eleven years.', dungeon:'hollow', isElite:true },
  { id:'hollow-architect',   name:'The Hollow Architect',  icon:'🏚️', tier:'Hollow Elite',   desc:'He designed the house. He never left.', dungeon:'hollow', isElite:true },
  { id:'lost-villager',      name:'Lost Villager',          icon:'🧑', tier:'Forest 1-3',     desc:'They went to explore the forest. They did not come back. This is what came back instead.', dungeon:'whisper' },
  { id:'thornvine-crawler',  name:'Thornvine Crawler',      icon:'🌿', tier:'Forest 1-3',     desc:'The vines in this forest move. You noticed too late.', dungeon:'whisper' },
  { id:'moss-specter',       name:'Moss Specter',           icon:'🌫️', tier:'Forest 1-3',     desc:'Old moss given hunger. It has been here since before the witch.', dungeon:'whisper' },
  { id:'cursed-villager',    name:'Cursed Villager',        icon:'😱', tier:'Forest 1-3',     desc:'They knew what the forest was. They went anyway. Now you know why that was a mistake.', dungeon:'whisper' },
  { id:'forest-wraith', enemyType:'spirit',      name:'Forest Wraith',          icon:'👻', tier:'Forest 1-3',     desc:'Every forest has ghosts. This one has more than most.', dungeon:'whisper' },
  { id:'rotting-wanderer',   name:'Rotting Wanderer',       icon:'🧟', tier:'Forest 4-6',     desc:'They wandered in looking for the way out. They are still looking.', dungeon:'whisper' },
  { id:'the-hollow-oak',     name:'The Hollow Oak',         icon:'🌳', tier:'Forest 4-6',     desc:'The oldest tree in the forest. It remembers the witch. It approved of her work.', dungeon:'whisper' },
  { id:'witchs-familiar',    name:"Witch's Familiar",       icon:'🐈‍⬛', tier:'Forest 4-6',     desc:"Seraphine's cat survived her death. It did not survive the forest.", dungeon:'whisper' },
  { id:'corrupted-knight',   name:'Corrupted Knight',       icon:'⚔️', tier:'Forest 4-6',     desc:'He came to slay the witch. The forest made a different use of him.', dungeon:'whisper', isCorrupted:true },
  { id:'the-weeping-bark',   name:'The Weeping Bark',       icon:'🪵', tier:'Forest 4-6',     desc:'The trees here cry. No one knows why. You will find out.', dungeon:'whisper' },
  { id:'corrupted-hollow-bride', name:'Corrupted Hollow Bride', icon:'👰', tier:'Forest 4-6', desc:'The corruption found her in the Hollow. It followed her here.', dungeon:'whisper', isCorrupted:true },
  { id:'corrupted-death-knight', name:'Corrupted Death Knight', icon:'💀', tier:'Forest 4-6', desc:'The corruption made something terrible into something worse.', dungeon:'whisper', isCorrupted:true },
  { id:'the-root-horror',    name:'The Root Horror',        icon:'🌱', tier:'Forest 7-9',     desc:'Deep roots. Old hunger. The forest grew this specifically for you.', dungeon:'whisper' },
  { id:'corrupted-archivist',name:'Corrupted Archivist',    icon:'📚', tier:'Forest 7-9',     desc:'The Archives sent someone to study the forest. The forest studied them back.', dungeon:'whisper', isCorrupted:true },
  { id:'the-witchs-echo',    name:"The Witch's Echo",       icon:'🔮', tier:'Forest 7-9',     desc:"Seraphine's voice lingers in the trees. It learned to bite.", dungeon:'whisper' },
  { id:'corrupted-bone-colossus', name:'Corrupted Bone Colossus', icon:'🗿', tier:'Forest 7-9', desc:'The corruption needed something large.', dungeon:'whisper', isCorrupted:true },
  { id:'forest-sovereign',   name:'Forest Sovereign',       icon:'🌲', tier:'Forest 7-9',     desc:'The oldest thing in the forest. It was here before the village. It will be here after you.', dungeon:'whisper' },
  { id:'seraphine',          name:'Seraphine the Undying',  icon:'🧙', tier:'Forest Boss',    desc:'She died three years ago. The forest refused to let her leave. She has had three years to get angry.', dungeon:'whisper' },
  { id:'the-corrupter',      name:'The Corrupter',          icon:'🌑', tier:'Forest Boss',    desc:'The witch thought she summoned this. She did not. It was already in the forest. It has been waiting much longer than three years.', dungeon:'whisper' },
  { id:'the-thornlord',      name:'The Thornlord',          icon:'🌵', tier:'Forest Elite',   desc:'King of the thorns. The thorns answer to it. So does everything else.', dungeon:'whisper', isElite:true },
  { id:'seraphines-shade', enemyType:'spirit',   name:"Seraphine's Shade",      icon:'🔮', tier:'Forest Elite',   desc:"The witch's shadow learned to exist independently. It prefers it this way.", dungeon:'whisper', isElite:true },
  { id:'the-shade-elite', enemyType:'spirit', name:'The Shade', icon:'🌑', tier:'Rare — All Dungeons',
    desc:'289 HP. A darkness that exists in every dungeon but answers to nothing. Drains life. In Insane Mode it drains your sanity. In the Whispering Forest it spreads corruption. Sometimes strikes three times in one turn.', dungeon:'nightmare' },
  { id:'corrupted-champion', name:'The Corrupted Champion', icon:'⚫', tier:'Forest Elite',   desc:'The most corrupted thing in the forest that can still fight. It barely counts as a person anymore.', dungeon:'whisper', isElite:true },
  { id:'the-chimera',        name:'The Chimera',            icon:'🐉', tier:'Special — Any Dungeon', desc:'Lion head. Goat body. Serpent tail. Each part fights independently. Destroy all three to win.', dungeon:'nightmare' },
  { id:'corrupted-chimera',  name:'The Corrupted Chimera',  icon:'🌑', tier:'Forest Floor 9',  desc:'The forest made its own Chimera. Three parts, each wrong in a different way. Only appears on floor 9 of the Whispering Forest.', dungeon:'whisper' },
  { id:'drowned-chancellor', name:'Drowned Chancellor',    icon:'📜', tier:'Sunken Boss',    desc:'He ran the Archives. He still does, technically.', dungeon:'sunken' },
  { id:'soul-harvester-prime',name:'Soul Harvester Prime', icon:'💀', tier:'Nightmare Boss', desc:'It has collected many souls.', dungeon:'nightmare' },
  { id:'medusa',             name:'Medusa',               icon:'🐍', tier:'Hollow Special — Rare', dungeon:'hollow', desc:'A rare figure in the Hollow. Her eyes hold a terrible power. She was not always this way.' },
  { id:'lord-phorcys',       name:'Lord Phorcys',         icon:'👴', tier:'Hollow Special — Rare', dungeon:'hollow', desc:'Her father. Has been searching the Hollow for years. Broken by grief. Do not mistake grief for weakness.' },
  { id:'weeping-mother',     name:'The Weeping Mother',   icon:'👩', tier:'Hollow Special', desc:'She is looking for her child. If you found the child, you can end this without a fight. If you did not, you have two options. One of them is worse than the other.', dungeon:'hollow' },
  // ── THE SPIRE ──
  { id:'spire-rat',          name:'Spire Rat',            icon:'🐀', tier:'The Spire — Floors 1-50',    dungeon:'spire', desc:'Something about the Spire made them larger. Faster. The ones at the bottom are almost normal. By floor thirty they are neither.' },
  { id:'echo-crawler',       name:'Echo Crawler',         icon:'🔊', tier:'The Spire — Floors 1-50',    dungeon:'spire', desc:'It calls out into the dark. The dark calls back. If you let it scream long enough, you will not be fighting one thing anymore.' },
  { id:'spire-ember',        name:'Spire Ember',           icon:'🔥', tier:'The Spire — Floors 1-50',    dungeon:'spire', desc:'A fragment of flame that found its way up from below. It burns on contact and does not stop.' },
  { id:'cracked-husk',       name:'Cracked Husk',          icon:'💀', tier:'The Spire — Floors 1-50',    dungeon:'spire', desc:'Something used to live inside it. Nothing does now. It fights anyway.' },
  { id:'spire-wisp',         name:'Spire Wisp',            icon:'🔵', tier:'The Spire — Floors 1-50',    dungeon:'spire', desc:'Harmless alone. The Spire is never alone.' },
  { id:'mirror-stalker',     name:'Mirror Stalker',        icon:'🪞', tier:'The Spire — Floors 51-200',  dungeon:'spire', desc:'Every wound you give it comes back to you, smaller but certain. Hit it hard and fast or pay every time.' },
  { id:'spire-soul-eater',   name:'Spire Soul Eater',      icon:'😈', tier:'The Spire — Floors 51-200',  dungeon:'spire', desc:'The higher it climbs, the hungrier it gets. It heals on every strike.' },
  { id:'spire-phantom',      name:'Spire Phantom',         icon:'🌫️', tier:'The Spire — Floors 51-200',  dungeon:'spire', desc:'Phases in and out. One in four attacks simply passes through it.' },
  { id:'tower-stalker',      name:'Tower Stalker',         icon:'👁️', tier:'The Spire — Floors 51-200',  dungeon:'spire', desc:'It does not rush. Every turn it waits is a turn it gets stronger.' },
  { id:'spire-drainer',      name:'Spire Drainer',         icon:'⬛', tier:'The Spire — Floors 51-200',  dungeon:'spire', desc:'Does not want your blood. Wants the energy behind your eyes.' },
  { id:'spire-champion',     name:'Spire Champion',        icon:'⚔️', tier:'The Spire — Floors 201-500', dungeon:'spire', desc:'Strikes twice. Every turn. It has been doing this since floor twelve.' },
  { id:'the-ascending',      name:'The Ascending',         icon:'🧗', tier:'The Spire — Floors 201-500', dungeon:'spire', desc:'The first hit does nothing. It has learned to absorb the opening blow.' },
  { id:'spire-brute',        name:'Spire Brute',           icon:'👹', tier:'The Spire — Floors 201-500', dungeon:'spire', desc:'Devastating. Slow. It attacks every other turn. The one it lands is worth two of yours.' },
  { id:'fracture-shade',     name:'Fracture Shade',        icon:'🌑', tier:'The Spire — Floors 201-500', dungeon:'spire', desc:'Cut it in half and you have two problems. Neither is smaller than the original.' },
  { id:'the-beckoner',       name:'The Beckoner',         icon:'🫴', tier:'Forest 2-4',                 dungeon:'whisper', desc:'It reaches out. Not to attack. To invite. Three turns of patience and something worse accepts the invitation.' },
  { id:'void-caller',        name:'Void Caller',          icon:'📯', tier:'Infernal — Tier 1',          dungeon:'infernal', desc:'It does not fight you directly. It announces you. Something in the dark hears the announcement and begins moving.' },
  { id:'crumbling-golem',    name:'Crumbling Golem',      icon:'🪨', tier:'The Spire — Floors 1-50',    dungeon:'spire', desc:'Ancient guardians left to patrol the lower floors. They have been patrolling for so long that they have forgotten what they are guarding.' },
  { id:'hollow-shade-spire', enemyType:'spirit', name:'Hollow Shade',         icon:'👤', tier:'The Spire — Floors 1-50',    dungeon:'spire', desc:'Shades follow those who climb the Spire. They are not chasing you. They are waiting for you to stop.' },
  { id:'stone-sentinel',     name:'Stone Sentinel',       icon:'🗿', tier:'The Spire — Floors 51-200',   dungeon:'spire', desc:'The Spire built these. Not in any way that can be explained. One day they were not here. Then they were.' },
  { id:'ash-wraith', enemyType:'spirit',         name:'Ash Wraith',           icon:'💨', tier:'The Spire — Floors 51-200',   dungeon:'spire', desc:'The remains of climbers who burned out before reaching the top. They drift upward still, out of habit.' },
  { id:'spire-knight',       name:'Spire Knight',         icon:'⚔️', tier:'The Spire — Floors 51-200',   dungeon:'spire', desc:'They were sent to clear the Spire decades ago. They never came back. They are still clearing it.' },
  { id:'crimson-warden',     name:'Crimson Warden',       icon:'🔴', tier:'The Spire — Floors 201-500',  dungeon:'spire', desc:'Their armor is not red. It started a different color. They have been in the Spire a very long time.' },
  { id:'time-phantom',       name:'Time Phantom',         icon:'⏳', tier:'The Spire — Floors 201-500',  dungeon:'spire', desc:'A fragment of time that got stuck. It replays the same moment of violence endlessly. You are now part of that moment.' },
  { id:'rift-stalker',       name:'Rift Stalker',         icon:'🌀', tier:'The Spire — Floors 201-500',  dungeon:'spire', desc:'It comes from the gaps between floors. The Spire has many gaps. It has many of these.' },
  { id:'eternal-husk',       name:'Eternal Husk',         icon:'💀', tier:'The Spire — Floors 501-1000', dungeon:'spire', desc:'What the Spire leaves behind when it finishes with something. The soul is gone. The hunger is not.' },
  { id:'voidborn-spire',     name:'Voidborn',             icon:'🌌', tier:'The Spire — Floors 501-1000', dungeon:'spire', desc:'Born in the nothing between the high floors. It does not understand what you are. This makes it more dangerous, not less.' },
  { id:'time-devourer',      name:'Time Devourer',        icon:'⌛', tier:'The Spire — Floors 1001+',    dungeon:'spire', desc:'Near the top, time moves differently. These feed on the difference. They are very well fed.' },
  { id:'the-forgotten',      name:'The Forgotten',        icon:'🫥', tier:'The Spire — Floors 1001+',    dungeon:'spire', desc:'No one remembers sending them up. They do not remember being sent. They remember nothing except the climbing.' },
  { id:'gate-warden',        name:'The Gate Warden',      icon:'🚪', tier:'The Spire — Boss, Floor 10',  dungeon:'spire', isBoss:true, desc:'The first door will not open itself. It never has.' },
  { id:'iron-sovereign',     name:'The Iron Sovereign',   icon:'👑', tier:'The Spire — Boss, Floor 100', dungeon:'spire', isBoss:true, desc:'A king of stone and silence. It ruled the middle floors before the Spire existed. It rules them still.' },
  { id:'void-throne',        name:'The Void Throne',      icon:'🌑', tier:'The Spire — Boss, Floor 500', dungeon:'spire', isBoss:true, desc:'Something sits on it. You cannot quite see what. You will see it clearly when it stands up.' },
  { id:'the-time-eater',     name:'The Time Eater',       icon:'⏳', tier:'The Spire — Boss, Floor 1800',dungeon:'spire', isBoss:true, desc:'It has been at the top since before the Spire existed. It did not build the Spire. It did not need to. The Spire grew around it the way bone grows around a wound.' },
  // ── THE INFERNAL ──
  { id:'infernal-void-shadow',   name:'Void Shadow',          icon:'👤', tier:'Infernal — Tier 1', dungeon:'infernal', desc:'A formless shape that drains courage. It does not need your blood. It needs the part of you that keeps fighting.' },
  { id:'infernal-void-wisp', enemyType:'spirit',     name:'Void Wisp',            icon:'🔵', tier:'Infernal — Tier 1', dungeon:'infernal', desc:'Tiny. Harmless alone. It is never alone. Kill it with heavy force and more come. It knows this. It counts on it.' },
  { id:'infernal-ember',         name:'Infernal Ember',       icon:'🔥', tier:'Infernal — Tier 1', dungeon:'infernal', desc:'Leaves burning wounds that linger long after the fight ends. The burning is not fire. Fire is warm. This is not.' },
  { id:'infernal-shadow-creep',  name:'Shadow Creep',         icon:'🌑', tier:'Infernal — Tier 1', dungeon:'infernal', desc:'Phases in and out of reality every few seconds. Every third strike passes through it completely. It learned this by accident.' },
  { id:'infernal-void-husk',     name:'Void Husk',            icon:'💀', tier:'Infernal — Tier 1', dungeon:'infernal', desc:'An empty shell of something that was once alive. High endurance. Low aggression. It has been waiting a very long time. It is patient.' },
  { id:'infernal-dark-tendril',  name:'Dark Tendril',         icon:'🪱', tier:'Infernal — Tier 1', dungeon:'infernal', desc:'Wraps around your striking arm and weakens your attacks. It does not need to kill you. It just needs you to be weaker when the others arrive.' },
  { id:'infernal-void-wraith', enemyType:'spirit',   name:'Void Wraith',          icon:'👻', tier:'Infernal — Tier 2', dungeon:'infernal', desc:'Screams that only you can hear. The scream is not a weapon. The scream is a signal. It is calling the others.' },
  { id:'infernal-void-stalker',  name:'Void Stalker',         icon:'👁️', tier:'Infernal — Tier 2', dungeon:'infernal', desc:'Gets stronger every turn it remains alive. It knows this. It fights defensively at first. It is waiting to become something you cannot kill.' },
  { id:'infernal-brute',         name:'Infernal Brute',       icon:'👹', tier:'Infernal — Tier 2', dungeon:'infernal', desc:'Devastating power. Attacks every other turn only. The turn it does not attack, it is deciding exactly how to end you.' },
  { id:'infernal-hollow-one',    name:'The Hollow One',       icon:'⬛', tier:'Infernal — Tier 2', dungeon:'infernal', desc:'Feeds on spirit energy. Does not care about your blood. Does not care about your HP. Drains your SP until you have nothing left to give.' },
  { id:'infernal-soul-eater',    name:'Soul Eater',           icon:'😈', tier:'Infernal — Tier 2', dungeon:'infernal', desc:'Heals itself with every strike against you. The longer the fight goes, the stronger it gets. End it quickly or do not end it at all.' },
  { id:'infernal-void-phantom',  name:'Void Phantom',         icon:'🌫️', tier:'Infernal — Tier 2', dungeon:'infernal', desc:'Thirty percent chance to phase through any attack. It does not choose when this happens. The void chooses for it. The void is generous.' },
  { id:'infernal-dark-priest',   name:'Dark Priest',          icon:'🧙', tier:'Infernal — Tier 2', dungeon:'infernal', desc:'Empowers itself before striking. Kill it on the first turn or face something considerably worse than what arrived.' },
  { id:'infernal-void-sentinel', name:'Void Sentinel',        icon:'🗿', tier:'Infernal — Tier 3', dungeon:'infernal', desc:'The first blow glances off. Always. It has been hit before. It has learned from being hit. Your first strike teaches it nothing.' },
  { id:'infernal-champion',      name:'Infernal Champion',    icon:'⚔️', tier:'Infernal — Tier 3', dungeon:'infernal', desc:'Strikes twice per turn. Has always struck twice per turn. Has never once considered striking only once.' },
  { id:'infernal-nameless',      name:'The Nameless',         icon:'❓', tier:'Infernal — Tier 3', dungeon:'infernal', desc:'No name. No origin. No record of its existence anywhere in any dungeon documentation. Even the DDDI has no file on this one.' },
  { id:'infernal-reaper-spawn',  name:'Void Reaper Spawn',    icon:'💀', tier:'Infernal — Tier 3', dungeon:'infernal', desc:'A fragment of the true Void Reaper. Broken off. Independent. Still terrifying. It carries a memory of what it used to be part of.' },
  { id:'infernal-shadow-architect',name:'Shadow Architect',   icon:'🏗️', tier:'Infernal — Tier 3', dungeon:'infernal', desc:'Splits into two at half HP. Both copies fight on with equal aggression. It did not plan this. It is simply what happens when you cut the void in half.' },
  { id:'infernal-void-king',     name:'The Void King',        icon:'👑', tier:'Infernal — Elite',  dungeon:'infernal', isElite:true, desc:'A king of nothing. Ruler of the dark between stars. Has been king longer than any dungeon has existed. Will be king long after.' },
  { id:'infernal-overlord',      name:'Infernal Overlord',    icon:'🔱', tier:'Infernal — Elite',  dungeon:'infernal', isElite:true, desc:'Ancient. Patient. Inevitable. It has defeated everyone who has ever faced it. You are aware you are the next in a long line.' },
  { id:'infernal-hard-void',     name:'The Hard Void',        icon:'🌑', tier:'Infernal — Boss',   dungeon:'infernal', isBoss:true, desc:'It is not an enemy. It is what remains when everything else is gone. Three phases. The third phase drains you. Find the weakness or fall.' },
  { id:'infernal-architect-boss',name:'The Infernal Architect',icon:'🔱',tier:'Infernal — Boss',   dungeon:'infernal', isBoss:true, desc:'The dungeon IS the Architect. You have been inside it the whole time. It built this place specifically for you. It has been waiting.' },
  { id:'infernal-void-sovereign',name:'The Void Sovereign',   icon:'👑', tier:'Infernal — Boss',   dungeon:'infernal', isBoss:true, desc:'It ruled the dark long before the first dungeon was built. It remembers you from a previous life. You do not remember it. That is the difference between you.' },
  { id:'mirror-shade', enemyType:'spirit',     name:'Mirror Shade',     icon:'🪞', tier:'Special — Any Dungeon', dungeon:'special', desc:'Reflects your own attack stat back at you. The stronger you are the harder it hits.' },
  { id:'debt-collector',   name:'Debt Collector',   icon:'💀', tier:'Special — Any Dungeon', dungeon:'special', desc:'Steals 15 gold per turn. If it survives 5 turns you lose all your gold. Kill it fast.' },
  { id:'hollow-preacher',  name:'Hollow Preacher',  icon:'📿', tier:'Special — Any Dungeon', dungeon:'special', desc:'Heals all allies in ambushes by 10 HP each turn. Always the first target.' },
  { id:'void-anchor',      name:'Void Anchor',      icon:'⚓', tier:'Special — Any Dungeon', dungeon:'special', desc:'Prevents fleeing. You cannot escape this fight. There is no retreat.' },
  { id:'the-lurker',       name:'The Lurker',       icon:'👁️', tier:'Special — Any Dungeon', dungeon:'special', desc:'Hides until you attack — immune to the first hit. Then reveals its true form and doubles its counter-attack.' },
  { id:'void-wandering-warrior',name:'Wandering Warrior',icon:'⚔️',tier:'Void Mode — Wave 1',dungeon:'special',desc:'Overconfident. Undertrained. Still dangerous. The first hero to face you in Void Mode.' },
  { id:'void-holy-paladin',     name:'Holy Paladin',    icon:'🛡️',tier:'Void Mode — Wave 2',dungeon:'special',desc:'Carries a shield of faith. Heals every 3 turns. Has never lost a fight before this one.' },
  { id:'void-shadow-archer',    name:'Shadow Archer',   icon:'🏹',tier:'Void Mode — Wave 2',dungeon:'special',desc:'Fires from a distance. Precise. Deadly. Does not miss.' },
  { id:'void-iron-warrior',     name:'Iron Warrior',    icon:'⚔️',tier:'Void Mode — Wave 3',dungeon:'special',desc:'Veteran fighter. Enrages below 50% HP. Has survived worse. Almost.' },
  { id:'void-battle-mage',      name:'Battle Mage',     icon:'🔮',tier:'Void Mode — Wave 3',dungeon:'special',desc:'Channels ancient fire. Burns bright. Magical damage.' },
  { id:'void-war-scout',        name:'War Scout',       icon:'🗡️',tier:'Void Mode — Wave 3',dungeon:'special',desc:'Fast. Crits before you can react.' },
  { id:'void-elite-crusader',   name:'Elite Crusader',  icon:'✨',tier:'Void Mode — Wave 4',dungeon:'special',isElite:true,desc:'The chosen of a forgotten god. Enrages at 50% HP.' },
  { id:'void-war-cleric',       name:'War Cleric',      icon:'⛪',tier:'Void Mode — Wave 4',dungeon:'special',desc:'Heals allies every 2 turns. Priority target.' },
  { id:'void-rogue-assassin',   name:'Rogue Assassin',  icon:'🗡️',tier:'Void Mode — Wave 4',dungeon:'special',desc:'Critical hits for massive damage. Kill first.' },
  { id:'void-last-hero',        name:'The Last Hero',   icon:'👑',tier:'Void Mode — Wave 5',dungeon:'special',isBoss:true,desc:'350 HP. Heals every 4 turns. They said one would come who could end the Void. This is that one. Probably.' },
  { id:'void-ancient-paladin',  name:'Ancient Paladin', icon:'🌟',tier:'Void Mode — Wave 5',dungeon:'special',isElite:true,desc:'Has fought darkness for forty years. Today is different.' },
  { id:'void-void-hunter',      name:'Void Hunter',     icon:'🎯',tier:'Void Mode — Wave 5',dungeon:'special',isElite:true,desc:'Trained specifically to kill entities like you.' },
  { id:'void-lorekeeper-mage',  name:'Lorekeeper Mage', icon:'📚',tier:'Void Mode — Wave 5',dungeon:'special',isElite:true,desc:'Knows your weaknesses. Exploits them.' },
  { id:'seasonal-krampus',      name:'Krampus',         icon:'🎄',tier:'Christmas Event',   dungeon:'special',desc:'Appears in December. He is not happy. He has never been happy.' },
  { id:'seasonal-krampus-imp',  name:'Krampus Imp',     icon:'😈',tier:'Christmas Event',   dungeon:'special',desc:'Krampus brought helpers. The helpers are worse than Krampus.' },
  { id:'seasonal-dark-reindeer',name:'The Dark Reindeer',icon:'🦌',tier:'Christmas Event',  dungeon:'special',desc:'Krampus brought a reindeer. The reindeer has been through some things.' },
  { id:'seasonal-snowman',      name:'The Snowman',     icon:'⛄',tier:'Christmas Event',   dungeon:'special',desc:'Built by someone who did not check whether it was safe to build snowmen in a dungeon.' },
  { id:'seasonal-jack-lantern', name:'Jack Lantern',    icon:'🎃',tier:'Halloween Event',   dungeon:'special',desc:'A pumpkin with a face. The face is angry. The pumpkin has no reason to be this angry.' },
  { id:'seasonal-pumpkin-king', name:'The Pumpkin King',icon:'👑',tier:'Halloween Event',   dungeon:'special',isBoss:true,desc:'Rules over all jack lanterns. Takes this responsibility extremely seriously.' },
  { id:'seasonal-candy-wraith', enemyType:'spirit', name:'Candy Wraith',    icon:'🍬',tier:'Halloween Event',   dungeon:'special',desc:'Made of something sweet and something wrong.' },
  { id:'seasonal-cursed-pumpkin',name:'Cursed Pumpkin', icon:'🎃',tier:'Halloween Event',   dungeon:'special',desc:'Whatever was in this pumpkin is now out of the pumpkin and very upset about it.' },
  { id:'seasonal-ghost-halloween',name:'Ghost of Halloween',icon:'👻',tier:'Halloween Event',dungeon:'special',desc:'Does not know the event is only supposed to last a month.' },
  // Abyssal Deep enemies
  { id:'tide-wraith', enemyType:'spirit',        name:'Tide Wraith',        icon:'🌊', tier:'Abyssal — Tier 1', dungeon:'abyssal', desc:'Phases through your defense when you defend. It learned long ago that armor means nothing at this depth.' },
  { id:'drowned-sailor',     name:'Drowned Sailor',     icon:'⚓', tier:'Abyssal — Tier 1', dungeon:'abyssal', desc:'A mariner who refused to surface. Every 3 turns it screams — a sound that seals your abilities in your throat.' },
  { id:'ink-fiend',          name:'Ink Fiend',           icon:'🐙', tier:'Abyssal — Tier 1', dungeon:'abyssal', desc:'Sprays black ink when threatened. You cannot see what you cannot hit.' },
  { id:'sea-slug',           name:'Sea Slug',            icon:'🐌', tier:'Abyssal — Tier 1', dungeon:'abyssal', desc:'Slow but relentless. Its slime carries a venom that works long after the fight ends.' },
  { id:'shore-rat',          name:'Shore Rat',           icon:'🐀', tier:'Abyssal — Tier 1', dungeon:'abyssal', desc:'These rats followed ships down. They adapted. They attack in bursts of two strikes.' },
  { id:'pale-drifter',       name:'Pale Drifter',        icon:'👻', tier:'Abyssal — Tier 1', dungeon:'abyssal', desc:'A ghost of someone who drowned. It does not want to fight. It wants company. That is almost worse.' },
  { id:'deep-stalker',       name:'Deep Stalker',        icon:'🦈', tier:'Abyssal — Tier 2', dungeon:'abyssal', desc:'Spends the first turn studying you. The second turn it uses everything it learned.' },
  { id:'coral-horror',       name:'Coral Horror',        icon:'🪸', tier:'Abyssal — Tier 2', dungeon:'abyssal', desc:'Half creature, half reef. Its calcified shell absorbs 20% of physical damage. Magic hurts it more.' },
  { id:'pressure-beast',     name:'Pressure Beast',      icon:'💀', tier:'Abyssal — Tier 2', dungeon:'abyssal', desc:'Grows stronger every turn it survives. Kill it fast or it will become something you cannot kill.' },
  { id:'kelp-strangler',     name:'Kelp Strangler',      icon:'🌿', tier:'Abyssal — Tier 2', dungeon:'abyssal', desc:'Wraps living kelp around your limbs. The longer the fight, the slower you get.' },
  { id:'abyssal-eel', enemyType:'beast',        name:'Abyssal Eel',         icon:'⚡', tier:'Abyssal — Tier 2', dungeon:'abyssal', desc:'Generates a bio-electric field on strike. Reduces your attack for 2 turns each time it connects.' },
  { id:'brine-golem',        name:'Brine Golem',         icon:'🧂', tier:'Abyssal — Tier 2', dungeon:'abyssal', desc:'Constructed from salt deposits and ocean pressure over centuries. Slow. Indestructible by anything less than focused force.' },
  { id:'abyssal-eye',        name:'Abyssal Eye',         icon:'👁️', tier:'Abyssal — Tier 3', dungeon:'abyssal', desc:'Does not attack your body. Attacks your mind. Drains SP every turn until you have nothing left.' },
  { id:'siren',              name:'Siren',               icon:'🧜', tier:'Abyssal — Tier 3', dungeon:'abyssal', desc:'Its voice turns your own strength against you. 30% chance your attack lands on yourself instead.' },
  { id:'void-angler',        name:'Void Angler',         icon:'🎣', tier:'Abyssal — Tier 3', dungeon:'abyssal', desc:'Uses bioluminescent lures to draw you in close. The first strike always connects for maximum damage.' },
  { id:'titan-crab',         name:'Titan Crab',          icon:'🦀', tier:'Abyssal — Tier 3', dungeon:'abyssal', desc:'Shell-armored for the first 3 turns. It absorbs 30% of your damage while its defenses hold. Patience is required.' },
  { id:'drowned-king',       name:'The Drowned King',    icon:'👑', tier:'Abyssal — Elite',  dungeon:'abyssal', isElite:true, desc:'Undead royalty. It has died before. It will die again. Then it will stand back up at 1 HP, furious, and remember why it never stays dead.' },
  { id:'abyssal-sentinel',   name:'Abyssal Sentinel',    icon:'🔱', tier:'Abyssal — Elite',  dungeon:'abyssal', isElite:true, desc:'Immune to debuffs, immune to stuns. It has felt every trick used against it for centuries. Nothing surprises it anymore.' },
  { id:'pale-leviathan',     name:'The Pale Leviathan',  icon:'🤍', tier:'Abyssal — Elite',  dungeon:'abyssal', isElite:true, desc:'A juvenile of its species. Still larger than anything you have faced. Calls for reinforcements every 3 turns.' },
  { id:'leviathan-be',       name:'The Leviathan',       icon:'🐉', tier:'Abyssal — Boss',   dungeon:'abyssal', isBoss:true, desc:'The apex of the ocean. Three phases — Surfacing, Rage, and the Deep Pull. In phase 3 every turn it survives it hits harder. You do not have long.' },
  { id:'ancient-tide-be',    name:'The Ancient Tide',    icon:'🌊', tier:'Abyssal — Boss',   dungeon:'abyssal', isBoss:true, desc:'Not a creature but a force. The tide itself, given ancient malice and a desire for your defeat.' },
  { id:'drowned-god-be',     name:'The Drowned God',     icon:'🌑', tier:'Abyssal — Boss',   dungeon:'abyssal', isBoss:true, desc:'It has been at the bottom of the ocean since before the ocean had a name. It opened its eyes when you entered. It has not blinked since.' },
  { id:'the-witness-be',     name:'The Witness',         icon:'🦈', tier:'Abyssal — Special', dungeon:'abyssal', desc:'It has been watching you since you entered. Every room. Every fight. Every choice. It was never your enemy. It was waiting to see if you were worth following.' },
  { id:'time-descender-be',     name:'The Time Descender',icon:'⏳',tier:'Special — Floors 6+',dungeon:'special',desc:'15% chance on floor 6+. Two phases. Phase 2 locks all buttons and hits every 5 seconds. Drops Chrono Armor on first kill.' },
  { id:'time-the-clock-be',     name:'The Clock',       icon:'🕰️',tier:'Special — Phase 2', dungeon:'special',desc:'Phase 2 of the Time Descender. Your actions are locked. It strikes for 18-28 damage every 5 seconds. One window to counter per cycle.' },
  { id:'dddi-grand-overseer',   name:'DDDI Grand Overseer',icon:'🏛️',tier:'Secret Boss',   dungeon:'special',isBoss:true,desc:'2% chance on floor 10 of any dungeon. 280 HP. Three phases. A 47-page compliance document is involved. It has a gavel the size of a door.' },
  // ── THE MINE ──
  { id:'mine-cave-rat',     name:'Cave Rat',      icon:'🐀', tier:'The Mine — Depth 1-2', dungeon:'mine', desc:'The mine rats are blind. They have been blind for generations. They navigate by vibration — the scrape of a pickaxe, the shift of a boot on loose stone. They find you before you find them.' },
  { id:'mine-rock-beetle',  name:'Rock Beetle',   icon:'🪲', tier:'The Mine — Depth 1-2', dungeon:'mine', desc:'Their shells are harder than iron ore. Miners used to collect them as curiosities. Then the mines went deep enough to find the big ones.' },
  { id:'mine-bat',          name:'Mine Bat',      icon:'🦇', tier:'The Mine — Depth 1-3', dungeon:'mine', desc:'They nest in the deepest shafts and come out only to hunt. The miners who disappeared in the lower tunnels — the bats know what happened to them.' },
  { id:'mine-cave-troll',   name:'Cave Troll',    icon:'👹', tier:'The Mine — Depth 2-4', dungeon:'mine', desc:'Something the old miners woke up. They built walls to keep it contained. The walls are gone now. The troll remembers being walled in and has opinions about it.' },
  { id:'mine-stone-golem',  name:'Stone Golem',   icon:'🗿', tier:'The Mine — Depth 3-5', dungeon:'mine', desc:'Not built. Grown. The mine is old enough that the magic in the ore has condensed into consciousness. It does not understand why you are here. It only knows you should not be.' },
  { id:'mine-wraith',       name:'Mine Wraith',   icon:'👻', tier:'The Mine — Depth 3-5', dungeon:'mine', desc:'The ghost of a miner who went too deep and did not come back up. It wanders the lower tunnels carrying a pickaxe it no longer needs, looking for a way out it can never find.' },
  { id:'mine-deep-crawler', name:'Deep Crawler',  icon:'🕷️', tier:'The Mine — Depth 5+',  dungeon:'mine', desc:'No one knows what it ate to grow that large. The webs in the deepest shafts are thick as rope. Whatever they caught down there fed something for a very long time.' },
  { id:'mine-ore-demon',    name:'Ore Demon',     icon:'😈', tier:'The Mine — Depth 5+',  dungeon:'mine', desc:'Summoned by the miners who found the wrong vein. They thought they had found a spirit of wealth. They were not entirely wrong about that.' },
  { id:'mine-boss',         name:'Mine Boss',     icon:'💀', tier:'The Mine — Depth 5+ Boss', dungeon:'mine', isBoss:true, desc:'Whatever was at the very bottom of this mine before the miners arrived. They sealed it away and never spoke of what they found. The seal has been broken for some time now.' },
  { id:'mine-dust-shade',   name:'Dust Shade',    icon:'🌫️', tier:'The Mine — Depth 1-3', dungeon:'mine', desc:'Made of coal dust and old air. The mines have been breathing for centuries. Eventually the breath started breathing back.' },
  { id:'mine-tunnel-snake', name:'Tunnel Snake',  icon:'🐍', tier:'The Mine — Depth 1-3', dungeon:'mine', desc:'Long enough to fill a shaft. Old enough to remember when the mine was a mountain. Hungry in the way that only very patient things can be hungry.' },
  { id:'mine-iron-sprite',  name:'Iron Sprite',   icon:'✨', tier:'The Mine — Depth 2-4', dungeon:'mine', desc:'A spirit of raw ore. Miners used to leave offerings for them. The offerings stopped. The sprites noticed.' },
  { id:'mine-collapsed',    name:'The Collapsed', icon:'🪨', tier:'The Mine — Depth 2-4', dungeon:'mine', desc:'A miner who was buried in a cave-in and kept going anyway. Technically still on shift. Technically.' },
  { id:'mine-vein-horror',  name:'Vein Horror',   icon:'🩸', tier:'The Mine — Depth 4-6', dungeon:'mine', desc:'It lives in the ore veins like blood in a body. When you mine, you cut. When you cut, it bleeds. When it bleeds, it wakes up.' },
  { id:'mine-diamond-golem',name:'Diamond Golem', icon:'💎', tier:'The Mine — Depth 5+',  dungeon:'mine', desc:'Formed from the rarest deposits at the deepest levels. Every facet reflects something. None of the reflections are you.' },
  { id:'mine-shaft-lurker', name:'Shaft Lurker',  icon:'🌑', tier:'The Mine — Depth 4-6', dungeon:'mine', desc:'Lives in the vertical shafts between levels. Waits for something to fall. Has never had to wait long.' },
  { id:'mine-pickaxe-ghost',name:'Pickaxe Ghost', icon:'⛏️', tier:'The Mine — Depth 2-4', dungeon:'mine', desc:'The ghost of a miner who loved their job too much to leave it. Still working. The sound of their pickaxe echoes through levels they no longer inhabit.' },
  { id:'mine-crystal-wolf', name:'Crystal Wolf',  icon:'🐺', tier:'The Mine — Depth 3-5', dungeon:'mine', desc:'A pack animal that followed something into the mine centuries ago. The something is gone. The wolf stayed. The crystals grew.' },
  { id:'mine-forgotten-foreman', name:'Forgotten Foreman', icon:'👷', tier:'The Mine — Elite', dungeon:'mine', isElite:true, desc:'Was in charge when things went wrong. Has been in charge ever since. Whatever went wrong is still going wrong under his supervision.' },
  { id:'mine-the-foremans-ghost', name:"The Foreman's Ghost", icon:'👻', tier:'The Mine — Depth 10 Boss', dungeon:'mine', isBoss:true, desc:'He ran this mine for forty years. He never left. He is still here, walking the tunnels at night, checking on workers who no longer work here, writing reports nobody will ever read.' },
  { id:'mine-the-cave-king',      name:'The Cave King',      icon:'👑', tier:'The Mine — Depth 20 Boss', dungeon:'mine', isBoss:true, desc:'Something claimed the deepest tunnels as its kingdom long before you arrived. It has been ruling down here in the dark for a very long time. It is not happy about visitors.' },
  { id:'mine-the-deep-hunger',    name:'The Deep Hunger',    icon:'🕳️', tier:'The Mine — Depth 30 Boss', dungeon:'mine', isBoss:true, desc:'It has been waiting in the dark since before the mine existed. It is very hungry. The mine was built around it without anyone realizing. The workers wondered why food kept disappearing.' },
  { id:'mine-the-vein-titan',     name:'The Vein Titan',     icon:'⛰️', tier:'The Mine — Depth 50 Boss', dungeon:'mine', isBoss:true, desc:'The mountain itself has decided you have gone far enough. It pulled itself together into something with arms and a bad attitude. It is not a metaphor. It is literally the mountain.' },
  { id:'mine-the-mines-heart',    name:"The Mine's Heart",   icon:'❤️', tier:'The Mine — Depth 100 Boss', dungeon:'mine', isBoss:true, desc:'You found it. The thing at the center of everything. It has been beating down here in the dark for longer than anyone can remember. It does not want to be found. It does not want to stop.' },
  // ── THE ASHBOUND WASTES extras ──
  { id:'ash-cinder-hound',  name:'Cinder Hound',  icon:'🐕', tier:'Ashbound 1-3',  dungeon:'ash', desc:'Runs on embers instead of blood. Leaves scorched pawprints on every surface it crosses. Has been running since the wastes ignited. Has not stopped.' },
  { id:'ash-smoke-wraith',  name:'Smoke Wraith',  icon:'💨', tier:'Ashbound 1-4',  dungeon:'ash', desc:'What remains of someone who burned completely. Not flesh, not bone — just the smoke of a person, still moving with the momentum of a life that ended.' },
  { id:'ash-ember-knight',  name:'Ember Knight',  icon:'🔥', tier:'Ashbound 3-6',  dungeon:'ash', desc:'A warrior who refused to retreat when the wastes burned. Their armor melted into their body. They are still standing. They are still fighting.' },
  { id:'ash-pyre-sentinel', name:'Pyre Sentinel', icon:'🪔', tier:'Ashbound 4-7',  dungeon:'ash', desc:'Set here to warn if the fire ever went out. The fire never went out. The sentinel has been standing at attention for three hundred years with nothing to report.' },
  { id:'ash-burned-colossus',name:'Burned Colossus',icon:'🏚️',tier:'Ashbound 6-9', dungeon:'ash', desc:'Something enormous that walked into the fire and kept walking. The fire eventually gave up trying to kill it. They reached an understanding.' },
  // ── THE ABYSSAL DEEP extras ──
  { id:'abyss-tide-caller', name:'Tide Caller',   icon:'🌊', tier:'Abyssal 1-3',  dungeon:'abyssal', desc:'Calls the tide from somewhere that has no tide. The tide comes anyway. The abyss has its own rules about what water does.' },
  { id:'abyss-depth-shade', name:'Depth Shade',   icon:'🌑', tier:'Abyssal 1-4',  dungeon:'abyssal', desc:'The darkness at this depth is not an absence of light. It is a substance. This creature is made of it. It is very comfortable here.' },
  { id:'abyss-sunken-titan',name:'Sunken Titan',  icon:'⚓', tier:'Abyssal 4-7',  dungeon:'abyssal', desc:'Something the ocean floor could not hold down anymore. It rose. The ocean floor has not recovered from the loss.' },
  { id:'abyss-void-swimmer',name:'Void Swimmer',  icon:'🦈', tier:'Abyssal 5-8',  dungeon:'abyssal', desc:'Evolved to move through the void between the deep and the deeper. Has no natural predators. Has no natural anything. It simply is.' },
  { id:'abyss-pressure-wraith',name:'Pressure Wraith',icon:'💀',tier:'Abyssal 6-9',dungeon:'abyssal', desc:'Created by the weight of the water above. Too much pressure for too long does things to matter. This is one of those things.' },
  // ── THE SHADOW WORLD ──
  { id:'shadow-mimic',       name:'The Mimic',        icon:'📦', tier:'Shadow 1-3',  dungeon:'shadow', desc:'It has been a chest for so long it has forgotten it is not one. The surprise when you open it is mutual.' },
  { id:'shadow-pup',         name:'Shadow Pup',        icon:'🐾', tier:'Shadow 1-3',  dungeon:'shadow', desc:'A small piece of darkness that learned to move. It never travels alone. It does not know how.' },
  { id:'shadow-drifter',     name:'The Drifter',       icon:'🌫️', tier:'Shadow 1-3',  dungeon:'shadow', desc:'Exists partially in the shadow plane. The half you can see is not the dangerous half.' },
  { id:'shadow-null-frag',   name:'Null Fragment',     icon:'⬛', tier:'Shadow 1-4',  dungeon:'shadow', desc:'A piece of something that was completely erased. It does not know what it used to be. It is angry about this.' },
  { id:'shadow-smear',       name:'The Smear',         icon:'🖤', tier:'Shadow 1-4',  dungeon:'shadow', desc:'Corruption given form. It leaves a mark on everything it touches. The mark stays long after the Smear is gone.' },
  { id:'shadow-null-knight', name:'Null Knight',       icon:'🗡️', tier:'Shadow 3-6',  dungeon:'shadow', desc:'Someone wore this armor into the Shadow World and did not come back out. The armor did. Something else is wearing it now.' },
  { id:'shadow-reflection',  name:'The Reflection',    icon:'🪞', tier:'Shadow 3-6',  dungeon:'shadow', desc:'A mirror with opinions. It has studied you carefully. It will use what it has learned.' },
  { id:'shadow-sorrow-hound',name:'Sorrow Hound',      icon:'🐕', tier:'Shadow 3-6',  dungeon:'shadow', desc:'A dog that has been in the dark too long. Its howl carries 3000 years of accumulated sadness. You will feel it.' },
  { id:'shadow-lurker',      name:'The Lurker',        icon:'👁️', tier:'Shadow 3-6',  dungeon:'shadow', desc:'Has been in this room longer than you have. Has been waiting longer than you have been alive. Patience is its primary weapon.' },
  { id:'shadow-void-weaver', name:'Void Weaver',       icon:'🕸️', tier:'Shadow 4-7',  dungeon:'shadow', desc:'Spins webs from compressed shadow. The webs are not for catching prey. They are for corrupting it slowly.' },
  { id:'shadow-twice-dead',  name:'The Twice Dead',    icon:'💀', tier:'Shadow 7-9',  dungeon:'shadow', desc:'Died once and did not accept it. The Shadow World does not argue with things that refuse to stay dead. Neither should you.' },
  { id:'shadow-archon',      name:'Shadow Archon',     icon:'👑', tier:'Shadow 7-9',  dungeon:'shadow', desc:'Has ruled this section of the Shadow World for longer than recorded history. The shadows obey it. You are in its domain.' },
  { id:'shadow-unborn',      name:'The Unborn',        icon:'🌑', tier:'Shadow 7-9',  dungeon:'shadow', desc:'Never existed in the physical world. Has no frame of reference for physics. Physical laws do not apply to what was never physical.' },
  { id:'shadow-remnant',     name:'The Remnant',       icon:'🔮', tier:'Shadow 7-9',  dungeon:'shadow', desc:'What is left when something violent happens and the energy does not dissipate. It has been accumulating for 3000 years.' },
  { id:'shadow-echo',        name:'The Echo',          icon:'🔄', tier:'Shadow Boss', dungeon:'shadow', desc:'A perfect copy of something you already killed. It remembers the fight. It remembers what you did. It will not make the same mistakes.' },
  { id:'shadow-shapeshifter',name:'The Shapeshifter',  icon:'🌑', tier:'Shadow Boss', dungeon:'shadow', desc:'Has waited 3000 years for someone worth copying. It wears your face now. Uses your skills. Knows every move before you make it. You are fighting yourself and yourself is very good at this.' },
  // ── THE WHISPERING FOREST extras ──
  { id:'whisper-root-walker',name:'Root Walker',  icon:'🌿', tier:'Forest 1-3',   dungeon:'whisper', desc:'The forest walks. This is one of its feet. There are others.' },
  { id:'whisper-shadow-stag',name:'Shadow Stag',  icon:'🦌', tier:'Forest 1-4',   dungeon:'whisper', desc:'A deer that stepped into a shadow and did not come back out correctly. Still looks like a deer from certain angles. From other angles it does not.' },
  { id:'whisper-bark-golem', name:'Bark Golem',   icon:'🪵', tier:'Forest 3-6',   dungeon:'whisper', desc:'The forest built it to deal with intruders. The forest is not subtle about what it considers an intruder.' },
  { id:'whisper-night-bloom', name:'Night Bloom', icon:'🌸', tier:'Forest 3-6',   dungeon:'whisper', desc:'Flowers that only open in darkness. The pollen is not good for you. The forest knows this. The forest is not concerned.' },
  { id:'whisper-canopy-horror',name:'Canopy Horror',icon:'🕷️',tier:'Forest 5-8', dungeon:'whisper', desc:'Lives in the treetops where the light does not reach. Has been watching you since you entered the forest. You are only just becoming aware of it.' },
  // ── THE INFERNAL DESCENT extras ──
  { id:'infernal-sin-eater', name:'Sin Eater',    icon:'😈', tier:'Infernal 1-3', dungeon:'infernal', desc:'Feeds on guilt. The descent provides a steady supply. It has never gone hungry here. It has never gone hungry anywhere.' },
  { id:'infernal-brimstone-hound',name:'Brimstone Hound',icon:'🐕',tier:'Infernal 2-5',dungeon:'infernal', desc:'The guard dogs of the descent. Bred for loyalty to whatever owns this place. Extremely loyal. Extremely hungry.' },
  { id:'infernal-chain-wraith',name:'Chain Wraith',icon:'⛓️',tier:'Infernal 4-7', dungeon:'infernal', desc:'Bound here by something it cannot name. The chains are not keeping it in. They are keeping something else out. The distinction matters.' },
  { id:'infernal-herald',    name:'Infernal Herald',icon:'📯',tier:'Infernal 6-9',dungeon:'infernal', desc:'Announces arrivals in the descent. Has been announcing arrivals for a very long time. Its voice has gotten very loud.' },
];

// ── SPIRE BESTIARY — separate from main BESTIARY_DATA, shown in its own tab ──
var SPIRE_BESTIARY_DATA = [
  { id:'spire-rat',          name:'Spire Rat',            icon:'🐀', tier:'The Spire — Floors 1-50',    desc:'Something about the Spire made them larger. Faster. The ones at the bottom are almost normal. By floor thirty they are neither.' },
  { id:'crumbling-golem',    name:'Crumbling Golem',      icon:'🪨', tier:'The Spire — Floors 1-50',    desc:'Ancient guardians left to patrol the lower floors. They have been patrolling for so long that they have forgotten what they are guarding.' },
  { id:'hollow-shade-spire', name:'Hollow Shade',         icon:'👤', tier:'The Spire — Floors 1-50',    desc:'Shades follow those who climb the Spire. They are not chasing you. They are waiting for you to stop.' },
  { id:'stone-sentinel',     name:'Stone Sentinel',       icon:'🗿', tier:'The Spire — Floors 51-200',   desc:'The Spire built these. Not in any way that can be explained. One day they were not here. Then they were.' },
  { id:'ash-wraith',         name:'Ash Wraith',           icon:'💨', tier:'The Spire — Floors 51-200',   desc:'The remains of climbers who burned out before reaching the top. They drift upward still, out of habit.' },
  { id:'spire-knight',       name:'Spire Knight',         icon:'⚔️', tier:'The Spire — Floors 51-200',   desc:'They were sent to clear the Spire decades ago. They never came back. They are still clearing it.' },
  { id:'crimson-warden',     name:'Crimson Warden',       icon:'🔴', tier:'The Spire — Floors 201-500',  desc:'Their armor is not red. It started a different color. They have been in the Spire a very long time.' },
  { id:'time-phantom',       name:'Time Phantom',         icon:'⏳', tier:'The Spire — Floors 201-500',  desc:'A fragment of time that got stuck. It replays the same moment of violence endlessly. You are now part of that moment.' },
  { id:'rift-stalker',       name:'Rift Stalker',         icon:'🌀', tier:'The Spire — Floors 201-500',  desc:'It comes from the gaps between floors. The Spire has many gaps. It has many of these.' },
  { id:'eternal-husk',       name:'Eternal Husk',         icon:'💀', tier:'The Spire — Floors 501-1000', desc:'What the Spire leaves behind when it finishes with something. The soul is gone. The hunger is not.' },
  { id:'voidborn-spire',     name:'Voidborn',             icon:'🌌', tier:'The Spire — Floors 501-1000', desc:'Born in the nothing between the high floors. It does not understand what you are. This makes it more dangerous, not less.' },
  { id:'time-devourer',      name:'Time Devourer',        icon:'⌛', tier:'The Spire — Floors 1001+',    desc:'Near the top, time moves differently. These feed on the difference. They are very well fed.' },
  { id:'the-forgotten',      name:'The Forgotten',        icon:'🫥', tier:'The Spire — Floors 1001+',    desc:'No one remembers sending them up. They do not remember being sent. They remember nothing except the climbing.' },
  { id:'gate-warden',        name:'The Gate Warden',      icon:'🚪', tier:'The Spire — Boss, Floor 10',  desc:'The first door will not open itself. It never has.', isBoss:true },
  { id:'iron-sovereign',     name:'The Iron Sovereign',   icon:'👑', tier:'The Spire — Boss, Floor 100', desc:'A king of stone and silence. It ruled the middle floors before the Spire existed. It rules them still.', isBoss:true },
  { id:'void-throne',        name:'The Void Throne',      icon:'🌑', tier:'The Spire — Boss, Floor 500', desc:'Something sits on it. You cannot quite see what. You will see it clearly when it stands up.', isBoss:true },
  { id:'the-time-eater',     name:'The Time Eater',       icon:'⏳', tier:'The Spire — Boss, Floor 1800',desc:'It has been at the top since before the Spire existed. It did not build the Spire. It did not need to. The Spire grew around it the way bone grows around a wound.', isBoss:true },
];

// Nightmare bestiary merged at render time — see renderBestiary()

var bestiaryKills = {}; // real value hydrated in the DDStore.whenReady() callback

function saveBestiary() { DDStore.setItem('dd_bestiary', JSON.stringify(bestiaryKills)); }

function recordKill(enemyName) {
  // Track community enemy kills in Firebase
  if (DS && DS.enemy && DS.enemy.isCommunity && DS.enemy.communityId) {
    incrementCommunityKill(DS.enemy.communityId);
  }
  var nameToId = {
    'Hollow Shade':'hollow-shade',
    'Crypt Rat':'crypt-rat',
    'Brittle Skeleton':'brittle-skeleton',
    'Grave Crawler':'grave-crawler',
    'Tomb Bat':'tomb-bat',
    'Rotting Ghoul':'rotting-ghoul',
    'Ashen Wisp':'ashen-wisp',
    'Bone Shard':'bone-shard',
    'Wailing Wraith':'wailing-wraith',
    'Armored Skeleton':'armored-skeleton',
    'Plague Hound':'plague-hound',
    'Crypt Banshee':'crypt-banshee',
    'Shadow Stalker':'shadow-stalker',
    'Cursed Knight':'cursed-knight',
    'Plague Wraith':'plague-wraith',
    'Bone Archer':'bone-archer',
    'Death Knight':'death-knight',
    'Bone Colossus':'bone-colossus',
    'Soul Harvester':'soul-harvester',
    'Void Reaper':'void-reaper',
    'Ancient Revenant':'ancient-revenant',
    'Nightmare Shade':'nightmare-shade',
    'Blood Golem':'blood-golem',
    'Malachar the Undying':'malachar',
    'Crypt Spider':'crypt-spider',
    'Venom Spitter':'venom-spitter',
    'Web Stalker':'web-stalker',
    'Brood Mother':'brood-mother',
    'The Undying Legion':'undying-legion',
    'Cinder Wraith':'cinder-wraith',
    'Ash Crawler':'ash-crawler',
    'Scorched Husk':'scorched-husk',
    'Ember Shade':'ember-shade',
    'Char Bat':'char-bat',
    'Slag Crawler':'slag-crawler',
    'Molten Knight':'molten-knight',
    'Plague of Cinders':'plague-of-cinders',
    'Char Stalker':'char-stalker',
    'Blighted Overseer':'blighted-overseer',
    'Ashen Revenant':'ashen-revenant',
    'Flame Wraith':'flame-wraith',
    'Volcanic Revenant':'volcanic-revenant',
    'Infernal Colossus':'infernal-colossus',
    'The Ashen King':'the-ashen-king',
    'Slag Titan':'slag-titan',
    'Ember Reaper':'ember-reaper',
    'The Eternal Pyre':'eternal-pyre',
    'The Bone Sovereign':'bone-sovereign',
    'The Void Walker':'void-walker',
    'The Ashen Throne':'ashen-throne',
    'The Cinder Colossus':'cinder-colossus',
    'Frost Shade':'frost-shade',
    'Glacial Rat':'glacial-rat',
    'Ice Shard':'ice-shard',
    'Frozen Husk':'frozen-husk',
    'Cave Bat':'cave-bat',
    'Permafrost Crawler':'permafrost-crawler',
    'Blizzard Wraith':'blizzard-wraith',
    'Glacial Knight':'glacial-knight',
    'Frostbite Hound':'frostbite-hound',
    'Frozen Banshee':'frozen-banshee',
    'Ice Stalker':'ice-stalker',
    'Arctic Revenant':'arctic-revenant',
    'Avalanche Colossus':'avalanche-colossus',
    'Frost Reaper':'frost-reaper',
    'The Glacial Sovereign':'glacial-sovereign',
    'Frozen Titan':'frozen-titan',
    'Void Frost':'void-frost',
    'The Eternal Winter':'eternal-winter',
    'The Frozen King':'frozen-king',
    'The Void Below':'void-below',
    'The Hollow':'the-hollow',
    'Flesh Amalgam':'flesh-amalgam',
    'Void Spawn':'void-spawn',
    'The Forgotten':'the-forgotten',
    'Dread Wisp':'dread-wisp',
    'Nightmare Rat':'nightmare-rat',
    'Soul Eater':'soul-eater',
    'The Watcher':'the-watcher',
    'Dread Knight':'dread-knight',
    'Flesh Wraith':'flesh-wraith',
    'Void Stalker':'void-stalker',
    'The Damned':'the-damned',
    'Nightmare Colossus':'nightmare-colossus',
    'The Unmaking':'the-unmaking',
    'Void Reaver':'void-reaver',
    'Dread Sovereign':'dread-sovereign',
    'Soul Harvester Prime':'soul-harvester-prime',
    'The Dungeon Itself':'dungeon-itself',
    'The Nightmare Sovereign':'nightmare-sovereign',
    'The Void Given Form':'void-given-form',
    'The Parlor Guest':'parlor-guest',
    'Hollow Bride':'hollow-bride',
    'The Portrait':'the-portrait',
    'Creaking Step':'creaking-step',
    'The Reflection':'the-reflection',
    'The Door Warden':'door-warden',
    'The Groundskeeper':'groundskeeper',
    'Hollow Groom':'hollow-groom',
    'The Bell Ringer':'the-bell-ringer',
    'The Wall Crawler':'wall-crawler',
    'The Oldest Guest':'oldest-guest',
    'The Hollow Matron':'hollow-matron',
    'The Caretaker':'the-caretaker',
    'The Weeping Child':'weeping-child',
    'The Weeping Mother':'weeping-mother',
    'The Music Box':'music-box',
    'The Twin':'the-twin',
    'The Uninvited Guest':'uninvited-guest',
    'The Grieving One':'grieving-one',
    'The House Itself':'house-itself',
    'The Last Resident':'last-resident',
    'The Easter Bunny':'easter-bunny-enemy',
    'The Hollow Patriarch':'hollow-patriarch',
    'The Séance Master':'seance-master',
    'The Hollow Architect':'hollow-architect',
    'Drowned Archivist':'drowned-archivist',
    'Ink Wraith':'ink-wraith',
    'Bloated Librarian':'bloated-librarian',
    'Paper Shade':'paper-shade',
    'Soggy Sentinel':'soggy-sentinel',
    'Deep Cartographer':'deep-cartographer',
    'Tide Golem':'tide-golem',
    'Drowned Scholar':'drowned-scholar',
    'Archive Specter':'archive-specter',
    'Leviathan Spawn':'leviathan-spawn',
    'The Sunken Warden':'sunken-warden',
    'Grand Archivist':'grand-archivist',
    'Abyssal Colossus':'abyssal-colossus',
    'Drowned Chancellor':'drowned-chancellor',
    'The Drowned Curator':'drowned-curator',
    'Leviathan of the Deep':'leviathan-deep',
    'The Last Librarian':'last-librarian',
    'The Unnamed':'the-unnamed',
    'Scream Without Source':'scream-without-source',
    'The Almost':'the-almost',
    'Flesh Wraith':'flesh-wraith',
    'Void Stalker':'void-stalker',
    'The Damned':'the-damned',
    'Hollow Colossus':'hollow-colossus',
    'The Unraveling':'the-unraveling',
    'Grief Made Flesh':'grief-made-flesh',
    'Nightmare Colossus':'nightmare-colossus',
    'The Unmaking':'the-unmaking',
    'Void Reaver':'void-reaver',
    'Dread Sovereign':'dread-sovereign',
    'Soul Harvester Prime':'soul-harvester-prime',
    'The Dungeon Itself':'dungeon-itself',
    'The Nightmare Sovereign':'nightmare-sovereign',
    'The Void Given Form':'void-given-form',
    'Jack Lantern':'jack-lantern',
    'The Scarecrow':'the-scarecrow',
    'Candy Wraith':'candy-wraith',
    'The Pumpkin King':'pumpkin-king',
    'Grave Fog':'grave-fog',
    'The Bat Swarm':'bat-swarm',
    'Hollow Skeleton':'hollow-skeleton',
    'The Black Cat':'black-cat',
    'Cursed Pumpkin':'cursed-pumpkin',
    'The Witch':'the-witch',
    'Ghost of Halloween':'ghost-of-halloween',
    'The Headless One':'headless-one',
    'Krampus Imp':'krampus-imp',
    'The Snowman':'the-snowman',
    'Cursed Elf':'cursed-elf',
    'Krampus':'krampus',
    'Frozen Gift':'frozen-gift',
    'The Dark Reindeer':'dark-reindeer',
    'Ancient Death Knight':'ancient-death-knight',
    'The Eternal Warden':'eternal-warden',
    'Crypt Champion':'crypt-champion',
    'Ash Titan':'ash-titan',
    'Vel Ashara Chosen':'vel-ashara-chosen',
    'The Undying Flame':'undying-flame',
    'Glacier Warden':'glacier-warden',
    'The Frost Sovereign':'frost-sovereign',
    'Abyssal Hunter':'abyssal-hunter',
    'The Head Archivist':'head-archivist',
    'Leviathan Scout':'leviathan-scout',
    'Drowned Paladin':'drowned-paladin',
    'The First Fear':'first-fear',
    'Void Champion':'void-champion',
    'The One That Watches':'one-that-watches'
  };
  var id = nameToId[enemyName];
  if (!id) return;
  bestiaryKills[id] = (bestiaryKills[id] || 0) + 1;
  saveBestiary();
  checkBestiaryMilestone(id);
}

// ═══════════════════════════════════════════════════════
// THE CODEX — World Lore, Enemy Lore, Artifacts
// ═══════════════════════════════════════════════════════

var CODEX_WORLD = [
  {
    id: 'codex-w-crypt',
    title: 'The Crypt of Malachar',
    icon: '💀',
    unlockCondition: function() { return (getAchievementStats().dungeonClears || 0) >= 1 || (bestiaryKills['crypt-skeleton'] || 0) >= 1; },
    unlockHint: 'Clear the Crypt of Malachar to unlock.',
    body: 'Malachar was not always a name spoken in fear. Three centuries before the Descent, he was the most celebrated architect in the realm — a builder of cathedrals, bridges, and monuments. He built the Crypt himself. He built it for himself. He was not expecting to die in it.\n\nThe circumstances of his death remain disputed. Some say he sealed himself inside voluntarily, pursuing an experiment in necromantic preservation. Others say his apprentices locked him in after discovering what he had been doing to the bodies of the recently deceased. The Crypt remembers neither version. It only remembers that he is still there, somewhere in the lowest chamber, building things in the dark that no one has survived long enough to describe.'
  },
  {
    id: 'codex-w-ashbound',
    title: 'The Ashbound Wastes',
    icon: '🔥',
    unlockCondition: function() { return (bestiaryKills['ash-cinder-hound'] || 0) >= 1 || (getAchievementStats().ashComplete || 0) >= 1; },
    unlockHint: 'Enter the Ashbound Wastes to unlock.',
    body: 'The Wastes did not always burn. Travellers who have read the oldest maps describe the region as a grassland — unremarkable, flat, populated by farming villages with names nobody remembers anymore. The fire started on a Tuesday. Nobody knows who started it or why. What is known is that it has been burning for two hundred and forty years and shows no sign of stopping.\n\nThe fire has developed preferences over the centuries. It burns hotter in certain places. It spares certain structures. Three stone archways in the eastern Wastes have stood completely untouched since the fire began, surrounded on all sides by destruction. Nobody has ever explained why. The fire has been observed to move toward sounds. It is strongly recommended that you do not sing in the Wastes.'
  },
  {
    id: 'codex-w-frosthold',
    title: 'The Frosthold Abyss',
    icon: '❄️',
    unlockCondition: function() { return (bestiaryKills['frost-ice-wraith'] || 0) >= 1 || (getAchievementStats().frostComplete || 0) >= 1; },
    unlockHint: 'Enter the Frosthold Abyss to unlock.',
    body: 'The Abyss predates the cold. Geological surveys conducted by the Academy of Cartography — before the Academy of Cartography was destroyed in an unrelated incident — suggested the Abyss was originally a temperate cave system used as a trading post. The cold arrived approximately one hundred and sixty years ago and progressed downward at a rate of one floor per decade.\n\nThe current theory is that something at the bottom is generating the cold. Nobody has reached the bottom. The deepest confirmed descent on record is Floor 11, achieved by a Ranger named Isolde who left a note at that depth reading: "it is watching me from below. it has been watching me since floor 4. i do not think it needs eyes to watch." Isolde did not return. The note is preserved in the Archive of the Descent, where it remains consistently colder than the surrounding documents.'
  },
  {
    id: 'codex-w-hollow',
    title: 'The Hollow',
    icon: '👁️',
    unlockCondition: function() { return (bestiaryKills['hollow-grief-shade'] || 0) >= 1 || (getAchievementStats().hollowComplete || 0) >= 1; },
    unlockHint: 'Enter The Hollow to unlock.',
    body: 'The Hollow is not a dungeon in the conventional sense. It is a house. It has always been a house. The house is four storeys tall from the outside and considerably larger on the inside, which architects have described as "structurally inadvisable" and "deeply upsetting."\n\nThe house was built by a woman named Edna Holloway approximately seventy years ago. She lived in it alone for forty years. Neighbours reported that she seemed content, if reclusive, and was occasionally seen in the garden tending to plants that bloomed in colours nobody had names for. When she died, the house did not stop. The lights stayed on. The garden kept blooming. Things inside the house kept moving furniture around. Whatever the house is grieving, it has been grieving it for thirty years, and it does not appear to be finished.'
  },
  {
    id: 'codex-w-mine',
    title: 'The Mine — Before the Collapse',
    icon: '⛏️',
    unlockCondition: function() { return (getAchievementStats().mineMaxDepth || 0) >= 5; },
    unlockHint: 'Reach depth 5 in the Mine to unlock.',
    body: 'The Mine was a functioning operation for sixty years before the collapse. It produced iron, coal, and occasionally gold in quantities that made the owning company very wealthy and the workers comparatively less so. The Foreman — records list only his title, never his name — ran operations from a wooden office on the surface and was by most accounts a reasonable man who paid fair wages and maintained safety standards that were merely inadequate rather than negligently so.\n\nThe collapse happened on a Thursday morning. One hundred and twelve workers were underground at the time. Rescue operations continued for three weeks before being abandoned. The official cause of collapse was listed as "structural failure due to over-excavation in the lower shafts." The company geologist who filed this report submitted his resignation the same day and moved to a different country. He never spoke about the Mine again. What the lower shafts were over-excavated toward was never recorded officially. The Mine remembers, though. The Mine always remembers.'
  },
  {
    id: 'codex-w-spire',
    title: 'What the Spire Is',
    icon: '🗼',
    unlockCondition: function() { return (SPIRE && SPIRE.floor >= 10) || (getAchievementStats().spireFloor || 0) >= 10; },
    unlockHint: 'Reach floor 10 of the Spire to unlock.',
    body: 'Nobody built the Spire. This has been confirmed by every architectural survey ever conducted on it. The materials are not quarried stone. The mortar, where present, is not any compound identified in any known catalogue. The Spire simply exists, and has existed for longer than any human record.\n\nThe floors are not consistent. Floor 1 is approximately twelve feet high. Floor 47 is reportedly infinite in all horizontal directions, though no one has confirmed this personally and returned. Floor 100 contains a room with a chair, a table, and a cup of tea that is always warm. Nobody has ever seen who makes the tea. The chair faces away from every entrance simultaneously, which should be geometrically impossible and is.\n\nThe current leading theory among scholars is that the Spire is not a place but a question. What question it is asking has not yet been determined. Reaching the top may provide the answer. Nobody has reached the top.'
  },
  {
    id: 'codex-w-dddi',
    title: 'The Department of Dungeon Descent Incorporated',
    icon: '📋',
    unlockCondition: function() { return parseInt(DDStore.getItem('dd_stories_read') || '0') >= 3; },
    unlockHint: 'Read 3 stories in the Chronicles to unlock.',
    body: 'The Department of Dungeon Descent Incorporated was established on a date that has been redacted from all official records at the Department\'s own request. Its mandate, as stated in the Founding Charter, is "the regulation, standardisation, and bureaucratic oversight of all dungeon-related activities, with particular attention to compliance, documentation, and the ongoing situation with Julio."\n\nThe Department has no physical address. Correspondence sent to its listed postal box is returned unopened with a stamp reading "DELIVERED — RECIPIENT UNAVAILABLE." The Grand Overseer has never been seen. Deputy Director Hargrove has been seen, but only in reflective surfaces, and only when not directly observed.\n\nThe Department employs, at last count, four hundred and twelve staff members. Nobody has met more than three of them. Julio\'s employment status remains classified. The Department continues to issue compliance audits, mandatory certifications, and formal warnings to Dungeon Descent on a regular basis. The developer has read approximately none of them.'
  },
  {
    id: 'codex-w-void',
    title: 'The Void and What Lives In It',
    icon: '🌑',
    unlockCondition: function() { return parseInt(DDStore.getItem('dd_void_fragments') || '0') >= 5; },
    unlockHint: 'Collect 5 Void Fragments to unlock.',
    body: 'The Void is not empty. This is the first thing you should understand. The word "void" was chosen by the first explorer to encounter it, a woman named Sera Voss, who used it in the technical sense of "a space devoid of the expected" rather than the colloquial sense of "a space devoid of everything." Sera Voss was precise with language. She would be upset to know how her terminology has been misinterpreted.\n\nThe Void contains: structures of no identifiable architecture, sounds at frequencies that suggest language but in no known tongue, and entities. The entities do not appear to have consistent forms. They appear to have consistent intentions, though what those intentions are remains debated. They leave fragments when they pass through other planes of existence. These fragments retain a residue of whatever the Void is. Prolonged contact is not recommended. Brief contact is merely ill-advised. The fragments are, however, extraordinarily beautiful, which is believed to be intentional on the part of whatever leaves them.'
  },
];

var CODEX_ENEMY = [
  {
    id: 'codex-e-skeletons',
    title: 'On Skeletons',
    icon: '💀',
    unlockCondition: function() { return (bestiaryKills['crypt-skeleton'] || 0) >= 10; },
    unlockHint: 'Defeat 10 Skeletons to unlock.',
    body: 'Skeletons are not animated by malice. This is a common misconception. They are animated by habit. The bodies remember what they were doing when they died and continue doing it, minus the parts that required flesh, which turns out to be most parts.\n\nA Skeleton that was a guard continues to guard. A Skeleton that was a soldier continues to soldier. The tragedy of the Skeleton is not that it attacks you — it is that it does not know it is doing so. It is simply following the last instructions it received, approximately several centuries ago, from a commanding officer who has long since ceased to have opinions about anything.\n\nThe best way to defeat a Skeleton is quickly. The second best way is quietly. There is no third way. The Skeleton does not get tired, does not feel pain, and does not stop. It simply continues. This is both its greatest strength and the saddest thing about it.'
  },
  {
    id: 'codex-e-void-wraith',
    title: 'The Void Wraith — A Study',
    icon: '🌑',
    unlockCondition: function() { return (bestiaryKills['void-wraith'] || 0) >= 1; },
    unlockHint: 'Defeat a Void Wraith to unlock.',
    body: 'The Void Wraith is not from here. This is detectable by anyone with functioning senses within approximately thirty feet of one, as the surrounding air acquires qualities that air is not supposed to have. It becomes thicker. It becomes darker, even in full light. It becomes colder in a way that bypasses temperature and affects something closer to memory.\n\nThe Wraith itself is what remains of something that spent too long in the Void and forgot what it was before. The form it currently holds — the darkness, the trailing edges, the eyes that appear in positions that eyes should not be — is not its original form. Its original form is not on record. The Void Wraith does not remember it either. It remembers the Void. It remembers the cold. It remembers something it wants to return to, though it cannot articulate what.\n\nDefeating a Void Wraith does not destroy it. It disperses it. The components return to the Void. Whether the Wraith reconstitutes there is unknown. It seems likely.'
  },
  {
    id: 'codex-e-mine-bosses',
    title: 'What Lives in the Deep Mine',
    icon: '⛰️',
    unlockCondition: function() { return (getAchievementStats().mineMaxDepth || 0) >= 10; },
    unlockHint: 'Reach depth 10 in the Mine to unlock.',
    body: 'The things at the bottom of the Mine did not arrive there. They were already there when the Mine was dug. The miners found them by accident, which is the usual way of finding things that do not want to be found.\n\nThe Foreman\'s Ghost is the most accessible of them — a human residue, something that was once a man and retains enough of that shape to be recognizable. Below it, the things become less human and more something else. The Cave King is not a king in any sense that word was intended to carry. It claimed kingship over the dark the way darkness claims anything — by simply being there and refusing to leave.\n\nThe Deep Hunger has no origin story that any scholar has been able to reconstruct. It exists at depth 30 the way gravity exists — as a condition of the environment rather than a presence within it. It is hungry in the way that absence is hungry: completely, quietly, and without satisfaction.\n\nThe Mine\'s Heart has been beating since before the mine existed. The miners who first heard it thought it was a geological phenomenon. It is not a geological phenomenon. It is aware of you. It has been aware of you since you entered the mine. It is simply waiting to see how far down you are willing to go.'
  },
];

var CODEX_ARTIFACTS = [
  {
    id: 'codex-a-music-box',
    title: 'The Music Box',
    icon: '🎵',
    unlockCondition: function() { var inv = getGlobalInventory(); return inv.some(function(i){ return i.name === 'Music Box' || i.type === 'music-box'; }); },
    unlockHint: 'Find a Music Box to unlock.',
    body: 'The Music Box was manufactured by a craftsman whose name is stamped on the base in letters too small to read without magnification. It plays one melody. The melody has no known composer. Music scholars who have heard it describe it as "familiar in a way that cannot be explained" and "something you have heard before, though you have not."\n\nThe Box was found in The Hollow, in a room that did not appear on any floor plan and has not been found again since. Whether the Box belonged to Edna Holloway is unknown. Whether the melody is the thing the house is grieving is a question that several scholars have asked and none have been willing to answer.'
  },
  {
    id: 'codex-a-void-fragments',
    title: 'Void Fragments',
    icon: '🔮',
    unlockCondition: function() { return parseInt(DDStore.getItem('dd_void_fragments') || '0') >= 1; },
    unlockHint: 'Collect a Void Fragment to unlock.',
    body: 'Void Fragments are pieces of something that passed through. The something is never present when the fragment is found — only the residue it left behind. The fragments are dark in the way that space between stars is dark: not an absence of light but a presence of something else.\n\nThey are warm to the touch. This should not be possible given what they are. The warmth does not originate from any detectable source within the fragment. The leading theory is that the warmth is borrowed from wherever they came from, and that wherever they came from is considerably warmer than here.\n\nCollecting 25 Fragments reveals something. What it reveals has been described by the one person known to have collected all 25 as "the truth," which is not a useful description. She declined to elaborate. She seemed, afterward, to be at peace with something she had not been at peace with before. She did not say what.'
  },
  {
    id: 'codex-a-guns',
    title: 'Guns in the Dungeon — An Inquiry',
    icon: '🔫',
    unlockCondition: function() { try { var guns = _jsonParseSafe(DDStore.getItem('dd_owned_guns'), '[]'); return guns.length >= 1; } catch(e) { return false; } },
    unlockHint: 'Acquire a gun to unlock.',
    body: 'The presence of firearms in environments that predate gunpowder by several centuries has been a subject of significant academic debate. The dungeons were built — or grew, or arrived, depending on the dungeon — before any form of projectile weapon more sophisticated than a crossbow. And yet guns appear in them reliably: in chests, on defeated enemies, in rooms that have been sealed for centuries.\n\nThe current consensus, such as it is, is that the dungeons do not experience time in the conventional sense. A gun placed in the Crypt of Malachar in the present would, from the Crypt\'s perspective, have always been there. The Crypt is not confused by this. The Crypt does not experience confusion. The Crypt experiences something closer to patience.\n\nThe guns function normally. This is perhaps the strangest part. Whatever rules the dungeons operate under, they have decided that guns are acceptable. Nobody has asked why.'
  },
];

var _codexTab = 'world';

function switchCodexTab(tab) {
  _codexTab = tab;
  ['world','enemy','artifacts'].forEach(function(t) {
    var btn = document.getElementById('codex-tab-' + t);
    var panel = document.getElementById('codex-panel-' + t);
    var active = t === tab;
    if (btn) {
      btn.style.background = active ? '#1a1000' : '#0a0800';
      btn.style.borderColor = active ? '#c8a832' : '#443300';
      btn.style.color = active ? '#c8a832' : '#666';
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    }
    if (panel) panel.style.display = active ? '' : 'none';
  });
  renderCodexTab(tab);
}

function renderCodexTab(tab) {
  var data = tab === 'world' ? CODEX_WORLD : tab === 'enemy' ? CODEX_ENEMY : CODEX_ARTIFACTS;
  var panel = document.getElementById('codex-panel-' + tab);
  if (!panel) return;
  panel.innerHTML = '';

  var unlocked = 0;
  data.forEach(function(entry) {
    var isUnlocked = false;
    try { isUnlocked = entry.unlockCondition(); } catch(e) {}
    if (isUnlocked) unlocked++;

    var card = document.createElement('div');
    card.style.cssText = 'background:#0a0800;border:1px solid ' + (isUnlocked ? '#443300' : '#222') + ';border-radius:4px;padding:14px;margin-bottom:10px;';
    card.setAttribute('role', 'article');

    if (isUnlocked) {
      var titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-family:Cinzel,serif;font-size:0.75rem;color:#c8a832;margin-bottom:8px;';
      titleEl.textContent = entry.icon + ' ' + entry.title;
      card.appendChild(titleEl);

      var bodyEl = document.createElement('div');
      bodyEl.style.cssText = 'font-family:Cinzel,serif;font-size:0.62rem;color:#aaa;line-height:1.7;white-space:pre-line;';
      bodyEl.textContent = entry.body;
      card.appendChild(bodyEl);
    } else {
      var lockedEl = document.createElement('div');
      lockedEl.style.cssText = 'font-family:Cinzel,serif;font-size:0.65rem;color:#444;text-align:center;padding:8px;';
      lockedEl.setAttribute('aria-label', 'Locked entry. ' + entry.unlockHint);
      lockedEl.textContent = '🔒 ' + entry.unlockHint;
      card.appendChild(lockedEl);
    }
    panel.appendChild(card);
  });

  // Update progress
  updateCodexProgress();
}

function updateCodexProgress() {
  var allData = CODEX_WORLD.concat(CODEX_ENEMY).concat(CODEX_ARTIFACTS);
  var total = allData.length;
  var unlocked = 0;
  allData.forEach(function(e) { try { if (e.unlockCondition()) unlocked++; } catch(ex) {} });
  var pct = total > 0 ? Math.round((unlocked/total)*100) : 0;
  var bar = document.getElementById('codex-progress-bar');
  var txt = document.getElementById('codex-progress-text');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = unlocked + ' / ' + total + ' entries unlocked (' + pct + '%)';
}

function renderCodex() {
  switchCodexTab(_codexTab || 'world');
}

// ═══════════════════════════════════════════════════════
// COMMUNITY ENEMY CREATOR
// ═══════════════════════════════════════════════════════

var BAD_WORDS = ['fuck','shit','ass','bitch','cunt','dick','cock','pussy','nigger','nigga','faggot','fag','retard','whore','slut','bastard','damn','hell','piss','crap','asshole','motherfucker','bullshit'];

function ecContainsBadWord(text) {
  var lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  // Whole words only: matching inside words refused "Hellhound", "Shellback" and
  // "Assassin". The worst slurs are still caught inside any word.
  var words = lower.split(/\s+/);
  var always = ['nigger','nigga','faggot','cunt','retard'];
  return BAD_WORDS.some(function(w) {
    return words.indexOf(w) !== -1 || (always.indexOf(w) !== -1 && lower.indexOf(w) !== -1);
  });
}

var EC_STAT_RANGES = {
  common:   { hp:[20,60],   atk:[3,8],   def:[0,2] },
  uncommon: { hp:[50,110],  atk:[7,15],  def:[1,4] },
  rare:     { hp:[90,180],  atk:[13,24], def:[3,7] },
  elite:    { hp:[160,300], atk:[20,38], def:[5,12] },
  boss:     { hp:[280,600], atk:[30,55], def:[8,18] }
};

var _ecCurrentStats = null;

function ecInit() {
  // Populate music dropdown from MUSIC_CATALOGUE
  var sel = document.getElementById('ec-music');
  if (sel && sel.options.length <= 1) {
    MUSIC_CATALOGUE.forEach(function(track) {
      var opt = document.createElement('option');
      opt.value = track.key;
      opt.textContent = track.label;
      sel.appendChild(opt);
    });
  }
  // Roll initial stats
  ecRollStats();
  // Show form, hide success
  document.getElementById('enemy-creator-form').style.display = '';
  document.getElementById('enemy-creator-success').style.display = 'none';
  document.getElementById('ec-error').style.display = 'none';
  // Pre-fill creator name from tag if signed in
  var creatorInput = document.getElementById('ec-creator');
  if (creatorInput && !creatorInput.value) {
    try {
      var user = firebase.auth().currentUser;
      if (user) {
        window._fbDb.collection('users').doc(user.uid).get().then(function(snap) {
          if (snap.exists && snap.data().username) {
            creatorInput.value = snap.data().username;
          }
        }).catch(function(){});
      }
    } catch(e) {}
  }
}

function ecRollStats() {
  var type = document.getElementById('ec-type') ? document.getElementById('ec-type').value : 'common';
  var range = EC_STAT_RANGES[type] || EC_STAT_RANGES.common;
  var hp  = Math.floor(Math.random() * (range.hp[1]  - range.hp[0]  + 1)) + range.hp[0];
  var atk = Math.floor(Math.random() * (range.atk[1] - range.atk[0] + 1)) + range.atk[0];
  var def = Math.floor(Math.random() * (range.def[1] - range.def[0] + 1)) + range.def[0];
  _ecCurrentStats = { hp: hp, atk: atk, def: def };
  var box = document.getElementById('ec-stats-box');
  if (box) box.style.display = '';
  var hpEl = document.getElementById('ec-stat-hp');
  var atkEl = document.getElementById('ec-stat-atk');
  var defEl = document.getElementById('ec-stat-def');
  if (hpEl) hpEl.textContent = hp;
  if (atkEl) atkEl.textContent = atk;
  if (defEl) defEl.textContent = def;
  say('Stats rolled. HP: ' + hp + '. ATK: ' + atk + '. DEF: ' + def + '. Type reroll to roll again.');
}

function ecShowError(msg) {
  var el = document.getElementById('ec-error');
  if (el) { el.textContent = msg; el.style.display = ''; }
  say(msg);
}

function ecSubmit() {
  say('Submitting enemy. Please wait.');
  var name     = (document.getElementById('ec-name').value || '').trim();
  var desc     = (document.getElementById('ec-desc').value || '').trim();
  var type     = document.getElementById('ec-type').value;
  var dungeon  = document.getElementById('ec-dungeon').value;
  var music    = document.getElementById('ec-music').value;
  var creator  = (document.getElementById('ec-creator').value || '').trim();

  if (!name) { ecShowError('Please give your enemy a name.'); return; }
  if (!desc) { ecShowError('Please add a description.'); return; }
  if (!creator) { ecShowError('Please enter your creator name.'); return; }
  if (name.length < 2) { ecShowError('Enemy name is too short.'); return; }
  if (creator.length < 2) { ecShowError('Creator name is too short.'); return; }

  if (ecContainsBadWord(name) || ecContainsBadWord(desc) || ecContainsBadWord(creator)) {
    ecShowError('Your submission contains inappropriate content. Please revise and try again.');
    return;
  }

  if (!_ecCurrentStats) ecRollStats();

  if (!window._fbDb) {
    ecShowError('Firebase not ready. Please refresh the page and try again.');
    return;
  }

  var iconMap = { common:'👤', uncommon:'⚠️', rare:'💀', elite:'👁️', boss:'💀' };
  var enemyData = {
    name: name, desc: desc, type: type, dungeon: dungeon,
    music: music || null, creator: creator, icon: iconMap[type] || '👤',
    hp: _ecCurrentStats.hp, atk: _ecCurrentStats.atk, def: _ecCurrentStats.def,
    kills: 0, createdAt: Date.now(), approved: true
  };

  var submitBtn = document.getElementById('ec-submit-btn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Unleashing...'; }
  document.getElementById('ec-error').style.display = 'none';

  // Show success immediately — don't wait for Firebase to confirm
  // Same pattern as obituary system which works reliably
  document.getElementById('enemy-creator-form').style.display = 'none';
  document.getElementById('enemy-creator-success').style.display = '';
  var msg = document.getElementById('ec-success-msg');
  if (msg) {
    msg.textContent = '"' + name + '" has been added to the dungeon pool. Players will encounter your enemy in ' +
      (dungeon === 'all' ? 'all dungeons' : dungeon) + '. When they do, the dungeon will announce: "' +
      name + ', unleashed by ' + creator + '."';
  }
  say(name + ' has been unleashed into the dungeon. Players will encounter your creation soon.');
  try { incrementAchievementStat('enemyCreated', 1); } catch(e) {}

  // Fire and forget — same as obituary system
  try {
    if (!window._fbDb && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      window._fbDb = firebase.firestore();
    }
    var db = window._fbDb;
    if (db) {
      db.collection('community_enemies').add(enemyData)
        .catch(function(err) {
          console.error('[EC] Submit failed:', err);
        });
    } else {
      console.warn('[EC] No Firestore instance available');
    }
  } catch(e) {
    console.error('[EC] Firebase error:', e);
  }
}

function ecReset() {
  document.getElementById('ec-name').value = '';
  document.getElementById('ec-desc').value = '';
  document.getElementById('ec-type').value = 'common';
  document.getElementById('ec-dungeon').value = 'all';
  document.getElementById('ec-music').value = '';
  document.getElementById('ec-error').style.display = 'none';
  _ecCurrentStats = null;
  ecRollStats();
  document.getElementById('enemy-creator-form').style.display = '';
  document.getElementById('enemy-creator-success').style.display = 'none';
}

// ── COMMUNITY ENEMY SPAWNING ──
var _communityEnemyCache = [];
var _communityEnemyCacheTime = 0;
var COMMUNITY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadCommunityEnemies() {
  if (Date.now() - _communityEnemyCacheTime < COMMUNITY_CACHE_TTL && _communityEnemyCache.length) return;
  try {
    var snap = await window._fbDb.collection('community_enemies')
      .where('approved', '==', true)
      .limit(50)
      .get();
    _communityEnemyCache = snap.docs.map(function(d) {
      return Object.assign({ _id: d.id }, d.data());
    });
    _communityEnemyCacheTime = Date.now();
  } catch(e) {
    console.warn('[EC] Failed to load community enemies:', e);
  }
}

function getCommunityEnemy(dungeonName) {
  if (!_communityEnemyCache.length) return null;
  var eligible = _communityEnemyCache.filter(function(e) {
    return e.dungeon === 'all' || e.dungeon === dungeonName;
  });
  if (!eligible.length) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

function communityEnemyToFightData(ce) {
  // Convert Firebase enemy to in-game fight format
  return {
    name: ce.name,
    icon: ce.icon || '👤',
    hp: ce.hp,
    maxHp: ce.hp,
    atk: [Math.floor(ce.atk * 0.8), Math.floor(ce.atk * 1.2)],
    def: ce.def || 0,
    sp: 0,
    gold: Math.floor(ce.hp / 4),
    isCommunity: true,
    communityId: ce._id,
    creator: ce.creator,
    music: ce.music || null,
    desc: ce.desc
  };
}

function incrementCommunityKill(enemyId) {
  try {
    window._fbDb.collection('community_enemies').doc(enemyId).update({
      kills: firebase.firestore.FieldValue.increment(1)
    }).catch(function(){});
  } catch(e) {}
}

// Load community enemies on boot
try {
  window.addEventListener('load', function() {
    setTimeout(function() {
      try { loadCommunityEnemies(); } catch(e) {}
      try { initPresence(); } catch(e) {}
      try { cleanStalePresence(); } catch(e) {}
      try { initVoidReaper(); } catch(e) {}
    }, 3000);
  });
} catch(e) {}
