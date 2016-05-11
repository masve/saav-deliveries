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

class ClusterVisualisation {
    constructor(svgSelector, buttonContainerSelector, opt) {
        if (opt === undefined) opt = {};

        this.svg = d3.select(svgSelector);
        this.buttonContainer = d3.select(buttonContainerSelector);
        this.monitorElm = document.querySelector(svgSelector);
        this.topoJsons = opt.clusters || [
            'datasets/topos/cluster2.topojson',
            'datasets/topos/cluster5.topojson',
            'datasets/topos/cluster10.topojson',
            'datasets/topos/cluster20.topojson',
            'datasets/topos/cluster30.topojson',
            'datasets/topos/cluster50.topojson'
        ];

        this.topolegies = [];
        this.watch = null;
        this.districtWatch = null;
        this.hasRendered = false;
        this.hasRenderedDistricts = false;
        this.selectedTopology = null;
        this.districtTopolegy = null;
        this.height = opt.height || 850;

        this.monitorElm.style.height = `${this.height}px`;
        this.monitorElm.style.width = '100%';
        this.width = this.monitorElm.clientWidth;


        this.scale = opt.scale || 75000;
        this.scale = this.width * 90;
        this.center = opt.center && _.isArray(opt.center) ? opt.center : [-73.97768078566659, 40.70550253832363];

        this.projection = d3.geo.mercator()
            .scale(this.scale)
            .center(this.center)
            .translate([this.width / 2, this.height / 2])

        this.predictionSwitcher = new PredictionSwitcher(2);

        // Bind this to all the functions to keep the ref.
        this.onDataLoaded = this.onDataLoaded.bind(this);
        this.loadCompoent = this.loadCompoent.bind(this);
        this.addButtons = this.addButtons.bind(this);
        this.onClick = this.onClick.bind(this);
        this.getColor = this.getColor.bind(this);
        this.renderClusters = this.renderClusters.bind(this);
        this.enterCluster = this.enterCluster.bind(this);
        this.exitCluster = this.exitCluster.bind(this);



        // Add some groups in the svg that we can place our shapes in.

        this.clusters = this.svg.append('g');

        this.topoJsons.forEach((t) => d3.json(t, this.onDataLoaded));
        new Districts(this.svg.append('g'), this.projection, {});
    }

    onDataLoaded(topoJson) {
        this.topolegies.push(topoJson);
        if (this.selectedTopology == null) {
            // If there is nothing selected we selected the first one that was loaded.
            this.selectedTopology = topoJson;
        }
        if (this.topolegies.length === this.topoJsons.length) {
            this.addButtons();
        }

        if (!this.watch) {
            // Register viewport listener
            this.watch = scrollMonitor.create(this.monitorElm);
            this.watch.enterViewport(this.loadCompoent);
        }
    }
    loadCompoent() {
        if (this.hasRendered) return;
        this.hasRendered = true;
        this.enterCluster();
    }
    exitCluster() {
        const targetSize = this.clusters.selectAll('path')[0].length
        let currentSize = 0;
        this.clusters
            .selectAll('path')
            .transition()
            .duration(500)
            .ease('linear')
            .attr({
                'opacity': '0'
            })
            .each('end', () => {
                currentSize++;
                if (targetSize === currentSize) {
                    this.clusters
                        .selectAll('path')
                        .remove();

                    this.enterCluster();
                }
            })


    }
    enterCluster() {
        const features = topojson.feature(this.selectedTopology, d3.values(this.selectedTopology.objects)[0]).features;

        this.clusters
            .selectAll('path')
            .data(features)
            .enter()
            .append('path')
            .attr({
                'opacity': '0',
                'fill': this.getColor
            })
            .transition()
            .duration(500)
            .ease('linear')
            .delay((d, i) => ((i / features.length * 1000)))
            .attr({
                'd': d3.geo.path().projection(this.projection),
                'opacity': '1'
            })
    }
    renderClusters() {
        this.exitCluster();
    }
    getColor(aCluster) {

        let r, g, b;
        const h = aCluster.properties['KMEANS'] / this.selectedTopology.arcs.length;
        const i = ~~(h * 6);
        const f = h * 6 - i;
        const q = 1 - f;
        switch (i % 6) {
            case 0: r = 1; g = f; b = 0; break;
            case 1: r = q; g = 1; b = 0; break;
            case 2: r = 0; g = 1; b = f; break;
            case 3: r = 0; g = q; b = 1; break;
            case 4: r = f; g = 0; b = 1; break;
            case 5: r = 1; g = 0; b = q; break;
        }
        var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
        return (c);
    }
    addButtons() {

        this.buttonContainer
            .selectAll('button')
            .data(this.topolegies)
            .enter()
            .append('button')
            .style({
                'visibility': 'hidden',
                'opacity': '0',
                'flex-grow': '1'
            })
            .classed('btn btncolor', true)
            .on('click', this.onClick)
            .on('touch', this.onClick)
            .text((t) => (`K=${t.arcs.length}`))


        this.buttonContainer
            .selectAll('button')
            .style({
                'visibility': 'visible'
            })
            .transition()
            .duration(1500)
            .style('opacity', '1.0');
    }
    onClick(topolegy) {
        if (this.selectedTopology === topolegy) return;
        this.selectedTopology = topolegy;
        this.predictionSwitcher.updatePrediction(topolegy.arcs.length);
        this.renderClusters();
    }
}

class Districts {
    constructor(target, projection, options) {
        this.target = target;
        this.projection = projection;
        this.watch = null;
        this.districts = null;
        this.monitorElm = document.querySelector('#clusters');
        this.hasRenderedDistricts = false;

        this.onDataLoaded = this.onDataLoaded.bind(this);
        this.render = this.render.bind(this);

        d3.json(options.path || 'datasets/pb/zip.json', this.onDataLoaded);
    }
    onDataLoaded(topoJson) {
        this.districts = topoJson;
        if (!this.watch) {
            // Register viewport listener
            this.watch = scrollMonitor.create(this.monitorElm);
            this.watch.enterViewport(this.render);
        }
    }
    render() {
        if (this.hasRenderedDistricts) return;
        this.hasRenderedDistricts = true;

        const feature = topojson.feature(this.districts, this.districts.objects['zip_dist']).features;
        this.target
            .selectAll('path')
            .data(feature)
            .enter()
            .append('path')
            .attr({
                "d": d3.geo.path().projection(this.projection),
                'fill': 'transparent',
                'stroke-width': 1,
                'stroke': 'black'
            })
    }
}

class PredictionSwitcher {
    constructor(initialK) {

        this.predictionResults = {
            2: { val: 0.026108 },
            5: { val: 0.056988 },
            10: { val: 0.103698 },
            20: { val: 0.179962 },
            30: { val: 0.244022 },
            50: { val: 0.357127 }
        }
        this.current = this.predictionResults[initialK];
        this.target = $('#predictiontext');

        this.updatePrediction = this.updatePrediction.bind(this);

        this.updatePrediction(initialK);
    }
    updatePrediction(k) {
        const t = this.predictionResults[k]
        this.target.text(t.val);
        this.current = t;
    }
}