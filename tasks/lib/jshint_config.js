/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   return function( config ) {
      var src = [].concat.apply( [], config.files.map( function( file ) {
         return grunt.file.match( [ '**/*.js' ], file.src );
      } ) );

      if( src.length === 0 ) {
         return;
      }

      return {
         options: config.options,
         src: src
      };
   };
};
