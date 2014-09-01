/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var path = require( 'path' );
   var _ = grunt.util._;

   var patterns = {
      jshint: [ '**/*.js' ],
      compass: [ '**/*.scss', '**/*.sass' ]
   };

   var filters = {
      jshint: makeFilter( patterns.jshint ),
      compass: makeFilter( patterns.compass ),
      karma: function() { return false; }
   };

   var defaults = {
   };

   function makeFilter( patterns ) {
      return function() {
         return grunt.file.isMatch( patterns, [].slice.apply( arguments ) );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   grunt.registerMultiTask( 'widget', 'Run widget specific tasks', function() {
      var widget = this.target;
      var options = this.options( {
      } );
      var tasks = this.args.length ? this.args : Object.keys( options );

      var files = this.files;

      console.log( {
         widget: widget,
         options: options,
         tasks: tasks,
         files: files
      } );

      for( var i = 0; i < tasks.length; i++ ) {
         var task = tasks[i];

         grunt.log.ok( task );
         grunt.config( [ task, widget ], {
            options: options[ task ] || {},
            filter: filters[ task ],
            files: this.files.map( function( file ) {
               return {
                  src: file.src,
                  dest: file.dest,
                  filter: filters[ task ]
               };
            } )
         } );

         grunt.task.run( task + ':' + widget );
      }
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

};
