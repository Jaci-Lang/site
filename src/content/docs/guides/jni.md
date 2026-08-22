---
slug: jni
title: Java Native Interface (JNI)
sidebar:
  order: 5
---

The `jni` library provides direct, in-process interoperation with Java Virtual Machines (JVM). Similar to Julia's high-performance [JavaCall.jl](https://github.com/JuliaInterop/JavaCall.jl), Jaci loads the JVM shared library (`libjvm.so`, `libjvm.dylib`, or `jvm.dll`) directly into the Jaci runtime process without external child processes, REST, or JSON-RPC serialization bottlenecks.

See [ADR 0021](https://github.com/Jaci-Lang/jaci/blob/master/docs/adr/0021-native-jni-interop.md) for the full architectural specification.

## Quick Start

```lua
-- 1. Automatic initialization and class resolution
local Math = jni.find_class("java.lang.Math")
print("Math.PI:", Math.PI)
print("Math.sqrt(64):", Math.sqrt(64))

-- 2. Object instantiation and method chaining
local StringBuilder = jni.find_class("java.lang.StringBuilder")
local sb = StringBuilder:new("Hello")
sb:append(" ")
sb:append("from JNI!")
print(sb:toString()) -- "Hello from JNI!"
```

## JVM Lifecycle Management

### Automatic Initialization

If you do not call `jni.init()` explicitly, Jaci automatically detects the system JVM and initializes it on the first call to any JNI function.

### Explicit Initialization (`jni.init`)

To specify a custom classpath or JVM flags (such as heap limits), call `jni.init` before accessing Java classes:

```lua
jni.init({
    classpath = {
        "/path/to/my-app.jar",
        "/libs/commons-lang3.jar"
    },
    options = {
        "-Xmx4g",
        "-Dfile.encoding=UTF-8"
    }
})
```

### Version & Status Queries

```lua
print("JVM Initialized:", jni.is_initialized())
print("JVM Version:", jni.get_version())
print("JVM Path:", jni.find_jvm_path())
```

## Working with Java Classes & Objects

### Instantiation

You can instantiate classes using `:new(...)`, calling the class directly `Class(...)`, or using `jni.new(...)`:

```lua
local ArrayList = jni.find_class("java.util.ArrayList")

-- All three styles are equivalent:
local list1 = ArrayList:new()
local list2 = ArrayList()
local list3 = jni.new("java.util.ArrayList")
```

### Static Fields and Methods

Static methods and fields are accessed directly on the `JClass` object:

```lua
local System = jni.find_class("java.lang.System")
print("Current Time Millis:", System.currentTimeMillis())

local Integer = jni.find_class("java.lang.Integer")
print("Max Int:", Integer.MAX_VALUE)
```

### Instance Methods and Fields

Instance methods are called using colon notation (`:method(...)`). Luau types are automatically converted to corresponding Java types and return values are converted back to Luau types:

```lua
local BigInteger = jni.find_class("java.math.BigInteger")
local a = BigInteger:new("123456789012345678901234567890")
local b = BigInteger:new("987654321098765432109876543210")

local sum = a:add(b)
print("Sum:", sum:toString())
```

## Type Conversions

### Primitive Types

| Luau Type | Java Type | Notes |
| :--- | :--- | :--- |
| `boolean` | `boolean` / `Boolean` | Exact mapping |
| `number` | `int`, `long`, `float`, `double` | Automatic numeric conversion |
| `string` | `String` / `CharSequence` | UTF-8 conversion |
| `buffer` | `byte[]` or `ByteBuffer` | Direct memory sharing |
| `table` | `ArrayList` or `HashMap` | Via `jni.to_java` |

### Explicit Typed Primaries

When calling overloaded Java methods that have ambiguous signatures (such as `foo(int)` vs `foo(long)`), use explicit typed constructors:

```lua
local valInt = jni.jint(42)
local valLong = jni.jlong(42)
local valFloat = jni.jfloat(3.14)
local valDouble = jni.jdouble(3.14)
```

### Java Arrays (`jni.array`)

Create Java primitive or object arrays with 1-based Luau indexing:

```lua
-- Create an int array
local arr = jni.array("int", {10, 20, 30, 40})
print("Length:", #arr)       -- 4
print("First item:", arr[1]) -- 10
arr[1] = 99

-- Convert array back to a pure Luau table
local tbl = arr:to_table()
```

### Zero-Copy Buffers (`jni.wrap_buffer`)

Wrap native Luau buffers into `java.nio.DirectByteBuffer` instances without memory copying:

```lua
local buf = buffer.create(64)
buffer.writestring(buf, 0, "Zero-copy shared memory")

local byteBuf = jni.wrap_buffer(buf)
print("Capacity:", byteBuf:capacity())
print("Byte 0:", byteBuf:get(0))
```

### Collections Roundtripping (`to_java` and `to_luau`)

Convert complex nested Luau tables directly into Java collection hierarchies (`java.util.HashMap` and `java.util.ArrayList`) and back:

```lua
local payload = {
    title = "Analysis Report",
    scores = { 98, 85, 92 },
    metadata = { author = "Jaci", version = 2 }
}

-- Convert to java.util.Map / java.util.List
local javaMap = jni.to_java(payload)

-- Convert back to a native Luau table
local luauCopy = jni.to_luau(javaMap)
assert(luauCopy.metadata.author == "Jaci")
```

## Local Reference Frames (`jni.with_local_frame`)

When executing tight loops that allocate thousands of temporary Java objects, wrap the loop in `jni.with_local_frame` to automatically reclaim JNI local references:

```lua
jni.with_local_frame(32, function()
    local String = jni.find_class("java.lang.String")
    for i = 1, 100000 do
        local s = String.valueOf(i)
        -- Local references are released when exiting frame
    end
end)
```

## Exception Handling

Java exceptions are intercepted and translated into catchable Luau runtime errors containing the complete formatted Java stack trace:

```lua
local Integer = jni.find_class("java.lang.Integer")
local ok, err = pcall(function()
    Integer.parseInt("invalid_number")
end)

if not ok then
    print("Caught Java Exception:")
    print(err)
    -- Displays: java.lang.NumberFormatException: For input string: "invalid_number"
end
```
