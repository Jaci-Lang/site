---
permalink: /profile
title: Profiling Jaci code
sidebar:
  order: 3
---

Jaci provides a built-in sampling profiler for identifying performance bottlenecks. Run an optimized build with `--profile` to collect samples:

```
$ luau --profile tests/chess.lua
OK      8902    rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
OK      2039    r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 0
OK      2812    8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 0
OK      9467    r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1
OK      1486    rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8
OK      2079    r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10
Profiler dump written to profile.out (total runtime 2.034 seconds, 20344 samples, 374 stacks)
GC: 0.378 seconds (18.58%), mark 46.80%, remark 3.33%, atomic 1.93%, sweepstring 6.77%, sweep 41.16%
```

Convert the dump to an interactive flame graph SVG:

```
$ python tools/perfgraph.py profile.out >profile.svg
```

Open the SVG in a browser. Bars represent function calls; width represents CPU time; nesting matches the call stack. Hover over bars for detailed function and source location information. Use Ctrl+F to search for specific functions.

Adjust sampling frequency with `--profile=<freq>` (default: 10 kHz). Higher frequencies increase overhead and may skew results.

## CodeGen and native dispatch

Jaci's multi-tier LLVM pipeline can significantly reduce hot-path overhead. To benchmark native versus interpreted execution:

```
$ luau --codegen --profile myapp.lua
```

The profiler attributes time to Luau call frames. Native-compiled functions appear in the flame graph with their source names intact; time spent in inlined or fused native stubs is attributed to the calling Luau function.

## FFI and native call profiling

Calls through `ffi.C` or `ffi.sym` are dispatched directly without a Lua-to-C bridging overhead. The profiler attributes the full call duration (including native execution) to the Luau function that initiated the call. Use system-level profilers (e.g., `perf`, `Instruments`) for sub-symbol resolution inside native libraries.

## GC tuning

The GC summary line in the profiler output breaks down mark, sweep, and atomic phases. If GC occupies a significant portion of runtime, tune the collector step rate:

```lua
-- Increase GC step multiplier to reduce GC frequency at the cost of memory
collectgarbage("setstepmul", 400)
```

## Tips

- Build with `CMAKE_BUILD_TYPE=Release` before profiling to avoid debug overhead.
- Name all hot functions explicitly: `local function f()` instead of `local f = function()` — this preserves names in the flame graph.
- Leaf C functions (including `ffi` calls) are attributed to their Luau callers; account for this when reading profiles.
- Coroutine resume time is attributed to the resumed thread, not the parent.
