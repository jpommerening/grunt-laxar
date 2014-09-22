/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
var memoize = require( '../memoize' );
var q = require( 'q' );

describe( 'memoize( fn, cache, [keyfn] )', function() {

   function add( a, b, c ) {
      add.calls += 1;

      if( arguments.length > 3 ) {
         throw new Error( 'Hey, no more than 3 args please!' );
      }

      return a + b + (c || 0);
   }

   function deferredAdd() {
      return q.fapply( add, arguments );
   }

   var memoized;
   var data;
   var cache = {
      get: function( key ) {
         return data[ key ];
      },
      set: function( key, value ) {
         data[ key ] = value;
      },
      del: function( key, value ) {
         data[ key ] = undefined;
      }
   };

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( function() {
      data = {};
      add.calls = 0;
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when called with function and cache', function() {

      beforeEach( function() {
         memoized = memoize( add, cache );
      } );

      it( 'returns a memoized function', function() {
         expect( typeof memoized ).toEqual( 'function' );
      } );

      describe( 'the memoized function', function() {

         it( 'has a `stats` property, recording calls, hits, and misses', function() {
            expect( memoized.stats ).toEqual( {
               calls: 0,
               hits: 0,
               misses: 0
            } );
         } );

         it( 'has an `original` property, pointing to the original function', function() {
            expect( memoized.original ).toBe( add );
         } );

         it( 'returns the result of the original function', function() {
            expect( memoized( 1, 2 ) ).toBe( 3 );
            expect( memoized( 1, 3 ) ).toBe( 4 );
            expect( memoized( 1, 2, 3 ) ).toBe( 6 );
            expect( memoized( 1, 2 ) ).toBe( 3 );
            expect( memoized( 1, 3 ) ).toBe( 4 );
            expect( memoized( 1, 2, 3 ) ).toBe( 6 );
         } );

         it( 'uses the supplied cache to record results', function() {
            memoized( 1, 2 );
            var keys = Object.keys( data );
            expect( keys.length ).toBe( 1 );
            expect( data[ keys[ 0 ] ] ).toBe( 3 );
         } );

         it( 'does not cache anything on failure', function() {
            expect(function() {
               memoized( 1, 2, 3, 4 );
            }).toThrow();

            var keys = Object.keys( data );
            expect( keys.length ).toBe( 0 );
         } );

         it( 'fetches subsequent calls from the cache without calling the original function', function() {
            expect( add.calls ).toBe( 0 );
            memoized( 1, 2 );
            expect( add.calls ).toBe( 1 );
            memoized( 1, 2 );
            expect( add.calls ).toBe( 1 );
            memoized( 1, 3 );
            expect( add.calls ).toBe( 2 );
         } );

         it( 'increments the `stats` properties when called', function() {
            expect( memoized.stats.calls ).toBe( 0 );
            memoized( 1, 2 );
            expect( memoized.stats.calls ).toBe( 1 );
            expect( memoized.stats.misses ).toBe( 1 );
            expect( memoized.stats.hits ).toBe( 0 );
            memoized( 1, 2 );
            expect( memoized.stats.calls ).toBe( 2 );
            expect( memoized.stats.misses ).toBe( 1 );
            expect( memoized.stats.hits ).toBe( 1 );
            memoized( 1, 3 );
            expect( memoized.stats.calls ).toBe( 3 );
            expect( memoized.stats.misses ).toBe( 2 );
            expect( memoized.stats.hits ).toBe( 1 );
         } );

      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when called with a function returning a promise', function() {

      beforeEach( function() {
         memoized = memoize( deferredAdd, cache );
      } );

      it( 'returns a memoized function', function() {
         expect( typeof memoized ).toEqual( 'function' );
      } );

      describe( 'the memoized function', function() {

         it( 'return the expected promise', function( done ) {
            memoized( 1, 2 ).then( function( result ) {
               expect( result ).toBe( 3 );
               done();
            }, done );
         } );

         it( 'caches the promise', function( done ) {
            var promise = memoized( 1, 2 );
            var keys = Object.keys( data );
            expect( keys.length ).toBe( 1 );
            expect( data[ keys[ 0 ] ] ).toBe( promise );

            promise.then( function() {
               done();
            }, done );
         } );

         it( 'prunes the cached promise entry on failure', function( done ) {
            var promise = memoized( 1, 2, 3, 4 );
            var keys = Object.keys( data );
            expect( keys.length ).toBe( 1 );
            expect( data[ keys[ 0 ] ] ).toBe( promise );

            promise.then( done, function( err ) {
               expect( err instanceof Error ).toBe( true );
               expect( data[ keys[ 0 ] ] ).toBeFalsy();
               done();
            } );
         } );

      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

} );
