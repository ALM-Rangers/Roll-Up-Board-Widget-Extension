/// <reference path="../typings/tsd.d.ts" />
import WorkContracts = require("TFS/Work/Contracts");
export declare class RollUpBoard {
    constructor();
    columns: Array<Column>;
    containsLanes: boolean;
    nbrows: number;
    nbswim: number;
    containSplittedColumns: boolean;
    link: string;
}
export declare class Column {
    constructor();
    name: string;
    order: number;
    rows: Array<Row>;
    isSplitted: boolean;
    columnType: WorkContracts.BoardColumnType;
    nbLimit: number;
    nbwiSplitted: string[];
    overMaxLimit: boolean;
    totalWi: number;
}
export declare class Row {
    constructor();
    name: string;
    order: number;
    nbwiSplitted: string[];
}
