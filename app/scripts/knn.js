'use strict';

class KNN {
  constructor(elm) {
    this.svg = d3.select(elm);
    this.districts = undefined;
    this.cvsDestination = 'datasets/pb/PASSENGER_VEHICLE_CLUSTERS.csv';

    this.height = 730;
    this.width = 530;
    this.offset = [this.width / 2, this.height / 2]
    this.scale = 75000;

    this.projection = undefined;
    this.path = undefined;
    this.center = [-74.0130, 40.7238];

    elm.style.height = `${this.height}px`;
    elm.style.width = '100%';

    d3.json('datasets/pb/zip.json', json => this.onDistrictsLoaded(json));
   
  }
  onDistrictsLoaded(json) {
    this.districts = json;
    this.topo = topojson.feature(json, json.objects['zip_dist']);
    requestAnimationFrame(() => this.renderSectors());
  }
  renderSectors() {

    this.projection = d3.geo.mercator()
      .scale(this.scale)
      .center(this.center)
      .translate([this.width / 2, this.height / 2])

    // create the path
    this.path = d3.geo.path().projection(this.projection);

    if (requestIdleCallback) {
      requestIdleCallback( () => this.renderD3Elems());
    } else {
      this.renderD3Elems();
    }
  }
  renderD3Elems() {
    this.svg
        .append('g')
        .selectAll('path')
        .data(this.topo.features)
        .enter()
        .append('path')
        .attr({
          "d": d3.geo.path().projection(this.projection),
          'fill': 'grey',
          'stroke-width': 1,
          'stroke': "white"
        })
        .on('mouseover', e => {
          console.log(e.properties)
            d3.select("#tooltip")
              .classed('hidden', false)
              .transition()
              .style('left', `${d3.event.pageX}px`)
              .style('top', `${d3.event.pageY}px`)
              .style('opacity', 1)
              .duration(100)
              .select("#value")
              .text(e.properties['PO_NAME']);                        
        })
        .on('mouseout', e => {
          d3.select("#tooltip")
            .transition()
            .duration(150)
            .style('opacity', 0);
        })
  }
}
