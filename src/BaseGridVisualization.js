var THREE = require('three');
var OBJLoader = require('three-obj-loader');
var ColladaLoader = require('three-collada-loader');


/**
 *
 * @param opts (Object) Can contain 'geometry', 'spacing', 'elementId'
 * @constructor
 */
function BaseGridVisualization(opts) {
    if (!opts) opts = {};
    this.opts = opts;
    this.geometry = opts.geometry;
    this.spacing = opts.spacing;
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
    this.cubeSize = opts.cubeSize || 100;
    this.clock = new THREE.Clock();

    this.loader.options.centerGeometry = true;

    // Use a default geometry.
    if (! this.geometry) {
        this.geometry = new THREE.BoxGeometry(
            this.cubeSize, this.cubeSize, this.cubeSize
        );
    }
    // Use a default spacing.
    if (! this.spacing) {
        this.spacing = {
            x: 1.4, y: 1.4, z: 1.4
        };
    }

    this._setupContainer(opts.elementId);
    this._setupCamera();
    this._setupScene();
    this._setupControls();

    this.offset = opts.offset || {};
    if (this.offset.x == undefined) this.offset.x = 0;
    if (this.offset.y == undefined) this.offset.y = 0;
    if (this.offset.z == undefined) this.offset.z = 0;
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
        25, this.width / this.height, 50, 1e7
    );
};

BaseGridVisualization.prototype._setupControls = function() {
    var controls = this.controls = new THREE.FlyControls( this.camera, this.renderer.domElement );
    controls.movementSpeed = 1000;
    controls.rollSpeed = Math.PI / 24;
    controls.autoForward = false;
    controls.dragToLook = true;
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
    renderer.sortObjects = false;
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
                    if (cellValue) {
                        material = new THREE.MeshPhongMaterial( {
                            color: cellValue.color || cellValue.state.color,
                            polygonOffset: true,
                            polygonOffsetFactor: 1, // positive value pushes polygon further away
                            polygonOffsetUnits: 1,
                            transparent: true,
                            opacity: 1.0
                        });
                        material.alphaTest = 0.15;

                        cube = new THREE.Mesh(this.geometry, material);
                        var geo = new THREE.EdgesGeometry( cube.geometry );
                        // var mat = new THREE.LineBasicMaterial( { color: 0x333, linewidth: 1 } );
                        // var wireframe = new THREE.LineSegments( geo, mat );
                        // cube.add( wireframe );
                        cube.position.x = position.x + (this.cubeSize * spacing.x) * cx;
                        cube.position.y = position.y - (this.cubeSize * spacing.y) * cy;
                        cube.position.z = position.z - (this.cubeSize * spacing.z) * cz;

                        // Allow subclasses to mutate each cube.
                        if (typeof(this._mutateCube) == 'function') {
                            this._mutateCube(cube, cellValue, cx, cy, cz)
                        }

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
                }
                // console.log('z: %s', zdim.length);
                ydim.push(zdim);
            }
            meshCells.push(ydim);
            // console.log('y: %s', ydim.length);
        }
        scene.add(grid);
        return meshCells;
    };

/*
 * Updates the mesh cell colors based on the cells, which might have changed.
 * This function should only be called when the cells change.
 */
BaseGridVisualization.prototype._applyMeshCells = function(cells, meshCells, position) {
    var cube, cellValue;
    var spacing = this.spacing;

    // Allow subclasses to be notified of impending update.
    if (typeof(this._beforeApplyMeshCells) == 'function') {
        this._beforeApplyMeshCells();
    }

    for (var cx = 0; cx < cells.getX(); cx++) {
        for (var cy = 0; cy < cells.getY(); cy++) {
            for (var cz = 0; cz < cells.getZ(); cz++) {
                cube = meshCells[cx][cy][cz];
                cellValue = cells.getCellValue(cx, cy, cz);
                if (cellValue) {
                    cube.material.color = new THREE.Color(cellValue.color || cellValue.state.color);
                    cube.position.x = position.x + (this.cubeSize * spacing.x) * cx;
                    cube.position.y = position.y - (this.cubeSize * spacing.y) * cy;
                    cube.position.z = position.z - (this.cubeSize * spacing.z) * cz;
                    // Allow subclasses to mutate each cube.
                    if (typeof(this._mutateCube) == 'function') {
                        this._mutateCube(cube, cellValue, cx, cy, cz)
                    }
                    cube.updateMatrix();
                }
            }
        }
    }
};

BaseGridVisualization.prototype.getOffsetCenterPosition = function(cells, cubeSize, spacing, offset) {
    return {
        x: (offset.x * cubeSize * spacing.x) - (cells.getX() * cubeSize * spacing.x) / 2,
        y: (offset.y * cubeSize * spacing.y) + (cells.getY() * cubeSize * spacing.y) / 2,
        z: (offset.z * cubeSize * spacing.z)
    };
};


/*
 * Gets clickable cubes in the grids. See example2.html.
 */
BaseGridVisualization.prototype.getTargets = function() {
    return this.targets;
};

module.exports = BaseGridVisualization;
