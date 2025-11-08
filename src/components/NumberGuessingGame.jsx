import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, Copy, Check, Users } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://my-project1-s19k.onrender.com';

export default function OnlineNumberGuessingGame() {
    const [gameState, setGameState] = useState('menu');
    const [gameId, setGameId] = useState('');
    const [joinGameId, setJoinGameId] = useState('');
    const [playerId, setPlayerId] = useState(null);
    const [playerNumber, setPlayerNumber] = useState('');
    const [currentGuess, setCurrentGuess] = useState('');
    const [guessHistory, setGuessHistory] = useState([]);
    const [opponentReady, setOpponentReady] = useState(false);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [winner, setWinner] = useState(null);
    const [opponentNumber, setOpponentNumber] = useState(null);
    const [copied, setCopied] = useState(false);
    const [waitingForOpponent, setWaitingForOpponent] = useState(false);

    // Poll for game updates
    useEffect(() => {
        if (gameId && playerId && (gameState === 'setup' || gameState === 'playing')) {
            const interval = setInterval(() => {
                fetchGameState();
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [gameId, playerId, gameState]);

    const fetchGameState = async () => {
        try {
            const response = await fetch(`${API_URL}/game/${gameId}`);
            const game = await response.json();

            if (game.gameStarted && gameState === 'setup') {
                setOpponentReady(true);
                setGameState('playing');
            }

            if (gameState === 'playing') {
                setIsMyTurn(game.currentTurn === playerId);

                // Update guess history
                const history = playerId === 1 ? game.player1History : game.player2History;
                setGuessHistory(history);

                // Check for winner
                if (game.winner) {
                    setWinner(game.winner);
                    const oppNumber = playerId === 1 ? game.player2Number : game.player1Number;
                    setOpponentNumber(oppNumber);
                    setGameState('finished');
                }
            } else if (gameState === 'setup') {
                setOpponentReady(game.player1Ready && game.player2Ready);
            }
        } catch (error) {
            console.error('Error fetching game state:', error);
        }
    };

    const createGame = async () => {
        try {
            const response = await fetch(`${API_URL}/game/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            setGameId(data.gameId);
            setPlayerId(data.playerId);
            setGameState('setup');
        } catch (error) {
            alert('Error creating game. Make sure the backend server is running!');
            console.error(error);
        }
    };

    const joinGame = async () => {
        if (!joinGameId) {
            alert('Please enter a game ID!');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/game/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId: joinGameId.toUpperCase() })
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error);
                return;
            }

            const data = await response.json();
            setGameId(data.gameId);
            setPlayerId(data.playerId);
            setGameState('setup');
        } catch (error) {
            alert('Error joining game. Make sure the backend server is running!');
            console.error(error);
        }
    };

    const submitNumber = async () => {
        if (!/^\d{4}$/.test(playerNumber)) {
            alert('Please enter exactly 4 digits!');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/game/submit-number`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId, playerId, number: playerNumber })
            });

            const data = await response.json();

            if (data.gameStarted) {
                setOpponentReady(true);
                setGameState('playing');
                setIsMyTurn(playerId === 1);
            } else {
                setWaitingForOpponent(true);
            }
        } catch (error) {
            alert('Error submitting number!');
            console.error(error);
        }
    };

    const makeGuess = async () => {
        if (!/^\d{4}$/.test(currentGuess)) {
            alert('Please enter exactly 4 digits!');
            return;
        }

        if (!isMyTurn) {
            alert('Wait for your turn!');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/game/guess`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId, playerId, guess: currentGuess })
            });

            const data = await response.json();

            setGuessHistory([...guessHistory, data.guessRecord]);

            if (data.winner) {
                setWinner(data.winner);
                fetchGameState(); // Get opponent's number
                setGameState('finished');
            } else {
                setIsMyTurn(false);
            }

            setCurrentGuess('');
        } catch (error) {
            alert('Error making guess!');
            console.error(error);
        }
    };

    const copyGameId = () => {
        navigator.clipboard.writeText(gameId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetGame = () => {
        setGameState('menu');
        setGameId('');
        setJoinGameId('');
        setPlayerId(null);
        setPlayerNumber('');
        setCurrentGuess('');
        setGuessHistory([]);
        setOpponentReady(false);
        setIsMyTurn(false);
        setWinner(null);
        setOpponentNumber(null);
        setWaitingForOpponent(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
                    🌐 Online Number Guessing Battle
                </h1>

                {/* Menu */}
                {gameState === 'menu' && (
                    <div className="bg-white rounded-lg shadow-2xl p-8">
                        <div className="text-center mb-8">
                            <Users className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Play with Friends Online!
                            </h2>
                            <p className="text-gray-600">
                                Challenge someone to guess your secret 4-digit number
                            </p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={createGame}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition"
                            >
                                Create New Game
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">OR</span>
                                </div>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={joinGameId}
                                    onChange={(e) => setJoinGameId(e.target.value.toUpperCase())}
                                    placeholder="Enter Game ID"
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-center text-xl tracking-widest mb-3"
                                    maxLength="6"
                                />
                                <button
                                    onClick={joinGame}
                                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-600 hover:to-purple-700 transition"
                                >
                                    Join Game
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Setup */}
                {gameState === 'setup' && (
                    <div className="bg-white rounded-lg shadow-2xl p-8">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Game ID: {gameId}
                                </h2>
                                <button
                                    onClick={copyGameId}
                                    className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            {playerId === 1 && (
                                <p className="text-sm text-gray-600">
                                    Share this Game ID with your friend to let them join!
                                </p>
                            )}
                        </div>

                        {!waitingForOpponent ? (
                            <>
                                <h3 className="text-xl font-bold mb-4 text-gray-800">
                                    Enter Your Secret Number
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Choose a 4-digit number for your opponent to guess
                                </p>
                                <input
                                    type="password"
                                    maxLength="4"
                                    value={playerNumber}
                                    onChange={(e) => setPlayerNumber(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-3xl text-center tracking-widest mb-6"
                                    placeholder="****"
                                />
                                <button
                                    onClick={submitNumber}
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition"
                                >
                                    Submit Number
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
                                <p className="text-xl font-semibold text-gray-700">
                                    Waiting for opponent to join...
                                </p>
                                <p className="text-gray-600 mt-2">
                                    Share the Game ID: <span className="font-mono font-bold">{gameId}</span>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Playing */}
                {gameState === 'playing' && (
                    <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                                Player {playerId}
                            </h2>
                            <div className={`px-4 py-2 rounded-lg font-bold ${isMyTurn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {isMyTurn ? '🟢 Your Turn' : '⏳ Opponent\'s Turn'}
                            </div>
                        </div>

                        {isMyTurn && (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-2 text-gray-700">
                                    Enter Your Guess
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        maxLength="4"
                                        value={currentGuess}
                                        onChange={(e) => setCurrentGuess(e.target.value.replace(/\D/g, ''))}
                                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-2xl text-center tracking-widest"
                                        placeholder="0000"
                                    />
                                    <button
                                        onClick={makeGuess}
                                        className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 transition"
                                    >
                                        Guess
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            <h3 className="font-semibold text-gray-700 mb-3">Your Guess History:</h3>
                            {guessHistory.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No guesses yet</p>
                            ) : (
                                guessHistory.map((record, idx) => (
                                    <div key={idx} className="bg-blue-50 p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl font-mono font-bold">{record.guess}</span>
                                            <div className="flex gap-2 text-sm">
                                                <span className="bg-green-200 px-3 py-1 rounded">
                                                    {record.digitsMatched} digits
                                                </span>
                                                <span className="bg-yellow-200 px-3 py-1 rounded">
                                                    {record.placesMatched} places
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Finished */}
                {gameState === 'finished' && (
                    <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
                        <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-500" />
                        <h2 className="text-3xl font-bold mb-4 text-gray-800">
                            {winner === playerId ? 'You Win! 🎉' : 'Opponent Wins!'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {winner === playerId
                                ? 'Congratulations! You guessed the number!'
                                : 'Better luck next time!'}
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <p className="text-sm text-gray-700 mb-2">
                                <strong>Opponent's Number:</strong>
                            </p>
                            <p className="text-3xl font-mono font-bold text-blue-600">
                                {opponentNumber}
                            </p>
                        </div>
                        <button
                            onClick={resetGame}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition flex items-center justify-center gap-2 mx-auto"
                        >
                            <RefreshCw className="w-5 h-5" />
                            New Game
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
