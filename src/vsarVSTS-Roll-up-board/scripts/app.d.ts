/// <reference path="../typings/tsd.d.ts" />
import RestClient = require("TFS/Work/RestClient");
import RestClientWI = require("TFS/WorkItemTracking/RestClient");
import WorkItemsContracts = require("TFS/WorkItemTracking/Contracts");
export declare class WidgetRollUpBoard {
    WidgetHelpers: any;
    constructor(WidgetHelpers: any);
    client: RestClient.WorkHttpClient2_2;
    clientwi: RestClientWI.WorkItemTrackingHttpClient2_2;
    workItemsTypes: string;
    public: WorkItemsContracts.WorkItem[];
    LoadRollUp(widgetSettings: any): any;
    private ConstructTableHeader(board, table);
    private ConstructTableHeaderSplit(board, table);
    private ConstructSingleRow(board, table);
    private IsNewOrDoneColumn(col);
    private ConstructCellForNewAndDoneWithSwimlanes(board, col);
    private ConstructRowSwimlaneHeader(col, board, tr, rowindex);
    private ConstructCellWithSwimlane(col, rowindex);
    private ConstructCellWithSwimlaneAndSplittedColumn(col, rowindex, isDoing);
    private SetStyleTd(col, td);
    private SetOverMaxLimit(column);
    private DisplayHtmlRollUpBoard(board);
    private GetTotalWiByColumn(col);
    private GetBoard(boardName);
    private SetArrayColumn(boardcolumn, rollupboard, board, index);
    private SetArrayRow(boardcolumn, boardrow, index);
    private GetNbWIForColumnAndRow(col, row, isSplit);
    private GetAllWiInBoard();
    private isRowSwimlanes(rows);
    private SetWorkItemTypeByBoard(board);
    private SortLowToHighColumn(a, b);
    private SortLowToHighRow(a, b);
    private GetBoardColor(boardname);
    load(widgetSettings: any): any;
    reload(widgetSettings: any): any;
}
