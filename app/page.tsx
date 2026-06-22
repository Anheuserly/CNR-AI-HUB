import {
  Activity,
  BadgeCheck,
  Bot,
  BrainCircuit,
  Command,
  Crosshair,
  Crown,
  Fingerprint,
  Gauge,
  Landmark,
  LockKeyhole,
  MessageSquareText,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Swords,
  TerminalSquare,
  UserRoundCheck,
  WalletCards,
  Zap
} from "lucide-react";
import { LoginPanel } from "@/components/LoginPanel";

const signalStats = [
  { value: "57", label: "slash commands", note: "gameplay, moderation, support" },
  { value: "2", label: "AI operators", note: "hub control + chat assistant" },
  { value: "24/7", label: "server brain", note: "profiles, logs, player state" }
];

const commandSystems = [
  {
    icon: Crosshair,
    title: "CNR gameplay",
    detail: "Players can choose modes, move through interiors, earn currency, buy gear, rob, arrest, escape, and build a persistent profile."
  },
  {
    icon: ShieldCheck,
    title: "Moderation control",
    detail: "Cases, punishments, staff duty, event logs, and safety commands give your staff a clean operating layer."
  },
  {
    icon: MessageSquareText,
    title: "AI conversation",
    detail: "The chat assistant can answer questions, remember safe preferences, and keep Discord user context tied to each member."
  },
  {
    icon: WalletCards,
    title: "Economy and inventory",
    detail: "Wallets, shields, weapons, store actions, marked money, cooldowns, and transaction history are built as durable game systems."
  }
];

const bots = [
  {
    icon: RadioTower,
    name: "CNR AI Hub Bot",
    role: "The control bot for CNR gameplay, staff commands, tickets, giveaways, profiles, and server operations.",
    commands: ["/cnr", "/profile", "/daily", "/cuff", "/arrest", "/ticket"]
  },
  {
    icon: BrainCircuit,
    name: "CNR AI Chat",
    role: "The conversation bot for AI help, member memory, context reset, and smarter Discord support.",
    commands: ["/ask", "/profile", "/remember", "/reset_context"]
  }
];

const stateLayers = [
  { icon: Fingerprint, title: "Player identity", text: "Discord user ID, profile history, server membership, safe memory, and member preferences." },
  { icon: Swords, title: "Virtual roles", text: "Cop, robber, FBI, hitman, suspect, cuffed, jailed, dead, frozen, and owned items are remembered by the system." },
  { icon: Landmark, title: "World position", text: "Interiors, active mode, health, armor, inventory, level, XP, balance, and marked money stay attached to the player." },
  { icon: Activity, title: "Action history", text: "Commands, transactions, game actions, moderation cases, tickets, giveaways, and cooldowns stay auditable." }
];

const operationFlow = [
  "A member joins or runs a command.",
  "The hub recognizes their Discord identity.",
  "Game mode, status, inventory, and history are loaded.",
  "The bot responds, updates state, and records the action.",
  "Staff can review operations without relying on messy role IDs."
];

