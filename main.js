white = [255,255,255];
red = [255,0,0];
blue = [0,0,255];
green = [0,255,0];
dim = [1,1,1];
black = [0,0,0];
purple = [128, 0, 128];
teal = [0, 128, 128];

levelData = [
  {'multiplier': 1, 'duration': 10},
  {'multiplier': 1, 'duration': 20},
  {'multiplier': 2, 'duration': 20},
  {'multiplier': 3, 'duration': 18},
  {'multiplier': 5, 'duration': 1000}
]

gs = {
  calibrating: false,
  mode: 'pc',
  playing: false,
  levelsUnlocked: 0,
  colors: [0,0,0,0,0],
  lightMapping: lightMapping || [1,2,3,4,5],
}

function getMultiplier() {
  return levelData[gs.level-1].multiplier;
}

function getDuration() {
  return levelData[gs.level-1].duration*1000;
}

$(document).ready(function() {
  if (userId) $('#user-id').val(userId);
  if (ipAddress) $('#ip-address').val(ipAddress);

  for (var i=0; i<5; i++) {
    var $light = $(document.createElement('div'));
    $light.addClass('light');
    $('#lights').append($light);

    var $levelBtn = $(document.createElement('div'));
    $levelBtn.html(`lv.${i+1}`);
    $('#level-btns').append($levelBtn);
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
  });

  $('#stop').click(function(){
    if (!gs.updating) return;

    $(this).hide();
    $('#start, #controls').show();
    $('#score').css('visibility', 'hidden');

    gs.playing = false;
    gs.updating = false;

    resetColors();
    if (gs.mode == 'pc') updateLights();
    else resetLights();

    updateLevelBtns();
  });

  $('#level-btns').on('click','.unlocked', (e)=>{
    var level = $(e.target).index()+1;
    startGame(level);
  });

  $(document).keydown(function(e){
    switch(e.which) {
      case 13: // return
        if (gs.updating) $('#stop').click();
        else if (!gs.playing) $('#start').click();
        break;
      case 37: // left arrow
        if (gs.updating) gs.playerIndex = (gs.playerIndex+4)%5;
        break;
      case 39: // right arrow
        if (gs.updating) gs.playerIndex = (gs.playerIndex+1)%5;
        break;
      default:
        break;
    }

    if (gs.updating) {
      updateColors();
      updateLights();
    }
  });
});

function startLevel() {
  gs.oldColors = [0,0,0,0,0];
  gs.playerIndex = 2;
  gs.leftEnemies = [];
  gs.rightEnemies = [];
  gs.startTime = Date.now();
  gs.levelsUnlocked = Math.max(gs.levelsUnlocked, gs.level);

  var multiplier = getMultiplier();
  if (multiplier > 1) {
    $('#score div:nth-child(3)').html(`x${multiplier}`).show();
  }
}

function startGame(level) {
  $('#start, #controls, #score div:nth-child(3)').hide();
  $('#stop').show();
  $('#score').css('visibility', 'visible');
  $('#level-btns').css('visibility', 'hidden');

  gs.level = level || 1;
  gs.score = 0;
  gs.rate = 500;

  startLevel();

  gs.playing = true;
  gs.updating = true;
  updateGameState();
}

function addLeftEnemy() {
  gs.leftEnemies.push(4);
}

function addRightEnemy() {
  gs.rightEnemies.push(0);
}

function levelUp() {
  if (gs.level >= 5) return;

  gs.updating = 0;
  for (var i=0; i<6; i++) {
    var func = i%2 ? flashLights : turnOffLights;
    setTimeout(func, 600*i);
  }
  setTimeout(()=>{
    gs.level++;
    gs.updating = 1;
    startLevel();
    updateGameState();
  }, 4200);
}

function updateLevelBtns() {
  if (!gs.levelsUnlocked ) return;

  $('#level-btns').css('visibility','visible');
  $('#level-btns div').each((i,div)=>{
    if (i < gs.levelsUnlocked) $(div).addClass('unlocked');
  });
}

function updateGameState() {
  if (!gs.updating) return;

  if (gs.rightEnemies.indexOf(gs.playerIndex)+
      gs.leftEnemies.indexOf(gs.playerIndex) > -2) {
    alert("Gameover :(");
    setTimeout(()=>$('#stop').click(), 500);
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

  switch (gs.level) {
    case 1:
      if (Math.random() > 0.7 && gs.rightEnemies.length == 0) {
        addRightEnemy();
      }
      break;
    case 2:
      gs.rate = 450;
      if (Math.random() > 0.65 &&
          gs.leftEnemies.length+gs.rightEnemies.length == 0) {
        if (Math.random()>0.5) addLeftEnemy();
        else addRightEnemy();
      }
      break;
    case 3:
      gs.rate = 400;
      if (Math.random() > 0.6
          && gs.rightEnemies.length < 2
          && gs.rightEnemies.indexOf(4) == -1) {
        addRightEnemy();
      }
      break;
    case 4:
      if (Math.random() > 0.6
          && gs.leftEnemies.length < 3
          && gs.leftEnemies.indexOf(0) == -1) {
        addLeftEnemy();
      }
      break;
    case 5:
      if (Math.random() > 0.6 &&
          gs.leftEnemies.length+gs.rightEnemies.length < 2) {
        if (Math.random()>0.5) addLeftEnemy();
        else addRightEnemy();
      }
      break;
    default:
      break;
  }

  if (Date.now()-gs.startTime > getDuration()) {
    levelUp();
    return;
  }

  gs.score += getMultiplier();
  $('#score div:nth-child(2)').html(gs.score);

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

  var reqStart = Date.now();
  $.ajax({
    type: 'PUT',
    dataType: 'json',
    data: state,
    url: `http://${currIp}/api/${currId}/lights/${light}/state`,
    success: ()=>{
      var latency = Date.now()-reqStart;
      if (latency > 250) {
        alert("Warning: lights unresponsive due "+
              "to low network speeds");
      }
    }
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
