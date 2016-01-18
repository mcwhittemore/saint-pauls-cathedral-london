var path = require('path');
var co = require('co');
var getPixels = require("get-pixels");
var ndarray = require('ndarray');
var savePixels = require("save-pixels");
var fs = require('fs');

var find = require('./find');

var rightStride = [];

var STRIDE = 10
var SPREAD = 5;
var SIZE = 40;

for(var i=0; i<STRIDE; i++) {
  rightStride.push([STRIDE-1, i]);
}

var saveImage = function(pixels, imgId){
  savePixels(pixels, "jpg").pipe(fs.createWriteStream(path.join(__dirname, "./results/"+imgId+".jpg")));
  return new Promise(function(resolve){
    setTimeout(resolve, 200);
  });
}

var getBasePixels = function*(imgPath){
  return new Promise(function(accept, reject){
    getPixels(imgPath, function(err, pixels) {
      if(err) {
        reject(err);
      }
      else{
        accept(pixels);
      }
    });
  });
}

var getPath = function(imgId){
  return path.join(__dirname, "..", "instagrams", imgId+".square.jpg");
}

var toData = function(row) {
  //[imgId, x, y, left, right, top, bottom]
  var parts = row.split('\t');
  var count = 0;
  var left = parts[3].split(',').map(function(val) {
    return parseInt(val, 10);
  });
  var right = parts[4].split(',').map(function(val) {
    return parseInt(val, 10);
  });
  var top = parts[5].split(',').map(function(val) {
    return parseInt(val, 10);
  });
  var bottom = parts[6].split(',').map(function(val) {
    return parseInt(val, 10);
  });

  return {
    right: right,
    real: true,
    color: left.concat(right, top, bottom).reduce(function(v, code) {
      var red = code >> 16;
      var postRed = (code - (red << 16))
      var green =  postRed >> 8;
      var blue = (postRed - (green << 8));
      v[0] += ((red*32) / (STRIDE * 4));
      v[1] += ((green*32) / (STRIDE * 4));
      v[2] += ((blue*32) / (STRIDE * 4));
      return v;
    }, [0, 0, 0]).map(Math.floor)
  }
}

co(function*() {

  var img = yield getBasePixels(getPath('8-fIrvwtnE'));

  var right = [];
  for(var j=0; j<rightStride.length; j++) {
    var red = Math.floor(img.get(rightStride[j][0], rightStride[j][1], 0) / 32);
    var green = Math.floor(img.get(rightStride[j][0], rightStride[j][1], 1) / 32);
    var blue = Math.floor(img.get(rightStride[j][0], rightStride[j][1], 2) / 32);

    right.push(red << 16 | green << 8 | blue);
  }

  var first = yield find(right);

  if(first === false) {
    console.log('no can do');
  }
  else {
    var data = toData(first);
    var cells = ndarray([], [SIZE, SIZE]);
    var pixels = ndarray([], [SIZE*SPREAD, SIZE*SPREAD, 3]);
    var y= 0;
    var x = 0;
    cells.set(x, y, data);
    for(var xa = 0; xa<SPREAD; xa++) {
      var xb = (x*SPREAD) + xa;
      for(var ya=0; ya<SPREAD; ya++) {
        var yb = (y*SPREAD) + ya;
        pixels.set(xb, yb, 0, data.color[0]);
        pixels.set(xb, yb, 1, data.color[1]);
        pixels.set(xb, yb, 2, data.color[2]);
      }
    }
    x++;
    while(y < SIZE) {
      while(x < SIZE) {
        var leftData = cells.get(x-1, y) || {right: [], real: false}
        var topData = cells.get(x, y-1) || {right: [], real: false}
        var cell = undefined;

        var leftCells = leftData.right.slice(0, leftData.right.length);
        var topCells = topData.right.slice(0, topData.right.length);

        while(cell === undefined && leftCells.length) {
          var found = yield find(leftCells);
          if(found) {
            cell = toData(found);
          }
          leftCells.pop();
        }

        while(cell === undefined && topCells.length) {
          var found = yield find(topCells);
          if(found) {
            cell = toData(found);
          }
          topCells.pop();
        }

        console.log(x, y, cell !== undefined, (leftData.right.length) - (leftCells.length), (topData.right.length) - (topCells.length));
        cells.set(x, y, cell);

        if(cell) {
          for(var xa = 0; xa<SPREAD; xa++) {
            var xb = (x*SPREAD) + xa;
            for(var ya=0; ya<SPREAD; ya++) {
              var yb = (y*SPREAD) + ya;
              pixels.set(xb, yb, 0, cell.color[0]);
              pixels.set(xb, yb, 1, cell.color[1]);
              pixels.set(xb, yb, 2, cell.color[2]);
            }
          }
        }

        x++;
      }
      x = 0;
      y++;
    }
  }

  yield saveImage(pixels, SIZE);


}).catch(function(err) {
  console.error(err.stack);
  process.exit(1);
});
