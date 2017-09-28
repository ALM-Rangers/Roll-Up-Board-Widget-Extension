// ---------------------------------------------------------------------
// <copyright file="configuration.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// </summary>
// ---------------------------------------------------------------------

/// <reference types="vss-web-extension-sdk" />
/// <reference path="isettings.d.ts" />
"use strict";
import RestClient = require("TFS/Work/RestClient");
import CoreClient = require("TFS/Core/RestClient");
import CoreContracts = require("TFS/Core/Contracts");
import WorkContracts = require("TFS/Work/Contracts");
import Q = require("q");
import Context = require("VSS/Context");
import * as telemclient from "telemetryclient-team-services-extension";
import telemetryClientSettings = require("./telemetryClientSettings");

import rollupboardServices = require("./RollUpBoardServices");

export class Configuration {
    widgetConfigurationContext = null;

    $select = $("#board-dropdown");
    public client = RestClient.getClient();
    public _widgetHelpers;
    public teamSettingsVisibility: any = {};
    public BacklogConfiguration: { id: string, name: string, color: string, visible: boolean }[] = [];
    constructor(public WidgetHelpers) {
    }

    IsVSTS(): boolean {
        return Context.getPageContext().webAccessConfiguration.isHosted;
    }

    EnableAppInsightTelemetry(): boolean {
        return true;
    }

    public load(widgetSettings, widgetConfigurationContext) {
        if (this.EnableAppInsightTelemetry()) {
            telemclient.TelemetryClient.getClient(telemetryClientSettings.settings).trackPageView("RollUpBoard.Configuration");
        } else {
            console.log("App Insight Telemetry is disabled");
        }

        let _that = this;
        this.widgetConfigurationContext = widgetConfigurationContext;

        this.GetProjectTemplate().then(() => { });

        let $queryDropdown = document.getElementById("board-dropdown");
        let tc = <CoreContracts.TeamContext>{};
        tc.projectId = VSS.getWebContext().project.id;
        tc.teamId = VSS.getWebContext().team.id;

        rollupboardServices.RollUpBoardServices.GetBacklogConfiguration().then((backlogconf) => {
            // Portfolio Backlog
            backlogconf.portfolioBacklogs.sort(function (a, b) {
                return a.rank - b.rank;
            });
            backlogconf.portfolioBacklogs.reverse();

            backlogconf.portfolioBacklogs.forEach(element => {
                if (!backlogconf.hiddenBacklogs.includes(element.id)) {
                    let opt = document.createElement("option");
                    opt.value = element.name;
                    let optText = document.createTextNode(element.name);
                    opt.appendChild(optText);
                    $queryDropdown.appendChild(opt);
                }
            });

            // Backlog Items
            if (!backlogconf.hiddenBacklogs.includes(backlogconf.requirementBacklog.id)) {
                let opt = document.createElement("option");
                opt.value = backlogconf.requirementBacklog.name;
                let optText = document.createTextNode(backlogconf.requirementBacklog.name);
                opt.appendChild(optText);
                $queryDropdown.appendChild(opt);
            }

            _that.$select
                .change(() => {
                    _that.widgetConfigurationContext.notify(_that.WidgetHelpers.WidgetEvent.ConfigurationChange,
                        _that.WidgetHelpers.WidgetEvent.Args(_that.getCustomSettings()));
                });

            let $boardDropdown = $("#board-dropdown");
            let settings = JSON.parse(widgetSettings.customSettings.data);
            if (settings && settings.board) {
                $boardDropdown.val(settings.board);
            } else {
                // first load
                $boardDropdown.val("");
            }
            return _that.WidgetHelpers.WidgetStatusHelper.Success();
        });
    }

    public PopulateBoardDropdown(): IPromise<WorkContracts.BoardReference[]> {
        let deferred = Q.defer<WorkContracts.BoardReference[]>();
        let tc = <CoreContracts.TeamContext>{};
        tc.projectId = VSS.getWebContext().project.id;
        tc.teamId = VSS.getWebContext().team.id;
        this.client.getBoards(tc).then((boards) => {
            deferred.resolve(boards);
        });
        return deferred.promise;
    }

    public GetTeamSettings(): IPromise<WorkContracts.TeamSetting> {
        let deferred = Q.defer<WorkContracts.TeamSetting>();
        let tc = <CoreContracts.TeamContext>{};
        tc.projectId = VSS.getWebContext().project.id;
        tc.teamId = VSS.getWebContext().team.id;
        this.client.getTeamSettings(tc).then((teamsettings) => {
            deferred.resolve(teamsettings);
        });
        return deferred.promise;
    }

    public GetProjectTemplate(): IPromise<string> {
        let deferred = Q.defer<string>();
        let client = CoreClient.getClient();
        client.getProject(VSS.getWebContext().project.id, true).then((q: CoreContracts.TeamProject) => {
            let processT = q.capabilities["processTemplate"];
            deferred.resolve(processT["templateName"]);
        });

        return deferred.promise;
    }

    public getCustomSettings() {
        let name = $("#board-dropdown").val();
        let result = { data: JSON.stringify(<ISettings>{ board: name }) };
        return result;
    }

    public onSave() {
        return this.WidgetHelpers.WidgetConfigurationSave.Valid(this.getCustomSettings());
    }
}

VSS.require(["TFS/Dashboards/WidgetHelpers"], (WidgetHelpers) => {
    WidgetHelpers.IncludeWidgetConfigurationStyles();
    VSS.register("rollupboardwidget-Configuration", () => {
        let configuration = new Configuration(WidgetHelpers);
        return configuration;
    });
    VSS.notifyLoadSucceeded();
});