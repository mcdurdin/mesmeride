# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

modified = false

$(document).on "page:change", -> 
  routeCoffee()

  if window._gaq?
    _gaq.push ['_trackPageview']
  else if window.pageTracker?
    pageTracker._trackPageview()

$ -> routeCoffee()

routeCoffee = ->

  renderer = null

  getRenderer = ->
    if $('#route_renderer').val() == 'Giro' 
      window.mesmeride.giroRenderer 
    else if $('#route_renderer').val() == 'Le Tour'
      window.mesmeride.letourRenderer
    else
      window.mesmeride.h10KBannerRenderer
    
  updateRenderer = ->
    renderer = getRenderer()
    
    $('.renderer-controls').removeClass('visible')
    $("##{renderer.name}-renderer-controls").addClass('visible')
    
    renderer.create()
    
    renderer.zoom = $('#zoom-slider').slider('value') / 25
    renderer.scale = $('#scale-slider').slider('value') / 25
    renderer.yScale = $('#y-slider').slider('value') / 25
    renderer.cropStart = $('#crop-slider').slider('values', 0)
    renderer.cropStop = $('#crop-slider').slider('values', 1)

    if(window.renderer_options['color']) 
      $('#h10k_color').val(window.renderer_options['color'])
      renderer.color = window.renderer_options['color']
      renderer.postRedraw()
    
    renderer.postRedraw(1000);
  
  $(window).unbind('resize', windowResize)

  if $('body').data('controller') == 'routes' && $('body').data('action') == 'new'
    $('#new_route').submit()

  if $('body').data('controller') == 'routes' && $('body').data('action') == 'edit'
    
    routeDistance = window.streams.distance[window.streams.distance.length-1]
    
    if $('#crop-slider').data('stop') == 0 || $('#crop-slider').data('stop') == ''
      $('#crop-slider').data('stop', routeDistance)

    #
    # Toolboxes and resizing
    #

    $( ".toolbox,.debug_dump" ).draggable();

    $( "#zoom-slider" ).slider
      value: $('#zoom-slider').data('value')
      min: 1
      max: 100
      change: (event,ui) -> 
        renderer.zoom = ui.value / 25
        renderer.postRedraw()

    $( "#scale-slider" ).slider
      value: $('#scale-slider').data('value')
      min: 1
      max: 100
      change: (event,ui) -> 
        renderer.scale = ui.value / 25
        renderer.postRedraw()

    $( "#y-slider" ).slider
      value: $('#y-slider').data('value')
      min: 1
      max: 100
      change: (event,ui) -> 
        renderer.yScale = ui.value / 25
        renderer.postRedraw()

    #
    # Add a slider for cropping the ride
    #
        
    $( "#crop-slider" ).slider
      range: true
      values: [ $('#crop-slider').data('start'), $('#crop-slider').data('stop') ]
      min: 0
      max: routeDistance
      change: (event,ui) ->
        renderer.baseScale = 0
        renderer.baseVerticalMultiplier = 0
        renderer.cropStart = $(this).slider('values', 0)
        renderer.cropStop = $(this).slider('values', 1)
        renderer.postRedraw()
        
    #
    #  And override the default arrow behaviour for more sensible increments
    #
        
    .keydown (event) ->
    
      rangeBound = (index, otherVal, val) ->
        if index == 0
          Math.max(0, Math.min(val, otherVal-1))
        else
          Math.max(otherVal+1, Math.min(val, routeDistance))
      
      index = $( event.target ).data( "ui-slider-handle-index" )
      curVal = $(this).slider('values', index)
      switch event.keyCode
        when $.ui.keyCode.PAGE_UP then newVal = curVal - 100
        when $.ui.keyCode.PAGE_DOWN then newVal = curVal + 100
        when $.ui.keyCode.LEFT then newVal = curVal - 1
        when $.ui.keyCode.RIGHT then newVal = curVal + 1
        when $.ui.keyCode.HOME then newVal = 0
        when $.ui.keyCode.END then newVal = routeDistance
        else return true
        
      $(this).slider('values', index, rangeBound(index, $(this).slider('values',if index==1 then 0 else 1), newVal))
      
      event.preventDefault()
    
    $('#crop-slider .ui-slider-handle').tooltip(
      title: ->
        index = $( this ).data( "ui-slider-handle-index" )
        
        "#{$('#crop-slider').slider('values', index)/1000}km"
      trigger: 'hover focus manual'
      animation: false
      container: 'body'
    ).unbind('keydown')
    
    #
    # Now that we are configured, draw the display
    #
    
    $( "#surface-container" ).height($('#bottom-anchor').offset().top - $('.navbar-fixed-top').outerHeight() - $('.footbox').outerHeight());

    updateRenderer()
   
    #
    # Waypoint manipulation
    #
    
    waypointChange = (e) ->  
      for w in waypoints 
        w.name = $(e).val() if w.id == waypointId(e)
      renderer.postRedraw();
      
    waypointId = (elem) ->
      $(elem).parents('#waypoints table tr').data('id')
      
    getWaypoint = (elem) ->
      id = waypointId(elem)
      for w in waypoints 
        return w if w.id is id
      null
    
    getElevationByDistance = (distance) ->
      for d,i in streams.distance
        return streams.altitude[i] if d >= distance
      return -1
    
    attachWaypointEvents = ->
      $( "#waypoints table tr:not(tr.bound) input[type='text']" ).keyup -> 
        waypointChange this
        modified = true
      
      $( "#waypoints table tr:not(tr.bound) input[type='text']" ).change -> 
        waypointChange this
        modified = true
        
      $( "#waypoints table tr:not(tr.bound) button.close" ).click ->
        for w,i in waypoints
          if w.id == waypointId(this)
            waypoints.splice i,1
            break
        $(this).parent().parent().addClass('disabled')
        $(this).parent().parent().find('.input-destroy').val(1)
        renderer.postRedraw()
        
      $( "#waypoints table tr:not(tr.bound) .waypoint-distance" ).each ->
        refreshWaypoint = (e) ->
          waypoint = getWaypoint(e)
          waypoint.distance = $(e).slider('value')
          waypoint.elevation = getElevationByDistance(waypoint.distance)
          renderer.postRedraw()
          $('.ui-slider-handle',e).tooltip('show')
          
          $(e).parent().parent().find('input[type=hidden]').filter ->
            this.id.match(/route_waypoints_attributes_.*_distance/)
          .val(waypoint.distance)
          
          $(e).parent().parent().find('input[type=hidden]').filter ->
            this.id.match(/route_waypoints_attributes_.*_elevation/)
          .val(waypoint.elevation)

        $(this).slider(
          min: 0
          max: routeDistance
          step: 1
          value: getWaypoint(this).distance
          slide: -> refreshWaypoint(this)
          change: -> refreshWaypoint(this)
            
        #
        # override default keyboard events because pgup/dn are too large an increment
        #

        ).keydown (event) ->
          switch event.keyCode
            when $.ui.keyCode.PAGE_UP then $(this).slider('value', Math.max($(this).slider('value') - 100, 0))
            when $.ui.keyCode.PAGE_DOWN then $(this).slider('value', Math.min($(this).slider('value') + 100, routeDistance))
            when $.ui.keyCode.LEFT then $(this).slider('value', Math.max($(this).slider('value') - 1, 0))
            when $.ui.keyCode.RIGHT then $(this).slider('value', Math.min($(this).slider('value') + 1, routeDistance))
            when $.ui.keyCode.HOME then $(this).slider('value', 0)
            when $.ui.keyCode.END then $(this).slider('value', routeDistance)
            else return true
          refreshWaypoint(this)
          event.preventDefault()
          
        #
        # Add a tooltip to the slider
        #

        $('.ui-slider-handle',this).tooltip(
          title: ->
            "#{getWaypoint(this).distance/1000}km"
          trigger: 'hover focus manual'
          animation: false
          container: 'body'
        ).unbind('keydown')
        
      $('#waypoints table tr').addClass('bound')
      
    attachWaypointEvents()
    
    $('form a.add_child').click ->
      association = $(this).attr('data-association')
      template = $('#' + association + '_fields_template').html()
      regexp = new RegExp('new_' + association, 'g')
      new_id = new Date().getTime()

      $('#waypoints table tbody').append(template.replace(regexp, new_id))
      $('#waypoints tr[data-id=""]').data('id', new_id)

      waypoint =
        id: new_id
        distance: 0
        elevation: window.streams.altitude[0]
        name: ''
      window.waypoints.push(waypoint)
      attachWaypointEvents()
      renderer.postRedraw()
      
    #
    # Save and Export
    #

    $('#share-button').click ->
      if $('#save-form #save-thumbs > li').length == 1
        export_image()
      
      $('#save-form').dialog('open')

    export_image = ->
      $('#save-form .thumbnails #new-thumbnail').addClass('loading')
      c = document.getElementById('surface')
      img = c.toDataURL('image/png')
      $('#image_save textarea#data').val(img)
      $('#image_save input#name').val($('#route_name').val())
      $('#image_save').submit()
      
    # delete button for thumbnails

    bind_share_buttons = ->
    
      $('.share-to-facebook').unbind('click').click ->
        FB.ui
           method: 'feed'
           name: $('#route_name').val() + ' - by Mesmeride'
           # caption: 'Bringing Facebook to the desktop and mobile web',
           link: $(this).parent().data('src')
           description: 'Take a look at the hills I climbed on my ride '+$('#route_name').val()+', made beautiful with www.mesmeride.com!'
           picture: $(this).parent().data('img') #find('img').attr('src'),
     
      $('.share-to-twitter').unbind('click').click ->
        #window.mesemeride.authenticated = (e) ->
        #  alert(e)
        window.open('/auth/twitter')
    
      $('#save-form .thumbnails form').unbind('ajax:success').bind('ajax:success', (evt, data, status, xhr) ->
        $(this).parent().parent().remove()
      )
          
      $('#save-form .thumbnails button.close').unbind('click').click (e) ->
        $(this).parent().parent().attr('disabled', 'disabled')
                        .addClass('deleting')
                        .find('form[method="post"]').submit()

      $('.share-to-blog').unbind('click').click (e) ->
        $('#embed-form textarea').val("<img src='#{$(this).parent().data('img')}' alt='#{$(this).parent().data('alt')}' />")
        $('#embed-form').dialog('open')
        
    bind_share_buttons()
    
    # new image
    
    $('#save-form .thumbnails #new-thumbnail div span').click (e) ->
      export_image()
      e.preventDefault()
      false

    $('#image_save').bind('ajax:success', (evt, data, status, xhr) ->
      newThumbnail = $('#save-form .thumbnails #new-thumbnail')
      newThumbnail.removeClass('loading')
      if xhr.responseText.match(/error/) 
        data = JSON.parse(xhr.responseText)
        alert(data[0].error)
      else
        $(newThumbnail).before(xhr.responseText)
        
        # apply the Twitter button style
        $.ajax(
          url: 'http://platform.twitter.com/widgets.js'
          dataType: 'script'
          cache:true
        )
        
        # bind all the other buttons
        bind_share_buttons()
    )
    
    $('#save-form').dialog(
      autoOpen: false
      modal: true
      width: 800
      buttons: 
        Cancel = ->
          $(this).dialog('close')
    )
    
    $('#embed-form').dialog(
      autoOpen: false,
      modal: true
      width: 600
      buttons:
        Cancel = ->
          $(this).dialog('close')
    )
       
    $('#save-button').click ->
      renderer_options = { color : $('#h10k_color').val() };
      $('#route_renderer_options').val(JSON.stringify(renderer_options))
      $('#route_zoom').val($('#zoom-slider').slider('value'))
      $('#route_x_scale').val($('#scale-slider').slider('value'))
      $('#route_y_scale').val($('#y-slider').slider('value'))
      $('#route_crop_start_distance').val($('#crop-slider').slider('values', 0))
      $('#route_crop_stop_distance').val($('#crop-slider').slider('values', 1))
      $('.edit_route').submit()
      
    #
    # Window resizing
    #
    
    windowResize = ->
      $( "#surface-container" ).height($('#bottom-anchor').offset().top - $('.navbar-fixed-top').outerHeight() - $('.footbox').outerHeight())
      renderer.postRedraw()

    $(window).resize -> windowResize()

    #
    # Renderer selection
    #
    
    $('#route_renderer').change ->
      updateRenderer()
      renderer.postRedraw()
      
    $('#h10k_color').change ->
      renderer.color = $(this).val()
      renderer.postRedraw()
     
    window.mesmeride.onAfterRender = ->
      # $('#surface').on('resize', -> 
      $('#dimensions').text($('#surface').outerWidth() + ' x ' + $('#surface').outerHeight())
    