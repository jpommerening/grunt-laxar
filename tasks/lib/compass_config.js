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

      var app = grunt.config.getRaw( [ 'ax', 'application' ] );

      if( !app ) {
         grunt.fail.fatal( 'Application missing from Grunt config. Did you remember to run ax-init?' );
      }

      if( !grunt.file.exists( sassDir ) ) {
         return;
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

      return app.themes().then( function( themes ) {
         var theme = /.*\/([^/.]+\.theme)(\/.*)?$/.exec( basePath );
         var themeName = theme[ 1 ];

         var configFile;
         var directories = [ basePath, app.paths.DEFAULT_THEME ].concat( themes );

         for( var i = 0; i < directories.length; i++ ) {
            if( path.basename( directories[ i ] ) === themeName ) {
               configFile = path.join( directories[ i ], 'compass', 'config.rb' );
               if( grunt.file.exists( configFile ) ) {
                  break;
               } else {
                  configFile = undefined;
               }
            }
         }
         if( !configFile ) {
            throw new Error( 'Could not find \'compass/config.rb\' matching theme ' + themeName + ' in ' + directories.join( ', ' ) );
         }

         return path.relative( '.', configFile );
      } ).then( function( configFile ) {
         grunt.log.verbose.writeln( 'Compass using config ' + configFile );

         return {
            options: {
               config: configFile,
               basePath: basePath,
               sassDir: path.relative( basePath, sassDir ),
               cssDir: path.relative( basePath, cssDir )
            },
            src: src
         };
      } );
   };
};
