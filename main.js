white = [255,255,255];
red = [255,0,0];
blue = [0,0,255];
green = [0,255,0];
dim = [1,1,1];
black = [0,0,0];
purple = [128, 0, 128];
teal = [0, 128, 128];

gs = {
  calibrating: false,
  mode: 'pc',
  playing: false,
  colors: [0,0,0,0,0],
  lightMapping: lightMapping || [1,2,3,4,5],
}

$(document).ready(function() {
  if (userId) $('#user-id').val(userId);
  if (ipAddress) $('#ip-address').val(ipAddress);

  for (var i=0; i<5; i++) {
    var $light = $(document.createElement('div'));
    $light.addClass('light');
    $('#lights').append($light);
  }

  $('#mode-hue').click(function() {
    if (gs.mode == 'hue') return;
    gs.mode = 'hue';

    $(this).addClass('selected');
    $('#mode-pc').removeClass('selected');
    $('.light').addClass('inactive');

    $('#hue-settings').css({display:'flex'});
    setTimeout(()=>$('#hue-settings').animate({opacity:1},200), 300);
    setTimeout(()=>
      $('#mode-toggle, #mode-label').animate({'bottom':'+=110'}),
      100);
  });

  $('#mode-pc').click(function() {
    if (gs.mode == 'pc') return;
    gs.mode = 'pc';

    $(this).addClass('selected');
    $('#mode-hue').removeClass('selected');
    $('.light').removeClass('inactive');

    $('#hue-settings').animate({opacity:0},200);
    setTimeout(()=>
      $('#mode-toggle, #mode-label').animate(
        {'bottom':'-=110'},
        ()=>$('#hue-settings').css({display:'none'})
      ),
      100);
  });

  $('#calibrate').click(function(){
    var currIp = $('#ip-address').val();
    var currId = $('#user-id').val();
    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: `http://${currIp}/api/${currId}/`,
      success: function(data) {
        if (data.length==1 && data[0].error) {
          alert("Invalid user ID");
        }
        else calibrateLights(data);
      },
      error: function(data) {
        alert ('Invalid IP address');
      }
    });
  });

  $('.light').click(function(){
    if (!gs.calibrating) return;

    var clickedIndex = $(this).index()-1;
    gs.lightMapping[clickedIndex] = lights[lightIndex];

    setLight(lights[lightIndex], '{"on": false}');
    lightIndex++;
    if (lightIndex < lights.length) {
      setLight(lights[lightIndex], '{"on": true, "bri": 180}');
    } else {
      gs.calibrating = false;
      setTimeout(()=>flourishLights(), 1000);
    }
  });

  $('#start').click(function(){
    if (gs.playing) return;

    startGame();

    $('#start, #controls').hide();
    $('#stop').show();

    gs.playing = true;
    gs.updating = true;
    updateGameState();
  });

  $('#stop').click(function(){
    if (!gs.playing) return;

    $(this).hide();
    $('#start, #controls').show();

    gs.playing = false;
    gs.updating = false;

    resetColors();
    if (gs.mode == 'pc') updateLights();
    else resetLights();

  });

  $(document).keydown(function(e){
    if (!gs.playing) return;
    switch(e.which) {
      case 37: // left arrow
        gs.playerIndex = (gs.playerIndex+4)%5;
        break;
      case 39: // right arrow
        gs.playerIndex = (gs.playerIndex+1)%5;
        break;
      case 32: // space bar (for testing)
        levelUp();
        break;
      default:
        break;
    }
    updateColors();
    updateLights();
  });
});

function startLevel() {
  gs.oldColors = [0,0,0,0,0];
  gs.playerIndex = 2;
  gs.leftEnemies = [];
  gs.rightEnemies = [];
  gs.startTime = Date.now();
}

function startGame() {
  gs.level = 1;
  gs.updating = false;
  gs.rate = 400;

  startLevel();
}

function addLeftEnemy() {
  gs.leftEnemies.push(4);
}

function addRightEnemy() {
  gs.rightEnemies.push(0);
}

function levelUp() {
  gs.updating = 0;
  gs.playing = 0;
  for (var i=0; i<6; i++) {
    var func = i%2 ? flashLights : turnOffLights;
    setTimeout(func, 600*i);
  }
  setTimeout(()=>{
    if (gs.level < 5) gs.level++;
    gs.updating = 1;
    gs.playing = 1;
    startLevel();
    updateGameState();
  }, 4200);
}

