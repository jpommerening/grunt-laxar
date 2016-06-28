/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var TASK = 'laxar-dependencies';
   var DEPENDENCIES_FILE = 'dependencies.js';

   var path = require( '../lib/path-platform/path' ).posix;

   var laxarTooling = require( 'laxar-tooling' );
   var dependencyCollector = laxarTooling.dependencyCollector;

   var helpers = require( './lib/task_helpers' )( grunt, TASK );


   grunt.registerMultiTask( TASK,
      'Generate an AMD-module that includes all dependencies needed by a flow.',
      function() { runDependencies( this ); }
   );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function runDependencies( task ) {

      var startMs = Date.now();
      var done = task.async();

      var flowId = task.nameArgs.split( ':' )[ 1 ];
      var flowsDirectory = task.files[ 0 ].src[ 0 ];
      var options = task.options( {
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      var artifacts = helpers.artifactsListing( flowsDirectory, flowId );
      var collector = dependencyCollector.create( grunt.log, {} );

      collector.collectDependencies( artifacts )
         .then( generateDependenciesModule )
         .then( function( code ) {
            helpers.writeIfChanged(
               path.join( flowsDirectory, flowId, DEPENDENCIES_FILE ),
               code,
               startMs
            );
            done();
         } )
         .catch( function( err ) {
            grunt.log.error( TASK + ': ERROR:', err );
            done( err );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function generateDependenciesModule( modulesByTechnology ) {
      var dependencies = [];
      var registryEntries = [];

      Object.keys( modulesByTechnology )
         .reduce( function( start, technology ) {
            var end = start + modulesByTechnology[ technology].length;
            [].push.apply( dependencies, modulesByTechnology[ technology ] );
            registryEntries.push( '\'' + technology + '\': modules.slice( ' + start + ', ' + end + ' )' );
            return end;
         }, 0 );

      var requireString = '[\n   \'' + dependencies.join( '\',\n   \'' ) + '\'\n]';

      return 'define( ' + requireString + ', function() {\n' +
             '   \'use strict\';\n' +
             '\n' +
             '   var modules = [].slice.call( arguments );\n' +
             '   return {\n' +
             '      ' + registryEntries.join( ',\n      ' ) + '\n' +
             '   };\n' +
             '} );\n';
   }

};
