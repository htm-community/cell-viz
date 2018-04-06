let defaultOpts = {
    width: 400,
    height: 400,
    cellSize: 10,
    rowLength: 100,
}

function ReceptiveField(bits, element) {
    this.bits = bits
    this.el = element
}

ReceptiveField.prototype.draw = function(options) {
    let sdrId = this.el
    let opts = Object.assign(defaultOpts, options)
    let svg = d3.select('#' + this.el)
        .attr('width', opts.width)
        .attr('height', opts.height)

    function treatCells(cells) {
        cells.attr('id', (d, i) => {
                return sdrId + '-' + i
            })
            .attr('fill', (d) => {
                if (d === 1) return 'steelblue'
                return 'white'
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
        cells.append('circle')
            .attr('cx', (d, i) => {
                let offset = i % opts.rowLength;
                return offset * opts.cellSize;
            })
            .attr('cy', function(d, i) {
                let offset = Math.floor(i / opts.rowLength);
                return offset * opts.cellSize;
            })
            .attr('r', 10)
    }

    // Update
    let rectCells = svg.selectAll('rect').data(this.bits)
    treatCells(rectCells)

    // Enter
    let newRectCells = rectCells.enter().append('rect')
    treatCells(newRectCells)

    // Exit
    rectCells.exit().remove()

}

module.exports = ReceptiveField
