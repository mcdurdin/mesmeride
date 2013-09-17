# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

$(document).on "page:change", -> 
  stravaActivityCoffee()

$ -> stravaActivityCoffee()

stravaActivityCoffee = ->
  
  if $('body').data('controller') == 'strava_activities' && $('body').data('action') == 'new'
    
    $('#recent-activities td a.btn').click ->
      
      $('#strava_activity_activity_id').val($(this).data('id'))
      $('#new_strava_activity').submit()
      