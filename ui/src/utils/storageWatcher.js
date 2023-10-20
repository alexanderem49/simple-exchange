import { useStore } from '../store/store.js';
import { AgoricChainStoragePathKind } from '@agoric/rpc';

const makeStorageWatcher = () => {
  const { watcher, wallet, registerRentals, setExchangedBrands } = useStore.getState();

  const watchSmartWallet = () => {
    watcher.watchLatest(
      [AgoricChainStoragePathKind.Data, `published.wallet.${wallet.address}.current`],
      (smartWalletData) => {
        console.log('SmartWallet Update', smartWalletData);
        registerRentals(smartWalletData.offerToPublicSubscriberPaths);
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
      setExchangedBrands(vbankAssets);
    });
  };

  const startWatching = () => {
    if (!watcher) return;

    if (wallet) {
      watchSmartWallet();
    }

    watchVbankAsset();
  };

  return { startWatching };
};

export { makeStorageWatcher };
