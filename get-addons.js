var xmlparser = require('./xml.js').XMLParser, 
    i = 2, 
    list = process.argv,
    m = "";

m = list[i++];
var fs = require('fs');

function extract(func) {
  while (i < list.length) {
    var url = list[i] ;
    i++;
    var fileName = list[i];
    
    func(url,fileName);
    i++;
  }
}

function path(n) {
  var namePath = n.name;
  n = n. parent;
  while (n.parent !== null) {
    namePath = n.name + ">" + namePath;
    n = n.parent;
  }

  return namePath;
}
        
var hash = {};
function repo(urlList, fileList) {
  var urlHashmap = {};

  var base = "";
  var baseIndex = fileList.lastIndexOf('/');
  if (baseIndex > 0)
    base = fileList.substring(0, baseIndex);
 
  var fileHashmap = {};
  fs.readFileSync(fileList).toString().split('\n').forEach(function(item) {
    if (!item) {
      //console.error("NULL FILEITEM");
      return;
    }
    if (item.charAt(0)==='#')
      return;

    //console.error("FILEITEM", item);
    item = item.match(/^\s*([a-f0-9A-F]{40})\s+(.*)\s*$/);
    fileHashmap[item[1]] = base + '/' + item[2];
  });
  
  fs.readFileSync(urlList).toString().split('\n').forEach(function(item) {
    if (!item) {
      //console.error("NULL URLITEM");
      return;
    } 
    if (item.charAt(0) === '#' )
      return;
 
    //console.error("URLITEM", item);
    item = item.match(/^\s*([a-f0-9A-F]{40})\s+(.*)\s*$/);
    var hash = item[1], url = item[2];
    if (!fileHashmap.hasOwnProperty(hash))
      throw new Error("no file for <" + url + "> " + hash); 
    urlHashmap[hash] = url;
  });

  var hash = "";
  for (hash in urlHashmap) { one_repo(urlHashmap[hash], fileHashmap[hash]); }
}

function one_repo(url, fileName) {
//console.error("EXTRACTING <"+url+">");
  var xml = new xmlparser();
  var url = url.substring(0, url.lastIndexOf('/'));

  xml.listeners['archive'] =
  xml.listeners['sdk:archive'] = function(n) {
    if (n.byName['complete'])
      n = n.byName['complete'][0];

    var chk = n.byName['sdk:checksum'] || n.byName['checksum'];
    chk = chk[0].ch[0].ch;
 
    var u = n.byName['sdk:url'];
    if (!u) u = n.byName['url'];
    u =  u[0].ch[0].ch;
    if ( u.indexOf('http://') !== 0 && u.indexOf('https://') !== 0)
      u =  url+'/'+u ;
 
//  console.error("    <"+u+">");

    hash[chk] = { u: u, n: n };
  };

  xml.parseFile(fileName);
}

function addons_list(url, fileName) {
//console.error("LISTING ADDONS FOR <"+url+">");

  var xml = new xmlparser();
  url = url.substring(0, url.lastIndexOf('/'));

  xml.listeners['sdk:url'] = 
  xml.listeners['url'] =  function(n) {

     var u = n.ch[0].ch;
//   console.error("    U: <"+u+">");

     if ( u.indexOf('http://') !== 0 && u.indexOf('https://') !== 0)
       u=url+'/'+u;

     console.log(u);
//   console.error("    R: <"+u+">");
     
  };

  xml.parseFile(fileName);
}
      
if (m === "repo") {
  extract(repo);
  var total = 0; 
  var chk = "";

  for( chk in hash) {
    if (hash.hasOwnProperty(chk)) {

       var n = hash[chk].n;
       var len = n.byName['size'] || n.byName['sdk:size'];
       len = parseInt(len[0].ch[0].ch);
       console.log( chk, hash[chk].u );
       total += len;
    }
  }
  
  console.log("#TOTAL", total, "bytes" );
}

else if( m === "addon")
  extract(addons_list);