function updateGameState() {
  if (!gs.updating) return;

  if (gs.rightEnemies.indexOf(gs.playerIndex)+
      gs.leftEnemies.indexOf(gs.playerIndex) > -2) {
    gs.updating = 0;
    gs.playing = 0;
    alert("Gameover :(");
    return;
  }

  gs.leftEnemies = gs.leftEnemies.reduce((c,v)=>{
    if (v>0) c.push(v-1);
    return c;
  }, []);

  gs.rightEnemies = gs.rightEnemies.reduce((c,v)=>{
    if (v<4) c.push(v+1);
    return c;
  }, []);

  var levelDuration;
  switch (gs.level) {
    case 1:
      levelDuration = 10;
      if (Math.random() > 0.7 && gs.rightEnemies.length == 0) {
        addRightEnemy();
      }
      break;
    case 2:
      levelDuration = 20;
      if (Math.random() > 0.65 &&
          gs.leftEnemies.length+gs.rightEnemies.length == 0) {
        if (Math.random()>0.5) addLeftEnemy();
        else addRightEnemy();
      }
      break;
    case 3:
      levelDuration = 20;
      if (Math.random() > 0.6
          && gs.rightEnemies.length < 2
          && gs.rightEnemies.indexOf(4) == -1) {
        addRightEnemy();
      }
      break;
    case 4:
      levelDuration = 16;
      if (Math.random() > 0.6
          && gs.leftEnemies.length < 3
          && gs.leftEnemies.indexOf(0) == -1) {
        addLeftEnemy();
      }
      break;
    case 5:
      levelDuration = 12;
      if (Math.random() > 0.6 &&
          gs.leftEnemies.length+gs.rightEnemies.length < 2) {
        if (Math.random()>0.5) addLeftEnemy();
        else addRightEnemy();
      }
      break;
    default:
      break;
  }

  levelDuration *= 1000;
  if (Date.now()-gs.startTime > levelDuration) {
    levelUp();
    return;
  }

  updateColors();
  updateLights();

  setTimeout(()=>updateGameState(), gs.rate);
}

function updateColors() {
  for (var i=0; i<5; i++) {
    gs.colors[i] = i == gs.playerIndex ? white : dim;
  }
  for (var i=0; i< gs.leftEnemies.length; i++) {
    gs.colors[gs.leftEnemies[i]] = blue;
  }
  for (var i=0; i< gs.rightEnemies.length; i++) {
    var newColor = gs.colors[gs.rightEnemies[i]]==blue ? purple : red;
    gs.colors[gs.rightEnemies[i]] = newColor;
  }
}

function updateLights() {
  for (var i = 0; i < 5; i++) {
    if (gs.mode == 'pc') {
      $('.light').each(function(i){
        $(this).css('background-color', rgbToStr(gs.colors[i]));
      });
    } else {
      if (gs.oldColors[i] == gs.colors[i]) continue;

      var state;
      if (gs.colors[i] == black) state = '{"on": false}';
      else {
        var xy = rgb_to_cie.apply(null, gs.colors[i]);
        var bri = Math.max.apply(null, gs.colors[i]);
        state = `{"xy": [${xy}],
                  "bri": ${bri},
                  "transitiontime": 0}`;
      }
      setLight(gs.lightMapping[i], state);
      gs.oldColors[i] = gs.colors[i];
    }
  }
}

function calibrateLights(data) {
  lights = getReachableLights(data);
  if (lights.length < 5) {
    alert("Not enough lights available");
    return;
  }

  gs.calibrating = true;
  lightIndex = 0;

  turnOffLights(lights);
  setLight(lights[lightIndex], '{"on": true, "bri": 180}');
}

function getReachableLights(data) {
  var lights = data.lights;
  var reachableLights = Object.keys(lights).reduce((r,k)=>{
    if (lights[k].state.reachable) r.push(k);
    return r;
  }, []);
  return reachableLights;
}

function turnOffLights(lights) {
  var state = '{"on": false, "transitiontime":0}';
  if (lights) {
    for (var i = 0; i < lights.length; i++) {
      setLight(lights[i], state);
    }
  } else if (gs.mode == 'hue') {
    for (var i=0; i<5; i++) {
      setLight(lightMapping[i], state);
    }
  } else {
    gs.colors = [];
    for (var i=0; i<5; i++) {
      gs.colors.push(black);
    }
    updateLights();
  }
}

function flashLights() {
  if (gs.mode == 'hue') {
    for (var i=0; i<5; i++) {
      setLight(lightMapping[i],
          '{"on": true, "bri": 254, "sat":0, "transitiontime":0}'
      );
    }
  } else {
    gs.colors = [];
    for (var i=0; i<5; i++) {
      gs.colors.push(white);
    }
    updateLights();
  }
}

function setLight(light, state) {
  var currIp = $('#ip-address').val();
  var currId = $('#user-id').val();

  $.ajax({
    type: 'PUT',
    dataType: 'json',
    data: state,
    url: `http://${currIp}/api/${currId}/lights/${light}/state`
  });
}

function flourishLights() {
  turnOffLights(gs.lightMapping);
  for (var i = 0; i < 5; i++) {
    setTimeout(setLight.bind(null,gs.lightMapping[i],'{"on": true}'),
               400*i);
  }
}

function resetColors() {
  gs.colors = [];
  for (var i=0; i<5; i++) {
    gs.colors.push(white);
  }
}

function resetLights() {
  for (var i=0; i<5; i++) {
    setLight(gs.lightMapping[i],
             '{"hue":10000, "bri":200, "sat":75}');
  }
}

function rgbToStr(rgb) {
  return 'rgb('+rgb.join(', ')+')';
}
