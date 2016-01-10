var co = require('co');
var getPixels = require('get-pixels');
var path = require('path');
var fs = require('fs');
var allImgs = require('../03/good-img-ids.json');
var targetImgs = require('../04/target-imgs.json');
var blackAndWhiteArray = require('../utils/black-and-white-array');
var diffCompare = require('../utils/diff-compare');

// the goal is to find the 2000 pictures
// most like the target images in 04

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

var getPath = function(imgId) {
  return path.join(__dirname, '..', 'instagrams', imgId+'.jpg');
}

co(function*() {
  var targets = [];

  for (var i = 0; i<targetImgs.length; i++) {
    var imgId = targetImgs[i] + '.mini';
    var imgPath = getPath(imgId);
    var img = yield getBasePixels(imgPath);
    targets.push(blackAndWhiteArray(img));
  }

  var scores = [];

  var reportRate = allImgs.length / 50;
  var nextReport = reportRate;

  for (var i=0; i<allImgs.length; i++) {
    var imgId = allImgs[i];
    var imgPath = getPath(imgId+ '.mini');
    var img = yield getBasePixels(imgPath);
    var data = blackAndWhiteArray(img);
    var values = targets.map(function(target) {
      return diffCompare(target, data);
    });

    var min = values[0];
    var minImg = targetImgs[0];

    for(var j=1; j<values.length; j++) {
      var v = values[j];
      if(v < min) {
        min = v;
        minImg = targetImgs[j];
      }
    }

    scores.push({
      imgId: imgId,
      score: min,
      minImg: minImg
    });

    if (i>nextReport) {
      console.log((100/allImgs.length) * i);
      nextReport += reportRate;
    }

  }

  scores.sort(function(a, b) {
    return a.score - b.score;
  });

  var matches = scores.filter(function(score) {
    return score.score === 0;
  }).map(function(score) {
    return score.imgId;
  });

  fs.writeFileSync(path.join(__dirname, 'matches.json'), JSON.stringify(matches, null, 2));

}).catch(function(err) {console.log(err.stack)});
