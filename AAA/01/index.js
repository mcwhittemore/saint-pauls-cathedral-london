var co = require('co');
var getPixels = require('get-pixels');
var path = require('path');
var fs = require('fs');
var allImgs = require('../../standardize-imgs/good-img-ids.json');
var targetImgs = ["8-fIrvwtnE"];
var imgToList = function(img) {
  var out = [];
  for (var x = 0; x <img.shape[0]; x++) {
    for (var y = 0; y < img.shape[1]; y++) {
      for (var c=1; c<3; c++) {
        var v = img.get(x, y, c);
        out.push(v);
      }
    }
  }
  return out;
}

var diffCompare = function(a, b) {
  var comp = 0;
  var count = 0;
  for (var i=0; i<a.length-1; i++) {
    for(var j=i+1; j<a.length; j++) {
      var aa = Math.abs(a[i]-a[j]);
      var bb = Math.abs(b[i]-b[j]);
      comp =+ Math.abs(aa - bb);
      count++;
    }
  }
  return comp/count;
}

// the goal is to find the 500 pictures
// most like the target image in 04

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
  return path.join(__dirname, '../..', 'instagrams', imgId+'.jpg');
}

co(function*() {
  var targets = [];

  for (var i = 0; i<targetImgs.length; i++) {
    var imgId = targetImgs[i] + '.mini';
    var imgPath = getPath(imgId);
    var img = yield getBasePixels(imgPath);
    targets.push(imgToList(img));
  }

  var scores = [];

  var reportRate = allImgs.length / 50;
  var nextReport = reportRate;

  for (var i=0; i<allImgs.length; i++) {
    var imgId = allImgs[i];
    var imgPath = getPath(imgId+ '.mini');
    var img = yield getBasePixels(imgPath);
    var data = imgToList(img);
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

  var matches = scores.slice(0, 100).map(function(score) {
    return score.imgId;
  });

  fs.writeFileSync(path.join(__dirname, 'matches.json'), JSON.stringify(matches, null, 2));

}).catch(function(err) {console.log(err)});
