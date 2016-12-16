var BaseGridVisualization = require('./BaseGridVisualization');

/*******************************************************************************
 * Two layer viz with SP on top and input space on bottom with topology
 * projections.
 *******************************************************************************/

/**
 *
 * @param inputCells (HtmCells) initial input cells to render
 * @param spColumns (HtmCells) initial SP columns to render
 * @param opts (Object) Can contain 'geometry', 'spacing', 'elementId'
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


    this.spPosition = this.getOffsetCenterPosition(
        this.spColumns, this.cubeSize, this.spacing, this.offset
    );
    this.inputPosition = this.getOffsetCenterPosition(
        this.inputCells, this.cubeSize, this.spacing, this.offset
    );
    // Move the input cells away from center.
    this.inputPosition.z -= this.layerSpacing * this.cubeSize;

    this.spMeshCells = this._createMeshCells(
        this.spColumns, spGrid, this.spPosition, 'spColumns'
    );
    this.inputMeshCells = this._createMeshCells(
        this.inputCells, inputGrid, this.inputPosition, 'inputCells'
    );

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

SpToInputVisualization.prototype.redraw = function() {
    this.spPosition = this.getOffsetCenterPosition(
        this.spColumns, this.cubeSize, this.spacing, this.offset
    );
    this.inputPosition = this.getOffsetCenterPosition(
        this.inputCells, this.cubeSize, this.spacing, this.offset
    );
    // Move away the input cells.
    this.inputPosition.z -= this.layerSpacing * this.cubeSize;
    this._applyMeshCells(this.inputCells, this.inputMeshCells, this.inputPosition);
    this._applyMeshCells(this.spColumns, this.spMeshCells, this.spPosition);
};

module.exports = SpToInputVisualization;
