import { reqReduxReducer } from 'extensions/checks';
import * as reducers from 'fext/store/reducers';

const path = 'fext/store/reducers';
export const metadataReducer = reqReduxReducer(reducers, 'metadataReducer', path);
