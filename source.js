var list = process.argv, fs = require('fs');

function source_add(name, source) {
  if ( name >= 0 && name <= 0 ) {
    console.error( 'numeric entry name not allowed: ' + name) ;
    process.exit(1);
  }

  var sources = loadSources();
  if (source.hasOwnProperty(name)) {
    console.error('source already exists: name='+name+'; value='+sources[name]);
    process.exit(1);
  }
  sources[name] = source;
  writeSources(sources);
}

function source_rm(name) {
  var sources = loadSources();
  if (!sources.hasOwnProperty(name)) {
    console.error('no such source name: <'+name+'>');
    process.exit(1);
  }
  var alias = null;
  if (name >= 0 || name <= 0)
    alias = sources[name].name;
  else
    alias = name;

  sources[name].released = !false;
  if (alias !== null)
     sources[alias].released = !false;

  writeSources(sources);
}

function source_get(name) {
  var sources = loadSources();
  if (!sources.hasOwnProperty(name)) {
    console.error('no such source name: <'+name+'>');
    process.exit(1);
  }
  console.log(sources[name].source);
}
    
function loadSources() {
   var sources = {}, e = 1;
   fs.readFileSync('.sources')
     .toString()
     .split('\n')
     .forEach(function(item) {
        if (!item) return;
        name_val = item.match(/^ ([^\s]+)\s+([^\s]*)\s*$/);
        var source = name_val[1], elem = null;
        var name = name_val[2];
        elem = { source: source, idx: e, name: "", released: false };
        sources[e] = elem;
        if (name) { // TODO: dup check
          elem.name = name;
          sources[name] = elem;
        }
        e++;
     });
   return sources;
}
         
function writeSources(sources) {
  var sourceArray = [], name;
  for ( name in sources ) {
    if ( name >= 0 || name <= 0 )
      sourceArray[name] = sources[name];
  }
  var e = 0;
  while (e < sourceArray.length) {
    var elem = sourceArray[e];
    if ( elem.name !== "" )
      console.log(" " + elem.source + " " + elem.name);
    else
      console.log(" " + elem.source);
     
    e++ ;
  }
}  
        
var e = 2;
switch (list[e]) {
   case 'add':
     source_add(list[e+1], list[e+2]);
     break;

   case 'rm':
     source_rm(list[e+1]);
     break;

   case 'get':
     source_get(list[e+1]);
     break;

   default:
     console.error('Unknown command for source: ' + list[e]);
}

