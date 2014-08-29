/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/*jshint node: true*/
module.exports = function (grunt) {
   'use strict';

   var bower = require( 'bower' );
   var generate = require( './generate_require' );

   grunt.registerInitTask( 'autoinit', function() {
      var done = this.async();

      grunt.log.ok( 'Querying Bower dependencies…' );

      bower.commands.list()
         .on( 'error', done )
         .on( 'end', function( list ) {
            var requireConfig = 'require_config.js';
            var name = list.endpoint.name;
            var widget = name.replace( /^widgets\./, '' )
                             .replace( /\./g, '/' );
            var proxies = grunt.config( [ 'karma', 'options', 'proxies' ] )

            proxies[ '/base/widgets/' + widget ] = '/karma';

            var template = grunt.file.read( __dirname + '/require_config.js.tmpl' );
            var config = grunt.template.process( template, {
               data: generate( bower.config.directory, list )
            } );
            grunt.file.write( requireConfig, config );

            grunt.log.ok( 'Generated ' + grunt.log.wordlist( [ requireConfig ] ) );

            grunt.config( [ 'karma', 'options', 'proxies' ], proxies );
            grunt.config( [ 'karma', 'options', 'laxar', 'requireConfig' ], requireConfig );

            grunt.log.ok( 'Applied Grunt configuration for ' + grunt.log.wordlist( [ widget ] ) );

            grunt.loadNpmTasks( 'grunt-laxar' );

            done();
         } );
   } );

   grunt.initConfig( {
      karma: {
         options: {
            reporters: [ 'junit', 'progress', 'coverage' ],
            plugins: [ require( 'karma-coverage' ) ],
            preprocessors: {
               '*.js': 'coverage'
            },
            files: [
               { pattern: '*.*', included: false },
               { pattern: '*.theme/**', included: false },
               { pattern: 'spec/**', included: false },
               { pattern: 'bower_components/**', included: false }
            ]
         },
         default: {
            laxar: {
               specRunner: 'spec/spec_runner.js'
            },
            junitReporter: {
               outputFile: 'test/test-results.xml'
            },
            coverageReporter: {
               type: 'lcovonly',
               dir: 'test'
            }
         }
      },
      jshint: {
         default: {
            src: [ '*.js', '!(bower_components|node_modules)/**/*.js' ]
         }
      }
   } );

   grunt.task.run( 'autoinit' );

   grunt.registerTask( 'test', [ 'karma', 'jshint' ] );
   grunt.registerTask( 'default', [ 'test' ] );
};
