import { test } from '../tools/prepare-test-env-ava.js';
import { E } from '@endo/far';
import { setUpZoeForTest } from '@agoric/inter-protocol/test/supports.js';
import { makeIssuerKit, AmountMath, AssetKind } from '@agoric/ertp';
import { makeSimpleExchangeAssertions } from '../tools/assertions.js';
import { makeSimpleExchangeHelpers } from '../tools/helpers.js';
import { setupUpgradableSimpleExchange, setupAssets } from '../tools/setup.js';
import { eventLoopIteration } from '@agoric/internal/src/testing-utils.js';

test.beforeEach(async (t) => {
  const { zoe } = await setUpZoeForTest(() => {});
  const assets = setupAssets();

  const makeSimpleMake = (brand) => (value) => AmountMath.make(brand, value);
  const moola = makeSimpleMake(assets.moolaKit.brand);
  const simoleans = makeSimpleMake(assets.simoleanKit.brand);

  t.context = {
    zoe,
    assets,
    moola,
    simoleans,
  };
});

test('make sell offer', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  // Setup the contract
  const { publicFacet, instance } = await setupUpgradableSimpleExchange(
    zoe,
    assets,
  );

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const subscriber = await E(publicFacet).getSubscriber();
  let state = await E(subscriber).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  const expectedAsset = moolaKit.brand;
  const expectedPrice = simoleanKit.brand;
  // The order book should be empty
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Alice makes a sell offer
  const invitation = await E(publicFacet).makeInvitation();
  const { sellOrderProposal, sellPayment } = helpers.makeSellOffer(
    assets,
    3n,
    4n,
  );

  // Alice executes the offer
  const seat = await E(zoe).offer(invitation, sellOrderProposal, sellPayment);
  await eventLoopIteration();

  // Assert that the offer was added successfully
  const offerResult = await E(seat).getOfferResult();
  assertions.assertOfferResult(offerResult, 'Order Added');

  // Assert that the order book was updated and now contains the Alice sell offer
  expectedBuys = [];
  expectedSells = [sellOrderProposal];
  state = await E(subscriber).getUpdateSince();
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );
});

test('make buy offer', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  // Setup the contract
  const { publicFacet, instance } = await setupUpgradableSimpleExchange(
    zoe,
    assets,
  );

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const subscriber = await E(publicFacet).getSubscriber();
  let state = await E(subscriber).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  const expectedAsset = moolaKit.brand;
  const expectedPrice = simoleanKit.brand;
  // The order book should be empty
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Bob makes a buy offer
  const invitation = await E(publicFacet).makeInvitation();
  const { buyOrderProposal, buyPayment } = helpers.makeBuyOffer(assets, 3n, 4n);

  // Bob executes the offer
  const seat = await E(zoe).offer(invitation, buyOrderProposal, buyPayment);
  await eventLoopIteration();

  // Assert that the offer was added successfully
  const offerResult = await E(seat).getOfferResult();
  assertions.assertOfferResult(offerResult, 'Order Added');

  // Assert that the order book was updated and now contains the Bob buy offer
  expectedBuys = [buyOrderProposal];
  expectedSells = [];
  state = await E(subscriber).getUpdateSince();
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );
});

