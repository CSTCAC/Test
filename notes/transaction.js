
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
