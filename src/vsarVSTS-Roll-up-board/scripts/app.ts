//---------------------------------------------------------------------
// <copyright file="app.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// </summary>
//---------------------------------------------------------------------


/// <reference path='../typings/jquery/jquery.d.ts' />
/// <reference path="../typings/tsd.d.ts" />
"use strict";
import Context = require("VSS/Context")
import RestClient = require("TFS/Work/RestClient");
import CoreContracts = require("TFS/Core/Contracts");
import WorkContracts = require("TFS/Work/Contracts");
import RestClientWI = require("TFS/WorkItemTracking/RestClient");
import WorkItemsContracts = require("TFS/WorkItemTracking/Contracts");
import Q = require("q");
import Board = require("scripts/RollUpBoard");



export class WidgetRollUpBoard {

    constructor(public WidgetHelpers) {
    }

    public client = RestClient.getClient();
    public clientwi = RestClientWI.getClient();
    public workItemsTypes: string = "";
    public currentTeamContext: CoreContracts.TeamContext;
    public boardColumnField: string = "";
    public boardDoneField: string = "";
    public boardRowField: string = "";


    IsVSTS(): boolean {
        return Context.getPageContext().webAccessConfiguration.isHosted;
    }

    EnableAppInsightTelemetry(): boolean {
        return this.IsVSTS();
    }

    public LoadRollUp(widgetSettings) {
        if (this.EnableAppInsightTelemetry()) {
            TelemetryClient.getClient().trackPageView("RollUpBoard.Index");
        } else {
            console.log("App Insight Telemetry is disabled")
        }

        var customSettings = <ISettings>JSON.parse(widgetSettings.customSettings.data);
        this.currentTeamContext = this.GetCurrentTeamContext();
        var $title = $('.title-header');
        $title.text(widgetSettings.name);
        if (customSettings) {
            $title.attr("style", "background-color:" + this.GetBoardColor(customSettings.board))

            $('#configwidget').attr("style", "display:none");
            $('#loadingwidget').attr("style", "display:block");
            $('#content').attr("style", "display:none");

            this.GetCurrentTeamFieldValues().then(() => { });
            let promises = [this.GetBoard(customSettings.board)];

            Q.all(promises).then((values: any[]) => {
                var b: Board.RollUpBoard = values[0];



                this.DisplayHtmlRollUpBoard(b);
                var wilink = VSS.getWebContext().host.uri + VSS.getWebContext().project.name + "/" + VSS.getWebContext().team.name + "/_backlogs/board/" + customSettings.board;
                $('.widget').off();
                $('.widget').on("click", function () {
                    VSS.getService(VSS.ServiceIds.Navigation).then((navigationService: any) => {
                        // Get current hash value from host url 
                        navigationService.openNewWindow(wilink);

                    });

                });

                $('#loadingwidget').attr("style", "display:none");
                $('#content').attr("style", "display:block")

                if (this.EnableAppInsightTelemetry()) {
                    TelemetryClient.getClient().trackEvent("RollUpBoard.LoadRollUp", { BoardName: customSettings.board });
                } else {
                    console.log("App Insight Telemetry is disabled")
                }

            }, function (reject) {
                if (this.EnableAppInsightTelemetry()) {
                    TelemetryClient.getClient().trackException(reject, "RollUpBoard.LoadRollUp");
                } else {
                    console.log("App Insight Telemetry is disabled")
                }
                console.log(reject);
            });
        } else {
            $title.attr("style", "color:grey")
            $('#content').attr("style", "display:none")
            $('#loadingwidget').attr("style", "display:none")
            $('#configwidget').attr("style", "display:block")
        }
        return this.WidgetHelpers.WidgetStatusHelper.Success();
    }

