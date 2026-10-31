// ── TRANSLATE FUNCTION ──
// Main translation function — replaces translateText API calls
function t(text) {
  if (!_translationEnabled || _translationLang === 'en') return text;
  var langTable = T[_translationLang];
  if (!langTable) return text;
  return langTable[text] || text;
}

function applyFullUITranslation(lang) {
  var table = lang === 'pt-BR' ? T_PT : null;
  if (!table) return;
  // Find every element with data-i18n and replace its innerHTML with the translation
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (table[key] !== undefined) {
      el.innerHTML = table[key];
    }
  });
  translateAriaLabels(lang);
}


// ── UNIVERSAL TEXT TRANSLATION ──
// Walks every visible text node under `root` and swaps it for its T[lang]
// translation on an exact string match — same lookup table data-i18n and
// aria-labels already use. This is the piece that used to be missing: every
// screen's raw text (buttons, headings, paragraphs) was never routed through
// t()/data-i18n, so filling the dictionary alone did nothing for it. Combined
// with the MutationObserver below, ANY current or future screen — including
// content injected later by innerHTML — gets translated automatically the
// moment its strings exist in T[lang]. No more wiring each screen by hand.
function translateVisibleText(root) {
  if (!_translationEnabled || _translationLang === 'en') return;
  var langTable = T[_translationLang];
  if (!langTable) return;
  root = root || document.body;
  // BUGFIX: this function's own DOM writes (nodeValue/aria-label changes) are
  // themselves mutations. If the translation MutationObserver is active while
  // this runs, each write it makes gets queued and replayed back through the
  // observer's callback, which calls this function again on each mutated
  // node's parent, walking (and querySelectorAll-ing) that subtree again. On
  // a full document.body pass across every screen in this SPA that fans out
  // into thousands of redundant re-scans and pins the main thread for
  // minutes, presenting as a frozen/blank page. Disconnect while writing so
  // our own writes never re-enter the observer, then restore it after.
  var _obs = _translationObserver;
  if (_obs) _obs.disconnect();
  try {
    if (root.nodeType === 3) {
      var trimmed0 = root.nodeValue.trim();
      if (trimmed0 && langTable[trimmed0]) root.nodeValue = root.nodeValue.replace(trimmed0, langTable[trimmed0]);
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        var p = node.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      var trimmed = node.nodeValue.trim();
      if (!trimmed) continue;
      if (langTable[trimmed]) node.nodeValue = node.nodeValue.replace(trimmed, langTable[trimmed]);
    }
    if (root.nodeType === 1 && root.hasAttribute && root.hasAttribute('aria-label')) {
      var cur = root.getAttribute('aria-label');
      if (cur && langTable[cur]) root.setAttribute('aria-label', langTable[cur]);
    }
    if (root.querySelectorAll) {
      root.querySelectorAll('[aria-label]').forEach(function(el) {
        var current = el.getAttribute('aria-label');
        if (current && langTable[current]) el.setAttribute('aria-label', langTable[current]);
      });
    }
  } finally {
    if (_obs) _obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
}

var _translationObserver = null;
function startTranslationObserver() {
  if (_translationObserver) return;
  _translationObserver = new MutationObserver(function(mutations) {
    if (!_translationEnabled || _translationLang === 'en') return;
    mutations.forEach(function(m) {
      if (m.type === 'childList') {
        m.addedNodes.forEach(function(n) { translateVisibleText(n); });
      } else if (m.type === 'characterData' && m.target.parentNode) {
        translateVisibleText(m.target.parentNode);
      }
    });
  });
  _translationObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function translateAriaLabels(lang) {
  if (!lang || lang === 'en') return;
  var langTable = T[lang];
  if (!langTable) return;
  document.querySelectorAll('[aria-label]').forEach(function(el) {
    var current = el.getAttribute('aria-label');
    if (current && langTable[current]) {
      el.setAttribute('aria-label', langTable[current]);
    }
  });
}

// Translate and speak — replaces sayTranslated
function sayTranslated(msg) {
  var translated = t(msg);
  _saySR(translated);
  if (ACCESS && ACCESS.selfVoice && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(translated);
    u.lang = _translationLang === 'pt-BR' ? 'pt-BR' : 'en-US';
    u.rate = (ACCESS && ACCESS.selfVoiceRate) ? ACCESS.selfVoiceRate : 1.0;
    window.speechSynthesis.speak(u);
  }
}

// Stub for old translateText calls — now synchronous
function translateText(text) {
  return Promise.resolve(t(text));
}

// Old cache functions — kept as stubs so nothing breaks
var _translationCache = {};
function saveCacheToFirebase() {}
function loadCacheFromFirebase() { return Promise.resolve(); }

function setLanguage(lang) {
  _translationLang = lang;
  _translationEnabled = lang !== 'en';
  DDStore.setItem('dd_lang', lang);
  // Keep a copy in real localStorage so the early-boot translation script
  // (which runs synchronously before DDStore is ready) can read it.
  try { window.localStorage.setItem('dd_lang', lang); } catch(e) {}
  document.documentElement.lang = lang === 'pt-BR' ? 'pt' : 'en';
  document.querySelectorAll('#language-select').forEach(function(s){ s.value = lang; });

  if (lang === 'pt-BR') {
    // Direct inline translations — no dependencies
    var PT = {
      'btn-play':'Jogar','btn-bestiary':'Bestiário','btn-quests':'Missões',
      'btn-coinshop':'Loja de Moedas','btn-endless':'Descida Infinita',
      'btn-spire':'A Torre','btn-void':'Modo Vazio','btn-command':'Centro de Comando',
      'btn-graveyard':'O Cemitério','btn-obituary':'Obituário',
      'btn-challenges':'Desafios','btn-blacksmith':'Ferreiro',
      'btn-bossrush':'Assalto de Chefes','btn-tournament':'Torneio',
      'btn-chronicles':'Crônicas','btn-bounty':'Quadro de Recompensas',
      'btn-siege':'O Cerco','btn-whatsnew':'O Que Há de Novo',
      'btn-help':'Ajuda','btn-hallofrecords':'Salão dos Registros',
      'btn-highscore':'Pontuação Máxima','btn-events':'Eventos',
      'btn-credits':'Créditos','btn-raid':'Missão Diária',
      'btn-settings':'Configurações','btn-quit':'Sair',
      'game-subtitle':'Para o escuro. De novo.',
      'btn-leoaudio':'Leo Áudio Gaming',
      'screen-events-title':'Eventos Sazonais',
      'screen-events-sub':'Eventos especiais mudam a masmorra. Eventos ativos são aplicados automaticamente quando você joga.'
    };
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var k = el.getAttribute('data-i18n');
      if (PT[k]) el.textContent = PT[k];
    });
    translateAriaLabels('pt-BR');
    startTranslationObserver();
    translateVisibleText(document.body);
    say('Idioma alterado para Português.');
  } else {
    // Restore English using T_EN
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var k = el.getAttribute('data-i18n');
      if (T_EN[k]) el.textContent = T_EN[k];
    });
    say('Language changed to English.');
  }
  translateMenuText();
}

function loadSavedLanguage() {
  // Check URL param first, then localStorage
  var urlLang = new URLSearchParams(window.location.search).get('lang');
  var saved = urlLang || DDStore.getItem('dd_lang') || 'en';
  if (saved && saved !== 'en') {
    _translationLang = saved;
    _translationEnabled = true;
    DDStore.setItem('dd_lang', saved);
    // Update select element
    var sel = document.getElementById('language-select');
    if (sel) sel.value = saved;
    var sel2 = document.querySelectorAll('#language-select');
    sel2.forEach(function(s){ s.value = saved; });
    // Apply translations to DOM
    document.documentElement.lang = saved === 'pt-BR' ? 'pt' : 'en';
    startTranslationObserver();
    translateVisibleText(document.body);
    translateMenuText();
  }
}

function translateMenuText() {
  if (!_translationEnabled || _translationLang === 'en') return;
  var lang = _translationLang;

  // ── Apply data-i18n translations first (most reliable) ──
  applyFullUITranslation(lang);

  var langTable = T[lang];
  if (!langTable) return;

  document.querySelectorAll('[data-lang]').forEach(function(btn) {
    var key = btn.getAttribute('data-lang');
    var translation = (lang === 'pt-BR' && btn.getAttribute('data-pt'))
      ? btn.getAttribute('data-pt')
      : langTable[key];
    if (!translation) return;

    // Replace innerHTML entirely — keep only aria-hidden spans (emojis)
    // and replace text with translation
    var newHTML = btn.innerHTML.replace(
      /(?<=>)([^<]+)(?=\s*(?:<|$))/g,
      function(match) {
        var trimmed = match.trim();
        if (trimmed === key) {
          return match.replace(trimmed, translation);
        }
        return match;
      }
    );
    if (newHTML !== btn.innerHTML) {
      btn.innerHTML = newHTML;
    } else {
      // Fallback — just set the text after all spans
      btn.setAttribute('data-translated', translation);
    }

    // Translate aria-label
    if (btn.getAttribute('aria-label') && langTable[btn.getAttribute('aria-label')]) {
      btn.setAttribute('aria-label', langTable[btn.getAttribute('aria-label')]);
    }
  });

  document.querySelectorAll('.screen-title').forEach(function(el) {
    var text = el.textContent.trim();
    if (langTable[text]) el.textContent = langTable[text];
  });

  translateAriaLabels(lang);
}

//═════════════════
// v7.6 — USERNAME SYSTEM
//═════════════════

// ── TITLE TAG SYSTEM ──
// Players pick a pre-approved title tag that shows next to their auto-generated name.
// e.g. Leo#x7k · TheVoid   or   Ana#9mq · Slayer
// No free text = no inappropriate content possible.
var TITLE_TAGS = [
  'TheVoid', 'Slayer', 'Undying', 'Cursed', 'Shadow',
  'Ironclad', 'Ashen', 'Hollow', 'Forsaken', 'Eternal',
  'Crimson', 'Frost', 'Storm', 'Silent', 'Lost',
  'Ancient', 'Broken', 'Risen', 'Scarred', 'Phantom',
  'Ember', 'Dusk', 'Dawn', 'Warden', 'Exile',
  'Relic', 'Marked', 'Wanderer', 'Remnant', 'Sovereign'
];

// checkUsername() was called from submitUsername() below but never actually
// defined anywhere in the codebase — every username submission threw a
// ReferenceError immediately, before ever reaching saveUsername() (which
// only checks whether the name is already taken, not whether it's a
// reasonable name at all). The 20-character cap matches what the Firebase
// rules already enforce server-side for chat usernames.
function checkUsername(name) {
  if (!name || !name.trim()) return 'Enter a username.';
  name = name.trim();
  if (name.length < 3) return 'Username must be at least 3 characters.';
  if (name.length > 20) return 'Username must be 20 characters or fewer.';
  if (!/^[A-Za-z0-9_]+$/.test(name)) return 'Username can only contain letters, numbers, and underscores.';
  return null;
}

async function saveUsername(username) {
  var user = getFirebaseUser();
  if (!user || !window._fbDb) return false;
  try {
    // Check if username is taken
    var snap = await window._fbDb.collection('usernames').doc(username.toLowerCase()).get();
    if (snap.exists && snap.data().uid !== user.uid) return 'taken';
    // Save username
    await window._fbDb.collection('usernames').doc(username.toLowerCase()).set({ uid: user.uid, username: username });
    await window._fbDb.collection('users').doc(user.uid).set({ username: username, email: user.email, updatedAt: Date.now() }, { merge: true });
    DDStore.setItem('dd_username', username);
    return true;
  } catch(e) {
    console.error('saveUsername error:', e.code, e.message);
    // Common errors: permission-denied means Firestore rules blocking
    if (e.code === 'permission-denied') return 'permission-denied';
    return false;
  }
}

function getLocalUsername() {
  return DDStore.getItem('dd_username') || null;
}

function closeUsernamePrompt() {
  var ov = document.getElementById('ov-username');
  if (ov) ov.classList.remove('open');
}

async function submitUsername() {
  var inp = document.getElementById('username-input');
  var err = document.getElementById('username-error');
  var name = inp ? inp.value.trim() : '';
  var setErr = function(msg, col) { if (err) { err.textContent = msg; err.style.color = col || '#ff4444'; } };

  var validationError = checkUsername(name);
  if (validationError) { setErr(validationError); say(validationError); return; }

  setErr('Checking availability...', '#ffaa44');
  var result = await saveUsername(name);
  if (result === true) {
    setErr('Username set: ' + name, '#44ff88');
    say('Username set to ' + name + '. You are now on the leaderboard.');
    setTimeout(closeUsernamePrompt, 1500);
    // Update account UI
    var emailEl = document.getElementById('account-email-display');
    if (emailEl) emailEl.textContent = name + ' (' + (getFirebaseUser().email || '') + ')';
  } else if (result === 'taken') {
    setErr('That username is already taken. Try another.'); say('Username taken. Try another.');
  } else if (result === 'permission-denied') {
    var fbUserPerm = getFirebaseUser();
    if (fbUserPerm && !getLocalUsername()) {
      var permName = generateFallbackUsername(fbUserPerm);
      DDStore.setItem('dd_username', permName);
    }
    setErr('Permission denied. Using a temporary display name for now.', '#ff4444');
    say('Permission denied by server. A temporary display name has been set. Try again later.');
  } else {
    var fbUserFail = getFirebaseUser();
    if (fbUserFail && !getLocalUsername()) {
      var fallbackName = generateFallbackUsername(fbUserFail);
      DDStore.setItem('dd_username', fallbackName);
      setErr('Save failed. Using ' + fallbackName + ' for now.', '#ffaa44');
      say('Username save failed. Using ' + fallbackName + ' as your display name. Try again later.');
    } else {
      setErr('Could not save username. Check your connection.', '#ff4444');
      say('Could not save username. Check your internet connection.');
    }
  }
}

// Check on login if username is set
async function checkUsernameOnLogin() {
  var user = getFirebaseUser();
  if (!user) return;

  // Already have a username — verify against Firebase quietly
  var local = getLocalUsername();
  if (local) {
    if (window._fbDb) {
      window._fbDb.collection('users').doc(user.uid).get().then(function(snap) {
        if (snap.exists && snap.data && snap.data().username && snap.data().username !== local) {
          DDStore.setItem('dd_username', snap.data().username);
        }
      }).catch(function(){});
    }
    return;
  }

  // Try loading from Firebase first
  if (window._fbDb) {
    window._fbDb.collection('users').doc(user.uid).get().then(function(snap) {
      if (snap.exists && snap.data && snap.data().username) {
        DDStore.setItem('dd_username', snap.data().username);
        return;
      }
      // No username anywhere — auto-assign a title
      autoAssignTitle(user);
    }).catch(function() {
      autoAssignTitle(user);
    });
  } else {
    autoAssignTitle(user);
  }
}

function autoAssignTitle(user) {
  if (getLocalUsername()) return; // already set
  // Pick a random title from TITLE_TAGS
  var tag = TITLE_TAGS[Math.floor(Math.random() * TITLE_TAGS.length)];
  // Use first 3 chars of uid as unique suffix
  var uid = (user && user.uid) ? user.uid.slice(-4) : Math.floor(Math.random()*9000+1000).toString();
  // Store title separately
  DDStore.setItem('dd_title', tag);
  var firstName = getPlayerFirstName();
  var fullName = firstName + ' the ' + tag;
  DDStore.setItem('dd_username', fullName);
  if (window._fbDb && user) {
    window._fbDb.collection('users').doc(user.uid).set({ username: fullName, title: tag }, { merge: true })
      .catch(function(){});
  }
  say('Welcome. Your title is ' + fullName + '. Change it anytime in Account settings.');
}

//═════════════════
// FALLBACK USERNAME GENERATOR
//═════════════════
// If username save fails, builds a safe anonymous display name from email+uid.
// e.g. leonardo39137@gmail.com + uid ending "x7k" -> "Leo#x7k"
// Never shows full email on the leaderboard.
function generateFallbackUsername(user) {
  if (!user) return 'Adventurer';
  var email = user.email || '';
  var uid = user.uid || '';
  var local = email.split('@')[0] || '';
  var letters = local.replace(/[^a-zA-Z]/g, '');
  var prefix = letters.length >= 3
    ? letters.charAt(0).toUpperCase() + letters.slice(1, 3).toLowerCase()
    : letters.length > 0
      ? letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase()
      : 'Anon';
  var suffix = uid.length >= 3 ? uid.slice(-3) : uid;
  return prefix + '#' + suffix;
}

// Best display name: fallback from email+uid, never raw email
// Tag is stored separately and appended at display time
function getDisplayName(user) {
  if (!user) return 'Adventurer';
  var base = getLocalUsername() || generateFallbackUsername(user);
  return base;
}

// Full leaderboard display: "Leo#x7k · TheVoid" or just "Leo#x7k"
// BUGFIX: this used getTitleTag() (dd_title_tag), settable only through
// openTagPrompt()/submitTag() — neither ever had a button calling them, so
// the leaderboard tag could never actually be set by any player. Reuses
// getPlayerTitle() (dd_title) instead, the title from the already-live
// "🏷 Change Title" picker in Account — same TITLE_TAGS pool, one title
// system instead of two, and it's always settable right now.
function getLeaderboardName(user) {
  var base = getDisplayName(user);
  var tag = getPlayerTitle();
  return tag ? base + ' · ' + tag : base;
}

//═════════════════
// GLOBAL LEADERBOARD
//═════════════════

async function uploadToLeaderboard() {
  var user = getFirebaseUser();
  var btn = document.getElementById('hs-upload-btn');
  var setBtn = function(msg, col) { if (btn) { btn.textContent = msg; btn.style.color = col || '#aaa'; } };

  if (!user) {
    say('You need to sign in to upload your score. Go to Settings then Account.');
    setBtn('Sign in required', '#ff4444');
    return;
  }
  if (!window._fbDb) {
    say('Cloud not available. Check your connection.');
    setBtn('Cloud unavailable', '#ff4444');
    return;
  }

  var username = getLeaderboardName(user);
  var score = getScoreData();
  var total = score.total || 0;
  if (total === 0) { say('No score to upload yet. Play some runs first.'); return; }

  setBtn('⏳ Uploading...', '#ffaa44');
  say('Uploading your score of ' + total.toLocaleString() + ' points to the leaderboard.');

  try {
    await window._fbDb.collection('leaderboard').doc(user.uid).set({
      uid: user.uid,
      username: username,
      score: total,
      tag: getPlayerTitle() || '',
      updatedAt: Date.now(),
    });
    setBtn('✓ Uploaded!', '#44ff88');
    say('Score uploaded successfully. Check the leaderboard to see your rank.');
    setTimeout(function() { setBtn('☁ Upload to Leaderboard'); }, 3000);
    // Load leaderboard to show updated rank
    renderLeaderboardTab();
  } catch(e) {
    console.error('Upload error:', e);
    setBtn('✗ Upload failed', '#ff4444');
    say('Upload failed. Check your connection.');
  }
}

