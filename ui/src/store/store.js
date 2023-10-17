import create from 'zustand';

export const useStore = create((set) => ({
  // States
  watcher: null,
  brands: [],
  brandToKeyword: {},
  keywordToBrand: {},
  brandToDisplayInfo: {},
  smartWalletPurses: [],
  vbankPurses: [],
  wallet: null,
  notifierState: { open: false, severity: '', message: '' },
  exchangeAssets: [],
  setExchangeAssets: (assets) => set({ exchangeAssets: assets })
}));
