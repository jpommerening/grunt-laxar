/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt, subDirectory ) {
   'use strict';

   var path = require( 'path' );

   return function( config ) {
      var directories = grunt.file.expand( [ path.join( this.target, subDirectory || '.' ) ] );
      if( directories.length === 0 ) {
         return;
      } else if( directories.length > 1 ) {
         grunt.log.writeln( 'got multiple theme directories, picking ' + directories[0].cyan );
      }
      var basePath = directories[ 0 ];
      var cssDir = path.join( basePath, 'css' );
      var sassDir = path.join( basePath, 'scss' );
      var configFile = path.join( basePath, 'compass', 'config.rb' );

      if( !grunt.file.exists( sassDir ) ) {
         return;
      }
      if( !grunt.file.exists( configFile ) ) {
         configFile = undefined;
      }

      var src = [].concat.apply( [], config.files.map( function( file ) {
         return grunt.file.match( [
            sassDir + '/**/*.scss',
            '!' + sassDir + '/**/_*.scss'
         ], file.src );
      } ) );

      if( src.length === 0 ) {
         return;
      }

      return {
         options: {
            config: configFile,
            basePath: basePath,
            sassDir: path.relative( basePath, sassDir ),
            cssDir: path.relative( basePath, cssDir )
         },
         src: src
      };
   };
};
