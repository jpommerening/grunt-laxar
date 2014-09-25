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

      /* TODO: get from Application instance */
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
   };
};
