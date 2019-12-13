let Post = require('../models/Posts')

exports.viewCreateScreen = function(req, res) {
    if (req.session.user) {
      res.render('create-post'/*, {username: req.session.user.username, avatar: req.session.user.avatar}*/)
    } else {
      res.render('home-guest')
    }
  }

  exports.create = function (req, res) {
    let post = new Post(req.body, req.session.user._id)
    post.create()
    .then(function (success) {
      req.flash('postCreated', success)
      req.session.save(function () {
        res.redirect('/')
      })
    })
    .catch(function (errors) {
       res.send(errors)
      })
  }

  exports.viewSingle = async function (req, res) {
    try {
      let post = await Post.findSingleById(req.params.id)
      res.render('single-post-screen', {post: post})
    } catch {
      res.render('404')
    }
  }

