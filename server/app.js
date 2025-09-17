require('dotenv').config();
const router = require('./routers');
const errorHandler = require('./middlewares/errorHandler');
const express = require('express');
const UserController = require('./controllers/userController');
const authentication = require('./middlewares/authentication');
const Controller = require('./controllers');
const model = require('./helpers/gemini');
const RecommendationController = require('./controllers/recommendationController');
const app = express();


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
app.get('/animes/:id', Controller.AnimeById)
app.use(authentication)

// MyList routes (requires authentication)
app.post('/mylist', Controller.addToList)
app.get('/mylist', Controller.getMyList)
app.get('/mylist/:id', Controller.getMyListById)
app.put('/mylist/:id', Controller.updateMyList)
app.delete('/mylist/:id', Controller.deleteMyList)

// DEBUG: list available AI models (remove in production)
app.get('/debug/models', async (req, res) => {
  try {
    const models = await require('./helpers/gemini').listAvailableModels();
    res.json({ models });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// error handler should be the last middleware
app.use(errorHandler);




module.exports = app