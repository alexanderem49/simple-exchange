import { test } from '../tools/prepare-test-env-ava.js';
import { E } from '@endo/eventual-send';
import { AmountMath } from '@agoric/ertp';
import { makeScalarMapStore } from '@agoric/store';
import { makeDefaultTestContext } from '@agoric/smart-wallet/test/contexts.js';
import { eventLoopIteration } from '@agoric/internal/src/testing-utils.js';
import { buildRootObject as buildBankVatRoot } from '@agoric/vats/src/vat-bank.js';
import buildManualTimer from '@agoric/zoe/tools/manualTimer.js';
import {
  makeMockTestSpace,
  headValue,
} from '@agoric/smart-wallet/test/supports.js';
import {
  setupAssets,
  setupSmartWallet,
  setupUpgradableSimpleExchange,
  setupFakeAgoricNamesWithAssets,
} from '../tools/setup.js';

test.before(async (t) => {
  const withBankManager = async () => {
    const noBridge = undefined;
    const baggage = makeScalarMapStore('baggage');
    const bankManager = E(
      buildBankVatRoot(undefined, undefined, baggage),
    ).makeBankManager(noBridge);
    const noop = () => {};
    const space0 = await makeMockTestSpace(noop);
    space0.produce.bankManager.reset();
    space0.produce.bankManager.resolve(bankManager);
    return space0;
  };

  const assets = setupAssets();
  const timer = buildManualTimer(t.log);

  const defaultTestContext = await makeDefaultTestContext(t, withBankManager);

  const {
    consume: { zoe, agoricNames },
  } = defaultTestContext;

  const walletAgoricNames = agoricNames;

  t.context = {
    ...defaultTestContext,
    zoe,
    timer,
    walletAgoricNames,
    ...assets,
  };
});

test('test make sell offer', async (t) => {
  const {
    zoe,
    moolaKit,
    simoleanKit,
    consume: { agoricNamesAdmin, agoricNames },
  } = t.context;

  const { smartWallet } = await setupSmartWallet(t);

  const depositFacet = await E(smartWallet).getDepositFacet();
  const offersFacet = await E(smartWallet).getOffersFacet();
  const currentSub = E(smartWallet).getCurrentSubscriber();

  await setupFakeAgoricNamesWithAssets(
    { moolaKit, simoleanKit },
    agoricNamesAdmin,
  );

  await eventLoopIteration();

  const { publicFacet, instance } = await setupUpgradableSimpleExchange(zoe, {
    moolaKit,
    simoleanKit,
  });

  const moolaAmount = AmountMath.make(moolaKit.brand, 3n);
  const simoleansAmount = AmountMath.make(simoleanKit.brand, 5n);

  const aliceMoolaPayment = moolaKit.mint.mintPayment(moolaAmount);
  await E(depositFacet).receive(aliceMoolaPayment);

  const invitation = await E(publicFacet).makeInvitation();
  await E(depositFacet).receive(invitation);

  const offer = {
    id: 'makeSellOffer',
    invitationSpec: {
      source: 'contract',
      instance,
      publicInvitationMaker: 'makeInvitation',
    },
    proposal: {
      give: { Asset: moolaAmount },
      want: { Price: simoleansAmount },
    },
  };

  E(offersFacet).executeOffer(harden(offer));
  await eventLoopIteration();

  const currentState = await headValue(currentSub);
  let liveOffers = new Map(currentState.liveOffers);
  console.log(currentState);
  console.log(liveOffers.get('makeSellOffer'));
  t.deepEqual(liveOffers.get('makeSellOffer'), offer);
});
