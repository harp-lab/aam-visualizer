import { NODE_ENV, DEV_ENV } from 'store/consts';

function notify(name, path) {
  const message = `[fext] '${name}' undefined in ${path}`;
  if (NODE_ENV === DEV_ENV)
    console.info(message);
}

/**
 * guarantee object
 * @param {Object} namespace module namespace
 * @param {String} objectName object name
 * @param {String} fextPath path to display for debug
 * @returns {Object} object
 */
export function reqObject(namespace, objectName, fextPath) {
  let object = namespace[objectName];
  if (!object) {
    notify(objectName, fextPath);
    object = {};
  }
  return object;
}

/**
 * guarantee function
 * @param {Object} namespace module namespace
 * @param {String} functionName function name
 * @param {String} fextPath path to display for debug
 * @returns {Function} function
 */
export function reqFunction(namespace, functionName, fextPath) {
  let func = namespace[functionName];
  if (!func) {
    notify(functionName, fextPath);
    func = function() {};
  }
  return func;
}

/**
 * guarantee function factory
 * @param {Object} namespace module namespace
 * @param {String} factoryName factory name
 * @param {String} fextPath path to display for debug
 * @returns {Function} function
 */
export function reqFunctionFactory(namespace, factoryName, fextPath) {
  let factory = namespace[factoryName];
  if (!factory) {
    notify(factoryName, fextPath);
    factory = function() {
      return function() {};
    };
  }
  return factory;
}

/**
 * guarantee React element
 * @param {String} namespace module namespace
 * @param {String} element element name
 * @param {String} fextPath path to display for debug
 * @returns {ReactElement} element
 */
export function reqReactElement(namespace, elementName, fextPath) {
  let element = namespace[elementName];
  if (!element) {
    notify(elementName, fextPath);
    /**
     * null React element
     * @returns null rendering
     */
    element = function() {
      return null;
    };
  }
  return element;
}

/**
 * guarantees Redux action
 * @param {String} moduleName module namespace
 * @param {String} actionName action name
 * @param {String} fextPath path to display for debug
 * @returns {Function} action
 */
export function reqReduxAction(namespace, actionName, fextPath) {
  let action = namespace[actionName];
  if (!action) {
    notify(actionName, fextPath);
    /**
     * @returns {Function} dispatch
     */
    action = function() {
      return function(dispatch) {};
    };
  }
  return action;
}

/**
 * guarantee Redux reducer
 * @param {String} namespace module namespace
 * @param {String} reducerName reducer name
 * @param {String} fextPath path to display for debug
 * @returns {Function} reducer
 */
export function reqReduxReducer(namespace, reducerName, fextPath) {
  let reducer = namespace[reducerName];
  if (!reducer) {
    notify(reducerName, fextPath);
    /**
     * @param {Object} state current state
     * @param {Object} action
     * @returns {Object} new state
     */
    reducer = function(state = {}, action) {
      return state;
    };
  }
  return reducer;
}
