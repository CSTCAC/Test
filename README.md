
# mcredible

silly digital cash experiment whereby a bespoke p2p network is created to exchange
 digital tokens that are minted via an external smart contract & crypto currency.

Coins are just javascript objects including public keys and signatures from the
 last two owners forming a chain of trust. This is similar to blockchains / bitcoins
 except that a list of coins and coin owners is shared amongst a p2p network.

The network has to agree which coin belongs to which owner, no mining is needed
 or used. The tokens have value based on the smart contract and external crypto
 currency that initially minted the coins and can be redeemed into that currency.

This means that coins that are minted at a particular exchange rate may be worth
 more or less when eventually cashed out.

# overview

A p2p network is created where each node has cryptographic keypair for signing
 and verifying coin transfer. Each node agrees upon the the same shared data structure
 using gossip to create an eventually consistent database.

Each node is essentially a wallet and an infrastucture node replicating the
 available coins and current coin owners amongst all peers. This does not include
 transaction history. The database is finite and static in size as long as no new
 coins are added.

The database for each node is an array of javascript objects that represent
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

 To exchange a coin the current owner signs ownership to a new public key. This
  message is then propagated around the p2p network. Each p2p can validate the
  signature for themselves before updating their own list of coins.

# transaction explanation

This code should hopefully illustrate how coin ownership occurs using a chain of
 digital signature verification...

```js

var nacl = require('tweetnacl')
nacl.util = require('tweetnacl-util')

var a = nacl.sign.keyPair.fromSecretKey(
  nacl.util.decodeBase64(
  '69jY5I+zx8wf406lBcfUMj54u/c8PHp2mWjIicR1VvaiFUtEOmYU+Ddt8I2xL0j32mmYtaG/Gp8A/jnXqzNk3Q=='
))

var b = nacl.sign.keyPair.fromSecretKey(
  nacl.util.decodeBase64(
  '1LHH8dW0bheOVPzfzPCVvIOkn4qkC5KYkpjZLZenEGqMvGuwxm/vDUh+4F6kY1y75y3Qn/UtWxf2gKFNKk7l5w=='
  )
)

var c = nacl.sign.keyPair.fromSecretKey(
  nacl.util.decodeBase64(
  'U5+p79t50bsaCPSw+voPzIkFcRLmr4kArTMmXPU9ubhJWRkhcosnc42v2lajDusjdoWFe0PKOiIVidb3RBT9BA=='
  )
)

console.log(nacl.util.encodeBase64(a.publicKey))

var coin = {
  coin: 'coin_example',
  prev_owner: nacl.util.encodeBase64(a.publicKey),
  owner: nacl.util.encodeBase64(b.publicKey)
}

coin.sig = nacl.util.encodeBase64(nacl.sign.detached(nacl.util.decodeUTF8(
  JSON.stringify(coin)
), a.secretKey))

console.log('new coin ', coin)

console.log(nacl.util.encodeBase64(b.publicKey))

// b transfers coin ownership to c

coin = {
  coin: 'coin_example',
  prev_owner: coin.owner,
  owner: nacl.util.encodeBase64(c.publicKey)
}

coin.sig = nacl.util.encodeBase64(nacl.sign.detached(nacl.util.decodeUTF8(
  JSON.stringify(coin)
), b.secretKey))

console.log('new coin ', coin)

```

Peers can verify new transactions based on the information within the coin
 itself. A crafted or malicious transaction should not be possible without
 knowing the secret key of the current coin owner.

# minting and redeeming coins

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
 because it should be eventually possible to run this system using web browsers.

```sh
clone signalhub into the folder & npm install
npm run signalhub

# in one window
node peer

# in another
node peer

# in another
mint <peer_public_key>

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

*I still haven't tested out the smart contract bit for actually minting coins backed
 by a real crypto currency like ethereum. However this minting and redeeming could be
 done by a centralised website, gold bullion or company.. doesn't need to be a smart contract.

this is a highly experimental system that could be fundamentally flawed in numerous ways,
vulnerable to timing attacks, race conditions, double spending and many other issues.

# feeback or comments

if you have any feedback, spotted some security or design issues please let me know!
