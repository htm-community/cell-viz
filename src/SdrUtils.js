let DEFAULT_SPARSITY = 0.02;

/***** Private TOOLS *****/

// a tool to loop x times
const times = x => f => {
    if (x > 0) {
        f()
        times (x - 1) (f)
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function flip(bit) {
    if (bit === 0) return 1;
    return 0;
}

function overflowSafeUniqueness(n, w) {
    let bigN = math.bignumber(n);
    let bigW = math.bignumber(w);

    let nf = math.factorial(bigN);
    let wf = math.factorial(bigW);
    let nwf = math.factorial(math.subtract(bigN, bigW));

    return math.divide(nf, math.multiply(wf, nwf));
}

/***** PUBLIC functions start here *****/


/*********
 CREATE
*********/

function getRandom(n, w) {
    let out = []
    let randomIndex
    let sparsity

    if (w === undefined) {
        w = n * DEFAULT_SPARSITY
    }

    sparsity = w / n

    // Fill array with zeros.
    while(out.length < n) {
        out.push(0)
    }
    // If not sparse enough, randomly flip 0 bits to 1.
    while (population(out) / n < sparsity) {
        // Make a random 0 bit into a 1.
        randomIndex = getRandomInt(0, n)
        if (out[randomIndex] === 0) {
            out[randomIndex] = 1
        }
    }

    return out;
}

function getEmpty(n) {
    let out = []

    times(n, function() {
        out.push(0)
    })
    return out
}

/*********
 INSPECT
 *********/

function getActiveBits(sdr) {
    let active = []
    sdr.forEach((bit, i) => {
        if (bit === 1) active.push(i)
    })
    return active
}

function getInactiveBits(sdr) {
    let inactive = [];
    sdr.forEach((bit, i) => {
        if (bit === 0) inactive.push(i)
    })
    return inactive;
}

function population(sdr) {
    return sdr.reduce(function(sum, n) {
        return sum + n
    }, 0)
}

function sparsity(sdr) {
    let onBits = sdr.filter((bit) => {
        return bit === 1
    }).length
    return onBits / sdr.length
}


/*********
 UPDATE
 *********/

// Flips every bit.
function invert(sdr) {
    return sdr.map((bit) => {
        if (bit === 0) return 1;
        return 0;
    });
}

// Adds a percent noise by turning on X percent of the off bits and
// turning off X percent of the on bits.
function addNoise(sdr, percentNoise) {
    // The noiseLevel will be the number of total bits to flip.
    let noiseLevel = Math.floor(population(sdr) * percentNoise);
    return this.addBitNoise(sdr, noiseLevel)
}

function addBitNoise(sdr, noisyBits) {
    let noisy = []
    let activeBits = getActiveBits(sdr)
    let inactiveBits = getInactiveBits(sdr)
    let toFlip = []
    // Populate the indices of the bits we want to flip with noise.
    times(noisyBits, function() {
        toFlip.push(
            activeBits.splice(Math.random(activeBits.length - 1), 1)[0]
        )
        toFlip.push(
            inactiveBits.splice(Math.random(inactiveBits.length - 1), 1)[0]
        )
    })
    // Flip them bits into a new array output.
    sdr.forEach((bit, i) => {
        let newBit = bit
        if (toFlip.indexOf(i) >= 0) {
            newBit = flip(bit)
        }
        noisy.push(newBit)
    })
    return noisy
}


module.exports = {
    getRandom: getRandom,
    getEmpty: getEmpty,
    getActiveBits: getActiveBits,
    getInactiveBits: getInactiveBits,
    population: population,
    sparsity: sparsity,
    invert: invert,
    addNoise: addNoise,
    addBitNoise: addBitNoise,
}
