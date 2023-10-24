import { E } from '@endo/far';
import fs from 'fs/promises';

const updateAssetList = async (homeP, { pathResolve }) => {
  const { agoricNames, board } = E.get(homeP);
  const assets = {};

  const names = ['BLD', 'IST'];
  await Promise.all(
    names.map(async (assetName) => {
      const issuer = await E(agoricNames).lookup('issuer', assetName);
      const brand = await E(agoricNames).lookup('brand', assetName);
      const [issuerBoardId, brandBoardId] = await Promise.all([
        E(board).getId(issuer),
        E(board).getId(brand),
      ]);
      assets[assetName] = { issuer: issuerBoardId, brand: brandBoardId };
    }),
  );

  const defaultFile = pathResolve(`./assetList.js`);
  console.log('writing', defaultFile);

  const defaultContent = `\
  // GENERATED FROM ${pathResolve('./updateAssetList.js')}
  export default ${JSON.stringify(assets, undefined, 2)};
  `;
  await fs.writeFile(defaultFile, defaultContent);

  console.log('Done.');
};
export default updateAssetList;
