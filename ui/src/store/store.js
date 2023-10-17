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

  // Actions
  setWatcher: (watcher) => set({ watcher }),
  setBrands: (brands) => set({ brands }),

  updateBrands: (brandArray) => {
    const brandToKeyword = {};
    const keywordToBrand = {};

    brandArray.forEach(([keyword, brand]) => {
      brandToKeyword[brand] = keyword;
      keywordToBrand[keyword] = brand;
    });

    set({ brandToKeyword, keywordToBrand, brands: brandArray });
  },

  notifyUser: (severity, message) => {
    set({ notifierState: { open: true, severity, message } });
  },

  closeNotifier: () => {
    set({ notifierState: { open: false, severity: '', message: '' } });
  }
}));
