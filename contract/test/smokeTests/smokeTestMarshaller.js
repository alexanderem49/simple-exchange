import { Far, makeMarshal } from '@endo/marshal';
import referenceList from './referenceList.js';
import assetList from './assetList.js';

const makeSmokeTestMarshaller = () => {
  const { table, assets } = initLocalBoard();

  const { serialize, unserialize } = makeMarshal(
    table.convertValToSlot,
    table.convertSlotToVal,
    {
      serializeBodyFormat: 'smallcaps',
      marshalSaveError: (_err) => {},
      errorTagging: 'off',
    },
  );

  return {
    serialize,
    unserialize,
    table,
    assets,
  };
};

const initLocalBoard = () => {
  const { convertValToSlot, convertSlotToVal, ingest } = makeLocalBoard();

  const instance = Far('simpleExchangeInstance', {});
  ingest(instance, referenceList.instance);
  const agoricNamesAssets = ingestAgoricNamesAssets(ingest);

  return {
    table: {
      convertValToSlot,
      convertSlotToVal,
      ingest,
    },
    assets: {
      instance,
      agoricNamesAssets,
    },
  };
};

const makeLocalBoard = () => {
  const valToSlot = new Map();
  const slotToVal = new Map();

  const convertValToSlot = (val) => {
    return valToSlot.get(val);
  };

  const convertSlotToVal = (slot) => {
    return slotToVal.get(slot);
  };

  const ingest = (val, slot) => {
    slotToVal.set(slot, val);
    valToSlot.set(val, slot);
  };

  return harden({
    convertSlotToVal,
    convertValToSlot,
    ingest,
  });
};

const ingestAgoricNamesAssets = (ingest) => {
  const assets = {};

  for (const [keyword, { issuer, brand }] of Object.entries(assetList)) {
    const remoteBrand = Far(`${keyword}Brand`, {});
    const remoteIssuer = Far(`${keyword}Issuer`, {});
    ingest(remoteBrand, brand);
    ingest(remoteIssuer, issuer);
    assets[keyword] = { brand: remoteBrand, issuer: remoteIssuer };
  }

  return harden(assets);
};

harden(makeSmokeTestMarshaller);
export { makeSmokeTestMarshaller };
