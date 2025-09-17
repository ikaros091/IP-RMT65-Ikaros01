const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

const signToken = (payLoad) => {
    return jwt.sign(payLoad, JWT_SECRET)
}

const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET)
}

module.exports = {signToken, verifyToken}