/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
var format = require( 'util' ).format;

module.exports = function plural( count, one, many, none ) {
   'use strict';

   var args = [].slice.call( arguments, 4 );
   args.unshift( count );

   if( none && count === 0 ) {
      args.unshift( none );
   } else if( count === 1 ) {
      args.unshift( one );
   } else {
      args.unshift( many );
   }

   return format.apply( null, args );
};
