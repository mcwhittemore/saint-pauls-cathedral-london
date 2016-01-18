var fork = require('child_process').fork;

var Runner = module.exports = function(location) {
  this.location = location;
  this.child = fork(`${__dirname}/db.js`, [location]);
  this.stack = [];
  this.waitTime = 0;
  this.pending = 0;

  this.child.on('message', function(message) {
    if(message.err) {
      console.error(message.err);
      process.exit(1);
    }

    if(message === 'GOT_ONE') {
      this.pending--;
    }
  }.bind(this));

  this.child.on('error', function(err) {
    console.log(err.stack);
  });
}

Runner.prototype.push = function(colorId, row) {
  this.stack.push({colorId: colorId, row:row});
  this.pending++;
  if(this.stack.length===1) {
    this.__push();
  }
}

Runner.prototype.__push = function() {
  if(this.stack.length) {
    var item = this.stack.pop();
    var success = this.child.send(item);

    if(success!==true) {
      this.waitTime+=10;
    }
    else {
      this.waitTime = 0;
    }
    setTimeout(this.__push.bind(this), this.waitTime);
  }
}

Runner.prototype.memory = function() {
  this.child.send({memory:1});
}

Runner.prototype.clean = function() {
  this.child.send({saveAll: true});
}

Runner.prototype.getNumPending = function() {
  return this.pending;
}


