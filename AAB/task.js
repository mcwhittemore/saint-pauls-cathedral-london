var getImg = require('./get-img');
var co = require("co");
var listOfImages = process.argv.slice(2);
var toReferenceImg = require('./to-reference-img');
var path = require("path");

co(function*(){

  var reference = yield getImg(path.join(__dirname, './results/reference.jpg'));

  var start = Date.now();
  var sub = null;
  for(var i=0; i<listOfImages.length; i++){
    var imgId = listOfImages[i];
    sub = yield toReferenceImg(imgId);
    var score = 0;
    for(var x=0; x<640; x++) {
      for(var y=0; y<640; y++) {
        var refV = reference.get(x, y, 1);
        var subV = sub.get(x, y, 1);

        if(refV === 75 && subV === 75) {
          score+=2;
        }
        else if(refV === 75 && subV === 150) {
          score+=1;
        }
        else if(refV === 150 && subV === 150) {
          score+=4;
        }
        else if(refV === 150 && subV === 75) {
          score-=2;
        }
      }
    }

    console.log(imgId+'\t'+score);
  }

}).then(function() {
  process.exit(0);
}).catch(function(err){
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
});
