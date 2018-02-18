// project schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//requirement sub schema
var reqSchema = new Schema({
    name        : String,
    url         : String,
    description : String,
    creatorUrl  : String,
    createdBy   : String
}, {
    timestamps: true 
});

//document sub schema
var docSchema = new Schema({
    name        : String,
    url         : String,
    description : String,
    creatorUrl  : String,
    createdBy   : String
}, {
    timestamps: true ,
    usePushEach: true
});

//file sub schema
var fileSchema = new Schema({
    name        : String,
    url         : String,
    path        : String,
    creatorUrl  : String,
    createdBy   : String
}, {
    timestamps: true 
});

//member sub schema
var memSchema = new Schema({
    name        : String,
    url         : String,
    role        : [],
    expiredDate : String
}, {
    timestamps: true
});

// project main schema
var projectSchema = new Schema({
    _id         : String,
    url         : String,
    name        : String,
    description : String,
    createdBy   : { fullName    : String,
                    url         : String },
    access      : String,
    requirement : [ reqSchema ],
    document    : [ docSchema ],
    file        : [ fileSchema ],
    member      : [ memSchema ]
}, {
    timestamps: true 
}); 

// the schema is useless so far
// we need to create a model using it
var project = mongoose.model('project', projectSchema);

// make this available to our Node applications
module.exports = project;