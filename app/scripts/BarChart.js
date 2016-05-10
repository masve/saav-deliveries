'use strict';

class BarChart {
    constructor(svgId, dataPath, opt) {

        const svg = document.querySelector(svgId);

        this.svg = d3.select(svgId);
        this.isJson = dataPath.endsWith('.json');

        this.dataPath = dataPath;
        this.xScale = d3.scale.ordinal();
        this.yScale = d3.scale.linear();
        svg.style.width = "100%";
        this.paddingLeft = (svg.clientWidth / (opt.paddingLeft || 6));
        this.paddingTop = opt.paddingTop || 30;
        this.height = opt.height || 430;
        this.ticks = opt.ticks || 11;
        this.width = svg.clientWidth;
        this.bars = this.svg.append('g');
        this.yAxis = this.svg.append('g');
        this.xAxis = this.svg.append('g');
        this.xLabels = [];
        this.tooltip = opt.tooltip;
        if (opt.tooltip) {
            this.tooltip.elm = d3.select(opt.tooltip.id);
        }
        

        this.cutAt = opt.cutAt;
        this.getValue = opt.value || _.noop;
        this.getLabel = opt.labels || ((e, i) => i)
        this.data = null;
        this.line = opt.line;
        this.onClick = opt.onClick || _.noop;

        svg.style.height = this.height + 30;
        svg.style['padding-left'] = this.paddingLeft;

        if (this.isJson) {
            d3.json(
                this.dataPath,
                this.onDataLoaded.bind(this)
            );
        } else {
            d3.csv(
                this.dataPath,
                opt.parseFun || (r => r),
                this.onDataLoaded.bind(this)
            );
        }
    }
    onDataLoaded(data) {
        if (this.cutAt) {
            this.data = data.slice(0, this.cutAt);
        } else {
            this.data = data;
        }
        // X scale
        this.xScale = this.xScale.domain(d3.range(_.size(this.data))).rangeRoundBands([0, this.height - this.paddingTop], 0.05);

        // Y scale
        this.yScale = this.yScale
            .domain([0, d3.max(d3.values(this.data).map(this.getValue))])
            .range([0, this.width - (2 * this.paddingLeft) - 20]);


        this.xLabels = this.isJson ? d3.keys(this.data) : this.data.map(this.getLabel);

        this.renderBars();
        this.renderAxis();
        if (this.line) this.renderLine();
    }
    renderBars() {

        const max = d3.max(d3.values(this.data).map(this.getValue));
        const size = _.size(this.data);


        this.bars
            .selectAll('rect')
            .data(d3.values(this.data))
            .enter()
            .append('rect')
            .attr({
                'x': (d, i) => (this.paddingLeft),
                'height': this.xScale.rangeBand(),
                'fill': 'cornflowerblue',
                'y': (d, i) => (this.xScale(i) + this.paddingTop),
                'width': 0
            })
            .on('mouseover', this.renderTooltip.bind(this))
            .on('mouseout', this.hideTooltip.bind(this))
            .on('click', this.onClick)
            .transition()
            .duration(2000)
            .delay((d, i) => ((i / size * 1000) + 10000))
            .attr({
                'width': d => (Math.abs(this.yScale(0) - this.yScale(this.getValue(d))))
            })
    }
    renderAxis() {
        // Define axes
        let xAxis = d3.svg.axis().scale(this.xScale).orient('left').tickFormat((d) => this.xLabels[d]);
        let yAxis = d3.svg.axis().scale(this.yScale).orient('bottom').ticks(this.ticks);

        // Add y axis to histogram
        this.xAxis.attr({
            'class': 'axis',
            'transform': `translate(${this.paddingLeft}, ${this.paddingTop})`
        }).call(xAxis);

        this.yAxis
            .attr({
                'class': 'axis',
                'transform': `translate(${this.paddingLeft}, ${this.height})`
            })
            .call(yAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr({
                'dx': '.4em'
            });
    }
    renderLine() {
        const x = this.line.x(this.data);
        
        this.svg.append('line')
            .attr({
                'y1': this.yScale.range()[1] - this.paddingTop,
                'x1': this.paddingLeft + (Math.abs(this.yScale(0) - this.yScale(x))),
                'y2': this.yScale.range()[1] - this.paddingTop,
                'x2': this.paddingLeft + (Math.abs(this.yScale(0) - this.yScale(x))),
                'stroke': 'black',
                'stroke-width': '1',
                'stroke-dasharray': '10, 10'
            })
            .transition()
            .delay(10000)
            .duration(2000)
            .attr({
                'y1': this.yScale.range()[0] + this.paddingTop,
            })
    }
    renderTooltip(elm, i) {
        if (this.tooltip == undefined) return;
        this.tooltip
            .elm
            .classed('hidden', false)
            .transition()
            .style('left', `${d3.event.pageX}px`)
            .style('top', `${d3.event.pageY}px`)
            .style('opacity', 1)
            .duration(100);

        this.tooltip.render(this.tooltip.elm, elm, this.xLabels[i], i);

    }
    hideTooltip() {
        if (this.tooltip == undefined) return;
        this.tooltip
            .elm
            .transition()
            .duration(150)
            .style('opacity', 0);
    }
}