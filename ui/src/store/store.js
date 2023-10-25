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
  setExchangedBrands: (vbankAssets) => {
    const assetBrand = {};
    const priceBrand = {};

    vbankAssets.forEach(([denom, assetInfo]) => {
      console.log('denom: ', denom);
      console.log('assetInfo: ', assetInfo);
    });

    vbankAssets.forEach(([denom, assetInfo]) => {
      if (denom === 'ubld') {
        assetBrand[denom] = assetInfo;
      } else if (denom === 'uist') {
        priceBrand[denom] = assetInfo;
      }
    });

    set({ assetBrand, priceBrand });
  },
  setVbankAssets: (assets) => set({ vbankAssets: assets }),
  getDisplayInfo: (brand) => {
    const { assetBrand, priceBrand, vbankAssets } = get();

    if (assetBrand[brand]) {
      return assetBrand[brand].displayInfo;
    }

    if (priceBrand[brand]) {
      return priceBrand[brand].displayInfo;
    }

    if (!vbankAssets || !Array.isArray(vbankAssets)) {
      return null;
    }

    const asset = vbankAssets.find((asset) => asset[1]?.issuerName === brand);
    return asset ? asset[1]?.displayInfo : null;
  }
}));
