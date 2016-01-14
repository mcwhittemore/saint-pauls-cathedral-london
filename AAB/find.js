var path = require('path');
var fs = require('fs');

var file = fs.readFileSync(path.join(__dirname, 'results', 'scores.txt'));
var lines = file.toString().split('\n');

var scores = [];
for(var i=0; i<lines.length; i++){
  var line = lines[i];
  if(line.indexOf('\t') > -1) {
    var data = line.split('\t');
    scores.push({
      id: data[0],
      score: parseInt(data[1])
    });
  }
}

scores.sort(function(a, b) {
  return b.score - a.score;
});

var best = scores.slice(0, 100);

for (var i=0; i<best.length; i++) {
  console.log(best[i].id, best[i].score);
}

console.log(scores.length, best.length, best[0].score, best[best.length-1].score);
