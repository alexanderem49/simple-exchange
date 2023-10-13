export const makeSimpleExchangeAssertions = (t) => {
  const assertIssuer = (leftIssuer, rightIssuer) => {
    t.deepEqual(leftIssuer, rightIssuer, 'Issuers provided does not match');
  };

  const assertNotIssuer = (leftIssuer, rightIssuer) => {
    t.notDeepEqual(leftIssuer, rightIssuer, 'Issuers provided match');
  };

  const assertOrderBook = (orderBook, expectedBuys, expectedSells) => {
    const {
      value: { buys, sells },
    } = orderBook;

    t.deepEqual(buys, expectedBuys, 'Buys list does not match the expected');
    t.deepEqual(sells, expectedSells, 'Sells list does not match the expected');
  };

  const assertOfferResult = (offerResult, expected) => {
    t.deepEqual(
      offerResult,
      expected,
      `Offer result ${offerResult} does not match the expected ${expected}`,
    );
  };
  const assertPayoutAmount = (amount, expectedAmount) => {
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
    assertNotIssuer,
    assertOrderBook,
    assertOfferResult,
    assertPayoutAmount,
    assertThrowError,
  });
};
