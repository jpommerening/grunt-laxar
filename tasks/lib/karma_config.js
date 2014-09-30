/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   return function( config ) {
      var specRunner = this.target + '/spec/spec_runner.js';
      if( !grunt.file.exists( specRunner ) ) {
         return null;
      }

      var app = grunt.config.getRaw( [ 'ax', 'application' ] );

      if( !app ) {
         grunt.fail.fatal( 'Application missing from Grunt config. Did you remember to run ax-init?' );
      }

      var src = [].concat.apply( [], config.files.map( function( file ) {
         return grunt.file.match( [ '**/*.js' ], file.src );
      } ) );

      if( src.length === 0 ) {
         return;
      }

      grunt.log.verbose.writeln( 'Karma using RequireJS config ' + app.requireConfig );

      return {
         options: {
            laxar: {
               specRunner: specRunner,
               requireConfig: app.requireConfig
            }
         },
         files: [ {
            src: src,
            included: false
         } ]
      };
   };
};
