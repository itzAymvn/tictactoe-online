"use client";
import Joinroom from "@/components/Joinroom";
import TicTacToe from "@/components/Tictactoe";
import { useEffect, useState } from "react";
import SocketContext from "@/context/SocketContext";
import { io } from "socket.io-client";
const socket = io(process.env.NEXT_PUBLIC_GAME_SERVER);

const page = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [inRoom, setInRoom] = useState({
        status: false,
        room: null,
        player: null,
        symbol: null,
    });

    useEffect(() => {
        socket.on("connect", () => {
            setIsConnected(true);
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
        });

        return () => {
            socket.off("connect");
            socket.off("disconnect");
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            <div className="bg-gradient-radial from-blue-400 to-purple-900 min-h-screen w-full p-4">
                {isConnected ? (
                    // If the client is connected to the server
                    <>
                        {inRoom.status ? (
                            <TicTacToe inRoom={inRoom} setInRoom={setInRoom} />
                        ) : (
                            <Joinroom setInRoom={setInRoom} />
                        )}
                    </>
                ) : (
                    // If the client is not connected to the server (yet)
                    <div className="flex justify-center items-center min-h-screen">
                        <div className="flex flex-col items-center w-1/2 md:w-1/3 lg:w-1/4">
                            <h1 className="text-4xl text-white font-bold mb-4">
                                Connecting...
                            </h1>
                            <p className="text-white mb-4">
                                Taking longer than usual? Try refreshing the
                                page.
                                <button
                                    className="ml-2 text-white font-bold"
                                    onClick={() => window.location.reload()}
                                >
                                    Refresh
                                </button>
                            </p>
                            <div className="loader animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
                        </div>
                    </div>
                )}
            </div>
        </SocketContext.Provider>
    );
};

export default page;
