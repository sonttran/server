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
    ratePosUser             : ['master', 'admin', 'user'],
    rateNegUser             : ['master', 'admin', 'user'],
    sendFeedback            : ['master', 'admin', 'user'],

    // internal use apis
    download                            : [],
    delFiles                            : [],
    removeDocs                          : [],
    renderPage                          : [],
    renderPost                          : [],
    makeTags                            : [],
    reportError                         : [],
    getServerErr                        : ['master'],

    // elasticsearch
    createOne                           : ['master', 'admin', 'user', 'public'],
    getOne                              : ['master', 'admin', 'user', 'public'],
    delOne                              : ['master', 'admin', 'user', 'public'],
    updateOne                           : ['master', 'admin', 'user', 'public'],
    searchEs                            : ['master', 'admin', 'user', 'public'],
    mSearchEs                           : ['master', 'admin', 'user', 'public'],
    mNewestBlog                         : ['master', 'admin', 'user', 'public'],
    countEs                             : ['master', 'admin', 'user', 'public'],
    getEs                               : ['master', 'admin', 'user'],
    searchMg                            : ['master', 'admin', 'user'],
    useIO                               : ['io', 'getIO'], // api uses realtime engine
    io                                  : ['master'],
    readCsv                             : ['master'],

    // post 
    createPost                          : ['master', 'admin', 'user'],
    getPost                             : ['master', 'admin', 'user'],
    updatePost                          : ['master', 'admin', 'user'],
    delPost                             : ['master', 'admin', 'user'],
    stopPost                            : ['master', 'admin', 'user'],
    rePost                              : ['master', 'admin', 'user'],
    favoritePost                        : ['master', 'admin', 'user'],
    delFavPost                          : ['master', 'admin', 'user'],

    // blog 
    createBlog                          : ['master', 'admin'],
    upBlogPhoto                         : ['master', 'admin'],
    getBlog                             : ['master', 'admin'],
    updateBlog                          : ['master', 'admin'],
    delBlog                             : ['master', 'admin'],
    airBlog                             : ['master', 'admin'],
    downBlog                            : ['master', 'admin'],
    setCarousel1                        : ['master', 'admin'],
    setCarousel2                        : ['master', 'admin'],
    setCarousel3                        : ['master', 'admin'],
    setCarousel4                        : ['master', 'admin'],
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

this.ratePosUser = function(req, res, cb) {
    user.findById(req.body.id).then(retUser => {
        if(retUser.posRatings.indexOf(req.decoded.username) > -1) {
            cb({message: `Thành công! Bạn đã đánh giá tích cực ${retUser.firstName} trước đây.`}, null)
        } else {
            if(retUser.negRatings.indexOf(req.decoded.username) > -1) {
                retUser.negRatings.splice(retUser.negRatings.indexOf(req.decoded.username),1);
            };
            retUser.posRatings.push(req.decoded.username);
            retUser.save();
            cb(null, {});
        };
    }).catch(err => { cb(err, null) })
}

this.rateNegUser = function(req, res, cb) {
    user.findById(req.body.id).then(retUser => {
        if(retUser.negRatings.indexOf(req.decoded.username) > -1) {
            cb({message: `Thành công! Bạn đã đánh giá tiêu cực ${retUser.firstName} trước đây.`}, null)
        } else {
            if(retUser.posRatings.indexOf(req.decoded.username) > -1) {
                retUser.posRatings.splice(retUser.posRatings.indexOf(req.decoded.username),1);
            };
            retUser.negRatings.push(req.decoded.username);
            retUser.save();
            cb(null, {});
        };
    }).catch(err => { cb(err, null) })
}

