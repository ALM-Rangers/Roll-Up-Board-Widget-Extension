/*
This file in the main entry point for defining grunt tasks and using grunt plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkID=513275&clcid=0x409
*/
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        exec: {
            package: {
                command: "tfx extension create --manifest-globs vss-extension.json",
                stdout: true,
                stderr: true
            },
            update: {
                command: "npm up --save-dev",
                stdout: true,
                stderr: true
            },
			tsdinit:{
				command: "tsd install jquery q knockout",
                stdout: true,
                stderr: true
			},
			tsdlink:{
				command: "tsd link",
                stdout: true,
                stderr: true
			}
        },
        copy: {
            main: {
                files: [
                  // includes files within path
                  { expand: true, flatten: true, src: ['node_modules/vss-web-extension-sdk/lib/VSS.SDK.js', 'node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js'], dest: 'scripts/', filter: 'isFile' }
                ]
            }
        },
        typescript: {
            compile: {
                src: ['scripts/*.ts'],
                dest: 'scripts',
                options: {
                    module: 'amd',
                    target: 'es5',
                    sourceMap: true,
                    declaration: false,
                    references: ["typings/**/*.d.ts"]
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-contrib-copy");

    grunt.loadNpmTasks("grunt-typescript");
};