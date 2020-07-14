const express = require('express');
const router = require('./router');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const markdown = require('marked');
const sanitize = require('sanitize-html');
const csrf = require('csurf')
const api = require('./router.api');
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//API
app.use('/api' , api)

//Config Sessions on DB
let sessionOptions = session({
  secret: 'woeifowiejf',
  store: new MongoStore({ client: require('./db') }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
});

// Habilita o servidor a acessar a pasta views
// com os HTMLs na extensão .ejs
//---------------------------------
app.set('views', 'views');
app.set('view engine', 'ejs');
//---------------------------------

app.use(sessionOptions);
app.use(flash());


app.use(express.static('public'));

app.use((req, res, next) => {
  //Make our markdown available from all ejs templates
  res.locals.filterUserHTML = content =>
    sanitize(markdown(content), {
      allowedTags: ['p','br','ul', 'ol','li', 'strong','i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5','h6',],
      allowedAttributes: {},
    });

  // Make all error and success flash messages available fron all ejs templates
  res.locals.errors = req.flash('errors');
  res.locals.success = req.flash('success');

  // ID do usuario atual disponivel no req object
  if (req.session.user) req.visitorId = req.session.user._id;
  else req.visitorId = 0;

  // Permite os EJS templates ter acesso as informações do user quando logado
  res.locals.user = req.session.user;

  next();
});

//Protection against cross-site request forgery attcks
app.use(csrf())

app.use(function(req, res, next) {
  res.locals.csrfToken = req.csrfToken()
  next()
})
//-----------

//Routers
app.use('/', router);

// Protection against cross-site request forgery attacks
app.use(function(err, req, res, next) {
  if (err) {
    if (err.code == "EBADCSRFTOKEN") {
      req.flash('errors', "Cross site request forgery detected.")
      req.session.save(() => res.redirect('/'))
    } else {
      res.render("404")
    }
  }
})
//----------------------

const server = require('http').createServer(app);

const io = require('socket.io')(server);

//Permite adicionar informações sobre a session ao socket
io.use(function (socket, next) {
  sessionOptions(socket.request, socket.request.res, next)
})

//Start socket.io
io.on('connection', (socket) => {
  if(socket.request.session.user) {
    let user = socket.request.session.user
    
    // send event called 'welcome' passing session user informations
    socket.emit('welcome', {username: user.username, avatar: user.avatar})

    socket.on('chatMessageFromBrowser', function (data) {
      socket.broadcast.emit('chatMessageFromServer', {
        message: sanitize(data.message, { allowedTags: [], allowedAttributes: {} }),
        username: user.username,
        avatar: user.avatar,
      });
    });
  }
})

module.exports = server;