test('make trade', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  // Setup the contract
  const { publicFacet, instance } = await setupUpgradableSimpleExchange(
    zoe,
    assets,
  );

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const subscriber = await E(publicFacet).getSubscriber();
  let state = await E(subscriber).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  const expectedAsset = moolaKit.brand;
  const expectedPrice = simoleanKit.brand;
  // The order book should be empty
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  const moolaValue = 3n;
  const simoleanValue = 4n;

  // Alice makes a sell offer
  const aliceInvitation = await E(publicFacet).makeInvitation();
  const { sellOrderProposal, sellPayment } = helpers.makeSellOffer(
    assets,
    moolaValue,
    simoleanValue,
  );

  // Alice executes the offer
  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    sellOrderProposal,
    sellPayment,
  );
  await eventLoopIteration();

  // Assert that the offer was added successfully
  const offerResult = await E(aliceSeat).getOfferResult();
  assertions.assertOfferResult(offerResult, 'Order Added');

  // Assert that the order book was updated and now contains the Alice sell offer
  expectedBuys = [];
  expectedSells = [sellOrderProposal];
  state = await E(subscriber).getUpdateSince();
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Bob makes a buy offer
  const bobInvitation = await E(publicFacet).makeInvitation();
  const { buyOrderProposal, buyPayment } = helpers.makeBuyOffer(
    assets,
    moolaValue,
    simoleanValue,
  );

  // Bob executes the offer
  const bobSeat = await E(zoe).offer(
    bobInvitation,
    buyOrderProposal,
    buyPayment,
  );
  await eventLoopIteration();

  // Assert that the offer was added successfully
  const bobOfferResult = await E(bobSeat).getOfferResult();
  assertions.assertOfferResult(bobOfferResult, 'Order Added');

  expectedBuys = [];
  expectedSells = [];
  // As the trade is made, the order book should be cleared
  state = await E(subscriber).getUpdateSince();
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Assert assets are swapped
  const bobPayout = await E(bobSeat).getPayout('Asset');
  const alicePayout = await E(aliceSeat).getPayout('Price');

  const amountMoola = await E(moolaKit.issuer).getAmountOf(bobPayout);
  const amountSimolean = await E(simoleanKit.issuer).getAmountOf(alicePayout);

  assertions.assertPayoutAmount(amountMoola.value, moolaValue);
  assertions.assertPayoutAmount(amountSimolean.value, simoleanValue);
});

test('make offer with wrong issuers', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit, nothingKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  // Setup the contract
  const { publicFacet, instance } = await setupUpgradableSimpleExchange(
    zoe,
    assets,
  );

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  // The nothing issuer is not a valid issuer for this contract
  assertions.assertNotIssuer(issuers.Asset, nothingKit.issuer);
  assertions.assertNotIssuer(issuers.Price, nothingKit.issuer);

  const subscriber = await E(publicFacet).getSubscriber();
  let state = await E(subscriber).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  const expectedAsset = moolaKit.brand;
  const expectedPrice = simoleanKit.brand;
  // The order book should be empty
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Alice makes a sell offer with the wrong `want` issuer
  let invitation = await E(publicFacet).makeInvitation();
  let { sellOrderProposal, sellPayment, expectedError } =
    helpers.makeInvalidOffer(assets, 3n, 4n, 'wrongWantIssuer');

  // Alice executes the offer with the wrong `want` issuer
  let seatPromise = E(zoe).offer(invitation, sellOrderProposal, sellPayment);
  await eventLoopIteration();

  // Assert that the offer with the wrong `want` issuer failed
  await assertions.assertThrowError(seatPromise, expectedError);

  // Alice makes a sell offer with the wrong `give` issuer
  invitation = await E(publicFacet).makeInvitation();
  ({ sellOrderProposal, sellPayment, expectedError } = helpers.makeInvalidOffer(
    assets,
    3n,
    4n,
    'wrongGiveIssuer',
  ));

  // Alice executes the offer with the wrong `give` issuer
  seatPromise = E(zoe).offer(invitation, sellOrderProposal, sellPayment);
  await eventLoopIteration();

  // Assert that the offer with the wrong `give` issuer failed
  await assertions.assertThrowError(seatPromise, expectedError);
});

