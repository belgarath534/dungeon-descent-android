// Drives the real Android app on an emulator (Android crash test workflow):
// opens every main-menu option, plays a dungeon a little, and goes back to
// the main menu, over and over, the way Ironic's game crashed. Checks after
// each step that the app is still running; the workflow keeps logcat.
const { _android } = require('playwright');
const PKG = 'com.dungeon.descent';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const [device] = await _android.devices();
  if (!device) throw new Error('No emulator');
  console.log('Device:', device.model(), device.serial());
  await device.shell(`am start -n ${PKG}/.MainActivity`);
  await sleep(15000);
  const alive = async () => String(await device.shell(`pidof ${PKG}`)).trim().length > 0;
  const mem = async () => {
    const out = String(await device.shell(`dumpsys meminfo ${PKG} | grep -E "TOTAL PSS|TOTAL:" | head -1`)).trim();
    const sb = String(await device.shell(`dumpsys meminfo | grep -i "sandboxed_process" | head -3`)).trim();
    return out + (sb ? ' | renderer: ' + sb.replace(/\s+/g, ' ') : '');
  };
  const pid0 = String(await device.shell(`pidof ${PKG}`)).trim();
  console.log('App pid:', pid0);
  let webview = await device.webView({ pkg: PKG }, { timeout: 60000 });
  let page = await webview.page();
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text().slice(0, 300)); });
  await sleep(8000);
  console.log('Started. Memory:', await mem());

  // Dismiss first-launch popups.
  // Only visible popups, and never a button that quits or exits: the pause
  // menu's "✕ Quit Game" closed the app on purpose and looked like a crash.
  const closePopups = () => page.evaluate(() => {
    document.querySelectorAll('.overlay.active button, .ov.active button, [role=dialog] button').forEach((b) => {
      const t = (b.textContent || '') + ' ' + (b.getAttribute('aria-label') || '');
      if (!b.offsetParent || /quit|exit|leave|abandon|delete|sign out/i.test(t)) return;
      if (/close|continue|ok|not now|got it|skip|✕/i.test(t)) try { b.click(); } catch (e) {}
    });
    document.getElementById('dd-choice-modal')?.remove();
  }).catch(() => {});
  await closePopups();

  // Diagnostic (DIAG=1): each native setup on its own, to see which one
  // tears down the game's screen.
  if (process.env.DIAG) {
    for (const fn of ['(nothing, just wait)', '(nothing, just wait)', 'initAdMob', 'initGooglePlayGames', 'initIAP', 'initNetwork', 'initBackButton', 'initStatusBar', 'initScreenReader']) {
      try {
        console.log(`DIAG calling ${fn}()`);
        console.log(`DIAG ${new Date().toISOString()} before ${fn}`);
        await page.evaluate((fn) => { window._ddAdMobStarted = false; window._ddIAPStarted = false; if (window[fn]) try { window[fn](); } catch (e) { console.error(fn + ': ' + e.message); } }, fn);
        await sleep(fn.startsWith('(') ? 20000 : 9000);
        await page.evaluate(() => 1 + 1);
        console.log(`DIAG ${fn}: the game's screen survived`);
      } catch (e) {
        console.log(`DIAG ${fn}: THE GAME'S SCREEN DIED (${e.message.split('\n')[0]})`);
        await sleep(8000);
        await device.shell(`am start -n ${PKG}/.MainActivity`);
        await sleep(8000);
        const views = await device.webViews();
        webview = views[views.length - 1] || await device.webView({ pkg: PKG }, { timeout: 60000 });
        page = await webview.page();
        await sleep(8000);
      }
    }
    process.exit(0);
  }

  // Every main-menu button that opens something in the game.
  const options = await page.evaluate(() => Array.from(document.querySelectorAll('#screen-menu button'))
    .map((b, i) => ({ i, label: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 60), onclick: b.getAttribute('onclick') || '' }))
    .filter((o) => o.label && !/delete|reset|sign out|log out|discord|youtube|privacy|terms|support|rate|website|redeem|quit/i.test(o.label + o.onclick)));
  console.log(`${options.length} menu options:`, options.map((o) => o.label).join(' | '));

  const backToMenu = async () => {
    await page.evaluate(() => {
      const back = Array.from(document.querySelectorAll('.screen.active button')).find((b) => b.offsetParent && /← ?(menu|back)|main menu|back to menu/i.test(b.textContent + ' ' + (b.getAttribute('aria-label') || '')));
      if (back) back.click(); else if (typeof goHome === 'function') goHome(); else goTo('menu');
    }).catch(() => {});
    await sleep(2500);
  };

  let step = 0;
  const check = async (what) => {
    step++;
    const ok = await alive();
    console.log(`${String(step).padStart(3)} ${ok ? 'OK  ' : 'DEAD'} ${what} — ${ok ? await mem() : ''}`);
    if (!ok) { console.log('THE APP CRASHED at: ' + what); process.exit(1); }
  };

  for (let round = 1; round <= 3; round++) {
    console.log(`— Round ${round} —`);
    for (const o of options) {
      try {
        await page.evaluate((i) => { const b = document.querySelectorAll('#screen-menu button')[i]; if (b) b.click(); }, o.i);
        await sleep(4000);
        await closePopups();
        await check(`opened "${o.label}"`);
        await backToMenu();
        await check(`back to menu from "${o.label}"`);
      } catch (e) {
        await sleep(3000);
        const pid = String(await device.shell(`pidof ${PKG}`)).trim();
        console.log(`THE GAME'S PAGE DIED after "${o.label}" (${e.message.split('\n')[0]}). App pid now: "${pid}" (was ${pid0}).`);
        process.exit(1);
      }
    }
    // A dungeon run: create a character, walk some rooms and fights, then the menu.
    try {
      await page.evaluate(() => {
        NC.name = 'Crash Bot'; NC.cls = 'Warrior'; NC.race = 'Human'; NC.prof = 'Blacksmith'; NC.dungeon = 'Crypt of Malachar'; NC.diff = 'Wanderer';
        finalizeChar(); playChar(CHARS.length - 1);
      });
      await sleep(5000); await closePopups();
      for (let k = 0; k < 15; k++) {
        await page.evaluate((k) => {
          document.getElementById('dd-choice-modal')?.remove();
          if (DS.inCombat && DS.enemy) doFight('attack');
          else { const eb = document.querySelector('#dg-event button'); if (eb && eb.offsetParent) eb.click(); else moveRoom(['north', 'east', 'west'][k % 3]); }
        }, k);
        await sleep(1800);
      }
      await check('played a dungeon');
      await backToMenu();
      await check('back to menu from the dungeon');
    } catch (e) { console.log('  (dungeon step: ' + e.message.split('\n')[0] + ')'); }
  }
  console.log('NO CRASH in ' + step + ' steps.');
  await device.close();
})().catch((e) => { console.error(e); process.exit(2); });
