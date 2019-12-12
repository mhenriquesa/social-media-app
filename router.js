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

// Post related routes
router.get('/create-post', userController.userMustBeLoggedIn, postController.viewCreateScreen)
router.post('/create-post', userController.userMustBeLoggedIn, postController.create)

//---------------------------------------
module.exports = router
