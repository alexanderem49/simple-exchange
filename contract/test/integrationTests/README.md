## Integration test prerequisites

To execute the test-integration test, you should assure the agoric-sdk you are using includes the [PR#8311](https://github.com/Agoric/agoric-sdk/commit/e669bb12f560d84f7fc017abda49d3dd6d5cee17#diff-0c75f76f650658548cbe43c4426beecb665522f56da74c427b845d5c651911dc).
For this purpose, we advise to checkout to this commit hash `e669bb12f`.

You can verify if it is in the correct state by running the following commands:

```bash
git status # HEAD detached at e669bb12f
git rev-parse --verify HEAD # e669bb12f560d84f7fc017abda49d3dd6d5cee17
agoric --version # 0.21.2-u11.0
```