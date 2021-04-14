document.addEventListener('DOMContentLoaded', () => {
  const { Renderer } = require('tera-mod-ui');
  let mod = new Renderer,
    player = document.getElementById("player")

  //document.getElementById("player").setAttribute('cx', 300)

  mod.on('playerUpdate', (y) => {
    player.setAttribute('cx', y.text[0])
    player.setAttribute('cy', y.text[1])
  })
})
