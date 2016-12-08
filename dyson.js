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

var mathjs = require('mathjs');
var THREE = require('three');
var OBJLoader = require('three-obj-loader');
var TrackballControls = require('three-trackballcontrols');
var ColladaLoader = require('three-collada-loader');


// I don't want to restrict what can be stored inside an HtmCell, so this will
// keep it generic for now (client knows how to load / unload the cell value).
function htmCellValueToColor(cellValue, colors) {
    var color = colors[cellValue.color];
    if (color == undefined) {
        throw new Error(
            'Cannot convert cell value "' + cellValue + '" into a color.' +
            'Known colors are: \n' + JSON.stringify(colors, null, 2)
        );
    }
    return color;
}

function getOffsetCenterPosition(cells, spacing) {
    return {
        x: 0 - (cells.getX() * spacing) / 2,
        y: 0 + (cells.getY() * spacing) / 2,
        z: 0
    };
}

/*******************************************************************************
 * BASE VIZ class
 *******************************************************************************/

/**
 *
 * @param opts (Object) Can contain 'geometry', 'spacing', 'colors', 'elementId'
 * @constructor
 */
function BaseGridVisualization(opts) {
    if (!opts) opts = {};

    this.geometry = opts.geometry;
    this.spacing = opts.spacing;
    this.colors = opts.colors;
    this.width = undefined;
    this.height = undefined;
    this.$container = undefined;
    this.camera = undefined;
    this.controls = undefined;
    this.light = undefined;
    this.scene = undefined;
    this.renderer = undefined;
    this.loader = new ColladaLoader();
    this.projector = new THREE.Projector();
    this.targets = [];

    this.loader.options.centerGeometry = true;

    // Use a default geometry.
    if (! this.geometry) {
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    // Use a default spacing.
    if (! this.spacing) {
        this.spacing = 1.25;
    }
    // Use default colors;
    if (! this.colors) {
        this.colors = {
            0: 0xffffff, // white
            1: 0xffff00, // yellow
            2: 0xff0000  // red
        };
    }

    this._setupContainer(opts.elementId);
    this._setupCamera();
    this._setupScene();
    this._setupControls();
}

BaseGridVisualization.prototype._setupContainer = function(elementId) {
    if (elementId) {
        this.$container = $('#' + elementId);
        this.width = this.$container.innerWidth();
        this.height = this.$container.innerHeight();
    } else {
        this.$container = $('body');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }
};

BaseGridVisualization.prototype._setupCamera = function() {
    // Set up camera position.
    this.camera = new THREE.PerspectiveCamera(
        60, this.width / this.height, 1, 1000
    );
    this.camera.position.z = 50;
};

BaseGridVisualization.prototype._setupControls = function() {
    this.controls = new TrackballControls(this.camera, this.renderer.domElement);
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
    this.controls.keys = [ 65, 83, 68 ];
};

BaseGridVisualization.prototype._setupScene = function() {
    var scene;
    var renderer;
    this.scene = new THREE.Scene();
    scene = this.scene;
    this.light = new THREE.PointLight(0xFFFFFF);
    scene.add(this.light);

    renderer = this.renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xf0f0f0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.width, this.height);
    this.$container.append(renderer.domElement);
};

/*
 * Creates all the geometries within the grid. These are only created once and
 * updated as cells change over time, so this function should only be called
 * one time for each grid of cells created in the scene.
 */
BaseGridVisualization.prototype._createMeshCells =
function(cells, grid, position, type) {
    var scene = this.scene;
    var colors = this.colors;
    var meshCells = [];
    var spacing = this.spacing;
    var layerSpacing = this.layerSpacing;
    var x = cells.getX();
    var y = cells.getY();
    var z = cells.getZ();
    var ydim, zdim, cube, material, cellValue;

    for (var cx = 0; cx < x; cx++) {
        ydim = [];
        for (var cy = 0; cy < y; cy++) {
            zdim = [];
            for (var cz = 0; cz < z; cz++) {
                cellValue = cells.getCellValue(cx, cy, cz);
                material = new THREE.MeshLambertMaterial({
                    color: htmCellValueToColor(cellValue, colors)
                });
                cube = new THREE.Mesh(this.geometry, material);
                cube.position.x = position.x + spacing * cx;
                cube.position.y = position.y - spacing * cy;
                cube.position.z = position.z - spacing * cz;
                cube.updateMatrix();
                cube.matrixAutoUpdate = false;
                cube._cellData = {
                    type: type, x: cx, y: cy, z: cz
                };
                grid.add(cube);
                zdim.push(cube);
                // Keep track of cubes in the grid so they can be clickable.
                this.targets.push(cube);
            }
            ydim.push(zdim);
        }
        meshCells.push(ydim);
    }
    scene.add(grid);
    return meshCells;
};

