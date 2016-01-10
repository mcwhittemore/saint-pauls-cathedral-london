module.exports = function(a, b) {
  var comp = 0;
  var count = 0;
  for (var i=0; i<a.length-1; i++) {
    for(var j=i+1; j<a.length; j++) {
      var aa = Math.abs(a[i]-a[j]);
      var bb = Math.abs(b[i]-b[j]);
      comp =+ Math.abs(aa - bb);
      count++;
    }
  }
  return comp/count;
}
