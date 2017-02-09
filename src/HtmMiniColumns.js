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

function getXyzFromIndex(idx, rx, ry, rz) {
    var result = {};
    var a = (rz * rx)
    result.y = Math.floor(idx / a);
    var b = idx - a * result.y;
    result.x = Math.floor(b / rz);
    result.z = b % rz;
    return result;
}

function xyzToOneDimIndex(x, y, z, xMax, yMax, zMax) {
    var result = (z * xMax * yMax) + (y * xMax) + x;
    return result;
}


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
    var me = this;
    this.numColumns = numColumns;
    this.cellsPerColumn = cellsPerColumn;
    this.cellsPerRow = opts.cellsPerRow || 1;
    this.cells = [];
    _.times(this.getNumberOfCells(), function() {
        me.cells.push({color: 0});
    });
}

////////////////////////////////////////////////////////////////////////////////
// These functions operation from the context of the HTM system, not xyz. They
// are called by client code.
////////////////////////////////////////////////////////////////////////////////

HtmMiniColumns.prototype.getCellXyz = function(globalCellIndex) {
    var out = getXyzFromIndex(
        globalCellIndex, this.getX(), this.getY(), this.getZ()
    );
    if (out.x >= this.getX()) throw new Error('x out of bounds');
    if (out.y >= this.getY()) throw new Error('y out of bounds');
    if (out.z >= this.getZ()) throw new Error('z out of bounds');
    return out;
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
    return Math.ceil(this.numColumns / this.cellsPerRow);
};

HtmMiniColumns.prototype.getZ = function() {
    return this.cellsPerColumn;
};

HtmMiniColumns.prototype.getCellValue = function(x, y, z) {
    return this.cells[this.getCellIndex(x, y, z)];
};

HtmMiniColumns.prototype.getCellIndex = function(x, y, z) {
    return xyzToOneDimIndex(
        z, x, y,
        this.getZ(), this.getX(), this.getY()
    );
};

////////////////////////////////////////////////////////////////////////////////
// These update functions are called by client code to change the state of
// cells. They use the context of the HTM structure, not xyz.
////////////////////////////////////////////////////////////////////////////////

HtmMiniColumns.prototype.update = function(cellIndex, value) {
    var currentValue = this.cells[cellIndex];
    var proposedValue;
    for (var key in value) {
        proposedValue = value[key];
        if (proposedValue !== currentValue[key]) {
            currentValue[key] = proposedValue;
        }
    }
};

HtmMiniColumns.prototype.getNumberOfCells = function() {
    return this.numColumns * this.cellsPerColumn;
};

HtmMiniColumns.prototype.getCellsInColumn = function(columnIndex) {
    return _.filter(this.cells, function(cell) {
        return cell.columnIndex == columnIndex;
    });
};

/**
 * Updates all cell values to given value.
 * @param value {*} Whatever value you want the cells to have.
 */
HtmMiniColumns.prototype.updateAll = function(value) {
    var me = this;
    _.times(this.getNumberOfCells(), function(cellIndex) {
        me.update(cellIndex, value);
    });
};

module.exports = HtmMiniColumns;
