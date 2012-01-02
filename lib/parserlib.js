/*!
 Parser-Lib
 Copyright (c) 2009-2011 Nicholas C. Zakas. All rights reserved.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 */
/* Version v0.1.0, Build time: 28-November-2011 12:21:44 */
var parserlib = {};
(function(){


  /**
   * A generic base to inherit from for any object
   * that needs event handling.
   * @class EventTarget
   * @constructor
   */
  function EventTarget(){

    /**
     * The array of listeners for various events.
     * @type Object
     * @property _listeners
     * @private
     */
    this._listeners = {};    
  }

  EventTarget.prototype = {

    //restore constructor
    constructor: EventTarget,

    /**
     * Adds a listener for a given event type.
     * @param {String} type The type of event to add a listener for.
     * @param {Function} listener The function to call when the event occurs.
     * @return {void}
     * @method addListener
     */
    addListener: function(type, listener){
      if (!this._listeners[type]){
        this._listeners[type] = [];
      }

      this._listeners[type].push(listener);
    },

    /**
     * Fires an event based on the passed-in object.
     * @param {Object|String} event An object with at least a 'type' attribute
     *      or a string indicating the event name.
     * @return {void}
     * @method fire
     */    
    fire: function(event){
      if (typeof event == "string"){
        event = { type: event };
      }
      if (typeof event.target != "undefined"){
        event.target = this;
      }

      if (typeof event.type == "undefined"){
        throw new Error("Event object missing 'type' property.");
      }

      if (this._listeners[event.type]){

        //create a copy of the array and use that so listeners can't chane
        var listeners = this._listeners[event.type].concat();
        for (var i=0, len=listeners.length; i < len; i++){
          listeners[i].call(this, event);
        }
      }            
    },

    /**
     * Removes a listener for a given event type.
     * @param {String} type The type of event to remove a listener from.
     * @param {Function} listener The function to remove from the event.
     * @return {void}
     * @method removeListener
     */
    removeListener: function(type, listener){
      if (this._listeners[type]){
        var listeners = this._listeners[type];
        for (var i=0, len=listeners.length; i < len; i++){
          if (listeners[i] === listener){
            listeners.splice(i, 1);
            break;
          }
        }


      }            
    }
  };
  /**
   * Convenient way to read through strings.
   * @namespace parserlib.util
   * @class StringReader
   * @constructor
   * @param {String} text The text to read.
   */
  function StringReader(text){

    /**
     * The input text with line endings normalized.
     * @property _input
     * @type String
     * @private
     */
    this._input = text.replace(/\n\r?/g, "\n");


    /**
     * The row for the character to be read next.
     * @property _line
     * @type int
     * @private
     */
    this._line = 1;


    /**
     * The column for the character to be read next.
     * @property _col
     * @type int
     * @private
     */
    this._col = 1;

    /**
     * The index of the character in the input to be read next.
     * @property _cursor
     * @type int
     * @private
     */
    this._cursor = 0;
  }

  StringReader.prototype = {

    //restore constructor
    constructor: StringReader,

    //-------------------------------------------------------------------------
    // Position info
    //-------------------------------------------------------------------------

    /**
     * Returns the column of the character to be read next.
     * @return {int} The column of the character to be read next.
     * @method getCol
     */
    getCol: function(){
      return this._col;
    },

    /**
     * Returns the row of the character to be read next.
     * @return {int} The row of the character to be read next.
     * @method getLine
     */
    getLine: function(){
      return this._line ;
    },

    /**
     * Determines if you're at the end of the input.
     * @return {Boolean} True if there's no more input, false otherwise.
     * @method eof
     */
    eof: function(){
      return (this._cursor == this._input.length);
    },

    //-------------------------------------------------------------------------
    // Basic reading
    //-------------------------------------------------------------------------

    /**
     * Reads the next character without advancing the cursor.
     * @param {int} count How many characters to look ahead (default is 1).
     * @return {String} The next character or null if there is no next character.
     * @method peek
     */
    peek: function(count){
      var c = null;
      count = (typeof count == "undefined" ? 1 : count);

      //if we're not at the end of the input...
      if (this._cursor < this._input.length){

        //get character and increment cursor and column
        c = this._input.charAt(this._cursor + count - 1);
      }

      return c;
    },

    /**
     * Reads the next character from the input and adjusts the row and column
     * accordingly.
     * @return {String} The next character or null if there is no next character.
     * @method read
     */
    read: function(){
      var c = null;

      //if we're not at the end of the input...
      if (this._cursor < this._input.length){

        //if the last character was a newline, increment row count
        //and reset column count
        if (this._input.charAt(this._cursor) == "\n"){
          this._line++;
          this._col=1;
        } else {
          this._col++;
        }

        //get character and increment cursor and column
        c = this._input.charAt(this._cursor++);
      }

      return c;
    },

    //-------------------------------------------------------------------------
    // Misc
    //-------------------------------------------------------------------------

    /**
     * Saves the current location so it can be returned to later.
     * @method mark
     * @return {void}
     */
    mark: function(){
      this._bookmark = {
        cursor: this._cursor,
        line:   this._line,
        col:    this._col
      };
    },

    reset: function(){
      if (this._bookmark){
        this._cursor = this._bookmark.cursor;
        this._line = this._bookmark.line;
        this._col = this._bookmark.col;
        delete this._bookmark;
      }
    },

    //-------------------------------------------------------------------------
    // Advanced reading
    //-------------------------------------------------------------------------

    /**
     * Reads up to and including the given string. Throws an error if that
     * string is not found.
     * @param {String} pattern The string to read.
     * @return {String} The string when it is found.
     * @throws Error when the string pattern is not found.
     * @method readTo
     */
    readTo: function(pattern){

      var buffer = "",
          c;

      /*
       * First, buffer must be the same length as the pattern.
       * Then, buffer must end with the pattern or else reach the
       * end of the input.
       */
      while (buffer.length < pattern.length || buffer.lastIndexOf(pattern) != buffer.length - pattern.length){
        c = this.read();
        if (c){
          buffer += c;
        } else {
          throw new Error("Expected \"" + pattern + "\" at line " + this._line  + ", col " + this._col + ".");
        }
      }

      return buffer;

    },

    /**
     * Reads characters while each character causes the given
     * filter function to return true. The function is passed
     * in each character and either returns true to continue
     * reading or false to stop.
     * @param {Function} filter The function to read on each character.
     * @return {String} The string made up of all characters that passed the
     *      filter check.
     * @method readWhile
     */
    readWhile: function(filter){

      var buffer = "",
          c = this.read();

      while(c !== null && filter(c)){
        buffer += c;
        c = this.read();
      }

      return buffer;

    },

    /**
     * Reads characters that match either text or a regular expression and
     * returns those characters. If a match is found, the row and column
     * are adjusted; if no match is found, the reader's state is unchanged.
     * reading or false to stop.
     * @param {String|RegExp} matchter If a string, then the literal string
     *      value is searched for. If a regular expression, then any string
     *      matching the pattern is search for.
     * @return {String} The string made up of all characters that matched or
     *      null if there was no match.
     * @method readMatch
     */
    readMatch: function(matcher){

      var source = this._input.substring(this._cursor),
          value = null;

      //if it's a string, just do a straight match
      if (typeof matcher == "string"){
        if (source.indexOf(matcher) === 0){
          value = this.readCount(matcher.length);
        }
      } else if (matcher instanceof RegExp){
        if (matcher.test(source)){
          value = this.readCount(RegExp.lastMatch.length);
        }
      }

      return value;
    },


    /**
     * Reads a given number of characters. If the end of the input is reached,
     * it reads only the remaining characters and does not throw an error.
     * @param {int} count The number of characters to read.
     * @return {String} The string made up the read characters.
     * @method readCount
     */
    readCount: function(count){
      var buffer = "";

      while(count--){
        buffer += this.read();
      }

      return buffer;
    }

  };
  /**
   * Type to use when a syntax error occurs.
   * @class SyntaxError
   * @namespace parserlib.util
   * @constructor
   * @param {String} message The error message.
   * @param {int} line The line at which the error occurred.
   * @param {int} col The column at which the error occurred.
   */
  function SyntaxError(message, line, col){

    /**
     * The column at which the error occurred.
     * @type int
     * @property col
     */
    this.col = col;

    /**
     * The line at which the error occurred.
     * @type int
     * @property line
     */
    this.line = line;

    /**
     * The text representation of the unit.
     * @type String
     * @property text
     */
    this.message = message;

  }

  //inherit from Error
  SyntaxError.prototype = new Error();
  /**
   * Base type to represent a single syntactic unit.
   * @class SyntaxUnit
   * @namespace parserlib.util
   * @constructor
   * @param {String} text The text of the unit.
   * @param {int} line The line of text on which the unit resides.
   * @param {int} col The column of text on which the unit resides.
   */
  function SyntaxUnit(text, line, col, type){


    /**
     * The column of text on which the unit resides.
     * @type int
     * @property col
     */
    this.col = col;

    /**
     * The line of text on which the unit resides.
     * @type int
     * @property line
     */
    this.line = line;

    /**
     * The text representation of the unit.
     * @type String
     * @property text
     */
    this.text = text;

    /**
     * The type of syntax unit.
     * @type int
     * @property type
     */
    this.type = type;
  }

  /**
   * Create a new syntax unit based solely on the given token.
   * Convenience method for creating a new syntax unit when
   * it represents a single token instead of multiple.
   * @param {Object} token The token object to represent.
   * @return {parserlib.util.SyntaxUnit} The object representing the token.
   * @static
   * @method fromToken
   */
  SyntaxUnit.fromToken = function(token){
    return new SyntaxUnit(token.value, token.startLine, token.startCol);
  };

  SyntaxUnit.prototype = {

    //restore constructor
    constructor: SyntaxUnit,

    /**
     * Returns the text representation of the unit.
     * @return {String} The text representation of the unit.
     * @method valueOf
     */
    valueOf: function(){
      return this.toString();
    },

    /**
     * Returns the text representation of the unit.
     * @return {String} The text representation of the unit.
     * @method toString
     */
    toString: function(){
      return this.text;
    }

  };
  /*global StringReader, SyntaxError*/

  /**
   * Generic TokenStream providing base functionality.
   * @class TokenStreamBase
   * @namespace parserlib.util
   * @constructor
   * @param {String|StringReader} input The text to tokenize or a reader from 
   *      which to read the input.
   */
  function TokenStreamBase(input, tokenData){

    /**
     * The string reader for easy access to the text.
     * @type StringReader
     * @property _reader
     * @private
     */
    this._reader = input ? new StringReader(input.toString()) : null;

    /**
     * Token object for the last consumed token.
     * @type Token
     * @property _token
     * @private
     */
    this._token = null;    

    /**
     * The array of token information.
     * @type Array
     * @property _tokenData
     * @private
     */
    this._tokenData = tokenData;

    /**
     * Lookahead token buffer.
     * @type Array
     * @property _lt
     * @private
     */
    this._lt = [];

    /**
     * Lookahead token buffer index.
     * @type int
     * @property _ltIndex
     * @private
     */
    this._ltIndex = 0;

    this._ltIndexCache = [];
  }

  /**
   * Accepts an array of token information and outputs
   * an array of token data containing key-value mappings
   * and matching functions that the TokenStream needs.
   * @param {Array} tokens An array of token descriptors.
   * @return {Array} An array of processed token data.
   * @method createTokenData
   * @static
   */
  TokenStreamBase.createTokenData = function(tokens){

    var nameMap     = [],
        typeMap     = {},
        tokenData     = tokens.concat([]),
        i            = 0,
        len            = tokenData.length+1;

    tokenData.UNKNOWN = -1;
    tokenData.unshift({name:"EOF"});

    for (; i < len; i++){
      nameMap.push(tokenData[i].name);
      tokenData[tokenData[i].name] = i;
      if (tokenData[i].text){
        typeMap[tokenData[i].text] = i;
      }
    }

    tokenData.name = function(tt){
      return nameMap[tt];
    };

    tokenData.type = function(c){
      return typeMap[c];
    };

    return tokenData;
  };

  TokenStreamBase.prototype = {

    //restore constructor
    constructor: TokenStreamBase,    

    //-------------------------------------------------------------------------
    // Matching methods
    //-------------------------------------------------------------------------

    /**
     * Determines if the next token matches the given token type.
     * If so, that token is consumed; if not, the token is placed
     * back onto the token stream. You can pass in any number of
     * token types and this will return true if any of the token
     * types is found.
     * @param {int|int[]} tokenTypes Either a single token type or an array of
     *      token types that the next token might be. If an array is passed,
     *      it's assumed that the token can be any of these.
     * @param {variant} channel (Optional) The channel to read from. If not
     *      provided, reads from the default (unnamed) channel.
     * @return {Boolean} True if the token type matches, false if not.
     * @method match
     */
    match: function(tokenTypes, channel){

      //always convert to an array, makes things easier
      if (!(tokenTypes instanceof Array)){
        tokenTypes = [tokenTypes];
      }

      var tt  = this.get(channel),
          i   = 0,
          len = tokenTypes.length;

      while(i < len){
        if (tt == tokenTypes[i++]){
          return true;
        }
      }

      //no match found, put the token back
      this.unget();
      return false;
    },    

    /**
     * Determines if the next token matches the given token type.
     * If so, that token is consumed; if not, an error is thrown.
     * @param {int|int[]} tokenTypes Either a single token type or an array of
     *      token types that the next token should be. If an array is passed,
     *      it's assumed that the token must be one of these.
     * @param {variant} channel (Optional) The channel to read from. If not
     *      provided, reads from the default (unnamed) channel.
     * @return {void}
     * @method mustMatch
     */    
    mustMatch: function(tokenTypes, channel){

      var token;

      //always convert to an array, makes things easier
      if (!(tokenTypes instanceof Array)){
        tokenTypes = [tokenTypes];
      }

      if (!this.match.apply(this, arguments)){    
        token = this.LT(1);
        throw new SyntaxError("Expected " + this._tokenData[tokenTypes[0]].name + 
          " at line " + token.startLine + ", col " + token.startCol + ".", token.startLine, token.startCol);
      }
    },

    //-------------------------------------------------------------------------
    // Consuming methods
    //-------------------------------------------------------------------------

    /**
     * Keeps reading from the token stream until either one of the specified
     * token types is found or until the end of the input is reached.
     * @param {int|int[]} tokenTypes Either a single token type or an array of
     *      token types that the next token should be. If an array is passed,
     *      it's assumed that the token must be one of these.
     * @param {variant} channel (Optional) The channel to read from. If not
     *      provided, reads from the default (unnamed) channel.
     * @return {void}
     * @method advance
     */
    advance: function(tokenTypes, channel){

      while(this.LA(0) !== 0 && !this.match(tokenTypes, channel)){
        this.get();
      }

      return this.LA(0);    
    },

    /**
     * Consumes the next token from the token stream. 
     * @return {int} The token type of the token that was just consumed.
     * @method get
     */      
    get: function(channel){

      var tokenInfo   = this._tokenData,
          reader      = this._reader,
          value,
          i           =0,
          len         = tokenInfo.length,
          found       = false,
          token,
          info;

      //check the lookahead buffer first
      if (this._lt.length && this._ltIndex >= 0 && this._ltIndex < this._lt.length){  

        i++;
        this._token = this._lt[this._ltIndex++];
        info = tokenInfo[this._token.type];

        //obey channels logic
        while((info.channel !== undefined && channel !== info.channel) &&
          this._ltIndex < this._lt.length){
          this._token = this._lt[this._ltIndex++];
          info = tokenInfo[this._token.type];
          i++;
        }

        //here be dragons
        if ((info.channel === undefined || channel === info.channel) &&
          this._ltIndex <= this._lt.length){
          this._ltIndexCache.push(i);
          return this._token.type;
        }
      }

      //call token retriever method
      token = this._getToken();

      //if it should be hidden, don't save a token
      if (token.type > -1 && !tokenInfo[token.type].hide){

        //apply token channel
        token.channel = tokenInfo[token.type].channel;

        //save for later
        this._token = token;
        this._lt.push(token);

        //save space that will be moved (must be done before array is truncated)
        this._ltIndexCache.push(this._lt.length - this._ltIndex + i);  

        //keep the buffer under 5 items
        if (this._lt.length > 5){
          this._lt.shift();                
        }

        //also keep the shift buffer under 5 items
        if (this._ltIndexCache.length > 5){
          this._ltIndexCache.shift();
        }

        //update lookahead index
        this._ltIndex = this._lt.length;
      }

      /*
       * Skip to the next token if:
       * 1. The token type is marked as hidden.
       * 2. The token type has a channel specified and it isn't the current channel.
       */
      info = tokenInfo[token.type];
      if (info && 
        (info.hide || 
          (info.channel !== undefined && channel !== info.channel))){
        return this.get(channel);
      } else {
        //return just the type
        return token.type;
      }
    },

    /**
     * Looks ahead a certain number of tokens and returns the token type at
     * that position. This will throw an error if you lookahead past the
     * end of input, past the size of the lookahead buffer, or back past
     * the first token in the lookahead buffer.
     * @param {int} The index of the token type to retrieve. 0 for the
     *      current token, 1 for the next, -1 for the previous, etc.
     * @return {int} The token type of the token in the given position.
     * @method LA
     */
    LA: function(index){
      var total = index,
          tt;
      if (index > 0){
        //TODO: Store 5 somewhere
        if (index > 5){
          throw new Error("Too much lookahead.");
        }

        //get all those tokens
        while(total){
          tt = this.get();   
          total--;                            
        }

        //unget all those tokens
        while(total < index){
          this.unget();
          total++;
        }
      } else if (index < 0){

        if(this._lt[this._ltIndex+index]){
          tt = this._lt[this._ltIndex+index].type;
        } else {
          throw new Error("Too much lookbehind.");
        }

      } else {
        tt = this._token.type;
      }

      return tt;

    },

    /**
     * Looks ahead a certain number of tokens and returns the token at
     * that position. This will throw an error if you lookahead past the
     * end of input, past the size of the lookahead buffer, or back past
     * the first token in the lookahead buffer.
     * @param {int} The index of the token type to retrieve. 0 for the
     *      current token, 1 for the next, -1 for the previous, etc.
     * @return {Object} The token of the token in the given position.
     * @method LA
     */    
    LT: function(index){

      //lookahead first to prime the token buffer
      this.LA(index);

      //now find the token, subtract one because _ltIndex is already at the next index
      return this._lt[this._ltIndex+index-1];    
    },

    /**
     * Returns the token type for the next token in the stream without 
     * consuming it.
     * @return {int} The token type of the next token in the stream.
     * @method peek
     */
    peek: function(){
      return this.LA(1);
    },

    /**
     * Returns the actual token object for the last consumed token.
     * @return {Token} The token object for the last consumed token.
     * @method token
     */
    token: function(){
      return this._token;
    },

    /**
     * Returns the name of the token for the given token type.
     * @param {int} tokenType The type of token to get the name of.
     * @return {String} The name of the token or "UNKNOWN_TOKEN" for any
     *      invalid token type.
     * @method tokenName
     */
    tokenName: function(tokenType){
      if (tokenType < 0 || tokenType > this._tokenData.length){
        return "UNKNOWN_TOKEN";
      } else {
        return this._tokenData[tokenType].name;
      }
    },

    /**
     * Returns the token type value for the given token name.
     * @param {String} tokenName The name of the token whose value should be returned.
     * @return {int} The token type value for the given token name or -1
     *      for an unknown token.
     * @method tokenName
     */    
    tokenType: function(tokenName){
      return this._tokenData[tokenName] || -1;
    },

    /**
     * Returns the last consumed token to the token stream.
     * @method unget
     */      
    unget: function(){
      //if (this._ltIndex > -1){
      if (this._ltIndexCache.length){
        this._ltIndex -= this._ltIndexCache.pop();//--;
        this._token = this._lt[this._ltIndex - 1];
      } else {
        throw new Error("Too much lookahead.");
      }
    }

  };




  parserlib.util = {
    StringReader: StringReader,
    SyntaxError : SyntaxError,
    SyntaxUnit  : SyntaxUnit,
    EventTarget : EventTarget,
    TokenStreamBase : TokenStreamBase
  };
})();


