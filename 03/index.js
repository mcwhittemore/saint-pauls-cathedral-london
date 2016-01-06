var savePixels = require('save-pixels');
var ndarray = require('ndarray');
var getPixels = require('get-pixels');
var path = require('path');
var fs = require('fs');

var imgIds = require('../01/img-ids.json');

var goodImgs = [];
var nextImg = 0;

var processImg = function() {
  console.log(nextImg);
  var imgId = imgIds[nextImg];
  nextImg++;
  var imgPath = path.join(__dirname, '../instagrams', imgId+'.jpg');
  getPixels(imgPath, function(err, pixels) {
    if(!err) {
      goodImgs.push(imgId);
      var square = fitShape(imgId, pixels, 640, 640);
      savePixels(square, 'jpg').pipe(fs.createWriteStream(path.join(__dirname, '../instagrams', imgId+'.square.jpg')));
      var mini = fitShape(imgId, square, 16, 16);
      savePixels(mini, 'jpg').pipe(fs.createWriteStream(path.join(__dirname, '../instagrams', imgId+'.mini.jpg')));
    }
    else {
      console.log('\terror', err, imgId);
    }

    if (nextImg === imgIds.length) {
      fs.writeFileSync(__dirname+'/good-img-ids.json', JSON.stringify(goodImgs, null, 2));
    }
    else {
      processImg();
    }
  });
}

processImg();
processImg();

var fitShape = function(id, img, width, height) {
  var pixels = ndarray([], [width, height, 3]);
  for (var xBase = 0; xBase < width; xBase++) {
    for (var yBase = 0; yBase < height; yBase++) {

      var channels = [0, 0, 0];
      var xSize = Math.floor(img.shape[0] / width);
      var ySize = Math.floor(img.shape[1] / height);
      var blockSize = xSize * ySize;

      for (var xAdd = 0; xAdd < xSize; xAdd++) {
        for (var yAdd = 0; yAdd < ySize; yAdd++) {
          var x = (xBase * xSize) + xAdd;
          var y = (yBase * ySize) + yAdd;
          for (var c = 0; c < channels.length; c++) {
            channels[c] += img.get(x, y, c) / blockSize;
          }
        }
      }

      for (var i=0; i<channels.length; i++) {
        pixels.set(xBase, yBase, i, channels[i]);
      }
    }
  }
  return pixels;
}
