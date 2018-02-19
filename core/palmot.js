var _this               = this;
var passport            = require('passport');
var LocalStrategy       = require('passport-local').Strategy;
var FacebookStrategy    = require('passport-facebook').Strategy;
var jwt                 = require('jsonwebtoken');
var fs                  = require('fs');
var nodemailer          = require('nodemailer');

var noReplyMail         = JSON.parse(process.env.MAIL_NO_REPLY);
var transporter         = nodemailer.createTransport(noReplyMail);

var api                 = require('./v1-api.js');
var user                = require('./db-structure/user.js');







this.checkAPIpermission = function(req, res, next) {
    var apiName = req.params.lv3; // get api name
    _this.log('*** API called: ' + req.params.lv3);
    if(api.permission[apiName]) { // if requested API exists
        if(api.permission[apiName].indexOf('public') > -1) { // public API > GO
            // if(api.permission.useIO.indexOf(apiName) > -1) { req.io = _this.io }; // socket.io
            next();
        } else { // API not public
            if(req.decoded) { // valid token
                if(api.permission[apiName].indexOf(req.decoded.userPermission)>-1) { // GO
                    //if(api.permission.useIO.indexOf(apiName) > -1) {req.io = _this.io}; //socket.io
                    next();
                } else { // not authorized > STOP
                    res.status(403).json({
                        errorCode       : 403,
                        errorMessage    : 'Access denied, additional priviledge required!'
                    })
                }
            } else { // invalid token
                res.status(401).json({
                    errorCode       : 401,
                    errorMessage    : 'You are not authenticated, please login to proceed!'
                });
            }
        }
    } else { // if requested API does not exist
        res.status(404).json({errorCode: 404, errorMessage: 'API not exist or registered'})
    }
}

this.callAPI = function(req, res, next) { //match request to api then call if api exists
    var apiName = req.params.lv3; // get api name
    var callAPI = api[apiName]; // pass requested api from api
    try { // catch error when MAKING the call
        callAPI(req, res, function(err, result) { // implement api call
            if(err) { // return error happens when PROCESSING call
                var response = _this.errRes(apiName, err);
                return res.status(err.statusCode || '500').json(response);
            } else { // return result if PROCESSING call success
                var response = { SUCCESS : `api called: '${apiName}'` };
                for(var prop in result) { response[prop] = result[prop] };
                return res.status('200').json(response);
            }
        });
    } catch(err) { // handle error happens when MAKING making call
        var response = _this.errRes(apiName, err);
        return res.status(err.statusCode || '500').json(response);
    }
}





this.getToken = function(user, timer) {
    return jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: timer
    });
}

this.reportSystemMaster = function(err) { api.reportError(err) }




























this.getUser = function(req, res, next) { 
    if(req.decoded) {
        user.findById(req.decoded.username).then(retUser => {
            req.user = retUser; next();
        }).catch(err => { req.user = false; next(); })
    } else {
        req.user = false;
        next();
    }
}

this.checkAccessToken = function(req, res, next) {
    if(req.cookies['x-access-token']) {
        var token = req.cookies['x-access-token'].token;
        jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
            if(err) { req.decoded = false } else { req.decoded = decoded };
            next();
        });
    } else {
        req.decoded = false;
        next();
    }
}

this.headerParser = function(req, res, next) {
    if(process.env.NODE_ENV !== 'production') {
        req.HOST_NAME = req.get('host');
        req.REAL_IP = req.ip;
    } else {
        req.HOST_NAME = req.headers['x-host-name'];
        req.REAL_IP = req.headers['x-real-ip'];
    };
    next();
}

this.initSocketIO = function(io) {
    _this.io = io;
    var users = [];
    var connections = [];
    io.on('connection', function(socket) {
        connections.push(socket);
        console.log('Connect: %s connected', connections.length); // connect alert
        socket.on('disconnect', function(socket) {
            connections.splice(connections.indexOf(socket),1);
            console.log('Disconnect: %s connnected', connections.length); // disconnect alert
        });
    })
}

