const express = require('express')
const app = express()
const router = require('./router')

app.use(express.urlencoded({extended: false}))  // acesso a dados do user pelo body do elemento
app.use(express.json())

app.use(express.static('public'))               //permitir acesso a pasta public
app.set('views', 'views')
app.set('view engine', 'ejs')                   

app.use('/', router)                            // Link do Router

app.listen(3000)