this.sendFeedback = function(req, res, cb) {
    req.body.userId = req.decoded.username;
    system.findById('feedback').then(retFb => {
        if(retFb) {
            retFb.feedback.push(req.body);
            retFb.save();
            cb(null, {})
        } else {
            system.create({
                name:'feedback',_id:'feedback',feedback:[req.body]
            }).then(retFb =>{ cb(null, {}) }).catch(err => cb(err, null))
        }
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















// elasticsearch

this.createOne = function(req, res, cb) {
    one.create(req.body.one).then(retOne => {
        retOne.on('es-indexed', function(err, res) {
            if(err) {
                retOne.remove({_id : retOne._id}).then(deletedOne => {
                    cb({message : 'ES failed to create document'}, null)
                }).catch(err => cb(err, null))
            } else { cb(null, {mongoRes : retOne, esRes : res}); }
        });
    }).catch(err => { cb(err, null) })
}

this.getOne = function(req, res, cb) {
    one.findById(req.body.id).then(retOne => {
        cb(null, {one : retOne})
    }).catch(err => cb(err, null))
}

this.updateOne = function(req, res, cb) {
    one.findById(req.body.one._id).then(retOne => { // only way that works with both es and mongo
        //        retOne.quantity = req.body.one.quantity; // manually update each field
        retOne.price = req.body.one.price; // manually update each field
        retOne.save();
        retOne.on('es-indexed', function(err, res) {
            if(err) { cb({message : 'Mongo update success, ES Updated failed'}, null) } 
            else { cb(null, {mongoRes : retOne, esRes : res}); }
        });
    }).catch(err => cb(err, null))
}

this.delOne = function(req, res, cb) {
    one.findById(req.body.id).then(retOne => {
        retOne.remove(function(err) {
            if(err){ cb(err, null) };
            retOne.on('es-removed', function(err, res) {
                if(err) { cb({message : 'Mongo update success, ES Updated failed'}, null) }
                else { cb(null, {mongoRes : retOne, esRes : res}); }
            });
        });
    }).catch(err => { cb(err, null) });
}

this.searchEs = function(req, res, cb) {

    if(Object.keys(req.query).length) { var q = req.query }
    else if(Object.keys(req.body.query).length) { var q = req.body.query }
    else { var q = {} };

    var keyword     = []; // default: match all
    var filter      = {bool:{should:[]}}; // default: no filter
    var itemPerPage = 10; // default: 10 items returns
    var fromItem    = 0;  // default: page 1
    var priceRange  = {}; // default: any price
    var order       = {}; // default: most relevant first
    var searchFrom  = Date.now() - parseFloat(process.env.SEARCH_LIFE_SPAN) * 86400000;


    //    palmot.log('search life span: ' + process.env.SEARCH_LIFE_SPAN + ' days.');
    //    var now = moment(searchFrom);
    //    palmot.log('oldest result is from: ' + now.format('YYYY/MM/DD HH:mm:ss Z'));


    if(q.k)  { keyword.push({query_string : {query : q.k }})};
    if(q.pl) { priceRange.gte = parseFloat(req.body.query.pl) };
    if(q.ph) { priceRange.lte = parseFloat(req.body.query.ph) };
    if(q.n)  { itemPerPage = parseFloat(q.n) };
    if(q.p)  { fromItem = (parseFloat(q.p) - 1) * itemPerPage };
    if(q.o)  { switch(q.o) {
        case '-_source.createdAt'   : order = { createdAt : { order: "desc" }}; break; // newest
        case '_source.createdAt'    : order = { createdAt : { order: "asc" }}; break; // oldest
            //        case '-_source.createdAt'   : order = { air : { order: "desc" }}; break; // newest
            //        case '_source.createdAt'    : order = { air : { order: "asc" }}; break; // oldest
        case '_source.price'        : order = { price : { order: "asc" }}; break; // thap -> cao
        case '-_source.price'       : order = { price : { order: "desc" }}; break; // cao -> thap
        default : break;
    }};


//    for(var i = 0; i < q.l.length; i++) { // location
        
        
        if(q.f && q.f.length && q.f[0]) { // if there is topics
            for(var i = 0; i < q.l.length; i++) {
            
//            for(var k = 0; k < q.f.length; k++) {
//                var mustSet = [];
//                //                mustSet.push({range:{createdAt:{gte:searchFrom}}});
//                mustSet.push({range:{air:{gte:searchFrom}}});
//                if(q.s) { mustSet.push({ term : { sellType : q.s }}) };
//                if(Object.keys(priceRange).length) {mustSet.push({range:{price:priceRange}})};
//
//                var count = 0;
//                for(var j = 0; j <= i; j++) { // inside each location step
//                    count +=1;
//                    var eachMust = {term:{locations:q.l[j]}};
//                    mustSet.push(eachMust);
//                };
//                if(count != q.l.length){mustSet.push({term:{locCount:count}})};
//
//                var count2 = 0;
//                for(var l = 0; l <= k; l++) {
//                    count2 +=1;
//                    var eachMust2 = {term:{topics:q.f[l]}};
//                    mustSet.push(eachMust2);
//                };
//                if(count2 != q.f.length){mustSet.push({term:{topCount:count2}})};
//
//                mustSet = {bool:{must:mustSet}};
//                filter.bool.should.push(mustSet);
//            };

            
            
            
            var mustSet = [];
            //            mustSet.push({range:{createdAt:{gte:searchFrom}}});
            mustSet.push({range:{air:{gte:searchFrom}}});
            if(q.s) { mustSet.push({ term : { sellType : q.s }}) };
            if(Object.keys(priceRange).length) {mustSet.push({range:{price:priceRange}})};
            var count = 0;
            for(var j = 0; j <= i; j++) { // inside each location step
                count +=1;
                var eachMust = {term:{locations:q.l[j]}};
                mustSet.push(eachMust);
            };
            if(count != q.l.length){mustSet.push({term:{locCount:count}})};
            
            for(var m = 0; m <q.f.length; m++) { mustSet.push({term:{topics:q.f[m]}}) };
            
            mustSet = {bool:{must:mustSet}};
            filter.bool.should.push(mustSet);
            
            }
            
            
        } else { // if there is no topics
            
            for(var i = 0; i < q.l.length; i++) {
            
            var mustSet = [];
            //            mustSet.push({range:{createdAt:{gte:searchFrom}}});
            mustSet.push({range:{air:{gte:searchFrom}}});
            if(q.s) { mustSet.push({ term : { sellType : q.s }}) };
            if(Object.keys(priceRange).length) {mustSet.push({range:{price:priceRange}})};
            var count = 0;
            for(var j = 0; j <= i; j++) { // inside each location step
                count +=1;
                var eachMust = {term:{locations:q.l[j]}};
                mustSet.push(eachMust);
            };
            if(count != q.l.length){mustSet.push({term:{locCount:count}})};
            mustSet = {bool:{must:mustSet}};
            filter.bool.should.push(mustSet);

                
                
            }
        }
    
    
    
    
//    };

//        palmot.log(filter);

    post.search({ bool: {
        must    : keyword,
        filter  : filter,
    }}, {
        size    : itemPerPage,
        from    : fromItem,
        sort    : order,
        _source: ['title','url','priceToRender','photos','sellTypeViet','createdAtToRender','viewed','locDisSearch','board'], // control returned fields
    }, function(err, searchRes) {
        if(err) { cb(err, null) } else { cb(null, {
            found       : searchRes.hits.total ? `Tìm thấy ${searchRes.hits.total} kết quả trong ${searchRes.took / 1000} giây. Hiển thị kết quả ${fromItem + 1} - ${Math.min(fromItem + itemPerPage, searchRes.hits.total)}.` : `Tìm thấy ${searchRes.hits.total} kết quả trong ${searchRes.took / 1000} giây.`, 
            searchTime  : `${searchRes.took} mili seconds`, 
            page        : Object.keys(q).length ? q.p : 1,
            returning   : `Hiển thị kết quả từ ${fromItem + 1} đến ${fromItem + itemPerPage}`,
            resList     : searchRes.hits.hits,
            took        : searchRes.took / 1000,
            totalFound  : searchRes.hits.total,
        })}
    });
}

this.searchEsSAVED = function(req, res, cb) {

    //    var example query = {
    //        "query" : {
    //            "k": "loading port",              keyword
    //            "f": ["lng1", "loading_port"],    tags filters
    //            "l": ["asia", "vietnam"],         location filters
    //            "p": 0,                           page #
    //            "n": 12                           number of items per page
    //        }
    //    }

    var keyword     = []; // default: match all
    var filter      = []; // default: no filter
    var itemPerPage = 10; // default: 10 items returns
    var fromItem    = 0;  // default: return from the first item found

    if(!(JSON.stringify(req.query) === '{}')) { // params first
        if(req.query.k) { keyword.push({query_string : {query : req.query.k }}) };

        if(req.query.f) {
            req.query.f.split(',').forEach(f => { filter.push({ term : { tags : f}}) } )
        };

        if(req.query.l) { 
            req.query.l.split(',').forEach(l => { filter.push({ term : { locations : l}}) })
        };

        if(req.query.s) { filter.push({ term : { sellType : req.query.s }}) };

        if(req.query.n) { itemPerPage = parseFloat(req.query.n) };

        if(req.query.p) { fromItem = (parseFloat(req.query.p) - 1) * itemPerPage };


        console.log('in params')

    } else if(!(JSON.stringify(req.body) === '{}') && !(JSON.stringify(req.body.query) === '{}')) 
    { 
        if(req.body.query.k) { keyword.push({query_string : {query : req.body.query.k }})};

        if(req.body.query.f && req.body.query.f.length && req.body.query.f[0]) { 
            req.body.query.f.forEach(f => { filter.push({ term : { tags : f}}) } );
        };

        if(req.body.query.l && req.body.query.l.length && req.body.query.l[0]) { 
            req.body.query.l.forEach(l => { filter.push({ term : { locations : l}}) } );
        };

        if(req.body.query.s) { filter.push({ term : { sellType : req.body.query.s }}) };

        if(req.body.query.n) { itemPerPage = parseFloat(req.body.query.n) };

        if(req.body.query.p) { fromItem = (parseFloat(req.body.query.p) - 1) * itemPerPage };

        console.log('in body')

    }

    console.log('* keywords');
    console.log(keyword);
    console.log('* filter');
    console.log(filter);
    console.log('* page');
    console.log(req.query.p || req.body.query.p || 1);
    console.log('* items per page');
    console.log(itemPerPage);


    one.search({
        bool: {
            must : [
                //                { match          : { title   : "cillum excepteur" }},
                //                { match          : { title   : { query: "cillum excepteur", type: 'phrase' }}}, 
                //                { match          : { body    :  "commodo Lorem aliquip" }}, 
                //                { match          : { body       :  "commodo Lorem aliquip" }}, 
                //                { terms          : { _uid       : ['594772557410b40aa62335aa']} }
                //                { query_string  : { query   : req.body.query.k }}, 
                //                { match_all      : { }},
            ],
            must : keyword,
            should : [
                //                { match         : { body: { query: 'commodo', type: 'phrase' } } }
            ],
            must_not : [
                //                { range : { year: { lte: 2000, gte: 1990 } } }
            ],
            filter : [
                //                { "term" : { "tags" : "loading_port" } },
                //                { "term" : { "tags" : "" } },
                //                { range         : { quantity    : { gte: 20 }}}, 
                //                { range         : { price       : { gte: 4 }}},
            ],
            filter : filter,
        }
    }, {
        size    : itemPerPage,
        from    : fromItem,
        //                sort    : { createdAt: { order: "desc" }}, // latest entry first
        //        _source: ['body', 'tags' ], // control returned fields
        //        _source: ['body'], // control returned fields
    }, function(err, searchRes) {
        if(err) { cb(err, null) } else { 
            cb(null, {
                found       : searchRes.hits.total, 
                page        : req.query.p || req.body.query.p || 1,
                returning   : `results from ${fromItem + 1} to ${fromItem + itemPerPage}`,
                searchTime  : `${searchRes.took} mili seconds`, 
                resList     : searchRes.hits.hits
            })
        }
    });
}

this.getEs = function(req, res, cb) { 
    one.search({
        bool: { filter : [{ "term" : { "_id" : req.body.id }}]}
    }, function(err, searchRes) {
        if(err) { cb(err, null) } else {
            cb(null, {
                searchTime  : `${searchRes.took} mili seconds`, 
                one         : searchRes.hits.hits[0]
            }) 
        }
    });
}

this.searchMg = function(req, res, cb) {

    palmot.log(req.body.query.k.split(' ').join('.*'))

    var search = new RegExp(req.body.query.k.split(' ').join('.*'));

    //    one.find({
    //        title        : { $regex  : search }, 
    ////        title        : { $regex  : /cillum.*incididunt/ }, 
    ////        price       : { $gte    : 5 },
    //    },{
    //        title: 1 // returned fields, add more for more
    //    }).skip().limit(10).then(retOne => {
    //        cb(null, {found : retOne.length, list : retOne})
    //    }).catch(err => cb(err, null))



    one.find({ $or: [
        { title : { $regex : search } },
        { body  : { $regex : search } }
    ]}, {
        title   : 1, // returned fields, add more for more
        body    : 1, // returned fields, add more for more
    }).skip().limit(10).then(retOne => {
        cb(null, {found : retOne.length, list : retOne})
    }).catch(err => cb(err, null))



    //    one.find({
    //        title        : { $regex  : /excepteur/ }, 
    ////        price       : { $gte    : 5 },
    //    }).then(retOne => {
    //        cb(null, {found : retOne.length, list : retOne})
    //    }).catch(err => cb(err, null))
}

this.createCom = function(req, res, cb) {
    comment.create(req.body.comment).then(retCom => {
        cb(null, {createdCom : retCom})
    }).catch(err => cb(err, null))
}

this.populated = function(req, res, cb) {
    // "postedBy" is the field to populate, this feild holds id string of the object to be populated
    //        one.findById({_id : '5937a40bc1e6b744aa6822d9'}).populate('postedBy', 'comment').exec(function(err, user) {
    //            if(err) { return cb(err, null); }
    //            else { return cb(null, {result: user}); }
    //        });


    //    one.find({_id : '5937a40bc1e6b744aa6822d9'}).populate('comments.postedBy').exec((err, retCom) => {
    //        if(err) { cb(err, null) }
    //        else { cb(null, {result: retCom}) }
    //    })


    //    comment.find({_id : '5938c2e44afde49c898d479e'}).populate('postedBy').exec((err, retCom) => {
    //        if(err) { cb(err, null) }
    //        else { cb(null, {result: retCom}) }
    //    });


    user.findById(req.decoded.username).populate('contact2').exec((err, retUser) => {
        //    user.findOne({_id : req.decoded.username}).populate('contact2').exec((err, retUser) => {
        if(err) { cb(err, null) } else { cb(null, { result: retUser}) }
    });


}

this.io = function(req, res, cb) {
    var io = req.io;
    io.sockets.emit('broadcast', req.query.mess);
    cb(null, {broadcasted : req.query.mess});
}


this.readCsv = function(req, res, cb) {
    upload(req, res, function(err) {
        if(err) { cb(err, null) } else if(req.files && req.files.length) {
            var tags = { 
                s : {
                    am_thuc : {
                        i : 'fa fa-cutlery'
                    },
//                    an_uong : {
//                        i : 'fa fa-cutlery'
//                    },
//                    nau_nuong_pha_che : {
//                        i : 'fa fa-fire'
//                    },
                    thoi_trang : {
                        i : 'fa fa-venus-mars',
                    },
                    bat_dong_san : {
                        i : 'fa fa-home',
                    },
                    xe_co_di_lai_van_chuyen : {
                        i : 'fa fa-car',
                    },
                    viec_lam : {
                        i : 'fa fa-handshake-o',
                    },
                    hoc_tap : {
                        i : 'fa fa-graduation-cap',
                    },
                    giai_tri : {
                        i : 'fa fa-smile-o',
                    },
                    khoe_dep : {
                        i : 'fa fa-heart',
                    },
                    nong_nghiep : {
                        i : 'fa fa-leaf',
                    },
                    cong_nghiep : {
                        i : 'fa fa-industry',
                    },
                    dich_vu : {
                        i : 'fa fa-money',
                    },
                    su_kien : {
                        i : 'fa fa-calendar',
                    },
                    do_dien_tu : {
                        i : 'fa fa-laptop',
                    },
                    nha_va_van_phong : {
                        i : 'fa fa-bath',
                    },
//                    the_thao : {
//                        i : 'fa fa-futbol-o',
//                    },
//                    suc_khoe : {
//                        i : 'fa fa-medkit',
//                    },
//                    nghe_thuat : {
//                        i : 'fa fa-music',
//                    },
                    mien_phi_tang_voi_ca_tam_long : {
                        i : 'fa fa-heartbeat',
                    },
                    that_lac_va_tim_thay : {
                        i : 'fa fa-thumbs-o-up',
                    },
                    tim_ban_bon_phuong : {
                        i : 'fa fa-user-plus',
                    },
                    cac_chu_de_khac : {
                        i : 'fa fa-compass',
                    },
                }, l : {} };
            var writeResult = {};
            fs.readFile(req.files[0].path, 'utf8', (err, data) => {
                if(err) { cb(err, null) } else {
                    var lines = data.split('\r\n');
                    _this.makeTags(tags, lines);
                    var tag2 = {};
                    var tagss2 = [];
                    var j = 0;
                    for(var prop in tags.s) {
                        var temp = {[prop]:tags.s[prop]};
                        if(j % 2 == 0) { tagss2.push( temp ) } 
                        else { tagss2[Math.floor(j/2)][prop]=tags.s[prop] }
                        j +=1;
                    };
                    tag2.s = tagss2;
                    var tagsl2 = [];
                    var j = 0;
                    for(var prop in tags.l) {
                        var temp = {[prop]:tags.l[prop]};
                        if(j % 2 == 0) { tagsl2.push( temp ) } 
                        else { tagsl2[Math.floor(j/2)][prop]=tags.l[prop] }
                        j +=1;
                    };
                    tag2.l = tagsl2;
                    var toFileBE = 'var tags = ' + JSON.stringify(tags) + '; module.exports = tags;';
                    var toFileBEs2='var tags = '+JSON.stringify(tag2) + '; module.exports = tags;';
                    var toFileFE = 'var tags = ' + JSON.stringify(tags);
                    fs.writeFile('./core/tags.js', toFileBE, 'utf8', (err) => {
                        if(err) { cb(err, null) } else {
                            writeResult.toBE = 'success';
                            fs.writeFile('./core/tagss2.js', toFileBEs2, 'utf8', (err) => {
                                if(err) { cb(err, null) } else { 
                                    writeResult.toBEs2 = 'success'; 
                                    fs.writeFile('./public/js/tags.js', toFileFE, 'utf8', (err) => {
                                        if(err) { cb(err, null) } else {
                                            writeResult.toFE = 'success';
                                            cb(null, { 
                                                writeTagsFileResult : writeResult, 
                                                rawReadData         : data, 
                                                newTags             : tags 
                                            }) 
                                        }
                                    });
                                }
                            }) 
                        }
                    });
                    try { fs.unlinkSync(req.files[0].path) } catch(err) { console.log(err) } 
                };
            });
        } else { cb({message : 'no file sent'}, null) }
    });
}

this.countEs = function(req, res, cb) {

    var searchFrom  = Date.now() - parseFloat(process.env.SEARCH_LIFE_SPAN) * 86400000;


//    palmot.log(req.query.q);
    
    var filters = {};
    var dateQ = { range : { air : { gte : searchFrom }}};
    var query = { range : { air : { gte : searchFrom }}};
    switch(req.body.whatBoard) {
        case 'fullBoard'    : 
            for(var prop in tags.s) { filters[prop] = { match : { topics : prop }} }; break;
        case 'fullBoardOfLoc'    : 
            query = { bool : { should : [ ]}};
            var locs;
            if(req.query.q) {
                locs = req.query.q.split(',');
                for(var i = 0; i < locs.length; i++) {
                    var mustSet = [];
                    mustSet.push({range:{air:{gte:searchFrom}}});
                    var count = 0;
                    for(var j = 0; j <= i; j++) {
                        count +=1;
                        var eachMust = {term:{locations:locs[j]}};
                        mustSet.push(eachMust);
                    };
                    if(count != locs.length){mustSet.push({term:{locCount:count}})};
                    mustSet = {bool:{must:mustSet}};
                    query.bool.should.push(mustSet);
                }
            };
            for(var prop in tags.s) { filters[prop] = { match : { topics : prop }} }; break;
        case 'fullLocation' : 
            filters.toan_quoc = { match : { locDisSearch : 'Toàn quốc' } };
            for(var prop in tags.l) { filters[prop] = { match : { locations : prop }} }; break;
        default             : break;
    };
    

//    palmot.log(filters);
//    palmot.log(query);
    
    
    esClient.search({
        index: 'posts',
        type: 'post',
        body: {
            "size"  : 12, // return no detail about found posts
            "query" : query, 
            "aggs"  : { "messages" : { "filters" : { "filters" : filters }} },
            _source: ['title','url','priceToRender','photos','sellTypeViet','createdAtToRender','viewed','locDisSearch'], // control returned fields
        }
    }).then(resp => {cb(null, resp)}).catch(err => cb(err, null));







}

this.mSearchEs = function(req, res, cb) {
    esClient.msearch({
        body: [
//            {"index" : "posts"}, // index first 
//            {"query" : {"match_all" : {}}, "from" : 0, "size" : 1}, // then request
//            {"index" : "blogs"},
//            {"query" : {"match_all" : {}}, "from" : 0, "size" : 1},
            // match all query, on all indices and types
//            {},
//            { query: { match_all: {} } },

            // query_string query, on index/mytype
//            { index: 'blogs', type: 'blog' }, // index first
//            {filter : { match : { type : 'introduction' }}},
//            { query: { query_string: { query: 'asdf' } } } // then request
//            {"query": {'filtered': {'filter': {'term': {'applicationType': 'myapptype'}}, 'query': {'match': {'search_key': 'my_key_value'}}}, 'aggs': {'client': {'terms': {'field': 'client'}}}, 'size': 0}},

//            {
//                "from" : 0, "size" : 1,
//                "query": { 
//                    "bool": { 
//                        "must": [
////                            { "match": { "title":   "Search"        }}, 
////                            { "match": { "type": "mudibalaU" }}  ,
////                            { "match": { "type": "introduction" }}  
//                        ],
//                        "filter": [ 
////                            { "term":  { "status": "published" }}, 
////                            { "range": { "publish_date": { "gte": "2015-01-01" }}},
////                            { term : { type : 'introduction' }}
//                        ]
//                    }
//                }
//            },

//            { index: 'blogs', type: 'blog' }, // index first
//            { size: 1, query : { "bool": { "must": [ { "match": { "type": "introduction" }} ] } } },
//            
//
//            { index: 'blogs', type: 'blog' }, // index first
//            { size: 1, query : { "bool": { "must": [ { "match": { "type": "mudibalaU" }} ] } } },
            

            { index: 'blogs', type: 'blog' }, // index first
            {
                size: process.env.BLOGS_IN_BLOG, 
                query : { match: { air: true }},
                sort : [ { createdAt : { order : 'desc' }}], 
                _source: ['title','url',],
            },
            

            { index: 'blogs', type: 'blog' }, // index first
            {
                size: process.env.BLOGS_IN_BLOG, 
                query : {bool:{must:[{match:{type:'introduction'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
            

            { index: 'blogs', type: 'blog' }, // index first
            {
                size: process.env.BLOGS_IN_BLOG, 
                query : {bool:{must:[{match:{type:'announcement'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
            

            { index: 'blogs', type: 'blog' }, // index first
            {
                size: process.env.BLOGS_IN_BLOG, 
                query : {bool:{must:[{match:{type:'useEffective'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
            

            { index: 'blogs', type: 'blog' }, // index first
            {
                size: process.env.BLOGS_IN_BLOG, 
                query : {bool:{must:[{match:{type:'mudibalaU'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
            

            { index: 'blogs', type: 'blog' }, // index first
            {
                size: process.env.BLOGS_IN_BLOG, 
                query : {bool:{must:[{match:{type:'qaFeedback'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
            
            
            
        ]
    }).then(result => {
        cb(null, result)
    }).catch(err => {
        cb(err, null)
    });
}

this.mNewestBlog = function(req, res, cb) {
    if(!req.query.trang) { req.query.trang = 1 };
    esClient.msearch({
        body: [
            { index: 'blogs', type: 'blog' }, // newest
            {
                size: process.env.BLOGS_PER_CATE, 
                from: process.env.BLOGS_PER_CATE*req.query.trang - process.env.BLOGS_PER_CATE,
                query : { match: { air: true }},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url','photos','updatedAtToRender','viewed'],
            },
            { index: 'blogs', type: 'blog' }, // introduction
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : {bool:{must:[{match:{type:'introduction'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
            { index: 'blogs', type: 'blog' }, // announcement
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : {bool:{must:[{match:{type:'announcement'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
        ]
    }).then(result => { cb(null, result) }).catch(err => { cb(err, null) });
}

this.mIntroMudi = function(req, res, cb) {
    if(!req.query.trang) { req.query.trang = 1 };
    esClient.msearch({
        body: [
            { index: 'blogs', type: 'blog' }, // introduction
            {
                size: process.env.BLOGS_PER_CATE, 
                from: process.env.BLOGS_PER_CATE*req.query.trang - process.env.BLOGS_PER_CATE,
                query : {bool:{must:[{match:{type:'introduction'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url','photos','updatedAtToRender','viewed'],
            },
            { index: 'blogs', type: 'blog' }, // newest
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : { match: { air: true }},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
            { index: 'blogs', type: 'blog' }, // announcement
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : {bool:{must:[{match:{type:'announcement'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
        ]
    }).then(result => { cb(null, result) }).catch(err => { cb(err, null) });
}

this.mAnnouncement = function(req, res, cb) {
    if(!req.query.trang) { req.query.trang = 1 };
    esClient.msearch({
        body: [
            { index: 'blogs', type: 'blog' }, // announcement
            {
                size: process.env.BLOGS_PER_CATE, 
                from: process.env.BLOGS_PER_CATE*req.query.trang - process.env.BLOGS_PER_CATE,
                query : {bool:{must:[{match:{type:'announcement'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url','photos','updatedAtToRender','viewed'],
            },
            { index: 'blogs', type: 'blog' }, // newest
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : { match: { air: true }},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
            { index: 'blogs', type: 'blog' }, // useEffective
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : {bool:{must:[{match:{type:'useEffective'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
        ]
    }).then(result => { cb(null, result) }).catch(err => { cb(err, null) });
}

this.mUseEffective = function(req, res, cb) {
    if(!req.query.trang) { req.query.trang = 1 };
    esClient.msearch({
        body: [
            { index: 'blogs', type: 'blog' }, // useEffective
            {
                size: process.env.BLOGS_PER_CATE, 
                from: process.env.BLOGS_PER_CATE*req.query.trang - process.env.BLOGS_PER_CATE,
                query : {bool:{must:[{match:{type:'useEffective'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url','photos','updatedAtToRender','viewed'],
            },
            { index: 'blogs', type: 'blog' }, // newest
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : { match: { air: true }},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
            { index: 'blogs', type: 'blog' }, // announcement
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : {bool:{must:[{match:{type:'mudibalaU'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
        ]
    }).then(result => { cb(null, result) }).catch(err => { cb(err, null) });
}

this.mMudibalaU = function(req, res, cb) {
    if(!req.query.trang) { req.query.trang = 1 };
    esClient.msearch({
        body: [
            { index: 'blogs', type: 'blog' }, // mudibalaU
            {
                size: process.env.BLOGS_PER_CATE, 
                from: process.env.BLOGS_PER_CATE*req.query.trang - process.env.BLOGS_PER_CATE,
                query : {bool:{must:[{match:{type:'mudibalaU'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url','photos','updatedAtToRender','viewed'],
            },
            { index: 'blogs', type: 'blog' }, // newest
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : { match: { air: true }},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
            { index: 'blogs', type: 'blog' }, // qaFeedback
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : {bool:{must:[{match:{type:'qaFeedback'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
        ]
    }).then(result => { cb(null, result) }).catch(err => { cb(err, null) });
}

this.mQaFeedback = function(req, res, cb) {
    if(!req.query.trang) { req.query.trang = 1 };
    esClient.msearch({
        body: [
            { index: 'blogs', type: 'blog' }, // qaFeedback
            {
                size: process.env.BLOGS_PER_CATE, 
                from: process.env.BLOGS_PER_CATE*req.query.trang - process.env.BLOGS_PER_CATE,
                query : {bool:{must:[{match:{type:'qaFeedback'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url','photos','updatedAtToRender','viewed'],
            },
            { index: 'blogs', type: 'blog' }, // newest
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : { match: { air: true }},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
            { index: 'blogs', type: 'blog' }, // introduction
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : {bool:{must:[{match:{type:'introduction'}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
        ]
    }).then(result => { cb(null, result) }).catch(err => { cb(err, null) });
}

this.mBlogDetail = function(req, res, cb) {
    esClient.msearch({
        body: [
            { index: 'blogs', type: 'blog' }, // qaFeedback
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : {bool:{must:[{match:{type:req.blogType}},{match:{air:true}}]}},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url','photos','updatedAtToRender','viewed'],
            },
            { index: 'blogs', type: 'blog' }, // newest
            {
                size: process.env.BLOGS_PER_BLOG, 
                query : { match: { air: true }},
                sort : [ { createdAt : { order : 'desc' }}],
                _source: ['title','url'],
            },
        ]
    }).then(result => { cb(null, result) }).catch(err => { cb(err, null) });
}




// end of elasticsearch




this.makeTags = function(tags, lines) {
    lines.forEach(line => {
        var ls = line.split(',').join('*').replace(/;/g, ',').split('*');
        ls = ls.filter(Boolean); //remove empty srtings
        var lineTags = removeDiacritics(line.toLowerCase()).replace(/[^\w\s,]/gi, '').replace(/\s/g, '_');
        var lts = lineTags.split(',');
        lts = lts.filter(Boolean); //remove empty srtings

        if(ls[0] == 'topic') { // topic tags
            switch(ls.length) {
                case 2  : // 1 tag
                    if(!tags.s[lts[1]]) { tags.s[lts[1]] = {}; tags.s[lts[1]].n = ls[1]; } 
                    else { tags.s[lts[1]].n = ls[1] };
                    break;
                case 3     : // 2 tags
                    if(!tags.s[lts[1]]) { tags.s[lts[1]] = {}; tags.s[lts[1]].n = ls[1]; } 
                    else { tags.s[lts[1]].n = ls[1] };

                    if(!(tags.s[lts[1]].s)) { tags.s[lts[1]].s = {} };
                    if(!(tags.s[lts[1]].s[lts[2]])) {
                        tags.s[lts[1]].s[lts[2]] = {};
                        tags.s[lts[1]].s[lts[2]].n = ls[2];
                    } else { tags.s[lts[1]].s[lts[2]].n = ls[2] };
                    break;
                case 4     : // 3 tags
                    if(!tags.s[lts[1]]) { tags.s[lts[1]] = {}; tags.s[lts[1]].n = ls[1]; } 
                    else { tags.s[lts[1]].n = ls[1] };

                    if(!(tags.s[lts[1]].s)) { tags.s[lts[1]].s = {} };
                    if(!(tags.s[lts[1]].s[lts[2]])) {
                        tags.s[lts[1]].s[lts[2]] = {};
                        tags.s[lts[1]].s[lts[2]].n = ls[2];
                    } else { tags.s[lts[1]].s[lts[2]].n = ls[2] };


                    if(!(tags.s[lts[1]].s[lts[2]].s)) { tags.s[lts[1]].s[lts[2]].s = {} };
                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]])) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]] = {};
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].n = ls[3];
                    } else { tags.s[lts[1]].s[lts[2]].s[lts[3]].n = ls[3] };
                    break;
                case 5     : // 4 tags
                    if(!tags.s[lts[1]]) { tags.s[lts[1]] = {}; tags.s[lts[1]].n = ls[1]; } 
                    else { tags.s[lts[1]].n = ls[1] };

                    if(!(tags.s[lts[1]].s)) { tags.s[lts[1]].s = {} };
                    if(!(tags.s[lts[1]].s[lts[2]])) {
                        tags.s[lts[1]].s[lts[2]] = {};
                        tags.s[lts[1]].s[lts[2]].n = ls[2];
                    } else { tags.s[lts[1]].s[lts[2]].n = ls[2] };


                    if(!(tags.s[lts[1]].s[lts[2]].s)) { tags.s[lts[1]].s[lts[2]].s = {} };
                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]])) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]] = {};
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].n = ls[3];
                    } else { tags.s[lts[1]].s[lts[2]].s[lts[3]].n = ls[3] };


                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]].s)) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s = {};
                    };
                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]])) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]] = {};
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].n = ls[4];
                    } else { tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].n = ls[4] };

                    break;
                case 6     : // 5 tags
                    if(!tags.s[lts[1]]) { tags.s[lts[1]] = {}; tags.s[lts[1]].n = ls[1]; } 
                    else { tags.s[lts[1]].n = ls[1] };

                    if(!(tags.s[lts[1]].s)) { tags.s[lts[1]].s = {} };
                    if(!(tags.s[lts[1]].s[lts[2]])) {
                        tags.s[lts[1]].s[lts[2]] = {};
                        tags.s[lts[1]].s[lts[2]].n = ls[2];
                    } else { tags.s[lts[1]].s[lts[2]].n = ls[2] };


                    if(!(tags.s[lts[1]].s[lts[2]].s)) { tags.s[lts[1]].s[lts[2]].s = {} };
                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]])) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]] = {};
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].n = ls[3];
                    } else { tags.s[lts[1]].s[lts[2]].s[lts[3]].n = ls[3] };


                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]].s)) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s = {};
                    };
                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]])) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]] = {};
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].n = ls[4];
                    } else { tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].n = ls[4] };


                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s)) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s = {};
                    };
                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]])) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]] = {};
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]].n = ls[5];
                    } else { tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]].n = ls[5] };

                    break;
                case 7     : // 6 tags
                    if(!tags.s[lts[1]]) { tags.s[lts[1]] = {}; tags.s[lts[1]].n = ls[1]; } 
                    else { tags.s[lts[1]].n = ls[1] };

                    if(!(tags.s[lts[1]].s)) { tags.s[lts[1]].s = {} };
                    if(!(tags.s[lts[1]].s[lts[2]])) {
                        tags.s[lts[1]].s[lts[2]] = {};
                        tags.s[lts[1]].s[lts[2]].n = ls[2];
                    } else { tags.s[lts[1]].s[lts[2]].n = ls[2] };


                    if(!(tags.s[lts[1]].s[lts[2]].s)) { tags.s[lts[1]].s[lts[2]].s = {} };
                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]])) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]] = {};
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].n = ls[3];
                    } else { tags.s[lts[1]].s[lts[2]].s[lts[3]].n = ls[3] };


                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]].s)) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s = {};
                    };
                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]])) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]] = {};
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].n = ls[4];
                    } else { tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].n = ls[4] };


                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s)) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s = {};
                    };
                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]])) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]] = {};
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]].n = ls[5];
                    } else { tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]].n = ls[5] };


                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]].s)) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]].s = {};
                    };
                    if(!(tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]].s[lts[6]])) {
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]].s[lts[6]] = {};
                        tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]].s[lts[6]].n = ls[6];
                    } else { tags.s[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].s[lts[5]].s[lts[6]].n = ls[6] };

                    break;
                default             : 
                    tags.topicERR = 'ERROR, topic tag only support max 6 levels, 7 and up is ignored';
            }
        } else if(ls[0] == 'location') { // location
            switch(ls.length) {
                case 2  : // 1 level location
                    if(!tags.l[lts[1]]) { tags.l[lts[1]] = {}; tags.l[lts[1]].n = ls[1]; }
                    else { tags.l[lts[1]].n = ls[1] };
                    break;
                case 3     : // 2 level location
                    if(!tags.l[lts[1]]) { tags.l[lts[1]] = {}; tags.l[lts[1]].n = ls[1]; }
                    else { tags.l[lts[1]].n = ls[1] };

                    if(!(tags.l[lts[1]].s)) { tags.l[lts[1]].s = {} };
                    if(!(tags.l[lts[1]].s[lts[2]])) { 
                        tags.l[lts[1]].s[lts[2]] = {};
                        tags.l[lts[1]].s[lts[2]].n = ls[2];
                    } else { tags.l[lts[1]].s[lts[2]].n = ls[2] };
                    break;
                case 4     : // 3 level location
                    if(!tags.l[lts[1]]) { tags.l[lts[1]] = {}; tags.l[lts[1]].n = ls[1]; }
                    else { tags.l[lts[1]].n = ls[1] };

                    if(!(tags.l[lts[1]].s)) { tags.l[lts[1]].s = {} };
                    if(!(tags.l[lts[1]].s[lts[2]])) { 
                        tags.l[lts[1]].s[lts[2]] = {};
                        tags.l[lts[1]].s[lts[2]].n = ls[2];
                    } else { tags.l[lts[1]].s[lts[2]].n = ls[2] };


                    if(!(tags.l[lts[1]].s[lts[2]].s)) { tags.l[lts[1]].s[lts[2]].s = {} };
                    if(!(tags.l[lts[1]].s[lts[2]].s[lts[3]])) {
                        tags.l[lts[1]].s[lts[2]].s[lts[3]] = {};
                        tags.l[lts[1]].s[lts[2]].s[lts[3]].n = ls[3];
                    } else { tags.l[lts[1]].s[lts[2]].s[lts[3]].n = ls[3] };
                    break;
                case 5     : // 4 level location
                    if(!tags.l[lts[1]]) { tags.l[lts[1]] = {}; tags.l[lts[1]].n = ls[1]; }
                    else { tags.l[lts[1]].n = ls[1] };

                    if(!(tags.l[lts[1]].s)) { tags.l[lts[1]].s = {} };
                    if(!(tags.l[lts[1]].s[lts[2]])) { 
                        tags.l[lts[1]].s[lts[2]] = {};
                        tags.l[lts[1]].s[lts[2]].n = ls[2];
                    } else { tags.l[lts[1]].s[lts[2]].n = ls[2] };


                    if(!(tags.l[lts[1]].s[lts[2]].s)) { tags.l[lts[1]].s[lts[2]].s = {} };
                    if(!(tags.l[lts[1]].s[lts[2]].s[lts[3]])) {
                        tags.l[lts[1]].s[lts[2]].s[lts[3]] = {};
                        tags.l[lts[1]].s[lts[2]].s[lts[3]].n = ls[3];
                    } else { tags.l[lts[1]].s[lts[2]].s[lts[3]].n = ls[3] };


                    if(!(tags.l[lts[1]].s[lts[2]].s[lts[3]].s)) {
                        tags.l[lts[1]].s[lts[2]].s[lts[3]].s = {};
                    };
                    if(!(tags.l[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]])) {
                        tags.l[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]] = {};
                        tags.l[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].n = ls[4];
                    } else { tags.l[lts[1]].s[lts[2]].s[lts[3]].s[lts[4]].n = ls[4] };
                    break;
                default             : 
                    tags.locationERR = 'ERROR, location tag only support max 4 levels, 5 and up is ignored';
            }
        }
    });
}














