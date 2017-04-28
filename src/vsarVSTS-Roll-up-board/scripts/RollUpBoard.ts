// ---------------------------------------------------------------------
// <copyright file="RollUpBoard.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// </summary>
// ---------------------------------------------------------------------

 /// <reference types="vss-web-extension-sdk" />
"use strict";
import WorkContracts = require("TFS/Work/Contracts");

export class RollUpBoard {

    constructor() {
    }

    public columns: Array<Column>;
    public containsLanes: boolean;
    public nbrows: number;
    public nbswim: number;
    public containSplittedColumns: boolean = false;
    public link: string;
}

export class Column {

    constructor() {
    }

    public name: string;
    public order: number;
    public rows: Array<Row>;
    public isSplitted: boolean;
    public columnType: WorkContracts.BoardColumnType;
    public nbLimit: number;
    public nbwiSplitted: string[];
    public overMaxLimit: boolean;
    public totalWi: number;
}

export class Row {

    constructor() {
    }
    public name: string;
    public order: number;
    public nbwiSplitted: string[];
}