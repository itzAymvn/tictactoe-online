"use client";
"use strict";
import { useState, useContext, useEffect } from "react";
import SocketContext from "@/context/SocketContext";
import Swal from "sweetalert2";
// import toastr from "toastr";
// import "toastr/build/toastr.min.css";

const Joinroom = ({ setInRoom }) => {
    const socket = useContext(SocketContext);

    const [username, setUsername] = useState("");
    const [room, setRoom] = useState("");

    // Request to join room
    const handleJoin = (e) => {
        if (username === "" || room === "") {
            alert("Please fill in all fields");
            return;
        }

        if (username.length > 10) {
            alert("Username must be less than 10 characters");
            return;
        }

        if (username.split(" ").length > 1) {
            alert("Username must not contain spaces");
            return;
        }

        socket.emit("join-room", { username, room });
    };

    useEffect(() => {
        // If room is full, let user know
        socket.on("join-room-error", (error) => {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: error,
            });
        });

        // if server allows user to join, set inRoom state
        socket.on("joined", ({ username, room, symbol }) => {
            setInRoom({
                status: true,
                room,
                player: username,
                symbol,
            });
        });
    }, [setInRoom, socket]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 ">
            <div className="flex flex-col w-full md:w-1/2 items-center justify-center">
                <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 flex flex-col">
                    <div className="text-4xl font-bold text-center mb-4 text-gray-800">
                        XOXO
                    </div>
                    <div className="mb-4">
                        <label
                            className="block text-gray-700 text-sm font-bold mb-2"
                            htmlFor="username"
                        >
                            Username
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="username"
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.trim())}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleJoin();
                                }
                            }}
                        />
                    </div>
                    <div className="mb-4">
                        <label
                            className="block text-gray-700 text-sm font-bold mb-2"
                            htmlFor="room"
                        >
                            Room
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="room"
                            type="text"
                            placeholder="Room"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleJoin();
                                }
                            }}
                        />
                    </div>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        type="button"
                        onClick={handleJoin}
                    >
                        Join
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Joinroom;
