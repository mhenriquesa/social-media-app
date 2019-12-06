const User = require('../models/User')
//------------------------------------------

exports.login = function (req, res) {
    let user = new User(req.body)
    user.login()
    .then(function (result_) {
        res.send(result_)
    })
    .catch(function (err) {
      res.send(err)  
    })
}

exports.logout = function () {    
}

// Register feature
exports.register = function (req, res) {
    let user = new User(req.body)
    user.register()
    if (user.errors.length) {
        res.send(user.errors)
    } else {
        res.send('COngrats. Tudo certo!')
    }
}

exports.home = function (req, res) {
    res.render('home-guest')
    }