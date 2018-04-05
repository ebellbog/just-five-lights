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
  colors: [red, dim, blue, black, green],
  lightMapping: lightMapping || [1,2,3,4,5],
  playerIndex: 2
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
      setLight(lights[lightIndex], '{"on": true}');
    } else {
      gs.calibrating = false;
      setTimeout(()=>flourishLights(), 1000);
    }
  });

  $('#start').click(function(){
    if (gs.playing) return;

    updateColors();
    updateLights();

    $('#start, #controls').hide();
    $('#stop').show();

    gs.playing = true;
  });

  $('#stop').click(function(){
    if (!gs.playing) return;

    $(this).hide();
    $('#start, #controls').show();

    resetColors();
    if (gs.mode == 'pc') updateLights();
    else resetLights();

    gs.playing = false;
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
      default:
        break;
    }
    updateColors();
    updateLights();
  });
});

function updateColors() {
  for (var i = 0; i < 5; i++) {
    gs.colors[i] = i == gs.playerIndex ? white : dim;
  }
}

function updateLights() {
  for (var i = 0; i < 5; i++) {
    if (gs.mode == 'pc') {
      $('.light').each(function(i){
        $(this).css('background-color', rgbToStr(gs.colors[i]));
      });
    } else {
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
  setLight(lights[lightIndex], '{"on": true}');
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
  for (var i = 0; i < lights.length; i++) {
    setLight(lights[i], '{"on": false}');
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