export default function Home() {
  return (
    <main>
      <section className="hero" id="top">
        <nav className="nav" aria-label="Main navigation">
          <a className="brand" href="#top" aria-label="CNR AI Hub home">
            <span className="brand-mark">CNR</span>
            <span>AI Hub</span>
          </a>
          <div className="nav-actions">
            <a href="#systems">Systems</a>
            <a href="#bots">Bots</a>
            <a href="#access">Access</a>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={16} />
              Discord AI roleplay command center
            </div>
            <h1>CNR AI Hub</h1>
            <p>
              A smarter home for your Cops and Robbers Discord world: AI assistants, persistent player profiles,
              economy systems, virtual roles, moderation tools, tickets, giveaways, and game actions that remember
              every member by their Discord identity.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#systems">
                <Zap size={18} />
                Explore systems
              </a>
              <a className="secondary-action" href="#bots">
                <Bot size={18} />
                View bot network
              </a>
            </div>
          </div>

          <div className="command-center" aria-label="CNR AI Hub live command center preview">
            <div className="center-header">
              <div>
                <span>Live dispatch</span>
                <strong>CNR Server Intelligence</strong>
              </div>
              <BadgeCheck size={20} />
            </div>
            <div className="radar-stage">
              <div className="radar-ring ring-one" />
              <div className="radar-ring ring-two" />
              <div className="radar-core">
                <Crown size={32} />
                <span>Hub Core</span>
              </div>
              <div className="signal-chip chip-a">
                <Crosshair size={17} />
                Robbery alert
              </div>
              <div className="signal-chip chip-b">
                <ShieldCheck size={17} />
                Staff duty
              </div>
              <div className="signal-chip chip-c">
                <WalletCards size={17} />
                Economy sync
              </div>
            </div>
            <div className="dispatch-log">
              <span>/cnr mode robber - profile loaded</span>
              <span>/cuff suspect - same interior confirmed</span>
              <span>/daily - reward added to wallet</span>
              <span>/ask - assistant answered with memory context</span>
            </div>
          </div>
        </div>

        <div className="stats-row" aria-label="Platform highlights">
          {signalStats.map((item) => (
            <div className="stat" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="section systems-section" id="systems">
        <div className="section-kicker">
          <Command size={18} />
          Command systems
        </div>
        <div className="section-header">
          <h2>Designed for a Discord world that actually remembers players.</h2>
          <p>
            The hub is built around gameplay state, not fragile server role IDs. Every important action can update a
            member profile, role-like status, balance, inventory, or audit trail.
          </p>
        </div>
        <div className="system-grid">
          {commandSystems.map((system) => {
            const Icon = system.icon;
            return (
              <article className="system-card" key={system.title}>
                <div className="card-icon">
                  <Icon size={24} />
                </div>
                <h3>{system.title}</h3>
                <p>{system.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section state-section">
        <div className="state-grid">
          <div className="section-header compact">
            <div className="section-kicker">
              <Gauge size={18} />
              Persistent state
            </div>
            <h2>Modes, items, health, interiors, and history stay with the member.</h2>
            <p>
              Your old role-ID list has been converted into a cleaner virtual role model. The bot can remember what
              someone is and what they own without needing to attach every state to a Discord server role.
            </p>
          </div>
          <div className="state-list">
            {stateLayers.map((item) => {
              const Icon = item.icon;
              return (
                <article className="state-item" key={item.title}>
                  <Icon size={20} />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section bots-section" id="bots">
        <div className="section-kicker">
          <Bot size={18} />
          Bot network
        </div>
        <div className="section-header">
          <h2>Two bots with separate jobs and one shared CNR memory.</h2>
          <p>
            The hub bot runs the world. The chat bot supports members with AI help. Together they make the server feel
            responsive, organized, and alive.
          </p>
        </div>
        <div className="bot-grid">
          {bots.map((bot) => {
            const Icon = bot.icon;
            return (
              <article className="bot-card" key={bot.name}>
                <div className="bot-card-top">
                  <div className="card-icon">
                    <Icon size={24} />
                  </div>
                  <span>Active workspace</span>
                </div>
                <h3>{bot.name}</h3>
                <p>{bot.role}</p>
                <div className="command-row">
                  {bot.commands.map((command) => (
                    <span key={command}>{command}</span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section flow-section">
        <div className="flow-board">
          <div>
            <div className="section-kicker">
              <TerminalSquare size={18} />
              How it works
            </div>
            <h2>One clean loop for every command.</h2>
            <p>
              The bot checks identity, loads state, applies the command, then records the result. That gives you a
              smarter foundation for future dashboards, leaderboards, staff tools, and AI automation.
            </p>
          </div>
          <ol className="flow-list">
            {operationFlow.map((step) => (
              <li key={step}>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section login-section" id="access">
        <div className="login-copy">
          <div className="section-kicker">
            <UserRoundCheck size={18} />
            Member access
          </div>
          <h2>Private access for members and staff.</h2>
          <p>
            This sign-in area is ready to become the control surface for player profiles, staff tools, server settings,
            and future CNR dashboards.
          </p>
          <div className="mini-terminal">
            <LockKeyhole size={18} />
            <code>Secure project access</code>
          </div>
        </div>
        <LoginPanel />
      </section>
    </main>
  );
}
