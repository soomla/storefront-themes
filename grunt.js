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

    var templatesFolder = "./templates", templates;

    var getTemplateSrcFolder = function(template) {
        return templatesFolder + "/" + template + "/src";
    };
    var getTemplateDeployFolder = function(template) {
        return templatesFolder + "/" + template + "/deploy";
    };
    var getTemplateDistFolder = function(template) {
        return getTemplateDeployFolder(template) + "/dist";
    };


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
        less : {},
        handlebars : {},
        rig : {},
        min : {}
    };

    grunt.initConfig(config);

    // Load grunt plugins
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-handlebars');
    grunt.loadNpmTasks('grunt-rigger');


    //
    // Register helper tasks
    //

    grunt.registerTask('prepareFolders', 'Prepares a deploy folder structure', function() {
        ls(templatesFolder).forEach(function(template) {
            var templateSrcFolder = getTemplateSrcFolder(template);
            var templateDistFolder = getTemplateDistFolder(template);
            mkdir("-p", templateDistFolder);
            cp("-R", templateSrcFolder + "/*", templateDistFolder);
        });
    });

    grunt.registerTask('configTemplates', 'Creates a build configuration for each template', function() {
        ls(templatesFolder).forEach(function(template) {
            var less        = grunt.config.get("less"),
                handlebars  = grunt.config.get("handlebars"),
                rig         = grunt.config.get("rig"),
                min         = grunt.config.get("min");

            var templateDistFolder = getTemplateDistFolder(template);

            //
            // Define a build configuration for the current template
            //

            var lessFiles    = {},
                templateLess = templateDistFolder + "/less/" + template + ".less";
            lessFiles[templateLess] = templateLess;

            less[template] = {
                files: lessFiles,
                options : {
                    paths: ["../storefront/src/"],
                    compress : true
                }
            };


            handlebars[template] = {
                src: templateDistFolder + "/templates",
                dest: templateDistFolder + "/js/handlebars-templates.js"
            };

            var viewsFile = templateDistFolder + "/js/" + template + "Views.js";
            rig[template] = { src  : viewsFile, dest : viewsFile };
            min[template] = { src  : viewsFile, dest : viewsFile };
        });
	});

    grunt.registerTask('copySrc', 'Copies the dist folder to an src folder just before minification', function() {
        ls(templatesFolder).forEach(function(template) {
            var templateDeployFolder = getTemplateDeployFolder(template),
                templateDistFolder   = getTemplateDistFolder(template);

            mkdir("-p", templateDeployFolder + "/src");
            cp("-rf", templateDistFolder + "/*", templateDeployFolder + "/src/");
        });
    });

    grunt.registerTask('clean', 'Cleans the distribution folder', function() {
        ls(templatesFolder).forEach(function(template) {
            rm("-rf", getTemplateDeployFolder(template));
        });
    });

    grunt.registerTask('cleanup', 'Cleans leftover files from the build process', function() {

        ls(templatesFolder).forEach(function(template) {

            var templateDistFolder = getTemplateDistFolder(template);

            // Remove auxiliary compiled Handlebars files from all templates
            rm("-f", templateDistFolder + "/js/handlebars-templates.js");

            // Remove raw Handlebars templates
            rm("-rf", templateDistFolder + "/templates");
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

    grunt.registerTask('default', 'clean prepareFolders configTemplates less handlebars rig cleanup copySrc min');

};
