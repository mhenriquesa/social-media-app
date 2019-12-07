const dotenv = require('dotenv')
const mongodb = require('mongodb')
//--------------------------------
dotenv.config()

//Estabelecer conexão com o mongodb e exportar acesso ao database
//Importar express() para dentro da função e acionar o listener
mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, client) {
   module.exports = client
   const app = require('./app')
   app.listen(process.env.PORT)
})