#!/usr/bin/env node
// Runs backend + frontend together with prefixed, colored output.
import { spawn } from 'node:child_process';

const procs = [
  { name: 'backend ', color: '\x1b[35m', cmd: 'npm', args: ['--prefix', 'backend', 'run', 'dev'] },
  { name: 'frontend', color: '\x1b[36m', cmd: 'npm', args: ['--prefix', 'frontend', 'run', 'dev'] },
];

const children = procs.map(({ name, color, cmd, args }) => {
  const child = spawn(cmd, args, { cwd: process.cwd(), shell: true });
  const tag = `${color}[${name}]\x1b[0m `;
  const pipe = (stream) =>
    stream.on('data', (d) =>
      d
        .toString()
        .split('\n')
        .filter(Boolean)
        .forEach((line) => process.stdout.write(tag + line + '\n')),
    );
  pipe(child.stdout);
  pipe(child.stderr);
  return child;
});

const shutdown = () => {
  children.forEach((c) => c.kill('SIGINT'));
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