async function loadGlobalLeaderboard() {
  if (!window._fbDb) return [];
  try {
    var snap = await window._fbDb.collection('leaderboard')
      .orderBy('score', 'desc').limit(20).get();
    var results = [];
    snap.forEach(function(doc) { results.push(doc.data()); });
    return results;
  } catch(e) { console.error('Leaderboard load error:', e); return []; }
}

async function renderLeaderboardTab() {
  var el = document.getElementById('hs-leaderboard-list');
  if (!el) return;
  el.innerHTML = '<div style="color:#888;font-family:Cinzel,serif;font-size:0.7rem;text-align:center;padding:16px;">Loading leaderboard...</div>';
  say('Loading global leaderboard.');

  var scores = await loadGlobalLeaderboard();
  if (scores.length === 0) {
    el.innerHTML = '<div style="color:#555;font-family:Cinzel,serif;font-size:0.7rem;text-align:center;padding:16px;">No scores yet. Be the first to upload!</div>';
    say('No scores on the leaderboard yet. Be the first to upload.');
    return;
  }

  var user = getFirebaseUser();
  var myUid = user ? user.uid : null;
  var html = '';
  scores.forEach(function(s, i) {
    var isMe = s.uid === myUid;
    var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i+1);
    html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 4px;border-bottom:1px solid #1a1a1a;' + (isMe ? 'background:#0a1a0a;' : '') + '" tabindex="0" aria-label="' + (i+1) + ': ' + s.username + ' — ' + s.score + ' points' + (isMe ? ', this is you' : '') + '">' +
      '<span style="color:' + (i<3?['#ffdd44','#aaaaaa','#cc8844'][i]:'#666') + ';font-family:Cinzel,serif;font-size:0.75rem;">' + medal + ' ' + (s.username || 'Anonymous') + (isMe ? ' 👈' : '') + '</span>' +
      '<span style="color:#ffdd44;font-family:Cinzel,serif;font-size:0.75rem;">' + (s.score||0).toLocaleString() + ' pts</span>' +
    '</div>';
  });

  // Check my rank
  var myRank = scores.findIndex(function(s){ return s.uid === myUid; });
  if (myRank === -1 && myUid) {
    html += '<div style="color:#555;font-size:0.65rem;font-family:Cinzel,serif;text-align:center;padding:8px;">You are not on the leaderboard yet. Upload your score!</div>';
  }

  el.innerHTML = html;
  if (myRank >= 0) say('Leaderboard loaded. You are ranked ' + (myRank+1) + ' with ' + scores[myRank].score.toLocaleString() + ' points.');
  else say('Leaderboard loaded. ' + scores.length + ' players. Upload your score to appear here.');

  // Check weekly reward
  checkWeeklyReward(scores);
}

async function checkWeeklyReward(scores) {
  var user = getFirebaseUser();
  if (!user || !scores || scores.length === 0) return;
  if (scores[0].uid !== user.uid) return; // not #1
  // Check if already claimed this week
  var weekKey = 'weekly_reward_' + getWeekKey();
  var claimed = DDStore.getItem(weekKey);
  if (claimed) return;
  // Award 3 Mystery Coins
  DDStore.setItem(weekKey, '1');
  var raidSave = getRaidSave();
  addCoinsToWallet(3);
  saveRaidData(raidSave);
  setTimeout(function() {
    setEvent('good', '🥇 Weekly Champion! You are #1 on the leaderboard. +3 Mystery Coins awarded!');
    say('Weekly Champion! You are number 1 on the global leaderboard this week. 3 Mystery Coins have been added to your account.');
    showAchievementToast({ icon:'🥇', name:'Weekly Champion', desc:'+3 Mystery Coins for being #1 this week!' });
  }, 1000);
}

function getWeekKey() {
  var now = new Date();
  var startOfYear = new Date(now.getFullYear(), 0, 1);
  var week = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return now.getFullYear() + '_w' + week;
}

//═════════════════
// INBOX SYSTEM
//═════════════════

async function loadInbox() {
  var user = getFirebaseUser();
  var el = document.getElementById('hs-inbox-list');
  if (!el) return;

  if (!user) {
    el.innerHTML = '<div style="color:#555;font-family:Cinzel,serif;font-size:0.7rem;text-align:center;padding:16px;">Sign in to view your inbox.</div>';
    return;
  }
  if (!window._fbDb) {
    el.innerHTML = '<div style="color:#555;font-family:Cinzel,serif;font-size:0.7rem;text-align:center;padding:16px;">Cloud not available.</div>';
    return;
  }

  el.innerHTML = '<div style="color:#888;font-family:Cinzel,serif;font-size:0.7rem;text-align:center;padding:16px;">Loading inbox...</div>';

  try {
    var snap = await window._fbDb.collection('users').doc(user.uid)
      .collection('inbox').orderBy('createdAt', 'desc').limit(20).get();

    if (snap.empty) {
      el.innerHTML = '<div style="color:#555;font-family:Cinzel,serif;font-size:0.7rem;text-align:center;padding:16px;">Your inbox is empty.</div>';
      say('Inbox is empty.');
      return;
    }

    // (removed — replaced by DOM-based rendering below)
  } catch(e) {
    console.error('Inbox load error:', e);
    el.innerHTML = '<div style="color:#ff4444;font-size:0.7rem;font-family:Cinzel,serif;padding:16px;">Failed to load inbox.</div>';
  }
}

async function claimInboxMessage(msgId, coins) {
  var user = getFirebaseUser();
  if (!user || !window._fbDb) return;
  try {
    await window._fbDb.collection('users').doc(user.uid).collection('inbox').doc(msgId).update({ claimed: true, claimedAt: Date.now() });
    if (coins > 0) {
      addCoinsToWallet(coins);
      var raidSave = getRaidSave();
      saveRaidData(raidSave);
      setEvent('good', '🪙 ' + coins + ' Mystery Coins added to your account!');
      say(coins + ' Mystery Coins claimed and added to your account.');
    }
    // Refresh inbox
    loadInbox();
  } catch(e) { console.error('Claim error:', e); say('Could not claim. Try again.'); }
}

//═════════════════
// DEV — SEND COINS
//═════════════════

async function devSendCoins() {
  var emailEl = document.getElementById('dev-send-email');
  var coinsEl = document.getElementById('dev-send-coins');
  var msgEl = document.getElementById('dev-send-message');
  var statusEl = document.getElementById('dev-send-status');
  var email = emailEl ? emailEl.value.trim() : '';
  var coins = parseInt(coinsEl ? coinsEl.value : '0') || 0;
  var msg = msgEl ? msgEl.value.trim() : '';

  if (!email) { if (statusEl) statusEl.textContent = 'Enter player email.'; return; }
  if (coins < 1) { if (statusEl) statusEl.textContent = 'Enter coin amount.'; return; }
  if (!window._fbDb) { if (statusEl) statusEl.textContent = 'Cloud not available.'; return; }

  if (statusEl) { statusEl.textContent = '⏳ Looking up player...'; statusEl.style.color = '#ffaa44'; }

  try {
    // Find user by email
    var usersSnap = await window._fbDb.collection('users').where('email', '==', email).limit(1).get();
    if (usersSnap.empty) {
      // Try to find by checking if email matches current user (self-send for testing)
      var currentUser = getFirebaseUser();
      if (currentUser && currentUser.email === email) {
        // Send to self
        await window._fbDb.collection('users').doc(currentUser.uid).collection('inbox').add({
          from: 'Leo — Developer',
          message: msg || 'A gift from the developer of Dungeon Descent.',
          coins: coins,
          claimed: false,
          createdAt: Date.now(),
        });
        // Also make sure user doc exists
        await window._fbDb.collection('users').doc(currentUser.uid).set({ email: currentUser.email, updatedAt: Date.now() }, { merge: true });
        if (statusEl) { statusEl.textContent = '✓ Sent ' + coins + ' coins to yourself!'; statusEl.style.color = '#44ff88'; }
        say('Sent ' + coins + ' Mystery Coins to yourself.');
        if (emailEl) emailEl.value = '';
        if (coinsEl) coinsEl.value = '';
        if (msgEl) msgEl.value = '';
        return;
      }
      if (statusEl) { statusEl.textContent = 'Player not found. They may need to sign in first.'; statusEl.style.color = '#ff4444'; }
      return;
    }
    var targetUid = usersSnap.docs[0].id;
    var targetData = usersSnap.docs[0].data();
    var targetUsername = targetData.username || (targetData.email ? generateFallbackUsername({ email: targetData.email, uid: targetUid }) : 'Player');

    // Send inbox message
    await window._fbDb.collection('users').doc(targetUid).collection('inbox').add({
      from: 'Leo — Developer',
      message: msg || 'A gift from the developer of Dungeon Descent.',
      coins: coins,
      claimed: false,
      createdAt: Date.now(),
    });

    if (statusEl) { statusEl.textContent = '✓ Sent ' + coins + ' coins to ' + targetUsername + '!'; statusEl.style.color = '#44ff88'; }
    say('Sent ' + coins + ' Mystery Coins to ' + targetUsername + '.');
    // Clear fields
    if (emailEl) emailEl.value = '';
    if (coinsEl) coinsEl.value = '';
    if (msgEl) msgEl.value = '';
  } catch(e) {
    console.error('devSendCoins error:', e);
    if (statusEl) { statusEl.textContent = 'Error: ' + (e.message || 'unknown'); statusEl.style.color = '#ff4444'; }
  }
}

function switchHSTab(tab) {
  ['score','leaderboard','inbox'].forEach(function(t) {
    var btn = document.getElementById('hs-tab-' + t);
    var panel = document.getElementById('hs-panel-' + t);
    if (btn) btn.style.borderBottom = t === tab ? '2px solid #ffdd44' : '2px solid transparent';
    if (btn) btn.style.color = t === tab ? '#ffdd44' : '#666';
    if (panel) panel.style.display = t === tab ? '' : 'none';
  });
  if (tab === 'leaderboard') renderLeaderboardTab();
  if (tab === 'inbox') loadInbox();
  say(tab === 'score' ? 'Your score' : tab === 'leaderboard' ? 'Global leaderboard' : 'Inbox');
}

//═════════════════
// QUEST SYSTEM
//═════════════════
var DAILY_QUESTS = [
  { id:'dq-kills-5',     desc:'Defeat 5 enemies in a single run.',            type:'kills',    target:5,   reward:'50 gold', rewardGold:50 },
  { id:'dq-kills-10',    desc:'Defeat 10 enemies in a single run.',           type:'kills',    target:10,  reward:'100 gold', rewardGold:100 },
  { id:'dq-kills-20',    desc:'Defeat 20 enemies in a single run.',           type:'kills',    target:20,  reward:'150 gold + potion', rewardGold:150, rewardPotion:true },
  { id:'dq-floor-5',     desc:'Reach floor 5 without fleeing any combat.',   type:'floor',    target:5,   reward:'75 gold', rewardGold:75 },
  { id:'dq-floor-8',     desc:'Reach floor 8 in a single run.',              type:'floor',    target:8,   reward:'120 gold', rewardGold:120 },
  { id:'dq-loot-3',      desc:'Find 3 items in a single run.',               type:'loot',     target:3,   reward:'60 gold', rewardGold:60 },
  { id:'dq-loot-5',      desc:'Find 5 items in a single run.',               type:'loot',     target:5,   reward:'90 gold + potion', rewardGold:90, rewardPotion:true },
  { id:'dq-gold-50',     desc:'Collect 50 gold in a single run.',            type:'gold',     target:50,  reward:'60 gold', rewardGold:60 },
  { id:'dq-gold-100',    desc:'Collect 100 gold in a single run.',           type:'gold',     target:100, reward:'120 gold', rewardGold:120 },
  { id:'dq-gold-200',    desc:'Collect 200 gold in a single run.',           type:'gold',     target:200, reward:'200 gold', rewardGold:200 },
  { id:'dq-nopotion',    desc:'Reach floor 3 without using any potions.',    type:'nopotion', target:3,   reward:'80 gold + potion', rewardGold:80, rewardPotion:true },
  { id:'dq-crits-3',     desc:'Land 3 critical hits in a single run.',       type:'crits',    target:3,   reward:'70 gold', rewardGold:70 },
  { id:'dq-crits-5',     desc:'Land 5 critical hits in a single run.',       type:'crits',    target:5,   reward:'100 gold', rewardGold:100 },
  { id:'dq-boss',        desc:'Defeat the floor 10 boss in any dungeon.',    type:'boss',     target:1,   reward:'150 gold', rewardGold:150 },
  { id:'dq-elite',       desc:'Defeat an elite enemy.',                      type:'elite',    target:1,   reward:'100 gold + potion', rewardGold:100, rewardPotion:true },
  { id:'dq-spirit',      desc:'Complete a run with a rare spirit active.',   type:'rarespirit',target:1,  reward:'120 gold', rewardGold:120 },
  { id:'dq-hollow',      desc:'Complete a floor in The Hollow.',             type:'hollow',   target:1,   reward:'80 gold', rewardGold:80 },
  { id:'dq-sunken',      desc:'Find a lore fragment in the Sunken Archives.',type:'fragment', target:1,   reward:'75 gold', rewardGold:75 },
  { id:'dq-skills-3',    desc:'Use 3 different skills in a single run.',     type:'skilluse', target:3,   reward:'80 gold', rewardGold:80 },
  { id:'dq-survive',     desc:'Take damage but survive with 10 HP or less.', type:'survive',  target:1,   reward:'90 gold', rewardGold:90 },
  { id:'dq-kills-nodmg', desc:'Defeat 3 enemies without taking any damage.', type:'nodmg',    target:3,   reward:'100 gold', rewardGold:100 },
  { id:'dq-kills-30',    desc:'Defeat 30 enemies in a single run.',          type:'kills',    target:30,  reward:'220 gold + potion', rewardGold:220, rewardPotion:true },
  { id:'dq-floor-10',    desc:'Reach floor 10 in a single run.',             type:'floor',    target:10,  reward:'160 gold', rewardGold:160 },
  { id:'dq-gold-300',    desc:'Collect 300 gold in a single run.',           type:'gold',     target:300, reward:'250 gold', rewardGold:250 },
  { id:'dq-crits-8',     desc:'Land 8 critical hits in a single run.',       type:'crits',    target:8,   reward:'150 gold', rewardGold:150 },
  { id:'dq-loot-8',      desc:'Find 8 items in a single run.',               type:'loot',     target:8,   reward:'140 gold + potion', rewardGold:140, rewardPotion:true },
];

