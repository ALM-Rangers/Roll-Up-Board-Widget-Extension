// ---------------------------------------------------------------------
// <copyright file="launchdarkly.servoices.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// </summary>
// ---------------------------------------------------------------------

export class LaunchDarklyService {

    // Private Settings to Tokenize
    /*private envId: string = "__LD_ENVID__";
    private static UriHashKey: string = "__AF_UriGetHashKey__";
    private static UriUpdateFlagUser: string = "__AF_UriUpdateFlagUser__";
    private static LdProject = "__LD_Project__";
    private static LdEnv = "__LD_Env__";
    private static UriGetUserFeatureFlags: string = "__AF_UriGetUserFlags__";
*/
    private envId: string = "590348c958ed570a3af8a496";
    private static UriHashKey: string = "https://vstsext-ff-dev.azurewebsites.net/api/GetHashKey";
    private static UriUpdateFlagUser: string = "https://vstsext-ff-dev.azurewebsites.net/api/UpdateUserFeatureFlag";
    private static LdProject = "default";
    private static LdEnv = "test";
    private static UriGetUserFeatureFlags = "https://vstsext-ff-dev.azurewebsites.net/api/GetUserFeatureFlag";
    private static sdkKey = "sdk-59baef5c-3851-4fef-a6a6-05a6e9c38ea9";
    private static AppSettingExtCert = "RollUpBoard_ExtensionCertificate";
    // ----------------------------

    public ldClient: any;
    private static instance: LaunchDarklyService;
    public static user: any;
    public static flags: any;

    constructor() { }

    public static InitUserFlags(user: any, appToken: string): IPromise<LaunchDarklyService> {
        let deferred = $.Deferred<LaunchDarklyService>();
        if (!this.instance) {
            this.instance = new LaunchDarklyService();
            this.GetUserFeatureFlags(user, appToken).then((f) => {
                console.log(f);
                this.flags = f;
                this.user = user;
                // console.log(this.user);
                deferred.resolve(this.instance);
            }, function (reject) { // e.g Error 500 for ""
                // console.log(reject);
                console.warn("RollUpBoard.LaunchDarlyServices.Init.AzureFunction.InitUserFlags: " + reject.status + " - " + reject.responseJSON);
                deferred.reject();
            });
        }
        return deferred.promise();
    }

    public static updateFlag(feature, value) {
        this.flags[feature] = value;
    }

    public static trackEvent(event: string) {
        this.instance.ldClient.track(event);
    }

    private static GetUserFeatureFlags(user, appToken: string): IPromise<string> {
        let deferred = $.Deferred<string>();
        let keys = user.key.split(":");
        $.ajax({
            url: this.UriGetUserFeatureFlags,
            type: "POST",
            headers: { "Access-Control-Allow-Origin": "*", "api-version": "2", "Authorization": "Bearer " + appToken },
            data: { account: "" + keys[1] + "", appsettingextcert: "" + this.AppSettingExtCert + "", ldkey: "" + this.sdkKey + "" },
            success: c => {
                deferred.resolve(c);
            },
            error: err => {
                deferred.reject(err);
            }
        });
        return deferred.promise();
    }

    public static updateUserFeature(appToken: string, user, enable, feature): IPromise<string> {
        let ldproject = this.LdProject;
        let ldenv = this.LdEnv;
        let keys = user.key.split(":");
        let deferred = $.Deferred<string>();
        if (user) {
            $.ajax({
                url: this.UriUpdateFlagUser,
                contentType: "application/json; charset=UTF-8",
                type: "POST",
                dataType: "json",
                headers: { "Access-Control-Allow-Origin": "*", "api-version": "2", "Authorization": "Bearer " + appToken },
                data: { active: "" + enable + "", feature: "" + feature + "", ldproject: "" + ldproject + "", ldenv: "" + ldenv + "", account: "" + keys[1] + "", appsettingextcert: "" + this.AppSettingExtCert + "" },
                success: c => {
                    deferred.resolve(c);
                },
                error: err => {
                    deferred.reject(err);
                }
            });
        } else {
            deferred.resolve(user.key);
        }
        return deferred.promise();
    }

    public static TrackEventFeatureFlags(user, appToken: string, customEvent: string): IPromise<string> {
        let deferred = $.Deferred<string>();
        let keys = user.key.split(":");
        $.ajax({
            url: this.UriGetUserFeatureFlags,
            type: "POST",
            headers: { "Access-Control-Allow-Origin": "*", "api-version": "2", "Authorization": "Bearer " + appToken },
            data: { account: "" + keys[1] + "", appsettingextcert: "" + this.AppSettingExtCert + "", ldkey: "" + this.sdkKey + "", customEvent: "" + customEvent + "" },
            success: c => {
                deferred.resolve(c);
            },
            error: err => {
                deferred.reject(err);
            }
        });
        return deferred.promise();
    }
}