/* 
 Parser-Lib
 Copyright (c) 2009-2011 Nicholas C. Zakas. All rights reserved.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 */
/* Version v0.1.0, Build time: 28-November-2011 12:21:44 */
(function(){
  var EventTarget = parserlib.util.EventTarget,
      TokenStreamBase = parserlib.util.TokenStreamBase,
      StringReader = parserlib.util.StringReader,
      SyntaxError = parserlib.util.SyntaxError,
      SyntaxUnit  = parserlib.util.SyntaxUnit;


  var Colors = {
    aliceblue       :"#f0f8ff",
    antiquewhite    :"#faebd7",
    aqua            :"#00ffff",
    aquamarine      :"#7fffd4",
    azure           :"#f0ffff",
    beige           :"#f5f5dc",
    bisque          :"#ffe4c4",
    black           :"#000000",
    blanchedalmond  :"#ffebcd",
    blue            :"#0000ff",
    blueviolet      :"#8a2be2",
    brown           :"#a52a2a",
    burlywood       :"#deb887",
    cadetblue       :"#5f9ea0",
    chartreuse      :"#7fff00",
    chocolate       :"#d2691e",
    coral           :"#ff7f50",
    cornflowerblue  :"#6495ed",
    cornsilk        :"#fff8dc",
    crimson         :"#dc143c",
    cyan            :"#00ffff",
    darkblue        :"#00008b",
    darkcyan        :"#008b8b",
    darkgoldenrod   :"#b8860b",
    darkgray        :"#a9a9a9",
    darkgreen       :"#006400",
    darkkhaki       :"#bdb76b",
    darkmagenta     :"#8b008b",
    darkolivegreen  :"#556b2f",
    darkorange      :"#ff8c00",
    darkorchid      :"#9932cc",
    darkred         :"#8b0000",
    darksalmon      :"#e9967a",
    darkseagreen    :"#8fbc8f",
    darkslateblue   :"#483d8b",
    darkslategray   :"#2f4f4f",
    darkturquoise   :"#00ced1",
    darkviolet      :"#9400d3",
    deeppink        :"#ff1493",
    deepskyblue     :"#00bfff",
    dimgray         :"#696969",
    dodgerblue      :"#1e90ff",
    firebrick       :"#b22222",
    floralwhite     :"#fffaf0",
    forestgreen     :"#228b22",
    fuchsia         :"#ff00ff",
    gainsboro       :"#dcdcdc",
    ghostwhite      :"#f8f8ff",
    gold            :"#ffd700",
    goldenrod       :"#daa520",
    gray            :"#808080",
    green           :"#008000",
    greenyellow     :"#adff2f",
    honeydew        :"#f0fff0",
    hotpink         :"#ff69b4",
    indianred       :"#cd5c5c",
    indigo          :"#4b0082",
    ivory           :"#fffff0",
    khaki           :"#f0e68c",
    lavender        :"#e6e6fa",
    lavenderblush   :"#fff0f5",
    lawngreen       :"#7cfc00",
    lemonchiffon    :"#fffacd",
    lightblue       :"#add8e6",
    lightcoral      :"#f08080",
    lightcyan       :"#e0ffff",
    lightgoldenrodyellow  :"#fafad2",
    lightgrey       :"#d3d3d3",
    lightgreen      :"#90ee90",
    lightpink       :"#ffb6c1",
    lightsalmon     :"#ffa07a",
    lightseagreen   :"#20b2aa",
    lightskyblue    :"#87cefa",
    lightslategray  :"#778899",
    lightsteelblue  :"#b0c4de",
    lightyellow     :"#ffffe0",
    lime            :"#00ff00",
    limegreen       :"#32cd32",
    linen           :"#faf0e6",
    magenta         :"#ff00ff",
    maroon          :"#800000",
    mediumaquamarine:"#66cdaa",
    mediumblue      :"#0000cd",
    mediumorchid    :"#ba55d3",
    mediumpurple    :"#9370d8",
    mediumseagreen  :"#3cb371",
    mediumslateblue :"#7b68ee",
    mediumspringgreen   :"#00fa9a",
    mediumturquoise :"#48d1cc",
    mediumvioletred :"#c71585",
    midnightblue    :"#191970",
    mintcream       :"#f5fffa",
    mistyrose       :"#ffe4e1",
    moccasin        :"#ffe4b5",
    navajowhite     :"#ffdead",
    navy            :"#000080",
    oldlace         :"#fdf5e6",
    olive           :"#808000",
    olivedrab       :"#6b8e23",
    orange          :"#ffa500",
    orangered       :"#ff4500",
    orchid          :"#da70d6",
    palegoldenrod   :"#eee8aa",
    palegreen       :"#98fb98",
    paleturquoise   :"#afeeee",
    palevioletred   :"#d87093",
    papayawhip      :"#ffefd5",
    peachpuff       :"#ffdab9",
    peru            :"#cd853f",
    pink            :"#ffc0cb",
    plum            :"#dda0dd",
    powderblue      :"#b0e0e6",
    purple          :"#800080",
    red             :"#ff0000",
    rosybrown       :"#bc8f8f",
    royalblue       :"#4169e1",
    saddlebrown     :"#8b4513",
    salmon          :"#fa8072",
    sandybrown      :"#f4a460",
    seagreen        :"#2e8b57",
    seashell        :"#fff5ee",
    sienna          :"#a0522d",
    silver          :"#c0c0c0",
    skyblue         :"#87ceeb",
    slateblue       :"#6a5acd",
    slategray       :"#708090",
    snow            :"#fffafa",
    springgreen     :"#00ff7f",
    steelblue       :"#4682b4",
    tan             :"#d2b48c",
    teal            :"#008080",
    thistle         :"#d8bfd8",
    tomato          :"#ff6347",
    turquoise       :"#40e0d0",
    violet          :"#ee82ee",
    wheat           :"#f5deb3",
    white           :"#ffffff",
    whitesmoke      :"#f5f5f5",
    yellow          :"#ffff00",
    yellowgreen     :"#9acd32"
  };
  /*global SyntaxUnit, Parser*/
  /**
   * Represents a selector combinator (whitespace, +, >).
   * @namespace parserlib.css
   * @class Combinator
   * @extends parserlib.util.SyntaxUnit
   * @constructor
   * @param {String} text The text representation of the unit. 
   * @param {int} line The line of text on which the unit resides.
   * @param {int} col The column of text on which the unit resides.
   */
  function Combinator(text, line, col){

    SyntaxUnit.call(this, text, line, col, Parser.COMBINATOR_TYPE);

    /**
     * The type of modifier.
     * @type String
     * @property type
     */
    this.type = "unknown";

    //pretty simple
    if (/^\s+$/.test(text)){
      this.type = "descendant";
    } else if (text == ">"){
      this.type = "child";
    } else if (text == "+"){
      this.type = "adjacent-sibling";
    } else if (text == "~"){
      this.type = "sibling";
    }

  }

  Combinator.prototype = new SyntaxUnit();
  Combinator.prototype.constructor = Combinator;


  /*global SyntaxUnit, Parser*/
  /**
   * Represents a media feature, such as max-width:500.
   * @namespace parserlib.css
   * @class MediaFeature
   * @extends parserlib.util.SyntaxUnit
   * @constructor
   * @param {SyntaxUnit} name The name of the feature.
   * @param {SyntaxUnit} value The value of the feature or null if none.
   */
  function MediaFeature(name, value){

    SyntaxUnit.call(this, "(" + name + (value !== null ? ":" + value : "") + ")", name.startLine, name.startCol, Parser.MEDIA_FEATURE_TYPE);

    /**
     * The name of the media feature
     * @type String
     * @property name
     */
    this.name = name;

    /**
     * The value for the feature or null if there is none.
     * @type SyntaxUnit
     * @property value
     */
    this.value = value;
  }

  MediaFeature.prototype = new SyntaxUnit();
  MediaFeature.prototype.constructor = MediaFeature;


  /*global SyntaxUnit, Parser*/
  /**
   * Represents an individual media query.
   * @namespace parserlib.css
   * @class MediaQuery
   * @extends parserlib.util.SyntaxUnit
   * @constructor
   * @param {String} modifier The modifier "not" or "only" (or null).
   * @param {String} mediaType The type of media (i.e., "print").
   * @param {Array} parts Array of selectors parts making up this selector.
   * @param {int} line The line of text on which the unit resides.
   * @param {int} col The column of text on which the unit resides.
   */
  function MediaQuery(modifier, mediaType, features, line, col){

    SyntaxUnit.call(this, (modifier ? modifier + " ": "") + (mediaType ? mediaType + " " : "") + features.join(" and "), line, col, Parser.MEDIA_QUERY_TYPE);

    /**
     * The media modifier ("not" or "only")
     * @type String
     * @property modifier
     */
    this.modifier = modifier;

    /**
     * The mediaType (i.e., "print")
     * @type String
     * @property mediaType
     */
    this.mediaType = mediaType;    

    /**
     * The parts that make up the selector.
     * @type Array
     * @property features
     */
    this.features = features;

  }

  MediaQuery.prototype = new SyntaxUnit();
  MediaQuery.prototype.constructor = MediaQuery;


  /*global Tokens, TokenStream, SyntaxError, Properties, Validation, ValidationError, SyntaxUnit,
   PropertyValue, PropertyValuePart, SelectorPart, SelectorSubPart, Selector,
   PropertyName, Combinator, MediaFeature, MediaQuery, EventTarget */

  /**
   * A CSS3 parser.
   * @namespace parserlib.css
   * @class Parser
   * @constructor
   * @param {Object} options (Optional) Various options for the parser:
   *      starHack (true|false) to allow IE6 star hack as valid,
   *      underscoreHack (true|false) to interpret leading underscores
   *      as IE6-7 targeting for known properties, ieFilters (true|false)
   *      to indicate that IE < 8 filters should be accepted and not throw
   *      syntax errors.
   */
  function Parser(options){

    //inherit event functionality
    EventTarget.call(this);


    this.options = options || {};

    this._tokenStream = null;
  }

  //Static constants
  Parser.DEFAULT_TYPE = 0;
  Parser.COMBINATOR_TYPE = 1;
  Parser.MEDIA_FEATURE_TYPE = 2;
  Parser.MEDIA_QUERY_TYPE = 3;
  Parser.PROPERTY_NAME_TYPE = 4;
  Parser.PROPERTY_VALUE_TYPE = 5;
  Parser.PROPERTY_VALUE_PART_TYPE = 6;
  Parser.SELECTOR_TYPE = 7;
  Parser.SELECTOR_PART_TYPE = 8;
  Parser.SELECTOR_SUB_PART_TYPE = 9;

  Parser.prototype = function(){

    var proto = new EventTarget(),  //new prototype
        prop,
    additions =  {

      //restore constructor
      constructor: Parser,

      //instance constants - yuck
      DEFAULT_TYPE : 0,
      COMBINATOR_TYPE : 1,
      MEDIA_FEATURE_TYPE : 2,
      MEDIA_QUERY_TYPE : 3,
      PROPERTY_NAME_TYPE : 4,
      PROPERTY_VALUE_TYPE : 5,
      PROPERTY_VALUE_PART_TYPE : 6,
      SELECTOR_TYPE : 7,
      SELECTOR_PART_TYPE : 8,
      SELECTOR_SUB_PART_TYPE : 9,            

      //-----------------------------------------------------------------
      // Grammar
      //-----------------------------------------------------------------

      _stylesheet: function(){

        /*
         * stylesheet
         *  : [ CHARSET_SYM S* STRING S* ';' ]?
         *    [S|CDO|CDC]* [ import [S|CDO|CDC]* ]*
         *    [ namespace [S|CDO|CDC]* ]*
         *    [ [ ruleset | media | page | font_face | keyframes ] [S|CDO|CDC]* ]*
         *  ;
         */ 

        var tokenStream = this._tokenStream,
            charset     = null,
            count,
            token,
            tt;

        this.fire("startstylesheet");

        //try to read character set
        this._charset();

        this._skipCruft();

        //try to read imports - may be more than one
        while (tokenStream.peek() == Tokens.IMPORT_SYM){
          this._import();
          this._skipCruft();
        }

        //try to read namespaces - may be more than one
        while (tokenStream.peek() == Tokens.NAMESPACE_SYM){
          this._namespace();
          this._skipCruft();
        }

        //get the next token
        tt = tokenStream.peek();

        //try to read the rest
        while(tt > Tokens.EOF){

          try {

            switch(tt){
              case Tokens.MEDIA_SYM:
              this._media();
              this._skipCruft();
              break;
              case Tokens.PAGE_SYM:
              this._page(); 
              this._skipCruft();
              break;                   
              case Tokens.FONT_FACE_SYM:
              this._font_face(); 
              this._skipCruft();
              break;  
              case Tokens.KEYFRAMES_SYM:
              this._keyframes(); 
              this._skipCruft();
              break;                                
              case Tokens.UNKNOWN_SYM:  //unknown @ rule
              tokenStream.get();
              if (!this.options.strict){

                //fire error event
                this.fire({
                  type:       "error",
                  error:      null,
                  message:    "Unknown @ rule: " + tokenStream.LT(0).value + ".",
                  line:       tokenStream.LT(0).startLine,
                  col:        tokenStream.LT(0).startCol
                });                          

                //skip braces
                count=0;
                while (tokenStream.advance([Tokens.LBRACE, Tokens.RBRACE]) == Tokens.LBRACE){
                  count++;    //keep track of nesting depth
                }

                while(count){
                  tokenStream.advance([Tokens.RBRACE]);
                  count--;
                }

              } else {
                //not a syntax error, rethrow it
                throw new SyntaxError("Unknown @ rule.", tokenStream.LT(0).startLine, tokenStream.LT(0).startCol);
              }                                
              break;
              case Tokens.S:
              this._readWhitespace();
              break;
              default:                            
              if(!this._ruleset()){

                //error handling for known issues
                switch(tt){
                  case Tokens.CHARSET_SYM:
                  token = tokenStream.LT(1);
                  this._charset(false);
                  throw new SyntaxError("@charset not allowed here.", token.startLine, token.startCol);
                  case Tokens.IMPORT_SYM:
                  token = tokenStream.LT(1);
                  this._import(false);
                  throw new SyntaxError("@import not allowed here.", token.startLine, token.startCol);
                  case Tokens.NAMESPACE_SYM:
                  token = tokenStream.LT(1);
                  this._namespace(false);
                  throw new SyntaxError("@namespace not allowed here.", token.startLine, token.startCol);
                  default:
                  tokenStream.get();  //get the last token
                  this._unexpectedToken(tokenStream.token());
                }

              }
            }
          } catch(ex) {
            if (ex instanceof SyntaxError && !this.options.strict){
              this.fire({
                type:       "error",
                error:      ex,
                message:    ex.message,
                line:       ex.line,
                col:        ex.col
              });                     
            } else {
              throw ex;
            }
          }

          tt = tokenStream.peek();
        }

        if (tt != Tokens.EOF){
          this._unexpectedToken(tokenStream.token());
        }

        this.fire("endstylesheet");
      },

      _charset: function(emit){
        var tokenStream = this._tokenStream,
            charset,
            token,
            line,
            col;

        if (tokenStream.match(Tokens.CHARSET_SYM)){
          line = tokenStream.token().startLine;
          col = tokenStream.token().startCol;

          this._readWhitespace();
          tokenStream.mustMatch(Tokens.STRING);

          token = tokenStream.token();
          charset = token.value;

          this._readWhitespace();
          tokenStream.mustMatch(Tokens.SEMICOLON);

          if (emit !== false){
            this.fire({ 
              type:   "charset",
              charset:charset,
              line:   line,
              col:    col
            });
          }
        }            
      },

      _import: function(emit){
        /*
         * import
         *   : IMPORT_SYM S*
         *    [STRING|URI] S* media_query_list? ';' S*
         */    

        var tokenStream = this._tokenStream,
            tt,
            uri,
            importToken,
            mediaList   = [];

        //read import symbol
        tokenStream.mustMatch(Tokens.IMPORT_SYM);
        importToken = tokenStream.token();
        this._readWhitespace();

        tokenStream.mustMatch([Tokens.STRING, Tokens.URI]);

        //grab the URI value
        uri = tokenStream.token().value.replace(/(?:url\()?["']([^"']+)["']\)?/, "$1");                

        this._readWhitespace();

        mediaList = this._media_query_list();

        //must end with a semicolon
        tokenStream.mustMatch(Tokens.SEMICOLON);
        this._readWhitespace();

        if (emit !== false){
          this.fire({
            type:   "import",
            uri:    uri,
            media:  mediaList,
            line:   importToken.startLine,
            col:    importToken.startCol
          });
        }

      },

      _namespace: function(emit){
        /*
         * namespace
         *   : NAMESPACE_SYM S* [namespace_prefix S*]? [STRING|URI] S* ';' S*
         */    

        var tokenStream = this._tokenStream,
            line,
            col,
            prefix,
            uri;

        //read import symbol
        tokenStream.mustMatch(Tokens.NAMESPACE_SYM);
        line = tokenStream.token().startLine;
        col = tokenStream.token().startCol;
        this._readWhitespace();

        //it's a namespace prefix - no _namespace_prefix() method because it's just an IDENT
        if (tokenStream.match(Tokens.IDENT)){
          prefix = tokenStream.token().value;
          this._readWhitespace();
        }

        tokenStream.mustMatch([Tokens.STRING, Tokens.URI]);
        /*if (!tokenStream.match(Tokens.STRING)){
         tokenStream.mustMatch(Tokens.URI);
         }*/

        //grab the URI value
        uri = tokenStream.token().value.replace(/(?:url\()?["']([^"']+)["']\)?/, "$1");                

        this._readWhitespace();

        //must end with a semicolon
        tokenStream.mustMatch(Tokens.SEMICOLON);
        this._readWhitespace();

        if (emit !== false){
          this.fire({
            type:   "namespace",
            prefix: prefix,
            uri:    uri,
            line:   line,
            col:    col
          });
        }

      },            

      _media: function(){
        /*
         * media
         *   : MEDIA_SYM S* media_query_list S* '{' S* ruleset* '}' S*
         *   ;
         */
        var tokenStream     = this._tokenStream,
            line,
            col,
            mediaList;//       = [];

        //look for @media
        tokenStream.mustMatch(Tokens.MEDIA_SYM);
        line = tokenStream.token().startLine;
        col = tokenStream.token().startCol;

        this._readWhitespace();               

        mediaList = this._media_query_list();

        tokenStream.mustMatch(Tokens.LBRACE);
        this._readWhitespace();

        this.fire({
          type:   "startmedia",
          media:  mediaList,
          line:   line,
          col:    col
        });

        while(true) {
          if (tokenStream.peek() == Tokens.PAGE_SYM){
            this._page();
          } else if (!this._ruleset()){
            break;
          }                
        }

        tokenStream.mustMatch(Tokens.RBRACE);
        this._readWhitespace();

        this.fire({
          type:   "endmedia",
          media:  mediaList,
          line:   line,
          col:    col
        });
      },                           


      //CSS3 Media Queries
      _media_query_list: function(){
        /*
         * media_query_list
         *   : S* [media_query [ ',' S* media_query ]* ]?
         *   ;
         */
        var tokenStream = this._tokenStream,
            mediaList   = [];


        this._readWhitespace();

        if (tokenStream.peek() == Tokens.IDENT || tokenStream.peek() == Tokens.LPAREN){
          mediaList.push(this._media_query());
        }

        while(tokenStream.match(Tokens.COMMA)){
          this._readWhitespace();
          mediaList.push(this._media_query());
        }

        return mediaList;
      },

      /*
       * Note: "expression" in the grammar maps to the _media_expression
       * method.

       */
      _media_query: function(){
        /*
         * media_query
         *   : [ONLY | NOT]? S* media_type S* [ AND S* expression ]*
         *   | expression [ AND S* expression ]*
         *   ;
         */
        var tokenStream = this._tokenStream,
            type        = null,
            ident       = null,
            token       = null,
            expressions = [];

        if (tokenStream.match(Tokens.IDENT)){
          ident = tokenStream.token().value.toLowerCase();

          //since there's no custom tokens for these, need to manually check
          if (ident != "only" && ident != "not"){
            tokenStream.unget();
            ident = null;
          } else {
            token = tokenStream.token();
          }
        }

        this._readWhitespace();

        if (tokenStream.peek() == Tokens.IDENT){
          type = this._media_type();
          if (token === null){
            token = tokenStream.token();
          }
        } else if (tokenStream.peek() == Tokens.LPAREN){
          if (token === null){
            token = tokenStream.LT(1);
          }
          expressions.push(this._media_expression());
        }                               

        if (type === null && expressions.length === 0){
          return null;
        } else {                
          this._readWhitespace();
          while (tokenStream.match(Tokens.IDENT)){
            if (tokenStream.token().value.toLowerCase() != "and"){
              this._unexpectedToken(tokenStream.token());
            }

            this._readWhitespace();
            expressions.push(this._media_expression());
          }
        }

        return new MediaQuery(ident, type, expressions, token.startLine, token.startCol);
      },

      //CSS3 Media Queries
      _media_type: function(){
        /*
         * media_type
         *   : IDENT
         *   ;
         */
        return this._media_feature();           
      },

      /**
       * Note: in CSS3 Media Queries, this is called "expression".
       * Renamed here to avoid conflict with CSS3 Selectors
       * definition of "expression". Also note that "expr" in the
       * grammar now maps to "expression" from CSS3 selectors.
       * @method _media_expression
       * @private
       */
      _media_expression: function(){
        /*
         * expression
         *  : '(' S* media_feature S* [ ':' S* expr ]? ')' S*
         *  ;
         */
        var tokenStream = this._tokenStream,
            feature     = null,
            token,
            expression  = null;

        tokenStream.mustMatch(Tokens.LPAREN);

        feature = this._media_feature();
        this._readWhitespace();

        if (tokenStream.match(Tokens.COLON)){
          this._readWhitespace();
          token = tokenStream.LT(1);
          expression = this._expression();
        }

        tokenStream.mustMatch(Tokens.RPAREN);
        this._readWhitespace();

        return new MediaFeature(feature, (expression ? new SyntaxUnit(expression, token.startLine, token.startCol) : null));            
      },

      //CSS3 Media Queries
      _media_feature: function(){
        /*
         * media_feature
         *   : IDENT
         *   ;
         */
        var tokenStream = this._tokenStream;

        tokenStream.mustMatch(Tokens.IDENT);

        return SyntaxUnit.fromToken(tokenStream.token());            
      },

      //CSS3 Paged Media
      _page: function(){
        /*
         * page:
         *    PAGE_SYM S* IDENT? pseudo_page? S* 
         *    '{' S* [ declaration | margin ]? [ ';' S* [ declaration | margin ]? ]* '}' S*
         *    ;
         */            
        var tokenStream = this._tokenStream,
            line,
            col,
            identifier  = null,
            pseudoPage  = null;

        //look for @page
        tokenStream.mustMatch(Tokens.PAGE_SYM);
        line = tokenStream.token().startLine;
        col = tokenStream.token().startCol;

        this._readWhitespace();

        if (tokenStream.match(Tokens.IDENT)){
          identifier = tokenStream.token().value;

          //The value 'auto' may not be used as a page name and MUST be treated as a syntax error.
          if (identifier.toLowerCase() === "auto"){
            this._unexpectedToken(tokenStream.token());
          }
        }                

        //see if there's a colon upcoming
        if (tokenStream.peek() == Tokens.COLON){
          pseudoPage = this._pseudo_page();
        }

        this._readWhitespace();

        this.fire({
          type:   "startpage",
          id:     identifier,
          pseudo: pseudoPage,
          line:   line,
          col:    col
        });                   

        this._readDeclarations(true, true);                

        this.fire({
          type:   "endpage",
          id:     identifier,
          pseudo: pseudoPage,
          line:   line,
          col:    col
        });             

      },

      //CSS3 Paged Media
      _margin: function(){
        /*
         * margin :
         *    margin_sym S* '{' declaration [ ';' S* declaration? ]* '}' S*
         *    ;
         */
        var tokenStream = this._tokenStream,
            line,
            col,
            marginSym   = this._margin_sym();

        if (marginSym){
          line = tokenStream.token().startLine;
          col = tokenStream.token().startCol;

          this.fire({
            type: "startpagemargin",
            margin: marginSym,
            line:   line,
            col:    col
          });    

          this._readDeclarations(true);

          this.fire({
            type: "endpagemargin",
            margin: marginSym,
            line:   line,
            col:    col
          });    
          return true;
        } else {
          return false;
        }
      },

      //CSS3 Paged Media
      _margin_sym: function(){

        /*
         * margin_sym :
         *    TOPLEFTCORNER_SYM | 
         *    TOPLEFT_SYM | 
         *    TOPCENTER_SYM | 
         *    TOPRIGHT_SYM | 
         *    TOPRIGHTCORNER_SYM |
         *    BOTTOMLEFTCORNER_SYM | 
         *    BOTTOMLEFT_SYM | 
         *    BOTTOMCENTER_SYM | 
         *    BOTTOMRIGHT_SYM |
         *    BOTTOMRIGHTCORNER_SYM |
         *    LEFTTOP_SYM |
         *    LEFTMIDDLE_SYM |
         *    LEFTBOTTOM_SYM |
         *    RIGHTTOP_SYM |
         *    RIGHTMIDDLE_SYM |
         *    RIGHTBOTTOM_SYM 
         *    ;
         */

        var tokenStream = this._tokenStream;

        if(tokenStream.match([Tokens.TOPLEFTCORNER_SYM, Tokens.TOPLEFT_SYM,
          Tokens.TOPCENTER_SYM, Tokens.TOPRIGHT_SYM, Tokens.TOPRIGHTCORNER_SYM,
          Tokens.BOTTOMLEFTCORNER_SYM, Tokens.BOTTOMLEFT_SYM, 
          Tokens.BOTTOMCENTER_SYM, Tokens.BOTTOMRIGHT_SYM,
          Tokens.BOTTOMRIGHTCORNER_SYM, Tokens.LEFTTOP_SYM, 
          Tokens.LEFTMIDDLE_SYM, Tokens.LEFTBOTTOM_SYM, Tokens.RIGHTTOP_SYM,
          Tokens.RIGHTMIDDLE_SYM, Tokens.RIGHTBOTTOM_SYM]))
        {
          return SyntaxUnit.fromToken(tokenStream.token());                
        } else {
          return null;
        }

      },

      _pseudo_page: function(){
        /*
         * pseudo_page
         *   : ':' IDENT
         *   ;    
         */

        var tokenStream = this._tokenStream;

        tokenStream.mustMatch(Tokens.COLON);
        tokenStream.mustMatch(Tokens.IDENT);

        //TODO: CSS3 Paged Media says only "left", "center", and "right" are allowed

        return tokenStream.token().value;
      },

      _font_face: function(){
        /*
         * font_face
         *   : FONT_FACE_SYM S* 
         *     '{' S* declaration [ ';' S* declaration ]* '}' S*
         *   ;
         */     
        var tokenStream = this._tokenStream,
            line,
            col;

        //look for @page
        tokenStream.mustMatch(Tokens.FONT_FACE_SYM);
        line = tokenStream.token().startLine;
        col = tokenStream.token().startCol;

        this._readWhitespace();

        this.fire({
          type:   "startfontface",
          line:   line,
          col:    col
        });                    

        this._readDeclarations(true);

        this.fire({
          type:   "endfontface",
          line:   line,
          col:    col
        });              
      },

      _operator: function(){

        /*
         * operator
         *  : '/' S* | ',' S* | /( empty )/
         *  ;
         */    

        var tokenStream = this._tokenStream,
            token       = null;

        if (tokenStream.match([Tokens.SLASH, Tokens.COMMA])){
          token =  tokenStream.token();
          this._readWhitespace();
        } 
        return token ? PropertyValuePart.fromToken(token) : null;

      },

      _combinator: function(){

        /*
         * combinator
         *  : PLUS S* | GREATER S* | TILDE S* | S+
         *  ;
         */    

        var tokenStream = this._tokenStream,
            value       = null,
            token;

        if(tokenStream.match([Tokens.PLUS, Tokens.GREATER, Tokens.TILDE])){                
          token = tokenStream.token();
          value = new Combinator(token.value, token.startLine, token.startCol);
          this._readWhitespace();
        }

        return value;
      },

      _unary_operator: function(){

        /*
         * unary_operator
         *  : '-' | '+'
         *  ;
         */

        var tokenStream = this._tokenStream;

        if (tokenStream.match([Tokens.MINUS, Tokens.PLUS])){
          return tokenStream.token().value;
        } else {
          return null;
        }         
      },

      _property: function(){

        /*
         * property
         *   : IDENT S*
         *   ;        
         */

        var tokenStream = this._tokenStream,
            value       = null,
            hack        = null,
            tokenValue,
            token,
            line,
            col;

        //check for star hack - throws error if not allowed
        if (tokenStream.peek() == Tokens.STAR && this.options.starHack){
          tokenStream.get();
          token = tokenStream.token();
          hack = token.value;
          line = token.startLine;
          col = token.startCol;
        }

        if(tokenStream.match(Tokens.IDENT)){
          token = tokenStream.token();
          tokenValue = token.value;

          //check for underscore hack - no error if not allowed because it's valid CSS syntax
          if (tokenValue.charAt(0) == "_" && this.options.underscoreHack){
            hack = "_";
            tokenValue = tokenValue.substring(1);
          }

          value = new PropertyName(tokenValue, hack, (line||token.startLine), (col||token.startCol));
          this._readWhitespace();
        }

        return value;
      },

      //Augmented with CSS3 Selectors
      _ruleset: function(){
        /*
         * ruleset
         *   : selectors_group
         *     '{' S* declaration? [ ';' S* declaration? ]* '}' S*
         *   ;    
         */    

        var tokenStream = this._tokenStream,
            tt,
            selectors;


        /*
         * Error Recovery: If even a single selector fails to parse,
         * then the entire ruleset should be thrown away.
         */
        try {
          selectors = this._selectors_group();
        } catch (ex){
          if (ex instanceof SyntaxError && !this.options.strict){

            //fire error event
            this.fire({
              type:       "error",
              error:      ex,
              message:    ex.message,
              line:       ex.line,
              col:        ex.col
            });                          

            //skip over everything until closing brace
            tt = tokenStream.advance([Tokens.RBRACE]);
            if (tt == Tokens.RBRACE){
              //if there's a right brace, the rule is finished so don't do anything
            } else {
              //otherwise, rethrow the error because it wasn't handled properly
              throw ex;
            }                        

          } else {
            //not a syntax error, rethrow it
            throw ex;
          }                

          //trigger parser to continue
          return true;
        }

        //if it got here, all selectors parsed
        if (selectors){ 

          this.fire({
            type:       "startrule",
            selectors:  selectors,
            line:       selectors[0].line,
            col:        selectors[0].col
          });                

          this._readDeclarations(true);                

          this.fire({
            type:       "endrule",
            selectors:  selectors,
            line:       selectors[0].line,
            col:        selectors[0].col
          });  

        }

        return selectors;

      },

      //CSS3 Selectors
      _selectors_group: function(){

        /*            
         * selectors_group
         *   : selector [ COMMA S* selector ]*
         *   ;
         */           
        var tokenStream = this._tokenStream,
            selectors   = [],
            selector;

        selector = this._selector();
        if (selector !== null){

          selectors.push(selector);
          while(tokenStream.match(Tokens.COMMA)){
            this._readWhitespace();
            selector = this._selector();
            if (selector !== null){
              selectors.push(selector);
            } else {
              this._unexpectedToken(tokenStream.LT(1));
            }
          }
        }

        return selectors.length ? selectors : null;
      },

      //CSS3 Selectors
      _selector: function(){
        /*
         * selector
         *   : simple_selector_sequence [ combinator simple_selector_sequence ]*
         *   ;    
         */

        var tokenStream = this._tokenStream,
            selector    = [],
            nextSelector = null,
            combinator  = null,
            ws          = null;

        //if there's no simple selector, then there's no selector
        nextSelector = this._simple_selector_sequence();
        if (nextSelector === null){
          return null;
        }

        selector.push(nextSelector);

        do {

          //look for a combinator
          combinator = this._combinator();

          if (combinator !== null){
            selector.push(combinator);
            nextSelector = this._simple_selector_sequence();

            //there must be a next selector
            if (nextSelector === null){
              this._unexpectedToken(this.LT(1));
            } else {

              //nextSelector is an instance of SelectorPart
              selector.push(nextSelector);
            }
          } else {

            //if there's not whitespace, we're done
            if (this._readWhitespace()){           

              //add whitespace separator
              ws = new Combinator(tokenStream.token().value, tokenStream.token().startLine, tokenStream.token().startCol);

              //combinator is not required
              combinator = this._combinator();

              //selector is required if there's a combinator
              nextSelector = this._simple_selector_sequence();
              if (nextSelector === null){                        
                if (combinator !== null){
                  this._unexpectedToken(tokenStream.LT(1));
                }
              } else {

                if (combinator !== null){
                  selector.push(combinator);
                } else {
                  selector.push(ws);
                }

                selector.push(nextSelector);
              }     
            } else {
              break;
            }               

          }
        } while(true);

        return new Selector(selector, selector[0].line, selector[0].col);
      },

      //CSS3 Selectors
      _simple_selector_sequence: function(){
        /*
         * simple_selector_sequence
         *   : [ type_selector | universal ]
         *     [ HASH | class | attrib | pseudo | negation ]*
         *   | [ HASH | class | attrib | pseudo | negation ]+
         *   ;
         */

        var tokenStream = this._tokenStream,

        //parts of a simple selector
        elementName = null,
        modifiers   = [],

        //complete selector text
        selectorText= "",

        //the different parts after the element name to search for
        components  = [
          //HASH
          function(){
            return tokenStream.match(Tokens.HASH) ?
            new SelectorSubPart(tokenStream.token().value, "id", tokenStream.token().startLine, tokenStream.token().startCol) :
            null;
          },
          this._class,
          this._attrib,
          this._pseudo,
          this._negation
        ],
        i           = 0,
        len         = components.length,
        component   = null,
        found       = false,
        line,
        col;


        //get starting line and column for the selector
        line = tokenStream.LT(1).startLine;
        col = tokenStream.LT(1).startCol;

        elementName = this._type_selector();
        if (!elementName){
          elementName = this._universal();
        }

        if (elementName !== null){
          selectorText += elementName;
        }                

        while(true){

          //whitespace means we're done
          if (tokenStream.peek() === Tokens.S){
            break;
          }

          //check for each component
          while(i < len && component === null){
            component = components[i++].call(this);
          }

          if (component === null){

            //we don't have a selector
            if (selectorText === ""){
              return null;
            } else {
              break;
            }
          } else {
            i = 0;
            modifiers.push(component);
            selectorText += component.toString(); 
            component = null;
          }
        }


        return selectorText !== "" ?
        new SelectorPart(elementName, modifiers, selectorText, line, col) :
        null;
      },            

      //CSS3 Selectors
      _type_selector: function(){
        /*
         * type_selector
         *   : [ namespace_prefix ]? element_name
         *   ;
         */

        var tokenStream = this._tokenStream,
            ns          = this._namespace_prefix(),
            elementName = this._element_name();

        if (!elementName){                    
          /*
           * Need to back out the namespace that was read due to both
           * type_selector and universal reading namespace_prefix
           * first. Kind of hacky, but only way I can figure out
           * right now how to not change the grammar.
           */
          if (ns){
            tokenStream.unget();
            if (ns.length > 1){
              tokenStream.unget();
            }
          }

          return null;
        } else {     
          if (ns){
            elementName.text = ns + elementName.text;
            elementName.col -= ns.length;
          }
          return elementName;
        }
      },

      //CSS3 Selectors
      _class: function(){
        /*
         * class
         *   : '.' IDENT
         *   ;
         */    

        var tokenStream = this._tokenStream,
            token;

        if (tokenStream.match(Tokens.DOT)){
          tokenStream.mustMatch(Tokens.IDENT);    
          token = tokenStream.token();
          return new SelectorSubPart("." + token.value, "class", token.startLine, token.startCol - 1);        
        } else {
          return null;
        }

      },

      //CSS3 Selectors
      _element_name: function(){
        /*
         * element_name
         *   : IDENT
         *   ;
         */    

        var tokenStream = this._tokenStream,
            token;

        if (tokenStream.match(Tokens.IDENT)){
          token = tokenStream.token();
          return new SelectorSubPart(token.value, "elementName", token.startLine, token.startCol);        

        } else {
          return null;
        }
      },

      //CSS3 Selectors
      _namespace_prefix: function(){
        /*            
         * namespace_prefix
         *   : [ IDENT | '*' ]? '|'
         *   ;
         */
        var tokenStream = this._tokenStream,
            value       = "";

        //verify that this is a namespace prefix
        if (tokenStream.LA(1) === Tokens.PIPE || tokenStream.LA(2) === Tokens.PIPE){

          if(tokenStream.match([Tokens.IDENT, Tokens.STAR])){
            value += tokenStream.token().value;
          }

          tokenStream.mustMatch(Tokens.PIPE);
          value += "|";

        }

        return value.length ? value : null;                
      },

      //CSS3 Selectors
      _universal: function(){
        /*
         * universal
         *   : [ namespace_prefix ]? '*'
         *   ;            
         */
        var tokenStream = this._tokenStream,
            value       = "",
            ns;

        ns = this._namespace_prefix();
        if(ns){
          value += ns;
        }

        if(tokenStream.match(Tokens.STAR)){
          value += "*";
        }

        return value.length ? value : null;

      },

      //CSS3 Selectors
      _attrib: function(){
        /*
         * attrib
         *   : '[' S* [ namespace_prefix ]? IDENT S*
         *         [ [ PREFIXMATCH |
         *             SUFFIXMATCH |
         *             SUBSTRINGMATCH |
         *             '=' |
         *             INCLUDES |
         *             DASHMATCH ] S* [ IDENT | STRING ] S*
         *         ]? ']'
         *   ;    
         */

        var tokenStream = this._tokenStream,
            value       = null,
            ns,
            token;

        if (tokenStream.match(Tokens.LBRACKET)){
          token = tokenStream.token();
          value = token.value;
          value += this._readWhitespace();

          ns = this._namespace_prefix();

          if (ns){
            value += ns;
          }

          tokenStream.mustMatch(Tokens.IDENT);
          value += tokenStream.token().value;                    
          value += this._readWhitespace();

          if(tokenStream.match([Tokens.PREFIXMATCH, Tokens.SUFFIXMATCH, Tokens.SUBSTRINGMATCH,
            Tokens.EQUALS, Tokens.INCLUDES, Tokens.DASHMATCH])){

          value += tokenStream.token().value;                    
          value += this._readWhitespace();

          tokenStream.mustMatch([Tokens.IDENT, Tokens.STRING]);
          value += tokenStream.token().value;                    
          value += this._readWhitespace();
        }

        tokenStream.mustMatch(Tokens.RBRACKET);

        return new SelectorSubPart(value + "]", "attribute", token.startLine, token.startCol);
      } else {
        return null;
      }
    },

    //CSS3 Selectors
    _pseudo: function(){

      /*
       * pseudo
       *   : ':' ':'? [ IDENT | functional_pseudo ]
       *   ;    
       */   

      var tokenStream = this._tokenStream,
          pseudo      = null,
          colons      = ":",
          line,
          col;

      if (tokenStream.match(Tokens.COLON)){

        if (tokenStream.match(Tokens.COLON)){
          colons += ":";
        }

        if (tokenStream.match(Tokens.IDENT)){
          pseudo = tokenStream.token().value;
          line = tokenStream.token().startLine;
          col = tokenStream.token().startCol - colons.length;
        } else if (tokenStream.peek() == Tokens.FUNCTION){
          line = tokenStream.LT(1).startLine;
          col = tokenStream.LT(1).startCol - colons.length;
          pseudo = this._functional_pseudo();
        }

        if (pseudo){
          pseudo = new SelectorSubPart(colons + pseudo, "pseudo", line, col);
        }
      }

      return pseudo;
    },

    //CSS3 Selectors
    _functional_pseudo: function(){
      /*
       * functional_pseudo
       *   : FUNCTION S* expression ')'
       *   ;
       */            

      var tokenStream = this._tokenStream,
          value = null;

      if(tokenStream.match(Tokens.FUNCTION)){
        value = tokenStream.token().value;
        value += this._readWhitespace();
        value += this._expression();
        tokenStream.mustMatch(Tokens.RPAREN);
        value += ")";
      }

      return value;
    },

    //CSS3 Selectors
    _expression: function(){
      /*
       * expression
       *   : [ [ PLUS | '-' | DIMENSION | NUMBER | STRING | IDENT ] S* ]+
       *   ;
       */

      var tokenStream = this._tokenStream,
          value       = "";

      while(tokenStream.match([Tokens.PLUS, Tokens.MINUS, Tokens.DIMENSION,
        Tokens.NUMBER, Tokens.STRING, Tokens.IDENT, Tokens.LENGTH,
        Tokens.FREQ, Tokens.ANGLE, Tokens.TIME,
        Tokens.RESOLUTION])){

      value += tokenStream.token().value;
      value += this._readWhitespace();                        
    }

    return value.length ? value : null;

  },

  //CSS3 Selectors
  _negation: function(){
    /*            
     * negation
     *   : NOT S* negation_arg S* ')'
     *   ;
     */

    var tokenStream = this._tokenStream,
        line,
        col,
        value       = "",
        arg,
        subpart     = null;

    if (tokenStream.match(Tokens.NOT)){
      value = tokenStream.token().value;
      line = tokenStream.token().startLine;
      col = tokenStream.token().startCol;
      value += this._readWhitespace();
      arg = this._negation_arg();
      value += arg;
      value += this._readWhitespace();
      tokenStream.match(Tokens.RPAREN);
      value += tokenStream.token().value;

      subpart = new SelectorSubPart(value, "not", line, col);
      subpart.args.push(arg);
    }

    return subpart;
  },

  //CSS3 Selectors
  _negation_arg: function(){            
    /*
     * negation_arg
     *   : type_selector | universal | HASH | class | attrib | pseudo
     *   ;            
     */           

    var tokenStream = this._tokenStream,
    args        = [
      this._type_selector,
      this._universal,
      function(){
        return tokenStream.match(Tokens.HASH) ?
        new SelectorSubPart(tokenStream.token().value, "id", tokenStream.token().startLine, tokenStream.token().startCol) :
        null;                        
      },
      this._class,
      this._attrib,
      this._pseudo                    
    ],
    arg         = null,
    i           = 0,
    len         = args.length,
    elementName,
    line,
    col,
    part;

    line = tokenStream.LT(1).startLine;
    col = tokenStream.LT(1).startCol;

    while(i < len && arg === null){

      arg = args[i].call(this);
      i++;
    }

    //must be a negation arg
    if (arg === null){
      this._unexpectedToken(tokenStream.LT(1));
    }

    //it's an element name
    if (arg.type == "elementName"){
      part = new SelectorPart(arg, [], arg.toString(), line, col);
    } else {
      part = new SelectorPart(null, [arg], arg.toString(), line, col);
    }

    return part;                
  },

  _declaration: function(){

    /*
     * declaration
     *   : property ':' S* expr prio?
     *   | /( empty )/
     *   ;     
     */    

    var tokenStream = this._tokenStream,
        property    = null,
        expr        = null,
        prio        = null,
        error       = null,
        invalid     = null;

    property = this._property();
    if (property !== null){

      tokenStream.mustMatch(Tokens.COLON);
      this._readWhitespace();

      expr = this._expr();

      //if there's no parts for the value, it's an error
      if (!expr || expr.length === 0){
        this._unexpectedToken(tokenStream.LT(1));
      }

      prio = this._prio();

      try {
        this._validateProperty(property, expr);
      } catch (ex) {
        invalid = ex;
      }

      this.fire({
        type:       "property",
        property:   property,
        value:      expr,
        important:  prio,
        line:       property.line,
        col:        property.col,
        invalid:    invalid
      });                      

      return true;
    } else {
      return false;
    }
  },

  _prio: function(){
    /*
     * prio
     *   : IMPORTANT_SYM S*
     *   ;    
     */

    var tokenStream = this._tokenStream,
        result      = tokenStream.match(Tokens.IMPORTANT_SYM);

    this._readWhitespace();
    return result;
  },

  _expr: function(){
    /*
     * expr
     *   : term [ operator term ]*
     *   ;
     */

    var tokenStream = this._tokenStream,
        values      = [],
        //valueParts	= [],
    value       = null,
    operator    = null;

    value = this._term();
    if (value !== null){

      values.push(value);

      do {
        operator = this._operator();

        //if there's an operator, keep building up the value parts
        if (operator){
          values.push(operator);
        } /*else {
         //if there's not an operator, you have a full value
         values.push(new PropertyValue(valueParts, valueParts[0].line, valueParts[0].col));
         valueParts = [];
         }*/

        value = this._term();

        if (value === null){
          break;
        } else {
          values.push(value);
        }
      } while(true);
    }

    //cleanup
    /*if (valueParts.length){
     values.push(new PropertyValue(valueParts, valueParts[0].line, valueParts[0].col));
     }*/

    return values.length > 0 ? new PropertyValue(values, values[0].line, values[0].col) : null;
  },

  _term: function(){                       

    /*
     * term
     *   : unary_operator?
     *     [ NUMBER S* | PERCENTAGE S* | LENGTH S* | ANGLE S* |
     *       TIME S* | FREQ S* | function | ie_function ]
     *   | STRING S* | IDENT S* | URI S* | UNICODERANGE S* | hexcolor
     *   ;
     */    

    var tokenStream = this._tokenStream,
        unary       = null,
        value       = null,
        token,
        line,
        col;

    //returns the operator or null
    unary = this._unary_operator();
    if (unary !== null){
      line = tokenStream.token().startLine;
      col = tokenStream.token().startCol;
    }                

    //exception for IE filters
    if (tokenStream.peek() == Tokens.IE_FUNCTION && this.options.ieFilters){

      value = this._ie_function();
      if (unary === null){
        line = tokenStream.token().startLine;
        col = tokenStream.token().startCol;
      }

      //see if there's a simple match
    } else if (tokenStream.match([Tokens.NUMBER, Tokens.PERCENTAGE, Tokens.LENGTH,
      Tokens.ANGLE, Tokens.TIME,
      Tokens.FREQ, Tokens.STRING, Tokens.IDENT, Tokens.URI, Tokens.UNICODE_RANGE])){

    value = tokenStream.token().value;
    if (unary === null){
      line = tokenStream.token().startLine;
      col = tokenStream.token().startCol;
    }
    this._readWhitespace();
  } else {

    //see if it's a color
    token = this._hexcolor();
    if (token === null){

      //if there's no unary, get the start of the next token for line/col info
      if (unary === null){
        line = tokenStream.LT(1).startLine;
        col = tokenStream.LT(1).startCol;
      }                    

      //has to be a function
      if (value === null){

        /*
         * This checks for alpha(opacity=0) style of IE
         * functions. IE_FUNCTION only presents progid: style.
         */
        if (tokenStream.LA(3) == Tokens.EQUALS && this.options.ieFilters){
          value = this._ie_function();
        } else {
          value = this._function();
        }
      }

      /*if (value === null){
       return null;
       //throw new Error("Expected identifier at line " + tokenStream.token().startLine + ", character " +  tokenStream.token().startCol + ".");
       }*/

    } else {
      value = token.value;
      if (unary === null){
        line = token.startLine;
        col = token.startCol;
      }                    
    }

  }                

  return value !== null ?
  new PropertyValuePart(unary !== null ? unary + value : value, line, col) :
  null;

},

_function: function(){

  /*
   * function
   *   : FUNCTION S* expr ')' S*
   *   ;
   */

  var tokenStream = this._tokenStream,
      functionText = null,
      expr        = null,
      lt;

  if (tokenStream.match(Tokens.FUNCTION)){
    functionText = tokenStream.token().value;
    this._readWhitespace();
    expr = this._expr();
    functionText += expr;

    //START: Horrible hack in case it's an IE filter
    if (this.options.ieFilters && tokenStream.peek() == Tokens.EQUALS){
      do {

        if (this._readWhitespace()){
          functionText += tokenStream.token().value;
        }

        //might be second time in the loop
        if (tokenStream.LA(0) == Tokens.COMMA){
          functionText += tokenStream.token().value;
        }

        tokenStream.match(Tokens.IDENT);
        functionText += tokenStream.token().value;

        tokenStream.match(Tokens.EQUALS);
        functionText += tokenStream.token().value;

        //functionText += this._term();
        lt = tokenStream.peek();
        while(lt != Tokens.COMMA && lt != Tokens.S && lt != Tokens.RPAREN){
          tokenStream.get();
          functionText += tokenStream.token().value;
          lt = tokenStream.peek();
        }
      } while(tokenStream.match([Tokens.COMMA, Tokens.S]));
    }

    //END: Horrible Hack

    tokenStream.match(Tokens.RPAREN);    
    functionText += ")";
    this._readWhitespace();
  }                

  return functionText;
}, 

_ie_function: function(){

  /* (My own extension)
   * ie_function
   *   : IE_FUNCTION S* IDENT '=' term [S* ','? IDENT '=' term]+ ')' S*
   *   ;
   */

  var tokenStream = this._tokenStream,
      functionText = null,
      expr        = null,
      lt;

  //IE function can begin like a regular function, too
  if (tokenStream.match([Tokens.IE_FUNCTION, Tokens.FUNCTION])){
    functionText = tokenStream.token().value;

    do {

      if (this._readWhitespace()){
        functionText += tokenStream.token().value;
      }

      //might be second time in the loop
      if (tokenStream.LA(0) == Tokens.COMMA){
        functionText += tokenStream.token().value;
      }

      tokenStream.match(Tokens.IDENT);
      functionText += tokenStream.token().value;

      tokenStream.match(Tokens.EQUALS);
      functionText += tokenStream.token().value;

      //functionText += this._term();
      lt = tokenStream.peek();
      while(lt != Tokens.COMMA && lt != Tokens.S && lt != Tokens.RPAREN){
        tokenStream.get();
        functionText += tokenStream.token().value;
        lt = tokenStream.peek();
      }
    } while(tokenStream.match([Tokens.COMMA, Tokens.S]));                    

    tokenStream.match(Tokens.RPAREN);    
    functionText += ")";
    this._readWhitespace();
  }                

  return functionText;
}, 

_hexcolor: function(){
  /*
   * There is a constraint on the color that it must
   * have either 3 or 6 hex-digits (i.e., [0-9a-fA-F])
   * after the "#"; e.g., "#000" is OK, but "#abcd" is not.
   *
   * hexcolor
   *   : HASH S*
   *   ;
   */

  var tokenStream = this._tokenStream,
      token = null,
      color;

  if(tokenStream.match(Tokens.HASH)){

    //need to do some validation here

    token = tokenStream.token();
    color = token.value;
    if (!/#[a-f0-9]{3,6}/i.test(color)){
      throw new SyntaxError("Expected a hex color but found '" + color + "' at line " + token.startLine + ", col " + token.startCol + ".", token.startLine, token.startCol);
    }
    this._readWhitespace();
  }

  return token;
},

//-----------------------------------------------------------------
// Animations methods
//-----------------------------------------------------------------

_keyframes: function(){

  /*
   * keyframes:
   *   : KEYFRAMES_SYM S* keyframe_name S* '{' S* keyframe_rule* '}' {
   *   ;
   */
  var tokenStream = this._tokenStream,
      token,
      tt,
      name;            

  tokenStream.mustMatch(Tokens.KEYFRAMES_SYM);
  this._readWhitespace();
  name = this._keyframe_name();

  this._readWhitespace();
  tokenStream.mustMatch(Tokens.LBRACE);

  this.fire({
    type:   "startkeyframes",
    name:   name,
    line:   name.line,
    col:    name.col
  });                

  this._readWhitespace();
  tt = tokenStream.peek();

  //check for key
  while(tt == Tokens.IDENT || tt == Tokens.PERCENTAGE) {
    this._keyframe_rule();
    this._readWhitespace();
    tt = tokenStream.peek();
  }           

  this.fire({
    type:   "endkeyframes",
    name:   name,
    line:   name.line,
    col:    name.col
  });                      

  this._readWhitespace();
  tokenStream.mustMatch(Tokens.RBRACE);                    

},

_keyframe_name: function(){

  /*
   * keyframe_name:
   *   : IDENT
   *   | STRING
   *   ;
   */
  var tokenStream = this._tokenStream,
      token;

  tokenStream.mustMatch([Tokens.IDENT, Tokens.STRING]);
  return SyntaxUnit.fromToken(tokenStream.token());            
},

_keyframe_rule: function(){

  /*
   * keyframe_rule:
   *   : key_list S* 
   *     '{' S* declaration [ ';' S* declaration ]* '}' S*
   *   ;
   */
  var tokenStream = this._tokenStream,
      token,
      keyList = this._key_list();

  this.fire({
    type:   "startkeyframerule",
    keys:   keyList,
    line:   keyList[0].line,
    col:    keyList[0].col
  });                

  this._readDeclarations(true);                

  this.fire({
    type:   "endkeyframerule",
    keys:   keyList,
    line:   keyList[0].line,
    col:    keyList[0].col
  });  

},

_key_list: function(){

  /*
   * key_list:
   *   : key [ S* ',' S* key]*
   *   ;
   */
  var tokenStream = this._tokenStream,
      token,
      key,
      keyList = [];

  //must be least one key
  keyList.push(this._key());

  this._readWhitespace();

  while(tokenStream.match(Tokens.COMMA)){
    this._readWhitespace();
    keyList.push(this._key());
    this._readWhitespace();
  }

  return keyList;
},

_key: function(){
  /*
   * There is a restriction that IDENT can be only "from" or "to".
   *
   * key
   *   : PERCENTAGE
   *   | IDENT
   *   ;
   */

  var tokenStream = this._tokenStream,
      token;

  if (tokenStream.match(Tokens.PERCENTAGE)){
    return SyntaxUnit.fromToken(tokenStream.token());
  } else if (tokenStream.match(Tokens.IDENT)){
    token = tokenStream.token();                    

    if (/from|to/i.test(token.value)){
      return SyntaxUnit.fromToken(token);
    }

    tokenStream.unget();
  }

  //if it gets here, there wasn't a valid token, so time to explode
  this._unexpectedToken(tokenStream.LT(1));
},

//-----------------------------------------------------------------
// Helper methods
//-----------------------------------------------------------------

/**
 * Not part of CSS grammar, but useful for skipping over
 * combination of white space and HTML-style comments.
 * @return {void}
 * @method _skipCruft
 * @private
 */
_skipCruft: function(){
  while(this._tokenStream.match([Tokens.S, Tokens.CDO, Tokens.CDC])){
    //noop
  }
},

/**
 * Not part of CSS grammar, but this pattern occurs frequently
 * in the official CSS grammar. Split out here to eliminate
 * duplicate code.
 * @param {Boolean} checkStart Indicates if the rule should check
 *      for the left brace at the beginning.
 * @param {Boolean} readMargins Indicates if the rule should check
 *      for margin patterns.
 * @return {void}
 * @method _readDeclarations
 * @private
 */
_readDeclarations: function(checkStart, readMargins){
  /*
   * Reads the pattern
   * S* '{' S* declaration [ ';' S* declaration ]* '}' S*
   * or
   * S* '{' S* [ declaration | margin ]? [ ';' S* [ declaration | margin ]? ]* '}' S*
   * Note that this is how it is described in CSS3 Paged Media, but is actually incorrect.
   * A semicolon is only necessary following a delcaration is there's another declaration
   * or margin afterwards. 
   */
  var tokenStream = this._tokenStream,
      tt;


  this._readWhitespace();

  if (checkStart){
    tokenStream.mustMatch(Tokens.LBRACE);            
  }

  this._readWhitespace();

  try {

    while(true){

      if (readMargins && this._margin()){
        //noop
      } else if (this._declaration()){
        if (!tokenStream.match(Tokens.SEMICOLON)){
          break;
        }
      } else {
        break;
      }

      //if ((!this._margin() && !this._declaration()) || !tokenStream.match(Tokens.SEMICOLON)){
      //    break;
      //}
      this._readWhitespace();
    }

    tokenStream.mustMatch(Tokens.RBRACE);
    this._readWhitespace();

  } catch (ex) {
    if (ex instanceof SyntaxError && !this.options.strict){

      //fire error event
      this.fire({
        type:       "error",
        error:      ex,
        message:    ex.message,
        line:       ex.line,
        col:        ex.col
      });                          

      //see if there's another declaration
      tt = tokenStream.advance([Tokens.SEMICOLON, Tokens.RBRACE]);
      if (tt == Tokens.SEMICOLON){
        //if there's a semicolon, then there might be another declaration
        this._readDeclarations(false, readMargins);                            
      } else if (tt != Tokens.RBRACE){
        //if there's a right brace, the rule is finished so don't do anything
        //otherwise, rethrow the error because it wasn't handled properly
        throw ex;
      }                        

    } else {
      //not a syntax error, rethrow it
      throw ex;
    }
  }    

},      

/**
 * In some cases, you can end up with two white space tokens in a
 * row. Instead of making a change in every function that looks for
 * white space, this function is used to match as much white space
 * as necessary.
 * @method _readWhitespace
 * @return {String} The white space if found, empty string if not.
 * @private
 */
_readWhitespace: function(){

  var tokenStream = this._tokenStream,
      ws = "";

  while(tokenStream.match(Tokens.S)){
    ws += tokenStream.token().value;
  }

  return ws;
},


/**
 * Throws an error when an unexpected token is found.
 * @param {Object} token The token that was found.
 * @method _unexpectedToken
 * @return {void}
 * @private
 */
_unexpectedToken: function(token){
  throw new SyntaxError("Unexpected token '" + token.value + "' at line " + token.startLine + ", col " + token.startCol + ".", token.startLine, token.startCol);
},

/**
 * Helper method used for parsing subparts of a style sheet.
 * @return {void}
 * @method _verifyEnd
 * @private
 */
_verifyEnd: function(){
  if (this._tokenStream.LA(1) != Tokens.EOF){
    this._unexpectedToken(this._tokenStream.LT(1));
  }            
},

//-----------------------------------------------------------------
// Validation methods
//-----------------------------------------------------------------
_validateProperty: function(property, value){
  Validation.validate(property, value);
},

//-----------------------------------------------------------------
// Parsing methods
//-----------------------------------------------------------------

parse: function(input){    
  this._tokenStream = new TokenStream(input, Tokens);
  this._stylesheet();
},

parseStyleSheet: function(input){
  //just passthrough
  return this.parse(input);
},

parseMediaQuery: function(input){
  this._tokenStream = new TokenStream(input, Tokens);
  var result = this._media_query();

  //if there's anything more, then it's an invalid selector
  this._verifyEnd();

  //otherwise return result
  return result;            
},

/**
 * Parses a property value (everything after the semicolon).
 * @return {parserlib.css.PropertyValue} The property value.
 * @throws parserlib.util.SyntaxError If an unexpected token is found.
 * @method parserPropertyValue
 */             
parsePropertyValue: function(input){

  this._tokenStream = new TokenStream(input, Tokens);
  this._readWhitespace();

  var result = this._expr();

  //okay to have a trailing white space
  this._readWhitespace();

  //if there's anything more, then it's an invalid selector
  this._verifyEnd();

  //otherwise return result
  return result;
},

/**
 * Parses a complete CSS rule, including selectors and
 * properties.
 * @param {String} input The text to parser.
 * @return {Boolean} True if the parse completed successfully, false if not.
 * @method parseRule
 */
parseRule: function(input){
  this._tokenStream = new TokenStream(input, Tokens);

  //skip any leading white space
  this._readWhitespace();

  var result = this._ruleset();

  //skip any trailing white space
  this._readWhitespace();

  //if there's anything more, then it's an invalid selector
  this._verifyEnd();

  //otherwise return result
  return result;            
},

/**
 * Parses a single CSS selector (no comma)
 * @param {String} input The text to parse as a CSS selector.
 * @return {Selector} An object representing the selector.
 * @throws parserlib.util.SyntaxError If an unexpected token is found.
 * @method parseSelector
 */
parseSelector: function(input){

  this._tokenStream = new TokenStream(input, Tokens);

  //skip any leading white space
  this._readWhitespace();

  var result = this._selector();

  //skip any trailing white space
  this._readWhitespace();

  //if there's anything more, then it's an invalid selector
  this._verifyEnd();

  //otherwise return result
  return result;
},

/**
 * Parses an HTML style attribute: a set of CSS declarations 
 * separated by semicolons.
 * @param {String} input The text to parse as a style attribute
 * @return {void} 
 * @method parseStyleAttribute
 */
parseStyleAttribute: function(input){
  input += "}"; // for error recovery in _readDeclarations()
  this._tokenStream = new TokenStream(input, Tokens);
  this._readDeclarations();
}
};

//copy over onto prototype
for (prop in additions){
  if (additions.hasOwnProperty(prop)){
    proto[prop] = additions[prop];
  }
}   

return proto;
}();


/*
 nth
 : S* [ ['-'|'+']? INTEGER? {N} [ S* ['-'|'+'] S* INTEGER ]? |
   ['-'|'+']? INTEGER | {O}{D}{D} | {E}{V}{E}{N} ] S*
 ;
 */
var Properties = {

  //A
  "alignment-adjust"              : [ "auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical", "percentage", "length" ],
  "alignment-baseline"            : [ "baseline | use-script | before-edge | text-before-edge | after-edge | text-after-edge | central | middle | ideographic | alphabetic | hanging | mathematical" ],
  "animation"                     : 1,
  "animation-delay"               : { multi: [ "time" ], separator: "," },
  "animation-direction"           : { multi: [ "normal | alternate" ], separator: "," },
  "animation-duration"            : { multi: [ "time" ], separator: "," },
  "animation-iteration-count"     : { multi: [ "number", "infinite"], separator: "," },
  "animation-name"                : { multi: [ "none", "ident" ], separator: "," },
  "animation-play-state"          : { multi: [ "running | paused" ], separator: "," },
  "animation-timing-function"     : 1,
  "appearance"                    : [ "icon | window | desktop | workspace | document | tooltip | dialog | button | push-button | hyperlink | radio-button | checkbox | menu-item | tab | menu | menubar | pull-down-menu | pop-up-menu | list-menu | radio-group | checkbox-group | outline-tree | range | field | combo-box | signature | password", "normal | inherit" ],
  "azimuth"                       : 1,

  //B
  "backface-visibility"           : [ "visible | hidden" ],
  "background"                    : 1,
  "background-attachment"         : { multi: [ "attachment" ], separator: "," },
  "background-clip"               : { multi: [ "box" ], separator: "," },
  "background-color"              : [ "color", "inherit" ],
  "background-image"              : { multi: [ "bg-image" ], separator: "," },
  "background-origin"             : { multi: [ "box" ], separator: "," },
  "background-position"           : 1,
  "background-repeat"             : [ "repeat | repeat-x | repeat-y | no-repeat | inherit" ],
  "background-size"               : 1,
  "baseline-shift"                : [ "baseline | sub | super", "percentage", "length" ],
  "binding"                       : 1,
  "bleed"                         : [ "bleed" ],
  "bookmark-label"                : [ "content", "attr", "string" ],
  "bookmark-level"                : [ "none", "integer" ],
  "bookmark-state"                : [ "open | closed" ],
  "bookmark-target"               : [ "none", "uri", "attr" ],
  "border"                        : { group: [ "border-width", "border-style", "color" ] },
  "border-bottom"                 : { group: [ "border-width", "border-style", "color" ] },
  "border-bottom-color"           : [ "color" ],
  "border-bottom-left-radius"     :    1,
  "border-bottom-right-radius"    :   1,
  "border-bottom-style"           : [ "border-style" ],
  "border-bottom-width"           : [ "border-width" ],
  "border-collapse"               : [ "collapse | separate | inherit" ],
  "border-color"                  : { multi: [ "color", "inherit" ], max: 4 },
  "border-image"                  : 1,
  "border-image-outset"           : { multi: [ "length", "number" ], max: 4 },
  "border-image-repeat"           : { multi: [ "stretch | repeat | round" ], max: 2 },
  "border-image-slice"            : 1,
  "border-image-source"           : [ "image", "none" ],
  "border-image-width"            : { multi: [ "length", "percentage", "number", "auto" ], max: 4 },
  "border-left"                   : { group: [ "border-width", "border-style", "color" ] },
  "border-left-color"             : [ "color", "inherit" ],
  "border-left-style"             : [ "border-style" ],
  "border-left-width"             : [ "border-width" ],
  "border-radius"                 : 1,
  "border-right"                  : { group: [ "border-width", "border-style", "color" ] },
  "border-right-color"            : [ "color", "inherit" ],
  "border-right-style"            : [ "border-style" ],
  "border-right-width"            : [ "border-width" ],
  "border-style"                  : { multi: [ "border-style" ], max: 4 },
  "border-top"                    : { group: [ "border-width", "border-style", "color" ] },
  "border-top-color":             [ "color", "inherit" ],
  "border-top-left-radius"        : 1,
  "border-top-right-radius"       : 1,
  "border-top-style"              : [ "border-style" ],
  "border-top-width"              : [ "border-width" ],
  "border-width"                  : { multi: [ "border-width" ], max: 4 },
  "bottom"                        : [ "margin-width", "inherit" ], 
  "box-align"                     : [ "start | end | center | baseline | stretch" ],        //http://www.w3.org/TR/2009/WD-css3-flexbox-20090723/
  "box-decoration-break"          : [ "slice |clone" ],
  "box-direction"                 : [ "normal | reverse | inherit" ],
  "box-flex"                      : [ "number" ],
  "box-flex-group"                : [ "integer" ],
  "box-lines"                     : [ "single | multiple" ],
  "box-ordinal-group"             : [ "integer" ],
  "box-orient"                    : [ "horizontal | vertical | inline-axis | block-axis | inherit" ],
  "box-pack"                      : [ "start | end | center | justify" ],
  "box-shadow"                    : 1,
  "box-sizing"                    : [ "content-box | border-box | inherit" ],
  "break-after"                   : [ "auto | always | avoid | left | right | page | column | avoid-page | avoid-column" ],
  "break-before"                  : [ "auto | always | avoid | left | right | page | column | avoid-page | avoid-column" ],
  "break-inside"                  : [ "auto | avoid | avoid-page | avoid-column" ],

  //C
  "caption-side"                  : [ "top | bottom | inherit" ],
  "clear"                         : [ "none | right | left | both | inherit" ],
  "clip"                          : 1,
  "color"                         : [ "color", "inherit" ],
  "color-profile"                 : 1,
  "column-count"                  : [ "integer", "auto" ],                      //http://www.w3.org/TR/css3-multicol/
  "column-fill"                   : [ "auto | balance" ],
  "column-gap"                    : [ "length", "normal" ],
  "column-rule"                   : { group: [ "color", "border-style", "border-width" ] },
  "column-rule-color"             : [ "color" ],
  "column-rule-style"             : [ "border-style" ],
  "column-rule-width"             : [ "border-width" ],
  "column-span"                   : [ "none | all" ],
  "column-width"                  : [ "length", "auto" ],
  "columns"                       : 1,
  "content"                       : 1,
  "counter-increment"             : 1,
  "counter-reset"                 : 1,
  "crop"                          : [ "shape", "auto" ],
  "cue"                           : [ "cue-after | cue-before | inherit" ],
  "cue-after"                     : 1,
  "cue-before"                    : 1,
  "cursor"                        : 1,

  //D
  "direction"                     : [ "ltr | rtl | inherit" ],
  "display"                       : [ "inline | block | list-item | inline-block | table | inline-table | table-row-group | table-header-group | table-footer-group | table-row | table-column-group | table-column | table-cell | table-caption | box | inline-box | grid | inline-grid", "none | inherit" ],
  "dominant-baseline"             : 1,
  "drop-initial-after-adjust"     : [ "central | middle | after-edge | text-after-edge | ideographic | alphabetic | mathematical", "percentage", "length" ],
  "drop-initial-after-align"      : [ "baseline | use-script | before-edge | text-before-edge | after-edge | text-after-edge | central | middle | ideographic | alphabetic | hanging | mathematical" ],
  "drop-initial-before-adjust"    : [ "before-edge | text-before-edge | central | middle | hanging | mathematical", "percentage", "length" ],
  "drop-initial-before-align"     : [ "caps-height | baseline | use-script | before-edge | text-before-edge | after-edge | text-after-edge | central | middle | ideographic | alphabetic | hanging | mathematical" ],
  "drop-initial-size"             : [ "auto", "line", "length", "percentage" ],
  "drop-initial-value"            : [ "initial", "integer" ],

  //E
  "elevation"                     : [ "angle", "below | level | above | higher | lower | inherit" ],
  "empty-cells"                   : [ "show | hide | inherit" ],

  //F
  "filter"                        : 1,
  "fit"                           : [ "fill | hidden | meet | slice" ],
  "fit-position"                  : 1,
  "float"                         : [ "left | right | none | inherit" ],    
  "float-offset"                  : 1,
  "font"                          : 1,
  "font-family"                   : 1,
  "font-size"                     : [ "absolute-size", "relative-size", "length", "percentage", "inherit" ],
  "font-size-adjust"              : [ "number", "none | inherit" ],
  "font-stretch"                  : [ "normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded | inherit" ],
  "font-style"                    : [ "normal | italic | oblique | inherit" ],
  "font-variant"                  : [ "normal | small-caps | inherit" ],
  "font-weight"                   : [ "normal | bold | bolder | lighter | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | inherit" ],

  //G
  "grid-cell-stacking"            : [ "columns | rows | layer" ],
  "grid-column"                   : 1,
  "grid-columns"                  : 1,
  "grid-column-align"             : [ "start | end | center | stretch" ],
  "grid-column-sizing"            : 1,
  "grid-column-span"              : [ "integer" ],
  "grid-flow"                     : [ "none | rows | columns" ],
  "grid-layer"                    : [ "integer" ],
  "grid-row"                      : 1,
  "grid-rows"                     : 1,
  "grid-row-align"                : [ "start | end | center | stretch" ],
  "grid-row-span"                 : [ "integer" ],
  "grid-row-sizing"               : 1,

  //H
  "hanging-punctuation"           : 1,
  "height"                        : [ "margin-width", "inherit" ],
  "hyphenate-after"               : [ "integer", "auto" ],
  "hyphenate-before"              : [ "integer", "auto" ],
  "hyphenate-character"           : [ "string", "auto" ],
  "hyphenate-lines"               : [ "no-limit", "integer" ],
  "hyphenate-resource"            : 1,
  "hyphens"                       : [ "none | manual | auto" ],

  //I
  "icon"                          : 1,
  "image-orientation"             : [ "angle", "auto" ],
  "image-rendering"               : 1,
  "image-resolution"              : 1,
  "inline-box-align"              : [ "initial | last", "integer" ],

  //L
  "left"                          : [ "margin-width", "inherit" ],
  "letter-spacing"                : [ "length", "normal | inherit" ],
  "line-height"                   : [ "number", "length", "percentage", "normal | inherit"],
  "line-break"                    : [ "auto | loose | normal | strict" ],
  "line-stacking"                 : 1,
  "line-stacking-ruby"            : [ "exclude-ruby | include-ruby" ],
  "line-stacking-shift"           : [ "consider-shifts | disregard-shifts" ],
  "line-stacking-strategy"        : [ "inline-line-height | block-line-height | max-height | grid-height" ],
  "list-style"                    : 1,
  "list-style-image"              : [ "uri", "none | inherit" ],
  "list-style-position"           : [ "inside | outside | inherit" ],
  "list-style-type"               : [ "disc | circle | square | decimal | decimal-leading-zero | lower-roman | upper-roman | lower-greek | lower-latin | upper-latin | armenian | georgian | lower-alpha | upper-alpha | none | inherit" ],

  //M
  "margin":                       { multi: [ "margin-width", "inherit" ], max: 4 },
  "margin-bottom":                [ "margin-width", "inherit" ],
  "margin-left":                  [ "margin-width", "inherit" ],
  "margin-right":                 [ "margin-width", "inherit" ],
  "margin-top":                   [ "margin-width", "inherit" ],
  "mark": 1,
  "mark-after": 1,
  "mark-before": 1,
  "marks": 1,
  "marquee-direction": 1,
  "marquee-play-count": 1,
  "marquee-speed": 1,
  "marquee-style": 1,
  "max-height":                   [ "length", "percentage", "none | inherit" ],
  "max-width":                    [ "length", "percentage", "none | inherit" ],
  "min-height":                   [ "length", "percentage", "inherit" ],
  "min-width":                    [ "length", "percentage", "inherit" ],
  "move-to": 1,

  //N
  "nav-down": 1,
  "nav-index": 1,
  "nav-left": 1,
  "nav-right": 1,
  "nav-up": 1,

  //O
  "opacity":                      [ "number", "inherit" ],
  "orphans":                      [ "integer", "inherit" ],
  "outline": 1,
  "outline-color":                [ "color", "invert | inherit" ],
  "outline-offset": 1,
  "outline-style":                [ "border-style", "inherit" ],
  "outline-width":                [ "border-width", "inherit" ],
  "overflow":                     [ "visible | hidden | scroll | auto | inherit" ],
  "overflow-style": 1,
  "overflow-x": 1,
  "overflow-y": 1,

  //P
  "padding":                      { multi: [ "padding-width", "inherit" ], max: 4 },
  "padding-bottom":               [ "padding-width", "inherit" ],
  "padding-left":                 [ "padding-width", "inherit" ],
  "padding-right":                [ "padding-width", "inherit" ],
  "padding-top":                  [ "padding-width", "inherit" ],
  "page": 1,
  "page-break-after":             [ "auto | always | avoid | left | right | inherit" ],
  "page-break-before":            [ "auto | always | avoid | left | right | inherit" ],
  "page-break-inside":            [ "auto | avoid | inherit" ],
  "page-policy": 1,
  "pause": 1,
  "pause-after": 1,
  "pause-before": 1,
  "perspective": 1,
  "perspective-origin": 1,
  "phonemes": 1,
  "pitch": 1,
  "pitch-range": 1,
  "play-during": 1,
  "position":                     [ "static | relative | absolute | fixed | inherit" ],
  "presentation-level": 1,
  "punctuation-trim": 1,

  //Q
  "quotes": 1,

  //R
  "rendering-intent": 1,
  "resize": 1,
  "rest": 1,
  "rest-after": 1,
  "rest-before": 1,
  "richness": 1,
  "right":                        [ "margin-width", "inherit" ],
  "rotation": 1,
  "rotation-point": 1,
  "ruby-align": 1,
  "ruby-overhang": 1,
  "ruby-position": 1,
  "ruby-span": 1,

  //S
  "size": 1,
  "speak":                        [ "normal | none | spell-out | inherit" ],
  "speak-header":                 [ "once | always | inherit" ],
  "speak-numeral":                [ "digits | continuous | inherit" ],
  "speak-punctuation":            [ "code | none | inherit" ],
  "speech-rate": 1,
  "src" : 1,
  "stress": 1,
  "string-set": 1,

  "table-layout":                 [ "auto | fixed | inherit" ],
  "tab-size":                     [ "integer", "length" ],
  "target": 1,
  "target-name": 1,
  "target-new": 1,
  "target-position": 1,
  "text-align":                   [ "left | right | center | justify | inherit" ],
  "text-align-last": 1,
  "text-decoration": 1,
  "text-emphasis": 1,
  "text-height": 1,
  "text-indent":                  [ "length", "percentage", "inherit" ],
  "text-justify":                 [ "auto | none | inter-word | inter-ideograph | inter-cluster | distribute | kashida" ],
  "text-outline": 1,
  "text-overflow": 1,
  "text-shadow": 1,
  "text-transform":               [ "capitalize | uppercase | lowercase | none | inherit" ],
  "text-wrap":                    [ "normal | none | avoid" ],
  "top":                          [ "margin-width", "inherit" ],
  "transform": 1,
  "transform-origin": 1,
  "transform-style": 1,
  "transition": 1,
  "transition-delay": 1,
  "transition-duration": 1,
  "transition-property": 1,
  "transition-timing-function": 1,

  //U
  "unicode-bidi":                 [ "normal | embed | bidi-override | inherit" ],
  "user-modify":                  [ "read-only | read-write | write-only | inherit" ],
  "user-select":                  [ "none | text | toggle | element | elements | all | inherit" ],

  //V
  "vertical-align":               [ "percentage", "length", "baseline | sub | super | top | text-top | middle | bottom | text-bottom | inherit" ],
  "visibility":                   [ "visible | hidden | collapse | inherit" ],
  "voice-balance": 1,
  "voice-duration": 1,
  "voice-family": 1,
  "voice-pitch": 1,
  "voice-pitch-range": 1,
  "voice-rate": 1,
  "voice-stress": 1,
  "voice-volume": 1,
  "volume": 1,

  //W
  "white-space":                  [ "normal | pre | nowrap | pre-wrap | pre-line | inherit" ],
  "white-space-collapse": 1,
  "widows":                       [ "integer", "inherit" ],
  "width":                        [ "length", "percentage", "auto", "inherit" ],
  "word-break":                   [ "normal | keep-all | break-all" ],
  "word-spacing":                 [ "length", "normal | inherit" ],
  "word-wrap": 1,

  //Z
  "z-index":                      [ "integer", "auto | inherit" ],
  "zoom":                         [ "number", "percentage", "normal" ]
};
/*global SyntaxUnit, Parser*/
/**
 * Represents a selector combinator (whitespace, +, >).
 * @namespace parserlib.css
 * @class PropertyName
 * @extends parserlib.util.SyntaxUnit
 * @constructor
 * @param {String} text The text representation of the unit. 
 * @param {String} hack The type of IE hack applied ("*", "_", or null).
 * @param {int} line The line of text on which the unit resides.
 * @param {int} col The column of text on which the unit resides.
 */
function PropertyName(text, hack, line, col){

  SyntaxUnit.call(this, text, line, col, Parser.PROPERTY_NAME_TYPE);

  /**
   * The type of IE hack applied ("*", "_", or null).
   * @type String
   * @property hack
   */
  this.hack = hack;

}

PropertyName.prototype = new SyntaxUnit();
PropertyName.prototype.constructor = PropertyName;
PropertyName.prototype.toString = function(){
  return (this.hack ? this.hack : "") + this.text;
};

/*global SyntaxUnit, Parser*/
/**
 * Represents a single part of a CSS property value, meaning that it represents
 * just everything single part between ":" and ";". If there are multiple values
 * separated by commas, this type represents just one of the values.
 * @param {String[]} parts An array of value parts making up this value.
 * @param {int} line The line of text on which the unit resides.
 * @param {int} col The column of text on which the unit resides.
 * @namespace parserlib.css
 * @class PropertyValue
 * @extends parserlib.util.SyntaxUnit
 * @constructor
 */
function PropertyValue(parts, line, col){

  SyntaxUnit.call(this, parts.join(" "), line, col, Parser.PROPERTY_VALUE_TYPE);

  /**
   * The parts that make up the selector.
   * @type Array
   * @property parts
   */
  this.parts = parts;

}

PropertyValue.prototype = new SyntaxUnit();
PropertyValue.prototype.constructor = PropertyValue;


/*global SyntaxUnit, Parser, Colors*/
/**
 * Represents a single part of a CSS property value, meaning that it represents
 * just one part of the data between ":" and ";".
 * @param {String} text The text representation of the unit.
 * @param {int} line The line of text on which the unit resides.
 * @param {int} col The column of text on which the unit resides.
 * @namespace parserlib.css
 * @class PropertyValuePart
 * @extends parserlib.util.SyntaxUnit
 * @constructor
 */
function PropertyValuePart(text, line, col){

  SyntaxUnit.call(this, text, line, col, Parser.PROPERTY_VALUE_PART_TYPE);

  /**
   * Indicates the type of value unit.
   * @type String
   * @property type
   */
  this.type = "unknown";

  //figure out what type of data it is

  var temp;

  //it is a measurement?
  if (/^([+\-]?[\d\.]+)([a-z]+)$/i.test(text)){  //dimension
    this.type = "dimension";
    this.value = +RegExp.$1;
    this.units = RegExp.$2;

    //try to narrow down
    switch(this.units.toLowerCase()){

      case "em":
      case "rem":
      case "ex":
      case "px":
      case "cm":
      case "mm":
      case "in":
      case "pt":
      case "pc":
      this.type = "length";
      break;

      case "deg":
      case "rad":
      case "grad":
      this.type = "angle";
      break;

      case "ms":
      case "s":
      this.type = "time";
      break;

      case "hz":
      case "khz":
      this.type = "frequency";
      break;

      case "dpi":
      case "dpcm":
      this.type = "resolution";
      break;

      //default

    }

  } else if (/^([+\-]?[\d\.]+)%$/i.test(text)){  //percentage
    this.type = "percentage";
    this.value = +RegExp.$1;
  } else if (/^([+\-]?[\d\.]+)%$/i.test(text)){  //percentage
    this.type = "percentage";
    this.value = +RegExp.$1;
  } else if (/^([+\-]?\d+)$/i.test(text)){  //integer
    this.type = "integer";
    this.value = +RegExp.$1;
  } else if (/^([+\-]?[\d\.]+)$/i.test(text)){  //number
    this.type = "number";
    this.value = +RegExp.$1;

  } else if (/^#([a-f0-9]{3,6})/i.test(text)){  //hexcolor
    this.type = "color";
    temp = RegExp.$1;
    if (temp.length == 3){
      this.red    = parseInt(temp.charAt(0)+temp.charAt(0),16);
      this.green  = parseInt(temp.charAt(1)+temp.charAt(1),16);
      this.blue   = parseInt(temp.charAt(2)+temp.charAt(2),16);            
    } else {
      this.red    = parseInt(temp.substring(0,2),16);
      this.green  = parseInt(temp.substring(2,4),16);
      this.blue   = parseInt(temp.substring(4,6),16);            
    }
  } else if (/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i.test(text)){ //rgb() color with absolute numbers
    this.type   = "color";
    this.red    = +RegExp.$1;
    this.green  = +RegExp.$2;
    this.blue   = +RegExp.$3;
  } else if (/^rgb\(\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i.test(text)){ //rgb() color with percentages
    this.type   = "color";
    this.red    = +RegExp.$1 * 255 / 100;
    this.green  = +RegExp.$2 * 255 / 100;
    this.blue   = +RegExp.$3 * 255 / 100;
  } else if (/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d\.]+)\s*\)/i.test(text)){ //rgba() color with absolute numbers
    this.type   = "color";
    this.red    = +RegExp.$1;
    this.green  = +RegExp.$2;
    this.blue   = +RegExp.$3;
    this.alpha  = +RegExp.$4;
  } else if (/^rgba\(\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([\d\.]+)\s*\)/i.test(text)){ //rgba() color with percentages
    this.type   = "color";
    this.red    = +RegExp.$1 * 255 / 100;
    this.green  = +RegExp.$2 * 255 / 100;
    this.blue   = +RegExp.$3 * 255 / 100;
    this.alpha  = +RegExp.$4;        
  } else if (/^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i.test(text)){ //hsl()
    this.type   = "color";
    this.hue    = +RegExp.$1;
    this.saturation = +RegExp.$2 / 100;
    this.lightness  = +RegExp.$3 / 100;        
  } else if (/^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([\d\.]+)\s*\)/i.test(text)){ //hsla() color with percentages
    this.type   = "color";
    this.hue    = +RegExp.$1;
    this.saturation = +RegExp.$2 / 100;
    this.lightness  = +RegExp.$3 / 100;        
    this.alpha  = +RegExp.$4;        
  } else if (/^url\(["']?([^\)"']+)["']?\)/i.test(text)){ //URI
    this.type   = "uri";
    this.uri    = RegExp.$1;
  } else if (/^([^\(]+)\(/i.test(text)){
    this.type   = "function";
    this.name   = RegExp.$1;
    this.value  = text;
  } else if (/^["'][^"']*["']/.test(text)){    //string
    this.type   = "string";
    this.value  = eval(text);
  } else if (Colors[text.toLowerCase()]){  //named color
    this.type   = "color";
    temp        = Colors[text.toLowerCase()].substring(1);
    this.red    = parseInt(temp.substring(0,2),16);
    this.green  = parseInt(temp.substring(2,4),16);
    this.blue   = parseInt(temp.substring(4,6),16);         
  } else if (/^[\,\/]$/.test(text)){
    this.type   = "operator";
    this.value  = text;
  } else if (/^[a-z\-\u0080-\uFFFF][a-z0-9\-\u0080-\uFFFF]*$/i.test(text)){
    this.type   = "identifier";
    this.value  = text;
  }

}

PropertyValuePart.prototype = new SyntaxUnit();
PropertyValuePart.prototype.constructor = PropertyValuePart;

/**
 * Create a new syntax unit based solely on the given token.
 * Convenience method for creating a new syntax unit when
 * it represents a single token instead of multiple.
 * @param {Object} token The token object to represent.
 * @return {parserlib.css.PropertyValuePart} The object representing the token.
 * @static
 * @method fromToken
 */
PropertyValuePart.fromToken = function(token){
  return new PropertyValuePart(token.value, token.startLine, token.startCol);
};
var Pseudos = {
  ":first-letter": 1,
  ":first-line":   1,
  ":before":       1,
  ":after":        1
};

Pseudos.ELEMENT = 1;
Pseudos.CLASS = 2;

Pseudos.isElement = function(pseudo){
  return pseudo.indexOf("::") === 0 || Pseudos[pseudo.toLowerCase()] == Pseudos.ELEMENT;
};
/*global SyntaxUnit, Parser, Specificity*/
/**
 * Represents an entire single selector, including all parts but not
 * including multiple selectors (those separated by commas).
 * @namespace parserlib.css
 * @class Selector
 * @extends parserlib.util.SyntaxUnit
 * @constructor
 * @param {Array} parts Array of selectors parts making up this selector.
 * @param {int} line The line of text on which the unit resides.
 * @param {int} col The column of text on which the unit resides.
 */
function Selector(parts, line, col){

  SyntaxUnit.call(this, parts.join(" "), line, col, Parser.SELECTOR_TYPE);

  /**
   * The parts that make up the selector.
   * @type Array
   * @property parts
   */
  this.parts = parts;

  /**
   * The specificity of the selector.
   * @type parserlib.css.Specificity
   * @property specificity
   */
  this.specificity = Specificity.calculate(this);

}

Selector.prototype = new SyntaxUnit();
Selector.prototype.constructor = Selector;


/*global SyntaxUnit, Parser*/
/**
 * Represents a single part of a selector string, meaning a single set of
 * element name and modifiers. This does not include combinators such as
 * spaces, +, >, etc.
 * @namespace parserlib.css
 * @class SelectorPart
 * @extends parserlib.util.SyntaxUnit
 * @constructor
 * @param {String} elementName The element name in the selector or null
 *      if there is no element name.
 * @param {Array} modifiers Array of individual modifiers for the element.
 *      May be empty if there are none.
 * @param {String} text The text representation of the unit. 
 * @param {int} line The line of text on which the unit resides.
 * @param {int} col The column of text on which the unit resides.
 */
function SelectorPart(elementName, modifiers, text, line, col){

  SyntaxUnit.call(this, text, line, col, Parser.SELECTOR_PART_TYPE);

  /**
   * The tag name of the element to which this part
   * of the selector affects.
   * @type String
   * @property elementName
   */
  this.elementName = elementName;

  /**
   * The parts that come after the element name, such as class names, IDs,
   * pseudo classes/elements, etc.
   * @type Array
   * @property modifiers
   */
  this.modifiers = modifiers;

}

SelectorPart.prototype = new SyntaxUnit();
SelectorPart.prototype.constructor = SelectorPart;


/*global SyntaxUnit, Parser*/
/**
 * Represents a selector modifier string, meaning a class name, element name,
 * element ID, pseudo rule, etc.
 * @namespace parserlib.css
 * @class SelectorSubPart
 * @extends parserlib.util.SyntaxUnit
 * @constructor
 * @param {String} text The text representation of the unit. 
 * @param {String} type The type of selector modifier.
 * @param {int} line The line of text on which the unit resides.
 * @param {int} col The column of text on which the unit resides.
 */
function SelectorSubPart(text, type, line, col){

  SyntaxUnit.call(this, text, line, col, Parser.SELECTOR_SUB_PART_TYPE);

  /**
   * The type of modifier.
   * @type String
   * @property type
   */
  this.type = type;

  /**
   * Some subparts have arguments, this represents them.
   * @type Array
   * @property args
   */
  this.args = [];

}

SelectorSubPart.prototype = new SyntaxUnit();
SelectorSubPart.prototype.constructor = SelectorSubPart;


/*global Pseudos, SelectorPart*/
/**
 * Represents a selector's specificity.
 * @namespace parserlib.css
 * @class Specificity
 * @constructor
 * @param {int} a Should be 1 for inline styles, zero for stylesheet styles
 * @param {int} b Number of ID selectors
 * @param {int} c Number of classes and pseudo classes
 * @param {int} d Number of element names and pseudo elements
 */
function Specificity(a, b, c, d){
  this.a = a;
  this.b = b;
  this.c = c;
  this.d = d;
}

Specificity.prototype = {
  constructor: Specificity,

  /**
   * Compare this specificity to another.
   * @param {Specificity} other The other specificity to compare to.
   * @return {int} -1 if the other specificity is larger, 1 if smaller, 0 if equal.
   * @method compare
   */
  compare: function(other){
    var comps = ["a", "b", "c", "d"],
        i, len;

    for (i=0, len=comps.length; i < len; i++){
      if (this[comps[i]] < other[comps[i]]){
        return -1;
      } else if (this[comps[i]] > other[comps[i]]){
        return 1;
      }
    }

    return 0;
  },

  /**
   * Creates a numeric value for the specificity.
   * @return {int} The numeric value for the specificity.
   * @method valueOf
   */
  valueOf: function(){
    return (this.a * 1000) + (this.b * 100) + (this.c * 10) + this.d;
  },

  /**
   * Returns a string representation for specificity.
   * @return {String} The string representation of specificity.
   * @method toString
   */
  toString: function(){
    return this.a + "," + this.b + "," + this.c + "," + this.d;
  }

};

/**
 * Calculates the specificity of the given selector.
 * @param {parserlib.css.Selector} The selector to calculate specificity for.
 * @return {parserlib.css.Specificity} The specificity of the selector.
 * @static
 * @method calculate
 */
Specificity.calculate = function(selector){

  var i, len,
      part,
      b=0, c=0, d=0;

  function updateValues(part){

    var i, j, len, num,
        elementName = part.elementName ? part.elementName.text : "",
        modifier;

    if (elementName && elementName.charAt(elementName.length-1) != "*") {
      d++;
    }    

    for (i=0, len=part.modifiers.length; i < len; i++){
      modifier = part.modifiers[i];
      switch(modifier.type){
        case "class":
        case "attribute":
        c++;
        break;

        case "id":
        b++;
        break;

        case "pseudo":
        if (Pseudos.isElement(modifier.text)){
          d++;
        } else {
          c++;
        }                    
        break;

        case "not":
        for (j=0, num=modifier.args.length; j < num; j++){
          updateValues(modifier.args[j]);
        }
      }    
    }
  }

  for (i=0, len=selector.parts.length; i < len; i++){
    part = selector.parts[i];

    if (part instanceof SelectorPart){
      updateValues(part);                
    }
  }

  return new Specificity(0, b, c, d);
};

/*global Tokens, TokenStreamBase*/

var h = /^[0-9a-fA-F]$/,
    nonascii = /^[\u0080-\uFFFF]$/,
    nl = /\n|\r\n|\r|\f/;

//-----------------------------------------------------------------------------
// Helper functions
//-----------------------------------------------------------------------------


function isHexDigit(c){
  return c !== null && h.test(c);
}

function isDigit(c){
  return c !== null && /\d/.test(c);
}

function isWhitespace(c){
  return c !== null && /\s/.test(c);
}

function isNewLine(c){
  return c !== null && nl.test(c);
}

function isNameStart(c){
  return c !== null && (/[a-z_\u0080-\uFFFF\\]/i.test(c));
}

function isNameChar(c){
  return c !== null && (isNameStart(c) || /[0-9\-\\]/.test(c));
}

function isIdentStart(c){
  return c !== null && (isNameStart(c) || /\-\\/.test(c));
}

function mix(receiver, supplier){
  for (var prop in supplier){
    if (supplier.hasOwnProperty(prop)){
      receiver[prop] = supplier[prop];
    }
  }
  return receiver;
}

//-----------------------------------------------------------------------------
// CSS Token Stream
//-----------------------------------------------------------------------------


/**
 * A token stream that produces CSS tokens.
 * @param {String|Reader} input The source of text to tokenize.
 * @constructor
 * @class TokenStream
 * @namespace parserlib.css
 */
function TokenStream(input){
  TokenStreamBase.call(this, input, Tokens);
}

TokenStream.prototype = mix(new TokenStreamBase(), {

  /**
   * Overrides the TokenStreamBase method of the same name
   * to produce CSS tokens.
   * @param {variant} channel The name of the channel to use
   *      for the next token.
   * @return {Object} A token object representing the next token.
   * @method _getToken
   * @private
   */
  _getToken: function(channel){

    var c,
        reader = this._reader,
        token   = null,
        startLine   = reader.getLine(),
        startCol    = reader.getCol();

    c = reader.read();


    while(c){
      switch(c){

        /*
         * Potential tokens:
         * - COMMENT
         * - SLASH
         * - CHAR
         */
        case "/":

        if(reader.peek() == "*"){
          token = this.commentToken(c, startLine, startCol);
        } else {
          token = this.charToken(c, startLine, startCol);
        }
        break;

        /*
         * Potential tokens:
         * - DASHMATCH
         * - INCLUDES
         * - PREFIXMATCH
         * - SUFFIXMATCH
         * - SUBSTRINGMATCH
         * - CHAR
         */
        case "|":
        case "~":
        case "^":
        case "$":
        case "*":
        if(reader.peek() == "="){
          token = this.comparisonToken(c, startLine, startCol);
        } else {
          token = this.charToken(c, startLine, startCol);
        }
        break;

        /*
         * Potential tokens:
         * - STRING
         * - INVALID
         */
        case "\"":
        case "'":
        token = this.stringToken(c, startLine, startCol);
        break;

        /*
         * Potential tokens:
         * - HASH
         * - CHAR
         */
        case "#":
        if (isNameChar(reader.peek())){
          token = this.hashToken(c, startLine, startCol);
        } else {
          token = this.charToken(c, startLine, startCol);
        }
        break;

        /*
         * Potential tokens:
         * - DOT
         * - NUMBER
         * - DIMENSION
         * - PERCENTAGE
         */
        case ".":
        if (isDigit(reader.peek())){
          token = this.numberToken(c, startLine, startCol);
        } else {
          token = this.charToken(c, startLine, startCol);
        }
        break;

        /*
         * Potential tokens:
         * - CDC
         * - MINUS
         * - NUMBER
         * - DIMENSION
         * - PERCENTAGE
         */
        case "-":
        if (reader.peek() == "-"){  //could be closing HTML-style comment
          token = this.htmlCommentEndToken(c, startLine, startCol);
        } else if (isNameStart(reader.peek())){
          token = this.identOrFunctionToken(c, startLine, startCol);
        } else {
          token = this.charToken(c, startLine, startCol);
        }
        break;

        /*
         * Potential tokens:
         * - IMPORTANT_SYM
         * - CHAR
         */
        case "!":
        token = this.importantToken(c, startLine, startCol);
        break;

        /*
         * Any at-keyword or CHAR
         */
        case "@":
        token = this.atRuleToken(c, startLine, startCol);
        break;

        /*
         * Potential tokens:
         * - NOT
         * - CHAR
         */
        case ":":
        token = this.notToken(c, startLine, startCol);
        break;

        /*
         * Potential tokens:
         * - CDO
         * - CHAR
         */
        case "<":
        token = this.htmlCommentStartToken(c, startLine, startCol);
        break;

        /*
         * Potential tokens:
         * - UNICODE_RANGE
         * - URL
         * - CHAR
         */
        case "U":
        case "u":
        if (reader.peek() == "+"){
          token = this.unicodeRangeToken(c, startLine, startCol);
          break;
        }
        /* falls through */
        default:

        /*
         * Potential tokens:
         * - NUMBER
         * - DIMENSION
         * - LENGTH
         * - FREQ
         * - TIME
         * - EMS
         * - EXS
         * - ANGLE
         */
        if (isDigit(c)){
          token = this.numberToken(c, startLine, startCol);
        } else

          /*
         * Potential tokens:
         * - S
         */
        if (isWhitespace(c)){
          token = this.whitespaceToken(c, startLine, startCol);
        } else

          /*
         * Potential tokens:
         * - IDENT
         */
        if (isIdentStart(c)){
          token = this.identOrFunctionToken(c, startLine, startCol);
        } else

          /*
         * Potential tokens:
         * - CHAR
         * - PLUS
         */
        {
          token = this.charToken(c, startLine, startCol);
        }






      }

      //make sure this token is wanted
      //TODO: check channel
      break;
    }

    if (!token && c === null){
      token = this.createToken(Tokens.EOF,null,startLine,startCol);
    }

    return token;
  },

  //-------------------------------------------------------------------------
  // Methods to create tokens
  //-------------------------------------------------------------------------

  /**
   * Produces a token based on available data and the current
   * reader position information. This method is called by other
   * private methods to create tokens and is never called directly.
   * @param {int} tt The token type.
   * @param {String} value The text value of the token.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @param {Object} options (Optional) Specifies a channel property
   *      to indicate that a different channel should be scanned
   *      and/or a hide property indicating that the token should
   *      be hidden.
   * @return {Object} A token object.
   * @method createToken
   */
  createToken: function(tt, value, startLine, startCol, options){
    var reader = this._reader;
    options = options || {};

    return {
      value:      value,
      type:       tt,
      channel:    options.channel,
      hide:       options.hide || false,
      startLine:  startLine,
      startCol:   startCol,
      endLine:    reader.getLine(),
      endCol:     reader.getCol()
    };
  },

  //-------------------------------------------------------------------------
  // Methods to create specific tokens
  //-------------------------------------------------------------------------

  /**
   * Produces a token for any at-rule. If the at-rule is unknown, then
   * the token is for a single "@" character.
   * @param {String} first The first character for the token.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method atRuleToken
   */
  atRuleToken: function(first, startLine, startCol){
    var rule    = first,
        reader  = this._reader,
        tt      = Tokens.CHAR,
        valid   = false,
        ident,
        c;

    /*
     * First, mark where we are. There are only four @ rules,
     * so anything else is really just an invalid token.
     * Basically, if this doesn't match one of the known @
     * rules, just return '@' as an unknown token and allow
     * parsing to continue after that point.
     */
    reader.mark();

    //try to find the at-keyword
    ident = this.readName();
    rule = first + ident;
    tt = Tokens.type(rule.toLowerCase());

    //if it's not valid, use the first character only and reset the reader
    if (tt == Tokens.CHAR || tt == Tokens.UNKNOWN){
      if (rule.length > 1){
        tt = Tokens.UNKNOWN_SYM;                
      } else {
        tt = Tokens.CHAR;
        rule = first;
        reader.reset();
      }
    }

    return this.createToken(tt, rule, startLine, startCol);
  },

  /**
   * Produces a character token based on the given character
   * and location in the stream. If there's a special (non-standard)
   * token name, this is used; otherwise CHAR is used.
   * @param {String} c The character for the token.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method charToken
   */
  charToken: function(c, startLine, startCol){
    var tt = Tokens.type(c);

    if (tt == -1){
      tt = Tokens.CHAR;
    }

    return this.createToken(tt, c, startLine, startCol);
  },

  /**
   * Produces a character token based on the given character
   * and location in the stream. If there's a special (non-standard)
   * token name, this is used; otherwise CHAR is used.
   * @param {String} first The first character for the token.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method commentToken
   */
  commentToken: function(first, startLine, startCol){
    var reader  = this._reader,
        comment = this.readComment(first);

    return this.createToken(Tokens.COMMENT, comment, startLine, startCol);
  },

  /**
   * Produces a comparison token based on the given character
   * and location in the stream. The next character must be
   * read and is already known to be an equals sign.
   * @param {String} c The character for the token.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method comparisonToken
   */
  comparisonToken: function(c, startLine, startCol){
    var reader  = this._reader,
        comparison  = c + reader.read(),
        tt      = Tokens.type(comparison) || Tokens.CHAR;

    return this.createToken(tt, comparison, startLine, startCol);
  },

  /**
   * Produces a hash token based on the specified information. The
   * first character provided is the pound sign (#) and then this
   * method reads a name afterward.
   * @param {String} first The first character (#) in the hash name.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method hashToken
   */
  hashToken: function(first, startLine, startCol){
    var reader  = this._reader,
        name    = this.readName(first);

    return this.createToken(Tokens.HASH, name, startLine, startCol);
  },

  /**
   * Produces a CDO or CHAR token based on the specified information. The
   * first character is provided and the rest is read by the function to determine
   * the correct token to create.
   * @param {String} first The first character in the token.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method htmlCommentStartToken
   */
  htmlCommentStartToken: function(first, startLine, startCol){
    var reader      = this._reader,
        text        = first;

    reader.mark();
    text += reader.readCount(3);

    if (text == "<!--"){
      return this.createToken(Tokens.CDO, text, startLine, startCol);
    } else {
      reader.reset();
      return this.charToken(first, startLine, startCol);
    }
  },

  /**
   * Produces a CDC or CHAR token based on the specified information. The
   * first character is provided and the rest is read by the function to determine
   * the correct token to create.
   * @param {String} first The first character in the token.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method htmlCommentEndToken
   */
  htmlCommentEndToken: function(first, startLine, startCol){
    var reader      = this._reader,
        text        = first;

    reader.mark();
    text += reader.readCount(2);

    if (text == "-->"){
      return this.createToken(Tokens.CDC, text, startLine, startCol);
    } else {
      reader.reset();
      return this.charToken(first, startLine, startCol);
    }
  },

  /**
   * Produces an IDENT or FUNCTION token based on the specified information. The
   * first character is provided and the rest is read by the function to determine
   * the correct token to create.
   * @param {String} first The first character in the identifier.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method identOrFunctionToken
   */
  identOrFunctionToken: function(first, startLine, startCol){
    var reader  = this._reader,
        ident   = this.readName(first),
        tt      = Tokens.IDENT;

    //if there's a left paren immediately after, it's a URI or function
    if (reader.peek() == "("){
      ident += reader.read();
      if (ident.toLowerCase() == "url("){
        tt = Tokens.URI;
        ident = this.readURI(ident);

        //didn't find a valid URL or there's no closing paren
        if (ident.toLowerCase() == "url("){
          tt = Tokens.FUNCTION;
        }
      } else {
        tt = Tokens.FUNCTION;
      }
    } else if (reader.peek() == ":"){  //might be an IE function

      //IE-specific functions always being with progid:
      if (ident.toLowerCase() == "progid"){
        ident += reader.readTo("(");
        tt = Tokens.IE_FUNCTION;
      }
    }

    return this.createToken(tt, ident, startLine, startCol);
  },

  /**
   * Produces an IMPORTANT_SYM or CHAR token based on the specified information. The
   * first character is provided and the rest is read by the function to determine
   * the correct token to create.
   * @param {String} first The first character in the token.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method importantToken
   */
  importantToken: function(first, startLine, startCol){
    var reader      = this._reader,
        important   = first,
        tt          = Tokens.CHAR,
        temp,
        c;

    reader.mark();
    c = reader.read();

    while(c){

      //there can be a comment in here
      if (c == "/"){

        //if the next character isn't a star, then this isn't a valid !important token
        if (reader.peek() != "*"){
          break;
        } else {
          temp = this.readComment(c);
          if (temp === ""){    //broken!
            break;
          }
        }
      } else if (isWhitespace(c)){
        important += c + this.readWhitespace();
      } else if (/i/i.test(c)){
        temp = reader.readCount(8);
        if (/mportant/i.test(temp)){
          important += c + temp;
          tt = Tokens.IMPORTANT_SYM;

        }
        break;  //we're done
      } else {
        break;
      }

      c = reader.read();
    }

    if (tt == Tokens.CHAR){
      reader.reset();
      return this.charToken(first, startLine, startCol);
    } else {
      return this.createToken(tt, important, startLine, startCol);
    }


  },

  /**
   * Produces a NOT or CHAR token based on the specified information. The
   * first character is provided and the rest is read by the function to determine
   * the correct token to create.
   * @param {String} first The first character in the token.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method notToken
   */
  notToken: function(first, startLine, startCol){
    var reader      = this._reader,
        text        = first;

    reader.mark();
    text += reader.readCount(4);

    if (text.toLowerCase() == ":not("){
      return this.createToken(Tokens.NOT, text, startLine, startCol);
    } else {
      reader.reset();
      return this.charToken(first, startLine, startCol);
    }
  },

  /**
   * Produces a number token based on the given character
   * and location in the stream. This may return a token of
   * NUMBER, EMS, EXS, LENGTH, ANGLE, TIME, FREQ, DIMENSION,
   * or PERCENTAGE.
   * @param {String} first The first character for the token.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method numberToken
   */
  numberToken: function(first, startLine, startCol){
    var reader  = this._reader,
        value   = this.readNumber(first),
        ident,
        tt      = Tokens.NUMBER,
        c       = reader.peek();

    if (isIdentStart(c)){
      ident = this.readName(reader.read());
      value += ident;

      if (/^em$|^ex$|^px$|^gd$|^rem$|^vw$|^vh$|^vm$|^ch$|^cm$|^mm$|^in$|^pt$|^pc$/i.test(ident)){
        tt = Tokens.LENGTH;
      } else if (/^deg|^rad$|^grad$/i.test(ident)){
        tt = Tokens.ANGLE;
      } else if (/^ms$|^s$/i.test(ident)){
        tt = Tokens.TIME;
      } else if (/^hz$|^khz$/i.test(ident)){
        tt = Tokens.FREQ;
      } else if (/^dpi$|^dpcm$/i.test(ident)){
        tt = Tokens.RESOLUTION;
      } else {
        tt = Tokens.DIMENSION;
      }

    } else if (c == "%"){
      value += reader.read();
      tt = Tokens.PERCENTAGE;
    }

    return this.createToken(tt, value, startLine, startCol);
  },

  /**
   * Produces a string token based on the given character
   * and location in the stream. Since strings may be indicated
   * by single or double quotes, a failure to match starting
   * and ending quotes results in an INVALID token being generated.
   * The first character in the string is passed in and then
   * the rest are read up to and including the final quotation mark.
   * @param {String} first The first character in the string.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method stringToken
   */
  stringToken: function(first, startLine, startCol){
    var delim   = first,
        string  = first,
        reader  = this._reader,
        prev    = first,
        tt      = Tokens.STRING,
        c       = reader.read();

    while(c){
      string += c;

      //if the delimiter is found with an escapement, we're done.
      if (c == delim && prev != "\\"){
        break;
      }

      //if there's a newline without an escapement, it's an invalid string
      if (isNewLine(reader.peek()) && c != "\\"){
        tt = Tokens.INVALID;
        break;
      }

      //save previous and get next
      prev = c;
      c = reader.read();
    }

    //if c is null, that means we're out of input and the string was never closed
    if (c === null){
      tt = Tokens.INVALID;
    }

    return this.createToken(tt, string, startLine, startCol);
  },

  unicodeRangeToken: function(first, startLine, startCol){
    var reader  = this._reader,
        value   = first,
        temp,
        tt      = Tokens.CHAR;

    //then it should be a unicode range
    if (reader.peek() == "+"){
      reader.mark();
      value += reader.read();
      value += this.readUnicodeRangePart(true);

      //ensure there's an actual unicode range here
      if (value.length == 2){
        reader.reset();
      } else {

        tt = Tokens.UNICODE_RANGE;

        //if there's a ? in the first part, there can't be a second part
        if (value.indexOf("?") == -1){

          if (reader.peek() == "-"){
            reader.mark();
            temp = reader.read();
            temp += this.readUnicodeRangePart(false);

            //if there's not another value, back up and just take the first
            if (temp.length == 1){
              reader.reset();
            } else {
              value += temp;
            }
          }

        }
      }
    }

    return this.createToken(tt, value, startLine, startCol);
  },

  /**
   * Produces a S token based on the specified information. Since whitespace
   * may have multiple characters, this consumes all whitespace characters
   * into a single token.
   * @param {String} first The first character in the token.
   * @param {int} startLine The beginning line for the character.
   * @param {int} startCol The beginning column for the character.
   * @return {Object} A token object.
   * @method whitespaceToken
   */
  whitespaceToken: function(first, startLine, startCol){
    var reader  = this._reader,
        value   = first + this.readWhitespace();
    return this.createToken(Tokens.S, value, startLine, startCol);
  },




  //-------------------------------------------------------------------------
  // Methods to read values from the string stream
  //-------------------------------------------------------------------------

  readUnicodeRangePart: function(allowQuestionMark){
    var reader  = this._reader,
        part = "",
        c       = reader.peek();

    //first read hex digits
    while(isHexDigit(c) && part.length < 6){
      reader.read();
      part += c;
      c = reader.peek();
    }

    //then read question marks if allowed
    if (allowQuestionMark){
      while(c == "?" && part.length < 6){
        reader.read();
        part += c;
        c = reader.peek();
      }
    }

    //there can't be any other characters after this point

    return part;
  },

  readWhitespace: function(){
    var reader  = this._reader,
        whitespace = "",
        c       = reader.peek();

    while(isWhitespace(c)){
      reader.read();
      whitespace += c;
      c = reader.peek();
    }

    return whitespace;
  },
  readNumber: function(first){
    var reader  = this._reader,
        number  = first,
        hasDot  = (first == "."),
        c       = reader.peek();


    while(c){
      if (isDigit(c)){
        number += reader.read();
      } else if (c == "."){
        if (hasDot){
          break;
        } else {
          hasDot = true;
          number += reader.read();
        }
      } else {
        break;
      }

      c = reader.peek();
    }

    return number;
  },
  readString: function(){
    var reader  = this._reader,
        delim   = reader.read(),
        string  = delim,
        prev    = delim,
        c       = reader.peek();

    while(c){
      c = reader.read();
      string += c;

      //if the delimiter is found with an escapement, we're done.
      if (c == delim && prev != "\\"){
        break;
      }

      //if there's a newline without an escapement, it's an invalid string
      if (isNewLine(reader.peek()) && c != "\\"){
        string = "";
        break;
      }

      //save previous and get next
      prev = c;
      c = reader.peek();
    }

    //if c is null, that means we're out of input and the string was never closed
    if (c === null){
      string = "";
    }

    return string;
  },
  readURI: function(first){
    var reader  = this._reader,
        uri     = first,
        inner   = "",
        c       = reader.peek();

    reader.mark();

    //skip whitespace before
    while(c && isWhitespace(c)){
      reader.read();
      c = reader.peek();
    }

    //it's a string
    if (c == "'" || c == "\""){
      inner = this.readString();
    } else {
      inner = this.readURL();
    }

    c = reader.peek();

    //skip whitespace after
    while(c && isWhitespace(c)){
      reader.read();
      c = reader.peek();
    }

    //if there was no inner value or the next character isn't closing paren, it's not a URI
    if (inner === "" || c != ")"){
      uri = first;
      reader.reset();
    } else {
      uri += inner + reader.read();
    }

    return uri;
  },
  readURL: function(){
    var reader  = this._reader,
        url     = "",
        c       = reader.peek();

    //TODO: Check for escape and nonascii
    while (/^[!#$%&\\*-~]$/.test(c)){
      url += reader.read();
      c = reader.peek();
    }

    return url;

  },
  readName: function(first){
    var reader  = this._reader,
        ident   = first || "",
        c       = reader.peek();

    while(true){
      if (c == "\\"){
        ident += this.readEscape(reader.read());
        c = reader.peek();
      } else if(c && isNameChar(c)){
        ident += reader.read();
        c = reader.peek();
      } else {
        break;
      }
    }

    return ident;
  },

  readEscape: function(first){
    var reader  = this._reader,
        cssEscape = first || "",
        i       = 0,
        c       = reader.peek();    

    if (isHexDigit(c)){
      do {
        cssEscape += reader.read();
        c = reader.peek();
      } while(c && isHexDigit(c) && ++i < 6);
    }

    if (cssEscape.length == 3 && /\s/.test(c) ||
      cssEscape.length == 7 || cssEscape.length == 1){
      reader.read();
    } else {
      c = "";
    }

    return cssEscape + c;
  },

  readComment: function(first){
    var reader  = this._reader,
        comment = first || "",
        c       = reader.read();

    if (c == "*"){
      while(c){
        comment += c;

        //look for end of comment
        if (comment.length > 2 && c == "*" && reader.peek() == "/"){
          comment += reader.read();
          break;
        }

        c = reader.read();
      }

      return comment;
    } else {
      return "";
    }

  }
});


var Tokens  = [

  /*
   * The following token names are defined in CSS3 Grammar: http://www.w3.org/TR/css3-syntax/#lexical
   */

  //HTML-style comments
  { name: "CDO"},
  { name: "CDC"},

  //ignorables
  { name: "S", whitespace: true/*, channel: "ws"*/},
  { name: "COMMENT", comment: true, hide: true, channel: "comment" },

  //attribute equality
  { name: "INCLUDES", text: "~="},
  { name: "DASHMATCH", text: "|="},
  { name: "PREFIXMATCH", text: "^="},
  { name: "SUFFIXMATCH", text: "$="},
  { name: "SUBSTRINGMATCH", text: "*="},

  //identifier types
  { name: "STRING"},     
  { name: "IDENT"},
  { name: "HASH"},

  //at-keywords
  { name: "IMPORT_SYM", text: "@import"},
  { name: "PAGE_SYM", text: "@page"},
  { name: "MEDIA_SYM", text: "@media"},
  { name: "FONT_FACE_SYM", text: "@font-face"},
  { name: "CHARSET_SYM", text: "@charset"},
  { name: "NAMESPACE_SYM", text: "@namespace"},
  { name: "UNKNOWN_SYM" },
  //{ name: "ATKEYWORD"},

  //CSS3 animations
  { name: "KEYFRAMES_SYM", text: [ "@keyframes", "@-webkit-keyframes", "@-moz-keyframes" ] },

  //important symbol
  { name: "IMPORTANT_SYM"},

  //measurements
  { name: "LENGTH"},
  { name: "ANGLE"},
  { name: "TIME"},
  { name: "FREQ"},
  { name: "DIMENSION"},
  { name: "PERCENTAGE"},
  { name: "NUMBER"},

  //functions
  { name: "URI"},
  { name: "FUNCTION"},

  //Unicode ranges
  { name: "UNICODE_RANGE"},

  /*
   * The following token names are defined in CSS3 Selectors: http://www.w3.org/TR/css3-selectors/#selector-syntax
   */    

  //invalid string
  { name: "INVALID"},

  //combinators
  { name: "PLUS", text: "+" },
  { name: "GREATER", text: ">"},
  { name: "COMMA", text: ","},
  { name: "TILDE", text: "~"},

  //modifier
  { name: "NOT"},        

  /*
   * Defined in CSS3 Paged Media
   */
  { name: "TOPLEFTCORNER_SYM", text: "@top-left-corner"},
  { name: "TOPLEFT_SYM", text: "@top-left"},
  { name: "TOPCENTER_SYM", text: "@top-center"},
  { name: "TOPRIGHT_SYM", text: "@top-right"},
  { name: "TOPRIGHTCORNER_SYM", text: "@top-right-corner"},
  { name: "BOTTOMLEFTCORNER_SYM", text: "@bottom-left-corner"},
  { name: "BOTTOMLEFT_SYM", text: "@bottom-left"},
  { name: "BOTTOMCENTER_SYM", text: "@bottom-center"},
  { name: "BOTTOMRIGHT_SYM", text: "@bottom-right"},
  { name: "BOTTOMRIGHTCORNER_SYM", text: "@bottom-right-corner"},
  { name: "LEFTTOP_SYM", text: "@left-top"},
  { name: "LEFTMIDDLE_SYM", text: "@left-middle"},
  { name: "LEFTBOTTOM_SYM", text: "@left-bottom"},
  { name: "RIGHTTOP_SYM", text: "@right-top"},
  { name: "RIGHTMIDDLE_SYM", text: "@right-middle"},
  { name: "RIGHTBOTTOM_SYM", text: "@right-bottom"},

  /*
   * The following token names are defined in CSS3 Media Queries: http://www.w3.org/TR/css3-mediaqueries/#syntax
   */
  /*{ name: "MEDIA_ONLY", state: "media"},
   { name: "MEDIA_NOT", state: "media"},
   { name: "MEDIA_AND", state: "media"},*/
  { name: "RESOLUTION", state: "media"},

  /*
   * The following token names are not defined in any CSS specification but are used by the lexer.
   */

  //not a real token, but useful for stupid IE filters
  { name: "IE_FUNCTION" },

  //part of CSS3 grammar but not the Flex code
  { name: "CHAR" },

  //TODO: Needed?
  //Not defined as tokens, but might as well be
  {
    name: "PIPE",
    text: "|"
  },
  {
    name: "SLASH",
    text: "/"
  },
  {
    name: "MINUS",
    text: "-"
  },
  {
    name: "STAR",
    text: "*"
  },

  {
    name: "LBRACE",
    text: "{"
  },   
  {
    name: "RBRACE",
    text: "}"
  },      
  {
    name: "LBRACKET",
    text: "["
  },   
  {
    name: "RBRACKET",
    text: "]"
  },    
  {
    name: "EQUALS",
    text: "="
  },
  {
    name: "COLON",
    text: ":"
  },    
  {
    name: "SEMICOLON",
    text: ";"
  },    

  {
    name: "LPAREN",
    text: "("
  },   
  {
    name: "RPAREN",
    text: ")"
  },     
  {
    name: "DOT",
    text: "."
  }
];

(function(){

  var nameMap = [],
      typeMap = {};

  Tokens.UNKNOWN = -1;
  Tokens.unshift({name:"EOF"});
  for (var i=0, len = Tokens.length; i < len; i++){
    nameMap.push(Tokens[i].name);
    Tokens[Tokens[i].name] = i;
    if (Tokens[i].text){
      if (Tokens[i].text instanceof Array){
        for (var j=0; j < Tokens[i].text.length; j++){
          typeMap[Tokens[i].text[j]] = i;
        }
      } else {
        typeMap[Tokens[i].text] = i;
      }
    }
  }

  Tokens.name = function(tt){
    return nameMap[tt];
  };

  Tokens.type = function(c){
    return typeMap[c] || -1;
  };

})();




//This file will likely change a lot! Very experimental!
/*global Properties, ValidationError*/
var Validation = {

  validate: function(property, value){

    //normalize name
    var name = property.toString().toLowerCase(),
        valid,
        spec    = Properties[name],
        i, len, j, count,
        msg,
        types,
        last,
        max, multi, group,
        parts   = value.parts;

    if (!spec) {
      if (name.indexOf("-") !== 0){    //vendor prefixed are ok
        throw new ValidationError("Unknown property '" + property + "'.", property.line, property.col);
      }
    } else if (typeof spec != "number"){

      //initialization
      if (spec instanceof Array){
        types = spec;
        max = 1;
      } else if (spec.multi) {
        types = spec.multi;
        max = spec.max;
      } else if (spec.group){
        types = spec.group;
        group = { total: 0 };
      }

      //Start validation----

      //if there's a maximum set, use it (max can't be 0)
      if (max) {
        if (parts.length > max){
          throw new ValidationError("Expected a max of " + max + " property value(s) but found " + parts.length + ".", value.line, value.col);
        }
      }            

      for (i=0, len=parts.length; i < len; i++){
        msg = [];
        valid = false;

        if (spec.separator && parts[i].type == "operator"){

          //two operators in a row - not allowed?
          if ((last && last.type == "operator")){
            msg = msg.concat(types);
          } else if (i == len-1){
            msg = msg.concat("end of line");
          } else if (parts[i] != spec.separator){
            msg.push("'" + spec.separator + "'");
          } else {
            valid = true;

            //if it's a group, reset the tracker
            if (group) {
              group = { total: 0 };
            }
          }
        } else {

          for (j=0, count=types.length; j < count; j++){

            //if it's a group and one of the values has been found, skip it
            if (group && group[types[j]]){
              continue;
            }

            if (typeof Validation.types[types[j]] == "undefined"){
              valid = Validation.types.identifier(parts[i], types[j]);
              msg.push("one of (" + types[j] + ")");
            } else {
              valid = Validation.types[types[j]](parts[i]);
              msg.push(types[j]);
            }

            if (valid) {
              if (group){
                group[types[j]] = 1;
                group.total++;
              }
              break;  
            }
          }
        }


        if (!valid) {
          throw new ValidationError("Expected " + msg.join(" or ") + " but found '" + parts[i] + "'.", value.line, value.col);
        }


        last = parts[i];
      }                          

      //for groups, make sure all items are there
      if (group && group.total != types.length){
        throw new ValidationError("Expected all of (" + types.join(", ") + ") but found '" + value + "'.", value.line, value.col);
      }

    }
  },

  types: {

    "absolute-size": function(part){
      return this.identifier(part, "xx-small | x-small | small | medium | large | x-large | xx-large");
    },

    "attachment": function(part){
      return this.identifier(part, "scroll | fixed | local");
    },

    "attr": function(part){
      return part.type == "function" && part.name == "attr";
    },

    "box": function(part){
      return this.identifier(part, "padding-box | border-box | content-box");
    },

    "content": function(part){
      return part.type == "function" && part.name == "attr";
    },        

    "relative-size": function(part){
      return this.identifier(part, "smaller | larger");
    },

    //any identifier
    "ident": function(part){
      return part.type == "identifier";
    },

    //specific identifiers
    "identifier": function(part, options){
      var text = part.text.toString().toLowerCase(),
          args = options.split(" | "),
          i, len, found = false;


      for (i=0,len=args.length; i < len && !found; i++){
        if (text == args[i]){
          found = true;
        }
      }

      return found;
    },

    "length": function(part){
      return part.type == "length" || part.type == "number" || part.type == "integer" || part == "0";
    },

    "color": function(part){
      return part.type == "color" || part == "transparent";
    },

    "number": function(part){
      return part.type == "number" || this.integer(part);
    },

    "integer": function(part){
      return part.type == "integer";
    },

    "line": function(part){
      return part.type == "integer";
    },

    "angle": function(part){
      return part.type == "angle";
    },        

    "uri": function(part){
      return part.type == "uri";
    },

    "image": function(part){
      return this.uri(part);
    },

    "bg-image": function(part){
      return this.image(part) || part == "none";
    },

    "percentage": function(part){
      return part.type == "percentage" || part == "0";
    },

    "border-width": function(part){
      return this.length(part) || this.identifier(part, "thin | medium | thick");
    },

    "border-style": function(part){
      return this.identifier(part, "none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset");
    },

    "margin-width": function(part){
      return this.length(part) || this.percentage(part) || this.identifier(part, "auto");
    },

    "padding-width": function(part){
      return this.length(part) || this.percentage(part);
    },

    "shape": function(part){
      return part.type == "function" && (part.name == "rect" || part.name == "inset-rect");
    }
  }

};
/**
 * Type to use when a validation error occurs.
 * @class ValidationError
 * @namespace parserlib.util
 * @constructor
 * @param {String} message The error message.
 * @param {int} line The line at which the error occurred.
 * @param {int} col The column at which the error occurred.
 */
function ValidationError(message, line, col){

  /**
   * The column at which the error occurred.
   * @type int
   * @property col
   */
  this.col = col;

  /**
   * The line at which the error occurred.
   * @type int
   * @property line
   */
  this.line = line;

  /**
   * The text representation of the unit.
   * @type String
   * @property text
   */
  this.message = message;

}

//inherit from Error
ValidationError.prototype = new Error();


parserlib.css = {
  Colors              :Colors,    
  Combinator          :Combinator,                
  Parser              :Parser,
  PropertyName        :PropertyName,
  PropertyValue       :PropertyValue,
  PropertyValuePart   :PropertyValuePart,
  MediaFeature        :MediaFeature,
  MediaQuery          :MediaQuery,
  Selector            :Selector,
  SelectorPart        :SelectorPart,
  SelectorSubPart     :SelectorSubPart,
  Specificity         :Specificity,
  TokenStream         :TokenStream,
  Tokens              :Tokens,
  ValidationError     :ValidationError
};
})();