#!/bin/zsh

OFFER=$(mktemp -t agops.XXX)
node ./buildSellOffer.js >|"$OFFER"
cat $OFFER
agoric wallet send --from gov1 --keyring-backend=test --offer=$OFFER