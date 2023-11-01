import { useEffect, useState } from 'react';
import { makeStorageWatcher } from './utils/storageWatcher';
import { useStore } from './store/store.js';
import ErrorBoundary from './ErrorBoundary/ErrorBoundary.jsx';
import NavBar from './NavBar/NavBar.jsx';
import Trade from './Trade/Trade.jsx';
import { CustomizedSnackbars as UserNotifier } from './UserNotifier/UserNotifier.jsx';

function App() {
  const [hash, setHash] = useState(window.location.hash);

  const wallet = useStore((state) => state.wallet);

  useEffect(() => {
    const storageWatcher = makeStorageWatcher();
    storageWatcher.startWatching();
  }, [wallet]);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange, false);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div>
        <NavBar />
        {hash === '#trade' && <Trade />}
      </div>
      <UserNotifier />
    </ErrorBoundary>
  );
}

export default App;