test('make offer with offerProposal missing attribute', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  // Setup the contract
  const { publicFacet, instance } = await setupUpgradableSimpleExchange(
    zoe,
    assets,
  );

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const subscriber = await E(publicFacet).getSubscriber();
  let state = await E(subscriber).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  const expectedAsset = moolaKit.brand;
  const expectedPrice = simoleanKit.brand;
  // The order book should be empty
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Alice makes a sell offer with the missing `want` issuer
  let invitation = await E(publicFacet).makeInvitation();
  let { sellOrderProposal, sellPayment, expectedError } =
    helpers.makeInvalidOffer(assets, 3n, 4n, 'missingWant');

  // Alice executes the offer with the missing `want` issuer
  let seatPromise = E(zoe).offer(invitation, sellOrderProposal, sellPayment);
  await eventLoopIteration();

  // Assert that the offer with the missing `want` issuer failed
  await assertions.assertThrowError(seatPromise, expectedError);

  invitation = await E(publicFacet).makeInvitation();
  ({ sellOrderProposal, sellPayment, expectedError } = helpers.makeInvalidOffer(
    assets,
    3n,
    4n,
    'missingGive',
  ));

  // Alice executes the offer with the missing `give` issuer
  seatPromise = E(zoe).offer(invitation, sellOrderProposal, sellPayment);
  await eventLoopIteration();

  // Assert that the offer with the missing `give` issuer failed
  await assertions.assertThrowError(seatPromise, expectedError);
});

test('make offer without offerProposal', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);

  // Setup the contract
  const { publicFacet, instance } = await setupUpgradableSimpleExchange(
    zoe,
    assets,
  );

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const subscriber = await E(publicFacet).getSubscriber();
  let state = await E(subscriber).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  const expectedAsset = moolaKit.brand;
  const expectedPrice = simoleanKit.brand;
  // The order book should be empty
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Alice makes a sell offer without offerProposal
  const invitation = await E(publicFacet).makeInvitation();

  const seatPromise = E(zoe).offer(invitation, undefined, undefined);
  await eventLoopIteration();

  // Assert that the offer without offerProposal failed
  await assertions.assertThrowError(
    seatPromise,
    '"exchange" proposal: want: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]',
  );
});

test('offers with null or invalid shapes on the proposals', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  // Setup the contract
  const { publicFacet, instance } = await setupUpgradableSimpleExchange(
    zoe,
    assets,
  );

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const subscriber = await E(publicFacet).getSubscriber();
  let state = await E(subscriber).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  const expectedAsset = moolaKit.brand;
  const expectedPrice = simoleanKit.brand;
  // The order book should be empty
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Get the array of proposals with invalid shapes
  const invalidShapes = helpers.makeInvalidOffer(
    assets,
    3n,
    4n,
    'invalidShapes',
  );

  const promises = invalidShapes.map(
    async ({ sellOrderProposal, sellPayment, expectedError }) => {
      // Alice makes a sell offer with the invalid shape
      const invitation = await E(publicFacet).makeInvitation();

      // Alice executes the offer with the invalid shape
      const seatPromise = E(zoe).offer(
        invitation,
        sellOrderProposal,
        sellPayment,
      );
      await eventLoopIteration();

      // Assert that the offer with the invalid shape failed
      await assertions.assertThrowError(seatPromise, expectedError);
    },
  );

  await Promise.all(promises);
});

