// @flow
// definition
const createStore = (updater) => {
  let _state = updater();
  let _listeners = [];

  const getData = () => _state;
  const subscribe = (listener) => _listeners.push(listener);
  const dispatch = (action) => {
    _state = updater(_state, action);
    _listeners.forEach(l => l());
  };

  return {
    getData,
    subscribe,
    dispatch
  }
};

const combineUpdater = (updatersObject) => {
  return (state = {}, action) => Object.keys(updatersObject).reduce(
    (nextState, key) => {
      nextState[key] = updatersObject[key](state[key], action);
      return nextState;
    },
    {}
  );
};

const createFSM = (transitionRules) => {
  let _currentState = '';
  let _previousState = _currentState;
  let _rules = transitionRules;

  const begin = (state) => _currentState = state;
  const getCurrentState = () => _currentState;
  const getPreviousState = () => _previousState;
  const doTransition = (...args) => {
    _previousState = _currentState;
    _currentState = _rules
      .filter(rule => rule.from === _currentState)
      .filter(rule => rule.when(...args))
      .map(rule => rule.to)[0] || _currentState;
  };

  return {
    begin,
    doTransition,
    getCurrentState,
    getPreviousState,
  };
};

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

// fsm definition
const redToYellowCondition = (data) => data.counter <= 0;
const yellowToGreenCondition = (data) => data.counter <= 0;
const greenToRedCondition = (data) => data.counter <= 0;

const transitionRules = [
  { from: 'red', to: 'yellow', when: redToYellowCondition },
  { from: 'yellow', to: 'green', when: yellowToGreenCondition },
  { from: 'green', to: 'red', when: greenToRedCondition }
];

const fsm = createFSM(transitionRules);

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
  render(
    {
      prev: fsm.getPreviousState(),
      current: fsm.getCurrentState()
    }, 
    store.getData()
  );
  console.log(fsm.getCurrentState(), store.getData());
  fsm.doTransition(store.getData());
});

// app start
fsm.begin('red');
store.dispatch(counterResetAction(REDCOUNTER_DURATION));

// app trigger
setInterval(() => {
  const prevState = fsm.getPreviousState();
  const currentState = fsm.getCurrentState();

  console.log(`${prevState} -> ${currentState}`);

  if (currentState === 'red') {
    if (prevState === 'green') {
      store.dispatch(counterResetAction(REDCOUNTER_DURATION));
    } else {
      store.dispatch(counterDecrementAction());
    }
  } 

  if (currentState === 'yellow') {
    if (prevState === 'red') {
      store.dispatch(counterResetAction(YELLOWCOUNTER_DURATION));
    } else {
      store.dispatch(counterDecrementAction());
    }
  } 

  if (currentState === 'green') {
    if (prevState === 'yellow') {
      store.dispatch(counterResetAction(GREENCOUNTER_DURATION));
    } else {
      store.dispatch(counterDecrementAction());
    }
  } 
}, 1000);