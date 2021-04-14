exports.NetworkMod = function mapper(d) {
  let opened = false,
    focused = null,
    focusChange = true,
    moving = false,
    delayToggle = true,
    probablyBaldera = false

  if (!global.TeraProxy.GUIMode)
    throw new Error('Proxy GUI is not running!');

  const { Host } = require('tera-mod-ui');
  const path = require("path")
  let ui = new Host(d, 'index.html', {
    title: 'BalderaMap',
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    maximizable: false,
    fullscreen: false,
    fullscreenable: false,
    skipTaskBar: false,
    width: 350,
    height: 311,
    resizable: false,
    center: true,
    x: d.settings.windowPos[0],
    y: d.settings.windowPos[1],
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: { nodeIntegration: true, devTools: false }
  }, false, path.join(__dirname, 'ui'))

  d.game.on('leave_game', () => { ui.close(); d.clearAllIntervals(); })

  async function moveTop() {
    focused = await d.clientInterface.hasFocus()
    if (!focused && focusChange && !moving) { ui.hide(); focusChange = false; }
    if (focused && !focusChange) { ui.show(); focusChange = true; }
    if (focused) ui.window.moveTop()
  }

  d.command.add(['balderamap', 'bmap'], (arg) => {
    if (!opened && !arg || !opened && ['open', 'gui', 'ui'].includes(arg)) {
      opened = true
      ui.show();
      ui.window.setPosition(d.settings.windowPos[0], d.settings.windowPos[1]);
      ui.window.setAlwaysOnTop(true, 'screen-saver', 1);
      ui.window.setVisibleOnAllWorkspaces(true);
      d.setInterval(() => { moveTop() }, 1000);
      ui.window.on('move', () => { moving = true; })
      ui.window.on('moved', () => { d.setTimeout(() => { moving = false; }, 500) })
      ui.window.on('resized', () => { d.setTimeout(() => { moving = false; }, 500) })
      ui.window.on('close', () => { d.settings.windowPos = ui.window.getPosition(); opened = false; d.clearAllIntervals() });
    }
  })

  d.hook('S_LOAD_TOPO', '*', { order: 999999, filter: { fake: null } }, (e) => {
    if (e.zone == 1){
      if (e.loc.x > 122879){ probablyBaldera = true } // So like, Zone 1 is more than just Baldera. It's also Velika Wilds, a pretty slammin' afk spot.
      else if (e.loc.x < 122878){ probablyBaldera = false } // If you aren't (likely) in Baldera, the minimap should automatically close, since you probably aren't in Baldera.
      if (probablyBaldera && !opened) { d.command.exec('balderamap') }
      if (!probablyBaldera && opened){ ui.close(); }
    }
    if (e.zone !== 1){
      if (opened){ ui.close(); }
    }
  })

  // These hook your location (C_PLAYER_LOCATION literally, and S_ACTION_END at the end result of skills) to update your circle on the minimap.
  d.hook('C_PLAYER_LOCATION', '*', (e) => { if (delayToggle && opened) { playerLocUpdate(e.loc) };})
  d.hook('S_ACTION_END', '*', { order: 999999, filter: { fake: null } }, (e) => { if (d.game.me.is(e.gameId) && delayToggle && opened) { playerLocUpdate(e.loc) } })

  function playerLocUpdate(loc) {
    delayToggle = false
    ui.send('playerUpdate', { text: [Math.round(loc.x - 119329) / 25, Math.round(loc.y - 4000) / 25] })
    setTimeout(() => { delayToggle = true }, 250);
  }
}