// post

this.createPost = function(req, res, cb) {
    upload(req, res, function(err) {
        if(err) { cb(err, null) } else if(req.files && req.files.length) {

            var url = removeDiacritics(req.body.postContent.title.toLowerCase()).replace(/[^\w\s]/gi, '').replace(/_/g, '').replace(/\s/g, '-') + '-'  + Date.now().toString().substring(10,13);

            var photos = [];

            for(var i = 0; i < req.files.length; i++) {
                var photoToSave = {
                    path : '/file/' + req.files[i].filename,
                    name : url + '-pic' + (i + 1)
                };
                photos.push(photoToSave);

                palmot.log(req.files[i].filename);

            };

            if(typeof(req.body.postContent.locations) === 'string') { 
                req.body.postContent.locations = [req.body.postContent.locations] 
            };

            if(typeof(req.body.postContent.topics) === 'string') { 
                req.body.postContent.topics = [req.body.postContent.topics] 
            };

            var topicArr = req.body.postContent.topics;





            var info = req.body.postContent.info.split(/\r\n|\n|\r/g);

            createdAtToRender = new Date();
            createdAtToRender = addZero(createdAtToRender.getHours()) + ':' + addZero(createdAtToRender.getMinutes()) + ' ' + createdAtToRender.getDate() + '/' + (createdAtToRender.getMonth() + 1);

            function addZero(time) {
                if(time.toString().length == 1) { time = '0' + time }
                return time;
            }

            if(req.body.postContent.price == 1) { var priceToRender = "Miễn phí" } else {
                var priceToRender = req.body.postContent.price.toString().split('').reverse().join('').match(/.{1,3}/g).join('.').split('').reverse().join('') + ' ₫';
            }

            //            palmot.log(req.body.postContent.topicsDetailPage.s['an_uong']);

            var toSavePost = {
                topics          : req.body.postContent.topics,
                topCount        : req.body.postContent.topics.length,
                topicsDetailPage: req.body.postContent.topicsDetailPage,
                locations       : req.body.postContent.locations,
                locCount        : req.body.postContent.locations.length,
                locDetailPage   : req.body.postContent.locDetailPage,
                title           : req.body.postContent.title,
                sellType        : req.body.postContent.sellType,
                board           : req.body.postContent.board,
                sellTypeViet    : req.body.postContent.sellTypeViet,
                locDisSearch    : req.body.postContent.locDisSearch,
                info            : info,
                price           : req.body.postContent.price,
                priceToRender   : priceToRender,
                postedBy        : req.decoded.username,
                photos          : photos, // all post 
                url             : url, // also the _id of post for fastest post get
                _id             : url,
                createdAtToRender     : createdAtToRender,  // ready to render Date
            };

            user.findById(req.decoded.username).then(retUser => {

                var totalRating = 0 + retUser.negRatings.length + retUser.posRatings.length;
                var posRating, negRating;
                if(totalRating) {
                    posRating = Math.round((retUser.posRatings.length / totalRating)*100,1);
                    negRating = (100 - posRating) + '%';
                    posRating = posRating + '%';
                };


                var now = moment(retUser.createdAt);

                toSavePost.owner = {
                    fullName    : retUser.lastName + ' ' + retUser.middleName + ' ' + retUser.firstName,
                    firstName   : retUser.firstName,
                    memberSince : now.format('DD/MM/YYYY'),
                    phone       : retUser.phone,
                    email       : retUser.email,
                    avatar      : retUser.avatar,
                    totalRating : totalRating,
                    posRating   : posRating ? posRating : '50%',
                    negRating   : negRating ? negRating : '50%',
                };


                post.create(toSavePost).then(retPost => {
                    retPost.on('es-indexed', function(err, res) {
                        if(err) {
                            retPost.remove({_id : retPost._id}).then(deletedPost => {
                                cb({message : 'ES failed to create document'}, null)
                            }).catch(err => cb(err, null))
                        } else { 
                            var createdPost = {
                                id          : retPost._id,
                                createdAt   : retPost.createdAt,
                                title       : retPost.title,
                                createdAtToRender : retPost.createdAtToRender,
                                air         : retPost.air,
                            };
                            retUser.posts.push(createdPost);
                            retUser.save();
                            cb(null, {postCreated: retPost});

                            palmot.log('**created post url: ' + retPost.url)

                        }
                    });
                }).catch(err => { cb(err, null) });
            }).catch(err => { cb(err, null) });
        } else { cb({message : 'no file sent'}, null) }
    });
}

