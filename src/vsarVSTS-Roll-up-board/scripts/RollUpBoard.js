//---------------------------------------------------------------------
// <copyright file="RollUpBoard.ts">
//    This code is licensed under the MIT License.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF 
//    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED 
//    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
//    PARTICULAR PURPOSE AND NONINFRINGEMENT.
// </copyright>
// <summary>
// </summary>
//---------------------------------------------------------------------
define(["require", "exports"], function (require, exports) {
    /// <reference path="../typings/tsd.d.ts" />
    "use strict";
    var RollUpBoard = (function () {
        function RollUpBoard() {
            this.containSplittedColumns = false;
        }
        return RollUpBoard;
    }());
    exports.RollUpBoard = RollUpBoard;
    var Column = (function () {
        function Column() {
        }
        return Column;
    }());
    exports.Column = Column;
    var Row = (function () {
        function Row() {
        }
        return Row;
    }());
    exports.Row = Row;
});
