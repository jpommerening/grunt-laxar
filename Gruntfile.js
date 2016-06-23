/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
module.exports = function( grunt ) {
   'use strict';

   grunt.initConfig( {
      clean: {
         test: [ 'tmp' ],
         fixtures: [ 'tasks/spec/fixtures/bower_components' ]
      },
      jshint: {
         gruntfile: [
            'Gruntfile.js'
         ],
         lib: [
            'lib/*.js'
         ],
         tasks: [
            'tasks/*.js',
            'tasks/lib/*.js'
         ],
         spec: [
            'lib/spec/*.js',
            'tasks/spec/*.js'
         ]
      },
      copy: {
         test: {
            expand: true,
            src: './**/*.*',
            cwd: 'tasks/spec/fixtures/',
            dest: 'tmp/'
         }
      },
      mochacli: {
         options: {
            ui: 'bdd',
            reporter: 'spec'
         },
         lib: [
            'lib/spec/*_spec.js'
         ],
         tasks: [
            'tasks/spec/deprecated/*_spec.js'
         ],
         'flow-tasks': [
            'tasks/spec/*.spec.js'
         ]
      },
      'npm-publish': {
         options: {
            requires: [ 'test' ]
         }
      },
      bump: {
         options: {
            commitMessage: 'release v%VERSION%',
            tagName: 'v%VERSION%',
            tagMessage: 'version %VERSION%',
            pushTo: 'origin'
         }
      }
   } );

   grunt.loadNpmTasks( 'grunt-contrib-clean' );
   grunt.loadNpmTasks( 'grunt-contrib-copy' );
   grunt.loadNpmTasks( 'grunt-contrib-jshint' );
   grunt.loadNpmTasks( 'grunt-mocha-cli' );
   grunt.loadNpmTasks( 'grunt-bump' );

   grunt.registerTask( 'test-lib', [ 'clean', 'mochacli:lib' ] );
   grunt.registerTask( 'test-flow-tasks', [ 'clean', 'fixtures', 'copy', 'mochacli:flow-tasks' ] );
   grunt.registerTask( 'test-legacy-tasks', [ 'clean', 'fixtures', 'copy', 'mochacli:tasks' ] );
   grunt.registerTask( 'test-additional', [ 'clean', 'jshint' ] );

   grunt.registerTask( 'test', [ 'test-lib', 'test-flow-tasks', 'test-legacy-tasks', 'test-additional' ] );
   grunt.registerTask( 'default', ['test'] );

   grunt.registerTask( 'release', 'Test, bump and publish to NPM.', function( type ) {
      grunt.task.run( [
         'test',
         'bump:#{type || \'patch\'}'
      // 'npm-publish'
      ] );
   } );

   grunt.registerTask( 'fixtures', 'Setup the test fixtures', function() {
      var bower = require.resolve( 'bower/bin/bower' );
      var done = this.async();
      var dir = 'tasks/spec/fixtures';

      grunt.log.ok( 'Installing bower packages in ' + dir );
      grunt.util.spawn( {
         cmd: process.argv[ 0 ],
         args: [ bower, 'install' ],
         opts: {
            cwd: dir
         }
      }, done );
   } );
};
