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
 * HTM Cells
 *******************************************************************************/

/**
 * This interface is used to update cell data within the SpToInputVisualization.
 * Once created, use it to update cell values.
 * @param x (int) x dimension
 * @param y (int) y dimension
 * @param z (int) z dimension
 * @constructor
 */
function HtmCells(x, y, z) {
    this.xdim = x;
    this.ydim = y;
    this.zdim = z;
    this.cells = [];

    // Create initially empty matrices.
    var ylist;
    var zlist;
    for (var cx = 0; cx < this.xdim; cx++) {
        ylist = [];
        for (var cy = 0; cy < this.ydim; cy++) {
            zlist = [];
            for (var cz = 0; cz < this.zdim; cz++) {
                zlist.push({color: 0});
            }
            ylist.push(zlist);
        }
        this.cells.push(ylist);
    }
}

HtmCells.prototype.getX = function() {
    return this.xdim;
};

HtmCells.prototype.getY = function() {
    return this.ydim;
};

HtmCells.prototype.getZ = function() {
    return this.zdim;
};

/**
 * Gets the value of the cell given the coordinates.
 * @param x (int) x coordinate
 * @param y (int) y coordinate
 * @param z (int) z coordinate
 * @returns {*} whatever value was in the cell
 */
HtmCells.prototype.getCellValue = function(x, y, z) {
    // TODO: raise error if cell coordinates are invalid.
    return this.cells[x][y][z];
};

/**
 * Allows user to update a cell's value.
 * @param x (int) x coordinate
 * @param y (int) y coordinate
 * @param z (int) z coordinate
 * @param value {*} should contain a color, perhaps more
 */
HtmCells.prototype.update = function(x, y, z, value, opts) {
    var currentValue = this.getCellValue(x, y, z);
    var proposedValue;
    for (var key in value) {
        proposedValue = value[key];
        if (opts && opts.replace && currentValue[key] == 0) {

        } else if (opts && opts.exclude && opts.exclude[key] && opts.exclude[key] == currentValue[key]) {
            // Do not overwrite.
        } else {
            currentValue[key] = proposedValue;
        }
    }
};

/**
 * Updates all cell values to given value.
 * @param value {*} Whatever value you want the cells to have.
 */
HtmCells.prototype.updateAll = function(value, opts) {
    for (var cx = 0; cx < this.xdim; cx++) {
        for (var cy = 0; cy < this.ydim; cy++) {
            for (var cz = 0; cz < this.zdim; cz++) {
                this.update(cx, cy, cz, value, opts);
            }
        }
    }
};

HtmCells.prototype.peekUpdate = function(x, y, z, callback) {
    var me = this;
    var currentValue = this.getCellValue(x, y, z);
    callback(currentValue, function(value) {
        me.update(x, y, z, value);
    });
};

HtmCells.prototype.peekUpdateAll = function(callback) {
    var me = this;
    for (var cx = 0; cx < this.xdim; cx++) {
        for (var cy = 0; cy < this.ydim; cy++) {
            for (var cz = 0; cz < this.zdim; cz++) {
                me.peekUpdate(cx, cy, cz, function(value, update) {
                    callback(value, cx, cy, cz, update);
                });
            }
        }
    }
};

module.exports = HtmCells;