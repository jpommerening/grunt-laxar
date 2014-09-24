/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
'use strict';

var path = require( 'path' );
var requirejs = require( 'requirejs' );
var q = require( 'q' );

var requireConfig = require( './require_config' );
var laxarPaths = require( './laxar_paths' );

module.exports = Application;

/**
 * Inspector for LaxarJS applications.
 *
 * @param {String} options.requireConfig
 *    the configuration file for RequireJS
 * @param {String} options.base
 *    the base-directory of the application
 */
function Application( options ) {
   this.config = requireConfig( options.requireConfig, options );
   this.paths = laxarPaths( this.config, options );
   this.require = requirejs.config( this.config );

   this.baseUrl = this.config.baseUrl;
   this.requireConfig = options.requireConfig;

   var HttpClient = require( './http_client' );
   var PageLoader = this.require( 'laxar/lib/portal/portal_assembler/page_loader' );
   var WidgetCollector = require( './widget_collector' );

   this.httpClient = options.httpClient || HttpClient.create( options.base || '.' );

   this.pageLoader = options.pageLoader || PageLoader.create(
      q,
      this.httpClient,
      this.paths.PAGES
   );

   this.widgetCollector = options.widgetCollector || WidgetCollector.create(
      this.httpClient,
      this.pageLoader,
      this.paths.WIDGETS
   );
}

Application.create = function create( options ) {
   return new Application( options );
};

[
   'pagesForFlow',
   'widgetsForFlow',
   'controlsForFlow',
   'widgetsAndControlsForFlow'
].forEach( function( method ) {
   Application.prototype[ method ] = function() {
      return this.widgetCollector[ method ].call( this.widgetCollector, this.paths.FLOW_JSON );
   };
} );
