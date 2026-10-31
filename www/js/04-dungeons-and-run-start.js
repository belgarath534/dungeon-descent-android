//═════════════════
// THE SUNKEN ARCHIVES — 4th Dungeon
//═════════════════
var SUNKEN_ENEMIES = {
  t1: [
    { name:'Drowned Archivist',   icon:'📚', hp:26, atk:[4,9],   gold:[3,6] },
    { name:'Ink Wraith',          icon:'🖤', hp:20, atk:[5,10],  gold:[2,5] },
    { name:'Bloated Librarian',   icon:'📖', hp:30, atk:[4,8],   gold:[3,6] },
    { name:'Paper Shade',         icon:'📄', hp:18, atk:[4,9],   gold:[2,4] },
    { name:'Soggy Sentinel',      icon:'🧟', hp:28, atk:[4,8],   gold:[2,5] },
  ],
  t2: [
    { name:'Deep Cartographer',   icon:'🗺️', hp:45, atk:[7,13],  gold:[5,10] },
    { name:'Tide Golem',          icon:'🌊', hp:55, atk:[8,14],  gold:[6,11] },
    { name:'Drowned Scholar',     icon:'🎓', hp:40, atk:[7,14],  gold:[5,10] },
    { name:'Archive Specter',     icon:'👻', hp:38, atk:[8,15],  gold:[5,9]  },
    { name:'Leviathan Spawn',     icon:'🦑', hp:50, atk:[9,15],  gold:[6,12] },
  ],
  t3: [
    { name:'The Sunken Warden',   icon:'⚓', hp:80, atk:[12,20], gold:[10,18] },
    { name:'Grand Archivist',     icon:'📜', hp:75, atk:[11,19], gold:[9,16]  },
    { name:'Abyssal Colossus',    icon:'🌊', hp:90, atk:[13,22], gold:[11,20] },
    { name:'Drowned Chancellor',  icon:'🏛️', hp:70, atk:[12,19], gold:[9,17]  },
  ],
  bossPool: [
    { name:'The Drowned Curator', icon:'📚', hp:240, atk:[14,22], gold:[60,90],
      phaseMsg2:'The Curator\'s waterlogged form swells. Ink floods the chamber.',
      phaseMsg3:'Every book in the Archives screams at once. The Curator is what remains when knowledge drowns.' },
    { name:'Leviathan of the Deep', icon:'🦑', hp:260, atk:[16,24], gold:[65,95],
      phaseMsg2:'The Leviathan surfaces. The floor cracks beneath the weight of what it is.',
      phaseMsg3:'You realize it was always here. The Archives were built around it. Not on top of it. Around it.' },
    { name:'The Last Librarian',  icon:'📖', hp:220, atk:[13,21], gold:[55,85],
      phaseMsg2:'She remembers everyone who ever read here. She remembers that they all drowned.',
      phaseMsg3:'The pages of every book in the Archives turn at once. Her name is in all of them.' }
  ,
    { name:'The Drowned Archivist', icon:'📚', hp:128, atk:[15,24], gold:[31,51], isBoss:true, phaseMsg2:'The Archivist tears pages from every book at once — they become weapons!', phaseMsg3:'The forbidden pages ignite. Knowledge weaponized against you!' },
    { name:'Tide Sovereign',        icon:'🌊', hp:135, atk:[16,25], gold:[33,53], isBoss:true, phaseMsg2:'The Tide Sovereign floods the chamber — you fight knee deep in dark water!', phaseMsg3:'The water rises. He calls something from the deep!' }
  ]
};

var SUNKEN_ROOM_DESCS = [
  // Early (1-3)
  'Water laps at your ankles. The bookshelves stretch into darkness above, warped and bloated.',
  'A reading desk sits here, perfectly preserved. The candle on it is still lit. That is not possible.',
  'The water is perfectly still. Your reflection looks at you a half-second too late.',
  'Shelves of waterlogged texts line every wall. Something has been marking certain pages.',
  'A cataloguing system covers the ceiling, handwritten in ink that has not faded.',
  'The water here is darker. You cannot see the floor. You step forward anyway.',
  'An open book floats past. The pages are blank until you look at them. Then filled. Then blank.',
  'This chamber smells of salt and old paper. You are very deep and very far from any ocean.',
  'Something large passed through recently. The displaced water still moves.',
  'A reading chair sits in the center, facing away. It is occupied. Then it is not.',
  'Thousands of index cards cover every surface. None of the books are where they say.',
  'The torches here burn blue. The shadows are too defined.',
  'A door of waterlogged wood. The handle is a hand. A real one. Reaching from the other side.',
  'Bookshelves reach into the flooded ceiling, continuing upward into total submersion.',
  'The water here tastes of ink. You close your mouth. You have already swallowed.',
  'A librarian\'s desk, still organized. The appointment book is open to today.',
  'You hear pages turning. Somewhere. The sound is deliberate.',
  'Books float in neat rows, spine up. Organized by something. Not by size. Not by color.',
  'The floor is tile. Under the water, you can read words in the grout between tiles.',
  'A filing cabinet, open, empty. The drawer opened toward you on its own.',
  // Mid (4-6)
  'The deeper shelves contain books that have absorbed the water completely. They are the water now.',
  'Something has been reading here. The chair is warm. In cold, deep water, it is warm.',
  'A card catalogue cabinet, infinite rows, every card blank. Recently blank.',
  'The water here moves against the current. Against any current. It moves toward a specific shelf.',
  'A reading light, still on, still bright, still casting shadows of books that are not there.',
  'The Archives remember you. You feel it in the water pressure. Adjusting.',
  'Every book on one wall is open to the same page. You cannot read what is on that page.',
  'A globe in the corner shows a world with more oceans than yours.',
  'The index system covers everything here. Including a card for you. You do not read it.',
  'Something enormous is shelved in the back of this room. It breathes.',
  'The water level rises as you stand here. Slowly. Deliberately.',
  'A single book on a pedestal, under glass. The glass is broken from the inside.',
  'Chains hang from the ceiling. Books are chained to the chains. The books pull upward.',
  'You hear a checkout stamp. Somewhere. The sound of a book being claimed.',
  'The current in the water spells a word. You look away before you read it.',
  // Deep (7+)
  'At this depth, the Archives do not archive knowledge. They archive everything.',
  'The Leviathan has been through this room. The shelves curved around it.',
  'Every book here is a record of something that should not have been recorded.',
  'The water at this depth is not water. It is accumulated memory.',
  'You feel catalogued. Something just filed you under a heading you cannot pronounce.',
  'The lighting at this depth comes from the books themselves. They are not happy about it.',
  'This deep, the Archives know you are here. They have updated your entry.',
  'A door that opens to more water. Then more shelves. Then something looking back.',
  'The restricted section is not a place. It is a state of mind. You are in it.',
  'Something has been here for so long it has become part of the collection.',
  'The Curator\'s presence is here. Not her body. Her intent. Her organization.',
  'Every surface is catalogued. Including your face. Including the inside of your face.',
  'The Archives contain the last thought of every person who drowned here.',
  'At the deepest point, the water is still. The stillness has texture.',
  'You are being cross-referenced. The filing never stops. Not even now.',
];

var SUNKEN_FLOOR_NAMES = {
  1:'The Entry Hall', 2:'The Cataloguing Room', 3:'The Reading Chambers',
  4:'The Map Repository', 5:'The Restricted Section', 6:'The Deep Stacks',
  7:'The Flooded Annex', 8:'The Curator\'s Quarters', 9:'The Abyss Level',
  10:'The Grand Repository'
};

var SUNKEN_LOOT = [
  { name:'Waterlogged Sword',   icon:'🗡️', type:'weapon', atkBonus:4, gold:0,   desc:'Heavy but sharp. Still effective.' },
  { name:'Barnacle Shield',     icon:'🛡️', type:'armor',  defBonus:3, gold:0,   desc:'Thick with centuries of ocean growth.' },
  { name:'Sunken Ring',         icon:'💍', type:'ring',   effect:'sp', gold:0,  desc:'+8 SP when equipped.' },
  { name:'Archivist\'s Seal',   icon:'📜', type:'ring',   effect:'atk', gold:0, desc:'+3 attack. The seal of office.' },
  { name:'Depth Charge',        icon:'💣', type:'gem',    gold:18,       desc:'Worth 18 gold.' },
  { name:'Pearl of the Deep',   icon:'🦪', type:'gem',    gold:25,       desc:'Worth 25 gold. Still warm somehow.' },
  { name:'Inkstone',            icon:'🖤', type:'gem',    gold:14,       desc:'Worth 14 gold. Black as void.' },
  { name:'Elixir of the Depths', icon:'💧', type:'elixir', healPct:0.60, desc:'Restores 60% of max HP. Drawn from an eternal spring below the Archives.' },
];

// Sunken Archives lore fragments — found when searching rooms
var SUNKEN_LORE_FRAGMENTS = [
  { id:'sl-1', name:'Page 1 of the Founding Record',
    text:'The Archives were established in the year of the Second Tide. We chose this location because the water preserves. The Chancellor said nothing drowns here. The Chancellor has not been seen in forty years.' },
  { id:'sl-2', name:'A Cataloguer Log',
    text:'Day 847. Found another section today that does not appear on any map of the building. The books there are in perfect condition. I cannot read the title of a single one. They seem different each time I look.' },
  { id:'sl-3', name:'Torn Research Note',
    text:'The Leviathan arrived three hundred years before the Archives were built. We built around it. This was not a choice. This was the only option. You cannot move something that has always been there.' },
  { id:'sl-4', name:'The Last Curator Manifesto',
    text:'I have been here long enough to understand. The Archives do not preserve knowledge. The Archives preserve everything. Every thought that has ever been thought in this place still exists here. That includes the bad ones.' },
  { id:'sl-5', name:'Expedition Journal — Final Entry',
    text:'The water is rising again. This happens twice a year. The books do not get wet. The researchers do. I have stopped questioning this. I have stopped questioning most things. It is easier.' },
  { id:'sl-6', name:'Classification Record — Item 7,891',
    text:'Item: Unknown. Origin: Unknown. Date catalogued: Unknown. Current location: Unknown. Notes: Do not look for it. It will find the catalog entry on its own. This is fine. This has always been fine.' },
  { id:'sl-7', name:'A Child Drawing',
    text:'[A drawing of the Archives, rendered in faded ink. Everything is accurate — the shelves, the reading desks, the flooded floors — except in the drawing, every bookshelf has eyes. In the corner, in small handwriting: I found the special section. I did not come back out the same way I went in. This is an improvement.]' },
  { id:'sl-8', name:'The Archivist Oath — Partial',
    text:'...and I swear to preserve what is written, to catalog what is found, to shelve what arrives, and to ask no questions about where it came from. The Archives hold all knowledge. Some of it is knowledge of things that should not be known. This is not my concern. My concern is correct shelving procedure.' },
];

var SUNKEN_SHOP_STOCK = [
  { name:'Salt Potion',          icon:'🧪', type:'potion',   heal:45,  cost:14, desc:'Deep sea healing. Restores 45 HP.' },
  { name:'Abyss Draught',        icon:'💊', type:'potion',   heal:90,  cost:26, desc:'From the deepest shelf. Restores 90 HP.' },
  { name:'Inkwell Tonic',        icon:'🖤', type:'sp-potion', sp:20,   cost:16, desc:'Pure concentrated knowledge. +20 SP.' },
  { name:'Waterlogged Blade',    icon:'🗡️', type:'weapon',  atkBonus:5, cost:30, desc:'Heavy but devastating. +5 attack.' },
  { name:'Barnacle Armor',       icon:'🛡️', type:'armor',   defBonus:4, cost:28, desc:'Ancient oceanic protection. +4 defense.' },
  { name:'Pearl of Power',       icon:'🦪', type:'atk-potion', atk:5, cost:22, desc:'Permanent +5 attack this run.' },
];


// ── ELITE ENEMIES — rare powerful spawns, ~12% chance mid-dungeon ──
var ELITE_ENEMIES = {
  'Crypt of Malachar': [
    { name:'Ancient Death Knight', icon:'⚔️', hp:90,  atk:[14,22], gold:[20,35], isElite:true, ability:'Unholy Aura — reduces your defense by 2 on hit.' },
    { name:'The Eternal Warden',   icon:'🛡️', hp:100, atk:[12,20], gold:[22,38], isElite:true, ability:'Unyielding — takes only 70% damage from all attacks.' },
    { name:'Crypt Champion',       icon:'💀', hp:85,  atk:[15,24], gold:[18,32], isElite:true, ability:'Battle Hardened — heals 10 HP each turn.' },
  ],
  'The Ashbound Wastes': [
    { name:'Ash Titan',            icon:'🔥', hp:95,  atk:[15,24], gold:[22,38], isElite:true, ability:'Inferno — deals 8 burn damage per turn after hit.' },
    { name:'Vel Ashara Chosen',    icon:'🌋', hp:88,  atk:[14,23], gold:[20,35], isElite:true, ability:'Fire Shield — reflects 20% of damage back to attacker.' },
    { name:'The Undying Flame',    icon:'♨️', hp:92,  atk:[13,22], gold:[21,36], isElite:true, ability:'Reignite — returns to 30 HP once per combat when killed.' },
  ],
  'Frosthold Abyss': [
    { name:'Glacier Warden',       icon:'🧊', hp:98,  atk:[13,21], gold:[22,38], isElite:true, ability:'Deep Freeze — freezes you for 1 turn on hit, 25% chance.' },
    { name:'The Frost Sovereign',  icon:'❄️', hp:92,  atk:[14,23], gold:[21,36], isElite:true, ability:'Ice Armor — reduces all incoming damage by 25%.' },
    { name:'Abyssal Hunter',       icon:'🐺', hp:86,  atk:[15,25], gold:[20,34], isElite:true, ability:'Pack Leader — gains +3 attack for each floor descended.' },
  ],
  'The Sunken Archives': [
    { name:'The Head Archivist',   icon:'📚', hp:94,  atk:[13,22], gold:[22,38], isElite:true, ability:'Forbidden Knowledge — reduces your SP by 8 on each hit.' },
    { name:'Leviathan Scout',      icon:'🦑', hp:100, atk:[14,24], gold:[24,40], isElite:true, ability:'Ink Blast — blinds you, 35% miss chance for 2 turns.' },
    { name:'Drowned Paladin',      icon:'⚓', hp:90,  atk:[13,21], gold:[20,35], isElite:true, ability:'Righteous Tide — heals 15 HP and deals 10 bonus damage on attack.' },
  ],
  'Nightmare': [
    { name:'The First Fear',       icon:'😱', hp:110, atk:[18,28], gold:[30,50], isElite:true, ability:'Primal Terror — reduces your attack by 4 for 3 turns.' },
    { name:'Void Champion',        icon:'🌑', hp:105, atk:[17,27], gold:[28,48], isElite:true, ability:'Void Touched — ignores all your defense bonuses.' },
    { name:'The One That Watches', icon:'👁️', hp:95,  atk:[19,30], gold:[32,52], isElite:true, ability:'Always Watching — gains +5 attack each phase.' },
  ],
  'The Hollow': [
    { name:'The Hollow Patriarch', icon:'🎩', hp:105, atk:[16,25], gold:[22,38], isElite:true, ability:'Head of the House — all enemies gain +15% HP while he lives.' },
    { name:'The Séance Master',    icon:'🕯️', hp:95,  atk:[18,27], gold:[24,40], isElite:true, ability:'Commune with the Dead — summons a spirit each turn for 5 damage.' },
    { name:'The Hollow Architect', icon:'🏚️', hp:100, atk:[15,24], gold:[20,36], isElite:true, ability:'Built This House — cannot be killed in fewer than 3 hits.' },
  ],
  'The Infernal Descent': [
    { name:'The Infernal Warden',  icon:'🔥', hp:130, atk:[22,32], gold:[35,55], isElite:true, ability:'Hellfire Aura — deals 10 fire damage per turn to you.' },
    { name:'Archon of Ash',        icon:'🌋', hp:120, atk:[20,30], gold:[32,50], isElite:true, ability:'Volcanic Rage — gains +5 ATK each time it takes damage.' },
    { name:'The Branded One',      icon:'☠️', hp:115, atk:[24,35], gold:[38,58], isElite:true, ability:'Mark of the Infernal — reduces your max HP by 10 on hit.' },
  ],
  'The Abyssal Deep': [
    { name:'The Pale Leviathan',   icon:'🤍', hp:150, atk:[25,38], gold:[45,70], isElite:true, ability:'Calls one Tide Wraith every 3 turns.' },
    { name:'Void Colossus',        icon:'🌑', hp:140, atk:[22,35], gold:[42,65], isElite:true, ability:'Abyss Crush — ignores 50% of your defense on every attack.' },
    { name:'The Deep Archivist',   icon:'📿', hp:135, atk:[20,32], gold:[40,62], isElite:true, ability:'Ancient Curse — reduces your ATK by 3 permanently until you rest.' },
  ],
};

// Elite spirits — earned by defeating elite enemies (rare drop)
var ELITE_SPIRITS = [
  { id:'death-knight-spirit', name:'Knight Shade',      icon:'⚔️', rarity:'elite',
    desc:'The spirit of a fallen Death Knight. Powerful and relentless.',
    ability:'Attacks for 30% damage every turn. On kill restores 5 HP.',
    passiveDesc:'Undying Fury',
    onAttack: function(b){ return Math.round(b*0.30); },
    onCombatStart: null,
    onKill: function(){ DS.hp=Math.min(DS.maxHp,DS.hp+5); updatePlayerBar(); addLog('Knight Shade channels the fallen — +5 HP!'); } },
  { id:'ash-titan-spirit',    name:'Titan Ember',       icon:'🔥', rarity:'elite',
    desc:'The essence of an Ash Titan. Burns with eternal fury.',
    ability:'At combat start applies 3-turn burn. Attacks for 25% fire damage.',
    passiveDesc:'Titan Flame',
    onAttack: function(b){ return Math.round(b*0.25); },
    onCombatStart: function(){ DS.venomTurns=Math.max(DS.venomTurns||0,3); addLog('Titan Ember ignites the enemy — burning!'); },
    onKill: null },
  { id:'frost-sovereign-spirit', name:'Frost Crown',   icon:'❄️', rarity:'elite',
    desc:'A crown of living ice from the Frost Sovereign.',
    ability:'Grants +5 defense at combat start. Attacks for 20% ice damage.',
    passiveDesc:'Ice Dominion',
    onAttack: function(b){ return Math.round(b*0.20); },
    onCombatStart: function(){ DS.defBonus+=5; fxGet().fightDef += 5; addLog('Frost Crown hardens your defenses. +5 defense for this fight!'); },
    onKill: null },
  { id:'archivist-spirit',    name:'Archive Phantom',   icon:'📜', rarity:'elite',
    desc:'The ghost of a drowned archivist. Knows every weakness.',
    ability:'Attacks for 28% damage. Each hit reduces enemy defense by 1.',
    passiveDesc:'Exposed Knowledge',
    onAttack: function(b){
      if(DS.enemy){ DS.enemy.atk=DS.enemy.atk.map(function(v){return Math.max(1,v-1);}); }
      return Math.round(b*0.28);
    },
    onCombatStart: null, onKill: null },
  { id:'void-champion-spirit', name:'Void Herald',     icon:'🌑', rarity:'elite',
    desc:'A fragment of the Void Champion. Terrifyingly powerful.',
    ability:'Attacks for 40% damage every turn. Requires level 7.',
    passiveDesc:'Void Strike',
    onAttack: function(b){ return Math.round(b*0.40); },
    onCombatStart: null, onKill: null, minLevel: 7 },
];


//═════════════════
// THE HOLLOW — 5th Dungeon (Horror)
//═════════════════
var HOLLOW_ENEMIES = {
  t1: [
    { name:'The Parlor Guest',    icon:'🪑', hp:28, atk:[5,10],  gold:[3,6],  desc:'It has been sitting in that chair since the house was built. It does not appreciate visitors.', hollowSit:true },
    { name:'Hollow Bride',        icon:'👰', hp:24, atk:[5,11],  gold:[2,5],  desc:'Still waiting. Still dressed. The flowers she carries are long dead. She is not.', hollowCharm:true },
    { name:'The Portrait',        icon:'🖼️', hp:20, atk:[6,12],  gold:[2,4],  desc:'It watches from the wall. Every turn it watches, its next attack gets stronger.', hollowWatch:true },
    { name:'Creaking Step',       icon:'🪜', hp:18, atk:[5,11],  gold:[2,4],  desc:'You hear it before you see it. By the time you see it, it is already too late to flee.', preventFlee:true },
    { name:'The Reflection',      icon:'🪞', hp:22, atk:[6,11],  gold:[2,5],  desc:'It copies your last action. Attack and it attacks. Defend and it heals.', reflection:true },
    { name:'The Uninvited Guest', icon:'🧍', hp:26, atk:[6,12],  gold:[3,6],  isUninvited:true, desc:'Nobody invited it. Nobody can make it leave.' },
    { name:'The Twin',            icon:'👤', hp:30, atk:[5,11],  gold:[3,6],  isTwin:true, desc:'It looks exactly like you. It knows exactly what you will do next.' },
    { name:'The Risen',           icon:'🧟', hp:32, atk:[5,10],  gold:[3,7],  hollowZombie:true, desc:'It was buried in the grounds. It did not stay buried. It never does.' },
  ],
  t2: [
    { name:'The Door Warden',     icon:'🚪', hp:48, atk:[9,16],  gold:[6,11], desc:'It guards every exit. Flee attempts automatically fail while it lives.', preventFlee:true },
    { name:'The Music Box',       icon:'🎵', hp:38, atk:[7,12],  gold:[8,14], isMusicBox:true, desc:'When it plays, you cannot help but listen. Forces you to defend for one turn.' },
    { name:'The Groundskeeper',   icon:'⚰️', hp:52, atk:[9,15],  gold:[5,10], desc:'It has maintained these grounds for three hundred years. It takes its job very seriously.', hollowGround:true },
    { name:'Hollow Groom',        icon:'🤵', hp:44, atk:[9,16],  gold:[5,10], desc:'He waited at the altar for forty years. The anger calcified into something worse.', hollowGroom:true },
    { name:'The Bell Ringer',     icon:'🔔', hp:40, atk:[10,17], gold:[5,9],  desc:'When the bell rings your turn is skipped. It always rings on the second turn.', hollowBell:true },
    { name:'The Wall Crawler',    icon:'🧱', hp:55, atk:[8,15],  gold:[6,11], desc:'It moves on the ceiling. Every other attack comes from above — impossible to block.', hollowCrawl:true },
    { name:'The Pale Guest',      icon:'🧛', hp:50, atk:[10,17], gold:[6,12], hollowVampire:true, desc:'It has not eaten in a long time. You can tell by the way it looks at you.' },
  ],
  t3: [
    { name:'The Oldest Guest',    icon:'💀', hp:82, atk:[13,21], gold:[10,18], desc:'It arrived before the house existed. It will be here after it falls.', immuneFirstHit:true },
    { name:'The Hollow Matron',   icon:'👵', hp:76, atk:[12,20], gold:[9,16],  desc:'She ran this house. She still does. All enemies deal 10% more damage while she lives.', hollowMatron:true },
    { name:'The Caretaker',       icon:'🗝️', hp:88, atk:[13,22], gold:[11,19], desc:'It has a key to every room. Including the ones that should not exist.', grows:true },
    { name:'The Unfinished',      icon:'👻', hp:70, atk:[12,20], gold:[9,17],  hollowGhost:true, desc:'It did not finish what it started. It is still trying. Your attacks pass through it half the time.' },
  ],
  bossPool: [
    { name:'The Grieving One',    icon:'😭', hp:250, atk:[15,24], gold:[70,100],
      phaseMsg2: 'The Grieving One remembers something. The temperature drops. It hits harder now.',
      phaseMsg3: 'It is not grief anymore. It is something grief becomes when it has nowhere to go for long enough.' },
    { name:'The House Itself',    icon:'🏚️', hp:270, atk:[14,23], gold:[65,95],
      phaseMsg2: 'The walls close in. The house is not a location. The house is an entity. It has decided you are staying.',
      phaseMsg3: 'Every room is the same room now. You are in all of them at once.' },
    { name:'The Last Resident',   icon:'🕯️', hp:240, atk:[13,22], gold:[60,90],
      phaseMsg2: 'It has been alone here for a very long time. It does not want to be alone anymore.',
      phaseMsg3: 'It offers you a choice: stay, or face what staying means.' }
  ,
    { name:'The Wedding Ghost',     icon:'👰', hp:122, atk:[14,23], gold:[30,50], isBoss:true, phaseMsg2:'She removes her veil. What is underneath is not a face.', phaseMsg3:'She begins to sing. The song pulls at something inside you.' },
    { name:'The Portrait Lord',     icon:'🖼️', hp:130, atk:[15,25], gold:[32,52], isBoss:true, phaseMsg2:'The Portrait Lord steps OUT of the frame. He should not be able to do that.', phaseMsg3:'Reality tears where he walks. He was never meant to exist here.' }
  ],
  weeingChild: { name:'The Weeping Child', icon:'😢', hp:45, atk:[12,20], gold:[15,25],
    desc:'Something small sits in the corner of the room. It is crying. You do not know why. You are not sure you want to.' },
  weepingMother: { name:'The Weeping Mother', icon:'👩', hp:80, atk:[16,26], gold:[25,40],
    desc:'She is looking for something. You can hear it in the way she moves through the house. She has been looking for a very long time.' }
};

