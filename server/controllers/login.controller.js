const mongoose = require('mongoose')
    , mongo_con = require('../constants/mongo.constant')
    , common = require('../constants/common.constant')
    , httpStatus = require('../constants/httpStatus.constant')
    , crypto = require('crypto')
    , co = require('co');

module.exports = {
    /**
     * describe: 登录页渲染
     * data:     16.11.03
     * author:   zhuxiankang
     * parm:     req,res,next
     */
    loginRender(req,res,next) {
        res.render('login', { title: '登录' });
    },

    /**
     * describe: 登录验证
     * data:     16.11.03
     * author:   zhuxiankang
     * parm:     req,res,next
     */
    loginAuthen(req,res,next) {

        let User = mongoose.model(mongo_con.User);
        let queryUser = req.body;
        let md5 = crypto.createHash('md5');

        co(function*() {
            try {
                let mongoUser = yield User.findOne({username: queryUser.username});

                if (mongoUser) {
                    if(mongoUser.password === md5.update(`${queryUser.password}${common.salt}`,'utf8').digest('base64')) {
                        req.session.userid = mongoUser.id;
                        req.session.username = mongoUser.username;
                        req.session.usertype = mongoUser.usertype;
                        res.redirect('index');
                    }
                }
                res.redirect('/');

            } catch (e) {
                res.redirect('/');
            }

        }).catch(onerror);

        function onerror(err) {
            res.redirect('/');  //暂时这样处理
        }
    },

    /**
     * 注销
     * @param req
     * @param res
     * @param next
     */
    logout(req,res,next) {
        req.session.destroy(function(){  //移除会话
            res.redirect('/');
        });
    }



};
