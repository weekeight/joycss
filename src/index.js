var cssReader = require('./cssReader');
var utils     = require('../lib/utils');
var SpriteDef = require('./spriteDef');
var CssWrite  = require('./cssWrite');
var Tasks     = require('./tasks/');
var path      = require('path');
var fs        = require('fs');
var exists    = fs.existsSync || path.existsSync;

function Joycss(){
  this.init.apply(this, arguments);
}

var defaults = {
  global: {
    writeFile    : false,
    uploadImgs   : false,
    useImportant : false,
    nochange     : false,
    force8bit    : true,
    layout       : 'auto'
  }
};

Joycss.prototype = {
  constructor: Joycss,
  init: function(file, config){
    this.file = file;
    this.config = {};
    this._init(config);

    this._bind();
  },

  //初始化配置
  _init: function(config){
    this.config = utils.mixin(config, defaults);
    var file = this.file;

    console.log(this.config);
    var cssFile = file;
    var destFile = file;

    this._getConfig();

    if (this.config.global.writeFile){
      var sourceFile = file.replace('.css', '.source.css');
      if (exists(sourceFile)){
        cssFile = sourceFile;
      } else {
        cssFile = file;
      }
    } else {
      destFile = file.replace('.css', '.sprite.css');
    }

    this.cssReader = new cssReader({
      file: cssFile, copyFile: sourceFile
    });

    this.spriteDef = new SpriteDef({
      file: file,
      cssReader: this.cssReader,
      layout: this.config.global.layout,
      force8bit: this.config.global.force8bit,
      config: this.config
    });

    this.cssWrite = new CssWrite({
      destFile: destFile,
      cssReader: this.cssReader
    });

  },

  _bind: function(){
    var spriteDef = this.spriteDef;
    var cssWrite  = this.cssWrite;
    var nochange = this.config.global.nochange;
    spriteDef.on('finish:parser', function(){
      cssWrite.write(this.get('changedRules'), this.get('extraRules'));
      if (!nochange) this.createSprite();
    });

    var cwd = path.dirname(this.file);
    var _this = this;

    spriteDef.on('finish:merge', function(){
      var spritesImgs = this.get('spritesImgs');
      var cssImgs     = this.get('cssImgs');
      console.log(cssImgs);
      console.log(spritesImgs);
      new Tasks([
        {
          files: spritesImgs,
          task: 'quant'
        }
      ], cwd).on('success', function(){
        var config = _this.config;
        if (config.uploadImgs){
          var task = Tasks.upload(config.upload, cssImgs);
          task.on('finish:upload', _this._uploadEnd.bind(_this));
        } else {
          _this._writeConfig();
        }
      });
    });

  },

  _uploadEnd: function(maps){
    var cssWrite  = this.cssWrite;
    cssWrite.replace(maps);
    this.config.maps = maps;
    this._writeConfig();
  },

  _writeConfig: function(){

    delete this.config.upload;
    delete this.config.global.nochange;

    var text = JSON.stringify(this.config);
    text = this.formatJson(text);

    var file = this.file.replace('.css', '.json');
    fs.writeFile(file, text, function(err){
      if (err) {
        console.log('write config false');
        console.log(err);
      } else {
        console.log('write config success');
      }
    });

  },

  formatJson: function(val) {
    var retval = '';
    var str = val;
    var pos = 0;
    var strLen = str.length;
    var indentStr = '  ';
    var newLine = "\n";
    var _char = '';

    for (var i=0; i<strLen; i++) {
      _char = str.substring(i,i+1);

      if (_char == '}' || _char == ']') {
        retval = retval + newLine;
        pos = pos - 1;

        for (var j=0; j<pos; j++) {
          retval = retval + indentStr;
        }
      }

      retval = retval + _char;	

      if (_char == '{' || _char == '[' || _char == ',') {
        retval = retval + newLine;

        if (_char == '{' || _char == '[') {
          pos = pos + 1;
        }

        for (var k=0; k<pos; k++) {
          retval = retval + indentStr;
        }
      }
    }

    return retval;

  },

  _getConfig: function(){

    var localFile = this.file.replace('.css', '.json');

    if (exists(localFile)){
      var localConfig = JSON.parse(fs.readFileSync(localFile));

      if (this.config.global.nochange) {
        this.config = utils.mixin(localConfig, this.config);
      }

      if (this.config.uploadImgs){
        this._getUploadConfig();
      }
    }
  },

  _getUploadConfig: function(){
    var uploadFile = path.resolve(__dirname, '../../config.json');
    if (exists(uploadFile)){
      var upload = JSON.parse(fs.readFileSync(uploadFile));
      this.config.upload = upload;
    } else {
      console.log('[Error] upload has not config, please run joycss --config first');
    }
  }

};

module.exports = Joycss;