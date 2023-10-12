import { makeIssuerKit } from '@agoric/ertp';
import { makeNameHubKit } from '@agoric/vats';
import path from 'path';
import bundleSource from '@endo/bundle-source';
import { E, Far } from '@endo/far';
import { makeFakeMarshaller } from '@agoric/notifier/tools/testSupports.js';
import { makeFakeStorageKit } from '@agoric/internal/src/storage-test-utils.js';

export const setupAssets = () => {
  const moolaKit = makeIssuerKit('Moola');
  const simoleanKit = makeIssuerKit('Simoleans');

  return harden({ moolaKit, simoleanKit });
};
harden(setupAssets);

export const setupSimpleExchange = async (zoe) => {
  const filename = new URL(import.meta.url).pathname;
  const dirname = path.dirname(filename);
  const contractPath = `${dirname}/../src/simpleExchange.js`;
  const contractBundle = await bundleSource(contractPath);
  const contractInstallation = E(zoe).install(contractBundle);

  const { moolaKit, simoleanKit } = setupAssets();

  const { publicFacet, creatorFacet, instance } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
  );

  return harden({ publicFacet, creatorFacet, instance });
};
harden(setupSimpleExchange)

export const setupUpgradableSimpleExchange = async (zoe) => {
  const filename = new URL(import.meta.url).pathname;
  const dirname = path.dirname(filename);
  const contractPath = `${dirname}/../src/upgradableSimpleExchange.js`;
  const contractBundle = await bundleSource(contractPath);
  const contractInstallation = E(zoe).install(contractBundle);

  const rootPath = 'root';
  const { rootNode } = makeFakeStorageKit(rootPath);
  const storageNode = rootNode.makeChildNode('simpleExchange');
  const marshaller = Far('fake marshaller', { ...makeFakeMarshaller() });

  const privateArgs = harden({ marshaller, storageNode });
  const { moolaKit, simoleanKit } = setupAssets();

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

export const setupFakeAgoricNamesWithAssets = async () => {
  const assets = setUpAssets();
  const { nameHub, nameAdmin } = makeNameHubKit();

  const [issuerHubKit, brandHubKit] = await Promise.all([
    E(nameAdmin).provideChild('issuer'),
    E(nameAdmin).provideChild('brand'),
  ]);

  for (const value of Object.values(assets)) {
    const name = value.issuer.getAllegedName();
    issuerHubKit.nameAdmin.update(name, value.issuer);
    brandHubKit.nameAdmin.update(name, value.brand);
  }

  return { agoricNames: nameHub, agoricNamesAdmin: nameAdmin, ...assets };
};
harden(setupFakeAgoricNamesWithAssets);

export const setupSmartWallet = async (t) => {
  const { simpleProvideWallet } = t.context;

  const address = `agoric1test1`;
  const smartWallet = simpleProvideWallet(address);

  return {
    smartWallet,
  };
};
harden(setupSmartWallet);
