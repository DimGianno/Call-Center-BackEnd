#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");

const args = process.argv.slice(2);
const mode = args.shift();
const options = parseOptions(args);

if (!mode || options.help) {
    printUsage();
    process.exit(mode ? 0 : 1);
}

if (mode === "script") {
    const scriptName = options.positionals.shift();

    if (!scriptName) {
        fail(
            "Missing npm script name. Example: node scripts/benchmark.mjs script build"
        );
    }

    const npm = getNpmInvocation();
    runBenchmark({
        label: `npm run ${scriptName}`,
        command: npm.command,
        args: [...npm.args, "run", scriptName],
        runs: parseRunCount(options.runs, 5),
        showOutput: false
    });
} else if (mode === "tsc") {
    const tsc = getLocalTscInvocation();
    runBenchmark({
        label: `tsc ${tsc.args.join(" ")}`,
        command: tsc.command,
        args: tsc.args,
        runs: parseRunCount(options.runs, 1),
        showOutput: true
    });
} else {
    fail(`Unknown benchmark mode: ${mode}`);
}

function parseOptions(rawArgs) {
    const parsed = {
        help: false,
        positionals: [],
        runs: undefined
    };

    for (let index = 0; index < rawArgs.length; index += 1) {
        const arg = rawArgs[index];

        if (arg === "--help" || arg === "-h") {
            parsed.help = true;
        } else if (arg === "--runs") {
            parsed.runs = rawArgs[index + 1];
            index += 1;
        } else if (arg.startsWith("--runs=")) {
            parsed.runs = arg.slice("--runs=".length);
        } else {
            parsed.positionals.push(arg);
        }
    }

    return parsed;
}

function parseRunCount(value, defaultRuns) {
    if (value === undefined) {
        return defaultRuns;
    }

    const runs = Number(value);

    if (!Number.isInteger(runs) || runs < 1) {
        fail(`Invalid --runs value: ${value}`);
    }

    return runs;
}

function getNpmInvocation() {
    const npmExecPath = process.env.npm_execpath;

    if (npmExecPath && existsSync(npmExecPath)) {
        return {
            command: process.execPath,
            args: [npmExecPath]
        };
    }

    return {
        command: process.platform === "win32" ? "npm.cmd" : "npm",
        args: []
    };
}

function getLocalTscInvocation() {
    const binName = process.platform === "win32" ? "tsc.cmd" : "tsc";
    const tscPath = path.join(projectRoot, "node_modules", ".bin", binName);

    if (!existsSync(tscPath)) {
        fail(
            "Missing local TypeScript binary. Run npm install before benchmarking tsc."
        );
    }

    const hasBuildConfig = existsSync(
        path.join(projectRoot, "tsconfig.build.json")
    );
    const tscArgs = hasBuildConfig
        ? ["-p", "tsconfig.build.json", "--extendedDiagnostics"]
        : ["--noEmit", "--extendedDiagnostics"];

    return {
        command: tscPath,
        args: tscArgs
    };
}

function runBenchmark({ label, command, args: commandArgs, runs, showOutput }) {
    const durations = [];

    console.log(`Benchmarking: ${label}`);
    console.log(`Project: ${projectRoot}`);
    console.log(`Runs: ${runs}`);
    console.log("");

    for (let run = 1; run <= runs; run += 1) {
        const invocation = prepareSpawn(command, commandArgs);
        const startedAt = process.hrtime.bigint();
        const result = spawnSync(invocation.command, invocation.args, {
            cwd: projectRoot,
            env: {
                ...process.env,
                FORCE_COLOR: "0"
            },
            encoding: showOutput ? undefined : "utf8",
            shell: false,
            stdio: showOutput ? "inherit" : "pipe",
            windowsVerbatimArguments:
                invocation.windowsVerbatimArguments ?? false,
            windowsHide: true
        });
        const endedAt = process.hrtime.bigint();
        const seconds = Number(endedAt - startedAt) / 1_000_000_000;

        if (result.error || result.status !== 0) {
            if (!showOutput) {
                printBufferedOutput(result);
            }

            if (result.error) {
                fail(result.error.message);
            }

            process.exit(result.status ?? 1);
        }

        durations.push(seconds);
        console.log(`Run ${run}/${runs}: ${formatSeconds(seconds)}`);
    }

    printSummary(durations);
}

function prepareSpawn(command, commandArgs) {
    if (process.platform !== "win32" || !command.endsWith(".cmd")) {
        return {
            command,
            args: commandArgs
        };
    }

    const commandLine = `call ${[command, ...commandArgs].map(quoteCmdArg).join(" ")}`;

    return {
        command: "cmd.exe",
        args: ["/d", "/c", commandLine],
        windowsVerbatimArguments: true
    };
}

function quoteCmdArg(value) {
    return `"${String(value).replace(/"/g, '""')}"`;
}

function printBufferedOutput(result) {
    if (result.stdout) {
        process.stdout.write(result.stdout);
    }

    if (result.stderr) {
        process.stderr.write(result.stderr);
    }
}

function printSummary(durations) {
    const sorted = [...durations].sort((left, right) => left - right);
    const sum = durations.reduce((total, duration) => total + duration, 0);
    const middle = Math.floor(sorted.length / 2);
    const median =
        sorted.length % 2 === 0
            ? (sorted[middle - 1] + sorted[middle]) / 2
            : sorted[middle];

    console.log("");
    console.log("Summary");
    console.log(`Min: ${formatSeconds(sorted[0])}`);
    console.log(`Max: ${formatSeconds(sorted[sorted.length - 1])}`);
    console.log(`Avg: ${formatSeconds(sum / durations.length)}`);
    console.log(`Median: ${formatSeconds(median)}`);
}

function formatSeconds(seconds) {
    return `${seconds.toFixed(2)}s`;
}

function printUsage() {
    console.log(`Usage:
  node scripts/benchmark.mjs script <npm-script> [--runs=5]
  node scripts/benchmark.mjs tsc [--runs=1]

Examples:
  npm run bench:build
  npm run bench:typecheck -- --runs=10
  npm run bench:tsc`);
}

function fail(message) {
    console.error(message);
    process.exit(1);
}
