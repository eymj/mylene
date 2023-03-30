const express = require("express");
const path = require('path');
const {v4: uuidv4} = require('uuid');
const crypto = require('crypto');
const database = require('./database.js')
const utils = require('./utils.js')
const passport = require('./passport.js')
const parser = require('./parser.js')

require('dotenv').config();

const PORT = process.env.PORT || 3222;

const app = express();
app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.use(passport.initialize());

// USER API

app.post('/api/user/login', (req, res, next) => {
	passport.authenticate('local', {session: false}, (error, user, info) => {
		if (error || !user) {
			return res.status(400).json(info)
		}
		return res.status(200).json({token: utils.generateToken(user.userUID, 604800000)}); // 7 days);
	})(req, res);
});

app.get('/api/user', (req, res, next) => {
	passport.authenticate('jwt', {session: false}, (error, user, info) => {
		if (error || !user) {
			return res.status(400).json(info)
		}
		return res.status(200).json({'username': user.username, 'userUID': user.userUID});
	})(req, res);
});

app.post('/api/user', function (req, res) {
	let username = req.body["username"]
	let password = req.body["password"]
	let mail = req.body["email"]
	if (!username || !password || !mail) {
		return res.status(400).json({message: 'Missing credentials.'})
	}
	if (!utils.validateEmail(mail)) {
		return res.status(400).json({message: 'Invalid mail.'})
	}
	database.findUserByName(username).then((result) => {
		if (result) {
			return res.status(400).json({message: 'Account already exists.'})
		}
	})
	database.findUserByMail(mail).then((result) => {
		if (result) {
			return res.status(400).json({message: 'Account already exists.'})
		}
	})
	let hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
	let userUID = uuidv4();
	database.db.run('INSERT INTO users (userUID, username, password, mail) VALUES (?, ?, ?, ?)', [userUID, username, hashedPassword, mail], function (err) {
		if (err) {
			console.log(err.message);
			return res.status(500).json({message: 'Account creation failed.'})
		} else {
			console.log('Successfully created user ' + userUID);
			return res.status(200).json({message: 'Account creation successful.'});
		}
	})
});

// USER SOURCES API

app.get('/api/user/sources', (req, res, next) => { // GET
	passport.authenticate('jwt', {session: false}, (error, user, info) => {
		database.getUserSources(user.userUID).then(sources => {
			if (error || !user) {
				return res.status(400).json(info)
			}
			return res.status(200).json({'sources': sources});
		})
	})(req, res);
});

app.post('/api/user/sources', (req, res, next) => { // INSERT
	passport.authenticate('jwt', {session: false}, (error, user, info) => {
		if (error || !user) {
			return res.status(400).json(info)
		}
		console.log(req.body)
		let url = req.body["url"]
		if (!utils.isValidUrl(url)) {
			return res.status(400).json({message: 'Invalid URL.'});
		}
		let title = req.body["title"]
		let sourceUID = uuidv4();
		database.db.run('INSERT INTO sources (sourceUID, user, url, title, valid) VALUES (?, ?, ?, ?, 1)', [sourceUID, user.userUID, url, title], function (err) {
			if (err) {
				console.log(err.message);
				return res.status(500).json({message: 'Source creation failed.'});
			} else {
				console.log('Successfully added source ' + sourceUID + ' to user ' + user.userUID);
				return res.status(200).json({message: 'Source creation successful.'});
			}
		})
	})(req, res);
});

app.put('/api/user/sources/:id', (req, res, next) => { // UPDATE
	passport.authenticate('jwt', {session: false}, (error, user, info) => {
		if (error || !user) {
			return res.status(400).json(info)
		}
		let sourceUID = req.params.id
		let title = req.body["title"]
		let url = req.body["url"]
		database.db.run('UPDATE sources SET title = ?, url = ? WHERE sourceUID = ?', [title, url, sourceUID], function (err) { // Let's assume the source is valid for now
			if (err) {
				console.log(err.message);
				return res.status(500).json({message: 'Edit request failed.'});
			} else {
				console.log('Edited source ' + sourceUID + ' from user ' + user.userUID);
				return res.status(200).json({message: 'Source edition successful.'});
			}
		})
	})(req, res);
});

app.delete('/api/user/sources/:id', (req, res, next) => { // DELETE
	passport.authenticate('jwt', {session: false}, (error, user, info) => {
		if (error || !user) {
			return res.status(400).json(info)
		}
		let sourceUID = req.params.id
		database.db.run('DELETE FROM sources WHERE sourceUID = ?', [sourceUID], function (err) {
			if (err) {
				console.log(err.message);
				return res.status(500).json({message: 'Delete request failed.'});
			} else {
				console.log('Deleted source ' + sourceUID + ' to user ' + user.userUID);
				return res.status(200).json({message: 'Source deletion successful.'});
			}
		})
	})(req, res);
});

// USER POSTS API

app.put('/api/user/posts/:id', (req, res, next) => { // UPDATE
	passport.authenticate('jwt', {session: false}, (error, user, info) => {
		if (error || !user) {
			return res.status(400).json(info)
		}
		let postUID = req.params.id
		let isPublic = req.body["public"]
		database.db.run('UPDATE posts SET public = ?, publicDate = ? WHERE postUID = ? AND user = ?', [isPublic, Date.now(), postUID, user.userUID], function (err) {
			if (err) {
				console.log(err.message);
				return res.status(500).json({message: 'Edit request failed.'});
			} else {
				console.log('Edited source ' + postUID + ' from user ' + user.userUID);
				return res.status(200).json({message: 'Post edition successful.'});
			}
		})
	})(req, res);
});

app.get('/api/user/posts', (req, res, next) => { // GET
	passport.authenticate('jwt', {session: false}, (error, user, info) => {
		database.getUserPosts(user.userUID).then(posts => {
			if (error || !user) {
				return res.status(400).json(info)
			}
			return res.status(200).json({'posts': posts});
		})
	})(req, res);
});

app.get('/api/posts', (req, res, next) => { // GET
	database.getPublicPosts().then(posts => {
		return res.status(200).json({'posts': posts});
	});
});

setInterval(() => parser.populatePosts(), 300000)

app.use(express.static(path.resolve(__dirname, '../client/build')));

app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Server listening on ${PORT}`);
});