var HOLLOW_ROOM_DESCS = [
  // Early (1-3)
  'The wallpaper peels in long strips. Something is written underneath in a handwriting you do not recognize.',
  'A dining table set for twelve. Dust covers everything except one place setting, which is clean.',
  'The grandfather clock in the corner has stopped. The pendulum moves anyway.',
  'Children\'s drawings cover every wall. They all depict the same figure watching where you stand.',
  'A fireplace burns without wood. The shadows it casts go in the wrong direction.',
  'The mirror at the end of the hall shows this room. You are not in it.',
  'Music plays from a room that does not exist on any floor plan. It gets louder anyway.',
  'A guest book lies open. The most recent entry is dated today. It is your name.',
  'The nursery. The crib is empty. Whatever was in it did not leave through the door.',
  'The basement stairs. Something is at the bottom. It knows you are at the top.',
  'Every clock in this room shows a different time. None of them are now.',
  'The lights work. This is somehow more frightening than if they did not.',
  'A rocking chair moves slowly. The window behind it is closed. There is no draft.',
  'Family portraits line the walls. The subjects\' eyes track your movement.',
  'The kitchen. Everything is set to prepare a meal. No one is preparing it.',
  'A locked room at the end of the hall. The key is in the lock. On the inside.',
  'The upstairs hallway. All the doors are closed except the one at the end.',
  'Toys arranged on the floor in a pattern. A warning or a welcome. You cannot tell.',
  'A record player, winding down. You did not touch it. It was going when you arrived.',
  'The smell of a meal cooking. No stove. No heat. No source.',
  // Mid (4-6)
  'The house has been expecting you. You feel it in the way the floorboards know your weight.',
  'A phone on the wall rings. You answer. The sound on the other end is breathing. Yours.',
  'The same room you were in before. Identical. But the door is on a different wall.',
  'A child\'s laughter. Above. Below. All around. Gone before you turn.',
  'The living room. Something has been living in it that is not alive.',
  'Handprints in the dust on the mantle. Smaller than an adult. Smaller than a child.',
  'A sewing basket, mid-project. The needle still threaded. The work unfinished for reasons.',
  'The windows show a different yard than the house should have. Different sky.',
  'A door that opens to a wall. Beyond the wall, someone breathes.',
  'Old mail on the floor. Addressed to you. Postmarked before you were born.',
  'The attic stairs. The pull-cord sways. Someone just came down.',
  'Every chair in this room faces the same corner. Nothing is in the corner.',
  'A typewriter. Mid-sentence. The sentence is about you.',
  'The study. All the books have been opened, read, and replaced. Recently.',
  'A doll sits in the center of the room. The doll\'s head turns as you cross the threshold.',
  // Deep (7+)
  'The house has stopped pretending. It knows you know. You both drop the act.',
  'At this depth, the Hollow shows what it is. A hunger wearing the shape of a home.',
  'The wallpaper shows scenes. Moving scenes. Scenes from outside this dungeon.',
  'The walls breathe. Slowly. The house is alive. It has always been alive.',
  'Every room now opens to this room. You are in the center of something vast.',
  'The family that lived here is still here. They are very glad you came.',
  'The house remembers every tenant. It never lets any of them go.',
  'The Heart of the Hollow beats somewhere below your feet. You can feel it.',
  'The rooms repeat now. Different order. Different layout. The same dread.',
  'The Hollow has been waiting for someone specific. You are wondering if it is you.',
  'The shadows here are older than the house. The house was built around them.',
  'At the deepest point, the house and the dungeon are the same thing.',
  'Nothing in this room is real. Everything in this room is very, very dangerous.',
  'The house shows you rooms from your memory. Accurate rooms. Private rooms.',
  'The Hollow is complete. You are inside something that is complete and alive and watching.',
];

var HOLLOW_FLOOR_NAMES = {
  1:'The Foyer', 2:'The Parlor', 3:'The Study', 4:'The Dining Room',
  5:'The Gallery', 6:'The Nursery', 7:'The Attic', 8:'The Basement',
  9:'The Room at the End', 10:'The Heart of the Hollow'
};

var HOLLOW_LOOT = [
  { name:'Tarnished Blade',    icon:'🗡️', type:'weapon', atkBonus:5, gold:0,  desc:'Found in the study. Still sharp.' },
  { name:'Black Veil',         icon:'🩶', type:'armor',  defBonus:4, gold:0,  desc:'Absorbs more than light.' },
  { name:'The Last Candle',    icon:'🕯️', type:'ring',   effect:'sp', gold:0, desc:'+10 SP. Do not let it go out.' },
  { name:'Mourning Ring',      icon:'💍', type:'ring',   effect:'atk', gold:0, desc:'+3 attack. Cold to the touch.' },
  { name:'Old Locket',         icon:'💛', type:'gem',    gold:20,       desc:'Worth 20 gold. Something inside it moves.' },
  { name:'Funeral Coin',       icon:'🪙', type:'gem',    gold:15,       desc:'Worth 15 gold. Not currency from any known place.' },
  { name:'Hollow Elixir',     icon:'🩶', type:'elixir', healPct:0.55,  desc:'Restores 55% of max HP. Left behind by someone who no longer needs it.' },
];

var HOLLOW_SHOP_STOCK = [
  { name:'Mourning Tonic',      icon:'🖤', type:'potion',   heal:50,  cost:16, desc:'Strange comfort. Restores 50 HP.' },
  { name:'Hollow Flask',        icon:'🫙', type:'sp-potion', sp:25,   cost:18, desc:'Empty but effective. +25 SP.' },
  { name:'Grief Ward',          icon:'🩶', type:'armor',   defBonus:5, cost:30, desc:'Carries old sorrow. +5 defense.' },
  { name:'The Caretaker Blade', icon:'🗡️', type:'weapon',  atkBonus:6, cost:34, desc:'+6 attack. Kept very sharp.' },
  { name:'Spirit Binding',      icon:'🕯️', type:'atk-potion', atk:5, cost:22, desc:'Permanent +5 attack this run.' },
  { name:'Cursed Heirloom',     icon:'💀', type:'cursed',   cost:4,   desc:'Family property. Unpredictable effects.' },
];

// ── INFERNAL DUNGEON ENEMIES ──
var INFERNAL_ENEMIES = {
  t1: [
    { name:'Void Shadow',      icon:'👤', hp:20, atk:[5,10],  gold:[3,6],  desc:'A formless shape that drains courage.' },
    { name:'Void Wisp',        icon:'🔵', hp:16, atk:[4,8],   gold:[2,5],  desc:'Tiny. Harmless alone. Never alone.', onDeathHeavy: true },
    { name:'Infernal Ember',   icon:'🔥', hp:24, atk:[5,9],   gold:[3,6],  burn:2, burnTurns:3, desc:'Leaves burning wounds on every hit.' },
    { name:'Shadow Creep',     icon:'🌑', hp:18, atk:[4,9],   gold:[2,5],  dodgeEvery:3, desc:'Phases in and out of reality.' },
    { name:'Void Husk',        icon:'💀', hp:38, atk:[3,6],   gold:[3,7],  desc:'Empty shell. Barely alive. Barely dead.' },
    { name:'Dark Tendril',     icon:'🪱', hp:22, atk:[5,10],  gold:[2,5],  atkDebuff:2, desc:'Wraps around you, weakening your strikes.' },
    { name:'Void Caller',      icon:'📯', hp:26, atk:[4,8],   gold:[3,6],  summonCounter:0, desc:'Screams into the void. If alive after 3 turns, something answers.' },
    { name:'Sin Eater',        icon:'😈', hp:22, atk:[4,9],   gold:[3,6],  drainsSP:true, desc:'Feeds on guilt and spirit energy both. The descent is a feast for it.' },
    { name:'Brimstone Hound',  icon:'🐕', hp:18, atk:[5,10],  gold:[2,5],  burn:2, burnTurns:2, desc:'Guard dogs of the descent. Bred for loyalty. Currently very hungry.' },
  ],
  t2: [
    { name:'Void Wraith',      icon:'👻', hp:52, atk:[10,18], gold:[6,12], desc:'Screams that only you can hear.' },
    { name:'Void Stalker',     icon:'👁️', hp:44, atk:[9,16],  gold:[5,11], grows:true, desc:'Gets stronger every turn it stays alive.' },
    { name:'Infernal Brute',   icon:'👹', hp:60, atk:[14,22], gold:[7,13], slowAtk:true, desc:'Devastating power. Attacks every other turn only.' },
    { name:'The Hollow One',   icon:'⬛', hp:48, atk:[8,14],  gold:[5,10], drainsSP:true, desc:'Feeds on your spirit energy instead of your blood.' },
    { name:'Soul Eater',       icon:'😈', hp:46, atk:[9,16],  gold:[6,11], lifesteal:true, desc:'Heals itself with every strike against you.' },
    { name:'Void Phantom',     icon:'🌫️', hp:42, atk:[10,17], gold:[5,10], dodgeChance:0.30, desc:'Thirty percent chance to phase through any attack.' },
    { name:'Dark Priest',      icon:'🧙', hp:50, atk:[8,15],  gold:[6,12], buffsOnTurn1:true, desc:'Empowers itself before striking. Kill it fast.' },
    { name:'Chain Wraith',     icon:'⛓️', hp:50, atk:[9,16],  gold:[6,11], atkDebuff:3, desc:'Chains wrap around your arms. Your attack drops with every turn it lives.' },
    { name:'Infernal Herald',  icon:'📯', hp:46, atk:[8,14],  gold:[5,11], summonCounter:0, desc:'Announces your arrival to something worse. If alive after 3 turns, it answers.' },
  ],
  t3: [
    { name:'Void Sentinel',    icon:'🗿', hp:72, atk:[13,22], gold:[10,18], immuneFirstHit:true, desc:'The first blow glances off. The second does not.' },
    { name:'Infernal Champion',icon:'⚔️', hp:68, atk:[12,20], gold:[9,17],  doubleStrike:true, desc:'Strikes twice per turn. Never stops.' },
    { name:'The Nameless',     icon:'❓', hp:76, atk:[11,21], gold:[11,19], hiddenName:true, desc:'No name. No origin. Just hunger.' },
    { name:'Void Reaper Spawn',icon:'💀', hp:110, atk:[14,22], gold:[12,20], drainHpSp:true, desc:'A fragment of the true Void Reaper. Still terrifying.' },
    { name:'Shadow Architect', icon:'🏗️', hp:80, atk:[12,20], gold:[10,18], splitsAt50:true, desc:'Splits into two at half HP. Both copies fight on.' }
  ],
  elites: [
    { name:'The Void King',    icon:'👑', hp:150, atk:[16,26], gold:[20,35], isElite:true, eliteAbility:'Drain — steals 8 HP from you every turn.', desc:'A king of nothing. Ruler of the dark between stars.' },
    { name:'Infernal Overlord',icon:'🔱', hp:140, atk:[18,28], gold:[18,32], isElite:true, eliteAbility:'Overwhelm — hits for massive damage but skips every other turn.', desc:'Ancient. Patient. Inevitable.' }
  ],
  boss: {
    name:'The Hard Void', icon:'🌑', hp:200, atk:[16,24], gold:[40,60], isBoss:true,
    phase2Hp: 100, phase3Hp: 50,
    desc:'It is not an enemy. It is what remains when everything else is gone.'
  },
  bossPool: [
    {
      name:'The Hard Void', icon:'🌑', hp:200, atk:[16,24], gold:[40,60], isBoss:true,
      phase2Hp:100, phase3Hp:50,
      phase1Desc:'The Void watches you. It has not yet decided what you are.',
      phase2Desc:'THE VOID SHIFTS. Phase 2 begins. It has decided.',
      phase3Desc:'FINAL PHASE. The Void consumes. Find its weakness.',
      weakPoints:['heavy','attack','skill'],
      desc:'It is not an enemy. It is what remains when everything else is gone.'
    },
    {
      name:'The Infernal Architect', icon:'🔱', hp:180, atk:[15,23], gold:[38,58], isBoss:true,
      phase2Hp:90, phase3Hp:45,
      phase1Desc:'It built this place. It has been waiting for you specifically.',
      phase2Desc:'THE ARCHITECT RISES. It begins to unmake the dungeon around you.',
      phase3Desc:'FINAL PHASE. The architecture collapses inward. Survive.',
      weakPoints:['heavy','attack','skill'],
      desc:'The dungeon IS the Architect. You have been inside it the whole time.'
    },
    {
      name:'The Void Sovereign', icon:'👑', hp:190, atk:[14,25], gold:[39,59], isBoss:true,
      phase2Hp:95, phase3Hp:47,
      phase1Desc:'It ruled the dark long before the first dungeon was built.',
      phase2Desc:'THE SOVEREIGN AWAKENS. It remembers you from a previous life.',
      phase3Desc:'FINAL PHASE. It reaches into you and pulls.',
      weakPoints:['heavy','attack','skill'],
      desc:'You have faced kings before. Not like this.'
    }
  ,
    { name:'The Void Sovereign',    icon:'👑', hp:155, atk:[18,28], gold:[38,58], isBoss:true, phaseMsg2:'The Void Sovereign discards his crown. He does not need symbols of power.', phaseMsg3:'He reaches into you and pulls. Something inside resists.' },
    { name:'Malchar Reborn',        icon:'💀', hp:148, atk:[17,27], gold:[37,57], isBoss:true, phaseMsg2:'He was never truly dead. He was waiting. For you specifically.', phaseMsg3:'The mask falls. Malchar Reborn is something the dungeon itself fears.' }
  ]
};

var INFERNAL_ROOM_DESCS = [
  // Early (1-3)
  'The darkness here is not an absence of light. It is a presence that chooses.',
  'Something breathes in the corner. When you look, nothing. When you look away, it breathes.',
  'The floor is warm. You do not investigate why.',
  'A voice says your name. You are alone. Both of these things are true.',
  'The walls are the wrong distance apart. You notice but cannot explain it.',
  'You have been here before. You have never been here. Both are true.',
  'The silence has weight. It presses against your chest.',
  'Something left marks at eye level. You are not the right height for them.',
  'The air smells like something that has not existed for a very long time.',
  'Your shadow moves before you do.',
  'There are doors here that were not here a moment ago.',
  'The darkness watches you with what might be curiosity.',
  'Something in the room is counting. You cannot find what.',
  'You hear your own footsteps from a different direction.',
  'A doorway opens in a wall that was solid a moment ago. The room beyond is darker.',
  'The room is colder on the inside. Not from the outside. From within.',
  'Three paths. All of them go to the same place. The place is not where any of them should go.',
  'The air shimmers. Not heat. Something else. The shimmering watches back.',
  'Something has recently stood exactly where you are standing. The floor remembers.',
  'Your torch dims to nothing then brightens. It did not run out. It was dimmed.',
  // Mid (4-6)
  'The walls here pulse. Not visibly. You feel it in your teeth.',
  'A corridor you did not enter this way. You entered from the other direction. Didn\'t you.',
  'Something shifts in the peripheral. Always peripheral. Never center.',
  'The room has no sharp edges. Everything is slightly curved. Slightly wrong.',
  'A door that looks like it leads up opens to reveal another down.',
  'You feel observed. Not from the room. From inside the room.',
  'Time moves differently here. You have been in this room for a moment. Or an hour.',
  'The floor gives slightly under pressure. Not from weight. From expectation.',
  'The dark here is not black. It is a color you do not have a name for.',
  'An intersection of three halls. All of them end at the same room. This room.',
  'Something is being decided about you. You are not part of the decision.',
  'The ceiling drips. The drops hang suspended and never fall.',
  'You realize you have stopped blinking. You do not know when that happened.',
  'A presence circles the room. Not walking. Not flying. Simply present in different spots.',
  'Your heartbeat echoes. Slightly off rhythm. Not yours.',
  // Deep (7+)
  'At this depth, the Infernal is not a dungeon. It is a conclusion.',
  'The dark here is aware. Specifically, deliberately, personally aware.',
  'Everything that has ever been feared ended up here eventually.',
  'The walls are made of accumulated dread. Every explorer fed them.',
  'You can feel every previous visitor. Their paths are grooves in the space here.',
  'The Void is not below you. It is all around you. It has always been all around you.',
  'Something ancient lives at this depth. It is not an enemy. It is the reason for enemies.',
  'The room is not trying to frighten you. It simply is what it is. That is worse.',
  'At the deepest point, there is no room. There is a thing that looks like a room.',
  'The darkness here has texture. You feel it against your skin.',
  'Everything is still. Not dead-still. Waiting-still. Deciding-still.',
  'The Infernal remembers why it was made. You are the reason. You specifically.',
  'You cannot tell how large this room is. The measurements keep changing.',
  'The thing that lives here is not evil. It is honest. That is worse than evil.',
  'You are at the end of something. You do not know what. The room knows.',
];

var INFERNAL_FLOOR_NAMES = [
  '',
  'The Threshold',
  'The First Dark',
  'Where Light Ends',
  'The Forgotten Hall',
  'Chamber of No Return',
  'The Breathing Room',
  'Deeper Than Deep',
  'The Unnamed Place',
  'The Final Corridor',
  'The Void Itself'
];

// ── INFERNAL LOOT ──
var INFERNAL_LOOT = [
  { name:'Health Potion',    icon:'🧪', type:'potion',      heal:40,  desc:'Restores 40 HP.' },
  { name:'Greater Potion',   icon:'💊', type:'potion',      heal:75,  desc:'Restores 75 HP.' },
  { name:'Fire Potion',      icon:'🔥', type:'fire-potion',           desc:'40% enemy max HP as fire damage. Ignores defense.' },
  { name:'Curse Potion',     icon:'☠️', type:'curse-potion',          desc:'Halves enemy attack for 3 turns.' },
  { id:'infernal-blade',  name:'Infernal Blade',  icon:'🔥', type:'weapon', weaponType:'sword',  level:1, atkBase:[9,16],  isEquippable:true, desc:'Forged in the Infernal. Burns on every hit.' },
  { id:'void-reaver',     name:'Void Reaver',     icon:'🌑', type:'weapon', weaponType:'sword',  level:1, atkBase:[10,17], isEquippable:true, desc:'Tears through the void itself.' },
  { id:'hellfire-staff',  name:'Hellfire Staff',  icon:'☄️', type:'weapon', weaponType:'staff',  level:1, atkBase:[8,15],  isEquippable:true, desc:'Channels hellfire. Burns everything.' },
  { id:'abyssal-axe',     name:'Abyssal Axe',     icon:'🪓', type:'weapon', weaponType:'axe',    level:1, atkBase:[11,18], isEquippable:true, desc:'Carved from abyssal stone. Devastating.' },
  { id:'ember-dagger',    name:'Ember Dagger',    icon:'🗡️', type:'weapon', weaponType:'dagger', level:1, atkBase:[9,15],  isEquippable:true, desc:'Fast. Hot. Leaves burns.' },
  { id:'ember-plate',     name:'Ember Plate',     icon:'🛡️', type:'armor',  armorType:'medium',  level:1, defBase:5, isEquippable:true, desc:'+5 defense. Still warm from the forge.' },
  { id:'void-cloak',      name:'Void Cloak',      icon:'🌑', type:'armor',  armorType:'light',   level:1, defBase:3, isEquippable:true, desc:'+3 defense. Absorbs shadow damage.' },
  { id:'infernal-mail',   name:'Infernal Mail',   icon:'⛓️', type:'armor',  armorType:'heavy',   level:1, defBase:7, isEquippable:true, desc:'+7 defense. Heavy as sin.' },
  { id:'rune-strength',   name:'Rune of Strength',icon:'🔴', type:'rune',   desc:'+6 attack this run.' },
  { id:'scroll-smite',    name:'Scroll of Smite', icon:'⚡', type:'scroll', desc:'80 unblockable damage.' },
  { name:'Infernal Gem',  icon:'🔶', type:'gem', gold:25, desc:'Worth 25 gold.' },
  { name:'Hellfire Elixir', icon:'🔱', type:'elixir', healPct:0.65, desc:'Restores 65% of max HP. Distilled from infernal flame — somehow healing.' },
];

// ── WHISPERING FOREST ──
var WHISPER_FLOOR_NAMES = [
  '',
  'The Treeline','Where the Path Ends','The Listening Wood','The Witch\'s Wake','Root and Bone',
  'The Whispering Glade','Where She Died','The Cursed Grove','The Heart of the Wood','The Final Whisper',
  'The Hollow Oak','The Bleeding Bark','The Watching Trees','The Thorned Path','The Last Clearing',
  'The Rotted Canopy','Where Nothing Grows','The Cursed Soil','The Witch\'s Memory','The Deep Forest',
  'The Tangled Dark','Roots of the Curse','The Mourning Grove','The Forgotten Altar','The Vine Labyrinth',
  'The Weeping Canopy','The Witch Walks Here','The Final Root','The Undying Bark','The Forest Remembers',
];

var WHISPER_ROOM_DESCS = [
  // Early floors (1-3) — eerie but beautiful
  'The trees here are too close together. They were not always this close.',
  'Something tied ribbons to the branches. The ribbons are moving. There is no wind.',
  'The path behind you has already grown over. You noticed too late.',
  'A sound like breathing comes from the roots. Slow. Patient.',
  'The bark on every tree has been carved with the same word. You cannot read it.',
  'Fireflies drift through the dark. They move in patterns. Deliberate ones.',
  'The forest floor is soft here. Not from moss. From something beneath the moss.',
  'A child\'s doll hangs from a branch. The face has been worn away by weather. Or something else.',
  'The trees lean inward. Not from wind. They are listening.',
  'Flowers grow in a perfect circle. Nothing grows inside the circle.',
  'The air tastes of rain that has not fallen yet. Or rain that fell long ago.',
  'Footprints lead to the center of the clearing. None lead out.',
  'Something left claw marks on the trees at head height. From inside the trees.',
  'The fog here moves against the direction you walk.',
  'You hear your name. Once. Very clearly. From everywhere at once.',
  'The branches above have grown together into something resembling a face.',
  'Mushrooms grow in a spiral leading deeper in. You follow them.',
  // Mid floors (4-6) — darker, the curse becomes visible
  'The curse is visible here. A faint purple light that pulses like a heartbeat.',
  'A cottage foundation. Burned long ago. The fire never left the stones.',
  'The trees bleed sap that is the wrong color. You do not touch it.',
  'Something has been building a nest in the canopy. The materials include things from inside houses.',
  'The forest remembers the witch. You can feel it deciding what to do about you.',
  'The roots above the surface form letters. You are reading someone\'s last words.',
  'A well. Sealed. The seal is broken from the inside.',
  'Every animal sound stopped exactly when you entered this part of the forest.',
  'The witch\'s curse thickens here. The air is heavy with something you cannot name.',
  'You find her altar. Overturned. Long ago. The offerings are still fresh.',
  'The bark peels back to show wood that looks wrong. Organic. Living. Aware.',
  'Three paths branch here. Two of them lead to the same place.',
  'A lantern hangs from a branch. Still lit. Burning something other than oil.',
  'The shadows do not match the trees that cast them.',
  'Something has carved a map into the clearing floor. You are on it.',
  // Deep floors (7+) — the curse is everything
  'The witch is here. You cannot see her but you feel her. She has been waiting.',
  'The forest is her now. Every tree. Every root. Every whisper. Her.',
  'You have gone too deep for the forest to let you leave easily. It has not decided yet.',
  'The air moves like breath. The forest is breathing. Around you. Through you.',
  'The curse is complete at this depth. Beautiful. Absolute. You feel it working.',
  'The trees here have faces. Old ones. They have seen everything that happened.',
  'The witch\'s last words are written in bioluminescence on every surface.',
  'This deep, the forest does not pretend. It watches openly. You watch back.',
  'The roots crack beneath your feet but hold. Deliberately. The forest is not done with you.',
  'You understand now why she cursed this place. You understand too late.',
  'The final part of the forest. The part that even the witch feared.',
  'Something has grown here that should not exist. You step carefully around it.',
  'The whisper is deafening here. Your own name. Over and over. Getting louder.',
  'The trees part to let you through. They close behind you. You are exactly where you need to be.',
  'The heart of the curse. Everything led here. The forest holds its breath.',
];

