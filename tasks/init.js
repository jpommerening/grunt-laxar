/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   var Application = require( '../lib/application' );
   var ChangeDistributor = require( './lib/change_distributor' );
   var path = require( 'path' );
   var q = require( 'q' );
   var _ = require( 'lodash' );

   grunt.registerInitTask( 'ax-init', 'Setup LaxarJS tasks', function() {
      var options = this.options( {
         base: '.',
         requireConfig: 'require_config.js'
      } );
      var base = path.resolve( options.base );
      var done = this.async();

      grunt.log.ok( 'Initializing ...' );

      var app = Application.create( options );
      var changes = ChangeDistributor.create( grunt );

      var uikit = path.dirname( app.require.toUrl( 'laxar_uikit' ) );
      var customization = path.dirname( app.require.toUrl( 'laxar_uikit_customization' ) );

      var compassImportPath = grunt.config.get( [ 'compass', 'options', 'importPath' ] ) || [];

      grunt.config.set( [ 'karma', 'options', 'laxar', 'requireConfig' ], options.requireConfig );
      grunt.config.set( [ 'compass', 'options', 'importPath' ], compassImportPath.concat( [
         uikit + '/scss',
         uikit + '/themes/default.theme/scss',
      ] ) );

      grunt.event.setMaxListeners( 11 );

      function normalizePath( module ) {
         if( module[0] === '/' ) {
            module = path.relative( app.baseUrl, module );
         }
         var url = app.require.toUrl( module );
         return path.relative( base, url );
      }

      function normalizePaths( modules ) {
         return modules.map( normalizePath );
      }

      function configureTarget( task, directory ) {
         var files = [ directory + '/!(bower_components|node_modules)',
                       directory + '/!(bower_components|node_modules)/**' ];

         grunt.log.verbose.writeln( 'Setup ' + task.cyan + ':' + directory.cyan );

         grunt.config.set( [ task, directory ], changes.defineProperty( {
            options: {}
         }, 'src', {
            enumerable: true,
            value: files
         } ) );
         grunt.config.set( [ 'watch', directory ], {
            options: {
               spawn: false
            },
            files: files,
            tasks: [ task + ':' + directory ]
         } );
      }

      q.spread( [
         app.themes().then( normalizePaths ),
         app.layoutsForFlow().then( normalizePaths ),
         app.widgetsForFlow().then( normalizePaths ),
         app.controlsForFlow().then( normalizePaths )
      ], function( themes, layouts, widgets, controls ) {

         themes.forEach( function( directory ) {
            configureTarget( 'ax-theme', directory );
         } );

         layouts.forEach( function( directory ) {
            configureTarget( 'ax-layout', directory );
         } );

         widgets = widgets.map( path.dirname );
         widgets.forEach( function( directory ) {
            configureTarget( 'ax-widget', directory );
         } );

         controls.forEach( function( directory ) {
            configureTarget( 'ax-control', directory );
         } );

         return {
            themes: themes,
            layouts: layouts,
            widgets: widgets,
            controls: controls
         };
      } )
      .then( function( result ) {
         var controlPaths = _( result.controls )
            .map( app.require.toUrl )
            .map( path.dirname )
            .map( normalizePath )
            .uniq()
            .value();

         grunt.log.writeln( '   RequireJS config: ' + app.requireConfig.cyan );
         grunt.log.writeln( '   Base URL: ' + app.baseUrl.cyan );
         grunt.log.writeln( '   Flow:     ' + path.relative( base, app.paths.FLOW_JSON ).cyan );
         grunt.log.writeln( '   Pages:    ' + path.relative( base, app.paths.PAGES ).cyan );
         grunt.log.writeln( '   Layouts:  ' + path.relative( base, app.paths.LAYOUTS ).cyan + ' (' + result.layouts.length + ' layouts)' );
         grunt.log.writeln( '   Themes:   ' + path.relative( base, app.paths.THEMES ).cyan + ' (' + result.themes.length + ' themes)' );
         grunt.log.writeln( '   Widgets:  ' + path.relative( base, app.paths.WIDGETS ).cyan + ' (' + result.widgets.length + ' widgets)' );
         grunt.log.writeln( '   Controls: ' + grunt.log.wordlist( controlPaths ) + ' (' + result.controls.length + ' controls)' );
         return q.when();
      } )
      .nodeify( done );

   } );
};
