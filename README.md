# pear_market
Distributed p2p auction market platform built on PEAR.
The main purpose of this approach is to provide an isomorphic application for checked shared behavioured based on the versions of the application and the schemas.
The application shared object can be found in ./server/auctions.js and the schemas in ./server/schemas.js

## Start hyperdht bootstrap instance
```
$ hyperdht --bootstrap --host 127.0.0.1 --port 30001
```

## Run service
```
$ cd server
$ npm i
$ rm ./db
$ killall pear-runtime
$ pear dev

Pear terminal application running
{
  platform: {
    key: 'pqbzjhqyonxprx8hghxexnmctw75mr91ewqw5dxe1zmntfyaddqy',
    length: 3519,
    fork: 0
  },
  app: { key: null, length: 0, fork: 0 }
}
Auctions 0.0.1
dht_seed  1931e9dc10ce0f5aa828a282164a3916f04ef291e61e2ec7d664681c7ee103c1
rpc_seed  d08d63c30d288aee25c48d79014d7f88ca59defc4fa324482ca7219b33fb7b82
rpc public key  a123f025cff748aff57e13b88e4875f2cbdcf1bf533abef04d4c6f798eb2e522  <--------- RPC_PUBLIC_KEY of this example
progress
```

## Copy rpc public key to client folder :

```
$ echo export default \'RPC_PUBLIC_KEY\' > ../client/app_id.js
```

## Run an instance of client
```
$ cd client
$ npm i
$ rm ./db
$ pear run --dev . --devtools
```
The devtools console will show debug messages of the client runtime

## Current Issues and TODO (version 0.0.1)

There is an issue regarding the storage of Objects with hyperbee put method when invoking create_auction RPC method.
Pending for implentation are place_bid and close_auction RPC methods for the server and the client.
