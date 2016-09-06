//---------------------------------------------------------------------
// <copyright file="TelemetryClient.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// </summary>
//---------------------------------------------------------------------
/// <reference path="ai.0.22.9-build00167.d.ts" />
var TelemetryClient = (function () {
    function TelemetryClient() {
    }
    TelemetryClient.getClient = function () {
        if (!this.telemetryClient) {
            this.telemetryClient = new TelemetryClient();
            this.telemetryClient.Init();
        }
        return this.telemetryClient;
    };
    TelemetryClient.prototype.Init = function () {
        var Key_dev = "79ea7918-5fbf-4864-9b7d-ee682f226042";
        var Key_MsLabs = "e381f98d-8bb2-46e7-9b38-2600ac015eb5";
        try {
            var snippet = {
                config: {
                    instrumentationKey: Key_MsLabs,
                }
            };
            var x = VSS.getExtensionContext();
            var init = new Microsoft.ApplicationInsights.Initialization(snippet);
            this.appInsightsClient = init.loadAppInsights();
            var webContext = VSS.getWebContext();
            this.appInsightsClient.setAuthenticatedUserContext(webContext.user.id, webContext.collection.id);
        }
        catch (e) {
            this.appInsightsClient = null;
            console.log(e);
        }
    };
    TelemetryClient.prototype.startTrackPageView = function (name) {
        try {
            if (this.appInsightsClient != null) {
                this.appInsightsClient.startTrackPage(name);
            }
        }
        catch (e) {
            console.log(e);
        }
    };
    TelemetryClient.prototype.stopTrackPageView = function (name) {
        try {
            if (this.appInsightsClient != null) {
                this.appInsightsClient.stopTrackPage(name);
            }
        }
        catch (e) {
            console.log(e);
        }
    };
    TelemetryClient.prototype.trackPageView = function (name, url, properties, measurements, duration) {
        try {
            if (this.appInsightsClient != null) {
                this.appInsightsClient.trackPageView("RollUpBoardWidget." + name, url, properties, measurements, duration);
            }
        }
        catch (e) {
            console.log(e);
        }
    };
    TelemetryClient.prototype.trackEvent = function (name, properties, measurements) {
        try {
            if (this.appInsightsClient != null) {
                this.appInsightsClient.trackEvent("RollUpBoardWidget." + name, properties, measurements);
                this.appInsightsClient.flush();
            }
        }
        catch (e) {
            console.log(e);
        }
    };
    TelemetryClient.prototype.trackException = function (exception, handledAt, properties, measurements) {
        try {
            if (this.appInsightsClient != null) {
                this.appInsightsClient.trackException(exception, handledAt, properties, measurements);
                this.appInsightsClient.flush();
            }
        }
        catch (e) {
            console.log(e);
        }
    };
    TelemetryClient.prototype.trackMetric = function (name, average, sampleCount, min, max, properties) {
        try {
            if (this.appInsightsClient != null) {
                this.appInsightsClient.trackMetric("RollUpBoardWidget." + name, average, sampleCount, min, max, properties);
                this.appInsightsClient.flush();
            }
        }
        catch (e) {
            console.log(e);
        }
    };
    return TelemetryClient;
}());
