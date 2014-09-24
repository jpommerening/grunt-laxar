/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
'use strict';

var _ = require( 'lodash' );

module.exports = ChangeDistributor;

/**
 * Receive changes via Grunt's EventEmitter,
 * collect them in a dictionary and supply them
 * to dynamic configuration objects.
 *
 * @param {Object} grunt
 *    the grunt instance to use for watching
 * @param {Object} options
 *    options 'n' stuff
 * @param {Number} options.flushDelay
 *    how long to consider files as changed, after
 *    they have been accessed
 * @param {Number} options.cacheLifetime
 *    how long to cache changes
 */
function ChangeDistributor( grunt, options ) {
   // Create without inheriting from {}, so we have a plain map,
   // without any inherited properties/methods that allows us
   // to use for( in ) safely.
   var changedFiles = Object.create( null );
   var flushChanges = Object.create( null );

   options = _.defaults( options || {}, {
      flushDelay: 500,
      cacheLifetime: 500
   } );

   var doFlush = _.debounce( function() {
      /*jshint forin: false*/
      for( var key in flushChanges ) {
         delete changedFiles[ key ];
         delete flushChanges[ key ];
      }
   }, options.flushDelay );

   this.flushChanges_ = function( files ) {
      for( var i = 0; i < files.length; i++ ) {
         flushChanges[ files[ i ] ] = true;
      }
      doFlush();
   };

   this.changeMatcher_ = function( patterns ) {
      var changes;
      var expunge = _.debounce( function() {
         changes = undefined;
      }, options.cacheLifetime );

      return function() {
         expunge();
         if( !changes ) {
            changes = grunt.file.match( patterns, Object.keys( changedFiles ) );
         }
         return changes;
      };
   };

   grunt.event.on( 'watch', function( action, file ) {
      changedFiles[ file ] = action;
      delete flushChanges[ file ];
   } );
}

ChangeDistributor.create = function create( grunt, options ) {
   return new ChangeDistributor( grunt, options || {} );
};

/**
 * Define the changed files that match a given pattern as a
 * dynamic object property (getter).
 *
 * @param {Object} object
 *    the object on which to define the property
 * @param {String} property
 *    the name of the property to be defined or modified
 * @param {Object} options
 *    the options to use when defining the property
 * @param {Array} options.value
 *    the patterns that should be matched and that are used as
 *    a default value if there are no matching files.
 *
 * @return {Object}
 *    the modified object
 */
ChangeDistributor.prototype.defineProperty = function defineProperty( object, property, options ) {
   var patterns = options.value;
   var changes = this.changeMatcher_( patterns );
   var flushChanges = this.flushChanges_;

   /* replace pattern value with getter */
   delete options.value;
   options.get = function() {
      var value = changes();
      if( value.length === 0 ) {
         return patterns;
      } else {
         flushChanges( value );
         return value;
      }
   };

   return Object.defineProperty( object, property, options );
};
