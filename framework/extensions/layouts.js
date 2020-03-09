import * as layouts from 'fext/layouts';

/**
 * guarantees layout
 * @param {String} moduleName imported module name
 * @param {String} layoutName layout name
 * @returns {ReactElement} layout
 */
function reqLayout(moduleName, layoutName) {
  let layout = moduleName[layoutName];
  if (!layout) {
    layout = function() {
      return null;
    };
  }
  return layout;
}

export const EditorLayout = reqLayout(layouts, 'EditorLayout');
export const ProjectLayout = reqLayout(layouts, 'ProjectLayout');