var WHISPER_LOOT = [
  { name:'Health Potion',     icon:'🧪', type:'potion',     heal:40, desc:'Restores 40 HP.' },
  { name:'Greater Potion',    icon:'💊', type:'potion',     heal:75, desc:'Restores 75 HP.' },
  { name:'Witch\'s Brew',     icon:'🫗', type:'potion',     heal:55, desc:'Tastes of bark and something sweet. Restores 55 HP.' },
  { name:'Curse Potion',      icon:'☠️', type:'curse-potion', desc:'Halves enemy attack for 3 turns.' },
  { name:'Lucky Potion',      icon:'🍀', type:'luck-potion',  desc:'Next 3 kills drop double gold.' },
  { id:'thorn-blade',  name:'Thorn Blade',   icon:'🌿', type:'weapon', weaponType:'sword',  level:1, atkBase:[7,14], isEquippable:true, desc:'Carved from a cursed branch. Still grows.' },
  { id:'root-staff',   name:'Root Staff',    icon:'🪵', type:'weapon', weaponType:'staff',  level:1, atkBase:[6,12], isEquippable:true, desc:'The roots shift when no one watches.' },
  { id:'bark-shield',  name:'Bark Armor',    icon:'🛡️', type:'armor',  armorType:'light',  level:1, defBase:3, isEquippable:true, desc:'Hardened cursed bark. Warm to the touch.' },
  { name:'Forest Gem', icon:'💚', type:'gem', gold:18, desc:'Worth 18 gold. Glows faintly green.' },
  { name:'Sylvan Elixir', icon:'🌿', type:'elixir', healPct:0.60, desc:'Restores 60% of max HP. Pressed from the oldest flowers in the forest.' },
];

var WHISPER_ENEMIES = {
  t1: [
    { name:'Forest Shade',      icon:'🌑', hp:28, atk:[6,11],  gold:[3,7]  },
    { name:'Cursed Rabbit',     icon:'🐇', hp:20, atk:[5,10],  gold:[2,5]  },
    { name:'Root Crawler',      icon:'🪱', hp:24, atk:[5,9],   gold:[2,5]  },
    { name:'Hollow Branch',     icon:'🌿', hp:22, atk:[6,10],  gold:[2,6]  },
    { name:'Thorn Wisp',        icon:'💚', hp:18, atk:[7,13],  gold:[3,6]  },
    { name:'Bark Ghoul',        icon:'🌲', hp:30, atk:[6,11],  gold:[3,7]  },
    { name:'Vine Shade',        icon:'🍃', hp:26, atk:[5,10],  gold:[2,6]  },
    { name:'Web Stalker',       icon:'🕷️', hp:22, atk:[6,12],  gold:[3,6]  },
    { name:'Root Walker',       icon:'🌿', hp:24, atk:[5,10],  gold:[2,5],  atkDebuff:2, desc:'Wraps roots around your striking arm. Your attacks weaken with every hit.' },
    { name:'Shadow Stag',       icon:'🦌', hp:18, atk:[6,11],  gold:[2,5],  dodgeEvery:3, desc:'Stepped into a shadow wrong. Phases through your strikes every third turn.' },
  ],
  t2: [
    { name:'Cursed Dryad',      icon:'🌳', hp:55, atk:[10,17], gold:[5,11] },
    { name:'Witch\'s Familiar', icon:'🐈', hp:48, atk:[11,19], gold:[5,10] },
    { name:'Forest Wraith',     icon:'👻', hp:52, atk:[10,18], gold:[5,11] },
    { name:'Thornwood Knight',  icon:'⚔️', hp:65, atk:[11,18], gold:[6,12] },
    { name:'The Groundskeeper', icon:'🧑‍🌾', hp:58, atk:[10,17], gold:[5,10] },
    { name:'Cursed Wolf',       icon:'🐺', hp:50, atk:[12,20], gold:[6,12] },
    { name:'Root Golem',        icon:'🪵', hp:70, atk:[10,16], gold:[6,12] },
    { name:'Plague Hound',      icon:'🐕', hp:45, atk:[11,19], gold:[5,10] },
    { name:'The Beckoner',      icon:'🫴', hp:50, atk:[9,15],  gold:[5,11], summonCounter:0, desc:'Calls a Lost Villager to join if not defeated within 3 turns.' },
    { name:'Bark Golem',        icon:'🪵', hp:68, atk:[10,17], gold:[6,11], immuneFirstHit:true, desc:'The forest built it specifically to deal with intruders. Your first strike teaches it nothing.' },
    { name:'Night Bloom',       icon:'🌸', hp:44, atk:[10,17], gold:[5,10], poisonChance:0.30, desc:'Pollen on every hit. 30% chance to poison you for 3 turns.' },
  ],
  t3: [
    { name:'The Witch\'s Echo',  icon:'👁️', hp:90, atk:[14,23], gold:[8,16] },
    { name:'Grief Made Flesh',   icon:'😢', hp:85, atk:[13,22], gold:[8,15] },
    { name:'Ancient Dryad',      icon:'🌳', hp:95, atk:[14,22], gold:[9,16] },
    { name:'The Caretaker',      icon:'🧑', hp:80, atk:[13,21], gold:[8,15] },
    { name:'Corrupted Chimera',  icon:'🐲', hp:100,atk:[15,24], gold:[10,18]},
    { name:'Scream Without Source',icon:'👻',hp:78, atk:[14,23], gold:[8,16] },
    { name:'The Forest Itself',  icon:'🌲', hp:110,atk:[13,20], gold:[9,17] },
    { name:'Shadow Architect',   icon:'🌑', hp:88, atk:[14,22], gold:[9,16] },
    { name:'Canopy Horror',      icon:'🕷️', hp:95, atk:[14,22], gold:[9,16], grows:true, desc:'Gets stronger every turn it watches you from above. It has been watching since you entered.' },
  ],
  bossPool: [
    { name:'The Witch Who Remains', icon:'🧙', hp:320, atk:[18,28], gold:[60,90], isBoss:true,
      phaseMsg1:'She is not dead. She was never dead. She is the forest.',
      phaseMsg2:'The curse pours from her. The trees move to protect her.',
      phaseMsg3:'She speaks your name. She has always known your name.' }
  ,
    { name:'The Root Mother',       icon:'🌳', hp:130, atk:[15,25], gold:[32,52], isBoss:true, phaseMsg2:'The Root Mother sinks into the earth. Her roots erupt everywhere!', phaseMsg3:'She rises transformed. The forest IS her body now.' },
    { name:'The Howling Alpha',     icon:'🐺', hp:138, atk:[16,26], gold:[34,54], isBoss:true, phaseMsg2:'The Howling Alpha calls the pack. You hear them closing in.', phaseMsg3:'Alone now. The Alpha finishes what the pack started.' }
  ],
};

var WHISPER_ELITES = [
  { name:'The Portrait',      icon:'🖼️', hp:85, atk:[14,22], gold:[12,18], isElite:true, eliteAbility:'Painted Reality — weakens your attack' },
  { name:'The Bell Ringer',   icon:'🔔', hp:90, atk:[13,20], gold:[12,18], isElite:true, eliteAbility:'Toll — drains 10 SP per strike' },
  { name:'The Oldest Guest',  icon:'👴', hp:95, atk:[14,21], gold:[13,19], isElite:true, eliteAbility:'Old Grudge — reduces your max HP' },
];

// ── NIGHTMARE MODE ENEMIES (exclusive — appear NOWHERE else) ──
var NIGHTMARE_ENEMIES = {
  t1: [
    { name:'The Hollow',        icon:'⬛', hp:26, atk:[6,12],  gold:[3,6] },
    { name:'Flesh Amalgam',     icon:'🩸', hp:32, atk:[6,11],  gold:[2,6] },
    { name:'Void Spawn',        icon:'🌑', hp:20, atk:[5,11],  gold:[2,5] },
    { name:'The Forgotten',     icon:'👤', hp:24, atk:[5,10],  gold:[2,5] },
    { name:'Dread Wisp',        icon:'💜', hp:18, atk:[6,12],  gold:[2,4] },
    { name:'Nightmare Rat',     icon:'🐀', hp:22, atk:[5,10],  gold:[1,4] },
    { name:'The Unnamed',       icon:'❓', hp:28, atk:[6,11],  gold:[3,6] },
    { name:'Scream Without Source', icon:'💢', hp:16, atk:[7,13], gold:[2,5] },
    { name:'The Almost',        icon:'🌫️', hp:24, atk:[5,11],  gold:[2,5] },
  ],
  t2: [
    { name:'Soul Eater',        icon:'😈', hp:44, atk:[9,17],  gold:[5,10] },
    { name:'The Watcher',       icon:'👁️', hp:40, atk:[9,16],  gold:[4,9]  },
    { name:'Dread Knight',      icon:'⚔️', hp:52, atk:[10,18], gold:[6,11] },
    { name:'Flesh Wraith',      icon:'👻', hp:42, atk:[9,17],  gold:[5,9]  },
    { name:'Void Stalker',      icon:'🕳️', hp:38, atk:[10,18], gold:[4,9]  },
    { name:'The Damned',        icon:'💀', hp:48, atk:[9,17],  gold:[5,10] },
    { name:'Hollow Colossus',   icon:'🫙', hp:58, atk:[10,18], gold:[6,12] },
    { name:'The Unraveling',    icon:'🌀', hp:44, atk:[10,19], gold:[5,10] },
    { name:'Grief Made Flesh',  icon:'💔', hp:46, atk:[9,18],  gold:[5,11] },
  ],
  t3: [
    { name:'Nightmare Colossus',icon:'🟣', hp:80, atk:[14,24], gold:[11,19] },
    { name:'The Unmaking',      icon:'⬛', hp:70, atk:[13,23], gold:[9,17]  },
    { name:'Void Reaver',       icon:'🌑', hp:75, atk:[14,24], gold:[10,18] },
    { name:'Dread Sovereign',   icon:'👑', hp:68, atk:[13,23], gold:[9,16]  },
    { name:'Soul Harvester Prime',icon:'💜',hp:72,atk:[13,24], gold:[10,17] }
  ],
  bossPool: [
    { name:'The Dungeon Itself',   icon:'🕳️', hp:180, atk:[18,30], gold:[60,80], isBoss:true,
      phaseMsg2:'The walls breathe. The floor shifts. The Dungeon Itself is no longer pretending to be stone!',
      phaseMsg3:'Reality cracks. You are no longer in a dungeon. You are inside something alive and furious!' },
    { name:'The Nightmare Sovereign', icon:'👑', hp:170, atk:[17,29], gold:[58,78], isBoss:true,
      phaseMsg2:'The Nightmare Sovereign sheds its mortal shell. What remains should not exist!',
      phaseMsg3:'It has stopped fighting you. It has started rewriting you. Final phase!' },
    { name:'The Void Given Form',  icon:'⬛', hp:175, atk:[16,28], gold:[55,75], isBoss:true,
      phaseMsg2:'The Void Given Form absorbs the darkness around it. It becomes everything you cannot see!',
      phaseMsg3:'There is nothing left of the dungeon. Only the Void. Only you. Only the end!' }
  ]
};

// Nightmare bestiary entries — shown as UNNAMED/FEARED
var NIGHTMARE_BESTIARY = [
  { id:'the-hollow',          name:'The Hollow',           icon:'⬛', tier:'Nightmare 1-3', desc:'Where a person used to be, there is now nothing. The shape remains. The nothing inside it reaches for you.' },
  { id:'flesh-amalgam',       name:'Flesh Amalgam',        icon:'🩸', tier:'Nightmare 1-3', desc:'Something that was once several things and is now one wrong thing. It does not know what it is. You wish you did not either.' },
  { id:'void-spawn',          name:'Void Spawn',           icon:'🌑', tier:'Nightmare 1-3', desc:'It came from the space between the stones. From the place where the dungeon admits it does not know what it is.' },
  { id:'the-forgotten',       name:'The Forgotten',        icon:'👤', tier:'Nightmare 1-3', desc:'It has no name because no one who saw it lived long enough to give it one. You are the first to survive this long. Congratulations.' },
  { id:'dread-wisp', enemyType:'spirit',          name:'Dread Wisp',           icon:'💜', tier:'Nightmare 1-3', desc:'Not fire. Not light. Something that fills the same space as light but is its opposite. It is drawn to warmth because warmth is what it most wants to extinguish.' },
  { id:'nightmare-rat',       name:'Nightmare Rat',        icon:'🐀', tier:'Nightmare 1-3', desc:'The rats of the nightmare do not have eyes. They do not need eyes. They see you through the part of you that is afraid.' },
  { id:'soul-eater',          name:'Soul Eater',           icon:'😈', tier:'Nightmare 4-6', desc:'Every hit takes something from you that is not health. You do not notice at first. You notice later.' },
  { id:'the-watcher',         name:'The Watcher',          icon:'👁️', tier:'Nightmare 4-6', desc:'It was in the room before you entered. It will be in the next room before you get there. It does not hunt. It waits. It is very good at waiting.' },
  { id:'dread-knight',        name:'Dread Knight',         icon:'⚔️', tier:'Nightmare 4-6', desc:'Not a soldier. Not a warrior. A weapon that learned to want things. What it wants is for this to hurt.' },
  { id:'flesh-wraith', enemyType:'spirit',        name:'Flesh Wraith',         icon:'👻', tier:'Nightmare 4-6', desc:'A ghost made of something that was never alive. It exists in spite of every law that says it should not.' },
  { id:'void-stalker',        name:'Void Stalker',         icon:'🕳️', tier:'Nightmare 4-6', desc:'It moves through the spaces between spaces. You cannot hear it. You cannot track it. You only know it is there when it is too late for that knowledge to help.' },
  { id:'the-damned',          name:'The Damned',           icon:'💀', tier:'Nightmare 4-6', desc:'It wears your face. Not as a trick. As a warning about what happens to people who come here.' },
  { id:'nightmare-colossus',  name:'Nightmare Colossus',   icon:'🟣', tier:'Nightmare 7-9', desc:'Everything the Bone Colossus is, made of nightmare instead of bone. It is larger than it should be able to fit in this corridor. The corridor disagreed and lost.' },
  { id:'the-unmaking',        name:'The Unmaking',         icon:'⬛', tier:'Nightmare 7-9', desc:'Not a creature. A process. Something that removes things from existence and has learned to move.' },
  { id:'void-reaver',         name:'Void Reaver',          icon:'🌑', tier:'Nightmare 7-9', desc:'It harvests the space where things used to be. Its collection is enormous. It is always looking for more.' },
  { id:'dread-sovereign',     name:'Dread Sovereign',      icon:'👑', tier:'Nightmare 7-9', desc:'It rules the nightmare the way a king rules a country — by being the worst thing in it.' },
  { id:'soul-harvester-prime',name:'Soul Harvester Prime', icon:'💜', tier:'Nightmare 7-9', desc:'The original. What the Soul Harvesters of the regular dungeon are pale imitations of. It has been collecting for longer than the dungeon has existed.' },
  { id:'dungeon-itself',      name:'The Dungeon Itself',   icon:'🕳️', tier:'Nightmare Boss', desc:'You thought you were in a place. You were in a thing. The thing noticed. The thing is angry.', isBoss:true },
  { id:'nightmare-sovereign', name:'The Nightmare Sovereign',icon:'👑',tier:'Nightmare Boss', desc:'It has always been here. In the corner of every room. Behind every door. You could not see it before because it was not ready for you to see it. It is ready now.', isBoss:true },
  { id:'void-given-form',     name:'The Void Given Form',  icon:'⬛', tier:'Nightmare Boss', desc:'The void is not nothing. The void is something that has chosen not to be something. Until now. Now it has chosen differently.', isBoss:true }
];

// ── PROCEDURAL ROOM TYPES ──
var SPECIAL_ROOMS = [
  {
    type: 'treasure',
    icon: '💎',
    name: 'Treasure Chamber',
    desc: 'The walls glitter with forgotten wealth. No enemies — just riches waiting to be claimed.',
    chance: 0.10,
    run: function() {
      var gold = 20 + DS.floor * 5;
      DS.gold += gold;
      addGlobalGold(gold);
      var loot = LOOT[Math.floor(Math.random() * LOOT.length)];
      if (loot) {
        var item = Object.assign({}, loot);
        DS.inventory.push(item);
        if (item.type === 'weapon' || item.type === 'armor') addToGlobalInventory(item);
      }
      // Mystery coin — 30% chance from treasure chamber
      var bonusMsg = '';
      if (Math.random() < 0.30) {
        addMysteryCoin(1); // (written straight to one store; the Coin Shop reads the synced count)
        bonusMsg += ' +1 mystery coin!';
      }
      // Diamond — 10% chance from treasure chamber
      if (Math.random() < 0.10) {
        addDiamonds(1);
        bonusMsg += ' +1 diamond!';
      }
      updateTopBar();
      setEvent('good', '💎 Treasure Chamber! +' + gold + 'g' + (loot ? ' and found ' + loot.name + '.' : '.') + bonusMsg);
      say('Treasure Chamber. You find ' + gold + ' gold' + (loot ? ' and ' + loot.name : '') + '.' + bonusMsg + ' No enemies here.');
      showDgPanels(true, false, false);
    }
  },
  {
    type: 'rest',
    icon: '🕯️',
    name: 'Sanctuary',
    desc: 'A moment of stillness. Ancient candles burn. The darkness holds no threat here.',
    chance: 0.08,
    run: function() {
      var heal = Math.round(DS.maxHp * 0.20);
      DS.hp = Math.min(DS.maxHp, DS.hp + heal);
    if (!DS._floorHpHealed) DS._floorHpHealed = 0; DS._floorHpHealed += heal;
      DS.sp = Math.min(DS.maxSp, (DS.sp||0) + 10);
      updatePlayerBar();
      setEvent('good', '🕯️ Sanctuary. Restored ' + heal + ' HP and 10 SP.');
      say('Sanctuary. You rest briefly. Restored ' + heal + ' HP and 10 SP. No enemies here.');
      showDgPanels(true, false, false);
    }
  },
  {
    type: 'cursed',
    icon: '💀',
    name: 'Cursed Chamber',
    desc: 'Dark energy radiates from the walls. Something powerful stirs. The reward will be great — if you survive.',
    chance: 0.08,
    run: function() {
      // Spawn an elite-tier enemy with boosted HP and gold
      var pool = DS.dungeon === 'The Ashbound Wastes' ? ASH_ENEMIES
               : DS.dungeon === 'Frosthold Abyss' ? FROST_ENEMIES
               : DS.dungeon === 'The Sunken Archives' ? SUNKEN_ENEMIES
               : DS.dungeon === 'The Hollow' ? HOLLOW_ENEMIES
               : DS.dungeon === 'The Whispering Forest' ? WHISPER_ENEMIES
               : DS.dungeon === 'The Infernal Descent' ? INFERNAL_ENEMIES
               : DS.dungeon === 'The Abyssal Deep' ? ABYSSAL_ENEMIES
               : DS.dungeon === 'The Shadow World' ? SHADOW_ENEMIES.t1.concat(SHADOW_ENEMIES.t2).concat(SHADOW_ENEMIES.t3)
               : ENEMIES;
      // The dungeon tables are tiers ({ t1, t2, t3 }), not lists, so this
      // always fell through to an ordinary room. Use this floor's tier.
      if (pool && !Array.isArray(pool)) {
        var _tier = (DS.floor || 1) <= 3 ? pool.t1 : (DS.floor || 1) <= 6 ? pool.t2 : pool.t3;
        pool = _tier || pool.t1 || [];
      }
      if (!pool || !pool.length) pool = ENEMIES.t1;
      var base = pool[Math.floor(Math.random() * pool.length)];
      if (!base || !base.name) { enterRoom(); return; } // safety guard
      var cursedEnemy = Object.assign({}, base, {
        name: 'Cursed ' + base.name,
        hp: Math.round(base.hp * 1.8),
        maxHp: Math.round(base.hp * 1.8),
        gold: [base.gold[0] * 3, base.gold[1] * 3],
        isCursed: true
      });
      DS.enemy = cursedEnemy;
      setEvent('bad', '💀 Cursed Chamber! A powerful enemy lurks here. Defeat it for great rewards.');
      say('Cursed Chamber. A ' + cursedEnemy.name + ' blocks your path. It is stronger than normal but carries triple gold.');
      startCombat(false);
    }
  },
  {
    type: 'secret',
    icon: '🔍',
    name: 'Hidden Passage',
    desc: 'A crack in the wall reveals a forgotten path. Someone was here before you.',
    chance: 0.07,
    run: function() {
      var gold = 15 + DS.floor * 3;
      DS.gold += gold;
      addGlobalGold(gold);
      // Small chance of rare item
      if (Math.random() < 0.4) {
        var loot = LOOT[Math.floor(Math.random() * LOOT.length)];
        if (loot) { DS.inventory.push(Object.assign({}, loot)); }
        updateTopBar();
        setEvent('good', '🔍 Hidden Passage! +' + gold + 'g and found ' + loot.name + '!');
        say('Hidden Passage. You find ' + gold + ' gold and ' + loot.name + ' tucked away in the dark.');
      } else {
        updateTopBar();
        setEvent('good', '🔍 Hidden Passage! +' + gold + 'g hidden here.');
        say('Hidden Passage. You find ' + gold + ' gold hidden in the shadows.');
      }
      showDgPanels(true, false, false);
    }
  },
  {
    type: 'merchant',
    icon: '🛒',
    name: 'Wandering Merchant',
    desc: 'A hooded figure sits cross-legged in the darkness, wares spread before them.',
    chance: 0.06,
    run: function() {
      setEvent('good', '🛒 Wandering Merchant! A trader appears between the floors.');
      say('Wandering Merchant. A trader has set up shop here. Opening shop.');
      setTimeout(function() { openShop(); }, 500);
    }
  }
];

