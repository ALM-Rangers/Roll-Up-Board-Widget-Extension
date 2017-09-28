import Services = require("VSS/Authentication/Services");

export class RollUpBoardServices {

    public static GetBacklogConfiguration(): IPromise<any> {
        let deferred = $.Deferred<any>();
        let authTokenManager = Services.authTokenManager;
        VSS.getAccessToken().then((token) => {
            let header = authTokenManager.getAuthorizationHeader(token);
            $.ajaxSetup({
                headers: { "Authorization": header }
            });

            let collectionUri = VSS.getWebContext().collection.uri;
            let teamproject = VSS.getWebContext().project.name;
            let teamName = VSS.getWebContext().team.name;
            $.ajax({
                url: collectionUri + teamproject + "/" + teamName + "/_apis/Work/BacklogConfiguration?api-version=3.0-preview.1",
                type: "GET",
                dataType: "json",
                success: c => {
                    deferred.resolve(c);
                }
            });
        });
        return deferred.promise();
    }

    public static CurrentBoardIsHidden(boardname: string, backlogconf: any): boolean {
        let currentportfolio = backlogconf.portfolioBacklogs.filter(f => f.name === boardname);
        if (currentportfolio.length > 0) {
            if (backlogconf.hiddenBacklogs.includes(currentportfolio[0].id)) {
                return true;
            }
        }

        // Backlog Items
        if (backlogconf.requirementBacklog.name === boardname) {
            if (backlogconf.hiddenBacklogs.includes(backlogconf.requirementBacklog.id)) {
                return true;
            }
        }
        return false;
    }

    public static CurrentBoardIsAvailable(boardname: string, backlogconf: any): boolean {
        let currentportfolio = backlogconf.portfolioBacklogs.filter(f => f.name === boardname);
        if (currentportfolio.length > 0) {
            return true;
        }

        // Backlog Items
        if (backlogconf.requirementBacklog.name === boardname) {
            return true;
        }
        return false;
    }

    public static GetBoardColor(boardname: string, backlogconf: any): string {
        let currentportfolio = backlogconf.portfolioBacklogs.filter(f => f.name === boardname);
        if (currentportfolio.length > 0) {
            return "#" + currentportfolio[0].color.substr(currentportfolio[0].color.length - 6);
            // ensure 6 char for the color code
        }

        // Backlog Items
        if (backlogconf.requirementBacklog.name === boardname) {
            return "#" + backlogconf.requirementBacklog.color.substr(backlogconf.requirementBacklog.color.length - 6);
        }
        return "#007acc";
    }

}