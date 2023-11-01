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
  setSimpleExchangeStates: (simpleExchange) => {
    const assetBrand = simpleExchange.state.brands.Asset;
    const priceBrand = simpleExchange.state.brands.Price;

    const buyOrders = [...simpleExchange.state.orderBook.buys];
    const sellOrders = [...simpleExchange.state.orderBook.sells];
    console.log('simpleExchange: ', simpleExchange);

    set({ buyOrders, sellOrders, assetBrand, priceBrand });
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
  setVBank: (vbankAssets) => {
    console.log('vbankAssets: ', vbankAssets);
    if (!vbankAssets) return;
    const brandToDisplayInfo = {};
    [...vbankAssets].forEach(([, { brand, displayInfo }]) => (brandToDisplayInfo[brand] = displayInfo));

    set(() => ({ brandToDisplayInfo, vbankAssets }));
  },
  getDisplayInfo: (brand) => {
    const { brandToDisplayInfo } = get();
    return brandToDisplayInfo[brand];
  }
}));