// Generate a floor's room sequence procedurally
// ── 3D MODE — SPATIAL ROOM GRAPH (beta, all dungeons) ──
// The 2D game already has a complete, battle-tested room-resolution pipeline
// in enterRoom() — combat, loot, events, floor completion, secret rooms, all
// of it. 3D Mode does NOT reimplement any of that. It just adds a spatial
// gate in front of moveRoom(): real walls and doors decide WHEN enterRoom()
// fires, instead of every button tap firing it unconditionally. Everything
// downstream is the exact same code every other dungeon and every non-3D
// player already relies on.
// Wall/floor/ceiling/torch/fog palette per dungeon — keeps the same room
// geometry and gameplay everywhere, just re-skinned to match each
// dungeon's identity instead of every dungeon looking like crypt stone.
// Brightness note: an early build of these themes rendered far too dark on
// a real phone screen — moody in a Three.js preview, but on-device the
// rooms read as almost pure black with two faint torch dots, indistinguish-
// able from "nothing rendered". Fixed by roughly doubling the wall/floor/
// ceiling base colors (MeshStandardMaterial needs real light to reflect;
// very dark base colors plus modest lighting just look black) and boosting
// ambient/torch light intensity in _setup3DScene/_build3DRoom below. Keep
// new theme colors and light levels in this brighter range.
var ROOM3D_THEMES = {
  'Crypt of Malachar':   { wall:0x5a544a, floor:0x453f36, ceil:0x2e2822, torch:0xff8833, fog:0x000000, fogDensity:0.070, ambient:0x3a3025 },
  'The Ashbound Wastes': { wall:0x4a352a, floor:0x352520, ceil:0x241813, torch:0xff4411, fog:0x1a0800, fogDensity:0.080, ambient:0x3a1c10 },
  'Frosthold Abyss':     { wall:0x5a7080, floor:0x455a68, ceil:0x2e3d48, torch:0x88ccff, fog:0x0a1520, fogDensity:0.065, ambient:0x25384a },
  'The Sunken Archives': { wall:0x455a52, floor:0x30453d, ceil:0x22322c, torch:0x44ccaa, fog:0x001510, fogDensity:0.095, ambient:0x1a3830 },
  'The Hollow':          { wall:0x6a655a, floor:0x50493e, ceil:0x38332c, torch:0xccccdd, fog:0x1a1a1f, fogDensity:0.070, ambient:0x36363e },
  'The Whispering Forest': { wall:0x4a5a3a, floor:0x3a422a, ceil:0x28301c, torch:0x88cc44, fog:0x0a1005, fogDensity:0.080, ambient:0x2a3818 },
  'The Infernal Descent': { wall:0x5c2418, floor:0x452012, ceil:0x2e1208, torch:0xff2200, fog:0x150300, fogDensity:0.090, ambient:0x431408 },
  'The Abyssal Deep':    { wall:0x2a3450, floor:0x1e2438, ceil:0x161c2a, torch:0x2299ff, fog:0x02040a, fogDensity:0.105, ambient:0x18243c },
  'The Shadow World':    { wall:0x342a3e, floor:0x261f2e, ceil:0x1c1722, torch:0x8844cc, fog:0x0a0510, fogDensity:0.080, ambient:0x2c1c3a }
};
function _room3DTheme() {
  return (DS && ROOM3D_THEMES[DS.dungeon]) || ROOM3D_THEMES['Crypt of Malachar'];
}

function shouldUse3DMode() {
  return !!(DS && ROOM3D_THEMES.hasOwnProperty(DS.dungeon) && typeof isBetaOn === 'function' && isBetaOn('3dmode'));
}

function _room3DKey(gx, gy) { return gx + ',' + gy; }
var ROOM3D_DIRS = [
  { name:'N', dx:0, dy:-1, opp:'S', word:'north' },
  { name:'S', dx:0, dy:1,  opp:'N', word:'south' },
  { name:'E', dx:1, dy:0,  opp:'W', word:'east' },
  { name:'W', dx:-1, dy:0, opp:'E', word:'west' }
];

// Random-walk connected room graph, sized to match the floor's real room
// count (DS.floorRoomsNeeded) so floor pacing/difficulty is unaffected —
// this is the same algorithm validated in the 3D Mode proof-of-concept
// (200/200 generated layouts: fully connected, doors consistent both sides).
function generate3DRoomGraph() {
  // +1: the starting cell is pre-marked visited (the player didn't "enter" it,
  // they just start there) and never calls enterRoom(), so it never counts
  // toward DS.roomsOnFloor. Without the +1, the graph would only ever contain
  // floorRoomsNeeded-1 enterable rooms — exploring all of them would leave
  // roomsOnFloor permanently one short of the floor-complete threshold, a
  // soft-lock with nowhere left to walk and no way to trigger completion.
  var total = Math.max(2, (DS.floorRoomsNeeded || 6) + 1);
  var cells = {};
  var order = [];
  var startKey = _room3DKey(0, 0);
  cells[startKey] = { gx:0, gy:0, doors:{N:false,S:false,E:false,W:false}, visited:true };
  order.push(startKey);

  var guard = 0;
  while (order.length < total && guard < 2000) {
    guard++;
    var fromKey = order[Math.floor(Math.random() * order.length)];
    var from = cells[fromKey];
    var shuffled = ROOM3D_DIRS.slice().sort(function() { return Math.random() - 0.5; });
    for (var i = 0; i < shuffled.length; i++) {
      var d = shuffled[i];
      var ngx = from.gx + d.dx, ngy = from.gy + d.dy;
      var nKey = _room3DKey(ngx, ngy);
      if (cells[nKey]) continue;
      cells[nKey] = { gx:ngx, gy:ngy, doors:{N:false,S:false,E:false,W:false}, visited:false };
      from.doors[d.name] = true;
      cells[nKey].doors[d.opp] = true;
      order.push(nKey);
      break;
    }
  }
  DS._roomGraph = { cells: cells };
  DS._gridPos = { gx: 0, gy: 0 };
  DS._lastMoveDir = null;
  // A fresh graph always starts back at (0,0) with a brand new layout, but
  // any rooms already built in the live scene belong to the PREVIOUS floor's
  // layout — same grid keys, different doors. Wipe them so nothing stale
  // lingers (or worse, gets silently reused as if it were correct).
  if (_room3D.scene) _disposeAllRooms();
}

// Wander adds 3 rooms to the current floor's target — grow the graph to match
// instead of leaving the player with nowhere new to walk.
function extend3DRoomGraph(n) {
  if (!DS._roomGraph) return generate3DRoomGraph();
  var cells = DS._roomGraph.cells;
  var order = Object.keys(cells);
  var added = 0, guard = 0;
  while (added < n && guard < 2000) {
    guard++;
    var fromKey = order[Math.floor(Math.random() * order.length)];
    var from = cells[fromKey];
    var shuffled = ROOM3D_DIRS.slice().sort(function() { return Math.random() - 0.5; });
    for (var i = 0; i < shuffled.length; i++) {
      var d = shuffled[i];
      var ngx = from.gx + d.dx, ngy = from.gy + d.dy;
      var nKey = _room3DKey(ngx, ngy);
      if (cells[nKey]) continue;
      cells[nKey] = { gx:ngx, gy:ngy, doors:{N:false,S:false,E:false,W:false}, visited:false };
      from.doors[d.name] = true;
      cells[nKey].doors[d.opp] = true;
      order.push(nKey);
      added++;
      break;
    }
  }
}

function _room3DExitsText(cell) {
  var exits = [];
  ROOM3D_DIRS.forEach(function(d) { if (cell.doors[d.name]) exits.push(d.word); });
  if (!exits.length) return 'No other doors from here.';
  if (exits.length === 1) return 'A door to the ' + exits[0] + '.';
  return 'Doors to the ' + exits.slice(0, -1).join(', ') + ' and ' + exits[exits.length - 1] + '.';
}

// The spatial gate itself — called from moveRoom() instead of the normal
// unconditional-advance path when 3D Mode is active for this run.
function moveRoom3D(dir) {
  var dirWordToLetter = { north:'N', south:'S', east:'E', west:'W' };
  var d = dirWordToLetter[dir];
  var cur = DS._roomGraph.cells[_room3DKey(DS._gridPos.gx, DS._gridPos.gy)];
  if (!d || !cur || !cur.doors[d]) {
    sfx('sfx-heavy-miss');
    say('There is a wall to the ' + dir + '. ' + (cur ? _room3DExitsText(cur) : ''));
    if (cur) play3DExitCues(cur);
    _flash3DWallBump();
    vibe && vibe(VIBE.wallBump);
    return;
  }
  var delta = ROOM3D_DIRS.filter(function(x){ return x.name === d; })[0];
  var ngx = DS._gridPos.gx + delta.dx, ngy = DS._gridPos.gy + delta.dy;
  var target = DS._roomGraph.cells[_room3DKey(ngx, ngy)];
  if (!target) {
    // Graph inconsistency safety net — should never happen given the generator's
    // guarantees, but never let a bad cell crash movement.
    sfx('sfx-heavy-miss');
    say('There is a wall to the ' + dir + '.');
    _flash3DWallBump();
    vibe && vibe(VIBE.wallBump);
    return;
  }

  DS._gridPos = { gx: ngx, gy: ngy };
  DS._lastMoveDir = d;
  sfx('sfx-footstep');
  showDgPanels(true, false, false);

  var wasVisited = target.visited;
  target.visited = true;
  var exitText = _room3DExitsText(target);
  _teleport3DTo(target);

  if (!wasVisited) {
    say('Moving ' + dir + '. ' + exitText);
    enterRoom(); // unchanged — same combat/loot/event/floor-completion pipeline every dungeon uses
  } else {
    say('Moving ' + dir + '. You are back in a room you already cleared. ' + exitText);
  }
  play3DExitCues(target);
  hunterTurn(false);
}

// ── 3D MODE — DIRECTIONAL AUDIO CUES ──
// Speech already tells the player which directions have doors ("Doors to the
// north and east"); this adds a second, faster-to-parse signal on top —
// reuses the exact Web Audio pattern the Stalker Floor growl already proved
// out (StereoPannerNode, works reliably on iOS with headphones), but as a
// short one-shot "blip" per open door instead of a continuous loop. Since
// this text game has no camera "facing" to base left/right on, directions
// map onto a fixed convention: West = panned left, East = panned right,
// North = center but pitched up ("ahead"), South = center but pitched down
// ("behind") — four audibly distinct signatures from one short sound.
var _room3DBlipBuffer = null;
var ROOM3D_DOOR_AUDIO = { N:{pan:0,pitch:1.18}, S:{pan:0,pitch:0.82}, E:{pan:0.8,pitch:1.0}, W:{pan:-0.8,pitch:1.0} };

// Hunter Mode tracks the hunter as a "rooms away" count, not a real position —
// but it's always fictionally following your trail, so the door you just came
// through (the opposite of your last move) is genuinely where it's coming
// from. Reuses the same pan/pitch table as the door cues above so the hunter
// cue sits in the same left/right/pitch space the player already learned.
function _hunterDirCue() {
  if (!shouldUse3DMode() || !DS._lastMoveDir) return null;
  var moved = ROOM3D_DIRS.filter(function(x){ return x.name === DS._lastMoveDir; })[0];
  if (!moved) return null;
  return ROOM3D_DOOR_AUDIO[moved.opp];
}

// A falling pitch sweep layered on top of the existing stairs SFX at the
// moment a floor is actually descended (not reused for unrelated sfx-stairs
// cues elsewhere, like the stalker minigame or the pre-boss gauntlet) —
// reinforces "going deeper" the same way the echo-location cues reinforce
// direction.
function playDescentCue() {
  if (!window.AUD || !AUD.ctx || !AUD.sfxOn) return;
  try {
    var ctx = AUD.ctx;
    var t0 = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t0);
    osc.frequency.exponentialRampToValueAtTime(110, t0 + 0.7);
    var vol = (AUD.sfxVol || 0.8) * 0.3;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.75);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.8);
  } catch (e) {}
}

function _load3DBlipBuffer() {
  if (_room3DBlipBuffer) return Promise.resolve(_room3DBlipBuffer);
  if (!window.AUD || !AUD.ctx) return Promise.resolve(null);
  return fetch(_audioUrl('sfx-hover.mp3')).then(function(r) { return r.arrayBuffer(); })
    .then(function(buf) { return AUD.ctx.decodeAudioData(buf); })
    .then(function(buffer) { _room3DBlipBuffer = buffer; return buffer; })
    .catch(function(e) { console.warn('[DD] 3D exit blip load failed:', e); return null; });
}

function _play3DBlip(pan, pitch, delaySec) {
  if (!window.AUD || !AUD.ctx || !_room3DBlipBuffer) return;
  try {
    if (AUD.ctx.state === 'suspended') AUD.ctx.resume();
    var source = AUD.ctx.createBufferSource();
    source.buffer = _room3DBlipBuffer;
    source.playbackRate.value = pitch;
    var panner = AUD.ctx.createStereoPanner ? AUD.ctx.createStereoPanner() : null;
    var gainNode = AUD.ctx.createGain();
    gainNode.gain.value = (AUD.sfxVol || 0.8) * 0.7;
    source.connect(gainNode);
    if (panner) { panner.pan.value = pan; gainNode.connect(panner); panner.connect(AUD.ctx.destination); }
    else { gainNode.connect(AUD.ctx.destination); }
    source.start(AUD.ctx.currentTime + Math.max(0, delaySec));
  } catch(e) {}
}

// Plays one panned/pitched blip per open door in the given room, staggered
// slightly so each direction is distinguishable rather than one blended chord.
function play3DExitCues(cell) {
  if (!cell || !shouldUse3DMode()) return;
  // Every call site here fires this right alongside a say() announcement
  // (room entry, wall bump, floor start) — VoiceOver/TalkBack duck other
  // app audio while actively speaking, so a one-shot blip fired at that
  // exact moment gets buried and is never actually heard, even though the
  // code runs fine. Echo-location doesn't have this problem (it's a
  // deliberate, isolated action with no simultaneous speech) and neither
  // does the Hide-and-Seek growl (a continuous loop with plenty of quiet
  // gaps to land in) — this needs the same room-description-clearing
  // delay familiarSpeak() already uses for the same reason.
  setTimeout(function() {
    _load3DBlipBuffer().then(function(buf) {
      if (!buf) return;
      var i = 0;
      ROOM3D_DIRS.forEach(function(d) {
        if (cell.doors[d.name]) {
          var cfg = ROOM3D_DOOR_AUDIO[d.name];
          _play3DBlip(cfg.pan, cfg.pitch, i * 0.16);
          i++;
        }
      });
    });
  }, 1800);
}

// ── ECHO-LOCATION ── a player-triggered sonar pulse: a central ping, then
// one panned tone per direction — a short sharp "tik" where there's a wall,
// a longer soft tone that fades outward where there's an open door. Built
// on the same room-graph data as the 3D visual (walls/doors per cell), but
// it's a pure Web Audio synth (no sample files), so it works for anyone
// with 3D Mode on regardless of whether they want the visual rendered —
// it's an audio tool first.
var _echoLocateCooldownUntil = 0;
function _echoOsc(type, freq, pan, startDelay, durSec, peakVol) {
  if (!window.AUD || !AUD.ctx) return;
  try {
    var ctx = AUD.ctx;
    var t0 = ctx.currentTime + startDelay;
    var osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    var gainNode = ctx.createGain();
    var vol = (AUD.sfxVol || 0.8) * peakVol;
    gainNode.gain.setValueAtTime(0.0001, t0);
    gainNode.gain.linearRampToValueAtTime(vol, t0 + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec);
    osc.connect(gainNode);
    if (ctx.createStereoPanner) {
      var panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      gainNode.connect(panner);
      panner.connect(ctx.destination);
    } else {
      gainNode.connect(ctx.destination);
    }
    osc.start(t0);
    osc.stop(t0 + durSec + 0.05);
  } catch (e) {}
}
// Room-ahead sensing — the floor's whole room-type sequence is rolled
// up front by generateFloorRooms() and walked one entry per room via
// getNextRoomType(), regardless of which door gets taken to get there.
// That means whichever door leads to an unvisited cell from here shares
// the exact same next() entry, so echoing its category toward every
// unvisited door is a real, honest read of what's coming — not a fake
// "spooky sense" layered on top for flavor.
var ROOM_AHEAD_CATEGORY = { cursed: 'danger', treasure: 'good', rest: 'good', merchant: 'good', secret: 'mystery' };
function _roomAheadCategory() {
  if (!DS._floorRoomSequence) return null;
  var t = DS._floorRoomSequence[DS._floorRoomIdx];
  return ROOM_AHEAD_CATEGORY[t] || null;
}
function _echoAheadCue(category, pan, delay) {
  if (category === 'danger') {
    // Low, sustained growl — something worth being cautious about
    _echoOsc('sawtooth', 85, pan, delay, 0.55, 0.34);
    _echoOsc('sawtooth', 110, pan, delay + 0.08, 0.45, 0.26);
  } else if (category === 'good') {
    // Bright ascending two-note shimmer — something worth seeking out
    _echoOsc('sine', 1300, pan, delay, 0.18, 0.24);
    _echoOsc('sine', 1700, pan, delay + 0.09, 0.20, 0.24);
  } else if (category === 'mystery') {
    // Two close, slightly detuned tones beating against each other —
    // uncertain, worth a second look
    _echoOsc('sine', 700, pan, delay, 0.30, 0.22);
    _echoOsc('sine', 735, pan, delay, 0.30, 0.22);
  }
}

// Walks straight through the room graph in one direction, counting how many
// consecutive connected cells continue that way before hitting a wall or the
// edge of what's been generated. There's no room-size data to draw on — every
// cell is one grid unit — so this is the honest stand-in for "how far can the
// pulse travel that way": a long straight run of doors reads as a real
// hallway, a single door reads as a small alcove.
function _corridorDepth(cell, dirName, maxDepth) {
  var d = ROOM3D_DIRS.filter(function(x){ return x.name === dirName; })[0];
  var depth = 0, cx = cell.gx, cy = cell.gy, cur = cell;
  while (depth < maxDepth && cur && cur.doors[dirName]) {
    cx += d.dx; cy += d.dy;
    cur = DS._roomGraph.cells[_room3DKey(cx, cy)];
    if (!cur) break;
    depth++;
  }
  return depth;
}

function echoLocate() {
  if (!DS) return;
  if (DS.inCombat) { say('Echo-location only works while exploring, not during combat.'); return; }
  if (!shouldUse3DMode() || !DS._roomGraph) {
    say('Echo-location needs 3D Mode turned on in Settings — it uses the room layout data 3D Mode tracks.');
    return;
  }
  var now = Date.now();
  if (now < _echoLocateCooldownUntil) { return; }
  _echoLocateCooldownUntil = now + 1400;

  var cell = DS._roomGraph.cells[_room3DKey(DS._gridPos.gx, DS._gridPos.gy)];
  if (!cell) return;

  // Central ping — a quick rising sweep, unpanned, marks the start of the pulse
  _echoOsc('sine', 300, 0, 0, 0.16, 0.55);
  _echoOsc('sine', 900, 0, 0.05, 0.12, 0.35);
  vibe && vibe(VIBE.echoPing);

  var aheadCategory = _roomAheadCategory();
  var aheadWords = { danger: [], good: [], mystery: [] };
  var openWords = [], wallWords = [];
  ROOM3D_DIRS.forEach(function(d, i) {
    var cfg = ROOM3D_DOOR_AUDIO[d.name];
    var delay = 0.22 + i * 0.11;
    if (cell.doors[d.name]) {
      openWords.push(d.word);
      // Open — a longer, softer tone that fades away, implying space beyond.
      // Duration (and, past 1 room deep, a soft trailing repeat) scale with
      // how far the corridor actually runs in that direction, so a long
      // hallway reads differently from a single-room alcove.
      var corridorDepth = _corridorDepth(cell, d.name, 3);
      var openDur = 0.32 + corridorDepth * 0.14;
      _echoOsc('sine', 420 * cfg.pitch, cfg.pan, delay, openDur, 0.30);
      if (corridorDepth >= 2) {
        _echoOsc('sine', 420 * cfg.pitch, cfg.pan, delay + openDur * 0.55, openDur * 0.7, 0.16);
      }
      var neighborKey = _room3DKey(cell.gx + d.dx, cell.gy + d.dy);
      var neighbor = DS._roomGraph.cells[neighborKey];
      if (aheadCategory && neighbor && !neighbor.visited) {
        _echoAheadCue(aheadCategory, cfg.pan, delay + 0.36);
        aheadWords[aheadCategory].push(d.word);
      }
    } else {
      wallWords.push(d.word);
      // Wall — a short, sharp, higher click, implying a close reflection
      _echoOsc('square', 950 * cfg.pitch, cfg.pan, delay, 0.07, 0.22);
    }
  });
  if (aheadCategory) vibe && vibe(VIBE[aheadCategory === 'danger' ? 'echoDanger' : 'echoPing']);

  var summary = openWords.length
    ? ('Echo-location: open to the ' + openWords.join(', ') + '.' + (wallWords.length ? ' Wall to the ' + wallWords.join(', ') + '.' : ''))
    : 'Echo-location: walls on every side.';
  if (aheadWords.danger.length) summary += ' Something dangerous stirs beyond the ' + aheadWords.danger.join(', ') + '.';
  if (aheadWords.good.length) summary += ' Something promising lies beyond the ' + aheadWords.good.join(', ') + '.';
  if (aheadWords.mystery.length) summary += ' Something uncertain waits beyond the ' + aheadWords.mystery.join(', ') + '.';
  say(summary);
}

// ── VOICE COMMANDS ──
// One entry point (voiceCommand()) used from both the combat and
// exploration action panels — it picks its command table from DS.inCombat
// at the moment it's called. Two backends: the native
// @capacitor-community/speech-recognition plugin (real on-device speech
// recognition, used on iOS/Android) and the browser's own
// webkitSpeechRecognition (used on the web build, which runs in a normal
// Chrome/Edge tab, not a WebView). Neither is guaranteed present — iOS's
// WKWebView in particular has never implemented the Web Speech API's
// recognition side, which is exactly why this needs the native plugin
// there rather than trying to reuse the same speechSynthesis-only API
// say() already relies on for output.
var _voiceListening = false;

function _voiceRecognitionMode() {
  if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.SpeechRecognition) return 'native';
  if (window.SpeechRecognition || window.webkitSpeechRecognition) return 'web';
  return null;
}

var VOICE_COMMANDS_COMBAT = [
  { words: ['heavy strike', 'heavy attack', 'heavy'], action: function(){ doFight('heavy'); } },
  { words: ['defend', 'block', 'guard'], action: function(){ doFight('defend'); } },
  { words: ['potion', 'drink potion', 'heal'], action: function(){ doFight('potion'); } },
  { words: ['flee', 'run away', 'escape', 'run'], action: function(){ doFight('flee'); } },
  { words: ['skill book', 'skills', 'skill', 'spell', 'cast'], action: function(){ var b = document.getElementById('skill-book-btn'); if (b) b.click(); } },
  { words: ['attack', 'hit', 'strike', 'fight'], action: function(){ doFight('attack'); } },
];
var VOICE_COMMANDS_EXPLORE = [
  { words: ['echo locate', 'echolocate', 'echo location', 'echo', 'sonar', 'ping'], action: function(){ echoLocate(); } },
  { words: ['inventory', 'bag', 'items'], action: function(){ toggleInv(); } },
  { words: ['search', 'search room'], action: function(){ searchRoom(); } },
  { words: ['north'], action: function(){ moveRoom('north'); } },
  { words: ['south'], action: function(){ moveRoom('south'); } },
  { words: ['east'], action: function(){ moveRoom('east'); } },
  { words: ['west'], action: function(){ moveRoom('west'); } },
];

function _handleVoiceMatches(matches) {
  var table = (DS && DS.inCombat) ? VOICE_COMMANDS_COMBAT : VOICE_COMMANDS_EXPLORE;
  // Longer phrases are checked first within each candidate transcript so
  // "heavy attack" matches heavy, not the bare "attack" fallback further down.
  var sorted = table.slice().sort(function(a, b) {
    var la = Math.max.apply(null, a.words.map(function(w){ return w.length; }));
    var lb = Math.max.apply(null, b.words.map(function(w){ return w.length; }));
    return lb - la;
  });
  for (var m = 0; m < (matches || []).length; m++) {
    var text = (matches[m] || '').toLowerCase().trim();
    if (!text) continue;
    for (var c = 0; c < sorted.length; c++) {
      for (var w = 0; w < sorted[c].words.length; w++) {
        if (text.indexOf(sorted[c].words[w]) !== -1) {
          say('Voice command: ' + sorted[c].words[w] + '.');
          sorted[c].action();
          return;
        }
      }
    }
  }
  var heard = (matches && matches[0]) ? ('"' + matches[0] + '"') : 'anything';
  say('Did not recognize ' + heard + '. Try attack, defend, heavy, potion, flee' +
    ((DS && DS.inCombat) ? '' : ', a direction, search, or echo locate') + '.');
}

