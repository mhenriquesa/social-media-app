const User = require('../models/User')
//------------------------------------------

exports.login = function (req, res) {
    let user = new User(req.body)
    user.login(function (result) {
        res.send(result)
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