import NavBar from './NavBar/NavBar.jsx';
import { useEffect, useState } from 'react';
import Trade from './Trade/Trade.jsx';
import { useStorageWatcher } from './utils/storageWatcher';
import { useStore } from '../src/store/store.js';

function App() {
  const [hash, setHash] = useState(window.location.hash);

  const setExchangeAssets = useStore((state) => state.setExchangeAssets);
  useStorageWatcher(setExchangeAssets);

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
    <div>
      <NavBar />
      {hash === '#trade' && <Trade />}
      {/*{hash === "#about" && <About />}*/}
      {/*{hash === "#contact" && <Contact />}*/}
    </div>
  );
}

export default App;
