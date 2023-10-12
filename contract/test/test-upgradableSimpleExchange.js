import { test } from './prepare-test-env-ava.js';
import { E } from '@endo/far';
import { setUpZoeForTest } from '@agoric/inter-protocol/test/supports.js';
import { makeIssuerKit, AmountMath, AssetKind } from '@agoric/ertp';
import { details } from '@agoric/assert';
import { makeSimpleExchangeAssertions } from './assertions.js';
import { setupUpgradableSimpleExchange, setupAssets } from './setup.js';

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

test.only('test empty subscriber', async (t) => {
  const { zoe, assets } = t.context;
  const assertions = makeSimpleExchangeAssertions(t);

  const { publicFacet } = await setupUpgradableSimpleExchange(zoe, assets);

  const subscriber = await E(publicFacet).getSubscriber();
  let expectedBuys = [];
  let expectedSells = [];
  await assertions.assertOrderBook(subscriber, expectedBuys, expectedSells);
});

test('test make sell offer', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

  const aliceMoolaPayment = moolaKit.mint.mintPayment(moola(3n));
  const alicePayments = { Asset: aliceMoolaPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceSellOrderProposal,
    alicePayments,
  );

  let offerResult = await E(aliceSeat).getOfferResult();
  t.deepEqual(offerResult, 'Order Added');

  const subscriber = await E(publicFacet).getSubscriber();
  const state = await E(subscriber).getUpdateSince();
  console.log(state.value.sells);
  t.deepEqual(state.value, { buys: [], sells: [aliceSellOrderProposal] });
});

test('test make buy offer', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  const bobInvitation = await E(publicFacet).makeInvitation();

  const bobBuyOrderProposal = harden({
    want: { Asset: moola(3n) },
    give: { Price: simoleans(4n) },
  });

  const bobSimoleansPayment = simoleanKit.mint.mintPayment(simoleans(4n));
  const bobPayments = { Price: bobSimoleansPayment };

  const bobSeat = await E(zoe).offer(
    bobInvitation,
    bobBuyOrderProposal,
    bobPayments,
  );

  let offerResult = await E(bobSeat).getOfferResult();
  t.deepEqual(offerResult, 'Order Added');

  const subscriber = await E(publicFacet).getSubscriber();
  const state = await E(subscriber).getUpdateSince();

  t.deepEqual(state.value, { buys: [bobBuyOrderProposal], sells: [] });
});

test('test make trade', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

  const aliceMoolaPayment = moolaKit.mint.mintPayment(moola(3n));
  const alicePayments = { Asset: aliceMoolaPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceSellOrderProposal,
    alicePayments,
  );

  await E(aliceSeat).getOfferResult();

  const bobInvitation = await E(publicFacet).makeInvitation();

  const bobBuyOrderProposal = harden({
    want: { Asset: moola(3n) },
    give: { Price: simoleans(4n) },
  });

  const bobSimoleansPayment = simoleanKit.mint.mintPayment(simoleans(4n));
  const bobPayments = { Price: bobSimoleansPayment };

  const bobSeat = await E(zoe).offer(
    bobInvitation,
    bobBuyOrderProposal,
    bobPayments,
  );

  await E(bobSeat).getOfferResult();

  const alicePayouts = await E(aliceSeat).getPayouts();

  const bobPayouts = await E(bobSeat).getPayouts();

  console.log(alicePayouts);
  console.log(bobPayouts);

  //ToDo:  get amouts for each payment and verify if it is according to the expected
  t.pass();
});

test('make sell offer', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet, instance } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceInstallation = await E(zoe).getInstallation(aliceInvitation);
  t.is(aliceInstallation, await contractInstallation);
  const aliceIssuers = await E(zoe).getIssuers(instance);

  assert(
    aliceIssuers.Asset === moolaKit.issuer,
    details`The Asset issuer should be the moola issuer`,
  );
  assert(
    aliceIssuers.Price === simoleanKit.issuer,
    details`The Price issuer should be the simolean issuer`,
  );

  // assert order book is empty
  const aliceSubscriber = await E(publicFacet).getSubscriber();

  const { value: initialOrders } = await E(
    await E(publicFacet).getSubscriber(),
  ).getUpdateSince();
  t.deepEqual(
    initialOrders,
    { buys: [], sells: [] },
    `order subscriber is initialized`,
  );

  const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

  const aliceMoolaPayment = moolaKit.mint.mintPayment(moola(3n));
  const alicePayments = { Asset: aliceMoolaPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceSellOrderProposal,
    alicePayments,
  );

  let offerResult = await E(aliceSeat).getOfferResult();
  t.deepEqual(offerResult, 'Order Added');

  let {
    value: { buys, sells },
  } = await E(aliceSubscriber).getUpdateSince();

  t.deepEqual(buys, [], 'buys list should be empty');
  t.deepEqual(
    sells,
    [aliceSellOrderProposal],
    'sells list should NOT be empty',
  );
});

