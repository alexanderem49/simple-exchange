import { E, Far } from '@endo/far';
import { makeFakeAva } from '../tools/fakeAva.js';
import { makeFakeBoard } from '@agoric/vats/tools/board-utils.js';
import { makeSimpleExchangeAssertions } from '../tools/assertions.js';
import { makeSimpleExchangeHelpers } from '../tools/helpers.js';
import {
  setupAssets,
  setupSmartWallet,
  setupFakeAgoricNamesWithAssets,
} from './setup.js';

export const buildRootObject = async () => {
  let vatAdmin;
  let zoe;
  let agoricNames;
  let agoricNamesAdmin;
  let publicFacet;
  let creatorFacet;
  let instance;
  let assertions;
  let helpers;

  const assets = setupAssets();
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
        'simpleExchange_v1',
      );

      const simpleExchangeV1Installation = await E(zoe).installBundleID(
        simpleExchangeV1Bundle,
      );

      const issuerKeywordRecord = harden({
        Asset: assets.moolaKit.issuer,
        Price: assets.simoleanKit.issuer,
      });

      const rootPath = 'root';
      const { rootNode } = makeFakeStorageKit(rootPath);
      const storageNode = rootNode.makeChildNode('simpleExchange');
      const marshaller = makeFakeBoard().getReadonlyMarshaller();

      const privateArgs = harden({ marshaller, storageNode });

      const simpleExchangeFacets = await E(zoe).startInstance(
        simpleExchangeV1Installation,
        issuerKeywordRecord,
        undefined,
        privateArgs,
      );

      publicFacet = simpleExchangeFacets.publicFacet;
      creatorFacet = simpleExchangeFacets.creatorFacet;
      instance = simpleExchangeFacets.instance;

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
  });
};