this.getPost = function(req, res, cb) {
    post.findById(req.body.id).then(retPost => {
        user.findOne({_id : retPost.postedBy}, {}).then(retUser => {
            cb(null, { post : retPost, postOwner : retUser });
        }).catch(err => { cb(err, null) });
    }).catch(err => { cb(err, null) });
}

this.updatePost = function(req, res, cb) {
    post.findById(req.body.one._id).then(retPost => {
        retOne.price = req.body.one.price; // manually update each field
        retOne.save();
        retOne.on('es-indexed', function(err, res) {
            if(err) { cb({message : 'Mongo update success, ES Updated failed'}, null) } 
            else { cb(null, {mongoRes : retOne, esRes : res}); }
        });
    }).catch(err => cb(err, null))
}

this.delPost = function(req, res, cb) {
    post.findById(req.body.id).then(retPost => {
        user.findByIdAndUpdate(req.decoded.username, {
            $pull : { posts : { id: req.body.id }}
        }).catch(err => { cb(err, null) });
        retPost.remove(function(err) {
            if(err){ cb(err, null) };
            retPost.on('es-removed', function(err, res) {
                if(err) { cb({message : 'Mongo update success, ES Updated failed'}, null) }
                else { cb(null, {mongoRes : retPost, esRes : res}); };
                palmot.log(retPost.photos);
                retPost.photos.forEach(item => {
                    try { fs.unlinkSync(process.env.FILES + item.path) } catch(err){console.log(err)};
                    palmot.log(`deleted ${item.path}`);
                });
            });
        });
    }).catch(err => { cb(err, null) });
}

