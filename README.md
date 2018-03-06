# Vpop 
Multi-purpose, lightweight, easy to expand, shipped with lots of features Node.js server to bootstrap your project.
Technologies used: <a href="https://nodejs.org/en/" target="_blank">Node.js</a>, <a href="https://expressjs.com/" target="_blank">ExpressJS</a>, <a href="https://www.mongodb.com/" target="_blank">MongoDB</a>, <a href="https://www.npmjs.com/package/mongoose" target="_blank">Mongoose</a>, <a href="https://jwt.io/" target="_blank">JSON Web Token</a>, <a href="https://nodemailer.com/about/" target="_blank">Node Mailer</a>, <a href="https://github.com/Unitech/pm2" target="_blank">PM2</a>, <a href="https://socket.io/" target="_blank">socket.io</a>, <a href="http://www.passportjs.org/" target="_blank">PassportJS</a>

## Table of content
* [Features](#features)
* [Install](#install)
* [Configure and start your server](#configure)
* [Usage](#usage)

### Features <a name="features"></a> 
* [Take less than 60 seconds to add a new API](#60s)
* [Built-in user role-based access control for API request](#built-in-ac)
* [Built-in user role-based access control for webpage request](#built-in-web-ac)
* [Shipped with basic user management: registration, email verification, ...](#users)
* [Shipped with mailing capability (send mail to user, system admin, ...)](#email)
* [Shipped with file upload API](#upload)
* [Shipped with integrated Handlebars engine for HTML rendering](#hbs)
* [Integrated socket.io real time engine (can turn on/off)](#io)
* [Easy to scale with PM2 (for small to mid-level size project)](#scale)

### Install <a name="install"></a> 
* Make sure you have <a href="https://nodejs.org/en/" target="_blank">Node.js</a> installed before running the following commands
```javascript
git clone https://github.com/sonttran/server.git
cd server
npm install
```

### Configure and start your server<a name="configure"></a>
* All configurations are made in ONE file `config.json`
* This configuration is for <a href="http://pm2.keymetrics.io/docs/usage/application-declaration/" target="_blank">PM2</a> to daemonize your server process. It's highly recommended to get familiar with PM2 before continuing.
* Install <a href="https://www.mongodb.com/" target="_blank">MongoDB</a> and have your connection string ready
* Register Facebook app if you want to integrate Facebook login (optional)
* Install PM2 to your local and server machine
```
sudo npm install pm2 -g
pm2 install pm2-server-monit
```
* Have your email account for system mail (if not, user related API will result errors)
* Complete information in `config.json` file
```javascript
{
    apps : [
        {
            name                    : "server", // name of process in PM2 manager console
            script                  : "./server.js", // file to bootstrap
            exec_mode               : "cluster", // for scaling
            instances               : 1, // # of processes at start
            watch                   : ["core","server.js"], // files to watch for auto restart
            env_local               : { // your "local" environment in `pm2 start config.json --env local`
                "NODE_ENV"          : "local", // e.g. process.env.NODE_ENV = "local"
                "PORT"              : 3000, // server port
                "HOST"              : '0.0.0.0', // server host
                "DB_URL"            : 'mongodb://localhost:27017/app', // connection string to MongoDB
                "JWT_SECRET"        : 'Breaking Dawn', // json web token secret
                "SESSION_TIMER"     : "7 days", // time config for user session
                "FORGOT_PASS_TIMER" : "24h", // time config for password recovery token
                "FB_CLIENT_ID"      : "111100106689192", // Facebook ID for login with Facebook
                "FB_CLIENT_SEC"     : "111111111101330ab2e7672142d06040", // Facebook secret
                "FB_CALLBACK_URL"   : "http://localhost:3000/api/v1/loginWithFacebookCb", // callback
                "PUBLIC"            : "/Users/sontran/Doc/server/public/", // path to your public folder 
                "FILES"             : "/Users/sontran/FILES/server", // path to store your server files
                "MAIL_NO_REPLY"     : {service: "gmail", // config server mail
                                       auth: {
                                           user: "example@gmail.com",
                                           pass: "password"
                                       }
                                      },
                "ERR_MAIL"          : {service: "gmail", // config system mail
                                       auth: {
                                           user: "example@gmail.com",
                                           pass: "password"
                                       }
                                      },
                "SERVER_ADMIN_EMAIL": 'admin_mail@example.com', // email to receive system alerts
                "SERVER_NAME"       : "Local Server", // name of your server in email
            },
            env_production          : { // your "production" environment in remote server with `pm2 start config.json --env production`
                "NODE_ENV"          : "production", 
                "PORT"              : 5600,
                "HOST"              : '127.0.0.1',
                "DB_URL"            : 'mongodb://localhost:27017/production',
                "JWT_SECRET"        : '111111',
                "SESSION_TIMER"     : "30 days",
                "FORGOT_PASS_TIMER" : "24h",
                "FB_CLIENT_ID"      : "12345678901234",
                "FB_CLIENT_SEC"     : "123456789023456789234567893456",
                "FB_CALLBACK_URL"   : "https://example.com/api/v1/loginWithFacebookCb",
                "PUBLIC"            : "/home/producttion/yourapp/current/public",
                "FILES"             : "/home/producttion/FILES/",
                "MAIL_NO_REPLY"     : {service: "gmail",
                                       auth: {
                                           user: "example@gmail.com",
                                           pass: "1234567890"
                                       }
                                      },
                "ERR_MAIL"          : {service: "gmail",
                                       auth: {
                                           user: "admin@example.com",
                                           pass: "1234567890"
                                       }
                                      },
                "SERVER_ADMIN_EMAIL": 'admin_email@example.com',
                "SERVER_NAME"       : "Production Server",
            },
        }
    ],
    "deploy"                        : { // for staging server deployment
        "staging"                   : { // "staging" in `pm2 deploy config.json staging setup`
            "user"                  : "username", // server user
            "host"                  : ["57.57.57.57"], // server IP
            "ref"                   : "origin/master",
            "repo"                  : "git@gitlab.com:yourcompany.com/yourapp.git", // git link
            "key"                   : "/path/to/key.pem", // path to server pem key in your local
            "path"                  : "/path/to/app", // path to app in your REMOTE server
            "ssh_options"           : "StrictHostKeyChecking=no",
            "pre-deploy-local"      : "echo 'This is a local executed command'",
            "post-deploy"           : "npm install && pm2 startOrRestart config.json --env staging",
            "env"  : {
                "NODE_ENV"          : "production",
            }
        },
        "production"                : { // for production server deployment
            "user"                  : "username",
            "host"                  : ["229.229.229.229"],
            "ref"                   : "origin/master",
            "repo"                  : "git@gitlab.com:yourcompany.com/yourapp.git",
            "key"                   : "/path/to/key.pem",
            "path"                  : "/path/to/app",
            "ssh_options"           : "StrictHostKeyChecking=no",
            "pre-deploy-local"      : "echo 'This is a local executed command'",
            "post-deploy"           : "npm install && pm2 startOrRestart config.json --env production",
            "env"  : {
                "NODE_ENV"          : "production",
            }
        },
    }
}
```
##### Start and tail your server locally after all configuration completed
```
pm2 start config.json --env local
pm2 logs server
```
##### Deploy your server in remote server
- Get your file folder and put it config file `"FILES" : "/home/producttion/FILES/"`
- Clone your repo to server
```
pm2 deploy config.json staging setup
```
- Get your app public folder and put it in config file `"PUBLIC" : "/home/producttion/yourapp/current/public"`
- Start your server remotely with
```
pm2 deploy config.json staging update
```
##### Link your remote server with PM2 console for monitoring
* Create your free account at <a href="https://app.keymetrics.io/#/" target="_blank">PM2 app</a>
* Follow simple linking instructions on PM2 app. The result will look like this
![PM2 console](public/images/pm2.gif)

### Usage<a name="usage"></a>
* `/core/db-structure` contains all Mongoose schemas
* `/core/palmot.js` contains all ExpressJS middlewares
* `/core/v1-api.js` contains all APIs
* `/core/routes.js` contains all definitions of APIs and webpage routes
* `/views` contains all Handlebars templates


#### Take less than 60 seconds to add a new API<a name="60s"></a>
* In `/core/v1-api.json` add your api and register it
```javascript
this.permission = { // register api and its permission to list

    // API name  API permission

    myNewAPI     : ['master', 'admin', 'user', 'public'], // all user type in list can access this API
    // ...
}

this.myNewAPI = function(req, res, cb) {
    cb(null, {myNewAPI : 'add successful!'}); // done
}
```
* Try your newly added API. Open your web browser, go to
```
http://localhost:300/api/v1/myNewAPI
```
* API reponse
```
{
    "SUCCESS": "api called: 'myNewAPI'",
    "myNewAPI": "add successful!"
}
```
* API return errors (you can pass Node.js Error Object. Non-production environment will give more insight about error)
```javascript
this.myNewAPI = function(req, res, cb) {
    // ... your code
    cb({message: 'something went wrong!' }, null); // done
}
```
* Error response from API call `http://localhost:300/api/v1/myNewAPI`
```javascript
{
    "ERROR": "api called: 'myNewAPI'",
    "errorMessage": "something went wrong!"
}
```
* Explain: `req`, `res` are <a href="https://expressjs.com/" target="_blank">ExpressJS</a> <a href="https://expressjs.com/en/4x/api.html#req" target="_blank">request</a> and <a href="response" target="_blank">response</a> object. `cb` is callback method to when API processing is done.
```javascript
    cb(err, null) // error callback
    cb(null, {}) // success callback
```
* Note: API accepts all `http` methods (`GET`, `POST`, `PUT`, `DELETE`, ...)


#### Built-in user role-based access control for API request<a name="built-in-ac"></a>
* When user created, user permission is defined in user schema `/core/db-structure/user.js`
```javascript
    userPermission : { type : String, default : 'user' },
```
* When user logins successfully, a token is issued and stored in user's browser (API `login`)
* When creating an API in `/core/v1-api.js`, make sure to list all user permission to that api.
```javascript
this.permission = { // register api and its permission to list
    api1 : ['master', 'admin', 'user', 'public'], // every body can access
    api2 : ['master', 'admin', 'user'],           // registered user and up
    api3 : ['master', 'admin'],                   // web admin and up
    api4 : ['master'],                            // only system master 
}
```
* See `checkAPIpermission` middlewares in `/core/palmot.js` for more details

#### Built-in user role-based access control for webpage request<a name="built-in-web-ac"></a>

* All routes definitions and access permissions are defined in `/core/routes.js`
* Register your routes (APIs and webpages)
```javascript
this.pageRoutes = { // lv1 page routes
    // route                                hbs                     page permission
    '/'                                 : ['home',                 'master','admin','user','public'],
    '/user-dashboard'                   : ['userPage',             'master','admin','user'],
    '/admin-dashboard'                  : ['adminPage',            'master','admin'],
    '/web-master-dashboard'             : ['masterPage',           'master'],
    '/login'                            : ['login',                'master','admin','user','public'],
    '/verify-email'                     : ['verifyEmail',          'master','admin','user','public'],
    '/update-profile'                   : ['updateProfile',        'master','admin','user','public'],
};
```
* Define pattern of your routes
```javascript
this.apiRoutes = /^\/api\/v1\/([a-zA-Z0-9]+)$/; // /lv1/lv2/lv3 api routes
this.fileRoutes = /^\/file\//; // /lv1/lv2 file routes
```
* Check for route permission with `checkRoutePermission` middleware
* Finally, load all routes to ExpressJS
```javascript
this.loadRoutes = function(app) {
    app.all('/', palmot.getUser, palmot.renderPage);
    app.all('/:lv1', palmot.getUser, palmot.renderPage);
    app.all('/:lv1/:lv2/:lv3', palmot.checkAPIpermission, palmot.callAPI);
}
```
* Notes: 100% of routes are controled. If you don't define your routes and loads it, server will redirect to `Not Found` page.


#### Shipped with basic user management: registration, email verification, ...<a name="users"></a>

* Server is shipped with user management APIs and its permissions. Ready to use to bootstrap your application
```javascript
    createUser              : ['master', 'admin', 'user', 'public'],
    getUser                 : ['master', 'admin', 'user'],
    updateUser              : ['master', 'admin'],
    delUser                 : ['master', 'admin', 'user'],
    login                   : ['master', 'admin', 'user', 'public'],
    logout                  : ['master', 'admin', 'user'],
    changeName              : ['master', 'admin', 'user'],
    changeAvatar            : ['master', 'admin', 'user'],
    changePassword          : ['master', 'admin', 'user'],
    sendResetPassLink       : ['master', 'admin', 'user', 'public'],
    resetPassword           : ['master', 'admin', 'user', 'public'],
    sendVerificationEmail   : ['master', 'admin', 'user'],
    verifyEmail             : ['master', 'admin', 'user', 'public'],
    loginWithFacebook       : ['master', 'admin', 'user', 'public'],
    loginWithFacebookCb     : ['master', 'admin', 'user', 'public'],
    updateProfile           : ['master', 'admin', 'user'],
```


#### Shipped with mailing capability (send mail to user, system admin, ...)<a name="email"></a>
* Server is integated with Node mailer by default. Example `reportError` API to system admin 
```javascript
this.reportError = function(err) {
    var now = moment();
    var errDate = now.format('YYYY/MM/DD HH:mm:ss Z');
    var errAt = err.stack.match(/\/.+?(?=\))/)[0];
    var mail = {
        from        : `${process.env.SERVER_NAME} <${errReportMail.auth.user}>`, // sender email
        to          : `${process.env.SERVER_ADMIN_EMAIL}`, // list of receivers
        subject     : `Exception thrown`,
        html        : `<html><body>
            <p><b>Date</b>          : ${errDate}</p>
            <p><b>Name</b>          : ${err.name}</p>
            <p><b>Message</b>       : ${err.message}</p>
            <p><b>At</b>            : ${errAt}</p>
            <p><b>Full error</b>    : ${err.stack}</p>
            </body></html>` // html body
    };
    transporter.sendMail(mail, function(err, info) { if(err) { _this.reportError(err) }});
    var errToSave = {
        dateDis     : errDate,
        date        : Date.now(),
        name        : err.name,
        message     : err.message,
        at          : errAt,
    }
    system.findById('error').then(retError => {
        if(retError) {
            retError.err.push(errToSave);
            retError.save();
        } else {
            system.create({name: 'error', _id:'error',err:[errToSave]}).catch(err => palmot.log(err));
        }
    }).catch(err => _this.reportError(err));
}
```


#### Shipped with file upload API<a name="upload"></a>
* File upload capability uses <a href="https://www.npmjs.com/package/multer" target="_blank">Multer</a>. Modify `storage` or `upload` object in `/core/v1-api.js` for Multer settings if needed. File upload example
```javascript
this.changeAvatar = function(req, res, cb) {
    upload(req, res, function(err) {
        if(err) { cb(err, null) } else if(req.files && req.files.length) {
            user.findByIdAndUpdate(req.decoded.username, {$set : {
                avatar      : '/file/' + req.files[0].filename
            }}, {new: false}).then(retUser => {
                cb(null, {});
            }).catch(err => { cb(err, null) });
        } else { cb(null, {err : 'no file sent'}) };
    });
}
```


#### Shipped with integrated Handlebars engine for HTML rendering<a name="hbs"></a>
* Configuration for <a href="https://www.npmjs.com/package/express-handlebars" target="_blank">Handlebars engine for Express</a> is in `/server.js` file. It's highly recommended to familiar yourself with Handlebars engine for Express before moving on.
* Main layout file `/views/layouts/main.hbs`
* `/view/partials` folder contains your `.hbs` partials such as webpage footer, navbar
* Webpage templates are in `/views` folders such as `home.hbs`, `login.hbs`
* Steps to add new page:
* Register routes in `/core/routes.js`
* Register route to `renderPage` (internal used) API in `/core/v1-api.js`
* Note: the idea to pass the rendering steps like above is to centralize all APIs to a single file.


#### Integrated socket.io real time engine (turn it on/off)<a name="io"></a>

* To turn <a href="https://socket.io/" target="_blank">socket.io</a> on
* Uncomment socket.io line in `/server.js`
```javascript
    var io  = require('socket.io').listen(server);
```
* Uncomment socket.io line in `/core/palmot.js` (there are two of them)
```javascript
    if(api.permission.useIO.indexOf(apiName) > -1) { req.io = _this.io };
    if(api.permission.useIO.indexOf(apiName) > -1) { req.io = _this.io };
```
* Create your socket.io API in `/core/v1-api.js`
```javascript
this.io = function(req, res, cb) {
    var io = req.io;
    io.sockets.emit('broadcast', req.query.mess);
    cb(null, {broadcasted : req.query.mess});
}
```
* Recognize the API as a socket.io API (this is to pass socket.io object to req.io)
```javascript
this.permission = { // register api and its permission to list

    // API name                         API permission

    // socket.io
    useIO                               : ['io'], // api uses realtime engine
        
}
```
* Register user permission for it as normal
```javascript
this.permission = { // register api and its permission to list

    // API name                         API permission

    // socket.io
    
    io                                  : ['master'], // only system master can use this API
}
```

#### Easy to scale with PM2 (for small to mid-level size project)<a name="scale"></a>
* <a href="https://www.npmjs.com/package/pm2" target="_blank">PM2</a> can scale your Node.js app via cli or <a href="https://app.keymetrics.io/" target="_blank">PM2 web console</a>
* On server cli
```javascript
pm2 scale [app-name] 10 // forked app to 10 instances
```
* On PM2 web console (not free feature)