    private GetCurrentTeamFieldValues(): IPromise<WorkContracts.TeamFieldValue[]> {
        var deferred = $.Deferred<WorkContracts.TeamFieldValue[]>();
        this.client.getTeamFieldValues(this.GetCurrentTeamContext()).then((teamFieldValues) => {
            deferred.resolve(teamFieldValues.values);
        })

        return deferred.promise();
    }


    private GetBoard(boardName: string): IPromise<Board.RollUpBoard> {
        var deferred = Q.defer<Board.RollUpBoard>();

        var board = <Board.RollUpBoard>{};
        var columns: Board.Column[] = [];

        this.client.getBoard(this.currentTeamContext, boardName).then((infoboard) => {
            //console.log(infoboard);
            this.SetWorkItemTypeByBoard(infoboard);
            this.SetFieldsInfosCurrentBoard(infoboard);

            board.nbrows = 0;
            var colIndex = 0;
            if (infoboard.rows.length > 1) {
                board.nbrows = infoboard.rows.length * 2;
            }
            Q.all([this.GetCurrentTeamFieldValues()]).then((value: any) => {

                var teamfields = value[0];
                //console.log(teamfields);
                var promiseColumn = infoboard.columns.map((column) => {
                    colIndex++;
                    return this.SetArrayColumn(column, board, infoboard, colIndex, teamfields).then((col) => {
                        columns.push(col);

                    });

                });

                $.when.apply($, promiseColumn).then(() => {
                    board.columns = columns;
                    deferred.resolve(board);
                }, function (reject) {
                    if (this.EnableAppInsightTelemetry()) {
                        TelemetryClient.getClient().trackException(reject, "RollUpBoard.GetBoard");
                    }
                    else {
                        console.log("App Insight Telemetry is disabled")
                    }

                    console.log(reject);
                });

            });
        });
        return deferred.promise;
    }



    private ConstructTableHeader(board: Board.RollUpBoard, table: HTMLElement) {
        var trHeader = document.createElement("tr")
        trHeader.setAttribute("class", "theader");
        board.columns.sort(this.SortLowToHighColumn).forEach((c) => {

            var th = document.createElement("th");
            var divLeft = document.createElement("div");
            divLeft.setAttribute("class", "tableHeaderColName-left");
            divLeft.appendChild(document.createTextNode(c.name));
            th.appendChild(divLeft);

            if (c.columnType == WorkContracts.BoardColumnType.InProgress) {
                var divRight = document.createElement("div");

                divRight.setAttribute("class", "tableHeaderWiLimit-right");
                if (c.overMaxLimit)
                    divRight.setAttribute("style", "color:red");
                else
                    divRight.setAttribute("style", "color:green");


                var spanWiLimit = document.createElement("div");
                spanWiLimit.setAttribute("style", "color:black;display:inline");
                if (c.nbLimit > 0) {
                    spanWiLimit.appendChild(document.createTextNode("/" + c.nbLimit));
                }

                divRight.appendChild(document.createTextNode(c.totalWi.toString()))
                th.appendChild(divRight);
                th.appendChild(spanWiLimit);

                th.setAttribute("colspan", "2")

            }

            if (board.containSplittedColumns) {
                if (c.isSplitted == undefined || !c.isSplitted) {
                    th.setAttribute("rowspan", "2");
                }
            }
            trHeader.appendChild(th);
        });
        table.appendChild(trHeader);
    }

    private ConstructTableHeaderSplit(board: Board.RollUpBoard, table: HTMLElement) {
        var trHeaderSplit = document.createElement("tr")
        trHeaderSplit.setAttribute("class", "theader");
        board.columns.sort(this.SortLowToHighColumn).forEach((c) => {
            if (c.isSplitted) {

                var td = document.createElement("td");
                var columText = document.createTextNode("Doing");
                td.setAttribute("style", "color:#000;");
                td.appendChild(columText);
                trHeaderSplit.appendChild(td);

                var td = document.createElement("td");
                var columText = document.createTextNode("Done");
                td.setAttribute("style", "color:#000;");
                td.appendChild(columText);
                trHeaderSplit.appendChild(td);
            }
        });
        table.appendChild(trHeaderSplit);
    }

