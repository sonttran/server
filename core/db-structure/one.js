var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

// create a schema
var oneSchema = new Schema({
    title        : String,
    author      : String,
    body        : String,
    price        : Number,
    quantity     : Number,
    tags         : [],
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'comment'}
}, {
    timestamps: true ,
    usePushEach: true
}); 

oneSchema.plugin(mongoosastic, JSON.parse(process.env.ES_CONFIG));

var one = mongoose.model('one', oneSchema);

module.exports = one;