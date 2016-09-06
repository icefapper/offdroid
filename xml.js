var Parser = require('node-expat').Parser;

var has = {}.hasOwnProperty;

function startElement(name, attr) {
//console.log('START', name, attr);
  var node = {name: name, attr: attr, ch: [], parent: this.currentNode, byName: {} };
  this.currentNode.ch.push(node);
  this.currentNode = node;
}

function endElement(name) {
//console.log('END', name);
  if (has.call(this.listeners, name)) {
    this.listeners[name].call(this, this.currentNode);
  }
  var parent = this.currentNode.parent;
  if ( !has.call(parent.byName, name) )
     parent.byName[name] = [];

  parent.byName[name].push(this.currentNode); 
  this.currentNode = parent;
}

function text(txt) {
//console.log('TEXT', text );
  var txt = this.preprocessText.call(this, txt);
  if (txt === "")
    return;

  this.currentNode.ch.push({
     name: '#text', attr: [], ch: txt, parent: this.currentNode });
}
  
function bind(func, _this) {
  return function() {
     return  func.apply(_this, arguments);
  };
}

function nospace(txt) {
  var e = 0;
  while (e < txt.length) {
    switch(txt.charAt(e)) {
       case '\t':
       case ' ':
       case '\n':
          return "";
       
       default:
         e++; 
     }
  }

  return txt;
}

function error(e) {
  this.error = e;
}

function XMLParser() {
  this.currentNode = {name: '#document', attr: [], ch: [], parent: null, byName: {} } ;
  this.parser = new Parser();
  this.listeners = {};
  this.preprocessText = nospace;
  this.parser.on('startElement', bind(startElement, this) );
  this.parser.on('endElement', bind(endElement, this) );
  this.parser.on('text', bind(text, this) ); 
  this.error = null;
  this.parser.on('error', bind(error, this) ) ;
}

XMLParser.prototype.parseString = function(str) { 
  return this.parser.write(str);
};

XMLParser.prototype.parseFile = function(fileName) {
  var fs = require('fs');
  return this.parseString(fs.readFileSync(fileName, 'utf-8'));
};

var e = module.exports;
e.XMLParser = XMLParser;

