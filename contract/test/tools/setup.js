import { makeIssuerKit } from '@agoric/ertp';
import path from 'path';
import bundleSource from '@endo/bundle-source';
import { E, Far } from '@endo/far';
import { makeFakeMarshaller } from '@agoric/notifier/tools/testSupports.js';
import { makeFakeStorageKit } from '@agoric/internal/src/storage-test-utils.js';

export const setupSimpleExchange = async (zoe, assets) => {
  const filename = new URL(import.meta.url).pathname;
  const dirname = path.dirname(filename);
  const contractPath = `${dirname}/../../src/simpleExchange.js`;
  const contractBundle = await bundleSource(contractPath);
  const contractInstallation = E(zoe).install(contractBundle);

  const { moolaKit, simoleanKit } = assets;

  const { publicFacet, creatorFacet, instance } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
  );

  return harden({ publicFacet, creatorFacet, instance });
};
harden(setupSimpleExchange);

export const setupUpgradableSimpleExchange = async (zoe, assets) => {
  const filename = new URL(import.meta.url).pathname;
  const dirname = path.dirname(filename);
  const contractPath = `${dirname}/../../src/upgradableSimpleExchange.js`;
  const contractBundle = await bundleSource(contractPath);
  const contractInstallation = E(zoe).install(contractBundle);

  const rootPath = 'root';
  const { rootNode } = makeFakeStorageKit(rootPath);
  const storageNode = rootNode.makeChildNode('simpleExchange');
  const marshaller = Far('fake marshaller', { ...makeFakeMarshaller() });

  const privateArgs = harden({ marshaller, storageNode });
  const { moolaKit, simoleanKit } = assets;

  const { publicFacet, creatorFacet, instance } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  return harden({ publicFacet, creatorFacet, instance });
};

export const setupAssets = () => {
  const moolaKit = makeIssuerKit('Moola');
  const simoleanKit = makeIssuerKit('Simolean');
  const nothingKit = makeIssuerKit('Nothing');

  return harden({ moolaKit, simoleanKit, nothingKit });
};
harden(setupAssets);

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
harden(setupFakeAgoricNamesWithAssets);

export const setupSmartWallet = async (t, address = `agoric1test1`) => {
  const { simpleProvideWallet } = t.context;

  const smartWallet = simpleProvideWallet(address);

  return {
    smartWallet,
  };
};
harden(setupSmartWallet);
