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
                            from        : `Mudibala <${noReplyMail.auth.user}>`, // sender email
                            to          : `${retUser.email}`, // list of receivers
                            subject     : `Chào mừng bạn đến với Mudibala`,
                            html        : `<html><body>
<p>Thân chào từ Mudibala team,</p>
<p>Cám ơn bạn đã đăng kí thành viên tại <a href="${req.protocol}://${req.HOST_NAME}">Mudibala</a>. Cộng đồng chia sẻ thông tin toàn diện cho mọi người rất vui khi đón nhận thành viên mới là bạn - Mudibalord. "Đối xử với người khác như cách mình muốn người khác đối xử với mình" là quy tắc ứng xử chung khi tham gia Mudibala. Xin hãy cùng chung tay xây dựng cộng đồng thông tin tích cực, có ích cho xã hội. Chúng tôi có niềm tin mãnh liệt rằng chia sẻ thông tin hiệu quả giữa mọi cá nhân trong xã hội sẽ giúp mọi người cùng sống hiệu quả hơn về thời gian và tiền bạc. Đây là kim chỉ nam trong việc xây dựng Mudibala. Mudibala luôn lắng nghe <a href="${req.protocol}://${req.HOST_NAME}/gui-gop-y">góp ý</a> của bạn để phục vụ bạn tốt hơn (bạn cần đăng nhập trước khi góp ý).</p>
<p>Bạn đã đăng kí thành viên Mudibala thông qua Facebook. Tài khoản và email của bạn đã được kích hoạt, mọi chức năng đã sẵn sàng để sử dụng.</p>
<p>Bạn có thể đọc thêm các bài blog về Mudibala, rất hữu ích để dùng Mudibala hiệu quả:</p>
<p>Mẹo <a href="${req.protocol}://${req.HOST_NAME}/dung-mudibala-hieu-qua">sử dụng Mudibala hiệu quả</a>:</p>
<ul>
<li><a href="${req.protocol}://${req.HOST_NAME}/blog/su-dung-hieu-qua-cong-cu-loc-tin">Sử dụng hiệu quả công cụ lọc tin</a></li>
<li><a href="${req.protocol}://${req.HOST_NAME}/blog/soan-noi-dung-tin-dang-hieu-qua">Soạn nội dung tin đăng hiệu quả</a></li>
</ul>
<p>Một số thông tin thêm về Mudibala từ trang <a href="${req.protocol}://${req.HOST_NAME}/blog">blog</a>:</p>
<ul>
<li><a href="${req.protocol}://${req.HOST_NAME}/blog/mudibala-la-gi">Mudibala là gì?</a></li>
<li><a href="${req.protocol}://${req.HOST_NAME}/blog/chinh-sach-bao-mat-mudibala">Chính sách bảo mật</a></li>
<li><a href="${req.protocol}://${req.HOST_NAME}/blog/dieu-khoan-su-dung-mudibala">Điều khoản sử dụng</a></li>
</ul>
<p>"Like" và theo dõi Mudibala trên các kênh xã hội để biết về cập nhật mới nhanh nhất:</p>
<ul>
<li><a href="https://www.facebook.com/mudibalaBoard/">Mudibala trên Facebook</a></li>
<li><a href="https://www.pinterest.com/mudibalaBoard/">Mudibala trên Pinterest</a></li>
</ul>
<p>Với Mudibala, thông tin của bạn sẽ được tất cả mọi người dễ dàng tìm thấy. Nên hãy nhớ, Mudibalord "với quyền lực càng lớn, trách nhiệm càng nhiều!". Hãy luôn đăng tin có trách nhiệm!</p>
<p><i>Thân,<br>
Mudibala team</i></p>
<i style="color:grey">(Xin lưu ý đây là email tự động từ hệ thống. Vui lòng không hồi đáp.)</i>
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
            special     : 'green',
            number      : 'blue',
            boolean     : 'red',
            undefined   : 'red',
            null        : 'red',
            string      : 'magenta',
            symbol      : 'green',
            date        : 'blue',
            regexp      : 'green',
        };
        //                mongoose.set('debug', true);
        //                app.use(morgan('dev'));
        //                console.log('Environment: `%s`. Logger, mongoose debug in use.', process.env.NODE_ENV);
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
        palmot.printDup = function(tags) {
            var list = [];
            console.log('*** printing tags:');
            for(tag1 in tags.s) {
                list.push(tag1)
                console.log('\t %s', tag1);
                if(tags.s[tag1].s) { for(tag2 in tags.s[tag1].s) {
                    list.push(tag2)
                    console.log('\t\t %s, %s', tag1, tag2)
                    if(tags.s[tag1].s[tag2].s) { for(tag3 in tags.s[tag1].s[tag2].s) {
                        list.push(tag3)
                        console.log('\t\t\t %s, %s, %s', tag1, tag2, tag3)
                        if(tags.s[tag1].s[tag2].s[tag3].s) { for(tag4 in tags.s[tag1].s[tag2].s[tag3].s) {
                            list.push(tag4)
                            console.log('\t\t\t\t %s, %s, %s, %s', tag1, tag2, tag3, tag4)
                            if(tags.s[tag1].s[tag2].s[tag3].s[tag4].s) { for(tag5 in tags.s[tag1].s[tag2].s[tag3].s[tag4].s) {
                                list.push(tag5)
                                console.log('\t\t\t\t\t %s, %s, %s, %s, %s', tag1, tag2, tag3, tag4, tag5)
                            }}
                        }}
                    }}
                }}
            }
            var uniq = list.map((name) => { return {count: 1, name: name} })
            .reduce((a, b) => { a[b.name] = (a[b.name] || 0) + b.count
            return a }, {})
            var duplicates = Object.keys(uniq).filter((a) => uniq[a] > 1)
            console.log('*** printing duplicate tags array:');
            console.log(duplicates)
        }
    } else {
        palmot.errRes = function(apiName, err) { return {
            ERROR           : `api called: '${apiName}'`,
            errorName       : err.name,
            errorMessage    : err.message,
        }};
        palmot.log = function() { }
        palmot.printDup = function() { }
    }
}

this.renderNotFound = function (req, res, next) { res.render('notFound') }
this.allRequestErrorHandler = function (err, req, res, next) { res.status(err.status || 500).json(err) }


























this.renderPage = function(req, res, next) { api.renderPage(req, res, next) }
this.renderPost = function(req, res, next) { api.renderPost(req, res, next) }
this.renderBlog = function(req, res, next) { api.renderBlog(req, res, next) }