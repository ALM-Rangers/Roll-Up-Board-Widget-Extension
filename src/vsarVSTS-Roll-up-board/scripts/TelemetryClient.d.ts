/// <reference path="ai.0.22.9-build00167.d.ts" />
declare class TelemetryClient {
    private static telemetryClient;
    static getClient(): TelemetryClient;
    private appInsightsClient;
    private Init();
    startTrackPageView(name?: string): void;
    stopTrackPageView(name?: string): void;
    trackPageView(name?: string, url?: string, properties?: Object, measurements?: Object, duration?: number): void;
    trackEvent(name: string, properties?: Object, measurements?: Object): void;
    trackException(exception: Error, handledAt?: string, properties?: Object, measurements?: Object): void;
    trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: Object): void;
}
