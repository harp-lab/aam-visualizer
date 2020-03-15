/**
 * guarantee object
 * @param {Object} namespace module namespace
 * @param {String} objectName object name
 * @returns {Object} object
 */
export function reqObject(namespace, objectName) {
  let object = namespace[objectName];
  if (!object) {
    object = {};
  }
  return object;
}

/**
 * guarantee function factory
 * @param {Object} namespace module namespace
 * @param {String} factoryName factory name
 * @returns {Function} function
 */
export function reqFunctionFactory(namespace, factoryName) {
  let factory = namespace[factoryName];
  if (!factory) {
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
 * @returns {ReactElement} element
 */
export function reqReactElement(namespace, elementName) {
  let element = namespace[elementName];
  if (!element) {
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
 * @returns {Function} action
 */
export function reqReduxAction(namespace, actionName) {
  let action = namespace[actionName];
  if (!action) {
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
 * @returns {Function} reducer
 */
export function reqReduxReducer(namespace, reducerName) {
  let reducer = namespace[reducerName];
  if (!reducer) {
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
