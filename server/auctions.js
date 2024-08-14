function Auctions() {

    this.app_version = '0.0.1'
    this.schema_version = '0.4.2'

    this.version = function version() {
        return this.app_version
    }

    this.setup = async function setup(setup) {
        this.ajv = setup.ajv
        if (this.schema_version == setup.schemas.version) {
            this.schemas = setup.schemas
        } else {
            throw new Error("Unmatched schemas.")
        }
    }

    this.create_auction = async function create_auction(key, rpc, payload) {
        return await rpc.request(key, 'create_auction', payload)
    }

    this.place_bid = async function place_bid(key, rpc, payload) {
        return await rpc.request(key, 'place_bid', payload)
    }

    this.close_auction = async function close_auctions(key, rpc, payload) {
        return await rpc.request(key, 'close_auction', payload)
    }

    this.get_schemas = function get_schemas() {
        return this.schemas
    }

    this.is_valid_auction = function is_valid_auction(json) {
        return this.ajv.validate(this.schemas.auction_properties, json)
    }

    this.is_valid_bid = function is_valid_bid(json) {
        return this.ajv.validate(this.schemas.bid_properties, json)
    }

}
 
Auctions.prototype.toString = function AuctionsToString() {
        return `${Auctions}`
}

export default Auctions