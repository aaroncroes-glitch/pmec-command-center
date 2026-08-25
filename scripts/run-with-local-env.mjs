import { spawn } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

const workspace = process.cwd();

// Clerk CLI writes the linked development keys to .env.local. In the managed
// workspace, an earlier injected placeholder can otherwise win over that file.
dotenv.config({ path: path.join(workspace, ".env.local"), override: true });
dotenv.config({ path: path.join(workspace, ".env"), override: false });

const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error("A command is required.");

const child = spawn(command, args, { cwd: workspace, env: process.env, stdio: "inherit" });
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