var ACHIEVEMENTS = [
  { gold:50, trophies:1, id:'ach-first-blood', gpId:'CgkI0uiuoZcDEAIQAQ', gcId:'DD_FIRST_BLOOD', name:'First Blood',    icon:'🗡️', desc:'Blood has been drawn. The dungeon takes notice.',              hint:'Defeat 1 enemy.', check:function(s){return s.totalKills>=1;}        },
  { gold:50, trophies:1, id:'ach-dungeon-1', gpId:'CgkI0uiuoZcDEAIQAg', gcId:'DD_DUNGEON_1',   name:'Descender',      icon:'🏰', desc:'You went in. You came back out. Most do not.',           hint:'Complete 1 dungeon run.', check:function(s){return s.dungeonsComplete>=1;}  },
  { gold:150, trophies:3, id:'ach-ironblood', gpId:'CgkI0uiuoZcDEAIQAw', gcId:'DD_IRONBLOOD',   name:'Iron Will',      icon:'🩸', desc:'You bled for every floor. The dungeon respected that.',       hint:'Win a run on Ironblood difficulty.', check:function(s){return s.ironbloodWins>=1;}     },
  { gold:150, trophies:3, id:'ach-condemned', gpId:'CgkI0uiuoZcDEAIQBA', gcId:'DD_CONDEMNED',   name:'Condemned',      icon:'🔴', desc:'Condemned by name. Victorious by choice.',       hint:'Win a run on Condemned difficulty.', check:function(s){return s.condemnedWins>=1;}     },
  { gold:400, trophies:7, id:'ach-forsaken', gpId:'CgkI0uiuoZcDEAIQBQ', gcId:'DD_FORSAKEN',    name:'The Forsaken',   icon:'💀', desc:'Abandoned by fate. Not by will.',        hint:'Win a run on Forsaken difficulty.', check:function(s){return s.forsakenWins>=1;}      },
  { gold:50, trophies:1, id:'ach-raids-1', gpId:'CgkI0uiuoZcDEAIQBg', gcId:'DD_RAIDS_1',     name:'Raider',         icon:'⚔️', desc:'The call came. You answered.',        hint:'Complete 1 Daily Raid.', check:function(s){return s.raidsComplete>=1;}     },
  { gold:150, trophies:3, id:'ach-raids-5', gpId:'CgkI0uiuoZcDEAIQBw', gcId:'DD_RAIDS_5',     name:'Veteran Raider', icon:'🏆', desc:'Five raids. Five returns. That is not luck — that is skill.',               hint:'Complete 5 Daily Raids.', check:function(s){return s.raidsComplete>=5;}     },
  { gold:50, trophies:1, id:'ach-level-5', gpId:'CgkI0uiuoZcDEAIQCA', gcId:'DD_LEVEL_5',     name:'Battle-Hardened',icon:'⬆', desc:'Halfway to legend. Keep climbing.',        hint:'Reach character level 5.', check:function(s){return s.maxLevel>=5;}          },
  { gold:150, trophies:3, id:'ach-level-10', gpId:'CgkI0uiuoZcDEAIQHQ', gcId:'DD_LEVEL_10',    name:'Legendary',      icon:'👑', desc:'Maximum power reached. The dungeon fears what you have become.',       hint:'Reach character level 10 (max).', check:function(s){return s.maxLevel>=10;}         },
  { gold:50, trophies:1, id:'ach-kills-50', gpId:'CgkI0uiuoZcDEAIQHw', gcId:'DD_KILLS_50',    name:'Reaper',         icon:'🌑', desc:'Fifty lives ended by your hand. The dungeon counts every one.',hint:'Defeat 50 enemies total, across all runs.', check:function(s){return s.totalKills>=50;}     },
  { gold:150, trophies:3, id:'ach-kills-100', gpId:'CgkI0uiuoZcDEAIQXQ', gcId:'DD_KILLS_100',   name:'Harbinger',      icon:'☠️', desc:'One hundred. The dungeon stopped keeping count. You did not.',             hint:'Defeat 100 enemies total, across all runs.', check:function(s){return s.totalKills>=100;}      },
  { gold:150, trophies:3, id:'ach-skills', gpId:'CgkI0uiuoZcDEAIQRg', gcId:'DD_SKILLS',      name:'Skill Master',   icon:'✨', desc:'Five skills mastered in a single descent. You are no ordinary adventurer.',    hint:'Unlock all 5 skills in a single descent.', check:function(s){return s.allSkillsUnlocked;}    },
  { gold:150, trophies:3, id:'ach-ashbound', gpId:'CgkI0uiuoZcDEAIQSw', gcId:'DD_ASHBOUND',    name:'Ashen Victor',   icon:'🔥', desc:'You walked through ash and came out the other side. Scarred but standing.',         hint:'Complete The Ashbound Wastes.', check:function(s){return s.ashboundComplete>=1;}  },
  { gold:150, trophies:3, id:'ach-boss-all', gpId:'CgkI0uiuoZcDEAIQKQ', gcId:'DD_BOSS_ALL',    name:'Boss Hunter',    icon:'🎯', desc:'Three bosses. Three battles. Three victories. They will not be forgotten.',            hint:'Defeat 3 different dungeon bosses.', check:function(s){return s.uniqueBossKills>=3;}   },
  { gold:150, trophies:3, id:'ach-frosthold', gpId:'CgkI0uiuoZcDEAIQCw', gcId:'DD_FROSTHOLD',   name:'Cold Victor',    icon:'❄️', desc:'The cold tried to stop you. It failed.',           hint:'Complete Frosthold Abyss.', check:function(s){return s.frostholdComplete>=1;} },
  { gold:400, trophies:7, id:'ach-trilogy', gpId:'CgkI0uiuoZcDEAIQSg', gcId:'DD_TRILOGY',     name:'The Descent',    icon:'🏆', desc:'Seven trials. Seven victories. The dungeon calls you master.',              hint:'Complete 5 dungeon runs total.', check:function(s){return s.dungeonsComplete>=5;}  },
  { gold:150, trophies:3, id:'ach-nightmare', gpId:'CgkI0uiuoZcDEAIQFw', gcId:'DD_NIGHTMARE',   name:'Nightmare Slayer',icon:'🟣', desc:'Nightmare difficulty. You did not wake up — you won.',    hint:'Win a run on Nightmare difficulty.', check:function(s){return s.nightmareWins>=1;}     },
  { gold:400, trophies:7, id:'ach-nightmare-all', gpId:'CgkI0uiuoZcDEAIQSQ', gcId:'DD_NIGHTMARE_ALL',name:'Beyond Fear',   icon:'⬛', desc:'Three nightmares faced. None survived.',           hint:'Defeat 3 bosses on Nightmare difficulty.', check:function(s){return s.nightmareBossKills>=3;}},
  { gold:400, trophies:7, id:'ach-bossrush', gpId:'CgkI0uiuoZcDEAIQXg', gcId:'DD_BOSSRUSH',    name:'Boss Rush Legend',icon:'👑', desc:'Nine bosses. One run. Zero mercy.',         hint:'Clear all 9 bosses in Boss Rush mode in one run.', check:function(s){return s.bossRushComplete;}    },
  { gold:150, trophies:3, id:'ach-sunken', gpId:'CgkI0uiuoZcDEAIQPg', gcId:'DD_SUNKEN',      name:'Archivist',       icon:'📚', desc:'The archives held secrets older than memory. Now they are yours.',               hint:'Complete The Sunken Archives.', check:function(s){ return (s.sunkenComplete||0)>=1; } },
  { gold:150, trophies:3, id:'ach-hollow', gpId:'CgkI0uiuoZcDEAIQDQ', gcId:'DD_HOLLOW',      name:'The Hollow',      icon:'🕯️', desc:'The hollow was empty of everything except danger. You filled it with victory.',                       hint:'Complete The Hollow.', check:function(s){ return (s.hollowComplete||0)>=1; } },
  { gold:400, trophies:7, id:'ach-dddi-boss', gpId:'CgkI0uiuoZcDEAIQRA', gcId:'DD_DDDI_BOSS',   name:'Non-Compliant',   icon:'⚖️', desc:'Non-compliant. Victorious. The DDDI will not recover from this.',     hint:'Defeat the DDDI boss.', check:function(s){ return (s.dddiDefeated||0)>=1; } },
  { gold:50, trophies:1, id:'ach-julio', gpId:'CgkI0uiuoZcDEAIQUQ', gcId:'DD_JULIO',       name:'You Found Him',   icon:'❓', desc:'You found him. He was not supposed to be found.',             hint:'Find Julio.', check:function(s){ return (s.julioFound||0)>=1; } },
  { gold:50, trophies:1, id:'ach-elite-kill', gpId:'CgkI0uiuoZcDEAIQYw', gcId:'DD_ELITE_KILL',  name:'Elite Slayer',    icon:'★',  desc:'Elite enemies exist to end runs. This one ended yours instead.',             hint:'Defeat 1 elite enemy.', check:function(s){ return (s.eliteKills||0)>=1; } },
  { gold:150, trophies:3, id:'ach-elite-5', gpId:'CgkI0uiuoZcDEAIQKw', gcId:'DD_ELITE_5',     name:'Elite Hunter',    icon:'🏹', desc:'Five elite kills. You are becoming something the dungeon respects.',                    hint:'Defeat 5 elite enemies.', check:function(s){ return (s.eliteKills||0)>=5; } },
  { gold:50, trophies:1, id:'ach-spirit-earn', gpId:'CgkI0uiuoZcDEAIQUA', gcId:'DD_SPIRIT_EARN', name:'Spirit Bound',    icon:'✨', desc:'A spirit chose you. That does not happen by accident.',      hint:'Earn 1 spirit companion.', check:function(s){ return (s.spiritsEarned||0)>=1; } },
  { gold:50, trophies:1, id:'ach-familiar-2', name:'First Bond',       icon:'🐦‍⬛', desc:'A small companion has decided you are worth staying for.', hint:'Reach Bond Level 2 with your familiar.', check:function(s){ return (s.familiarBondLevel||0)>=2; } },
  { gold:150, trophies:3, id:'ach-familiar-10', name:'The Loyal',       icon:'✨', desc:'Every fight, every search, every room — it was there for all of it.', hint:'Reach Bond Level 10 with your familiar.', check:function(s){ return (s.familiarBondLevel||0)>=10; } },
  { gold:400, trophies:7, id:'ach-familiar-20', name:'The Inseparable', icon:'🐈‍⬛', desc:'You cannot remember a run without it anymore. It cannot either.', hint:'Reach Bond Level 20 with your familiar.', check:function(s){ return (s.familiarBondLevel||0)>=20; } },
  { gold:150, trophies:3, id:'ach-ngplus', gpId:'CgkI0uiuoZcDEAIQPw', gcId:'DD_NGPLUS',      name:'Returning',       icon:'🔄', desc:'You finished the dungeon. Then you went back. That says everything.',              hint:'Complete a New Game+ run.', check:function(s){ return (s.ngPlusComplete||0)>=1; } },
  { gold:400, trophies:7, id:'ach-ngplus3', gpId:'CgkI0uiuoZcDEAIQIQ', gcId:'DD_NGPLUS3',     name:'Unreasonable',    icon:'💀', desc:'Three times over. The dungeon gave up trying to stop you.',                   hint:'Complete New Game+ three times on the same character.', check:function(s){ return (s.ngPlusMaxCount||0)>=3; } },
  { gold:150, trophies:3, id:'ach-lore-reader', gpId:'CgkI0uiuoZcDEAIQUg', gcId:'DD_LORE_READER', name:'Lore Keeper',     icon:'📖', desc:'Five stories read. The dungeon has more history than it admits.',                   hint:'Read 5 story fragments.', check:function(s){ return (s.storiesRead||0)>=5; } },
  { gold:250, trophies:2, id:'ach-found-julio', gpId:'CgkI0uiuoZcDEAIQLg', gcId:'DD_FOUND_JULIO',    name:'Found Him',         icon:'🏷️', desc:'Every fragment recovered. The full truth of Julio is finally yours.',       hint:'Recover every fragment of Julio\'s full story.', check:function(s){ return (s.julioStoryUnlocked||0)>=1; } },
  { gold:250, trophies:2, id:'ach-medusa-mercy', gpId:'CgkI0uiuoZcDEAIQOw', gcId:'DD_MEDUSA_MERCY',   name:'Lower the Shield',   icon:'🐍', desc:'You lowered the shield. Most would not have.',                          hint:'Choose to lower the shield in the Medusa encounter.', check:function(s){ return (s.medusaMercy||0)>=1; } },
  { gold:250, trophies:2, id:'ach-medusa-found', gpId:'CgkI0uiuoZcDEAIQKg', gcId:'DD_MEDUSA_FOUND',   name:'Found',              icon:'💚', desc:'Against all odds, they found each other again. You made that possible.',               hint:'Complete the Medusa reunion outcome.', check:function(s){ return (s.medusaReunion||0)>=1; } },
  { gold:250, trophies:2, id:'ach-medusa-lost', gpId:'CgkI0uiuoZcDEAIQQg', gcId:'DD_MEDUSA_LOST',    name:'She Still Looks',    icon:'😢', desc:'She still looks for him. That is on you.', hint:'Complete the Medusa encounter where she keeps searching.', check:function(s){ return (s.medusaStillLooks||0)>=1; } },
  { gold:150, trophies:3, id:'ach-tournament-win', gpId:'CgkI0uiuoZcDEAIQRw', gcId:'DD_TOURNAMENT_WIN',   name:'Champion',        icon:'🏆', desc:'The tournament had one rule — survive. You did more than that.',              hint:'Win a Tournament match.', check:function(s){ return (s.tournamentWins||0)>=1; } },
  { gold:400, trophies:7, id:'ach-tournament-top', gpId:'CgkI0uiuoZcDEAIQEw', gcId:'DD_TOURNAMENT_TOP',   name:'Top of the Board', icon:'🥇', desc:'Top three in the entire tournament. Your name belongs there.', hint:'Finish top 3 in a Tournament season.', check:function(s){ return (s.tournamentTop3||0)>=1; } },
  { gold:250, trophies:5, id:'ach-witness', gpId:'CgkI0uiuoZcDEAIQNw', gcId:'DD_WITNESS',         name:'The Witnessed',       icon:'🦈', desc:'Something ancient watched you and decided you were worthy. Few are.', hint:'Get noticed by the Witness (Abyssal Deep).', check: function(s){ return s.witnessFound; } },
  { gold:400, trophies:7, id:'ach-abyssal-boss', gpId:'CgkI0uiuoZcDEAIQMw', gcId:'DD_ABYSSAL_BOSS',    name:'Depth Conqueror',     icon:'🌊', desc:'The deepest creature in the deepest dungeon. Yours now.', hint:'Defeat the Abyssal Deep boss (The Leviathan).', check: function(s){ return s.abyssalBossDefeated; } },
  { gold:400, trophies:7, id:'ach-void-reaper', gpId:'CgkI0uiuoZcDEAIQZA', gcId:'DD_VOID_REAPER',     name:'Void Slayer',      icon:'🌑', desc:'The Void Reaper was supposed to be unkillable. You did not know that.',                    hint:'Defeat the Void Reaper.', check:function(s){ return (s.voidReaperDefeated||0)>=1; } },
  { gold:250, trophies:2, id:'ach-void-survivor', gpId:'CgkI0uiuoZcDEAIQHg', gcId:'DD_VOID_SURVIVOR',   name:'Still Standing',   icon:'💜', desc:'You faced the Void Reaper and walked away. That alone is remarkable.', hint:'Defeat the Void Reaper, or survive an attempt against it.', check:function(s){ return (s.voidReaperDefeated||0)>=1 || (s.voidAttempts||0)>=1; } },
  { gold:150, trophies:3, id:'ach-alchemist',        name:'The Alchemist',    icon:'🧪', desc:'Ten elixirs consumed. You have learned the old recipes.',      hint:'Drink 10 elixirs total.', check:function(s){ return (s.elixirsUsed||0)>=10; } },
  { gold:50, trophies:1, id:'ach-riddle-correct', gpId:'CgkI0uiuoZcDEAIQKA', gcId:'DD_RIDDLE_CORRECT',  name:'The Riddled',      icon:'❓', desc:'Brains and brawn. The dungeon did not expect both.',           hint:'Answer 1 riddle correctly.', check:function(s){ return (s.riddlesCorrect||0)>=1; } },
  { gold:50, trophies:1, id:'ach-riddle-wrong', gpId:'CgkI0uiuoZcDEAIQVQ', gcId:'DD_RIDDLE_WRONG',    name:'Wrong Answer',     icon:'💥', desc:'Wrong answer. Right result. Sometimes force is the solution.',  hint:'Answer a riddle wrong, then still defeat that boss.', check:function(s){ return (s.riddlesWrong||0)>=1 && (s.bossDefeated||0)>=1; } },
  { gold:150, trophies:3, id:'ach-timer-beaten', gpId:'CgkI0uiuoZcDEAIQVA', gcId:'DD_TIMER_BEATEN',    name:'Beat The Clock',   icon:'⏱',  desc:'Against the clock and winning. That is pressure. That is you.', hint:'Beat a timed boss fight before the clock runs out.', check:function(s){ return (s.bossTimerBeaten||0)>=1; } },
  { gold:150, trophies:3, id:'ach-boss-enrage', gpId:'CgkI0uiuoZcDEAIQFA', gcId:'DD_BOSS_ENRAGE',     name:'Took Too Long',    icon:'⚠️', desc:'The boss got angrier. You got a trophy. Fair trade.',                 hint:'Let a boss reach its enrage phase and still win.', check:function(s){ return (s.bossEnrages||0)>=1; } },
  { gold:150, trophies:3, id:'ach-formal-warning', gpId:'CgkI0uiuoZcDEAIQIw', gcId:'DD_FORMAL_WARNING', name:'Formally Warned',  icon:'⚖️', desc:'You read the warning. Compliance was never an option.',   hint:'Read the "Formal Warning" story fragment.', check:function(s){ return (s['storyRead_formal-warning']||0)>=1; } },
  { gold:150, trophies:3, id:'ach-first-descent', gpId:'CgkI0uiuoZcDEAIQMQ', gcId:'DD_FIRST_DESCENT', name:'Origin Seeker',    icon:'🏔️', desc:'The first dungeon existed long before you. Now you know why.',                   hint:'Read the "First Descent" story fragment.', check:function(s){ return (s['storyRead_first-descent']||0)>=1; } },
  { gold:150, trophies:3, id:'ach-real-story', gpId:'CgkI0uiuoZcDEAIQFg', gcId:'DD_REAL_STORY',    name:'The Real Story',   icon:'🏷️', desc:'The real story. Behind the game. Behind everything.',           hint:'Read the "Real Story" story fragment.', check:function(s){ return (s['storyRead_real-story']||0)>=1; } },
  { gold:400, trophies:7, id:'ach-all-stories', gpId:'CgkI0uiuoZcDEAIQTw', gcId:'DD_ALL_STORIES', gpId:'CgkI0uiuoZcDEAIQTw', name:'The Archivist',   icon:'📜', desc:'Every story. Every secret. The dungeon has no more to hide from you.',          hint:'Read all 18 story fragments.', check:function(s){ return (s.storiesRead||0)>=18; } },
  { gold:150, trophies:3, id:'ach-lullaby', gpId:'CgkI0uiuoZcDEAIQTQ', gcId:'DD_LULLABY',     name:'Lullaby',         icon:'😢', desc:'In the middle of a dungeon you stopped to help a child. That matters.',    hint:'Soothe the sleeping child in The Hollow.', check:function(s){ return (s.wepingChildSoothed||0)>=1; } },
  { gold:400, trophies:7, id:'ach-all-dungeons', gpId:'CgkI0uiuoZcDEAIQJw', gcId:'DD_ALL_DUNGEONS',name:'All Floors',      icon:'🗺️', desc:'Seven trials completed. The dungeon bows to no one — except you.',              hint:'Complete Crypt of Malachar, The Ashbound Wastes, Frosthold Abyss, The Sunken Archives, and The Hollow.', check:function(s){ return (s.cryptComplete||0)>=1&&(s.ashboundComplete||0)>=1&&(s.frostholdComplete||0)>=1&&(s.sunkenComplete||0)>=1&&(s.hollowComplete||0)>=1; } },
  { gold:150, trophies:3, id:'ach-reunion', gpId:'CgkI0uiuoZcDEAIQGA', gcId:'DD_REUNION',     name:'Rest Now',        icon:'🕯️', desc:'Two souls found each other because of you. Rest now.',hint:'Reunite the Weeping Mother with her child.', check:function(s){ return (s.motherReunion||0)>=1; } },
  { gold:150, trophies:3, id:'ach-twin-killed', gpId:'CgkI0uiuoZcDEAIQPQ', gcId:'DD_TWIN_KILLED', name:'Mirror Broken',   icon:'👤', desc:'The mirror is broken. Whatever it showed — it cannot haunt you now.',                          hint:'Defeat your Mirror Twin.', check:function(s){ return (s.twinKilled||0)>=1; } },
  { gold:150, trophies:3, id:'ach-music-box', gpId:'CgkI0uiuoZcDEAIQXw', gcId:'DD_MUSIC_BOX',   name:'The Last Note',   icon:'🎵', desc:'The last note played. You were still standing when it did.',                    hint:'Defeat the Music Box enemy.', check:function(s){ return (s.musicBoxDefeated||0)>=1; } },
  { gold:400, trophies:7, id:'ach-kills-1000', gpId:'CgkI0uiuoZcDEAIQMg', gcId:'DD_KILLS_1000',  name:'One Thousand',    icon:'💀', desc:'One thousand lives ended. The dungeon has run out of things to throw at you.',                hint:'Defeat 1,000 enemies total.', check:function(s){ return (s.totalKills||0)>=1000; } },
  { gold:150, trophies:3, id:'ach-kills-500', gpId:'CgkI0uiuoZcDEAIQTA', gcId:'DD_KILLS_500',   name:'Five Hundred',    icon:'⚔️', desc:'Five hundred. Half a thousand. The dungeon is running low on volunteers.',                hint:'Defeat 500 enemies total.', check:function(s){ return (s.totalKills||0)>=500; } },
  { gold:150, trophies:3, id:'ach-hollow-50', gpId:'CgkI0uiuoZcDEAIQNQ', gcId:'DD_HOLLOW_50',   name:'Haunted',         icon:'👻', desc:'Fifty Hollow Shades. The Hollow is quieter now.',           hint:'Defeat 50 Hollow Shades.', check:function(s){ return (s.hollowShadeKills||0)>=50; } },
  { gold:50, trophies:1, id:'ach-floor-9', gpId:'CgkI0uiuoZcDEAIQGQ', gcId:'DD_FLOOR_9',     name:'The Penultimate', icon:'9️⃣', desc:'One floor away from the boss. The dungeon holds its breath.',            hint:'Reach floor 9 in a single run.', check:function(s){ return (s.maxFloorReached||0)>=9; } },
  { gold:50, trophies:1, id:'ach-no-damage', gpId:'CgkI0uiuoZcDEAIQNg', gcId:'DD_NO_DAMAGE',   name:'Untouched',       icon:'🛡️', desc:'Perfect. Not a scratch. The enemies never stood a chance.',  hint:'Clear a floor without taking any damage.', check:function(s){ return (s.noDmgFloors||0)>=1; } },
  { gold:150, trophies:3, id:'ach-gold-1000', gpId:'CgkI0uiuoZcDEAIQPA', gcId:'DD_GOLD_1000',   name:'The Merchant',    icon:'💰', desc:'One thousand gold in a single run. The dungeon paid well today.',       hint:'Earn 1,000 gold in a single run.', check:function(s){ return (s.bestGoldRun||0)>=1000; } },
  { gold:400, trophies:7, id:'ach-all-spirits', gpId:'CgkI0uiuoZcDEAIQaA', gcId:'DD_ALL_SPIRITS', name:'Spirit Master',   icon:'✨', desc:'All eight spirits. They chose you because there was no one else worthy.',       hint:'Earn all 8 spirit companions.', check:function(s){ return (s.spiritsEarned||0)>=8; } },
  { gold:150, trophies:3, id:'ach-daily-7', gpId:'CgkI0uiuoZcDEAIQDg', gcId:'DD_DAILY_7',     name:'Dedicated',       icon:'☀️', desc:'Seven days of dedication. The dungeon noticed you coming back.',                 hint:'Complete 7 Daily Quests.', check:function(s){ return (s.dailyQuestsComplete||0)>=7; } },
  { gold:400, trophies:7, id:'ach-weeping-both', gpId:'CgkI0uiuoZcDEAIQLw', gcId:'DD_WEEPING_BOTH',name:'Family',          icon:'👨‍👩‍👦', desc:'Both done. A family whole again. The dungeon will remember this kindness.', hint:'Both soothe the child AND reunite the Weeping Mother (can be different runs).', check:function(s){ return (s.wepingChildSoothed||0)>=1&&(s.motherReunion||0)>=1; } },
  { gold:400, trophies:7, id:'ach-all-quests', gpId:'CgkI0uiuoZcDEAIQWg', gcId:'DD_ALL_QUESTS',  name:'The Completionist',icon:'🏆',desc:'Thirty daily quests. You are more committed to this dungeon than anyone.',               hint:'Complete 30 Daily Quests.', check:function(s){ return (s.dailyQuestsComplete||0)>=30; } },
  { gold:400, trophies:7, id:'gauntlet_champion', gpId:'CgkI0uiuoZcDEAIQQQ', gcId:'DD_GAUNTLET_CHAMPION', name:'Gauntlet Champion', icon:'⚔️', desc:'Six dungeons. One life. Zero deaths. The Gauntlet has never seen anything like you.', hint:'Clear the Gauntlet (all 6 dungeons back-to-back, one life, no deaths).', check:function(s){ return (s.gauntletClears||0)>=1; } },
  { gold:50, trophies:1, id:'ach-daily-dungeon', gpId:'CgkI0uiuoZcDEAIQEg', gcId:'DD_DAILY_DUNGEON', name:'Daily Challenger',  icon:'📅', desc:'The daily challenge answered. Come back tomorrow. The dungeon will be waiting.',   hint:'Clear 1 Daily Dungeon Challenge.', check:function(s){ return (s.dailyDungeonClears||0)>=1; } },
  { gold:400, trophies:7, id:'ach-infernal-trial', gpId:'CgkI0uiuoZcDEAIQGg', gcId:'DD_INFERNAL_TRIAL', name:'Trial by Void',    icon:'🔥', desc:'The trial was designed to break you. You passed anyway.', hint:'Win the Trial by Void in The Infernal Descent.', check:function(s){ return (s.infernalTrialWon||0)>=1; } },
  { gold:400, trophies:7, id:'ach-infernal-riddles', gpId:'CgkI0uiuoZcDEAIQRQ', gcId:'DD_INFERNAL_RIDDLES', name:'Keeper of Secrets', icon:'🔍', desc:'Five hidden riddles solved. The dungeon did not think anyone would find them all.', hint:'Solve all 5 hidden riddles in The Infernal Descent.', check:function(s){ return (s.infernalRiddlesSolved||0)>=1; } },
  { gold:400, trophies:7, id:'ach-void-conqueror', gpId:'CgkI0uiuoZcDEAIQLA', gcId:'DD_VOID_CONQUEROR', gpId:'CgkI0uiuoZcDEAIQLA', name:'Void Conqueror', icon:'🌑', desc:'Five void waves. Five victories. The void has nothing left to offer.', hint:'Win 5 Void waves.', check:function(s){ return (s.voidConqueror||0)>=1; } },
  { gold:400, trophies:7, id:'ach-enemy-creator', gpId:'CgkI0uiuoZcDEAIQYA', gcId:'DD_ENEMY_CREATOR', name:'World Builder', icon:'⚗️', desc:'You built something and gave it to the world. That is what creators do.', hint:'Create and submit a custom enemy.', check:function(s){ return (s.enemyCreated||0)>=1; } },
  { gold:200, trophies:5, id:'ach-deep-miner', gpId:'CgkI0uiuoZcDEAIQbw', gcId:'DD_DEEP_MINER', name:'Deep Miner', icon:'⛏️', desc:'Depth 50 in the Mine. You did not just descend — you carved your own path through the rock.', hint:'Reach depth 50 in the Mine.', check:function(s){ return (s.mineMaxDepth||0)>=50; } },
  { gold:150, trophies:3, id:'ach-spirit-forger', gpId:'CgkI0uiuoZcDEAIQbA', gcId:'DD_SPIRIT_FORGER', name:'Spirit Forger', icon:'🔮', desc:'You looked at raw soul fragments and saw something worth building. Then you built it.', hint:'Build 1 custom spirit from soul fragments.', check:function(s){ return (s.customSpiritBuilt||0)>=1; } },
  { gold:50, trophies:1, id:'ach-first-sale', gpId:'CgkI0uiuoZcDEAIQGw', gcId:'DD_FIRST_SALE', name:'First Sale', icon:'💰', desc:'First sale made. The Blacksmith nods approvingly.', hint:'Sell 1 item to the Blacksmith.', check:function(){ return parseInt(DDStore.getItem('dd_total_sells')||'0')>=1; } },
  { gold:50, trophies:1, id:'ach-merchant', gpId:'CgkI0uiuoZcDEAIQIg', gcId:'DD_MERCHANT', name:'Merchant', icon:'🏪', desc:'Five sales. The Blacksmith is starting to recognize you.', hint:'Sell 5 items to the Blacksmith.', check:function(){ return parseInt(DDStore.getItem('dd_total_sells')||'0')>=5; } },
  { gold:150, trophies:3, id:'ach-black-market', gpId:'CgkI0uiuoZcDEAIQUw', gcId:'DD_BLACK_MARKET', name:'Black Market', icon:'🖤', desc:'Twenty items sold. You are practically running the place.', hint:'Sell 20 items to the Blacksmith.', check:function(){ return parseInt(DDStore.getItem('dd_total_sells')||'0')>=20; } },
  { gold:50, trophies:1, id:'ach-gold-hoarder', gpId:'CgkI0uiuoZcDEAIQVg', gcId:'DD_GOLD_HOARDER', name:'Gold Hoarder', icon:'💛', desc:'Three hundred gold in hand. The weight of it feels good.', hint:'Hold 300 gold at once.', check:function(){ return getGlobalGold()>=300; } },
  { gold:150, trophies:3, id:'ach-big-spender', gpId:'CgkI0uiuoZcDEAIQJg', gcId:'DD_BIG_SPENDER', name:'Big Spender', icon:'💸', desc:'Six hundred gold spent. The Blacksmith has a new favorite customer.', hint:'Spend 600 gold total at the Blacksmith.', check:function(){ return parseInt(DDStore.getItem('dd_total_gold_spent')||'0')>=600; } },
  { gold:400, trophies:7, id:'ach-whale', gpId:'CgkI0uiuoZcDEAIQYQ', gcId:'DD_WHALE', name:'Whale', icon:'🐋', desc:'Seven thousand gold. The Blacksmith built a second floor just for you.', hint:'Spend 7,000 gold total at the Blacksmith.', check:function(){ return parseInt(DDStore.getItem('dd_total_gold_spent')||'0')>=7000; } },
  { gold:150, trophies:3, id:'ach-gold-rich', gpId:'CgkI0uiuoZcDEAIQDw', gcId:'DD_GOLD_RICH', name:'Gold Baron', icon:'👑', desc:'One thousand gold. Enough to buy your way out of almost anything.', hint:'Hold 1,000 gold at once.', check:function(){ return getGlobalGold()>=1000; } },

  // ── NEW DUNGEON COMPLETIONS ──
  { gold:150, trophies:3, id:'ach-whisper', gpId:'CgkI0uiuoZcDEAIQTQ', gcId:'DD_WHISPER',      name:'Forest Walker',     icon:'🌲', desc:'The forest whispered warnings the entire way. You ignored every one.',         hint:'Complete The Whispering Forest.', check:function(s){ return (s.whisperComplete||0)>=1; } },
  { gold:400, trophies:7, id:'ach-infernal', gpId:'CgkI0uiuoZcDEAIQGg', gcId:'DD_INFERNAL',     name:'Infernal Survivor', icon:'🔥', desc:'The infernal descent tried to break your spirit. It miscalculated.',          hint:'Complete The Infernal Descent.', check:function(s){ return (s.infernalComplete||0)>=1; } },
  { gold:400, trophies:7, id:'ach-chaos', gpId:'CgkI0uiuoZcDEAIQRQ', gcId:'DD_CHAOS',         name:'Chaos Accepted',    icon:'🌀', desc:'You found the code. The dungeon was never meant to be played this way. Good.', hint:'Enter the secret Chaos Mode code.', check:function(){ return DDStore.getItem('dd_chaos_mode')==='1'; } },
  { gold:400, trophies:7, id:'ach-abyssal', gpId:'CgkI0uiuoZcDEAIQaQ', gcId:'DD_ABYSSAL',      name:'Into the Deep',     icon:'🌊', desc:'The deepest dungeon cleared. Whatever lives in the deep knows your name now.',             hint:'Complete The Abyssal Deep.', check:function(s){ return (s.abyssalComplete||0)>=1; } },
  { gold:400, trophies:7, id:'ach-all-8', gpId:'CgkI0uiuoZcDEAIQEQ', gcId:'DD_ALL_8',        name:'The True Descent',  icon:'🗺️', desc:'All eight dungeons conquered. You are the Dungeon Master. This title is permanent.',               hint:'Complete all 8 dungeons: Crypt of Malachar, The Ashbound Wastes, Frosthold Abyss, The Sunken Archives, The Hollow, The Whispering Forest, The Infernal Descent, and The Abyssal Deep.', check:function(s){ return (s.cryptComplete||0)>=1&&(s.ashboundComplete||0)>=1&&(s.frostholdComplete||0)>=1&&(s.sunkenComplete||0)>=1&&(s.hollowComplete||0)>=1&&(s.whisperComplete||0)>=1&&(s.infernalComplete||0)>=1&&(s.abyssalComplete||0)>=1; } },

  // ── SPIRE ──
  { gold:150, trophies:3, id:'ach-spire-100', gpId:'CgkI0uiuoZcDEAIQCg', gcId:'DD_SPIRE_100',    name:'Tower Climber',     icon:'🗼', desc:'One hundred floors up. The ground is far below. Keep going.',          hint:'Reach floor 100 in The Spire.', check:function(s){ return (s.spireBestFloor||0)>=100 || (getSpireSave()&&getSpireSave().bestFloor||0)>=100; } },
  { gold:150, trophies:3, id:'ach-spire-300', gpId:'CgkI0uiuoZcDEAIQSA', gcId:'DD_SPIRE_300',    name:'The Ascent',        icon:'🗼', desc:'Three hundred floors. Most adventurers stop long before this.',          hint:'Reach floor 300 in The Spire.', check:function(s){ return (s.spireBestFloor||0)>=300 || (getSpireSave()&&getSpireSave().bestFloor||0)>=300; } },
  { gold:400, trophies:7, id:'ach-spire-500', gpId:'CgkI0uiuoZcDEAIQQA', gcId:'DD_SPIRE_500',    name:'Halfway There',     icon:'🗼', desc:'Halfway up The Spire. The air is thin. Your will is not.',          hint:'Reach floor 500 in The Spire.', check:function(s){ return (s.spireBestFloor||0)>=500 || (getSpireSave()&&getSpireSave().bestFloor||0)>=500; } },
  { gold:400, trophies:7, id:'ach-spire-1000', gpId:'CgkI0uiuoZcDEAIQJQ', gcId:'DD_SPIRE_1000',   name:'The Thousand',      icon:'🗼', desc:'Floor one thousand. The Spire did not think anyone would make it this far.',         hint:'Reach floor 1,000 in The Spire.', check:function(s){ return (s.spireBestFloor||0)>=1000 || (getSpireSave()&&getSpireSave().bestFloor||0)>=1000; } },
  { gold:400, trophies:7, id:'ach-spire-1800', gpId:'CgkI0uiuoZcDEAIQVw', gcId:'DD_SPIRE_1800',   name:'The Time Eater',    icon:'⏳', desc:'The Time Eater consumed centuries. You consumed The Time Eater.',   hint:'Defeat the Time Eater in The Spire.', check:function(s){ return (s.timeEaterDefeated||0)>=1; } },

  // ── MINION SYSTEM ──
  { gold:50,  trophies:1, id:'ach-first-minion', gpId:'CgkI0uiuoZcDEAIQWA', gcId:'DD_FIRST_MINION', name:'Collector',         icon:'👾', desc:'Your first captured soul. It will serve you well — willingly or not.', hint:'Capture 1 minion with a Soul Trap.', check:function(){ return _jsonParseSafe(DDStore.getItem('dd_minions'), '[]').length>=1; } },
  { gold:150, trophies:3, id:'ach-five-minions', gpId:'CgkI0uiuoZcDEAIQLQ', gcId:'DD_FIVE_MINIONS', name:'Army of One',       icon:'👾', desc:'Five souls bound to your will. The dungeon calls this an army.',           hint:'Capture 5 minions.', check:function(){ return _jsonParseSafe(DDStore.getItem('dd_minions'), '[]').length>=5; } },
  { gold:400, trophies:7, id:'ach-eight-minions', gpId:'CgkI0uiuoZcDEAIQOg', gcId:'DD_EIGHT_MINIONS',name:'The Menagerie',     icon:'👾', desc:'Eight minions. A full menagerie of captured dungeon creatures. Impressive.',               hint:'Capture 8 minions.', check:function(){ return _jsonParseSafe(DDStore.getItem('dd_minions'), '[]').length>=8; } },

  // ── WEAPON FORGE ──
  { gold:50,  trophies:1, id:'ach-first-forge', gpId:'CgkI0uiuoZcDEAIQYg', gcId:'DD_FIRST_FORGE',  name:'The Forger',        icon:'🔨', desc:'Your first creation. The Forge recognizes a new craftsman.',  hint:'Forge 1 weapon at the Blacksmith.', check:function(){ return parseInt(DDStore.getItem('dd_forge_count')||'0')>=1; } },
  { gold:150, trophies:3, id:'ach-five-forge', gpId:'CgkI0uiuoZcDEAIQXA', gcId:'DD_FIVE_FORGE',   name:'Master Forger',     icon:'🔨', desc:'Five weapons forged. Your hands know the work now.',          hint:'Forge 5 weapons.', check:function(){ return parseInt(DDStore.getItem('dd_forge_count')||'0')>=5; } },

  // ── RUNS AND PROGRESSION ──
  { gold:150, trophies:3, id:'ach-dungeons-10', gpId:'CgkI0uiuoZcDEAIQDA', gcId:'DD_DUNGEONS_10',  name:'Seasoned',          icon:'⚔️', desc:'Ten complete runs. The dungeon has started expecting you.',        hint:'Complete 10 dungeon runs total.', check:function(s){ return (s.dungeonsComplete||0)>=10; } },
  { gold:400, trophies:7, id:'ach-dungeons-25', gpId:'CgkI0uiuoZcDEAIQWQ', gcId:'DD_DUNGEONS_25',  name:'Veteran',           icon:'⚔️', desc:'Twenty-five runs. You have spent more time in dungeons than most spend alive.',        hint:'Complete 25 dungeon runs total.', check:function(s){ return (s.dungeonsComplete||0)>=25; } },
  { gold:50,  trophies:1, id:'ach-first-death', gpId:'CgkI0uiuoZcDEAIQIA', gcId:'DD_FIRST_DEATH',  name:'Lesson Learned',    icon:'💀', desc:'Your first death. Learn from it. The dungeon already has.',                hint:'Die once.', check:function(s){ return (s.totalDeaths||0)>=1; } },
  { gold:150, trophies:3, id:'ach-deaths-10', gpId:'CgkI0uiuoZcDEAIQOQ', gcId:'DD_DEATHS_10',    name:'Death Wish',        icon:'💀', desc:'Ten deaths and still here. What you lack in survival you make up for in stubbornness.',                    hint:'Die 10 times total.', check:function(s){ return (s.totalDeaths||0)>=10; } },
  { gold:400, trophies:7, id:'ach-flawless', gpId:'CgkI0uiuoZcDEAIQTg', gcId:'DD_FLAWLESS',     name:'Flawless',          icon:'🛡️', desc:'Not a single death. The dungeon never found an opening. Perfect.', hint:'Complete a full run without dying.', check:function(s){ return (s.flawlessRuns||0)>=1; } },
  { gold:400, trophies:7, id:'ach-speedrun', gpId:'CgkI0uiuoZcDEAIQNA', gcId:'DD_SPEEDRUN',     name:'Speed Runner',      icon:'⚡', desc:'Ten minutes. The dungeon barely had time to react before you were gone.',hint:'Complete a run in under 10 minutes.', check:function(s){ return (s.speedRuns||0)>=1; } },

  // ── CLASS/VARIETY ──
  { gold:150, trophies:3, id:'ach-classes-5', gpId:'CgkI0uiuoZcDEAIQZQ', gcId:'DD_CLASSES_5',    name:'Shapeshifter',      icon:'🎭', desc:'Five different classes. You adapt. The dungeon cannot predict you.', hint:'Win a run with 5 different classes.', check:function(s){ return (s.uniqueClassesWon||0)>=5; } },
  { gold:400, trophies:7, id:'ach-classes-all', gpId:'CgkI0uiuoZcDEAIQZg', gcId:'DD_CLASSES_ALL',  name:'Master of All',     icon:'🎭', desc:'Ten classes mastered. There is no version of this dungeon you cannot handle.', hint:'Win a run with 10 different classes.', check:function(s){ return (s.uniqueClassesWon||0)>=10; } },

  // ── KILLS MILESTONES ──
  { gold:400, trophies:7, id:'ach-kills-2500', gpId:'CgkI0uiuoZcDEAIQWw',   name:'The Unstoppable',   icon:'⚔️', desc:'Two thousand five hundred. At this point the dungeon is recycling enemies.',             hint:'Defeat 2,500 enemies total.', check:function(s){ return (s.totalKills||0)>=2500; } },
  { gold:400, trophies:7, id:'ach-kills-5000', gpId:'CgkI0uiuoZcDEAIQWw',   name:'Extinction Event',  icon:'☠️', desc:'Five thousand enemies defeated. You are not a player anymore. You are a force of nature.',             hint:'Defeat 5,000 enemies total.', check:function(s){ return (s.totalKills||0)>=5000; } },

  // ── TROPHIES MILESTONE ──
  { gold:400, trophies:5, id:'ach-trophies-50', gpId:'CgkI0uiuoZcDEAIQOA',  name:'Trophy Hunter',     icon:'🏆', desc:'Fifty trophies earned. The shelf is filling up.',                      hint:'Earn 50 trophies total.', check:function(){ return getTrophies()>=50; } },
  { gold:400, trophies:5, id:'ach-trophies-100', gpId:'CgkI0uiuoZcDEAIQEA', name:'The Collector',     icon:'🏆', desc:'One hundred trophies. The dungeon runs out of ways to challenge you.',                     hint:'Earn 100 trophies total.', check:function(){ return getTrophies()>=100; } },
  { gold:400, trophies:5, id:'ach-trophies-200', gpId:'CgkI0uiuoZcDEAIQHA', name:'Legend',            icon:'🏆', desc:'Two hundred trophies. A collection that speaks for itself.',                     hint:'Earn 200 trophies total.', check:function(){ return getTrophies()>=200; } },

  // ── FLOOR 10 ACHIEVEMENT ──
  { gold:200, trophies:4, id:'ach-echoes-of-void', gpId:'CgkI0uiuoZcDEAIQZw', name:'Echoes of the Void', icon:'🌑', desc:'The darkness remembers you.', hint:'Reach floor 10 in a single run.', check:function(s){ return (s.maxFloorReached||0)>=10; } },

  // ── VOID CHILD QUESTLINE ──
  { gold:100, trophies:5,  id:'ach-phase4-reached', gpId:'CgkI0uiuoZcDEAIQFQ',   name:'Into The Abyss',    icon:'🌊', desc:'You reached Phase 4 of The Leviathan. The abyss has awakened.', hint:'Reach Phase 4 of The Leviathan fight.', check: function(s){ return s.phase4Reached; } },
  { gold:150, trophies:7,  id:'ach-rhythm-win', gpId:'CgkI0uiuoZcDEAIQJA',       name:'In Perfect Time',   icon:'🎵', desc:'You answered the call of the abyss. The rhythm was yours.', hint:'Win the rhythm sequence in the Leviathan fight.', check: function(s){ return s.rhythmWon; } },
  { gold:300, trophies:7,  id:'ach-abyss-blinked', gpId:'CgkI0uiuoZcDEAIQQw',    name:'The Abyss Blinked', icon:'🐉', desc:'The Leviathan fell. It had never fallen before. It will not forget.', hint:'Defeat The Leviathan.', check: function(s){ return s.abyssalBossDefeated; } },
  { gold:500, trophies:10, id:'ach-deeper-than-deep', gpId:'CgkI0uiuoZcDEAIQMA',  name:'Deeper Than Deep',  icon:'💀', desc:'You defeated The Leviathan in Hardcore Mode. The abyss will not forget you.', hint:'Defeat The Leviathan on Hardcore Mode.', check: function(s){ return s.abyssalHardcoreWin; } },
  { gold:500, trophies:10, id:'ach-void-child-complete', gpId:'CgkI0uiuoZcDEAIQCQ', name:'What She Was'    , icon:'👁️', desc:'Collected all 25 Void Fragments. The truth is in the library now.', hint:'Collect all 25 Void Fragments.', check:function(){ return parseInt(DDStore.getItem('dd_void_fragments')||'0')>=25; } },
];

