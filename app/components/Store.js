import React, { useReducer, useRef, createContext } from 'react';

const actionTypes = {
  SET_PROJECTS: 'SET_PROJECTS',
  SET_PROJECT: 'SET_PROJECT',
  DEL_PROJECT: 'DEL_PROJECT'
};

const StoreContext = createContext();

function Store(props) {
  const initStore = {
    projects: {}
  };
  const [store, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case actionTypes.SET_PROJECTS: {
        const { payload } = action;
        return { ...state, projects: payload };
      }
      case actionTypes.SET_PROJECT: {
        const { id, payload } = action;
        const { projects } = state;
        projects[id] = payload;
        return { ...state };
      }
      case actionTypes.DEL_PROJECT: {
        const { id } = action;
        const { projects } = state;
        delete projects[id];
        return { ...state };
      }
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
  function setProject(projectId, project) {
    dispatch({ type: actionTypes.SET_PROJECT, id: projectId, payload: project });
  }
  function delProject(projectId) {
    dispatch({ type: actionTypes.DEL_PROJECT, id: projectId });
  }
  return {
    setProjects, setProject, delProject
  };
}

export { StoreContext, useActions };
export default Store;