    private ConstructSingleRow(board: Board.RollUpBoard, table: HTMLElement) {
        var tr = document.createElement("tr");
        board.columns.forEach((col) => {
            if (col.isSplitted) {
                //doing
                var td = document.createElement("td");
                var columText = document.createTextNode(col.nbwiSplitted[1]);
                td.appendChild(columText);
                this.SetStyleTd(col, td);
                tr.appendChild(td);
                //done
                var td = document.createElement("td");
                var columText = document.createTextNode(col.nbwiSplitted[2]);
                td.appendChild(columText);
                this.SetStyleTd(col, td);
                tr.appendChild(td);
            } else {
                var td = document.createElement("td");
                var columText = document.createTextNode(col.nbwiSplitted[0]);
                if (col.columnType == WorkContracts.BoardColumnType.InProgress) {
                    td.setAttribute("colspan", "2");
                }
                td.appendChild(columText);
                this.SetStyleTd(col, td);
                tr.appendChild(td);
            }
        });
        table.appendChild(tr);
    }


    private IsNewOrDoneColumn(col: Board.Column): boolean {
        return col.columnType != WorkContracts.BoardColumnType.InProgress;
    }

    private ConstructCellForNewAndDoneWithSwimlanes(board: Board.RollUpBoard, col: Board.Column): HTMLTableDataCellElement {
        var td = document.createElement("td");
        var columText = document.createTextNode(col.nbwiSplitted[0]);
        td.setAttribute("rowspan", board.nbrows.toString());
        td.appendChild(columText);
        return td;
    }

    private ConstructRowSwimlaneHeader(col: Board.Column, board: Board.RollUpBoard, tr: HTMLTableRowElement, rowindex: number): HTMLTableDataCellElement {

        var td = document.createElement("td");

        var Text = col.rows.sort(this.SortLowToHighRow)[rowindex].name;
        td.setAttribute("colspan", ((board.columns.length - 2) * 2).toString());
        td.setAttribute("class", "swim");
        var columText = document.createTextNode(Text);
        td.appendChild(columText);

        return td;

    }

    private ConstructCellWithSwimlane(col: Board.Column, rowindex: number): HTMLTableDataCellElement {
        var td = document.createElement("td");
        var Text = col.rows.sort(this.SortLowToHighRow)[rowindex].nbwiSplitted[0];
        var columText = document.createTextNode(Text);
        td.appendChild(columText);
        if (col.columnType == WorkContracts.BoardColumnType.InProgress) {
            td.setAttribute("colspan", "2");
        }
        this.SetStyleTd(col, td);
        return td;
    }

    private ConstructCellWithSwimlaneAndSplittedColumn(col: Board.Column, rowindex: number, isDoing: boolean): HTMLTableDataCellElement {
        var td = document.createElement("td");
        var i = 1;
        if (!isDoing) {//Done column
            i = 2;
        }
        var Text = col.rows.sort(this.SortLowToHighRow)[rowindex].nbwiSplitted[i];
        var columText = document.createTextNode(Text);
        this.SetStyleTd(col, td);
        td.appendChild(columText);
        return td;
    }



    private SetStyleTd(col: Board.Column, td: HTMLTableDataCellElement) {

        if (col.overMaxLimit) {
            td.setAttribute("style", "color:red");
        }
    }

    private SetOverMaxLimit(column: Board.Column) {
        if (column.nbLimit == 0) { //no limit
            column.overMaxLimit = false;
        } else {
            if (column.totalWi > column.nbLimit) {
                column.overMaxLimit = true;
            } else {
                column.overMaxLimit = false;
            }
        }
    }

