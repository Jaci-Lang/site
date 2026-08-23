---
slug: install
title: Installing with jaciup
sidebar:
  order: 2
---

`jaciup` is the official toolchain installer and version manager for Jaci. One command installs the whole stack — the Jaci engine (`luau`, `luau-analyze`, `luau-compile`, `luau-ast`), the KLUR layer, and universal shims — and activates it as your default toolchain.

## One-liner

Linux and macOS (bash):

```bash
curl -fsSL https://raw.githubusercontent.com/Jaci-Lang/jaciup/main/scripts/install.sh | bash
```

Windows (PowerShell):

```powershell
iwr -UseBasicParsing https://raw.githubusercontent.com/Jaci-Lang/jaciup/main/scripts/install.ps1 -OutFile install.ps1
.\install.ps1
```

Add `--no-toolchain` to install jaciup alone (engine and KLUR can be added later with `jaciup toolchain install latest`).

## What the installer does

1. Downloads the latest prebuilt `jaciup` binary (SHA-256 verified) into `~/.jaciup/bin`.
2. Runs `jaciup init`, which creates the layout and adds `~/.jaciup/bin` to your shell PATH:
   - `~/.jaciup/settings.toml` — global configuration (default toolchain, mirrors).
   - `~/.jaciup/bin/` — shims for `jaciup`, `luau`, `luau-analyze`, `luau-compile`, `luau-ast`, `klur`.
   - `~/.jaciup/toolchains/<channel>/` — installed toolchains.
   - `~/.jaciup/downloads/` — download cache with checksum verification.
3. Installs and activates the latest toolchain: the Jaci engine plus the KLUR layer. Installing a toolchain always makes it the default.

Open a new shell and verify:

```bash
luau --version    # Jaci engine
klur version      # KLUR layer
```

## Common commands

| Command | Effect |
| :--- | :--- |
| `jaciup toolchain install latest` | Install the latest engine + KLUR layer (default channel). |
| `jaciup toolchain install 0.314.0` | Install a specific engine version as its own channel. |
| `jaciup toolchain klur` | (Re)install the KLUR layer for the active toolchain. |
| `jaciup toolchain list` | List installed toolchains (active / default markers). |
| `jaciup default <name>` | Set the default toolchain. |
| `jaciup toolchain link dev .` | Link a local engine checkout as a toolchain. |
| `jaciup which <binary>` | Print the resolved binary path for the active toolchain. |
| `jaciup doctor` | Diagnose the installation (toolchains, shims, PATH). |

## Updating

The main update path is jaciup itself, not the install script:

```bash
jaciup bootstrap        # self-update the jaciup binary from the releases API
jaciup toolchain install latest   # pull a newer engine + KLUR into the toolchain
```

The `install.sh` / `install.ps1` scripts are for first-time installation only; re-running them simply installs the newest jaciup and skips an already-installed toolchain.

## Working with a local engine checkout

Developing against the engine source tree (e.g. a `build/` directory)? Link it as a toolchain instead of installing:

```bash
jaciup toolchain link dev .
jaciup default dev
```

Your `luau` shim now resolves to the local checkout, and `jaciup default latest` switches back.

## KLUR

The KLUR layer ships the `klur` CLI: a pure-Luau runtime, standard library (`@klur/*`), package manager, test runner, and single-binary compiler.

```bash
klur init        # scaffold a project (Packagefile, src/, tests/)
klur run app.luau
klur test        # run the test suite
klur build app   # compile an application into a single binary
```

## Manual install (no jaciup)

Download the `luau-<triple>.zip` matching your platform from the [releases](https://github.com/Jaci-Lang/jaci/releases) — for example `luau-x86_64-unknown-linux-gnu.zip`, `luau-aarch64-apple-darwin.zip` (macOS arm64), or `luau-x86_64-pc-windows-msvc.zip` — verify it against the `SHA256SUMS.txt` / per-file `.sha256` checksums in the same release, extract the binaries, and put them in your `PATH`.
