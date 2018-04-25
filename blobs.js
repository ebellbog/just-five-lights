gs = {
  playerIndex: 0,
  moving: false,
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

  $('body').keydown(function(e) {
    var small = {
      width: '10px',
      height: '10px',
      'border-radius': '5px'
    };

    var medium = {
      width: '66px',
      height: '66px',
      'border-radius': '33px'
    };

    var large = {
      width: '78px',
      height: '78px',
      'border-radius': '39px'
    };

    switch(e.which) {
      case 37:
        if (gs.moving) return;
        if (gs.playerIndex == 0) {
          gs.playerIndex = 4;
          gs.moving = true;
          $('.player').animate(
            small, 
            gs.duration/3, ()=>{
              $('.player').css('left','80%');
              $('.player').animate(
                large, 
                gs.duration/3, 
                ()=>{
                  $('.player').animate(
                    medium,
                    200,
                    ()=>gs.moving=false)})
            });
        } else {
          gs.playerIndex--;
          gs.moving = true;
          $('.player').animate({left: `${gs.playerIndex*15+20}%`}, 
                                gs.duration, 
                                ()=>{gs.moving=false});
        }
        break;
      case 39:
        if (gs.moving) return;
        if (gs.playerIndex == 4) {
          gs.playerIndex = 0;
          gs.moving = true;
          $('.player').animate(
            small, 
            gs.duration/3, ()=>{
              $('.player').css('left','20%');
              $('.player').animate(
                large, 
                gs.duration/3, 
                ()=>{
                  $('.player').animate(
                    medium,
                    200,
                    ()=>gs.moving=false)})
            });
        } else {
          gs.playerIndex++;
          gs.moving = true;
          $('.player').animate({left: `${gs.playerIndex*15+20}%`}, 
                                gs.duration, 
                                ()=>{gs.moving=false});
        }
        break;
    }
  });
});
