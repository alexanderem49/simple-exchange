# Guide to run the smoke tests

## Prerequisites

- agoric-sdk repo: commit 46a7b2e09 

## Launch local chain and client

> cd agoric-sdk/packages/agoric-cli/tests   
> ./start-local-chain.sh

> cd agoric-sdk/packages/cosmic-swingset  
> make SOLO_COINS='13000000ubld,12345000000000uist,1122000000ibc/toyusdc' scenario2-run-client

## Submit core-eval

> cd simple-exchange/  
> make build-proposal

Note: update the CONTRACT_REF_BUNDLE_ID and MANIFEST_REF_BUNDLE_ID based on the output of the target above

> make submit-core-eval

## Run smoke tests (WiP)

> cd simple-exchange/contract/test/smokeTests/  
> agoric deploy updateAssetList  
> agoric deploy updateReferenceList  
> ./sellOffer  
> ./buyOffer
