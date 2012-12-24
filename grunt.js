/*global module:false*/
require('shelljs/global');


module.exports = function (grunt) {

    var distFolder = "dist", templates;

    // Project configuration.
    var config = {
        meta : {
            version : '0.1.0',
            banner : '/*! PROJECT_NAME - v<%= meta.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '* http://PROJECT_WEBSITE/\n' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
                'YOUR_NAME; Licensed MIT */'
        },
        handlebars : {},
        rig : {},
        min : {}
    };

    grunt.initConfig(config);

    // Load grunt plugins
    grunt.loadNpmTasks('grunt-handlebars');
    grunt.loadNpmTasks('grunt-rigger');



    // Register helper tasks

    grunt.registerTask('copy', 'Copies more necessary resources to the distribution folder', function() {

        // Copy templates and themes to distribution folder
        mkdir("-p", distFolder);
        cp("-R", "templates", "themes", distFolder + "/");
    });


    grunt.registerTask('configTemplates', 'Creates a build configuration for each template', function() {
        templates = ls(distFolder + "/templates");
        templates.forEach(function(template) {
            var handlebars  = grunt.config.get("handlebars"),
                rig         = grunt.config.get("rig"),
                min         = grunt.config.get("min");

            // Define a build configuration for the current template
            handlebars[template] = {
                src: distFolder + "/templates/" + template + "/templates",
                dest: distFolder + "/templates/" + template + "/js/handlebars-templates.js"
            };

            var viewsFile = distFolder + "/templates/" + template + "/js/" + template + "Views.js";
            rig[template] = { src  : viewsFile, dest : viewsFile };
            min[template] = { src  : viewsFile, dest : viewsFile };
        })
    });

    grunt.registerTask('clean', 'Cleans the distribution folder', function() {
        rm("-rf", distFolder);
    });

    grunt.registerTask('cleanup', 'Cleans leftover files from the build process', function() {
        // Remove auxiliary compiled Handlebars files from all templates
        templates.forEach(function(template) {
            rm("-f", distFolder + "/templates/" + template + "/js/handlebars-templates.js");
        });
    });

    grunt.registerTask('default', 'clean copy configTemplates handlebars rig min cleanup');

};
