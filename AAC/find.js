var path = require('path');
var levelup = require('levelup');

var dbsById = {};
var colorIdUseCount = {};

module.exports = function(left, top) {
  var dbId = Math.floor(left[0]/250);
  if(dbsById[dbId] === undefined) {
    dbsById[dbId] = levelup(path.join(__dirname, 'data', ''+dbId));
  }

  if(top) {
    return simpleSearch([left, top].join('-'), dbsById[dbId]);
  }
  else {
    return prefixSearch([left].join('-'), dbsById[dbId]);
  }
}

function getRow(colorId, data) {
  colorIdUseCount[colorId] = colorIdUseCount[colorId] || 0;
  var rows = data.split('\n');
  var row = rows[colorIdUseCount[colorId]] || false;
  if(row) {
    colorIdUseCount[colorId]++;
  }
  return row;
}

function simpleSearch(colorId, db) {
  return new Promise(function(resolve, reject) {
    db.get(colorId, function(err, data) {
      if(err) {
        resolve(false);
      }
      else {
        resolve(getRow(colorId, data));
      }
    });
  });
}

function prefixSearch(prefix, db) {
  var done = false;
  return new Promise(function(resolve, reject) {
    var stream = db.createKeyStream();
    stream.on('data', function(key) {
      if(key.indexOf(prefix) === 0) {
        stream.pause();
        db.get(key, function(err, data) {
          if(err) {
            stream.resume();
          }
          else {
            var row = getRow(key, data);
            if(row) {
              resolve(row);
              done = true;
              stream.destroy();
            }
            else {
              stream.resume();
            }
          }
        });
      }
    });
    stream.on('end', function() {
      if(done === false) {
        resolve(false);
      }
    })
  });
}




