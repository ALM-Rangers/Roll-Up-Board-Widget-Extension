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

import * as LDClient from "ldclient-js";
export class LaunchDarklyService {

    // Private Settings to Tokenize
    /* private envId: string = "__LD_ENVID__";
    private static UriHashKey: string = "__AF_UriGetHashKey__";
    private static UriUpdateFlagUser: string = "__AF_UriUpdateFlagUser__";
    private static LdProject = "__LD_Project";
    private static LdEnv = "__LD_Env__";*/

    private envId: string = "590348c958ed570a3af8a497";
    private static UriHashKey: string = "https://vstsext-ff-dev.azurewebsites.net/api/GetHashKey";
    private static UriUpdateFlagUser: string = "https://vstsext-ff-dev.azurewebsites.net/api/UpdateUserFlag";
    private static LdProject = "Default";
    private static LdEnv = "test";

    // ----------------------------
    public ldClient: any;
    private static instance: LaunchDarklyService;
    public static user: any;
    public static flags: any;

    constructor() { }

    public static init(user: any, appToken: string, userid: string): IPromise<LaunchDarklyService> {
        let deferred = $.Deferred<LaunchDarklyService>();
        if (!this.instance) {
            this.instance = new LaunchDarklyService();
            this.hashUserKey(user, true, appToken, userid).then((h) => {
                this.instance.ldClient = LDClient.initialize(this.instance.envId, user, {
                    hash: h
                });

                this.instance.ldClient.on("change", (flags) => {
                    this.setFlags();
                });
                this.user = user;
                // console.log(this.user);
                deferred.resolve(this.instance);
            }, function (reject) { // e.g Error 500 for ""
                // console.log(reject);
                console.warn("RollUpBoard.LaunchDarlyServices.Init.AzureFunction.GethashKey: " + reject.status + " - " + reject.responseJSON);
                deferred.reject();
            });
        }
        return deferred.promise();
    }

    public static setFlags() {
        this.flags = this.instance.ldClient.allFlags();
    }

    public static updateFlag(feature, value) {
        this.flags[feature] = value;
    }

    public static trackEvent(event: string) {
        this.instance.ldClient.track(event);
    }
    private static hashUserKey(user, hash: boolean, appToken: string, userid: string): IPromise<string> {
        let deferred = $.Deferred<string>();
        if (hash) {
            $.ajax({
                url: this.UriHashKey,
                type: "POST",
                headers: { "Access-Control-Allow-Origin": "*" },
                data: { account: "" + user.custom.account + "", token: "" + appToken + "" },
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

    public static updateUserFeature(appToken: string, user, enable, feature): IPromise<string> {
        let ldproject = this.LdProject;
        let ldenv = this.LdEnv;

        let deferred = $.Deferred<string>();
        if (user) {
            $.ajax({
                url: this.UriUpdateFlagUser,
                contentType: "application/json; charset=UTF-8",
                type: "POST",
                dataType: "json",
                headers: { "Access-Control-Allow-Origin": "*" },
                data: { token: "" + appToken + "", active: "" + enable + "", feature: "" + feature + "", ldproject: "" + ldproject + "", ldenv: "" + ldenv + "", account: "" + user.custom.account + "" },
                success: c => {
                    deferred.resolve(c);
                }
            });
        } else {
            deferred.resolve(user.key);
        }
        return deferred.promise();
    }
}