function getAchievementStats() {
  return _jsonParseSafe(DDStore.getItem('dd_ach_stats'), '{}');
}
function saveAchievementStats(s) { try { DDStore.setItem('dd_ach_stats', JSON.stringify(s)); } catch(e) { console.warn('[DD] saveAchievementStats failed:', e); } }
function getUnlockedAchievements() { try { return _jsonParseSafe(DDStore.getItem('dd_achievements'), '[]'); } catch(e) { return []; } }
function saveUnlockedAchievements(a) { try { DDStore.setItem('dd_achievements', JSON.stringify(a)); } catch(e) { console.warn('[DD] saveUnlockedAchievements failed:', e); } }

function getTrophies() { return parseInt(DDStore.getItem('dd_trophies') || '0'); }
function addTrophies(n) { DDStore.setItem('dd_trophies', getTrophies() + n); }

function awardAchievement(id) {
  var unlocked = getUnlockedAchievements();
  if (unlocked.indexOf(id) !== -1) return;
  var ach = ACHIEVEMENTS.find(function(a){ return a.id === id; });
  if (!ach) return;
  unlocked.push(id);
  saveUnlockedAchievements(unlocked);
  awardScore('achievements', 250);
  // Award gold and trophies
  var gold = ach.gold || 50;
  var trophies = ach.trophies || 1;
  addGlobalGold(gold);
  addTrophies(trophies);
  playAchievementUnlockSound(ach);
  showAchievementPopup(ach, gold, trophies);
  updateTrophyDisplay();
  // ── Game Center (iOS) / Google Play Games (Android) unlock ──
  // BUGFIX: this always sent ach.gpId (a Google Play-format ID like
  // "CgkI0uiuoZcDEAIQAQ") to the plugin regardless of platform. On iOS,
  // capacitor-game-connect routes that straight to real Game Center, which
  // only recognizes the vendorIdentifier set up in App Store Connect (e.g.
  // "DD_FIRST_BLOOD") — a Google-format ID there just silently fails.
  // Achievements now carry both gpId and gcId, and the correct one is
  // picked per platform.
  var isIOSPlatform = window.Capacitor && typeof Capacitor.getPlatform === 'function' && Capacitor.getPlatform() === 'ios';
  var platformAchId = isIOSPlatform ? ach.gcId : ach.gpId;
  if (platformAchId) {
    try {
      var gpPlugin = (window.Capacitor && Capacitor.Plugins) ?
        (Capacitor.Plugins.GameConnect || Capacitor.Plugins.CapacitorGameConnect) : null;
      if (gpPlugin) {
        gpPlugin.unlockAchievement({ achievementID: platformAchId })
          .catch(function(e){ console.warn('[DD] Game Center/GPG achievement failed:', e); });
      } else {
        console.warn('[DD] GameConnect plugin not found. Available plugins:', window.Capacitor ? Object.keys(Capacitor.Plugins) : 'no Capacitor');
      }
    } catch(e) { console.warn('[DD] Game Center/GPG achievement error:', e); }
  }
}

