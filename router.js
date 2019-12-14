const express = require('express')
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
//---------------------------------------
const router = express.Router()

// User related routes
router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

//Profile relaed routes
router.get('/profile/:username', userController.ifUserExists, userController.profilePostsScreen)

// Post related routes
router.get('/create-post', userController.userMustBeLoggedIn, postController.viewCreateScreen)
router.post('/create-post', userController.userMustBeLoggedIn, postController.create)
router.get('/post/:id', postController.viewSingle)
router.get('/post/:id/edit', postController.viewEditScreen)

//---------------------------------------
module.exports = router
