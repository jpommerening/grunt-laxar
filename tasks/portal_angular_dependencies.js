/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var requireConfig = require( '../lib/require_config' );
   var laxarPaths = require( '../lib/laxar_paths' );
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
         var base = path.resolve( options.base );
         var done = this.async();
         var files = this.files;

         var config = requireConfig( options.requireConfig, options );
         var paths = laxarPaths( config, options );
         var requirejs = require( 'requirejs' ).config( config );

         var HttpClient = require( '../lib/http_client' );
         var PageLoader = requirejs( 'laxar/lib/portal/portal_assembler/page_loader' );
         var WidgetCollector = require( '../lib/widget_collector' );

         var httpClient = HttpClient.create( options.base );

         var pageLoader = PageLoader.create(
            q,
            httpClient,
            paths.PAGES
         );

         var widgetCollector = WidgetCollector.create(
            httpClient,
            pageLoader,
            paths.WIDGETS
         );

         async.each( files, function( file, done ) {
            grunt.verbose.writeln( 'Portal Angular dependencies: ' + file.dest );

            async.map( file.src, function( src, done ) {
               return widgetCollector
                  .widgetsAndControlsForFlow( path.resolve( src ) )
                  .then( function( results ) {
                     done( null, results );
                  }, done );
            }, function( err, results ) {
               if( err ) {
                  return done( err );
               }

               var widgets = _.chain( results ).pluck( 'widgets' ).flatten().uniq().value();
               var controls = _.chain( results ).pluck( 'controls' ).flatten().uniq().value();
               var code = generateBootstrapCode( widgets.concat( controls ) );

               grunt.file.write( file.dest, code );

               grunt.log.ok( 'Created Angular dependencies in "' + file.dest + '".' );
               done();
            } );
         }, done );
      } );
};
