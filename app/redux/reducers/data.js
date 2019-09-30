import { SET_USER, SET_VIEW } from '../actionTypes';
import { LOGIN_VIEW } from '../consts';

const initialState = {
  userId: undefined,
  view: LOGIN_VIEW
}
export default function dataReducer(state = initialState, action) {
  switch (action.type) {
    case SET_USER: {
      const { userId } = action.payload;
      return { ...state, userId };
    }
    case SET_VIEW: {
      const { view } = action.payload;
      return { ...state, view };
    }
    default: return state;
  }
}