test('make offer with NFT', async (t) => {
  const { zoe, assets } = t.context;
  const { simoleanKit } = assets;

  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  // Make NFT kit
  const moolaKit = makeIssuerKit('Moola', AssetKind.SET);

  // Setup the contract
  const { publicFacet, instance } = await setupUpgradableSimpleExchange(zoe, {
    moolaKit,
    simoleanKit,
  });

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const subscriber = await E(publicFacet).getSubscriber();
  let state = await E(subscriber).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  const expectedAsset = moolaKit.brand;
  const expectedPrice = simoleanKit.brand;
  // The order book should be empty
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  const moolaValue = harden([{ name: 'Moola', description: 'A set of moola' }]);
  const simoleanValue = 4n;

  // Alice makes a sell offer
  const aliceInvitation = await E(publicFacet).makeInvitation();
  const { sellOrderProposal, sellPayment } = helpers.makeSellOffer(
    { moolaKit, simoleanKit },
    moolaValue,
    simoleanValue,
  );

  // Alice executes the offer
  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    sellOrderProposal,
    sellPayment,
  );
  await eventLoopIteration();

  // Assert that the offer was added successfully
  const aliceOfferResult = await E(aliceSeat).getOfferResult();
  assertions.assertOfferResult(aliceOfferResult, 'Order Added');

  // Assert that the order book was updated and now contains the Alice sell offer
  expectedBuys = [];
  expectedSells = [sellOrderProposal];
  state = await E(subscriber).getUpdateSince();
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Bob makes a buy offer
  const bobInvitation = await E(publicFacet).makeInvitation();
  const { buyOrderProposal, buyPayment } = helpers.makeBuyOffer(
    { moolaKit, simoleanKit },
    moolaValue,
    simoleanValue,
  );

  // Bob executes the offer
  const bobSeat = await E(zoe).offer(
    bobInvitation,
    buyOrderProposal,
    buyPayment,
  );
  await eventLoopIteration();

  // Assert that the offer was added successfully
  const bobOfferResult = await E(bobSeat).getOfferResult();
  assertions.assertOfferResult(bobOfferResult, 'Order Added');

  // As the trade is made, the order book should be cleared
  expectedBuys = [];
  expectedSells = [];
  state = await E(subscriber).getUpdateSince();
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Asset assets are swapped
  const bobPayout = await E(bobSeat).getPayout('Asset');
  const alicePayout = await E(aliceSeat).getPayout('Price');

  const amountMoola = await E(moolaKit.issuer).getAmountOf(bobPayout);
  const amountSimolean = await E(simoleanKit.issuer).getAmountOf(alicePayout);

  assertions.assertPayoutAmount(amountMoola.value, moolaValue);
  assertions.assertPayoutAmount(amountSimolean.value, simoleanValue);
});

test('make offer with misplaced issuers', async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);

  // Setup the contract
  const { publicFacet, instance } = await setupUpgradableSimpleExchange(
    zoe,
    assets,
  );

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);
  assertions.assertNotIssuer(issuers.Asset, simoleanKit.issuer);
  assertions.assertNotIssuer(issuers.Price, moolaKit.issuer);

  const simoleanAmount = AmountMath.make(simoleanKit.brand, 3n);
  const moolaAmount = AmountMath.make(moolaKit.brand, 4n);

  // Alice makes a sell offer with misplaced keyword-issuer pair
  const invitation = await E(publicFacet).makeInvitation();

  const sellOrderProposalSwapped = harden({
    give: { Asset: simoleanAmount },
    want: { Price: moolaAmount },
    exit: { onDemand: null },
  });

  const sellPaymentSwapped = simoleanKit.mint.mintPayment(simoleanAmount);

  // Alice executes the offer with the misplaced keyword-issuer pair
  const seat = await E(zoe).offer(invitation, sellOrderProposalSwapped, {
    Asset: sellPaymentSwapped,
  });
  await eventLoopIteration();

  const offerResult = await E(seat).getOfferResult();
  assertions.assertOfferResult(offerResult, new Error('Brand mismatch'));
});

