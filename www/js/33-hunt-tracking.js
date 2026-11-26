// ═══════════════════════════════════════════════════════════════════════
// 12.0 HUNTING GROUNDS: TRACKING, AND THE NEW NARRATOR
// Hunt one beast by sound: listen for its call (from where it really is),
// read its tracks, walk or sneak toward it, ambush or trap it, then fight.
// Three daily bounties (double gold) and five legends that break away once,
// wounded. The narrator is recorded with Kokoro (Lewis in English, Alex in
// Portuguese) and ships with the game: audio/hunt/<en|pt>/<id>.mp3. No
// account or server needed, so Brian's voice is replaced everywhere here.
// Same rules, lines and daily bounties as the app (Tracking.swift).
// ═══════════════════════════════════════════════════════════════════════
// The lines (swift/tools/hunt-lines.py in the app repo makes them).
var HUNT_LINES = {"ambush": {"en": "You strike from the shadows. A perfect ambush!", "pt": "Você ataca das sombras. Uma emboscada perfeita!"}, "ambush_seen": {"en": "It turns just in time. No surprise now.", "pt": "Ele se vira bem a tempo. Nada de surpresa agora."}, "auto_coin": {"en": "An ancient coin catches the light. Worth 50 gold.", "pt": "Uma moeda antiga reflete a luz. Vale 50 de ouro."}, "auto_enemy_0": {"en": "Something emerges from the shadows.", "pt": "Algo surge das sombras."}, "auto_enemy_1": {"en": "A creature blocks your path.", "pt": "Uma criatura bloqueia seu caminho."}, "auto_enemy_2": {"en": "You are not alone. Something approaches.", "pt": "Você não está sozinho. Algo se aproxima."}, "auto_enemy_3": {"en": "The undergrowth stirs. An enemy reveals itself.", "pt": "A vegetação se mexe. Um inimigo se revela."}, "auto_enter_0": {"en": "The forest swallows you whole. Something watches from the dark.", "pt": "A floresta engole você por inteiro. Algo observa do escuro."}, "auto_enter_1": {"en": "Leaves crunch beneath your feet. The hunt begins.", "pt": "Folhas estalam sob seus pés. A caçada começa."}, "auto_enter_2": {"en": "The trees close in. You are not alone here.", "pt": "As árvores se fecham. Você não está sozinho aqui."}, "auto_fallen": {"en": "Your hunter has fallen. The forest claims another. The hunt is over.", "pt": "Seu caçador caiu. A floresta leva mais um. A caçada acabou."}, "auto_hurt_0": {"en": "You take a wound. Stay focused.", "pt": "Você se fere. Mantenha o foco."}, "auto_hurt_1": {"en": "The enemy draws blood. Keep moving.", "pt": "O inimigo tira sangue. Continue andando."}, "auto_hurt_2": {"en": "That one hurt. You press on regardless.", "pt": "Essa doeu. Você segue mesmo assim."}, "auto_item_0": {"en": "Something catches your eye in the dirt.", "pt": "Algo chama sua atenção na terra."}, "auto_item_1": {"en": "A glint in the darkness. You reach down.", "pt": "Um brilho no escuro. Você se abaixa."}, "auto_item_2": {"en": "Among the fallen leaves, you find something useful.", "pt": "Entre as folhas caídas, você encontra algo útil."}, "auto_kill_0": {"en": "The creature falls. The forest grows quiet.", "pt": "A criatura cai. A floresta fica em silêncio."}, "auto_kill_1": {"en": "Another enemy defeated. Your blade runs dark.", "pt": "Mais um inimigo derrotado. Sua lâmina escurece."}, "auto_kill_2": {"en": "It is done. You press deeper into the forest.", "pt": "Está feito. Você avança mais fundo na floresta."}, "auto_kill_3": {"en": "The hunt continues. Another falls before you.", "pt": "A caçada continua. Mais um cai diante de você."}, "auto_kills_10": {"en": "Remarkable. 10 enemies have fallen before you.", "pt": "Impressionante. 10 inimigos caíram diante de você."}, "auto_kills_25": {"en": "Remarkable. 25 enemies have fallen before you.", "pt": "Impressionante. 25 inimigos caíram diante de você."}, "auto_kills_50": {"en": "Remarkable. 50 enemies have fallen before you.", "pt": "Impressionante. 50 inimigos caíram diante de você."}, "auto_lowHp_0": {"en": "Your wounds are severe. The forest senses weakness.", "pt": "Seus ferimentos são graves. A floresta sente a fraqueza."}, "auto_lowHp_1": {"en": "You are bleeding. The darkness grows bolder.", "pt": "Você está sangrando. A escuridão fica mais ousada."}, "auto_lowHp_2": {"en": "Critical condition. One more hit could end this hunt.", "pt": "Estado crítico. Mais um golpe pode acabar com esta caçada."}, "auto_rest_0": {"en": "A moment of stillness. You catch your breath.", "pt": "Um momento de calma. Você recupera o fôlego."}, "auto_rest_1": {"en": "The forest is quiet for now.", "pt": "A floresta está quieta por enquanto."}, "auto_rest_2": {"en": "Nothing stirs. You recover slightly.", "pt": "Nada se mexe. Você se recupera um pouco."}, "auto_return_0": {"en": "You emerge from the forest. The hunt is over.", "pt": "Você sai da floresta. A caçada acabou."}, "auto_return_1": {"en": "Daylight returns. You carry your spoils home.", "pt": "A luz do dia volta. Você leva seus espólios para casa."}, "auto_return_2": {"en": "The forest releases you. For now.", "pt": "A floresta liberta você. Por enquanto."}, "badly_hurt": {"en": "You're badly hurt. Bandage up or finish it fast.", "pt": "Você está muito ferido. Enfaixe-se ou acabe logo com isso."}, "bandage": {"en": "You bind your wounds.", "pt": "Você enfaixa suas feridas."}, "blocked": {"en": "You block most of it.", "pt": "Você bloqueia quase tudo."}, "bounty_done": {"en": "Bounty complete. The reward is doubled!", "pt": "Recompensa da caçada cumprida. O prêmio é dobrado!"}, "cold": {"en": "The trail goes cold. The beast is gone. The hunt is over.", "pt": "O rastro esfriou. A fera sumiu. A caçada acabou."}, "defend": {"en": "You raise your guard and strike back.", "pt": "Você se protege e contra-ataca."}, "fight": {"en": "You step out and face it.", "pt": "Você sai do esconderijo e o enfrenta."}, "find_bone_fragment": {"en": "Bone Fragment.", "pt": "Fragmento de Osso."}, "find_dark_pelt": {"en": "Dark Pelt.", "pt": "Pele Sombria."}, "find_forest_herb": {"en": "Forest Herb.", "pt": "Erva da Floresta."}, "find_hunters_rune": {"en": "Hunters Rune.", "pt": "Runa do Caçador."}, "find_iron_scrap": {"en": "Iron Scrap.", "pt": "Sucata de Ferro."}, "find_rare": {"en": "Something rare.", "pt": "Algo raro."}, "find_shadow_essence": {"en": "Shadow Essence.", "pt": "Essência Sombria."}, "find_void_crystal": {"en": "Void Crystal.", "pt": "Cristal do Vazio."}, "found_bear": {"en": "There. A Cave Bear. It hasn't seen you yet.", "pt": "Ali. Um Urso das Cavernas. Ainda não viu você."}, "found_boar": {"en": "There. A Wild Boar. It hasn't seen you yet.", "pt": "Ali. Um Javali Selvagem. Ainda não viu você."}, "found_forest": {"en": "There. The Forest Itself. It hasn't seen you yet.", "pt": "Ali. A Própria Floresta. Ainda não viu você."}, "found_greyfang": {"en": "There. The Grey Fang. It hasn't seen you yet.", "pt": "Ali. O Presa Cinzenta. Ainda não viu você."}, "found_nightmother": {"en": "There. The Night Mother. It hasn't seen you yet.", "pt": "Ali. A Mãe da Noite. Ainda não viu você."}, "found_owl": {"en": "There. A Shadow Owl. It hasn't seen you yet.", "pt": "Ali. Uma Coruja das Sombras. Ainda não viu você."}, "found_serpent": {"en": "There. A Vine Serpent. It hasn't seen you yet.", "pt": "Ali. Uma Serpente das Vinhas. Ainda não viu você."}, "found_stag": {"en": "There. The White Stag. It hasn't seen you yet.", "pt": "Ali. O Cervo Branco. Ainda não viu você."}, "found_stalker": {"en": "There. A Night Stalker. It hasn't seen you yet.", "pt": "Ali. Um Espreitador Noturno. Ainda não viu você."}, "found_swampking": {"en": "There. The Swamp King. It hasn't seen you yet.", "pt": "Ali. O Rei do Pântano. Ainda não viu você."}, "found_wolf": {"en": "There. A Grey Wolf. It hasn't seen you yet.", "pt": "Ali. Um Lobo Cinzento. Ainda não viu você."}, "hear_growl_east_close": {"en": "A growl, to your right. East. Very close.", "pt": "Um rosnado, à sua direita. Leste. Bem perto."}, "hear_growl_east_far": {"en": "A growl, to your right. East. Far away.", "pt": "Um rosnado, à sua direita. Leste. Bem longe."}, "hear_growl_east_near": {"en": "A growl, to your right. East. Not far.", "pt": "Um rosnado, à sua direita. Leste. Não muito longe."}, "hear_growl_north_close": {"en": "A growl, ahead of you. North. Very close.", "pt": "Um rosnado, à sua frente. Norte. Bem perto."}, "hear_growl_north_far": {"en": "A growl, ahead of you. North. Far away.", "pt": "Um rosnado, à sua frente. Norte. Bem longe."}, "hear_growl_north_near": {"en": "A growl, ahead of you. North. Not far.", "pt": "Um rosnado, à sua frente. Norte. Não muito longe."}, "hear_growl_northeast_close": {"en": "A growl, ahead and to your right. North-east. Very close.", "pt": "Um rosnado, à frente, à direita. Nordeste. Bem perto."}, "hear_growl_northeast_far": {"en": "A growl, ahead and to your right. North-east. Far away.", "pt": "Um rosnado, à frente, à direita. Nordeste. Bem longe."}, "hear_growl_northeast_near": {"en": "A growl, ahead and to your right. North-east. Not far.", "pt": "Um rosnado, à frente, à direita. Nordeste. Não muito longe."}, "hear_growl_northwest_close": {"en": "A growl, ahead and to your left. North-west. Very close.", "pt": "Um rosnado, à frente, à esquerda. Noroeste. Bem perto."}, "hear_growl_northwest_far": {"en": "A growl, ahead and to your left. North-west. Far away.", "pt": "Um rosnado, à frente, à esquerda. Noroeste. Bem longe."}, "hear_growl_northwest_near": {"en": "A growl, ahead and to your left. North-west. Not far.", "pt": "Um rosnado, à frente, à esquerda. Noroeste. Não muito longe."}, "hear_growl_south_close": {"en": "A growl, behind you. South. Very close.", "pt": "Um rosnado, atrás de você. Sul. Bem perto."}, "hear_growl_south_far": {"en": "A growl, behind you. South. Far away.", "pt": "Um rosnado, atrás de você. Sul. Bem longe."}, "hear_growl_south_near": {"en": "A growl, behind you. South. Not far.", "pt": "Um rosnado, atrás de você. Sul. Não muito longe."}, "hear_growl_southeast_close": {"en": "A growl, behind you, to the right. South-east. Very close.", "pt": "Um rosnado, atrás de você, à direita. Sudeste. Bem perto."}, "hear_growl_southeast_far": {"en": "A growl, behind you, to the right. South-east. Far away.", "pt": "Um rosnado, atrás de você, à direita. Sudeste. Bem longe."}, "hear_growl_southeast_near": {"en": "A growl, behind you, to the right. South-east. Not far.", "pt": "Um rosnado, atrás de você, à direita. Sudeste. Não muito longe."}, "hear_growl_southwest_close": {"en": "A growl, behind you, to the left. South-west. Very close.", "pt": "Um rosnado, atrás de você, à esquerda. Sudoeste. Bem perto."}, "hear_growl_southwest_far": {"en": "A growl, behind you, to the left. South-west. Far away.", "pt": "Um rosnado, atrás de você, à esquerda. Sudoeste. Bem longe."}, "hear_growl_southwest_near": {"en": "A growl, behind you, to the left. South-west. Not far.", "pt": "Um rosnado, atrás de você, à esquerda. Sudoeste. Não muito longe."}, "hear_growl_west_close": {"en": "A growl, to your left. West. Very close.", "pt": "Um rosnado, à sua esquerda. Oeste. Bem perto."}, "hear_growl_west_far": {"en": "A growl, to your left. West. Far away.", "pt": "Um rosnado, à sua esquerda. Oeste. Bem longe."}, "hear_growl_west_near": {"en": "A growl, to your left. West. Not far.", "pt": "Um rosnado, à sua esquerda. Oeste. Não muito longe."}, "hear_hiss_east_close": {"en": "A hiss, to your right. East. Very close.", "pt": "Um sibilo, à sua direita. Leste. Bem perto."}, "hear_hiss_east_far": {"en": "A hiss, to your right. East. Far away.", "pt": "Um sibilo, à sua direita. Leste. Bem longe."}, "hear_hiss_east_near": {"en": "A hiss, to your right. East. Not far.", "pt": "Um sibilo, à sua direita. Leste. Não muito longe."}, "hear_hiss_north_close": {"en": "A hiss, ahead of you. North. Very close.", "pt": "Um sibilo, à sua frente. Norte. Bem perto."}, "hear_hiss_north_far": {"en": "A hiss, ahead of you. North. Far away.", "pt": "Um sibilo, à sua frente. Norte. Bem longe."}, "hear_hiss_north_near": {"en": "A hiss, ahead of you. North. Not far.", "pt": "Um sibilo, à sua frente. Norte. Não muito longe."}, "hear_hiss_northeast_close": {"en": "A hiss, ahead and to your right. North-east. Very close.", "pt": "Um sibilo, à frente, à direita. Nordeste. Bem perto."}, "hear_hiss_northeast_far": {"en": "A hiss, ahead and to your right. North-east. Far away.", "pt": "Um sibilo, à frente, à direita. Nordeste. Bem longe."}, "hear_hiss_northeast_near": {"en": "A hiss, ahead and to your right. North-east. Not far.", "pt": "Um sibilo, à frente, à direita. Nordeste. Não muito longe."}, "hear_hiss_northwest_close": {"en": "A hiss, ahead and to your left. North-west. Very close.", "pt": "Um sibilo, à frente, à esquerda. Noroeste. Bem perto."}, "hear_hiss_northwest_far": {"en": "A hiss, ahead and to your left. North-west. Far away.", "pt": "Um sibilo, à frente, à esquerda. Noroeste. Bem longe."}, "hear_hiss_northwest_near": {"en": "A hiss, ahead and to your left. North-west. Not far.", "pt": "Um sibilo, à frente, à esquerda. Noroeste. Não muito longe."}, "hear_hiss_south_close": {"en": "A hiss, behind you. South. Very close.", "pt": "Um sibilo, atrás de você. Sul. Bem perto."}, "hear_hiss_south_far": {"en": "A hiss, behind you. South. Far away.", "pt": "Um sibilo, atrás de você. Sul. Bem longe."}, "hear_hiss_south_near": {"en": "A hiss, behind you. South. Not far.", "pt": "Um sibilo, atrás de você. Sul. Não muito longe."}, "hear_hiss_southeast_close": {"en": "A hiss, behind you, to the right. South-east. Very close.", "pt": "Um sibilo, atrás de você, à direita. Sudeste. Bem perto."}, "hear_hiss_southeast_far": {"en": "A hiss, behind you, to the right. South-east. Far away.", "pt": "Um sibilo, atrás de você, à direita. Sudeste. Bem longe."}, "hear_hiss_southeast_near": {"en": "A hiss, behind you, to the right. South-east. Not far.", "pt": "Um sibilo, atrás de você, à direita. Sudeste. Não muito longe."}, "hear_hiss_southwest_close": {"en": "A hiss, behind you, to the left. South-west. Very close.", "pt": "Um sibilo, atrás de você, à esquerda. Sudoeste. Bem perto."}, "hear_hiss_southwest_far": {"en": "A hiss, behind you, to the left. South-west. Far away.", "pt": "Um sibilo, atrás de você, à esquerda. Sudoeste. Bem longe."}, "hear_hiss_southwest_near": {"en": "A hiss, behind you, to the left. South-west. Not far.", "pt": "Um sibilo, atrás de você, à esquerda. Sudoeste. Não muito longe."}, "hear_hiss_west_close": {"en": "A hiss, to your left. West. Very close.", "pt": "Um sibilo, à sua esquerda. Oeste. Bem perto."}, "hear_hiss_west_far": {"en": "A hiss, to your left. West. Far away.", "pt": "Um sibilo, à sua esquerda. Oeste. Bem longe."}, "hear_hiss_west_near": {"en": "A hiss, to your left. West. Not far.", "pt": "Um sibilo, à sua esquerda. Oeste. Não muito longe."}, "hear_howl_east_close": {"en": "A howl, to your right. East. Very close.", "pt": "Um uivo, à sua direita. Leste. Bem perto."}, "hear_howl_east_far": {"en": "A howl, to your right. East. Far away.", "pt": "Um uivo, à sua direita. Leste. Bem longe."}, "hear_howl_east_near": {"en": "A howl, to your right. East. Not far.", "pt": "Um uivo, à sua direita. Leste. Não muito longe."}, "hear_howl_north_close": {"en": "A howl, ahead of you. North. Very close.", "pt": "Um uivo, à sua frente. Norte. Bem perto."}, "hear_howl_north_far": {"en": "A howl, ahead of you. North. Far away.", "pt": "Um uivo, à sua frente. Norte. Bem longe."}, "hear_howl_north_near": {"en": "A howl, ahead of you. North. Not far.", "pt": "Um uivo, à sua frente. Norte. Não muito longe."}, "hear_howl_northeast_close": {"en": "A howl, ahead and to your right. North-east. Very close.", "pt": "Um uivo, à frente, à direita. Nordeste. Bem perto."}, "hear_howl_northeast_far": {"en": "A howl, ahead and to your right. North-east. Far away.", "pt": "Um uivo, à frente, à direita. Nordeste. Bem longe."}, "hear_howl_northeast_near": {"en": "A howl, ahead and to your right. North-east. Not far.", "pt": "Um uivo, à frente, à direita. Nordeste. Não muito longe."}, "hear_howl_northwest_close": {"en": "A howl, ahead and to your left. North-west. Very close.", "pt": "Um uivo, à frente, à esquerda. Noroeste. Bem perto."}, "hear_howl_northwest_far": {"en": "A howl, ahead and to your left. North-west. Far away.", "pt": "Um uivo, à frente, à esquerda. Noroeste. Bem longe."}, "hear_howl_northwest_near": {"en": "A howl, ahead and to your left. North-west. Not far.", "pt": "Um uivo, à frente, à esquerda. Noroeste. Não muito longe."}, "hear_howl_south_close": {"en": "A howl, behind you. South. Very close.", "pt": "Um uivo, atrás de você. Sul. Bem perto."}, "hear_howl_south_far": {"en": "A howl, behind you. South. Far away.", "pt": "Um uivo, atrás de você. Sul. Bem longe."}, "hear_howl_south_near": {"en": "A howl, behind you. South. Not far.", "pt": "Um uivo, atrás de você. Sul. Não muito longe."}, "hear_howl_southeast_close": {"en": "A howl, behind you, to the right. South-east. Very close.", "pt": "Um uivo, atrás de você, à direita. Sudeste. Bem perto."}, "hear_howl_southeast_far": {"en": "A howl, behind you, to the right. South-east. Far away.", "pt": "Um uivo, atrás de você, à direita. Sudeste. Bem longe."}, "hear_howl_southeast_near": {"en": "A howl, behind you, to the right. South-east. Not far.", "pt": "Um uivo, atrás de você, à direita. Sudeste. Não muito longe."}, "hear_howl_southwest_close": {"en": "A howl, behind you, to the left. South-west. Very close.", "pt": "Um uivo, atrás de você, à esquerda. Sudoeste. Bem perto."}, "hear_howl_southwest_far": {"en": "A howl, behind you, to the left. South-west. Far away.", "pt": "Um uivo, atrás de você, à esquerda. Sudoeste. Bem longe."}, "hear_howl_southwest_near": {"en": "A howl, behind you, to the left. South-west. Not far.", "pt": "Um uivo, atrás de você, à esquerda. Sudoeste. Não muito longe."}, "hear_howl_west_close": {"en": "A howl, to your left. West. Very close.", "pt": "Um uivo, à sua esquerda. Oeste. Bem perto."}, "hear_howl_west_far": {"en": "A howl, to your left. West. Far away.", "pt": "Um uivo, à sua esquerda. Oeste. Bem longe."}, "hear_howl_west_near": {"en": "A howl, to your left. West. Not far.", "pt": "Um uivo, à sua esquerda. Oeste. Não muito longe."}, "hear_nothing": {"en": "You listen. Nothing but the wind.", "pt": "Você escuta. Nada além do vento."}, "hear_snort_east_close": {"en": "Snorting, to your right. East. Very close.", "pt": "Um bufar, à sua direita. Leste. Bem perto."}, "hear_snort_east_far": {"en": "Snorting, to your right. East. Far away.", "pt": "Um bufar, à sua direita. Leste. Bem longe."}, "hear_snort_east_near": {"en": "Snorting, to your right. East. Not far.", "pt": "Um bufar, à sua direita. Leste. Não muito longe."}, "hear_snort_north_close": {"en": "Snorting, ahead of you. North. Very close.", "pt": "Um bufar, à sua frente. Norte. Bem perto."}, "hear_snort_north_far": {"en": "Snorting, ahead of you. North. Far away.", "pt": "Um bufar, à sua frente. Norte. Bem longe."}, "hear_snort_north_near": {"en": "Snorting, ahead of you. North. Not far.", "pt": "Um bufar, à sua frente. Norte. Não muito longe."}, "hear_snort_northeast_close": {"en": "Snorting, ahead and to your right. North-east. Very close.", "pt": "Um bufar, à frente, à direita. Nordeste. Bem perto."}, "hear_snort_northeast_far": {"en": "Snorting, ahead and to your right. North-east. Far away.", "pt": "Um bufar, à frente, à direita. Nordeste. Bem longe."}, "hear_snort_northeast_near": {"en": "Snorting, ahead and to your right. North-east. Not far.", "pt": "Um bufar, à frente, à direita. Nordeste. Não muito longe."}, "hear_snort_northwest_close": {"en": "Snorting, ahead and to your left. North-west. Very close.", "pt": "Um bufar, à frente, à esquerda. Noroeste. Bem perto."}, "hear_snort_northwest_far": {"en": "Snorting, ahead and to your left. North-west. Far away.", "pt": "Um bufar, à frente, à esquerda. Noroeste. Bem longe."}, "hear_snort_northwest_near": {"en": "Snorting, ahead and to your left. North-west. Not far.", "pt": "Um bufar, à frente, à esquerda. Noroeste. Não muito longe."}, "hear_snort_south_close": {"en": "Snorting, behind you. South. Very close.", "pt": "Um bufar, atrás de você. Sul. Bem perto."}, "hear_snort_south_far": {"en": "Snorting, behind you. South. Far away.", "pt": "Um bufar, atrás de você. Sul. Bem longe."}, "hear_snort_south_near": {"en": "Snorting, behind you. South. Not far.", "pt": "Um bufar, atrás de você. Sul. Não muito longe."}, "hear_snort_southeast_close": {"en": "Snorting, behind you, to the right. South-east. Very close.", "pt": "Um bufar, atrás de você, à direita. Sudeste. Bem perto."}, "hear_snort_southeast_far": {"en": "Snorting, behind you, to the right. South-east. Far away.", "pt": "Um bufar, atrás de você, à direita. Sudeste. Bem longe."}, "hear_snort_southeast_near": {"en": "Snorting, behind you, to the right. South-east. Not far.", "pt": "Um bufar, atrás de você, à direita. Sudeste. Não muito longe."}, "hear_snort_southwest_close": {"en": "Snorting, behind you, to the left. South-west. Very close.", "pt": "Um bufar, atrás de você, à esquerda. Sudoeste. Bem perto."}, "hear_snort_southwest_far": {"en": "Snorting, behind you, to the left. South-west. Far away.", "pt": "Um bufar, atrás de você, à esquerda. Sudoeste. Bem longe."}, "hear_snort_southwest_near": {"en": "Snorting, behind you, to the left. South-west. Not far.", "pt": "Um bufar, atrás de você, à esquerda. Sudoeste. Não muito longe."}, "hear_snort_west_close": {"en": "Snorting, to your left. West. Very close.", "pt": "Um bufar, à sua esquerda. Oeste. Bem perto."}, "hear_snort_west_far": {"en": "Snorting, to your left. West. Far away.", "pt": "Um bufar, à sua esquerda. Oeste. Bem longe."}, "hear_snort_west_near": {"en": "Snorting, to your left. West. Not far.", "pt": "Um bufar, à sua esquerda. Oeste. Não muito longe."}, "hear_wings_east_close": {"en": "Wings beating, to your right. East. Very close.", "pt": "Asas batendo, à sua direita. Leste. Bem perto."}, "hear_wings_east_far": {"en": "Wings beating, to your right. East. Far away.", "pt": "Asas batendo, à sua direita. Leste. Bem longe."}, "hear_wings_east_near": {"en": "Wings beating, to your right. East. Not far.", "pt": "Asas batendo, à sua direita. Leste. Não muito longe."}, "hear_wings_north_close": {"en": "Wings beating, ahead of you. North. Very close.", "pt": "Asas batendo, à sua frente. Norte. Bem perto."}, "hear_wings_north_far": {"en": "Wings beating, ahead of you. North. Far away.", "pt": "Asas batendo, à sua frente. Norte. Bem longe."}, "hear_wings_north_near": {"en": "Wings beating, ahead of you. North. Not far.", "pt": "Asas batendo, à sua frente. Norte. Não muito longe."}, "hear_wings_northeast_close": {"en": "Wings beating, ahead and to your right. North-east. Very close.", "pt": "Asas batendo, à frente, à direita. Nordeste. Bem perto."}, "hear_wings_northeast_far": {"en": "Wings beating, ahead and to your right. North-east. Far away.", "pt": "Asas batendo, à frente, à direita. Nordeste. Bem longe."}, "hear_wings_northeast_near": {"en": "Wings beating, ahead and to your right. North-east. Not far.", "pt": "Asas batendo, à frente, à direita. Nordeste. Não muito longe."}, "hear_wings_northwest_close": {"en": "Wings beating, ahead and to your left. North-west. Very close.", "pt": "Asas batendo, à frente, à esquerda. Noroeste. Bem perto."}, "hear_wings_northwest_far": {"en": "Wings beating, ahead and to your left. North-west. Far away.", "pt": "Asas batendo, à frente, à esquerda. Noroeste. Bem longe."}, "hear_wings_northwest_near": {"en": "Wings beating, ahead and to your left. North-west. Not far.", "pt": "Asas batendo, à frente, à esquerda. Noroeste. Não muito longe."}, "hear_wings_south_close": {"en": "Wings beating, behind you. South. Very close.", "pt": "Asas batendo, atrás de você. Sul. Bem perto."}, "hear_wings_south_far": {"en": "Wings beating, behind you. South. Far away.", "pt": "Asas batendo, atrás de você. Sul. Bem longe."}, "hear_wings_south_near": {"en": "Wings beating, behind you. South. Not far.", "pt": "Asas batendo, atrás de você. Sul. Não muito longe."}, "hear_wings_southeast_close": {"en": "Wings beating, behind you, to the right. South-east. Very close.", "pt": "Asas batendo, atrás de você, à direita. Sudeste. Bem perto."}, "hear_wings_southeast_far": {"en": "Wings beating, behind you, to the right. South-east. Far away.", "pt": "Asas batendo, atrás de você, à direita. Sudeste. Bem longe."}, "hear_wings_southeast_near": {"en": "Wings beating, behind you, to the right. South-east. Not far.", "pt": "Asas batendo, atrás de você, à direita. Sudeste. Não muito longe."}, "hear_wings_southwest_close": {"en": "Wings beating, behind you, to the left. South-west. Very close.", "pt": "Asas batendo, atrás de você, à esquerda. Sudoeste. Bem perto."}, "hear_wings_southwest_far": {"en": "Wings beating, behind you, to the left. South-west. Far away.", "pt": "Asas batendo, atrás de você, à esquerda. Sudoeste. Bem longe."}, "hear_wings_southwest_near": {"en": "Wings beating, behind you, to the left. South-west. Not far.", "pt": "Asas batendo, atrás de você, à esquerda. Sudoeste. Não muito longe."}, "hear_wings_west_close": {"en": "Wings beating, to your left. West. Very close.", "pt": "Asas batendo, à sua esquerda. Oeste. Bem perto."}, "hear_wings_west_far": {"en": "Wings beating, to your left. West. Far away.", "pt": "Asas batendo, à sua esquerda. Oeste. Bem longe."}, "hear_wings_west_near": {"en": "Wings beating, to your left. West. Not far.", "pt": "Asas batendo, à sua esquerda. Oeste. Não muito longe."}, "heard_charge": {"en": "It heard you, and it's coming for you!", "pt": "Ele ouviu você, e está vindo atrás de você!"}, "heard_flee": {"en": "It heard you. It's running away.", "pt": "Ele ouviu você. Está fugindo."}, "hit": {"en": "You hit it.", "pt": "Você acerta."}, "hit_hard": {"en": "A crushing blow!", "pt": "Um golpe esmagador!"}, "hurt": {"en": "You're hurt.", "pt": "Você está ferido."}, "intro_bear": {"en": "You're tracking a Cave Bear. Listen for its growl. Careful. If it hears you, it charges.", "pt": "Você está rastreando um Urso das Cavernas. Escute o rosnado dele. Cuidado. Se ele ouvir você, ele avança."}, "intro_boar": {"en": "You're tracking a Wild Boar. Listen for its snorting.", "pt": "Você está rastreando um Javali Selvagem. Escute o bufar dele."}, "intro_forest": {"en": "The trees are moving. You are not hunting the forest. The forest is hunting you. Listen.", "pt": "As árvores estão se mexendo. Você não está caçando a floresta. A floresta está caçando você. Escute."}, "intro_greyfang": {"en": "A legend walks these woods. The Grey Fang, king of wolves. Listen for his howl.", "pt": "Uma lenda anda por esta mata. O Presa Cinzenta, rei dos lobos. Escute o uivo dele."}, "intro_nightmother": {"en": "A legend circles above the trees. The Night Mother. Listen for her wings.", "pt": "Uma lenda voa sobre as árvores. A Mãe da Noite. Escute as asas dela."}, "intro_owl": {"en": "You're tracking a Shadow Owl. Listen for its wings.", "pt": "Você está rastreando uma Coruja das Sombras. Escute as asas dela."}, "intro_serpent": {"en": "You're tracking a Vine Serpent. Listen for its hiss.", "pt": "Você está rastreando uma Serpente das Vinhas. Escute o sibilo dela."}, "intro_stag": {"en": "A legend walks these woods. The White Stag. Nobody has ever caught it. Listen for its breath.", "pt": "Uma lenda anda por esta mata. O Cervo Branco. Ninguém nunca o pegou. Escute o fôlego dele."}, "intro_stalker": {"en": "You're tracking a Night Stalker. Listen for its growl. Careful. It hunts back.", "pt": "Você está rastreando um Espreitador Noturno. Escute o rosnado dele. Cuidado. Ele caça de volta."}, "intro_swampking": {"en": "A legend waits in the marsh. The Swamp King. Listen for his hiss.", "pt": "Uma lenda espera no pântano. O Rei do Pântano. Escute o sibilo dele."}, "intro_wolf": {"en": "You're tracking a Grey Wolf. Listen for its howl.", "pt": "Você está rastreando um Lobo Cinzento. Escute o uivo dele."}, "its_hit": {"en": "It hits you.", "pt": "Ele acerta você."}, "its_hit_hard": {"en": "It tears into you!", "pt": "Ele dilacera você!"}, "its_stuck": {"en": "It's still stuck in the trap.", "pt": "Ele continua preso na armadilha."}, "legend_done": {"en": "A legend falls. The forest will remember your name.", "pt": "Uma lenda cai. A floresta vai lembrar o seu nome."}, "legend_flee": {"en": "Wounded, the legend breaks away and vanishes into the trees. Track it again.", "pt": "Ferida, a lenda escapa e some entre as árvores. Rastreie-a de novo."}, "lost": {"en": "You fall. The hunters carry you home. No reward this time.", "pt": "Você cai. Os caçadores levam você para casa. Sem recompensa desta vez."}, "miss": {"en": "You swing and miss.", "pt": "Você golpeia e erra."}, "no_bandage": {"en": "No bandages left.", "pt": "Sem ataduras."}, "noise_warn": {"en": "Your footsteps are loud. Try sneaking.", "pt": "Seus passos estão altos. Tente avançar em silêncio."}, "prey_dying": {"en": "It's almost finished.", "pt": "Ele está quase no fim."}, "prey_weak": {"en": "It's weakening.", "pt": "Ele está enfraquecendo."}, "rank_up": {"en": "Your bounty rank rises.", "pt": "Seu nível de caçador sobe."}, "sneak_east": {"en": "You creep east, quietly.", "pt": "Você avança para o leste, em silêncio."}, "sneak_north": {"en": "You creep north, quietly.", "pt": "Você avança para o norte, em silêncio."}, "sneak_south": {"en": "You creep south, quietly.", "pt": "Você avança para o sul, em silêncio."}, "sneak_west": {"en": "You creep west, quietly.", "pt": "Você avança para o oeste, em silêncio."}, "tracks_east_fresh": {"en": "Fresh tracks in the mud, heading east.", "pt": "Pegadas frescas na lama, indo para o leste."}, "tracks_east_old": {"en": "Old tracks, heading east. It passed here a while ago.", "pt": "Pegadas antigas, indo para o leste. Passou por aqui faz um tempo."}, "tracks_none": {"en": "You search the ground. No tracks here.", "pt": "Você procura no chão. Nenhuma pegada aqui."}, "tracks_north_fresh": {"en": "Fresh tracks in the mud, heading north.", "pt": "Pegadas frescas na lama, indo para o norte."}, "tracks_north_old": {"en": "Old tracks, heading north. It passed here a while ago.", "pt": "Pegadas antigas, indo para o norte. Passou por aqui faz um tempo."}, "tracks_northeast_fresh": {"en": "Fresh tracks in the mud, heading north-east.", "pt": "Pegadas frescas na lama, indo para o nordeste."}, "tracks_northeast_old": {"en": "Old tracks, heading north-east. It passed here a while ago.", "pt": "Pegadas antigas, indo para o nordeste. Passou por aqui faz um tempo."}, "tracks_northwest_fresh": {"en": "Fresh tracks in the mud, heading north-west.", "pt": "Pegadas frescas na lama, indo para o noroeste."}, "tracks_northwest_old": {"en": "Old tracks, heading north-west. It passed here a while ago.", "pt": "Pegadas antigas, indo para o noroeste. Passou por aqui faz um tempo."}, "tracks_south_fresh": {"en": "Fresh tracks in the mud, heading south.", "pt": "Pegadas frescas na lama, indo para o sul."}, "tracks_south_old": {"en": "Old tracks, heading south. It passed here a while ago.", "pt": "Pegadas antigas, indo para o sul. Passou por aqui faz um tempo."}, "tracks_southeast_fresh": {"en": "Fresh tracks in the mud, heading south-east.", "pt": "Pegadas frescas na lama, indo para o sudeste."}, "tracks_southeast_old": {"en": "Old tracks, heading south-east. It passed here a while ago.", "pt": "Pegadas antigas, indo para o sudeste. Passou por aqui faz um tempo."}, "tracks_southwest_fresh": {"en": "Fresh tracks in the mud, heading south-west.", "pt": "Pegadas frescas na lama, indo para o sudoeste."}, "tracks_southwest_old": {"en": "Old tracks, heading south-west. It passed here a while ago.", "pt": "Pegadas antigas, indo para o sudoeste. Passou por aqui faz um tempo."}, "tracks_west_fresh": {"en": "Fresh tracks in the mud, heading west.", "pt": "Pegadas frescas na lama, indo para o oeste."}, "tracks_west_old": {"en": "Old tracks, heading west. It passed here a while ago.", "pt": "Pegadas antigas, indo para o oeste. Passou por aqui faz um tempo."}, "trap_fail": {"en": "It sees the trap and slips away.", "pt": "Ele vê a armadilha e escapa."}, "trap_ok": {"en": "The trap snaps shut. It's stuck!", "pt": "A armadilha fecha. Ele está preso!"}, "tree": {"en": "Thick trees block the way. Try another direction.", "pt": "Árvores grossas bloqueiam o caminho. Tente outra direção."}, "walk_east": {"en": "You walk east.", "pt": "Você anda para o leste."}, "walk_north": {"en": "You walk north.", "pt": "Você anda para o norte."}, "walk_south": {"en": "You walk south.", "pt": "Você anda para o sul."}, "walk_west": {"en": "You walk west.", "pt": "Você anda para o oeste."}, "win_bear": {"en": "The Cave Bear falls. You earn 110 gold and a Bear Claw.", "pt": "O Urso das Cavernas cai. Você ganha 110 de ouro e uma Garra de Urso."}, "win_boar": {"en": "The Wild Boar falls. You earn 55 gold and a Boar Tusk.", "pt": "O Javali Selvagem cai. Você ganha 55 de ouro e uma Presa de Javali."}, "win_forest": {"en": "The Forest Itself falls. You earn 3000 gold and the Heartwood.", "pt": "A Própria Floresta cai. Você ganha 3000 de ouro e o Cerne da Floresta."}, "win_greyfang": {"en": "The Grey Fang falls. You earn 500 gold and the Grey Fang's Crown.", "pt": "O Presa Cinzenta cai. Você ganha 500 de ouro e a Coroa do Presa Cinzenta."}, "win_nightmother": {"en": "The Night Mother falls. You earn 1500 gold and a Moonlit Wing.", "pt": "A Mãe da Noite cai. Você ganha 1500 de ouro e uma Asa de Luar."}, "win_owl": {"en": "The Shadow Owl falls. You earn 65 gold and a Night Feather.", "pt": "A Coruja das Sombras cai. Você ganha 65 de ouro e uma Pena Noturna."}, "win_serpent": {"en": "The Vine Serpent falls. You earn 70 gold and a Serpent Scale.", "pt": "A Serpente das Vinhas cai. Você ganha 70 de ouro e uma Escama de Serpente."}, "win_stag": {"en": "The White Stag falls. You earn 750 gold and a White Antler.", "pt": "O Cervo Branco cai. Você ganha 750 de ouro e um Chifre Branco."}, "win_stalker": {"en": "The Night Stalker falls. You earn 100 gold and a Stalker Fang.", "pt": "O Espreitador Noturno cai. Você ganha 100 de ouro e uma Presa de Espreitador."}, "win_swampking": {"en": "The Swamp King falls. You earn 1000 gold and the Swamp King's Eye.", "pt": "O Rei do Pântano cai. Você ganha 1000 de ouro e o Olho do Rei do Pântano."}, "win_wolf": {"en": "The Grey Wolf falls. You earn 60 gold and a Wolf Pelt.", "pt": "O Lobo Cinzento cai. Você ganha 60 de ouro e uma Pele de Lobo."}};

