import { SET_PROJECT_DATA } from '../actionTypes';
import metadataReducer from './metadata';

const initialState = {
  status: 'empty',
  analysisInput: '',
  metadata: metadataReducer(undefined, { type: 'INIT' })
};

function projectReducer(state = initialState, action) {
  switch (action.type) {
    case SET_PROJECT_DATA: {
      const { data } = action.payload;
      return {
        ...state,
        ...data
      };
    };
    default: {
      const { metadata } = state;
      return {
        ...state,
        metadata: metadataReducer(metadata, action)
      };
    }
  }
}

export default projectReducer;
