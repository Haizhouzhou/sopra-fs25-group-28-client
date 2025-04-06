"use client";

import React, { useEffect } from "react";
import Favico from "favico.js";
import { useParams } from "next/navigation";
// 延迟引入 MSW，仅在需要时加载（注意这是异步导入）
// 延迟引入 MSW，仅在需要时加载（注意这是异步导入）
// 延迟引入 MSW，仅在需要时加载（注意这是异步导入）
// 延迟引入 MSW，仅在需要时加载（注意这是异步导入）
async function initMSW(onReady: () => void) {
  const { worker } = await import("../../../mock/browsers");
  await worker.start({ onUnhandledRequest: 'warn' });
  console.log('[MSW] Worker started');
  onReady();
}




// ──────────────────────────────
// 接口与类型定义
// ──────────────────────────────

// 定义可用的颜色类型，分别对应白（w）、蓝（u）、绿（g）、黑（b）、红（r）
export type ColorT = 'w' | 'u' | 'g' | 'b' | 'r';
// GemT 表示宝石类型，可以是上面定义的颜色之一，也可以是通配符 "*"（通常表示黄金或万能宝石）
export type GemT = ColorT | '*';

// 定义卡片或贵族所需的宝石消耗结构，属性为每种颜色所需数量（均为可选）
export interface CostT {
  w?: number;
  u?: number;
  g?: number;
  b?: number;
  r?: number;
}

// 定义玩家持有的宝石类型，除了各颜色外，还可以有通配符宝石
export interface GemsT extends CostT {
  '*'?: number;
}

// 定义单张卡片数据结构
export interface CardT {
  color: string;    // 卡片颜色，用于后续显示和逻辑判断
  points: number;   // 卡片点数
  uuid: string;     // 卡片唯一标识符
  cost: CostT;      // 购买该卡片所需宝石数量
  level: string;    // 卡片等级（例如 level1、level2、level3）
}

// 定义各颜色卡片的集合，使用可选属性表示每个颜色的卡片数组
export interface CardsT {
  w?: CardT[];
  u?: CardT[];
  g?: CardT[];
  b?: CardT[];
  r?: CardT[];
}

// 定义贵族数据结构
export interface NobleT {
  id: number;         // 贵族编号
  points: number;     // 贵族提供的点数奖励
  uuid: string;       // 贵族唯一标识符
  requirement: CostT; // 需要的卡片数量（或宝石）以满足贵族条件
}

// 定义玩家数据结构
export interface PlayerT {
  id: number;           // 玩家编号
  name: string;         // 玩家名称
  uuid: string;         // 玩家唯一标识符
  reserved: CardT[];    // 玩家预留的卡片
  nobles: NobleT[];     // 玩家获得的贵族
  cards: CardsT;        // 玩家已经购买的卡片集合
  gems: GemsT;          // 玩家当前拥有的宝石
  score: number;        // 玩家总得分
}

// 定义日志条目的数据结构，用于记录玩家行为
export interface LogT {
  pid: number;    // 触发日志的玩家编号
  time: number;   // 日志记录的时间戳
  msg: string;    // 日志信息内容
}

// 定义游戏的整体数据结构
export interface GameT {
  players: PlayerT[];                 // 所有玩家数据
  cards: { [level: string]: CardT[] };  // 按等级分类的卡片集合
  decks: { [level: string]: number };   // 每个等级卡牌堆中剩余卡片数量
  log: LogT[];                        // 游戏行为日志
  gems: GemsT;                        // 公共宝石库存
  nobles: NobleT[];                   // 可获得的贵族列表
  winner: number | null;              // 胜利玩家编号（无胜者时为 null）
  turn: number;                       // 当前回合所属玩家编号
}

// 定义聊天消息数据结构
export interface ChatT {
  time: number;   // 消息时间戳
  pid: number;    // 发送消息的玩家编号
  name: string;   // 玩家名称
  msg: string;    // 聊天消息内容
}

