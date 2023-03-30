let Parser = require('rss-parser');
let parser = new Parser();
const database = require('./database.js')
const {v4: uuidv4} = require('uuid');

async function populatePosts() {
	let sources = await database.getAllSources();
	for (const source of sources) {
		let feed;
		console.log("[" + Date.now() + "] Fetching posts from source " + source.sourceUID)

		try {
			feed = await parser.parseURL(source.url);
		} catch (err) {
			validateSource(source.sourceUID, 0);
			return;
		}

		if (!source.valid)
			validateSource(source.sourceUID, 1);

		for (const item of feed.items) {
			let postUID = uuidv4();
			database.db.run('INSERT INTO posts (postUID, source, user, title, content, link, date, postGUID, public, read, publicDate) SELECT * FROM (SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0, 0, null) AS temp WHERE NOT EXISTS ( SELECT * FROM posts WHERE title = ?4 AND user = ?3 ) LIMIT 1;',
				[postUID, source.sourceUID, source.user, item.title, item.content, item.link, item.isoDate, item.guid])
		}
	}
}

function validateSource(sourceUID, valid) {
	database.db.run('UPDATE sources SET valid = ? WHERE sourceUID = ?', [valid, sourceUID], function (err) {
		if (err) {
			console.log(err.message);
		} else {
			console.log('Marked source ' + sourceUID + ' as ' + (valid ? "valid" : "invalid"));
		}
	})
}

module.exports = {
	populatePosts
};