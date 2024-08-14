const AuctionSchemas = {

    version : "0.4.2",

    auction_properties : {
        type: "object",
        properties : {
            id: { type: "number" },
            resource: { type: "string" },
            initial_price: { type: "number" },
            bids: { type: "object" },
        },
        required: ["id", "resource", "initial_price", "bids"]
    },

    bid_properties : {
        type: "object",
        properties : {
            id: "number",
            auction_id: "number",
            bid_price: "number",
        },
        required: ["id", "auction_id", "bid_price"]
    }

}

export default AuctionSchemas