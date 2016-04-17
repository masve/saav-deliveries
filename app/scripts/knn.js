'use strict';

class KNN {
  constructor(elm) {
    this.svg = d3.select(elm);
    this.districts = undefined;
    this.cvsDestination = 'datasets/pb/PASSENGER_VEHICLE_CLUSTERS.csv';

    this.height = 530;
    this.width = 530;
    this.offset = [this.width / 2, this.height / 2]
    this.scale = 200000;
    this.projection = undefined;

    this.center = undefined;

    elm.style.height = `${this.height}px`;
    elm.style.width = `${this.width}px`;

    //d3.cvs('datasets/pb/PASSENGER_VEHICLE_CLUSTERS.csv', this.)
    d3.json('datasets/pb/School_Districts.geojson', json => this.onDistrictsLoaded(json));
  }
  onDistrictsLoaded(districts) {
    this.districts = districts;
    this.center = d3.geo.centroid(districts);
  //
  //   this.renderDistricts();
  // }
  // renderDistricts() {

    // create the path

    this.projection = d3.geo.mercator().scale(this.scale).center(this.center).translate(this.offset);

    const path = d3.geo.path().projection(this.projection);



    const bounds = path.bounds(this.district);
    const hscale = this.scale * this.width / (bounds[1][0] - bounds[0][0]);
    const vscale = this.scale * this.height / (bounds[1][1] - bounds[0][1]);
    this.scale = (hscale < vscale) ? hscale : vscale;
    this.offset = [
      this.width - (bounds[0][0] + bounds[1][0]) / 2,
      this.height - (bounds[0][1] + bounds[1][1]) / 2
    ];
    // draw(this.svg, path, this.districts)

    //Render the districts
    this.svg.selectAll("path")
      .data(districts)
      .enter()
      .append("path")
      .attr({
        "d": path,
        'fill': 'rgb(129,145,152)',
        'stroke-width': 2,
        'stroke': "white"
      })
  }

}
function draw(svg, path, dis) {
  svg.append('g').selectAll("path")
    .data(dis)
    .enter()
    .append("path")
    .attr({
      "d": path,
      'fill': 'rgb(129,145,152)',
      'stroke-width': 2,
      'stroke': "white"
    })
}
