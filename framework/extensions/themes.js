import { reqObject } from 'extensions/checks';
import * as config from 'fext/fext.config.js';

export const theme = reqObject(config, 'theme');
