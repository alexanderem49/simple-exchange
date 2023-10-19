SDK_ROOT = $(shell cd ../../agoric-sdk >/dev/null && pwd)
AGORIC = $(SDK_ROOT)/packages/agoric-cli/bin/agoric
AGD = $(SDK_ROOT)/bin/agd
LOCAL_CHAIN_ID = agoriclocal
DEV_CHAIN_ID = agoricdev-23

GAS = 400000
GAS_ADJUSTMENT = 1.2
VOTE_PROPOSAL = 2
VOTE_OPTION = yes

PROPOSAL_BUILDER = ${shell pwd}/contract/src/proposal/proposalBuilder-script.js
HOME = $(SDK_ROOT)/packages/cosmic-swingset/t1/bootstrap
FROM = bootstrap

CONTRACT_REF_BUNDLE_ID = @/Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/cache/b1-8196beb7c9d93fc869a36c675b8fb64faa422248ccd2a18bdee9974baad9f25fd507376ecf8d2864082faadd7f07a57abb9b258ae26b4f5c209d477197308a54.json
MANIFEST_REF_BUNDLE_ID = @/Users/jorgelopes/Documents/GitHub/Agoric/bytepitch-bounties/my-simple-exchange/cache/b1-eef3876b30f979189c0201b2858af928d2049596c00296f5c2af39f748db30f241da453a480e5b70943b7454f9efb542cb328a0f7945e144bad4c196bca6bf98.json


build-proposal:
	${AGORIC} run ${PROPOSAL_BUILDER}

install-contract-bundle:
	${AGD} tx swingset install-bundle ${CONTRACT_REF_BUNDLE_ID} --from=${FROM} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --gas=$(GAS) --yes

install-manifest-bundle:
	${AGD} tx swingset install-bundle ${MANIFEST_REF_BUNDLE_ID} --from=${FROM} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --gas=$(GAS) --yes

submit-proposal:
	${AGD} tx gov submit-proposal swingset-core-eval startSimpleExchange-permit.json startSimpleExchange.js \
 	--title="Enable simpleExchange" --description="Evaluate startSimpleExchange.js" --deposit=1000000ubld \
    --gas=auto --gas-adjustment=$(GAS_ADJUSTMENT) \
	--from=${FROM} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --yes

vote:
	$(AGD) tx gov vote $(VOTE_PROPOSAL) $(VOTE_OPTION) \
		--gas=auto --gas-adjustment=$(GAS_ADJUSTMENT) \
		--from=${FROM} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --yes
