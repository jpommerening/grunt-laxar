/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
var path = require( 'path' );
var requirejs = require( 'requirejs' );

/**
 * Use laxar and the given require configuration to resolve
 * the paths/constants that laxar uses.
 *
 * @param {Object} config
 *    the require configuration to use
 * @param {Object} [options]
 *    overrides
 *
 * @return {Object}
 *    an object containig the path laxar constants `PRODUCT`,
 *    `THEMES`, `LAYOUTS`, `WIDGETS`, `PAGES`, `FLOW_JSON`,
 *    `DEFAULT_THEME`.
 */
module.exports = function laxarPaths( config, options ) {
   'use strict';

   options = options || {};
   var req = requirejs.config( config );

   function resolve( reference ) {
      return path.resolve( req.toUrl( reference ) );
   }

   return {
      PRODUCT: resolve( options.base || options.root || 'laxar-path-root' ),
      THEMES: resolve( options.themes || 'laxar-path-themes' ),
      LAYOUTS: resolve( options.layouts || 'laxar-path-layouts' ),
      WIDGETS: resolve( options.widgets || 'laxar-path-widgets' ),
      PAGES: resolve( options.pages || 'laxar-path-pages' ),
      FLOW_JSON: resolve( options.flow || 'laxar-path-flow' ),
      DEFAULT_THEME: resolve( options.defaultThemePath || 'laxar_uikit/themes/default.theme' )
   };

};
