// @flow
import JSM from 'javascript-state-machine';
import { createStore as _createStore, combineReducers } from 'redux';
import assign from 'lodash/assign';

export const createStore = (...args) => {
  const store = _createStore(
    ...args, 
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );

  return assign(store, {
    getData: store.getState,
  });
}

export const combineUpdater = combineReducers;

export { JSM };