const bcrypt = require('bcryptjs')
const validator = require('validator')
const usersCollection = require('../db').db().collection('users')


//-----------Constructors-------------------------
let User = function (data) {
    this.data = data
    this.errors =[]
}

//-------------Prototypes---------------------------
User.prototype.login = function () {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        usersCollection.findOne({username: this.data.username}).then((attemptedUser) => {
            if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                resolve('Congrats')
            } else {
                reject("User ou pass invalid")
            }
        }).catch(function () {
            reject('Please try again later')
        })
    })
}

User.prototype.register = function () {
    // Step 1: Validate data
    this.cleanUp()
    this.validate()
    //Step 2: Only if there are no validatation erros
    // then save the user data into a database
    if (!this.errors.length) {
        // Hash user password
        let salt = bcrypt.genSaltSync(10)
        this.data.password = bcrypt.hashSync(this.data.password, salt)
        usersCollection.insertOne(this.data)
    }

}

//-------------Cleaning up and Validation Data-----------------
User.prototype.cleanUp = function () {
    if (typeof(this.data.username) != 'string') {this.data.username = ''}
    if (typeof(this.data.email) != 'string') {this.data.email = ''}
    if (typeof(this.data.password) != 'string') {this.data.password = ''}

    //get rid of any bogus propeties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate = function () {
    if (this.data.username == "") {this.errors.push('Voce deve ter um username')}
    if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push('Username pode ser somente letras e numeros')}
    if (!validator.isEmail(this.data.email)) {this.errors.push('Voce deve ter um email válido')}
    if (this.data.password == "") {this.errors.push('Voce deve ter um password')}
    if (this.data.password.length > 0 && this.data.password.length <12 ) {this.errors.push('Password com no mminimo 12 caracteres')}
    if (this.data.password.length > 50) {this.errors.push('Password com no maximo 50 caracteres')}
    if (this.data.username.length > 0 && this.data.username.length <3 ) {this.errors.push('Username com no minimo 3 caracteres')}
    if (this.data.username.length > 30) {this.errors.push('Username com no maximo 30 caracteres')}

}

//----------Exports--------------------------
module.exports = User