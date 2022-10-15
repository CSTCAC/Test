
# mcredible

spare time digital cash experiment whereby a bespoke p2p network is created to exchange
 digital tokens that are minted via an external smart contract & crypto currency.

## overview

A p2p network is created where each node has cryptographic keypair for signing
 and verifying coin transfer. Each node agrees upon the the same shared data structure
 using gossip to create an eventually consistent database.

The database each node stores is an array of javascript objects that represent
 "coins". A coin is a simple object:

 ```js

var coin = {
  prev_owner, owner, coin, sig
}

 ```

 Where `prev_owner` is the public key of the previous owner.
 `owner` is the public key of the current coin holder
 `coin` is a long random string / can be anything
 `sig` is a signature of the coin from the previous owner.

 To exchange a coin the current owner creates a new object setting the owner
  to be the recipient and themselves as the `prev_owner` and signs it. This
  message is then propagated around the p2p network.

Other peers can do simple signature verification before updating their
 own internal data structures.

## minting and redeeming coins

An ethereum smart contract can be used to mint and redeem coins. Once you pay some
 ETH and give the contract a public key for your wallet you will have coins added
 to the p2p network, signed by the contract with your node as the owner.

Once the tokens are within the system they can be exchanged freely among peers.

The current owner of the coin can go back to the smart contract and sign ownership
 to it to receive ETH to a specified account thereby redeeming it (cashing out).

# privacy and data storage

Assuming the amount of coins within the network stays the same the amount of data
 stored by each peer stays the same regardless of the number of transactions.

Only the last two owners public keys are stored withint the coin... no transaction
 history is used in to the design. It is possible to listen on the p2p network
 and monitor meta-data and transaction history but the eavesdropper would need
 to know which public key belonged to which user/person to make sense of it.

# is double spending possible?

Potentially yes and more issues, this is an attempt to build something and work
 out through trial and error what works and what doesn't. I am trying to avoid
 keeping track of the complete transaction history of coin ownership but it
 may be needed to truely avoid double spending.

... so this is just a mad science experiment!

If the owner of a coin attempts to double spend the p2p system should only pick the
 first transaction that is replicated as the "winner" and the other transactions
 will fail (in theory).

Each node in the p2p system replicates the same data structure and has to agree
 upon it. This is the list of coins and coin owners... if a p2p node does not
 see it's public key replicated as the owner it does not own the coin.

Only the owner of a the cryptographic keypair for a particular node can sign a valid
 transaction / transfer coin ownership. The current prototype is vulnerable to network
 flooding and no mechanism for blocking bad peers is implemented.

# running the prototype

The current prootype uses webRTC via node js (wrtc) and signalhub. This is intentional
 because it should be possible to run this system from inside web browsers.

```sh
clone signalhub into the folder & npm install
npm run signalhub

# in one window
node peer

# in another
node peer

# in another
mint <peer_public_key>

# in the peer tab

send 4 <peer_public_key>

balance

#

```

# minting

```js

mint <peer_public_key>

```

Will send 5 coins to the public key specified.

# peer commands

* send <number of coins> <recipient_pk>
* balance

# disclaimer

this is a highly experimental system that may not be resistant to timing, race conditions,
 double spending and other issues. Don't use this system yet until it has undergone
 intensive security audits and user testing!