    private DisplayHtmlRollUpBoard(board: Board.RollUpBoard) {
        var table = document.getElementById("tableboard");
        table.innerHTML = "";
        //header
        this.ConstructTableHeader(board, table);
        //---------------

        //header split
        if (board.containSplittedColumns != undefined) {
            this.ConstructTableHeaderSplit(board, table);
        }
        //---------------

        var rowindex = 0;
        var isRowSwimlaneHeader: boolean = false;
        //If row swimlans exist
        if (board.nbrows > 0) {

            for (var i = 0; i < board.nbrows; i++) {
                if (i % 2 == 0 && board.nbrows > 1) {
                    isRowSwimlaneHeader = true;
                } else {
                    isRowSwimlaneHeader = false;
                }
                var tr = document.createElement("tr");

                var indexcol = 0;
                board.columns.forEach((c1) => {

                    if (this.IsNewOrDoneColumn(c1)) {
                        if (i == 0) { //first row
                            tr.appendChild(this.ConstructCellForNewAndDoneWithSwimlanes(board, c1));
                        }
                    } else {

                        var col = board.columns[indexcol];
                        var Text: string;

                        if (isRowSwimlaneHeader) {
                            tr.setAttribute("class", "trswim");

                            if (indexcol == 1)
                                tr.appendChild(this.ConstructRowSwimlaneHeader(col, board, tr, rowindex));
                        } else {

                            if (col.isSplitted) {
                                //doing

                                tr.appendChild(this.ConstructCellWithSwimlaneAndSplittedColumn(col, rowindex, true));
                                //done
                                tr.appendChild(this.ConstructCellWithSwimlaneAndSplittedColumn(col, rowindex, false));
                            } else {

                                tr.appendChild(this.ConstructCellWithSwimlane(col, rowindex));
                            }

                        }

                    }
                    indexcol++;
                });
                table.appendChild(tr);
                if (i % 2 != 0) {
                    rowindex = rowindex + 1;

                }
            }
        } else { //if not swimlanes ==> 1 row
            this.ConstructSingleRow(board, table);
        }
    }

    private GetTotalWiByColumn(col: Board.Column): number {
        var total: number = 0;
        if (col.rows != undefined) {
            col.rows.forEach((row) => {
                total = total + parseInt(row.nbwiSplitted[0]);
            });
        } else {
            total = parseInt(col.nbwiSplitted[0]);
        }
        return total;
    }

    private GetCurrentTeamContext(): CoreContracts.TeamContext {
        var currentTeamContext = <CoreContracts.TeamContext>{};
        currentTeamContext.projectId = VSS.getWebContext().project.id;
        currentTeamContext.project = VSS.getWebContext().project.name;
        currentTeamContext.teamId = VSS.getWebContext().team.id;
        currentTeamContext.team = VSS.getWebContext().team.name;
        return currentTeamContext;
    }

