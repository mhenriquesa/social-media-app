const dotenv = require('dotenv');
const mongodb = require('mongodb');
//--------------------------------
dotenv.config();
let accessDb = process.env.CONNECTIONSTRING;
let optionsDb = { useNewUrlParser: true, useUnifiedTopology: true };

mongodb.connect(accessDb, optionsDb, (err, client) => {
  module.exports = client;
  const app = require('./app');
  app.listen(process.env.PORT);
});
