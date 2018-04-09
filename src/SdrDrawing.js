/* From http://stackoverflow.com/questions/7128675/from-green-to-red-color-depend-on-percentage */
function getGreenToRed(percent){
    var r, g;
    percent = 100 - percent;
    r = percent < 50 ? 255 : Math.floor(255-(percent*2-100)*255/100);
    g = percent > 50 ? 255 : Math.floor((percent*2)*255/100);
    return rgbToHex(r, g, 0);
}

/* From http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
function rgbToHex(r, g, b) {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

let defaultOpts = {
    width: 400,
    height: 400,
    threshold: undefined,
    gradientFill: false,
    onColor: 'skyblue',
    offColor: 'white',
    connectionColor: 'royalblue'
}

function SdrDrawing(permanences, element) {
    this.permanences = permanences
    this.el = element
}

SdrDrawing.prototype._snapDrawOptionsToBox = function(opts) {
    let w = opts.width
    let h = opts.height
    let area = w * h
    let numBoxes = this.permanences.length
    let cellSize = Math.floor(Math.sqrt(area / numBoxes) * .95)
    let repeatX = Math.floor(w / cellSize)
    opts.cellSize = cellSize
    opts.rowLength = repeatX
    return opts
}

SdrDrawing.prototype.draw = function(options) {
    let opts = this._snapDrawOptionsToBox(Object.assign(defaultOpts, options))
    let threshold = opts.threshold
    let perms = this.permanences
    let svg = d3.select('#' + this.el)
        .attr('width', opts.width)
        .attr('height', opts.height)

    svg.html('')

    function renderCell(r, c) {
        r.attr('fill', (d) => {
                if (d === null) return opts.offColor
                if (d > 0) {
                    if (opts.gradientFill) return '#' + getGreenToRed(d * 100)
                    else return opts.onColor
                }
                return opts.offColor
            })
            .attr('stroke', 'darkgrey')
            .attr('stroke-width', 0.5)
            .attr('fill-opacity', 1)
            .attr('x', function(d, i) {
                let offset = i % opts.rowLength;
                return offset * opts.cellSize;
            })
            .attr('y', function(d, i) {
                let offset = Math.floor(i / opts.rowLength);
                return offset * opts.cellSize;
            })
            .attr('width', opts.cellSize)
            .attr('height', opts.cellSize)
        c.attr('fill', (d, i) => {
                // If no data, means it is empty or zero bit, no circles.
                if (d === null) return 'none'
                // If there is a threshold defined, we'll assume the perms are
                // not binary, but are permanences values, and will render
                // circles.
                if (threshold !== undefined) {
                    if (d > threshold) return opts.connectionColor
                }
                return 'none'
            })
            .attr('fill-opacity', 1)
            .attr('cx', function(d, i) {
                let offset = i % opts.rowLength;
                return offset * opts.cellSize + (opts.cellSize / 2);
            })
            .attr('cy', function(d, i) {
                let offset = Math.floor(i / opts.rowLength);
                return offset * opts.cellSize + (opts.cellSize / 2);
            })
            .attr('r', opts.cellSize / 4)
    }

    // Update
    let rects = svg.selectAll('rect').data(perms)
    let circs = svg.selectAll('circles').data(perms)
    renderCell(rects, circs)

    // Enter
    let newRects = rects.enter().append('rect')
    let newCircs = circs.enter().append('circle')
    renderCell(newRects, newCircs)

    // Exit
    rects.exit().remove()
    circs.exit().remove()

}

module.exports = SdrDrawing
