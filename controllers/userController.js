const User = require('../models/User')
const Follow = require('../models/Follow')
const Post = require('../models/Posts')

//------- Redirecionamento principal Home
exports.home = (req, res) => {
  if (req.session.user) res.render('home-dashboard')
  else res.render('home-guest', {regErrors: req.flash('regErrors')})
}

//------- Principais ações do usuário
exports.login = (req, res) => {
  let user = new User(req.body)
  user.login()
  .then( () => {
    req.session.user = {avatar: user.avatar, username: user.data.username, _id:user.data._id}
    req.session.save( () => res.redirect('/') )
  })
  .catch( e => {
    req.flash('errors', e)
    req.session.save( () => res.redirect('/') )
  })
}

exports.logout = (req, res) => req.session.destroy( () => res.redirect('/') )

exports.register = (req, res) => {
  let user = new User(req.body)
  user.register()
  .then( () => {
    req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
    req.session.save( () => res.redirect('/') )
  })
  .catch( regErrors => {
    regErrors.forEach( error => req.flash('regErrors', error) )
    req.session.save( () => res.redirect('/') )
  })
}

// -----------------------
exports.sharedProfileData =  async function (req, res, next) {
  let isFollowing = false
  if (req.session.user) {
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
  }
  console.log(isFollowing)
  req.isFollowing = isFollowing
  next()
}

exports.userMustBeLoggedIn =  (req, res, next) => {
  if (req.session.user) next()
  else {
    req.flash('errors', "Você deve estar logado para usar esta função")
    req.session.save( () => res.redirect('/') )
  }
}

exports.ifUserExists = (req, res, next) => {
  User.findByUsername(req.params.username)
  .then( userDocument => {
    req.profileUser = userDocument
    next()
  })
  .catch( () => res.render("404") )
}

  exports.profilePostsScreen = function (req, res) {
  Post.findByAuthorId(req.profileUser._id)
  .then( posts => {
    res.render('profile', {
      posts: posts,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing
    })
  })
  .catch( () => res.render("404") )
}
