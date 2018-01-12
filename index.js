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
const REDCOUNTER_DECREMENT = 'REDCOUNTER_DECREMENT';
const REDCOUNTER_RESET = 'REDCOUNTER_RESET';
const redCounter = (state=REDCOUNTER_DURATION, action) => {
  if (!action) {
    return state;
  }
  switch(action.type) {
    case REDCOUNTER_DECREMENT:
      return counter(state, counterDecrementAction());
    case REDCOUNTER_RESET:
      return counter(state, counterResetAction(REDCOUNTER_DURATION));
    default:
      return state;
  }
}
const redCounterDecrementAction = () => ({
  type: REDCOUNTER_DECREMENT,
});
const redCounterResetAction = () => ({
  type: REDCOUNTER_RESET,
});


const YELLOWCOUNTER_DURATION = 7;
const YELLOWCOUNTER_DECREMENT = 'YELLOWCOUNTER_DECREMENT';
const YELLOWCOUNTER_RESET = 'YELLOWCOUNTER_RESET';
const yellowCounter = (state=YELLOWCOUNTER_DURATION, action) => {
  if (!action) {
    return state;
  }
  switch(action.type) {
    case YELLOWCOUNTER_DECREMENT:
      return counter(state, counterDecrementAction());
    case YELLOWCOUNTER_RESET:
      return counter(state, counterResetAction(YELLOWCOUNTER_DURATION));
    default:
      return state;
  }
}
const yellowCounterDecrementAction = () => ({
  type: YELLOWCOUNTER_DECREMENT,
});
const yellowCounterResetAction = () => ({
  type: YELLOWCOUNTER_RESET,
});

const GREENCOUNTER_DURATION = 9;
const GREENCOUNTER_DECREMENT = 'GREENCOUNTER_DECREMENT';
const GREENCOUNTER_RESET = 'GREENCOUNTER_RESET';
const greenCounter = (state=GREENCOUNTER_DURATION, action) => {
  if (!action) {
    return state;
  }
  switch(action.type) {
    case GREENCOUNTER_DECREMENT:
      return counter(state, counterDecrementAction());
    case GREENCOUNTER_RESET:
      return counter(state, counterResetAction(GREENCOUNTER_DURATION));
    default:
      return state;
  }
}
const greenCounterDecrementAction = () => ({
  type: GREENCOUNTER_DECREMENT,
});
const greenCounterResetAction = () => ({
  type: GREENCOUNTER_RESET,
});

const trafficLightCounter = combineUpdater({
  redCounter,
  yellowCounter,
  greenCounter,
});

const store = createStore(trafficLightCounter);

const redToYellowCondition = (data) => data.redCounter <= 0;
const yellowToGreenCondition = (data) => data.yellowCounter <= 0;
const greenToRedCondition = (data) => data.greenCounter <= 0;

const transitionRules = [
  { from: 'red', to: 'yellow', when: redToYellowCondition },
  { from: 'yellow', to: 'green', when: yellowToGreenCondition },
  { from: 'green', to: 'red', when: greenToRedCondition }
];

const fsm = createFSM(transitionRules);

// app start
fsm.begin('red');

// app maintenance
store.subscribe(() => {
  console.log(store.getData());
  fsm.doTransition(store.getData());
  // render ?
});

// app trigger
setInterval(() => {
  switch(fsm.getCurrentState()) {
    case 'red':
      switch(fsm.getPreviousState()) {
        case 'green':
          store.dispatch(redCounterResetAction());
          break;
        default:
          store.dispatch(redCounterDecrementAction());
      }
      break;
    case 'yellow':
      switch(fsm.getPreviousState()) {
        case 'red':
          store.dispatch(yellowCounterResetAction());
          break;
        default:
          store.dispatch(yellowCounterDecrementAction());
      }
      break;
    case 'green':
      switch(fsm.getPreviousState()) {
        case 'yellow':
          store.dispatch(greenCounterResetAction());
          break;
        default:
          store.dispatch(greenCounterDecrementAction());
      }
      break;
  }
}, 1000);