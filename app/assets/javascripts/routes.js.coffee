# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

$(window).load ->
  $( ".toolbox,.debug_dump" ).draggable();
  $( "#controls" ).offset({top: $('#tools').offset().top + $('#tools').outerHeight() + 4, left: $('#controls').offset().left});

$(window).resize ->
  $( "#surface-container" ).height($('#bottom-anchor').offset().top - 41);
  stravaOnSteroids.redraw();
