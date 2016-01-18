var levelup = require('levelup');
var path = require('path');
var db = levelup(path.join(__dirname, 'data', '0'));

db.get('394758,394758,394758,394758,394758-394758,394758,394758,394758,394758', function(err, data) {
  console.log(err, data);
});