test("make trade with surplus assets in Alice's payout", async (t) => {
  const { zoe, assets } = t.context;
  const { moolaKit, simoleanKit } = assets;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  // Setup the contract
  const { publicFacet, instance } = await setupUpgradableSimpleExchange(
    zoe,
    assets,
  );

  const issuers = await E(zoe).getIssuers(instance);
  assertions.assertIssuer(issuers.Asset, moolaKit.issuer);
  assertions.assertIssuer(issuers.Price, simoleanKit.issuer);

  const subscriber = await E(publicFacet).getSubscriber();
  let state = await E(subscriber).getUpdateSince();

  let expectedBuys = [];
  let expectedSells = [];
  const expectedAsset = moolaKit.brand;
  const expectedPrice = simoleanKit.brand;
  // The order book should be empty
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Alice gives 6 moolas and Bob wants 3 moolas. Alice should retain 3 moolas
  const aliceMoolaGiveValue = 6n;
  const aliceSimoleanWantValue = 4n;

  const bobSimoleanGiveValue = 4n;
  const bobMoolaWantValue = 3n;

  // Alice makes a sell offer
  const aliceInvitation = await E(publicFacet).makeInvitation();
  const { sellOrderProposal, sellPayment } = helpers.makeSellOffer(
    assets,
    aliceMoolaGiveValue,
    aliceSimoleanWantValue,
  );

  // Alice executes the offer
  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    sellOrderProposal,
    sellPayment,
  );
  await eventLoopIteration();

  // Assert that the offer was added successfully
  const offerResult = await E(aliceSeat).getOfferResult();
  assertions.assertOfferResult(offerResult, 'Order Added');

  // Assert that the order book was updated and now contains the Alice sell offer
  expectedBuys = [];
  expectedSells = [sellOrderProposal];
  state = await E(subscriber).getUpdateSince();
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Bob makes a buy offer
  const bobInvitation = await E(publicFacet).makeInvitation();
  const { buyOrderProposal, buyPayment } = helpers.makeBuyOffer(
    assets,
    bobMoolaWantValue,
    bobSimoleanGiveValue,
  );

  // Bob executes the offer
  const bobSeat = await E(zoe).offer(
    bobInvitation,
    buyOrderProposal,
    buyPayment,
  );
  await eventLoopIteration();

  // Assert that the offer was added successfully
  const bobOfferResult = await E(bobSeat).getOfferResult();
  assertions.assertOfferResult(bobOfferResult, 'Order Added');

  expectedBuys = [];
  expectedSells = [];
  // As the trade is made, the order book should be cleared
  state = await E(subscriber).getUpdateSince();
  assertions.assertState(
    state,
    expectedBuys,
    expectedSells,
    expectedAsset,
    expectedPrice,
  );

  // Assert assets are swapped
  const bobPayout = await E(bobSeat).getPayout('Asset');
  const alicePayout = await E(aliceSeat).getPayout('Price');

  const amountMoola = await E(moolaKit.issuer).getAmountOf(bobPayout);
  const amountSimolean = await E(simoleanKit.issuer).getAmountOf(alicePayout);

  assertions.assertPayoutAmount(amountMoola.value, bobMoolaWantValue);
  assertions.assertPayoutAmount(amountSimolean.value, aliceSimoleanWantValue);
});

test('make empty amount', async (t) => {
  const { zoe, assets } = t.context;
  const assertions = makeSimpleExchangeAssertions(t);
  const helpers = makeSimpleExchangeHelpers();

  // Setup the contract
  const { publicFacet } = await setupUpgradableSimpleExchange(zoe, assets);

  // Alice makes a sell order with empty values
  let invitation = await E(publicFacet).makeInvitation();
  const { sellOrderProposal, sellPayment } = helpers.makeSellOffer(
    assets,
    0n,
    0n,
  );

  // Alice executes the offer
  let seat = await E(zoe).offer(invitation, sellOrderProposal, sellPayment);
  await eventLoopIteration();

  // Assert that the offer was rejected
  let throwPromise = E(seat).getOfferResult();
  let expectedError = 'Asset value should not be empty';
  await assertions.assertThrowError(throwPromise, expectedError);

  // Bob makes a buy order with one value empty
  invitation = await E(publicFacet).makeInvitation();
  const { buyOrderProposal, buyPayment } = helpers.makeBuyOffer(assets, 1n, 0n);

  // Bob executes the offer
  seat = await E(zoe).offer(invitation, buyOrderProposal, buyPayment);
  await eventLoopIteration();

  // Assert that the offer was rejected
  throwPromise = E(seat).getOfferResult();
  expectedError = 'Price value should not be empty';
  await assertions.assertThrowError(throwPromise, expectedError);
  
});