// Retroactive trophy + gold check — runs on game load
function retroactiveAchievementRewards() {
  var rewarded = _jsonParseSafe(DDStore.getItem('dd_ach_rewarded'), '[]');
  var unlocked = getUnlockedAchievements();
  var totalGold = 0; var totalTrophies = 0;
  unlocked.forEach(function(id) {
    if (rewarded.indexOf(id) !== -1) return;
    var ach = ACHIEVEMENTS.find(function(a){ return a.id === id; });
    if (!ach) return;
    totalGold += (ach.gold || 50);
    totalTrophies += (ach.trophies || 1);
    rewarded.push(id);
  });
  if (totalGold > 0 || totalTrophies > 0) {
    addGlobalGold(totalGold);
    addTrophies(totalTrophies);
    DDStore.setItem('dd_ach_rewarded', JSON.stringify(rewarded));
    setTimeout(function() {
      showToast('🏆 Achievement rewards claimed! +' + totalGold + 'g · +' + totalTrophies + ' trophies', 'gold');
    }, 2000);
  }
  updateTrophyDisplay();
}

// ── TROPHY ROOM — 3D SHOWCASE ──
// A static, slowly-rotating display case: one pedestal per achievement,
// glowing and colored by trophy tier when unlocked, dim and dark when not.
// Purely a visual add-on next to the existing accessible text list above —
// gated the same way every other 3D visual in the game is (isBetaOn
// '3dmode'), since it's for sighted players/friends, not a replacement for
// the say() summary and text list blind players already rely on. Rebuilt
// fresh and fully disposed on every open/close (this overlay opens rarely
// enough that persisting a scene across opens isn't worth the complexity,
// and a fresh build always reflects newly-unlocked achievements correctly).
var _trophy3D = { THREE: null, scene: null, camera: null, renderer: null, raf: null, group: null };
function _trophy3DWantsVisual() {
  return typeof isBetaOn === 'function' && isBetaOn('3dmode');
}
function initTrophy3DView() {
  var wrap = document.getElementById('trophy-3d-view');
  if (!wrap) return;
  if (!_trophy3DWantsVisual()) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  _load3DEngine().then(function(THREE) {
    if (!_trophy3DWantsVisual()) return; // player may have backed out before load finished
    _buildTrophy3DScene(THREE);
    _startTrophy3DLoop();
  }).catch(function(e) { console.warn('[DD] Trophy room visual failed:', e); wrap.style.display = 'none'; });
}
function _buildTrophy3DScene(THREE) {
  _trophy3D.THREE = THREE;
  var wrap = document.getElementById('trophy-3d-view');
  var w = wrap.clientWidth || 300, h = wrap.clientHeight || 190;
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0806);
  scene.fog = new THREE.FogExp2(0x0a0806, 0.05);
  var camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 50);
  camera.position.set(0, 3.4, 8.5);
  camera.lookAt(0, 1, 0);
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  wrap.innerHTML = '';
  wrap.appendChild(renderer.domElement);
  _trophy3D.scene = scene; _trophy3D.camera = camera; _trophy3D.renderer = renderer;

  scene.add(new THREE.AmbientLight(0x554433, 1.1));
  var point = new THREE.PointLight(0xffcc88, 1.4, 30);
  point.position.set(0, 6, 4);
  scene.add(point);

  var group = new THREE.Group();
  scene.add(group);
  _trophy3D.group = group;

  var unlockedSet = {};
  getUnlockedAchievements().forEach(function(id) { unlockedSet[id] = true; });

  var cols = Math.max(1, Math.ceil(Math.sqrt(ACHIEVEMENTS.length)));
  var rows = Math.ceil(ACHIEVEMENTS.length / cols);
  var spacing = 1.15;
  var startX = -((cols - 1) * spacing) / 2;

  ACHIEVEMENTS.forEach(function(ach, i) {
    var col = i % cols, row = Math.floor(i / cols);
    var x = startX + col * spacing;
    var z = -row * spacing;
    var isUnlocked = !!unlockedSet[ach.id];
    var tier = ach.trophies || 1;
    var color = tier >= 7 ? 0xffcc33 : tier >= 3 ? 0xccccdd : 0xcc8855;

    var base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.26, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: isUnlocked ? 0x333333 : 0x181818, roughness: 0.85 })
    );
    base.position.set(x, 0.17, z);
    group.add(base);

    var orbMat = isUnlocked
      ? new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.6, roughness: 0.3 })
      : new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.9 });
    var orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0), orbMat);
    orb.position.set(x, 0.5, z);
    group.add(orb);
  });

  // Recenter the group in depth so the whole grid sits in front of the camera
  group.position.z = (rows - 1) * spacing / 2;
}
function _startTrophy3DLoop() {
  if (_trophy3D.raf || !_trophy3D.renderer) return;
  var clock = new _trophy3D.THREE.Clock();
  function loop() {
    _trophy3D.raf = requestAnimationFrame(loop);
    var dt = clock.getDelta();
    if (_trophy3D.group) _trophy3D.group.rotation.y += dt * 0.25;
    _trophy3D.renderer.render(_trophy3D.scene, _trophy3D.camera);
  }
  loop();
}
function _teardownTrophy3D() {
  if (_trophy3D.raf) { cancelAnimationFrame(_trophy3D.raf); _trophy3D.raf = null; }
  if (_trophy3D.renderer) {
    try { _trophy3D.renderer.dispose(); _trophy3D.renderer.forceContextLoss(); } catch (e) {}
  }
  var wrap = document.getElementById('trophy-3d-view');
  if (wrap) wrap.innerHTML = '';
  _trophy3D.scene = null; _trophy3D.camera = null; _trophy3D.renderer = null; _trophy3D.group = null;
}

function openTrophyOverlay() {
  var ov = document.getElementById('ov-trophies');
  if (!ov) return;
  ov.style.display = 'flex';
  initTrophy3DView();
  var total = getTrophies();
  var countEl = document.getElementById('trophy-count-display');
  if (countEl) countEl.textContent = total;
  var unlocked = getUnlockedAchievements();
  var listEl = document.getElementById('trophy-ach-list');
  if (listEl) {
    if (unlocked.length === 0) {
      listEl.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.68rem;color:#444;text-align:center;padding:20px;">No achievements yet. Start playing!</div>';
    } else {
      listEl.innerHTML = unlocked.map(function(id) {
        var ach = ACHIEVEMENTS.find(function(a){ return a.id === id; });
        if (!ach) return '';
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#080808;border:1px solid #222;">' +
          '<span style="font-size:1.2rem;" aria-hidden="true">' + (ach.icon||'🏆') + '</span>' +
          '<div style="flex:1;">' +
            '<div style="font-family:Cinzel,serif;font-size:0.68rem;color:#cc9944;">' + ach.name + '</div>' +
            '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#555;">' + (ach.desc||'') + '</div>' +
          '</div>' +
          '<span style="font-family:Cinzel,serif;font-size:0.62rem;color:#887700;">+' + (ach.trophies||1) + ' 🏆</span>' +
        '</div>';
      }).join('');
    }
  }
  say('Trophies. You have ' + total + ' trophies. ' + unlocked.length + ' achievements unlocked.');
  setTimeout(function(){ var btn = ov.querySelector('button'); if(btn) btn.focus(); }, 100);
}

function closeTrophyOverlay() {
  var ov = document.getElementById('ov-trophies');
  if (ov) ov.style.display = 'none';
  _teardownTrophy3D();
}

function updateTrophyDisplay() {
  var el = document.getElementById('menu-trophy-count');
  if (el) el.textContent = '🏆 ' + getTrophies();
}

