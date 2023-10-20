import { E } from '@endo/far';
import fs from 'fs/promises';

const updateReferenceList = async (homeP, { pathResolve }) => {
  const { board, agoricNames } = await homeP;

  const instance = await E(agoricNames).lookup(
    'instance',
    'simpleExchangeInstance',
  );
  const instanceBoardId = await E(board).getId(instance);

  const updatedReferences = {
    instance: instanceBoardId,
  };

  console.log({ updatedReferences });

  const defaultFile = pathResolve(`./referenceList.js`);
  console.log('writing', defaultFile);

  const defaultContent = `\
    // GENERATED FROM ${pathResolve('./updateReferenceList.js')}
    export default ${JSON.stringify(updatedReferences, undefined, 2)};
    `;
  await fs.writeFile(defaultFile, defaultContent);

  console.log('Done.');
};
export default updateReferenceList;
