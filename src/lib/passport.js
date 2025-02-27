const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
    console.log(req.body);
    const rows = await pool.query('SELECT * FROM operario WHERE username = ?', [username]);
    if (rows.length > 0){
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.password);
        if(validPassword) {
            done(null, user, req.flash('success', 'Welcome' + user.username));
        } else {
            done(null, false, req.flash('message', 'Incorrect Password'));
        }
    } else {
        return done(null, false, req.flash('message', 'El usuario no existe'))
    }
}));

passport.use('local.signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
    const {fullname, email, confirm_password} = req.body;
    // Verificar si el nombre de usuario ya está en la base de datos
    const existingUser = await pool.query('SELECT * FROM operario WHERE username = ?', [username]);
    
    if (existingUser.length > 0) {
        // Si el nombre de usuario ya existe, devolver un error
        return done(null, false, req.flash('message', 'El nombre de usuario ya está en uso.'));
    }

    // Verificar si las contraseñas coinciden
    if (password !== confirm_password) {
        // Si no coinciden, devolver un error
        return done(null, false, req.flash('message', 'Las contraseñas no coinciden.'));
    } 

    // Determinar si el correo electrónico es de un admin (termina en @cfmacrodent.com)
    const role = email.endsWith('@cfmacrodent.com') ? 'admin' : 'user'; // Asignamos 'admin' si termina en @cfmacrodent.com, de lo contrario 'user'

    const newUser = { 
        username,
        password,
        fullname,
        email,
        role
    };
    
    newUser.password = await helpers.encryptPassword(password);
    const result = await pool.query('INSERT INTO operario SET ?', [newUser]);
    newUser.id_operario = result.insertId;
    return done(null, newUser);
}));

passport.serializeUser((user, done) => {
    done(null, user.id_operario);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {  // Busca al usuario en la base de datos por su id
      done(err, user);
    });
  });