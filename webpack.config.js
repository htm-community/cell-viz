module.exports = {
    entry: [

        "./threejs/renderers/Projector.js",
        "./threejs/controls/FlyControls.js",

        "./dyson.js"

    ],
    output: {
        path: __dirname,
        filename: "dyson-bundle.js"
    }
};
