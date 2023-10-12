import { E } from '@endo/eventual-send';

export const makeSimpleExchangeAssertions = (t) => {
  const assertIssuer = (leftIssuer, rightIssuer) => {
    t.deepEqual(leftIssuer, rightIssuer, 'Issuers provided does not match');
  };

  const assertOrderBook = async (subscriber, expectedBuys, expectedSells) => {
    const {
      value: { buys, sells },
    } = await E(subscriber).getUpdateSince();

    t.deepEqual(buys, expectedBuys, 'Buys list does not match the expected');
    t.deepEqual(sells, expectedSells, 'Sells list does not match the expected');
  };

  const assertOfferResult = async (seat, expected) => {
    const offerResult = await E(seat).getOfferResult();

    t.deepEqual(
      offerResult,
      expected,
      `Offer result ${offerResult} does not match the expected ${expected}`,
    );
  };
  const assertPayoutAmount = async (issuer, payout, expectedAmount) => {
    const amount = await issuer.getAmountOf(payout);
    t.deepEqual(
      amount,
      expectedAmount,
      `Payout ${amount.value} does not match the expected ${expectedAmount} `,
    );
  };

  const assertThrowError = async (throwPromise, message) => {
    const error = await t.throwsAsync(throwPromise);
    t.is(error.message, message);
  };

  return harden({
    assertIssuer,
    assertOrderBook,
    assertOfferResult,
    assertPayoutAmount,
    assertThrowError,
  });
};
