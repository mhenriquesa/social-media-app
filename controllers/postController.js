let Post = require('../models/Posts');

exports.apiDelete = function (req, res) {
  Post.delete(req.params.id, req.apiUser._id)
    .then(() => {
      res.json('Success');
    })
    .catch(() => {
      res.json('You do not have permission to perform that action.');
    });
};

exports.apiCreate = function (req, res) {
  let post = new Post(req.body, req.apiUser._id);
  post
    .create()
    .then(function (newId) {
      res.json('Congrats.');
    })
    .catch(function (errors) {
      res.json(errors);
    });
};

exports.create = (req, res) => {
  let post = new Post(req.body, req.session.user._id);
  post
    .create()
    .then(newId => {
      req.flash('success', 'Post criado com sucesso');
      req.session.save(() => res.redirect(`/post/${newId}`));
    })
    .catch(errors => {
      errors.forEach(error => req.flash('errors', error));
      req.session.save(() => res.redirect('/create-post'));
    });
};
exports.edit = (req, res) => {
  let post = new Post(req.body, req.visitorId, req.params.id);
  post
    .update()
    .then(status => {
      if (status == 'success') {
        req.flash('success', 'Post atualizado');
        req.session.save(() => res.redirect(`/post/${req.params.id}`));
      } else {
        post.errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect(`/post/${req.params.id}/edit`));
      }
    })
    .catch(() => {
      req.flash('errors', 'Você não tem permissão para a ação');
      req.session.save(() => res.redirect('/'));
    });
};
exports.delete = (req, res) => {
  Post.delete(req.params.id, req.visitorId)
    .then(() => {
      req.flash('success', 'Post apagado com sucesso');
      req.session.save(() => res.redirect(`/profile/${req.session.user.username}`));
    })
    .catch(() => {
      req.flash('errors', 'Você não tem permissão para a ação');
      req.session.save(() => res.redirect('/'));
    });
};
exports.search = (req, res) => {
  Post.search(req.body.searchTerm)
    .then(posts => res.json(posts))
    .catch(() => res.json([]));
};
exports.viewCreateScreen = (req, res) => {
  if (req.session.user) res.render('create-post');
  else res.render('home-guest');
};
exports.viewSingle = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    console.log(post);
    res.render('single-post-screen', { post: post, title: post.title });
  } catch {
    res.render('404');
  }
};
exports.viewEditScreen = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    console.log(post);
    if (post.isVisitorOwner) res.render('edit-post', { post: post });
    else {
      req.flash('errors', 'Você não tem permissão para a ação');
      req.session.save(() => res.redirect('/'));
    }
  } catch {
    res.render('404');
  }
};
