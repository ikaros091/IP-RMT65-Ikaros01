require('dotenv').config();
const router = require('./routers');
const errorHandler = require('./middlewares/errorHandler');
const express = require('express');
const UserController = require('./controllers/userController');
const authentication = require('./middlewares/authentication');
const Controller = require('./controllers');
const app = express();
const port = 3000;


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/', router);


app.post('/login', UserController.login)
app.post('/register', UserController.register)
// public anime listing
app.get('/animes', Controller.AnimeList)
app.use(authentication)
// error handler should be the last middleware
app.use(errorHandler);


app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});