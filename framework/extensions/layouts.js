import { reqReactElement } from 'extensions/checks';
import * as layouts from 'fext/layouts';

const path = 'fext/layouts';
export const EditorLayout = reqReactElement(layouts, 'EditorLayout', path);
export const ProjectLayout = reqReactElement(layouts, 'ProjectLayout', path);
