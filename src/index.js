import app from './server.js';

const PORT = process.env.PORT || 8000;

// Entry point of the application..
app.listen(PORT, () => {
    console.log(`The server is running smoothly on port ${PORT}`);
});
