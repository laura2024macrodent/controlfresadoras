const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const passport = require('passport');
const helpers = require('./lib/handlebars'); 
// mysql://root:XkARfnmSAEXGewKDrrIJzVOPvtYDbSKy@yamabiko.proxy.rlwy.net:13917/railway
const {database} = require('./keys');

const app = express();
require('./lib/passport');

const {PORT} = require('./config');

app.use(methodOverride('_method'));
app.set('port', PORT);
app.set('views', path.join(__dirname, 'views'))
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: helpers
}));
app.set('view engine', 'hbs');

const sessionStore = new MySQLStore(database);

app.use(session({
    secret: 'bloquescreadosporoperarios',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
}));
app.use(flash());
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    app.locals.user = req.user;
    next();
});

app.use(require('./routes'));
app.use(require('./routes/authentication'));
app.use('/bloque', require('./routes/bloque'));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});