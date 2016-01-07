var path = require('path');
var fs = require('fs');
var imgIds = require('./target-imgs.json');
var lastImg = 0;

var koa = require('koa');

var app = koa();
var ready = false;
var good = [];

app.use(function *(){
  if (ready) {
    if(this.path === '/good.jpg') {
      good.push(imgIds[lastImg]);
      fs.writeFileSync(path.join(__dirname, 'target-imgs.json'), JSON.stringify(good, null, 2));
    }
    lastImg++;
  }
  this.set('content-type', 'image/jpg');
  this.body = fs.createReadStream(path.join(__dirname, '..', 'instagrams', imgIds[lastImg]+'.mini.jpg'));
  ready = true;
});

app.listen(3000);
