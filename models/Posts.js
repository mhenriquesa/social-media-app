const postsCollection = require('../db').db().collection('posts');
const followsCollection = require('../db').db().collection('follows');
const ObjectID = require('mongodb').ObjectID;
const User = require('./User');
const sanitize = require('sanitize-html');

//----Constructor
let Post = function (data, userid, requestedPostId) {
  this.data = data;
  this.errors = [];
  this.userid = userid;
  this.requestedPostId = requestedPostId;
};

// ----- Prototypes
Post.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    //Encontrar o post e testar se o requrente é owner
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userid);
      if (post.isVisitorOwner) {
        let status = await this.actuallyUpdate();
        resolve(status);
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
};

Post.prototype.actuallyUpdate = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate(
        { _id: new ObjectID(this.requestedPostId) },
        { $set: { title: this.data.title, body: this.data.body } }
      );
      resolve('success');
    } else {
      reject('failure');
    }
  });
};

Post.prototype.create = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      postsCollection
        .insertOne(this.data)
        .then(info => {
          resolve(info.ops[0]._id);
        })
        .catch(() => {
          this.errors.push('Por favor, tente novamente mais tarde');
          reject(this.errors);
        });
    } else {
      reject(this.errors);
    }
  });
};

Post.prototype.cleanUp = function () {
  if (typeof this.data.title != 'string') {
    this.data.title = '';
  }
  if (typeof this.data.body != 'string') {
    this.data.body = '';
  }

  // Get rid of any bogus propeties
  this.data = {
    title: sanitize(this.data.title.trim(), {
      allowedAttributes: {},
      allowedTags: [],
    }),
    body: sanitize(this.data.body.trim(), {
      allowedAttributes: {},
      allowedTags: [],
    }),
    createdDate: new Date(),
    author: ObjectID(this.userid),
  };
};

Post.prototype.validate = function () {
  if (this.data.title == '') this.errors.push('O post precisa de um título');
  if (this.data.body == '') this.errors.push('O post precisa de conteúdo');
};

// ------ Methods
Post.search = searchTerm => {
  return new Promise(async (resolve, reject) => {
    if (typeof searchTerm == 'string') {
      let matchSearch = [
        { $match: { $text: { $search: searchTerm } } },
        { $sort: { score: { $meta: 'textScore' } } },
      ];
      let posts = await Post.reusablePostQuery(matchSearch);
      resolve(posts);
    } else reject();
  });
};

Post.delete = function (postIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postIdToDelete, currentUserId);
      if (post.isVisitorOwner) {
        await postsCollection.deleteOne({ _id: new ObjectID(postIdToDelete) });
        resolve('success');
      } else {
        reject('failure');
      }
    } catch {
      reject('Tente novamete mais tarde');
    }
  });
};

Post.findSingleById = (id, visitorId) => {
  return new Promise(async (resolve, reject) => {
    if (typeof id != 'string' || !ObjectID.isValid(id)) {
      reject();
      return;
    }
    let matchParameter = [{ $match: { _id: new ObjectID(id) } }];
    let posts = await Post.reusablePostQuery(matchParameter, visitorId);
    if (posts.length) resolve(posts[0]);
    else reject();
  });
};

//Retruns: posts
Post.findByAuthorId = authorId => {
  let matchParameters = [
    { $match: { author: authorId } },
    { $sort: { createdDate: -1 } },
  ];
  return Post.reusablePostQuery(matchParameters);
};

// Returns informações  sobre os posts segundo a busca
Post.reusablePostQuery = (uniqueOperations, visitorId) => {
  return new Promise(async (resolve, reject) => {
    let aggOperations = uniqueOperations.concat([
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDocument',
        },
      },
      {
        $project: {
          title: 1,
          body: 1,
          createdDate: 1,
          authorId: '$author',
          author: { $arrayElemAt: ['$authorDocument', 0] },
        },
      },
    ]);

    let posts = await postsCollection.aggregate(aggOperations).toArray();

    //Clean UP author property in each post object
    posts = posts.map(post => {
      post.isVisitorOwner = post.authorId.equals(visitorId);
      post.authorId = undefined; //Para esconder a informação do front-end enviada pelo JSON
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar,
      };
      return post;
    });
    resolve(posts);
  });
};

Post.countPostsByAuthor = function (id) {
  return new Promise(async (resolve, reject) => {
    let postCount = await postsCollection.countDocuments({ author: id });
    resolve(postCount);
  });
};

Post.getFeed = async id => {
  //creat an array of the user ids that the current user follows
  let followedUsers = await followsCollection
    .find({ authorId: new ObjectID(id) })
    .toArray();
  followedUsers = followedUsers.map(followDoc => followDoc.followedId);

  //loof for posts where the author is in the above array of follwed users
  let matchParameters = [
    { $match: { author: { $in: followedUsers } } },
    { $sort: { createdDate: -1 } },
  ];
  return Post.reusablePostQuery(matchParameters);
};

module.exports = Post;
