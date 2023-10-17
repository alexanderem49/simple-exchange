// import { useEffect } from 'react';
// import { useStore } from '../store/store';
// import { AgoricChainStoragePathKind, makeAgoricChainStorageWatcher } from '@agoric/rpc';
//
// export const useStorageWatcher = () => {
//   const setWatcher = useStore((state) => state.setWatcher);
//   const setExchangeAssets = useStore((state) => state.setExchangeAssets);
//   const watcher = useStore((state) => state.watcher);
//
//   useEffect(() => {
//     if (!watcher) {
//       const newWatcher = makeAgoricChainStorageWatcher('http://localhost:26657', 'agoriclocal');
//       setWatcher(newWatcher);
//
//       newWatcher.watchLatest([AgoricChainStoragePathKind.Data, 'published.agoricNames.vbankAsset'], (vbankAssets) => {
//         console.log('VBankAsset Update', vbankAssets);
//         if (vbankAssets) {
//           const updatedAssets = vbankAssets.map((asset) => ({
//             brand: asset[1]?.brand,
//             displayInfo: asset[1]?.displayInfo
//           }));
//           setExchangeAssets(updatedAssets);
//         }
//       });
//     }
//   }, [watcher, setWatcher, setExchangeAssets]);
// };

import { useEffect } from 'react';
import { vbankAssets } from './mockData';

export const useStorageWatcher = (setExchangeAssets) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('VBankAsset Update', vbankAssets);
      if (vbankAssets) {
        const updatedAssets = vbankAssets.map((asset) => ({
          brand: asset[1]?.brand,
          displayInfo: asset[1]?.displayInfo
        }));
        setExchangeAssets(updatedAssets);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [setExchangeAssets]);
};
