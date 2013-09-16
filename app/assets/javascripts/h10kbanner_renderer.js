window.mesmeride = window.mesmeride || {}

window.mesmeride.h10KBannerRenderer = {
  name : 'h10kbanner',
  
  lengthMultiplierLarge : 0.0001, 

  baseScale : 0,
  baseVerticalMultiplier : 0,
  scale : 1,  // will be calculated to window size on first load
  zoom : 1, 
  yScale : 1,
  color : 'red',
  
  sections : [],

  redrawTimeoutHandle : null,

  create: function() {

    if($('#giro-fonts').length == 0) {
      var li = document.createElement('link');
      $(li).attr('id','giro-fonts')
           .attr('href','http://fonts.googleapis.com/css?family=Archivo+Narrow:400,700')
           .attr('rel','stylesheet')
           .attr('type','text/css');
      $('head').append(li);
    }

    window.mesmeride.h10KBannerRenderer.baseScale = 0;   // force a recalc of the basic scale
    window.mesmeride.h10KBannerRenderer.baseVerticalMultiplier = 0;
  },

  postRedraw: function(time) {
    if(window.mesmeride.h10KBannerRenderer.redrawTimeoutHandle) {
      window.clearTimeout(window.mesmeride.h10KBannerRenderer.redrawTimeoutHandle);
    }
    window.mesmeride.h10KBannerRenderer.redrawTimeoutHandle = window.setTimeout(window.mesmeride.h10KBannerRenderer.redrawDo, time ? time : 50);
  },

  redrawDo: function() {
    window.mesmeride.h10KBannerRenderer.redrawTimeoutHandle = null;
    window.mesmeride.h10KBannerRenderer.redraw();
  },

  redraw: function() {

    var canvas = document.getElementById('surface'); 
   
    if(!canvas) {
      return; 
    }
    
    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        /* Will always clear the right space */
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    
    /* Build data for rendering */

    var data = {data: window.streams};

    data.data.details = [];
    var segs = waypoints;
    for(var i = 0; i < segs.length; i++) {
      var seg = {
        endX: segs[i].distance, 
        endY: segs[i].elevation, 
        name: segs[i].name, 
        isClimb: true
      };
      data.data.details.push(seg);
    }

    data.data.minHeight = 10000;
    data.data.maxHeight = -10000;
    data.data.minHeightLocation = [0, 0];
    data.data.maxHeightLocation = [0, 0];

    window.mesmeride.h10KBannerRenderer.data = data;
    
    var i;
    
    /* calculate max and min altitude in metres */
    
    for (i = 0; i < data.data.altitude.length; i++) {
        if (data.data.altitude[i] < data.data.minHeight) {
            data.data.minHeight = data.data.altitude[i];
        }
        if (data.data.altitude[i] > data.data.maxHeight) {
            data.data.maxHeight = data.data.altitude[i];
        }
    }
	
    var overallGrad = (data.data.maxHeight - data.data.minHeight); /* / data.data.distance[data.data.distance.length-1];  */

    if(!window.mesmeride.h10KBannerRenderer.baseScale) {
      window.mesmeride.h10KBannerRenderer.baseScale = ($(canvas).parent().innerWidth() - 72) / data.data.distance[data.data.distance.length-1];
      window.mesmeride.h10KBannerRenderer.baseVertMultiplier = Math.min(0.75, $(canvas).parent().innerHeight() / overallGrad);
    }
    
    var f = window.mesmeride.h10KBannerRenderer.scale * window.mesmeride.h10KBannerRenderer.baseScale;
    
    var xStep = 0.1;
    var yStep = 50;
	
    var vertMultiplier = window.mesmeride.h10KBannerRenderer.baseVertMultiplier * window.mesmeride.h10KBannerRenderer.yScale;

    if (isNaN(f) || isNaN(xStep) || isNaN(yStep)) {
      return;
    }

    if (f > 0 && xStep > 0 && yStep > 0) {
      this.drawGiro(data.data, f, vertMultiplier, xStep, yStep);
    }
  },

  drawGiro: function(data, xf, yf, xStep, yStep) {
    var c = document.getElementById('surface');
    sections = [];

    var w = 22, ysubbase = (data.maxHeight - data.minHeight) * yf + 280, ybase = ysubbase - 20;

    c.width = (data.distance[data.distance.length - 1] * xf + 48) * window.mesmeride.h10KBannerRenderer.zoom;
    c.height = ysubbase * window.mesmeride.h10KBannerRenderer.zoom;

    var dw = { x: -w, y: 0 };

    var x = w, y = ybase + w - yf * (data.altitude[0] - data.minHeight);

    if (c.getContext) {
      var context = c.getContext('2d');

      context.fillStyle = 'rgb(255,255,255)';
      context.fillRect(0,0,c.width,c.height);

      context.save();

      context.setTransform(window.mesmeride.h10KBannerRenderer.zoom, 0, 0, window.mesmeride.h10KBannerRenderer.zoom, 0, 0);
      
      context.beginPath();
      context.moveTo(0, y);
      context.strokeStyle = 'rgba(0,0,0,1)';
      context.lineTo(x, y);
    }

    var startSeg = 0, rise = 0, len = 0, gradient = 0, startX = x, startY = y; 
    for (var i = 1; i < data.altitude.length; i++) {
      var seglen = (data.distance[i] - data.distance[i - 1]);
      var segrise = (data.altitude[i] - data.altitude[i - 1]);
      if (len > 0) {
        var cut = 
        (Math.floor((data.distance[i]) / (xStep / this.lengthMultiplierLarge)) > Math.floor((data.distance[i - 1]) / (xStep / this.lengthMultiplierLarge)));
        
        if (cut) {
          x += len * xf; y -= rise * yf;
          sections.push({ startX: startX, startY: startY, endX: x, endY: y, gradient: ((startY - y) / yf) / ((x - startX) / xf) * 100, index: i });
          rise = 0; len = 0;
          startX = x; startY = y;
        }
      }
      rise += segrise;
      len += seglen;
    }

    if (c.getContext) {
      var lineargradient = context.createLinearGradient(0, 0, 0, ysubbase);
      var frontLine = 0;
      switch(window.mesmeride.h10KBannerRenderer.color) {
      case 'red':
        lineargradient.addColorStop(0, 'rgba(255, 0, 24, 1)'); // 180F78
        lineargradient.addColorStop(0.75, 'rgba(255, 111, 123, 1)'); //433C90
        lineargradient.addColorStop(1, 'rgba(255, 171, 177, 1)'); // 807CB4
        frontLine = 'rgb(224,3,3)';
        break;
      case 'green': 
        lineargradient.addColorStop(0, 'rgba(10, 116, 0, 1)'); // 180F78
        lineargradient.addColorStop(0.75, 'rgba(91, 161, 85, 1)'); //433C90
        lineargradient.addColorStop(1, 'rgba(137, 188, 134, 1)'); // 807CB4
        frontLine = 'rgb(0,116,42)';
        break;
      case 'blue':
        lineargradient.addColorStop(0, 'rgba(24, 15, 120, 1)'); // 180F78
        lineargradient.addColorStop(0.75, 'rgba(67, 60, 144, 1)'); //433C90
        lineargradient.addColorStop(1, 'rgba(128, 124, 180, 1)'); // 807CB4
        frontLine = 'rgb(0,12,116)';
        break;
      }
    }

    x += len * xf; y -= rise * yf;
    sections.push({ startX: startX, startY: startY, endX: x, endY: y, gradient: ((startY - y) / yf) / ((x - startX) / xf) * 100, index: data.distance.length });

    if (c.getContext) {
      /* Draw gradient line */
      
      context.lineCap = 'butt';
    
      context.beginPath();
      var s = sections[sections.length - 1];
      context.moveTo(s.startX, s.startY);
      context.strokeStyle='rgb(24,24,24)';
      context.lineWidth=1;
      context.lineJoin='butt';
      for (var i = sections.length - 1; i >= 0; i--) {
        var s = sections[i];			
        context.lineTo(s.startX + dw.x, s.startY + dw.y);
      }
      context.stroke();
		
      /* Draw the left edge of start of the graph */

      context.beginPath();
      context.moveTo(sections[0].startX, ysubbase);
      context.lineTo(sections[0].startX + dw.x, ysubbase + dw.y);
      context.lineTo(sections[0].startX + dw.x, sections[0].startY + dw.y);
      context.lineTo(sections[0].startX, sections[0].startY);
      context.fillStyle = 'rgb(153,152,158)';
      context.fill();
		
      context.lineWidth = 1;

      /* Draw road surface - backwards so "earlier" sections clean up "later" ones */
		
      var prevGradient = -1;

      for (var i = sections.length - 1; i >= 0; i--) {
        var s = sections[i];			

        context.beginPath();
        
        var c = 'rgb(178,178,178)';			
        
        context.fillStyle = c;
        context.strokeStyle = c;
        context.moveTo(s.startX, s.startY);
        context.lineTo(s.startX + dw.x, s.startY + dw.y);
        context.lineTo(s.endX + dw.x, s.endY + dw.y);
        context.lineTo(s.endX, s.endY);
        context.lineTo(s.startX, s.startY);
        context.fill();
        
        /* Fill seams
        
         if the gradient is switching to positive, then draw a thick line across top? */
        
        var doDraw = 
          (s.endY <= s.startY) && (prevGradient < 0);					
        
        prevGradient = s.startY - s.endY;
        
        if(doDraw) {
          context.strokeStyle = 'rgb(24,24,24)';
          context.lineWidth = 1;
        } else {
          context.strokeStyle = c;
          context.lineWidth = 1;
        }
        
        context.beginPath();
        context.moveTo(s.endX, s.endY);
        context.lineTo(s.endX + dw.x, s.endY + dw.y);
        context.stroke();
      }
      
      /* Fill under the path with the linear gradient */
      
      for (var i = 0; i < sections.length; i++) {
        var s = sections[i];

        context.beginPath();
        context.fillStyle = lineargradient;
        
        var x1 = s.startX, y1 = s.startY, x2 = s.endX, y2 = s.endY;
        
        context.moveTo(x1, y1);     // x1 y1  x2 y2 -->   (y2-y1)/(x2-x1) * (x2-x1+2) + y2
        context.lineTo(x1, ysubbase);
        context.lineTo(x2, ysubbase);
        context.lineTo(x2, y2); //(y2-y1)/(x2-x1) * (x2-x1+2) + y1);
        context.fill();

        context.moveTo(x2-1, y2);
        context.lineTo(x2-1, ysubbase); 
        context.lineTo(x2+1, ysubbase);
        context.lineTo(x2+1, y2);
        context.fill(); 
      }
      
      /* Draw foreground line of gradient */
            
      context.beginPath();
      var s = sections[sections.length - 1];
      context.moveTo(s.startX, s.startY);
      context.strokeStyle=frontLine;
      context.lineWidth=1;
      context.lineJoin='butt';
      for (var i = sections.length - 2; i >= 0; i--) {
        var s = sections[i];			
        context.lineTo(s.startX, s.startY);
      }
      context.stroke();

      /* Draw segments */
      
      var segments = [];
      
      for(var i in data.details) {
        var det = data.details[i];
        if(!det.isClimb) continue;

        var xx = sections[0].startX + det.endX * xf;
        var yy = det.endY;

        for(var j = 0; j < sections.length; j++) {
          if(sections[j].startX >= xx) {
            xx = sections[j].startX;
            yy = sections[j].startY;
            break;
          }
        }

        segments.push({x:xx, y:yy, name: det.name, alt: det.endY, dst: det.endX});
      }
      
      segments.sort( function(a,b) {return a.x-b.x} );
      
      var lastXX = sections[sections.length-1].endX + 20;
      for(var i = segments.length-1; i >= 0; i--) {
        var det = segments[i];
        var xx = sections[0].startX + det.dst * xf;
        if(lastXX-xx < 16) { det.skip = true; } else lastXX = xx;
      }
      
      /* Rotate transform for text */

      context.rotate(-Math.PI/2);

      context.fillStyle=frontLine;
      context.lineWidth=1;
      context.strokeStyle = frontLine;
      
      for(var i = 0; i < segments.length; i++) {
        if(segments[i].skip) continue;

        var det = segments[i];

        var xx = sections[0].startX + det.dst * xf;
        var yy = det.alt;
        for(var j = 0; j < sections.length; j++) {
          if(sections[j].startX >= xx) {
            xx = sections[j].startX;
            yy = sections[j].startY;
            break;
          }
        }
        
        context.font = "bold 14pt Archivo Narrow";
        
        var alt = Math.round(det.alt).toString();
        var dst = (Math.round(det.dst/100)/10).toString();
        
        var st = det.name, ste='';
        var nn = -yy-dw.y+12;
        while(nn + context.measureText(st+ste).width > 0 && st != '') { st = st.substr(0,st.length-1); ste='...'; }
        
        context.fillText(st+ste, -yy-dw.y+12, xx+dw.x+5); 
      }
    }
  },

};
