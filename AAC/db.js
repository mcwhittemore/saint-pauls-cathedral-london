var levelup = require('levelup');
var db = levelup(process.argv[2]);

var toSaveById = {};
var countById = {};
var maxCount = 5;

process.on('message', function(message) {
  if(message.die) {
    process.exit(0);
  }
  else if(message.memory === 1) {
    var mem = process.memoryUsage();
    console.log(process.argv[2], mem.heapUsed, mem.heapTotal)
  }
  else if(message.saveAll) {
    var ids = Object.keys(toSaveById);
    for(var i=0; i<ids.length; i++) {
      var id = ids[i];
      save(id, true);
    }
  }
  else {
    enqueue(message.colorId, message.row);
  }
});

function enqueue(colorId, row) {
  if(countById[colorId] === undefined) {
    db.get(colorId, function(err, data) {
      if(err) {
        countById[colorId] = 1;
        toSaveById[colorId] = row;
        process.send('GOT_ONE');
      }
      else {
        process.send('GOT_ONE');
      }
    });
  }
  else if(countById[colorId] < maxCount-1) {
    process.send('GOT_ONE');
    countById[colorId]++;
    toSaveById[colorId] += '\n'+row;
  }
  else if(countById[colorId] === maxCount-1) {
    process.send('GOT_ONE');
    toSaveById[colorId] += '\n'+row;
    save(colorId, false);
  }
}

function save(colorId, end) {
  var content = toSaveById[colorId];
  delete countById[colorId];
  delete toSaveById[colorId];
  db.put(colorId, content, function(err) {
    if(err) {
      process.send({error:err.stack});
    }
    else if(end) {
      var keys = Object.keys(toSaveById);
      if (keys.length === 0) {
        process.exit(0);
      }
    }
  });
}
