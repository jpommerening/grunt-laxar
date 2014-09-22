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

module.exports = WidgetCollector;

/**
 * @param {HttpClient} httpClient
 *    the http client to use
 * @param {PageLoader} pageLoader
 *    a page loader instance (laxar/lib/portal/portal_assembler/page_loader)
 * @param {String} baseUrl
 *    the base-url for widgets
 */
function WidgetCollector( httpClient, pageLoader, baseUrl ) {
   this.httpClient_ = httpClient;
   this.pageLoader_ = pageLoader;
   this.baseUrl_ = baseUrl;
   this.cache_ = lru( 16 );

   /* memoize some functions for this instance */
   this.pagesForFlow = memoize( this.pagesForFlow, this.cache_ );
   this.widgetsForFlow = memoize( this.widgetsForFlow, this.cache_ );
   this.controlsForFlow = memoize( this.controlsForFlow, this.cache_ );
}

WidgetCollector.create = function create( httpClient, pageLoader, baseUrl ) {
   return new WidgetCollector( httpClient, pageLoader, baseUrl );
};

WidgetCollector.prototype.pagesForFlow = function pagesForFlow( pathToFlow ) {
   return findPagesForFlow( this.httpClient_, pathToFlow );
};

WidgetCollector.prototype.widgetsForFlow = function widgetsForFlow( pathToFlow ) {
   var promise = this.pagesForFlow( pathToFlow );
   var pageLoader = this.pageLoader_;
   var baseUrl = this.baseUrl_;

   function widgetModule( widget ) {
      var name = path.basename( widget );
      return path.join( baseUrl, widget, name );
   }

   return mapFlatUnique( promise, function( pageName ) {
      return findWidgetsForPage( pageLoader, pageName );
   } ).then( function( widgets ) {
      return widgets.map( widgetModule );
   } );
};

WidgetCollector.prototype.controlsForFlow = function controlsForFlow( pathToFlow ) {
   var promise = this.widgetsForFlow( pathToFlow );
   var httpClient = this.httpClient_;

   return mapFlatUnique( promise, function( widget ) {
      return findControlsForWidget( httpClient, path.dirname( widget ) );
   } );
};

WidgetCollector.prototype.widgetsAndControlsForFlow = function widgetsAndControlsForFlow( pathToFlow ) {
   var baseUrl = this.baseUrl_;

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

function findPagesForFlow( httpClient, pathToFlow ) {
   return httpClient.get( pathToFlow )
      .then( function( response ) {
         var flow = response.data;
         return _.chain( flow.places )
            .values()
            .flatten( true )
            .pluck( 'page' )
            .filter()
            .value();
      } );
}

function findWidgetsForPage( pageLoader, pageName ) {
   return pageLoader.loadPage( pageName )
      .then( function( page ) {
         return _.chain( page.areas )
            .values()
            .flatten( true )
            .pluck( 'widget' )
            .filter()
            .value();
      } );
}

function findControlsForWidget( httpClient, pathToWidget ) {
   var url = path.join( pathToWidget, 'widget.json' );
   return httpClient.get( url )
      .then( function( response ) {
         return response.data.controls || [];
      } );
}

/**
 * @param {Promise} promise
 *    a promise that resolves to an array
 * @param {Function} mapFunction
 *    a function to apply to each element
 *
 * @return {Promise}
 *    a promise resolving to the flattened result-set without duplicate elements
 */
function mapFlatUnique( promise, mapFunction ) {
   var promises = promise.then( function( results ) {
      return results.map( mapFunction );
   } );

   return q.all( promises )
      .then( function( results ) {
         return _.chain( results ).flatten( true ).uniq().filter().value();
      } );
}
