import { E, Far } from '@endo/far';
import { makeIssuerKit } from '@agoric/ertp';
import { makeFakeAva } from '../tools/fakeAva.js';
import { makeFakeBoard } from '@agoric/vats/tools/board-utils.js';
import { makeFakeStorageKit } from '@agoric/internal/src/storage-test-utils.js';
import { makeSimpleExchangeAssertions } from '../tools/assertions.js';
import { makeSimpleExchangeHelpers } from '../tools/helpers.js';

const init = () => {
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

const dummyEventLoopCallback = async () => {
  return Promise.resolve('Dummy iterate event loop');
};

export const buildRootObject = async () => {
  let vatAdmin;
  let zoe;
  let agoricNames;
  let agoricNamesAdmin;
  let publicFacet;
  let creatorFacet;
  let adminFacet;
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

      const [simpleExchangeV1Bundle, issuerHubKit, brandHubKit] =
        await Promise.all([
          E(vatAdmin).getBundleIDByName('simple_exchange_v1'),
          E(agoricNamesAdmin).provideChild('issuer'),
          E(agoricNamesAdmin).provideChild('brand'),
        ]);

      const writes = [...Object.values(assets)].map(async (value) => {
        const name = value.issuer.getAllegedName();
        await Promise.all([
          E(issuerHubKit.nameAdmin).update(name, value.issuer),
          E(brandHubKit.nameAdmin).update(name, value.brand),
        ]);
      });

      Promise.all(writes);

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

      const simpleExchangeFacets = await initSimpleExchange(
        zoe,
        simpleExchange,
      );

      publicFacet = simpleExchangeFacets.publicFacet;
      creatorFacet = simpleExchangeFacets.creatorFacet;
      adminFacet = simpleExchangeFacets.adminFacet;
      instance = simpleExchangeFacets.instance;

      subscriber = await E(publicFacet).getSubscriber();

      assertions = makeSimpleExchangeAssertions(fakeAva);
      helpers = makeSimpleExchangeHelpers();

      return true;
    },
    upgrade: async (bundleName) => {
      console.log({
        bundleName,
      });
      const bundleId = await E(vatAdmin).getBundleIDByName(bundleName);

      const upgradeResult = await E(adminFacet).upgradeContract(bundleId, {
        marshaller,
        storageNode,
      });
      console.log({
        upgradeResult,
      });
    },
    addSellOffer: async () => {
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
      dummyEventLoopCallback();

      const offerResult = await E(seat).getOfferResult();
      assertions.assertOfferResult(offerResult, 'Order Added');
    },

    addBuyOffer: async () => {
      const { buyOrderProposal, buyPayment } = helpers.makeBuyOffer(
        assets,
        3n,
        5n,
      );

      const invitation = await E(publicFacet).makeInvitation();

      const seat = await E(zoe).offer(invitation, buyOrderProposal, buyPayment);
      dummyEventLoopCallback();

      const offerResult = await E(seat).getOfferResult();
      assertions.assertOfferResult(offerResult, 'Order Added');
    },

    assertState: async (expectedBuys, expectedSells) => {
      const stateBook = await E(subscriber).getUpdateSince();

      assertions.assertState(stateBook, expectedBuys, expectedSells, assets.moolaKit.brand, assets.simoleanKit.brand);
    },

    assertStateLength: async (expectedBuys, expectedSells) => {
      const stateBook = await E(subscriber).getUpdateSince();
      console.log(stateBook);
      assertions.assertStateLength(stateBook, expectedBuys, expectedSells);
    },
  });
};
