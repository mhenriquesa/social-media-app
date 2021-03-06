const User = require('../models/User');
const Follow = require('../models/Follow');
const Post = require('../models/Posts');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.apiGetPostsByUsername = async function (req, res) {
  try {
    let authorDoc = await User.findByUsername(req.params.username);
    let posts = await Post.findByAuthorId(authorDoc._id);
    res.json(posts);
  } catch {
    res.json('Sorry, invalid user requested.');
  }
};

exports.apiMustBeLoggedIn = function (req, res, next) {
  try {
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET);
    next();
  } catch {
    res.json('Sorry, you must provide a valid token.');
  }
};

exports.home = async (req, res) => {
  if (req.session.user) {
    // fetch feed os posts for cuurent user
    let posts = await Post.getFeed(req.session.user._id);
    res.render('home-dashboard', { posts: posts });
  } else res.render('home-guest', { regErrors: req.flash('regErrors') });
};
exports.login = (req, res) => {
  let user = new User(req.body);
  user
    .login()
    .then(() => {
      req.session.user = {
        avatar: user.avatar,
        username: user.data.username,
        _id: user.data._id,
      };
      req.session.save(() => res.redirect('/'));
    })
    .catch(e => {
      req.flash('errors', e);
      req.session.save(() => res.redirect('/'));
    });
};

exports.apiLogin = function (req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(function (result) {
      res.json(
        jwt.sign({ _id: user.data._id }, process.env.JWTSECRET, { expiresIn: '7d' })
      );
    })
    .catch(function (e) {
      res.json('Sorry, your values are not correct.');
    });
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/'));
};
exports.register = (req, res) => {
  let user = new User(req.body);

  user
    .register()
    .then(() => {
      req.session.user = {
        avatar: user.avatar,
        username: user.data.username,
        _id: user.data._id,
      };
      req.session.save(() => res.redirect('/'));
    })
    .catch(regErrors => {
      regErrors.forEach(error => req.flash('regErrors', error));
      req.session.save(() => res.redirect('/'));
    });
};
exports.profilePostsScreen = function (req, res) {
  Post.findByAuthorId(req.profileUser._id) //Returns posts
    .then(posts => {
      res.render('profile', {
        counts: {
          postCount: req.postCount,
          followerCount: req.followerCount,
          followingCount: req.followingCount,
        },
        currentPage: 'posts',
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isItYourOwnPage: req.isItYourOwnPage,
        title: `Profile for ${req.profileUser.username}`,
      });
    })
    .catch(() => res.render('404'));
};
exports.profileFollowersScreen = async (req, res) => {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id);
    res.render('profile-followers', {
      currentPage: 'followers',
      counts: {
        postCount: req.postCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount,
      },
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isItYourOwnPage: req.isItYourOwnPage,
    });
  } catch {
    res.render('404');
  }
};
exports.profileFollowingScreen = async (req, res) => {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id);
    console.log('Esse é o resultado de following ', following);
    res.render('profile-following', {
      counts: {
        postCount: req.postCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount,
      },
      currentPage: 'following',
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isItYourOwnPage: req.isItYourOwnPage,
    });
  } catch {
    res.render('404');
  }
};
exports.ifUserExists = (req, res, next) => {
  User.findByUsername(req.params.username)
    .then(userDocument => {
      req.profileUser = userDocument;
      next();
    })
    .catch(() => res.render('404'));
};
exports.doesUsernameExist = function (req, res) {
  User.findByUsername(req.body.username)
    .then(function () {
      res.json(true);
    })
    .catch(function () {
      res.json(false);
    });
};
exports.userMustBeLoggedIn = (req, res, next) => {
  if (req.session.user) next();
  else {
    req.flash('errors', 'Você deve estar logado para usar esta função');
    req.session.save(() => res.redirect('/'));
  }
};
exports.sharedProfileData = async function (req, res, next) {
  // By default, ninguem segue ninguem
  let isFollowing = false;

  //Se o usuario estiver logado, isFollowing vai depender do teste isVisitorFollowing
  if (req.session.user)
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId);

  //Cria uma nova property no req Object do express definindo valor segundo isFollowing
  req.isFollowing = isFollowing;

  // Testa se o visitante está no seu proprio profile
  let isItYourOwnPage = req.profileUser._id.equals(req.visitorId);
  req.isItYourOwnPage = isItYourOwnPage;

  console.log('O visitante é o dono da pagina? ' + req.isItYourOwnPage);

  //retrieve post, follower and following counts
  let postCountPromise = Post.countPostsByAuthor(req.profileUser._id);
  let followerCountPromise = Follow.countFollowersById(req.profileUser._id);
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id);
  let [postCount, followerCount, followingCount] = await Promise.all([
    postCountPromise,
    followerCountPromise,
    followingCountPromise,
  ]);

  req.postCount = postCount;
  req.followerCount = followerCount;
  req.followingCount = followingCount;

  next();
};

exports.doesUsernameExist = function (req, res) {
  User.findByUsername(req.body.username)
    .then(function () {
      res.json(true);
    })
    .catch(function () {
      res.json(false);
    });
};

exports.doesEmailExist = async function (req, res) {
  let emailBool = await User.doesEmailExist(req.body.email);
  res.json(emailBool);
};
