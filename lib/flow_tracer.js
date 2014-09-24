/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
'use strict';

var memoize = require( './memoize' );
var path = require( 'path' );
var lru = require( 'lru-cache' );
var q = require( 'q' );
var _ = require( 'lodash' );

module.exports = FlowTracer;

var LAYOUT_WIDGETS = [
   'portal/layout_widget',
   'portal/popup_widget',
   'portal/popover_widget'
];

/**
 * @param {HttpClient} httpClient
 *    the http client to use
 * @param {PageLoader} pageLoader
 *    a page loader instance (laxar/lib/portal/portal_assembler/page_loader)
 * @param {String} widgetsUrl
 *    the base-url for widgets
 * @param {String} layoutsUrl
 *    the base-url for widgets
 */
function FlowTracer( httpClient, pageLoader, widgetsUrl, layoutsUrl ) {
   this.httpClient_ = httpClient;
   this.pageLoader_ = pageLoader;
   this.cache_ = lru( 16 );

   this.loadPage_ = memoize( function( pageName ) {
      return pageLoader.loadPage( pageName );
   }, this.cache_ );

   this.widgetModules_ = function( widgets ) {
      return widgets.map( function( widget ) {
         var name = path.basename( widget );
         return path.join( widgetsUrl, widget, name );
      } );
   };

   this.layoutModules_ = function( layouts ) {
      return layouts.map( function( layout ) {
         return path.join( layoutsUrl, layout );
      } );
   };
}

FlowTracer.create = function create( httpClient, pageLoader, widgetsUrl, layoutsUrl ) {
   return new FlowTracer( httpClient, pageLoader, widgetsUrl, layoutsUrl );
};

FlowTracer.prototype.pagesForFlow = function pagesForFlow( pathToFlow ) {
   return this.httpClient_.get( pathToFlow )
      .then( responseData )
      .then( findPagesForFlow );
};

FlowTracer.prototype.widgetsForFlow = function widgetsForFlow( pathToFlow ) {
   var promise = this.pagesForFlow( pathToFlow );
   var loadPage = this.loadPage_;
   var widgetModules = this.widgetModules_;

   return mapFlatUnique( promise, function( pageName ) {
      return loadPage( pageName ).then( findWidgetsForPage );
   } ).then( widgetModules );
};

FlowTracer.prototype.controlsForFlow = function controlsForFlow( pathToFlow ) {
   var promise = this.widgetsForFlow( pathToFlow );
   var httpClient = this.httpClient_;

   return mapFlatUnique( promise, function( widget ) {
      var url = path.join( path.dirname( widget ), 'widget.json' );
      return httpClient.get( url )
         .then( responseData )
         .then( findControlsForWidget );
   } );
};

FlowTracer.prototype.widgetsAndControlsForFlow = function widgetsAndControlsForFlow( pathToFlow ) {
   /* q.spread() really should support objects as input... */
   return q.spread( [
      this.widgetsForFlow( pathToFlow ),
      this.controlsForFlow( pathToFlow )
   ], function( widgets, controls ) {
      return {
         widgets: widgets,
         controls: controls
      };
   } );
};

FlowTracer.prototype.layoutsForFlow = function layoutsForFlow( pathToFlow ) {
   var promise = this.pagesForFlow( pathToFlow );
   var loadPage = this.loadPage_;
   var layoutModules = this.layoutModules_;

   return mapFlatUnique( promise, function( pageName ) {
      return loadPage( pageName ).then( findLayoutsForPage );
   } ).then( layoutModules );
};

function findPagesForFlow( flow ) {
   return _( flow.places )
      .values()
      .flatten( true )
      .pluck( 'page' )
      .filter()
      .value();
}

function findWidgetsForPage( page ) {
   return _( page.areas )
      .values()
      .flatten( true )
      .pluck( 'widget' )
      .filter()
      .value();
}

function findLayoutsForPage( page ) {
   return _( page.areas )
      .values()
      .flatten( true )
      .map( function( widget ) {
         if( LAYOUT_WIDGETS.indexOf( widget.widget ) >= 0 ) {
            return widget.features.content.layout;
         }
      } )
      .unshift( page.layout )
      .filter()
      .value();
}

function findControlsForWidget( widget ) {
   return widget.controls || [];
}

/**
 * Extract the data from an http response object.
 *
 * @param {Object} response
 *    the response object to parse
 *
 * @return {Object}
 *    the JSON data
 */
function responseData( response ) {
   if( response.data === undefined ) {
      throw new Error( 'Received no response data' );
   }
   return response.data;
}

/**
 * @param {Promise} promise
 *    a promise that resolves to an array
 * @param {Function} mapFunction
 *    a function to apply to each element, each returning a promise
 *
 * @return {Promise}
 *    a promise resolving to the flattened result-set without duplicate elements
 */
function mapFlatUnique( promise, mapFunction ) {
   return promise.then( function( results ) {
      return results.map( mapFunction );
   } ).then( function( promises ) {
      return q.all( promises )
         .then( function( results ) {
            return _( results ).flatten( true ).uniq().filter().value();
         } );
   } );
}
