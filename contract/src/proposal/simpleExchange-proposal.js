import { E } from '@endo/far';

export const setupAssets = () => {
  const moolaKit = makeIssuerKit('Moola');
  const simoleanKit = makeIssuerKit('Simolean');
  return harden({ moolaKit, simoleanKit });
};

export const setupFakeAgoricNamesWithAssets = async (
  assets,
  agoricNamesAdmin,
) => {
  for (const value of Object.values(assets)) {
    const name = value.issuer.getAllegedName();
    await Promise.all([
      E(E(agoricNamesAdmin).lookupAdmin('issuer')).update(name, value.issuer),
      E(E(agoricNamesAdmin).lookupAdmin('brand')).update(name, value.brand),
    ]);
  }
};

export const initSimpleExchange = async (powers) => {
  const {
    consume: { zoe, board, chainStorage, agoricNamesAdmin },
    installation: {
      consume: { simpleExchangeInstallation },
    },
    instance: {
      produce: { simpleExchangeInstance },
    },
  } = powers;

  const assets = setupAssets();
  await setupFakeAgoricNamesWithAssets(assets, await agoricNamesAdmin);

  const marshaller = await E(board).getPublishingMarshaller();
  const storageNode = await E(chainStorage).makeChildNode('simpleExchange');

  const issuerKeywordRecord = harden({
    Asset: assets.moolaKit.issuer,
    Price: assets.simoleanKit.issuer,
  });

  const privateArgs = harden({ marshaller, storageNode });

  const instanceFacets = await E(zoe).startInstance(
    simpleExchangeInstallation,
    issuerKeywordRecord,
    undefined,
    privateArgs,
    'simpleExchange',
  );
  console.log('Log: instanceFacets = ', { instanceFacets });

  simpleExchangeInstance.resolve(instanceFacets.instance);
};

export const getManifestForInitSimpleExchange = async (
  { restoreRef },
  { contractRef },
) =>
  harden({
    manifest: {
      [initSimpleExchange.name]: {
        consume: {
          zoe: 'zoe',
          board: true,
          chainStorage: true,
          agoricNamesAdmin: true,
        },
        produce: {},
        installation: {
          consume: {
            simpleExchangeInstallation: true,
          },
        },
        instance: {
          produce: {
            simpleExchangeInstance: true,
          },
        },
        issuer: {},
        brand: {},
      },
    },
    installations: {
      simpleExchangeInstallation: restoreRef(contractRef),
    },
  });
