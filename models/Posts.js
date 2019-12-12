const validator = require('validator')
const usersCollection = require('../db').db().collection('posts')
const md5 = require('md5')

//----Constructors

let Post = function (data) {
    this.data = data
    this.errors = []
}

// Prototypes
Post.prototype.create = function () {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        if (!this.errors.length) {
            //Save post into DB
            usersCollection.insertOne(this.data)
            resolve('Post criado com sucesso')
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
        createdDate: new Date()
    }

}

Post.prototype.validate = function () {
        if (this.data.title == "") {this.errors.push('O post precisa de um título')}
        if (this.data.body == "") {this.errors.push('O post precisa de conteúdo')}
        // ATENÇÃO: INSERIR PROTEÇÃO CONTRA HTML SCRIPTS (todoApp)
       
    }

module.exports = Post
