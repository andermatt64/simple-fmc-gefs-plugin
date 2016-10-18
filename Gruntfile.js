module.exports = function(grunt) {
  var BANNER = '// ==UserScript==\n' +
               '// @name        <%= pkg.name %>\n' +
               '// @namespace   andermatt64-gefs-plugins\n' +
               '// @version     <%= pkg.version %>\n' +
               '// @description <%= pkg.description %>\n' +
               '// @author      andermatt64\n' +
               '// @require     \n' +
               '// @match       http://*.gefs-online.com/gefs.php\n' +
               '// @grant       none\n' +
               '// ==/UserScript==\n\n';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: BANNER,
        separator: '\n'
      },
      dist: {
        src: ['src/*.js'],
        dest: 'dist/<%= pkg.name %>.user.js'
      }
    },
    uglify: {
      options: {
        banner: BANNER
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.user.js': ['<%= concat.dist.dest %>'],
          'dist/<%= pkg.name %>-locations.min.js': ['src/db/locations.js']
        }
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'src/*.js'],
      options: {
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

};
