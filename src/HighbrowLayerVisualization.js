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
 * experiment
 */
function HighbrowLayerVisualization(highbrowLayer, opts) {
    if (!opts) opts = {};
    this.layer = highbrowLayer;
    this.meshCells = [];
    this.opts = opts;
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

    this.geometry = new THREE.BoxGeometry(
        this.cubeSize, this.cubeSize, this.cubeSize
    );

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

HighbrowLayerVisualization.prototype._setupContainer = function(elementId) {
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

HighbrowLayerVisualization.prototype._setupCamera = function() {
    // Set up camera position.
    this.camera = new THREE.PerspectiveCamera(
        25, this.width / this.height, 50, 1e7
    );
};

HighbrowLayerVisualization.prototype._setupControls = function() {
    var controls = this.controls = new THREE.FlyControls(
        this.camera, this.renderer.domElement
    );
    controls.movementSpeed = 1000;
    controls.rollSpeed = Math.PI / 24;
    controls.autoForward = false;
    controls.dragToLook = true;
};

HighbrowLayerVisualization.prototype._setupScene = function() {
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

HighbrowLayerVisualization.prototype._getCellValue = function(index) {
    let neuronState = this.layer.getNeuronByIndex(index).state
    let out = { state: neuronState }
    if (neuronState == "inactive") {
        out.color = new THREE.Color('#FFFEEE')
    } else {
        out.color = new THREE.Color('orange')
    }
    return out;
};

HighbrowLayerVisualization.prototype._getCellOrigin = function(index) {
    return this.layer.getNeuronByIndex(index).getOrigin()
};

/**
 * Creates all the geometries within the grid. These are only created once and
 * updated as cells change over time, so this function should only be called
 * one time for each grid of cells created in the scene.
 */
HighbrowLayerVisualization.prototype._createMeshCells =
    function(grid, origin, type) {
        var scene = this.scene;
        // meshCells is a 1-d array indexed by global cell order.
        var meshCells = [];
        var spacing = this.spacing;
        var cube, textTexture, material, cellValue, cellColor;
        var cellOrigin;

        var textTextures = this.textTextures = []

        for (var index = 0; index < this.layer.getNeurons().length; index++) {
            cellValue = this._getCellValue(index);
            if (cellValue) {
                cellOrigin = this._getCellOrigin(index);
                cellColor = cellValue.color;
                if (cellColor == undefined) {
                    cellColor = cellValue.state.color;
                }

                textTexture = new THREEx.DynamicTexture(
                    64, 64
                );
                textTexture.context.font = "18px Verdana";
                // So we can update the text on each cell.
                textTextures.push(textTexture)

                material = new THREE.MeshPhongMaterial({
                    color: cellColor,
                    transparent: true,
                    opacity: 1.0,
                    map: textTexture.texture
                });
                material.alphaTest = 0.15;

                cube = new THREE.Mesh(this.geometry, material);

                // Wireframe.
                var geo = new THREE.EdgesGeometry( cube.geometry );
                var mat = new THREE.LineBasicMaterial(
                    { color: 0x333, linewidth: 1 }
                );
                var wireframe = new THREE.LineSegments( geo, mat );
                cube.add( wireframe );

                cube.position.x = origin.x + (this.cubeSize * spacing.x)
                                    * cellOrigin.x;
                cube.position.y = origin.y + (this.cubeSize * spacing.y)
                                    * cellOrigin.y;
                cube.position.z = origin.z + (this.cubeSize * spacing.z)
                                    * cellOrigin.z;

                // Allow subclasses to mutate each cube.
                if (typeof(this._mutateCube) == 'function') {
                    this._mutateCube(cube, cellValue, cx, cy, cz)
                }

                cube.updateMatrix();
                cube.matrixAutoUpdate = false;
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
HighbrowLayerVisualization.prototype._applyMeshCells =
function(meshCells, origin) {
    var cube, cellValue, cellOrigin;
    var spacing = this.spacing;
    var textTexture, displayText, cellPosition;
    for (var index = 0; index < this.layer.getNeurons().length; index++) {
        cube = meshCells[index];
        cellValue = this._getCellValue(index);
        cellOrigin = this._getCellOrigin(index);
        if (cellValue) {
            cube.material.color = new THREE.Color(cellValue.color);
            cube.position.x = origin.x + (this.cubeSize * spacing.x)
                                * cellOrigin.x;
            cube.position.y = origin.y + (this.cubeSize * spacing.y)
                                * cellOrigin.y;
            cube.position.z = origin.z + (this.cubeSize * spacing.z)
                                * cellOrigin.z;

            // This will display positional information on the cell texture for
            // debugging purposes.
            cellPosition = this.layer.getNeuronByIndex(index).position
            textTexture = this.textTextures[index]
            textTexture.clear('white')
            textTexture.drawText(index, undefined, 30, 'black')
            textTexture.drawText(
                cellPosition.x + ", " + cellPosition.y + ", " + cellPosition.z,
                undefined,
                50,
                'black'
            )
            textTexture.texture.needsUpdate = true

            // Allow subclasses to mutate each cube.
            if (typeof(this._mutateCube) == 'function') {
                this._mutateCube(
                    cube, cellValue, cellOrigin.x, cellOrigin.y, cellOrigin.z
                )
            }
            cube.updateMatrix();
        }
    }
};

HighbrowLayerVisualization.prototype.getOffsetCenterPosition =
function(cubeSize, spacing, offset) {
    var dims = this.layer.getDimensions()
    return {
        x: (offset.x * cubeSize * spacing.x)
            + (dims.x * cubeSize * spacing.x) / 2,
        y: (offset.y * cubeSize * spacing.y)
            + (dims.y * cubeSize * spacing.y) / 2,
        z: (offset.z * cubeSize * spacing.z)
    };
};

HighbrowLayerVisualization.prototype.getTargets = function() {
    return this.targets;
};

HighbrowLayerVisualization.prototype.render = function(opts) {
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

    // var position = this.position = this.getOffsetCenterPosition(
    //     this.cubeSize, this.spacing, this.offset
    // );
    var position = this.position = {x: 0, y: 0, z: 0}

    this.meshCells = this._createMeshCells(grid, position);

    window.addEventListener('resize', function() {
        w = me.width = me.$container.innerWidth();
        h = me.height = me.$container.innerHeight();
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        innerRender();
    }, false );

    this.$container.append(renderer.domElement);

    function animate() {
        requestAnimationFrame(animate);
        innerRender();
    }

    function innerRender() {
        var delta = me.clock.getDelta();
        me.controls.update( delta );
        light.position.x = camera.position.x;
        light.position.y = camera.position.y;
        light.position.z = camera.position.z;
        renderer.render(scene, camera);
    }

    animate();
};

HighbrowLayerVisualization.prototype.redraw = function() {
    this._applyMeshCells(this.meshCells, this.position);
};

module.exports = HighbrowLayerVisualization;
