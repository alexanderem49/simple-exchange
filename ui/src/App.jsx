import NavBar from './NavBar/NavBar.jsx';
import { useEffect, useState } from 'react';
import Trade from './Trade/Trade.jsx';

function App() {
  const [hash, setHash] = useState(window.location.hash);

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
