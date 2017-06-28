var BaseGridVisualization = require('./BaseGridVisualization');

/*******************************************************************************
 * Simple single layer block of cells for TM
 *******************************************************************************/

/**
 *
 * @param cells (HtmCells) initial cells to render
 * @param opts (Object) Can contain 'geometry', 'spacing', 'elementId'
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

    // var position = this.position = this.getOffsetCenterPosition(
    //     this.cells, this.cubeSize, this.spacing, this.offset
    // );
    var position = this.position = {x: 0, y: 0, z: 0}

    this.meshCells = this._createMeshCells(this.cells, grid, position);

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

SingleLayerVisualization.prototype.redraw = function() {
    this._applyMeshCells(this.cells, this.meshCells, this.position);
};

module.exports = SingleLayerVisualization;