/*
 * Updates the mesh cell colors based on the cells, which might have changed.
 * This function should only be called when the cells change.
 */
BaseGridVisualization.prototype._applyMeshCells = function(cells, meshCells, position) {
    var colors = this.colors;
    var cube, cellValue;
    var spacing = this.spacing;
    for (var cx = 0; cx < cells.getX(); cx++) {
        for (var cy = 0; cy < cells.getY(); cy++) {
            for (var cz = 0; cz < cells.getZ(); cz++) {
                cube = meshCells[cx][cy][cz];
                cellValue = cells.getCellValue(cx, cy, cz);
                cube.material.color = new THREE.Color(
                    htmCellValueToColor(cellValue, colors)
                );
                cube.position.x = position.x + spacing * cx;
                cube.position.y = position.y - spacing * cy;
                cube.position.z = position.z - spacing * cz;
                cube.updateMatrix();
            }
        }
    }
};

/*
 * Gets clickable cubes in the grids. See example2.html.
 */
BaseGridVisualization.prototype.getTargets = function() {
    return this.targets;
};


/*******************************************************************************
 * Simple single layer block of cells for TM
 *******************************************************************************/

/**
 *
 * @param cells (HtmCells) initial cells to render
 * @param opts (Object) Can contain 'geometry', 'spacing', 'colors', 'elementId'
 * @constructor
 */
function SingleLayerVisualization(cells, opts) {
    if (!opts) opts = {};
    this.cells = cells;
    this.meshCells = [];
    BaseGridVisualization.call(this, opts);
}

SingleLayerVisualization.prototype = Object.create(BaseGridVisualization.prototype);
SingleLayerVisualization.prototype.constructor = BaseGridVisualization;

/**
 * Called once to render the canvas into the DOM with the initial cell data.
 */
SingleLayerVisualization.prototype.render = function(opts) {
    if (!opts) opts = {};
    var me = this;
    var renderer = this.renderer;
    var scene = this.scene;
    var controls = this.controls;
    var camera = this.camera;
    var light = this.light;
    var w = this.width;
    var h = this.height;
    var grid = new THREE.Group();

    var position = getOffsetCenterPosition(this.cells, this.spacing);

    this.meshCells = this._createMeshCells(this.cells, grid, position);

    function innerRender() {
        light.position.x = camera.position.x;
        light.position.y = camera.position.y;
        light.position.z = camera.position.z;
        renderer.render(scene, camera);
    }

    this.controls.addEventListener('change', innerRender);

    window.addEventListener('resize', function() {
        w = me.width = me.$container.innerWidth();
        h = me.height = me.$container.innerHeight();
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        controls.handleResize();
        innerRender();
    }, false );

    this.$container.append(renderer.domElement);

    function animate() {
        requestAnimationFrame(animate);
        me.controls.update();
        innerRender();
    }

    setTimeout(animate, 0);

    if (opts.camera) {
        if (opts.camera.x != undefined) camera.position.x = opts.camera.x;
        if (opts.camera.y != undefined) camera.position.y = opts.camera.y;
        if (opts.camera.z != undefined) camera.position.z = opts.camera.z;
    }
    if (opts.rotation) {
        if (opts.rotation.x != undefined) grid.rotation.x = opts.rotation.x;
        if (opts.rotation.y != undefined) grid.rotation.y = opts.rotation.y;
        if (opts.rotation.z != undefined) grid.rotation.z = opts.rotation.z;
    }
};

SingleLayerVisualization.prototype.redraw = function() {
    this._applyMeshCells(this.cells, this.meshCells);
};

