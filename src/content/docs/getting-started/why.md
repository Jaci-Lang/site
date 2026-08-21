---
slug: why
title: Why Jaci?
sidebar:
  order: 2
---

Luau was created by Roblox to provide a fast, safe, gradually typed language evolving from Lua 5.1. While Luau delivers an excellent type system and high performance, it is historically tightly integrated with Roblox Studio and designed around a restrictive sandbox model.

## Enter Jaci

**Jaci** is an independent fork of Luau engineered specifically for:
- **General-Purpose Programming & CLI Apps**: Providing standalone filesystem, process management, and OS primitives.
- **Enhanced FFI & Native Interop**: Direct, near-zero-cost foreign function calls and C/C++ integration.
- **Blazing Fast Performance**: Aggressive native CodeGen (x64 / AArch64) and VM bytecode optimizations.
- **Asymmetric Superset Invariant**: Maintaining 100% backward compatibility with vanilla Luau code while introducing new capabilities for native embedding and standalone software development.

## Luau Baseline & Architecture

Luau's compiler and analysis tools are written from scratch, closely following Lua syntax while performing multi-pass AST analysis and type inference to emit optimized bytecode.

Jaci builds directly upon this rock-solid compiler and VM architecture, selectively curating upstream updates from Luau while pushing runtime execution speed, system integration, and language expressiveness forward.
