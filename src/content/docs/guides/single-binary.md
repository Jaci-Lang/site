---
slug: single-binary
title: Single Binary & Cross-Compilation
sidebar:
  order: 6
---

Jaci includes a standalone single-binary compiler capable of packing entire Luau applications, compiled bytecode, dependency graphs, and static assets into a self-contained executable with zero external runtime dependencies (see [ADR 0011](https://github.com/jaci-lang/jaci/blob/master/docs/adr/0011-native-aot-single-binary-compiler.md) and [ADR 0014](https://github.com/jaci-lang/jaci/blob/master/docs/adr/0014-cross-compilation-and-asset-bundling.md)).

## Building a Standalone Executable

To compile a project into a self-executing standalone binary:

```bash
# Compile entry point script into executable
luau --bundle src/main.luau -o my-app

# Run the generated native binary
./my-app
```

## Cross-Compilation

Jaci supports generating portable binaries targeting major operating systems and architectures:

```bash
# Target Linux x86_64
luau --bundle src/main.luau --target linux-x64 -o my-app-linux-x64

# Target Linux AArch64
luau --bundle src/main.luau --target linux-arm64 -o my-app-linux-arm64

# Target Windows x86_64
luau --bundle src/main.luau --target windows-x64 -o my-app.exe

# Target macOS Apple Silicon
luau --bundle src/main.luau --target macos-arm64 -o my-app-macos-arm64
```

## Embedding Static Assets & Virtual Filesystem

You can bundle static assets (such as HTML templates, schemas, configurations, or images) directly into the executable payload:

```bash
luau --bundle src/main.luau --include-assets ./assets -o my-server
```

Inside the bundled application, embedded assets and modules are transparently accessible via standard `fs` or `require`:

```luau
local fs = require("@std/fs")
local template = fs.readFile("./assets/index.html")
print(template)
```
