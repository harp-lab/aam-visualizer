import { reqReduxReducer } from 'extensions/checks';
import * as reducers from 'fext/store/reducers';

export const metadataReducer = reqReduxReducer(reducers, 'metadataReducer');
