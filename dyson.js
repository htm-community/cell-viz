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

/**
 *
 * @param cells (HtmCells) initial cells to render
 * @param opts (Object) Can contain 'geometry', 'spacing', 'colors', 'elementId'
 * @constructor
 */
function HtmCellVisualization(cells, opts) {
    if (!opts) opts = {};

    this.cells = cells;
    this.meshCells = [];
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
    this.grid = undefined;
    this.loader = new ColladaLoader();

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
    this._setupControls();
    this._setupScene();
}

HtmCellVisualization.prototype._setupContainer = function(elementId) {
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

HtmCellVisualization.prototype._setupCamera = function() {
    // Set up camera position.
    this.camera = new THREE.PerspectiveCamera(
        60, this.width / this.height, 1, 1000
    );
    this.camera.position.z = 50;
};

HtmCellVisualization.prototype._setupControls = function() {
    this.controls = new TrackballControls(this.camera);
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
    this.controls.keys = [ 65, 83, 68 ];
};

HtmCellVisualization.prototype._setupScene = function() {
    var scene;
    var renderer;

    this.scene = new THREE.Scene();
    scene = this.scene;
    scene.fog = new THREE.FogExp2(0xEEEEEE, 0.002);

    this.light = new THREE.PointLight(0xFFFFFF);
    scene.add(this.light);

    this.renderer = new THREE.WebGLRenderer({antialias: false});
    renderer = this.renderer;
    renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.width, this.height);
};

/*
 * Creates all the geometries within the grid. These are only created once and
 * updated as cells change over time, so this function should only be called
 * one time.
 */
HtmCellVisualization.prototype._createMeshCells = function() {
    var scene = this.scene;
    var colors = this.colors;
    var cells = this.cells;
    var meshCells = this.meshCells;
    var spacing = this.spacing;
    var x = cells.getX();
    var y = cells.getY();
    var z = cells.getZ();
    var initialXOffset = (spacing * x) / 2;
    var initialYOffset = (spacing * y) / 2;
    var initialZOffset = (spacing * z) / 2;
    var material, cube, zdim, xdim;

    if (! this.grid) {
        this.grid = new THREE.Group();
        for (var cy = 0; cy < y; cy++) {
            zdim = [];
            for (var cz = 0; cz < z; cz++) {
                xdim = [];
                for (var cx = 0; cx < x; cx++) {
                    material = new THREE.MeshLambertMaterial(
                        {color: colors[cells.getCellValue(cx, cy, cz)]}
                    );
                    cube = new THREE.Mesh(this.geometry, material);
                    cube.position.x = spacing * cz - initialYOffset;
                    cube.position.y = spacing * cx - initialXOffset;
                    cube.position.z = spacing * cy - initialZOffset;
                    cube.updateMatrix();
                    cube.matrixAutoUpdate = false;
                    this.grid.add(cube);
                    xdim.push(cube);
                }
                zdim.push(xdim);
            }
            meshCells.push(zdim);
        }
    }

    //this.grid.rotation.z = -45 * mathjs.PI / 180;
    //this.grid.rotation.x = -60 * mathjs.PI / 180;

    //this.grid.rotation.x = -60 * mathjs.PI / 180;
    this.grid.position.x = -30;
    //this.grid.position.y = -100;
    //this.grid.position.z = -100;

    scene.add(this.grid);
};

/*
 * Updates the mesh cell colors based on the cells, which might have changed.
 * This function should only be called when the cells change.
 */
HtmCellVisualization.prototype._applyMeshCells = function() {
    var colors = this.colors;
    var cells = this.cells;
    var meshCells = this.meshCells;
    var x = cells.getX();
    var y = cells.getY();
    var z = cells.getZ();
    var cube;
    for (var cy = 0; cy < y; cy++) {
        for (var cz = 0; cz < z; cz++) {
            for (var cx = 0; cx < x; cx++) {
                cube = meshCells[cy][cz][cx];
                cube.material.color = new THREE.Color(
                    colors[cells.getCellValue(cx, cy, cz)]
                );
            }
        }
    }
};

/**
 * Called once to render the canvas into the DOM with the initial cell data.
 */
HtmCellVisualization.prototype.render = function() {
    var me = this;
    var renderer = this.renderer;
    var scene = this.scene;
    var controls = this.controls;
    var camera = this.camera;
    var light = this.light;
    var w = this.width;
    var h = this.height;

    this._createMeshCells();

    renderer = new THREE.WebGLRenderer( { antialias: false } );

    renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(w, h);

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

    camera.position.z = 20;
};

HtmCellVisualization.prototype.redraw = function() {
    this._applyMeshCells();
};

/**
 * This interface is used to update cell data within the HtmCellVisualization.
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
    for (var cy = 0; cy < y; cy++) {
        this.cells.push(mathjs.zeros(x, z, 'sparse'));
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
    return this.cells[y].subset(mathjs.index(x, z));
};

/**
 * Allows user to update a cell's value.
 * @param x (int) x coordinate
 * @param y (int) y coordinate
 * @param z (int) z coordinate
 * @param value {*} Whatever value you want the cell to have.
 */
HtmCells.prototype.update = function(x, y, z, value) {
    // TODO: raise error if cell coordinates are invalid.
    this.cells[y].subset(mathjs.index(x, z), value);
};


window.HtmCellVisualization = HtmCellVisualization;
window.HtmCells = HtmCells;
