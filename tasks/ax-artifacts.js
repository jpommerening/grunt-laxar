/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var TASK = 'laxar-artifacts';

   var path = require( '../lib/path-platform/path' ).posix;

   var laxarTooling = require( 'laxar-tooling' );
   var artifactCollector = laxarTooling.artifactCollector;

   var helpers = require( './lib/task_helpers' )( grunt, TASK );
   var flatten = helpers.flatten;

   grunt.registerMultiTask(
      TASK,
      'Collects artifacts for LaxarJS flows.',
      function() {
         runArtifacts( this );
      }
   );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function runArtifacts( task ) {
      var startMs = Date.now();
      var done = task.async();
      var flowId = task.nameArgs.split( ':' )[ 1 ];
      var flowsDirectory = task.files[ 0 ].dest;

      if( !flowId ) {
         grunt.log.error( TASK + ': named sub-task is required!' );
         return;
      }

      grunt.verbose.writeln( TASK + ': starting with flow "' + flowId + '"' );

      var requirejsHelper = require( '../lib/require_config' ).helper( '.' );
      var collector = artifactCollector.create( grunt.log, {
         projectPath: requirejsHelper.projectPath,
         readJson: wrapJsonReader( laxarTooling.jsonReader.create( grunt.log ) )
      } );
      var destFile = path.join( flowsDirectory, flowId, helpers.ARTIFACTS_FILE );

      var sources = flatten( task.files.map( function( f ) { return f.src; } ) );
      var themes = grunt.file.expand( {
         filter: 'isDirectory',
         cwd: requirejsHelper.projectPath( 'laxar-path-themes' )
      }, '*.theme' ).concat( [ 'default.theme' ] );

      collector.collectArtifacts( sources, themes )
         .then( function( artifacts ) {
            sortByPath( artifacts );
            var newResult = JSON.stringify( artifacts, null, 3 );
            helpers.writeIfChanged( destFile, newResult, startMs );
            done();
         } )
         .catch( function( err ) {
            grunt.log.error( TASK + ': ERROR:', err );
            done( err );
         } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /** Sort artifacts by path, for output stability and developer happiness */
      function sortByPath( artifacts ) {
         Object.keys( artifacts ).forEach( function( artifactType ) {
            artifacts[ artifactType ].sort( function( a, b ) {
               return a.path < b.path ? -1 : ( a.path > b.path ? 1 : 0 );
            } );
         } );
      }

   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // Wrap the bare json reader with handling for deprecated artifact styles.
   function wrapJsonReader( readJson ) {
      return function( filePath ) {
         var basename = path.basename( filePath );
         var dirname = path.dirname( filePath );
         var promise = readJson.apply( this, arguments );

         if( basename === 'widget.json' ) {
            return promise.then( patchWidgetName( dirname ) );
         }
         if( basename === 'control.json' ) {
            return promise.then( null, fakeControlDescriptor( dirname ) );
         }

         return promise;
      };
   }

   function patchWidgetName( widgetPath ) {
      return function( descriptor ) {
         // Support two widget module naming styles:
         //  - old-school: the directory name determines the module name
         //  - new-school: the descriptor artifact name determines the module name
         // Only the new-school way supports installing widgets using bower and finding them using AMD.
         var nameFromDirectory = path.basename( widgetPath );
         var modulePathFromDirectory = path.join( widgetPath, nameFromDirectory + '.js' );

         return helpers.fileExists( modulePathFromDirectory )
            .then( function( nameFromDirectoryIsValid ) {
               descriptor.name = selectName( descriptor.name, nameFromDirectory, nameFromDirectoryIsValid );
               return descriptor;
            } );
      };
   }

   function fakeControlDescriptor( controlPath ) {
      return function() {
         // Support controls without a control.json descriptor:
         //  - old-school: the directory name determines the module name
         //  - new-school: the descriptor artifact name determines the module name
         // Only the new-school way supports installing controls using bower and finding them using AMD.
         var nameFromDirectory = path.basename( controlPath );

         return {
            name: nameFromDirectory,
            integration: {
               type: 'control',
               technology: 'angular'
            }
         };
      };
   }

   function selectName( nameFromDescriptor, nameFromDirectory, useNameFromDirectory ) {
      if( useNameFromDirectory && nameFromDirectory !== nameFromDescriptor ) {
         var title = 'DEPRECATION: non-portable widget naming style.';
         var message = 'Module "' + nameFromDirectory + '" should be named "' + nameFromDescriptor +
            '" to match the widget descriptor.';
         var details = 'For details, refer to https://github.com/LaxarJS/laxar/issues/129';
         grunt.verbose.writeln( title + ' ' + message + '\n' + details );
      }

      return useNameFromDirectory ? nameFromDirectory : nameFromDescriptor;
   }

};
