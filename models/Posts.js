const postsCollection = require('../db').db().collection('posts')
const ObjectID = require('mongodb').ObjectID
const User = require('./User')


//----Constructors

let Post = function (data, userid) {
    this.data = data
    this.errors = []
    this.userid = userid
    
}

// Prototypes
Post.prototype.create = function () {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            
            //insertOne returns a Promise. Podemos usar .then().catch() para assegurar conclusao do DB
            postsCollection.insertOne(this.data).then(() => {
                resolve('Post criado com sucesso')
            }).catch(() => {
                this.errors.push('Por favor, tente novamente mais tarde')
                reject(this.errors)
            })
        } else {
            reject(this.errors)
        }
    })   
}

Post.prototype.cleanUp = function () {
    if (typeof(this.data.title) != 'string') {this.data.title = ''} //Somente Strings
    if (typeof(this.data.body) != 'string') {this.data.body = ''} //Somente Strings
    
    // Get rid of any bogus propeties
    this.data = {
        title: this.data.title.trim(),
        body: this.data.body.trim(),
        createdDate: new Date(),
        author: ObjectID(this.userid)
    }
}

Post.prototype.validate = function () {
        if (this.data.title == "") {this.errors.push('O post precisa de um título')}
        if (this.data.body == "") {this.errors.push('O post precisa de conteúdo')}
        // ATENÇÃO: INSERIR PROTEÇÃO CONTRA HTML SCRIPTS (todoApp)
       
    }

Post.reusablePostQuery = function (uniqueOperations, visitorId) {
    return new Promise(async function (resolve, reject) {
        let aggOperations = uniqueOperations.concat([
            {$lookup: {from: "users", localField: 'author', foreignField: '_id', as: 'authorDocument'}},
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: '$author',
                author: {$arrayElemAt: ['$authorDocument', 0]}
            }}
        ])
        
        let posts = await postsCollection.aggregate(aggOperations).toArray()

        //Clean UP athor property in each post object
        posts = posts.map(function(post) {
            post.isVisitorOwner = post.authorId.equals(visitorId)
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        }) 
        resolve(posts)
    })
}

Post.findSingleById = function (id, visitorId) {
    return new Promise(async function (resolve, reject) {
        if (typeof(id) != 'string' || !ObjectID.isValid(id)) {
            reject()
            return
        }
        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId)
        if (posts.length) {
            resolve(posts[0])
        } else {
            reject()
        }
    })
}

Post.findByAuthorId = function (authorId) {
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}} // 1 Ascendente / -1 Descendente
    ])
}

module.exports = Post
