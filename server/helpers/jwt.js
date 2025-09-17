const jwt = require('jsonwebtoken')

// fallback secret for test/dev when .env isn't loaded in the test runner
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-for-tests'

const signToken = (payLoad) => {
    return jwt.sign(payLoad, JWT_SECRET)
}

const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET)
}

module.exports = {signToken, verifyToken}