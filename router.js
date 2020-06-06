const express = require('express')
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')
//---------------------------------------
const router = express.Router()

// User related routes
router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

//Profile relaed routes
router.get('/profile/:username', userController.ifUserExists, 
userController.sharedProfileData, userController.profilePostsScreen)

router.get('/profile/:username/followers', userController.ifUserExists, 
userController.sharedProfileData, userController.profileFollowersScreen)

router.get('/profile/:username/following', userController.ifUserExists, 
userController.sharedProfileData, userController.profileFollowingScreen)

// Post related routes

router.post('/search', postController.search)
router.get('/post/:id', postController.viewSingle)
router.get('/create-post', userController.userMustBeLoggedIn, postController.viewCreateScreen)
router.post('/create-post', userController.userMustBeLoggedIn, postController.create)
router.get('/post/:id/edit', userController.userMustBeLoggedIn, postController.viewEditScreen)
router.post('/post/:id/edit', userController.userMustBeLoggedIn, postController.edit)
router.post('/post/:id/delete', userController.userMustBeLoggedIn, postController.delete)

//Follow related 
router.post('/addFollow/:username', userController.userMustBeLoggedIn, 
followController.addFollow)

router.post('/removeFollow/:username', userController.userMustBeLoggedIn, 
followController.removeFollow)

//---------------------------------------
module.exports = router
