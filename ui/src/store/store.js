import create from 'zustand';
import { makeAgoricChainStorageWatcher } from '@agoric/rpc';

export const useStore = create((set) => ({
  watcher: makeAgoricChainStorageWatcher('http://localhost:26657', 'agoriclocal'),
  brands: [],
  brandToKeyword: {},
  keywordToBrand: {},
  brandToDisplayInfo: {},
  smartWalletPurses: [],
  vbankPurses: [],
  wallet: null,
  notifierState: { open: false, severity: '', message: '' },
  exchangeAssets: [],
  vbankAssets: [],
  setExchangeAssets: (assets) => set({ exchangeAssets: assets }),
  setVbankAssets: (assets) => set({ vbankAssets: assets }),
  getDisplayInfo: (brand) => {
    const state = useStore.getState();
    if (!state.vbankAssets || !Array.isArray(state.vbankAssets)) {
      return null;
    }

    const asset = state.vbankAssets.find((asset) => asset[1]?.issuerName === brand);
    return asset ? asset[1]?.displayInfo : null;
  }
}));
