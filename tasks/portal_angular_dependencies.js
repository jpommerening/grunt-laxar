/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var async = require( 'async' );
   var path = require( 'path' );
   var q = require( 'q' );
   var _ = grunt.util._;

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
            laxar: 'laxar',
            pages: 'laxar-path-pages',
            widgets: 'laxar-path-widgets',
            requireConfig: 'require_config.js'
         } );
         var files = this.files;
         var done = this.async();

         var config = require( '../lib/require_config' )( options.requireConfig, options );
         var requirejs = require( 'requirejs' ).config( config );
         var paths = require( '../lib/laxar_paths' )( config, options );

         grunt.verbose.writeln( 'Portal Angular dependencies: loading page loader' );
         var PageLoader = requirejs( 'laxar/lib/portal/portal_assembler/page_loader' );
         var WidgetCollector = require( '../lib/widget_collector' );
         var HttpClient = require( '../lib/http_client' );

         var client = HttpClient.create( options.base );

         grunt.verbose.writeln( 'Portal Angular dependencies: page loader' );
         var pageLoader = PageLoader.create( q, client, paths.PAGES );

         grunt.verbose.writeln( 'Portal Angular dependencies: initializing widget collector' );
         var widgetCollector = WidgetCollector.create(
            client,
            pageLoader,
            paths.WIDGETS
         );

         async.each( files, function( file, done ) {
            var promises = [];
            var results = {};

            grunt.verbose.writeln( 'Portal Angular dependencies: ' + file.dest );

            file.src.forEach( function( flow ) {
               var promise = widgetCollector.widgetsAndControlsForFlow( path.relative( options.base, flow ) );
               promises.push( promise.then( function( result ) {
                  _.merge( results, result );
               } ) );
            } );

            q.all( promises ).then( function() {
               grunt.file.write( file.dest, generateBootstrapCode( results.widgets.concat( results.controls ) ) );
               grunt.log.ok( 'Created Angular dependencies in "' + file.dest + '".' );
               done();
            }, done );
         }, done );
      } );
};
