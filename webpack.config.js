"use strict";
let path = require("path")
let fs = require("fs")

let pkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, "package.json"), "utf-8")
)
let version = pkg.version

let config3d = {
    mode: 'development',
    entry: [
        "./src/threejs/renderers/Projector.js",
        "./src/threejs/controls/FlyControls.js",
        "./src/threejs/textures/threex.dynamictexture.js",
        "./src/HtmCells.js",
        "./src/InputCells.js",
        "./src/HtmMiniColumns.js",
        "./src/BaseGridVisualization.js",
        "./src/CompleteHtmVisualization.js",
        "./src/SingleLayerVisualization.js",
        "./src/SpToInputVisualization.js",
        "./src/HighbrowLayerVisualization.js",
        "./src/HighbrowColumnVisualization.js",
        "./src/HtmViz3d.js"
    ],
    module: {
        rules: [
            {
                test: path.join(__dirname, "src"),
                loader: "babel-loader"
            }
        ]
    },
    output: {
        path: __dirname + "/dist",
        filename: `cell-viz-3d-${version}.min.js`
    }
}

let config2d = {
   mode: 'development',
   entry: [
       "./src/SdrUtils.js",
       "./src/ReceptiveField.js",
       "./src/HtmViz2d.js"
   ],
   module: {
       rules: [
           { test: path.join(__dirname, "src"),
               loader: "babel-loader" }
       ]
   },
   output: {
       path: __dirname + "/dist",
       filename: `cell-viz-2d-${version}.min.js`

   }
}

module.exports = [config3d, config2d]