// ── FAMILIAR ──
// A small companion that bonds with you across every run — persisted
// account-wide via DDStore, like trophies, not per-character or per-run.
// Bond grows from kills, searches, and clears; leveling up plays its own
// distinct chime (unpanned — a personal cue, not a spatial one). Kept
// deliberately flavor-only (occasional lines, a level-up moment) with no
// stat effect, so it can't destabilize combat balance, and its speech is
// low-probability and delayed so it never talks over the room's own
// description or a combat-critical announcement.
//
// Deliberately stays out of the existing Companion Guide's (Mira's) lane —
// she already reacts to death, hunter proximity, achievements, and level
// ups (see getGuideDialogue/companionOnHunterClose/companionOnLoot). The
// Familiar only covers things she doesn't: low sanity, recognizing Julio
// and the Void Reaper by name specifically (not just "boss encounter"),
// and its own bond growth.
var FAMILIAR_SPECIES = [
  { id: 'raven', label: 'Raven', name: 'your Raven', icon: '🐦‍⬛', unlock: 'Defeat the Void Reaper', unlocked: function(s){ return (s.voidReaperDefeated||0) >= 1; }, lines: [
    'The raven circles once, then settles on your shoulder.',
    'A low caw. The raven has seen this corridor before.',
    'The raven ruffles its feathers, watching the dark ahead.',
    'It tilts its head at you, waiting.'
  ], deepLines: [
    'The raven no longer waits for a command. It just knows.',
    'It leans into you when you stop moving. Just for a moment.'
  ] },
  { id: 'wisp', label: 'Will-o’-Wisp', name: 'your Will-o’-Wisp', icon: '✨', unlock: 'Clear every dungeon at least once', unlocked: function(s){ return (s.abyssalComplete||0) >= 1; }, lines: [
    'The wisp drifts closer, casting a faint blue light.',
    'A soft glow pulses beside you — the wisp is calm here.',
    'The wisp flickers, as if remembering something.',
    'It bobs gently at your side, lighting nothing in particular.'
  ], deepLines: [
    'The wisp glows brighter now, without you asking it to.',
    'It stopped flickering nervously a while ago. It trusts this now.'
  ] },
  { id: 'imp', label: 'Imp', name: 'your Imp', icon: '👺', unlock: 'Earn 100 trophies', unlocked: function(s){ return getTrophies() >= 100; }, lines: [
    'The imp cackles quietly, poking at a crack in the wall.',
    'It tugs at your sleeve, pointing at nothing you can see.',
    'The imp mutters something in a language you don’t know.',
    'It grins up at you, clearly pleased with itself.'
  ], deepLines: [
    'The imp’s grin has softened into something almost fond.',
    'It still causes trouble. Just less of it, lately.'
  ] },
  { id: 'cat', label: 'Spectral Cat', name: 'your Spectral Cat', icon: '🐈‍⬛', unlock: 'Reach Bond Level 10 with your current familiar', unlocked: function(s){ return (s.familiarBondLevel||0) >= 10; }, lines: [
    'The cat pads silently ahead, then stops to look back at you.',
    'It sits, tail flicking, ears turned toward the dark.',
    'The cat rubs against your leg without making a sound.',
    'It watches something you can’t see. Then loses interest.'
  ], deepLines: [
    'The cat sleeps closer to you now than it ever used to.',
    'It doesn’t flinch at the dark anymore. Not with you here.'
  ] }
];
var FAMILIAR_TITLES = [
  { level: 20, title: 'the Inseparable' },
  { level: 10, title: 'the Loyal' },
  { level: 5,  title: 'the Bonded' }
];
function familiarTitle(level) {
  for (var i = 0; i < FAMILIAR_TITLES.length; i++) {
    if (level >= FAMILIAR_TITLES[i].level) return FAMILIAR_TITLES[i].title;
  }
  return '';
}
// Visual evolution — same three tiers as FAMILIAR_TITLES (5/10/20), but
// giving them an actual on-screen payoff instead of just a text label.
// A badge next to the icon everywhere it's shown, and a glow that
// intensifies in the big familiar overlay specifically.
var FAMILIAR_EVOLUTION_BADGES = ['', '✦', '✧', '★'];
function familiarEvolutionStage(level) {
  if (level >= 20) return 3;
  if (level >= 10) return 2;
  if (level >= 5) return 1;
  return 0;
}
function familiarEvolutionBadge(level) {
  return FAMILIAR_EVOLUTION_BADGES[familiarEvolutionStage(level)];
}
function familiarGlowStyle(level) {
  var stage = familiarEvolutionStage(level);
  var glows = ['none', '0 0 6px #ffdd44aa', '0 0 10px #ffdd44dd, 0 0 4px #fff8', '0 0 16px #ffdd44ff, 0 0 8px #fff, 0 0 2px #fff'];
  return glows[stage];
}
function _familiarSpecies(f) {
  return FAMILIAR_SPECIES.find(function(s) { return s.id === f.speciesId; }) || FAMILIAR_SPECIES[0];
}
function _familiarDisplayName(f) {
  if (f.name && f.name.trim()) return f.name.trim();
  return _familiarSpecies(f).name;
}
function getFamiliar() {
  var f = _jsonParseSafe(DDStore.getItem('dd_familiar'), 'null');
  if (!f || !f.speciesId) {
    var species = FAMILIAR_SPECIES[Math.floor(Math.random() * FAMILIAR_SPECIES.length)];
    f = { speciesId: species.id, startingSpeciesId: species.id, bond: 0, name: '' };
    saveFamiliar(f);
  }
  if (!f.startingSpeciesId) f.startingSpeciesId = f.speciesId; // migrate familiars saved before this field existed
  return f;
}
function saveFamiliar(f) { try { DDStore.setItem('dd_familiar', JSON.stringify(f)); } catch(e) { console.warn('[DD] saveFamiliar failed:', e); } }
function familiarBondLevel(bond) { return Math.floor(bond / 30) + 1; }
// A species is unlocked if it's the one you originally started with, or
// its real milestone condition is met — checked live against existing
// trophy/achievement stats, nothing new to track for the unlock itself.
function getUnlockedFamiliarSpecies(f) {
  var stats = getAchievementStats();
  return FAMILIAR_SPECIES.filter(function(sp) {
    return sp.id === f.startingSpeciesId || sp.unlocked(stats);
  });
}
function selectFamiliarSpecies(speciesId) {
  var f = getFamiliar();
  var unlocked = getUnlockedFamiliarSpecies(f);
  if (!unlocked.some(function(sp){ return sp.id === speciesId; })) return;
  f.speciesId = speciesId;
  saveFamiliar(f);
  updateFamiliarBadge();
  openFamiliarOverlay();
  say(_familiarDisplayName(f) + ' is now your familiar.');
}
function renameFamiliar() {
  var input = document.getElementById('familiar-name-input');
  if (!input) return;
  var f = getFamiliar();
  f.name = (input.value || '').trim().slice(0, 20);
  saveFamiliar(f);
  updateFamiliarBadge();
  openFamiliarOverlay();
  say(f.name ? 'Familiar renamed to ' + f.name + '.' : 'Familiar name cleared.');
}
function gainFamiliarBond(amount) {
  try {
    var f = getFamiliar();
    var before = familiarBondLevel(f.bond);
    f.bond += amount;
    var after = familiarBondLevel(f.bond);
    saveFamiliar(f);
    updateFamiliarBadge();
    if (after > before) {
      updateAchievementStat('familiarBondLevel', after);
      _familiarLevelUp(f, after);
    }
  } catch(e) { console.warn('[DD] gainFamiliarBond failed:', e); }
}
function _familiarLevelUp(f, newLevel) {
  var displayName = _familiarDisplayName(f);
  var title = familiarTitle(newLevel);
  // Three-note ascending chime, unpanned — a personal cue that follows
  // you rather than one tied to a direction in the room
  _echoOsc('sine', 660, 0, 0, 0.18, 0.30);
  _echoOsc('sine', 880, 0, 0.14, 0.18, 0.30);
  _echoOsc('sine', 1320, 0, 0.28, 0.26, 0.34);
  vibe && vibe(VIBE.familiarBond);
  say(displayName + ' grows closer to you. Bond level ' + newLevel + '.' + (title ? ' ' + displayName + ', ' + title + '.' : ''));
}
// Occasional flavor line on room enter — low probability and delayed so
// it never competes with the room's own description for attention.
// Deeper lines mix in once the bond is old enough to have earned them.
function familiarSpeak() {
  try {
    var f = getFamiliar();
    if (Math.random() > 0.12) return;
    var sp = _familiarSpecies(f);
    var pool = sp.lines.slice();
    if (familiarBondLevel(f.bond) >= 5) pool = pool.concat(sp.deepLines);
    var line = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(function() { say(line); }, 2200);
  } catch(e) {}
}
// A comfort line at critical sanity — the one thing here Mira doesn't
// already cover. Once per drop below the threshold, not every tick.
var _familiarSanityCommentedThisDrop = false;
function familiarSanityComfort() {
  try {
    if (_familiarSanityCommentedThisDrop) return;
    _familiarSanityCommentedThisDrop = true;
    var f = getFamiliar();
    var displayName = _familiarDisplayName(f);
    var lines = [
      displayName + ' presses close against you. Steady. Still here.',
      displayName + ' does not leave, even now. Not for this.',
      'Whatever the dungeon is doing to your mind, ' + displayName + ' has not stopped watching over you.'
    ];
    setTimeout(function() { say(lines[Math.floor(Math.random() * lines.length)]); }, 3000);
  } catch(e) {}
}
// Recognizing specific recurring characters by name — once per run each,
// not just "a boss encounter" or "an event," which Mira already covers.
function familiarRecognizeJulio() {
  try {
    var f = getFamiliar();
    if (DS._familiarMetJulio) return;
    DS._familiarMetJulio = true;
    var displayName = _familiarDisplayName(f);
    setTimeout(function() { say(displayName + ' seems unbothered by Julio. As if this has happened before.'); }, 4200);
  } catch(e) {}
}
function familiarRecognizeVoidReaper() {
  try {
    var f = getFamiliar();
    if (DS._familiarSawVoidReaper) return;
    DS._familiarSawVoidReaper = true;
    var displayName = _familiarDisplayName(f);
    setTimeout(function() { say(displayName + ' goes very still. It knows exactly what this is.'); }, 800);
  } catch(e) {}
}
function updateFamiliarBadge() {
  var el = document.getElementById('menu-familiar-badge');
  if (!el) return;
  var f = getFamiliar();
  var sp = _familiarSpecies(f);
  var level = familiarBondLevel(f.bond);
  var badge = familiarEvolutionBadge(level);
  el.textContent = sp.icon + (badge ? ' ' + badge : '') + ' Lv.' + level;
}
function _renderFamiliarSpeciesPicker(f) {
  var listEl = document.getElementById('familiar-species-list');
  if (!listEl) return;
  var stats = getAchievementStats();
  listEl.innerHTML = FAMILIAR_SPECIES.map(function(sp) {
    var isUnlocked = sp.id === f.startingSpeciesId || sp.unlocked(stats);
    var isActive = sp.id === f.speciesId;
    if (!isUnlocked) {
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#080808;border:1px solid #222;opacity:0.5;">' +
        '<span style="font-size:1.2rem;" aria-hidden="true">🔒</span>' +
        '<div style="flex:1;"><div style="font-family:Cinzel,serif;font-size:0.68rem;color:#666;">' + sp.label + '</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#555;">Locked — ' + sp.unlock + '</div></div></div>';
    }
    return '<button type="button" onclick="selectFamiliarSpecies(\'' + sp.id + '\')" aria-label="' + (isActive ? sp.label + ', currently active' : 'Choose ' + sp.label + ' as your familiar') + '" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:' + (isActive ? '#0a1520' : '#080808') + ';border:1px solid ' + (isActive ? '#4488aa' : '#222') + ';width:100%;text-align:left;cursor:pointer;color:inherit;font:inherit;">' +
      '<span style="font-size:1.2rem;" aria-hidden="true">' + sp.icon + '</span>' +
      '<div style="flex:1;"><div style="font-family:Cinzel,serif;font-size:0.68rem;color:#aaddff;">' + sp.label + (isActive ? ' (active)' : '') + '</div></div></button>';
  }).join('');
}
function openFamiliarOverlay() {
  var ov = document.getElementById('ov-familiar');
  if (!ov) return;
  var f = getFamiliar();
  var sp = _familiarSpecies(f);
  var level = familiarBondLevel(f.bond);
  var intoLevel = f.bond % 30;
  var displayName = _familiarDisplayName(f);
  var title = familiarTitle(level);
  ov.style.display = 'flex';
  var iconEl = document.getElementById('familiar-icon-display');
  if (iconEl) {
    var badge = familiarEvolutionBadge(level);
    iconEl.textContent = sp.icon + (badge ? ' ' + badge : '');
    iconEl.style.textShadow = familiarGlowStyle(level);
    iconEl.style.transition = 'text-shadow 0.6s ease';
  }
  var nameEl = document.getElementById('familiar-name-display');
  if (nameEl) nameEl.textContent = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  var levelEl = document.getElementById('familiar-level-display');
  if (levelEl) levelEl.textContent = 'Bond Level ' + level + (title ? ' — ' + title : '');
  var barEl = document.getElementById('familiar-bond-bar-fill');
  if (barEl) barEl.style.width = Math.round((intoLevel / 30) * 100) + '%';
  var nameInput = document.getElementById('familiar-name-input');
  if (nameInput) nameInput.value = f.name || '';
  _renderFamiliarSpeciesPicker(f);
  say(displayName + '. Bond level ' + level + '. ' + intoLevel + ' of 30 toward the next level.' + (title ? ' Title: ' + title + '.' : ''));
  setTimeout(function(){ var btn = ov.querySelector('button'); if(btn) btn.focus(); }, 100);
}
function closeFamiliarOverlay() {
  var ov = document.getElementById('ov-familiar');
  if (ov) ov.style.display = 'none';
}

function checkAchievements() {
  var stats = getAchievementStats();
  var unlocked = getUnlockedAchievements();
  var newUnlocks = [];
  ACHIEVEMENTS.forEach(function(ach) {
    if (unlocked.indexOf(ach.id) === -1 && ach.check(stats)) {
      unlocked.push(ach.id);
      newUnlocks.push(ach);
    }
  });
  if (newUnlocks.length > 0) {
    saveUnlockedAchievements(unlocked);
    // Multiple achievements can unlock in the same check — play the sound
    // for whichever one is the highest tier, not just the first found.
    var tierRank = { normal: 0, bronze: 1, silver: 2, gold: 3, special: 4 };
    var best = newUnlocks[0];
    newUnlocks.forEach(function(a) {
      if (tierRank[getAchievementTier(a)] > tierRank[getAchievementTier(best)]) best = a;
    });
    playAchievementUnlockSound(best);
    newUnlocks.forEach(function(ach) {
      awardScore('achievements', 250);
      showAchievementPopup(ach);
    });
  }
}

function updateAchievementStat(key, val) {
  try {
    var s = getAchievementStats();
    if (val === true) s[key] = true;
    else s[key] = Math.max(s[key] || 0, val);
    saveAchievementStats(s);
    checkAchievements();
  } catch(e) { console.warn('[DD] updateAchievementStat failed:', e); }
}

function incrementAchievementStat(key, amt) {
  try {
    var s = getAchievementStats();
    s[key] = (s[key] || 0) + (amt || 1);
    saveAchievementStats(s);
    checkAchievements();
  } catch(e) { console.warn('[DD] incrementAchievementStat failed:', e); }
}

function getDailyQuest() {
  var save = _jsonParseSafe(DDStore.getItem('dd_daily_quest'), '{}');
  var today = todayKey();
  if (save.date !== today) {
    // Deterministic rotation based on date — same quest for all players on same day
    // Uses day-of-year so it cycles through all quests evenly
    var d = new Date();
    var start = new Date(d.getFullYear(), 0, 0);
    var diff = d - start;
    var oneDay = 1000 * 60 * 60 * 24;
    var dayOfYear = Math.floor(diff / oneDay);
    var qIdx = dayOfYear % DAILY_QUESTS.length;
    var q = DAILY_QUESTS[qIdx];
    save = { date:today, id:q.id, progress:0, complete:false };
    DDStore.setItem('dd_daily_quest', JSON.stringify(save));
  }
  return save;
}

function getDailyQuestDef() {
  var save = getDailyQuest();
  return DAILY_QUESTS.find(function(q){return q.id===save.id;}) || DAILY_QUESTS[0];
}

function completeDailyQuestReward(def) {
  if (def.rewardGold) { DS.gold += def.rewardGold; addGlobalGold(def.rewardGold); updateTopBar(); }
  if (def.rewardPotion) DS.inventory.push({name:'Health Potion',icon:'🧪',type:'potion',heal:40,desc:'Restores 40 HP.'});
  incrementAchievementStat('dailyQuestsComplete', 1);
  say('Daily quest complete! ' + def.desc + ' Reward: ' + def.reward + '!');
  sfx('sfx-unlock');
  setEvent('good', '✦ Daily Quest Complete! ' + def.desc + ' Reward: ' + def.reward + '!');
}

function updateDailyQuestProgress(type, amount) {
  var save = getDailyQuest();
  if (save.complete) return;
  var def = getDailyQuestDef();
  if (def.type !== type) return;
  // Wire special quest types
  if (type === 'boss' && DS.enemy && DS.enemy.isBoss) {}
  if (type === 'elite' && DS.enemy && DS.enemy.isElite) {}
  if (type === 'hollow' && DS.dungeon === 'The Hollow') {}
  if (type === 'fragment' && DS.dungeon === 'The Sunken Archives') {}
  save.progress = (save.progress || 0) + amount;
  if (save.progress >= def.target) {
    save.progress = def.target;
    save.complete = true;
    completeDailyQuestReward(def);
  }
  DDStore.setItem('dd_daily_quest', JSON.stringify(save));
  updateDQIndicator();
}

function checkFloorQuest() {
  // Floor quest: reaches floor N
  var save = getDailyQuest();
  if (save.complete) return;
  var def = getDailyQuestDef();

  if (def.type === 'floor') {
    // Use absolute floor number — not cumulative
    if (DS.floor >= def.target) {
      save.progress = def.target;
      save.complete = true;
      DDStore.setItem('dd_daily_quest', JSON.stringify(save));
      completeDailyQuestReward(def);
    } else {
      save.progress = DS.floor;
      DDStore.setItem('dd_daily_quest', JSON.stringify(save));
    }
  }

  if (def.type === 'nopotion') {
    // Only counts if player has NOT used a potion
    if (DS.usedPotion) return; // quest is failed — do nothing
    if (DS.floor >= def.target) {
      save.progress = def.target;
      save.complete = true;
      DDStore.setItem('dd_daily_quest', JSON.stringify(save));
      completeDailyQuestReward(def);
    } else {
      save.progress = DS.floor;
      DDStore.setItem('dd_daily_quest', JSON.stringify(save));
    }
  }
}

function getMainQuest() {
  return { desc:'Descend to floor 10 and defeat the dungeon boss.', type:'boss', complete:false };
}

function showQuestPopup() { showRunBriefing(); }

// ── RUN BRIEFING ──
// Everything about a new run on one screen with one Begin button: the opening
// quote, the dungeon intro, the dungeon condition, the class trait, the run
// modifier, the quests, the seasonal event and the guide's greeting. These
// used to be separate pop-ups, some on timers, that stacked on top of each other.
var _briefPending = false, _briefWeather = null;
function classTraitText(cls) {
  var traitDescs = {
    'Warrior': 'Heavy strikes have a 25% chance to stun enemies for one turn.',
    'Mage': 'Skills cost 3 less SP. Elemental skills deal 20% more damage.',
    'Rogue': 'First attack each combat always hits. Critical hit chance is doubled.',
    'Cleric': 'Potions heal 30% more. Holy skills restore SP on use.',
    'Ranger': 'First attack each combat deals double damage.',
    'Sentinel': 'Defending reduces damage by an extra 20%. Counter-attacks on defend.',
    'Necromancer': 'Enemies killed have a 15% chance to rise as temporary undead allies.',
    'Bard': 'Skills boost all stats temporarily after use.',
    'Monk': 'No weapon bonuses but unarmed attacks scale with level.',
    'Druid': 'Heals 6 HP every room entered.',
    'Assassin': 'Critical hits deal triple damage instead of double.',
    'Paladin': 'Holy aura weakens undead enemies automatically.',
    'BloodKnight': 'Heals 10% of damage dealt as HP.',
    'Warlock': 'Dark pact — take 5 damage per turn but deal 30% more.',
    'Alchemist': 'Potions never run out — can be used twice each.',
    'Sorcerer': 'Skills scale with INT stat instead of STR.',
    'Wizard': 'Can cast two skills per turn once per floor.',
    'DeathKnight': 'Unholy aura drains 5 HP from enemies every turn.'
  };
  return traitDescs[cls] || 'A unique class ability is active this run.';
}
function _briefEsc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

