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

function getRow(data) {

}

function simpleSearch(colorId, db) {
  return new Promise(function(resolve, reject) {
    db.get(colorId, function(err, data) {
      if(err) {
        resolve(false);
      }
      else {
        resolve(getRow(data));
      }
    });
  });
}

function prefixSearch(prefix, db) {
  return new Promise(function(resolve, reject) {

  });
}




