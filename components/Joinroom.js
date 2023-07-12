import { useState, useContext, useEffect } from "react";
import SocketContext from "@/context/SocketContext";
import Swal from "sweetalert2";

const Joinroom = ({ setInRoom }) => {
    const socket = useContext(SocketContext);

    const [username, setUsername] = useState("");
    const [room, setRoom] = useState("");
    const [showRooms, setShowRooms] = useState(false);
    const [rooms, setRooms] = useState([]);

    // Request to join room
    const handleJoin = (e) => {
        // Validate inputs
        if (username === "" || room === "") {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Please fill in all fields",
            });

            return;
        }

        // Check if username is not too long
        if (username.length > 10) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Username must not be longer than 10 characters",
            });
            return;
        }

        // Check if username contains spaces
        if (username.split(" ").length > 1) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Username must not contain spaces",
            });

            return;
        }

        // Request to join room
        socket.emit("join-room", { username, room });
    };

    useEffect(() => {
        // Join room error event
        socket.on("join-room-error", (error) => {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: error,
            });
        });

        // Joined room event
        socket.on("joined", ({ username, room, symbol }) => {
            setInRoom({
                status: true,
                room,
                player: username,
                symbol,
            });
        });

        socket.on("rooms", (rooms) => {
            setRooms(rooms);
        });

        // Cleanup
        return () => {
            socket.off("join-room-error");
            socket.off("joined");
            socket.off("rooms");
        };
    }, [setInRoom, socket]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-md mx-auto">
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
                            Tic Tac Toe
                        </h1>
                        <div className="mb-6">
                            <label
                                className="block text-gray-700 text-sm font-bold mb-2"
                                htmlFor="username"
                            >
                                Your Name
                            </label>
                            <input
                                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="username"
                                type="text"
                                placeholder="Enter your name"
                                value={username}
                                onChange={(e) =>
                                    setUsername(e.target.value.trim())
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleJoin();
                                    }
                                }}
                            />
                        </div>
                        <div className="mb-6">
                            <label
                                className="block text-gray-700 text-sm font-bold mb-2"
                                htmlFor="room"
                            >
                                Room Name
                            </label>
                            <input
                                className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="room"
                                type="text"
                                placeholder="Enter room name"
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
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                            type="button"
                            onClick={handleJoin}
                        >
                            Join Room
                        </button>
                        <button
                            className="mt-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                            type="button"
                            onClick={() => {
                                setShowRooms((prev) => !prev);
                            }}
                        >
                            Show Available Rooms
                        </button>
                    </div>
                    {rooms.length > 0 && showRooms && (
                        <div className="mt-6 max-h-64 overflow-y-auto">
                            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
                                Available Rooms
                            </h2>
                            {rooms.map((room, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-200 p-4 rounded flex items-center justify-between mb-4"
                                >
                                    <div className="text-gray-700 font-bold">
                                        {room.room}
                                    </div>
                                    <div className="text-gray-500">
                                        {room.players} players
                                    </div>
                                    <button
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                        type="button"
                                        onClick={() => {
                                            if (username === "") {
                                                Swal.fire({
                                                    icon: "error",
                                                    title: "Oops...",
                                                    text: "Please fill in all fields",
                                                });

                                                return;
                                            }
                                            socket.emit("join-room", {
                                                username,
                                                room: room.room,
                                            });
                                        }}
                                    >
                                        Join
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Joinroom;
