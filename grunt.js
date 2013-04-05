/*global module:false*/
require('shelljs/global');
var AWS     = require('aws-sdk'),
    wrench  = require('wrench'),
    fs      = require('fs'),
    async   = require('async');
    _u      = require('underscore');

var separator = function() {
    console.log("=============================================");
};


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

        templates.forEach(function(template) {

            // Remove auxiliary compiled Handlebars files from all templates
            rm("-f", distFolder + "/templates/" + template + "/js/handlebars-templates.js");

            // Remove raw Handlebars templates
            rm("-rf", distFolder + "/templates/" + template + "/templates");
        });
    });

    grunt.registerTask('s3', 'Upload precompiled assets to s3', function() {

        var done = this.async();
        AWS.config.update({
            accessKeyId: "AKIAJLLZKLVMVMHFHCIA",
            secretAccessKey: "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"
        });
        var s3 = new AWS.S3.Client();

        var localFileList = wrench.readdirSyncRecursive(distFolder);

        // Filter out folder names
        localFileList = _u.reject(localFileList, function(f) { return f.indexOf(".") === -1 } );
        localFileList = _u.map(localFileList, function(f) { return distFolder + '/' + f } );

        async.map(localFileList, fs.readFile, function(err, results) {

            var files = [];
            var regex = new RegExp("^" + distFolder + "\/");
            _u.each(localFileList, function(file, i) {

                // Make sure keys don't include the 'distFolder' prefix
                files.push({key: 'storefront-themes/' + file.replace(regex, ""), data: results[i]});
            });

            async.map(files, function(file) {
                s3.putObject({
                    Bucket: 'soomla_images',
                    Key: file.key,
                    Body: file.data
                }, function(err, data){
                    if (!err) {
                        console.log("Uploaded: " + file.key);
                    } else {
                        throw err;
                    }
                });

            }, function(err, results) {
                if (err) {
                    separator();
                    console.dir(err);
                    separator();
                }
                done();
            });

            // Create an MD5 hash for each file
//            var shasum = crypto.createHash('md5');
//            var s = fs.ReadStream(distFolder + '/templates/' + file);
//            s.on('data', function(d) { shasum.update(d); });
//            s.on('end', function() {
//                var md5 = shasum.digest('hex');
//                console.log(md5);
//                md5 = new Buffer(md5).toString('base64');
//                console.log(md5);
//            });
        });


    });

    grunt.registerTask('default', 'clean copy configTemplates handlebars rig min cleanup');

};
