# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

$ ->
  $( ".toolbox,.debug_dump" ).draggable();

  $( "#zoom-slider" ).slider
    orientation: 'vertical', 
    change: (event,ui) -> 
      $('#surface').css('width', ui.value*10 + '%').css('height', ui.value*10 + '%')

  $( "#controls" ).offset({top: $('#tools').offset().top + $('#tools').outerHeight() + 4, left: $('#controls').offset().left});
  $( "#surface-container" ).height($('#bottom-anchor').offset().top - $('.navbar-fixed-top').outerHeight() - $('#waypoints').outerHeight());

  waypointChange = (e) ->  
    for w in waypoints 
      if w.id == $(e).data('id') 
        w.name = $(e).val();
    stravaOnSteroids.redraw();
  
  $( "#waypoints input[type='text']" ).keyup -> waypointChange this
  $( "#waypoints input[type='text']" ).change -> waypointChange this
  
$(window).resize ->
  $( "#surface-container" ).height($('#bottom-anchor').offset().top - $('.navbar-fixed-top').outerHeight() - $('#waypoints').outerHeight());
  stravaOnSteroids.redraw();
