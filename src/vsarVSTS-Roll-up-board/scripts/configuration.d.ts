/// <reference path="isettings.d.ts" />
/// <reference path="../typings/tsd.d.ts" />
import RestClient = require("TFS/Work/RestClient");
import WorkContracts = require("TFS/Work/Contracts");
export declare class Configuration {
    WidgetHelpers: any;
    widgetConfigurationContext: any;
    $select: JQuery;
    client: RestClient.WorkHttpClient2_2;
    _widgetHelpers: any;
    constructor(WidgetHelpers: any);
    load(widgetSettings: any, widgetConfigurationContext: any): void;
    PopulateBoardDropdown(): IPromise<WorkContracts.BoardReference[]>;
    GetProjectTemplate(): IPromise<string>;
    getCustomSettings(): {
        data: string;
    };
    onSave(): any;
}
