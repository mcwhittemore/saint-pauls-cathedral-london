// From https://github.com/mcwhittemore/cubism/blob/9e833a1626dbf95147aa92171f3d5680a699ef3e/sketches/0080/down.js
console.log('----- 07 ------');

var co = require("co");
var listOfImages = require("../01/matches.json");
var fs = require("fs");
var path = require("path");
var getPixels = require("get-pixels");
var savePixels = require("save-pixels");
var ndarray = require('ndarray');

var NUM_IMAGES = 'ALL';
var STRIPE_SIZE = 5;
var STARTER_ID = '8-fIrvwtnE';

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
  return path.join(__dirname, "..", "02", "results", imgId+".jpg");
}

var timesUsed = {};

var findNext = function(currentId, imgIds, imgsById, y){
  var scores = [];
  timesUsed[currentId]+=STRIPE_SIZE;

  for(var i=0; i<imgIds.length; i++){
    var imgId = imgIds[i];
    if(imgId !== currentId){
      var score = 0;
      for(var x=0; x<640; x++){
        var left = imgsById[currentId].get(x, y, 1);
        var right = imgsById[imgId].get(x, y, 1);
        score += Math.abs(left-right);
      }
      scores.push({
        value: score * (timesUsed[imgId]+1),
        id: imgId
      });
    }
  }

  scores.sort(function(a, b){
    return a.value - b.value;
  });

  return scores[0].id;
}

var saveImage = function(pixels, imgId){
  savePixels(pixels, "jpg").pipe(fs.createWriteStream(path.join(__dirname, "./results/"+imgId+".jpg")));
  return new Promise(function(resolve){
    setTimeout(resolve, 200);
  });
}

co(function*(){

  var imgsById = {};

  console.error('loading images');
  var imgIds = [STARTER_ID];
  imgsById[STARTER_ID] = yield getBasePixels(getPath(STARTER_ID));
  timesUsed[STARTER_ID] = 0
  listOfImages.splice(listOfImages.indexOf(STARTER_ID), 1);

  NUM_IMAGES = NUM_IMAGES === 'ALL' ? listOfImages.length : NUM_IMAGES;

  while(imgIds.length < NUM_IMAGES && listOfImages.length > 0){
    var i = Math.floor(Math.random()*listOfImages.length);
    var imgId = listOfImages[i];
    var imgPath = getPath(imgId);
    try{
      var img = yield getBasePixels(imgPath);
      listOfImages.splice(i,1);
      imgIds.push(imgId);
      imgsById[imgId] = img;
      timesUsed[imgId] = 0;

      if(imgIds.length % 30 === 0){
        console.log('\t', (100/NUM_IMAGES)*imgIds.length+'%');
      }
    }
    catch(err){}
  }

console.error('crunching images');
  for(var i=0; i<imgIds.length; i++){
    var pixels = ndarray([], [640, 640, 3]);

    var currentId = null;

    for(var yBase=0; yBase<640-STRIPE_SIZE; yBase+=STRIPE_SIZE){
      currentId = currentId ? findNext(currentId, imgIds, imgsById, yBase) : imgIds[i];
      var img = imgsById[currentId];
      for(var yAdd = 0; yAdd < STRIPE_SIZE; yAdd++){
        var y = yBase + yAdd;
        for(var x = 0; x<640; x++){
          pixels.set(x, y, 0, img.get(x, y, 0));
          pixels.set(x, y, 1, img.get(x, y, 1));
          pixels.set(x, y, 2, img.get(x, y, 2));
        }
      }
    }

    yield saveImage(pixels, imgIds[i])

    if(i % 30 === 0){
      console.log('\t', (100/imgIds.length)*i+'%');
    }

  }

}).catch(function(err){
  console.log(err.message);
  console.log(err.stack);
});