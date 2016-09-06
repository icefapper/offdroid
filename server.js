var e = 2,
    list = process.argv,
    fs = require('fs'),
    port = 8080,
    urlList = {};

if (e < list.length) {
  var l = parseInt(list[e++]);
  if ( l>= 0 )
    port = l;
}

var url = require('url');

if (e < list.length) {
  var urlListFile = list[e++]; 
  var basePath = "";
  var n = urlListFile.lastIndexOf('/');
  if ( n >= 0 )
    basePath = urlListFile.substring(0, n);

  var nameMap = fs.readFileSync(urlListFile).toString().split('\n').forEach(
     function(line) {
        var match = line.match(/^\s*([0-9]+)\s+([^\s]*)\s*$/);
        if (!match) {
          console.log(line, "NOT MATCHING");
          return;
        }
        else 
          console.log("URL", match[2], "FILE", match[1] );

        var u = url.parse(match[2]);
        urlList[u. path] = basePath + '/' + match[1];
        console.log("<"+u.path+">: [" + urlList[u.path]+"]");
     }
  );
}
 
var has = {}.hasOwnProperty;

var fallBackFolder = "";
if (e < list.length) {
  fallBackFolder = list[e++];
  if (fallBackFolder.charAt(fallBackFolder.length-1) === '/')
    fallBackFolder = fallBackFolder.substring(0, fallBackFolder.length-1);
}

function resolve(requestedURL) {
  var u = url.parse(requestedURL);
  switch (u.hostname) {
     case 'dl.google.com':
     case 'dl-ssl.google.com':
        break;
     
     default:
        console.log("UNKNOWN HOST FOR <" + requestedURL + ">:" + u.hostname);
        return "";
  } 

  var file = u.path
  if (has.call(urlList, file))
    return urlList[file];

  console.log("COULD NOT LOCATE PATH " + file + " IN MAIN; LOOKING IN FALLBACK");

  if (fallBackFolder !== "" )
    return fallBackFolder+'/'+file;

  return "";
}
  
require('http').createServer(function(request, response) {
  if (request.url === '/?close-server' ) process.exit(1);

  var fileName = resolve(request.url);
  if (fileName === "" ) {
    console.log("NO FILE FOR: <" + request.url + ">" );
    response.writeHead(404);
    response.end();
  }
  else {
    try {
      var fileStream = fs.createReadStream(fileName);
    
      fileStream.on('data', function(bytes) { 
           response.write(bytes);
      });
    
      fileStream.on('error', function(error) {
           console.log("ERROR SERVING FILE: <"+fileName+">: \n" + error.toString());
           response.writeHead(404);
           response.end();
      }) ; 
      fileStream.on('close', function() {
         console.log('DONE SERVING', request.url);
         response.end();
      });

    }
    catch(e) {
       console.log("ERROR SERVING FILE: <"+fileName+">", e.toString());
    }
  }

}).listen(8080);

