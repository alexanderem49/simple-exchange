import { useStore } from '../store/store.js';
import { AgoricChainStoragePathKind } from '@agoric/rpc';

const makeStorageWatcher = () => {
  const { watcher, wallet, setSimpleExchangeStates, setVBank } = useStore.getState();

  const watchSmartWallet = () => {
    watcher.watchLatest(
      [AgoricChainStoragePathKind.Data, `published.wallet.${wallet.address}.current`],
      (smartWalletData) => {
        console.log('SmartWallet Update', smartWalletData);
        useStore.setState({
          smartWalletPurses: smartWalletData.purses
        });
      },
      (log) => {
        console.log('ERROR: Watching smart wallet purses', log);
      }
    );
  };

  const watchVbankAsset = () => {
    watcher.watchLatest([AgoricChainStoragePathKind.Data, 'published.agoricNames.vbankAsset'], (vbankAssets) => {
      setVBank(vbankAssets);
    });
  };

  const watchSimpleExchange = () => {
    watcher.watchLatest([AgoricChainStoragePathKind.Data, 'published.simpleExchange'], (simpleExchange) => {
      setSimpleExchangeStates(simpleExchange);
    });
  };

  const startWatching = () => {
    if (!watcher) return;

    if (wallet) {
      watchSmartWallet();
    }

    watchVbankAsset();
    watchSimpleExchange();
  };

  return { startWatching };
};

export { makeStorageWatcher };
