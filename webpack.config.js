"use strict";
let path = require("path")
let fs = require("fs")

let pkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, "package.json"), "utf-8")
)
let version = pkg.version

module.exports = {
    entry: [
        "./src/threejs/renderers/Projector.js",
        "./src/threejs/controls/FlyControls.js",
        "./src/threejs/textures/threex.dynamictexture.js",
        "./src/SdrUtils.js",
        "./src/HtmCells.js",
        "./src/InputCells.js",
        "./src/HtmMiniColumns.js",
        "./src/BaseGridVisualization.js",
        "./src/CompleteHtmVisualization.js",
        "./src/SingleLayerVisualization.js",
        "./src/SpToInputVisualization.js",
        "./src/HighbrowLayerVisualization.js",
        "./src/HighbrowColumnVisualization.js",
        "./src/HtmViz.js"
    ],
    module: {
        rules: [
            { test: path.join(__dirname, "src"),
                loader: "babel-loader" }
        ]
    },
    output: {
        path: __dirname + "/out",
        filename: `cell-viz-${version}.min.js`
    }
};
