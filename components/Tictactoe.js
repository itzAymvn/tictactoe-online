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
    const [player, setPlayer] = useState("X");
    const [winner, setWinner] = useState(null);
    const [restartGameText, setRestartGameText] = useState("Restart Game");

    useEffect(() => {
        // If server allows user to leave, set inRoom state
        socket.on("left", ({ name, room }) => {
            setInRoom({
                status: false,
                room: null,
                player: null,
            });
        });

        // When a user joins, let everyone know
        socket.on("player-joined", (name) => {
            toastr.success(`${name} has joined the game`);
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
            setWinner(null);
            setRestartGameText("Restart Game");
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
    }, [setInRoom, socket, inRoom, initialBoard]);

    const nextPlayer = () => {
        return player === "X" ? "O" : "X";
    };

    const winningPositions = [
        // Rows
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        // Columns
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        // Diagonals
        [0, 4, 8],
        [2, 4, 6],
    ];

    const checkWinner = () => {
        for (let i = 0; i < winningPositions.length; i++) {
            const [a, b, c] = winningPositions[i];
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }

        // If the whole board is filled and no winner, it's a draw
        if (board.every((square) => square !== "")) {
            return "draw";
        }

        // If no winner, and not a draw, return null
        return null;
    };

    const handleClick = (index) => {
        // If there's a winner, or the square is already filled, do nothing
        if (winner || board[index] !== "") return;

        const updatedBoard = [...board];
        updatedBoard[index] = player;
        setBoard(updatedBoard);

        const currentWinner = checkWinner();
        if (currentWinner) {
            setWinner(currentWinner);
            showWinnerAlert(currentWinner);
        } else {
            setPlayer(nextPlayer());
        }
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

    const showWinnerAlert = (currentWinner) => {
        Swal.fire({
            icon: currentWinner === "draw" ? "info" : "success",
            title:
                currentWinner === "draw"
                    ? "It's a draw!"
                    : `Player ${currentWinner} wins!`,
            confirmButtonText: "Restart Game",
        }).then((result) => {
            if (result.isConfirmed) {
                resetGame();
            }
        });
    };

    useEffect(() => {
        const currentWinner = checkWinner();
        if (currentWinner) {
            setWinner(currentWinner);
            showWinnerAlert(currentWinner);
        }
    }, [board]);

    return (
        <div className="min-h-screen  flex justify-center items-center">
            <div className="w-72 bg-white rounded-lg shadow-lg p-6">
                <div className="text-4xl font-bold text-center mb-4 text-gray-800">
                    XOXO
                    <div className="text-sm font-normal">
                        Room: {inRoom.room} | Player: {inRoom.player}
                    </div>
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
                            onClick={() => handleClick(index)}
                        >
                            {square}
                        </div>
                    ))}
                </div>

                <div className="text-2xl font-bold text-center mt-4 text-gray-800">
                    {winner
                        ? winner === "draw"
                            ? "It's a draw!"
                            : `Player ${winner} wins!`
                        : `Player ${player}'s turn`}
                </div>

                <div className="mt-4 space-y-4">
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
    );
};

export default TicTacToe;