test('make buy offer', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet, instance } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceInstallation = await E(zoe).getInstallation(aliceInvitation);
  t.is(aliceInstallation, await contractInstallation);
  const aliceIssuers = await E(zoe).getIssuers(instance);

  assert(
    aliceIssuers.Asset === moolaKit.issuer,
    details`The Asset issuer should be the moola issuer`,
  );
  assert(
    aliceIssuers.Price === simoleanKit.issuer,
    details`The Price issuer should be the simolean issuer`,
  );

  // assert order book is empty
  const aliceSubscriber = await E(publicFacet).getSubscriber();

  const { value: initialOrders } = await E(
    await E(publicFacet).getSubscriber(),
  ).getUpdateSince();
  t.deepEqual(
    initialOrders,
    { buys: [], sells: [] },
    `order subscriber is initialized`,
  );

  const aliceBuyOrderProposal = harden({
    want: { Asset: moola(3n) },
    give: { Price: simoleans(4n) },
  });

  const aliceSimoleansPayment = simoleanKit.mint.mintPayment(simoleans(4n));
  const alicePayments = { Price: aliceSimoleansPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceBuyOrderProposal,
    alicePayments,
  );

  let offerResult = await E(aliceSeat).getOfferResult();
  t.deepEqual(offerResult, 'Order Added');

  let {
    value: { buys, sells },
  } = await E(aliceSubscriber).getUpdateSince();

  console.log(buys);

  t.deepEqual(sells, [], 'sells list should be empty');
  t.deepEqual(buys, [aliceBuyOrderProposal], 'buys list should NOT be empty');
});

test('make trade', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet, instance } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceInstallation = await E(zoe).getInstallation(aliceInvitation);
  t.is(aliceInstallation, await contractInstallation);
  const aliceIssuers = await E(zoe).getIssuers(instance);

  assert(
    aliceIssuers.Asset === moolaKit.issuer,
    details`The Asset issuer should be the moola issuer`,
  );
  assert(
    aliceIssuers.Price === simoleanKit.issuer,
    details`The Price issuer should be the simolean issuer`,
  );

  const { value: initialOrders } = await E(
    await E(publicFacet).getSubscriber(),
  ).getUpdateSince();
  t.deepEqual(
    initialOrders,
    { buys: [], sells: [] },
    `order subscriber is initialized`,
  );

  const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

  const aliceMoolaPayment = moolaKit.mint.mintPayment(moola(3n));
  const alicePayments = { Asset: aliceMoolaPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceSellOrderProposal,
    alicePayments,
  );

  await E(aliceSeat).getOfferResult();

  const bobInvitation = await E(publicFacet).makeInvitation();

  const bobInstallation = await E(zoe).getInstallation(bobInvitation);
  t.is(bobInstallation, await contractInstallation);
  const bobIssuers = await E(zoe).getIssuers(instance);

  assert(
    bobIssuers.Asset === moolaKit.issuer,
    details`The Asset issuer should be the moola issuer`,
  );
  assert(
    bobIssuers.Price === simoleanKit.issuer,
    details`The Price issuer should be the simolean issuer`,
  );

  const bobBuyOrderProposal = harden({
    want: { Asset: moola(3n) },
    give: { Price: simoleans(4n) },
  });

  const bobSimoleansPayment = simoleanKit.mint.mintPayment(simoleans(4n));
  const bobPayments = { Price: bobSimoleansPayment };

  const bobSeat = await E(zoe).offer(
    bobInvitation,
    bobBuyOrderProposal,
    bobPayments,
  );

  await E(bobSeat).getOfferResult();

  const alicePayouts = await E(aliceSeat).getPayouts();
  const bobPayment = await E(bobSeat).getPayouts();

  const aliceAmountAsset = await moolaKit.issuer.getAmountOf(
    alicePayouts.Asset,
  ); // 0n
  const aliceAmountPrice = await simoleanKit.issuer.getAmountOf(
    alicePayouts.Price,
  ); // 4n

  console.log(bobBuyOrderProposal.give.Price === aliceAmountPrice);

  const { value: afterBobOrders } = await E(
    E(publicFacet).getSubscriber(),
  ).getUpdateSince();
  t.deepEqual(
    afterBobOrders,
    { buys: [], sells: [] },
    `order subscriber is updated when Bob fulfills the order`,
  );

  assertOfferResult(t, bobSeat, 'Order Added');
  assertOfferResult(t, aliceSeat, 'Order Added');
});

