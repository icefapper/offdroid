var x = require('./xml.js').XMLParser;
var fs = require('fs');
var contents = fs.readFileSync(process.argv[2], 'utf-8').toString();
var parser = new x();
parser.listeners['metadata'] =
function(n) { 
  var list = n.ch, l = 0;
  while (l < list.length)
    console.log(list[l++].name.replace(/\./g,'/'));
};
// console.log(contents, process.argv[2]);
parser.parseString(contents);
