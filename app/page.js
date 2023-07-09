"use client";
import Joinroom from "@/components/Joinroom";
import TicTacToe from "@/components/Tictactoe";
import { useState } from "react";
import SocketContext from "@/context/SocketContext";
import { io } from "socket.io-client";
const socket = io(process.env.NEXT_PUBLIC_GAME_SERVER);

const page = () => {
    const [inRoom, setInRoom] = useState({
        status: false,
        room: null,
        player: null,
    });

    return (
        <SocketContext.Provider value={socket}>
            <div className="bg-gradient-radial from-blue-400 to-purple-900 min-h-screen w-screen">
                {inRoom.status ? (
                    <TicTacToe inRoom={inRoom} setInRoom={setInRoom} />
                ) : (
                    <Joinroom setInRoom={setInRoom} />
                )}
            </div>
        </SocketContext.Provider>
    );
};

export default page;
