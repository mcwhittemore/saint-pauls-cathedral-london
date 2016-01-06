var imgIds = require('../01/img-ids.json');
var request = require('request');
var path = require('path');
var fs = require('fs');

var nextImg = 228;
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
