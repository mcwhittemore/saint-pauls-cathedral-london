var savePixels = require('save-pixels');
var ndarray = require('ndarray');
var getPixels = require('get-pixels');
var path = require('path');
var fs = require('fs');

var imgIds = require('../get-imgs/img-ids.json');

var goodImgs = [];
var nextImg = 0;

var processImg = function() {
  var imgId = imgIds[nextImg];
  console.log(nextImg, imgId);
  nextImg++;
  var imgPath = path.join(__dirname, '../instagrams', imgId+'.jpg');
  getPixels(imgPath, function(err, pixels) {
    if(!err) {
      goodImgs.push(imgId);
      var square = fitShape(pixels, 640, 640);
      savePixels(square, 'jpg').pipe(fs.createWriteStream(path.join(__dirname, '../instagrams', imgId+'.square.jpg')));
      var mini = fitShape(square, 16, 16);
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

var fitShape = function(img, width, height) {
  var pixels = ndarray([], [width, height, 3]);
  var xSize = img.shape[0] / width;
  var ySize = img.shape[1] / height;

  for (var xBase = 0; xBase < width; xBase++) {
    for (var yBase = 0; yBase < height; yBase++) {

      var channels = [0, 0, 0];
      var pixelCount = 0;

      for (var xAdd = 0; xAdd < xSize; xAdd++) {
        for (var yAdd = 0; yAdd < ySize; yAdd++) {
          var x = Math.floor((xBase * xSize) + xAdd);
          var y = Math.floor((yBase * ySize) + yAdd);
          pixelCount++;
          for (var c = 0; c < channels.length; c++) {
            channels[c] += img.get(x, y, c);
          }
        }
      }

      for (var i=0; i<channels.length; i++) {
        pixels.set(xBase, yBase, i, Math.floor(channels[i] / pixelCount));
      }
    }
  }
  return pixels;
}
