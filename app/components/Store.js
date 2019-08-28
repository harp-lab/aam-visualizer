import React, { useReducer, createContext } from 'react';

const actionTypes = {
  SET_PROJECTS: 'SET_PROJECTS'
};

const StoreContext = createContext();

function Store(props) {
  const initStore = {
    projects: {}
  };
  const [store, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case actionTypes.SET_PROJECTS:
        return {...state, projects: action.payload};
    }
  }, initStore);

  return (
    <StoreContext.Provider value={{ store, dispatch }}>
      { props.children }
    </StoreContext.Provider>);
}

function useActions(store, dispatch) {
  function setProjects(projects) {
    dispatch({ type: actionTypes.SET_PROJECTS, payload: projects });
  }
  return {
    setProjects
  };
}

export { StoreContext, useActions };
export default Store;