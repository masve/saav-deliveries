/**
 * This is a Class created by:
 *  @author Casper Clemmensen
 *  @author Mark Ian Svenningsen
 *  @author Kasper Hoa Quoc Duong
 *
 * Used in Social Data Analysis and Visualization at DTU.
 * To create D3 Cluster Dendrograms.
 *
 */

'use strict';

class ClusterDendrogram {
    constructor(svgId, selector, opt) {
        this.svgElm = document.querySelector(svgId);
        this.svg = d3.select(this.svgElm);

        this.treeTypeSelector = d3.select(selector);

        this.height = opt.height || 2000;
        this.padding = opt.padding || 150;
        this.width = opt.width || this.svgElm.clientWidth;
        this.svgElm.style.height = this.height;
        this.transitionDuration = 2000;
        this.hasRenderedOnce = false;
        this.easing = opt.easing || 'cubic-in-out';
        this.onClick = opt.onClick || _.noop;

        this.tooltip = opt.tooltip;
        if (this.tooltip) this.tooltip.elm = d3.select(this.tooltip.id);

        this.cluster = d3.layout.cluster().size([this.height, this.width - this.padding]);
        this.diagonal = d3.svg.diagonal().projection(d => [d.y, d.x]);

        this.radialCluster = d3.layout.cluster().size([360, (this.width - 30) / 2]).separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);
        this.radialDiagonal = d3.svg.diagonal.radial().projection(d => [d.y, d.x / 180 * Math.PI]);

        this.clusterRoot = null;

        this.onDataLoaded = this.onDataLoaded.bind(this);
        this.render = this.render.bind(this);
        this.onSwitchClicked = this.onSwitchClicked.bind(this);
        this.transitionToRadialCluster = this.transitionToRadialCluster.bind(this);
        this.renderTooltip = this.renderTooltip.bind(this);
        this.hideToolTip = this.hideToolTip.bind(this);

        this.links = this.svg.append('g').attr('transform', `translate(${Math.round(this.width / 2)}, ${Math.round(this.height / 4)})`);
        this.nodes = this.svg.append('g').attr('transform', `translate(${Math.round(this.width / 2)}, ${Math.round(this.height / 4)})`);

        d3.json('datasets/clusters/dbscan_clusters.json', this.onDataLoaded)
    }
    onDataLoaded(root) {
        this.clusterRoot = root;
        this.addScales();
        this.render();
        this.treeTypeSelector.selectAll('input').on('change', this.onSwitchClicked);
    }
    addScales() {
        this.clusterRoot.children.forEach(cluster => {
            const domain = [
                d3.min(cluster.children, d => d.intensity),
                d3.max(cluster.children, d => d.intensity)
            ]
            cluster.colorScale = d3.scale.linear().domain(domain).range([100, 256]);
            cluster.sizeScale = d3.scale.linear().domain(domain).range([4.5, 9.5]);
        })
    }
    render() {
        if (this.hasRenderedOnce) {
            switch (this.treeType) {
                case TreeTypes.RadialCluster:
                    this.transitionToRadialCluster();
                    return;
                case TreeTypes.Cluster:
                    this.transitionToCluster();
                    return;
            }
        }
        this.hasRenderedOnce = true;
        const nodes = this.radialCluster.nodes(this.clusterRoot);
        const links = this.radialCluster.links(nodes);
        
        this.svg.style('height', this.height / 2)

        this.links = this.links
            .selectAll('path')
            .data(links)
            .enter()
            .append('path')
            .attr('d', this.radialDiagonal)
            .style({
                'fill': 'none',
                'stroke': '#95B2E6',
                'stroke-width': '1.5px'
            })

        this.nodes = this.nodes
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr({
                'class': 'node',
                'transform': d => `rotate(${d.x - 90})translate(${d.y})`
            })

        this.nodes
            .append('circle')
            .attr({
                'r': d => {
                    if (!d.parent || !d.parent.sizeScale) return 4.5;
                    return d.parent.sizeScale(d.intensity)
                },
                'fill': d => {
                    if (!d.parent || !d.parent.colorScale) return 'white';
                    return `rgb(100,100,${Math.round(d.parent.colorScale(d.intensity))})`
                },
                'stroke': 'cornflowerblue'
            })
            .classed('hover', (d) => !d.children)
            .on({
                'mouseover': this.renderTooltip,
                'mouseout': this.hideToolTip,
                'click': this.onClick
            })

        this.nodes
            .append('text')
            .attr({
                'dx': -12,
                'dy': 3,
                'shape-rendering': 'crispEdges'  
            })
            .style({
                'text-anchor': d => d.children ? 'end' : 'start',
                'font-size': 13
            })
            .text(d => d.children ? d.name : '')

    }
    onSwitchClicked(e) {
        this.treeType = this.treeTypeSelector.selectAll('input:checked').node().value
        this.render();
    }
    transitionToRadialCluster() {
        this.svg
            .transition()
            .ease(this.easing)
            .duration(this.transitionDuration)
            .style('height', this.height / 2)

        const nodes = this.radialCluster.nodes(this.clusterRoot);
        const links = this.radialCluster.links(nodes);

        this.svg
            .selectAll('g')
            .transition()
            .ease(this.easing)
            .duration(this.transitionDuration)
            .attr('transform', `translate(${Math.round(this.width / 2)}, ${Math.round(this.height / 4)})`);

        this.links
            .data(links)
            .transition()
            .ease(this.easing)
            .duration(this.transitionDuration)
            .attr('d', this.radialDiagonal);

        this.nodes
            .data(nodes)
            .transition()
            .ease(this.easing)
            .duration(this.transitionDuration)
            .attr("transform", (d) => `rotate(${d.x - 90})translate(${d.y})`);


    }
    transitionToCluster() {
        const nodes = this.cluster.nodes(this.clusterRoot);
        const links = this.cluster.links(nodes);

        this.svg
            .transition()
            .ease(this.easing)
            .duration(this.transitionDuration)
            .style('height', this.height)

        this.svg
            .selectAll('g')
            .transition()
            .ease(this.easing)
            .duration(this.transitionDuration)
            .attr('transform', `translate(${this.padding / 2},0)`);

        this.links
            .data(links)
            .transition()
            .ease(this.easing)
            .duration(this.transitionDuration)
            .attr('d', this.diagonal);

        this.nodes
            .data(nodes)
            .transition()
            .ease(this.easing)
            .duration(this.transitionDuration)
            .attr('transform', (d => `translate(${d.y},${d.x})`))
    }
    renderTooltip(e) {
        if (!this.tooltip) return;
        //if (this.width > )
        const pageWith = $(window).width();
        let x = d3.event.pageX;
        if (d3.event.pageX + 300 > pageWith) {
            x = pageWith - 315;
        }
        this.tooltip.elm
            .classed('hidden', false)
            .transition()
            .style('left', `${x}px`)
            .style('top', `${d3.event.pageY}px`)
            .style('opacity', 1)
            .duration(100);

        this.tooltip.render(this.tooltip.elm, e);
    }
    hideToolTip() {
        if (!this.tooltip) return;
        this.tooltip
            .elm
            .transition()
            .duration(150)
            .style('opacity', 0);
    }
}

const TreeTypes = {
    RadialCluster: 'radialcluster',
    Cluster: 'cluster'
}