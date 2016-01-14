var ndarray = require('ndarray');
var getBasePixels = require('./get-img');
var path = require("path");

var getPath = function(imgId){
  return path.join(__dirname, "../instagrams", imgId+".square.jpg");
}

module.exports = function*(id){
  var img = yield getBasePixels(getPath(id));

  var hold = {};

  var divider = 64;

  for (var x = 0; x < img.shape[0]; x++) {
    for (var y = 0; y < img.shape[1]; y++) {
      var red = Math.floor(img.get(x, y, 0) / divider);
      var green = Math.floor(img.get(x, y, 1) / divider);
      var blue = Math.floor(img.get(x, y, 2) / divider);
      var color = Math.max(red, green, blue) + red + green + blue;

      hold[x+'-'+y] = {
        x: x,
        y: y,
        color: color
      }
    }
  }

  var groups = [[]];
  var dontMatchIds = [];
  var matchIds = [Object.keys(hold)[0]];
  var haveSeen = {};
  var groupId = 0;
  var groupColor = hold[matchIds[0]].color;
  var count = 0;
  while(matchIds.length) {
    var id = matchIds.pop();
    var data = hold[id];
    if (data && haveSeen[id] !== true) {
      haveSeen[id] = true;
      if (data.color === groupColor) {
        groups[groupId].push(data);
        count++;
        delete hold[id];
        matchIds.push([data.x+1, data.y].join('-'));
        matchIds.push([data.x-1, data.y].join('-'));
        matchIds.push([data.x, data.y+1].join('-'));
        matchIds.push([data.x, data.y-1].join('-'));
      }
      else {
        dontMatchIds.push(id);
      }
    }

    if(matchIds.length === 0 && dontMatchIds.length) {
      matchIds = dontMatchIds;
      groupColor = null;
      while(groupColor === null && matchIds.length) {
        if(hold[matchIds[matchIds.length-1]]) {
          groupColor = hold[matchIds[matchIds.length-1]].color;
          groupId = groups.length;
          groups.push([]);
          haveSeen = {};
        }
        else {
          matchIds.pop();
        }
      }
      dontMatchIds = [];
    }
  }

  groups = groups.sort(function(a, b) {
    return b.length - a.length;
  }).slice(Math.floor(groups.length/9));

  var referenceImg = ndarray([], img.shape);

  groups.sort(function(a, b) {
    return b.length - a.length;
  });

  var groupPolygons = groups.map(function(group, gid) {

    var cells = {};
    var ids = [];
    for (var i=0; i<group.length; i++) {
      var cell = group[i];
      var id = cell.x+'-'+cell.y;
      ids.push(id);
      cells[id] = {
        x: cell.x,
        y: cell.y,
        sides: [
          [cell.x+1, cell.y],
          [cell.x-1, cell.y],
          [cell.x, cell.y+1],
          [cell.x, cell.y-1]
        ],
      }
    }

    var polygon = ids.filter(function(id) {
      var toKeep = cells[id].sides.filter(function(side) {
        return cells[side[0]+'-'+side[1]];
      }).length < 4;
      if(toKeep) {
        return true;
      }
      else {
        referenceImg.set(cells[id].x, cells[id].y, 1, 150);
        return false;
      }
    }).map(function(id){
      return cells[id];
    });


    return polygon
  });

  groupPolygons.forEach(function(poly) {
    poly.forEach(function(cell) {
      referenceImg.set(cell.x, cell.y, 1, 75);
    });
  });

  return referenceImg;
}
