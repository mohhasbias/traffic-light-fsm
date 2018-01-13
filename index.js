// @flow
// definition
import JSM from 'javascript-state-machine';
import { createStore as _createStore, combineReducers } from 'redux';

const createStore = (...args) => _createStore(
  ...args, 
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

const combineUpdater = combineReducers;

// application

// store definition
const COUNTER_DECREMENT = 'COUNTER_DECREMENT';
const COUNTER_RESET = 'COUNTER_RESET';
const counter = (state=0, action) => {
  if (!action) {
    return state;
  }
  switch(action.type) {
    case COUNTER_DECREMENT:
      return state - 1;
    case COUNTER_RESET:
      return action.payload;
    default:
      return state;
  }
}
const counterDecrementAction = () => ({
  type: COUNTER_DECREMENT
});
const counterResetAction = (duration) => ({
  type: COUNTER_RESET,
  payload: duration
});

const REDCOUNTER_DURATION = 5;
const YELLOWCOUNTER_DURATION = 7;
const GREENCOUNTER_DURATION = 9;

const trafficLightCounter = combineUpdater({
  counter,
});

const store = createStore(trafficLightCounter);
// rename to avoid confusion
store.getData = store.getState;

// fsm definition
const fsm = new JSM({
  transitions: [
    { name: 'init', from: 'none', to: 'red' },
    { name: 'timer', from: 'red', to: (counter) => counter < 0 ? 'yellow' : 'red' },
    { name: 'timer', from: 'yellow', to: (counter) => counter < 0 ? 'green' : 'yellow' },
    { name: 'timer', from: 'green', to: (counter) => counter < 0 ? 'red' : 'green' },
  ]
});

// render definition
const render = (state, data) => {
  document.getElementById('app').innerHTML = `
    <h1>${state.current}</h1>
    <p>${('00' + data.counter).slice(-2)}</h1>
  `;
};

// app maintenance
store.subscribe(() => {
  // render ?
  render({ current: fsm.state }, store.getData());
  console.log(fsm.state, store.getData());
});

fsm.onAfterTransition = (lifecycle) => {
  const { from, to } = lifecycle;
  console.log(`${from} -> ${to}`);
  if (from === 'red' && to === 'yellow') {
    store.dispatch(counterResetAction(YELLOWCOUNTER_DURATION));
  }
  if (from === 'yellow' && to === 'green') {
    store.dispatch(counterResetAction(GREENCOUNTER_DURATION));
  }
  if (from === 'green' && to === 'red') {
    store.dispatch(counterResetAction(REDCOUNTER_DURATION));
  }
};

// app start
fsm.init();
store.dispatch(counterResetAction(REDCOUNTER_DURATION));

// app trigger
setInterval(() => {
  store.dispatch(counterDecrementAction());
  fsm.timer(store.getData().counter);
}, 1000);