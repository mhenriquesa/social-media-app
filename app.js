const express = require('express');
const router = require('./router');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const markdown = require('marked');
const sanitize = require('sanitize-html');

const app = express();

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
app.use(express.urlencoded({ extended: false })); // acesso a dados do user pelo body do elemento
app.use(express.json());
app.use(express.static('public')); //permitir acesso a pasta public
app.use((req, res, next) => {
  //Make our markdown available from all ejs templates
  res.locals.filterUserHTML = content =>
    sanitize(markdown(content), {
      allowedTags: [
        'p',
        'br',
        'ul',
        'ol',
        'li',
        'strong',
        'i',
        'em',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
      ],
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

app.use('/', router);

module.exports = app;
