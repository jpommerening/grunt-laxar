/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var multiplexTask = require( './lib/multiplex_task' );
   var compassConfig = require( './lib/compass_config' );
   var jshintConfig = require( './lib/jshint_config' );
   var karmaConfig = require( './lib/karma_config' );

   var defaults = {
      compass: {},
      jshint: {},
      karma: {}
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   grunt.registerMultiTask( 'ax-control', 'Run control specific tasks', multiplexTask( grunt, defaults, {
      compass: compassConfig( grunt, 'default.theme' ),
      jshint: jshintConfig( grunt ),
      karma: karmaConfig( grunt )
   } ) );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

};