this.stopPost = function(req, res, cb) {
    post.findById(req.body.id).then(retPost => {
        retPost.air = Date.now() - 86400099 * parseFloat(process.env.SEARCH_LIFE_SPAN);
        retPost.save();
        user.findOneAndUpdate({ _id : req.decoded.username, "posts.id" : req.body.id }, { 
            $set : { "posts.$.air"    : retPost.air }
        }).catch(err => { cb(err, null) });
        retPost.on('es-indexed', function(err, res) {
            if(err) { cb({message : 'Mongo update success, ES Updated failed'}, null) } 
            else { cb(null, {mongoRes : retPost, esRes : res}); }
        });
    }).catch(err => cb(err, null))
}

this.rePost = function(req, res, cb) {
    post.findById(req.body.id).then(retPost => {
        retPost.air = Date.now();
        retPost.save();
        user.findOneAndUpdate({ _id : req.decoded.username, "posts.id" : req.body.id }, {
            $set : { "posts.$.air"    : retPost.air }
        }).catch(err => { cb(err, null) });
        retPost.on('es-indexed', function(err, res) {
            if(err) { cb({message : 'Mongo update success, ES Updated failed'}, null) } 
            else { cb(null, {mongoRes : retPost, esRes : res}); }
        });
    }).catch(err => cb(err, null))
}

