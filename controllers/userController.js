const User = require('../models/User')
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

// ---------Tests ----------------------
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

exports.profilePostsScreen = (req, res)=> {
  Post.findByAuthorId(req.profileUser._id)
  .then( posts => {
    res.render('profile', {
      posts: posts,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar
    })
  })
  .catch( () => res.render("404") )
}
