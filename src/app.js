const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Gắn toàn bộ API routes với tiền tố /api
app.use('/api', routes);

// Middleware xử lý 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint không tồn tại' });
});

module.exports = app;