/*******************************************************************************
 * Two layer viz with SP on top and input space on bottom with topology
 * projections.
 *******************************************************************************/

/**
 *
 * @param inputCells (HtmCells) initial input cells to render
 * @param spColumns (HtmCells) initial SP columns to render
 * @param opts (Object) Can contain 'geometry', 'spacing', 'colors', 'elementId'
 * @constructor
 */
function SpToInputVisualization(inputCells, spColumns, opts) {
    if (!opts) opts = {};
    this.inputCells = inputCells;
    this.spColumns = spColumns;
    this.layerSpacing = opts.layerSpacing || 10;
    this.inputMeshCells = [];
    this.spMeshCells = [];
    BaseGridVisualization.call(this, opts);
}
SpToInputVisualization.prototype = Object.create(BaseGridVisualization.prototype);
SpToInputVisualization.prototype.constructor = BaseGridVisualization;


/**
 * Called once to render the canvas into the DOM with the initial cell data.
 */
SpToInputVisualization.prototype.render = function(opts) {
    if (!opts) opts = {};
    var me = this;
    var renderer = this.renderer;
    var scene = this.scene;
    var controls = this.controls;
    var camera = this.camera;
    var light = this.light;
    var w = this.width;
    var h = this.height;
    var inputGrid = new THREE.Group();
    var spGrid = new THREE.Group();

    this.spPosition = getOffsetCenterPosition(this.spColumns, this.spacing);
    this.inputPosition = getOffsetCenterPosition(this.inputCells, this.spacing);
    this.inputPosition.z -= this.layerSpacing;

    this.spMeshCells = this._createMeshCells(
        this.spColumns, spGrid, this.spPosition, 'spColumns'
    );
    this.inputMeshCells = this._createMeshCells(
        this.inputCells, inputGrid, this.inputPosition, 'inputCells'
    );

    function innerRender() {
        light.position.x = camera.position.x;
        light.position.y = camera.position.y;
        light.position.z = camera.position.z;
        renderer.render(scene, camera);
    }

    this.controls.addEventListener('change', innerRender);

    window.addEventListener('resize', function() {
        w = me.width = me.$container.innerWidth();
        h = me.height = me.$container.innerHeight();
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        controls.handleResize();
        innerRender();
    }, false );

    this.$container.append(renderer.domElement);

    function animate() {
        requestAnimationFrame(animate);
        me.controls.update();
        innerRender();
    }

    setTimeout(animate, 0);

    if (opts.camera) {
        if (opts.camera.x) camera.position.x = opts.camera.x;
        if (opts.camera.y) camera.position.y = opts.camera.y;
        if (opts.camera.z) camera.position.z = opts.camera.z;
    }
    if (opts.rotation) {
        if (opts.rotation.x != undefined) {
            inputGrid.rotation.x = opts.rotation.x;
            spGrid.rotation.x = opts.rotation.x;
        }
        if (opts.rotation.y != undefined) {
            inputGrid.rotation.y = opts.rotation.y;
            spGrid.rotation.y = opts.rotation.y;
        }
        if (opts.rotation.z != undefined) {
            inputGrid.rotation.z = opts.rotation.z;
            spGrid.rotation.z = opts.rotation.z;
        }
    }

};

SpToInputVisualization.prototype.redraw = function() {
    this.spPosition = getOffsetCenterPosition(this.spColumns, this.spacing);
    this.inputPosition = getOffsetCenterPosition(this.inputCells, this.spacing);
    this.inputPosition.z -= this.layerSpacing;
    this._applyMeshCells(this.inputCells, this.inputMeshCells, this.inputPosition);
    this._applyMeshCells(this.spColumns, this.spMeshCells, this.spPosition);
};

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
    for (key in value) {
        proposedValue = value[key];
        if (opts && opts.exclude && opts.exclude[key] && opts.exclude[key] == currentValue[key]) {
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

/*******************************************************************************
 * Exports.
 *******************************************************************************/

window.SingleLayerVisualization = SingleLayerVisualization;
window.SpToInputVisualization = SpToInputVisualization;
window.HtmCells = HtmCells;
window.THREE = THREE;
