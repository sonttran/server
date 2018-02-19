var _this               = this;
var passport            = require('passport');
var fs                  = require('fs');
var multer              = require('multer');
var crypto              = require('crypto');
var jwt                 = require('jsonwebtoken');
var nodemailer          = require('nodemailer');
var path                = require('path');
var request             = require('request');
var moment              = require('moment');
var palmot              = require('./palmot.js');

var noReplyMail         = JSON.parse(process.env.MAIL_NO_REPLY);
var errReportMail       = JSON.parse(process.env.ERR_MAIL);
var transporter         = nodemailer.createTransport(noReplyMail);

//disk storage setting
var storage = multer.diskStorage({
    destination : function(req, file, cb) { cb(null, process.env.FILES + '/file/'); },
    filename    : function(req, file, cb) {
        cb(null, Date.now()+'_'+ file.originalname);
        //        cb(null, Date.now()+'-'+ file.originalname + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
    }
});

var upload = multer({
    limits      : { fileSize: 500*1000 }, // 200 kb
    storage     : storage, 
    fileFilter  : function(req, file, cb) {
        var filetypes       = /jpeg|jpg|png|csv|/; // allowed filetypes
        var mimetype        = file.mimetype;
        var extname         = path.extname(file.originalname).toLowerCase();
        var testMimetype    = filetypes.test(mimetype);
        var testExtname     = filetypes.test(extname);
        if (testMimetype && testExtname) { cb(null, true) } 
        else {
            cb(null, false); 
            cb(new Error(`filetype not supported: ${mimetype}, ${extname}`)) 
        }
    }
}).array('files', 20);

// end of settings




var tags                = require('./tags');
var tagss2              = require('./tagss2');
var routes              = require('./routes');
var user                = require('./db-structure/user');





this.permission = { // register api and its permission to list

    // API name                         API permission

    myNewAPI                : ['master', 'admin', 'user', 'public'],
    
    // user
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

    // internal use apis
    download                            : [],
    delFiles                            : [],
    removeDocs                          : [],
    renderPage                          : [],
    makeTags                            : [],
    reportError                         : [],
    getServerErr                        : ['master'],

    // socket.io
    useIO                               : ['io'], // api uses realtime engine
    io                                  : ['master'],
}





this.myNewAPI = function(req, res, cb) {
//    cb(null, { myNewAPI : 'add successful!' });
    cb({message: 'something went wrong!' }, null); // done
}





// user

