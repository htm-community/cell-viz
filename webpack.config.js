module.exports = {
    entry: [

        "./src/threejs/renderers/Projector.js",
        "./src/threejs/controls/FlyControls.js",
        "./src/HtmCells.js",
        "./src/InputCells.js",
        "./src/HtmMiniColumns.js",
        "./src/BaseGridVisualization.js",
        "./src/SingleLayerVisualization.js",
        "./src/SpToInputVisualization.js",
        "./src/CompleteHtmVisualization.js",
        "./src/HtmViz.js"
    ],
    output: {
        path: __dirname + "/out",
        filename: "dyson.js"
    }
};
