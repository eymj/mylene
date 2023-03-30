const passport = require('passport');
const {Strategy: JwtStrategy, ExtractJwt} = require('passport-jwt');
const LocalStrategy = require('passport-local');
const database = require('./database')
const utils = require('./utils.js')

require('dotenv').config();

passport.use(new LocalStrategy(function (username, password, done) {
		database.findUserByName(username).then(user => {
				if (!user || !utils.validatePassword(password, user.password)) {
					return done(null, false, {message: 'Invalid username or password.'});
				}
				return done(null, user, {message: 'Successfully authenticated'});
			}
		);
	}
));

passport.use(new JwtStrategy({
		jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
		secretOrKey: process.env.JWT_SECRET_KEY
	},
	function (jwt_payload, done) {
		database.findUserById(jwt_payload.sub).then(user => {
				const now = Math.floor(Date.now() / 1000);
				if (!user) {
					return done(null, false);
				}
				if (jwt_payload.exp && jwt_payload.exp < now) {
					return done(null, false, {message: 'Token has expired'});
				}
				return done(null, user, {message: 'Successfully authenticated'});
			}
		);
	}));

module.exports = passport