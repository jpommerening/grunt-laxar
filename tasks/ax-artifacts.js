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
      var collector = artifactCollector.create( grunt.log, requirejsHelper, {
         handleDeprecation: grunt.verbose.writeln.bind( grunt.verbose )
      } );
      var destFile = path.join( flowsDirectory, flowId, helpers.ARTIFACTS_FILE );

      collector.collectArtifacts( flatten( task.files.map( function( f ) { return f.src; } ) ) )
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

};
