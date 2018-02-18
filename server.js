var http                = require('http');
var express             = require('express');
var morgan              = require('morgan');
var mongoose            = require('mongoose');
var hbs                 = require('express-handlebars');
var helmet              = require('helmet');
var bodyParser          = require('body-parser');
var cookieParser        = require('cookie-parser');
var palmot              = require('./core/palmot.js');
var routes              = require('./core/routes');

var app                 = express();
var server              = http.createServer(app);
//var io                  = require('socket.io').listen(server);





// mongodb connection

mongoose.connect(process.env.DB_URL);
var db = mongoose.connection;
db.on('error', function(error) {console.log(error)});
db.on('disconnected', function() {console.log('MongoDB disconnected')});
db.on('connected', function() {console.log('Connected correctly to MongoDB')});





// handlebars template engine config

app.engine('hbs', hbs({
    extname         : 'hbs',
    defaultLayout   : 'main',
    layoutsDir      : process.env.PUBLIC + '/../views/layouts/',
    partialsDir     : process.env.PUBLIC + '/../views/partials/',
    helpers         : {
        foo: function(ind) { return parseInt(ind) + 1 },
//        foo: function () { return Date.now() - parseFloat(process.env.SEARCH_LIFE_SPAN) * 86400000 }
    }
}));
app.set('view engine', 'hbs');




// Express middlewares
app.use(helmet());
app.use(helmet.hidePoweredBy({ setTo: 'ASP.NET' }));
app.use(palmot.allRequestErrorHandler);
palmot.envWiseConfig(app, morgan, palmot, mongoose); // morgan and API call error response
palmot.initPassport(app);
//palmot.initSocketIO(io);
app.use(express.static(process.env.PUBLIC));
app.use(express.static(process.env.FILES));
app.use(bodyParser.json({limit : 20*1000})); // 20mb
app.use(bodyParser.urlencoded({ extended:true, limit: 9000})); // 9mb
app.use(cookieParser());
app.use(palmot.headerParser);
app.use(palmot.checkAccessToken);
app.use(routes.checkRoutePermission);




// routes

routes.loadRoutes(app);





// server

server.listen(process.env.PORT, process.env.HOST, function() {
    console.log(`Server listening on http://${process.env.HOST}:${process.env.PORT}`);
});
server.on('error', function(err) { console.log(err) });





// send uncaught errors to server admin

process.on('unhandledRejection', function(err, p) { palmot.reportSystemMaster(err) });
process.on('uncaughtException', function(err) { palmot.reportSystemMaster(err) });