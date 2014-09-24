/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

/**
 * Memoize a function with an lru-cache. If the function returns a promise,
 * attach an error handler, that invalidates the cache entry.
 * If no keyfn is given, cache keys are constructed from the function name
 * and arguments.toString().
 * (This is meant to be a hint, not to memoize multiple anonymous functions
 * with the same cache.)
 *
 * @param {Function} fn
 *    the function to memoize
 * @param {Object} cache
 *    an object implementing a cache
 * @param {Function} keyfn
 *    (optional) a function to obtain cache keys (called with the arguments).
 *
 * @return {Function}
 *    the memoized function
 */
module.exports = function memoize( fn, cache, keyfn ) {
   'use strict';

   keyfn = keyfn || function() {
      return fn.name + ':' + [].slice.apply( arguments ).toString();
   };

   var stats = {
      calls: 0,
      hits: 0,
      misses: 0
   };

   var memoized = function memoized() {
      var key = keyfn.apply( this, arguments );
      var res = cache.get( key );

      stats.calls += 1;

      if( res ) {
         stats.hits += 1;
      } else {
         stats.misses += 1;
         res = fn.apply( this, arguments );

         if( typeof res === 'object' && typeof res.fail === 'function' ) {
            res = res.fail( function( err ) {
               cache.del( key );
               throw err;
            } );
         }

         cache.set( key, res );
      }

      return res;
   };

   memoized.original = fn;
   memoized.key = keyfn;
   memoized.stats = stats;

   return memoized;
};
