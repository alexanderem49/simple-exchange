# Guide to run the smoke tests

## Prerequisites

- agoric-sdk: agoric-upgrade-11wf

## Launch local chain and client

> cd agoric-sdk/packages/inter-protocol/scripts  
> ./start-local-chain.sh

> cd agoric-sdk/packages/cosmic-swingset  
> make SOLO_COINS='13000000ubld,12345000000000uist,1122000000ibc/toyusdc' scenario2-run-client

## Submit core-eval

> cd simple-exchange/  
> make submit-core-eval

## Run smoke tests (WiP)

> cd simple-exchange/contract/test/smokeTests/  
> agoric deploy updateAssetList  
> agoric deploy updateReferenceList  
> ./sellOffer  
> ./buyOffer