this.favoritePost = function(req, res, cb) {
    post.findById(req.body.id).then(retPost => {
        user.findByIdAndUpdate(req.decoded.username, { $push : { favPosts : {
            postName    : retPost.title,
            url         : retPost.url,
            createdAt   : retPost.createdAtToRender,
            postedBy    : retPost.owner.fullName,
        }}}).then(retUser => { cb(null, {}) }).catch(err => { cb(err, null) });
    }).catch(err => cb(err, null))
}

this.delFavPost = function(req, res, cb) {
    user.findByIdAndUpdate(req.decoded.username, { $pull : { 
        favPosts : { url: req.body.id }
    }}).then(retUser => { cb(null, {}) }).catch(err => { cb(err, null) });
}

// end of post






// render pages

this.renderPage = function(req, res, cb) {

    palmot.log('*** rendering: ' + routes.pageRoutes[req.path][0]);

    switch(routes.pageRoutes[req.path][0]) {
        case 'home'             : req.tags = tags; _this.renderHome(req, res, cb); break;
        case 'fullBoard'        : 
            req.tags = tags;
//            req.tagss2 = tagss2.s; 
            _this.renderFullBoard(req, res, cb); break;
        case 'fullLocation'     : 
            req.tags = tags;
//            req.tagsl2 = tagss2.l;  
            _this.renderFullLocation(req, res, cb); break;
        case 'profile'          : _this.renderProfile(req, res, cb); break;
        case 'createPost'       : req.tags = tags; _this.renderJustPage(req, res, cb); break;
        case 'testTags'         : req.tags = tags; _this.renderJustPage(req, res, cb); break;
        case 'register'         : _this.renderJustPage(req, res, cb); break;
        case 'login'            : _this.renderJustPage(req, res, cb); break;
        case 'forgotPassword'   : _this.renderJustPage(req, res, cb); break;
        case 'resetPassword'    : _this.renderJustPage(req, res, cb); break;
        case 'verifyEmail'      : _this.renderJustPage(req, res, cb); break;
        case 'updateProfile'    : _this.renderJustPage(req, res, cb); break;
        case 'changePassword'   : _this.renderJustPage(req, res, cb); break;
        case 'search'           : _this.renderSearch(req, res, cb); break;
        case 'appHealth'        : _this.renderJustPage(req, res, cb); break;
        case 'sendFeedback'     : _this.renderJustPage(req, res, cb); break;
        case 'fullBoardOfLoc'   : _this.renderFullBoardOfLoc(req, res, cb); break;
        case 'blog'             : _this.renderBlogHome(req, res, cb); break;
        case 'createBlog'       : 
            req.layout = 'main4createBlog';_this.renderJustPage(req, res, cb); break;
        case 'updateBlog'       : 
            req.layout = 'main4createBlog';_this.renderJustPage(req, res, cb); break;
        case 'whatIsResell'     : _this.renderJustPage(req, res, cb); break;
        case 'newestBlog'       : _this.renderNewestBlog(req, res, cb); break;
        case 'introMudibala'   : _this.renderIntroMudi(req, res, cb); break;
        case 'announcement'     : _this.renderAnnouncement(req, res, cb); break;
        case 'useEffective'     : _this.renderUseEffective(req, res, cb); break;
        case 'mudibalaU'        : _this.renderMudibalaU(req, res, cb); break;
        case 'qaFeedback'       : _this.renderQaFeedback(req, res, cb); break;
        default                 : _this.renderHome(req, res, cb); break;
    }
}

