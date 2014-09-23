/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var path = require( 'path' );
   var multiplexTask = require( './lib/multiplex_task' );
   var defaults = {
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   grunt.registerMultiTask( 'ax-theme', 'Run theme specific tasks', multiplexTask( grunt, defaults, {
      compass: function( config ) {
         var basePath = this.target;
         if( !grunt.file.exists( basePath + '/scss' ) ) {
            return null;
         }

         return {
            options: {
               config: path.join( basePath, 'compass/config.rb' ),
               basePath: basePath
            }
         };
      }
   } ) );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

};


