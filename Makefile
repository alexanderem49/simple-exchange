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

CONTRACT_REF_BUNDLE_ID = @cache/b1-bd403b1eef170b3440a793f4a09338d9379e0da410f2c501368e9deff6b4d294bd49a8425d9e5b4f442e18baf656f825b7959772dcc67306eca6f5eb616e5235.json
MANIFEST_REF_BUNDLE_ID = @cache/b1-af3f5c1ce904d1687bd99937fd2b27c4f405866ce159b588c143266f495476ee295c86791f70e622436bbda13ae6f9619baac3608d1252b3d77c0e091d02476f.json

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