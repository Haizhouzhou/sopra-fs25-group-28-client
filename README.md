# Splendor Online Board Game
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwindcss&logoColor=white) ![WebSocket](https://img.shields.io/badge/WebSocket-000000?logo=websockets&logoColor=white) ![MSW](https://img.shields.io/badge/MSW-FF6F61?logo=msw&logoColor=white) ![Gemini API](https://img.shields.io/badge/Gemini-FFCC00?logo=google&logoColor=black) ![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?logo=spring-boot&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)


---
## Table of Contents

- [Splendor Online Board Game](#splendor-online-board-game)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Technologies](#technologies)
  - [High-Level Components](#high-level-components)
  - [Launch \& Deployment](#launch--deployment)
    - [Environment](#environment)
  - [Setup with Your IDE](#setup-with-your-ide)
    - [IntelliJ IDEA](#intellij-idea)
    - [VS Code](#vs-code)
  - [Building \& Running](#building--running)
    - [Build Frontend](#build-frontend)
    - [Run Frontend](#run-frontend)
    - [Build Backend](#build-backend)
    - [Run Backend](#run-backend)
  - [Illustrations](#illustrations)
  - [Roadmap](#roadmap)
  - [Game Wiki](#game-wiki)
    - [Contents \& Setup](#contents--setup)
    - [Game Overview](#game-overview)
    - [Win Conditions (15 Prestige)](#win-conditions-15-prestige)
    - [Actions \& Flow](#actions--flow)
    - [Resources \& Discounts](#resources--discounts)
    - [Noble Tiles](#noble-tiles)
    - [End of Game](#end-of-game)
  - [Authors \& Acknowledgement](#authors--acknowledgement)
  - [License](#license)

## Introduction

Two, three, or four players. One goal: build the most prestigious trade empire—who will rise to the top?

Splendor Online is a web-based multiplayer board game where players compete to collect gems, attract nobles, and claim victory through wealth and influence. Every turn, you’ll gather gems—emeralds(Greem Gem), diamonds(White Gem), sapphires((Blue Gem)), onyx((Black Gem)), rubies((Red Gem))—and use them to purchase Development Cards. These cards give you permanent bonuses (discounts for future purchases) and earn you prestige points.

But it’s not just about buying cards. Earn enough bonuses in the right colors, and Noble Tiles will seek you out, rewarding you with extra prestige points. The first player to reach 15 prestige points triggers the endgame—and whoever holds the highest total wins.

Play with 2–4 friends in real-time online matches, chat as you compete, keep an eye on the turn timer, and if you’re feeling stuck? Turn on the AI Advisor for some strategic tips (or chaotic suggestions).

Whether you’re a seasoned Splendor pro or a newcomer ready to build your empire, Splendor Online brings the classic tabletop experience straight to your browser—no setup, no cleanup, just pure fun.

## Technologies

- **WebSockets (Custom JSON Protocol)**  
  We leverage Spring Boot’s native WebSocket support to power all real-time interactions—game state updates (`GAME_STATE`), chat (`CHAT_MESSAGE`), turn timers, and AI hint requests (`AI_HINT`). A single endpoint registers a `WebSocketHandler` on server startup, routing messages by `sessionId` and `roomId`. On the client, our `useWebSocket` hook handles connection lifecycle, automatic reconnection, JSON parsing, and dispatch into React Context.
- **Google Gemini API (AI Strategy Hints)**  
  To provide in-game strategic advice, the client emits an `AI_HINT` over WebSocket. The Spring service then calls Google’s Gemini generative-language endpoint (`gemini-2.5-flash-preview-04-17:generateContent`) using `gemini.api.key` and `gemini.api.url`. We package a concise system prompt plus the current turn snapshot, then stream back the AI’s one-sentence recommendation (e.g. “Take 2 Blue Gems”) as a `AI_HINT` message. Usage is limited to three hints per player per game to balance assistance and performance.


## High-Level Components

* **Authentication**

  * `/login` & `/sign_up` for user management
  * `/users` to view & edit profile (name, avatar, password)
* **Lobby**

  * `/lobby` to list, create, or join game rooms
* **Room**

  * `/room/[id]` shows current players, “Start Game” button, and chat
* **Game**

  * `/game/[id]` board view with:

    * Take gems (2 same or 3 different)
    * Buy or reserve cards
    * AI advice button
    * Real-time chat & turn timer
* **Tutorial**

  * `/tutorial` interactive, step-by-step guide through core rules
* **Rules**

  * `/tutorial/rules` full text rules and victory conditions

## Launch & Deployment

Both frontend and backend are public GitHub repos:

* Client → [https://github.com/Sopra-FS25-group-28/sopra-fs25-group-28-client](https://github.com/Sopra-FS25-group-28/sopra-fs25-group-28-client)
* Server → [https://github.com/Sopra-FS25-group-28/sopra-fs25-group-28-server](https://github.com/Sopra-FS25-group-28/sopra-fs25-group-28-server)

### Environment

* Node.js ≥16 / npm
* Java 17
* (Optional) Google Cloud SDK

## Setup with Your IDE

### IntelliJ IDEA

1. Clone the **server** repo and open in IntelliJ.
2. Import as a **Gradle** project.
3. Ensure **Java 17** SDK is selected.
4. Run `Application.java` or use the Gradle **bootRun** task.

### VS Code

1. Clone both **client** and **server** folders.
2. Install recommended extensions: ESLint, Prettier, vscjava.vscode-java-pack, vmware.vscode-spring-boot
3. Use integrated terminal to execute the commands below.

## Building & Running

### Build Frontend

```bash
cd sopra-fs25-group-28-client
npm install
npm run build
```

### Run Frontend

```bash
npm run dev       # Opens at http://localhost:3000
npm run start     # Production mode
```

### Build Backend

```bash
cd sopra-fs25-group-28-server
./gradlew bootJar
```

### Run Backend

```bash
java -jar build/libs/sopra-fs25-group-28-server-0.0.1-SNAPSHOT.jar
# Server on http://localhost:8080
```

**H2 Console:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
JDBC URL: `jdbc:h2:mem:testdb` | User: `sa` | (no password)

## Illustrations

 The user starts by either signing or loging in. As soon as the user is on the home site he has the choice between creating or joining a game, look at all the users or logout.


* **Home / Sign up / Login**
  ![Home](./Pictures_README/home.png)
  ![Home](./Pictures_README/signup.png)
  ![Home](./Pictures_README/login.png)
  

* **Game Lobby**
  ![Home](./Pictures_README/lobby.png)

* **Game Board**
  ![Home](./Pictures_README/game.png)

* **Tutorial**


* **Rules**


## Roadmap

* **Persistent Game Records**: store finished games in a database
* **Enhanced AI Advice**: smarter, context-aware prompts
* **Friends & Leaderboards**: add social features and global rankings
* **Mobile & Accessibility**: responsive layout, ARIA support

## Game Wiki

### Contents & Setup

- **40 gem tokens** (7 each of Emerald, Sapphire, Ruby, Diamond, Onyx; 5 Gold jokers)  
- **90 Development cards** (40 Level 1, 30 Level 2, 20 Level 3)  
- **10 Noble tiles**

**Setup (4-player)**  
1. Shuffle each deck, stack by level.  
2. Reveal 4 cards from each level in a row.  
3. Shuffle Nobles, reveal 5. Return the rest.  
4. Sort tokens by color into six piles.  
5. Youngest player takes the First Player marker.

_Adjust for 2–3 players by removing extra tokens and fewer Nobles._

---

### Game Overview

On your turn you must perform **exactly one** of:

- **Take 3 different gems** (no gold; only if ≥3 colors available)  
- **Take 2 gems of the same color** (only if ≥4 in supply; no gold)  
- **Reserve 1 Development card & take 1 gold** (max 3 reserved)  
- **Purchase 1 Development card** (face-up or reserved)

Your **Development cards** grant Prestige and **permanent discounts** (the card’s color) for future purchases. Collect enough discounts to buy cards for free!

At the end of your turn, check **Noble tiles**: if you meet a tile’s color-card requirements, you automatically gain that Noble (worth 3 Prestige). Only one Noble per turn.

As soon as any player reaches **15 Prestige**, finish the round so everyone has equal turns. The player with the most Prestige wins. Ties are broken by the fewest cards purchased.

---

### Win Conditions (15 Prestige)

| Condition                  | How to Achieve                                                                 |
|----------------------------|--------------------------------------------------------------------------------|
| **Development Cards**      | Purchase Development cards worth a total of 15 Prestige (counting Nobles).      |
| **Nobles**                 | Attract enough Nobles to push your Prestige to 15.                             |

---

### Actions & Flow

1. **Choose an action** (Take gems, Reserve, Purchase).  
2. **Resolve** the action immediately (draw, pay cost, claim Noble).  
3. **End turn** (pass to next player or automatic if timer expires).

---

### Resources & Discounts

- **Gems** (emerald, sapphire, ruby, diamond, onyx) and **Gold** (wild).  
- **Bonuses** from your face-up cards reduce future gem costs by one per bonus.

---

### Noble Tiles

- Each Noble requires a specific set of colored bonuses.  
- Visit automatically at turn’s end if requirements met.  
- Worth 3 Prestige each; only one per turn.

---

### End of Game

- Trigger: a player reaches **15 Prestige** at turn’s end.  
- Final round: every player takes one last turn in seating order.  
- Victory: highest Prestige; tie → fewest Development cards wins.

## Authors & Acknowledgement

**Group 28**

* Yiming Xiao ([`yimxia`](https://github.com/yimxia))
* Zizhou Luo (Leader, [`Skiingseason`](https://github.com/Skiingseason))
* Haizhou Zheng ([`Haizhouzhou`](https://github.com/Haizhouzhou))
* Philip Spasojevic ([`SopraPH`](https://github.com/SopraPH))

Special thanks to TA **Ambros Eberhard** for semester-long support.

## License

This project is licensed under **Apache 2.0**. See [LICENSE](./LICENSE) for details.
