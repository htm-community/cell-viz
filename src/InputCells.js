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

function xyzToOneDimIndex(x, y, z, xMax, yMax, zMax) {
    var result = (z * xMax * yMax) + (y * xMax) + x;
    return result;
}

function getXyzFromIndex(idx, rx, ry, rz) {
    var result = {};
    var a = (rz * rx)
    result.y = Math.floor(idx / a);
    var b = idx - a * result.y;
    result.x = Math.floor(b / rz);
    result.z = b % rz;
    return result;
}


/*******************************************************************************
 * Input Cells
 *******************************************************************************/

/**
 * This interface is used to update cell data within the SpToInputVisualization.
 * Once created, use it to update cell values.
 * @param inputDimensions (array) same as you give the SP constructor.
 * @constructor
 */
function InputCells(inputDimensions, square) {
    this._inputDimensions = inputDimensions;

    // Defaults to one row.
    this.xdim = inputDimensions[0];
    this.ydim = 1;
    this.zdim = 1;

    if (square) {
        this.xdim = Math.floor(Math.sqrt(this.xdim));
        this.ydim = this.xdim;
    }

    this.cells = _.map(new Array(inputDimensions[0]), function(i) {
        return {color: 0, cellIndex: i};
    });
}

InputCells.prototype.getX = function() {
    return this.xdim;
};

InputCells.prototype.getY = function() {
    return this.ydim;
};

InputCells.prototype.getZ = function() {
    return this.zdim;
};

InputCells.prototype.getCellXyz = function(cellIndex) {
    var out = getXyzFromIndex(
        cellIndex, this.getX(), this.getY(), this.getZ()
    );
    if (out.x >= this.getX()) throw new Error('x out of bounds');
    if (out.y >= this.getY()) throw new Error('y out of bounds');
    if (out.z >= this.getZ()) throw new Error('z out of bounds');
    return out;
};

/**
 * Gets the value of the cell given the coordinates.
 * @param x (int) x coordinate
 * @param y (int) y coordinate
 * @param z (int) z coordinate
 * @returns {*} whatever value was in the cell
 */
InputCells.prototype.getCellValue = function(x, y, z) {
    return this.cells[xyzToOneDimIndex(x, y, z, this.xdim, this.ydim, this.zdim)];
};

/**
 * Allows user to update a cell's value.
 * @param value {*} should contain a color, perhaps more
 */
InputCells.prototype.update = function(index, value) {
    this.cells[index] = value;
};

/**
 * Updates all cell values to given value.
 * @param value {*} Whatever value you want the cells to have.
 */
InputCells.prototype.updateAll = function(value, opts) {
    this.cells = _.map(new Array(this._inputDimensions[0]), function() {
        return value;
    });
};

module.exports = InputCells;
