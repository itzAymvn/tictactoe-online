# Tic Tac Toe Next.js Website

A Tic Tac Toe game implemented using Next.js.

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/itzAymvn/tictactoe-online.git
    ```

2. Install dependencies:

    ```bash
    cd tictactoe-online
    npm install
    ```

3. Setup the environment variable:

    - Create a `.env` file in the root directory.
    - Add a `NEXT_PUBLIC_GAME_SERVER`.
    - Set the value to the previous varable to the HTTP link of the [Socket.io server](https://github.com/itzAymvn/tictactoe-server).

4. Start the development server

    ```bash
    npm run dev
    ```

5. Open your browser and visit http://localhost:3000 to play the Tic Tac Toe game.

## Features

-   Join a room to play Tic Tac Toe with another player.
-   Real-time updates using Socket.io for game state synchronization.
-   Notifications (New message & Restart accepted/declined & Player leaves/Joins)
-   Chat functionality to communicate with the opponent player.
-   Restart the game and keep track of the score.

## Technologies Used

-   Next.js v13.14.9
-   Socket.io-client v4.7.1
-   SweetAlert2 v11.7.12
-   Toastr v2.1.4
-   TailwindCSS v3.3.2

## License

This project is licensed under the MIT License.

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](https://github.com/itzAymvn/tictactoe-online/blob/main/README.md)