    //construct the column object with all informations
    private SetArrayColumn(boardcolumn: WorkContracts.BoardColumn, rollupboard: Board.RollUpBoard, board: WorkContracts.Board, index: number, teamfields: WorkContracts.TeamFieldValue[]): IPromise<Board.Column> {
        var deferred = $.Deferred<Board.Column>();

        var column = <Board.Column>{};
        column.name = boardcolumn.name;
        column.order = index;
        column.columnType = boardcolumn.columnType;
        column.isSplitted = boardcolumn.isSplit;
        column.nbLimit = boardcolumn.itemLimit;

        if (boardcolumn.isSplit && rollupboard.containSplittedColumns == undefined)
            rollupboard.containSplittedColumns = true;


        if (boardcolumn.columnType == WorkContracts.BoardColumnType.InProgress && this.isRowSwimlanes(board.rows)) {

            rollupboard.containsLanes = true;
            var rows: Board.Row[] = [];
            var rowIndex = 0;
            var promiseRow = board.rows.map((r) => {
                rowIndex++;
                //rollupboard.nbrows += 1;
                return this.SetArrayRow(boardcolumn, r, rowIndex, teamfields).then((row) => {
                    rows.push(row);
                });
            });
            $.when.apply($, promiseRow).then(() => {
                column.rows = rows;

                column.totalWi = this.GetTotalWiByColumn(column);

                this.SetOverMaxLimit(column);

                deferred.resolve(column);
            }, function (reject) {
                if (this.EnableAppInsightTelemetry()) {
                    TelemetryClient.getClient().trackException(reject, "RollUpBoard.SetArrayColumnWithRow");
                } else {
                    console.log("App Insight Telemetry is disabled")
                }
                console.log(reject);
            });
        } else {

            this.GetNbWIForColumnAndRow(boardcolumn, "NOROW", boardcolumn.isSplit, teamfields).then((nbwi) => {
                column.nbwiSplitted = nbwi;
                column.totalWi = this.GetTotalWiByColumn(column);
                if (boardcolumn.columnType == WorkContracts.BoardColumnType.InProgress) {
                    this.SetOverMaxLimit(column);
                }

                deferred.resolve(column);
            }, function (reject) {
                if (this.EnableAppInsightTelemetry()) {
                    TelemetryClient.getClient().trackException(reject, "RollUpBoard.SetArrayColumnSimple");
                } else {
                    console.log("App Insight Telemetry is disabled")
                }
                console.log(reject);
            });
        }

        return deferred.promise();
    }


    //nb wi for column and row
    private SetArrayRow(boardcolumn: WorkContracts.BoardColumn, boardrow: WorkContracts.BoardRow, index: number, teamfields: WorkContracts.TeamFieldValue[]): IPromise<Board.Row> {
        var deferred = $.Deferred<Board.Row>();


        this.GetNbWIForColumnAndRow(boardcolumn, boardrow.name, boardcolumn.isSplit, teamfields).then((nbwi) => {
            var row = <Board.Row>{};
            row.name = (boardrow.name != null) ? boardrow.name : "";
            row.order = index;
            row.nbwiSplitted = nbwi;
            deferred.resolve(row);
        }, function (r) {
            console.log(r);
        });
        return deferred.promise();
    }