// ── The narrator ──
var _narrQueue = [], _narrPlaying = false, _narrAudio = null, _narrIds = null;
function _narrPT() { return typeof _translationLang !== 'undefined' && _translationLang === 'pt-BR' && _translationEnabled; }
function huntLineText(id) { var l = HUNT_LINES[id]; return l ? (_narrPT() ? l.pt : l.en) : id; }
function huntNarrate(ids) {
  _narrQueue = _narrQueue.concat(ids);
  if (!_narrPlaying) _narrNext();
}
function huntNarrStop() { _narrQueue = []; if (_narrAudio) { try { _narrAudio.pause(); } catch (e) {} } _narrAudio = null; _narrPlaying = false; }
function _narrNext() {
  if (!_narrQueue.length) { _narrPlaying = false; return; }
  _narrPlaying = true;
  var item = _narrQueue.shift();
  var fallback = function() {
    var words = item.indexOf('text:') === 0 ? item.slice(5) : huntLineText(item);
    say(words);
    setTimeout(_narrNext, Math.min(4000, 900 + words.length * 55));
  };
  if (item.indexOf('text:') === 0 || !HUNT_LINES[item] || (window.AUD && AUD.sfxOn === false)) { fallback(); return; }
  var a = new Audio('audio/hunt/' + (_narrPT() ? 'pt' : 'en') + '/' + item + '.mp3');
  a.volume = Math.min(1, ((window.AUD && AUD.sfxVol) || 0.8) * 1.2);
  _narrAudio = a;
  a.onended = function() { setTimeout(_narrNext, 150); };
  a.onerror = fallback;
  var p = a.play();
  if (p && p.catch) p.catch(function() { fallback(); });
}
// Brian's old lines, by their English words.
function brianSay(text) {
  if (!_narrIds) { _narrIds = {}; Object.keys(HUNT_LINES).forEach(function(k) { _narrIds[HUNT_LINES[k].en] = k; }); }
  if (_narrIds[text]) { huntNarrate([_narrIds[text]]); return; }
  var parts = [], cur = '';
  String(text).split(' ').forEach(function(w) {
    cur += (cur ? ' ' : '') + w;
    if (/[.!?]$/.test(w)) { parts.push(cur); cur = ''; }
  });
  if (cur) parts.push(cur);
  huntNarrate(parts.map(function(p) { return _narrIds[p] || 'text:' + p; }));
}

