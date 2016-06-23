/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt, taskName ) {
   'use strict';

   var path = require( '../../lib/path-platform/path' ).posix;

   var laxarTooling = require( 'laxar-tooling' );
   var helpers = laxarTooling.helpers;
   var getResourcePaths = laxarTooling.getResourcePaths;

   var ARTIFACTS = path.join( 'tooling', 'artifacts.json' );

   return {
      ARTIFACTS_FILE: ARTIFACTS,
      artifactsListing: artifactsListing,
      getResourcePaths: getResourcePaths,
      writeIfChanged: writeIfChanged,
      flatten: helpers.flatten,
      fileExists: helpers.fileExists,
      lookup: helpers.lookup,
      once: helpers.once,
      promiseOnce: helpers.promiseOnce
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function artifactsListing( src, flowId ) {
      if( !flowId ) {
         grunt.log.error( taskName + ': named sub-task is required!' );
         return;
      }
      var source = path.join( src, flowId, ARTIFACTS );
      if( !grunt.file.exists( source ) ) {
         grunt.log.error( taskName + ': No artifact list! Run laxar-artifacts:' + flowId + ' first.' );
         return {};
      }
      return grunt.file.readJSON( source );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /** Write task results only if something changed, so that watchers are only triggered if needed */
   function writeIfChanged( resultsPath, newResults, startMs ) {
      // make sure that all generated text files end in a newline:
      if( newResults.charAt( newResults.length - 1 ) !== '\n' ) {
         newResults += '\n';
      }

      var previous = '';
      try {
         previous = grunt.file.read( resultsPath, { encoding: 'utf-8' } );
      }
      catch( e ) { /* OK, probably the first run */ }

      var hasChanged;
      var words;
      if( previous !== newResults ) {
         grunt.file.write( resultsPath, newResults );
         hasChanged = true;
         words = grunt.log.wordlist( [ 'wrote', resultsPath ], { color: 'cyan' } );
      }
      else {
         hasChanged = false;
         words = grunt.log.wordlist( [ 'unchanged', resultsPath ], { color: 'green' } );
      }

      var endMs = Date.now() - startMs;
      grunt.log.ok( taskName + ': ' + words + ' (' + endMs + 'ms)' );
      return hasChanged;
   }

};
