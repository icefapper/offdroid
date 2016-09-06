var e = 2,
    list = process.argv,
    fs = require('fs'),
    port = 8080,
    url2hash = {},
    hash2file = {};

if (e < list.length) {
  var l = parseInt(list[e++]);
  if ( l>= 0 )
    port = l;
}

var listOnly = false,
    selected = null;

if (e < list.length && list[e] === "list-only") { 
  listOnly = !false;
  selected = [];
}

var url = require('url');

var urlmap = listOnly ? '.offdroid-xml/.offdroid-urlmap' : '.all-urls'; 

var urlIsTool = false;
fs.readFileSync(urlmap)
  .toString()
  .split('\n')
  .forEach( function(line) {
        if (line === "#LATEST-TOOL")
          urlIsTool = !false;

        if (!line || line.charAt(0) === '#' )
          return;

        if (urlIsTool) return;

        var match = line.match(/^([a-f0-9A-F]{40})\s+([^\s]+)$/);
        if (!match) {
          console.error("invalid <hash url>: <"+line+">");
          return;
        }

        var u = url.parse(match[2]);
        url2hash[u.path] = match[1];
});

var has = {}.hasOwnProperty;
var sources = listOnly ? ['.offdroid-xml'] : fs.readFileSync('.sources')
  .toString()
  .split('\n');

sources.forEach( function(sourceFolder) {
     if (!sourceFolder) return;
     if (sourceFolder.charAt(0) === '#') return;

     if (sourceFolder.charAt(sourceFolder.length-1) === '/')
         sourceFolder = sourceFolder.substring(0, sourceFolder.length-1);
   
     var filemap = sourceFolder + '/.offdroid-filemap';
     var filemapContents = "";

     try {
        filemapContents = fs.readFileSync(filemap).toString();
     }
     catch (error) {
        console.error("error reading <"+filemap+">:\n" + error.toString());
     }     

     filemapContents.split('\n').forEach(function(line) {
        if (!line || line.charAt(0) === '#' ) return;

        var match = line.match(/^([a-f0-9A-F]{40})\s+([^\s]+)$/);
        if (!match) {
          console.error('Filemap: <'+filemap+'> has invalid <hash file> line: <'+line+'>');
          return;
        }

        var hash = match[1], file = match[2];
        hash2file[hash] = file;
     });
});  

function toHash(request) {
  switch (request.headers.host) {
     case 'dl.google.com':
     case 'dl-ssl.google.com':
        break;
     
     default:
        return "";
  } 

  var urlPath = url.parse(request.url).path;

  if (has.call(url2hash, urlPath))
    return url2hash[urlPath];

  return "";
}

require('http').createServer(function(request, response) {
  if (request.url === '/?close-server' ) {
     if (listOnly) {
       var e = 0;
       while(e < selected.length) {
          response.write (selected[e]+'\n');
          e++ ;
       }

       response.end();
     }

     process.exit(0);
  }

  var fileHash = toHash(request);
  if (fileHash === "" ) {
    if ( listOnly ) selected.push(request.url);
    response.writeHead(404);
    response.end();
  }
  else {
      var fileName = hash2file[fileHash];
      var fileStream = fs.createReadStream(fileName);
    
      fileStream.on('data', function(bytes) { 
           response.write(bytes);
      });
    
      fileStream.on('error', function(error) {
           console.error("ERROR SERVING FILE: <"+fileName+">: \n" + error.toString());
           response.writeHead(404);
           response.end();
      }) ; 
      fileStream.on('close', function() {
         response.end();
      });

  }

}).listen(port);
