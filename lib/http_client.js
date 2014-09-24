/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
'use strict';

var memoize = require( './memoize' );
var path = require( 'path' );
var fs = require( 'fs' );
var events = require( 'events' );
var inherits = require( 'util' ).inherits;
var lru = require( 'lru-cache' );
var q = require( 'q' );

module.exports = HttpClient;

/**
 * Injected into the WidgetCollector and PageLoader.
 *
 * This uses node's fs module to read the file. Raw file data
 * promises are cached in an lru-cache.
 * Each request gets is own promise that is resolved with
 * the expected `{ data: }` object, when the raw file data
 * promise is resolved.
 *
 * @param {String} baseUrl
 *    the base directory that represents the server root url.
 */
function HttpClient( baseUrl ) {
   this.cache_ = lru( {
      max: 32
   } );
   this.readFile_ = memoize( function readFile( url ) {
      var absolute = path.resolve( baseUrl, url );
      this.emit( 'read', absolute );
      return q.nfcall( fs.readFile, absolute );
   }, this.cache_ );
}

inherits(HttpClient, events.EventEmitter);

/**
 * Create a new HttpClient.
 *
 * @param {String} baseUrl
 *    the base directory that represents the server root url.
 *
 * @return {Object}
 *    the new HttpClient instance
 */
HttpClient.create = function( baseUrl ) {
   return new HttpClient( baseUrl || '.' );
};

/**
 * Get a single file from disk (or the cache).
 *
 * @param {String} url
 *    the requested url
 *
 * @return {Promise}
 *    a promise, that will be resolved with an object containing
 *    the parsed document in the 'data' field.
 */
HttpClient.prototype.get = function get( url ) {
   this.emit( 'get', url );
   return this.readFile_( url )
      .then( function( data ) {
         return { data: JSON.parse( data ) };
      }, function( err ) {
         throw err;
      } );
};

/**
 * Drop a file from the cache.
 *
 * @param {String} url
 *      the url to drop from the cache
 */
HttpClient.prototype.del = function del( url ) {
   var key = this.readFile_.key( url );
   this.emit( 'del', url );
   this.cache_.del( key );
};