test('make offer with wrong issuers', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet, instance } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

  const aliceMoolaPayment = moolaKit.mint.mintPayment(moola(3n));
  const alicePayments = { Asset: aliceMoolaPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceSellOrderProposal,
    alicePayments,
  );

  await E(aliceSeat).getOfferResult();

  const bobInvitation = await E(publicFacet).makeInvitation();

  const nothingKit = makeIssuerKit('nothing', AssetKind.NAT);
  const makeSimpleMake = (brand) => (value) => AmountMath.make(brand, value);
  const nothing = makeSimpleMake(nothingKit.brand);

  const aliceInstallation = await E(zoe).getInstallation(bobInvitation);
  t.is(aliceInstallation, await contractInstallation);
  const aliceIssuers = await E(zoe).getIssuers(instance);

  assert(
    aliceIssuers.Asset !== nothingKit.issuer,
    details`The wrong asset issuer should not be in th asset issuers`,
  );
  assert(
    aliceIssuers.Price !== nothingKit.issuer,
    details`The wrong asset issuer should not be in the price issuers`,
  );

  const bobBuyOrderProposal = harden({
    want: { Asset: moola(3n) },
    give: { Price: nothing(4n) },
  });

  const bobNothingPayment = nothingKit.mint.mintPayment(nothing(4n));
  const bobPayments = { Price: bobNothingPayment };

  await t.throwsAsync(
    () => E(zoe).offer(bobInvitation, bobBuyOrderProposal, bobPayments),
    {
      message:
        'key "[Alleged: nothing brand]" not found in collection "brandToIssuerRecord"',
    },
  );
});

test('make offer with offerProposal missing attribute', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

  const aliceMoolaPayment = moolaKit.mint.mintPayment(moola(3n));
  const alicePayments = { Asset: aliceMoolaPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceSellOrderProposal,
    alicePayments,
  );

  await E(aliceSeat).getOfferResult();

  let bobInvitation = await E(publicFacet).makeInvitation();

  const bobBuyOrderProposalNoPrice = harden({
    want: { Asset: moola(3n) },
  });

  let bobSimoleansPayment = simoleanKit.mint.mintPayment(simoleans(4n));
  let bobPayments = { Price: bobSimoleansPayment };

  await t.throwsAsync(
    () => E(zoe).offer(bobInvitation, bobBuyOrderProposalNoPrice, bobPayments),
    {
      message:
        '"exchange" proposal: give: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]',
    },
  );

  bobInvitation = await E(publicFacet).makeInvitation();

  const bobBuyOrderProposalNoAsset = harden({
    give: { Price: simoleans(4n) },
  });

  bobSimoleansPayment = simoleanKit.mint.mintPayment(simoleans(4n));
  bobPayments = { Price: bobSimoleansPayment };

  await t.throwsAsync(
    () => E(zoe).offer(bobInvitation, bobBuyOrderProposalNoAsset, bobPayments),
    {
      message:
        '"exchange" proposal: want: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]',
    },
  );
});

test('make offer without offerProposal', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

  const aliceMoolaPayment = moolaKit.mint.mintPayment(moola(3n));
  const alicePayments = { Asset: aliceMoolaPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceSellOrderProposal,
    alicePayments,
  );

  await E(aliceSeat).getOfferResult();

  const bobInvitation = await E(publicFacet).makeInvitation();

  await t.throwsAsync(() => E(zoe).offer(bobInvitation, undefined, undefined), {
    message:
      '"exchange" proposal: want: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]',
  });
});

