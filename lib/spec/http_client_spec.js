/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
var HttpClient = require( '../http_client' );
var path = require( 'path' );

describe( 'HttpClient', function() {
   'use strict';

   /* lib/spec/data/test.json */
   var testData = { some: 'file' };

   var httpClient;

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( function() {
      httpClient = HttpClient.create();
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( '.get( url )', function() {

      it( 'returns a promise', function() {
         var promise = httpClient.get( 'anything' );
         expect( typeof promise ).toEqual( 'object' );
         expect( typeof promise.then ).toEqual( 'function' );
      } );

      it( 'resolves the promise with a `{ \'data\': }` object', function( done ) {
         var promise = httpClient.get( 'lib/spec/data/test.json' );

         promise.then( function( response ) {
            expect( response.data ).toEqual( { some: 'file' } );
            done();
         }, done );
      } );

      it( 'rejects the promise if the url does not exist', function( done ) {
         var promise = httpClient.get( 'nonexistentfile' );

         promise.then( done, function( err ) {
            expect( err instanceof Error ).toBe( true );
            done();
         } );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'emits a `get` event for each request', function( done ) {
      var events = [];
      httpClient.on( 'get', function( url ) {
         events.push( url );
      } );
      httpClient.get( 'lib/spec/data/test.json' )
         .then( function() {
            expect( events.length ).toBe( 1 );
            expect( events[0] ).toEqual( 'lib/spec/data/test.json' );
            return httpClient.get( 'lib/spec/data/test.json' );
         } )
         .then( function() {
            expect( events.length ).toBe( 2 );
            expect( events[1] ).toEqual( 'lib/spec/data/test.json' );
            done();
         }, done );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'emits a `read` event for each file read from disk', function( done ) {
      var events = [];
      httpClient.on( 'read', function( file ) {
         events.push( file );
      } );
      httpClient.get( 'lib/spec/data/test.json' )
         .then( function() {
            expect( events.length ).toBe( 1 );
            expect( events[0] ).toEqual( path.resolve( 'lib/spec/data/test.json' ) );
            return httpClient.get( 'lib/spec/data/test.json' );
         } )
         .then( function() {
            expect( events.length ).toBe( 1 );
            done();
         }, done );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

} );
