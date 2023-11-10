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
  liveBuyOrders: [],
  liveSellOrders: [],
  assetBrandName: '',
  priceBrandName: '',
  setLiveOrders: (liveOffers) => {
    liveOffers.forEach((offer) => {
      if (offer[0].startsWith('buy-order-') && offer[1].invitationSpec.instancePath[0] === 'simpleExchangeInstance') {
        const { liveBuyOrders } = get();
        liveBuyOrders.push(offer[1].proposal);

        set({ liveBuyOrders });
      }
      if (offer[0].startsWith('sell-order-') && offer[1].invitationSpec.instancePath[0] === 'simpleExchangeInstance') {
        const { liveSellOrders } = get();
        liveSellOrders.push(offer[1].proposal);

        set({ liveSellOrders });
      }
    });
  },
  setSimpleExchangeStates: (simpleExchange) => {
    const assetBrand = simpleExchange.state.brands.Asset;
    const priceBrand = simpleExchange.state.brands.Price;

    const buyOrders = [...simpleExchange.state.orderBook.buys];
    const sellOrders = [...simpleExchange.state.orderBook.sells];

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
    if (!vbankAssets) return;
    const brandToDisplayInfo = {};
    [...vbankAssets].forEach(([, { brand, displayInfo }]) => (brandToDisplayInfo[brand] = displayInfo));

    set(() => ({ brandToDisplayInfo, vbankAssets }));
  },
  getDisplayInfo: (brand) => {
    const { brandToDisplayInfo } = get();
    return brandToDisplayInfo[brand];
  },
  getIssuerName: () => {
    const { vbankAssets, assetBrand, priceBrand } = get();
    let assetBrandName;
    let priceBrandName;

    if (assetBrand !== null) {
      vbankAssets.forEach((vbankAsset) => {
        if (vbankAsset[1].brand == assetBrand) {
          assetBrandName = vbankAsset[1].issuerName;
        }
        if (vbankAsset[1].brand == priceBrand) {
          priceBrandName = vbankAsset[1].issuerName;
        }
      });

      set(() => ({ assetBrandName, priceBrandName }));
    }
  }
}));
