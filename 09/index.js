// From https://github.com/mcwhittemore/cubism/blob/9e833a1626dbf95147aa92171f3d5680a699ef3e/sketches/0080/out.js

var co = require("co");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');
var communities = require('../08/communities.json');

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
  return path.join(__dirname, "..", "07", "results", imgId+".jpg");
}

var saveImage = function(pixels, imgId){
  savePixels(pixels, "jpg").pipe(fs.createWriteStream(path.join(__dirname, "./results/"+imgId+".jpg")));
  return new Promise(function(resolve){
    setTimeout(resolve, 200);
  });
}

co(function*(){

  var imgIdsByCommunity = {};
  var imgIds = Object.keys(communities);
  var imgsById = {};

  console.log('loading communities');
  for(var i=0; i<imgIds.length; i++){
    var imgId = imgIds[i];
    imgsById[imgId] = yield getBasePixels(getPath(imgId));
    var comm = communities[imgId] + '';
    imgIdsByCommunity[comm] = imgIdsByCommunity[comm] || [];
    imgIdsByCommunity[comm].push(imgId);

    if(i%30 === 0){
      console.log('\t -', (100/imgIds.length)*i);
    }
  }

  var commIds = Object.keys(imgIdsByCommunity);

  for(var i=0; i<commIds.length; i++){
    var comm = commIds[i];
    console.log('building image', comm);
    var commImgs = imgIdsByCommunity[comm];

    var pixels = ndarray([], [640, 640, 3]);

    for(var x = 0; x<640; x++){
      console.log('\trow', x);
      for(var y = 0; y<640; y++){
        var red = 0;
        var green = 0;
        var blue = 0;

        for(var j =0; j<commImgs.length; j++){
          var imgId = commImgs[j];
          var img = imgsById[imgId];

          red += img.get(x, y, 0);
          green += img.get(x, y, 1);
          blue += img.get(x, y, 2);
        }

        red = Math.floor(red/commImgs.length);
        green = Math.floor(green/commImgs.length);
        blue = Math.floor(blue/commImgs.length);

        pixels.set(x, y, 0, red);
        pixels.set(x, y, 1, green);
        pixels.set(x, y, 2, blue);
      }
    }

    yield saveImage(pixels, comm);
  }

}).catch(function(err){
  console.log(err.message);
  console.log(err.stack);
});
