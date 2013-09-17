window.mesmeride = window.mesmeride || {}

window.stravaOnSteroids = window.mesmeride.giroRenderer = {
  name : 'giro',
  
  lengthMultiplierLarge : 0.001, 

  baseScale : 0,
  baseVerticalMultiplier : 0,
  scale : 1,  // will be calculated to window size on first load
  zoom : 1, 
  yScale : 1,
  
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

    stravaOnSteroids.baseScale = 0;   // force a recalc of the basic scale
    stravaOnSteroids.baseVerticalMultiplier = 0;
    
    //stravaOnSteroids.redraw();  
    // stravaOnSteroids.postRedraw(1000);  // give time for font to load... good enough for now
  },

  postRedraw: function(time) {
    if(stravaOnSteroids.redrawTimeoutHandle) {
      window.clearTimeout(stravaOnSteroids.redrawTimeoutHandle);
    }
    stravaOnSteroids.redrawTimeoutHandle = window.setTimeout(stravaOnSteroids.redrawDo, time ? time : 50);
  },

  redrawDo: function() {
    stravaOnSteroids.redrawTimeoutHandle = null;
    stravaOnSteroids.redraw();
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

    stravaOnSteroids.data = data;
    
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

    if(!stravaOnSteroids.baseScale) {
      stravaOnSteroids.baseScale = ($(canvas).parent().innerWidth() - 72) / data.data.distance[data.data.distance.length-1];
      stravaOnSteroids.baseVertMultiplier = Math.min(0.75, $(canvas).parent().innerHeight() / overallGrad);
    }
    
    var f = stravaOnSteroids.scale * stravaOnSteroids.baseScale;
    
    var xStep = 0.1;
    var yStep = 50;
	
    var vertMultiplier = stravaOnSteroids.baseVertMultiplier * stravaOnSteroids.yScale;

    var angle = 8 * Math.PI / 180;

    if (isNaN(angle) || isNaN(f) || isNaN(xStep) || isNaN(yStep)) {
      return;
    }

    if (f > 0 && xStep > 0 && yStep > 0 && angle > 0) {
      this.drawGiro(data.data, f, vertMultiplier, xStep, yStep, angle);
      
      if(window.mesmeride.afterRender) window.mesmeride.afterRender(this);
    }
  },

  inverse_transform: function(x, y, angle) {
      var matrix = [stravaOnSteroids.zoom, Math.tan(angle) * stravaOnSteroids.zoom, 0, stravaOnSteroids.zoom, 0, Math.tan(-angle) * stravaOnSteroids.zoom]; /* Skew transform */
      return { x: x * matrix[0] + y * matrix[2] + 1 * matrix[4], y: x * matrix[1] + y * matrix[3] + 1 * matrix[5] };
  },

  drawGiro: function(data, xf, yf, xStep, yStep, angle) {
    var c = document.getElementById('surface');
    sections = [];
	
    angle = 7.5 * Math.PI / 180;

    var w = 22, ysubbase = (data.maxHeight - data.minHeight) * yf + 280, ybase = ysubbase - 40;

    var dt = this.inverse_transform(((data.distance[data.distance.length - 1]) * xf + 48), ysubbase + 50, angle);

    c.width = dt.x;
    c.height = dt.y;

    matrix = [stravaOnSteroids.zoom, Math.tan(-angle) * stravaOnSteroids.zoom, 0, stravaOnSteroids.zoom, 0, (data.distance[data.distance.length-1]*xf+48) * Math.tan(angle) * stravaOnSteroids.zoom]; /* Skew transform */

    var dw = { x: -w * Math.cos(angle), y: -w * Math.sin(angle) };    /* Apply "3D" */
    dw = this.inverse_transform(dw.x, dw.y, angle);  /* Remove skew */
	
    dw.y -= 8;

    var x = -dw.x, y = ybase + dw.y - yf * (data.altitude[0] - data.minHeight);

    if (c.getContext) {
      var context = c.getContext('2d');

      context.fillStyle = 'rgb(255,255,255)';
      context.fillRect(0,0,c.width,c.height);

      context.save();
      context.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]); /* "Isometric" */

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
      lineargradient.addColorStop(0, 'rgba(214, 195, 181, 1)');
      lineargradient.addColorStop(0.3, 'rgba(237, 205, 156, 1)');
      lineargradient.addColorStop(0.45, 'rgba(245, 237, 291, 1)');
      lineargradient.addColorStop(0.55, 'rgba(222, 233, 190, 1)');
      lineargradient.addColorStop(0.75, 'rgba(244, 244, 210, 1)');
      lineargradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
    }

    x += len * xf; y -= rise * yf;
    sections.push({ startX: startX, startY: startY, endX: x, endY: y, gradient: ((startY - y) / yf) / ((x - startX) / xf) * 100, index: data.distance.length });

    if (c.getContext) {
      /* Draw rear gradient line */
      
      context.lineCap = 'round';
    
      context.beginPath();
      var s = sections[sections.length - 1];
      context.moveTo(s.startX, s.startY);
      context.strokeStyle='rgb(24,24,24)';
      context.lineWidth=6;
      context.lineJoin='round';
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
        
        var c = '';
        if (s.gradient.toFixed(1) >= 4) c = 'rgb(160,161,163)';
        else c = c = 'rgb(164,165,169)';			
        
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
          context.lineWidth = 2;
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
        context.moveTo(s.startX, s.startY+4);
        context.lineTo(s.startX, ysubbase);
        context.lineTo(s.endX+1, ysubbase);
        context.lineTo(s.endX+1, s.endY+4);
        context.fill();
      }
      
      /* Draw road thick black line */
   
      context.beginPath();
      var s = sections[sections.length - 1];
      context.moveTo(s.startX, s.startY);
      context.strokeStyle='rgb(24,24,24)';
      context.lineWidth=8;
      for (var i = sections.length - 1; i >= 0; i--) {
        var s = sections[i];			
        context.lineTo(s.startX, s.startY);
      }
      context.stroke();

      /* Draw end cap lines  */
      
      context.strokeStyle = 'rgb(24,24,24)';
      context.lineWidth = 6;
      context.lineCap = 'butt';
      context.beginPath();
      context.moveTo(sections[0].startX + dw.x, ysubbase + dw.y);
      context.lineTo(sections[0].startX + dw.x, sections[0].startY + dw.y);
      context.stroke();

      context.strokeStyle = 'rgb(24,24,24)';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(sections[0].startX + dw.x, ysubbase - 1 + dw.y);
      context.lineTo(sections[0].startX, ysubbase - 1);
      context.lineTo(sections[0].startX, sections[0].startY);
      context.lineTo(sections[0].startX + dw.x, sections[0].startY + dw.y);
      context.stroke();

      context.beginPath();
      context.moveTo(sections[0].startX, ysubbase + 16);
      context.lineTo(sections[0].startX, ysubbase);
      context.stroke();
      
      context.beginPath();
      context.moveTo(sections[sections.length-1].endX, ysubbase + 16);
      context.lineTo(sections[sections.length-1].endX, sections[sections.length-1].endY);
      context.stroke();
      
      /* Draw segment lines */
      
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

      context.lineWidth=1;
      context.strokeStyle = 'rgb(24,24,24)';

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

        context.beginPath();
        context.moveTo(xx, ysubbase + 16);
        context.lineTo(xx, yy);
        context.stroke();
        
        context.beginPath();
        context.moveTo(xx + dw.x, yy + dw.y);
        context.lineTo(xx + dw.x, yy + dw.y - 20);
        context.stroke();
      }

      context.lineCap = 'round';

      /* Fill road thick black line with thinner white line */
      
      context.beginPath();
      var s = sections[sections.length - 1];
      context.moveTo(s.startX, s.startY);
      context.strokeStyle='rgb(255,255,255)';
      context.lineWidth=4;
      for (var i = sections.length - 1; i >= 0; i--) {
        var s = sections[i];			
        context.lineTo(s.startX, s.startY);
      }
      context.stroke();
      
      /* Fill thick black + white line with pink road line */

      context.beginPath();
      var s = sections[sections.length - 1];
      context.moveTo(s.startX, s.startY);
      context.strokeStyle='rgb(252,0,80)';
      context.lineWidth=1.75;
      for (var i = sections.length - 1; i >= 0; i--) {
        var s = sections[i];			
        context.lineTo(s.startX, s.startY);
      }
      context.stroke();

      context.lineWidth = 1;
      
      /* Draw distance markers */

      var distance_gap = 5000;
      s = sections[sections.length-1];
      context.fillStyle = 'rgb(24,24,24)';
      context.strokeStyle = 'rgb(24,24,24)';
      var xx = 0;
      for(var x = sections[0].startX, x0 = 0; x < s.endX; x0 += distance_gap, x += distance_gap * xf) {
        var x1 = x;
        var x2 = distance_gap * xf;
        if(x + x2 > s.endX) x2 = s.endX - x1;
        if(xx) {
          context.strokeRect(x1, ysubbase - 8, x2, 8);
        } else {
          context.fillRect(x1, ysubbase - 8, x2, 8);
        }
        xx = !xx;
        
        context.font = '8pt Archivo Narrow';
        var st = Math.round(x0/1000).toString();
        if(st > 0) context.fillText(st, x1 - context.measureText(st).width / 2, ysubbase + 8 + 3);
      }

      /* Rotate transform for text */

      context.rotate(-Math.PI/2);

      context.fillStyle='rgb(24,24,24)';
      context.lineWidth=1;
      context.strokeStyle = 'rgb(24,24,24)';
      
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
        
        var st = alt + ' - '+det.name.toUpperCase(), ste='';
        var nn = -yy-dw.y+22;
        while(nn + context.measureText(st+ste).width > 0 && st != '') { st = st.substr(0,st.length-1); ste='...'; }
        
        context.fillText(st+ste, -yy-dw.y+22, xx+dw.x+5); 
        
        context.fillText(dst, -ysubbase-20-context.measureText(dst).width, xx+5);
      }

      var dst = (Math.round(data.distance[data.distance.length-1]/100)/10).toString();
      
      context.fillText(dst, -ysubbase-20-context.measureText(dst).width, sections[sections.length-1].endX+5);
      context.fillText('0.0', -ysubbase-20-context.measureText('0.0').width, sections[0].startX+5);
    }
  },

};
