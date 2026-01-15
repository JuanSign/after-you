# after-you

![npm](https://img.shields.io/npm/v/after-you) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/after-you) ![license](https://img.shields.io/npm/l/after-you)

Your browser is single-threaded. When you run a heavy loop, the UI freezes, the user can't click anything, and they eventually close the tab in rage.

**`after-you`** fixes this by making your code polite. It pauses your heavy logic, lets the browser paint the screen or handle a click, and then resumes exactly where it left off.

## Why?

Because `setTimeout(..., 0)` is ugly and `scheduler.postTask` isn't supported everywhere yet.

We provide a **Production-Grade Polyfill**, a **Priority Queue**, and a **Zero-Config Worker** utility. All in one tiny package.

| Feature                 | `setTimeout` | `postTask`  | `after-you` |
| :---------------------- | :----------- | :---------- | :---------- |
| **Non-Blocking**        | Yes          | Yes         | **Yes**     |
| **Priority Support**    | No           | Yes         | **Yes**     |
| **Zero-Overhead Check** | No           | No          | **Yes**     |
| **Browser Support**     | All          | Chrome-only | **All**     |

## Install

```bash
npm install after-you
```

## Usage

1. The Polite Nod (**`afterYou`**)

Perfect for heavy loops. It checks if you've been hogging the CPU for more than 5ms. If you have, it yields. If not, it does nothing (zero overhead).

```javascript
import { afterYou } from 'after-you';

async function processHugeList(items) {
  for (const item of items) {
    doHeavyMath(item);

    // "After you, Mr. Browser. Please, paint the screen."
    await afterYou();
  }
```

Configuration:

```javascript
// override the default 5ms budget
await afterYou({ budget: 16 });
```

---

2. The Traffic Cop (**`globalScheduler`**)

If you have 50 different tasks and need to make sure "User Click" runs before "Analytics Log".

```javascript
import { globalScheduler, Priority } from 'after-you';

// 1. Queue background work (Runs when idle)
globalScheduler.addTask(() => sendLogs(), Priority.Low);

// 2. Queue critical work (Runs immediately)
globalScheduler.addTask(() => updateModal(), Priority.High);
```

---

3. The Eject Button (**`runInWorker`**)

For when yielding isn't enough. Move the function entirely off the main thread. No `worker.js` file required, we generate it on the fly.

```javascript
import { runInWorker } from 'after-you';

const heavyMath = data => data.map(Math.sqrt);

// Runs in a separate thread. Zero main-thread blocking.
const result = await runInWorker(heavyMath, [1, 2, 3, 4], {
  // Optional: Load external libraries into the worker
  imports: [''],
});
```

> Functions passed to `runInWorker` are **isolated**. They cannot access variables outside their scope (closures). Pass all data via arguments.

---

## Documentation

Look, I'll be honest. I built this because I needed it, and I'm currently too lazy to write full Docs.

But since you are here, here is the cheat sheet:

- **`afterYou(options?)`**
  - `budget` (default 5): Max time (ms) before yielding.
  - `force` (default false): Force a yield regardless of time.

- **`runInWorker(fn, args, options?)`**
  - `imports`: Array of URL strings to load scripts inside the worker.
  - `timeout`: Max time (ms) before killing the worker.

- **`globalScheduler`**
  - `addTask(fn, priority)`: Returns a taskId.
  - `cancelTask(taskId)`: Stops a task from running if it hasn't started yet.

The code is written in TypeScript and is fully typed. Just type afterYou in VS Code and let IntelliSense be your guide.