// 扩展 GameT，增加前端运行时需要的状态字段
export interface GameState extends GameT {
  mode: string;           // 当前模式，如 "normal" 或 "waiting"
  selectedPlayer: number; // 当前选中的玩家编号，用于显示详细状态
  phase: string;          // 游戏阶段（例如 pregame、postgame）
  showChat: boolean;      // 是否显示聊天窗口
  showLog: boolean;       // 是否显示日志窗口
  chat: ChatT[];          // 聊天记录
  chatNotify: boolean;    // 新聊天消息通知标志
  error?: string | null;  // 错误信息（如果有）
}

// 定义服务器响应数据结构
export interface ServerResponse {
  error?: string;
  state: GameT;
  chat: ChatT[];
  status?: number;
  result: {
    error?: string;
  };
}

// ──────────────────────────────
// 辅助函数（Helper Functions）
// ──────────────────────────────

// 定义所有颜色数组（仅包含实际颜色，不包含通配符）
const colors: ColorT[] = ['b', 'u', 'w', 'g', 'r'];
// 组合出所有宝石类型，包括通配符 "*"。注意这里使用展开运算符，确保类型正确
const gemColors: GemT[] = [...colors, "*"];

/**
 * mapColors：用于生成宝石显示的 JSX 元素
 * @param gems 当前宝石对象（各颜色及通配符数量）
 * @param game 当前游戏实例，用于绑定点击操作
 * @param callback 点击宝石时调用的函数（例如 take 或 discard）
 * @param symbol 在宝石上显示的符号
 * @param uuid 用于生成唯一 key 的标识符
 * @returns 返回一组宝石对应的 JSX 元素
 */
export function mapColors(
  gems: GemsT,
  game: Game,
  callback: (color: GemT) => void,
  symbol: string,
  uuid: string | number
) {
  return gemColors.map((color: GemT) => {
    // 根据颜色类型设置样式类名，通配符宝石使用 "schip"
    let cName = color === '*' ? "schip" : color + "chip";
    return (
      <div className={"gem " + cName} key={color + "colors" + uuid}>
        <div className="bubble">{gems[color]}</div>
        <div className="underlay" onClick={callback.bind(game, color)}>
          {symbol}
        </div>
      </div>
    );
  });
}

/**
 * mapNobles：用于生成贵族显示的 JSX 元素
 * @param nobles 贵族数组
 * @param game 当前游戏实例
 * @returns 返回贵族的 JSX 元素数组
 */
export function mapNobles(nobles: NobleT[], game: Game) {
  return nobles.map((noble) => {
    return <Noble key={noble.uuid} noble={noble} game={game} />;
  });
}

// ──────────────────────────────
// 组件部分（Components）
// ──────────────────────────────

/**
 * Card 组件：渲染单张卡片，可用于购买或预留
 */
