//---------------------------------------------------------------------
// <copyright file="configuration.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// </summary>
//---------------------------------------------------------------------
define(["require", "exports", "TFS/Work/RestClient", "TFS/Core/RestClient", "q"], function (require, exports, RestClient, CoreClient, Q) {
    /// <reference path='isettings.d.ts' />
    /// <reference path='../typings/tsd.d.ts' />
    "use strict";
    var Configuration = (function () {
        function Configuration(WidgetHelpers) {
            this.WidgetHelpers = WidgetHelpers;
            this.widgetConfigurationContext = null;
            this.$select = $('#board-dropdown');
            this.client = RestClient.getClient();
        }
        Configuration.prototype.load = function (widgetSettings, widgetConfigurationContext) {
            TelemetryClient.getClient().trackPageView("RollUpBoard.Configuration");
            var _that = this;
            var $boardDropdown = $("#board-dropdown");
            this.widgetConfigurationContext = widgetConfigurationContext;
            this.GetProjectTemplate().then(function () { });
            var $queryDropdown = document.getElementById("board-dropdown");
            var tc = {};
            tc.projectId = VSS.getWebContext().project.id;
            tc.teamId = VSS.getWebContext().team.id;
            this.PopulateBoardDropdown().then(function (boards) {
                //console.log(boards);
                boards.forEach(function (board) {
                    var opt = document.createElement("option");
                    var optText = document.createTextNode(board.name);
                    opt.appendChild(optText);
                    $queryDropdown.appendChild(opt);
                });
                _that.$select
                    .change(function () {
                    _that.widgetConfigurationContext.notify(_that.WidgetHelpers.WidgetEvent.ConfigurationChange, _that.WidgetHelpers.WidgetEvent.Args(_that.getCustomSettings()));
                });
                var $boardDropdown = $("#board-dropdown");
                var settings = JSON.parse(widgetSettings.customSettings.data);
                if (settings && settings.board) {
                    $boardDropdown.val(settings.board);
                }
                else {
                    //first load
                    $boardDropdown.val("");
                }
                return _that.WidgetHelpers.WidgetStatusHelper.Success();
            });
        };
        Configuration.prototype.PopulateBoardDropdown = function () {
            var deferred = Q.defer();
            var tc = {};
            tc.projectId = VSS.getWebContext().project.id;
            tc.teamId = VSS.getWebContext().team.id;
            this.client.getBoards(tc).then(function (boards) {
                //console.log(boards);
                deferred.resolve(boards);
            });
            return deferred.promise;
        };
        Configuration.prototype.GetProjectTemplate = function () {
            var deferred = Q.defer();
            var client = CoreClient.getClient();
            client.getProject(VSS.getWebContext().project.id, true).then(function (q) {
                //console.log(q);
                var processT = q.capabilities["processTemplate"];
                deferred.resolve(processT["templateName"]);
            });
            return deferred.promise;
        };
        Configuration.prototype.getCustomSettings = function () {
            var result = { data: JSON.stringify({ board: $("#board-dropdown").val() }) };
            //console.log(result);
            return result;
        };
        Configuration.prototype.onSave = function () {
            return this.WidgetHelpers.WidgetConfigurationSave.Valid(this.getCustomSettings());
        };
        return Configuration;
    }());
    exports.Configuration = Configuration;
    VSS.require(["TFS/Dashboards/WidgetHelpers"], function (WidgetHelpers) {
        WidgetHelpers.IncludeWidgetConfigurationStyles();
        VSS.register("rollupboardwidget-Configuration", function () {
            var configuration = new Configuration(WidgetHelpers);
            return configuration;
        });
        VSS.notifyLoadSucceeded();
    });
});
