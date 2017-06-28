var THREE = require('three');
var OBJLoader = require('three-obj-loader');
var ColladaLoader = require('three-collada-loader');

function addGuides(scene) {
    // Add guide lines for axes
    var material = new THREE.LineBasicMaterial({
        color: "blue"
    });

    var geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3( 0, 0, 0 ),
        new THREE.Vector3( 10000, 0, 0 )
    );
    var xline = new THREE.Line( geometry, material );

    material = new THREE.LineBasicMaterial({
        color: "red"
    });
    geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3( 0, 0, 0 ),
        new THREE.Vector3( 0, 10000, 0 )
    );
    var yline = new THREE.Line( geometry, material );

    material = new THREE.LineBasicMaterial({
        color: "green"
    });
    geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3( 0, 0, 0 ),
        new THREE.Vector3( 0, 0, 10000 )
    );
    var zline = new THREE.Line( geometry, material );

    scene.add( xline );
    scene.add( yline );
    scene.add( zline );
}

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
        // meshCells is a 1-d array indexed by global cell order.
        var meshCells = [];
        var spacing = this.spacing;
        var cube, material, cellValue, cellColor;
        var cellPosition;

        for (var index = 0; index < cells.size(); index++) {
            cellValue = cells.getCellValue(index);
            if (cellValue) {
                cellPosition = cells.getCellPosition(index);
                cellColor = cellValue.color;
                if (cellColor == undefined) {
                    cellColor = cellValue.state.color;
                }
                material = new THREE.MeshPhongMaterial( {
                    color: cellColor,
                    polygonOffset: true,
                    polygonOffsetFactor: 1, // positive value pushes polygon further away
                    polygonOffsetUnits: 1,
                    transparent: true,
                    opacity: 1.0
                });
                material.alphaTest = 0.15;

                cube = new THREE.Mesh(this.geometry, material);

                // Wireframe.
                var geo = new THREE.EdgesGeometry( cube.geometry );
                var mat = new THREE.LineBasicMaterial( { color: 0x333, linewidth: 1 } );
                var wireframe = new THREE.LineSegments( geo, mat );
                cube.add( wireframe );

                cube.position.x = position.x + (this.cubeSize * spacing.x) * cellPosition.x;
                cube.position.y = position.y + (this.cubeSize * spacing.y) * cellPosition.y;
                cube.position.z = position.z + (this.cubeSize * spacing.z) * cellPosition.z;

                // Allow subclasses to mutate each cube.
                if (typeof(this._mutateCube) == 'function') {
                    this._mutateCube(cube, cellValue, cx, cy, cz)
                }

                cube.updateMatrix();
                cube.matrixAutoUpdate = false;
                cube._cellData = {
                    type: type,
                    x: cellPosition.x,
                    y: cellPosition.y,
                    z: cellPosition.z
                };
                grid.add(cube);
                meshCells.push(cube);
                // Keep track of cubes in the grid so they can be clickable.
                this.targets.push(cube);
            }
        }

        scene.add(grid);

        addGuides(scene);

        return meshCells;
    };

/*
 * Updates the mesh cell colors based on the cells, which might have changed.
 * This function should only be called when the cells change.
 */
BaseGridVisualization.prototype._applyMeshCells = function(cells, meshCells, position) {
    var cube, cellValue, cellPosition;
    var spacing = this.spacing;
    for (var index = 0; index < cells.size(); index++) {
        cube = meshCells[index];
        cellValue = cells.getCellValue(index);
        cellPosition = cells.getCellPosition(index);
        if (cellValue) {
            // console.log("Applying cell at %s with r:%s g:%s", index, cellColor.r, cellColor.g)
            cube.material.color = new THREE.Color(cellValue.color);
            cube.position.x = position.x + (this.cubeSize * spacing.x) * cellPosition.x;
            cube.position.y = position.y - (this.cubeSize * spacing.y) * cellPosition.y;
            cube.position.z = position.z - (this.cubeSize * spacing.z) * cellPosition.z;
            // Allow subclasses to mutate each cube.
            if (typeof(this._mutateCube) == 'function') {
                this._mutateCube(cube, cellValue, cellPosition.x, cellPosition.y, cellPosition.z)
            }
            cube.updateMatrix();
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
