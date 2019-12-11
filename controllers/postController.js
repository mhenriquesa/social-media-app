let Post = require('../models/Posts')

exports.viewCreateScreen = function(req, res) {
    if (req.session.user) {
      res.render('create-post', {username: req.session.user.username, avatar: req.session.user.avatar})
    } else {
      res.render('home-guest')
    }
  }