/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt, defaults, adapters ) {
   'use strict';

   var q = require( 'q' );

   /**
    * Grunt task implementation that can multiplex it's own
    * configuration across multiple other tasks.
    */
   return function() {
      var done = this.async();
      var target = this.target;
      var options = this.options( defaults );
      var tasks = this.args.length ? this.args : Object.keys( options );
      var files = this.files;
      var self = this;

      q.all( tasks.map( function( task ) {
         var config = {
            options: options[ task ],
            files: files
         };

         if( task in adapters ) {
            config = adapters[ task ].call( self, config );
         }

         return q.when( config, function( config ) {
            if( config ) {
               grunt.config.set( [ task, target ], config );
               return task;
            }
         } );
      } ) ).then( function( tasks ) {
         var run = [];

         for( var i = 0; i < tasks.length; i++ ) {
            if( tasks[ i ] ) {
               run.push( tasks[ i ] );
            }
         }

         grunt.log.ok(
            'Running %s for %s.',
            grunt.log.wordlist( run ) || 'no tasks',
            target.cyan
         );

         run.forEach( function( task ) {
            grunt.task.run( task + ':' + target );
         } );
      } ).nodeify( done );
   };

};

