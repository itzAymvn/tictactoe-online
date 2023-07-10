"use client";

import { useState, useEffect, useContext, useRef } from "react";
import SocketContext from "@/context/SocketContext";
import Swal from "sweetalert2";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

const TicTacToe = ({ inRoom, setInRoom }) => {
    const socket = useContext(SocketContext);
    const messagesContainerRef = useRef(null);

    const initialBoard = Array(9).fill("");
    const [board, setBoard] = useState(initialBoard);
    const [restartGameText, setRestartGameText] = useState("Restart Game");
    const [gameReady, setGameReady] = useState(false); // Updated to initialize as false
    const [playerTurn, setPlayerTurn] = useState("");
    const [players, setPlayers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    useEffect(() => {
        socket.on("users-count", (users) => {
            setGameReady(users.length === 2);
            setPlayers(users);

            // If a user leaves, clear chat & board
            if (users.length === 1) {
                setMessages([]);
                setBoard(initialBoard);
            }
        });
        // When a user joins, let everyone know
        socket.on("player-joined", (username) => {
            toastr.success(`${username} has joined the game`);
        });

        // If server allows user to leave, set inRoom state
        socket.on("left", () => {
            setInRoom({
                status: false,
                room: null,
                player: null,
            });
        });

        // If other user requests to restart, ask user if they want to restart
        socket.on("restart-game-server-request", ({ username, room }) => {
            Swal.fire({
                title: "Restart Game?",
                text: `${username} has requested to restart the game`,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Yes",
                cancelButtonText: "No",
            }).then((result) => {
                if (result.isConfirmed) {
                    socket.emit("restart-game-accepted", {
                        room: room,
                    });
                }

                // If user declines, let other user know
                else {
                    socket.emit("restart-game-declined", {
                        username: inRoom.player,
                        room: inRoom.room,
                    });
                }
            });
        });

        // If other user accepts restart, restart game
        socket.on("restart-game-accepted", () => {
            setBoard(initialBoard);
            setRestartGameText("Restart Game");
            toastr.success("Game has been restarted");
            setMessages((messages) => [
                ...messages,
                {
                    username: "Server",
                    message: "Game has been restarted",
                    timestamp: new Date(),
                },
            ]);
        });

        // If other user declines restart, let user know
        socket.on("restart-game-declined", (username) => {
            setRestartGameText("Restart Game");
            toastr.error(`${username} has declined to restart the game`);
        });

        // When a user leaves, let everyone know
        socket.on("player-left", (name) => {
            toastr.error(`${name} has left the game`);
        });

        socket.on("update-board", ({ board, symbol }) => {
            setBoard(board);
        });

        // Turn event
        socket.on("turn", (username) => {
            setPlayerTurn(username);
        });

        // When a user wins, let everyone know
        socket.on("winner", (username) => {
            if (username === inRoom.player) {
                Swal.fire({
                    title: "You Won!",
                    text: "Congratulations, you won the game",
                    icon: "success",
                    confirmButtonText: "Ok",
                }).then(() => {
                    resetGame();
                });
            }

            // If user loses, let them know
            else {
                Swal.fire({
                    title: "You Lost!",
                    text: "You lost the game",
                    icon: "error",
                    confirmButtonText: "Ok",
                }).then(() => {
                    resetGame();
                });
            }
        });

        // When a draw happens, let everyone know
        socket.on("draw", () => {
            Swal.fire({
                title: "Draw!",
                text: "The game has ended in a draw",
                icon: "info",
                confirmButtonText: "Ok",
            }).then(() => {
                resetGame();
            });
        });

        // When a message is sent, add it to the messages array
        socket.on("new-message", ({ username, message, timestamp }) => {
            setMessages((messages) => [
                ...messages,
                {
                    username: username,
                    message: message,
                    timestamp: timestamp,
                },
            ]);

            // use scrollIntoView to scroll to the bottom of the messages container
            messagesContainerRef.current.scrollIntoView({
                behavior: "smooth",
                block: "end",
            });
        });

        return () => {
            socket.off("player-joined");
            socket.off("left");
            socket.off("player-left");
            socket.off("update-board");
            socket.off("turn");
            socket.off("winner");
            socket.off("draw");
            socket.off("restart-game-server-request");
            socket.off("restart-game-accepted");
            socket.off("restart-game-declined");
            socket.off("users-count");
            socket.off("new-message");
        };
    }, [
        setInRoom,
        socket,
        inRoom,
        initialBoard,
        setPlayers,
        setGameReady,
        setPlayerTurn,
        setBoard,
        restartGameText,
    ]);

    // Send message
    const sendMessage = () => {
        if (message.trim() === "") {
            return;
        }

        socket.emit("send-message", {
            username: inRoom.player,
            message: message,
            room: inRoom.room,
            timestamp: new Date(),
        });

        setMessage("");
    };

    // Request to leave room
    const handleLeaveRoom = () => {
        socket.emit("leave-room", {
            username: inRoom.player,
            room: inRoom.room,
        });
    };

    const resetGame = () => {
        socket.emit("restart-game-request", {
            username: inRoom.player,
            room: inRoom.room,
        });

        setRestartGameText("Waiting...");
    };

    return (
        <>
            {gameReady ? (
                <div className="min-h-screen flex justify-center items-center gap-4 sm:flex-row flex-col p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 md:w-1/2 lg:w-1/3">
                        <div className="text-4xl font-bold text-center mb-4 text-gray-800">
                            XOXO
                            <div className="text-sm font-normal">
                                Room: {inRoom.room} | Player: {inRoom.player}
                            </div>
                        </div>

                        <div className="flex justify-center items-center mb-4 gap-4">
                            {players.map((player, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center bg-gray-200 rounded-lg p-2 w-1/2 justify-center
                                ${
                                    playerTurn === player.username
                                        ? "border-2 border-blue-500"
                                        : ""
                                }
                                ${
                                    player.symbol === "X"
                                        ? "text-blue-900"
                                        : "text-red-500"
                                }`}
                                >
                                    <div className="text-2xl font-bold mr-2">
                                        {player.symbol}
                                    </div>
                                    <div>{player.username}</div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {board.map((square, index) => (
                                <div
                                    key={index}
                                    className={`bg-blue-500 hover:bg-blue-600 text-white rounded-lg h-20 flex justify-center items-center cursor-pointer text-6xl font-bold ${
                                        square === "X"
                                            ? "text-blue-900"
                                            : "text-red-500"
                                    }`}
                                    // If it's the player's turn, allow them to click
                                    onClick={() => {
                                        if (playerTurn !== inRoom.player)
                                            return;

                                        if (square !== "") return;

                                        const newBoard = [...board];
                                        newBoard[index] = inRoom.symbol;
                                        setBoard(newBoard);

                                        socket.emit("update-board", {
                                            room: inRoom.room,
                                            board: newBoard,
                                            symbol: inRoom.symbol,
                                        });
                                    }}
                                >
                                    {square}
                                </div>
                            ))}
                        </div>

                        <div className="text-center text-gray-800 mt-4">
                            <div className="text-sm font-normal">
                                You are:{" "}
                                <span className="font-bold">
                                    {inRoom.symbol}
                                </span>
                            </div>

                            <div className="text-sm font-normal">
                                {playerTurn === inRoom.player
                                    ? "Your turn"
                                    : "Waiting for other player to play"}
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            <button
                                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md w-full"
                                onClick={resetGame}
                            >
                                {restartGameText}
                            </button>
                            <button
                                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md w-full"
                                onClick={handleLeaveRoom}
                            >
                                Leave Room
                            </button>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 md:w-1/2 lg:w-1/3">
                        <h2 className="text-2xl font-bold text-center text-gray-800">
                            Chat
                        </h2>
                        <div className="flex flex-col h-full">
                            <div
                                className="overflow-y-auto"
                                style={{ maxHeight: "400px" }}
                            >
                                {/* Messages container */}
                                <div
                                    className="flex flex-col p-4"
                                    id="messages"
                                    ref={messagesContainerRef} // Add the ref to the messages container
                                >
                                    {messages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center mb-4 w-full
                                            ${
                                                message.username === "Server" &&
                                                "justify-center"
                                            }
                                            ${
                                                message.username ===
                                                inRoom.player
                                                    ? "justify-start"
                                                    : "justify-end"
                                            }`}
                                        >
                                            <div
                                                className={`bg-gray-200 rounded-lg py-2 px-4 w-1/2 
                                                ${
                                                    message.username ===
                                                    inRoom.player
                                                        ? "bg-blue-500"
                                                        : ""
                                                }`}
                                            >
                                                {message.message}

                                                <div className="text-xs font-normal text-gray-500 flex justify-between">
                                                    <span className="mr-2">
                                                        {message.username}
                                                    </span>
                                                    <span>
                                                        {
                                                            // HH:MM no PM/AM
                                                            new Date(
                                                                message.timestamp
                                                            ).toLocaleTimeString(
                                                                "en-US",
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",

                                                                    hour12: false,
                                                                }
                                                            )
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col h-full">
                                <div className="flex items-center mt-4">
                                    <input
                                        type="text"
                                        className="flex-grow bg-gray-200 rounded-lg py-2 px-4 focus:outline-none"
                                        placeholder="Enter your message..."
                                        value={message}
                                        onChange={(e) =>
                                            setMessage(e.target.value.trim())
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter")
                                                sendMessage();
                                        }}
                                    />
                                    <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md ml-4"
                                        onClick={sendMessage}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="min-h-screen  flex justify-center items-center">
                    <div className="w-72 bg-white rounded-lg shadow-lg p-6">
                        <div className="text-4xl font-bold text-center mb-4 text-gray-800">
                            XOXO
                        </div>
                        <div className="text-center text-gray-800">
                            <div
                                className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full"
                                role="status"
                                aria-label="loading"
                            >
                                <span className="sr-only">Loading...</span>
                            </div>
                            <div className="text-sm font-normal">
                                Waiting for another player...
                            </div>
                        </div>
                        <div className="mt-4 space-y-4">
                            <button
                                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md w-full"
                                onClick={handleLeaveRoom}
                            >
                                Leave Room
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TicTacToe;
