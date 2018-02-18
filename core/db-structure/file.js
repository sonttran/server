// file schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var fileSchema = new Schema({
    comment: {type:String, default: 'a comment'},
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
}, {
    timestamps: true ,
    usePushEach: true
}); 

// the schema is useless so far
// we need to create a model using it
var file = mongoose.model('file', fileSchema);

// make this available to our Node applications
module.exports = file;