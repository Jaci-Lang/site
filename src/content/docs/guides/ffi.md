---
slug: ffi
title: Foreign Function Interface (FFI)
sidebar:
  order: 4
---

The `ffi` library provides direct, near-zero-cost interoperation with native C libraries and system APIs. It eliminates the need for hand-written C++ wrapper boilerplate, letting you call foreign functions and manipulate raw memory from pure Luau.

See [ADR 0004](https://github.com/Jaci-Lang/jaci/blob/master/docs/adr/0004-ffi-native-dispatch.md) for the full design rationale.

## Loading libraries

### `ffi.C` — process namespace

`ffi.C` is the global C namespace of the process. After declaring symbols with `ffi.cdef`, call them directly:

```lua
ffi.cdef[[
    double cos(double x);
    size_t strlen(const char* s);
]]

print(ffi.C.cos(0.0))        -- 1.0
print(ffi.C.strlen("hello")) -- 5
```

### `ffi.open(path)` — dynamic library

Load a shared library and get a namespace handle:

```lua
local m = ffi.open("libm.so.6")
ffi.cdef[[ double sqrt(double x); ]]
print(m.sqrt(2.0))   -- 1.4142...
```

Pass `nil` or omit `path` to reference the current process image (same as `ffi.C`).

### `ffi.sym(lib, name, rettype, ...)` — explicit symbol

Resolve a single symbol with explicit type strings when `cdef` is not convenient:

```lua
local strlen = ffi.sym(ffi.C, "strlen", "size_t", "const char*")
print(strlen("world"))  -- 5
```

## Declaring C types — `ffi.cdef`

Pass a C declaration block to `ffi.cdef`. Supported constructs:

- Function prototypes: `int open(const char* path, int flags);`
- Typedefs: `typedef unsigned int uint32_t;`
- Struct declarations (opaque or defined)

```lua
ffi.cdef[[
    typedef struct {
        int x;
        int y;
    } Point;

    int printf(const char* fmt, ...);
]]
```

After `cdef`, declared symbols are accessible on `ffi.C` (or the library handle).

## Raw memory

### `ffi.new(type, count?)`

Allocate a Luau `buffer` sized to the C type (optionally an array):

```lua
local buf = ffi.new("int", 4)    -- 4 × sizeof(int) bytes
local ptr = ffi.ptr(buf)
```

### `ffi.ptr(buffer | string)`

Get a raw lightuserdata pointer to the underlying data:

```lua
local s   = "hello"
local ptr = ffi.ptr(s)   -- pointer to string bytes (read-only)
```

### `ffi.string(ptr, len?)`

Read a null-terminated C string (or exactly `len` bytes) back into a Luau string:

```lua
ffi.cdef[[ char* getenv(const char* name); ]]
local val = ffi.string(ffi.C.getenv("HOME"))
print(val)  -- /home/user
```

### `ffi.copy(dst, src, len)` / `ffi.fill(dst, len, val)`

Direct memory transfer and byte-fill:

```lua
local a = ffi.new("char", 16)
local b = ffi.new("char", 16)
ffi.fill(ffi.ptr(a), 16, 0)          -- zero-fill
ffi.copy(ffi.ptr(b), ffi.ptr(a), 16) -- copy a -> b
```

### `ffi.read(ptr, offset, type)` / `ffi.write(ptr, offset, type, value)`

Typed memory access at a byte offset:

```lua
local buf = ffi.new("uint8_t", 8)
local p   = ffi.ptr(buf)
ffi.write(p, 0, "uint32_t", 0xDEADBEEF)
print(ffi.read(p, 0, "uint32_t"))   -- 3735928559
```

Supported type strings: `uint8_t`, `int8_t`, `uint16_t`, `int16_t`, `uint32_t`, `int32_t`, `uint64_t`, `int64_t`, `float`, `double`, `uintptr_t`.

## Struct layout

`ffi.struct` computes natural field offsets and alignment:

```lua
local Point = ffi.struct({
    { "x", "float" },
    { "y", "float" },
})
-- Point.size, Point.align, Point.offsets.x, Point.offsets.y
```

## Type introspection

```lua
ffi.sizeof("double")    -- 8
ffi.alignof("double")   -- 8
ffi.sizeof("uint32_t")  -- 4
```

## Error handling — `ffi.errno`

Read or set the platform `errno` value:

```lua
ffi.cdef[[ int open(const char* path, int flags); ]]
local fd = ffi.C.open("/nonexistent", 0)
if fd < 0 then
    print("errno:", ffi.errno())  -- e.g. 2 (ENOENT)
end
```

## Calling convention

On x86-64 (System V AMD64), Jaci dispatches FFI calls via a direct register-mapped trampoline:

- Integer / pointer arguments: `rdi`, `rsi`, `rdx`, `rcx`, `r8`, `r9`
- Floating-point arguments: `xmm0` .. `xmm7`
- Return values follow the same ABI conventions

There is no intermediate Lua-to-C bridge layer. The call cost is equivalent to a direct `call` instruction in generated machine code. A portable typed fallback handles other architectures.

## Safety & Capability Policies

To prevent untrusted code execution and memory corruption, Jaci provides capability-gated security policies and memory validation (see [ADR 0013](https://github.com/jaci-lang/jaci/blob/master/docs/adr/0013-secure-ffi-and-memory-safety.md)):

```lua
-- Configure FFI execution mode: "strict", "permissive", or "disabled"
ffi.mode("strict")

-- Manage library allowlists and denylists
ffi.allowLibrary("libm.so.6")
ffi.denyLibrary("libcrypto.so")

-- Validate pointer address and size
if ffi.isSafe(ptr, 64) then
    -- perform memory operation
end

-- Validate runtime types and struct layouts
assert(ffi.istype("Point", buf))
local pointLayout = ffi.struct("Point", { x = "int", y = "int" })
print("Size:", pointLayout.size, "Alignment:", pointLayout.align)
```

## Full example — wrapping `zlib`

```lua
ffi.cdef[[
    typedef struct z_stream_s z_stream;
    unsigned long crc32(unsigned long crc, const char* buf, unsigned len);
]]

local zlib = ffi.open("libz.so.1")

local function file_crc32(path)
    local data = fs.readfile(path)
    return zlib.crc32(0, data, #data)
end

print(string.format("0x%08X", file_crc32("README.md")))
```
