// ---------------------------------------------------------------------
// <copyright file="TelemetryClientSettings.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// </summary>
// ---------------------------------------------------------------------

import * as tc from "telemetryclient-team-services-extension";

export const settings: tc.TelemetryClientSettings = {
    key: "__INSTRUMENTATIONKEY__",
    extensioncontext: "RollUpBoardWidget",
    disableTelemetry: "false",
    disableAjaxTracking: "__disableAjaxTracking__",
    enableDebug: "__enableDebug__"
};