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
        dest: 'build/<%= pkg.name %>.js'
      }
 
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
        mangle: false
      },
      build: {
        src: '<%= concat.foo.dest %>',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    
    watch: {
      scripts: {
        files: ['js/*.js'],
        tasks: ['jshint', 'concat', 'uglify']
      }
    }
    
  });
 
  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
 
  // Default task(s).
  grunt.registerTask('dev', ['watch']);
  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
};