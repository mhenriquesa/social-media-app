const usersCollection = require('../db').db().collection('posts')
const ObjectID = require('mongodb').ObjectID


//----Constructors

let Post = function (data, userId) {
    this.data = data
    this.errors = []
    this.userId = userId
    
}

// Prototypes
Post.prototype.create = function () {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            
            //insertOne returns a Promise. Podemos usar .then().catch() para assegurar conclusao do DB
            usersCollection.insertOne(this.data).then(() => {
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
        author: ObjectID(this.userId)
    }
}

Post.prototype.validate = function () {
        if (this.data.title == "") {this.errors.push('O post precisa de um título')}
        if (this.data.body == "") {this.errors.push('O post precisa de conteúdo')}
        // ATENÇÃO: INSERIR PROTEÇÃO CONTRA HTML SCRIPTS (todoApp)
       
    }

module.exports = Post
