---
slug: modules
title: Modules & Universal Require
sidebar:
  order: 5
---

Jaci features a universal module resolution system that bridges standalone filesystem paths, project aliases, directory entry points, and traditional Roblox-style object hierarchies (see [ADR 0010](https://github.com/jaci-lang/jaci/blob/master/docs/adr/0010-universal-module-system-and-package-resolution.md)).

## Require Syntax & Forms

`require` in Jaci seamlessly resolves relative filesystem paths, package descriptors, and standard libraries:

```luau
-- Relative filesystem paths
local mathUtils = require("./utils/math")
local config = require("../config.luau")

-- Package & directory modules (resolves init.luau or package main)
local components = require("./ui/components")

-- Project aliases configured in jaci.json / luau.json
local api = require("@api/client")
local helpers = require("@helpers")

-- Standard and virtual libraries
local net = require("@std/net")
local task = require("@std/task")
```

## Module Resolution Algorithm

When evaluating `require(path)`:

1. **Path Normalization & Relative Files**:
   - If the path starts with `./` or `../`, it resolves relative to the calling script's directory.
   - Probes `<path>`, `<path>.luau`, `<path>.lua`.

2. **Directory & Package Entrypoints**:
   - If `<path>` is a directory, Jaci searches for:
     1. `<path>/init.luau` or `<path>/init.lua`
     2. `<path>/index.luau` or `<path>/index.lua`
     3. `<path>/main.luau` or `<path>/main.lua`
     4. `package.json` or `luau.json` or `jaci.json` pointing to `"main"`

3. **Project Configuration (`jaci.json` / `luau.json`)**:
   - Jaci traverses ancestor directories looking for `jaci.json`, `luau.json`, or `.luauproject.json`.
   - Resolves alias mappings (e.g. `"@api": "./src/api"`).

4. **Circular Dependency Detection & Caching**:
   - Evaluated modules are cached in the internal module registry. Repeated requires return the cached table without re-executing bytecode.
   - Circular requires fail gracefully with descriptive call stack diagnostics.
