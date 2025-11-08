const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

// Game Schema
const gameSchema = new mongoose.Schema({
    gameId: { type: String, required: true, unique: true },
    player1Ready: { type: Boolean, default: false },
    player2Ready: { type: Boolean, default: false },
    gameStarted: { type: Boolean, default: false },
    currentTurn: { type: Number, default: 1 },
    winner: { type: Number, default: null },
    player1Number: { type: String, default: null },
    player2Number: { type: String, default: null },
    player1History: { type: Array, default: [] },
    player2History: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now, expires: 86400 }
});

const Game = mongoose.model('Game', gameSchema);

// API Routes

// Create new game
app.post('/api/game/create', async(req, res) => {
    try {
        const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const game = new Game({ gameId });
        await game.save();
        res.json({ gameId, playerId: 1 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Join game
app.post('/api/game/join', async(req, res) => {
    try {
        const { gameId } = req.body;
        const game = await Game.findOne({ gameId: gameId.toUpperCase() });

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (game.player2Ready) {
            return res.status(400).json({ error: 'Game is full' });
        }

        res.json({ gameId: game.gameId, playerId: 2 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Submit secret number
app.post('/api/game/submit-number', async(req, res) => {
    try {
        const { gameId, playerId, number } = req.body;
        const game = await Game.findOne({ gameId });

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (playerId === 1) {
            game.player1Number = number;
            game.player1Ready = true;
        } else {
            game.player2Number = number;
            game.player2Ready = true;
        }

        if (game.player1Ready && game.player2Ready) {
            game.gameStarted = true;
        }

        await game.save();
        res.json({ success: true, gameStarted: game.gameStarted });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get game state
app.get('/api/game/:gameId', async(req, res) => {
    try {
        const game = await Game.findOne({ gameId: req.params.gameId });

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        res.json(game);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Make a guess
app.post('/api/game/guess', async(req, res) => {
    try {
        const { gameId, playerId, guess } = req.body;
        const game = await Game.findOne({ gameId });

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Get opponent's number
        const opponentNumber = playerId === 1 ? game.player2Number : game.player1Number;

        // Calculate match
        let digitsMatched = 0;
        let placesMatched = 0;

        const guessArr = guess.split('');
        const secretArr = opponentNumber.split('');

        for (let i = 0; i < 4; i++) {
            if (guessArr[i] === secretArr[i]) {
                placesMatched++;
            }
        }

        const secretCounts = {};
        const guessCounts = {};

        for (let i = 0; i < 4; i++) {
            secretCounts[secretArr[i]] = (secretCounts[secretArr[i]] || 0) + 1;
            guessCounts[guessArr[i]] = (guessCounts[guessArr[i]] || 0) + 1;
        }

        for (let digit in guessCounts) {
            if (secretCounts[digit]) {
                digitsMatched += Math.min(guessCounts[digit], secretCounts[digit]);
            }
        }

        const guessRecord = { guess, digitsMatched, placesMatched };

        // Save guess history
        if (playerId === 1) {
            game.player1History.push(guessRecord);
        } else {
            game.player2History.push(guessRecord);
        }

        // Check for winner
        if (placesMatched === 4) {
            game.winner = playerId;
        } else {
            // Switch turn
            game.currentTurn = playerId === 1 ? 2 : 1;
        }

        await game.save();

        res.json({
            guessRecord,
            winner: game.winner,
            currentTurn: game.currentTurn
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});