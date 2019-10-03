import { QUEUE_SNACKBAR, DEQUEUE_SNACKBAR, SET_LOADING, SET_DIALOG } from '../actionTypes';

const initialState = {
  snackbars: [],
  dialogs: {},
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
    case SET_DIALOG: {
      const { dialogId, data } = action.payload;
      const { dialogs } = state;
      return {
        ...state,
        dialogs: {
          ...dialogs,
          [dialogId]: data
        }
      };
    }
    default: return state;
  }
}
