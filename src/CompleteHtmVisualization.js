var BaseGridVisualization = require('./BaseGridVisualization');


// create colored line
// using buffer geometry
function getColoredBufferLine ( steps, phase, geometry ) {

  var vertices = geometry.vertices;
  var segments = geometry.vertices.length;

  // geometry
  var geometry = new THREE.BufferGeometry();

  // material
  var lineMaterial = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors });

  // attributes
  var positions = new Float32Array( segments * 3 ); // 3 vertices per point
  var colors = new Float32Array( segments * 3 );

  var frequency = 1 /  ( steps * segments );
  var color = new THREE.Color();

  var x, y, z;

  for ( var i = 0, l = segments; i < l; i ++ ) {

    x = vertices[ i ].x;
    y = vertices[ i ].y;
    z = vertices[ i ].z;

    positions[ i * 3 ] = x;
    positions[ i * 3 + 1 ] = y;
    positions[ i * 3 + 2 ] = z;

    color.set ( makeColorGradient( i, frequency, phase ) );

    colors[ i * 3 ] = color.r;
    colors[ i * 3 + 1 ] = color.g;
    colors[ i * 3 + 2 ] = color.b;

	}

  geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
  geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

  // line
  var line = new THREE.Line( geometry, lineMaterial );

  return line;

}

function makeColorGradient ( i, frequency, phase ) {

  var center = 128;
  var width = 127;

  var redFrequency, grnFrequency, bluFrequency;
 	grnFrequency = bluFrequency = redFrequency = frequency;

  var phase2 = phase + 2;
  var phase3 = phase + 4;

  var red   = Math.sin( redFrequency * i + phase ) * width + center;
  var green = Math.sin( grnFrequency * i + phase2 ) * width + center;
  var blue  = Math.sin( bluFrequency * i + phase3 ) * width + center;

  return parseInt( '0x' + _byte2Hex( red ) + _byte2Hex( green ) + _byte2Hex( blue ) );
}

function _byte2Hex (n) {
  var nybHexString = "0123456789ABCDEF";
  return String( nybHexString.substr( ( n >> 4 ) & 0x0F, 1 ) ) + nybHexString.substr( n & 0x0F, 1 );
}

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
function CompleteHtmVisualization(inputCells, spColumns, opts) {
    if (!opts) opts = {};
    this.inputCells = inputCells;
    this.spColumns = spColumns;
    this.layerSpacing = opts.layerSpacing || 30;
    this.inputMeshCells = [];
    this.spMeshCells = [];
    this.distalSegments = [];
    this.proximalSegments = [];
    this.inputSpacing = {x: 1.1, y: 1.1, z: 1.1};
    this._selections = [];
    BaseGridVisualization.call(this, opts);
}
CompleteHtmVisualization.prototype = Object.create(BaseGridVisualization.prototype);
CompleteHtmVisualization.prototype.constructor = BaseGridVisualization;

CompleteHtmVisualization.prototype._createSpCells = function(grid) {
    return this._createMeshCells(
        this.spColumns, grid, this.spPosition, 'spColumns'
    );
};

CompleteHtmVisualization.prototype._createInputCells = function(grid) {
    // We're going to use a canned spacing for input. This is a hack becuz lazy.
    var spacingCache = this.spacing;
    this.spacing = this.inputSpacing;
    var out = this.inputMeshCells = this._createMeshCells(
        this.inputCells, grid, this.inputPosition, 'inputCells'
    );
    this.spacing = spacingCache;
    return out;
};

