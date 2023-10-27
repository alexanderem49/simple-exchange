SDK_ROOT = $(shell cd ../../agoric-sdk >/dev/null && pwd)
AGORIC = $(SDK_ROOT)/packages/agoric-cli/bin/agoric
AGD = $(SDK_ROOT)/bin/agd
LOCAL_CHAIN_ID = agoriclocal
DEV_CHAIN_ID = agoricdev-23

GAS = 40000000
GAS_ADJUSTMENT = 1.2
VOTE_PROPOSAL = 1
VOTE_OPTION = yes

PROPOSAL_BUILDER = ${shell pwd}/contract/src/proposal/proposalBuilder-script.js
HOME = $(SDK_ROOT)/packages/cosmic-swingset/t1/bootstrap
FROM = bootstrap

CONTRACT_REF_BUNDLE_ID = @cache/b1-30c28543275186d8f9301c3f6aa5c84e9279443a448b4471fd560ccf0bc0b08fe41b769f9006ffa775bf157462bb2629c90d70e9c64502cf7ca9f8344f7bbc7e.json
MANIFEST_REF_BUNDLE_ID = @cache/b1-88585edbf550144ca45b5e0b9f8e63f7652f6a006c585523bdded62fc63ca7df7f00e09a9f961b1596506f3cff9b177b4c2e3742b3f56e4cc80df052244b8314.json

build-proposal:
	rm -rf ${shell pwd}/cache/*
	${AGORIC} run ${PROPOSAL_BUILDER}

install-contract-bundle:
	${AGD} tx swingset install-bundle ${CONTRACT_REF_BUNDLE_ID} \
		--from=${FROM} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --gas=$(GAS) --yes -b block

install-manifest-bundle:
	${AGD} tx swingset install-bundle ${MANIFEST_REF_BUNDLE_ID} \
		--from=${FROM} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --gas=$(GAS) --yes -b block

submit-proposal:
	${AGD} tx gov submit-proposal swingset-core-eval startSimpleExchange-permit.json startSimpleExchange.js \
		--title="Enable simpleExchange" --description="Evaluate startSimpleExchange.js" --deposit=1000000ubld \
		--gas=auto --gas-adjustment=$(GAS_ADJUSTMENT) \
		--from=${FROM} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --yes -b block

vote:
	$(AGD) tx gov vote $(VOTE_PROPOSAL) $(VOTE_OPTION) \
		--gas=auto --gas-adjustment=$(GAS_ADJUSTMENT) \
		--from=${FROM} --home=${HOME}  --chain-id=${LOCAL_CHAIN_ID} --keyring-backend=test --yes -b block

submit-core-eval: install-contract-bundle install-manifest-bundle submit-proposal vote