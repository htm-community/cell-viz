let SdrUtils = require('./SdrUtils')

let defaultOpts = {
    width: 400,
    height: 400,
    cellSize: 10,
    rowLength: 100,
}

function SdrDrawing(bits, element) {
    this.bits = bits
    this.el = element
}

SdrDrawing.prototype.draw = function(options) {
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

    // if (! opts) opts = {};
    // let sdr = this.bits
    // let elId = this.el
    // var title = opts.title || 'SDR';
    // var color = opts.color || 'steelblue';
    // var size = (opts.size || POINT_SIZE);
    // var line = opts.line;
    // var staticSize = opts.staticSize;
    // var spartan = opts.spartan || false;
    // var stretch = opts.stretch;
    // var population = SdrUtils.population(sdr);
    // var sparsity = SdrUtils.sparsity(sdr);
    // var $container = $('#' + elId);
    // var rowLength = Math.floor(Math.sqrt(sdr.length));
    // var heightMultiplyer = stretch ? stretch : 1;
    // var width = undefined;
    // var height = undefined;
    // var cssClass = opts.cssClass || '';
    // var maxWidth = opts.maxWidth;
    // var slide = false;
    // var $svg;
    // var svgId = elId + '-svg';
    // var svgMarkup = undefined;
    // var svgDisplay = '';
    //
    // if (opts.slide) {
    //     slide = true;
    // }
    // if (line) {
    //     rowLength = sdr.length;
    // } else if (! staticSize && size > size * 15 / rowLength) {
    //     size = size * 15 / rowLength;
    // }
    //
    // // Decrease size of boxes if maxWidth is set and we are overflowing it.
    // if (maxWidth && size * sdr.length > maxWidth) {
    //     size = Math.floor(maxWidth / sdr.length);
    // }
    //
    // width = rowLength * size;
    // height = Math.floor(sdr.length / rowLength) * size;
    //
    // if (slide) {
    //     svgDisplay = 'display="none"';
    // }
    //
    // svgMarkup = '<svg id="' + svgId
    //     + '" width="' + width
    //     + '" height="' + (size * heightMultiplyer)
    //     + '" class="' + cssClass + '" '
    //     + svgDisplay + '>';
    //
    // $svg = $(svgMarkup);
    //
    // // Clear out container.
    // $container.html('');
    //
    // if (spartan === false) {
    //     $container.append(propsTmpl({
    //         title: title,
    //         props: [{
    //             label: 'n', data: sdr.length
    //         }, {
    //             label: 'w', data: population
    //         }, {
    //             label: 'sparsity', data: sparsity.toFixed(3)
    //         }]
    //     }));
    // } else if (spartan == 'min') {
    //     $container.append(propsTmpl({
    //         props: [{
    //             label: 'n', data: sdr.length
    //         }, {
    //             label: 'w', data: population
    //         }]
    //     }));
    // }
    //
    // $container.append($svg);
    // $container.css({
    //     height: (size * heightMultiplyer * (sdr.length / rowLength)) + 'px'
    // });
    //
    // d3.select('#' + svgId)
    //     .selectAll('rect')
    //     .data(sdr)
    //     .enter()
    //     .append('rect')
    //     .attr('x', function(d, i) {
    //         var offset = i % rowLength;
    //         return offset * size;
    //     })
    //     .attr('y', function(d, i) {
    //         var offset = Math.floor(i / rowLength);
    //         return offset * size;
    //     })
    //     .attr('index', function(d, i) { return i; })
    //     .attr('width', size)
    //     .attr('height', size * heightMultiplyer - 1)
    //     .attr('class', function(d) {
    //         if (d == 1) return 'on';
    //         return 'off';
    //     });
    // if (slide) $svg.slideDown(100);

}

module.exports = SdrDrawing
