/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var multiplexTask = require( './lib/multiplex_task' );
   var defaults = {

   };

   /**
    * Return a function that maps the files property of a config object with the given callback.
    * @param {Function} callback the callback to use for mapping files objects.
    */
   function mapFiles( callback ) {
      return function( config ) {
         config.files = config.files.map( callback );
         return config;
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   grunt.registerMultiTask( 'ax-control', 'Run control specific tasks', multiplexTask( grunt, defaults, {
      karma: function( config ) {
         var specRunner = this.target + '/spec/spec_runner.js';
         if( !grunt.file.exists( specRunner ) ) {
            return null;
         }

         var requireConfig = 'require_config.js';
         var files = config.files.map( function( file ) {
            return { src: grunt.file.match( [ '**/*.js' ], file.src ), included: false };
         } );

         return {
            options: {
               laxar: {
                  specRunner: specRunner,
                  requireConfig: requireConfig
               }
            },
            files: files
         };
      },
      jshint: mapFiles( function( file ) {
         return { src: grunt.file.match( [ '**/*.js' ], file.src ) };
      } ),
      compass: function( config ) {
         var basePath = this.target + '/default.theme';
         if( !grunt.file.exists( basePath + '/scss' ) ) {
            return null;
         }

         return {
            options: {
               basePath: basePath
            }
         };
      }
   } ) );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

};

