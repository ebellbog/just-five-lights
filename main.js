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

cs = { // calibration state
  calibrating: false,
  reachable: [],
  index: -1
}

gs = { // game state
  mode: 'pc',
  playing: false,
  levelsUnlocked: 0,
  highScore: 0,
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
    if (cs.calibrating) return;
    $('#spinner-wrapper').show();

    var currIp = $('#ip-address').val();
    var currId = $('#user-id').val();

    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: `https://${currIp}/api/${currId}/`,
      success: function(data) {
        if (data.length==1 && data[0].error) {
          alert("Invalid user ID");
          $('#spinner-wrapper').hide();
        }
        else calibrateLights(data);
      },
      error: function(data) {
        alert ('Invalid IP address. Please make sure your '+
               'Hue bridge has the latest firmware.');
        $('#spinner-wrapper').hide();
      }
    });
  });

  $('.light').click(function(e){
    e.stopPropagation();
    if (!cs.calibrating) return;

    var clickedIndex = $(this).index()-1;
    gs.lightMapping[clickedIndex] = cs.reachable[cs.index];

    advanceCalibration();
  });

  $('body').click(function() {
    if (!cs.calibrating || cs.reachable.length == 5) return;
    advanceCalibration();
  });

  $('#start').click(function(){
    if (gs.playing) return;
    if (cs.calibrating) {
      alert("Please click circles to finish calibrating.");
      return;
    }
    startGame();
  });

  $('#stop').click(function(){
    if (!gs.updating) return;
    endGame();
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

  // attempt redirect to http host
  window.top.location.href="http://elanabellbogdan.com/just_five_lights";
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

  $('#lvl-number').html(`Level ${gs.level}`);

  updateHints();
}

function startGame(level) {
  $('#start, #controls, #score div:nth-child(3), #hi-score').hide();
  $('#stop').show();
  $('#score, #hints').css('visibility', 'visible');
  $('#level-btns').css('visibility', 'hidden');

  gs.level = level || 1;
  gs.score = 0;
  gs.rate = 500;
  gs.alerted = false;
  gs.latencyWarnings = 0;

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

function updateHighScore() {
  if (!gs.highScore) return;

  $('#hi-score').show();
  $('#hi-wrapper :nth-child(2)').html(`${gs.highScore} pts`);
}

function updateHints() {
  $('#rarr, #larr').removeClass('active');
  $('#balls').empty();

  var $ball = $(document.createElement('div'))
              .addClass('ball').html('!');
  var $redBall = $ball.clone().addClass('red');
  var $blueBall = $ball.clone().addClass('blue');

  var $conj = $(document.createElement('div'))
              .addClass('conjunction');
  var $or = $conj.clone().addClass('or').html('&#47;');
  var $and = $conj.clone().addClass('and').html('&amp;');

  switch(gs.level) {
    case 1:
      $('#rarr').addClass('active');
      $('#balls').append($redBall);
      break;
    case 2:
      $('#rarr').addClass('active');
      $('#larr').addClass('active');
      $('#balls').append($blueBall)
                 .append($or)
                 .append($redBall);
      break;
    case 3:
      $('#rarr').addClass('active');
      $('#balls').append($redBall.clone())
                 .append($redBall);
      break;
    case 4:
      $('#larr').addClass('active');
      $('#balls').append($blueBall.clone())
                 .append($blueBall.clone())
                 .append($blueBall);
      break;
    case 5:
      $('#rarr').addClass('active');
      $('#larr').addClass('active');
      $('#balls').append($blueBall)
                 .append($and)
                 .append($redBall);
      break;
    default:
      break;
  }
}

function endGame() {
  $('#start, #controls').show();
  $('#score, #hints').css('visibility', 'hidden');
  $('#stop').hide();

  gs.playing = false;
  gs.updating = false;

  resetColors();
  if (gs.mode == 'pc') updateLights();
  else resetLights();

  updateLevelBtns();
  updateHighScore();
}

function gameOver() {
  gs.updating = false;

  var light = gs.playerIndex;
  var losingColor = gs.colors[light];

  var func = (light, color)=>{
    gs.colors[light] = color;
    updateLights();
  };

  for (var i=0; i<6; i++) {
    var color = i%2 ? losingColor : white;
    setTimeout(func.bind(null, light, color), 250*i);
  }

  setTimeout(()=>{
    if (gs.score > gs.highScore) {
      gs.highScore = gs.score;
      alert(`Game over - but hey, ${gs.score} is a new high score!`);
    } else {
      alert("Game over :(");
    }
    setTimeout(endGame, 300);
  }, 1900);
}

function updateGameState() {
  if (!gs.updating) return;

  if (gs.rightEnemies.indexOf(gs.playerIndex)+
      gs.leftEnemies.indexOf(gs.playerIndex) > -2) {
    gameOver();
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
      if (Date.now()-gs.startTime < 1200) break;
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
  cs.reachable = getReachableLights(data);
  if (cs.reachable.length < 5) {
    alert("Not enough lights available");
    return;
  }

  alert("Click the circle corresponding to each light that "+
        "turns on. To skip a light, click anywhere else.");

  cs.calibrating = true;
  cs.index = 0;

  turnOffLights(cs.reachable);
  setLight(cs.reachable[0], '{"on": true, "bri": 200}');
}

function advanceCalibration() {
  if (!(cs.reachable && cs.index > -1)) return;

  setLight(cs.reachable[cs.index], '{"on": false}');
  cs.index++;
  if (cs.index < cs.reachable.length) {
    setLight(cs.reachable[cs.index], '{"on": true, "bri": 200}');
  } else {
    cs.calibrating = false;
    cs.index = -1;

    $('#spinner-wrapper').hide();
    setTimeout(()=>flourishLights(), 1000);
  }
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
    for (var i = 0; i < gs.lightMapping.length; i++) {
      setLight(gs.lightMapping[i], state);
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
      setLight(gs.lightMapping[i],
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
    url: `https://${currIp}/api/${currId}/lights/${light}/state`,
    success: ()=>{
      var latency = Date.now()-reqStart;
      if (latency > 250) gs.latencyWarnings++;
      if (gs.latencyWarnings > 3 && !gs.alerted) {
        gs.alerted = true;
        alert("Warning: lights unresponsive due "+
              "to low network speeds");
        $('#stop').click();
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
             '{"on":true, "hue":10000, "bri":200, "sat":75}');
  }
}

function rgbToStr(rgb) {
  return 'rgb('+rgb.join(', ')+')';
}
