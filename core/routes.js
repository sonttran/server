var _this               = this;
var palmot              = require('./palmot');







// Express routes handling: declare routes and challenges

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

this.apiRoutes = /^\/api\/v1\/([a-zA-Z0-9]+)$/; // /lv1/lv2/lv3 api routes
this.fileRoutes = /^\/file\//; // /lv1/lv2 file routes

this.checkRoutePermission = function(req, res, next) {
    if(_this.apiRoutes.test(req.path)) { next() } // API route GO
    else if(_this.pageRoutes[req.path]) { // PAGE route
        if(_this.pageRoutes[req.path].indexOf('public') > -1) { next() } // public GO
        else {
            if(!req.decoded) { res.redirect('/login') } // token invalid > login
            else { // token VALID
                if(!req.decoded.emailVerified) { // challenge
                    res.redirect(`/verify-email`)
                } else if(!req.decoded.profileUpdated) { // challenge
                    res.redirect('/update-profile')
                } else if(_this.pageRoutes[req.path].indexOf(req.decoded.userPermission)>-1) { // GO
                    next();
                } else { // if userPermission IS NOT IN route permission list
                    res.status(403).json({
                        errorCode    : 403,
                        errorMessage : 'Access denied, you are not authorized to access this page'
                    })
                }
            }
        }
    } else { palmot.renderNotFound(req, res, next) } // no valid route > NOT FOUND
}





// Express routes: load the routes to Express

this.loadRoutes = function(app) {
    app.all('/', palmot.getUser, palmot.renderPage);
    app.all('/:lv1', palmot.getUser, palmot.renderPage);
    app.all('/:lv1/:lv2/:lv3', palmot.checkAPIpermission, palmot.callAPI);
}