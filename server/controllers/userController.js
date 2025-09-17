const { User } = require('../models');
const { comparePassword } = require('../helpers/formatter');
const { signToken } = require('../helpers/jwt');

class UserController {
  static async register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      const user = await User.create({ username, email, password });
      res.status(201).json({ id: user.id, username: user.username, email: user.email });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        const error = new Error('Invalid email or password');
        error.name = 'InvalidLogin';
        throw error;
      }
      

      const valid = comparePassword(password, user.password);
      if (!valid) {
        const error = new Error('Invalid email or password');
        error.name = 'InvalidLogin';
        throw error;
      }
      

      const access_token = signToken({ id: user.id, email: user.email });
      console.log(access_token);
      
      res.json({ access_token });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