this.createUser = function(req, res, cb) {
    user.register(new user({
        _id             : req.body.email,
        username        : req.body.email,
        email           : req.body.email,
        firstName       : req.body.firstname,
        lastName        : req.body.lastname
    }), req.body.password, function(err, retUser) {
        if(err) { cb(err, null) }
        else if(retUser) {
            cb(null, {username : retUser.username});
            var token = palmot.getToken({username: retUser.email}, process.env.FORGOT_PASS_TIMER);
            var mail = {
                from        : `Mudibala <${noReplyMail.auth.user}>`, // sender email
                to          : `${retUser.email}`, // list of receivers
                subject     : `Chào mừng bạn đến với Mudibala`,
                html        : `<html><body>
<p>Thân chào từ Mudibala team,</p>
<p>Cám ơn bạn đã đăng kí thành viên tại <a href="${req.protocol}://${req.HOST_NAME}">Mudibala</a>. Cộng đồng chia sẻ thông tin toàn diện cho mọi người rất vui khi đón nhận thành viên mới là bạn - Mudibalord. "Đối xử với người khác như cách mình muốn người khác đối xử với mình" là quy tắc ứng xử chung khi tham gia Mudibala. Xin hãy cùng chung tay xây dựng cộng đồng thông tin tích cực, có ích cho xã hội. Chúng tôi có niềm tin mãnh liệt rằng chia sẻ thông tin hiệu quả giữa mọi cá nhân trong xã hội sẽ giúp mọi người cùng sống hiệu quả hơn về thời gian và tiền bạc. Đây là kim chỉ nam trong việc xây dựng Mudibala. Mudibala luôn lắng nghe <a href="${req.protocol}://${req.HOST_NAME}/gui-gop-y">góp ý</a> của bạn để phục vụ bạn tốt hơn (bạn cần đăng nhập trước khi góp ý).</p>
<p>Trước khi sử dụng, <a href="${req.protocol}://${req.HOST_NAME}/api/v1/verifyEmail?q=${token}">vui lòng xác nhận email bằng cách nhấn vào đây</a>. Đường dẫn xác nhận email chỉ có hiệu lực trong 24 giờ kể từ lúc bạn nhận được email này.</p>
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

            // send mail
            transporter.sendMail(mail, function(err, info) { if(err){ console.log(err) }});
        } else { cb({message : 'weirdest thing ever happened'}, null) }
    });
}

this.getUser = function(req, res, cb) {
    user.findById(req.decoded.username).then(retUser => {
        cb(null, {user : retUser})
    }).catch(err => { cb(err, null)})
}

this.updateUser = function(req, res, cb) {
    user.findByIdAndUpdate(req.decoded.username, req.body.user, {new: true}).then(retUser => {
        cb(null, {user : retUser})
    }).catch(err => { cb(err, null)})
}

this.delUser = function(req, res, cb) {
    user.findByIdAndRemove(req.decoded.username).then(retUser => {
        res.clearCookie('x-access-token');
//        cb(null, {deletedUser : retUser});
        res.redirect(`/`);
        _this.delFiles(['avatar'], retUser);
//        _this.removeDocs('loadingPort',         retUser.loadingPort,        loadingPort);
//        _this.removeDocs('dischargePort',       retUser.dischargePort,      dischargePort);
//        _this.removeDocs('routeAndDistance',    retUser.routeAndDistance,   routeAndDistance);
//        _this.removeDocs('lngCarrier',          retUser.lngCarrier,         lngCarrier);
    }).catch(err => { cb(err, null)});
}

this.delFiles = function(array, collection) {
    if(array.length) {
        if(collection) { // retUser.avatar and so on
            array.forEach(item => { 
                if(collection[item]) {
                    try { fs.unlinkSync(process.env.FILES + collection[item]); console.log(`deleted ${item}`) } 
                    catch(err) { console.log(err) }
                }
            });
        } else { // OR list of path to delete
            array.forEach(item => {
                try { fs.unlinkSync(process.env.FILES + item); console.log(`deleted ${item}`) } 
                catch(err) { console.log(err) }
            })
        }
    }
}


this.removeDocs = function(collectionName, array, collectionSchema) {
    if(array && array.length) {
        array.forEach(item => {
            collectionSchema.findByIdAndRemove(item.id).then(retDoc => {
                if(collectionName == 'loadingPort' && retDoc.COU.length) {
                    var filesToDel = [];
                    for(var i = 0; i < retDoc.COU.length; i++) { filesToDel.push(retDoc.COU[i].path) }
                    _this.delFiles(filesToDel, null) 
                }
            }).catch(err => { console.log(err);  });
            console.log(`deleted ${item.name}`)
        })
    }
}

this.login = function(req, res, cb) {
    passport.authenticate('local', function(err, retUser, info) {
        if(err) { cb(err, null) }
        else if(!retUser) { cb(info, null) }
        else {
            var token = palmot.getToken({
                username        : retUser.username,
                userPermission  : retUser.userPermission,
                profileUpdated  : retUser.profileUpdated,
                emailVerified   : retUser.emailVerified 
            }, process.env.SESSION_TIMER);
            res.cookie('x-access-token', {token : token }, {httpOnly : true });
            cb(null, {user : retUser.username});
        }
    })(req,res,cb);
}

this.logout = function(req, res, cb) {
    res.clearCookie('x-access-token');
    cb(null, {});
}

this.changeName = function(req, res, cb) {
    user.findByIdAndUpdate(req.decoded.username, {$set: {
        firstName       : req.body.newFirstname,
        lastName        : req.body.newLastname
    }}, {new: true}).then(retUser => {
        cb(null, {user : retUser})
    }).catch(err => { cb(err, null)})
}

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

this.changePassword = function(req, res, cb) {
    req.body.username = req.decoded.username;
    passport.authenticate('local', function(err, userP, info) {
        if(err) { cb(err, null) }
        else if(!userP) { cb(info, null) }
        else {
            user.findById(req.body.username).then(retUser => {
                if(retUser) {
                    retUser.setPassword(req.body.newPassword, function() {
                        retUser.save();
                        res.clearCookie('x-access-token');
                        var mail = {
                            from        : `Mudibala <${noReplyMail.auth.user}>`, // sender email
                            to          : `${req.decoded.username}`, // list of receivers
                            subject     : `Đổi mật khẩu thành công`,
                            html        : `<html><body>
<p>Thân chào từ <a href="${req.protocol}://${req.HOST_NAME}">Mudibala</a>,</p>
<p>Đây là email thông báo bạn đã đổi mật khẩu thành công của tài khoản Mudibala gắn với email này.</p>
<p><i>Thân,<br>
Mudibala team</i></p>
<i style="color:grey">(Xin lưu ý đây là email tự động từ hệ thống. Vui lòng không hồi đáp.)</i>
</body></html>` // html body
                        };
                        transporter.sendMail(mail, function(err, info) { // send mail
                            if(err) { console.log(err) }
                        });
                        cb(null,{});
                    });
                } else { cb({message: 'This user does not exist'}, null) }
            }).catch(err => { cb(err, null) })
        }
    })(req, res, cb);
}

this.sendResetPassLink = function(req, res, cb) {
    var token = palmot.getToken({username: req.body.email}, process.env.FORGOT_PASS_TIMER);
    var mail = {
        from        : `Mudibala <${noReplyMail.auth.user}>`, // sender email
        to          : `${req.body.email}`, // list of receivers
        subject     : `Lấy lại mật khẩu`,
        html        : `<html><body>
<p>Thân chào từ <a href="${req.protocol}://${req.HOST_NAME}">Mudibala</a>,</p>
<p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu từ tài khoản gắn với email của bạn. Để thiết lập mật khẩu mới, vui lòng <a href="${req.protocol}://${req.HOST_NAME}/dat-lai-mat-khau?q=${token}">nhấn vào đây</a>. Đường dẫn thiết lập mật khẩu mới chỉ có hiệu lực trong 24 giờ kể từ lúc bạn nhận được email này</p>
<p><i>Thân,<br>
Mudibala team</i></p>
<i style="color:grey">(Xin lưu ý đây là email tự động từ hệ thống. Vui lòng không hồi đáp.)</i>
</body></html>` // html body
    };
    cb(null, {user : req.body.email})
    transporter.sendMail(mail, function(err, info) { // send mail
        if(err) { console.log(err) }
    });
}

this.resetPassword = function(req, res, cb) {
    jwt.verify(req.query.q || req.body.token, process.env.JWT_SECRET, function(err, decoded) { 
        if(err) { cb(err, null) } 
        else {
            user.findById(decoded.username).then(retUser => {
                if(retUser) {
                    retUser.setPassword(req.body.newPassword, function(){
                        retUser.save();
                        cb(null,{passwordReset : 'success'});
                    });
                } else { res.status(500).json({message: 'This user does not exist'}) }
            }).catch(err => { cb(err, null) })
        }
    });
}

this.sendVerificationEmail = function(req, res, cb) {
    var token = palmot.getToken({username: req.decoded.username}, process.env.FORGOT_PASS_TIMER);
    var mail = {
        from        : `Mudibala <${noReplyMail.auth.user}>`, // sender email
        to          : `${req.decoded.username}`, // list of receivers
        subject     : `Xác nhận email`,
        html        : `<html><body>
<p>Thân chào từ <a href="${req.protocol}://${req.HOST_NAME}">Mudibala</a>,</p>
<p>Bạn nhận được email này vì bạn đã yêu cầu gửi lại đường dẫn xác nhận email. <a href="${req.protocol}://${req.HOST_NAME}/api/v1/verifyEmail?q=${token}">Vui lòng xác nhận email bằng cách nhấn vào đây</a>. Đường dẫn xác nhận email chỉ có hiệu lực trong 24 giờ kể từ lúc bạn nhận được email này.</p>
<p><i>Thân,<br>
Mudibala team</i></p>
<i style="color:grey">(Xin lưu ý đây là email tự động từ hệ thống. Vui lòng không hồi đáp.)</i>
</body></html>` // html body
    };
    cb(null, {user : req.decoded.username})
    transporter.sendMail(mail, function(err, info) { // send mail
        if(err) { console.log(err) }
    });
}

this.verifyEmail = function(req, res, cb) {
    jwt.verify(req.query.q || req.body.token, process.env.JWT_SECRET, function(err, decoded) { 
        if(err) { cb(err, null) } 
        else { 
            user.findByIdAndUpdate(decoded.username, {$set:{
                emailVerified : true
            }}, {new : true}).then(retUser => {
                if(retUser.emailVerified) {
                    var token = palmot.getToken({
                        username        : retUser.username,
                        userPermission  : retUser.userPermission,
                        profileUpdated  : retUser.profileUpdated,
                        emailVerified   : retUser.emailVerified 
                    },process.env.SESSION_TIMER);
                    res.cookie('x-access-token', {token : token }, {httpOnly : true });
                    res.redirect(`/kich-hoat-email?s=success`);
                } else { cb({message: 'This user does not exist'}, null) }
            }).catch(err => { cb(err, null) })
        };
    });
}

this.loginWithFacebook = function(req, res, cb) {
    passport.authenticate('facebook',{ scope:['email']},function(err,user,info) {})(req, res, cb);
}

this.loginWithFacebookCb = function(req, res, cb) {
    passport.authenticate('facebook', function(err, user, info) {
        if(err) { cb(err, null)  }
        else if(!user) { cb(info, null) }
        else {
            var token = palmot.getToken({
                username            : user.username, 
                userPermission      : user.userPermission,
                profileUpdated      : user.profileUpdated,
                emailVerified       : user.emailVerified
            }, process.env.SESSION_TIMER);
            res.cookie('x-access-token', {token : token }, {httpOnly : true });
            res.redirect(`/tai-khoan`);
        }
    })(req, res, cb);
}

this.updateProfile = function(req, res, cb) {
    user.findByIdAndUpdate(req.decoded.username, {$set : {
        firstName           : req.body.firstName,
        lastName            : req.body.lastName,
        middleName          : req.body.middleName,
        phone               : req.body.phone,
        profileUpdated      : true,
    }}, {new : true}).then(retUser => {
        var token = palmot.getToken({
            username            : retUser.username, 
            userPermission      : retUser.userPermission,
            profileUpdated      : retUser.profileUpdated,
            emailVerified       : retUser.emailVerified
        }, process.env.SESSION_TIMER);
        res.cookie('x-access-token', {token : token }, {httpOnly : true });
        cb(null, {updatedUser : retUser})
    }).catch(err => { cb(err, null) })
}

// end of user





// internal use apis

this.download = function(url) { // url end point of file or photo
    var path = '/file/' +  Date.now();
    request(url, {encoding: 'binary'}, function(err, res, body) {
        if(err) { console.log(err) } 
        else { fs.writeFileSync(process.env.FILES + path, body, 'binary', function(err) { 
            if(err) { console.log(err) }
        })}
    });
    return path;
}

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

this.getServerErr = function(req, res, cb) {
//    system.findById('error').then(retError => {
    system.find().then(retSys => {
        cb(null, {retSys : retSys});
    }).catch(err => cb(err, null));
}

// end of internal use apis





// socket.io

this.io = function(req, res, cb) {
    var io = req.io;
    io.sockets.emit('broadcast', req.query.mess);
    cb(null, {broadcasted : req.query.mess});
}

// end of socket.io





// render pages

this.renderPage = function(req, res, cb) {
    palmot.log('*** rendering: ' + routes.pageRoutes[req.path][0]);
    switch(routes.pageRoutes[req.path][0]) {
        case 'home'             : _this.renderHome(req, res, cb); break;
        case 'profile'          : _this.renderJustPage(req, res, cb); break;
        case 'register'         : _this.renderJustPage(req, res, cb); break;
        case 'login'            : _this.renderJustPage(req, res, cb); break;
        case 'forgotPassword'   : _this.renderJustPage(req, res, cb); break;
        case 'resetPassword'    : _this.renderJustPage(req, res, cb); break;
        case 'verifyEmail'      : _this.renderJustPage(req, res, cb); break;
        case 'updateProfile'    : _this.renderJustPage(req, res, cb); break;
        case 'changePassword'   : _this.renderJustPage(req, res, cb); break;
        default                 : _this.renderHome(req, res, cb); break;
    }
}

this.renderHome = function(req, res, cb) { res.render('home', req) }

this.renderJustPage = function(req, res, cb) { res.render(routes.pageRoutes[req.path][0], req) }

this.renderNotFound = function(req, res) { res.render('notFound', req) }

// end of render pages




