'use strict';


class ColorMap {
  constructor() {
    this.colorMap = [
      'green',
      'blue',
      'red',
      'yellow'
    ]
  }
  getColor(int) {
    return this.colorMap[int];
  }
}
