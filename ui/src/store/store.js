import create from 'zustand';
import { makeAgoricChainStorageWatcher } from '@agoric/rpc';

export const useStore = create((set, get) => ({
  watcher: makeAgoricChainStorageWatcher('http://localhost:26657', 'agoriclocal'),
  brands: [],
  brandToKeyword: {},
  keywordToBrand: {},
  assetBrand: {},
  priceBrand: {},
  brandToDisplayInfo: {},
  smartWalletPurses: [],
  vbankPurses: [],
  wallet: null,
  notifierState: { open: false, severity: '', message: '' },
  exchangeAssets: [],
  vbankAssets: [],
  buyOrders: [],
  sellOrders: [],
  setOrders: (simpleExchange) => {
    const buyOrders = [...simpleExchange.state.orderBook.buys];
    const sellOrders = [...simpleExchange.state.orderBook.sells];
    console.log('orderBook: ', simpleExchange.state.orderBook);
    set({ buyOrders, sellOrders });
  },
  notifyUser: (severity, message) => {
    set(() => ({
      notifierState: { open: true, severity, message }
    }));
  },
  closeNotifier: () => {
    set(() => ({
      notifierState: { open: false, severity: '', message: '' }
    }));
  },
  setExchangedBrands: (vbankAssets) => {
    const assetBrand = {};
    const priceBrand = {};
    console.log('vbankAssets: ', vbankAssets);
    vbankAssets.forEach(([denom, assetInfo]) => {
      if (denom === 'ubld') {
        assetBrand[assetInfo.issuerName] = assetInfo;
      } else if (denom === 'uist') {
        priceBrand[assetInfo.issuerName] = assetInfo;
      }
    });

    set({ assetBrand, priceBrand });
  },
  getDisplayInfo: (brand) => {
    const { assetBrand, priceBrand, vbankAssets } = get();

    if (assetBrand[brand]) {
      return assetBrand[brand];
    }

    if (priceBrand[brand]) {
      return priceBrand[brand];
    }

    if (!vbankAssets || !Array.isArray(vbankAssets)) {
      return null;
    }

    const asset = vbankAssets.find((asset) => asset[1]?.issuerName === brand);
    return asset ? asset[1] : null;
  }
}));
