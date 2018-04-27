const small = {
  width: '10px',
  height: '10px',
  'border-radius': '5px'
}
const medium = {
  width: '66px',
  height: '66px',
  'border-radius': '33px'
}
const large = {
  width: '78px',
  height: '78px',
  'border-radius': '39px'
}

let gs = {
  playerIndex: 0,
  enemyIndex: 0,
  moving: false,
  moves: [],
  duration: 400,
  increment: 0
}

$(document).ready(function(){
  var $light = $(document.createElement('div')).addClass('light');
  var $lights = $('.lights');
  for (var i=0; i<5; i++) {
    var $newLight = $light.clone().css('left',`${15*i+20}%`);
    $lights.append($newLight);
  }

  updateEnemy();

  $('body').keydown(function(e) {

    switch(e.which) {
      case 37:
        enqueueMove(1);
        break;
      case 39:
        enqueueMove(0);
        break;
      case 68:
        gs.enemyIndex +=1;
        updateEnemy();
        break;
      case 65:
        gs.enemyIndex -=1;
        updateEnemy();
        break;
      default:
        break;
    }
  });
});

function updateEnemy() {
  var left = $(`.light:nth-child(${gs.enemyIndex+2})`)
             .position().left;
  $('.red').animate({'left':left},200);

}

// 1 = left, 0 = right
function movePlayer(direction) {
  if (gs.playerIndex == (direction ? 0 : 4)) {
    gs.playerIndex = direction ? 4 : 0;
    gs.moving = true;
    $('.player').animate(
        small,
        gs.duration/3, ()=>{
          $('.player').css('left', direction ? '80%' : '20%');
          $('.player').animate(
            large,
            gs.duration/3,
            ()=>{
              $('.player').animate(
                medium,
                200,
                ()=>processQueue())})
        });
  } else {
    gs.playerIndex += direction ? -1 : 1;
    gs.moving = true;
    $('.player').animate({left: `${gs.playerIndex*15+20}%`},
        gs.duration,
        ()=>processQueue());
  }
}

function enqueueMove(direction) {
  if (gs.moves.length < 2) {
    gs.moves.push(direction);
  }
  if (!gs.moving) {
    gs.moving = true;
    processQueue();
  }
}

function processQueue() {
  if (gs.moving && gs.moves.length) {
    movePlayer(gs.moves.shift());
  } else {
    gs.moving = false;
  }
}
