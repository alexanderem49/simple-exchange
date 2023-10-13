import { E, Far } from '@endo/far';
import { makeIssuerKit } from '@agoric/ertp';
import { makeFakeAva } from '../tools/fakeAva.js';
import { makeFakeBoard } from '@agoric/vats/tools/board-utils.js';
import { makeFakeStorageKit } from '@agoric/internal/src/storage-test-utils.js';
import { makeSimpleExchangeAssertions } from '../tools/assertions.js';
import { makeSimpleExchangeHelpers } from '../tools/helpers.js';

const init = async () => {
  const rootPath = 'root';
  const { rootNode } = makeFakeStorageKit(rootPath);
  const storageNode = rootNode.makeChildNode('simpleExchange');
  const marshaller = makeFakeBoard().getReadonlyMarshaller();

  const moolaKit = makeIssuerKit('Moola');
  const simoleanKit = makeIssuerKit('Simolean');
  const assets = { moolaKit, simoleanKit };

  return harden({
    marshaller,
    storageNode,
    assets,
  });
};

const initSimpleExchange = async (zoe, simpleExchange) => {
  return await E(zoe).startInstance(
    simpleExchange.installation,
    simpleExchange.issuerKeywordRecord,
    undefined,
    simpleExchange.privateArgs,
    'SimpleExchange',
  );
};

const setupFakeAgoricNamesWithAssets = async (
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

export const buildRootObject = async () => {
  let vatAdmin;
  let zoe;
  let agoricNames;
  let agoricNamesAdmin;
  let publicFacet;
  let creatorFacet;
  let instance;
  let subscriber;
  let assertions;
  let helpers;

  const { marshaller, storageNode, assets } = init();
  const fakeAva = makeFakeAva();

  return Far('root', {
    bootstrap: async (vats, devices) => {
      vatAdmin = await E(vats.vatAdmin).createVatAdminService(devices.vatAdmin);
      ({ zoeService: zoe } = await E(vats.zoe).buildZoe(
        vatAdmin,
        undefined,
        'zcf',
      ));
      ({ nameHub: agoricNames, nameAdmin: agoricNamesAdmin } = await E(
        vats.agoricNames,
      ).getNameHubKit());

      await setupFakeAgoricNamesWithAssets(assets, agoricNamesAdmin);

      const simpleExchangeV1Bundle = await E(vatAdmin).getBundleIDByName(
        'simple_exchange_v1',
      );

      const simpleExchangeV1Installation = await E(zoe).installBundleID(
        simpleExchangeV1Bundle,
      );

      const issuerKeywordRecord = harden({
        Asset: assets.moolaKit.issuer,
        Price: assets.simoleanKit.issuer,
      });

      const privateArgs = harden({ marshaller, storageNode });

      const simpleExchange = {
        installation: simpleExchangeV1Installation,
        issuerKeywordRecord: issuerKeywordRecord,
        privateArgs: privateArgs,
      };

      const simpleExchangeFacets = initSimpleExchange(zoe, simpleExchange);

      publicFacet = simpleExchangeFacets.publicFacet;
      creatorFacet = simpleExchangeFacets.creatorFacet;
      instance = simpleExchangeFacets.instance;

      subscriber = await E(publicFacet).getSubscriber();

      assertions = makeSimpleExchangeAssertions(fakeAva);
      helpers = makeSimpleExchangeHelpers();

      return true;
    },
    addOffer: async () => {
      const { sellOrderProposal, sellPayment } = helpers.makeSellOffer(
        assets,
        3n,
        5n,
      );

      const invitation = await E(publicFacet).makeInvitation();

      const seat = await E(zoe).offer(
        invitation,
        sellOrderProposal,
        sellPayment,
      );

      const offerResult = await E(seat).getOfferResult();
      assertions.assertOfferResult(offerResult, 'Order Added');
    },

    assertOrderBook: async (expectedBuys, expectedSells) => {
      const orderBook = await E(subscriber).getUpdateSince();
      assertions.assertOrderBook(orderBook, expectedBuys, expectedSells);
    },
  });
};