async function voiceCommand() {
  if (_voiceListening) return;
  var mode = _voiceRecognitionMode();
  if (!mode) {
    say('Voice commands are not available on this device or browser.');
    return;
  }
  if (mode === 'native') { await _voiceCommandNative(); }
  else { _voiceCommandWeb(); }
}

async function _voiceCommandNative() {
  var SR = Capacitor.Plugins.SpeechRecognition;
  try {
    var perm = await SR.checkPermissions();
    if (perm.speechRecognition !== 'granted') {
      perm = await SR.requestPermissions();
      if (perm.speechRecognition !== 'granted') {
        say('Voice commands need microphone and speech recognition permission. Enable it in your device Settings.');
        return;
      }
    }
    var avail = await SR.available();
    if (avail && avail.available === false) {
      say('Speech recognition is not available on this device.');
      return;
    }
    _voiceListening = true;
    vibe && vibe(VIBE.echoPing);
    say('Listening.');
    var result = await SR.start({ language: 'en-US', maxResults: 3, popup: false, partialResults: false });
    _voiceListening = false;
    _handleVoiceMatches(result && result.matches ? result.matches : []);
  } catch (e) {
    _voiceListening = false;
    console.warn('[DD] Voice command (native) failed:', e);
    say('Could not hear that. Try again.');
  }
}

function _voiceCommandWeb() {
  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = new Rec();
  rec.lang = 'en-US';
  rec.maxAlternatives = 3;
  rec.interimResults = false;
  _voiceListening = true;
  vibe && vibe(VIBE.echoPing);
  say('Listening.');
  rec.onresult = function(e) {
    var matches = [];
    for (var i = 0; i < e.results[0].length; i++) matches.push(e.results[0][i].transcript);
    _handleVoiceMatches(matches);
  };
  rec.onerror = function(e) {
    console.warn('[DD] Voice command (web) error:', e.error);
    say('Could not hear that. Try again.');
  };
  rec.onend = function() { _voiceListening = false; };
  try { rec.start(); } catch (e) { _voiceListening = false; say('Could not start listening.'); }
}

// ── 3D MODE — VISUAL RENDERER (Three.js, lazy-loaded) ──
// Renders only the room the player currently stands in, rebuilt behind a
// quick fade on every move. This is a discrete, button-driven navigation
// game (moveRoom3D(), not WASD free-roam), so there's no continuous
// movement/collision to reconcile — a one-room-at-a-time scene with a fade
// transition matches how the rest of the game already works and keeps
// scene complexity flat no matter how large a floor's room graph gets.
var _room3D = { loading:null, THREE:null, scene:null, camera:null, renderer:null,
  ambient:null, raf:null, yaw:0, pitch:0, built:false,
  builtRooms:{}, themeDungeon:null, lastCellKey:null,
  move:{forward:false,backward:false,left:false,right:false},
  moveTouch:{forward:false,backward:false,left:false,right:false},
  footstepAccum:0,
  ROOM_W:10, ROOM_D:12, ROOM_H:4.2, DOOR_W:2.4 };

function _room3DWantsVisual() {
  return shouldUse3DMode() && !!(DS && DS._roomGraph);
}

// Sighted players watching the 3D view have no cue when a move is blocked
// by a wall — the feedback (sfx + say()) is audio-only, so nothing visibly
// happens on screen and it reads as the game being broken. Give the view a
// quick shake + red flash instead.
function _flash3DWallBump() {
  if (!_room3DWantsVisual()) return;
  var view = document.getElementById('dg-3d-view');
  if (!view) return;
  view.classList.remove('dg-3d-wallbump');
  void view.offsetWidth; // restart the animation if it's already mid-flash
  view.classList.add('dg-3d-wallbump');
  setTimeout(function() { view.classList.remove('dg-3d-wallbump'); }, 350);
}

// A screen-reader player still wants the room to actually render — to show
// a sighted friend looking at the same screen, for instance — they just
// can't usefully aim a camera-relative move pad or a drag-to-look gesture
// without sight. This hides only the aim controls, not the rendering.
function _room3DWantsAimControls() {
  return !(ACCESS && ACCESS.srmode);
}

// Same "sighted play only" rule as the aim controls, plus its own opt-out
// setting — a top-down map is pure visual sugar with nothing a screen
// reader session can act on, so it stays off whenever srmode is on
// regardless of the setting.
function _room3DWantsMinimap() {
  return _room3DWantsAimControls() && !!get3DSettings().minimap;
}

// Top-down view of DS._roomGraph: filled squares for rooms actually visited,
// a highlighted square for the current room, thin connecting lines for doors
// between two visited rooms, and small dim dots for known-but-unvisited
// neighbors (a door out of a visited room proves that neighbor exists, even
// before you've walked into it — matches what the spoken exits text already
// reveals, so it's not spoiling anything the audio doesn't already say).
function _renderMinimap() {
  var wrap = document.getElementById('dg-3d-minimap');
  if (!wrap) return;
  if (!_room3DWantsMinimap() || !DS || !DS._roomGraph || !DS._gridPos) {
    wrap.style.display = 'none';
    return;
  }
  var canvas = document.getElementById('dg-3d-minimap-canvas');
  if (!canvas) return;
  wrap.style.display = 'block';
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  var cells = DS._roomGraph.cells;
  var visited = Object.keys(cells).map(function(k) { return cells[k]; }).filter(function(c) { return c.visited; });
  if (!visited.length) return;

  var known = {}; // visited cells + their known (doored) neighbors
  visited.forEach(function(c) {
    known[_room3DKey(c.gx, c.gy)] = { gx: c.gx, gy: c.gy, visited: true };
    ROOM3D_DIRS.forEach(function(d) {
      if (!c.doors[d.name]) return;
      var nKey = _room3DKey(c.gx + d.dx, c.gy + d.dy);
      if (!known[nKey]) known[nKey] = { gx: c.gx + d.dx, gy: c.gy + d.dy, visited: false };
    });
  });
  var pts = Object.keys(known).map(function(k) { return known[k]; });

  var minGx = Math.min.apply(null, pts.map(function(p) { return p.gx; }));
  var maxGx = Math.max.apply(null, pts.map(function(p) { return p.gx; }));
  var minGy = Math.min.apply(null, pts.map(function(p) { return p.gy; }));
  var maxGy = Math.max.apply(null, pts.map(function(p) { return p.gy; }));
  var spanX = Math.max(1, maxGx - minGx), spanY = Math.max(1, maxGy - minGy);
  var pad = 10;
  var cell = Math.min((W - pad * 2) / (spanX + 1), (H - pad * 2) / (spanY + 1));
  function sx(gx) { return pad + (gx - minGx + 0.5) * cell; }
  function sy(gy) { return pad + (gy - minGy + 0.5) * cell; }

  // Door connections between two visited rooms
  ctx.strokeStyle = 'rgba(200,160,100,0.55)';
  ctx.lineWidth = 2;
  visited.forEach(function(c) {
    ROOM3D_DIRS.forEach(function(d) {
      if (!c.doors[d.name]) return;
      var nKey = _room3DKey(c.gx + d.dx, c.gy + d.dy);
      var n = cells[nKey];
      if (!n || !n.visited) return;
      ctx.beginPath();
      ctx.moveTo(sx(c.gx), sy(c.gy));
      ctx.lineTo(sx(n.gx), sy(n.gy));
      ctx.stroke();
    });
  });

  var r = Math.max(2, cell * 0.28);
  pts.forEach(function(p) {
    if (p.visited) return; // draw known-but-unvisited dots first, under everything
    ctx.fillStyle = 'rgba(160,130,90,0.35)';
    ctx.beginPath();
    ctx.arc(sx(p.gx), sy(p.gy), r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  visited.forEach(function(c) {
    var isCurrent = c.gx === DS._gridPos.gx && c.gy === DS._gridPos.gy;
    ctx.fillStyle = isCurrent ? '#ffcc44' : 'rgba(200,160,100,0.75)';
    ctx.beginPath();
    ctx.arc(sx(c.gx), sy(c.gy), isCurrent ? r * 1.3 : r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// WASD/arrow-key movement — bound once, globally, guarded so it's a no-op
// whenever the 3D view isn't actually the thing on screen (menus, combat,
// typing in a text field, etc).
function _room3DKeysActive() {
  if (!_room3DWantsVisual() || !_room3D.renderer) return false;
  var view = document.getElementById('dg-3d-view');
  if (!view || getComputedStyle(view).display === 'none') return false;
  var ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return false;
  return true;
}
document.addEventListener('keydown', function(e) {
  if (!_room3DKeysActive()) return;
  if (e.code === 'KeyW' || e.code === 'ArrowUp') _room3D.move.forward = true;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') _room3D.move.backward = true;
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') _room3D.move.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') _room3D.move.right = true;
});
document.addEventListener('keyup', function(e) {
  if (e.code === 'KeyW' || e.code === 'ArrowUp') _room3D.move.forward = false;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') _room3D.move.backward = false;
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') _room3D.move.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') _room3D.move.right = false;
});

function _load3DEngine() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (_room3D.loading) return _room3D.loading;
  _room3D.loading = new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    // Bundled locally (www/lib/three.min.js) rather than fetched from a CDN —
    // the iOS app ships this file in its bundle, so 3D Mode's visuals work
    // fully offline just like the rest of the game now does.
    s.src = 'lib/three.min.js';
    s.onload = function() { resolve(window.THREE); };
    s.onerror = function() { reject(new Error('3D engine failed to load')); };
    document.head.appendChild(s);
  });
  return _room3D.loading;
}

function init3DView() {
  if (!_room3DWantsVisual()) return;
  var wrap = document.getElementById('dg-3d-view');
  if (!wrap) return;
  wrap.style.display = '';
  _load3DEngine().then(function(THREE) {
    if (!_room3DWantsVisual()) return; // player may have backed out before load finished
    if (!_room3D.renderer) _setup3DScene(THREE);
    var cell = DS._roomGraph.cells[_room3DKey(DS._gridPos.gx, DS._gridPos.gy)];
    _placeCameraAt(cell);
    _start3DLoop();
  }).catch(function(e) { console.warn('[DD] 3D visual load failed:', e); wrap.style.display = 'none'; });
}

function _setup3DScene(THREE) {
  _room3D.THREE = THREE;
  var theme = _room3DTheme();
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(theme.fog, theme.fogDensity);
  var wrapEl = document.getElementById('dg-3d-canvas-wrap');
  var w = wrapEl.clientWidth || 300, h = wrapEl.clientHeight || 220;
  var camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 60);
  camera.position.set(0, 1.6, 0);
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = !!get3DSettings().shadows;
  wrapEl.innerHTML = '';
  wrapEl.appendChild(renderer.domElement);
  _room3D.scene = scene; _room3D.camera = camera; _room3D.renderer = renderer;
  var ambient = new THREE.AmbientLight(theme.ambient, 1.4);
  scene.add(ambient);
  _room3D.ambient = ambient;
  _room3D.themeDungeon = DS.dungeon;
  _bind3DLook(renderer.domElement);
  _bind3DMovePad();
  // A screen-reader player can't aim a camera by sight, so the "drag to
  // look / walk with the pad" hint is just clutter for them — but the room
  // still renders and is theirs to show a sighted friend, so only this hint
  // text (and the move pad itself, gated in _bind3DMovePad) get hidden.
  var hint = document.getElementById('dg-3d-hint');
  if (hint) hint.style.display = _room3DWantsAimControls() ? '' : 'none';
  window.addEventListener('resize', _resize3DView);
}

// The scene/renderer persist across dungeon runs within the same page
// session (only rebuilt on first use), but scene-level things — fog color,
// ambient light — are set once at setup time and won't pick up a new
// dungeon's theme on their own the way per-room wall/torch materials do
// (those are rebuilt fresh every room). Called at the top of every room
// build so a run in a different dungeon always looks right immediately.
function _sync3DTheme() {
  if (!_room3D.scene || _room3D.themeDungeon === DS.dungeon) return;
  var theme = _room3DTheme();
  var THREE = _room3D.THREE;
  _room3D.scene.fog = new THREE.FogExp2(theme.fog, theme.fogDensity);
  if (_room3D.ambient) _room3D.ambient.color.setHex(theme.ambient);
  _room3D.themeDungeon = DS.dungeon;
}

// ── MULTI-ROOM RENDERING ──
// Free-roam walking means the player needs to see (and walk into) an
// adjacent room before they're physically standing in it, so unlike the
// original single-room-at-a-time renderer, this keeps the current room PLUS
// its immediate grid-neighbors built at once — each placed at its own
// world-space offset (cell.gx * ROOM_W, cell.gy * ROOM_D), same approach as
// the original standalone POC. That bounds the always-live set to at most 5
// rooms (~20 torches) regardless of how large a floor's graph gets, so
// performance stays flat whether the floor has 6 rooms or 16.
function _disposeRoom(key) {
  var rec = _room3D.builtRooms[key];
  if (!rec || !_room3D.scene) return;
  rec.objects.forEach(function(obj) {
    _room3D.scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  });
  delete _room3D.builtRooms[key];
}

function _disposeAllRooms() {
  Object.keys(_room3D.builtRooms).forEach(_disposeRoom);
}

function _ensureRoomBuilt(cell) {
  var key = _room3DKey(cell.gx, cell.gy);
  if (_room3D.builtRooms[key]) return _room3D.builtRooms[key];
  var THREE = _room3D.THREE;
  var theme = _room3DTheme();
  var W = _room3D.ROOM_W, D = _room3D.ROOM_D, H = _room3D.ROOM_H, DW = _room3D.DOOR_W;
  var ox = cell.gx * W, oz = cell.gy * D;
  var objs = [], torches = [], wallSegments = [];
  var shadowsOn = !!get3DSettings().shadows;

  var floorMat = new THREE.MeshStandardMaterial({ color: theme.floor, roughness: 0.95, metalness: 0.05 });
  var wallMat = new THREE.MeshStandardMaterial({ color: theme.wall, roughness: 0.9, metalness: 0.05 });
  var ceilMat = new THREE.MeshStandardMaterial({ color: theme.ceil, roughness: 1.0 });

  var floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(ox, 0, oz);
  floorMesh.receiveShadow = shadowsOn;
  _room3D.scene.add(floorMesh); objs.push(floorMesh);

  var ceilMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilMat);
  ceilMesh.rotation.x = Math.PI / 2;
  ceilMesh.position.set(ox, H, oz);
  _room3D.scene.add(ceilMesh); objs.push(ceilMesh);

  function addWallMesh(w, h, x, y, z, ry) {
    var wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    wall.position.set(x, y, z);
    wall.rotation.y = ry;
    wall.receiveShadow = shadowsOn;
    _room3D.scene.add(wall); objs.push(wall);
  }
  function addSeg(x1, z1, x2, z2) { wallSegments.push({ x1:x1, z1:z1, x2:x2, z2:z2 }); }
  function buildSide(hasDoor, axis, sign) {
    if (axis === 'z') {
      var wallLen = W, wz = oz + sign * (D / 2);
      if (!hasDoor) {
        addWallMesh(wallLen, H, ox, H / 2, wz, sign > 0 ? Math.PI : 0);
        addSeg(ox - wallLen / 2, wz, ox + wallLen / 2, wz);
      } else {
        var seg = (wallLen - DW) / 2;
        addWallMesh(seg, H, ox - (DW / 2 + seg / 2), H / 2, wz, sign > 0 ? Math.PI : 0);
        addWallMesh(seg, H, ox + (DW / 2 + seg / 2), H / 2, wz, sign > 0 ? Math.PI : 0);
        addSeg(ox - wallLen / 2, wz, ox - DW / 2, wz);
        addSeg(ox + DW / 2, wz, ox + wallLen / 2, wz);
      }
    } else {
      var wallLenX = D, wx = ox + sign * (W / 2);
      if (!hasDoor) {
        addWallMesh(wallLenX, H, wx, H / 2, oz, sign > 0 ? -Math.PI / 2 : Math.PI / 2);
        addSeg(wx, oz - wallLenX / 2, wx, oz + wallLenX / 2);
      } else {
        var segX = (wallLenX - DW) / 2;
        addWallMesh(segX, H, wx, H / 2, oz - (DW / 2 + segX / 2), sign > 0 ? -Math.PI / 2 : Math.PI / 2);
        addWallMesh(segX, H, wx, H / 2, oz + (DW / 2 + segX / 2), sign > 0 ? -Math.PI / 2 : Math.PI / 2);
        addSeg(wx, oz - wallLenX / 2, wx, oz - DW / 2);
        addSeg(wx, oz + DW / 2, wx, oz + wallLenX / 2);
      }
    }
  }
  buildSide(cell.doors.N, 'z', -1);
  buildSide(cell.doors.S, 'z', 1);
  buildSide(cell.doors.W, 'x', -1);
  buildSide(cell.doors.E, 'x', 1);

  var torchGeo = new THREE.SphereGeometry(0.07, 8, 8);
  var flameMat = new THREE.MeshBasicMaterial({ color: theme.torch });
  var torchOffsets = [
    [ox - W / 2 + 0.3, 2.1, oz - D / 2 + 1.5], [ox + W / 2 - 0.3, 2.1, oz - D / 2 + 1.5],
    [ox - W / 2 + 0.3, 2.1, oz + D / 2 - 1.5], [ox + W / 2 - 0.3, 2.1, oz + D / 2 - 1.5]
  ];
  torchOffsets.forEach(function(p) {
    var light = new THREE.PointLight(theme.torch, 2.6, 11, 1.5);
    light.position.set(p[0], p[1], p[2]);
    light.castShadow = shadowsOn;
    _room3D.scene.add(light); objs.push(light);
    var flame = new THREE.Mesh(torchGeo, flameMat);
    flame.position.copy(light.position);
    _room3D.scene.add(flame); objs.push(flame);
    torches.push({ light: light, baseIntensity: 2.6, phase: Math.random() * Math.PI * 2 });
  });

  var record = { objects: objs, torches: torches, wallSegments: wallSegments };
  _room3D.builtRooms[key] = record;
  return record;
}

// Builds/disposes so exactly {center + its 4 grid-neighbors that exist in
// the graph} stay live — called whenever the player's current cell changes,
// whether via a button teleport or physically walking across a threshold.
function _syncVisibleRooms(centerCell) {
  if (!_room3D.scene) return;
  _sync3DTheme();
  var hint = document.getElementById('dg-3d-hint'), pad = document.getElementById('dg-3d-movepad');
  var wantsAim = _room3DWantsAimControls();
  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (hint) hint.style.display = wantsAim ? '' : 'none';
  if (pad) pad.style.display = (wantsAim && isTouch) ? 'block' : 'none';
  var keep = {};
  keep[_room3DKey(centerCell.gx, centerCell.gy)] = true;
  ROOM3D_DIRS.forEach(function(d) {
    var nKey = _room3DKey(centerCell.gx + d.dx, centerCell.gy + d.dy);
    if (DS._roomGraph.cells[nKey]) keep[nKey] = true;
  });
  Object.keys(_room3D.builtRooms).forEach(function(key) {
    if (!keep[key]) _disposeRoom(key);
  });
  Object.keys(keep).forEach(function(key) {
    _ensureRoomBuilt(DS._roomGraph.cells[key]);
  });
  _room3D.built = true;
  _renderMinimap();
}

function _rebuildAllVisibleRooms() {
  if (!_room3D.scene || !DS._roomGraph || !DS._gridPos) return;
  _disposeAllRooms();
  var cell = DS._roomGraph.cells[_room3DKey(DS._gridPos.gx, DS._gridPos.gy)];
  if (cell) _syncVisibleRooms(cell);
}

// Places the camera at a cell's center, facing whichever door it actually
// has (layouts are randomized, so a fixed orientation would sometimes face
// straight into a wall) — used for cold-start and floor-advance, where
// there's no sense of "arriving from" a direction.
function _placeCameraAt(cell) {
  _syncVisibleRooms(cell);
  var ox = cell.gx * _room3D.ROOM_W, oz = cell.gy * _room3D.ROOM_D;
  _room3D.camera.position.set(ox, 1.6, oz);
  var yaw = 0;
  if (cell.doors.S) yaw = Math.PI;
  else if (cell.doors.E) yaw = Math.PI / 2;
  else if (cell.doors.N) yaw = 0;
  else if (cell.doors.W) yaw = -Math.PI / 2;
  _room3D.yaw = yaw; _room3D.pitch = 0;
  _room3D.lastCellKey = _room3DKey(cell.gx, cell.gy);
}

// Button-tap movement still exists alongside free walking — it's the only
// option for screen-reader players who opted into 3D Mode's audio without
// the visual renderer, and a fast option for sighted players too. A fade
// hides the instant camera jump between rooms.
function _teleport3DTo(cell) {
  if (!_room3DWantsVisual() || !_room3D.renderer) return;
  var fade = document.getElementById('dg-3d-fade');
  if (fade) fade.style.opacity = '1';
  setTimeout(function() {
    _placeCameraAt(cell);
    if (fade) setTimeout(function() { fade.style.opacity = '0'; }, 30);
  }, 240);
}

function _bind3DLook(el) {
  var dragging = false, lastX = 0, lastY = 0, activeId = null;
  function onMove(x, y) {
    var dx = x - lastX, dy = y - lastY;
    lastX = x; lastY = y;
    _room3D.yaw -= dx * 0.006;
    _room3D.pitch = Math.max(-1.0, Math.min(1.0, _room3D.pitch - dy * 0.006));
  }
  // passive:false + preventDefault() here is load-bearing — without it, a
  // real device's native page-scroll / overscroll gesture competes with (and
  // usually wins over) the camera look, so the drag "does nothing" visually
  // even though the yaw/pitch math underneath is actually running correctly.
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

// On-screen d-pad for touch devices — desktop gets WASD/arrows instead (see
// the keydown/keyup listeners near the top of this section). Bound once;
// the buttons are static DOM, not rebuilt per room.
function _bind3DMovePad() {
  var pad = document.getElementById('dg-3d-movepad');
  if (!pad) return;
  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch && _room3DWantsAimControls()) pad.style.display = 'block';
  function bindHold(id, key) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.touchAction = 'none';
    var start = function(e) { e.preventDefault(); _room3D.moveTouch[key] = true; };
    var end = function(e) { if (e) e.preventDefault(); _room3D.moveTouch[key] = false; };
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', end, { passive: false });
    el.addEventListener('touchcancel', end, { passive: false });
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
  }
  bindHold('dg3d-mv-up', 'forward');
  bindHold('dg3d-mv-down', 'backward');
  bindHold('dg3d-mv-left', 'left');
  bindHold('dg3d-mv-right', 'right');
}

