var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

// create a schema
var blogSchema = new Schema({
    title           : String, // title of the blog (whatever user input)
    content         : String, // blog content html format, generated by text-angular
    updatedAtToRender : String, // ready to render blog update date 
    postedBy        : String, // // _id (also email) of blog owner
    type            : String, // // _id (also email) of blog owner
    cate            : String, // // blog type, render for viewer
    cateLink        : String, // // blog type for url render
    photos          : [
        // { path : '/file/432sdf.jpg', name : 'Son Tran'} // list of these 
    ], 
    url             : String,
    _id             : String,
    metaDes         : String,
    viewed          : { type : Number, default : 0 },
    air             : { type : Boolean, default : false }, // first moment searchable
    carouselPos     : Number,
}, {
    timestamps: true,
    usePushEach: true
}); 

blogSchema.plugin(mongoosastic, JSON.parse(process.env.ES_CONFIG));

var blog = mongoose.model('blog', blogSchema);

module.exports = blog;