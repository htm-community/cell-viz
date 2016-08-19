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
var camera, controls, scene, renderer;
var light;

function init(layers /* array of mathjs sparse matrices */,
              geometry /* three.js geometry constructor */,
              spacing /* int */,
              colors /* obj */) {

    if (typeof geometry == 'undefined') {
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 50;

    controls = new TrackballControls( camera );

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [ 65, 83, 68 ];
    controls.addEventListener( 'change', render );

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xeeeeee, 0.002 );

    var dims = layers[0].size(); // all layers should have same dims.  Infer from first.
    var m = dims[0];
    var n = dims[1];
    if (typeof spacing == 'undefined'){
        spacing = 1.25;
    }
    var initialXOffset = (spacing * m) / 2;
    var initialYOffset = (spacing * n) / 2;
    var initialZOffset = (spacing * layers.length) / 2;
    if (typeof colors == 'undefined') {
        colors = {
            0:0xffffff, // white
            1:0xffff00, // yellow
            2:0xff0000, // red
        };
    }
    grid = new THREE.Group();

    for (var k = 0; k < layers.length; k++) {
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < m; j++) {
                var material = new THREE.MeshLambertMaterial({ color: colors[layers[k].subset(mathjs.index(j, i))] });
                var cube = new THREE.Mesh(geometry, material);

                cube.position.x = spacing * i - initialYOffset;
                cube.position.y = spacing * j - initialXOffset;
                cube.position.z = spacing * k - initialZOffset;
                cube.updateMatrix();
                cube.matrixAutoUpdate = false;

                grid.add(cube);
            }
        }
    }

    grid.rotation.z = -45*mathjs.PI/180;
    grid.rotation.x = -60*mathjs.PI/180;

    scene.add(grid);

    light = new THREE.PointLight(0xFFFFFF);

    scene.add(light);

    renderer = new THREE.WebGLRenderer( { antialias: false } );

    renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild(renderer.domElement);

    window.addEventListener( 'resize', onWindowResize, false );

    render();

    this.camera = camera;
    this.renderer = renderer;
    this.scene = scene;
    this.controls = controls;
    this.light = light;
    this.animate = animate;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    controls.handleResize();
    render();
}

function animate() {
    requestAnimationFrame( animate );
    controls.update();
}

function render() {
    light.position.x = camera.position.x;
    light.position.y = camera.position.y;
    light.position.z = camera.position.z;
    renderer.render( scene, camera );
}

function Cells(l, m, n) {
    var cells = new Array();
    for (var i = 0; i < l; i++) {
        cells.push(mathjs.zeros(m, n, 'sparse'));
    }
    return cells;
}

window.drawCells = init;
window.Cells = Cells;
window.mathjs = mathjs;
window.THREE = THREE;
window.OBJLoader = OBJLoader;

var ColladaLoader = require('three-collada-loader');
window.ColladaLoader = ColladaLoader;