// ── The beasts ──
var TRK_PREY = [
  { id:'wolf', name:'Grey Wolf', icon:'🐺', call:'howl', hp:70, atk:[8,14], gold:60, xp:20, trophy:'Wolf Pelt', wander:0.30, aggressive:false, legendary:false, rank:1 },
  { id:'boar', name:'Wild Boar', icon:'🐗', call:'snort', hp:90, atk:[7,13], gold:55, xp:18, trophy:'Boar Tusk', wander:0.25, aggressive:true, legendary:false, rank:1 },
  { id:'owl', name:'Shadow Owl', icon:'🦉', call:'wings', hp:50, atk:[9,15], gold:65, xp:22, trophy:'Night Feather', wander:0.40, aggressive:false, legendary:false, rank:1 },
  { id:'serpent', name:'Vine Serpent', icon:'🐍', call:'hiss', hp:60, atk:[10,16], gold:70, xp:24, trophy:'Serpent Scale', wander:0.20, aggressive:false, legendary:false, rank:2 },
  { id:'stalker', name:'Night Stalker', icon:'👁', call:'growl', hp:100, atk:[13,19], gold:100, xp:32, trophy:'Stalker Fang', wander:0.35, aggressive:true, legendary:false, rank:3 },
  { id:'bear', name:'Cave Bear', icon:'🐻', call:'growl', hp:130, atk:[12,20], gold:110, xp:35, trophy:'Bear Claw', wander:0.20, aggressive:true, legendary:false, rank:4 },
  { id:'greyfang', name:'The Grey Fang', icon:'🐺', call:'howl', hp:220, atk:[14,22], gold:500, xp:120, trophy:"The Grey Fang's Crown", wander:0.40, aggressive:false, legendary:true, rank:2 },
  { id:'stag', name:'The White Stag', icon:'🦌', call:'snort', hp:260, atk:[12,20], gold:750, xp:160, trophy:'White Antler', wander:0.50, aggressive:false, legendary:true, rank:4 },
  { id:'swampking', name:'The Swamp King', icon:'🐊', call:'hiss', hp:320, atk:[16,26], gold:1000, xp:220, trophy:"The Swamp King's Eye", wander:0.30, aggressive:true, legendary:true, rank:6 },
  { id:'nightmother', name:'The Night Mother', icon:'🦇', call:'wings', hp:380, atk:[18,28], gold:1500, xp:300, trophy:'Moonlit Wing', wander:0.45, aggressive:false, legendary:true, rank:8 },
  { id:'forest', name:'The Forest Itself', icon:'🌳', call:'growl', hp:500, atk:[20,32], gold:3000, xp:500, trophy:'The Heartwood', wander:0.35, aggressive:true, legendary:true, rank:10 }
];
var TRK = { size: 6, maxTurns: 40, bandages: 3, hunt: null, sneak: true, log: [], result: null };
var TRK_DIRS = { north:[0,-1], south:[0,1], east:[1,0], west:[-1,0] };
function trkPrey(id) { for (var i = 0; i < TRK_PREY.length; i++) if (TRK_PREY[i].id === id) return TRK_PREY[i]; return TRK_PREY[0]; }
function _trkRoll(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function _trkDist(h) { return Math.max(Math.abs(h.px - h.x), Math.abs(h.py - h.y)); }
function trkDirection(dx, dy) {
  if (!dx && !dy) return 'north';
  var deg = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
  return ['north','northeast','east','southeast','south','southwest','west','northwest'][Math.floor((deg + 22.5) / 45) % 8];
}
function trkDistWord(d) { return d <= 1 ? 'close' : d <= 3 ? 'near' : 'far'; }
function _trkPlace(h, away) {
  for (var i = 0; i < 50; i++) {
    var ang = _trkRoll(0, 359) * Math.PI / 180;
    var nx = h.x + Math.round(Math.cos(ang) * away), ny = h.y + Math.round(Math.sin(ang) * away);
    if (Math.abs(nx) <= TRK.size && Math.abs(ny) <= TRK.size && Math.max(Math.abs(nx - h.x), Math.abs(ny - h.y)) >= 2) { h.px = nx; h.py = ny; return; }
  }
  h.px = h.x > 0 ? -TRK.size : TRK.size; h.py = h.y > 0 ? -TRK.size : TRK.size;
}
function trkStart(preyId, ch, bounty) {
  var lv = Math.max(1, ch.persistLevel || ch.level || 1), p = trkPrey(preyId);
  var hp = (HP_MAP[ch.cls] || 100) + lv * 10, atk = ATK_MAP[ch.cls] || [8, 14];
  var h = { preyId: p.id, bounty: !!bounty, phase: 'tracking', x: 0, y: 0, px: 0, py: 0, noise: 0, turns: 0, seen: false,
    hp: hp, maxHp: hp, atkLo: atk[0] + lv, atkHi: atk[1] + lv, def: DEF_MAP[ch.cls] || 2, bandages: TRK.bandages,
    preyHp: p.hp, preyMax: p.hp, stuck: 0, fledOnce: false };
  _trkPlace(h, 5 + _trkRoll(0, 2));
  return h;
}
function _trkPass(h, extraMove) {
  var out = [], p = trkPrey(h.preyId), threshold = p.legendary ? 3 : 4;
  h.turns++;
  if (h.noise >= threshold && _trkDist(h) <= 3) {
    h.seen = true;
    if (p.aggressive) {
      h.phase = 'fight'; h.px = h.x; h.py = h.y;
      return out.concat(['heard_charge'], _trkPreyTurn(h, false));
    }
    out.push('heard_flee'); _trkPlace(h, 4); h.noise = 0;
  } else if (h.noise >= threshold - 1 && _trkDist(h) <= 4) out.push('noise_warn');
  for (var i = 0; i < (extraMove ? 2 : 1); i++) {
    if (Math.random() < p.wander) {
      var d = TRK_DIRS[['north','south','east','west'][_trkRoll(0, 3)]];
      var nx = h.px + d[0], ny = h.py + d[1];
      if (Math.abs(nx) <= TRK.size && Math.abs(ny) <= TRK.size && !(nx === h.x && ny === h.y)) { h.px = nx; h.py = ny; }
    }
  }
  h.noise = Math.max(0, h.noise - 1);
  if (h.turns >= TRK.maxTurns && h.phase === 'tracking') { h.phase = 'cold'; out.push('cold'); }
  return out;
}
function trkMove(h, dir, sneak) {
  if (h.phase !== 'tracking') return [];
  var d = TRK_DIRS[dir], nx = h.x + d[0], ny = h.y + d[1];
  if (Math.abs(nx) > TRK.size || Math.abs(ny) > TRK.size) return ['tree'];
  h.x = nx; h.y = ny; h.noise += sneak ? 1 : 3;
  var out = [(sneak ? 'sneak_' : 'walk_') + dir];
  if (h.x === h.px && h.y === h.py) { h.phase = 'found'; if (h.noise >= 3) h.seen = true; return out.concat(['found_' + h.preyId]); }
  return out.concat(_trkPass(h, sneak));
}
function trkHearLine(h) { return 'hear_' + trkPrey(h.preyId).call + '_' + trkDirection(h.px - h.x, h.py - h.y) + '_' + trkDistWord(_trkDist(h)); }
function trkListen(h) { if (h.phase !== 'tracking') return []; return [trkHearLine(h)].concat(_trkPass(h, false)); }
function trkSearch(h) {
  if (h.phase !== 'tracking') return [];
  var d = _trkDist(h), found = Math.random() < (d <= 3 ? 0.85 : 0.55);
  var out = found ? ['tracks_' + trkDirection(h.px - h.x, h.py - h.y) + '_' + (d <= 3 ? 'fresh' : 'old')] : ['tracks_none'];
  return out.concat(_trkPass(h, false));
}
function _trkHurtPrey(h, dmg) {
  var p = trkPrey(h.preyId), before = h.preyHp;
  h.preyHp = Math.max(0, h.preyHp - dmg);
  if (!h.preyHp) {
    h.phase = 'won';
    var out = ['win_' + h.preyId];
    if (p.legendary) out.push('legend_done');
    if (h.bounty) out.push('bounty_done');
    return out;
  }
  if (p.legendary && !h.fledOnce && h.preyHp * 2 <= h.preyMax) {
    h.fledOnce = true; h.phase = 'tracking'; h.stuck = 0; h.seen = false; h.noise = 0; h.turns = Math.max(0, h.turns - 10);
    _trkPlace(h, 4);
    return ['legend_flee'];
  }
  if (h.preyHp * 4 <= h.preyMax && before * 4 > h.preyMax) return ['prey_dying'];
  if (h.preyHp * 2 <= h.preyMax && before * 2 > h.preyMax) return ['prey_weak'];
  return [];
}
function _trkPreyTurn(h, defending) {
  if (h.stuck > 0) { h.stuck--; return ['its_stuck']; }
  var p = trkPrey(h.preyId), before = h.hp;
  var dmg = Math.max(1, _trkRoll(p.atk[0], p.atk[1]) - h.def);
  if (defending) dmg = Math.max(1, Math.floor(dmg / 4));
  h.hp = Math.max(0, h.hp - dmg);
  var out = [defending ? 'blocked' : dmg * 100 >= h.maxHp * 15 ? 'its_hit_hard' : 'its_hit'];
  if (!h.hp) { h.phase = 'lost'; out.push('lost'); return out; }
  if (h.hp * 4 <= h.maxHp && before * 4 > h.maxHp) out.push('badly_hurt');
  else if (h.hp * 2 <= h.maxHp && before * 2 > h.maxHp) out.push('hurt');
  return out;
}
function trkAmbush(h) {
  if (h.phase !== 'found') return [];
  h.phase = 'fight';
  if (h.seen) return ['ambush_seen'].concat(_trkPreyTurn(h, false));
  return ['ambush'].concat(_trkHurtPrey(h, Math.floor(_trkRoll(h.atkLo, h.atkHi) * 2.5)));
}
function trkTrap(h) {
  if (h.phase !== 'found') return [];
  if (Math.random() < (trkPrey(h.preyId).legendary ? 0.5 : 0.7)) { h.phase = 'fight'; h.stuck = 2; return ['trap_ok']; }
  h.phase = 'tracking'; h.seen = false; h.noise = 0; _trkPlace(h, 2 + _trkRoll(0, 1));
  return ['trap_fail'];
}
function trkFace(h) { if (h.phase !== 'found') return []; h.phase = 'fight'; return ['fight']; }
function trkStrike(h, s) {
  if (h.phase !== 'fight') return [];
  var out = [];
  if (s === 'attack') out = ['hit'].concat(_trkHurtPrey(h, _trkRoll(h.atkLo, h.atkHi)));
  else if (s === 'heavy') out = Math.random() < 0.25 ? ['miss'] : ['hit_hard'].concat(_trkHurtPrey(h, Math.floor(_trkRoll(h.atkLo, h.atkHi) * 1.6)));
  else if (s === 'defend') out = ['defend'].concat(_trkHurtPrey(h, Math.max(1, Math.floor(_trkRoll(h.atkLo, h.atkHi) / 2))));
  else if (s === 'bandage') {
    if (h.bandages <= 0) return ['no_bandage'];
    h.bandages--; h.hp = Math.min(h.maxHp, h.hp + Math.floor(h.maxHp * 35 / 100)); out = ['bandage'];
  }
  if (h.phase === 'fight') out = out.concat(_trkPreyTurn(h, s === 'defend'));
  return out;
}

// ── Rewards, trophies, legends and today's bounties (same keys as the app) ──
function _trkLoad(k, d) { try { var v = JSON.parse(DDStore.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
function trkTrophies() { return _trkLoad('dd_hunt_trophies', {}); }
function trkLegendsSlain() { return _trkLoad('dd_hunt_legends', []); }
function _trkUtcDay(now) { return new Date(now).toISOString().slice(0, 10); }
function trkBountyState(now) {
  now = now || Date.now();
  var b = _trkLoad('dd_hunt_bounties', null), day = _trkUtcDay(now);
  return b && b.day === day ? b : { day: day, done: [] };
}
function trkBounties(rank, now) {
  now = now || Date.now();
  var n = Math.floor(now / 86400000);
  var pool = TRK_PREY.filter(function(p) { return !p.legendary && p.rank <= Math.max(1, rank); }), out = [], s = n * 7 + 31000;
  while (out.length < 3 && pool.length) {
    var x = Math.sin(s) * 10000, r = x - Math.floor(x);
    out.push(pool.splice(Math.floor(r * pool.length) % pool.length, 1)[0]);
    s++;
  }
  return out;
}
function trkCollect(h) {
  if (h.phase !== 'won') return null;
  var p = trkPrey(h.preyId), gold = p.gold * (h.bounty ? 2 : 1), xp = h.bounty ? Math.floor(p.xp * 3 / 2) : p.xp;
  var before = getCurrentRank().rank;
  addGlobalGold(gold);
  addBountyXP(xp);
  var t = trkTrophies(); t[h.preyId] = (t[h.preyId] || 0) + 1; DDStore.setItem('dd_hunt_trophies', JSON.stringify(t));
  if (p.legendary) { var l = trkLegendsSlain(); if (l.indexOf(h.preyId) === -1) { l.push(h.preyId); DDStore.setItem('dd_hunt_legends', JSON.stringify(l)); } }
  if (h.bounty) { var b = trkBountyState(); if (b.done.indexOf(h.preyId) === -1) b.done.push(h.preyId); DDStore.setItem('dd_hunt_bounties', JSON.stringify(b)); }
  if (typeof bpRecord === 'function') { try { bpRecord('kill', { elite: p.legendary }); } catch (e) {} }
  return { gold: gold, xp: xp, rankUp: getCurrentRank().rank > before ? getCurrentRank() : null };
}

// ── Sound: the beast's call from where it is, and the forest ──
var _trkForest = null;
function trkForest(on) {
  if (on) {
    if (!_trkForest) { _trkForest = new Audio('audio/hunt-forest.mp3'); _trkForest.loop = true; }
    _trkForest.volume = Math.min(1, ((window.AUD && AUD.musicVol) || 0.6) * 0.8);
    var p = _trkForest.play(); if (p && p.catch) p.catch(function() {});
  } else if (_trkForest) { _trkForest.pause(); }
}
function trkCall(h, close) {
  if (!h) return;
  try {
    if (window.AUD && !AUD.ctx && typeof initWebAudio === 'function') initWebAudio();
    var a = new Audio('audio/hunt-call-' + trkPrey(h.preyId).call + '.mp3');
    var d = close ? 1 : Math.max(1, _trkDist(h)), dx = close ? 0 : h.px - h.x, dy = close ? -1 : h.py - h.y;
    a.volume = Math.max(0.15, Math.min(1, 1.1 - d * 0.14)) * ((window.AUD && AUD.sfxVol) || 0.8);
    if (window.AUD && AUD.ctx && AUD.ctx.createStereoPanner) {
      var src = AUD.ctx.createMediaElementSource(a), pan = AUD.ctx.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, dx / Math.max(2, Math.abs(dx) + Math.abs(dy))));
      // Behind you sounds muffled.
      var f = AUD.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = dy > 0 ? 1400 : 12000;
      src.connect(f); f.connect(pan); pan.connect(AUD.ctx.destination);
      if (AUD.ctx.state === 'suspended') AUD.ctx.resume();
    }
    var p = a.play(); if (p && p.catch) p.catch(function() {});
  } catch (e) {}
}

// The forest has no music: only the wind, the birds and the beast.
function trkStopMusic() {
  try {
    if (typeof _howlMusic !== 'undefined' && _howlMusic) _howlMusic.stop();
    if (AUD.currentSource) { AUD.currentSource.stop(); AUD.currentSource = null; }
    Object.keys(AUD.tracks || {}).forEach(function(k) { var t = AUD.tracks[k]; if (t && t.pause) t.pause(); });
    AUD.current = null;
  } catch (e) {}
}

// ── Playing it ──
function _trkSay(ids) {
  if (!ids.length) return;
  TRK.log = ids.map(huntLineText).reverse().concat(TRK.log).slice(0, 60);
  huntNarrate(ids);
}
function trkBegin(preyId, bounty) {
  var c = CHARS && CHARS[HUNT.charIdx];
  if (!c) { say('Select a character first.'); return; }
  if (HUNT.active) stopHunt();
  TRK.hunt = trkStart(preyId, c, bounty);
  TRK.log = []; TRK.result = null; TRK.sneak = true;
  trkStopMusic();
  trkForest(true);
  huntNarrStop();
  _trkSay(['intro_' + preyId]);
  setTimeout(function() { trkCall(TRK.hunt); }, 4500);
  trkRender();
}
function trkLeave() {
  TRK.hunt = null; huntNarrStop(); trkForest(false);
  if (typeof playTrack === 'function') playTrack('menu');
  trkRender();
  loadHuntingGrounds();
}
function _trkAfter(ids, delay) {
  var h = TRK.hunt; if (!h) return;
  if (ids.indexOf('heard_charge') !== -1 || ids.some(function(i) { return i.indexOf('found_') === 0; })) trkCall(h, true);
  if (h.phase === 'fight' && ids.some(function(i) { return ['fight','ambush','ambush_seen','heard_charge','trap_ok'].indexOf(i) !== -1; })) playTrack(trkPrey(h.preyId).legendary ? 'boss' : 'battle');
  if (h.phase === 'won') {
    sfx('sfx-victory');
    var got = trkCollect(h);
    if (got && got.rankUp) { ids = ids.concat(['rank_up']); sfx('sfx-levelup'); }
    TRK.result = huntLineText('win_' + h.preyId) + (h.bounty ? ' ' + huntLineText('bounty_done') : '') + (got ? ' +' + got.xp + ' XP.' : '') + (got && got.rankUp ? ' 🏹 ' + got.rankUp.name + '!' : '');
    trkForest(false);
  } else if (h.phase === 'lost') { sfx('sfx-death'); TRK.result = huntLineText('lost'); trkForest(false); }
  else if (h.phase === 'cold') { TRK.result = huntLineText('cold'); trkForest(false); }
  if (delay) setTimeout(function() { _trkSay(ids); }, delay); else _trkSay(ids);
  trkRender();
}
function trkDo(action, arg) {
  var h = TRK.hunt; if (!h) return;
  var ids = [];
  if (action === 'move') { ids = trkMove(h, arg, TRK.sneak); if (ids[0] !== 'tree') sfx('sfx-footstep'); }
  else if (action === 'listen') { ids = trkListen(h); trkCall(h); _trkAfter(ids, 1200); return; }
  else if (action === 'search') ids = trkSearch(h);
  else if (action === 'ambush') ids = trkAmbush(h);
  else if (action === 'trap') { sfx('sfx-trap'); ids = trkTrap(h); }
  else if (action === 'face') ids = trkFace(h);
  else if (action === 'strike') {
    ids = trkStrike(h, arg);
    sfx(arg === 'bandage' ? 'sfx-potion' : arg === 'heavy' ? (ids.indexOf('miss') !== -1 ? 'sfx-heavy-miss' : 'sfx-heavy-hit') : 'sfx-attack');
    if (ids.some(function(i) { return i.indexOf('its_hit') === 0; })) setTimeout(function() { sfx('sfx-hurt'); }, 500);
  }
  _trkAfter(ids);
}
function trkToggleSneak() {
  TRK.sneak = !TRK.sneak;
  say(TRK.sneak ? 'Sneaking. Quiet, but the beast moves more.' : 'Walking. Fast, but loud. It may hear you.');
  trkRender();
}

// ── The screen ──
function _trkBtn(label, on, aria, style) {
  return '<button type="button" class="menu-btn" style="width:100%;margin:4px 0;' + (style || '') + '" onclick="' + on + '"' + (aria ? ' aria-label="' + aria.replace(/"/g, '&quot;') + '"' : '') + '>' + label + '</button>';
}
function trkRender() {
  var box = document.getElementById('hunt-track-screen'), main = document.getElementById('hunt-main');
  if (!box || !main) return;
  var h = TRK.hunt;
  box.style.display = h ? '' : 'none';
  main.style.display = h ? 'none' : '';
  if (!h) { trkRenderSection(); return; }
  var p = trkPrey(h.preyId), html = '';
  html += '<h2 style="font-family:\'Cinzel Decorative\',cursive;color:' + (p.legendary ? '#ffcc44' : '#44aa44') + ';font-size:1.1rem;margin:0 0 8px;">' + p.icon + ' ' + p.name + (h.bounty ? ' · Bounty' : '') + (p.legendary ? ' · Legend' : '') + '</h2>';
  var st = 'Your HP ' + h.hp + ' of ' + h.maxHp + ', ' + h.bandages + ' bandages.' + (h.phase === 'fight' || h.preyHp < h.preyMax ? ' ' + p.name + ': ' + h.preyHp + ' of ' + h.preyMax + ' HP.' : '') + (h.phase === 'tracking' ? ' ' + (TRK.maxTurns - h.turns) + ' turns left.' : '');
  html += '<div role="text" aria-label="' + st + '" style="font-family:Cinzel,serif;font-size:0.75rem;color:#ccc;margin-bottom:10px;">❤️ ' + h.hp + ' / ' + h.maxHp + ' HP · 🩹 ' + h.bandages +
    (h.phase === 'fight' || h.preyHp < h.preyMax ? '<br>' + p.icon + ' ' + h.preyHp + ' / ' + h.preyMax + ' HP' : '') +
    (h.phase === 'tracking' ? '<br><span style="color:#666">⏳ ' + (TRK.maxTurns - h.turns) + ' turns before the trail goes cold</span>' : '') + '</div>';
  if (h.phase === 'tracking') {
    html += _trkBtn(TRK.sneak ? '🤫 Sneaking (quiet, slower)' : '🚶 Walking (fast, loud)', 'trkToggleSneak()');
    var mv = TRK.sneak ? 'Sneak ' : 'Walk ';
    html += '<div role="group" aria-label="Directions" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;max-width:300px;margin:8px auto;">' +
      '<span></span>' + _trkBtn('▲ North', "trkDo('move','north')", mv + 'north') + '<span></span>' +
      _trkBtn('◄ West', "trkDo('move','west')", mv + 'west') + _trkBtn('👂 Listen', "trkDo('listen')", 'Listen. Its call comes from where it is. Best with headphones.') + _trkBtn('East ►', "trkDo('move','east')", mv + 'east') +
      '<span></span>' + _trkBtn('▼ South', "trkDo('move','south')", mv + 'south') + '<span></span></div>';
    html += _trkBtn('🐾 Search for Tracks', "trkDo('search')");
  } else if (h.phase === 'found') {
    html += _trkBtn('🗡 Ambush', "trkDo('ambush')", "Ambush. Strike from hiding for huge damage, if it hasn't noticed you.", 'border-color:#cc4444;color:#ff8888;');
    html += _trkBtn('🪤 Set a Trap', "trkDo('trap')", 'Set a trap. Catch it for two turns. It might slip away.');
    html += _trkBtn('⚔ Face It', "trkDo('face')");
  } else if (h.phase === 'fight') {
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
      _trkBtn('⚔ Attack', "trkDo('strike','attack')", 'Attack, ' + h.atkLo + ' to ' + h.atkHi + ' damage', 'border-color:#cc4444;color:#ff8888;') +
      _trkBtn('🔨 Heavy', "trkDo('strike','heavy')", 'Heavy strike, much harder but can miss', 'border-color:#cc4444;color:#ff8888;') +
      _trkBtn('🛡 Defend', "trkDo('strike','defend')", 'Defend: strike for half and take a quarter') +
      _trkBtn('🩹 Bandage (' + h.bandages + ')', "trkDo('strike','bandage')", 'Bandage, heals a third of your HP. ' + h.bandages + ' left.') + '</div>';
  } else {
    if (TRK.result) html += '<p style="font-family:\'Crimson Text\',serif;font-size:1rem;color:#ccc;">' + TRK.result + '</p>';
    html += _trkBtn('🌲 Back to the Hunting Grounds', 'trkLeave()', null, 'border-color:#c8a832;color:#ffdd44;');
  }
  html += '<div aria-label="What the narrator said, newest first" role="log" style="background:#020502;border:1px solid #0a1a0a;padding:10px;margin-top:10px;font-family:\'Crimson Text\',serif;font-size:0.9rem;color:#88aa88;">' +
    TRK.log.slice(0, 10).map(function(l) { return '<div>' + l + '</div>'; }).join('') + '</div>';
  if (h.phase === 'tracking' || h.phase === 'found') html += _trkBtn('🏳 Give Up the Hunt', 'trkLeave()');
  box.innerHTML = html;
}
// The Track a Beast list on the Hunting Grounds screen.
function trkRenderSection() {
  var box = document.getElementById('hunt-track-section'); if (!box) return;
  if (HUNT.active) { box.style.display = 'none'; return; }
  box.style.display = '';
  var rank = getCurrentRank().rank, done = trkBountyState().done, slain = trkLegendsSlain(), tro = trkTrophies(), html = '';
  html += '<div role="heading" aria-level="3" style="font-family:Cinzel,serif;font-size:0.65rem;color:#44aa44;letter-spacing:0.1em;margin:10px 0 4px;">🎯 TRACK A BEAST</div>';
  html += '<div style="font-family:\'Crimson Text\',serif;font-style:italic;font-size:0.85rem;color:#666;margin-bottom:6px;">Hunt by sound: listen for its call, read its tracks, sneak up and strike. Best with headphones.</div>';
  html += '<div style="font-family:Cinzel,serif;font-size:0.62rem;color:#a08020;">Today\'s bounties (double gold)</div>';
  trkBounties(rank).forEach(function(p) {
    var isDone = done.indexOf(p.id) !== -1;
    html += isDone ? _trkBtn('✓ ' + p.name + ' — done', '', p.name + ' bounty, done today', 'opacity:0.5;') :
      _trkBtn(p.icon + ' ' + p.name + ' — ' + (p.gold * 2) + ' gold', "trkBegin('" + p.id + "',true)", 'Bounty: ' + p.name + ', ' + (p.gold * 2) + ' gold', 'border-color:#c8a832;color:#ffdd44;');
  });
  html += _trkBtn('🌲 Free Hunt (a random beast)', 'trkFree()');
  html += '<div style="font-family:Cinzel,serif;font-size:0.62rem;color:#ffcc44;margin-top:6px;">Legends</div>';
  TRK_PREY.filter(function(p) { return p.legendary; }).forEach(function(p) {
    var open = rank >= p.rank, killed = slain.indexOf(p.id) !== -1;
    html += open ? _trkBtn((killed ? '✓' : p.icon) + ' ' + p.name + ' — ' + p.gold + ' gold', "trkBegin('" + p.id + "',false)", 'Legend: ' + p.name + ', ' + p.gold + ' gold' + (killed ? ', slain before' : ''), 'border-color:#cc4444;color:#ff8888;') :
      _trkBtn('🔒 ' + p.name + ' — Rank ' + p.rank, '', p.name + ', locked until Bounty Rank ' + p.rank, 'opacity:0.5;');
  });
  var list = TRK_PREY.filter(function(p) { return tro[p.id]; }).map(function(p) { return p.trophy + ' ×' + tro[p.id]; });
  if (list.length) html += '<div style="font-family:\'Crimson Text\',serif;font-size:0.85rem;color:#aaa;margin-top:6px;">🏆 Trophies: ' + list.join(', ') + '</div>';
  html += '<div role="heading" aria-level="3" style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;letter-spacing:0.1em;margin:12px 0 4px;">🌙 RELAXING HUNT</div>';
  box.innerHTML = html;
}
function trkFree() {
  var rank = getCurrentRank().rank, pool = TRK_PREY.filter(function(p) { return !p.legendary && p.rank <= rank; });
  trkBegin(pool[Math.floor(Math.random() * pool.length)].id, false);
}
// Draw the list whenever the Hunting Grounds open, and hide it during a relaxing hunt.
(function() {
  var _load = loadHuntingGrounds;
  loadHuntingGrounds = function() { _load.apply(this, arguments); trkRender(); };
  var _start = startHunt;
  startHunt = function() { var r = _start.apply(this, arguments); trkRenderSection(); return r; };
  var _stop = stopHunt;
  stopHunt = function() { var r = _stop.apply(this, arguments); trkRenderSection(); return r; };
})();
