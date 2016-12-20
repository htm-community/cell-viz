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

var HtmCells = require('./HtmCells');
var THREE = require('three');

var colors = {
    inactive: new THREE.Color('#FFFEEE'),
    active: new THREE.Color('#FFF000'),
    selected: new THREE.Color('red'),
    field: new THREE.Color('orange'),
    neighbors: new THREE.Color('#1E90FF'),
    input: new THREE.Color('green'),
    emptyInput: new THREE.Color('#F0FCEF')
};

function getActiveBits(sdr) {
    var active = [];
    _.each(sdr, function(bit, i) {
        if (bit == 1) active.push(i);
    });
    return active;
}

/* From http://stackoverflow.com/questions/7128675/from-green-to-red-color-depend-on-percentage */
function getGreenToRed(percent){
    var r, g;
    percent = 100 - percent;
    r = percent < 50 ? 255 : Math.floor(255-(percent*2-100)*255/100);
    g = percent > 50 ? 255 : Math.floor((percent*2)*255/100);
    return new THREE.Color(r, g, 0);
}

function averageRGB(c1, c2) {
    return c1.clone().lerp(c2, 0.5);
}

function translate(x, min, max) {
    var range = max - min;
    return (x - min) / range;
}

function xyzToOneDimIndex(x, y, z, xMax, yMax, zMax) {
    var result = (z * xMax * yMax) + (y * xMax) + x;
    // console.log('%s, %s, %s : %s', x, y, z, result);
    return result;
}

function cellXyToColumnIndex(x, y, xMax) {
    return y * xMax + x;
}


/*******************************************************************************
 * Public Interface.
 *******************************************************************************/

function HtmViz(inputDimensions, columnDimensions, cellsPerColumn) {
    this.inputCells = new HtmCells(
        inputDimensions[0], inputDimensions[1], 1
    );
    this.spCells = new HtmCells(
        columnDimensions[0], columnDimensions[1], cellsPerColumn
    );
    this.clearAllCells();
    this.viz = new SpToInputVisualization(inputCells, spColumns);
    this.viz.layerSpacing = 60;
    this.viz.render();
}

HtmViz.prototype.clearAllCells = function() {
    this.inputCells.updateAll({color: colors.emptyInput});
    this.spCells.updateAll({color: colors.inactive});
};


