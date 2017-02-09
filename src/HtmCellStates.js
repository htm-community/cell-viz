module.exports = {
    inactive: {
        state: 'inactive',
        color: new THREE.Color('#FFFEEE'),
        description: 'cell is inactive'
    },
    withinActiveColumn: {
        state: 'withinActiveColumn',
        color: new THREE.Color('yellow'),
        description: 'cell is inactive, but within a currently active column'
    },
    active: {
        state: 'active',
        color: new THREE.Color('orange'),
        description: 'cell is active, but was not predicted last step'
    },
    correctlyPredicted: {
        state: 'correctlyPredicted',
        color: new THREE.Color('limegreen'),
        description: 'cell is active and was correctly predicted last step'
    },
    predictiveActive: {
        state: 'predictiveActive',
        color: new THREE.Color('indigo'),
        description: 'cell is active and predictive'
    },
    predictive: {
        state: 'predictive',
        color: new THREE.Color('blue'),
        description: 'cell is predicted to be active on the next time step'
    },
    wronglyPredicted: {
        state: 'wronglyPredicted',
        color: new THREE.Color('red'),
        description: 'cell was predicted to be active, but was not'
    },
    input: {
        state: 'input',
        color: new THREE.Color('green'),
        description: 'input bit is on'
    }
};
