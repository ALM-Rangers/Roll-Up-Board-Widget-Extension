define(["require", "exports", "applicationinsights-js"], function (require, exports, applicationinsights_js_1) {
    "use strict";
    var TelemetryClientSettings = (function () {
        function TelemetryClientSettings() {
        }
        return TelemetryClientSettings;
    }());
    exports.TelemetryClientSettings = TelemetryClientSettings;
    var TelemetryClient = (function () {
        function TelemetryClient() {
            this.IsAvailable = true;
        }
        TelemetryClient.getClient = function (settings) {
            if (!this._instance) {
                console.log("Creating new TelemetryClient!");
                this._instance = new TelemetryClient();
                this._instance.Init(settings);
            }
            return this._instance;
        };
        TelemetryClient.prototype.Init = function (settings) {
            console.debug("TelemetryClient settings key: " + settings.key);
            console.debug("TelemetryClient settings extension context: " + settings.extensioncontext);
            var config = {
                instrumentationKey: settings.key
            };
            this.ExtensionContext = settings.extensioncontext;
            try {
                var webContext = VSS.getWebContext();
                applicationinsights_js_1.AppInsights.downloadAndSetup(config);
                applicationinsights_js_1.AppInsights.setAuthenticatedUserContext(webContext.user.id, webContext.collection.id);
            }
            catch (e) {
                console.log(e);
            }
        };
        TelemetryClient.prototype.trackPageView = function (name, url, properties, measurements, duration) {
            try {
                applicationinsights_js_1.AppInsights.trackPageView(this.ExtensionContext + "." + name, url, properties, measurements, duration);
                applicationinsights_js_1.AppInsights.flush();
            }
            catch (e) {
                console.log(e);
            }
        };
        TelemetryClient.prototype.trackEvent = function (name, properties, measurements) {
            try {
                console.log("Tracking event: " + this.ExtensionContext + "." + name);
                applicationinsights_js_1.AppInsights.trackEvent(this.ExtensionContext + "." + name, properties, measurements);
                applicationinsights_js_1.AppInsights.flush();
            }
            catch (e) {
                console.log(e);
            }
        };
        TelemetryClient.prototype.trackException = function (exceptionMessage, handledAt, properties, measurements) {
            try {
                console.error(exceptionMessage);
                var error = {
                    name: this.ExtensionContext + "." + handledAt,
                    message: exceptionMessage
                };
                applicationinsights_js_1.AppInsights.trackException(error, handledAt, properties, measurements);
                applicationinsights_js_1.AppInsights.flush();
            }
            catch (e) {
                console.log(e);
            }
        };
        TelemetryClient.prototype.trackMetric = function (name, average, sampleCount, min, max, properties) {
            try {
                applicationinsights_js_1.AppInsights.trackMetric(this.ExtensionContext + "." + name, average, sampleCount, min, max, properties);
                applicationinsights_js_1.AppInsights.flush();
            }
            catch (e) {
                console.log(e);
            }
        };
        return TelemetryClient;
    }());
    exports.TelemetryClient = TelemetryClient;
});
//# sourceMappingURL=telemetryclient.js.map