CompleteHtmVisualization.prototype._createSegmentLines =
function() {
    var me = this;
    if (this.dSegmentGrid) {
        this.scene.remove(this.dSegmentGrid);
    }
    var dSegmentGrid = new THREE.Group();
    var dSegments = this.distalSegments;

    if (this.proximalSegmentGrid) {
        this.scene.remove(this.proximalSegmentGrid);
    }
    var pSegmentGrid = new THREE.Group();
    var pSegments = this.proximalSegments;

    var material = new THREE.LineBasicMaterial({
    	color: 0x0000ff
    });
    var meshOpacity = 1.0;
    // Make all the cells transparent if there is a selection.
    if (this.inputCells.selectedCell !== undefined
        || this.spColumns.selectedCell !== undefined
        || this.spColumns.selectedColumn !== undefined) {
        meshOpacity = 0.15;
    }
    _.each(this.spMeshCells, function(meshx) {
        _.each(meshx, function(meshz) {
            _.each(meshz, function(mesh) {
                mesh.material.opacity = meshOpacity;
            });
        });
    });

    // TODO: ^^^ I might have to do the same for input mesh cells

    // Go distal!
    _.each(dSegments, function(segment) {
        var geometry = new THREE.Geometry();
        var sourceCellXyz = me.spColumns.getCellXyz(segment.source);
        var targetCellXyz = me.spColumns.getCellXyz(segment.target);
        // console.log('%s, %s', JSON.stringify(sourceCellXyz), JSON.stringify(targetCellXyz));
        var sourceMesh = me.spMeshCells[sourceCellXyz.x][sourceCellXyz.y][sourceCellXyz.z];
        var targetMesh = me.spMeshCells[targetCellXyz.x][targetCellXyz.y][targetCellXyz.z];
        if (sourceMesh && targetMesh) {
            geometry.vertices.push(
                sourceMesh.position,
                targetMesh.position
            );
            var line = getColoredBufferLine(0.1, 1.5, geometry);
            dSegmentGrid.add(line);
            sourceMesh.material.opacity = 1.0;
            targetMesh.material.opacity = 1.0;
        } else {
            console.warn('Missing cells!');
            console.warn(segment);
            console.warn(sourceCellXyz)
            console.warn(targetCellXyz)
        }
    });
    this.scene.add(dSegmentGrid);
    this.dSegmentGrid = dSegmentGrid;

    // Go proximal!
    _.each(pSegments, function(segment) {
        var geometry = new THREE.Geometry();
        var columnIndex = segment.source;
        var spCellIndex = me.spColumns.getCellsInColumn(columnIndex)[0].cellIndex;
        var sourceCellXyz = me.spColumns.getCellXyz(spCellIndex);
        var sourceCellIndex = me.spColumns.getCellIndex(
            sourceCellXyz.x, sourceCellXyz.y, sourceCellXyz.z
        );
        var sourceMesh = me.spMeshCells[sourceCellXyz.x][sourceCellXyz.y][sourceCellXyz.z];

        var targetCellXyz = me.inputCells.getCellXyz(segment.target);
        var targetMesh = me.inputMeshCells[targetCellXyz.x][targetCellXyz.y][targetCellXyz.z];

        if (sourceMesh && targetMesh) {
            geometry.vertices.push(
                sourceMesh.position,
                targetMesh.position
            );
            var line = getColoredBufferLine(0.1, 1.5, geometry);
            pSegmentGrid.add(line);
            sourceMesh.material.opacity = 1.0;
            targetMesh.material.opacity = 1.0;
        } else {
            console.warn('Missing cells!');
            console.warn(segment);
            console.warn(sourceCellXyz)
            console.warn(targetCellXyz)
        }
    });
    this.scene.add(pSegmentGrid);
    this.dSegmentGrid = pSegmentGrid;
};


/**
 * Called once to render the canvas into the DOM with the initial cell data.
 */
CompleteHtmVisualization.prototype.render = function(opts) {
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

    this._createSegmentLines();

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

CompleteHtmVisualization.prototype.redraw = function() {
    this.spPosition = this.getOffsetCenterPosition(
        this.spColumns, this.cubeSize, this.spacing, this.offset
    );
    this.inputPosition = this.getOffsetCenterPosition(
        this.inputCells, this.cubeSize, this.inputSpacing, this.offset
    );
    // Move away the input cells.
    this.inputPosition.z += this.layerSpacing * this.cubeSize;

    this._createSegmentLines()
    // We're going to use a canned spacing for input. This is a hack becuz lazy.
    spacingCache = this.spacing;
    this.spacing = this.inputSpacing;
    this._applyMeshCells(this.inputCells, this.inputMeshCells, this.inputPosition);
    this.spacing = spacingCache;
    this._applyMeshCells(this.spColumns, this.spMeshCells, this.spPosition);
};

CompleteHtmVisualization.prototype.redim = function(cellsPerRow) {
    this.spColumns.cellsPerRow = cellsPerRow;
    this.scene.remove(this.spGrid);
    this.spGrid = new THREE.Group();
    this.spMeshCells = this._createSpCells(this.spGrid);
};

CompleteHtmVisualization.prototype._selectCell = function(cube) {
    var outlineMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.BackSide } );
	var outlineMesh = new THREE.Mesh( cube.geometry, outlineMaterial );
    outlineMesh.position.set(cube.position.x, cube.position.y, cube.position.z);
	outlineMesh.scale.multiplyScalar(1.15);
    this._selections.push(outlineMesh);
	this.scene.add(outlineMesh);
};

CompleteHtmVisualization.prototype._selectColumn = function(columnIndex) {
    var me = this;
    _.each(this.spColumns.getCellsInColumn(columnIndex), function(cell) {
        var xyz = me.spColumns.getCellXyz(cell.cellIndex);
        me._selectCell(me.spMeshCells[xyz.x][xyz.y][xyz.z]);
    });
};

CompleteHtmVisualization.prototype._mutateCube = function(cube, cellValue, x, y, z) {
    var geo = cube.geometry;
    if (cube._cellData && cube._cellData.type == 'inputCells') {
        console.log('%s == %s ?', this.inputCells.selectedCell, cellValue.cellIndex);
        if (this.inputCells.selectedCell == cellValue.cellIndex) {
            this._selectCell(cube);
        }
    } else {
        var selectedCell = this.spColumns.selectedCell;
        var selectedColumn = this.spColumns.selectedColumn;
        if (selectedColumn && selectedColumn == cellValue.columnIndex) {
            this._selectColumn(cellValue.columnIndex);
        } else if (selectedCell && selectedCell == cellValue.cellIndex) {
            this._selectCell(cube);
        }
    }
};

CompleteHtmVisualization.prototype._beforeApplyMeshCells = function() {
    // Remove all selections before rendering cubes.
    while (this._selections.length) {
        this.scene.remove(this._selections.pop());
    }
};

module.exports = CompleteHtmVisualization;