    private GetNbWIForColumnAndRow(col: WorkContracts.BoardColumn, row: string, isSplit: boolean, teamfields: WorkContracts.TeamFieldValue[]): IPromise<string[]> {
        var debugInfo: Array<string | WorkItemsContracts.WorkItemReference[]> = [];
        var nbWi: string[] = [];
        var deferred = $.Deferred<string[]>();
        var wiql = <WorkItemsContracts.Wiql>{}

        var querySelect = "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = \"" + VSS.getWebContext().project.name + "\" AND [System.WorkItemType] IN (" + this.workItemsTypes + ")";


        //team area
        var filterTeamArea = " AND ( ";
        var i = 0;

        teamfields.forEach((fieldvalue) => {
            if (i > 0) {
                filterTeamArea = filterTeamArea.concat(" or ");
            }
            if (!fieldvalue.includeChildren) {
                filterTeamArea = filterTeamArea.concat("[System.AreaPath] = \"" + fieldvalue.value + "\"");
            } else {
                filterTeamArea = filterTeamArea.concat("[System.AreaPath] under \"" + fieldvalue.value + "\"");
            }
            i++;
        });

        filterTeamArea = filterTeamArea.concat(" ) ");

        querySelect = querySelect.concat(filterTeamArea);

        //old : System.BoardColumn
        var queryWhere = querySelect.concat(" and [" + this.boardColumnField + "] = \"" + col.name + "\"");
        if (row != "NOROW" && row != null) {
            //old : System.BoardLane
            queryWhere = queryWhere.concat(" and [" + this.boardRowField + "] = \"" + row + "\"");
        }
        else if (row == null && col.columnType == WorkContracts.BoardColumnType.InProgress) {//if name of the lane is empty for col type InProgress
            //old System.BoardLane
            queryWhere = queryWhere.concat(" and [" + this.boardRowField + "] = ''");
        }
        wiql.query = queryWhere;



        //total wi
        this.clientwi.queryByWiql(wiql, this.currentTeamContext.project, this.currentTeamContext.team).then((result) => {
            nbWi.push(result.workItems.length.toString());
            console.log("1: " + wiql.query);
            if (isSplit) {
                // old : System.BoardColumnDone
                wiql.query = queryWhere.concat(" AND [" + this.boardDoneField + "] = False");

                this.clientwi.queryByWiql(wiql, this.currentTeamContext.project, this.currentTeamContext.team).then((result1) => {
                    console.log("2: " + wiql.query);
                    nbWi.push(result1.workItems.length.toString());
                    // old : System.BoardColumnDone
                    wiql.query = queryWhere.concat(" AND [" + this.boardDoneField + "] = True");

                    this.clientwi.queryByWiql(wiql, this.currentTeamContext.project, this.currentTeamContext.team).then((result2) => {
                        nbWi.push(result2.workItems.length.toString());

                        console.log("3: " + wiql.query);//SHOW DEBUG
                        deferred.resolve(nbWi);
                    }, function (reject) {
                        if (this.EnableAppInsightTelemetry()) {
                            TelemetryClient.getClient().trackException(reject, "RollUpBoard.GetNbWIForColumnAndRow.ColumnDone");
                        } else {
                            console.log("App Insight Telemetry is disabled")
                        }
                        console.log(reject);
                    });
                });

            } else {
                deferred.resolve(nbWi);
            }
        }, function (reject) {
            if (this.EnableAppInsightTelemetry()) {
                TelemetryClient.getClient().trackException(reject, "RollUpBoard.GetNbWIForColumnAndRow");
            } else {
                console.log("App Insight Telemetry is disabled")
            }
            console.log(reject);
        });

        return deferred.promise();
    }


    //test if swimlanes
    private isRowSwimlanes(rows: WorkContracts.BoardRow[]): boolean {
        if (rows.length > 1)
            return true;
        else
            return false;
    }


    private SetWorkItemTypeByBoard(board: WorkContracts.Board) {
        this.workItemsTypes = "";
        for (let key in board.allowedMappings["Incoming"]) {
            if (this.workItemsTypes != "")
                this.workItemsTypes = this.workItemsTypes + ", \"" + key + "\"";
            else
                this.workItemsTypes = "\"" + key + "\"";
        }
    }

    private SetFieldsInfosCurrentBoard(board: WorkContracts.Board) {
        //Initialize with default values for keep TFS on-prem compatibility
        this.boardColumnField = "System.BoardColumn";
        this.boardRowField = "System.BoardLane";
        this.boardDoneField = "System.BoardColumnDone";


        if (board.fields != undefined) { //check the fields property for compatibility with TFS on-prem
            this.boardColumnField = board.fields.columnField.referenceName;
            this.boardDoneField = board.fields.doneField.referenceName;
            this.boardRowField = board.fields.rowField.referenceName;
        }

        console.log("this.boardColumnField : " + this.boardColumnField);
        console.log("this.boardDoneField : " + this.boardDoneField);
        console.log("this.boardRowField : " + this.boardRowField);
    }

    private SortLowToHighColumn(a: Board.Column, b: Board.Column) {
        return a.order - b.order;
    }
    private SortLowToHighRow(a: Board.Row, b: Board.Row) {
        return a.order - b.order;
    }

    private GetBoardColor(boardname: string) {
        switch (boardname) {
            case "Backlog items":
                return "#007acc"
            case "Features":
                return "#773B93"
            case "Epics":
                return "#FF7B00"
            default:
                return "#007acc"
        }
    }


    //Load and Reload Methods

    public load(widgetSettings) {
        return this.LoadRollUp(widgetSettings);
    }
    public reload(widgetSettings) {
        return this.LoadRollUp(widgetSettings);
    }

}
