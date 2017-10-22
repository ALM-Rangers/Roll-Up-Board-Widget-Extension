import * as LDClient from "ldclient-js";
import Q = require("q");
export class LaunchDarklyService {

    // Private Settings to Tokenize
    private envId: string = "__LD_ENVID__";
    private static UriHashKey: string = "__AF_UriGetHashKey__";
    private static UriUpdateFlagUser: string = "__AF_UriUpdateFlagUser__";
    private static LDProject = " __LD_PROJECT__";
    private static LDEnv = " __LD_ENV__";

    // ----------------------------
    public ldClient: any;
    private static instance: LaunchDarklyService;
    public static user: any;
    public static flags: any;

    constructor() { }

    public static init(user: any, appToken: string, userid: string): Promise<LaunchDarklyService> {
        let deferred = Q.defer<LaunchDarklyService>();
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
            });
        }
        return deferred.promise;
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
    private static hashUserKey(user, hash: boolean, appToken: string, userid: string): Promise<string> {
        let deferred = Q.defer<string>();
        if (hash) {
            $.ajax({
                url: this.UriHashKey,
                type: "POST",
                headers: { "Access-Control-Allow-Origin": "*" },
                data: { account: "" + user.custom.account + "", token: "" + appToken + "" },
                success: c => {
                    deferred.resolve(c);
                }
            });
        } else {
            deferred.resolve(user.key);
        }
        return deferred.promise;
    }

    public static updateUserFeature(appToken: string, user, enable, feature): Promise<string> {
        let deferred = Q.defer<string>();
        if (user) {
            $.ajax({
                url: this.UriUpdateFlagUser,
                contentType: "application/json; charset=UTF-8",
                type: "POST",
                dataType: "json",
                headers: { "Access-Control-Allow-Origin": "*" },
                data: { token: "" + appToken + "", active: "" + enable + "", feature: "" + feature + "", ldproject: "" + this.LDProject + "", ldenv: "" + this.LDEnv + "", account: "" + user.custom.account + "" },
                success: c => {
                    deferred.resolve(c);
                }
            });
        } else {
            deferred.resolve(user.key);
        }
        return deferred.promise;
    }
}