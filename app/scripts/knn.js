'use strict';

class KNN {
  constructor(elm) {
    this.svg = d3.select(elm);
    this.districts = undefined;
    this.cvsDestination = 'datasets/pb/PASSENGER_VEHICLE_CLUSTERS.csv';

    this.height = 730;
    this.width = 530;
    this.offset = [this.width / 2, this.height / 2]
    this.scale = 200000;

    this.projection = undefined;
    this.path = undefined;
    this.center = undefined;

    elm.style.height = `${this.height}px`;
    elm.style.width = `${this.width}px`;

    //d3.cvs('datasets/pb/PASSENGER_VEHICLE_CLUSTERS.csv', this.)
    d3.json('datasets/pb/School_Districts.geojson', json => this.onDistrictsLoaded(json));
  }
  onDistrictsLoaded(json) {
    this.districts = json;
    requestAnimationFrame(() => this.renderSectors());
  }
  renderSectors() {

    this.center = d3.geo.centroid(this.districts)
    this.projection = d3.geo.mercator().scale(this.scale).center(this.center).translate(this.offset);

    // create the path
    this.path = d3.geo.path().projection(this.projection);

    // using the path determine the bounds of the current map and use
    // these to determine better values for the scale and translation
    let bounds = this.path.bounds(this.districts);
    let hscale = this.scale * this.width / (bounds[1][0] - bounds[0][0]);
    let vscale = this.scale * this.height / (bounds[1][1] - bounds[0][1]);
    this.scale = (hscale < vscale) ? hscale : vscale;
    this.offset = [this.width - (bounds[0][0] + bounds[1][0]) / 2,
      this.height - (bounds[0][1] + bounds[1][1]) / 2
    ];

    // new projection
    this.projection = d3.geo.mercator().scale(this.scale).center(this.center).translate(this.offset);
    this.path = this.path.projection(this.projection);

    if (requestIdleCallback) {
      requestIdleCallback( () => this.renderD3Elems());
    } else {
      this.renderD3Elems();
    }
  }
  renderD3Elems() {
    this.svg.selectAll("path")
    .data(this.districts.features)
    .enter()
    .append("path")
    .attr({
      "d": this.path,
      'fill': 'grey',
      'stroke-width': 1,
      'stroke': "white"
    })

  }
}
