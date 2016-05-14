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
    constructor(svgId, clusterCvss) {
        this.svg = d3.select(svgId);
        
        this.clusterRoot = null;
        
        this.onDataLoaded = this.onDataLoaded.bind(this);
        
        d3.json('datasets/clustes/dbscan_clusters.json', this.onDataLoaded)
    }
    onDataLoaded(root) {
        this.clusterRoot = root;
    }
}