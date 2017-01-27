/*
# ----------------------------------------------------------------------
# Copyright (C) 2016, Numenta, Inc.  Unless you have an agreement
# with Numenta, Inc., for a separate license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU Affero Public License for more details.
#
# You should have received a copy of the GNU Affero Public License
# along with this program.  If not, see http://www.gnu.org/licenses.
#
# http://numenta.org/licenses/
# ----------------------------------------------------------------------
*/

/*******************************************************************************
 * HTM Mini-Columns
 *******************************************************************************/

/**
 * This interface is used to update cell data within the SpToInputVisualization.
 * Once created, use it to update cell values.
 * @param x (int) x dimension
 * @param y (int) y dimension
 * @param z (int) z dimension
 * @constructor
 */
function HtmMiniColumns(numColumns, cellsPerColumn, opts) {
    if (!opts) opts = {};
    this.numColumns = numColumns;
    this.cellsPerColumn = cellsPerColumn;
    this.cellsPerRow = opts.cellsPerRow || 1;
    // Create initially empty matrices.
    this.columns = [];
    var cells;
    var columnCellIndex = 0;
    var columnIndex = 0;
    for (; columnIndex < numColumns; columnIndex++) {
        cells = [];
        for (; columnCellIndex < cellsPerColumn; columnCellIndex++) {
            cells.push({color: 0});
        }
        this.columns.push(cells);
    }
}

////////////////////////////////////////////////////////////////////////////////
// These functions operation from the context of the HTM system, not xyz. They
// are called by client code.
////////////////////////////////////////////////////////////////////////////////

HtmMiniColumns.prototype.getNumColumns = function() {
    return this.numColumns;
};

HtmMiniColumns.prototype.getCellsPerColumn = function() {
    return this.cellsPerColumn;
};

HtmMiniColumns.prototype.getColumn = function(columnIndex) {
    return this.columns[columnIndex];
};

HtmMiniColumns.prototype.getCell = function(cellIndex) {
    var columnIndex = parseInt(Math.floor(cellIndex / this.numColumns));
    var cellIndex = columnIndex * this.cellsPerColumn + cellIndex;
    return this.columns[columnIndex][columnCellIndex];
};

////////////////////////////////////////////////////////////////////////////////
// These functions operate from the context of xyz space. They are called by
// cell-viz to render the drawing. These functions translate between the two
// contexts.
////////////////////////////////////////////////////////////////////////////////

HtmMiniColumns.prototype.getX = function() {
    return this.cellsPerRow;
};

HtmMiniColumns.prototype.getY = function() {
    return Math.ceil(this.getNumColumns() / this.cellsPerRow);
};

HtmMiniColumns.prototype.getZ = function() {
    return this.getCellsPerColumn();
};

HtmMiniColumns.prototype.getCellValue = function(x, y, z) {
    var columnIndex = x + y * this.cellsPerRow;
    var cellIndex = z;
    var column = this.getColumn(columnIndex);
    var out = undefined;
    if (column) {
        out = column[cellIndex];
    }
    // if (out) {
    //     console.log('%s,%s,%s: %s, %s, %s', x, y, z,
    //         out.color.r.toFixed(2), out.color.g.toFixed(2), out.color.b.toFixed(2));
    // }
    return out;
};

////////////////////////////////////////////////////////////////////////////////
// These update functions are called by client code to change the state of
// cells. They use the context of the HTM structure, not xyz.
////////////////////////////////////////////////////////////////////////////////

HtmMiniColumns.prototype.update = function(columnIndex, cellIndex, value, opts) {
    var column = this.getColumn(columnIndex);
    var currentValue = column[cellIndex];
    column[cellIndex] = value;
    // if (JSON.stringify(value) != JSON.stringify(currentValue)) {
    //     console.log('col %s cell %s ==> was %s now %s', columnIndex, cellIndex, JSON.stringify(currentValue), JSON.stringify(value));
    // }
};

/**
 * Updates all cell values to given value.
 * @param value {*} Whatever value you want the cells to have.
 */
HtmMiniColumns.prototype.updateAll = function(value, opts) {
    for (var columnIndex = 0; columnIndex < this.numColumns; columnIndex++) {
        for (var cellIndex = 0; cellIndex < this.cellsPerColumn; cellIndex++) {
            this.update(columnIndex, cellIndex, value, opts);
        }
    }
};

// HtmMiniColumns.prototype.peekUpdate = function(x, y, z, callback) {
//     var me = this;
//     var currentValue = this.getCellValue(x, y, z);
//     callback(currentValue, function(value) {
//         me.update(x, y, z, value);
//     });
// };
//
// HtmMiniColumns.prototype.peekUpdateAll = function(callback) {
//     var me = this;
//     for (var columnIndex = 0; columnIndex < this.xdim; columnIndex++) {
//         for (var cy = 0; cy < this.ydim; cy++) {
//             for (var cz = 0; cz < this.zdim; cz++) {
//                 me.peekUpdate(columnIndex, cy, cz, function(value, update) {
//                     callback(value, columnIndex, cy, cz, update);
//                 });
//             }
//         }
//     }
// };

module.exports = HtmMiniColumns;
