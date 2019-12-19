const usersCollection = require('../db').db().collection('users')
const followsCollection = require('../db').db().collection('follows')
const ObjectId = require('mongodb').ObjectID
const User = require('./User')
 
//Constructor
let Follow = function (followedUsername, authorId) {
  this.followedUsername = followedUsername
  this.authorId = authorId
  this.errors = []
}
//Prototypes

Follow.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate('create')
    if (!this.errors.length) {
       await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
       resolve()
    } else {
      reject(this.errors)
    }
  })
}

Follow.prototype.delete = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate('delete')
    if (!this.errors.length) {
       await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)})
       resolve()
    } else {
      reject(this.errors)
    }
  })
}

Follow.prototype.cleanUp = function() {
  if (typeof(this.followedUsername) != 'string') {this.followedUsername = ''}
}

//Regras para seguir e deixar de seguir uma conta
Follow.prototype.validate = async function(action) {
  // Validação de usuário
  //Busca no DB se usuario existe
  let visitedAccount = await usersCollection.findOne({username: this.followedUsername})
  
  // Se usuario existir, definir o ID da conta seguida igual o ID do usuario
  if (visitedAccount)  this.followedId = visitedAccount._id
  else this.errors.push('You cannot follow a user that does not exist.')
  //------------

  // Validação de Follow
  //Busca no DB se existe um Follow e guarda resultado em variable
  let followAlreadyExist = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)}) 
  
  // Se voce quer seguir e se ja segue
  if (action === 'create') if (followAlreadyExist) this.errors.push('Voce já segue este username')
  
  // Se voce quer deixar de seguir e se não segue
  if (action === 'delete') if (!followAlreadyExist) this.errors.push('Voce NÃO segue este username')
  
  // Se voce tentar seguir voce mesmo
  if (this.followedId.equals(this.authorId)) this.errors.push('Voce não pode sequir você mesmo')

}
//--------------------------

// Methods

//Returns boolean
Follow.isVisitorFollowing = async function (followedId, visitorId) {
  let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectId(visitorId)})
  if (followDoc) return true 
  else return false
}

Follow.getFollowersById = function (id) {
  return new Promise(async (resolve, reject) => {
    
    try {
      let operations = [
        {$match: {followedId: id}},
        {$lookup: {from: 'users', localField: 'authorId', foreignField: '_id', as: 'userDoc'}},
        {$project: {
          username: {$arrayElemAt: ['$userDoc.username', 0]},
          email: {$arrayElemAt: ['$userDoc.email', 0]},
        }}
      ]
      let followers = await followsCollection.aggregate(operations).toArray()
      
      followers = followers.map((follower) => {
        let user = new User(follower, true)
        return {username: follower.username, avatar: user.avatar}
      })
      resolve(followers)
    }
    catch {
      reject()

    }

  })
}

Follow.getFollowingById = function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      let operations = [
        {$match: {authorId: id}},
        {$lookup: {from: 'users', localField: 'followedId', foreignField: '_id', as: 'userDoc'}},
        {$project: {
          username: {$arrayElemAt: ['$userDoc.username', 0]},
          email: {$arrayElemAt: ['$userDoc.email', 0]},
        }}
      ]
      let followers = await followsCollection.aggregate(operations).toArray()
      
      followers = followers.map((follower) => {
        let user = new User(follower, true)
        return {username: follower.username, avatar: user.avatar}
      })
      resolve(followers)
    }
    catch {
      reject()
    }
  })
}

Follow.countFollowingById = function (id) {
  return new Promise(async (resolve,reject) => {
    let followingCount = await followsCollection.countDocuments({authorId: id})
    resolve(followingCount)  
  })
}

Follow.countFollowersById = function (id) {
  return new Promise(async (resolve,reject) => {
    let followersCount = await followsCollection.countDocuments({followedId: id})
    resolve(followersCount)
  })
}

module.exports = Follow