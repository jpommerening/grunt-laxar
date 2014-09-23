/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt, defaults, adapters ) {
   'use strict';

   var _ = require( 'lodash' );

   return function() {
      var target = this.target;
      var options = this.options( defaults );
      var tasks = this.args.length ? this.args : Object.keys( options );
      var files = this.files;

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
            grunt.config( [ task, target ], config );
            grunt.task.run( task + ':' + target );
         } else {
            tasks.splice( i, 1 );
         }
      }

      grunt.log.ok( 'Running %s tasks for %s.', tasks.length ? grunt.log.wordlist( tasks ) : 'no', target.cyan );
   };

};

