---
slug: sandbox
title: Standalone Execution & Embedding Sandbox
sidebar:
  order: 2
---

Unlike vanilla Luau which ran in an unconditionally sandboxed environment suitable primarily for Roblox Studio, **Jaci is designed as a standalone general-purpose programming runtime** (see [ADR 0003](https://github.com/jaci-lang/jaci/blob/master/docs/adr/0003-sandbox-relaxation-and-filesystem-runtime.md)).

In Jaci:
- Standalone CLI execution (`luau script.luau`) runs with full POSIX-class capabilities: filesystem (`fs`), standard streams (`io`), processes (`process`), networking (`net`), and native C interop (`ffi`).
- Host applications embedding Jaci that require strict multi-tenant or untrusted execution can invoke `luaL_sandbox(L)` explicitly after initialization.

## Standalone Capabilities

Jaci restores and expands system runtime capabilities:
- `fs` library for direct file and directory manipulation.
- `io` library for stream manipulation (`io.stdin`, `io.stdout`, `io.stderr`, `io.open`, `io.popen`).
- `os` extensions (`os.getenv`, `os.setenv`, `os.execute`, `os.remove`, `os.rename`, `os.exit`, `os.tmpname`).
- `loadfile` and `dofile` for dynamic code loading from disk.
- `ffi` for direct native C function calls and raw memory access.

## Explicit Host Sandboxing

For embedders that execute untrusted user code, Jaci retains full sandboxing primitives:
- `luaL_sandbox(L)`: Marks global tables, library tables, and metatables as read-only.
- `luaL_sandboxthread(L)`: Creates isolated global environments per thread with fallback lookup to builtin globals.

- `collectgarbage` only works with `"count"` argument, as modifying the state of GC can interfere with the expectations of other code running in the process. As such, `collectgarbage()` became an inferior version of `gcinfo()` and is deprecated.
- `newproxy` only works with `true`/`false`/`nil` arguments.
- `module` allowed overriding global packages and was removed as a result.

> Note: `getfenv`/`setfenv` result in additional isolation challenges, as they allow injecting globals into scripts on the call stack. Ideally, these should be disabled as well, but unfortunately Roblox community relies on these for various reasons. This can be mitigated by limiting interaction between trusted and untrusted code, and/or using separate VMs.

## Environment

The modification to the library functions are sufficient to make embedding safe, but aren't sufficient to provide isolation within the same VM. It should be noted that to achieve guaranteed isolation, it's advisable to load trusted and untrusted code into separate VMs; however, even within the same VM Luau provides additional safety features to make isolation cheaper.

When initializing the default globals table, the tables are protected from modification:

- All libraries (`string`, `math`, etc.) are marked as readonly
- The string metatable is marked as readonly
- The global table itself is marked as readonly

This is using the VM feature that is not accessible from scripts, that prevents all writes to the table, including assignments, `rawset` and `setmetatable`. This makes sure that globals can't be monkey-patched in place, and can only be substituted through `setfenv`.

By itself this would mean that code that runs in Luau can't use globals at all, since assigning globals would fail. While this is feasible, in Roblox we solve this by creating a new global table for each script, that uses `__index` to point to the builtin global table. This safely sandboxes the builtin globals while still allowing writing globals from each script. This also means that short of exposing special shared globals from the host, all scripts are isolated from each other.

## `__gc`

Lua 5.1 exposes a `__gc` metamethod for userdata, which can be used on proxies (`newproxy`) to hook into garbage collector. Later versions of Lua extend this mechanism to work on tables.

This mechanism is bad for performance, memory safety and isolation:

- In Lua 5.1, `__gc` support requires traversing userdata lists redundantly during garbage collection to filter out finalizable objects
- In later versions of Lua, userdata that implement `__gc` are split into separate lists; however, finalization prolongs the lifetime of the finalized objects which results in less prompt memory reclamation, and two-step destruction results in extra cache misses for userdata
- `__gc` runs during garbage collection in context of an arbitrary thread which makes the thread identity mechanism used in Roblox to support trusted Luau code invalid
- Objects can be removed from weak tables *after* being finalized, which means that accessing these objects can result in memory safety bugs, unless all exposed userdata methods guard against use-after-gc.
- If `__gc` method ever leaks to scripts, they can call it directly on an object and use any method exposed by that object after that. This means that `__gc` and all other exposed methods must support memory safety when called on a destroyed object.

Because of these issues, Luau does not support `__gc`. Instead it uses tag-based destructors that can perform additional memory cleanup during userdata destruction; crucially, these are only available to the host (so they can never be invoked manually), and they run right before freeing the userdata memory block which is both optimal for performance, and guaranteed to be memory safe.

For monitoring garbage collector behavior the recommendation is to use weak tables instead.

## Interrupts

In addition to preventing API access, it can be important for isolation to limit the memory and CPU usage of code that runs inside the VM.

By default, no memory limits are imposed on the running code, so it's possible to exhaust the address space of the host; this is easy to configure from the host for Luau allocations, but of course with a rich API surface exposed by the host it's hard to eliminate this as a possibility. Memory exhaustion doesn't result in memory safety issues or any particular risk to the system that's running the host process, other than the host process getting terminated by the OS.

Limiting CPU usage can be equally challenging with a rich API. However, Luau does provide a VM-level feature to try to contain runaway scripts which makes it possible to terminate any script externally. This works through a global interrupt mechanism, where the host can setup an interrupt handler at any point, and any Luau code is guaranteed to call this handler "eventually" (in practice this can happen at any function call or at any loop iteration). This still leaves the possibility of a very long running script open if the script manages to find a way to call a single C function that takes a lot of time, but short of that the interruption is very prompt.

Roblox sets up the interrupt handler using a watchdog that:

- Limits the runtime of any script in Studio to 10 seconds (configurable through Studio settings)
- Upon client shutdown, interrupts execution of every running script 1 second after shutdown
