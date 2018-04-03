$(document).ready(function() {
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
});