// Circle-vs-segment collision against every built room's wall segments,
// iterated a few passes so a fix against one wall doesn't reintroduce
// overlap with another (matters most near corners and doorway edges) —
// same approach validated in the standalone proof-of-concept.
var ROOM3D_PLAYER_RADIUS = 0.4;
function _resolve3DCollision(px, pz) {
  var segs = [];
  Object.keys(_room3D.builtRooms).forEach(function(key) {
    segs = segs.concat(_room3D.builtRooms[key].wallSegments);
  });
  for (var pass = 0; pass < 4; pass++) {
    var moved = false;
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      var vx = s.x2 - s.x1, vz = s.z2 - s.z1;
      var len2 = vx * vx + vz * vz;
      var t = len2 > 0 ? ((px - s.x1) * vx + (pz - s.z1) * vz) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      var cx = s.x1 + t * vx, cz = s.z1 + t * vz;
      var dx = px - cx, dz = pz - cz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < ROOM3D_PLAYER_RADIUS && dist > 0.0001) {
        var push = (ROOM3D_PLAYER_RADIUS - dist);
        px += (dx / dist) * push; pz += (dz / dist) * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return { x: px, z: pz };
}

function _room3DWorldToCell(x, z) {
  return { gx: Math.round(x / _room3D.ROOM_W), gy: Math.round(z / _room3D.ROOM_D) };
}

// Called every frame the player has physically moved. Walking across a
// doorway threshold does exactly what a button tap does — updates
// DS._gridPos, marks the room visited, announces it, and (for a room seen
// for the first time) calls enterRoom(), the same combat/loot/event/floor-
// completion pipeline every dungeon already uses. The only thing that
// changes between "walked there" and "tapped a button to get there" is how
// the camera arrived; everything downstream is identical.
function _check3DCellCrossing() {
  var pos = _room3DWorldToCell(_room3D.camera.position.x, _room3D.camera.position.z);
  var key = _room3DKey(pos.gx, pos.gy);
  if (key === _room3D.lastCellKey) return;
  _room3D.lastCellKey = key;
  var target = DS._roomGraph.cells[key];
  // Shouldn't happen — collision only lets the player pass through an actual
  // door, which only exists between two real graph cells — but never let a
  // bad read crash movement.
  if (!target) return;
  DS._gridPos = { gx: pos.gx, gy: pos.gy };
  var wasVisited = target.visited;
  target.visited = true;
  _syncVisibleRooms(target);
  var exitText = _room3DExitsText(target);
  if (!wasVisited) {
    say('Entering. ' + exitText);
    enterRoom();
  } else {
    say('Back in a cleared room. ' + exitText);
  }
  play3DExitCues(target);
  hunterTurn(false);
}

function _start3DLoop() {
  if (_room3D.raf || !_room3D.renderer) return;
  var clock = new _room3D.THREE.Clock();
  var frameCount = 0, fpsAccum = 0;
  function loop() {
    _room3D.raf = requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.1);
    var t = clock.elapsedTime;
    var s3 = get3DSettings();
    if (s3.torchFlicker !== false) {
      Object.keys(_room3D.builtRooms).forEach(function(key) {
        _room3D.builtRooms[key].torches.forEach(function(tc) {
          var flick = Math.sin(t * 8 + tc.phase) * 0.15 + Math.sin(t * 23 + tc.phase) * 0.08;
          tc.light.intensity = tc.baseIntensity + flick;
        });
      });
    }

    // ── Free-roam walking (keyboard + touch d-pad) ──
    // Frozen during combat/inventory/etc — showDgPanels() already stops this
    // whole loop then, but DS.inCombat can flip true mid-frame (the instant
    // a room-entry ambush fires), so this is a second, cheaper guard against
    // the player sliding around during the frame combat actually starts.
    if (!DS.inCombat) {
      var mv = _room3D.move, mt = _room3D.moveTouch;
      var dx = 0, dz = 0;
      if (mv.forward || mt.forward) dz -= 1;
      if (mv.backward || mt.backward) dz += 1;
      if (mv.left || mt.left) dx -= 1;
      if (mv.right || mt.right) dx += 1;
      if (dx || dz) {
        var len = Math.sqrt(dx * dx + dz * dz);
        dx /= len; dz /= len;
        var speed = 3.2 * dt;
        var sinY = Math.sin(_room3D.yaw), cosY = Math.cos(_room3D.yaw);
        var worldDx = dx * cosY - dz * sinY;
        var worldDz = dx * sinY + dz * cosY;
        var nx = _room3D.camera.position.x + worldDx * speed;
        var nz = _room3D.camera.position.z + worldDz * speed;
        var resolved = _resolve3DCollision(nx, nz);
        _room3D.camera.position.x = resolved.x;
        _room3D.camera.position.z = resolved.z;
        _check3DCellCrossing();
        _room3D.footstepAccum += dt;
        if (_room3D.footstepAccum > 0.45) { _room3D.footstepAccum = 0; sfx('sfx-footstep'); }
      } else {
        _room3D.footstepAccum = 0;
      }
    }

    _room3D.camera.rotation.order = 'YXZ';
    _room3D.camera.rotation.y = _room3D.yaw;
    _room3D.camera.rotation.x = _room3D.pitch;
    _room3D.renderer.render(_room3D.scene, _room3D.camera);
    var fpsEl = document.getElementById('dg-3d-fps');
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

function _stop3DLoop() {
  if (_room3D.raf) { cancelAnimationFrame(_room3D.raf); _room3D.raf = null; }
}

function _resize3DView() {
  if (!_room3D.renderer) return;
  var wrapEl = document.getElementById('dg-3d-canvas-wrap');
  if (!wrapEl) return;
  var w = wrapEl.clientWidth || 300, h = wrapEl.clientHeight || 220;
  _room3D.camera.aspect = w / h;
  _room3D.camera.updateProjectionMatrix();
  _room3D.renderer.setSize(w, h);
}

function generateFloorRooms() {
  var total = DS.floorRoomsNeeded || 7;
  var rooms = [];
  // Always start with a normal room
  rooms.push('normal');
  // Middle rooms — mix of normal and special
  for (var i = 1; i < total - 1; i++) {
    var roll = Math.random();
    var cumulative = 0;
    var picked = 'normal';
    for (var j = 0; j < SPECIAL_ROOMS.length; j++) {
      cumulative += SPECIAL_ROOMS[j].chance;
      if (roll < cumulative) { picked = SPECIAL_ROOMS[j].type; break; }
    }
    rooms.push(picked);
  }
  // Last room before stairs — always normal or combat
  rooms.push('normal');
  DS._floorRoomSequence = rooms;
  DS._floorRoomIdx = 0;
}

function getNextRoomType() {
  if (!DS._floorRoomSequence || DS._floorRoomIdx >= DS._floorRoomSequence.length) {
    return 'normal';
  }
  return DS._floorRoomSequence[DS._floorRoomIdx++];
}
// ── END PROCEDURAL ROOM TYPES ──

var ROOM_DESCS = [
  // Early floors (1-3) — unsettling but navigable
  'The silence here is absolute. Your breathing sounds like a desecration.',
  'Torch sconces line the walls — every flame extinguished long ago. Something put them out.',
  'The floor is covered in a thin layer of ash. No footprints disturb it. Until now.',
  'An inscription on the wall reads in an old tongue. One word stands out: "Wait."',
  'A cold draft comes from nowhere. The hairs on your neck rise before you understand why.',
  'The bones of a previous explorer lie here, still clutching a rusted blade.',
  'Water drips somewhere in the dark. The rhythm is too regular. Too deliberate.',
  'The room smells of old iron and something sweet that turns your stomach.',
  'Carved faces watch you from the walls. Their expressions change when you look away.',
  'You hear nothing. That is the problem. Even your footsteps are swallowed by the dark.',
  'The ceiling here is low. You must hunch. Something about that feels intentional.',
  'A broken altar stands in the center. Whatever was worshipped here, it was not light.',
  'The walls are damp. The moisture is warm. You do not investigate further.',
  'Crude marks scratched at eye level — a tally. You count two hundred and forty-three.',
  'Every instinct screams to go back. You go forward.',
  'The door behind you closes on its own. You did not touch it.',
  'A lantern lies smashed on the floor. The oil has not dried. Someone was just here.',
  'The room is perfectly square. That would be unremarkable if the dungeon were not round.',
  'Cobwebs cover every surface. Not from spiders. The strands are too thick.',
  'A chair sits in the center of the room. One leg is freshly broken. Recently.',
  // Mid floors (4-6) — darker, stranger
  'The air here is wrong. Not cold, not warm. Absent. Like the room forgot to have weather.',
  'You step on something soft. You do not look down.',
  'The walls here are smooth — too smooth. Ground down by something larger than a hand.',
  'A door on the far side is barricaded from this side. Someone wanted to keep something out.',
  'The floor slopes slightly toward the center. The drain there is large enough to be concerning.',
  'Text covers every inch of the walls. The same three words, repeated endlessly: "It is here."',
  'A child\'s toy sits in the corner. It should not be here. Nothing small enough to own it should be here.',
  'The shadows in the corners are the wrong shape. You count them twice. The number changes.',
  'Something has been fed here regularly. You can tell by the stains.',
  'The room gets quieter as you move toward the center. At the exact middle, there is no sound at all.',
  'A mirror on the wall shows your reflection correctly. After a moment, it does not.',
  'The room is warm. The warmth comes from below the floor. You do not dig.',
  'Three doors. Two are sealed from the other side. You take the third.',
  'The ceiling is painted with stars. They are not in any constellation you recognize.',
  'Someone left a meal here. It is still warm. There is no one.',
  // Deep floors (7+) — genuinely threatening
  'The dungeon has changed. You feel it. The walls breathe.',
  'Everything here is wrong in ways you cannot name. You move quickly.',
  'The air is thick with something old. It coats your lungs. You do not stop moving.',
  'You have the sense of being watched by something that has been watching for centuries.',
  'The room is larger than the dungeon should allow. Physics has stopped applying.',
  'There are no shadows here. Every surface is lit equally, from no source. That is worse.',
  'A sound behind you. You spin. Nothing. The sound was your name.',
  'The walls pulse. Slowly. In time with something you cannot hear but your body recognizes.',
  'This deep, the dungeon is aware of you. You are aware of the dungeon. You both wait.',
  'A whisper. Not in your ear. In your chest. Not words. Intent.',
  'The floor here is worn smooth by countless footsteps. None of them left.',
  'Something has nested in this room and left. The nest is large. You are glad it left.',
  'The darkness here is not an absence of light. It is a presence.',
  'You feel a pressure behind your eyes. The dungeon is looking through them.',
  'Every torch you light goes out before you can step away. You stop lighting them.',
];

var FLOOR_NAMES = [
  '',
  'Burial Antechamber','The Dark Corridor','Ossuary','Forgotten Vault','The Warden\'s Hall',
  'Chamber of Silence','Tomb of the Fallen','The Inner Sanctum','Hall of Malachar','The Final Chamber',
  'The Hollow Nave','Corridor of Sighs','The Bone Gallery','Crypt of the Nameless','The Sealed Wing',
  'Charnel Hall','The Sunken Passage','Vault of Echoes','The Whispering Arch','Tomb of Regret',
  'The Crumbling Nave','Chamber of the Lost','The Interment Hall','The Lightless Passage','Reliquary',
  'The Forsaken Gallery','Crypt of Whispers','Hall of the Interred','The Deep Chamber','The Final Dark',
];

var LOOT = [
  { name:'Health Potion',   icon:'🧪', type:'potion',        heal:40,  desc:'Restores 40 HP.' },
  { name:'Greater Potion',  icon:'💊', type:'potion',        heal:70,  desc:'Restores 70 HP.' },
  { name:'Defense Potion',  icon:'🛡️', type:'def-potion',   bonus:4,  duration:3, desc:'Increases defense by 4 for 3 turns.' },
  { name:'Attack Potion',   icon:'⚔️', type:'atk-potion',   bonus:5,  duration:3, desc:'Increases attack by 5 for 3 turns.' },
  { name:'Lucky Potion',    icon:'🍀', type:'luck-potion',   desc:'Doubles your gold from the next 3 enemy kills.' },
  { name:'Fire Potion',     icon:'🔥', type:'fire-potion',   desc:'Throw at enemy — deals 40% of their max HP as fire damage. Ignores defense.' },
  { name:'Curse Potion',    icon:'☠️', type:'curse-potion',  desc:'Curses an enemy — weakens their attack by 50% for 3 turns.' },
  { name:'Swift Potion',    icon:'💨', type:'swift-potion',  desc:'Guaranteed flee this turn AND the next. Perfect for escape.' },
  { id:'ancient-blade',    name:'Ancient Blade',  icon:'⚔️', type:'weapon', weaponType:'sword',  level:1, atkBase:[6,12], isEquippable:true, desc:'A blade found in the depths.' },
  { id:'ember-sword',      name:'Ember Sword',    icon:'🔥', type:'weapon', weaponType:'sword',  level:1, atkBase:[7,14], isEquippable:true, desc:'Scorched but sharp.' },
  { id:'bone-staff',       name:'Bone Staff',     icon:'💀', type:'weapon', weaponType:'staff',  level:1, atkBase:[5,11], isEquippable:true, desc:'Carved from dungeon bone.' },
  { name:'Iron Shield',    icon:'🛡️', type:'armor', armorType:'light', defBase:3, level:1, isEquippable:true, desc:'Reduces incoming damage by 3.' },
  { name:'Thief Ring',     icon:'💍', type:'ring', effect:'flee', desc:'Makes fleeing easier.' },
  { name:'Bloodstone',     icon:'🔴', type:'gem', gold:20, desc:'Worth 20 gold.' },
  { id:'rune-strength',   name:'Rune of Strength',   icon:'🔴', type:'rune', desc:'+6 attack for the rest of this run.' },
  { id:'rune-protection', name:'Rune of Protection', icon:'🔵', type:'rune', desc:'+5 defense for the rest of this run.' },
  { id:'rune-speed',      name:'Rune of Speed',      icon:'🟡', type:'rune', desc:'Flee always succeeds this run.' },
  { id:'rune-vitality',   name:'Rune of Vitality',   icon:'🟣', type:'rune', desc:'+20 max HP this run.' },
  { id:'scroll-reveal',   name:'Scroll of Reveal',   icon:'📜', type:'scroll', desc:'Reveals the next 3 room types.' },
  { id:'scroll-smite',    name:'Scroll of Smite',    icon:'⚡', type:'scroll', desc:'80 unblockable damage to current enemy.' },
  { id:'scroll-mending',  name:'Scroll of Mending',  icon:'✨', type:'scroll', desc:'Heals 50% max HP outside combat.' },
  { name:'Elixir of Life', icon:'✨', type:'elixir', healPct:0.60, desc:'Restores 60% of max HP. A rare treasure worth saving.' },
  { name:'Gravebound Elixir', icon:'💀', type:'elixir', healPct:0.60, desc:'Restores 60% of max HP. Bottled in the Crypt of Malachar.' },
  { name:'Tidal Elixir', icon:'🌊', type:'elixir', healPct:0.60, desc:'Restores 60% of max HP. Drawn from the Abyssal Deep.' },
];

var HP_MAP = { Warrior:120, Monk:90, Assassin:80, Paladin:130, Naturalist:85, Sorcerer:70, Necromancer:75, Berserker:110, Bard:80, Alchemist:85, BloodKnight:100, Druid:95, Warlock:75, DeathKnight:115, Ranger:90, Sentinel:145, Cleric:105, Wizard:60 };
var ATK_MAP = { Warrior:[8,16], Monk:[7,14], Assassin:[10,18], Paladin:[6,13], Naturalist:[6,12], Sorcerer:[12,22], Necromancer:[7,14], Berserker:[9,17], Bard:[6,12], Alchemist:[7,14], BloodKnight:[10,20], Druid:[7,14], Warlock:[9,17], DeathKnight:[8,16], Ranger:[9,17], Sentinel:[5,11], Cleric:[6,12], Wizard:[14,24] };
var DEF_MAP = { Warrior:3, Monk:1, Paladin:5, Assassin:0, Naturalist:1, Sorcerer:0, Necromancer:0, Berserker:2, Bard:1, Alchemist:1, BloodKnight:2, Druid:2, Warlock:0, DeathKnight:4, Ranger:1, Sentinel:7, Cleric:3, Wizard:0 };
var LIVES_MAP = { Wanderer:3, Ironblood:1, Condemned:1, Forsaken:1, Nightmare:1, Endless:2, Insane:1 };

var DS = {};

function initDungeon(ch) {
  _briefPending = false; _briefWeather = null;
  var maxHp = HP_MAP[ch.cls] || 100;
  // Clean up any weapon/armor/enchanter/soul-trap duplicates left over from the
  // addToGlobalInventory() dedup bug, and persist the cleanup so it doesn't
  // have to redo this every run start.
  var _rawGlobalInv = getGlobalInventory();
  var _cleanGlobalInv = dedupeInventoryArray(_rawGlobalInv);
  if (_cleanGlobalInv.length !== _rawGlobalInv.length) saveGlobalInventory(_cleanGlobalInv);
  DS = {
    name: ch.name, cls: ch.cls, race: ch.race, prof: ch.prof,
    dungeon: ch.dungeon, diff: ch.difficulty,
    floor: Math.max(ch.floor || 1, 1), roomsOnFloor: 0, totalRooms: 0, floorRoomsNeeded: 6, hpAtFloorStart: 0,
    maxHp: maxHp, hp: maxHp,
    maxLives: LIVES_MAP[ch.difficulty] || 1,
    lives: LIVES_MAP[ch.difficulty] || 1,
    atk: ATK_MAP[ch.cls] || [6,12],
    def: DEF_MAP[ch.cls] || 0,
    gold: 0, inventory: _cleanGlobalInv,
    equippedWeapon: null, equippedArmor: null,
    atkBonus: 0, defBonus: 0,
    defending: false, inCombat: false, enemy: null,
    searched: false, kills: 0,
    potionMult: ch.prof === 'Herbalist' ? 2 : 1,
    undeadRes: ch.prof === 'Gravedigger',
    scholarProf: ch.prof === 'Scholar',
    pilgrimProf: ch.prof === 'Pilgrim',
    graveRobberProf: ch.prof === 'Grave Robber',
    streetRatProf: ch.prof === 'Street Rat',
    wardenProf: ch.prof === 'Warden',
    tinkererProf: ch.prof === 'Tinkerer',
    // XP and leveling
    xp: 0, level: 1,
    // SP (skill points)
    sp: 20, maxSp: 20,
    // Skill status flags
    markedKill: false, divineShield: false, manaShield: 0, venomTurns: 0,
    usedPotion: false, frozen: false, ngPlus: false, dailyChallenge: null,
    unlockedSkills: [], skillPool: [],
    activeSpirit: ch.lastSpirit ? (getSpiritById(ch.lastSpirit) || null) : null, frostSpriteAura: 0,
    runLog: [],
    dddiDefeated: false,
    foundFragments: [],
    hunterMode: ch.hunterMode || false,
    hardcoreMode: ch.hardcoreMode || false,
    guidePersonality: ch.guidePersonality || 'encouraging',
    guideEnabled: ch.guideEnabled !== false,
    hunterDist: 10,
    hunterPhase: 1,
    hunterIdleTurns: 0,
    hunterAlive: ch.hunterMode || false,
    wepingChildSoothedThisRun: false,
    medusaEncounteredThisRun: false,
    medusaJoined: false,
    medusaFatherFound: false,
    medusaTempSpirit: false,
    medusaGuardActive: false,
    petrified: false,
    gazeDefTimer: 0,
    playerHaunted: 0,
    bestDmgThisRun: 0,
    taunted: 0, fortify: 0, barkskin: 0, consecrate: 0, sanctuary: 0,
    windStep: false, shadowForm: 0, holyLight: 0, zenStrike: 0,
    transcendence: 0, sacredBlade: 0, deathMark: 0, lethalTempo: 0,
    auraOfFaith: false, holyCrusade: false, warlord: false,
    unstoppable: 0, resurrection: false, wildGrowth: 0,
    stickyBomb: 0, unlimitedPower: 0, gravityWell: 0,
    bossPhase: 1,
    journalLog: []
  };
  if (ch.prof === 'Mercenary') {
    DS.gold = 15;
    DS.inventory.push({ name:'Mercenary Blade', icon:'⚔️', type:'weapon', atkBonus:3, desc:'+3 attack.' });
    DS.atkBonus += 3;
  }
  // Apply coin shop upgrades
  applyCoinUpgrades();
  // Apply bestiary milestone buffs
  applyMilestoneBuffs();
  // Apply dream buffs from last home sleep, then clear
  if (DS.dreamAtkBonus)   { DS.atkBonus  = (DS.atkBonus||0)  + DS.dreamAtkBonus;  addRunLog('Dream buff: +' + DS.dreamAtkBonus + ' ATK', 'good'); }
  if (DS.dreamDefBonus)   { DS.defBonus  = (DS.defBonus||0)  + DS.dreamDefBonus;  addRunLog('Dream buff: +' + DS.dreamDefBonus + ' DEF', 'good'); }
  if (DS.dreamSpBonus)    { DS.maxSp     = (DS.maxSp||20)    + DS.dreamSpBonus; DS.sp = DS.maxSp; addRunLog('Dream buff: +' + DS.dreamSpBonus + ' max SP', 'good'); }
  if (DS.dreamHpBonus)    { DS.maxHp     = (DS.maxHp||100)   + DS.dreamHpBonus; DS.hp = DS.maxHp; addRunLog('Dream buff: +' + DS.dreamHpBonus + ' max HP', 'good'); }
  if (DS.dreamPotionBoost){ DS.potionMult = (DS.potionMult||1) * (1 + DS.dreamPotionBoost); addRunLog('Dream buff: potions heal more', 'good'); }
  if (DS.dreamFleeBonus)  { DS.fleeBonus = (DS.fleeBonus||0) + DS.dreamFleeBonus; addRunLog('Dream buff: +flee chance', 'good'); }
  // Clear dream buffs so they don't carry over to next run
  DS.dreamAtkBonus = 0; DS.dreamDefBonus = 0; DS.dreamSpBonus = 0;
  DS.dreamHpBonus = 0; DS.dreamPotionBoost = 0; DS.dreamFleeBonus = 0; DS.dreamGoldMult = 1;
  if (_charIdx !== null && CHARS[_charIdx]) { CHARS[_charIdx].dream = null; saveChars(); }
  // Reset sleep cooldown so home bed works correctly in new runs
  var _homeSave = getHomeSave();
  _homeSave.lastSleepRoom = 0;
  saveHome(_homeSave);
  // Hunter Mode startup
  if (DS.hunterMode) {
    DS.hunterAlive = true;
    DS.hunterDist = 10;
    DS.hunterPhase = 1;
    DS.hunterIdleTurns = 0;
    setTimeout(function() {
      var hunterRow = document.getElementById('dg-hunter-row');
      if (hunterRow) hunterRow.style.display = '';
      updateHunterBar();
      var introMsg = '🏹 Hunter Mode active. Something has entered the dungeon behind you. It is 10 rooms away. Keep moving.';
      addLog(introMsg);
      say(introMsg);
    }, 1500);
  }
  // Apply NG+ if character has it
  if (ch.ngPlusActive) DS.ngPlus = true;

  // ── Restore equipped gear from global storage ──
  var savedWeapon = DDStore.getItem('dd_equipped_weapon');
  var savedArmor = DDStore.getItem('dd_equipped_armor');
  if (savedWeapon) {
    try {
      var w = JSON.parse(savedWeapon);
      DS.equippedWeapon = w;
      var atk = getWeaponAtk(w);
      DS.equippedWeaponAtk = atk;
      if (Array.isArray(atk) && !isNaN(atk[0]) && !isNaN(atk[1])) {
        DS.atkBonus += Math.floor((atk[0] + atk[1]) / 2);
      }
    } catch(e) { DDStore.removeItem('dd_equipped_weapon'); }
  }
  if (savedArmor) {
    try {
      var a = JSON.parse(savedArmor);
      DS.equippedArmor = a;
      var def = a.defBase || a.defBonus || 0;
      DS.equippedArmorDef = def;
      DS.defBonus += def;
    } catch(e) { DDStore.removeItem('dd_equipped_armor'); }
  }

  // ── Sync global gold into dungeon ──
  var globalGold = getGlobalGold();
  if (!isNaN(globalGold) && globalGold > 0) DS.gold = globalGold;
  else DS.gold = 0;
  // Init stat bonuses
  DS.critBonus = 0;
  DS.luckBonus = 0;
  // Sync keepable items from global inventory into DS.inventory at run start
  try {
    var _keepTypes = ['soul-trap','enchanter','music-player','skill-orb','sp-potion','rune','scroll'];
    var _gInv = getGlobalInventory();
    var _keepItems = _gInv.filter(function(i){ return _keepTypes.indexOf(i.type) !== -1; });
    if (_keepItems.length > 0) {
      // Add any missing keepable items to DS.inventory
      _keepItems.forEach(function(ki) {
        var already = DS.inventory.some(function(di){ return di.type === ki.type && di.name === ki.name; });
        if (!already) DS.inventory.push(ki);
      });
    }
  } catch(e2) {}

  // ── Init corruption display ──
  updateCorruptionDisplay();
  var ch2 = CHARS[_charIdx];
  if (ch2 && ch2.corruptionMode && ch2.corruption >= 25) scheduleCorruptionWhisper();
  if (ch2 && ch2.corruptionMode && ch2.corruption >= 50) DS._corruptedHunterActive = true;
  if (ch2 && ch2.corruptionMode && ch2.corruption >= 75) DS._skillsBackfire = true;
  if (ch2 && ch2.corruptionMode && ch2.corruption >= 100) DS._corruptionRun = true;

  // ── LEGACY MODE: dungeon tier scaling ──
  if (ch.runMode === 'legacy' && ch.dungeonTier && ch.dungeonTier > 1) {
    DS.dungeonTier = ch.dungeonTier;
    // Each tier adds 20% enemy HP and 10% damage
    DS._tierHpMult = 1 + ((ch.dungeonTier - 1) * 0.20);
    DS._tierAtkMult = 1 + ((ch.dungeonTier - 1) * 0.10);
    // Better gold rewards per tier
    DS._tierGoldMult = 1 + ((ch.dungeonTier - 1) * 0.15);
    // Announce tier
    setTimeout(function() {
      setEvent('good', '🌑 Legacy — Dungeon Tier ' + ch.dungeonTier + '. Enemies are ' + Math.round((DS._tierHpMult-1)*100) + '% stronger. Gold rewards ' + Math.round((DS._tierGoldMult-1)*100) + '% higher.');
      say('Legacy Mode. Dungeon Tier ' + ch.dungeonTier + '. Enemies are ' + Math.round((DS._tierHpMult-1)*100) + ' percent stronger.');
    }, 1500);
  }

  // Apply daily challenge
  applyDailyChallenge();
  // Apply starting gold upgrade
  if (hasUpgrade('cu-starting-gold')) DS.gold += 15; addGlobalGold(15);
  showDgPanels(true, false, false);
  document.getElementById('dg-end').style.display = 'none';
  updateXPBar();
  updateSkillButtons();
  document.getElementById('boss-phase-bar').style.display = 'none';
  // Start journal for new run
  DS.journalLog = (CHARS[_charIdx] && CHARS[_charIdx].journal) ? [] : [];
  addJournalEntry('Descended into ' + DS.dungeon + ' on ' + DS.diff + ' difficulty.');
  // Apply persistent character level from AFK/previous runs
  applyPersistentLevelToDS();
  // Apply race bonuses
  if (DS.race === 'Halfling') {
    DS.halflingDodge = true; // 15% miss chance
    DS.luckBonus = (DS.luckBonus || 0) + 0.15;
    DS.atk[0] = Math.max(1, DS.atk[0] - 2);
    DS.atk[1] = Math.max(2, DS.atk[1] - 2);
  }
  // Apply profession bonuses at run start
  if (DS.pilgrimProf)     { DS.xpBoost = (DS.xpBoost || 1) * 1.15; }
  if (DS.graveRobberProf) { DS.gold += 50; addGlobalGold(50); DS.graveRobberLoot = true; }
  if (DS.streetRatProf)   {
    if (DS.unlockedSkills.indexOf('smoke-bomb') === -1) DS.unlockedSkills.push('smoke-bomb');
    DS.fleeBonus = 0.20;
  }
  if (DS.wardenProf)      { DS.defBonus += 3; DS.wardenImmune = true; }
  if (DS.tinkererProf)    {
    DS.inventory.push({ name:'Health Potion', icon:'🧪', type:'potion', heal:40, desc:'Restores 40 HP.' });
    DS.inventory.push({ name:'Health Potion', icon:'🧪', type:'potion', heal:40, desc:'Restores 40 HP.' });
    DS.tinkererDiscount = 2;
  }
  // Load stored alchemy potions crafted at home
  try {
    var _storedPotions = _jsonParseSafe(DDStore.getItem('dd_alchemy_stored'), '[]');
    if (_storedPotions.length > 0) {
      _storedPotions.forEach(function(p){ DS.inventory.push(p); });
      DDStore.removeItem('dd_alchemy_stored');
      addLog('🧪 ' + _storedPotions.length + ' crafted potion' + (_storedPotions.length > 1 ? 's' : '') + ' from your Alchemy Table added to inventory.');
    }
  } catch(e2) {}
  // Init random skill pool
  initSkillPool();
  trackGlobalStat('runsStarted', 1);
  // Class and race bonuses on dungeon start
  if (ACCESS.classTraits) {
    // Ranger — bonus damage on first hit, +15% flee, better loot
    if (ch.cls === 'Ranger') { DS.rangerFirstHit = true; DS.fleeBonus = (DS.fleeBonus||0) + 0.15; }
    // Sentinel — highest HP, takes 25% less damage, deals 20% less
    if (ch.cls === 'Sentinel') { DS.sentinelPassive = true; DS.atkBonus = Math.round((DS.atkBonus||0) * 0.80); }
    // Dragonborn RACE — fire breath 10% burn chance
    if (ch.race === 'Dragonborn') DS.dragonbornRace = true;
    // Gnome race — skills cost 2 less SP
    if (ch.race === 'Gnome') { DS.sp += 10; DS.maxSp += 10; DS.gnomeRace = true; }
    // Merfolk race — potion bonus heal
    if (ch.race === 'Merfolk') DS.merfolkRace = true;
    // Merfolk bonus in Sunken Archives
    if (ch.race === 'Merfolk' && ch.dungeon === 'The Sunken Archives') {
      DS.maxHp = Math.round(DS.maxHp * 1.10);
      DS.hp = DS.maxHp;
      DS.atkBonus += 3;
      addLog && addLog('🌊 Merfolk in their element — +10% HP and +3 attack in the Sunken Archives!');
    }
    // Demon race — +15% damage dealt AND taken
    if (ch.race === 'Demon') { DS.demonRace = true; DS.atkBonus += 2; }
    // Alchemist — potions heal 60% instead of 45%
    if (ch.cls === 'Alchemist') DS.alchemistPassive = true;
    // Berserker — cannot flee, more attack, less defense
    if (ch.cls === 'Berserker') { DS.berserkerTrait = true; DS.atkBonus += 3; DS.defBonus = Math.max(0, DS.defBonus - 1); }
    // Dragonborn — +15% all damage
    if (ch.cls === 'Dragonborn') DS.dragonbornBonus = 1.15;
    // Sorcerer — starts with less HP
    // (the Sorcerer's Glass Cannon trait already caps HP at 80%; cutting it here too left 68%)
    if (ch.cls === 'Sorcerer' && !ACCESS.classTraits) { DS.maxHp = Math.round(DS.maxHp * 0.85); DS.hp = DS.maxHp; }
    // Wizard — starts with even less HP but high atk
    if (ch.cls === 'Wizard') { DS.maxHp = Math.round(DS.maxHp * 0.80); DS.hp = DS.maxHp; }
    if (ch.cls === 'Elementalist') { DS.maxHp = Math.round(DS.maxHp * 0.85); DS.hp = DS.maxHp; }
    if (ch.cls === 'VoidWalker') { DS.maxHp = Math.round(DS.maxHp * 0.80); DS.hp = DS.maxHp; }
    if (ch.cls === 'ShadowMage') { DS.maxHp = Math.round(DS.maxHp * 0.85); DS.hp = DS.maxHp; }
    if (ch.cls === 'TimeMage') { DS.maxHp = Math.round(DS.maxHp * 0.82); DS.hp = DS.maxHp; }
    if (ch.cls === 'Shaman') { DS.maxHp = Math.round(DS.maxHp * 0.90); DS.hp = DS.maxHp; }
    if (ch.cls === 'Arcanist') { DS.maxHp = Math.round(DS.maxHp * 0.78); DS.hp = DS.maxHp; }
    // Angel race — extra life
    if (ch.race === 'Angel') { DS.lives = (DS.lives || 1) + 1; DS.maxLives = (DS.maxLives || 1) + 1; }
  }
  // Init Insane Mode
  if (ch.difficulty === 'Insane') {
    DS.lives = 1; DS.maxLives = 1;
    initInsaneMode();
  } else {
    stopInsaneMode();
  }
  // Roll weather
  if (ch.dungeon === 'The Hollow') {
    var weather = rollHollowWeather();
    _briefWeather = weather;
    applyHollowWeatherBonuses();
    _dungeonWeather = null;
    setTimeout(function() {
      var wb = document.getElementById('dg-weather-banner');
      if (wb) { wb.textContent = weather.icon + ' ' + weather.name + ' — ' + weather.effect; wb.style.display = ''; }
      if (!_briefPending) say('Tonight in the Hollow: ' + weather.name + '. ' + weather.desc);
    }, 2500);
  } else if (ch.dungeon === 'The Abyssal Deep') {
    _hollowWeather = null;
    _dungeonWeather = null;
    var dweather = rollAbyssalWeather();
    _briefWeather = dweather;
    applyDungeonWeatherBonuses();
    setTimeout(function() {
      var wb = document.getElementById('dg-weather-banner');
      if (dweather && dweather.effect !== 'No special effects. An eerie peace.') {
        if (wb) { wb.textContent = dweather.icon + ' ' + dweather.name + ' — ' + dweather.effect; wb.style.display = ''; wb.style.color = '#4488ff'; }
        if (!_briefPending) say('Abyssal condition: ' + dweather.name + '. ' + dweather.desc + ' Effect: ' + dweather.effect);
      } else if (dweather) {
        if (wb) { wb.textContent = dweather.icon + ' ' + dweather.name; wb.style.display = ''; wb.style.color = '#446688'; }
        if (!_briefPending) say('Abyssal condition: ' + dweather.name + '. ' + dweather.desc);
      }
    }, 2500);
  } else {
    _hollowWeather = null;
    var dweather = rollDungeonWeather(ch.dungeon);
    _briefWeather = dweather;
    applyDungeonWeatherBonuses();
    setTimeout(function() {
      var wb = document.getElementById('dg-weather-banner');
      if (dweather && dweather.effect !== 'No special effects.') {
        if (wb) {
          wb.textContent = dweather.icon + ' ' + dweather.name + ' — ' + dweather.effect;
          wb.style.display = '';
          wb.style.color = '#e0c080';
        }
        // Show sequential intro pop-ups, unless the run briefing already covers them
        if (!_briefPending) showDungeonIntroPopups(dweather, ch);
      } else if (dweather) {
        if (wb) { wb.textContent = dweather.icon + ' ' + dweather.name; wb.style.display = ''; wb.style.color = '#888'; }
        if (!_briefPending) say('Dungeon condition: ' + dweather.name + '. ' + dweather.desc);
      } else {
        if (!_briefPending) showDungeonIntroPopups(null, ch);
      }
    }, 2500);
  }
  startRunTimer();
  if (typeof applyClassTraits === 'function') applyClassTraits(ch);
  // Reset gun combat state at start of every run
  try { resetGunState(); } catch(e) {}
  // Reset hunter caught flag
  DS._hunterCaught = false;
  try { companionOnDungeonStart(); } catch(e) {}
  try { checkLeoEasterEgg(ch.name); } catch(e) {}
  // Whisper Forest — ambient corruption ticks up passively while exploring.
  // startCorruptionSystem() existed with a matching stopCorruptionSystem()
  // call on escape-to-menu, but nothing ever called the start half, so the
  // passive tick never ran — only the explicit story-triggered corruption
  // sources (Mask, Mirror, Offering, etc.) ever moved the meter.
  try { if (isWhisperForest()) startCorruptionSystem(); } catch(e) {}
  // Independence Tournament — starts once per character per event window
  try {
    // Once per event (it restarted after every win)
    var _tnYear = String(new Date().getFullYear());
    if (getActiveEvent() === 'july4' && !getJuly4TournamentData().active && DDStore.getItem('dd_july4_tn_year') !== _tnYear) {
      DDStore.setItem('dd_july4_tn_year', _tnYear);
      startJuly4Tournament(_charIdx);
    }
  } catch(e) {}
}

var _roomResolving = false;
function enterRoom() {
  // CRITICAL — never enter a new room while a previous enterRoom() call is
  // still deciding what's in the room it already entered. Normal rooms show
  // the nav panel immediately, then resolve combat/event/nothing ~400ms
  // later via setTimeout — nothing blocked a second tap during that window,
  // so a fast double-tap (or a VoiceOver double-activation) could call
  // enterRoom() again mid-resolution: DS.roomsOnFloor/totalRooms increment
  // twice, and two pending resolutions can land on conflicting outcomes
  // (e.g. one starts combat while the other declares the floor complete),
  // corrupting run state. Block re-entry for that window instead.
  if (_roomResolving) {
    say('Cannot enter room. Please wait.');
    return;
  }
  // CRITICAL — never enter a new room while combat is still active
  if (DS.inCombat && DS.enemy && DS.enemy.hp > 0) {
    say('Cannot enter room during combat.');
    showDgPanels(false, true, false);
    setCombatBtns(true);
    return;
  }
  try { fxTickTrapPoison(); } catch(eTick) {}
  if (DS.druidHollowTrait && DS.dungeon === 'The Hollow' && DS.hp > 0 && DS.hp < DS.maxHp) { DS.hp = Math.min(DS.maxHp, DS.hp + 3); updatePlayerBar(); }
  // CRITICAL — never enter a new room during an active Chimera fight
  // The Chimera uses _chimeraParts instead of DS.enemy, so the check above misses it
  if (_chimeraActive) {
    say('Cannot enter room during combat.');
    renderChimeraScreen();
    return;
  }
  // CRITICAL — never enter a new room while the Weeping Child event is unresolved.
  // Nothing previously blocked this, so a second enterRoom() call (retry tap, nav
  // race) could roll a brand new encounter — including combat — on top of the
  // still-active Weeping Child state instead of just re-showing its choices.
  if (DS.wepingChildActive) {
    say('Cannot enter room. Choose how to respond to the Weeping Child first.');
    triggerWeepingChild();
    return;
  }
  // CRITICAL — never enter a new room while the floor-complete overlay is showing.
  // Once DS.roomsOnFloor reaches floorRoomsNeeded, every enterRoom() call hits that
  // branch again unconditionally (nothing resets those counters until Descend or
  // Wander is actually pressed) — confirmed this stacked a new full-screen overlay
  // on the page on every single call, unbounded. showFloorCompleteScreen() itself
  // is now deduped too; this stops the room-roll logic from even running.
  if (document.getElementById('floor-complete-overlay')) {
    var _fcBtn = document.querySelector('#floor-complete-overlay button');
    if (_fcBtn) _fcBtn.focus();
    say('Cannot enter room. Choose to descend or wander first.');
    return;
  }
  // CRITICAL — never enter a new room while any other choice-driven special
  // encounter is unresolved (Weeping Mother, Medusa, Lord Phorcys, generic
  // dungeon events from rollDungeonEvent, Easter Bunny, etc.). None of these
  // register a state flag the way Chimera/Weeping Child do, so detect it
  // generically instead of hand-tracking every one: if the event box is
  // visible and still has an unresolved choice button in it, block re-entry.
  // (Their outcome handlers clear/replace #dg-event's content on resolution,
  // so this never false-positives after a choice has actually been made.)
  var _dgEventEl = document.getElementById('dg-event');
  if (_dgEventEl && _dgEventEl.style.display !== 'none' && _dgEventEl.querySelector('button')) {
    say('Cannot enter room. Resolve the current event first.');
    return;
  }
  // CRITICAL — same class of bug as the floor-complete overlay, for every other
  // full-screen encounter overlay that's built by hand (document.createElement +
  // document.body.appendChild) instead of reusing #dg-event: NPC Encounter, The
  // Two Doors, the Security Room, the Infernal boss phase alert, the boss death
  // cinematic, and the two dungeon-intro popups. None of these had a dedup check
  // in their own show function OR a guard here, so a second enterRoom() call
  // while one was still up (retry tap, nav race — the same trigger that caused
  // the floor-complete stacking) would let the room-roll logic run underneath
  // it, or in NPC Encounter's case, silently do nothing to stop the overlay
  // itself from ever being cleaned up. Each show*() function below is now
  // deduped too; this just stops enterRoom() from proceeding at all.
  // 'dungeon-intro-overlay' is also the id of a static, permanently-present
  // div (used by the older showDungeonIntro()) that's hidden via CSS
  // display:none by default — checking mere existence made this block
  // enterRoom() forever, on every room, since that div is always in the DOM.
  // Check actual visibility instead so a hidden/closed overlay never blocks.
  var _BLOCKING_OVERLAY_IDS = ['npc-encounter-overlay', 'two-doors-overlay',
    'security-room-overlay', 'ov-infernal-phase', 'boss-death-cinematic',
    'dungeon-intro-overlay', 'dungeon-intro-overlay2'];
  for (var _boi = 0; _boi < _BLOCKING_OVERLAY_IDS.length; _boi++) {
    var _boEl = document.getElementById(_BLOCKING_OVERLAY_IDS[_boi]);
    if (_boEl && getComputedStyle(_boEl).display !== 'none') {
      var _boBtn = _boEl.querySelector('button');
      if (_boBtn) _boBtn.focus();
      say('Cannot enter room. Resolve the current event first.');
      return;
    }
  }
  // Shadow World — check for Stalker Floor before anything else
  if (DS.dungeon === 'The Shadow World' && checkStalkerFloor()) return;
  if (typeof tryNPCEncounter !== 'undefined' && tryNPCEncounter()) return;
  if (DS.hunterMode && DS.hunterAlive) {
    DS.hunterIdleTurns = 0;
    var hunterRow = document.getElementById('dg-hunter-row');
    if (hunterRow) hunterRow.style.display = '';
    updateHunterBar();
  }
  DS.inCombat = false; DS.defending = false; DS.searched = false;
  familiarSpeak();
  // Guard all counters against NaN
  if (isNaN(DS.floor) || !DS.floor) DS.floor = 1;
  if (isNaN(DS.roomsOnFloor) || !DS.roomsOnFloor) DS.roomsOnFloor = 0;
  if (isNaN(DS.totalRooms) || !DS.totalRooms) DS.totalRooms = 0;
  DS.roomsOnFloor++; DS.totalRooms++;
  // First room tip
  if (DS.totalRooms === 1) setTimeout(function(){ showDungeonTip('first-room'); }, 1500);
  // Update bounty banner
  try { updateDungeonBountyBanner(); } catch(e2) {}
  // Update room tracker
  try { updateRoomTracker(); } catch(e2) {}
  // Druid — heal on room enter
  if (DS._druid) { DS.hp = Math.min(DS.maxHp, DS.hp + 6); updatePlayerBar(); }
  // Sylvan Heart relic — room heal
  if (DS.inventory && DS.inventory.some(function(i){ return i.roomHealBonus; })) {
    var sylvHeal = DS.inventory.reduce(function(sum, i){ return sum + (i.roomHealBonus || 0); }, 0);
    if (sylvHeal > 0) { DS.hp = Math.min(DS.maxHp, DS.hp + sylvHeal); updatePlayerBar(); addLog('🌿 Sylvan Heart pulses — +'+ sylvHeal +' HP.'); }
  }
  // Bomb Thrower — recharge bomb each floor
  if (DS._bombThrower && DS.roomsOnFloor === 1) DS._bombReady = true;
  // Dungeon weather room HP loss — deferred so it does not interfere with combat init
  setTimeout(function(){ try { applyDungeonWeatherRoomHpLoss(); } catch(e) {} }, 50);
  // Regenerate SP on room enter
  if (DS.sp !== undefined) {
    DS.sp = Math.min(DS.maxSp, DS.sp + 2);
    updateXPBar();
    updateSkillButtons();
  }
  // Play correct floor exploration track + ambient
  playTrack(exploTrackForFloor(DS.floor));
  var ambKey = getAmbientKey();
  if (_ambientTrack !== ambKey) playAmbient(ambKey);

  var isAsh       = DS.dungeon === 'The Ashbound Wastes';
  var isFrost     = DS.dungeon === 'Frosthold Abyss';
  var isSunken    = DS.dungeon === 'The Sunken Archives';
  var isHollow    = DS.dungeon === 'The Hollow';
  var isInfernal  = DS.dungeon === 'The Infernal';
  var isWhisper   = DS.dungeon === 'The Whispering Forest';
  var isShadow    = DS.dungeon === 'The Shadow World';
  var isNightmare = DS.diff === 'Nightmare';
  var roomDescs  = isAsh ? ASH_ROOM_DESCS  : isFrost ? FROST_ROOM_DESCS  : isSunken ? SUNKEN_ROOM_DESCS  : isHollow ? HOLLOW_ROOM_DESCS  : isInfernal ? INFERNAL_ROOM_DESCS  : isWhisper ? WHISPER_ROOM_DESCS : isShadow ? SHADOW_ROOM_DESCS : ROOM_DESCS;
  var floorNames = isAsh ? ASH_FLOOR_NAMES : isFrost ? FROST_FLOOR_NAMES : isSunken ? SUNKEN_FLOOR_NAMES : isHollow ? HOLLOW_FLOOR_NAMES : isInfernal ? INFERNAL_FLOOR_NAMES : isWhisper ? WHISPER_FLOOR_NAMES : isShadow ? SHADOW_FLOOR_NAMES : FLOOR_NAMES;
  var lootPool   = isAsh ? ASH_LOOT : isFrost ? FROST_LOOT : isSunken ? SUNKEN_LOOT : isHollow ? HOLLOW_LOOT : isInfernal ? INFERNAL_LOOT : isWhisper ? WHISPER_LOOT : isShadow ? SHADOW_LOOT : LOOT;
  var enemyPool  = isNightmare ? NIGHTMARE_ENEMIES
                 : isAsh       ? ASH_ENEMIES
                 : isFrost     ? FROST_ENEMIES
                 : isSunken    ? SUNKEN_ENEMIES
                 : isHollow    ? HOLLOW_ENEMIES
                 : isInfernal  ? INFERNAL_ENEMIES
                 : ENEMIES;
  // Pick room description based on floor depth for variety
  var depthBucket = DS.floor <= 3 ? 0 : DS.floor <= 6 ? 1 : 2;
  var bucketSize = Math.max(1, Math.floor(roomDescs.length / 3));
  var startIdx = depthBucket * bucketSize;
  var endIdx = depthBucket === 2 ? roomDescs.length : Math.min(startIdx + bucketSize, roomDescs.length);
  var bucketPool = roomDescs.slice(startIdx, endIdx);
  if (!bucketPool.length) bucketPool = roomDescs;
  var desc = bucketPool[Math.floor(Math.random() * bucketPool.length)];
  var floorName = floorNames[((DS.floor - 1) % (floorNames.length - 1)) + 1] || 'Chamber';

  // ── PROCEDURAL ROOM CHECK ──
  var roomType = getNextRoomType();
  var specialRoom = null;
  for (var sri = 0; sri < SPECIAL_ROOMS.length; sri++) {
    if (SPECIAL_ROOMS[sri].type === roomType) { specialRoom = SPECIAL_ROOMS[sri]; break; }
  }
  if (specialRoom) {
    setRoom(specialRoom.name, specialRoom.desc, null, null);
    updateTopBar();
    showDgPanels(true, false, false);
    updateSearchBadge(false);
    _roomResolving = true;
    setTimeout(function() { try { specialRoom.run(); } finally { _roomResolving = false; } }, 400);
    return;
  }

  // Class passive floor heals
  if (ACCESS.classTraits) {
    // Druid — heal 3% max HP every floor
    if (DS.cls === 'Druid') {
      var druidHeal = Math.round(DS.maxHp * 0.03);
      DS.hp = Math.min(DS.maxHp, DS.hp + druidHeal);
    }
    // Cleric — heal 5% max HP every 5 floors
    if (DS.cls === 'Cleric' && DS.floor > 1 && DS.floor % 5 === 0) {
      var clericHeal = Math.round(DS.maxHp * 0.05);
      DS.hp = Math.min(DS.maxHp, DS.hp + clericHeal);
      addLog('🙏 Cleric\'s Prayer — +'+ clericHeal +' HP restored.');
    }
    // Naturalist — +3 def passive (applied each floor to keep it consistent)
    if (DS.cls === 'Naturalist') DS.defBonus = Math.max(DS.defBonus || 0, 3);
  }
  updatePlayerBar();
  updateTopBar();
  showDgPanels(true, false, false);
  updateSearchBadge(true);
  // Set room name and description for normal rooms
  setRoom(floorName, desc, null, null);

  var roll = Math.random();
  var dcEffect = DS.dailyChallenge || '';
  var combatChance = dcEffect==='hordeDay' ? 0.70
    : DS.diff === 'Nightmare' ? 0.60
    : DS.diff === 'Condemned' ? 0.48
    : DS.diff === 'Forsaken' ? 0.55 : 0.40;
  var _hw = getHollowWeather();
  if (_hw && _hw.combatBonus && DS.dungeon === 'The Hollow') combatChance += _hw.combatBonus;
  // Dungeon weather combat-frequency effects (Cursed Fog, Ash Storm, Blizzard,
  // Rising Tides, Wild Hunt, Silver Fog, Bone Storm, etc.) — promised in their
  // own weather text but never actually applied outside The Hollow.
  if (DS.dungeon !== 'The Hollow') {
    var _dwCombatBonus = getDungeonWeatherCombatBonus();
    if (_dwCombatBonus) combatChance += _dwCombatBonus;
  }

  _roomResolving = true;
  setTimeout(function() {
   try {
    // Friday the 13th — Black Box encounter (20% chance per room, floor 2+)
    if (getActiveEvent() === 'friday13' && DS.floor >= 2 && Math.random() < 0.20 && !DS._blackBoxThisFloor) {
      DS._blackBoxThisFloor = true;
      setRoom('A Black Box', 'Something sits in the corner of the room. A black box. It does not belong here. It has never belonged anywhere.', null, null);
      showDgPanels(true, false, false);
      setEvent('bad',
        'You find a black box.\n\nIt is not making any sound.\nIt is not moving.\nIt is watching you.\n\nDo you open it?',
        [
          { label: '🔲 Open It', action: function() {
            sfx('sfx-trap');
            say('You open the black box. Something steps out.');
            addLog('🔪 The box opens. The Unlucky One has found you.');
            // Apply bad luck — zero crits, zero dodges for the fight
            DS._unluckyOne = true;
            DS.enemy = {
              name: 'The Unlucky One',
              icon: '🔲',
              hp: 120, maxHp: 120,
              atk: [18, 28],
              gold: [50, 80],
              // (it was a boss, and killing a boss wins the dungeon — a Black Box on
              // floor 2 could end the run on the spot; it's a tough elite instead)
              isElite: true,
              isUnluckyOne: true,
              desc: 'It has been waiting. It does not speak. It only takes.'
            };
            DS.inCombat = true;
            showDgPanels(false, true, false);
            document.getElementById('dg-enemy-icon').textContent = '🔲';
            document.getElementById('dg-enemy-name').textContent = t('The Unlucky One');
            updateEnemyBar(); updatePlayerBar();
            setCombatBtns(true);
            addLog('The Unlucky One emerges. Your luck drops to zero. It wants your gold.');
            say('The Unlucky One. Elite. 120 HP. Your critical chance is zero. It may steal your gold each turn.');
          }},
          { label: '🚪 Leave It', action: function() {
            sfx('sfx-select');
            say('You leave the box. It does not follow. It does not need to.');
            addLog('You leave the black box untouched. Smart.');
            enterRoom();
          }}
        ]
      );
      return;
    }
    var roomsNeeded = DS.floorRoomsNeeded || 5;
    if (DS.roomsOnFloor >= roomsNeeded) {
      if (DS.floor === 10 && DS.diff !== 'Endless') {
        var _rn = DS.floorRoomsNeeded !== undefined ? DS.floorRoomsNeeded : 5;
        if (DS.roomsOnFloor === _rn) { checkFloorQuest(); startEliteGauntlet(); return; }
        if (DS.roomsOnFloor === _rn + 1) { startCombat(true); return; }
        // roomsOnFloor > _rn+1 means boss was defeated — show victory
        if (!DS.inCombat && !DS._victoryPending && !DS._eliteKilledFloor10) { showVictory(); return; }
        if (DS.inCombat && DS.enemy) { showDgPanels(false, true, false); setCombatBtns(true); return; }
        return;
      }
      if (DS.floor === 10 && DS.diff === 'Endless') {
        // Endless mode — no boss at floor 10, just keep going
        // Spawn a special milestone enemy instead
        if (DS.roomsOnFloor >= roomsNeeded) { advanceFloor(); return; }
      }
      showFloorCompleteScreen(); return;
    }
    if (roll < combatChance) {
      // Insane Mode special enemies
      if (_insaneMode) {
        if (Math.random() < 0.08) { setTimeout(function(){ spawnDistorted(); }, 300); return; }
        if (Math.random() < 0.06) { setTimeout(function(){ spawnSanityDrainer(); }, 300); return; }
      }
      // Endless exclusive enemies — spawn floor 20+ in Endless mode
      if (DS.diff === 'Endless' && DS.floor >= 20) {
        var excPool = DS.floor >= 31 ? AFK_EXCLUSIVE_ENEMIES['t4'] : AFK_EXCLUSIVE_ENEMIES['t3'];
        if (excPool && Math.random() < (DS.floor >= 31 ? 0.35 : 0.20)) {
          var excBase = excPool[Math.floor(Math.random() * excPool.length)];
          var floorScale = 1 + (DS.floor - 1) * 0.06;
          var excEnemy = {
            name: excBase.name, icon: excBase.icon,
            hp: Math.round(excBase.hp * floorScale),
            maxHp: Math.round(excBase.hp * floorScale),
            atk: [Math.round(excBase.atk[0] * floorScale), Math.round(excBase.atk[1] * floorScale)],
            gold: [8 + DS.floor, 16 + DS.floor],
            special: excBase.special,
          };
          DS.enemy = excEnemy;
          setEvent('danger', '⚠ Special Endless Enemy — ' + excBase.icon + ' ' + excBase.name + '. ' + (excBase.desc||''));
          say('Warning! Special Endless enemy. ' + excBase.name + '. ' + (excBase.desc||''));
          setTimeout(function(){ startEndlessCombat(DS.enemy); }, 800);
          return;
        }
      }
      // Easter Bunny — 15% chance any floor during Easter event
      var activeEvt = getActiveEvent();
      if (activeEvt === 'easter' && Math.random() < 0.15) {
        setTimeout(function(){ triggerEasterBunny(); }, 300);
        return;
      }
      // The Shade — 8% chance floors 9+, all dungeons
      if (DS.floor >= 9 && Math.random() < 0.08 && !(DS.enemy && DS.enemy.isShadeElite)) {
        setTimeout(function() { spawnTheShade(); }, 300);
        return;
      }
      // Chimera — 15-20% chance floors 5+
      // Whispering Forest floor 9 — guaranteed first visit
      var isFirstWhisperF9 = DS.dungeon === 'The Whispering Forest' && DS.floor === 9 &&
        !DDStore.getItem('dd_whisper_chimera_seen');
      var normalChimeraChance = DS.floor >= 5 && Math.random() < 0.17;
      if (isFirstWhisperF9 || normalChimeraChance) {
        var variant = DS.dungeon === 'The Whispering Forest' ? 'whisper' : 'default';
        if (isFirstWhisperF9) DDStore.setItem('dd_whisper_chimera_seen', '1');
        // Set flags immediately so enterRoom() guard blocks any re-entry during the 300ms delay
        _chimeraActive = true;
        DS.inCombat = true;
        setTimeout(function(){ spawnChimera(variant); }, 300);
        return;
      }
      // The Hollow special encounters — check before normal enemy spawn
      var inRaid = (typeof RD !== 'undefined' && RD.active);
      // Time Descender — floors 6+, 15% chance, any dungeon, once per run
      // (the roll sat inside The Hollow's encounters, so it only ever came there)
      if (!inRaid && rollTimeDescender()) {
        setTimeout(function(){ triggerTimeDescender(); }, 300);
        return;
      }
      if (isHollow && !inRaid) {
        // Weeping Child — floors 3+, 10% chance
        var wcChance = (_hollowWeather && _hollowWeather.silentNight) ? 0.20 : 0.10;
        if (DS.floor >= 3 && Math.random() < wcChance) {
          if (DS.cls === 'Paladin' && ACCESS.classTraits && !DS.wepingChildSoothedThisRun) {
            DS.wepingChildSoothedThisRun = true;
            setEvent('good', '🛡 Divine Presence — Weeping Child soothed automatically.');
            say('Divine Presence. The Weeping Child is soothed by your holy aura.');
            incrementAchievementStat('wepingChildSoothed', 1);
            return;
          }
          setTimeout(function(){ triggerWeepingChild(); }, 300);
          return;
        }
        // Weeping Mother — floors 5+, 7% chance
        if (DS.floor >= 5 && Math.random() < 0.07) {
          setTimeout(function(){ triggerWeepingMother(); }, 300);
          return;
        }
        // Medusa — floors 4+, ~10% chance, once per run
        if (rollMedusaSpawn()) {
          setTimeout(function(){ triggerMedusa(); }, 300);
          return;
        }
        // Lord Phorcys — floors 6+, 8% chance if Medusa was NOT found this run
        if (DS.floor >= 6 && !DS.medusaEncounteredThisRun && !DS.medusaFatherFound && Math.random() < 0.08) {
          setTimeout(function(){ triggerLordPhorcys(); }, 300);
          return;
        }
        // Father reunion — if Medusa joined, check each room
        if (DS.medusaJoined && !DS.medusaFatherFound && checkMedusaFatherSpawn()) {
          setTimeout(function(){ triggerMedusaFather(); }, 500);
        }
      }
      // Nightmare Day DC — 30% chance to inject nightmare enemy on any floor
      if (DS.dailyChallenge === 'nightmareDay' && Math.random() < 0.30) {
        var nmPool = NIGHTMARE_ENEMIES.t1.concat(NIGHTMARE_ENEMIES.t2);
        var nmBase = nmPool[Math.floor(Math.random() * nmPool.length)];
        var enemy = {
          name: nmBase.name, icon: nmBase.icon,
          hp: Math.round(nmBase.hp * (1 + (DS.floor-1)*0.09)),
          atk: nmBase.atk, gold: nmBase.gold,
          maxHp: 0
        };
        enemy.maxHp = enemy.hp;
        DS.enemy = enemy;
        startCombat(false);
        return;
      }
      // Seasonal event enemies — 20% chance to replace normal enemy
      var activeEventBonus = getEventBonuses();
      if (activeEventBonus && activeEventBonus.extraEnemies && Math.random() < 0.20) {
        var pool = activeEventBonus.extraEnemies.filter(function(e){ return !e.isBoss; });
        if (pool.length > 0) {
          var base = pool[Math.floor(Math.random() * pool.length)];
          var ngMult2 = DS.ngPlus ? 1.20 : 1.0;
          var evMult = activeEventBonus.enemyMult;
          var enemy = { name:base.name, icon:base.icon, gold:base.gold,
            hp: Math.round(base.hp * evMult * ngMult2),
            atk: [Math.round(base.atk[0]*evMult*ngMult2), Math.round(base.atk[1]*evMult*ngMult2)],
            isSeasonal: true, seasonalLabel: activeEventBonus.label };
          enemy.maxHp = enemy.hp;
          DS.enemy = enemy;
          var evMsg = activeEventBonus.label + ' — ' + enemy.name + ' materializes from the seasonal dark.';
          setEvent('danger', evMsg);
          say(evMsg);
          addRunLog('Seasonal enemy: ' + enemy.name, 'bad');
          showEnemyPreview(enemy);
          DS.inCombat = true; DS.defending = false;
          // First encounter popup
          var killKey = 'dd_seen_' + (DS.enemy.name || '').replace(/[^a-z0-9]/gi,'_').toLowerCase();
          if (!DDStore.getItem(killKey)) {
            DDStore.setItem(killKey, '1');
            var bestEntry = BESTIARY_DATA ? BESTIARY_DATA.find(function(b){ return b.name === DS.enemy.name; }) : null;
            if (bestEntry && bestEntry.desc) {
              setEvent('good', '📖 First encounter: ' + DS.enemy.name + ' — ' + bestEntry.desc);
              say('First encounter. ' + DS.enemy.name + '. ' + bestEntry.desc);
            }
          }
          playTrack(battleTrack());
          showDgPanels(false, true, false);
          document.getElementById('dg-enemy-icon').textContent = enemy.icon;
          document.getElementById('dg-enemy-name').textContent = t(enemy.name);
          updateEnemyBar(); updatePlayerBar();
          setCombatBtns(true); updateSkillButtons();
          return;
        }
      }

      // Community enemy — 12% chance to spawn a player-created enemy
      if (_communityEnemyCache.length && Math.random() < 0.12) {
        var ce = getCommunityEnemy(DS.dungeon);
        if (ce) {
          var communityFight = communityEnemyToFightData(ce);
          communityFight.maxHp = communityFight.hp;
          DS.enemy = communityFight;
          DS.inCombat = true; DS.defending = false;
          // Play their custom music if set
          if (ce.music) {
            try { playTrack(ce.music); } catch(ex) { playTrack(battleTrack()); }
          } else {
            playTrack(battleTrack());
          }
          var ceMsg = 'A creature stirs — ' + ce.name + ', unleashed by ' + ce.creator + '.';
          setEvent('danger', ceMsg);
          say(ceMsg);
          addRunLog('Community enemy: ' + ce.name + ' by ' + ce.creator, 'bad');
          showEnemyPreview(DS.enemy);
          showDgPanels(false, true, false);
          document.getElementById('dg-enemy-icon').textContent = ce.icon || '👤';
          document.getElementById('dg-enemy-name').textContent = ce.name;
          updateEnemyBar(); updatePlayerBar();
          setCombatBtns(true); updateSkillButtons();
          return;
        }
      }

      // 12% elite chance on floors 4+
      var eliteKey = DS.diff === 'Nightmare' ? 'Nightmare' : DS.dungeon;
      var elitePool = (DS.dungeon === 'The Whispering Forest' ? WHISPER_ELITES : null) || 
                      (DS.dungeon === 'The Shadow World' ? (SHADOW_ENEMIES.elites || []) : null) ||
                      ELITE_ENEMIES[eliteKey] || [];
      var spawnElite = DS.floor >= 4 && elitePool.length > 0 && Math.random() < 0.15;
      var tier = DS.floor <= 3 ? 't1' : DS.floor <= 6 ? 't2' : 't3';
      var pool = DS.dungeon === 'The Whispering Forest'
        ? WHISPER_ENEMIES[tier]
        : DS.dungeon === 'The Abyssal Deep'
        ? ABYSSAL_ENEMIES[tier]
        : DS.dungeon === 'The Shadow World'
        ? SHADOW_ENEMIES[tier]
        : enemyPool[tier];
      var base = spawnElite
        ? elitePool[Math.floor(Math.random() * elitePool.length)]
        : pool[Math.floor(Math.random() * pool.length)];
      var ngMult = DS.ngPlus ? (1.20 + ((CHARS[_charIdx] && CHARS[_charIdx].ngPlusCount || 1) - 1) * 0.05) : 1.0;
      // Endless mode — scale enemies harder every 10 floors
      if (DS.diff === 'Endless' && DS.floor > 10) {
        var endlessMult = 1 + (Math.floor((DS.floor - 10) / 10) * 0.15);
        ngMult = ngMult * endlessMult;
      }
      var weatherMult = (isHollow && _hollowWeather && _hollowWeather.enemyMult) ? _hollowWeather.enemyMult : 1.0;
      var vrPunish = isVRPunishmentActive() ? 1.50 : 1.0; // Global punishment: +50% enemy strength
      var evBonus2 = getEventBonuses();
      var eventEnemyMult = (evBonus2 && evBonus2.enemyMult) ? evBonus2.enemyMult : 1.0;
      ngMult = ngMult * weatherMult * vrPunish * eventEnemyMult;
      var dcMult = DS.dailyChallenge==='ironDay' ? 1.50 : 1.0;
      // Level scaling — enemies scale at 80% of player power so always challenging but winnable
      var lvl = DS.level || 1;
      var lvlMult = lvl > 1 ? (1 + (lvl - 1) * 0.08) : 1.0; // +8% per level above 1
      var enemy = { name:base.name, icon:base.icon, gold:base.gold,
        hp: Math.round(base.hp * (1 + (DS.floor-1)*0.09) * ngMult * dcMult * lvlMult),
        atk: [Math.round(base.atk[0]*(1+(DS.floor-1)*0.06)*ngMult*lvlMult), Math.round(base.atk[1]*(1+(DS.floor-1)*0.06)*ngMult*lvlMult)]
      };
      enemy.maxHp = enemy.hp;
      DS.enemy = enemy;
      // Special Hollow enemies — unique spawn handling
      if (enemy.isMusicBox) {
        enemy.maxHp = enemy.hp;
        DS.enemy = enemy;
        setEvent('danger',
          'In the corner of the room sits a music box. It is old. The lid is open. ' +
          'The mechanism turns by itself. Nobody wound it. ' +
          'It begins to play.'
        );
        setTimeout(function(){
          showMusicBoxTutorial(function(){
            startMusicBoxCombat(DS.enemy);
          });
        }, 800);
        return;
      }
      if (enemy.isTwin) {
        var twinEnemy = spawnTwin();
        DS.enemy = twinEnemy;
        enemy = twinEnemy;
      }
      if (enemy.isUninvited) {
        enemy.maxHp = enemy.hp;
        DS.enemy = enemy;
        setTimeout(function(){ uninvitedGuestEmerge(); startCombat(false); }, 300);
        return;
      }
      var emergeMsg = enemy.isElite
        ? '★ ELITE: ' + enemy.name + ' — ' + (enemy.eliteAbility || 'A powerful foe.') + ' Defeat it for bonus gold and a chance at a rare spirit.'
        : isNightmare
        ? enemy.name + ' tears through the fabric of the dungeon itself. Something is very wrong.'
        : isAsh
        ? enemy.name + ' rises from the smoldering ash. Heat radiates from its form.'
        : isFrost
        ? enemy.name + ' emerges from the frozen dark. The temperature drops around it.'
        : DS.dungeon === 'The Abyssal Deep'
        ? enemy.name + ' rises from the dark water. The pressure around it is immense.'
        : getEnemyEmergeMessage(enemy);

      // Inject special enemy if queued from floor advance
      if (DS._nextSpecialEnemy && !enemy.isBoss && !enemy.isElite) {
        enemy = DS._nextSpecialEnemy;
        DS._nextSpecialEnemy = null;
        DS.enemy = enemy;
        setEvent('danger', '⚠ ' + enemy.name + ' appears! ' + enemy.desc);
      } else {
        setEvent('danger', emergeMsg);
      }

      // Lock search button during emerge delay so player cannot accidentally spawn another room
      updateSearchBadge(false);
      DS.searched = true;

      // 20% chance of ambush on floor 3+ (not for bosses or elites)
      if (!enemy.isBoss && !enemy.isElite && shouldSpawnMultiEnemy()) {
        setTimeout(function() { spawnAmbush(); }, 1200);
      } else {
        setTimeout(function() {
          // Safety check — make sure we still have an enemy and aren't already in combat
          if (DS.enemy && DS.enemy.hp > 0 && !DS.inCombat) {
            startCombat(false);
          } else if (!DS.inCombat && !DS.enemy) {
            // Enemy got lost somehow — reset room state
            DS.searched = false;
            updateSearchBadge(true);
          }
        }, 1200);
      }
    } else if (roll < combatChance + 0.28) {
      var item = lootPool[Math.floor(Math.random() * lootPool.length)];
      if (item.type === 'gem') {
        var gemGold = resolveGold(item.gold);
        DS.gold += gemGold; addGlobalGold(gemGold);
        updateDailyQuestProgress('gold', gemGold);
        var findMsg = isAsh
          ? 'You find a ' + item.name + ' glowing faintly among the cinders. Worth ' + item.gold + ' gold.'
          : 'You find a ' + item.name + ' worth ' + item.gold + ' gold glinting in the dust.';
        setEvent('good', findMsg);
        say('Found ' + item.name + '. Gold: ' + DS.gold);
      } else {
        var lootItem = JSON.parse(JSON.stringify(item));
        // Apply rarity to weapon drops
        if (lootItem.type === 'weapon' && typeof rollWeaponRarity !== 'undefined') {
          var dropRarity = rollWeaponRarity();
          if (dropRarity && dropRarity.id !== 'common') {
            lootItem = applyRarityToWeapon(lootItem, dropRarity);
          }
        }
        // Apply rarity to armor drops
        if (lootItem.type === 'armor' && typeof rollWeaponRarity !== 'undefined') {
          var armorDropRarity = rollWeaponRarity();
          if (armorDropRarity && armorDropRarity.id !== 'common') {
            lootItem = applyRarityToArmor(lootItem, armorDropRarity);
          }
        }
        // Prevent duplicate weapons — if already in inventory, skip
        if (lootItem.type === 'weapon' || lootItem.type === 'armor') {
          var alreadyHas = DS.inventory.find(function(inv){ return inv.name === lootItem.name; });
          if (alreadyHas) {
            addLog('You already carry a ' + lootItem.name + '. The duplicate fades back into the dark.');
            say('You already have a ' + lootItem.name + '.');
            applyItem(lootItem); // still apply any passive effects
          } else {
            DS.inventory.push(lootItem);
            applyItem(lootItem);
            sfx('sfx-loot'); vibe(VIBE.loot);
          }
        } else {
          DS.inventory.push(lootItem);
          applyItem(lootItem);
          sfx('sfx-loot'); vibe(VIBE.loot);
        }
        // Lucky Descent — first loot of run is always rare
        // BUGFIX: this used to build its own { id:'rare', label:'Rare', ... }
        // object missing atkMult and specialEffect (both present on the real
        // WEAPON_RARITIES entry). applyRarityToWeapon()/applyRarityToArmor()
        // multiply atkBase/defBase by rarity.atkMult, so the guaranteed
        // weapon's stats became NaN, and specialEffect being undefined meant
        // it never actually got a rarity effect either — "guaranteed rare"
        // silently produced a broken item. Look up the real tier object
        // instead so this always matches WEAPON_RARITIES exactly, and only
        // used the weapon path before — armor never got its guaranteed roll.
        if (DS._luckyDescent && !DS._luckyDescentUsed && (lootItem.type === 'weapon' || lootItem.type === 'armor')) {
          DS._luckyDescentUsed = true;
          var rareRarity = WEAPON_RARITIES.find(function(r){ return r.id === 'rare'; });
          lootItem = lootItem.type === 'weapon' ? applyRarityToWeapon(lootItem, rareRarity) : applyRarityToArmor(lootItem, rareRarity);
          addLog('🌟 Lucky Descent — rare quality guaranteed!');
        }
        // Void Pact — 5% chance to find a Mystery Coin
        if (DS._voidPact && Math.random() < 0.05) {
          var rs = getRaidSave();
          rs.mysteryCoins = (rs.mysteryCoins || 0) + 1;
          setRaidSave(rs);
          addLog('🌑 Void Pact — Mystery Coin found!');
          say('Void Pact activated. Mystery Coin found!');
        }
        var rarLabel = lootItem.raritySymbol ? lootItem.raritySymbol + ' ' + lootItem.rarityLabel + ' ' : '';
        setEvent('good', 'You discover: ' + lootItem.icon + ' ' + rarLabel + lootItem.name + '. ' + lootItem.desc);
        say('Found ' + (rarLabel || '') + lootItem.name + '.');
        updateDailyQuestProgress('loot', 1);
        addRunLog('Found item: ' + item.name, 'good');
      }
      updateTopBar();
      saveProgress();
    } else {
      // Try to trigger a special event
      if (!rollDungeonEvent()) {
        setEvent(null, null);
      }
    }
   } finally { _roomResolving = false; }
  }, 400);
}

function updateSearchBadge(canSearch) {
  var el = document.getElementById('dg-search-status');
  if (!el) return;
  if (DS.searched) {
    el.textContent = 'Searched';
    el.style.color = 'var(--text-dim)';
    el.style.borderColor = 'var(--border-dim)';
  } else if (canSearch) {
    el.textContent = '🔍 Searchable';
    el.style.color = 'var(--gold-dim)';
    el.style.borderColor = 'var(--gold-dim)';
  } else {
    el.textContent = '';
    el.style.borderColor = 'transparent';
  }
}

function applyItem(item) {
  if (item.type === 'weapon') DS.atkBonus += (item.atkBonus || 0);
  if (item.type === 'armor') DS.defBonus += (item.defBonus || 0);
}
