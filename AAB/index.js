console.log('----- AAB ------');

var get
var co = require("co");
var listOfImages = require("../standardize-imgs/good-img-ids.json");
var toReferenceImg = require('./to-reference-img');
var exec = require('child_process').exec;
var path = require('path');
var savePixels = require("save-pixels");
var fs = require("fs");

var STARTER_ID = '8-fIrvwtnE';

var start = Date.now();

var saveImage = function(pixels, imgId){
  savePixels(pixels, "jpg").pipe(fs.createWriteStream(path.join(__dirname, "./results/"+imgId+".jpg")));
  return new Promise(function(resolve){
    setTimeout(resolve, 200);
  });
}

var index = 0;
var done = 0;
var noError = true;
var addRate = 10;
var makeImg = function() {
  var imgIds = listOfImages.slice(index, index+addRate);
  index += addRate;
  if(imgIds.length && noError) {
    var prom = new Promise(function(resolve, reject) {
      var task = path.join(__dirname, 'task.js');
      var ids = imgIds.join(' ');
      exec('node '+task+' '+ids, function(err, stdout, stderr) {
        done += addRate;
        if(err) {
          console.error(stderr);
          noError = false;
          reject(err);
        }
        else {
          var now = Date.now();
          var total = (now - start) / 60000;
          console.log(done, (100/listOfImages.length)*done, total, (total/done) * listOfImages.length);
          console.log(stdout);
          resolve();
        }
      });
    });

    prom.then(function() {
      makeImg();
    });
  }
}

co(function*(){
  var reference = yield toReferenceImg(STARTER_ID);
  saveImage(reference, 'reference');
  return reference;
}).then(function(reference) {
  makeImg();
  makeImg();
  makeImg();
}).catch(function(err){
  console.log(err.message);
  console.log(err.stack);
});
