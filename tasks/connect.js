/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var xcors = require( 'connect-xcors' );
   var livereload = require( 'connect-livereload' );
   var load = require( './lib/load' );
   var _ = grunt.util._;

   var options = grunt.config( 'connect.options' ) || {};

   options.livereload = options.livereload || grunt.config( 'watch.options.livereload' ) || true;

   grunt.config( 'watch.options.livereload', livereload );
   grunt.config( 'connect.options', _.defaults( {
      middleware: function( connect, options, middlewares ) {
         var directory = options.directory || options.base[options.base.length - 1];
         // override the directory configuration from grunt-contrib-connect with better options
         middlewares.unshift( connect.directory(directory, { view: 'details', icons: true } ) );

         // use different livereload settings
         if( options.livereload ) {
            middlewares.unshift( livereload( {
               port: options.livereload === true ? 35729 : options.livereload,
               exclude: [ /\.scss$/ ]
            } ) );
         }

         // IMPORTANT: Make sure the xcors middleware is the first in the middleware stack,
         //            otherwise things like setting CORS headers might break.
         middlewares.unshift( xcors( {} ) );

         return middlewares;
      },
      livereload: false
   }, options, {
      hostname: '*',
      port: 8000
   } ) );

   load( grunt, 'grunt-contrib-connect' );
};
