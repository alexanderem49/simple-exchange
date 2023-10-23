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
    const noop = () => { };
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

  // Create smart wallets for the seller and buyer
  const { smartWallet: sellerSmartWallet } = await setupSmartWallet(t, "agoric1test1seller");
  const { smartWallet: buyerSmartWallet } = await setupSmartWallet(t, "agoric1test1buyer");

  // Function to assert that the balance of a given asset in wallet is as expected
  const assertAssetBalance = async (wallet, expected) => {
    await eventLoopIteration();
    const currentSub = E(wallet).getCurrentSubscriber();
    const value = await headValue(currentSub);

    const balance = value.purses.filter(({ balance }) => {
      return balance.brand === expected.brand;
    });

    // in case purse is missing and expected value is 0
    if (expected.value === 0n && balance.length === 0) {
      return;
    }

    t.deepEqual(balance.length, 1);
    t.deepEqual(balance[0].balance.value, expected.value)
  }

  // Set up the deposit and offers facets for the seller and buyer
  const depositFacetSeller = await E(sellerSmartWallet).getDepositFacet();
  const offersFacetSeller = await E(sellerSmartWallet).getOffersFacet();
  const buyerDepositFacet = await E(buyerSmartWallet).getDepositFacet();
  const buyerOffersFacet = await E(buyerSmartWallet).getOffersFacet();

  // Set up the contract environment and the contract itself
  await setupFakeAgoricNamesWithAssets(
    { moolaKit, simoleanKit },
    agoricNamesAdmin,
  );

  await eventLoopIteration();

  const { publicFacet, instance } = await setupUpgradableSimpleExchange(zoe, {
    moolaKit,
    simoleanKit,
  });

  // Create amounts constants
  const moolaAmount = AmountMath.make(moolaKit.brand, 3n);
  const moolaZeroAmount = AmountMath.make(moolaKit.brand, 0n);
  const simoleansAmount = AmountMath.make(simoleanKit.brand, 5n);
  const simoleansZeroAmount = AmountMath.make(simoleanKit.brand, 0n);

  // Before mint all balances should be 0
  await assertAssetBalance(sellerSmartWallet, moolaZeroAmount);
  await assertAssetBalance(sellerSmartWallet, simoleansZeroAmount);
  await assertAssetBalance(buyerSmartWallet, moolaZeroAmount);
  await assertAssetBalance(buyerSmartWallet, simoleansZeroAmount);

  // Mint moolas to the seller
  const sellerMoolaPayment = moolaKit.mint.mintPayment(moolaAmount);
  await E(depositFacetSeller).receive(sellerMoolaPayment);

  // Assert that everyone has the correct balance after minting moolas to the seller
  await assertAssetBalance(sellerSmartWallet, moolaAmount);
  await assertAssetBalance(sellerSmartWallet, simoleansZeroAmount);
  await assertAssetBalance(buyerSmartWallet, moolaZeroAmount);
  await assertAssetBalance(buyerSmartWallet, simoleansZeroAmount);

  // Execute sell:
  // Seller requests and claims the invitation
  const sellerInvitation = await E(publicFacet).makeInvitation();
  await E(depositFacetSeller).receive(sellerInvitation);

  const sellerOffer = {
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

  // Seller makes the offer, selling moolas for simoleans
  E(offersFacetSeller).executeOffer(harden(sellerOffer));
  await eventLoopIteration();

  // After making an invitation, seller balance should be 0
  await assertAssetBalance(sellerSmartWallet, moolaZeroAmount);
  await assertAssetBalance(sellerSmartWallet, simoleansZeroAmount);
  await assertAssetBalance(buyerSmartWallet, moolaZeroAmount);
  await assertAssetBalance(buyerSmartWallet, simoleansZeroAmount);

  // Mint simoleans to the buyer
  const buyerSimoleanPayment = simoleanKit.mint.mintPayment(simoleansAmount);
  await E(buyerDepositFacet).receive(buyerSimoleanPayment);

  // Assert that everyone has the correct balance after minting simoleans to the buyer
  await assertAssetBalance(sellerSmartWallet, moolaZeroAmount);
  await assertAssetBalance(sellerSmartWallet, simoleansZeroAmount);
  await assertAssetBalance(buyerSmartWallet, moolaZeroAmount);
  await assertAssetBalance(buyerSmartWallet, simoleansAmount);

  // Execute buy:
  // Buyer requests and claims the invitation
  const buyerInvitation = await E(publicFacet).makeInvitation();
  await E(buyerDepositFacet).receive(buyerInvitation);

  const buyerOffer = {
    id: 'makeBuyOffer',
    invitationSpec: {
      source: 'contract',
      instance,
      publicInvitationMaker: 'makeInvitation',
    },
    proposal: {
      want: { Asset: moolaAmount },
      give: { Price: simoleansAmount },
    },
  }

  // Buyer makes the offer, buying moolas for simoleans
  E(buyerOffersFacet).executeOffer(harden(buyerOffer));
  await eventLoopIteration();

  // When the contract handles the offer, it should find the matching sell offer and
  // execute the exchange of assets between the seller and the buyer.

  // Assert that the exchange was successful
  await assertAssetBalance(sellerSmartWallet, moolaZeroAmount);
  await assertAssetBalance(sellerSmartWallet, simoleansAmount);
  await assertAssetBalance(buyerSmartWallet, moolaAmount);
  await assertAssetBalance(buyerSmartWallet, simoleansZeroAmount);

  t.pass();
});
