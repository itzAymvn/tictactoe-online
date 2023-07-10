"use client";

import { useState, useEffect, useContext } from "react";
import SocketContext from "@/context/SocketContext";
import Swal from "sweetalert2";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

const TicTacToe = ({ inRoom, setInRoom }) => {
    const socket = useContext(SocketContext);

    const initialBoard = Array(9).fill("");
    const [board, setBoard] = useState(initialBoard);
    const [restartGameText, setRestartGameText] = useState("Restart Game");
    const [gameReady, setGameReady] = useState(false); // Updated to initialize as false
    const [playerTurn, setPlayerTurn] = useState(false);
    const [playerTurnUsername, setPlayerTurnUsername] = useState("");
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        if (playerTurn) {
            setPlayerTurnUsername(inRoom.player);
        }
    }, [playerTurn]);

    useEffect(() => {
        socket.on("turn", (username) => {
            setPlayerTurn(username === inRoom.player);
        });

        socket.on("users-count", (users) => {
            setGameReady(users.length === 2);

            setPlayers(users);
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
            setPlayerTurn(username === inRoom.player);
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
        };
    }, [setInRoom, socket, inRoom, initialBoard, setPlayers]);

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
                <div className="min-h-screen  flex justify-center items-center">
                    <div className="w-100 bg-white rounded-lg shadow-lg p-6">
                        <div className="text-4xl font-bold text-center mb-4 text-gray-800">
                            XOXO
                            <div className="text-sm font-normal">
                                Room: {inRoom.room} | Player: {inRoom.player}
                            </div>
                        </div>

                        <div className="flex justify-center items-center mb-4 w-full gap-4">
                            {players.map((player, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center bg-gray-200 rounded-lg p-2 w-1/2 justify-center
                                  
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
                                        if (!playerTurn) return;

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
                                {playerTurn
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
