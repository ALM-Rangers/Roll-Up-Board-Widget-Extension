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
define(["require", "exports", "VSS/Context", "TFS/Work/RestClient", "TFS/Work/Contracts", "TFS/WorkItemTracking/RestClient", "q"], function (require, exports, Context, RestClient, WorkContracts, RestClientWI, Q) {
    var WidgetRollUpBoard = (function () {
        function WidgetRollUpBoard(WidgetHelpers) {
            this.WidgetHelpers = WidgetHelpers;
            this.client = RestClient.getClient();
            this.clientwi = RestClientWI.getClient();
            this.workItemsTypes = "";
            this.boardColumnField = "";
            this.boardDoneField = "";
            this.boardRowField = "";
        }
        WidgetRollUpBoard.prototype.IsVSTS = function () {
            return Context.getPageContext().webAccessConfiguration.isHosted;
        };
        WidgetRollUpBoard.prototype.EnableAppInsightTelemetry = function () {
            return this.IsVSTS();
        };
        WidgetRollUpBoard.prototype.LoadRollUp = function (widgetSettings) {
            var _this = this;
            if (this.EnableAppInsightTelemetry()) {
                TelemetryClient.getClient().trackPageView("RollUpBoard.Index");
            }
            else {
                console.log("App Insight Telemetry is disabled");
            }
            var customSettings = JSON.parse(widgetSettings.customSettings.data);
            this.currentTeamContext = this.GetCurrentTeamContext();
            var $title = $('.title-header');
            $title.text(widgetSettings.name);
            if (customSettings) {
                $title.attr("style", "background-color:" + this.GetBoardColor(customSettings.board));
                $('#configwidget').attr("style", "display:none");
                $('#loadingwidget').attr("style", "display:block");
                $('#content').attr("style", "display:none");
                this.GetCurrentTeamFieldValues().then(function () { });
                var promises = [this.GetBoard(customSettings.board)];
                Q.all(promises).then(function (values) {
                    var b = values[0];
                    _this.DisplayHtmlRollUpBoard(b);
                    var wilink = VSS.getWebContext().host.uri + VSS.getWebContext().project.name + "/" + VSS.getWebContext().team.name + "/_backlogs/board/" + customSettings.board;
                    $('.widget').off();
                    $('.widget').on("click", function () {
                        VSS.getService(VSS.ServiceIds.Navigation).then(function (navigationService) {
                            // Get current hash value from host url 
                            navigationService.openNewWindow(wilink);
                        });
                    });
                    $('#loadingwidget').attr("style", "display:none");
                    $('#content').attr("style", "display:block");
                    if (_this.EnableAppInsightTelemetry()) {
                        TelemetryClient.getClient().trackEvent("RollUpBoard.LoadRollUp", { BoardName: customSettings.board });
                    }
                    else {
                        console.log("App Insight Telemetry is disabled");
                    }
                }, function (reject) {
                    if (this.EnableAppInsightTelemetry()) {
                        TelemetryClient.getClient().trackException(reject, "RollUpBoard.LoadRollUp");
                    }
                    else {
                        console.log("App Insight Telemetry is disabled");
                    }
                    console.log(reject);
                });
            }
            else {
                $title.attr("style", "color:grey");
                $('#content').attr("style", "display:none");
                $('#loadingwidget').attr("style", "display:none");
                $('#configwidget').attr("style", "display:block");
            }
            return this.WidgetHelpers.WidgetStatusHelper.Success();
        };
        WidgetRollUpBoard.prototype.GetCurrentTeamFieldValues = function () {
            var deferred = $.Deferred();
            this.client.getTeamFieldValues(this.GetCurrentTeamContext()).then(function (teamFieldValues) {
                deferred.resolve(teamFieldValues.values);
            });
            return deferred.promise();
        };
        WidgetRollUpBoard.prototype.GetBoard = function (boardName) {
            var _this = this;
            var deferred = Q.defer();
            var board = {};
            var columns = [];
            this.client.getBoard(this.currentTeamContext, boardName).then(function (infoboard) {
                //console.log(infoboard);
                _this.SetWorkItemTypeByBoard(infoboard);
                _this.SetFieldsInfosCurrentBoard(infoboard);
                board.nbrows = 0;
                var colIndex = 0;
                if (infoboard.rows.length > 1) {
                    board.nbrows = infoboard.rows.length * 2;
                }
                Q.all([_this.GetCurrentTeamFieldValues()]).then(function (value) {
                    var teamfields = value[0];
                    //console.log(teamfields);
                    var promiseColumn = infoboard.columns.map(function (column) {
                        colIndex++;
                        return _this.SetArrayColumn(column, board, infoboard, colIndex, teamfields).then(function (col) {
                            columns.push(col);
                        });
                    });
                    $.when.apply($, promiseColumn).then(function () {
                        board.columns = columns;
                        deferred.resolve(board);
                    }, function (reject) {
                        if (this.EnableAppInsightTelemetry()) {
                            TelemetryClient.getClient().trackException(reject, "RollUpBoard.GetBoard");
                        }
                        else {
                            console.log("App Insight Telemetry is disabled");
                        }
                        console.log(reject);
                    });
                });
            });
            return deferred.promise;
        };
        WidgetRollUpBoard.prototype.ConstructTableHeader = function (board, table) {
            var trHeader = document.createElement("tr");
            trHeader.setAttribute("class", "theader");
            board.columns.sort(this.SortLowToHighColumn).forEach(function (c) {
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
                    divRight.appendChild(document.createTextNode(c.totalWi.toString()));
                    th.appendChild(divRight);
                    th.appendChild(spanWiLimit);
                    th.setAttribute("colspan", "2");
                }
                if (board.containSplittedColumns) {
                    if (c.isSplitted == undefined || !c.isSplitted) {
                        th.setAttribute("rowspan", "2");
                    }
                }
                trHeader.appendChild(th);
            });
            table.appendChild(trHeader);
        };
        WidgetRollUpBoard.prototype.ConstructTableHeaderSplit = function (board, table) {
            var trHeaderSplit = document.createElement("tr");
            trHeaderSplit.setAttribute("class", "theader");
            board.columns.sort(this.SortLowToHighColumn).forEach(function (c) {
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
        };
        WidgetRollUpBoard.prototype.ConstructSingleRow = function (board, table) {
            var _this = this;
            var tr = document.createElement("tr");
            board.columns.forEach(function (col) {
                if (col.isSplitted) {
                    //doing
                    var td = document.createElement("td");
                    var columText = document.createTextNode(col.nbwiSplitted[1]);
                    td.appendChild(columText);
                    _this.SetStyleTd(col, td);
                    tr.appendChild(td);
                    //done
                    var td = document.createElement("td");
                    var columText = document.createTextNode(col.nbwiSplitted[2]);
                    td.appendChild(columText);
                    _this.SetStyleTd(col, td);
                    tr.appendChild(td);
                }
                else {
                    var td = document.createElement("td");
                    var columText = document.createTextNode(col.nbwiSplitted[0]);
                    if (col.columnType == WorkContracts.BoardColumnType.InProgress) {
                        td.setAttribute("colspan", "2");
                    }
                    td.appendChild(columText);
                    _this.SetStyleTd(col, td);
                    tr.appendChild(td);
                }
            });
            table.appendChild(tr);
        };
        WidgetRollUpBoard.prototype.IsNewOrDoneColumn = function (col) {
            return col.columnType != WorkContracts.BoardColumnType.InProgress;
        };
        WidgetRollUpBoard.prototype.ConstructCellForNewAndDoneWithSwimlanes = function (board, col) {
            var td = document.createElement("td");
            var columText = document.createTextNode(col.nbwiSplitted[0]);
            td.setAttribute("rowspan", board.nbrows.toString());
            td.appendChild(columText);
            return td;
        };
        WidgetRollUpBoard.prototype.ConstructRowSwimlaneHeader = function (col, board, tr, rowindex) {
            var td = document.createElement("td");
            var Text = col.rows.sort(this.SortLowToHighRow)[rowindex].name;
            td.setAttribute("colspan", ((board.columns.length - 2) * 2).toString());
            td.setAttribute("class", "swim");
            var columText = document.createTextNode(Text);
            td.appendChild(columText);
            return td;
        };
        WidgetRollUpBoard.prototype.ConstructCellWithSwimlane = function (col, rowindex) {
            var td = document.createElement("td");
            var Text = col.rows.sort(this.SortLowToHighRow)[rowindex].nbwiSplitted[0];
            var columText = document.createTextNode(Text);
            td.appendChild(columText);
            if (col.columnType == WorkContracts.BoardColumnType.InProgress) {
                td.setAttribute("colspan", "2");
            }
            this.SetStyleTd(col, td);
            return td;
        };
        WidgetRollUpBoard.prototype.ConstructCellWithSwimlaneAndSplittedColumn = function (col, rowindex, isDoing) {
            var td = document.createElement("td");
            var i = 1;
            if (!isDoing) {
                i = 2;
            }
            var Text = col.rows.sort(this.SortLowToHighRow)[rowindex].nbwiSplitted[i];
            var columText = document.createTextNode(Text);
            this.SetStyleTd(col, td);
            td.appendChild(columText);
            return td;
        };
        WidgetRollUpBoard.prototype.SetStyleTd = function (col, td) {
            if (col.overMaxLimit) {
                td.setAttribute("style", "color:red");
            }
        };
        WidgetRollUpBoard.prototype.SetOverMaxLimit = function (column) {
            if (column.nbLimit == 0) {
                column.overMaxLimit = false;
            }
            else {
                if (column.totalWi > column.nbLimit) {
                    column.overMaxLimit = true;
                }
                else {
                    column.overMaxLimit = false;
                }
            }
        };
        WidgetRollUpBoard.prototype.DisplayHtmlRollUpBoard = function (board) {
            var _this = this;
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
            var isRowSwimlaneHeader = false;
            //If row swimlans exist
            if (board.nbrows > 0) {
                for (var i = 0; i < board.nbrows; i++) {
                    if (i % 2 == 0 && board.nbrows > 1) {
                        isRowSwimlaneHeader = true;
                    }
                    else {
                        isRowSwimlaneHeader = false;
                    }
                    var tr = document.createElement("tr");
                    var indexcol = 0;
                    board.columns.forEach(function (c1) {
                        if (_this.IsNewOrDoneColumn(c1)) {
                            if (i == 0) {
                                tr.appendChild(_this.ConstructCellForNewAndDoneWithSwimlanes(board, c1));
                            }
                        }
                        else {
                            var col = board.columns[indexcol];
                            var Text;
                            if (isRowSwimlaneHeader) {
                                tr.setAttribute("class", "trswim");
                                if (indexcol == 1)
                                    tr.appendChild(_this.ConstructRowSwimlaneHeader(col, board, tr, rowindex));
                            }
                            else {
                                if (col.isSplitted) {
                                    //doing
                                    tr.appendChild(_this.ConstructCellWithSwimlaneAndSplittedColumn(col, rowindex, true));
                                    //done
                                    tr.appendChild(_this.ConstructCellWithSwimlaneAndSplittedColumn(col, rowindex, false));
                                }
                                else {
                                    tr.appendChild(_this.ConstructCellWithSwimlane(col, rowindex));
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
            }
            else {
                this.ConstructSingleRow(board, table);
            }
        };
        WidgetRollUpBoard.prototype.GetTotalWiByColumn = function (col) {
            var total = 0;
            if (col.rows != undefined) {
                col.rows.forEach(function (row) {
                    total = total + parseInt(row.nbwiSplitted[0]);
                });
            }
            else {
                total = parseInt(col.nbwiSplitted[0]);
            }
            return total;
        };
        WidgetRollUpBoard.prototype.GetCurrentTeamContext = function () {
            var currentTeamContext = {};
            currentTeamContext.projectId = VSS.getWebContext().project.id;
            currentTeamContext.project = VSS.getWebContext().project.name;
            currentTeamContext.teamId = VSS.getWebContext().team.id;
            currentTeamContext.team = VSS.getWebContext().team.name;
            return currentTeamContext;
        };
        //construct the column object with all informations
        WidgetRollUpBoard.prototype.SetArrayColumn = function (boardcolumn, rollupboard, board, index, teamfields) {
            var _this = this;
            var deferred = $.Deferred();
            var column = {};
            column.name = boardcolumn.name;
            column.order = index;
            column.columnType = boardcolumn.columnType;
            column.isSplitted = boardcolumn.isSplit;
            column.nbLimit = boardcolumn.itemLimit;
            if (boardcolumn.isSplit && rollupboard.containSplittedColumns == undefined)
                rollupboard.containSplittedColumns = true;
            if (boardcolumn.columnType == WorkContracts.BoardColumnType.InProgress && this.isRowSwimlanes(board.rows)) {
                rollupboard.containsLanes = true;
                var rows = [];
                var rowIndex = 0;
                var promiseRow = board.rows.map(function (r) {
                    rowIndex++;
                    //rollupboard.nbrows += 1;
                    return _this.SetArrayRow(boardcolumn, r, rowIndex, teamfields).then(function (row) {
                        rows.push(row);
                    });
                });
                $.when.apply($, promiseRow).then(function () {
                    column.rows = rows;
                    column.totalWi = _this.GetTotalWiByColumn(column);
                    _this.SetOverMaxLimit(column);
                    deferred.resolve(column);
                }, function (reject) {
                    if (this.EnableAppInsightTelemetry()) {
                        TelemetryClient.getClient().trackException(reject, "RollUpBoard.SetArrayColumnWithRow");
                    }
                    else {
                        console.log("App Insight Telemetry is disabled");
                    }
                    console.log(reject);
                });
            }
            else {
                this.GetNbWIForColumnAndRow(boardcolumn, "NOROW", boardcolumn.isSplit, teamfields).then(function (nbwi) {
                    column.nbwiSplitted = nbwi;
                    column.totalWi = _this.GetTotalWiByColumn(column);
                    if (boardcolumn.columnType == WorkContracts.BoardColumnType.InProgress) {
                        _this.SetOverMaxLimit(column);
                    }
                    deferred.resolve(column);
                }, function (reject) {
                    if (this.EnableAppInsightTelemetry()) {
                        TelemetryClient.getClient().trackException(reject, "RollUpBoard.SetArrayColumnSimple");
                    }
                    else {
                        console.log("App Insight Telemetry is disabled");
                    }
                    console.log(reject);
                });
            }
            return deferred.promise();
        };
        //nb wi for column and row
        WidgetRollUpBoard.prototype.SetArrayRow = function (boardcolumn, boardrow, index, teamfields) {
            var deferred = $.Deferred();
            this.GetNbWIForColumnAndRow(boardcolumn, boardrow.name, boardcolumn.isSplit, teamfields).then(function (nbwi) {
                var row = {};
                row.name = (boardrow.name != null) ? boardrow.name : "";
                row.order = index;
                row.nbwiSplitted = nbwi;
                deferred.resolve(row);
            }, function (r) {
                console.log(r);
            });
            return deferred.promise();
        };
        WidgetRollUpBoard.prototype.GetNbWIForColumnAndRow = function (col, row, isSplit, teamfields) {
            var _this = this;
            var debugInfo = [];
            var nbWi = [];
            var deferred = $.Deferred();
            var wiql = {};
            var querySelect = "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = \"" + VSS.getWebContext().project.name + "\" AND [System.WorkItemType] IN (" + this.workItemsTypes + ")";
            //team area
            var filterTeamArea = " AND ( ";
            var i = 0;
            teamfields.forEach(function (fieldvalue) {
                if (i > 0) {
                    filterTeamArea = filterTeamArea.concat(" or ");
                }
                if (!fieldvalue.includeChildren) {
                    filterTeamArea = filterTeamArea.concat("[System.AreaPath] = \"" + fieldvalue.value + "\"");
                }
                else {
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
            else if (row == null && col.columnType == WorkContracts.BoardColumnType.InProgress) {
                //old System.BoardLane
                queryWhere = queryWhere.concat(" and [" + this.boardRowField + "] = ''");
            }
            wiql.query = queryWhere;
            //total wi
            this.clientwi.queryByWiql(wiql, this.currentTeamContext.project, this.currentTeamContext.team).then(function (result) {
                nbWi.push(result.workItems.length.toString());
                console.log("1: " + wiql.query);
                if (isSplit) {
                    // old : System.BoardColumnDone
                    wiql.query = queryWhere.concat(" AND [" + _this.boardDoneField + "] = False");
                    _this.clientwi.queryByWiql(wiql, _this.currentTeamContext.project, _this.currentTeamContext.team).then(function (result1) {
                        console.log("2: " + wiql.query);
                        nbWi.push(result1.workItems.length.toString());
                        // old : System.BoardColumnDone
                        wiql.query = queryWhere.concat(" AND [" + _this.boardDoneField + "] = True");
                        _this.clientwi.queryByWiql(wiql, _this.currentTeamContext.project, _this.currentTeamContext.team).then(function (result2) {
                            nbWi.push(result2.workItems.length.toString());
                            console.log("3: " + wiql.query); //SHOW DEBUG
                            deferred.resolve(nbWi);
                        }, function (reject) {
                            if (this.EnableAppInsightTelemetry()) {
                                TelemetryClient.getClient().trackException(reject, "RollUpBoard.GetNbWIForColumnAndRow.ColumnDone");
                            }
                            else {
                                console.log("App Insight Telemetry is disabled");
                            }
                            console.log(reject);
                        });
                    });
                }
                else {
                    deferred.resolve(nbWi);
                }
            }, function (reject) {
                if (this.EnableAppInsightTelemetry()) {
                    TelemetryClient.getClient().trackException(reject, "RollUpBoard.GetNbWIForColumnAndRow");
                }
                else {
                    console.log("App Insight Telemetry is disabled");
                }
                console.log(reject);
            });
            return deferred.promise();
        };
        //test if swimlanes
        WidgetRollUpBoard.prototype.isRowSwimlanes = function (rows) {
            if (rows.length > 1)
                return true;
            else
                return false;
        };
        WidgetRollUpBoard.prototype.SetWorkItemTypeByBoard = function (board) {
            this.workItemsTypes = "";
            for (var key in board.allowedMappings["Incoming"]) {
                if (this.workItemsTypes != "")
                    this.workItemsTypes = this.workItemsTypes + ", \"" + key + "\"";
                else
                    this.workItemsTypes = "\"" + key + "\"";
            }
        };
        WidgetRollUpBoard.prototype.SetFieldsInfosCurrentBoard = function (board) {
            //Initialize with default values for keep TFS on-prem compatibility
            this.boardColumnField = "System.BoardColumn";
            this.boardRowField = "System.BoardLane";
            this.boardDoneField = "System.BoardColumnDone";
            if (board.fields != undefined) {
                this.boardColumnField = board.fields.columnField.referenceName;
                this.boardDoneField = board.fields.doneField.referenceName;
                this.boardRowField = board.fields.rowField.referenceName;
            }
            console.log("this.boardColumnField : " + this.boardColumnField);
            console.log("this.boardDoneField : " + this.boardDoneField);
            console.log("this.boardRowField : " + this.boardRowField);
        };
        WidgetRollUpBoard.prototype.SortLowToHighColumn = function (a, b) {
            return a.order - b.order;
        };
        WidgetRollUpBoard.prototype.SortLowToHighRow = function (a, b) {
            return a.order - b.order;
        };
        WidgetRollUpBoard.prototype.GetBoardColor = function (boardname) {
            switch (boardname) {
                case "Backlog items":
                    return "#007acc";
                case "Features":
                    return "#773B93";
                case "Epics":
                    return "#FF7B00";
                default:
                    return "#007acc";
            }
        };
        //Load and Reload Methods
        WidgetRollUpBoard.prototype.load = function (widgetSettings) {
            return this.LoadRollUp(widgetSettings);
        };
        WidgetRollUpBoard.prototype.reload = function (widgetSettings) {
            return this.LoadRollUp(widgetSettings);
        };
        return WidgetRollUpBoard;
    })();
    exports.WidgetRollUpBoard = WidgetRollUpBoard;
});
//# sourceMappingURL=app.js.map