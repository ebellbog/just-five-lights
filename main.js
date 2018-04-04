calibrating = false;

$(document).ready(function() {
  if (userId) $('#user-id').val(userId);
  if (ipAddress) $('#ip-address').val(ipAddress);

  for (var i=0; i<5; i++) {
    var $light = $(document.createElement('div'));
    $light.addClass('light');
    $('#lights').append($light);
  }

  $('#mode-hue').click(function() {
    if ($(this).hasClass('selected')) return;

    $(this).addClass('selected');
    $('#mode-pc').removeClass('selected');

    $('#hue-settings').css({display:'flex'});
    setTimeout(()=>$('#hue-settings').animate({opacity:1},200), 300);
    setTimeout(()=>
      $('#mode-toggle, #mode-label').animate({'bottom':'+=110'}),
      100);
  });

  $('#mode-pc').click(function() {
    if ($(this).hasClass('selected')) return;

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
    if (!calibrating) return;

    var clickedIndex = $(this).index()-1;
    lightMapping[clickedIndex] = lights[lightIndex];

    setLight(lights[lightIndex], '{"on": false}');
    lightIndex++;
    if (lightIndex < lights.length) {
      setLight(lights[lightIndex], '{"on": true}');
    } else {
      calibrating = false;
      setTimeout(()=>flourishLights(), 1000);
    }
  });
});

function calibrateLights(data) {
  lights = getReachableLights(data);
  if (lights.length < 5) {
    alert("Not enough lights available");
    return;
  }

  calibrating = true;
  lightIndex = 0;
  lightMapping = [-1,-1,-1,-1,-1];

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
  turnOffLights(lightMapping);
  for (var i = 0; i < 5; i++) {
    setTimeout(setLight.bind(null,lightMapping[i],'{"on": true}'),
               400*i);
  }
}
