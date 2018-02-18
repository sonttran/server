// sunit (solid self-explained unit) schema
var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var Schema = mongoose.Schema;

// requirement
var reqSchema = new Schema({
    name        : String,
    url         : String
}, {
    timestamps: true 
})

// create a schema
var sunitSchema = new Schema({
    _id         : String,
    url         : String, 
    createdBy   : { fullName    : String,
                    url         : String },
    project     : { name        : String,
                    url         : String,
                    access      : String },
    requirement : [reqSchema],
    who         : { author      : String,
                    access      : String },
    what        : { about       : String,
                    project     : String,
                    docType     : String, // file/module/function
                    devProcess  : String },
    why         : { born        : String },
    when        : { used        : String },
    where       : { find        : String },
    how         : { inFmMd      : String,
                    inFmHtml    : String,
                    inDataMd    : String,
                    inDataHtml  : String,
                    processMd   : String,
                    processHtml : String,
                    outFmMd     : String,
                    outFmHtml   : String,
                    outDataMd   : String,
                    outDataHtml : String,
                    workMd      : String,
                    workHtml    : String }
}, {
    timestamps: true ,
    usePushEach: true
}); 

// the schema is useless so far
// we need to create a model using it
var sunit = mongoose.model('sunit', sunitSchema);

// make this available to our Node applications
module.exports = sunit;