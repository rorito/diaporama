var assign = require("object-assign");
var createShader = require("gl-shader");
var createTexture = require("gl-texture2d");
var SegmentKenBurns = require("../SegmentKenBurns");

function SegmentKenBurnsWebGL (renderChannel, data, diaporama) {
  SegmentKenBurns.call(this, renderChannel, data, diaporama);
}

SegmentKenBurnsWebGL.prototype = assign({}, SegmentKenBurns.prototype, {

  enter: function (ctx) {
    //this.getSize = ctx.getSize.bind(ctx);
    var size = this.getMediaSize();
    var res = SegmentKenBurns.prototype.enter.apply(this, arguments);
    this.texture = createTexture(ctx.gl, [size.width, size.height]);
    this.texture.minFilter = this.texture.magFilter = ctx.gl.LINEAR;
    if (this.image) this.texture.setPixels(this.image);
    return res;
  },

  leave: function () {
    this.texture.dispose();
    return SegmentKenBurns.prototype.leave.apply(this, arguments);
  },

  draw: function (imageOrVideo, bound) {
    if (this.video) this.texture.setPixels(imageOrVideo);
    this.kenburns.render(this.texture, bound);

    // Rotate and scale texture
    var slide = this.data;
    if ("video" in slide && "rotationIndex" in slide) {
      var rotationIndex = slide["rotationIndex"];
      var vw = this.texture.width;
      var vh = this.texture.height;
      if (rotationIndex % 2) {
        vw = this.texture.height;
        vh = this.texture.width;
      }
      var cw = this.getSize().width;
      var ch = this.getSize().height;
      var a = cw / vw;
      var b = ch / vh;
      if (a < b) {
        b = a / b;
        a = 1;
      } else {
        a = b / a;
        b = 1;
      }
      var gl = this.texture.gl;

      // Clear texture background
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
      gl.clearColor(0, 0, 0, 0);

      var VERT = "attribute vec2 position;varying vec2 uv;void main() {gl_Position = vec4(position * ";
      VERT += rotationMatrix(rotationIndex, a, b);
      VERT += ",0.0,1.0);uv = 0.5 * (position+1.0);}";
      var FRAG = "precision mediump float;uniform sampler2D buffer;varying vec2 uv;void main() {gl_FragColor = texture2D(buffer, uv);}";
      var shader = createShader(gl, VERT, FRAG);
      shader.bind();
      // this.buffer = gl.createBuffer();
      // gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      // gl.bufferData(gl.ARRAY_BUFFER, this.texture, gl.STATIC_DRAW);
      // shader.attributes.position.pointer();
      shader.uniforms.buffer = this.texture.bind();
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

});

/**
 * rotation 0 = [a, -b]
 * rotation 1 = |0, -a|
 *              |-b, 0|
 * rotation 2 = [a,  b]
 * rotation 3 = | 0, a|
 *              |-b, 0|
 */
function rotationMatrix(rotation, a, b) {
  if (rotation % 2) {
    if (rotation === 1) {
      a = -a;
    }
    b = -b;
    return "mat2(0," + a.toString() + ","+ b.toString() + ",0)";
  } else {
    if (rotation === 0) {
      b = -b;
    }
    return "vec2(" + a.toString() + ","+ b.toString() + ")";
  }
}

module.exports = SegmentKenBurnsWebGL;
