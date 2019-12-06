const express = require('express')
const router = require('./router')
//---------------------------------------------------------
const app = express()

app.use(express.urlencoded({extended: false}))  // acesso a dados do user pelo body do elemento
app.use(express.json())
app.use(express.static('public'))              //permitir acesso a pasta public
app.use('/', router) 

app.set('views', 'views')
app.set('view engine', 'ejs')                   

module.exports = app