this.renderSearch = function(req, res, cb) {
    try {
        var loc = req.query['dia-diem'];
        if(loc) { loc = loc.split(',') };
        if(!loc || loc.length == 1) { loc = 'Toàn Quốc' } 
        else if (loc.length == 2 ) { loc = tags.l[loc[1]].n }
        else { loc = tags.l[loc[1]].s[loc[2]].n };
        var top = req.query['chu-de'];
        var topLv1 = '';
        var topDes = '';
        if(top) { top = top.split(',') };
        if(!top) { top = 'Tất Cả Chủ Đề' } else {
            switch(top.length) {
                case 1  : topLv1 = tags.s[top[0]].n; topDes = topLv1; break;
                case 2  : topLv1 = tags.s[top[0]].n + ' > ' + tags.s[top[0]].s[top[1]].n; topDes = topLv1; break;
                case 3  : topLv1 = tags.s[top[0]].s[top[1]].n + ' > ' + tags.s[top[0]].s[top[1]].s[top[2]].n; 
                    topDes = tags.s[top[0]].n + ' > ' + tags.s[top[0]].s[top[1]].n + ' > ' + tags.s[top[0]].s[top[1]].s[top[2]].n; break;
                case 4  : topLv1 = tags.s[top[0]].s[top[1]].s[top[2]].n + ' > ' + tags.s[top[0]].s[top[1]].s[top[2]].s[top[3]].n; 
                    topDes = tags.s[top[0]].n + ' > ' + tags.s[top[0]].s[top[1]].n + ' > ' + tags.s[top[0]].s[top[1]].s[top[2]].n + ' > ' + tags.s[top[0]].s[top[1]].s[top[2]].s[top[3]].n; break;
                default : top = 'Tất Cả Chủ Đề'; break;
            };
        };



        req.metaTitle = 'Bảng tin ' + loc + ' về ' + (topLv1 ? topLv1 : top) + ' | Mudibala';
        req.metaDescription = 'Bảng tin ' + loc + ' về ' + (topDes ? topDes : top) + '. Đăng và tìm tin miễn phí tại Mudibala.';
        //    palmot.log(loc);
        //    palmot.log(top);
        //    palmot.log(topLv1);
        //    palmot.log(topDes);
        //    palmot.log(req.metaTitle);
        //    palmot.log(req.metaDescription);
        //    palmot.log(req.originalUrl);

        res.render(routes.pageRoutes[req.path][0], req)
    } catch(e) { _this.renderNotFound(req, res) }
}

this.renderHome = function(req, res, cb) {
    _this.searchEs({body:{query:{p:1,n:12,l:['toan_quoc']}},query:{}}, res, function(err, re) {
        if(err) { res.render(routes.pageRoutes[req.path][0], req) } else {
            req.randomPost1 = [re.resList[0], re.resList[1], re.resList[2], re.resList[3]];
            req.randomPost2 = [re.resList[4], re.resList[5], re.resList[6], re.resList[7]];
            req.randomPost3 = [re.resList[8], re.resList[9], re.resList[10], re.resList[11]];
            req.totalPost = re.totalFound;
            system.findById('carousel').then(retCar => {
                req.carousel1 = retCar.carousel[0];
                retCar.carousel.shift();
                req.carousel3 = retCar.carousel;
                res.render('home', req);
            }).catch(err => { res.render('home', req); });
        };
    });
}

this.renderBlogHome = function(req, res, cb) {
    _this.mSearchEs(req, res, function(err, re) {
        if(err) { res.render(routes.pageRoutes[req.path][0], req) } else {
            req.content = re.responses;
            system.findById('carousel').then(retCar => {
                req.carousel1 = retCar.carousel[0];
                retCar.carousel.shift();
                req.carousel3 = retCar.carousel;
                res.render('blog', req);
            }).catch(err => { res.render('blog', req);; });
        };
    });
}

this.renderNewestBlog = function(req, res, cb) {
    _this.mNewestBlog(req, res, function(err, re) {
        if(err) { res.render(routes.pageRoutes[req.path][0], req) } else {
            req.newestBlog = re.responses[0].hits.hits;
            req.introduction = re.responses[1].hits.hits;
            req.announcement = re.responses[2].hits.hits;
            req.totalHits = [];
            for(i = 1; i <= Math.ceil(re.responses[0].hits.total/process.env.BLOGS_PER_CATE); i++){ 
                req.totalHits.push({page: i, active : i==req.query.trang ? 'class="active"':''}) 
            };
            req.hide1 = Boolean(req.totalHits.length == 1);
            res.render('newestBlog', req);
        };
    });
}

this.renderIntroMudi = function(req, res, cb) {
    _this.mIntroMudi(req, res, function(err, re) {
        if(err) { res.render(routes.pageRoutes[req.path][0], req) } else {
            req.newestBlog = re.responses[0].hits.hits;
            req.introduction = re.responses[1].hits.hits;
            req.announcement = re.responses[2].hits.hits;
            req.totalHits = [];
            for(i = 1; i <= Math.ceil(re.responses[0].hits.total/process.env.BLOGS_PER_CATE); i++){ 
                req.totalHits.push({page: i, active : i==req.query.trang ? 'class="active"':''}) 
            };
            req.hide1 = Boolean(req.totalHits.length == 1);
            res.render('introMudibala', req);
        };
    });
}

this.renderAnnouncement = function(req, res, cb) {
    _this.mAnnouncement(req, res, function(err, re) {
        if(err) { res.render(routes.pageRoutes[req.path][0], req) } else {
            req.newestBlog = re.responses[0].hits.hits;
            req.introduction = re.responses[1].hits.hits;
            req.announcement = re.responses[2].hits.hits;
            req.totalHits = [];
            for(i = 1; i <= Math.ceil(re.responses[0].hits.total/process.env.BLOGS_PER_CATE); i++){ 
                req.totalHits.push({page: i, active : i==req.query.trang ? 'class="active"':''}) 
            };
            req.hide1 = Boolean(req.totalHits.length == 1);
            res.render('announcement', req);
        };
    });
}

this.renderUseEffective = function(req, res, cb) {
    _this.mUseEffective(req, res, function(err, re) {
        if(err) { res.render(routes.pageRoutes[req.path][0], req) } else {
            req.newestBlog = re.responses[0].hits.hits;
            req.introduction = re.responses[1].hits.hits;
            req.announcement = re.responses[2].hits.hits;
            req.totalHits = [];
            for(i = 1; i <= Math.ceil(re.responses[0].hits.total/process.env.BLOGS_PER_CATE); i++){ 
                req.totalHits.push({page: i, active : i==req.query.trang ? 'class="active"':''}) 
            };
            req.hide1 = Boolean(req.totalHits.length == 1);
            res.render('useEffective', req);
        };
    });
}

this.renderMudibalaU = function(req, res, cb) {
    _this.mMudibalaU(req, res, function(err, re) {
        if(err) { res.render(routes.pageRoutes[req.path][0], req) } else {
            req.newestBlog = re.responses[0].hits.hits;
            req.introduction = re.responses[1].hits.hits;
            req.announcement = re.responses[2].hits.hits;
            req.totalHits = [];
            for(i = 1; i <= Math.ceil(re.responses[0].hits.total/process.env.BLOGS_PER_CATE); i++){ 
                req.totalHits.push({page: i, active : i==req.query.trang ? 'class="active"':''}) 
            };
            req.hide1 = Boolean(req.totalHits.length == 1);
            res.render('mudibalaU', req);
        };
    });
}

this.renderQaFeedback = function(req, res, cb) {
    _this.mQaFeedback(req, res, function(err, re) {
        if(err) { res.render(routes.pageRoutes[req.path][0], req) } else {
            req.newestBlog = re.responses[0].hits.hits;
            req.introduction = re.responses[1].hits.hits;
            req.announcement = re.responses[2].hits.hits;
            req.totalHits = [];
            for(i = 1; i <= Math.ceil(re.responses[0].hits.total/process.env.BLOGS_PER_CATE); i++){ 
                req.totalHits.push({page: i, active : i==req.query.trang ? 'class="active"':''}) 
            };
            req.hide1 = Boolean(req.totalHits.length == 1);
            res.render('qaFeedback', req);
        };
    });
}

