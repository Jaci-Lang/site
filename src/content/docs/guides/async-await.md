---
slug: async-await
title: Asynchronous Programming & Async/Await
sidebar:
  order: 5
---

Jaci provides an event-driven reactor loop, promise primitives, timer scheduling, and Communicating Sequential Processes (CSP) channels in the standard `task` library. Asynchronous programming in Jaci enables high-concurrency non-blocking I/O without requiring external event loop dependencies or manual coroutine management.

## Architecture

The asynchronous execution model is built on three core pillars:

1. **Reactor Event Loop**: An internal reactor monitors timers, non-blocking socket I/O events, and channel queues, resuming suspended threads when events fire.
2. **Promises**: A standard `Promise` representation supporting chaining (`andThen`, `catch`), resolution, rejection, and thread suspension (`await`).
3. **CSP Channels**: First-class channels supporting typed synchronization between concurrent tasks.

## Promises and `task.await`

Create promises with `task.promise` or helper constructors (`task.resolve`, `task.reject`):

```lua
local function fetchUserData(userId: number)
    return task.promise(function(resolve, reject)
        -- Perform async network or disk operation
        net.request({
            url = "https://api.example.com/users/" .. tostring(userId),
            method = "GET"
        }, function(response)
            if response.statusCode == 200 then
                resolve(json.decode(response.body))
            else
                reject("HTTP error: " .. tostring(response.statusCode))
            end
        end)
    end)
end
```

### Awaiting Promises

To suspend execution until a promise completes, call `promise:await()` or pass the promise to `task.await()`:

```lua
local function getUserName(userId: number): string
    -- Suspends current coroutine until resolved; raises error on rejection
    local user = task.await(fetchUserData(userId))
    return user.name
end
```

If the promise resolves, `task.await` returns the fulfilled values. If the promise is rejected, `task.await` raises a Luau error with the rejection reason.

### Chaining with `andThen` and `catch`

Promises support method chaining without suspending the calling thread:

```lua
fetchUserData(42)
    :andThen(function(user)
        print("User loaded:", user.name)
        return user.email
    end)
    :catch(function(err)
        warn("Failed to load user:", err)
    end)
```

## Parallel Promise Combinators

Aggregate multiple asynchronous tasks using `task.all` and `task.race`:

### `task.all`

Resolves when all input promises fulfill, returning an array of results. Rejects immediately if any input promise rejects:

```lua
local p1 = fetchUserData(101)
local p2 = fetchUserData(102)
local p3 = fetchUserData(103)

local users = task.await(task.all({ p1, p2, p3 }))
print("Loaded users:", #users)
```

### `task.race`

Resolves or rejects as soon as the first input promise settles:

```lua
local primary = fetchUserData(101)
local fallback = task.promise(function(resolve)
    task.wait(2.0)
    resolve({ name = "Default User" })
end)

local first = task.await(task.race({ primary, fallback }))
print("Result:", first.name)
```

## Timers and Task Scheduling

The `task` library provides fine-grained control over thread spawning and delayed execution.

### `task.spawn`

Spawns a function or resumes a coroutine immediately in the current frame:

```lua
task.spawn(function(msg: string)
    print("Async worker:", msg)
end, "hello from spawn")
```

### `task.defer`

Defers execution to the end of the current event loop iteration:

```lua
task.defer(function()
    print("Executes at end of frame")
end)
```

### `task.delay`

Schedules execution after a specified delay in seconds:

```lua
local timer = task.delay(1.5, function()
    print("Timer expired")
end)

-- Optionally cancel the timer before it fires
timer:cancel()
```

### `task.wait`

Yields the current thread for the specified duration (in seconds), returning the actual elapsed time:

```lua
local elapsed = task.wait(0.5)
print(string.format("Slept for %.3f seconds", elapsed))
```

## CSP Channels

Channels enable typed message passing between asynchronous tasks, following Communicating Sequential Processes semantics.

### Creating Channels

Create unbuffered or buffered channels with `task.channel`:

```lua
-- Unbuffered channel (synchronous handoff)
local syncChan = task.channel()

-- Buffered channel holding up to 10 elements
local queue = task.channel(10)
```

### Sending and Receiving

- `channel:send(val)`: Sends a value. Yields if a buffered channel is full or if an unbuffered channel has no waiting receiver.
- `channel:recv()` / `task.await(channel)`: Receives a value. Yields if no message is available. Returns `val, open_status`.
- `channel:try_send(val)`: Non-blocking send; returns `boolean` success.
- `channel:try_recv()`: Non-blocking receive; returns `val, success`.

### Producer-Consumer Example

```lua
local chan = task.channel(5)

-- Worker thread (producer)
task.spawn(function()
    for i = 1, 5 do
        chan:send("item_" .. tostring(i))
        task.wait(0.1)
    end
    chan:close()
end)

-- Consumer thread
task.spawn(function()
    while true do
        local item, ok = task.await(chan)
        if not ok then
            print("Channel closed")
            break
        end
        print("Received:", item)
    end
end)
```

## Non-blocking I/O Integration

Async operations in `net` (socket events, HTTP client) integrate directly with the reactor event loop. Network reads and writes suspend execution until the file descriptor becomes ready, leaving OS threads free to perform other work.

```lua
local net = require("net")

local function fetchHtml(url: string): string
    return task.await(task.promise(function(resolve, reject)
        net.request({ url = url, method = "GET" }, function(res)
            if res.statusCode == 200 then
                resolve(res.body)
            else
                reject(res.statusText)
            end
        end)
    end))
end
```

## Exception Handling Guidelines

1. **Unhandled Rejections**: If a promise rejects and has no `.catch()` or `task.await` call within its tick, Jaci logs an unhandled rejection warning.
2. **Error Propagation**: Using `task.await` on a rejected promise converts the rejection reason into a standard Luau error. Wrap calls in `pcall` if you wish to catch the error locally:

```lua
local success, result = pcall(function()
    return task.await(fetchUserData(-1))
end)

if not success then
    warn("Handled error:", result)
end
```
