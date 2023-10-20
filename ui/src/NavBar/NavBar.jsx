import { useState } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { makeAgoricWalletConnection, suggestChain } from '@agoric/web-components';
import { useStore } from '../store/store.js';

function NavBar() {
  const [isConnected, setIsConnected] = useState(false);
  const watcher = useStore((state) => state.watcher);

  const connectWallet = async () => {
    try {
      setIsConnected(true);
      await suggestChain('https://local.agoric.net/network-config');
      const wallet = await makeAgoricWalletConnection(watcher);
      useStore.setState({ wallet });
      console.log('Wallet connected', { wallet });
    } catch (error) {
      console.error('Error connecting to the wallet:', error);
      setIsConnected(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    console.log('Wallet disconnected');
    useStore.setState({ wallet: null });
  };

  console.log('wallet ');

  return (
    <header className="bg-gray-800 text-white py-4 px-6">
      <nav className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img src="/Agoric-logo-white.png" alt="Agoric Logo" className="h-8 mr-2" />
          <span className="text-2xl font-bold">Agoric</span>
        </div>

        <div className="flex items-center space-x-6">
          {isConnected ? (
            <>
              <span className="self-center text-white mr-4">User Name</span>
            </>
          ) : (
            <UserCircleIcon className="h-8 w-8 text-white mr-4" aria-hidden="true" />
          )}

          <button
            onClick={isConnected ? disconnectWallet : connectWallet}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white focus:outline-none"
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
