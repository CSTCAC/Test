
var nacl = require('tweetnacl')
var swarm = require('webrtc-swarm')
nacl.util = require('tweetnacl-util')
var Model = require('scuttlebutt/model')
var Emitter = require('scuttlebutt/events')
var signalhub = require('./signalhub/index.js')

var db = new Model()
var emitter = new Emitter()

var argv = require('minimist')(process.argv.slice(2));
var channel = 'ohVLRDpmFPg3bfCNsS9I99ppmLWhvxqfAP4516szZN0='

var hub = signalhub(channel, [
  'http://localhost:9999'
])

var sw = swarm(hub, {
  wrtc: require('wrtc') // don't need this if used in the browser
})

if (argv.sk) {
  var _keys = nacl.sign.keyPair.fromSecretKey(
    nacl.util.decodeBase64(argv.sk)
  )
} else {
  var _keys = nacl.sign.keyPair()
}

var publicKey = nacl.util.encodeBase64(_keys.publicKey)
var secretKey = nacl.util.encodeBase64(_keys.secretKey)

console.log('<peer>', publicKey)
// console.log('<peer>', secretKey)

function verify (coin) {
  var c = {
    prev_owner: coin.prev_owner,
    owner: coin.owner,
    coin: coin.coin
  }
  var result = nacl.sign.detached.verify(
    nacl.util.decodeUTF8(
      JSON.stringify(c)),
      nacl.util.decodeBase64(coin.sig),
      nacl.util.decodeBase64(coin.prev_owner
    )
  );
  return result
}

db.on('update', function () {})

emitter.on('rpc:transaction', function (t) {
  if (t.prev_owner !== nacl.util.encodeBase64(_keys.publicKey)) {
    if (verify (Object.assign({}, t))) {
      if (t.owner === nacl.util.encodeBase64(_keys.publicKey)) console.log('<message> new coin received from ', t.prev_owner)
      db.set(t.coin, t)
    }
  }
})

process.stdin.on('data', function (i) {
  var input = i.toString().trim().split(' ')
  var command = input[0]
  var value = parseInt(input[1])
  var recipient = input[2]
  switch (command) {
    case 'send':
      if (!value || !recipient) throw Error('invalid command')
      var d = db.toJSON()
      var coins = []
      Object.keys(d).forEach(function (k) {
        if (k === 'rpc:transaction') return;
        if (d[k].owner === publicKey) coins.push(d[k])
      })
      try {
        var incro = 0;
        do {
          var t = {
            prev_owner: nacl.util.encodeBase64(_keys.publicKey),
            owner: recipient,
            coin: coins.pop().coin
          }
          var sig = nacl.util.encodeBase64(nacl.sign.detached(nacl.util.decodeUTF8(
            JSON.stringify(t)
          ), _keys.secretKey))
          t.sig = sig
          emitter.emit('rpc:transaction', t)
          incro++;
        } while (incro < value)
      } catch (e) {
        console.log(e, '... you dont have any money')
      }
    break;
    case 'balance':
      var myCoins = 0
      var d = db.toJSON()
      Object.keys(d).forEach(function (k) {
        if (k === 'rpc:transaction') return;
        if (d[k].owner === nacl.util.encodeBase64(_keys.publicKey)) myCoins++
      })
      console.log('<balance> ', myCoins, 'coins')
    break;
  }
})

sw.on('peer', function (peer, id) {
  peer.pipe(db.createStream()).pipe(peer)
  peer.pipe(emitter.createStream()).pipe(peer)
  // console.log('connected to a new peer:', id)
  // console.log('total peers:', sw.peers.length)
})

sw.on('disconnect', function (peer, id) {
  // console.log('disconnected from a peer:', id)
  // console.log('total peers:', sw.peers.length)
})
