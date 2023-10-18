import { useStore } from '../store/store.js';
import { AgoricChainStoragePathKind } from '@agoric/rpc';

const makeStorageWatcher = () => {
  const { watcher, wallet, registerRentals } = useStore.getState();

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

  const startWatching = () => {
    if (!watcher) return;

    if (wallet) {
      watchSmartWallet();
    }

    const watchVbankAsset = () => {
      watcher.watchLatest([AgoricChainStoragePathKind.Data, 'published.agoricNames.vbankAsset'], (vbankAssets) => {
        console.log('VBankAsset Update', vbankAssets);
      });
    };
  };

  return { startWatching };
};

export { makeStorageWatcher };
