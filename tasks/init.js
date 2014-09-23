/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var path = require( 'path' );
   var requireConfig = require( '../lib/require_config' );
   var laxarPaths = require( '../lib/laxar_paths' );
   var q = require( 'q' );

   grunt.registerInitTask( 'ax-init', 'Setup LaxarJS tasks', function() {
      var options = this.options( {
         base: '.',
         requireConfig: 'require_config.js'
      } );
      var base = path.resolve( options.base );
      var done = this.async();

      grunt.log.ok( 'Initializing ...' );

      var config = requireConfig( options.requireConfig, options );
      var paths = laxarPaths( config, options );
      var requirejs = require( 'requirejs' ).config( config );

      var uikit = path.dirname( requirejs.toUrl( 'laxar_uikit' ) );
      var customization = path.dirname( requirejs.toUrl( 'laxar_uikit_customization' ) );

      var compassImportPath = grunt.config.get( [ 'compass', 'options', 'importPath' ] ) || [];

      grunt.config.set( [ 'karma', 'options', 'laxar', 'requireConfig' ], options.requireConfig );
      grunt.config.set( [ 'compass', 'options', 'importPath' ], compassImportPath.concat( [
         uikit + '/scss',
         uikit + '/themes/default.theme/scss',
      ] ) );

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

      widgetCollector.widgetsAndControlsForFlow( paths.FLOW_JSON ).then( function( result ) {

         result.widgets.forEach( function( widget ) {
            var url = requirejs.toUrl( path.relative( config.baseUrl, widget ) );
            var directory = path.relative( base, path.dirname( url ) );

            grunt.config.set( [ 'ax-widget', directory ], {
               options: {},
               src: [ directory + '/!(bower_components|node_modules)',
                      directory + '/!(bower_components|node_modules)/**' ]
            } );
         } );

         result.controls.forEach( function( control ) {
            var url = requirejs.toUrl( control );
            var directory = path.relative( base, url );

            grunt.config.set( [ 'ax-control', directory ], {
               options: {},
               src: [ directory + '/!(bower_components|node_modules)',
                      directory + '/!(bower_components|node_modules)/**' ]
            } );
         } );

         return result;
      } )
      .then( function( result ) {

         grunt.log.writeln( '   RequireJS config: ' + options.requireConfig.cyan );
         grunt.log.writeln( '   Base URL: ' + config.baseUrl.cyan );
         grunt.log.writeln( '   Flow:     ' + path.relative( base, paths.FLOW_JSON ).cyan );
         grunt.log.writeln( '   Pages:    ' + path.relative( base, paths.LAYOUTS ).cyan );
         grunt.log.writeln( '   Layouts:  ' + path.relative( base, paths.PAGES ).cyan );
         grunt.log.writeln( '   Themes:   ' + path.relative( base, paths.THEMES ).cyan );
         grunt.log.writeln( '   Widgets:  ' + path.relative( base, paths.WIDGETS ).cyan + ' (' + result.widgets.length + ' widgets)' );
         grunt.log.writeln( '   Controls: ' + result.controls.length );
         done();
      }, done );

   } );
};
