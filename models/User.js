const bcrypt = require('bcryptjs')
const validator = require('validator')
const usersCollection = require('../db').db().collection('users')
const md5 = require('md5')


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
                this.data = attemptedUser
                this.getAvatar()
                resolve('Congrats')
            } else {
                reject("User ou pass invalid")
            }
        }).catch(function () {
            reject('Please try again later')
        })
    })
}

User.prototype.register = async function () {
    return new Promise(async (resolve, reject) => {
        // Step 1: Validate data
        this.cleanUp()
        await this.validate()
        //Step 2: Only if there are no validatation erros
        // then save the user data into a database
        if (!this.errors.length) {
            // Hash user password
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            usersCollection.insertOne(this.data)
            this.getAvatar()
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

User.prototype.getAvatar = function () {
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
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
    return new Promise (async (resolve, reject) => {
        if (this.data.username == "") {this.errors.push('Voce deve ter um username')}
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push('Username pode ser somente letras e numeros')}
        if (!validator.isEmail(this.data.email)) {this.errors.push('Voce deve ter um email válido')}
        if (this.data.password == "") {this.errors.push('Voce deve ter um password')}
        if (this.data.password.length > 0 && this.data.password.length <12 ) {this.errors.push('Password com no mminimo 12 caracteres')}
        if (this.data.password.length > 50) {this.errors.push('Password com no maximo 50 caracteres')}
        if (this.data.username.length > 0 && this.data.username.length <3 ) {this.errors.push('Username com no minimo 3 caracteres')}
        if (this.data.username.length > 30) {this.errors.push('Username com no maximo 30 caracteres')}
    
        // Only if username is valid then check to see if its already taken
        if (this.data.username.length >2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
            let usernameExists = await usersCollection.findOne({username: this.data.username})
            if (usernameExists) { this.errors.push('Username já existe. Tente outro...') }
        }
        // Only if email is valid then check to see if its already taken
        if (validator.isEmail(this.data.email)) {
            let emailExists = await usersCollection.findOne({email: this.data.email})
            if (emailExists) { this.errors.push('Email já utilizado. :-( ') }
        }
        resolve()
    })
}

//--- Notas -------
/*
await so pode ser usado se a função retornar uma promise e se estiver dentro de uma async function
*/

//----------Exports--------------------------
module.exports = User