//this.renderFullBoardOfLoc = function(req, res, cb) {
//    req.tags = tags;
//    req.body.whatBoard = 'fullBoardOfLoc';
//    _this.countEs(req, res, function(err, re) {
//        if(err) {
//            palmot.log(err);
//            res.render(routes.pageRoutes[req.path][0], req) 
//        } else {
//            for(var prop in re.aggregations.messages.buckets) {
//                req.tags.s[prop].doc_count = re.aggregations.messages.buckets[prop].doc_count;
//            };
//            var tagss2 = [];
//            var j = 0;
//            for(var prop in tags.s) {
//                var temp = {[prop]:tags.s[prop]};
//                if(j % 2 == 0) { tagss2.push( temp ) } 
//                else { tagss2[Math.floor(j/2)][prop]=tags.s[prop] }
//                j +=1;
//            };
//            req.tagss2 = tagss2;
//            
//            req.randomPost1 = [re.hits.hits[0], re.hits.hits[1], re.hits.hits[2], re.hits.hits[3]];
//            req.randomPost2 = [re.hits.hits[4], re.hits.hits[5], re.hits.hits[6], re.hits.hits[7]];
//            req.randomPost3 = [re.hits.hits[8], re.hits.hits[9], re.hits.hits[10], re.hits.hits[11]];
//            req.totalPost = re.hits.total;
//            res.render('fullBoardOfLoc', req);
//        };     
//    });
//}

this.renderFullBoardOfLoc = function(req, res, cb) {
    req.tags = tags;
    if(!req.query.q) { _this.renderNotFound(req, res) } else { 
        var locs = req.query.q.split(',');
        switch(locs.length) {
            case 2 : req.place = tags.l[locs[1]].n; break;
            case 3 : req.place = tags.l[locs[1]].s[locs[2]].n; break;
            default : req.place = 'Toàn Quốc'; break;
        }
        req.body.whatBoard = 'fullBoardOfLoc';
        _this.countEs(req, res, function(err, re) {
            if(err) {
                palmot.log(err);
                res.render(routes.pageRoutes[req.path][0], req) 
            } else {
                for(var prop in re.aggregations.messages.buckets) {
                    req.tags.s[prop].doc_count = re.aggregations.messages.buckets[prop].doc_count;
                };
                var tagss2 = [];
                var j = 0;
                for(var prop in tags.s) {
                    var temp = {[prop]:tags.s[prop]};
                    if(j % 2 == 0) { tagss2.push( temp ) } 
                    else { tagss2[Math.floor(j/2)][prop]=tags.s[prop] }
                    j +=1;
                };
                req.tagss2 = tagss2;

                req.randomPost1 = [re.hits.hits[0], re.hits.hits[1], re.hits.hits[2], re.hits.hits[3]];
                req.randomPost2 = [re.hits.hits[4], re.hits.hits[5], re.hits.hits[6], re.hits.hits[7]];
                req.randomPost3 = [re.hits.hits[8], re.hits.hits[9], re.hits.hits[10], re.hits.hits[11]];
                req.totalPost = re.hits.total;
                res.render('fullBoardOfLoc', req);
            };     
        });
    }
    
    
}

this.renderFullBoard = function(req, res, cb) {
    req.body.whatBoard = 'fullBoard';
    _this.countEs(req, res, function(err, re) {
        if(err) { res.render(routes.pageRoutes[req.path][0], req) } else {
            for(var prop in re.aggregations.messages.buckets) {
                req.tags.s[prop].doc_count = re.aggregations.messages.buckets[prop].doc_count;
            };
            var tagss2 = [];
            var j = 0;
            for(var prop in tags.s) {
                var temp = {[prop]:tags.s[prop]};
                if(j % 2 == 0) { tagss2.push( temp ) } 
                else { tagss2[Math.floor(j/2)][prop]=tags.s[prop] }
                j +=1;
            };
            req.tagss2 = tagss2;
            
            req.randomPost1 = [re.hits.hits[0], re.hits.hits[1], re.hits.hits[2], re.hits.hits[3]];
            req.randomPost2 = [re.hits.hits[4], re.hits.hits[5], re.hits.hits[6], re.hits.hits[7]];
            req.randomPost3 = [re.hits.hits[8], re.hits.hits[9], re.hits.hits[10], re.hits.hits[11]];
            req.totalPost = re.hits.total;
            res.render('fullBoard', req);
        };     
    });
}

this.renderFullLocation = function(req, res, cb) {
    req.body.whatBoard = 'fullLocation';
    _this.countEs(req, res, function(err, re) {
        if(err) { 
            palmot.reportSystemMaster(err);
            res.render(routes.pageRoutes[req.path][0], req) 
        } else {
            req.randomPost1 = [re.hits.hits[0], re.hits.hits[1], re.hits.hits[2], re.hits.hits[3]];
            req.randomPost2 = [re.hits.hits[4], re.hits.hits[5], re.hits.hits[6], re.hits.hits[7]];
            req.randomPost3 = [re.hits.hits[8], re.hits.hits[9], re.hits.hits[10], re.hits.hits[11]];
            req.totalPost = re.hits.total;
            var buckets = re.aggregations.messages.buckets
            for(var kva in buckets) {
                if(kva != 'toan_quoc') { 
                    req.tags.l[kva].doc_count = buckets[kva].doc_count + buckets.toan_quoc.doc_count;
                }
            };
            var tagsl2 = [];
            var j = 0;
            for(var prop in tags.l) {
                var temp = {[prop]:tags.l[prop]};
                if(j % 2 == 0) { tagsl2.push( temp ) } 
                else { tagsl2[Math.floor(j/2)][prop]=tags.l[prop] }
                j +=1;
            };
            req.tagsl2 = tagsl2;
            res.render('fullLocation', req);
        };     
    });
}

this.renderProfile = function(req, res, cb) {
    req.isAdmin = ['master','admin'].indexOf(req.decoded.userPermission) > -1;
    var oldestSearchable = Date.now() - parseFloat(process.env.SEARCH_LIFE_SPAN) * 86400000;
    for(var i = 0; i < req.user.posts.length; i++) {
        if(req.user.posts[i].air > oldestSearchable) { req.user.posts[i].airStatus = true } 
        else { req.user.posts[i].airStatus = false };
        var now = moment(req.user.posts[i].air).add(parseFloat(process.env.SEARCH_LIFE_SPAN), 'days');
        req.user.posts[i].expire = now.format('DD/MM/YYYY');
    };
    req.user.totalRating = req.user.negRatings.length + req.user.posRatings.length;
    req.user.posRatePercentage = Math.round((req.user.posRatings.length/req.user.totalRating)*100,1);
    req.user.negRatePercentage = 100 - req.user.posRatePercentage;
    
    system.findById('carousel').then(retCar => {
        req.carousel = retCar.carousel;
        res.render(routes.pageRoutes[req.path][0], req);
    }).catch(err => {
        res.render(routes.pageRoutes[req.path][0], req);
    });
}

this.renderJustPage = function(req, res, cb) { res.render(routes.pageRoutes[req.path][0], req) }

this.renderPost = function(req, res, next) {
    post.findOne({ _id : req.params.lv2}).then(retPost => {
        if(retPost) {
            var locations = ['toan_quoc'];
            var topics = [retPost.topics[0]];
            if(retPost.locations.length >= 2) { locations.push(retPost.locations[1]) };
            if(retPost.topics.length >= 2) { topics.push(retPost.topics[1]) };
            _this.searchEs({body:{query:{p:1,n:13,l:locations,f:topics}},query:{}}, res, function(err, re) {
                if(err) {
                    req.post = retPost;
                    req.layout = 'mainLv1';
                    retPost.viewed +=1;
                    res.render('postDetail', req);
                    retPost.save();
                } else {
                    re.resList = re.resList.filter(obj => { return obj._source.url !== retPost.url });
                    req.randomPost1 = [];
                    req.randomPost2 = [];
                    req.randomPost3 = [];
                    for(var i = 0; i < 4; i++) { if(re.resList[i]){req.randomPost1.push(re.resList[i])}};
                    for(var i = 4; i < 8; i++) { if(re.resList[i]){req.randomPost2.push(re.resList[i])}};
                    for(var i = 8; i < 12; i++){ if(re.resList[i]){req.randomPost3.push(re.resList[i])}};
                    req.post = retPost;
                    req.layout = 'mainLv1';
                    retPost.viewed +=1;
                    res.render('postDetail', req);
                    retPost.save();
                };
            });
        } else { _this.renderNotFound(req, res) }
    }).catch(err => { _this.reportError(err); req.layout = 'mainLv1'; res.render('notFound', req);})
}

this.renderNotFound = function(req, res) {
    req.layout = 'mainLv1';
    res.render('notFound', req);
}

this.renderBlog = function(req, res, next) {
    blog.findById(req.params.lv2).then(retBlog => {
        if(retBlog) {
            req.blogType = retBlog.type;
            _this.mBlogDetail(req, res, function(err, re) {
                if(err) {
                    _this.reportError(err);
                    _this.renderNotFound(req, res);
                } else {
                    req.sameCate = re.responses[0].hits.hits;
                    req.newestBlog = re.responses[1].hits.hits;
                    req.blog = retBlog;
                    req.layout = 'mainLv1Blog';
                    retBlog.viewed +=1;
                    res.render('blogDetail', req);
                    retBlog.save();
                };
            });
        } else { _this.renderNotFound(req, res) }
    }).catch(err => { _this.reportError(err); req.layout = 'mainLv1'; res.render('notFound', req);})
}

// end of render pages




