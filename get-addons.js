var xmlparser = require('./xml.js').XMLParser, 
    i = 2, 
    list = process.argv,
    m = "";

m = list[i++];

console.error("<ARGUMENTS>")
var e = i;
while (e < list.length) {
  console.error("<"+list[e]+">:", "<"+list[e+1]+">\n");
  e += 2 ;
}
console.error("</ARGUMENTS>\n");

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
       
var have = {};
var listNew = false;

function repo(urlList, fileList) {

  if (listNew )
    fs.readFileSync('.sources') // credits go to @leonleeann pointing out that list-packages will fail is called before add-source
      .toString().split('\n').forEach(function(sourceName) {
     if (!sourceName || sourceName === "") return;

     fs.readFileSync(sourceName + '/' + '.offdroid-filemap').toString().split('\n').forEach(function(line) {
       if (!line) return;
       line = line.match(/^([a-f0-9A-F]{40})\s+(.*)\s*$/);

       var hash = line[1], fileName = line[2];
       if (!have.hasOwnProperty(hash))
         have[hash] = [fileName];

       else have[hash].push(fileName);
     });
  });

  var urlHashmap = {};
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
    fileHashmap[item[1]] = item[2];
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

var hash = {};
var tool_nodes = [];

function one_repo(url, fileName) {
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

    hash[chk] = { u: u, n: n };
  };

  xml.listeners['sdk:tool'] = function(n) {
    tool_nodes.push(n);
  };

  xml.parseFile(fileName);
}

function addons_list(url, fileName) {

  var xml = new xmlparser();
  url = url.substring(0, url.lastIndexOf('/'));

  xml.listeners['sdk:url'] = 
  xml.listeners['url'] =  function(n) {

     var u = n.ch[0].ch;

     if ( u.indexOf('http://') !== 0 && u.indexOf('https://') !== 0)
       u=url+'/'+u;

     console.log(u);
  };

  xml.parseFile(fileName);
}
      
function findLatestTool() {
  var e = 0, latestTool = null;
  while (e < tool_nodes.length) {
    var currentTool = analyzeTool(tool_nodes[e]);
    if (latestTool === null ||
        revisionCompare(currentTool.revision, latestTool.revision) > 0)
      latestTool = currentTool;
    
    e++ ;
  }

  return latestTool;
}

function analyzeTool(n) {
  var revision = analyzeRevision(n.byName['sdk:revision'][0]);
  var archives = [];

  var list = n.byName['sdk:archives'][0].ch;
  var e = 0;
  while (e < list.length)
    archives.push(analyzeArchive(list[e++]));

  return { revision: revision, archives: archives };
}

function analyzeArchive(n) {
  var checksum = n.byName['sdk:checksum'],
      url = n.byName['sdk:url'],
      len = n.byName['sdk:size'],
      os = n.byName['sdk:host-os'];

  var n = { checksum: checksum[0].ch[0].ch,
           url: url[0].ch[0].ch,
           len: len[0].ch[0].ch,
           os: os ? os[0].ch[0]. ch : 'all' };

  return n;
}

function analyzeRevision(n) {

  var major = n.byName['sdk:major'],
      minor = n.byName['sdk:minor'],
      micro = n.byName['sdk:micro'];

  var preview = n.byName['sdk:preview'];

  return { preview: preview ? parseInt(preview[0].ch[0].ch) : 'no',
           minor: minor ? parseInt(minor[0].ch[0].ch) : 0,
           micro: micro ? parseInt(micro[0].ch[0].ch) : 0,
           major: parseInt(major ? major[0].ch[0].ch : n.ch[0].ch) };
}
       
function revisionCompare(r1, r2) {
  if (r1.preview !== r2.preview) {
    if ( r1.preview === 'no' ) return 1;
    if ( r2.preview === 'no' ) return -1;
  }

  return r1.major !== r2.major ? r1.major - r2.major :
         r1.minor !== r2.minor ? r1.minor - r2.minor :
         r1.micro !== r2.micro ? r1.micro - r2.micro :
         r1.preview - r2.preview;
}
 
if (m === "new") {
  listNew = !false;
  m = "repo";
}

if (m === "repo") {
  extract(repo);
  var total = 0; 
  var chk = "";

  for( chk in hash) {
    if (hash.hasOwnProperty(chk)) {
       if (listNew && have.hasOwnProperty(chk)) {
         console.error("SKIPPING <"+chk+">:", have[chk] );
         continue;
       }
 
       var n = hash[chk].n;
       var len = n.byName['size'] || n.byName['sdk:size'];
       len = parseInt(len[0].ch[0].ch);
       console.log( chk, hash[chk].u );
       total += len;
    }
  }
  
  console.log("#TOTAL", total, "bytes" );
  if (!listNew) { 
      var latestTool = findLatestTool().archives, e = 0;
    
      console.log("#LATEST-TOOL");
      while (e < latestTool.length) {
        console.log(hash[latestTool[e].checksum].u);
        ++e;
      }
  }  
}

else if( m === "addon")
  extract(addons_list);


