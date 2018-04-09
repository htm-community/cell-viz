/* From http://stackoverflow.com/questions/7128675/from-green-to-red-color-depend-on-percentage */
function getGreenToRed(percent){
    let r, g;
    percent = 100 - percent;
    r = percent < 50 ? 255 : Math.floor(255-(percent*2-100)*255/100);
    g = percent > 50 ? 255 : Math.floor((percent*2)*255/100);
    return rgbToHex(r, g, 0);
}

/* From http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
function rgbToHex(r, g, b) {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function datumIsOn(d) {
    return d !== null && d > 0
}
// function datumIsConnected(d, threshold) {
//     return d !== null && threshold !== null && d > threshold
// }

let defaultOpts = {
    width: 400,
    height: 400,
    threshold: undefined,
    gradientFill: false,
    onColor: 'skyblue',
    offColor: 'white',
    connectionColor: 'royalblue',
    lineColor: 'teal',
}

function SdrDrawing(permanences, element) {
    this.permanences = permanences
    this.el = element
    this.$drawing = undefined
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

SdrDrawing.prototype.onCell = function(eventName, fn) {
    this.$drawing.selectAll('rect.bit').on(eventName, fn)
    return this
}

SdrDrawing.prototype.onConnection = function(eventName, fn) {
    this.$drawing.selectAll('circle.connection').on(eventName, fn)
    return this
}

SdrDrawing.prototype.drawLinesTo = function(coords) {
    let data = this.$drawing.selectAll('rect.bit').data()
    let opts = this.drawOptions

    function renderLines(ls) {
        ls.attr('class', 'line')
            .attr('visibility', (d, i) => {
                if (datumIsOn(d)) return 'visible'
                else return 'hidden'
            })
            .attr('stroke', opts.lineColor)
            .attr('stroke-width', 1.0)
            .attr('x1', function(d, i) {
                let offset = i % opts.rowLength;
                return offset * opts.cellSize + opts.cellSize / 2;
            })
            .attr('y1', function(d, i) {
                let offset = Math.floor(i / opts.rowLength);
                return offset * opts.cellSize + opts.cellSize / 2;
            })
            .attr('x2', coords[0])
            .attr('y2', coords[1])
    }

    // Update
    let lines = this.$drawing.selectAll('line.line').data(data)
    renderLines(lines)

    // Enter
    let newLines = lines.enter().append('line')
    renderLines(newLines)

    // Exit
    lines.exit().remove()

    return this
}

SdrDrawing.prototype.draw = function(options) {
    let perms = this.permanences
    let opts = this._snapDrawOptionsToBox(Object.assign({}, defaultOpts, options))
    let threshold = opts.threshold
    this.$drawing = d3.select('#' + this.el)
        .attr('width', opts.width)
        .attr('height', opts.height)

    function renderCell(r, c) {
        r.attr('class', 'bit')
            .attr('fill', (d) => {
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

        if (c) {
            c.attr('class', 'connection')
                .attr('fill', opts.connectionColor)
                .attr('cx', function(d) {
                    let i = d.index
                    let offset = i % opts.rowLength;
                    return offset * opts.cellSize + (opts.cellSize / 2);
                })
                .attr('cy', function(d) {
                    let i = d.index
                    let offset = Math.floor(i / opts.rowLength);
                    return offset * opts.cellSize + (opts.cellSize / 2);
                })
                .attr('r', opts.cellSize / 4)
        }
    }

    // Update
    let rects = this.$drawing.selectAll('rect.bit').data(perms)
    let circs
    // Only create circles if there is a threshold defined for connections.
    if (threshold !== undefined) {
        let permObjs = perms.map((p, i) => {
            return {
                index: i,
                permanence: p
            }
        }).filter((p) => {
            return p.permanence !== null && p.permanence > threshold
        })
        circs = this.$drawing.selectAll('circle.connection').data(permObjs)
    }
    renderCell(rects, circs)

    // Enter
    let newRects = rects.enter().append('rect')
    let newCircs
    if (threshold !== undefined) {
        newCircs = circs.enter().append('circle')
    }
    renderCell(newRects, newCircs)

    // Exit
    rects.exit().remove()
    if (threshold !== undefined) {
        circs.exit().remove()
    }

    // Stash the draw options we used
    this.drawOptions = opts

    return this
}

module.exports = SdrDrawing
