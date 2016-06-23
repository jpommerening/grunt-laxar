/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var TASK = 'laxar-resources';
   var RESOURCES_FILE = 'resources.json';

   var path = require( '../lib/path-platform/path' ).posix;

   var laxarTooling = require( 'laxar-tooling' );
   var collectResources = laxarTooling.collectResources;

   var helpers = require( './lib/task_helpers' )( grunt, TASK );
   var flatten = helpers.flatten;
   var lookup = helpers.lookup;
   var fileExists = helpers.fileExists;

   grunt.registerMultiTask( TASK,
      'Generate a resource listing for the LaxarJS runtime to determine which resources are available.',
      function() { runResources( this ); }
   );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function runResources( task ) {

      var startMs = Date.now();
      var done = task.async();

      var flowId = task.nameArgs.split( ':' )[ 1 ];
      var flowsDirectory = task.files[ 0 ].src[ 0 ];
      var options = task.options( {
         embed: true
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      var artifacts = helpers.artifactsListing( flowsDirectory, flowId );

      collectResources( artifacts, options ).then( function( results ) {
         helpers.writeIfChanged(
            path.join( flowsDirectory, flowId, RESOURCES_FILE ),
            JSON.stringify( results, null, 3 ),
            startMs
         );
         done();
      } )
      .catch( function( err ) {
         grunt.log.error( TASK + ': ERROR:', err );
         done( err );
      } );
   }

};
