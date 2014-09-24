/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var Application = require( '../lib/application' );
   var async = require( 'async' );
   var path = require( 'path' );
   var _ = require( 'lodash' );

   function generateBootstrapCode( dependencies ) {
      var requireString = '[\n   \'' + dependencies.join( '\',\n   \'' ) + '\'\n]';

      return 'define( ' + requireString + ', function() {\n' +
         '   \'use strict\';\n' +
         '\n' +
         '   return [].map.call( arguments, function( module ) { return module.name; } );\n' +
         '} );\n';
   }

   grunt.registerMultiTask( 'portal_angular_dependencies',
      'Generate a RequireJS module to bootstrap Angular.',
      function() {

         var options = this.options( {
            base: '.',
            requireConfig: 'require_config.js'
         } );
         var base = path.resolve( options.base );
         var done = this.async();
         var files = this.files;

         var app = Application.create( options );

         async.each( files, function( file, done ) {
            grunt.verbose.writeln( 'Portal Angular dependencies: ' + file.dest );

            async.map( file.src, function( src, done ) {
               return app.flowTracer
                  .widgetsAndControlsForFlow( path.resolve( src ) )
                  .nodeify( done );
            }, function( err, results ) {
               if( err ) {
                  return done( err );
               }

               var widgets = _( results ).pluck( 'widgets' ).flatten().uniq().value();
               var controls = _( results ).pluck( 'controls' ).flatten().uniq().value();
               var code = generateBootstrapCode( widgets.concat( controls ) );

               grunt.file.write( file.dest, code );

               grunt.log.ok( 'Created Angular dependencies in "' + file.dest + '".' );
               done();
            } );
         }, done );
      } );
};
