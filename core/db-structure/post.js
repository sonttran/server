var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

// create a schema
var postSchema = new Schema({
    topics          : [], // array of ES topic tags, always have 'tat_ca_chu_de' at the first element
    topCount        : Number, // = topics.length (for ES search purpose)
    locations       : [], // array of ES location tags, always have 'toan_quoc' at the first element
    locCount        : Number, // = locations.length (for ES search purpose)
    title           : String, // title of the post (whatever user input)
    info            : [], // detail information of the post, is splited by \r\n
    price           : Number, // price in number ex: 500000
    priceToRender   : String, // price ready to serve frontend format ex: 500.000 VND
    postedBy        : String, // // _id (also email) of postowner
    photos          : [
        // { path : '/file/432sdf.jpg', name : 'Son Tran'} // list of these 
    ], 
    url             : String,
    _id             : String,
    owner           : {
        id          : String,
        fullName    : String,
        firstName   : String,
        memberSince: String,
        phone       : String,
        avatar      : String,
        email       : String,
        totalRating : Number, // total rating of user at the time post is created
        posRating   : String, // ready to render percentage of positive rating
        negRating   : String, // ready to render percentage of negative rating
    },
    sellType        : String,
    sellTypeViet    : String,
    board           : String,
    createdAtToRender       : String,
    viewed              : { type : Number, default : 0 },
    locDisSearch        : String, // location info displayed on search page
    topicsDetailPage    : { type : Object, es_indexed: false}, // tags object to render links in detail page
    locDetailPage       : { type : Object, es_indexed: false}, // tags object to render links in detail page,
    air             : { type : Date, default : Date.now() }, // first moment searchable
}, {
    timestamps: true,
    usePushEach: true
}); 

postSchema.plugin(mongoosastic, JSON.parse(process.env.ES_CONFIG));

var post = mongoose.model('post', postSchema);

module.exports = post;