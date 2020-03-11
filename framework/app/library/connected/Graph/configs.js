/**
 * generate cytoscape config from theme
 * @param {Object} theme 
 */
export function cyConfig(theme) {
  return {
    style: [{
        selector: 'node',
        style: {
          'label': 'data(label)',
          'text-wrap': 'wrap'
        }
      }, {
        selector: 'node[entrypoint]',
        style: {
          'shape': 'round-tag',
          'background-color': theme.palette.primary.main
        }
      }, {
        selector: 'node:selected',
        style: { 'background-color': theme.palette.select.main }
      }, {
        selector: 'edge',
        style: {
          'label': 'data(label)',
          'curve-style': 'bezier',
          'line-color': getStyle('line-color', theme.palette.grey['500']),
          'line-style': getStyle('line-style', 'solid'),
          'target-arrow-shape': 'triangle',
          'target-arrow-color': getStyle('target-arrow-color', theme.palette.grey['500'])
        }
      }, {
        selector: 'edge:selected',
        style: {
          'line-color': theme.palette.select.main,
          'target-arrow-color': theme.palette.select.main
        }
      }, {
        selector: '.suggested',
        style: { 'background-color': theme.palette.suggest.main }
      }, {
        selector: element => {
          return element.hasClass('suggested') && element.selected();
        },
        style: { 'background-color': theme.palette.suggest.dark }
      }, {
        selector: '.hovered',
        style: { 'background-color': theme.palette.hover.main }
      }
    ],
    headless: true
  };
}

/**
 * map cytoscape element style to data
 * @param {String} property style property
 * @param {} defaultValue default style value
 */
export function getStyle(property, defaultValue) {
  return element => {
    const style = element.data('style');
    if (style && style[property])
      return style[property];
    else
      return defaultValue;
  }
}