function showRunBriefing() {
  var old = document.getElementById('run-briefing'); if (old) old.remove();
  var ch = _charIdx !== null ? CHARS[_charIdx] : null;
  // Repeat runs with a spirit already chosen skip the run modifier, as before.
  var isRepeatRun = !!(ch && ch.lastSpirit && DDStore.getItem('dd_seen_quest_' + encodeURIComponent(ch.name)) && DS.activeSpirit);
  if (ch) DDStore.setItem('dd_seen_quest_' + encodeURIComponent(ch.name), '1');
  _briefPending = true;
  var mod = isRepeatRun ? null : rollRunModifier();

  var parts = []; // {title, text}
  var quote = null; try { quote = getRunStartQuote(); } catch(e) {}
  var intro = (typeof DUNGEON_INTROS !== 'undefined' && !_dungeonIntroShown[DS.dungeon]) ? DUNGEON_INTROS[DS.dungeon] : null;
  if (intro) { _dungeonIntroShown[DS.dungeon] = true; parts.push({ title: intro.eyebrow, text: intro.text }); }
  if (quote) parts.push({ title: t('Your words'), text: quote });
  var w = _briefWeather;
  if (w) {
    var noEffect = !w.effect || /^No special effects/.test(w.effect);
    parts.push({ title: t('Dungeon condition') + ': ' + w.name, text: (w.desc || '') + (noEffect ? '' : ' ' + t('Effect') + ': ' + w.effect) });
  }
  parts.push({ title: t('Class trait') + ': ' + DS.cls, text: classTraitText(DS.cls) });
  if (mod) parts.push({ title: t('Run modifier') + ': ' + mod.name, text: mod.desc + ' ' + t('You can turn run modifiers off in Settings, Gameplay.') });
  var q = [];
  try {
    var dc = getDailyChallenge(), dcDone = getDailyChallengeCompleted();
    var dcReg = typeof isDCRegistered === 'function' && isDCRegistered();
    // The challenge only applies once you register for it in Challenges, so say which it is.
    if (dc && !dcDone && dcReg) q.push(t('Daily challenge') + ', ' + dc.name + ': ' + dc.desc + ' ' + t('Complete it for 1 Mystery Coin.'));
    else if (dc && !dcDone) q.push(t('Today\'s daily challenge is') + ' ' + dc.name + '. ' + t('Register for it in Challenges on the main menu to play it and earn a Mystery Coin.'));
    else if (dc && dcDone) q.push(t('Daily challenge complete') + ': ' + dc.name + '.');
  } catch(e) {}
  q.push(t('Main quest') + ': ' + t('Descend to floor 10 and defeat the dungeon boss.'));
  try {
    var daily = getDailyQuestDef(), dailySave = getDailyQuest();
    q.push(t('Daily quest') + ': ' + daily.desc + ' ' + (dailySave.complete ? t('Complete!') : t('Progress') + ': ' + (dailySave.progress || 0) + ' / ' + daily.target + '.') + ' ' + t('Reward') + ': ' + daily.reward + '.');
  } catch(e) {}
  parts.push({ title: t('Quests'), text: q.join(' ') });
  try {
    var ev = getEventBonuses();
    if (ev) {
      var eb = [];
      if (ev.xpMult && ev.xpMult > 1) eb.push(Math.round((ev.xpMult - 1) * 100) + '% ' + t('bonus XP'));
      if (ev.goldMult && ev.goldMult > 1) eb.push(Math.round((ev.goldMult - 1) * 100) + '% ' + t('bonus gold'));
      if (ev.enemyMult && ev.enemyMult > 1) eb.push(t('enemies') + ' ' + Math.round((ev.enemyMult - 1) * 100) + '% ' + t('stronger'));
      if (ev.extraEnemies && ev.extraEnemies.length) eb.push(t('exclusive enemies are invading'));
      parts.push({ title: t('Event') + ': ' + ev.label, text: eb.length ? eb.join(', ') + '.' : t('An event is active.') });
    }
  } catch(e) {}
  try {
    var gl = getGuideDialogue('dungeonStart');
    if (gl) parts.push({ title: (typeof getCompanionName === 'function' ? getCompanionName() : t('Your guide')) + ' ' + t('says'), text: gl });
  } catch(e) {}

  var title = DS.name + ' ' + t('the') + ' ' + DS.cls + ' ' + t('enters') + ' ' + DS.dungeon;
  var ov = document.createElement('div');
  ov.id = 'run-briefing';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-labelledby', 'rb-title');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:8600;display:flex;align-items:center;justify-content:center;padding:16px;';
  ov.innerHTML = '<div style="max-width:440px;width:100%;max-height:92vh;overflow-y:auto;background:var(--bg-panel,#0c0a08);border:1px solid var(--gold-dim,#6a5420);border-top:3px solid var(--gold,#c9a227);padding:22px 20px;">' +
    '<div style="font-family:Cinzel,serif;font-size:0.6rem;letter-spacing:0.3em;color:var(--gold-dim,#8a7030);margin-bottom:6px;" aria-hidden="true">⚔ ' + _briefEsc(t('RUN BRIEFING')) + '</div>' +
    '<h2 id="rb-title" tabindex="-1" style="font-family:Cinzel,serif;font-size:1rem;color:var(--gold,#c9a227);margin:0 0 14px;line-height:1.4;">' + _briefEsc(title) + '</h2>' +
    parts.map(function(p) {
      return '<section style="margin-bottom:12px;border-left:2px solid #4a3a18;padding-left:10px;"><h3 style="font-family:Cinzel,serif;font-size:0.78rem;color:#e0c080;margin:0 0 4px;">' + _briefEsc(p.title) + '</h3>' +
        '<p style="font-size:0.8rem;color:var(--text-secondary,#b8ab90);line-height:1.6;margin:0;">' + _briefEsc(p.text) + '</p></section>';
    }).join('') +
    '<button type="button" id="rb-begin" class="menu-btn primary" style="width:100%;margin-top:8px;" aria-label="' + _briefEsc(t('Begin your descent')) + '">' + _briefEsc(t('Begin Descent')) + ' ⚔</button></div>';
  document.body.appendChild(ov);
  document.getElementById('rb-begin').onclick = function() { beginRunFromBriefing(mod, isRepeatRun); };
  setTimeout(function() { var b = document.getElementById('rb-begin'); if (b) b.focus(); }, 100);
  setTimeout(function() {
    say(t('Run briefing.') + ' ' + title + '. ' + parts.map(function(p) { return p.title + '. ' + p.text; }).join(' ') + ' ' + t('Press Begin Descent when you are ready.'));
  }, 250);
}

function beginRunFromBriefing(mod, isRepeatRun) {
  var ov = document.getElementById('run-briefing'); if (ov) ov.remove();
  say(t('Beginning your descent.'));
  if (mod) applyRunModifier();
  DS._floorGoldStart = DS.gold || 0;
  var ch = _charIdx !== null ? CHARS[_charIdx] : null;
  if (isRepeatRun) { enterRoom(); return; }
  if (shouldShowTutorial()) {
    enterRoom();
    setTimeout(function() { startTutorial(); }, 600);
  } else if (ch && ch.lastSpirit && DS.activeSpirit) {
    enterRoom();
  } else {
    // Use the spirit chosen in character creation, or the first starter spirit
    pickSpirit((ch && ch.lastSpirit && getSpiritById(ch.lastSpirit)) || STARTER_SPIRITS[0]);
    enterRoom();
  }
}
// ── END RUN BRIEFING ──

function closeQuestPopup() {
  document.getElementById('quest-popup').classList.remove('open');
  say('Beginning your descent.');
  var hasSavedSpirit = _charIdx !== null && CHARS[_charIdx] && CHARS[_charIdx].lastSpirit;
  rollRunModifier();
  var afterEverything = function() {
    if (shouldShowTutorial()) {
      enterRoom();
      setTimeout(function() { startTutorial(); }, 600);
    } else if (hasSavedSpirit && DS.activeSpirit) {
      enterRoom();
    } else {
      // Use spirit saved from character creation (step 8)
      var ch = CHARS[_charIdx];
      if (ch && ch.lastSpirit) {
        pickSpirit(getSpiritById(ch.lastSpirit) || STARTER_SPIRITS[0]);
        enterRoom();
      } else {
        // Fallback — pick first starter spirit automatically
        pickSpirit(STARTER_SPIRITS[0]);
        enterRoom();
      }
    }
  };
  var afterModifier = function() {
    applyRunModifier();
    showRunStartQuote(function() {
      showDungeonIntro(DS.dungeon, afterEverything);
    });
  };
  showRunModifierIntro(afterModifier);
}

// Same bounded-batch approach as the bestiary and inventory — 109 achievement
// cards (each individually focusable, with its own aria-label) built as real DOM
// elements every time the Quests screen opens is the same accessibility-pipeline
// cost that made those screens slow. _achVisibleCount caps the batch; goTo()
// resets it back to _achPageSize whenever the Quests screen is entered fresh.
var _achPageSize = 40;
var _achVisibleCount = 40;

function switchQuestTab(tab) {
  document.querySelectorAll('.quest-tab').forEach(function(t){t.classList.remove('active');t.setAttribute('aria-selected','false');});
  document.querySelectorAll('.quest-section').forEach(function(s){s.classList.remove('active');});
  var btn = document.querySelector('[onclick="switchQuestTab(\''+tab+'\')"]');
  if (btn) { btn.classList.add('active'); btn.setAttribute('aria-selected','true'); }
  document.getElementById('qt-'+tab).classList.add('active');
  say(tab === 'quests' ? 'Quests tab selected.' : 'Achievements tab selected.');
}

function renderQuestsScreen() {
  var questList = document.getElementById('quest-list');
  var grid = document.getElementById('ach-grid');
  if (!questList || !grid) return;
  // Quests tab
  var daily = getDailyQuestDef();
  var dailySave = getDailyQuest();
  var pct = Math.min(100, ((dailySave.progress||0)/daily.target)*100);
  document.getElementById('quest-list').innerHTML =
    '<div class="quest-card" aria-label="Main quest">' +
      '<div class="quest-name">⚔ Main Quest <span class="quest-badge main">MAIN</span></div>' +
      '<div class="quest-desc">Descend to floor 10 and defeat the dungeon boss. Applies to each dungeon run.</div>' +
      '<div class="quest-reward">Reward: Dungeon cleared + next dungeon unlocked.</div>' +
    '</div>' +
    '<div class="quest-card daily' + (dailySave.complete?' complete':'') + '" aria-label="Daily quest">' +
      '<div class="quest-name">☀ Daily Quest ' +
        '<span class="quest-badge '+(dailySave.complete?'done':'daily')+'">'+(dailySave.complete?'COMPLETE':'DAILY')+'</span>' +
      '</div>' +
      '<div class="quest-desc">' + daily.desc + '</div>' +
      '<div class="quest-progress">Progress: ' + (dailySave.progress||0) + ' / ' + daily.target + (dailySave.complete?' — Done!':'') + '</div>' +
      '<div class="quest-progress-bar-wrap"><div class="quest-progress-bar" style="width:'+pct+'%"></div></div>' +
      '<div class="quest-reward">Reward: ' + daily.reward + '</div>' +
    '</div>';
  // Achievements tab
  var unlocked = getUnlockedAchievements();
  var grid = document.getElementById('ach-grid');
  grid.innerHTML = '';
  var total = ACHIEVEMENTS.length;
  var unlockedCount = unlocked.length;
  var pctDone = Math.round((unlockedCount/total)*100);
  var achHeader = document.createElement('div');
  achHeader.style.cssText = 'margin-bottom:16px;padding:12px 16px;background:rgba(201,162,39,0.06);border:1px solid var(--border-dim);border-left:3px solid var(--gold-dim);';
  achHeader.innerHTML =
    '<div style="font-family:Cinzel,serif;font-size:0.72rem;color:var(--gold-dim);margin-bottom:6px;">ACHIEVEMENTS — ' + unlockedCount + ' / ' + total + ' UNLOCKED</div>' +
    '<div style="height:4px;background:rgba(201,162,39,0.1);border-radius:2px;overflow:hidden;"><div style="height:100%;width:' + pctDone + '%;background:var(--gold-dim);border-radius:2px;"></div></div>' +
    '<div style="font-size:0.7rem;color:var(--text-dim);margin-top:4px;font-style:italic;">' + pctDone + '% complete</div>';
  grid.appendChild(achHeader);
  var visibleAchievements = ACHIEVEMENTS.slice(0, _achVisibleCount);
  visibleAchievements.forEach(function(ach) {
    var isUnlocked = unlocked.indexOf(ach.id) !== -1;
    var card = document.createElement('div');
    card.className = 'ach-card ' + (isUnlocked ? 'unlocked' : 'locked');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label', ach.name + '. ' + ach.desc + (isUnlocked ? ' Unlocked.' : ' Locked. To unlock: ' + (ach.hint || 'Keep playing.')));
    card.innerHTML = '<span class="ach-icon" aria-hidden="true">'+(isUnlocked?ach.icon:'🔒')+'</span>' +
      '<div class="ach-name">' + ach.name + (isUnlocked ? ' <span style="font-size:0.6rem;color:#7aaa7a;">✓</span>' : '') + '</div>' +
      '<div class="ach-desc">' + ach.desc + '</div>' +
      (isUnlocked ? '' : '<div class="ach-hint" style="font-size:0.62rem;color:#888;font-style:italic;margin-top:4px;">🔓 ' + (ach.hint || 'Keep playing.') + '</div>');
    grid.appendChild(card);
  });
  if (ACHIEVEMENTS.length > visibleAchievements.length) {
    var achLoadMoreBtn = document.createElement('button');
    achLoadMoreBtn.type = 'button';
    achLoadMoreBtn.className = 'btn-ghost';
    achLoadMoreBtn.style.cssText = 'width:100%;margin-top:8px;padding:10px;font-family:Cinzel,serif;font-size:0.68rem;';
    var achRemaining = ACHIEVEMENTS.length - visibleAchievements.length;
    achLoadMoreBtn.textContent = 'Load More (' + achRemaining + ' remaining)';
    achLoadMoreBtn.setAttribute('aria-label', 'Load ' + Math.min(_achPageSize, achRemaining) + ' more achievements. ' + achRemaining + ' remaining.');
    achLoadMoreBtn.onclick = function() {
      _achVisibleCount += _achPageSize;
      renderQuestsScreen();
      var firstNew = grid.children[visibleAchievements.length + 1]; // +1 for achHeader
      if (firstNew) firstNew.focus();
    };
    grid.appendChild(achLoadMoreBtn);
  }
  say('Achievements. ' + unlockedCount + ' of ' + total + ' unlocked. ' + pctDone + ' percent complete.' + (ACHIEVEMENTS.length > visibleAchievements.length ? ' Showing first ' + visibleAchievements.length + '.' : ''));
  // Also render DC panel if tab exists
  renderDCPanel();
}

//═════════════════
// RAID CHARACTER SELECTION + REAL STATS
//═════════════════
var _raidCharIdx = 0;

function initRaidScreen(){
  document.getElementById('raid-pre').style.display='';
  document.getElementById('raid-active').style.display='none';
  document.getElementById('raid-end').style.display='none';
  var msg=document.getElementById('raid-status-msg');
  var sa=document.getElementById('raid-start-area');
  var coins=getRaidSave().mysteryCoins||0;
  setTimeout(function(){ injectCharSlider('raid-char-list'); }, 50);

  // Render character selector
  var charList = document.getElementById('raid-char-list');
  charList.innerHTML = '';
  if (CHARS.length === 0) {
    charList.innerHTML = '<p style="font-size:0.8rem;color:var(--text-dim);font-style:italic;">Create a character first to enter the raid.</p>';
    sa.style.display = 'none';
  } else {
    _raidCharIdx = 0;
    CHARS.forEach(function(ch, i) {
      var btn = document.createElement('button');
      btn.className = 'char-card';
      btn.style.cssText = 'margin-bottom:8px;outline:none;';
      btn.setAttribute('role','radio');
      btn.setAttribute('aria-checked', i===0?'true':'false');
      btn.setAttribute('aria-label', ch.name + ', ' + ch.race + ' ' + ch.cls + ', Level ' + (ch.persistLevel||1) + ', ' + ch.difficulty + '. Press to select for raid.');
      btn.innerHTML = '<span class="char-class-icon" aria-hidden="true">' + (CLASS_ICONS[ch.cls]||'⚔️') + '</span>' +
        '<div class="char-info"><div class="char-name-row"><span class="char-name">' + ch.name + '</span>' +
        '<span class="char-class-badge" aria-hidden="true">' + ch.race + ' ' + ch.cls + '</span>' +
        '<span class="char-class-badge" style="background:#1a1000;border-color:#ffaa00;color:#ffaa00;" aria-hidden="true">Lv ' + (ch.persistLevel||1) + '</span></div>' +
        '<p class="char-details">' + ch.prof + ' · ' + ch.difficulty + '</p></div>';
      if (i === 0) btn.style.borderColor = 'var(--gold)';
      (function(idx, b) {
        b.onclick = function() {
          _raidCharIdx = idx;
          document.querySelectorAll('#raid-char-list .char-card').forEach(function(c,ci){
            c.style.borderColor = ci===idx?'var(--gold)':'';
            c.setAttribute('aria-checked', ci===idx?'true':'false');
          });
          say(CHARS[idx].name + ' selected for raid.');
        };
      })(i, btn);
      charList.appendChild(btn);
    });
  }

  if(raidDoneToday()){
    msg.innerHTML='<div class="raid-cooldown">You have already completed today\'s raid.<br>Come back tomorrow.<br><br>Mystery Coins: '+coins+'</div>';
    sa.style.display='none';
    say('Raid already completed today. You have '+coins+' Mystery Coins.');
  } else {
    msg.innerHTML='<p style="font-family:Cinzel,serif;font-size:0.72rem;color:var(--gold-dim);letter-spacing:0.1em;">Mystery Coins: '+coins+'</p>';
    if (CHARS.length > 0) sa.style.display='';
    say('Daily raid available. Select a character and press Begin Raid.');
  }
}

