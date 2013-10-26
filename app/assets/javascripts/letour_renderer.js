window.mesmeride = window.mesmeride || {}

window.mesmeride.letourRenderer = {

  name: 'letour',

  lengthMultiplierLarge : 0.001, 
  lengthMultiplierSmall : 1, 
  lengthUnitLarge:"km",
  lengthUnitSmall:"m",
  segName:'ride',

  baseScale : 0,
  baseVerticalMultiplier : 0,
  scale : 1,  // will be calculated to window size on first load
  zoom : 1, 
  yScale : 1,
  cropStart : 0,
  cropStop : 0,

  segDistance : 1,
  segCat : '',
  segGrade : 0,
  segElevGain : 0,
  
  redrawTimeoutHandle : null,

  create: function() {
    window.mesmeride.letourRenderer.baseScale = 0;   // force a recalc of the basic scale
    window.mesmeride.letourRenderer.baseVerticalMultiplier = 0;
  },

  postRedraw: function(time) {
    if(window.mesmeride.letourRenderer.redrawTimeoutHandle) {
      window.clearTimeout(window.mesmeride.letourRenderer.redrawTimeoutHandle);
    }
    window.mesmeride.letourRenderer.redrawTimeoutHandle = window.setTimeout(window.mesmeride.letourRenderer.redrawDo, time ? time : 50);
  },

  redrawDo: function() {
    window.mesmeride.letourRenderer.redrawTimeoutHandle = null;
    window.mesmeride.letourRenderer.redraw();
  },

  redraw: function() {

    var canvas = document.getElementById('surface'); 
    if(!canvas) return;
    
    // canvas.height = canvas.width * 0.5;  

    
    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        /* Will always clear the right space */
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    /* Build data for rendering */

    var data = {data: jQuery.extend(true, {}, window.streams)};
    
    var cropStart = window.mesmeride.letourRenderer.cropStart, cropStop = window.mesmeride.letourRenderer.cropStop;
    if(cropStop == 0) cropStop = data.data.distance[data.data.distance.length - 1];

    data.data.details = [];
    var segs = waypoints;
    for(var i = 0; i < segs.length; i++) {
      if(segs[i].distance >= window.mesmeride.letourRenderer.cropStart &&
         segs[i].distance < window.mesmeride.letourRenderer.cropStop) {
        var seg = {
          endX: segs[i].distance - window.mesmeride.letourRenderer.cropStart, 
          endY: segs[i].elevation, 
          name: segs[i].name, 
          isClimb: true
        };
        data.data.details.push(seg);
      }
    }

    data.data.minHeight = 10000;
    data.data.maxHeight = -10000;

    window.mesmeride.letourRenderer.data = data;
    
    var i, startI = 0;
    
    /* calculate max and min altitude in metres */
    
    for (i = 0; i < data.data.altitude.length; i++) {
      if (data.data.altitude[i] < data.data.minHeight && data.data.distance[i] >= cropStart) {
          data.data.minHeight = data.data.altitude[i];
      }
      if (data.data.altitude[i] > data.data.maxHeight && data.data.distance[i] >= cropStart) {
          data.data.maxHeight = data.data.altitude[i];
      }
      if (data.data.distance[i] < cropStart) {
        startI = i + 1;
      }
      if (data.data.distance[i] > cropStop) {
        data.data.distance = data.data.distance.slice(0, i);
        data.data.altitude = data.data.altitude.slice(0, i);
        break;
      }
      data.data.distance[i] -= cropStart;
    }
    
    if(startI > 0) {
      data.data.distance = data.data.distance.slice(startI);
      data.data.altitude = data.data.altitude.slice(startI);
    }
	
    var overallGrad = (data.data.maxHeight - data.data.minHeight); /* / data.data.distance[data.data.distance.length-1];  */

    if(!window.mesmeride.letourRenderer.baseScale) {
      window.mesmeride.letourRenderer.baseScale = ($(canvas).parent().innerWidth() - 72) / data.data.distance[data.data.distance.length-1];
      window.mesmeride.letourRenderer.baseVertMultiplier = Math.min(0.75, $(canvas).parent().innerHeight() / overallGrad);
    }
    
    var f = window.mesmeride.letourRenderer.scale * window.mesmeride.letourRenderer.baseScale;
    
    var xSteps = [10,25,50,100,250,500,1000,100000];
    var xStep = data.data.distance[data.data.distance.length-1] / 15;
    if (xStep < 0.2) { xStep = 0.1; }
    else if (xStep >= 0.2 && xStep < 0.4) { xStep = 0.25; }
    else if (xStep >= 0.4 && xStep < 0.75) { xStep = 0.5; }
    else if (xStep >= 0.75 && xStep < 2) { xStep = 1; }
    else if (xStep >= 2 && xStep < 4) { xStep = 2.5; }
    else if (xStep >= 4 && xStep < 7.5) { xStep = 5; }
    else if (xStep >= 7.5 && xStep < 20) { xStep = 10; }
    else if (xStep >= 20 && xStep < 40) { xStep = 25; }
    else if (xStep >= 40 && xStep < 75) { xStep = 50; }
    else if (xStep >= 75 && xStep < 200) { xStep = 100; }
    else if (xStep >= 200 && xStep < 400) { xStep = 250; }
    else if (xStep >= 400 && xStep < 750) { xStep = 500; }
    else if (xStep >= 750 && xStep < 2000) { xStep = 1000; }
    else if (xStep >= 2000 && xStep < 4000) { xStep = 2500; }
    else if (xStep >= 4000 && xStep < 7500) { xStep = 5000; }
    else { xStep = 10000; }

    var yStep = (data.data.maxHeight-data.data.minHeight) / 10;
    if (yStep < 2) { yStep = 1; }
    else if (yStep >= 2 && yStep < 4) { yStep = 2.5; }
    else if (yStep >= 4 && yStep < 7.5) { yStep = 5; }
    else if (yStep >= 7.5 && yStep < 20) { yStep = 10; }
    else if (yStep >= 20 && yStep < 40) { yStep = 25; }
    else if (yStep >= 35 && yStep < 75) { yStep = 50; }
    else if (yStep >= 75 && yStep < 200) { yStep = 100; }
    else if (yStep >= 200 && yStep < 400) { yStep = 250; }
    else if (yStep >= 400 && yStep < 750) { yStep = 500; }
    else if (yStep >= 750 && yStep < 2000) { yStep = 1000; }
    else if (yStep >= 2000 && yStep < 4000) { yStep = 2500; }
    else if (yStep >= 4000 && yStep < 7500) { yStep = 5000; }
    else { yStep = 10000; }
    	
    var vertMultiplier = window.mesmeride.letourRenderer.baseVertMultiplier * window.mesmeride.letourRenderer.yScale;

    var FitGradient = true;
    var angle = 10 * Math.PI / 180;

    if (isNaN(angle) || isNaN(f) || isNaN(xStep) || isNaN(yStep)) return;

    if (f > 0 && xStep > 0 && yStep > 0 && angle > 0) {
      this.drawLeTour(data.data, f, vertMultiplier, xStep, yStep, FitGradient, angle);
            
      if(window.mesmeride.afterRender) window.mesmeride.afterRender(this);
    }
  },

  matrix: [],

  transform: function(x, y) {
    return { x: x * matrix[0] + y * matrix[2] + 1 * matrix[4], y: x * matrix[1] + y * matrix[3] + 1 * matrix[5] };
  },

  inverse_transform: function(x, y, angle) {
    var matrix = [window.mesmeride.letourRenderer.zoom, Math.tan(angle) * window.mesmeride.letourRenderer.zoom, 
      0, window.mesmeride.letourRenderer.zoom, 0, Math.tan(-angle) * window.mesmeride.letourRenderer.zoom]; /* Skew transform */
    return { x: x * matrix[0] + y * matrix[2] + 1 * matrix[4], y: x * matrix[1] + y * matrix[3] + 1 * matrix[5] };
  },

	findSectionIntersection: function(sections,y) {
	  for(var i = 0; i < sections.length; i++) {
      var s = sections[i]; 
      if(s.startY >= y && s.endY < y) {
        return s.startX + (s.endX - s.startX) * (s.startY-y) / (s.startY - s.endY);
      }
	  }
	  return null;
	},

  drawLeTour: function(data, xf, yf, xStep, yStep, FitGradient, angle) {
    var c = document.getElementById('surface');

    var w = 16, ysubbase=(data.maxHeight-data.minHeight) * yf + 48, ybase=ysubbase-40;
    
    var dt = this.inverse_transform((data.distance[data.distance.length-1] * xf + 48), ysubbase, angle);
 
    c.width = dt.x;
    c.height = dt.y;
    
    //var angle = Math.PI/18;
    
    matrix = [window.mesmeride.letourRenderer.zoom, Math.tan(-angle) * window.mesmeride.letourRenderer.zoom,0,
      window.mesmeride.letourRenderer.zoom,0, (data.distance[data.distance.length-1]*xf+48) * Math.tan(angle) * window.mesmeride.letourRenderer.zoom]; // Skew transform
    
    var dw = {x:-w*Math.cos(angle), y:-w*Math.sin(angle)};    // Apply "3D"
    dw = this.inverse_transform(dw.x,dw.y,angle);  // Remove skew
        
    var context = c.getContext('2d');
        context.fillStyle = 'rgb(255,255,255)';
        context.fillRect(0,0,c.width,c.height);

    context.save();
    context.setTransform(matrix[0],matrix[1],matrix[2],matrix[3],matrix[4],matrix[5]); // "Isometric"
    
    var x = -dw.x, y = ybase + dw.y;
    
    context.beginPath();
    context.moveTo(0, y);
    context.strokeStyle = 'rgba(0,0,0,1)';    
    context.lineTo(x, y);

    var startSeg = 0, rise = 0, len = 0, gradient = 0, sections = [], startX = x, startY = y;
    for(var i = 1; i < data.altitude.length; i++)
    {
      var seglen = data.distance[i] - data.distance[i-1];
      var segrise = data.altitude[i] - data.altitude[i-1];
      if(len > 0)
      {
        var cut = !FitGradient ? 
          (Math.floor(data.distance[i]/xStep) > Math.floor(data.distance[i-1]/xStep)) :
          Math.abs(1- (rise/len) / (segrise/seglen)) > 0.5 /*Math.abs(segrise/seglen - rise/len) > (rise/len)*/ && (seglen + len) * xf > 32;
                    
        if(cut) //Math.abs(1- (rise/len) / (segrise/seglen)) > 0.5 /*Math.abs(segrise/seglen - rise/len) > (rise/len)*/ && (seglen + len) * xf > 32)
        {
          x += len * xf; y -= rise * yf;
          sections.push({startX: startX, startY: startY, endX: x, endY: y, gradient: ((startY - y)/yf) / ((x - startX)/xf) * 100});
          rise=0; len=0;
          startX = x; startY = y;          
        }
      }
      rise += segrise;
      len += seglen;                  
    }
    
    var lineargradient = context.createLinearGradient(0,0,0,ysubbase);
        lineargradient.addColorStop(0, 'rgba(200, 200, 200, 0.1)');
        lineargradient.addColorStop(1, 'rgba(200, 200, 200, 0.5)');

    x += len * xf; y -= rise * yf;
    sections.push({startX: startX, startY: startY, endX: x, endY: y, gradient: (startY - y) / (x - startX) * 10});

    
        for (var i = sections.length - 1; i >= 0; i--) {
            var s = sections[i];

            /* Draw slope of road */
            context.beginPath();
            if (s.gradient.toFixed(1) >= 15) context.fillStyle = 'rgb(0,0,0)';
            else if (s.gradient.toFixed(1) >= 10) context.fillStyle = 'rgb(255,16,16)';
            else if (s.gradient.toFixed(1) >= 5) context.fillStyle = 'rgb(32,32,200)';
            else if (s.gradient.toFixed(1) <= -15) context.fillStyle = 'rgb(0,0,0)';
            else if (s.gradient.toFixed(1) <= -10) context.fillStyle = 'rgb(168,11,11)';
            else if (s.gradient.toFixed(1) <= -5) context.fillStyle = 'rgb(19,19,99)';
            else if (s.gradient.toFixed(1) < 0) context.fillStyle = 'rgb(22,112,22)';
            else context.fillStyle = 'rgb(32,200,32)';

            context.moveTo(s.startX, s.startY);
            context.lineTo(s.startX + dw.x, s.startY + dw.y);
            context.lineTo(s.endX + dw.x, s.endY + dw.y);
            context.lineTo(s.endX, s.endY);
            context.lineTo(s.startX, s.startY);
            context.fill();

            /* centre line on road */
            context.beginPath();
            context.strokeStyle = 'rgba(255,255,255,0.5)';
            context.dashedLineTo(s.startX + dw.x / 2, s.startY + dw.y / 2, s.endX + dw.x / 2, s.endY + dw.y / 2, [3, 2]);
            context.stroke();
        }

        for (var i = 0; i < sections.length; i++) {
            var s = sections[i];

            /* Draw descenders */
            context.beginPath();
            context.fillStyle = lineargradient;
            context.moveTo(s.startX, s.startY);
            context.lineTo(s.startX, ysubbase);
            context.lineTo(s.endX, ysubbase);
            context.lineTo(s.endX, s.endY);
            context.fill();

            context.beginPath();
            context.strokeStyle = '#8080e0';
            context.dashedLineTo(s.startX, s.startY, s.startX, ysubbase - 20, [3, 2]);
            context.stroke();

            if (s.endX - s.startX >= 24) {
                context.font = 'bold 9pt Calibri';
                context.textAlign = 'center';
                context.fillStyle = 'rgb(20,20,20)';
                context.fillText(s.gradient.toFixed(1), (s.startX + s.endX) / 2, ysubbase - 24);
            }
        }

        /* Draw altitude ticks */

        //context.textAlign='left';
        //context.textBaseline='middle';

        s = sections[sections.length - 1];
        // height lines should not extend beyond track.
        for (var y = yStep; y < data.maxHeight - data.minHeight; y += yStep) {
            var xStart = 0;
            var xEnd = -1;

            var altY = ybase - y * yf;

            for (var i = 0; i < sections.length; i++) {
                var slocal = sections[i];
                if (slocal.startY >= altY && slocal.endY < altY) {
                    // if ascending then mark the startpoint for the line
                    xStart = slocal.startX + (slocal.endX - slocal.startX) * (slocal.startY - altY) / (slocal.startY - slocal.endY);

                    // draw a faint line between peaks
                    if (xEnd > -1) {
                        context.beginPath();
                        context.strokeStyle = 'rgba(200,200,250,0.5)';
                        context.dashedLineTo(xEnd, altY, xStart, altY, [3, 5]);
                        context.stroke();
                    }
                }
                if (slocal.startY < altY && slocal.endY >= altY) {
                    // if descending then draw line to this point
                    xEnd = slocal.startX + (slocal.endX - slocal.startX) * (slocal.startY - altY) / (slocal.startY - slocal.endY);
                    context.beginPath();
                    context.strokeStyle = '#c0c0e0';
                    context.dashedLineTo(xStart, altY, xEnd, altY, [3, 2]);
                    context.stroke();

                    xStart = -1;
                }
            }

            // if segment finishes with a climb then draw lines to the right hand side
            if (xStart > -1) {
                context.beginPath();
                context.strokeStyle = '#c0c0e0';
                context.dashedLineTo(xStart, altY, s.endX, altY, [3, 2]);
                context.stroke();
            }
            else {
                // if descending finish then draw much lighter line to the right hand side
                context.beginPath();
                context.strokeStyle = 'rgba(200,200,250,0.5)';
                context.dashedLineTo(xEnd, altY, s.endX, altY, [3, 5]);
                context.stroke();
            }
        }
        context.beginPath();
        context.strokeStyle = '#c0c0e0';
        //context.lineTo(0, ybase - 0 * yf, s.endX, ybase - 0 * yf);
        context.moveTo(0, ybase - 0 * yf);
        context.lineTo(s.endX, ybase - 0 * yf);
        context.stroke();

        /* Draw distance markers */

        context.fillStyle = 'rgb(40,40,40)';
        context.fillRect(sections[0].startX, ysubbase - 20, s.endX - sections[0].startX, 20);

        context.beginPath();
        context.moveTo(sections[0].startX, ysubbase - 20);
        context.lineTo(sections[0].startX, ysubbase);
        context.lineTo(sections[0].startX + dw.x, ysubbase + dw.y);
        context.lineTo(sections[0].startX + dw.x, ysubbase - 20 + dw.y);
        context.lineTo(sections[0].startX, ysubbase - 20);
        context.fill();

        context.font = '9pt Calibri';
        context.textAlign = 'center';
        context.textBaseline = 'alphabetic';
        context.fillStyle = 'rgb(255,255,255)';
    for(var x = xStep; x * xf < s.endX; x += xStep) {
      var xx = (data.distance[data.distance.length-1] >= 5000) ? x/1000 : x;
      context.fillText(xx, x * xf + sections[0].startX, ysubbase - 4);
    }

        context.beginPath();
        context.moveTo(s.endX, s.endY);
        context.lineTo(s.endX, ysubbase);

        s = sections[0];

        context.lineTo(s.startX, ysubbase);
        context.stroke();

        context.beginPath();
        context.fillStyle = '#c0c0e0';
        context.moveTo(s.startX, s.startY);
        context.lineTo(s.startX + dw.x, s.startY + dw.y);
        context.lineTo(s.startX + dw.x, ysubbase - 20 + dw.y);
        context.lineTo(s.startX, ysubbase - 20);
        context.lineTo(s.startX, s.startY);
        context.fill();

        /* Switch out of transform */
        context.restore();
        
        /* Draw altitude text */
        s = sections[sections.length - 1];

        context.font = "bold "+(9*window.mesmeride.letourRenderer.zoom)+"pt Calibri";
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        context.fillStyle = '#000000';

    for(var y = -100; y < data.maxHeight; y += yStep) {
      x = this.findSectionIntersection(sections, ybase - y * yf);
      if(x) {
        var dt = this.transform(s.endX + 4, ybase - y * yf);
        context.fillText(y, dt.x, dt.y);
      }
    }
  }
};

