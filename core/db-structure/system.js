var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var systemSchema = new Schema({
    _id                 : String, // same name of system info 'error', 'carousel'
    name                : String, // name of system info 'error', 'carousel'
    err                 : [
//        {
//            dateDis     : '2017/08/14 15:00:59 +07:00',
//            date        : Date.now(),
//            name        : 'ReferenceError',
//            message     : 'a is not defined',
//            at          : '/Users/son/Dropbox/Qamera/LNG/lng/server.js:88:84',
//        }
    ],
    carousel              : [ // carousel blog info
//        {
//            url           : '2017/08/14 15:00:59 +07:00',
//            photo         : '/file/1502612594627.jpeg',
//            title         : 'What is resell',
//        }
    ],
    feedback              : [ // carousel blog info
//        {
//            type          : 'topic', // topic, location, general
//            comment       : 'can them 1 chu de ve `mon an uong doc la`',
//            userId        : 'me@sontran.co'
//        }
    ],
}, {
    timestamps: true ,
    usePushEach: true
}); 


var system = mongoose.model('system', systemSchema);

module.exports = system;