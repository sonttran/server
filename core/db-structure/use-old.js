// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

// main userSchema
var userSchema = new Schema({
    firstName       : String,
    lastName        : String,
    fullName        : String,
    username        : String,
    password        : String,
    avatarFullUrl   : String,
//    _id             : String,
    url             : String,
    userPermission  : { type: String,
                        default: 'user' },
    email           : { type    : String,
                        unique  : true },
    facebook        : { OauthId     : String,
                        OauthToken  : String },
    postedBy        : { type: mongoose.Schema.Types.ObjectId,
                        ref: 'comment'}
}, {
    timestamps: true 
});
//userSchema.methods.fullName = function() { return (this.firstName + ' ' + this.lastName); }
userSchema.plugin(passportLocalMongoose); // mongoose will take functions provided by passportLocalMongoose to be its methods. In this case: .authenticate()

// the schema is useless so far
// we need to create a model using it
var user = mongoose.model('user', userSchema); // "user" will become colleciton name "users"

// make this available to our Node applications
module.exports = user;
