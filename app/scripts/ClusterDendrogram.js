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
    constructor(svgId, opt) {
        this.svgElm = document.querySelector(svgId);
        this.svg = d3.select(this.svgElm);
        
        this.height = opt.height || 1000;
        this.width = opt.width || this.svgElm.clientWidth;
        this.svgElm.style.height = this.height;
        
        this.cluster = d3.layout.cluster().size([this.height, this.width - 100]);
        this.diagonal = d3.svg.diagonal().projection(d => [d.y, d.x]);
        
        this.clusterRoot = null;
        
        this.onDataLoaded = this.onDataLoaded.bind(this);
        this.render = this.render.bind(this);
        
        this.links = this.svg.append('g').attr("transform", "translate(40,0)");
        this.nodes = this.svg.append('g').attr("transform", "translate(40,0)");
        
        d3.json('datasets/clusters/dbscan_clusters.json', this.onDataLoaded)
    }
    onDataLoaded(root) {
        this.clusterRoot = root;
        this.render();
    }
    render() {
        const nodes = this.cluster.nodes(this.clusterRoot);
        const links = this.cluster.links(nodes);
        
        this.links
            .selectAll('path')
            .data(links)
            .enter()
            .append('path')
            .style({
                'fill': 'none',
                'stroke': '#ccc',
                'stroke-width': '1.5px'
            })
            .attr("d", this.diagonal);
            
        this.nodes
            .selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr({
                'r': 4.5,
                'transform': (d => `translate(${d.y},${d.x})`)
            })
        this.nodes
            .append('text')
            .attr("dx", d => d.children ? -8 : 8)
            .attr("dy", 3)
            .style("text-anchor", d => d.children ? "end" : "start")
            .text(d=> d.name);
        
    }
}