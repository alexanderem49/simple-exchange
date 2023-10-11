import { assert } from '@agoric/assert';
import { mustMatch } from '@agoric/store';

/**
 * For some reason we cannot pass Ava's `t` object to a SwingSet vat as a function argument. This makes impossible
 * for us to use our existing `assertions` module to use in SwingSet tests. So we implemented a fake ava to mimic
 * the original Ava methods our `assertions` module uses. We only used what's already allowed in a SwingSet environment
 * for the mock ava methods. Notice that this API only has the Ava methods our `assertions` module uses so this is not
 * a total mock for Ava.
 */

const makeFakeAva = () => {
  const throwsAsync = async (callback) => {
    let result = false;
    let message = '';

    try {
      if (typeof callback === 'function') {
        await callback();
      } else {
        await callback;
      }
    } catch (e) {
      result = true;
      message = e.message;
    }

    assert(result);
    return {result, message};
  };

  return {
    deepEqual: (actual, expected) => mustMatch(harden(actual), harden(expected)),
    throwsAsync,
    is: mustMatch,
    assert: assert,
  }
};

harden(makeFakeAva);
export { makeFakeAva };