var co = require('co');
var getPixels = require("get-pixels");
var imgIds = require('../standardize-imgs/good-img-ids.json');
var path = require('path');
var fs = require('fs');
var dbRunner = require('./db-runner');

var dbIds = [];
var dbsById = {};

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

var leftStride = [];
var rightStride = [];
var topStride = [];
var bottomStride = [];

var STRIDE = 10

for(var i=0; i<STRIDE; i++) {
  leftStride.push([0, i]);
  rightStride.push([STRIDE-1, i]);
  topStride.push([i, 0]);
  bottomStride.push([i, STRIDE-1]);
}

var numPending = function() {
  var pending = 0;
  for(var i=0; i<dbIds.length; i++) {
    var dbId = dbIds[i];
    pending += dbsById[dbId].getNumPending();
  }
  return pending;
}

var waitFor = function(num) {
  return new Promise(function(resolve) {
    var ping = function() {
      var pending = numPending();
      if(pending <= num) {
        resolve();
      }
      else {
        setTimeout(ping, 0);
      }
    }
    ping();
  });
}

var pause = function(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

co(function*() {
  var start = process.hrtime();
  var last = process.hrtime();
  var x, y, img, left, right, top, bottom, dbId, colorId, row, done, total, mem;
  for(var i=0; i<imgIds.length; i++) {
    imgId = imgIds[i];
    img = yield getBasePixels(getPath(imgId));
    for(x=0; x<640; x+=STRIDE) {
      for(y=0; y<640; y+=STRIDE) {
        left = [];
        for(var j=0; j<leftStride.length; j++) {
          var red = Math.floor(img.get(x+leftStride[j][0], y+leftStride[j][1], 0) / 32);
          var green = Math.floor(img.get(x+leftStride[j][0], y+leftStride[j][1], 1) / 32);
          var blue = Math.floor(img.get(x+leftStride[j][0], y+leftStride[j][1], 2) / 32);

          left.push(red << 16 | green << 8 | blue);
        }

        right = [];
        for(var j=0; j<rightStride.length; j++) {
          var red = Math.floor(img.get(x+rightStride[j][0], y+rightStride[j][1], 0) / 32);
          var green = Math.floor(img.get(x+rightStride[j][0], y+rightStride[j][1], 1) / 32);
          var blue = Math.floor(img.get(x+rightStride[j][0], y+rightStride[j][1], 2) / 32);

          right.push(red << 16 | green << 8 | blue);
        }

        top = [];
        for(var j=0; j<topStride.length; j++) {
          var red = Math.floor(img.get(x+topStride[j][0], y+topStride[j][1], 0) / 32);
          var green = Math.floor(img.get(x+topStride[j][0], y+topStride[j][1], 1) / 32);
          var blue = Math.floor(img.get(x+topStride[j][0], y+topStride[j][1], 2) / 32);

          top.push(red << 16 | green << 8 | blue);
        }

        bottom = [];
        for(var j=0; j<bottomStride.length; j++) {
          var red = Math.floor(img.get(x+bottomStride[j][0], y+bottomStride[j][1], 0) / 32);
          var green = Math.floor(img.get(x+bottomStride[j][0], y+bottomStride[j][1], 1) / 32);
          var blue = Math.floor(img.get(x+bottomStride[j][0], y+bottomStride[j][1], 2) / 32);

          bottom.push(red << 16 | green << 8 | blue);
        }

        dbId = Math.floor(left[0]/250);
        colorId = [left, top].join('-');
        row = [imgId, x, y, left, right, top, bottom].join('\t');
        if(dbsById[dbId] === undefined) {
          dbsById[dbId] = new dbRunner(path.join(__dirname, 'data', ''+dbId));
          dbIds.push(dbId);
        }
        dbsById[dbId].push(colorId, row);
      }
      yield waitFor(500);
    }
    img = null;
    done = i+1;
    if(done%20 === 0) {
      var diff = process.hrtime(start);
      var lastDiff = process.hrtime(last);
      last = process.hrtime();
      var total = (diff[0] * 1e9 + diff[1]) / 60000000000;
      var lastTotal = (lastDiff[0] * 1e9 + lastDiff[1]) / 60000000000;
      var percentDone = ((100/imgIds.length)*done).toFixed(4);
      var lastPer = (lastTotal).toFixed(4);
      var totalTime = ((total/done) * imgIds.length).toFixed(4);
      var timeLeft = ((total/done) * (imgIds.length-done)).toFixed(4);
      mem = process.memoryUsage();
      var percenetMemUsed = ((100/mem.heapTotal) * mem.heapUsed).toFixed(4);
      console.log([done, percentDone, lastPer, totalTime, timeLeft, mem.heapUsed, mem.heapTotal, percenetMemUsed, numPending()].join('\t'));
    }
  }

  for(var i=0; i<dbIds.length; i++) {
    var dbId = dbIds[i];
    dbsById[dbId].clean();
  }

}).catch(function(err){
  console.log(err.message);
  console.log(err.stack);
});