function beginRaid(){
  var ch = CHARS[_raidCharIdx] || CHARS[0];
  if (!ch) { say('No character available.'); return; }
  var baseHp = HP_MAP[ch.cls] || 100;
  var charLevel = ch.level || ch.persistLevel || 1;
  var maxHp = baseHp + (charLevel - 1) * 10; // +10 HP per level
  var atk = ATK_MAP[ch.cls] || [7,13];
  var def = DEF_MAP[ch.cls] || 0;
  var atkBonus = Math.floor((charLevel - 1) * 0.5); // small atk bonus per level

  // Apply equipped weapon/armor
  var _weaponBonus = 0, _armorBonus = 0;
  try {
    var _rw = _jsonParseSafe(DDStore.getItem('dd_equipped_weapon'), 'null');
    if (_rw) { var _rwAtk = getWeaponAtk(_rw); if (Array.isArray(_rwAtk)) _weaponBonus = Math.floor((_rwAtk[0]+_rwAtk[1])/2); }
    var _ra = _jsonParseSafe(DDStore.getItem('dd_equipped_armor'), 'null');
    if (_ra) _armorBonus = _ra.defBase || _ra.defBonus || 0;
  } catch(e) {}

  RD={
    wave:1, maxHp:maxHp, hp:maxHp, atk:atk, def:def + _armorBonus,
    atkBonus:_weaponBonus + atkBonus, defBonus:_armorBonus, defending:false, gold:0, potions: 4 + (hasUpgrade('cu-raid-boost') ? 1 : 0),
    enemies:[], curIdx:0, done:false,
    cls: ch.cls, prof: ch.prof, charName: ch.name,
    sp:20 + (charLevel - 1) * 2, maxSp:20 + (charLevel - 1) * 2,
    level:charLevel, xp:0,
    markedKill:false, divineShield:false, manaShield:0, venomTurns:0,
    potionMult: ch.prof==='Herbalist'?2:1
  };
  document.getElementById('raid-pre').style.display='none';
  document.getElementById('raid-active').style.display='';
  document.getElementById('raid-end').style.display='none';
  playTrack('raid');
  updateRaidSkillButtons();
  startWave();
}

function getRaidUnlockedSkills() {
  var skills = CLASS_SKILLS[RD.cls] || [];
  // In raids, show first 3 common skills for simplicity
  var common = skills.filter(function(s){ return s.tier === 'common'; }).slice(0, 3);
  if (common.length === 0) return skills.slice(0, 3); // fallback
  return common;
}

function updateRaidSkillButtons() {
  var unlocked = getRaidUnlockedSkills();
  for (var i=0;i<3;i++) {
    var btn = document.getElementById('rb-skill'+(i+1));
    if (!btn) continue;
    if (i < unlocked.length) {
      var sk = unlocked[i];
      var canAfford = RD.sp >= sk.spCost;
      btn.style.display='';
      btn.textContent = sk.icon+' '+sk.name+' ('+sk.spCost+'SP)';
      btn.setAttribute('aria-label', sk.name+'. '+sk.desc+' Costs '+sk.spCost+' SP.'+(canAfford?'':' Not enough SP.'));
      btn.disabled = !canAfford || RD.done;
    } else {
      btn.style.display='none';
    }
  }
  var spEl = document.getElementById('rd-sp-display');
  if (spEl && RD.cls) spEl.textContent = 'SP: '+RD.sp+'/'+RD.maxSp;
}

function setRaidBtns(on){
  ['rb-attack','rb-heavy','rb-defend','rb-potion'].forEach(function(id){
    document.getElementById(id).disabled=!on;
  });
  // Gun button — always re-render with correct state
  updateRaidGunButton();
  if (!on && !_gunState.charged) {
    var gunBtn = document.getElementById('rb-gun');
    if (gunBtn) { gunBtn.disabled = true; gunBtn.style.opacity = '0.4'; }
  }
  if (on) {
    updateRaidSkillButtons();
    setTimeout(function(){ var b=document.getElementById('rb-attack'); if(b&&!b.disabled) b.focus(); },50);
  } else {
    ['rb-skill1','rb-skill2','rb-skill3'].forEach(function(id){
      var b=document.getElementById(id); if(b) b.disabled=true;
    });
    var log=document.getElementById('raid-log')||document.getElementById('dg-combat-log');
    if(log){log.setAttribute('tabindex','-1');log.focus();}
  }
}

function raidUseSkill(idx) {
  var unlocked = getRaidUnlockedSkills();
  if (idx >= unlocked.length) return;
  var skill = unlocked[idx];
  if (RD.sp < skill.spCost) { say('Not enough SP.'); return; }
  setRaidBtns(false);
  RD.sp -= skill.spCost;
  var e = getActiveEnemy();
  if (!e) { waveComplete(); return; }
  var baseAtk = rnd(RD.atk[0],RD.atk[1])+RD.atkBonus;
  var pdmg = 0; var skipTurn = false; var msg = '';

  if (skill.effect==='shield-bash')    { pdmg=Math.round(baseAtk*0.9); RD.defBonus+=3; msg='Shield Bash! '+pdmg+' damage, +3 defense!'; }
  else if(skill.effect==='war-cry')    { pdmg=Math.round(baseAtk*2.0); msg='War Cry! '+pdmg+' damage!'; }
  else if(skill.effect==='last-stand') { pdmg=RD.hp<=RD.maxHp*0.30?Math.round(baseAtk*3.0):baseAtk; msg='Last Stand! '+pdmg+' damage!'; }
  else if(skill.effect==='swift-strike'){ var h1=baseAtk,h2=rnd(RD.atk[0],RD.atk[1])+RD.atkBonus; pdmg=h1+h2; msg='Swift Strike! '+h1+'+'+h2+'='+pdmg+'!'; }
  else if(skill.effect==='inner-focus'){ RD.hp=Math.min(RD.maxHp,RD.hp+15); RD.sp=Math.min(RD.maxSp,RD.sp+10); updateRaidHp(); rLog('Inner Focus. +15 HP, +10 SP.'); say('Inner Focus. HP: '+RD.hp+'. SP: '+RD.sp+'.'); setRaidBtns(true); return; }
  else if(skill.effect==='pressure-point'){ pdmg=baseAtk+RD.def+RD.defBonus; msg='Pressure Point! '+pdmg+' ignoring defense!'; }
  else if(skill.effect==='backstab')   { if(Math.random()<0.35){msg='Backstab missed!';} else{pdmg=Math.round(baseAtk*3.0);msg='BACKSTAB! '+pdmg+'!';} }
  else if(skill.effect==='smoke-bomb') { RD.done=false; rLog('Smoke Bomb! But you cannot flee a raid!'); say('Smoke Bomb has no effect in raids.'); setRaidBtns(true); return; }
  else if(skill.effect==='marked-kill'){ RD.markedKill=true; rLog('Marked Kill set.'); say('Next attack guaranteed crit.'); setRaidBtns(true); return; }
  else if(skill.effect==='holy-strike'){ pdmg=baseAtk; RD.hp=Math.min(RD.maxHp,RD.hp+20); updateRaidHp(); msg='Holy Strike! '+pdmg+' damage +20 HP!'; }
  else if(skill.effect==='divine-shield'){ RD.divineShield=true; rLog('Divine Shield raised.'); say('Divine Shield active.'); setRaidBtns(true); return; }
  else if(skill.effect==='smite')      { pdmg=Math.round(baseAtk*2.5); msg='SMITE! '+pdmg+'!'; }
  else if(skill.effect==='entangle')   { skipTurn=true; pdmg=Math.round(baseAtk*0.5); msg='Entangle! '+pdmg+' enemy cannot counterattack!'; }
  else if(skill.effect==='venom')      { RD.venomTurns=3; rLog('Venom applied, 3 turns.'); say('Venom active.'); setRaidBtns(true); return; }
  else if(skill.effect==='call-wild')  { pdmg=Math.round(baseAtk*2.0); msg='Call of Wild! '+pdmg+'!'; }
  else if(skill.effect==='arcane-bolt'){ pdmg=Math.round(baseAtk*1.8); msg='Arcane Bolt! '+pdmg+'!'; }
  else if(skill.effect==='mana-shield'){ RD.manaShield=25; rLog('Mana Shield raised.'); say('Mana Shield active.'); setRaidBtns(true); return; }
  else if(skill.effect==='obliterate') { pdmg=Math.round(RD.sp*4+baseAtk); RD.sp=0; msg='OBLITERATE! '+pdmg+'!'; }

  if (pdmg>0) { e.curHp=Math.max(0,e.curHp-pdmg); renderRaidGrid(); }
  rLog(msg); say(msg);
  if (e.curHp<=0) {
    sfx('sfx-enemy-die'); recordKill(e.name);
    var g=ri(e.gold[0],e.gold[1]); RD.gold+=g; updateRaidHp();
    var rem=aliveCount();
    setTimeout(function(){ if(rem<=0){waveComplete();}else{var nx=getActiveEnemy();rLog(rem+' remaining. Now: '+nx.name+'!');say(rem+' remaining. Now facing '+nx.name+'.');setRaidBtns(true);} },600);
    return;
  }
  if (skipTurn) { rLog('Enemy rooted, cannot attack!'); setRaidBtns(true); return; }
  // Enemy hits back
  setTimeout(function(){
    if(RD.divineShield){RD.divineShield=false;rLog('Divine Shield absorbs!');say('Shield blocked all.');setRaidBtns(true);return;}
    if(RD.venomTurns>0){e.curHp=Math.max(0,e.curHp-8);RD.venomTurns--;renderRaidGrid();if(e.curHp<=0){setTimeout(function(){waveComplete();},300);return;}}
    var raw=rnd(e.atk[0],e.atk[1]);
    var blk=Math.min(RD.def+RD.defBonus,Math.floor(raw*0.55));
    var taken=Math.max(1,raw-blk);
    if(RD.manaShield&&RD.manaShield>0){var abs=Math.min(RD.manaShield,taken);taken-=abs;RD.manaShield-=abs;rLog('Mana Shield absorbs '+abs+'. You take '+taken+'.');}
    RD.hp=Math.max(0,RD.hp-taken); sfx('sfx-hurt'); updateRaidHp();
    rLog(e.name+' strikes for '+taken+'.');
    say(e.name+' dealt '+taken+'. HP: '+RD.hp+'.');
    if(RD.hp<=0){setTimeout(function(){raidDefeat();},500);}
    else{setRaidBtns(true);}
  },650);
}


// ── FLOOR 10 ELITE GAUNTLET ──
// ── PRE-BOSS MINION GAUNTLET ──
// 1-2 waves of dungeon-appropriate enemies before the floor 10 boss
function startPreBossGauntlet() {
  var waveCount = Math.random() < 0.5 ? 1 : 2;
  DS._gauntletWavesTotal = waveCount;
  DS._gauntletWavesCurrent = 0;
  showDgPanels(true, false, false);
  setEvent('danger',
    '⚔ The path to the final chamber is blocked. ' + waveCount + ' wave' + (waveCount > 1 ? 's' : '') +
    ' of minions stand between you and the boss. Defeat them all.'
  );
  say('Pre-boss gauntlet. ' + waveCount + ' wave' + (waveCount > 1 ? 's' : '') + ' of minions block the path to the final boss. Prepare yourself.');
  sfx('sfx-stairs'); vibe && vibe(VIBE.gauntletStart);
  setTimeout(function() { spawnGauntletWave(); }, 1500);
}

function spawnGauntletWave() {
  DS._gauntletWavesCurrent++;
  var wave = DS._gauntletWavesCurrent;
  var total = DS._gauntletWavesTotal;

  // Pick a t2 enemy from the correct dungeon pool
  var isAsh      = DS.dungeon === 'The Ashbound Wastes';
  var isFrost    = DS.dungeon === 'Frosthold Abyss';
  var isSunken   = DS.dungeon === 'The Sunken Archives';
  var isHollow   = DS.dungeon === 'The Hollow';
  var isWhisper  = DS.dungeon === 'The Whispering Forest';
  var isInfernal = DS.dungeon === 'The Infernal Descent';
  var isAbyssal  = DS.dungeon === 'The Abyssal Deep';
  var isShadow   = DS.dungeon === 'The Shadow World';
  var isNM       = DS.diff === 'Nightmare';
  var pool = isNM       ? NIGHTMARE_ENEMIES.t2
           : isAsh      ? ASH_ENEMIES.t2
           : isFrost    ? FROST_ENEMIES.t2
           : isSunken   ? SUNKEN_ENEMIES.t2
           : isHollow   ? HOLLOW_ENEMIES.t2
           : isWhisper  ? WHISPER_ENEMIES.t2
           : isInfernal ? INFERNAL_ENEMIES.t2
           : isAbyssal  ? ABYSSAL_ENEMIES.t2
           : isShadow   ? SHADOW_ENEMIES.t2
           : ENEMIES.t2;
  var base = pool[Math.floor(Math.random() * pool.length)];
  var diffMult = DS.diff === 'Nightmare' ? 1.4 : DS.diff === 'Forsaken' ? 1.2 : DS.diff === 'Condemned' ? 1.1 : 1.0;
  var ngMult = DS.ngPlus ? 1.15 : 1.0;
  DS.enemy = {
    name: base.name, icon: base.icon, gold: base.gold,
    hp: Math.round(base.hp * 1.2 * diffMult * ngMult),
    atk: [Math.round(base.atk[0] * 1.1 * ngMult), Math.round(base.atk[1] * 1.1 * ngMult)],
    maxHp: 0,
    isGauntletMinion: true,
    _gauntletWave: wave,
    _gauntletTotal: total
  };
  DS.enemy.maxHp = DS.enemy.hp;
  // Copy relevant mechanic flags from base
  var flags = ['hollowZombie','hollowVampire','hollowGhost','hollowWatch','hollowBell','hollowCrawl',
               'hollowGround','preventFlee','grows','isMusicBox','isTwin','reflection'];
  flags.forEach(function(f) { if (base[f]) DS.enemy[f] = base[f]; });

  addLog('⚔ Wave ' + wave + ' of ' + total + ': ' + DS.enemy.name + ' charges forward!');
  say('Wave ' + wave + ' of ' + total + '. ' + DS.enemy.name + ' blocks the path. Defeat it.');
  sfx('sfx-attack');
  setTimeout(function() { startCombat(false); }, 800);
}

function onGauntletWaveComplete() {
  if (DS._gauntletWavesCurrent < DS._gauntletWavesTotal) {
    // More waves — short breather then next wave
    showDgPanels(true, false, false);
    var remaining = DS._gauntletWavesTotal - DS._gauntletWavesCurrent;
    setEvent('good', '✅ Wave ' + DS._gauntletWavesCurrent + ' cleared! ' + remaining + ' wave' + (remaining > 1 ? 's' : '') + ' remaining.');
    say('Wave ' + DS._gauntletWavesCurrent + ' cleared. ' + remaining + ' more to go.');
    setTimeout(function() { spawnGauntletWave(); }, 1500);
  } else {
    // All waves done — now trigger the boss
    DS._preBossGauntletDone = true;
    DS.roomsOnFloor = (DS.floorRoomsNeeded !== undefined ? DS.floorRoomsNeeded : 5) + 1;
    showDgPanels(true, false, false);
    setEvent('danger', '💀 The minions are defeated. The final chamber opens. The boss awaits.');
    say('Gauntlet complete. All waves defeated. The boss chamber opens. Prepare for the final fight.');
    sfx('sfx-victory'); vibe && vibe(VIBE.gauntletClear);
    setTimeout(function() { startCombat(true); }, 2000);
  }
}

function startEliteGauntlet() {
  // Pick a tough tier 3 enemy as the elite guard — must use correct dungeon pool
  var isAsh      = DS.dungeon === 'The Ashbound Wastes';
  var isFrost    = DS.dungeon === 'Frosthold Abyss';
  var isNM       = DS.diff === 'Nightmare';
  var isSunken   = DS.dungeon === 'The Sunken Archives';
  var isHollow   = DS.dungeon === 'The Hollow';
  var isWhisper  = DS.dungeon === 'The Whispering Forest';
  var isInfernal = DS.dungeon === 'The Infernal Descent';
  var isAbyssal  = DS.dungeon === 'The Abyssal Deep';
  var pool = isNM       ? NIGHTMARE_ENEMIES.t3
           : isAsh      ? ASH_ENEMIES.t3
           : isFrost    ? FROST_ENEMIES.t3
           : isSunken   ? SUNKEN_ENEMIES.t3
           : isHollow   ? HOLLOW_ENEMIES.t3
           : isWhisper  ? WHISPER_ENEMIES.t3
           : isInfernal ? INFERNAL_ENEMIES.t3
           : isAbyssal  ? ABYSSAL_ENEMIES.t3
           : ENEMIES.t3;
  var base = pool[Math.floor(Math.random() * pool.length)];
  var ngMult = DS.ngPlus ? 1.20 : 1.0;
  var diffMult = DS.diff === 'Nightmare' ? 1.5 : DS.diff === 'Forsaken' ? 1.3 : DS.diff === 'Condemned' ? 1.15 : 1.0;
  DS.enemy = {
    name: base.name, icon: base.icon, gold: base.gold,
    hp: Math.round(base.hp * 1.5 * ngMult * diffMult),
    atk: [Math.round(base.atk[0] * 1.3 * ngMult), Math.round(base.atk[1] * 1.3 * ngMult)],
    maxHp: 0, isElite: true
  };
  DS.enemy.maxHp = DS.enemy.hp;
  var eliteMsg = '⚡ ELITE GUARDIAN — ' + DS.enemy.name + ' stands between you and the final chamber. It is significantly stronger than its kin.';
  setEvent('danger', eliteMsg);
  say('Elite Guardian encountered on floor 10. ' + DS.enemy.name + ' blocks the path to the boss. HP: ' + DS.enemy.hp + '. Defeat it to face the final boss.');
  setTimeout(function() { startCombat(false); }, 1200);
}

