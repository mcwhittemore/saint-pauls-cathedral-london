var input = require('./input.json');
var fs = require('fs');
var request = require('request');
var path = require('path');

// filter out dupes and reduce to img ids


var output = input.reduce(function(out, img) {
  var imgId = img.split('/')[4];
  out[imgId] = 1;
  return out;
}, {});

var imgIds = Object.keys(output);

fs.writeFileSync(__dirname+'/img-ids.json', JSON.stringify(imgIds, null, 2));

var nextImg = 0;
var getImg = function() {
  var imgId = imgIds[nextImg];
  var url = 'http://instagram.com/p/'+imgId+'/media/?size=l';
  nextImg++;
  request(url)
    .pipe(fs.createWriteStream(path.join(__dirname, '../instagrams', imgId+'.jpg'))).on('finish', function() {
      console.log('done', url, nextImg, imgIds.length);
      if(nextImg < imgIds.length) {
        getImg();
      }
    });
}

getImg();
getImg();
getImg();
getImg();
getImg();
getImg();
