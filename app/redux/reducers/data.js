import { SET_USER, SET_TITLE } from '../actionTypes';

const initialState = {
  userId: undefined
}
export default function dataReducer(state = initialState, action) {
  switch (action.type) {
    case SET_USER: {
      const { userId } = action.payload;
      return { ...state, userId };
    }
    case SET_TITLE: {
      const { title } = action.payload;
      return { ...state, title };
    }
    default: return state;
  }
}