HtmViz.prototype.update = function(htmData, selectedCell) {
    var inputEncoding = htmData.inputEncoding;
    var activeColumns = htmData.activeColumns;
    var activeDutyCycles = htmData.activeDutyCycles;
    var overlapDutyCycles = htmData.overlapDutyCycles;
    var potentialPools  = htmData.potentialPools;
    var receptiveField;
    var inhibitionMasks  = htmData.inhibitionMasks;
    var neighbors;
    var dutyCycle, minDutyCycle, maxDutyCycle, percent;
    var cx, cy, cz;
    var thisCellIndex, thisColumnIndex;
    var xMax, yMax, zMax;
    var color = undefined;
    var inputCells = this.inputCells;
    var spCells = this.spCells;

    var activeColumnIndices = getActiveBits(activeColumns);
    //var activeColumnIndices = flip2dIndexList(activeColumnIndices, columnDimensions);

    xMax = inputCells.getX();
    yMax = inputCells.getY();
    zMax = inputCells.getZ();
    for (cx = 0; cx < xMax; cx++) {
        for (cy = 0; cy < yMax; cy++) {
            for (cz = 0; cz < zMax; cz++) {
                color = colors.emptyInput;
                thisCellIndex = xyzToOneDimIndex(cx, cy, cz, xMax, yMax, zMax);
                thisColumnIndex = cellXyToColumnIndex(cx, cy, xMax);
                if (inputEncoding[thisCellIndex] == 1) {
                    color = colors.input;
                }
                if (selectedCell !== undefined) {
                    receptiveField = potentialPools[selectedCell.columnIndex];
                    //receptiveField = flip2dIndexList(receptiveField , columnDimensions);
                    if (selectedCell != undefined && receptiveField.indexOf(thisColumnIndex) > -1) {
                        if (color == colors.input) {
                            color = averageRGB(color, colors.field);
                        } else {
                            color = colors.field;
                        }
                    }
                }
                inputCells.update(cx, cy, cz, {color: color});
            }
        }
    }

    xMax = spCells.getX();
    yMax = spCells.getY();
    zMax = spCells.getZ();
    for (cx = 0; cx < xMax; cx++) {
        for (cy = 0; cy < yMax; cy++) {
            for (cz = 0; cz < zMax; cz++) {
                color = colors.inactive;
                thisCellIndex = xyzToOneDimIndex(cx, cy, cz, xMax, yMax, zMax);
                thisColumnIndex = cellXyToColumnIndex(cx, cy, xMax);

                if (activeDutyCycles !== undefined) {
                    if (selectedCell !== undefined) {
                        neighbors = inhibitionMasks[selectedCell.columnIndex];
                        if (selectedCell.columnIndex == thisColumnIndex) {
                            color = colors.selected;
                        } else if (showNeighborhoods && selectedCell != undefined && neighbors.indexOf(thisColumnIndex) > -1) {
                            dutyCycle = activeDutyCycles[thisColumnIndex];
                            minDutyCycle = _.min(activeDutyCycles);
                            maxDutyCycle = _.max(activeDutyCycles);
                            percent = translate(dutyCycle, minDutyCycle, maxDutyCycle) * 100;
                            color = getGreenToRed(percent);
                            if (activeColumnIndices.indexOf(thisColumnIndex) > -1) {
                                color = color.lerp(new THREE.Color('#FFFFFF'), 0.75);
                            }
                        }
                    } else {
                        dutyCycle = activeDutyCycles[thisColumnIndex];
                        minDutyCycle = _.min(activeDutyCycles);
                        maxDutyCycle = _.max(activeDutyCycles);
                        percent = translate(dutyCycle, minDutyCycle, maxDutyCycle) * 100;
                        color = getGreenToRed(percent);
                        if (activeColumnIndices.indexOf(thisColumnIndex) > -1) {
                            color = color.lerp(new THREE.Color('#FFFFFF'), 0.75);
                        }
                    }
                } else if (overlapDutyCycles !== undefined) {
                    if (selectedCell !== undefined) {
                        neighbors = inhibitionMasks[selectedCell.columnIndex];
                        if (selectedCell.columnIndex == thisColumnIndex) {
                            color = colors.selected;
                        } else if (showNeighborhoods && selectedCell != undefined && neighbors.indexOf(thisColumnIndex) > -1) {
                            dutyCycle = overlapDutyCycles[thisColumnIndex];
                            minDutyCycle = _.min(overlapDutyCycles);
                            maxDutyCycle = _.max(overlapDutyCycles);
                            percent = translate(dutyCycle, minDutyCycle, maxDutyCycle) * 100;
                            color = getGreenToRed(percent);
                            if (activeColumnIndices.indexOf(thisColumnIndex) > -1) {
                                color = color.lerp(new THREE.Color('#FFFFFF'), 0.75);
                            }
                        }
                    } else {
                        dutyCycle = overlapDutyCycles[thisColumnIndex];
                        minDutyCycle = _.min(overlapDutyCycles);
                        maxDutyCycle = _.max(overlapDutyCycles);
                        percent = translate(dutyCycle, minDutyCycle, maxDutyCycle) * 100;
                        color = getGreenToRed(percent);
                        if (activeColumnIndices.indexOf(thisColumnIndex) > -1) {
                            color = color.lerp(new THREE.Color('#FFFFFF'), 0.75);
                        }

                    }
                } else {
                    if (activeColumnIndices.indexOf(thisColumnIndex) > -1) {
                        color = colors.active;
                    }
                    if (selectedCell !== undefined) {
                        neighbors = inhibitionMasks[selectedCell.columnIndex];
                        //neighbors = flip2dIndexList(neighbors, columnDimensions);
                        if (selectedCell.columnIndex == thisColumnIndex) {
                            color = colors.selected;
                        } else if (showNeighborhoods && neighbors.indexOf(thisColumnIndex) > -1) {
                            if (color == colors.active) {
                                color = averageRGB(color, colors.neighbors);
                            } else {
                                color = colors.neighbors;
                            }
                        }
                    }
                }
                spCells.update(cx, cy, cz, {color: color});
            }
        }
    }

    this.viz.redraw();
};

window.SingleLayerVisualization = require('./SingleLayerVisualization');
window.SpToInputVisualization = require('./SpToInputVisualization');
window.HtmCells = require('./HtmCells');
window.THREE = require('three');
