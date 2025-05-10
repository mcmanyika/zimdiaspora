import { createGlobalState } from 'react-hooks-global-state';

const initialState = {
  appName: 'Welcome to ZimDiaspora',
  userName: null,
};

const { useGlobalState, getGlobalState, setGlobalState } = createGlobalState(initialState);

const setAppName = (appName) => setGlobalState('appName', appName);
const setUserName = (userName) => setGlobalState('userName', userName);

export { 
  useGlobalState, 
  getGlobalState, 
  setAppName,
  setUserName,
};
