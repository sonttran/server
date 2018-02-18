var _this               = this;
var palmot              = require('./palmot');
var tags                = require('./tags.js');







// Express routes handling: declare routes and challenges

this.pageRoutes = { // lv1 page routes
    // route                                hbs                     page permission
    '/'                                 : ['home',                 'master','admin','user','public'],
    '/dang-ky'                          : ['register',             'master','admin','user','public'],
    '/dang-nhap'                        : ['login',                'master','admin','user','public'],
    '/quen-mat-khau'                    : ['forgotPassword',       'master','admin','user','public'],
    '/dat-lai-mat-khau'                 : ['resetPassword',        'master','admin','user','public'],
    '/kich-hoat-email'                  : ['verifyEmail',          'master','admin','user','public'],
    '/cap-nhat-tai-khoan'               : ['updateProfile',        'master','admin','user','public'],
    '/bang-tin-theo-chu-de-chi-tiet'    : ['fullBoard',            'master','admin','user','public'],
    '/bang-tin-theo-tinh-thanh-pho-quan-huyen': ['fullLocation',   'master','admin','user','public'],
    '/tai-khoan'                        : ['profile',              'master','admin','user'],
    '/doi-mat-khau'                     : ['changePassword',       'master','admin','user'],
    '/dang-tin'                         : ['createPost',           'master','admin','user'],
    '/test-tags'                        : ['testTags',             'master','admin','user'],
    '/bang-tin'                         : ['search',               'master','admin','user','public'],
    '/app-health'                       : ['appHealth',            'master'],
    '/blog'                             : ['blog',                 'master','admin','user','public'],
    '/tao-blog'                         : ['createBlog',           'master','admin'],
    '/cap-nhat-blog'                    : ['updateBlog',           'master','admin'],
    '/blog-moi-nhat'                    : ['newestBlog',           'master','admin','user','public'],
    '/gioi-thieu-mudibala'              : ['introMudibala',        'master','admin','user','public'],
    '/thong-bao'                        : ['announcement',         'master','admin','user','public'],
    '/dung-mudibala-hieu-qua'           : ['useEffective',         'master','admin','user','public'],
    '/mudibala-va-cuoc-song-cua-ban'    : ['mudibalaU',            'master','admin','user','public'],
    '/hoi-dap-va-gop-y-cua-ban'         : ['qaFeedback',           'master','admin','user','public'],
    '/gui-gop-y'                        : ['sendFeedback',         'master','admin','user'],
    '/danh-sach-chu-de-cua-bang-tin-ho-chi-minh' : ['fullBoardOfLoc',      'master','admin','user','public'],
    '/danh-sach-chu-de-cua-bang-tin'    : ['fullBoardOfLoc',      'master','admin','user','public'],
};

this.apiRoutes = /^\/api\/v1\/([a-zA-Z0-9]+)$/; // /lv1/lv2/lv3 api routes
this.fileRoutes = /^\/file\//; // /lv1/lv2 file routes
this.postRoutes = /^\/tin\/([a-zA-Z0-9-]+)$/; // /lv1/l2 post detail routes
this.blogRoutes = /^\/blog\/([a-zA-Z0-9-]+)$/; // /lv1/lv2 blog detail routes

this.checkRoutePermission = function(req, res, next) {
    if(_this.apiRoutes.test(req.path)) { next() } // API route GO
    else if(_this.postRoutes.test(req.path)) { next() } // POST route GO
    else if(_this.blogRoutes.test(req.path)) { next() } // POST route GO
    else if(_this.pageRoutes[req.path]) { // PAGE route
        if(_this.pageRoutes[req.path].indexOf('public') > -1) { next() } // public GO
        else {
            if(!req.decoded) { res.redirect('/dang-nhap') } // token invalid > login
            else { // token VALID
                if(!req.decoded.emailVerified) { // challenge
                    res.redirect(`/kich-hoat-email`)
                } else if(!req.decoded.profileUpdated) { // challenge
                    res.redirect('/cap-nhat-tai-khoan')
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
    app.all('/:lv1/:lv2', palmot.getUser, function(req, res, next) {
        if(req.params.lv1 == 'tin') { palmot.renderPost(req, res, next) };
        if(req.params.lv1 == 'blog') { palmot.renderBlog(req, res, next) };
    });
    app.all('/:lv1/:lv2/:lv3', palmot.checkAPIpermission, palmot.callAPI);
}