class Card extends React.PureComponent<{ card: CardT; game: Game }, {}> {
  render() {
    const card = this.props.card;
    const game = this.props.game;
    // buyer: 绑定购买操作
    const buyer = game.buy.bind(game, card.uuid);
    // reserver: 绑定预留操作，点击时防止默认行为
    const reserver = (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      game.reserve.bind(game)(card.uuid);
    };

    // 如果卡片有颜色，则正常渲染卡片信息
    if (card.color) {
      return (
        <div className={"card card-" + card.color + " card-" + card.level} id={card.uuid}>
          <div className="reserve" onClick={reserver}>
            {/* 预留图标 */}
            <img className="floppy" src="/gamesource/game_page/floppy.png" alt="reserve" />
          </div>
          <div className="overlay" onClick={buyer}></div>
          <div className="underlay">
            <div className="header">
              {/* 卡片颜色标记 */}
              <div className={"color " + card.color + "gem"}></div>
              {/* 卡片点数 */}
              <div className="points">{card.points > 0 && card.points}</div>
            </div>
            <div className="costs">
              {/* 渲染卡片所需宝石数量 */}
              {colors.map((color: ColorT) => {
                if (card.cost[color] && card.cost[color]! > 0) {
                  return (
                    <div key={card.uuid + "_cost_" + color} className={"cost " + color}>
                      {card.cost[color]}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      );
    } else {
      // 如果卡片没有颜色，则视为牌堆（deck），仅渲染牌堆外观
      return <div className={"deck " + card.level}></div>;
    }
  }
}

/**
 * Noble 组件：渲染贵族信息
 */
class Noble extends React.PureComponent<{ noble: NobleT; game: Game }, {}> {
  render() {
    const noble = this.props.noble;
    const game = this.props.game;
    // 点击贵族时调用 noble_visit 操作
    const visit = game.noble.bind(game, noble.uuid);
    return (
      <div className="noble" onClick={visit} id={"noble" + noble.id}>
        <div className="side-bar">
          <div className="points">{noble.points > 0 && noble.points}</div>
          <div className="requirement">
            {colors.map((color: ColorT) => {
              if (noble.requirement[color] && noble.requirement[color]! > 0) {
                return (
                  <div key={noble.uuid + "_req_" + color} className={"requires " + color}>
                    {noble.requirement[color]}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Player 组件：显示单个玩家的所有信息，包括名称、分数、宝石、卡片、贵族等
 */
class Player extends React.PureComponent<
  {
    game: Game;
    pid: number;
    cards: CardsT;
    gems: GemsT;
    name: string;
    points: number;
    nobles: NobleT[];
    reserved: CardT[];
    nreserved: number;
    selectedPlayer: number;
  },
  { editingName: string | null }
> {
  state = { editingName: null as string | null };

  // 编辑名称输入时触发
  editName = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ editingName: e.target.value });
  };

  // 当输入框获得焦点时全选文本
  focusName = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // 提交修改后的名称
  submitName = () => {
    this.props.game.rename(this.state.editingName);
    this.setState({ editingName: null });
  };

  // 按下回车键时提交名称
  keypress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      this.submitName();
    }
  };

  render() {
    const game = this.props.game;
    const pid = this.props.pid;
    const playerSelector = game.selectPlayer.bind(game, pid);
    // 用于统计玩家宝石与卡片数量
    const collection: { [color: string]: { cards: number; gems: number } } = {};
    gemColors.forEach((color: GemT) => {
      collection[color] = { cards: 0, gems: this.props.gems[color] || 0 };
    });

    // 渲染玩家拥有的各色卡片集合
    const set = colors.map((color: ColorT) => {
      const cards = (this.props.cards[color] || []).map((card: CardT) => {
        collection[color].cards += 1;
        return (
          <div key={pid + "_card_" + card.uuid} className="colorSetInner">
            <Card key={card.uuid} card={card} game={game} />
          </div>
        );
      });
      return (
        <div key={pid + "_set_" + color} className="colorSet">
          {cards}
          <div className={cards.length > 0 ? "endcap" : "spacer"}></div>
        </div>
      );
    });

    // 统计宝石数量显示
    const stats = gemColors.map((color) => {
      return (
        <div className="statSet" key={"stat" + color}>
          <div className={`stat stat${color === '*' ? 'y' : color}`}>
            {collection[color].gems + (color !== '*' ? " / " + collection[color].cards : "")}
          </div>
          {color === '*' ? null : (
            <div>
              <img className="labelImg" src="/gamesource/game_page/labels.png" alt="label" />
            </div>
          )}
        </div>
      );
    });

    // 判断是否为当前玩家（“you”）
    const you = game.props.pid === pid ? " you selected" : "";
    const youName = game.props.pid === pid ? " (you)" : "";
    // 渲染宝石显示组件
    const gemsDisplay = mapColors(this.props.gems, game, game.discard, "X", pid);
    // 渲染预留卡片（reserved cards）
    const reserved = this.props.reserved
      ? this.props.reserved.map((card) => {
          return <Card key={card.uuid + "_inner"} card={card} game={game} />;
        })
      : [];
    const reservedCount = this.props.reserved ? reserved.length : this.props.nreserved;
    // 渲染玩家拥有的贵族
    const nobles = mapNobles(this.props.nobles, game);

    return (
      <div className={"player" + you}>
        <div className="playerHeader">
          <div className="playerPoints">{this.props.points}</div>
          {this.state.editingName === null ? (
            <>
              <div className="playerName" onClick={playerSelector}>
                {this.props.name}
              </div>
              {game.props.pid === pid && this.state.editingName === null ? (
                <div className="pencil" onClick={() => this.setState({ editingName: this.props.name })}>
                  ✏️
                </div>
              ) : null}
            </>
          ) : (
            <div className="playerName">
              <input
                className="nameInput"
                type="text"
                value={this.state.editingName || ""}
                autoFocus
                onKeyPress={this.keypress}
                onFocus={this.focusName}
                onBlur={this.submitName}
                onChange={this.editName}
              />
            </div>
          )}
          <div className="playerName2">{youName}</div>
          {game.state.turn === pid && <div className="turnIndicator">←</div>}
        </div>
        {game.state.selectedPlayer === pid ? (
          <div className="floater">
            <div className="cards">{set}</div>
            <div className="nobles">{nobles}</div>
            <div className="gems">{gemsDisplay}</div>
            <div className="reserveArea">
              {reservedCount > 0 && (
                <div>
                  <div className="reserveText">reserved</div>
                  <div className="reserveCards">{reserved}</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="stats">
            <div className="gem-stats">{stats}</div>
            <div className="reservedStat">{reserved}</div>
          </div>
        )}
      </div>
    );
  }
}

/**
 * Level 组件：渲染牌堆和面朝上的卡片
 */
class Level extends React.PureComponent<{ name: string; remaining: number; game: Game; cards: CardT[] }, {}> {
  render() {
    return (
      <div>
        <div className={"deck " + this.props.name}>
          <div className="remaining">{this.props.remaining}</div>
          <div className="overlay"></div>
          <div className="reserve" onClick={this.props.game.reserve.bind(this.props.game, this.props.name)}>
            <img className="floppy" src="/gamesource/game_page/floppy.png" alt="reserve deck" />
          </div>
        </div>
        <div className={"c_" + this.props.name + " face-up-cards"}>
          <div className="cards-inner">
            {this.props.cards &&
              this.props.cards.map((card) => (
                <Card key={card.uuid} card={card} game={this.props.game} />
              ))}
          </div>
        </div>
      </div>
    );
  }
}

/**
 * ErrorMsg 组件：显示错误信息
 */
const ErrorMsg = (props: { error: string | null; opacity: number }) => {
  return (
    <div className="error-box" style={{ opacity: props.opacity }}>
      <div className="error-box-inner">{props.error}</div>
    </div>
  );
};

/**
 * Game 组件：游戏的主要交互界面，负责更新和显示游戏状态
 */
class Game extends React.PureComponent<{ gid: string; pid: number; uuid: string }, GameState> {
  state: GameState = {
    players: [],
    gems: {},
    cards: {},
    chat: [],
    decks: {},
    nobles: [],
    log: [],
    turn: -1,
    winner: null,
    mode: "normal",
    selectedPlayer: -1,
    phase: "pregame",
    showChat: false,
    showLog: false,
    chatNotify: false,
    error: null,
  };

  // 判断当前回合是否为本玩家回合
  isMyTurn = (turn: number) => turn === this.props.pid;

  /**
   * updateState：用于更新本地游戏状态，响应来自服务器或 mock 的数据
   * r 为 ServerResponse 格式的数据
   */
  updateState = (r: ServerResponse) => {
    if (r.state) {
      const myTurn = this.isMyTurn(r.state.turn);
      if (!myTurn) this.setState({ mode: "waiting" });
      else {
        if (this.state.mode === "waiting") {
          // 当由等待状态变为当前回合时，播放通知音
          (document.getElementById("notify") as HTMLAudioElement).play();
        }
        this.setState({ mode: "normal" });
      }

      // 若未选中玩家，则默认选中当前玩家（pid 小于 4）
      if (this.state.selectedPlayer === -1 && this.props.pid < 4) {
        this.setState({ selectedPlayer: this.props.pid });
      }

      // 更新日志、卡片、玩家、宝石、贵族、当前回合
      this.setState({
        log: r.state.log,
        cards: r.state.cards,
        decks: r.state.decks,
        players: r.state.players,
        gems: r.state.gems,
        nobles: r.state.nobles,
        turn: r.state.turn,
      });

      // 如果有胜者且游戏阶段不是 postgame，则显示胜利提示
      if (r.state.winner !== null && this.state.phase !== "postgame") {
        alert(r.state.players[r.state.winner].name + " wins!");
        this.setState({ phase: "postgame" });
      }

      // 更新聊天记录，并在有新消息时播放通知音
      if (r.chat) {
        let chat = this.state.chat;
        if (
          chat &&
          chat[chat.length - 1] &&
          r.chat[r.chat.length - 1] &&
          chat[chat.length - 1].msg !== r.chat[r.chat.length - 1].msg &&
          r.chat[r.chat.length - 1].pid !== this.props.pid
        ) {
          (document.getElementById("notify") as HTMLAudioElement).play();
          if (!this.state.showChat) this.setState({ chatNotify: true });
        }
        this.setState({ chat: r.chat });
      }

      // 自动滚动日志和聊天窗口到最底部
      const scrollers = document.getElementsByClassName("scroller");
      for (let i = 0; i < scrollers.length; i++) {
        scrollers[i].scrollTop = scrollers[i].scrollHeight;
      }
    }
  };

  // 构造登录参数，附带 pid 和 uuid
  loginArgs = () => `?pid=${this.props.pid}&uuid=${this.props.uuid}`;

  // 宝石相关操作
  take = (color: string) => this.act("take", color);
  discard = (color: string) => {
    if (confirm("Are you sure you want to discard a gem?")) {
      this.act("discard", color);
    }
  };

  // 设置选中玩家
  selectPlayer = (player: number) => this.setState({ selectedPlayer: player });
  // 卡片购买
  buy = (uuid: string) => this.act("buy", uuid);
  // 预留卡片
  reserve = (uuid: string) => this.act("reserve", uuid);
  // 触发贵族访问
  noble = (uuid: string) => this.act("noble_visit", uuid);

  /**
   * rename：发送修改名称请求
   */
  rename = async (name: string | null) => {
    if (!name) return;
    const resp = await fetch(`/rename/${this.props.gid}/${name}${this.loginArgs()}`, { method: "POST" });
    const json = await resp.json();
    // 可在此处处理错误信息
  };

  /**
   * act：通用操作函数，用于发送各类 POST 请求
   */
  act = async (action: string, target: string) => {
    const resp = await fetch(`/game/${this.props.gid}/${action}/${target}${this.loginArgs()}`, { method: "POST" });
    const json = await resp.json();
    this.updateState(json);
  };

  // 结束当前回合
  nextTurn = async () => {
    const resp = await fetch(`/game/${this.props.gid}/next${this.loginArgs()}`, { method: "POST" });
    const json = await resp.json();
    this.updateState(json);
  };

  // 轮询接口获取最新状态
  poll = async () => {
    const resp = await fetch(`/poll/${this.props.gid}${this.loginArgs()}`);
    const json = await resp.json();
    this.updateState(json);
    // 递归调用实现持续轮询
    this.poll();
  };

  // 单次请求状态数据
  stat = async () => {
    const resp = await fetch(`/stat/${this.props.gid}${this.loginArgs()}`);
    const json = await resp.json();
    this.updateState(json);
  };

  // 组件加载后，触发初次状态请求和持续轮询
  componentDidMount() {
    this.stat();
    this.poll();
  }

  /**
   * chat：处理输入框按下回车发送聊天消息
   */
  chat = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const chatBox = document.getElementById("chat-inner") as HTMLInputElement;
    if (e.which === 13) {
      const resp = await fetch(`/game/${this.props.gid}/chat${this.loginArgs()}`, {
        method: "POST",
        body: JSON.stringify({ msg: chatBox.value }),
      });
      chatBox.value = "";
      const json = await resp.json();
      this.updateState(json);
    }
  };

  render() {
    // 渲染所有玩家信息
    const players = this.state.players.map((player) => (
      <Player
        selectedPlayer={this.state.selectedPlayer}
        key={player.uuid}
        pid={player.id}
        name={player.name}
        points={player.score}
        game={this}
        cards={player.cards}
        nobles={player.nobles}
        gems={player.gems}
        reserved={player.reserved}
        nreserved={player.reserved.length}
      />
    ));
    // 渲染宝石区
    const gemsDisplay = mapColors(this.state.gems, this, this.take, "", "game");
    // 渲染贵族区
    const nobles = mapNobles(this.state.nobles, this);
    // 渲染游戏日志
    const log = this.state.log.map((logLine, i) => (
      <div key={"log-line-" + i} className="line">
        <span className="pid">{"[" + logLine.pid + "] "}</span>
        <span className="msg">{logLine.msg}</span>
      </div>
    ));
    // 渲染聊天记录
    const chat = this.state.chat.map((chatLine, i) => (
      <div key={"chat-line-" + i} className="line">
        <span className={`name name${chatLine.pid}`}>{chatLine.name + ": "}</span>
        <span className="msg">{chatLine.msg}</span>
      </div>
    ));
    // 按等级名称生成牌堆组件
    const levelNames = ["level1", "level2", "level3"];
    const levels = levelNames.map((level) => (
      <Level key={level} game={this} name={level} cards={this.state.cards[level]} remaining={this.state.decks[level]} />
    ));
    return (
      <div>
        {/* 游戏主板 */}
        <div id="game-board">
          <div id="common-area">
            {/* 贵族区域 */}
            <div id="noble-area" className="split">{nobles}</div>
            {/* 牌堆区域 */}
            <div id="level-area" className="split">{levels}</div>
            {/* 预留操作说明 */}
            <div className="reserve-info">
              <div className="reserve-info-inner">
                <div>Click on card to buy, click on</div>
                <div>
                  <img className="floppy" src="/gamesource/game_page/floppy.png" alt="reserve" />
                </div>
                <div>to reserve.</div>
              </div>
            </div>
            {/* 宝石区域 */}
            <div id="gem-area" className="you">{gemsDisplay}</div>
          </div>
          {/* 玩家区域 */}
          <div id="player-area">{players}</div>
        </div>
        {/* 日志区域 */}
        <div id="log-box" style={{ bottom: this.state.showLog ? -4 : -514 }}>
          <div className="title" onClick={() => this.setState({ showLog: !this.state.showLog })}>
            ::Log
          </div>
          <div className="scroller">{log}</div>
        </div>
        {/* 聊天区域 */}
        <div id="chat-box" onClick={() => this.setState({ chatNotify: false })} style={{ bottom: this.state.showChat ? -4 : -314 }}>
          <div className={`title${this.state.chatNotify ? " blinking" : ""}`} onClick={() => this.setState({ showChat: !this.state.showChat })}>
            ::Chat
          </div>
          <div className="scroller">{chat}</div>
          <div id="chat">
            <span id="prompt">{">"}</span>
            <input id="chat-inner" type="text" onKeyPress={this.chat} />
          </div>
        </div>
        {/* Pass turn 按钮 */}
        {this.state.turn >= 0 && this.props.pid >= 0 && this.props.pid < 4 && (
          <button id="pass-turn" onClick={this.nextTurn} style={{ opacity: this.isMyTurn(this.state.turn) ? 1 : 0.3 }}>
            Pass turn
          </button>
        )}
      </div>
    );
  }
}

/**
 * GamePage 组件：页面入口组件，获取路由参数并初始化游戏
 */
const GamePage = () => {
  // 使用 Next.js 的 useParams 获取路由参数，例如 /game/123 中的 "123"
  const params = useParams();
  const gid = params.id as string;
  // 默认使用 pid 和 uuid 进行测试模拟
  const pid = 0;
  const uuid = "test-uuid";

  // 组件挂载后，初始化 Favico 通知和 MSW 模拟处理器
  useEffect(() => {
    const favicon = new Favico({ position: "up" });
    document.onclick = () => favicon.badge("");
    
    if (process.env.NODE_ENV === "development") {
      initMSW(() => {
        // SW 已启动后，再开始游戏逻辑，比如刷新状态、启动轮询等
        console.log('[MSW] Ready, now you can safely fetch.');
        // 此处可以触发初始的 stat() 和 poll() 请求
      }).catch((err) => console.error("MSW init error:", err));
    }
  }, []);
  
  
  
  return (
    <div>
      {/* 用于播放通知音频 */}
      <audio id="notify" src="/gamesource/game_page/double.mp3" preload="auto" />
      <Game gid={gid} pid={pid} uuid={uuid} />
    </div>
  );
};
export default GamePage;
