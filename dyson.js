/*
# ----------------------------------------------------------------------
# Copyright (C) 2015, Numenta, Inc.  Unless you have an agreement
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
OBJLoader(THREE);
window.THREE = THREE;
window.OBJLoader = OBJLoader;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer({ alpha: true });
var COLOR_PALLETE = {
    0:0xffffff, // white
    1:0xffff00, // yellow
    2:0xff0000, // red
};
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
window.Cells = function (l, m, n) {
    var cells = new Array();
    for (var i = 0; i < l; i++) {
        cells.push(mathjs.zeros(m, n, 'sparse'));
    }
    return cells;
};
window.drawCells = function (layers /* mathjs sparse matrix */) {
    console.log(layers[0].subset(mathjs.index(0, 1)))
    var OFFSET_FACTOR = 1.25;
    var dims = layers[0].size(); // all layers should have same dims.  Infer from first.
    var m = dims[0];
    var n = dims[1];
    var initialXOffset = (OFFSET_FACTOR * m) / 2;
    var initialYOffset = (OFFSET_FACTOR * n) / 2;
    var initialZOffset = (OFFSET_FACTOR * layers.length) / 2;

    group = new THREE.Group();
    
    for (var k = 0; k < layers.length; k++) {
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < m; j++) {
                var geometry = new THREE.BoxGeometry(1, 1, 1);

                // Place box at some offset relative to its position within layer                
                geometry.translate(OFFSET_FACTOR * i - initialYOffset, 
                                   OFFSET_FACTOR * j - initialXOffset, 
                                   OFFSET_FACTOR * k - initialZOffset);

                var material = new THREE.MeshLambertMaterial({ color: COLOR_PALLETE[layers[k].subset(mathjs.index(j, i))] });
                var cube = new THREE.Mesh(geometry, material);

                group.add(cube);
            }
        }
    }

    scene.add(group);

    return group
};

// create a point light
var pointLight = new THREE.PointLight(0xFFFFFF);

// add to the scene, we'll set it to the position of the camera later
scene.add(pointLight);

function render() {
    requestAnimationFrame(render);
    pointLight.position.x = camera.position.x;
    pointLight.position.y = camera.position.y;
    pointLight.position.z = camera.position.z;
    renderer.render(scene, camera);
}

render();

window.mathjs = mathjs;
window.camera = camera;