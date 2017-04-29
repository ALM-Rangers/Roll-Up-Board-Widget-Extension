export declare class TelemetryClientSettings {
    key: string;
    extensioncontext: string;
}
export declare class TelemetryClient {
    private static _instance;
    ExtensionContext: string;
    private IsAvailable;
    private constructor();
    static getClient(settings: TelemetryClientSettings): TelemetryClient;
    private Init(settings);
    trackPageView(name?: string, url?: string, properties?: {
        [name: string]: string;
    }, measurements?: {
        [name: string]: number;
    }, duration?: number): void;
    trackEvent(name: string, properties?: {
        [name: string]: string;
    }, measurements?: {
        [name: string]: number;
    }): void;
    trackException(exceptionMessage: string, handledAt?: string, properties?: {
        [name: string]: string;
    }, measurements?: {
        [name: string]: number;
    }): void;
    trackMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: {
        [name: string]: string;
    }): void;
}
