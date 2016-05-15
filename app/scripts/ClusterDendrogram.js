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
        this.hasRenderedOnce = false

        this.cluster = d3.layout.cluster().size([this.height, this.width - this.padding]);
        this.diagonal = d3.svg.diagonal().projection(d => [d.y, d.x]);

        this.radialCluster = d3.layout.cluster().size([360, (this.width - this.padding) / 2]).separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);
        this.radialDiagonal = d3.svg.diagonal.radial().projection(d => [d.y, d.x / 180 * Math.PI]);

        this.clusterRoot = null;

        this.onDataLoaded = this.onDataLoaded.bind(this);
        this.render = this.render.bind(this);
        this.onSwitchClicked = this.onSwitchClicked.bind(this);
        this.transitionToRadialCluster = this.transitionToRadialCluster.bind(this);

        this.links = this.svg.append('g').attr('transform', `translate(${this.padding / 2},0)`);
        this.nodes = this.svg.append('g').attr('transform', `translate(${this.padding / 2},0)`);

        d3.json('datasets/clusters/dbscan_clusters.json', this.onDataLoaded)
    }
    onDataLoaded(root) {
        this.clusterRoot = root;
        this.render();
        this.treeTypeSelector.selectAll('input').on('change', this.onSwitchClicked);
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
        const nodes = this.cluster.nodes(this.clusterRoot);
        const links = this.cluster.links(nodes);

        this.links = this.links
            .selectAll('path')
            .data(links)
            .enter()
            .append('path')
            .attr('d', this.diagonal)
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
                'transform': (d => `translate(${d.y},${d.x})`)
            })

        this.nodes
            .append('circle')
            .attr({
                'r': 4.5,
                'fill': 'white',
                'stroke': 'cornflowerblue'
            });

        this.nodes
            .append('text')
            .attr('dx', d => d.children ? -8 : 8)
            .attr('dy', 3)
            .style({
                'text-anchor': d => d.children ? 'end' : 'start',
                'font-size': 10
            })
            .text(d => d.name);

    }
    onSwitchClicked(e) {
        this.treeType = this.treeTypeSelector.selectAll('input:checked').node().value
        this.render();
    }
    transitionToRadialCluster() {

        const nodes = this.radialCluster.nodes(this.clusterRoot);
        const links = this.radialCluster.links(nodes);

        this.svg
            .selectAll('g')
            .transition()
            .duration(this.transitionDuration)
            .attr('transform', `translate(${Math.round(this.width / 2)}, ${Math.round(this.height / 2)})`);

        this.links
            .data(links)
            .transition()
            .duration(this.transitionDuration)
            //.style('stroke', '#8da0cb')
            .attr('d', this.radialDiagonal);


        this.nodes
            .data(nodes)
            .transition()
            .duration(this.transitionDuration)
            .attr("transform", (d) => `rotate(${d.x - 90})translate(${d.y})`);

        // n.select('circle')
        //     .transition()
        //     .duration(this.duration)
        //     .style('stroke', 'red');
    }
    transitionToCluster() {
        const nodes = this.cluster.nodes(this.clusterRoot);
        const links = this.cluster.links(nodes);

        this.svg
            .selectAll('g')
            .transition()
            .duration(this.transitionDuration)
            .attr('transform', `translate(${this.padding / 2},0)`);

        this.links
            .data(links)
            .transition()
            .duration(this.transitionDuration)
            .attr('d', this.diagonal);
            
        this.nodes
            .data(nodes)
            .transition()
            .duration(this.transitionDuration)
            .attr('transform', (d => `translate(${d.y},${d.x})`))
    }
}

const TreeTypes = {
    RadialCluster: 'radialcluster',
    Cluster: 'cluster'
}