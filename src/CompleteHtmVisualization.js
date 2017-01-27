var BaseGridVisualization = require('./BaseGridVisualization');

/*******************************************************************************
 * Input, SP, and TM.
 *******************************************************************************/

/**
 *
 * @param inputCells (HtmCells) initial input cells to render
 * @param spColumns (HtmCells) initial SP columns to render
 * @param opts (Object) Can contain 'geometry', 'spacing', 'elementId'
 * @constructor
 */
function CompletHtmVisualization(inputCells, spColumns, opts) {
    if (!opts) opts = {};
    this.inputCells = inputCells;
    this.spColumns = spColumns;
    this.layerSpacing = opts.layerSpacing || 30;
    this.inputMeshCells = [];
    this.spMeshCells = [];
    this.proximalSegments = [];
    // this.distalSegments = [];
    this.inputSpacing = {x: 1.1, y: 1.1, z: 1.1};
    BaseGridVisualization.call(this, opts);
}
CompletHtmVisualization.prototype = Object.create(BaseGridVisualization.prototype);
CompletHtmVisualization.prototype.constructor = BaseGridVisualization;

CompletHtmVisualization.prototype._createSpCells = function(grid) {
    return this._createMeshCells(
        this.spColumns, grid, this.spPosition, 'spColumns'
    );
};

CompletHtmVisualization.prototype._createInputCells = function(grid) {
    // We're going to use a canned spacing for input. This is a hack becuz lazy.
    var spacingCache = this.spacing;
    this.spacing = this.inputSpacing;
    var out = this.inputMeshCells = this._createMeshCells(
        this.inputCells, grid, this.inputPosition, 'inputCells'
    );
    this.spacing = spacingCache;
    return out;
};

CompletHtmVisualization.prototype._createProximalSegmentLines =
function() {
    var me = this;
    if (this.proximalSegmentGrid) {
        this.scene.remove(this.proximalSegmentGrid);
    }
    var grid = new THREE.Group();
    var segments = this.proximalSegments;
    var material = new THREE.LineBasicMaterial({
    	color: 0x0000ff
    });
    _.each(segments, function(segment) {
        var geometry = new THREE.Geometry();
        var inputCube = me.inputMeshCells[segment.target][0][0];
        geometry.vertices.push(
            new THREE.Vector3( 0, 0, 0 ),
        	inputCube.position
        );
        var line = new THREE.Line( geometry, material );
        grid.add(line);
    });
    this.scene.add(grid);
    this.proximalSegmentGrid = grid;
};

/**
 * Called once to render the canvas into the DOM with the initial cell data.
 */
CompletHtmVisualization.prototype.render = function(opts) {
    if (!opts) opts = {};
    var me = this;
    var renderer = this.renderer;
    var scene = this.scene;
    var controls = this.controls;
    var camera = this.camera;
    var light = this.light;
    var w = this.width;
    var h = this.height;
    var centerPosition = {x: 0, y: 0, z: 0};
    var cameraPosition = _.extend({}, centerPosition, this.opts.camera);
    var spacingCache;

    this.spGrid = new THREE.Group();
    this.inputGrid = new THREE.Group();

    this.spPosition = _.extend({}, centerPosition);
    this.inputPosition = _.extend({}, centerPosition);
    // Move the input cells away from the SP cells.
    this.inputPosition.z += this.layerSpacing * this.cubeSize;

    this.spMeshCells = this._createSpCells(this.spGrid);
    this.inputMeshCells = this._createInputCells(this.inputGrid);

    this._createProximalSegmentLines();

    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    // Look at the center input cell.
    camera.updateProjectionMatrix();

    window.addEventListener('resize', function() {
        w = me.width = me.$container.innerWidth();
        h = me.height = me.$container.innerHeight();
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        innerRender();
    }, false );

    this.$container.append(renderer.domElement);

    function innerRender() {
        var delta = me.clock.getDelta();
        me.controls.update( delta );
        light.position.x = camera.position.x;
        light.position.y = camera.position.y;
        light.position.z = camera.position.z;
        renderer.render(scene, camera);
    }

    function animate() {
        requestAnimationFrame(animate);
        innerRender();
    }

    animate();

};

CompletHtmVisualization.prototype.redraw = function() {
    this.spPosition = this.getOffsetCenterPosition(
        this.spColumns, this.cubeSize, this.spacing, this.offset
    );
    this.inputPosition = this.getOffsetCenterPosition(
        this.inputCells, this.cubeSize, this.inputSpacing, this.offset
    );
    // Move away the input cells.
    this.inputPosition.z += this.layerSpacing * this.cubeSize;

    // We're going to use a canned spacing for input. This is a hack becuz lazy.
    spacingCache = this.spacing;
    this.spacing = this.inputSpacing;
    this._applyMeshCells(this.inputCells, this.inputMeshCells, this.inputPosition);
    this.spacing = spacingCache;
    this._applyMeshCells(this.spColumns, this.spMeshCells, this.spPosition);
    this._createProximalSegmentLines()
};

CompletHtmVisualization.prototype.redim = function(cellsPerRow) {
    this.spColumns.cellsPerRow = cellsPerRow;
    this.scene.remove(this.spGrid);
    this.spGrid = new THREE.Group();
    this.spMeshCells = this._createSpCells(this.spGrid);
};

module.exports = CompletHtmVisualization;
