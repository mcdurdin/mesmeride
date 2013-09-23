window.mesmeride = window.mesmeride || {}

window.mesmeride.afterRender = function(sender) {
  var canvas = $('#surface');
  
  if (canvas.length) {
    canvas = canvas[0];
  
    if (canvas.getContext) {
      var ctx = canvas.getContext('2d');

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      img = $( canvas.width > 1920 ? '#watermark' : canvas.width > 960 ? '#watermark-small' : '#watermark-tiny' );
      if(img.length) {
        ctx.drawImage(img[0], canvas.width - img.width() - 12, canvas.height - img.height() - 12);
      }
      
      ctx.restore();
    }
  }  
  
  if(window.mesmeride.onAfterRender) {
    window.mesmeride.onAfterRender(sender);
  }
}