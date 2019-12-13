const User = require('../models/User')
const Post = require('../models/Posts')

//------- Redirecionamento principal Home
exports.home = function(req, res) {
  if (req.session.user) {
    res.render('home-dashboard', {postCreated: req.flash('postCreated')})
  } else {
    res.render('home-guest', {errors: req.flash('errors'), regErrors: req.flash('regErrors')})
  }
}

//------- Principais ações do usuário
exports.login = function(req, res) {
  let user = new User(req.body)
  user.login().then(function(result) {
    req.session.user = {avatar: user.avatar, username: user.data.username, _id:user.data._id}
    req.session.save(function() {
      res.redirect('/')
    })
  }).catch(function(e) {
    req.flash('errors', e)
    req.session.save(function () {
      res.redirect('/')
    })
  })
}

exports.logout = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/')
  })
}

exports.register = function(req, res) {
  let user = new User(req.body)
  user.register().then(() => {
    req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
    req.session.save(function () {
      res.redirect('/')
    })
  }).catch((regErrors) => {
    regErrors.forEach(function (error) {
      req.flash('regErrors', error)
    })
    req.session.save(function () {
      res.redirect('/')
    })
  })
}

exports.userMustBeLoggedIn = function (req, res, next) {
  if (req.session.user) {
    next()
  } else {
    req.flash('errors', "Você deve estar logado para usar esta função")
    req.session.save(function () {
      res.redirect('/')
    })
  }
}

exports.ifUserExists = function (req, res, next) {
  User.findByUsername(req.params.username).then(function (userDocument) {
    req.profileUsername = userDocument
    next()
  }).catch(function () {
    res.render('404')
  })
}

exports.profilePostsScreen = function (req, res) {
  //Ask our Post models for post by Author ID
  Post.findByAuthorID(req.profileUsername._id)
  .then(function (posts) {
    res.render('profile', {
      profileUsername: req.profileUsername.username,
      profileAvatar: req.profileUsername.avatar,
      posts: posts
    })
  })
  .catch(function () {
    res.render('404')
  })

}
