require('dotenv').config();
// Trỏ đúng vào thư mục src/app
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`>>> Server is running at: http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
    server.close(() => {
        console.log('\n>>> Server closed.');
        process.exit(0);
    });
});