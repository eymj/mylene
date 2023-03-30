const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('local.db', (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log('Connected to SQLite database.');
});

db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, userUID TEXT NOT NULL,username TEXT NOT NULL,mail TEXT NOT NULL,password TEXT NOT NULL);');
db.run('CREATE TABLE IF NOT EXISTS sources (id INTEGER PRIMARY KEY AUTOINCREMENT, sourceUID TEXT NOT NULL, user TEXT NOT NULL, url TEXT NOT NULL,title TEXT NOT NULL, valid INTEGER NOT NULL);');
db.run('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, postUID TEXT, source TEXT, user TEXT, title TEXT, content TEXT, link TEXT, date TEXT, postGUID TEXT, public INTEGER, read INTEGER, publicDate TEXT);');

function findUserByName(username) {
	return FindInDB(`SELECT *
					 FROM users
					 WHERE username = ?`, [username])
}

function findUserByMail(mail) {
	return FindInDB(`SELECT *
					 FROM users
					 WHERE mail = ?`, [mail])
}

function findUserById(userUID) {
	return FindInDB(`SELECT *
					 FROM users
					 WHERE userUID = ?`, [userUID])
}

function getUserSources(userUID) {
	return FindArrayInDB(`SELECT *
						  FROM sources
						  WHERE user = ?`, [userUID])
}

function getUserPosts(userUID) {
	return FindArrayInDB(`SELECT *
						  FROM posts
						  WHERE user = ?
						  ORDER BY date DESC`, [userUID])
}

function getPublicPosts() {
	return FindArrayInDB(`SELECT *
						  FROM posts
						  WHERE public = 1
						  ORDER BY publicDate DESC`, [])
}

function getAllSources() {
	return FindArrayInDB(`SELECT *
						  FROM sources`, [])
}

function FindInDB(query, params) {
	return new Promise((resolve, reject) => {
		db.get(query, params, (err, row) => {
			if (err) {
				reject(err);
			} else if (!row) {
				resolve(null);
			} else {
				resolve(row);
			}
		});
	});
}

function FindArrayInDB(query, params) {
	return new Promise((resolve, reject) => {
		let queries = []
		db.each(query, params, (err, row) => {
			if (err) {
				reject(err);
			} else {
				queries.push(row); // accumulate the data
			}
		}, (err, n) => {
			if (err) {
				reject(err); // optional: again, you might choose to swallow this error.
			} else {
				resolve(queries); // resolve the promise
			}
		});
	});
}

module.exports = {
	db,
	getUserSources,
	getUserPosts,
	getPublicPosts,
	getAllSources,
	findUserById,
	findUserByMail,
	findUserByName
};