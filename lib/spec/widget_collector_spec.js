/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
var WidgetCollector = require( '../widget_collector' );
var path = require( 'path' );
var q = require( 'q' );

describe( 'WidgetCollector', function() {
   'use strict';

   var widgetCollector;

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( function() {

      var pages = {
         page1: {
            layout: 'someLayout',

            areas: {
               area1: [
                  { widget: 'someWidgetPath1', id: 'id1' },
                  { widget: 'someWidgetPath2', id: 'id2' },
                  { widget: 'someWidgetPath3', id: 'id3' }
               ],
               area2: [
                  { widget: 'someWidgetPath1', id: 'id4' },
                  { widget: 'someWidgetPath2', id: 'id5' }
               ],
               area3: [
                  { widget: 'someWidgetPath3', id: 'id6' },
                  { widget: 'someWidgetPath4', id: 'id7' }
               ]
            }
         },
         page2: {
            layout: 'someOtherLayout',

            areas: {
               area1: [
                  { widget: 'someWidgetPath1', id: 'id1' },
                  { widget: 'someWidgetPath5', id: 'id2' }
               ]
            }
         }
      };

      var httpClient = {
         get: function( url ) {
            var deferred = q.defer();

            process.nextTick( function() {
               if( httpClient.responses.hasOwnProperty( url ) ) {
                  deferred.resolve( { data: httpClient.responses[ url ] } );
               } else {
                  deferred.reject( {} );
               }
            } );

            return deferred.promise;
         },
         responses: {},
         respondWith: function( url, data ) {
            httpClient.responses[ url ] = data;
         }
      };

      var pageLoader = {
         loadPage: function( page ) {
            var deferred = q.defer();

            process.nextTick( function() {
               if( pages.hasOwnProperty( page ) ) {
                  deferred.resolve( pages[ page ] );
               } else {
                  deferred.reject( new Error( 'Page "' + page + '" could not be found in map.' ) );
               }
            } );

            return deferred.promise;
         }
      };

      var flow = { places: {} };

      Object.keys( pages ).forEach( function( pageName ) {
         httpClient.respondWith( 'pages/' + pageName + '.json', pages[ pageName ] );
         flow.places[ pageName ] = { page: pageName, targets: {} };
      } );
      httpClient.respondWith( 'flow.json', flow );
      httpClient.respondWith( 'my_widgets/someWidgetPath1/widget.json', {} );
      httpClient.respondWith( 'my_widgets/someWidgetPath2/widget.json', {} );
      httpClient.respondWith( 'my_widgets/someWidgetPath3/widget.json', {} );
      httpClient.respondWith( 'my_widgets/someWidgetPath4/widget.json', {
         controls: [ 'my_ui_package/someControl1' ]
      } );
      httpClient.respondWith( 'my_widgets/someWidgetPath5/widget.json', {
         controls: [ 'my_ui_package/someControl2' ]
      } );

      widgetCollector = WidgetCollector.create( httpClient, pageLoader, 'my_widgets' );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( '.pagesForFlow( flow )', function() {

      it( 'finds all pages reachable from the given flow', function( done ) {
         widgetCollector.pagesForFlow( 'flow.json' )
            .then( function( pages ) {
               expect( pages ).toEqual( [
                  'page1',
                  'page2'
               ] );
               done();
            }, done );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( '.widgetsForFlow( flow )', function() {

      it( 'finds all widgets in all pages reachable from the given flow', function( done ) {
         widgetCollector.widgetsForFlow( 'flow.json' )
            .then( function( widgets ) {
               expect( widgets ).toEqual( [
                  'my_widgets/someWidgetPath1/someWidgetPath1',
                  'my_widgets/someWidgetPath2/someWidgetPath2',
                  'my_widgets/someWidgetPath3/someWidgetPath3',
                  'my_widgets/someWidgetPath4/someWidgetPath4',
                  'my_widgets/someWidgetPath5/someWidgetPath5'
               ] );
               done();
            } ).fail( done );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( '.controlsForFlow( flow )', function() {

      it( 'finds all controls in all pages reachable from the given flow', function( done ) {
         widgetCollector.controlsForFlow( 'flow.json' )
            .then( function( controls ) {
               expect( controls ).toEqual( [
                  'my_ui_package/someControl1',
                  'my_ui_package/someControl2'
               ] );
               done();
            } ).fail( done );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( '.widgetsAndControlsForFlow( flow )', function() {

      it( 'finds all widgets and controls in all pages reachable from the given flow', function( done ) {
         widgetCollector.widgetsAndControlsForFlow( 'flow.json' )
            .then( function( result ) {
               expect( result.widgets ).toEqual( [
                  'my_widgets/someWidgetPath1/someWidgetPath1',
                  'my_widgets/someWidgetPath2/someWidgetPath2',
                  'my_widgets/someWidgetPath3/someWidgetPath3',
                  'my_widgets/someWidgetPath4/someWidgetPath4',
                  'my_widgets/someWidgetPath5/someWidgetPath5'
               ] );
               expect( result.controls ).toEqual( [
                  'my_ui_package/someControl1',
                  'my_ui_package/someControl2'
               ] );
               done();
            } ).fail( done );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

} );
