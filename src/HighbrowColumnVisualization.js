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
function HighbrowColumnVisualization(highbrowColumn, opts) {
    if (!opts) opts = {};
    this.column = highbrowColumn;
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
}

HighbrowColumnVisualization.prototype._getCellValue = function(neuron) {
    let neuronState = neuron.getState()
    let out = { state: neuronState }
    if (neuronState == "inactive") {
        out.color = new THREE.Color('#FFFEEE')
    } else {
        out.color = new THREE.Color('orange')
    }
    return out;
};

HighbrowColumnVisualization.prototype._setupContainer = function(elementId) {
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

HighbrowColumnVisualization.prototype._setupCamera = function() {
    // Set up camera position.
    this.camera = new THREE.PerspectiveCamera(
        25, this.width / this.height, 50, 1e7
    );
};

HighbrowColumnVisualization.prototype._setupControls = function() {
    var controls = this.controls = new THREE.FlyControls(
        this.camera, this.renderer.domElement
    );
    controls.movementSpeed = 1000;
    controls.rollSpeed = Math.PI / 24;
    controls.autoForward = false;
    controls.dragToLook = true;
};

HighbrowColumnVisualization.prototype._setupScene = function() {
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

/**
 * Creates all the geometries within the grid. These are only created once and
 * updated as cells change over time, so this function should only be called
 * one time for each grid of cells created in the scene.
 */
HighbrowColumnVisualization.prototype._createMeshCells = function(grid) {
    var me = this;
    var scene = this.scene;
    // meshCells is a 2-d array indexed by layer, then neuron.
    var meshCells = [];
    var spacing = this.spacing;
    var cubeSize = this.cubeSize;
    var layerIndex, cellIndex;

    var textTextures = this.textTextures = []

    this.column.getLayers().forEach(function(layer, layerIndex) {
        var layerMesh = []
        var layerTextures = []
        layer.getNeurons().forEach(function(neuron, cellIndex) {
            var cellValue = me._getCellValue(neuron);
            var cellOrigin = neuron.getOrigin();
            var cellColor = cellValue.color;
            var textTexture = new THREEx.DynamicTexture(
                64, 64
            );
            textTexture.context.font = "18px Verdana";
            // So we can update the text on each cell.
            layerTextures.push(textTexture)

            var material = new THREE.MeshPhongMaterial({
                color: cellColor,
                transparent: true,
                opacity: 1.0,
                map: textTexture.texture
            });
            material.alphaTest = 0.15;

            var cube = new THREE.Mesh(me.geometry, material);

            // Wireframe.
            var geo = new THREE.EdgesGeometry( cube.geometry );
            var mat = new THREE.LineBasicMaterial(
                { color: 0x333, linewidth: 1 }
            );
            var wireframe = new THREE.LineSegments( geo, mat );
            cube.add( wireframe );

            cube.position.x = cellOrigin.x;
            cube.position.y = cellOrigin.y;
            cube.position.z = cellOrigin.z;

            cube.updateMatrix();
            cube.matrixAutoUpdate = false;
            grid.add(cube);
            layerMesh.push(cube);
            console.log(
                "Created layer %s cell %s at %s,%s,%s",
                layerIndex, cellIndex, cube.position.x, cube.position.y, cube.position.z
            );
            console.log(neuron.toString())
        });
        meshCells.push(layerMesh);
        textTextures.push(layerTextures);
    });

    scene.add(grid);
    addGuides(scene);
    return meshCells;
};

/*
 * Updates the mesh cell colors based on the cells, which might have changed.
 * This function should only be called when the cells change.
 */
HighbrowColumnVisualization.prototype._applyMeshCells =
function(meshCells) {
    var me = this;
    var spacing = this.spacing;
    var cubeSize = this.cubeSize;

    this.column.getLayers().forEach(function(layer, layerIndex) {
        layer.getNeurons().forEach(function(neuron, cellIndex) {
            var cube = meshCells[layerIndex][cellIndex];
            var cellValue = me._getCellValue(neuron);
            var cellOrigin = neuron.getOrigin();
            cube.material.color = new THREE.Color(cellValue.color);
            cube.position.x = cellOrigin.x;
            cube.position.y = cellOrigin.y;
            cube.position.z = cellOrigin.z;

            // This will display positional information on the cell texture for
            // debugging purposes.
            var cellPosition = neuron.getPosition()
            var textTexture = me.textTextures[layerIndex][cellIndex]
            textTexture.clear('white')
            textTexture.drawText(cellIndex, undefined, 30, 'black')
            textTexture.drawText(
                cellPosition.x + ", " + cellPosition.y + ", " + cellPosition.z,
                undefined,
                50,
                'black'
            )
            textTexture.texture.needsUpdate = true
            cube.updateMatrix();
        });
    });

};

HighbrowColumnVisualization.prototype.render = function(opts) {
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

    this.meshCells = this._createMeshCells(grid);

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

HighbrowColumnVisualization.prototype.redraw = function() {
    this._applyMeshCells(this.meshCells);
};

module.exports = HighbrowColumnVisualization;
