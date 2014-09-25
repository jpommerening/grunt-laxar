/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt, defaults, adapters ) {
   'use strict';

   var plural = require( '../../lib/plural' );

   return function() {
      var target = this.target;
      var options = this.options( defaults );
      var tasks = this.args.length ? this.args : Object.keys( options );
      var files = this.files;
      var run = [];

      for( var i = 0; i < tasks.length; i++ ) {
         var task = tasks[i];
         var config = {
            options: options[ task ],
            files: files
         };

         if( task in adapters ) {
            config = adapters[ task ].call( this, config );
         }

         if( config ) {
            grunt.config.set( [ task, target ], config );
            run.push( task );
         }
      }

      grunt.log.ok(
         'Running %s %s for %s.',
         grunt.log.wordlist( run ) || 'no',
         plural( run.length, 'task', 'tasks' ),
         target.cyan
      );

      run.forEach( function( task ) {
         grunt.task.run( task + ':' + target );
      } );
   };

};

