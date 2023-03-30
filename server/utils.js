const jwt = require('jsonwebtoken')
const crypto = require('crypto');

const validateEmail = (email) => {
	return String(email)
		.toLowerCase()
		.match(
			/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		);
};

const isValidUrl = urlString => {
	const urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
		'(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
		'(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
	return !!urlPattern.test(urlString);
}

function hashPassword(password) {
	return crypto.createHash('sha256').update(password).digest('hex')
}

function generateToken(userUID, expiresIn) {
	const payload = {sub: userUID, exp: Math.floor(Date.now() / 1000) + expiresIn};
	return jwt.sign(payload, process.env.JWT_SECRET_KEY);
}

function validatePassword(password, hashedPassword) {
	return hashPassword(password) === hashedPassword;
}

module.exports = {
	validatePassword,
	generateToken,
	hashPassword,
	isValidUrl,
	validateEmail
};