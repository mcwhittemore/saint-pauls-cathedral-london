module.exports = function(img) {
  var out = [];
  for (var x = 0; x <img.shape[0]; x++) {
    for (var y = 0; y < img.shape[1]; y++) {
      var max = img.get(x, y, 0);
      for (var c=1; c<3; c++) {
        var v = img.get(x, y, c);
        max = v > max ? v : max;
      }
      out.push(max);
    }
  }
  return out;
}
