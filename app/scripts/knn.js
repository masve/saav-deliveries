'use strict';

const StateEnum = {
  COLLISION: 0,
  POPULATION: 1,
  INJURIES: 2,
  FATALATIES: 3
}

class KNN {
  constructor(elm, toggle) {
    this.svg = d3.select(elm);
    this.toggle = d3.select(toggle);
    this.districts = undefined;
    //this.cvsDestination = 'datasets/pb/PASSENGER_VEHICLE_CLUSTERS.csv';
    this.cvsDestination = 'datasets/pb/zip_collisions.csv'

    this.height = 730;
    this.width = 530;
    this.offset = [this.width / 2, this.height / 2]
    this.scale = 75000;

    this.state = StateEnum.COLLISION;

    this.projection = undefined;
    this.path = undefined;
    this.center = [-74.0130, 40.7238];
    this.tooltip = d3.select("#tooltip").classed('hidden', true);

    this.populationScale = undefined;
    this.collisionScale = undefined;

    elm.style.height = `${this.height}px`;
    elm.style.width = '100%';

    d3.json('datasets/pb/zip.json', json => this.onDistrictsLoaded(json));

    d3.csv(this.cvsDestination, (r) => ({ 'zip': r['ZIP CODE'], 'collision': +r['COLLISIONS'] }), this.onCollisionsLoaded.bind(this));

    this.toggle.on('click', this.toggleData.bind(this));
  }
  onDistrictsLoaded(json) {
    this.districts = json;
    this.topo = topojson.feature(json, json.objects['zip_dist']);

    this.populationScale = d3.scale.linear().domain([
      d3.min(this.topo.features, f => f.properties['POPULATION']),
      d3.max(this.topo.features, f => f.properties['POPULATION'])
    ]).range([0, 256]);

    requestAnimationFrame(() => this.renderSectors());
  }
  onCollisionsLoaded(csv) {
    this.collisions = csv;
    this.collisionScale = d3.scale.linear().domain([
      0,
      d3.max(this.collisions, (c) => c.collision)
    ]).range([0, 256]);

  }
  renderSectors() {

    this.projection = d3.geo.mercator()
      .scale(this.scale)
      .center(this.center)
      .translate([this.width / 2, this.height / 2])

    // create the path
    this.path = d3.geo.path().projection(this.projection);

    if (requestIdleCallback) {
      requestIdleCallback(() => this.renderD3Elems());
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
        'fill': z => (`rgb(${Math.round(this.populationScale(z.properties['POPULATION']))}, 0, 0)`),
        'stroke-width': 1,
        'stroke': "white"
      })
      .on('mouseover', this.renderTooltip.bind(this))
      .on('mouseout', this.hideTooltip.bind(this))
    //.on('click', this.onClick.bind(this))

    this.toggle.attr('disabled', null);
  }
  renderTooltip(zipDistrict) {

    this.tooltip
      .classed('hidden', false)
      .transition()
      .style('left', `${d3.event.pageX}px`)
      .style('top', `${d3.event.pageY}px`)
      .style('opacity', 1)
      .duration(100);

    this.tooltip.select('#pop').text(zipDistrict.properties['POPULATION']);

    this.tooltip.select('#title').text(zipDistrict.properties['ZIPCODE']);

    this.tooltip.select("#value").text(zipDistrict.properties['PO_NAME']);
    
    this.tooltip.select("#col").text(this.findCollision(zipDistrict).collision || 0);
  }
  hideTooltip() {
    this.tooltip
      .transition()
      .duration(150)
      .style('opacity', 0);
  }
  toggleData(e) {
    switch (this.state) {
      case StateEnum.COLLISION:
        this.state = StateEnum.POPULATION;
        this.toggle.text('VIEW COLLISION');
        break;
      case StateEnum.POPULATION:
        this.state = StateEnum.COLLISION;
        this.toggle.text('VIEW POPULATION');
        break;
    }
    
    this.svg
      .select('g')
      .selectAll('path')
      .transition()
      .attr({
        fill: this.calculateColor.bind(this)
      });
  }
  calculateColor(e) {
    switch (this.state) {
      case StateEnum.COLLISION:
        return `rgb(${Math.round(this.populationScale(e.properties['POPULATION']))}, 0, 0)`;
      case StateEnum.POPULATION:
        return `rgb(0, ${Math.round(this.collisionScale(this.findCollision(e).collision))}, 0)`;
    }
  }
  findCollision(e) {
    if (e == undefined || e.properties == undefined || e.properties['ZIPCODE'] == undefined) {
      console.error(e);
      return 0;
    }
    const zip = e.properties['ZIPCODE'];
    const col = this.collisions.find(c => c.zip === zip);
    return (col == undefined) ? 0 : col

  }
}
