# after-you

Your browser is single-threaded. When you run a heavy loop, the UI freezes, the user can't click anything, and they eventually close the tab in rage.

`after-you` fixes this by making your code polite. It pauses your heavy logic, lets the browser paint the screen or handle a click, and then resumes exactly where it left off.

## Why?

Because `setTimeout(..., 0)` is ugly and `scheduler.postTask` isn't supported everywhere yet.

We provide a **Production-Grade Polyfill**, a **Priority Queue**, and a **Zero-Config Worker** utility. All in one tiny package.

## Install

```bash
npm install after-you
```

## Usage

1. The Polite Nod (afterYou)

Perfect for heavy for loops. It checks if you've been hogging the CPU for more than 5ms. If you have, it yields. If not, it does nothing (zero overhead).

```bash
import { afterYou } from 'after-you';

async function processHugeList(items) {
  for (const item of items) {
    doHeavyMath(item);

    // "After you, Mr. Browser. Please, paint the screen."
    await afterYou();
  }
}
```

2. The Traffic Cop (globalScheduler)

If you have 50 different tasks and need to make sure the "User Click" runs before the "Analytics Log".

```bash
import { globalScheduler, Priority } from 'after-you';

// 1. Queue background work (Runs when idle)
globalScheduler.addTask(() => sendLogs(), Priority.Low);

// 2. Queue critical work (Runs immediately)
globalScheduler.addTask(() => updateModal(), Priority.High);
```

3. The Eject Button (runInWorker)

For when yielding isn't enough. Move the function entirely off the main thread. No worker.js file required.

```bash
import { runInWorker } from 'after-you';

const heavyMath = (data) => data.map(Math.sqrt);

// Runs in a separate thread. Zero main-thread blocking.
const result = await runInWorker(heavyMath, [1, 2, 3, 4]);
```

## Documentation

Look, I'll be honest. I built this because I needed it, and I'm currently too lazy to write a full Docs.

The code is written in TypeScript and is fully typed. Just type afterYou in VS Code and let IntelliSense be your documentation.