test('Bob makes offer with null or invalid shapes on the proposals', async (t) => {
  const {
    zoe,
    contractInstallation,
    privateArgs,
    moolaKit,
    simoleanKit,
    moola,
    simoleans,
  } = t.context;

  const { publicFacet } = await E(zoe).startInstance(
    contractInstallation,
    harden({
      Asset: moolaKit.issuer,
      Price: simoleanKit.issuer,
    }),
    undefined,
    privateArgs,
  );

  const aliceInvitation = await E(publicFacet).makeInvitation();

  const aliceSellOrderProposal = harden({
    give: { Asset: moola(3n) },
    want: { Price: simoleans(4n) },
  });

  const aliceMoolaPayment = moolaKit.mint.mintPayment(moola(3n));
  const alicePayments = { Asset: aliceMoolaPayment };

  const aliceSeat = await E(zoe).offer(
    aliceInvitation,
    aliceSellOrderProposal,
    alicePayments,
  );

  await E(aliceSeat).getOfferResult();

  const wrongProposals = [
    {
      proposal: harden({
        give: null,
        want: { Asset: simoleans(4n) },
      }),
      errorMessage:
        'In "offer" method of (ZoeService): arg 1?: give?: null null - Must be a copyRecord',
    },
    {
      proposal: harden({
        give: {},
        want: { Asset: simoleans(4n) },
      }),
      errorMessage:
        '"exchange" proposal: give: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]',
    },
    {
      proposal: harden({
        give: undefined,
        want: { Asset: simoleans(4n) },
      }),
      errorMessage:
        '"exchange" proposal: give: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]',
    },
    {
      proposal: harden({
        give: { Price: null },
        want: { Asset: simoleans(4n) },
      }),
      errorMessage:
        'In "offer" method of (ZoeService): arg 1?: give?: Price: [1]: null - Must be a copyRecord to match a copyRecord pattern: {"brand":"[match:remotable]","value":"[match:or]"}',
    },
    {
      proposal: harden({
        give: { Price: undefined },
        want: { Asset: simoleans(4n) },
      }),
      errorMessage:
        'In "offer" method of (ZoeService): arg 1?: give?: Price: [1]: "[undefined]" - Must be a copyRecord to match a copyRecord pattern: {"brand":"[match:remotable]","value":"[match:or]"}',
    },
    {
      proposal: harden({
        give: { Price: {} },
        want: { Asset: simoleans(4n) },
      }),
      errorMessage:
        'In "offer" method of (ZoeService): arg 1?: give?: Price: [1]: {} - Must have missing properties ["value","brand"]',
    },
    ///////////
    {
      proposal: harden({
        give: { Asset: moola(3n) },
        want: null,
      }),
      errorMessage:
        'In "offer" method of (ZoeService): arg 1?: want?: null null - Must be a copyRecord',
    },
    {
      proposal: harden({
        give: { Asset: moola(3n) },
        want: {},
      }),
      errorMessage:
        '"exchange" proposal: want: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]',
    },
    {
      proposal: harden({
        give: { Asset: moola(3n) },
        want: undefined,
      }),
      errorMessage:
        '"exchange" proposal: want: {} - Must match one of [{"Asset":{"brand":"[match:remotable]","value":"[match:or]"}},{"Price":{"brand":"[match:remotable]","value":"[match:or]"}}]',
    },
    {
      proposal: harden({
        give: { Asset: moola(3n) },
        want: { Price: null },
      }),
      errorMessage: "Cannot read properties of null (reading 'brand')",
    },
    {
      proposal: harden({
        give: { Asset: moola(3n) },
        want: { Price: undefined },
      }),
      errorMessage: "Cannot read properties of undefined (reading 'brand')",
    },
    {
      proposal: harden({
        give: { Asset: moola(3n) },
        want: { Price: {} },
      }),
      errorMessage:
        'In "getAssetKindByBrand" method of (ZoeStorageManager makeOfferAccess): arg 0: undefined "[undefined]" - Must be a remotable (Brand)',
    },
  ];

  for (let i = 0; i < wrongProposals.length; i++) {
    const bobProposal = wrongProposals[i];

    const bobInvitation = await E(publicFacet).makeInvitation();

    const bobSimoleansPayment = simoleanKit.mint.mintPayment(simoleans(4n));
    const bobPayments = { Price: bobSimoleansPayment };

    await t.throwsAsync(
      () => E(zoe).offer(bobInvitation, bobProposal.proposal, bobPayments),
      { message: bobProposal.errorMessage },
    );
  }
});
