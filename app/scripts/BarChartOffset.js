/**
 * This is a Class created by:
 *  @author Casper Clemmensen
 *  @author Mark Ian Svenningsen
 *  @author Kasper Hoa Quoc Duong
 *
 * Used in Social Data Analysis and Visualization at DTU.
 * To create D3 bar charts.
 *
 */

'use strict';

class BarChartOffset {
    constructor(svgId, dataPath, opt) {
        // Initialize all variables
        const svg = document.querySelector(svgId);
        this.monitorElm = svg;
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
        this.xLabels = [];
        this.tooltip = opt.tooltip;
        if (opt.tooltip) this.tooltip.elm = d3.select(opt.tooltip.id);

        this.dropdown = opt.dropdown;
        if (opt.dropdown) this.dropdown.elm = d3.select(opt.dropdown.selector);
        if (opt.dropdown && opt.dropdown.default) this.dropdown.value = opt.dropdown.default;


        this.cutAt = opt.cutAt;
        this.getValue = opt.value || _.noop;
        this.getLabel = opt.labels || ((e, i) => i)
        this.data = null;
        this.rawData = null;

        this.bars = this.svg.append('g');
        this.yAxis = this.svg.append('g');
        this.xAxis = this.svg.append('g');
        this.line = opt.line;
        this.onClick = opt.onClick || _.noop;

        this.categoryChanged = this.categoryChanged.bind(this);

        svg.style.height = this.height + 30;
        svg.style['padding-left'] = this.paddingLeft;

        // This class supports both csv as well as JSON
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
    findPeaks() {
        const max = d3.max(_.values(this.rawData));
        const min = d3.min(_.values(this.rawData));

        return [-((max / min * 100) - 100), (max / min * 100) - 100]
    }
    onDataLoaded(data) {
        this.rawData = data;
        if (this.cutAt) {
            this.data = this.normalize(data.slice(0, this.cutAt), this.dropdown.value);
        } else {
            this.data = this.normalize(data, this.dropdown.value);
        }

        // X scale
        this.xScale = this.xScale.domain(d3.range(_.size(this.data))).rangeRoundBands([0, this.height - this.paddingTop], 0.05);

        // Y scale
        this.yScale = this.yScale
            .domain(this.findPeaks())
            .range([0, this.width - (2 * this.paddingLeft) - 20]);


        this.xLabels = this.isJson ? d3.keys(this.data) : this.data.map(this.getLabel);

        if (this.monitorElm) {
            // We create a viewport listener, so that we can animate the chart when visible in the browser.
            const m = scrollMonitor.create(this.monitorElm);
            m.enterViewport(() => {

                if (this.hasRendered) return;

                this.renderBars();
                this.renderAxis();
                this.renderLine();
                if (this.dropdown) this.renderDropdown();
            });
        } else {
            if (this.hasRendered) return;

            this.renderBars();
            this.renderAxis();
            this.renderLine();
            if (this.dropdown) this.renderDropdown();
        }

    }
    normalize(data, feature) {

        const reference = data[feature]
        return _.mapValues(data, d => (d / reference * 100) - 100)
    }
    renderBars() {
        this.hasRendered = true;

        const max = d3.max(d3.values(this.data).map(this.getValue));

        this.bars
            .selectAll('rect')
            .data(d3.values(this.data))
            .enter()
            .append('rect')
            .attr({
                'x': (d, i) => this.yScale(0) + this.paddingLeft,
                'height': this.xScale.rangeBand(),
                'fill': 'cornflowerblue',
                'y': (d, i) => (this.xScale(i) + this.paddingTop),
                'width': 0
            })
            .on('mouseover', this.renderTooltip.bind(this))
            .on('mouseout', this.hideTooltip.bind(this))
            .on('click', this.onClick);

        this.renderBarTransition();
    }
    renderBarTransition() {
        const size = _.size(this.data);

        this.bars
            .selectAll('rect')
            .transition()
            .duration(2000)
            .delay((d, i) => ((i / size * 1000)))
            .attr({
                'width': d => (Math.abs(this.yScale(0) - this.yScale(this.getValue(d)))),
                'x': d => {
                    const y = d >= 0 ? 0 : d;
                    return this.yScale(y) + this.paddingLeft;
                }
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
        const x = _.size(this.data) - 1;

        this.svg.append('line')
            .attr({
                'y1': this.xScale(x) + this.xScale(1) + this.paddingTop,
                'x1': this.paddingLeft + this.yScale(0),
                'y2': this.xScale(x) + this.xScale(1) + this.paddingTop,
                'x2': this.paddingLeft + this.yScale(0),
                'stroke': 'black',
                'stroke-width': '1',
                'shape-rendering': 'crispEdges'
            })
            .transition()
            .duration(2000)
            .attr({
                'y1': this.xScale(0) + this.paddingTop
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

        this.tooltip.render(this.tooltip.elm, elm, this.xLabels[i], i, (this.dropdown) ? this.dropdown.value : undefined);

    }
    hideTooltip() {
        if (this.tooltip == undefined) return;
        this.tooltip
            .elm
            .transition()
            .duration(150)
            .style('opacity', 0);
    }
    renderDropdown() {
        this.dropdown.elm
            .selectAll('option')
            .data(d3.keys(this.data))
            .enter()
            .append('option')
            .attr({
                'value': (d => d)
            })
            .property('selected', d => (d === this.dropdown.value))
            .text(d => d);

        this.dropdown.elm
            .on('change', this.categoryChanged)
    }
    categoryChanged(e) {
        this.dropdown.value = this.dropdown.elm.node().value;
        this.data = this.normalize(this.rawData, this.dropdown.value);

        this.renderAxis();
        this.renderBars();
    }
}
