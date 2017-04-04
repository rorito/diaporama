var assign = require("object-assign");
var SegmentTimeline = require("./SegmentTimeline");
var forEachSlide2dImage = require("./forEachSlide2dImage");

function SegmentSlide2d (renderChannel, data) {
  SegmentTimeline.call(this, renderChannel, data);
  this.imgs = [];
  forEachSlide2dImage(data.slide2d.draws, this.imgs.push, this.imgs);
  this._needRender = false;
}

SegmentSlide2d.prototype = assign({}, SegmentTimeline.prototype, {
  toString: function () {
    return "SegmentSlide2d("+this.channel+")";
  },

  ready: function (ctx) {
    for (var i=0; i<this.imgs.length; ++i) {
      if (!ctx.media.has({ image: this.imgs[i] })) {
        return false;
      }
    }
    return true;
  },

  enter: function (ctx) {
    this._needRender = true;
    this.ctx = ctx.getChannelContext(this.channel);
    return [ "slide", this.data ];
  },

  resize: function () {
    this._needRender = true;
  },

  leave: function () {
    return [ "slideEnd", this.data ];
  },

  render: function () {
    if (this._needRender) {
      this._needRender = false;
      this.ctx.render(this.data.slide2d);
    }
  }

});

// Overwrite drawImage function to scale and fit images to canvas
(function() {
  var origDrawImage = CanvasRenderingContext2D.prototype.drawImage;

  CanvasRenderingContext2D.prototype.drawImage = function() {
    if (!arguments[0].width) {
      origDrawImage.apply(this, arguments);
    } else {
      // drawImage arguments: [
      //   image,
      //   sourceImageX, sourceImageY,
      //   sourceImageWidth, sourceImageHeight,
      //   destinationCanvasX, destinationCanvasY,
      //   destinationCanvasWidth, destinationCanvasHeight
      // ]
      var img = arguments[0];
      var dcw = arguments[7];
      var dch = arguments[8];
      drawImageProp(this, origDrawImage, img, dcw, dch);
    }
  };
}());

function drawImageProp(ctx, drawFunction, img, canvasWidth, canvasHeight) {
  var propWidht = 0;
  var propHeight = 0;

  if (img.width > img.height) {
    propWidht = canvasWidth;
    propHeight = img.height * canvasWidth / img.width;
  } else {
    propHeight = canvasHeight;
    propWidht = img.width * canvasHeight / img.height;
  }
  const posX = (canvasWidth - propWidht) / 2;
  const posY = (canvasHeight - propHeight) / 2;

  drawFunction.apply(ctx, [img, 0, 0, img.width, img.height, posX, posY, propWidht, propHeight]);
}

module.exports = SegmentSlide2d;
