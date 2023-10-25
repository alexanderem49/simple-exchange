import { useState } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { makeAgoricWalletConnection, suggestChain } from '@agoric/web-components';
import { useStore } from '../store/store.js';

function NavBar() {
  const [wallet, setWallet] = useState(null);
  const watcher = useStore((state) => state.watcher);

  const connectWallet = async () => {
    try {
      await suggestChain('https://local.agoric.net/network-config');
      const connectedWallet = await makeAgoricWalletConnection(watcher);
      useStore.setState({ wallet: connectedWallet });
      setWallet(connectedWallet);
      console.log('Wallet connected', { connectedWallet });
    } catch (error) {
      console.error('Error connecting to the wallet:', error);
    }
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
          <button
            onClick={connectWallet}
            disabled={!!wallet}
            className={`py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white focus:outline-none ${
              wallet ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            {wallet ? (
              <span className="flex items-center">
                <UserCircleIcon className="h-6 w-6 mr-2" aria-hidden="true" />
                {`${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`}
              </span>
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
