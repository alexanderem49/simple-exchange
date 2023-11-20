import { useStore } from '../store/store.js';
import { AgoricChainStoragePathKind } from '@agoric/rpc';

export const makeStorageWatcher = () => {
  const { watcher, wallet, setSimpleExchangeStates, setVBank, setLiveOrders, getIssuerName } = useStore.getState();

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
      getIssuerName();
    });
  };

  const watchLiveOffers = () => {
    watcher.watchLatest(
      [AgoricChainStoragePathKind.Data, `published.wallet.${wallet.address}.current`],
      (smartWalletData) => {
        console.log('watching smartWallet');
        setLiveOrders(smartWalletData.liveOffers);
      },
      (log) => {
        console.log('ERROR: Watching smart wallet live offers', log);
      }
    );
  };

  const startWatching = () => {
    if (!watcher) return;

    if (wallet) {
      watchSmartWallet();
      watchLiveOffers();
    }

    watchVbankAsset();
    watchSimpleExchange();
  };

  return { startWatching };
};
