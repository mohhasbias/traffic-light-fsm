// @flow
// definition
import { JSM, createStore, combineUpdater, createActions, handleActions } from './engine/fsm';

import './app.css';

// application

// updater definition
const actions = createActions({
  COUNTER: {
    DECREMENT: () => {},
    RESET: (duration) => duration,
  }
});

const counter = handleActions(
  {
    [actions.counter.decrement]: (state, action) => state - 1,
    [actions.counter.reset]: (state, action) => action.payload,
  },
  0
);

const counterDecrementAction = actions.counter.decrement;
const counterResetAction = actions.counter.reset;

const trafficLightCounter = combineUpdater({
  counter,
});

const store = createStore(trafficLightCounter);

// fsm definition
const fsm = new JSM({
  transitions: [
    { name: 'init', from: 'none', to: 'red' },
    { name: 'timer', from: 'red', to: (counter) => counter < 0 ? 'green' : 'red' },
    { name: 'timer', from: 'yellow', to: (counter) => counter < 0 ? 'red' : 'yellow' },
    { name: 'timer', from: 'green', to: (counter) => counter < 0 ? 'yellow' : 'green' },
  ]
});


// render definition
const render = (state, data) => {
  document.getElementById('app').innerHTML = `
    ${state.current === 'red' ?
      '<h1 class="red active">Red</h1>' :
      '<h2 class="red">Red</h2>'
    }
    ${state.current === 'yellow' ?
      '<h1 class="yellow active">Yellow</h1>' :
      '<h2 class="yellow">Yellow</h2>'
    }
    ${state.current === 'green' ?
      '<h1 class="green active">Green</h1>' :
      '<h2 class="green">Green</h2>'
    }
    <p>${('00' + data.counter).slice(-2)}</h1>
  `;
};

// app maintenance
store.subscribe(() => {
  // render ?
  render({ current: fsm.state }, store.getData());
  console.log(fsm.state, store.getData());
});

const REDCOUNTER_DURATION = 10;
const YELLOWCOUNTER_DURATION = 2;
const GREENCOUNTER_DURATION = 10;
fsm.onAfterTransition = (lifecycle) => {
  const { from, to } = lifecycle;
  console.log(`${from} -> ${to}`);
  if (from === 'green' && to === 'yellow') {
    store.dispatch(counterResetAction(YELLOWCOUNTER_DURATION));
  }
  if (from === 'red' && to === 'green') {
    store.dispatch(counterResetAction(GREENCOUNTER_DURATION));
  }
  if (from === 'yellow' && to === 'red') {
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