this.initPassport = function(app) {
    app.use(passport.initialize());
    passport.use(new LocalStrategy(user.authenticate()));
    passport.serializeUser(user.serializeUser());
    passport.deserializeUser(user.deserializeUser());
    passport.use(new FacebookStrategy({
        clientID      : process.env.FB_CLIENT_ID,
        clientSecret  : process.env.FB_CLIENT_SEC,
        callbackURL   : process.env.FB_CALLBACK_URL,
        profileFields : ['email', 'id', 'displayName', 'name', 'gender', 'picture.type(large)'],
        passReqToCallback   : true
    }, function(req, accessToken, refreshToken, profile, done) {
        if(!profile._json.email) {
            done({
                name    : "NO EMAIl",
                message : "Login with Facebook failed. Your Facebook account has no email."
            }, null)
        } else {
            user.findById(profile._json.email).then(retUser => {
                if(retUser) { return done(null, retUser) }
                else {
                    var avatar = api.download(profile._json.picture.data.url);
                    user.create({
                        _id             : profile._json.email,
                        username        : profile._json.email,
                        email           : profile._json.email,
                        firstName       : profile._json.first_name,
                        lastName        : profile._json.last_name,
                        avatar          : avatar,
                        userPermission  : 'user',
                        emailVerified   : true, // YES email verify
                        facebook        : {
                            OauthId     : profile._json.id,
                            OauthToken  : accessToken
                        }
                    }).then(retUser => {
                        done(null, retUser);
                        var mail = {
                            from        : `Your App name <${noReplyMail.auth.user}>`, // sender email
                            to          : `${retUser.email}`, // list of receivers
                            subject     : `Welcome`,
                            html        : `<html><body>
                                <p>Welcome email body</p>
                            </body></html>` // html body
                        };
                        transporter.sendMail(mail, function(err, info) { if(err){ console.log(err) }});
                    }).catch(err => { done(err, null) })
                }
            }).catch(err => { return done(err, null)})
        }
    }));
}

this.envWiseConfig = function(app, morgan, palmot, mongoose) {
    if(process.env.NODE_ENV !== 'production') {
        var util = require('util');
        util.inspect.styles = {
            "special"     : 'green',
            "number"      : 'blue',
            "boolean"     : 'red',
            "undefined"   : 'red',
            "null"        : 'red',
            "string"      : 'magenta',
            "symbol"      : 'green',
            "date"        : 'blue',
            "regexp"      : 'green',
        };
        // mongoose.set('debug', true);
        // app.use(morgan('dev')); // turn on/off morgan logger
        // console.log('Environment: `%s`. Logger, mongoose debug in use.', process.env.NODE_ENV);
        palmot.errRes = function(apiName, err) { return {
            ERROR           : `api called: '${apiName}'`,
            errorName       : err.name,
            errorMessage    : err.message,
            errorStack      : err.stack
        }};
        palmot.log = function(l1, l2, l3, l4, l5) {
            if(!l2) { console.log(util.inspect(l1, {showHidden:true,depth:null,colors:true})); }
            else if(!l3){ console.log(l1, l2) }
            else if(!l4){ console.log(l1, l2, l3) }
            else if(!l5){ console.log(l1, l2, l3, l4) }
            else { console.log(l1, l2, l3, l4, l5) }
        };
    } else {
        palmot.errRes = function(apiName, err) { return {
            ERROR           : `api called: '${apiName}'`,
            errorName       : err.name,
            errorMessage    : err.message,
        }};
        palmot.log = function() { };
    }
}

this.renderNotFound = function (req, res, next) { res.render('notFound') }
this.allRequestErrorHandler = function (err, req, res, next) {res.status(err.status || 500).json(err)}





this.renderPage = function(req, res, next) { api.renderPage(req, res, next) }
this.renderPost = function(req, res, next) { api.renderPost(req, res, next) }
this.renderBlog = function(req, res, next) { api.renderBlog(req, res, next) }