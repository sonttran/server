var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
mongoose.Promise = require('q').Promise;

// main userSchema
var userSchema = new Schema({
    _id                 : String,
    email               : String,
    username            : String,
    password            : String,
    firstName           : String,
    lastName            : String,
    middleName          : String,
    phone               : String,
    avatar              : String,
    userPermission      : { type    : String, default   : 'user' },
    emailVerified       : { type    : Boolean, default  : false },
    profileUpdated      : { type    : Boolean, default  : false },
    posts               : [],
    blogs               : [
        // title, type, updatedAtToRender, url, carousel
    ],
    favPosts            : [ // array info of favorite posts
        //{postName:'Sami',url:'/sami-12312',createdAt:'123',postedBy:'Tran Thanh Son'}
    ],
    posRatings          : [], // array of user id rating positive ex: ['son@s.c', sam@g.c]
    negRatings          : [], // array of user id rating negative
}, {
    timestamps: true,
    usePushEach: true
});

userSchema.plugin(passportLocalMongoose);

var user = mongoose.model('user', userSchema); 

module.exports = user;
