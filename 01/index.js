var input = require('./input.json');
var fs = require('fs');

// filter out dupes and reduce to img ids


var output = input.reduce(function(out, img) {
  var imgId = img.split('/')[4];
  out[imgId] = 1;
  return out;
}, {});

var imgIds = Object.keys(output);

fs.writeFileSync(__dirname+'/img-ids.json', JSON.stringify(imgIds, null, 2));
