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
import * as ldservice from "./launchdarkly.service";

export class Configuration {
    widgetConfigurationContext = null;

    $select = $("#board-dropdown");
    $displaylogs = $("#display-logs");
    public client = RestClient.getClient();
    public _widgetHelpers;
    public teamSettingsVisibility: any = {};
    public BacklogConfiguration: { id: string, name: string, color: string, visible: boolean }[] = [];
    public enableTelemetry: boolean = true;
    public displayLogs: boolean = false;
    public activateFF: boolean = true;

    constructor(public WidgetHelpers, public ldclientServices) {
        if (ldclientServices) {
            this.enableTelemetry = ldclientServices.flags["enable-telemetry"];
            this.displayLogs = ldclientServices.flags["display-logs"];
            // console.log(this.displayLogs);
            this.activateFF = true;
        } else {
            this.displayLogs = false;
            this.activateFF = false;
        }
    }

    IsVSTS(): boolean {
        return Context.getPageContext().webAccessConfiguration.isHosted;
    }

    EnableAppInsightTelemetry(): boolean {
        let isEnabled = this.enableTelemetry;
        if (!isEnabled) {
            console.log("Application Insights Telemetry is disabled");
        }
        return isEnabled;
    }

    DisplayLogs(message: any) {
        if (this.displayLogs) {
            console.log(message);
        }
    }

    public load(widgetSettings, widgetConfigurationContext) {
        if (this.EnableAppInsightTelemetry()) {
            telemclient.TelemetryClient.getClient(telemetryClientSettings.settings).trackPageView("RollUpBoard.Configuration");
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

            if (this.activateFF) {
                $("#switch-displaylog").show();
                _that.$displaylogs.prop("checked", _that.displayLogs);
                // console.log(_that.displayLogs);
                this.DisplayLogsStatus();
                _that.$displaylogs.change(() => {
                    let displaylogs = _that.$displaylogs.is(":checked");
                    this.DisplayLogsStatus();

                    let eventName = _that.WidgetHelpers.WidgetEvent.ConfigurationChange;
                    let eventArgs = _that.WidgetHelpers.WidgetEvent.Args(_that.getCustomSettings());
                    _that.widgetConfigurationContext.notify(eventName, eventArgs);
                });
            } else {
                $("#switch-displaylog").hide();
            }

            return _that.WidgetHelpers.WidgetStatusHelper.Success();
        });
    }

    public PopulateBoardDropdown(): IPromise<WorkContracts.BoardReference[]> {
        let deferred = $.Deferred<WorkContracts.BoardReference[]>();
        let tc = <CoreContracts.TeamContext>{};
        tc.projectId = VSS.getWebContext().project.id;
        tc.teamId = VSS.getWebContext().team.id;
        this.client.getBoards(tc).then((boards) => {
            deferred.resolve(boards);
        });
        return deferred.promise();
    }

    public GetTeamSettings(): IPromise<WorkContracts.TeamSetting> {
        let deferred = $.Deferred<WorkContracts.TeamSetting>();
        let tc = <CoreContracts.TeamContext>{};
        tc.projectId = VSS.getWebContext().project.id;
        tc.teamId = VSS.getWebContext().team.id;
        this.client.getTeamSettings(tc).then((teamsettings) => {
            deferred.resolve(teamsettings);
        });
        return deferred.promise();
    }

    public GetProjectTemplate(): IPromise<string> {
        let deferred = $.Deferred<string>();
        let client = CoreClient.getClient();
        client.getProject(VSS.getWebContext().project.id, true).then((q: CoreContracts.TeamProject) => {
            let processT = q.capabilities["processTemplate"];
            deferred.resolve(processT["templateName"]);
        });

        return deferred.promise();
    }

    public DisplayLogsStatus() {
        let displaylogs = $("#display-logs").is(":checked");
        let displaylogsstatus = $("#displaylogs-status");
        if (displaylogs) {
            displaylogsstatus.text("On");
        } else {
            displaylogsstatus.text("Off");
        }
    }

    private SetEnableFF(token: string, enabled: boolean, feature: string): IPromise<string> {
        let deferred = $.Deferred<string>();
        ldservice.LaunchDarklyService.updateUserFeature(token, this.ldclientServices.user, enabled, feature).then((r) => {
            console.log(r);
            deferred.resolve(r);
        });
        return deferred.promise();
    }

    private TrackFF(token: string, customEvent: string): IPromise<string> {
        let deferred = $.Deferred<string>();
        ldservice.LaunchDarklyService.TrackEventFeatureFlags(this.ldclientServices.user, token, customEvent).then((r) => {
            console.log(r);
            deferred.resolve(r);
        });
        return deferred.promise();
    }

    public getCustomSettings() {
        let name = $("#board-dropdown").val();
        let displaylogs = $("#display-logs").is(":checked");
        let result = { data: JSON.stringify(<ISettings>{ board: name, displaylog: displaylogs }) };
        return result;
    }

    public onSave() {

        let displaylogchecked = this.$displaylogs.is(":checked");
        if (displaylogchecked !== this.displayLogs) {
            VSS.getAppToken().then((Apptoken) => {
                this.SetEnableFF(Apptoken.token, displaylogchecked, "display-logs").then((e) => {
                    if (e === "The flag is updated") {
                        ldservice.LaunchDarklyService.updateFlag("display-logs", displaylogchecked);
                        this.TrackFF(Apptoken.token, "display-logs").then((e) => {
                            this.DisplayLogs(e);
                        });
                    }
                });
            });
        }
        return this.WidgetHelpers.WidgetConfigurationSave.Valid(this.getCustomSettings());
    }
}
VSS.ready(function () {
    VSS.require(["TFS/Dashboards/WidgetHelpers"], (WidgetHelpers) => {
        WidgetHelpers.IncludeWidgetConfigurationStyles();
        VSS.getAppToken().then((Apptoken) => {
            let webContext = VSS.getWebContext();
            let user = {
                "key": webContext.user.id + ":" + webContext.account.id
            };
            // Context.getPageContext().webAccessConfiguration.isHosted
            if (false) { // FF Only for VSTS
                ldservice.LaunchDarklyService.InitUserFlags(user, Apptoken.token).then((p) => {

                    VSS.register("rollupboardwidget-Configuration", () => {
                        console.log("feature flags are enabled");
                        let configuration = new Configuration(WidgetHelpers, ldservice.LaunchDarklyService);
                        return configuration;
                    });
                    VSS.notifyLoadSucceeded();
                }, function (reject) {
                    console.warn("feature flags are not used");
                    RegisterWidgetConfigurationWithoutFF(WidgetHelpers);
                });
            } else {
                console.log("Context : TFS On-Premise");
                RegisterWidgetConfigurationWithoutFF(WidgetHelpers);
            }
        });
    });
});

function RegisterWidgetConfigurationWithoutFF(WidgetHelpers: any) {
    VSS.register("rollupboardwidget-Configuration", () => {
        let configuration = new Configuration(WidgetHelpers, null);
        return configuration;
    });
    VSS.notifyLoadSucceeded();
}