/**
* dashedLineTo
**/

CanvasRenderingContext2D.prototype.dashedLineTo = function (fromX, fromY, toX, toY, pattern) {
  // Our growth rate for our line can be one of the following:
  //   (+,+), (+,-), (-,+), (-,-)
  // Because of this, our algorithm needs to understand if the x-coord and
  // y-coord should be getting smaller or larger and properly cap the values
  // based on (x,y).
  var lt = function (a, b) { return a <= b; };
  var gt = function (a, b) { return a >= b; };
  var capmin = function (a, b) { return Math.min(a, b); };
  var capmax = function (a, b) { return Math.max(a, b); };

  var checkX = { thereYet: gt, cap: capmin };
  var checkY = { thereYet: gt, cap: capmin };

  if (fromY - toY > 0) {
    checkY.thereYet = lt;
    checkY.cap = capmax;
  }
  if (fromX - toX > 0) {
    checkX.thereYet = lt;
    checkX.cap = capmax;
  }

  this.moveTo(fromX, fromY);
  var offsetX = fromX;
  var offsetY = fromY;
  var idx = 0, dash = true;
  while (!(checkX.thereYet(offsetX, toX) && checkY.thereYet(offsetY, toY))) {
    var ang = Math.atan2(toY - fromY, toX - fromX);
    var len = pattern[idx];

    offsetX = checkX.cap(toX, offsetX + (Math.cos(ang) * len));
    offsetY = checkY.cap(toY, offsetY + (Math.sin(ang) * len));

    if (dash) this.lineTo(offsetX, offsetY);
    else this.moveTo(offsetX, offsetY);

    idx = (idx + 1) % pattern.length;
    dash = !dash;
  }
};
