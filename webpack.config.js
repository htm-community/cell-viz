module.exports = {
    entry: [

        "./threejs/renderers/Projector.js",
        "./threejs/controls/FlyControls.js",
        "./threejs/shaders/CopyShader.js",
        "./threejs/shaders/FilmShader.js",

        "./threejs/postprocessing/EffectComposer.js",
        "./threejs/postprocessing/ShaderPass.js",
        "./threejs/postprocessing/MaskPass.js",
        "./threejs/postprocessing/RenderPass.js",
        "./threejs/postprocessing/FilmPass.js",

        "./dyson.js"

    ],
    output: {
        path: __dirname,
        filename: "dyson-bundle.js"
    }
};
