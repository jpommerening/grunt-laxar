/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
( function() {
   'use strict';

   module.exports = {
      flatten: flatten,
      lookup: lookup
   };
   //
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function flatten( arrays ) {
      return [].concat.apply( [], arrays );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function lookup( object ) {
      return function( key ) {
         return object[ key ];
      };
   }

} )();
