import React, { useReducer, useRef, createContext } from 'react';

const actionTypes = {
  QUEUE_SNACKBAR: 'QUEUE_SNACKBAR',
  DEQUEUE_SNACKBAR: 'DEQUEUE_SNACKBAR',

  SET_PROJECTS: 'SET_PROJECTS',
  SET_PROJECT: 'SET_PROJECT',
  DEL_PROJECT: 'DEL_PROJECT',
  SEL_PROJECT: 'SEL_PROJECT',

  SHOW_ENV: 'SHOW_ENV',
  SHOW_KONT: 'SHOW_KONT'
};

const StoreContext = createContext();

function Store(props) {
  const initStore = {
    snackbars: [],

    projects: {},
    selectedProjectId: undefined
  };
  const [store, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case actionTypes.QUEUE_SNACKBAR: {
        const { payload } = action;
        const { snackbars } = state;
        const { text } = payload;
        //snackbars = [...snackbars];
        return { ...state, snackbars: [...snackbars, text] };
      }
      case actionTypes.DEQUEUE_SNACKBAR: {
        const { snackbars } = state;
        const text = snackbars.shift();
        return { ...state, snackbars: [...snackbars] };
      }

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
      case actionTypes.SEL_PROJECT: {
        const { id } = action;
        state.selectedProjectId = id;
        return { ...state };
      }

      case actionTypes.SHOW_ENV: {
        const { id } = action;
        const { metadata } = getSelectedProject(state);
        metadata.envs[id].show();
        return { ...state };
      }
      case actionTypes.SHOW_KONT: {
        const { id } = action;
        const { metadata } = getSelectedProject(state);
        metadata.konts[id].show();
        return { ...state };
      }
    }
  }, initStore);

  return (
    <StoreContext.Provider value={{ store, dispatch }}>
      { props.children }
    </StoreContext.Provider>);
}
function getSelectedProject(state) {
  const { projects, selectedProjectId } = state;
  return projects[selectedProjectId];
}

function useActions(store, dispatch) {
  // notifications
  function queueSnackbar(text) {
    dispatch({ type: actionTypes.QUEUE_SNACKBAR, payload: { text } });
  }
  function dequeueSnackbar() {
    const { snackbars } = store;
    const text = snackbars.shift();
    dispatch({ type: actionTypes.DEQUEUE_SNACKBAR });
    return text;
  }

  // projects
  function setProjects(projects) {
    dispatch({ type: actionTypes.SET_PROJECTS, payload: projects });
  }
  function setProject(projectId, project) {
    dispatch({ type: actionTypes.SET_PROJECT, id: projectId, payload: project });
  }
  function delProject(projectId) {
    dispatch({ type: actionTypes.DEL_PROJECT, id: projectId });
  }
  function selProject(projectId) {
    dispatch({ type: actionTypes.SEL_PROJECT, id: projectId });
  }

  // panels
  function showEnv(envId) {
    dispatch({ type: actionTypes.SHOW_ENV, id: envId });
  }
  function showKont(kontId) {
    dispatch({ type: actionTypes.SHOW_KONT, id: kontId });
  }

  return {
    queueSnackbar, dequeueSnackbar,
    setProjects, setProject, delProject, selProject,
    showEnv, showKont
  };
}

export { StoreContext, useActions };
export default Store;