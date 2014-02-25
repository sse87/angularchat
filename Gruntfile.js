module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      build: {
        src: 'js/*.js'
      },
    },

    concat: {
      foo: {
        src: ['js/main.js', 'js/*.js'],
        dest: 'js/<%= pkg.name %>.js'
      }
 
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
        mangle: false
      },
      build: {
        src: '<%= concat.foo.dest %>',
        dest: 'js/<%= pkg.name %>.min.js'
      }
    }
  });
 
  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
 
  // Default task(s).
  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
};