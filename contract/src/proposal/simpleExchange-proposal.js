import { E } from '@endo/far';

export const initSimpleExchange = async (powers) => {
  const {
    consume: { zoe, board, chainStorage, agoricNames },
    produce: { simpleExchangeKit },
    installation: {
      consume: { simpleExchangeInstallation },
    },
    instance: {
      produce: { simpleExchangeInstance },
    },
  } = powers;

  const marshaller = await E(board).getPublishingMarshaller();
  const storageNode = await E(chainStorage).makeChildNode('simpleExchange');

  const assetIssuer = await E(agoricNames).lookup('issuer', 'BLD');
  const priceIssuer = await E(agoricNames).lookup('issuer', 'IST');

  const issuerKeywordRecord = harden({
    Asset: assetIssuer,
    Price: priceIssuer,
  });

  const privateArgs = harden({ marshaller, storageNode });

  const installation = await simpleExchangeInstallation;

  const instanceFacets = await E(zoe).startInstance(
    installation,
    issuerKeywordRecord,
    undefined,
    privateArgs,
    'simpleExchange',
  );

  simpleExchangeKit.reset();
  simpleExchangeKit.resolve(instanceFacets);
  simpleExchangeInstance.reset();
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
          agoricNames: true,
        },
        produce: {
          simpleExchangeKit: true,
        },
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
