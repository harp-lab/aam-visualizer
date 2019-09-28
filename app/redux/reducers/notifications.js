import { QUEUE_SNACKBAR, DEQUEUE_SNACKBAR, SET_LOADING } from '../actionTypes';

const initialState = {
  snackbars: [],
  loading: false
};

export default function(state = initialState, action) {
  switch (action.type) {
    case QUEUE_SNACKBAR: {
      const { text } = action.payload;
      const { snackbars } = state;
      return {
        ...state,
        snackbars: [...snackbars, text]
      };
    }
    case DEQUEUE_SNACKBAR: {
      const { snackbars } = state;
      const text = snackbars.shift();
      return {
        ...state,
        snackbars: [...snackbars]
      };
    }
    case SET_LOADING: {
      const { loading } = action.payload;
      return { ...state, loading };
    }
    default: return state;
  }
}