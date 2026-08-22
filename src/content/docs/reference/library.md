---
slug: library
title: Standard Library
description: The official reference for Jaci's standard library.
sidebar:
  order: 1
---

Jaci provides a comprehensive standard library designed for standalone application development, systems programming, and high-performance computing. In addition to core Luau libraries (`table`, `string`, `math`, `bit32`, `utf8`, `buffer`, `vector`), Jaci includes full POSIX-class filesystem, IO streams, foreign function interface (FFI), JSON processing, cryptographic hashing, process spawning, networking, and asynchronous task management.

This page documents the available builtin libraries and functions. All of these are accessible by default by any script outside sandboxed contexts.

## Global functions

While most library functions are provided as part of a library like `table`, a few global functions are exposed without extra namespacing.

```
function assert<T>(value: T, message: string?): T
```

`assert` checks if the value is truthy; if it's not (which means it's `false` or `nil`), it raises an error. The error message can be customized with an optional parameter.
Upon success the function returns the `value` argument.

```
function error(obj: any, level: number?)
```

`error` raises an error with the specified object. Note that errors don't have to be strings, although they often are by convention; various error handling mechanisms like `pcall`
preserve the error type. When `level` is specified, the error raised is turned into a string that contains call frame information for the caller at level `level`, where `1` refers
to the function that called `error`. This can be useful to attribute the errors to callers, for example `error("Expected a valid object", 2)` highlights the caller of the function
that called `error` instead of the function itself in the callstack.

```
function gcinfo(): number
```

`gcinfo` returns the total heap size in kilobytes, which includes bytecode objects, global tables as well as the script-allocated objects. Note that Luau uses an incremental
garbage collector, and as such at any given point in time the heap may contain both reachable and unreachable objects. The number returned by `gcinfo` reflects the current heap
consumption from the operating system perspective and can fluctuate over time as garbage collector frees objects.

```
function getfenv(target: (function | number)?): table
```

Returns the environment table for target function; when `target` is not a function, it must be a number corresponding to the caller stack index, where 1 means the function that calls `getfenv`, and the environment table is returned for the corresponding function from the call stack. When `target` is omitted it defaults to `1`, so `getfenv()` returns the environment table for the calling function.

```
function getmetatable(obj: any): table?
```

Returns the metatable for the specified object; when object is not a table or a userdata, the returned metatable is shared between all objects of the same type. Note that when metatable is protected (has a `__metatable` key), the value corresponding to that key is returned instead and may not be a table.

```
function next<K, V>(t: { [K]: V }, i: K?): (K, V)?
```

Given the table `t`, returns the next key-value pair after `i` in the table traversal order, or nothing if `i` is the last key. When `i` is `nil`, returns the first key-value pair instead.

```
function newproxy(mt: boolean?): userdata
```

Creates a new untyped userdata object; when `mt` is true, the new object has an empty metatable that can be modified using `getmetatable`.

```
function print(args: ...any)
```

Prints all arguments to the standard output, using Tab as a separator.

```
function rawequal(a: any, b: any): boolean
```

Returns true iff `a` and `b` have the same type and point to the same object (for garbage collected types) or are equal (for value types).

```
function rawget<K, V>(t: { [K]: V }, k: K): V?
```

Performs a table lookup with index `k` and returns the resulting value, if present in the table, or nil. This operation bypasses metatables/`__index`.

```
function rawlen<K, V>(t: { [K]: V } | string): number
```

Returns the raw length of the table or string. If it is a string, this operation is identical to `#str` or `string.len(str)`. This operation bypasses metatables/`__len`.

```
function rawset<K, V>(t: { [K] : V }, k: K, v: V)
```

Assigns table field `k` to the value `v`. This operation bypasses metatables/`__newindex`.

```
function select<T>(i: string, args: ...T): number
function select<T>(i: number, args: ...T): ...T
```

When called with `'#'` as the first argument, returns the number of remaining parameters passed. Otherwise, returns the subset of parameters starting with the specified index.
Index can be specified from the start of the arguments (using 1 as the first argument), or from the end (using -1 as the last argument).

```
function setfenv(target: function | number, env: table)
```

Changes the environment table for target function to `env`; when `target` is not a function, it must be a number corresponding to the caller stack index, where 1 means the function that calls `setfenv`, and the environment table is returned for the corresponding function from the call stack.

```
function setmetatable(t: table, mt: table?)
```

Changes metatable for the given table. Note that unlike `getmetatable`, this function only works on tables. If the table already has a protected metatable (has a `__metatable` field), this function errors.

```
function tonumber(s: string, base: number?): number?
```

Converts the input string to the number in base `base` (default 10) and returns the resulting number. If the conversion fails (that is, if the input string doesn't represent a valid number in the specified base), returns `nil` instead.

```
function tostring(obj: any): string
```

Converts the input object to string and returns the result. If the object has a metatable with `__tostring` field, that method is called to perform the conversion.

```
function type(obj: any): string
```

Returns the type of the object, which is one of `"nil"`, `"boolean"`, `"number"`, `"vector"`, `"string"`, `"table"`, `"function"`, `"userdata"`, `"thread"`, or `"buffer"`.

```
function typeof(obj: any): string
```

Returns the type of the object; for userdata objects that have a metatable with the `__type` field *and* are defined by the host (not `newproxy`), returns the value for that key.
For custom userdata objects, such as ones returned by `newproxy`, this function returns `"userdata"` to make sure host-defined types can not be spoofed.

```
function ipairs(t: table): <iterator>
```

Returns the triple (generator, state, nil) that can be used to traverse the table using a `for` loop. The traversal results in key-value pairs for the numeric portion of the table; key starts from 1 and increases by 1 on each iteration. The traversal terminates when reaching the first `nil` value (so `ipairs` can't be used to traverse array-like tables with holes).

```
function pairs(t: table): <iterator>
```

Returns the triple (generator, state, nil) that can be used to traverse the table using a `for` loop. The traversal results in key-value pairs for all keys in the table, numeric and otherwise, but doesn't have a defined order.

```
function pcall(f: function, args: ...any): (boolean, ...any)
```

Calls function `f` with parameters `args`. If the function succeeds, returns `true` followed by all return values of `f`. If the function raises an error, returns `false` followed by the error object.
Note that `f` can yield, which results in the entire coroutine yielding as well.

```
function xpcall(f: function, e: function, args: ...any): (boolean, ...any)
```

Calls function `f` with parameters `args`. If the function succeeds,  returns `true` followed by all return values of `f`. If the function raises an error, calls `e` with the error object as an argument, and returns `false` followed by the first return value of `e`.
Note that `f` can yield, which results in the entire coroutine yielding as well.
`e` can neither yield nor error - if it does raise an error, `xpcall` returns with `false` followed by a special error message.

```
function unpack<V>(a: {V}, f: number?, t: number?): ...V
```

Returns all values of `a` with indices in `[f..t]` range. `f` defaults to 1 and `t` defaults to `#a`. Note that this is equivalent to `table.unpack`.

```
function loadfile(filename: string, chunkname: string?): ((...any) -> ...any)?, string?
```

Compiles a Luau/Jaci source file from the filesystem into a function chunk. On success, returns the compiled function. On compilation or IO failure, returns `nil` followed by the error message. Respects current codegen/JIT settings.

```
function dofile(filename: string?): ...any
```

Compiles and executes the specified file (or standard input if omitted/nil) within the caller's environment, returning all values returned by the chunk.

## math library

```
function math.abs(n: number): number
```

Returns the absolute value of `n`. Returns NaN if the input is NaN. 

```
function math.acos(n: number): number
```

Returns the arc cosine of `n`, expressed in radians. Returns a value in `[0, pi]` range. Returns NaN if the input is not in `[-1, +1]` range.

```
function math.asin(n: number): number
```

Returns the arc sine of `n`, expressed in radians. Returns a value in `[-pi/2, +pi/2]` range. Returns NaN if the input is not in `[-1, +1]` range.

```
function math.atan2(y: number, x: number): number
```

Returns the arc tangent of `y/x`, expressed in radians. The function takes into account the sign of both arguments in order to determine the quadrant. Returns a value in `[-pi, pi]` range.

```
function math.atan(n: number): number
```

Returns the arc tangent of `n`, expressed in radians. Returns a value in `[-pi/2, pi-2]` range.

```
function math.ceil(n: number): number
```

Rounds `n` upwards to the next integer boundary.

```
function math.cosh(n: number): number
```

Returns the hyperbolic cosine of `n`.

```
function math.cos(n: number): number
```

Returns the cosine of `n`, which is an angle in radians. Returns a value in `[0, 1]` range.

```
function math.deg(n: number): number
```

Converts `n` from radians to degrees and returns the result.

```
function math.exp(n: number): number
```

Returns the base-e exponent of `n`, that is `e^n`.

```
function math.floor(n: number): number
```

Rounds `n` downwards to previous integer boundary.

```
function math.fmod(x: number, y: number): number
```

Returns the remainder of `x` modulo `y`, rounded towards zero. Returns NaN if `y` is zero.

```
function math.frexp(n: number): (number, number)
```

Splits the number into a significand (a number in `[-1, +1]` range) and binary exponent such that `n = s * 2^e`, and returns `s, e`.

```
function math.ldexp(s: number, e: number): number
```

Given the significand and a binary exponent, returns a number `s * 2^e`.

```
function math.lerp(a: number, b: number, t: number): number
```

Linearly interpolated between number value `a` and `b` using factor `t`, generally returning the result of `a + (b - a) * t`.
When `t` is exactly `1`, the value of `b` will be returned instead to ensure that when `t` is on the interval `[0, 1]`, the result of `lerp` will be on the interval `[a, b]`.

```
math.map(x: number, inmin: number, inmax: number, outmin: number, outmax: number): number
```

Returns a value that represents `x` mapped linearly from the input range (`inmin` to `inmax`) to the output range (`outmin` to `outmax`).

```
function math.log10(n: number): number
```

Returns base-10 logarithm of the input number. Returns NaN if the input is negative, and negative infinity if the input is 0.
Equivalent to `math.log(n, 10)`.

```
function math.log(n: number, base: number?): number
```

Returns logarithm of the input number in the specified base; base defaults to `e`. Returns NaN if the input is negative, and negative infinity if the input is 0.

```
function math.max(list: ...number): number
```

Returns the maximum number of the input arguments. The function requires at least one input and will error if zero parameters are passed. If one of the inputs is a NaN, the result may or may not be a NaN.

```
function math.min(list: ...number): number
```

Returns the minimum number of the input arguments. The function requires at least one input and will error if zero parameters are passed. If one of the inputs is a NaN, the result may or may not be a NaN.

```
function math.modf(n: number): (number, number)
```

Returns the integer and fractional part of the input number. Both the integer and fractional part have the same sign as the input number, e.g. `math.modf(-1.5)` returns `-1, -0.5`.

```
function math.pow(x: number, y: number): number
```

Returns `x` raised to the power of `y`.

```
function math.rad(n: number): number
```

Converts `n` from degrees to radians and returns the result.

```
function math.random(): number
function math.random(n: number): number
function math.random(min: number, max: number): number
```

Returns a random number using the global random number generator. A zero-argument version returns a number in `[0, 1]` range. A one-argument version returns a number in `[1, n]` range. A two-argument version returns a number in `[min, max]` range. The input arguments are truncated to integers, so `math.random(1.5)` always returns 1.

```
function math.randomseed(seed: number)
```

Reseeds the global random number generator; subsequent calls to `math.random` will generate a deterministic sequence of numbers that only depends on `seed`.

```
function math.sinh(n: number): number
```

Returns a hyperbolic sine of `n`.

```
function math.sin(n: number): number
```

Returns the sine of `n`, which is an angle in radians. Returns a value in `[0, 1]` range.

```
function math.sqrt(n: number): number
```

Returns the square root of `n`. Returns NaN if the input is negative.

```
function math.tanh(n: number): number
```

Returns the hyperbolic tangent of `n`.

```
function math.tan(n: number): number
```

Returns the tangent of `n`, which is an angle in radians.

```
function math.noise(x: number, y: number?, z: number?): number
```

Returns 3D Perlin noise value for the point `(x, y, z)` (`y` and `z` default to zero if absent). Returns a value in `[-1, 1]` range.

```
function math.clamp(n: number, min: number, max: number): number
```

Returns `n` if the number is in `[min, max]` range; otherwise, returns `min` when `n < min`, and `max` otherwise. If `n` is NaN, may or may not return NaN.
The function errors if `min > max`.

```
function math.sign(n: number): number
```

Returns `-1` if `n` is negative, `1` if `n` is positive, and `0` if `n` is zero or NaN.

```
function math.round(n: number): number
```

Rounds `n` to the nearest integer boundary. If `n` is exactly halfway between two integers, rounds `n` away from 0.

```
function math.isnan(n: number): boolean
```

Returns whether `n` is a NaN.

```
function math.isinf(n: number): boolean
```

Returns whether `n` is either of the infinities.

```
function math.isfinite(n: number): boolean
```

Returns whether `n` is neither NaN nor an infinity.

## table library

```
function table.concat(a: {string}, sep: string?, f: number?, t: number?): string
```

Concatenate all elements of `a` with indices in range `[f..t]` together, using `sep` as a separator if present. `f` defaults to 1 and `t` defaults to `#a`.

```
function table.foreach<K, V, R>(t: { [K]: V }, f: (K, V) -> R?): R?
```

Iterates over all elements of the table in unspecified order; for each key-value pair, calls `f` and returns the result of `f` if it's non-nil. If all invocations of `f` returned `nil`, returns no values. This function has been deprecated and is not recommended for use in new code; use `for` loop instead.

```
function table.foreachi<V, R>(t: {V}, f: (number, V) -> R?): R?
```

Iterates over numeric keys of the table in `[1..#t]` range in order; for each key-value pair, calls `f` and returns the result of `f` if it's non-nil. If all invocations of `f` returned `nil`, returns no values. This function has been deprecated and is not recommended for use in new code; use `for` loop instead.

```
function table.getn<V>(t: {V}): number
```

Returns the length of table `t`. This function has been deprecated and is not recommended for use in new code; use `#t` instead.

```
function table.maxn<V>(t: {V}): number
```

Returns the maximum numeric key of table `t`, or zero if the table doesn't have numeric keys.

```
function table.insert<V>(t: {V}, v: V)
function table.insert<V>(t: {V}, i: number, v: V)
```

When using a two-argument version, appends the value to the array portion of the table (equivalent to `t[#t+1] = v`).
When using a three-argument version, inserts the value at index `i` and shifts values at indices after that by 1. `i` should be in `[1..#t]` range.

```
function table.remove<V>(t: {V}, i: number?): V?
```

Removes element `i` from the table and shifts values at indices after that by 1. If `i` is not specified, removes the last element of the table.
`i` should be in `[1..#t]` range.
Returns the value of the removed element, or `nil` if no element was removed (e.g. table was empty).

```
function table.sort<V>(t: {V}, f: ((V, V) -> boolean)?)
```

Sorts the table `t` in ascending order, using `f` as a comparison predicate: `f` should return `true` iff the first parameter should be before the second parameter in the resulting table. When `f` is not specified, builtin less-than comparison is used instead.
The comparison predicate must establish a strict weak ordering - sort results are undefined otherwise.

```
function table.pack<V>(args: ...V): { [number]: V, n: number }
```

Returns a table that consists of all input arguments as array elements, and `n` field that is set to the number of inputs.

```
function table.unpack<V>(a: {V}, f: number?, t: number?): ...V
```

Returns all values of `a` with indices in `[f..t]` range. `f` defaults to 1 and `t` defaults to `#a`.
Note that if you want to unpack varargs packed with `table.pack` you have to specify the index fields because `table.unpack` doesn't automatically use the `n` field that `table.pack` creates. Example usage for packed varargs: `table.unpack(args, 1, args.n)`

```
function table.move<V>(a: {V}, f: number, t: number, d: number, tt: {V}?)
```

Copies elements in range `[f..t]` from table `a` to table `tt` if specified and `a` otherwise, starting from the index `d`.

```
function table.create<V>(n: number, v: V?): {V}
```

Creates a table with `n` elements; all of them (range `[1..n]`) are set to `v`. When `v` is nil or omitted, the returned table is empty but has preallocated space for `n` elements which can make subsequent insertions faster.
Note that preallocation is only performed for the array portion of the table - using `table.create` on dictionaries is counter-productive.

```
function table.find<V>(t: {V}, v: V, init: number?): number?
```

Find the first element in the table that is equal to `v` and returns its index; the traversal stops at the first `nil`. If the element is not found, `nil` is returned instead. The traversal starts at index `init` if specified, otherwise 1.

```
function table.clear(t: table)
```

Removes all elements from the table while preserving the table capacity, so future assignments don't need to reallocate space.

```
function table.freeze(t: table): table
```

Given a non-frozen table, freezes it such that all subsequent attempts to modify the table or assign its metatable raise an error. If the input table is already frozen or has a protected metatable, the function raises an error; otherwise it returns the input table.
Note that the table is frozen in-place and is not being copied. Additionally, only `t` is frozen, and keys/values/metatable of `t` don't change their state and need to be frozen separately if desired.

```
function table.isfrozen(t: table): boolean
```

Returns `true` iff the input table is frozen.

```
function table.clone(t: table): table
```

Returns a copy of the input table that has the same metatable, same keys and values, and is not frozen even if `t` was.
The copy is shallow: implementing a deep recursive copy automatically is challenging, and often only certain keys need to be cloned recursively which can be done after the initial clone by modifying the resulting table.

## string library

```
function string.byte(s: string, f: number?, t: number?): ...number
```

Returns the numeric code of every byte in the input string with indices in range `[f..t]`. `f` defaults to 1 and `t` defaults to `f`, so a two-argument version of this function returns a single number. If the function is called with a single argument and the argument is out of range, the function returns no values.

```
function string.char(args: ...number): string
```

Returns the string that contains a byte for every input number; all inputs must be integers in `[0..255]` range.

```
function string.find(s: string, p: string, init: number?, plain: boolean?): (number?, number?, ...string)
```

Tries to find an instance of pattern `p` in the string `s`, starting from position `init` (defaults to 1). When `plain` is true, the search is using raw (case-sensitive) string equality, otherwise `p` should be a [string pattern](https://www.lua.org/manual/5.3/manual.html#6.4.1). If a match is found, returns the position of the match and the length of the match, followed by the pattern captures; otherwise returns `nil`.

```
function string.format(s: string, args: ...any): string
```

Returns a formatted version of the input arguments using a [printf-style format string](https://en.cppreference.com/w/c/io/fprintf) `s`. The following format characters are supported:

- `c`: expects an integer number and produces a character with the corresponding character code
- `d`, `i`, `u`: expects an integer number and produces the decimal representation of that number
- `o`: expects an integer number and produces the octal representation of that number
- `x`, `X`: expects an integer number and produces the hexadecimal representation of that number, using lower case or upper case hexadecimal characters
- `e`, `E`, `f`, `g`, `G`: expects a number and produces the floating point representation of that number, using scientific or decimal representation
- `q`: expects a string and produces the same string quoted using double quotation marks, with escaped special characters if necessary
- `s`: expects a string and produces the same string verbatim

The formats support modifiers `-`, `+`, space, `#` and `0`, as well as field width and precision modifiers - with the exception of `*`.

```
function string.gmatch(s: string, p: string): <iterator>
```

Produces an iterator function that, when called repeatedly explicitly or via `for` loop, produces matches of string `s` with [string pattern](https://www.lua.org/manual/5.3/manual.html#6.4.1) `p`. For every match, the captures within the pattern are returned if present (if a pattern has no captures, the entire matching substring is returned instead).

```
function string.gsub(s: string, p: string, f: function | table | string, maxs: number?): (string, number)
```

For every match of [string pattern](https://www.lua.org/manual/5.3/manual.html#6.4.1) `p` in `s`, replace the match according to `f`. The substitutions stop after the limit of `maxs`, and the function returns the resulting string followed by the number of substitutions.

When `f` is a string, the substitution uses the string as a replacement. When `f` is a table, the substitution uses the table element with key corresponding to the first pattern capture, if present, and entire match otherwise. Finally, when `f` is a function, the substitution uses the result of calling `f` with call pattern captures, or entire matching substring if no captures are present.

```
function string.len(s: string): number
```

Returns the number of bytes in the string (equivalent to `#s`).

```
function string.lower(s: string): string
```

Returns a string where each byte corresponds to the lower-case ASCII version of the input byte in the source string.

```
function string.match(s: string, p: string, init: number?): ...string?
```

Tries to find an instance of pattern `p` in the string `s`, starting from position `init` (defaults to 1). `p` should be a [string pattern](https://www.lua.org/manual/5.3/manual.html#6.4.1). If a match is found, returns all pattern captures, or entire matching substring if no captures are present, otherwise returns `nil`.

```
function string.rep(s: string, n: number): string
```

Returns the input string `s` repeated `n` times. Returns an empty string if `n` is zero or negative.

```
function string.reverse(s: string): string
```

Returns the string with the order of bytes reversed compared to the original. Note that this only works if the input is a binary or ASCII string.

```
function string.sub(s: string, f: number, t: number?): string
```

Returns a substring of the input string with the byte range `[f..t]`; `t` defaults to `#s`, so a two-argument version returns a string suffix.

```
function string.upper(s: string): string
```

Returns a string where each byte corresponds to the upper-case ASCII version of the input byte in the source string.

```
function string.split(s: string, sep: string?): {string}
```

Splits the input string using `sep` as a separator (defaults to `","`) and returns the resulting substrings. If separator is empty, the input string is split into separate one-byte strings.

```
function string.pack(f: string, args: ...any): string
```

Given a [pack format string](https://www.lua.org/manual/5.3/manual.html#6.4.2), encodes all input parameters according to the packing format and returns the resulting string. Note that Luau uses fixed sizes for all types that have platform-dependent size in Lua 5.x: short is 16 bit, long is 64 bit, integer is 32-bit and size_t is 32 bit for the purpose of string packing.

```
function string.packsize(f: string): number
```

Given a [pack format string](https://www.lua.org/manual/5.3/manual.html#6.4.2), returns the size of the resulting packed representation. The pack format can't use variable-length format specifiers. Note that Luau uses fixed sizes for all types that have platform-dependent size in Lua 5.x: short is 16 bit, long is 64 bit, integer is 32-bit and size_t is 32 bit for the purpose of string packing.

```
function string.unpack(f: string, s: string): ...any
```

Given a [pack format string](https://www.lua.org/manual/5.3/manual.html#6.4.2), decodes the input string according to the packing format and returns all resulting values. Note that Luau uses fixed sizes for all types that have platform-dependent size in Lua 5.x: short is 16 bit, long is 64 bit, integer is 32-bit and size_t is 32 bit for the purpose of string packing.

## coroutine library

```
function coroutine.create(f: function): thread
```

Returns a new coroutine that, when resumed, will run function `f`.

```
function coroutine.running(): thread?
```

Returns the currently running coroutine, or `nil` if the code is running in the main coroutine (depending on the host environment setup, main coroutine may never be used for running code).

```
function coroutine.status(co: thread): string
```

Returns the status of the coroutine, which can be `"running"`, `"suspended"`, `"normal"` or `"dead"`. Dead coroutines have finished their execution and can not be resumed, but their state can still be inspected as they are not dead from the garbage collector point of view.

```
function coroutine.wrap(f: function): function
```

Creates a new coroutine and returns a function that, when called, resumes the coroutine and passes all arguments along to the suspension point. When the coroutine yields or finishes, the wrapped function returns with all values returned at the suspension point.

```
function coroutine.yield(args: ...any): ...any
```

Yields the currently running coroutine and passes all arguments along to the code that resumed the coroutine. The coroutine becomes suspended; when the coroutine is resumed again, the resumption arguments will be forwarded to `yield` which will behave as if it returned all of them.

```
function coroutine.isyieldable(): boolean
```

Returns `true` iff the currently running coroutine can yield. Yielding is prohibited when running inside metamethods like `__index` or C functions like `table.foreach` callback, with the exception of `pcall`/`xpcall`.

```
function coroutine.resume(co: thread, args: ...any): (boolean, ...any)
```

Resumes the coroutine and passes the arguments along to the suspension point. When the coroutine yields or finishes, returns `true` and all values returned at the suspension point. If an error is raised during coroutine resumption, this function returns `false` and the error object, similarly to `pcall`.

```
function coroutine.close(co: thread): (boolean, any?)
```

Closes the coroutine which puts coroutine in the dead state. The coroutine must be dead or suspended - in particular it can't be currently running. If the coroutine that's being closed was in an error state, returns `false` along with an error object; otherwise returns `true`. After closing, the coroutine can't be resumed and the coroutine stack becomes empty.

## bit32 library

All functions in the `bit32` library treat input numbers as 32-bit unsigned integers in `[0..4294967295]` range. The bit positions start at 0 where 0 corresponds to the least significant bit.

```
function bit32.arshift(n: number, i: number): number
```

Shifts `n` by `i` bits to the right (if `i` is negative, a left shift is performed instead). The most significant bit of `n` is propagated during the shift. When `i` is larger than 31, returns an integer with all bits set to the sign bit of `n`. When `i` is smaller than `-31`, 0 is returned.

```
function bit32.band(args: ...number): number
```

Performs a bitwise `and` of all input numbers and returns the result. If the function is called with no arguments, an integer with all bits set to 1 is returned.

```
function bit32.bnot(n: number): number
```

Returns a bitwise negation of the input number.

```
function bit32.bor(args: ...number): number
```

Performs a bitwise `or` of all input numbers and returns the result. If the function is called with no arguments, zero is returned.

```
function bit32.bxor(args: ...number): number
```

Performs a bitwise `xor` (exclusive or) of all input numbers and returns the result. If the function is called with no arguments, zero is returned.

```
function bit32.btest(args: ...number): boolean
```

Perform a bitwise `and` of all input numbers, and return `true` iff the result is not 0. If the function is called with no arguments, `true` is returned.

```
function bit32.extract(n: number, f: number, w: number?): number
```

Extracts bits of `n` at position `f` with a width of `w`, and returns the resulting integer. `w` defaults to `1`, so a two-argument version of `extract` returns the bit value at position `f`. Bits are indexed starting at 0. Errors if `f` and `f+w-1` are not between 0 and 31.

```
function bit32.lrotate(n: number, i: number): number
```

Rotates `n` to the left by `i` bits (if `i` is negative, a right rotate is performed instead); the bits that are shifted past the bit width are shifted back from the right.

```
function bit32.lshift(n: number, i: number): number
```

Shifts `n` to the left by `i` bits (if `i` is negative, a right shift is performed instead). When `i` is outside of `[-31..31]` range, returns 0.

```
function bit32.replace(n: number, r: number, f: number, w: number?): number
```

Replaces bits of `n` at position `f` and width `w` with `r`, and returns the resulting integer. `w` defaults to `1`, so a three-argument version of `replace` changes one bit at position `f` to `r` (which should be 0 or 1) and returns the result. Bits are indexed starting at 0. Errors if `f` and `f+w-1` are not between 0 and 31.

```
function bit32.rrotate(n: number, i: number): number
```

Rotates `n` to the right by `i` bits (if `i` is negative, a left rotate is performed instead); the bits that are shifted past the bit width are shifted back from the left.

```
function bit32.rshift(n: number, i: number): number
```

Shifts `n` to the right by `i` bits (if `i` is negative, a left shift is performed instead). When `i` is outside of `[-31..31]` range, returns 0.

```
function bit32.countlz(n: number): number
```

Returns the number of consecutive zero bits in the 32-bit representation of `n` starting from the left-most (most significant) bit. Returns 32 if `n` is zero.

```
function bit32.countrz(n: number): number
```

Returns the number of consecutive zero bits in the 32-bit representation of `n` starting from the right-most (least significant) bit. Returns 32 if `n` is zero.

```
function bit32.byteswap(n: number): number
```

Returns `n` with the order of the bytes swapped.

## utf8 library

Strings in Luau can contain arbitrary bytes; however, in many applications strings representing text contain UTF8 encoded data by convention, that can be inspected and manipulated using `utf8` library.

```
function utf8.offset(s: string, n: number, i: number?): number?
```

Returns the byte offset of the Unicode codepoint number `n` in the string, starting from the byte position `i`. When the character is not found, returns `nil` instead.

```
function utf8.codepoint(s: string, i: number?, j: number?): ...number
```

Returns a number for each Unicode codepoint in the string with the starting byte offset in `[i..j]` range. `i` defaults to 1 and `j` defaults to `i`, so a two-argument version of this function returns the Unicode codepoint that starts at byte offset `i`.

```
function utf8.char(args: ...number): string
```

Creates a string by concatenating Unicode codepoints for each input number.

```
function utf8.len(s: string, i: number?, j: number?): number?
```

Returns the number of Unicode codepoints with the starting byte offset in `[i..j]` range, or `nil` followed by the first invalid byte position if the input string is malformed.
`i` defaults to 1 and `j` defaults to `#s`, so `utf8.len(s)` returns the number of Unicode codepoints in string `s` or `nil` if the string is malformed.

```
function utf8.codes(s: string): <iterator>
```

Returns an iterator that, when used in `for` loop, produces the byte offset and the codepoint for each Unicode codepoints that `s` consists of.

## os library

```
function os.clock(): number
```

Returns a high-precision timestamp (in seconds) that doesn't have a defined baseline, but can be used to measure duration with sub-microsecond precision.

```
function os.date(s: string?, t: number?): table | string
```

Returns the table or string representation of the time specified as `t` (defaults to current time) according to `s` format string.

When `s` starts with `!`, the result uses UTC, otherwise it uses the current timezone.

If `s` is equal to `*t` (or `!*t`), a table representation of the date is returned, with keys `sec`/`min`/`hour` for the time (using 24-hour clock), `day`/`month`/`year` for the date, `wday` for week day (1..7), `yday` for year day (1..366) and `isdst` indicating whether the timezone is currently using daylight savings.

Otherwise, `s` is interpreted as a [date format string](https://www.cplusplus.com/reference/ctime/strftime/), with the valid specifiers including any of `aAbBcdHIjmMpSUwWxXyYzZ` or `%`. `s` defaults to `"%c"` so `os.date()` returns the human-readable representation of the current date in local timezone.

```
function os.difftime(a: number, b: number): number
```

Calculates the difference in seconds between `a` and `b`; provided for compatibility only. Please use `a - b` instead.

```
function os.time(t: table?): number
```

When called without arguments, returns the current date/time as a Unix timestamp. When called with an argument, expects it to be a table that contains `sec`/`min`/`hour`/`day`/`month`/`year` keys and returns the Unix timestamp of the specified date/time in UTC.

```
function os.getenv(varname: string): string?
```

Returns the value of the process environment variable `varname`, or `nil` if the variable is not defined.

```
function os.setenv(varname: string, value: string?): boolean
```

Sets the environment variable `varname` to `value`. If `value` is `nil`, the variable is unset.

```
function os.execute(command: string?): (boolean | number, string?, number?)
```

Passes `command` to the system shell to execute. If `command` is omitted, returns non-zero if a shell is available. On POSIX systems, returns status indicators `(status, "exit"|"signal", code)`.

```
function os.remove(filename: string): (boolean, string?)
```

Deletes the file or directory with the given name. On failure, returns `nil` followed by the error message.

```
function os.rename(oldname: string, newname: string): (boolean, string?)
```

Renames or moves the file or directory `oldname` to `newname`.

```
function os.exit(code: (number | boolean)?): ()
```

Terminates the host program with the given exit status code (defaults to 0 or success).

```
function os.tmpname(): string
```

Generates a secure, unique temporary file name using OS-level primitives.

## debug library

```
function debug.info(co: thread, level: number, s: string): ...any
function debug.info(level: number, s: string): ...any
function debug.info(f: function, s: string): ...any
```

Given a stack frame or a function, and a string that specifies the requested information, returns the information about the stack frame or function.

Each character of `s` results in additional values being returned in the same order as the characters appear in the string:

- `s` returns source path for the function
- `l` returns the line number for the stack frame or the line where the function is defined when inspecting a function object
- `n` returns the name of the function, or an empty string if the name is not known
- `f` returns the function object itself
- `a` returns the number of arguments that the function expects followed by a boolean indicating whether the function is variadic or not

For example, `debug.info(2, "sln")` returns source file, current line and function name for the caller of the current function.

```
function debug.getinfo(co: thread?, levelOrFunc: number | function): table?
```

Returns a descriptive table of information about the given function or stack frame level (including `source`, `short_src`, `currentline`, `linedefined`, `what`, `name`, `namewhat`, `nups`, and `isvararg`).

```
function debug.getlocal(co: thread?, level: number, index: number): (string?, any)
function debug.getlocals(co: thread?, level: number?): { [string]: any }
```

Inspects active local variables by numerical index or returns a dictionary of all active locals at the specified stack frame level.

```
function debug.getupvalue(f: function, index: number): (string?, any)
function debug.getupvalues(f: function): { [string]: any }
```

Inspects upvalues captured by a closure by index or returns a dictionary of all upvalues.

```
function debug.dumpstack(co: thread?, level: number?): string
```

Dumps a human-readable stack trace with all local variable names, types, and values across active frames.

```
function debug.traceback(co: thread, msg: string?, level: number?): string
function debug.traceback(msg: string?, level: number?): string
```

Produces a stringified callstack of the given thread, or the current thread, starting with level `level`. If `msg` is specified, then the resulting callstack includes the string before the callstack output, separated with a newline.

## buffer library

Buffer is an object that represents a fixed-size mutable block of memory.

All operations on a buffer are provided using the 'buffer' library functions.

Many of the functions accept an offset in bytes from the start of the buffer.
Offset of 0 from the start of the buffer memory block accesses the first byte.

All offsets, counts and sizes should be non-negative integer numbers.

If the bytes that are accessed by any read or write operation are outside the buffer memory, an error is thrown.

```
function buffer.create(size: number): buffer
```

Creates a buffer of the requested size with all bytes initialized to 0.

Size limit is 1GB or 1,073,741,824 bytes.

```
function buffer.fromstring(str: string): buffer
```

Creates a buffer initialized to the contents of the string.

The size of the buffer equals to the length of the string.


```
function buffer.tostring(b: buffer): string
```

Returns the buffer data as a string.

```
function buffer.len(b: buffer): number
```

Returns the size of the buffer in bytes.

```
function buffer.readi8(b: buffer, offset: number): number
function buffer.readu8(b: buffer, offset: number): number
function buffer.readi16(b: buffer, offset: number): number
function buffer.readu16(b: buffer, offset: number): number
function buffer.readi32(b: buffer, offset: number): number
function buffer.readu32(b: buffer, offset: number): number
function buffer.readf32(b: buffer, offset: number): number
function buffer.readf64(b: buffer, offset: number): number
```

Used to read the data from the buffer by reinterpreting bytes at the offset as the type in the argument and converting it into a number.

Available types:

Function | Type | Range |
---------|------|-------|
readi8 | signed 8-bit integer | [-128, 127]
readu8 | unsigned 8-bit integer | [0, 255]
readi16 | signed 16-bit integer | [-32,768, 32,767]
readu16 | unsigned 16-bit integer | [0, 65,535]
readi32 | signed 32-bit integer | [-2,147,483,648, 2,147,483,647]
readu32 | unsigned 32-bit integer | [0, 4,294,967,295]
readf32 | 32-bit floating-point number | Single-precision IEEE 754 number
readf64 | 64-bit floating-point number | Double-precision IEEE 754 number

Floating-point numbers are read and written using a format specified by IEEE 754.

If a floating-point value matches any of bit patterns that represent a NaN (not a number), returned value might be converted to a different quiet NaN representation.

Read and write operations use the little endian byte order.

Integer numbers are read and written using two's complement representation.

```
function buffer.writei8(b: buffer, offset: number, value: number): ()
function buffer.writeu8(b: buffer, offset: number, value: number): ()
function buffer.writei16(b: buffer, offset: number, value: number): ()
function buffer.writeu16(b: buffer, offset: number, value: number): ()
function buffer.writei32(b: buffer, offset: number, value: number): ()
function buffer.writeu32(b: buffer, offset: number, value: number): ()
function buffer.writef32(b: buffer, offset: number, value: number): ()
function buffer.writef64(b: buffer, offset: number, value: number): ()
```

Used to write data to the buffer by converting the number into the type in the argument and reinterpreting it as individual bytes.

Ranges of acceptable values can be seen in the table above.

When writing integers, the number is converted using `bit32` library rules.

Values that are out-of-range will take less significant bits of the full number.
For example, writing 43,981 (0xabcd) using writei8 function will take 0xcd and interpret it as an 8-bit signed number -51.
It is still recommended to keep all numbers in range of the target type.

Results of converting special number values (inf/nan) to integers are platform-specific.

```
function buffer.readstring(b: buffer, offset: number, count: number): string
```

Used to read a string of length 'count' from the buffer at specified offset.

```
function buffer.writestring(b: buffer, offset: number, value: string, count: number?): ()
```

Used to write data from a string into the buffer at a specified offset.

If an optional 'count' is specified, only 'count' bytes are taken from the string.

Count cannot be larger than the string length.

```
buffer.readbits(b: buffer, bitOffset: number, bitCount: number): number
```

Used to read a range of `bitCount` bits from the buffer, at specified offset `bitOffset`, into an unsigned integer.

`bitCount` must be in `[0, 32]` range.

```
buffer.writebits(b: buffer, bitOffset: number, bitCount: number, value: number): ()
```

Used to write `bitCount` bits from `value` into the buffer at specified offset `bitOffset`.

`bitCount` must be in `[0, 32]` range.

```
function buffer.copy(target: buffer, targetOffset: number, source: buffer, sourceOffset: number?, count: number?): ()
```

Copy 'count' bytes from 'source' starting at offset 'sourceOffset' into the 'target' at 'targetOffset'.

It is possible for 'source' and 'target' to be the same. Copying an overlapping region inside the same buffer acts as if the source region is copied into a temporary buffer and then that buffer is copied over to the target.

If 'sourceOffset' is nil or is omitted, it defaults to 0.

If 'count' is 'nil' or is omitted, the whole 'source' data starting from 'sourceOffset' is copied.

```
function buffer.fill(b: buffer, offset: number, value: number, count: number?): ()
```

Sets the 'count' bytes in the buffer starting at the specified 'offset' to the 'value'.

If 'count' is 'nil' or is omitted, all bytes from the specified offset until the end of the buffer are set.

## vector library

This library implements functionality for the vector type in addition to the built-in primitive operator support. 
Default configuration uses vectors with 3 components (`x`, `y`, and `z`). 
If the _4-wide mode_ is enabled by setting the `LUA_VECTOR_SIZE` VM configuration to 4, vectors get an additional `w` component. 

Individual vector components can be accessed using the fields `x` or `X`, `y` or `Y`, `z` or `Z`, and `w` or `W` in 4-wide mode.
Since vector values are immutable, writes to individual components are not supported.

```
vector.zero
vector.one
```

Constant vectors with all components set to 0 and 1 respectively. Includes the fourth component in _4-wide mode_.

```
vector.create(x: number, y: number, z: number): vector
vector.create(x: number, y: number, z: number, w: number): vector
```

Creates a new vector with the given component values. The first constructor sets the fourth (`w`) component to 0.0 in _4-wide mode_.

```
vector.magnitude(vec: vector): number
```

Calculates the magnitude of a given vector. Includes the fourth component in _4-wide mode_.

```
vector.normalize(vec: vector): vector
```

Computes the normalized version (unit vector) of a given vector. Includes the fourth component in _4-wide mode_.

```
vector.cross(vec1: vector, vec2: vector): vector
```

Computes the cross product of two vectors. Ignores the fourth component in _4-wide mode_ and returns the 3-dimensional cross product. 

```
vector.dot(vec1: vector, vec2: vector): number
```

Computes the dot product of two vectors. Includes the fourth component in _4-wide mode_.

```
vector.angle(vec1: vector, vec2: vector, axis: vector?): number
```

Computes the angle between two vectors in radians. The axis, if specified, is used to determine the sign of the angle. Ignores the fourth component in _4-wide mode_ and returns the 3-dimensional angle.

```
vector.floor(vec: vector): vector
```

Applies `math.floor` to every component of the input vector. Includes the fourth component in _4-wide mode_.

```
vector.ceil(vec: vector): vector
```

Applies `math.ceil` to every component of the input vector. Includes the fourth component in _4-wide mode_.

```
vector.abs(vec: vector): vector
```

Applies `math.abs` to every component of the input vector. Includes the fourth component in _4-wide mode_.

```
vector.sign(vec: vector): vector
```

Applies `math.sign` to every component of the input vector. Includes the fourth component in _4-wide mode_.

```
vector.clamp(vec: vector, min: vector, max: vector): vector
```

Applies `math.clamp` to every component of the input vector. Includes the fourth component in _4-wide mode_.

```
vector.max(...: vector): vector
```

Applies `math.max` to the corresponding components of the input vectors. Includes the fourth component in _4-wide mode_. Equivalent to `vector.create(math.max((...).x), math.max((...).y), math.max((...).z), math.max((...).w))`.

```
vector.min(...: vector): vector
```

Applies `math.min` to the corresponding components of the input vectors. Includes the fourth component in _4-wide mode_. Equivalent to `vector.create(math.min((...).x), math.min((...).y), math.min((...).z), math.min((...).w))`.

## fs library

The `fs` library provides direct, cross-platform filesystem operations backed by `std::filesystem`.

```
function fs.readfile(path: string): string
function fs.readFile(path: string): string
```

Reads the entire content of the file at `path` in binary mode and returns it as a string.

```
function fs.writefile(path: string, content: string | buffer): ()
function fs.writeFile(path: string, content: string | buffer): ()
```

Writes `content` to the file at `path`, replacing existing content or creating the file if it does not exist.

```
function fs.appendfile(path: string, content: string | buffer): ()
function fs.appendFile(path: string, content: string | buffer): ()
```

Appends `content` to the end of the file at `path`.

```
function fs.removefile(path: string): ()
function fs.removeFile(path: string): ()
```

Deletes the file at `path`.

```
function fs.removedir(path: string): ()
function fs.removeDir(path: string): ()
```

Deletes a directory and all of its recursive contents.

```
function fs.mkdir(path: string): ()
function fs.makeDir(path: string): ()
```

Creates a directory at `path`, including any necessary parent directories.

```
function fs.list(path: string?): { string }
function fs.readDir(path: string?): { string }
```

Lists entries in the directory at `path` (defaults to current working directory `"."`).

```
function fs.isfile(path: string): boolean
function fs.isFile(path: string): boolean
```

Returns `true` if `path` exists and is a regular file.

```
function fs.isdir(path: string): boolean
function fs.isDir(path: string): boolean
```

Returns `true` if `path` exists and is a directory.

```
function fs.exists(path: string): boolean
```

Returns `true` if `path` exists on the filesystem.

```
function fs.stat(path: string): { exists: boolean, isFile: boolean, isDirectory: boolean, size: number, modified: number }
```

Returns file metadata including byte size, modification timestamp, and entry type.

```
function fs.copy(source: string, destination: string): ()
```

Copies a file or recursively copies a directory from `source` to `destination`.

```
function fs.move(source: string, destination: string): ()
```

Renames or moves a file or directory from `source` to `destination`.

```
function fs.cwd(): string
```

Returns the absolute path to the current working directory.

## io library

The `io` library provides standard C `FILE*` streams and formatted input/output capabilities.

```
io.stdin: file
io.stdout: file
io.stderr: file
```

Standard stream handles for input, output, and error streams.

```
function io.open(filename: string, mode: string?): file?, string?
```

Opens a file with the given mode (`"r"`, `"w"`, `"a"`, `"r+"`, `"w+"`, `"a+"`, `"rb"`, `"wb"`). Returns a file handle on success.

```
function io.popen(command: string, mode: string?): file?, string?
```

Spawns a shell process executing `command` and opens a unidirectional pipe handle connected to its standard stream.

```
function io.close(file: file?): boolean?, string?
```

Closes the given file handle (or the default output file if omitted).

```
function io.read(...: string | number): ...any
function io.write(...: string | number | buffer): ()
function io.flush(): ()
function io.input(file: (file | string)?): file
function io.output(file: (file | string)?): file
function io.lines(filename: string?): <iterator>
function io.type(obj: any): string?
```

Standard file handle methods available on open `file` objects:
- `file:read(...)` — reads data using formats (`"*l"`, `"*a"`, `"*n"`, or byte count).
- `file:write(...)` — writes data or buffers to the file.
- `file:seek(whence: string?, offset: number?): number` — sets and retrieves the file position.
- `file:flush()` — flushes buffered data to disk.
- `file:lines()` — returns an iterator over file lines.
- `file:close()` — closes the file handle.

## ffi library

The Foreign Function Interface (`ffi`) allows calling native C functions, dynamic libraries, and working with raw memory structures directly from Jaci code with capability-gated security policies.

```
ffi.C: table
```

Global namespace bound to the main host executable and standard C runtime symbols.

```
function ffi.open(path: string?): FFI_Library
```

Loads a dynamic library (`.so`, `.dylib`, `.dll`) or opens the global process image if `path` is nil.

```
function ffi.cdef(declarations: string): ()
```

Parses C type signatures, struct declarations, and function prototypes, automatically exposing them on `ffi.C` or open libraries.

```luau
ffi.cdef[[
    double cos(double x);
    size_t strlen(const char* s);
    typedef struct { int x; int y; } Point;
]]

local p = ffi.C.cos(0.0)
local len = ffi.C.strlen("hello world")
```

```
function ffi.sym(lib: FFI_Library?, name: string, retType: string, ...: string): function
```

Explicitly binds and resolves a symbol with a specified return type and parameter types.

```
function ffi.mode(mode: "strict" | "permissive" | "disabled"): string
function ffi.allowLibrary(name: string): ()
function ffi.denyLibrary(name: string): ()
function ffi.isSafe(ptr: userdata, length: number?): boolean
function ffi.istype(typeName: string, obj: any): boolean
function ffi.struct(name: string, fields: { [string]: string }): table
```

Security and structural reflection APIs:
- `ffi.mode`: Configures or queries the active FFI security mode (`"strict"` enables capability gating; `"permissive"` allows unverified loads; `"disabled"` completely disallows FFI execution).
- `ffi.allowLibrary` / `ffi.denyLibrary`: Manages allowlists and denylists for shared libraries.
- `ffi.isSafe`: Checks if a pointer address is non-null and valid for memory operations.
- `ffi.istype`: Validates if a userdata or buffer represents a specified C type.
- `ffi.struct`: Reflects and calculates struct layout sizes, field offsets, and alignments.

```
function ffi.new(typeName: string, count: number?): buffer
function ffi.ptr(buf: buffer | string): userdata
function ffi.string(ptr: userdata, length: number?): string
function ffi.copy(dest: buffer | userdata, src: buffer | string | userdata, length: number): ()
function ffi.fill(dest: buffer | userdata, length: number, value: number): ()
function ffi.sizeof(typeName: string): number
function ffi.alignof(typeName: string): number
function ffi.errno(newValue: number?): number
```

Typed memory access:
- `ffi.read(ptr, offset, typeName)` — reads typed values (`"i8"`, `"u8"`, `"i16"`, `"u16"`, `"i32"`, `"u32"`, `"i64"`, `"u64"`, `"f32"`, `"f64"`, `"ptr"`, `"str"`).
- `ffi.write(ptr, offset, typeName, value)` — writes typed values into memory.

## json library

The `json` library provides high-speed, cycle-detected JSON serialization and strict parsing.

```
json.null: lightuserdata
```

Sentinel value used to represent and preserve JSON `null` values during encode/decode roundtrips.

```
function json.encode(value: any, options: (number | { indent: number })?): string
```

Serializes a table or primitive value into a JSON string with cycle detection.

```
function json.decode(str: string | buffer): any, string?
```

Parses a JSON string or buffer into Jaci tables and values.

```
function json.pretty(value: any): string
```

Encodes a value into formatted JSON with 2-space indentation.

```
function json.valid(str: string | buffer): boolean
```

Returns `true` if `str` is syntactically valid JSON without constructing tables.

```
function json.array(...: any): table
function json.object(t: table?): table
```

Helpers to explicitly tag tables as JSON arrays `[]` or JSON objects `{}` via `__jsontype`.

## hash & crypto library

The `hash` and `crypto` libraries provide cryptographic and non-cryptographic hash functions, symmetric ciphers, HMAC, and CSPRNG.

```
function hash.crc32(data: string | buffer): number
function hash.fnv1a(data: string | buffer): number
```

Fast non-cryptographic checksum and hash calculations.

```
function hash.md5(data: string | buffer): string
function hash.md5hex(data: string | buffer): string
function hash.sha1(data: string | buffer): string
function hash.sha1hex(data: string | buffer): string
function hash.sha224(data: string | buffer): string
function hash.sha224hex(data: string | buffer): string
function hash.sha256(data: string | buffer): string
function hash.sha256hex(data: string | buffer): string
function hash.sha384(data: string | buffer): string
function hash.sha384hex(data: string | buffer): string
function hash.sha512(data: string | buffer): string
function hash.sha512hex(data: string | buffer): string
```

Cryptographic hash functions returning raw binary digests or lowercase hexadecimal strings.

```
function hash.hmac(algorithm: "sha256" | "sha512" | "sha1" | "md5", key: string | buffer, data: string | buffer): string
function hash.hmachex(algorithm: string, key: string | buffer, data: string | buffer): string
function hash.hmac_sha256(key: string | buffer, data: string | buffer): string
function hash.hmac_sha512(key: string | buffer, data: string | buffer): string
```

HMAC message authentication codes.

```
function crypto.randomBytes(count: number): buffer
function crypto.timingSafeEqual(a: string | buffer, b: string | buffer): boolean
function crypto.chacha20(key: string | buffer, nonce: string | buffer, plaintext: string | buffer, counter: number?): buffer
```

Cryptographic utilities:
- `crypto.randomBytes`: Generates cryptographically secure pseudo-random bytes (`/dev/urandom` or `BCryptGenRandom`).
- `crypto.timingSafeEqual`: Constant-time comparison protecting against side-channel timing attacks.
- `crypto.chacha20`: High-speed RFC 7539 stream cipher encryption/decryption.

## process library

The `process` library manages system processes, environment variables, and command execution.

```
process.env: table
```

Proxy table for accessing and modifying environment variables (`process.env.PATH`, `process.env.MY_VAR = "1"`).

```
function process.spawn(cmd: string, args: { string }?, options: { cwd: string?, env: { [string]: string }? }?): { stdout: string, stderr: string, exitcode: number }
```

Spawns a child process synchronously, capturing its standard output, standard error, and exit status code.

```
function process.getpid(): number
function process.cwd(): string
function process.chdir(path: string): boolean
function process.kill(pid: number, signal: number?): boolean
function process.exit(code: number?): ()
```

## net library

The `net` library provides HTTP/1.1 client capabilities, full RFC 6455 WebSocket client communication, raw TCP socket networking, and URL utilities.

### HTTP Client:
```
function net.request(options: { url: string, method: string?, headers: { [string]: string }?, body: (string | buffer)? }): { ok: boolean, status: number, statusCode: number, headers: { [string]: string }, body: string }
function net.get(url: string, options: { headers: { [string]: string }? }?): { ok: boolean, status: number, body: string, headers: table }
function net.post(url: string, body: (string | buffer)?, options: table?): { ok: boolean, status: number, body: string, headers: table }
function net.put(url: string, body: (string | buffer)?, options: table?): { ok: boolean, status: number, body: string, headers: table }
function net.delete(url: string, options: table?): { ok: boolean, status: number, body: string, headers: table }
function net.patch(url: string, body: (string | buffer)?, options: table?): { ok: boolean, status: number, body: string, headers: table }
function net.head(url: string, options: table?): { ok: boolean, status: number, headers: table }
```

### WebSockets (RFC 6455):
```
function net.websocket(url: string): WebSocket
function net.websocketConnect(url: string): WebSocket
```

WebSocket methods on `WebSocket` objects:
- `ws:send(data: string | buffer, isBinary: boolean?): boolean`
- `ws:receive(): (string?, boolean | string)` — returns payload and `isBinary` boolean (or `nil, "closed"`).
- `ws:ping(data: string?): boolean`
- `ws:pong(data: string?): boolean`
- `ws:close(code: number?): ()`
- `ws:isOpen(): boolean`
- `ws:url(): string`

### TCP Sockets:
```
function net.connect(host: string, port: number): Socket
function net.listen(host: string?, port: number): Listener
```

Socket methods on `Socket` objects:
- `socket:send(data: string | buffer): number?`
- `socket:recv(maxBytes: number): string?`
- `socket:recvAll(maxBytes: number?): string?`
- `socket:readline(maxLen: number?): string?`
- `socket:settimeout(seconds: number): ()`
- `socket:setNonBlocking(nonBlocking: boolean?): ()`
- `socket:getsockname(): { host: string, port: number }?`
- `socket:getpeername(): { host: string, port: number }?`
- `socket:close(): ()`

Listener methods on `Listener` objects:
- `listener:accept(): Socket?`
- `listener:port(): number`
- `listener:getsockname(): { host: string, port: number }?`
- `listener:close(): ()`

### URL Utilities:
```
function net.urlParse(url: string): { scheme: string, host: string, port: number, path: string, query: string?, fragment: string? }?
function net.urlFormat(components: { scheme: string?, host: string?, port: number?, path: string?, query: string?, fragment: string? }): string
function net.urlEncode(str: string): string
function net.urlDecode(str: string): string
```

## task library

The `task` library provides an asynchronous reactor event loop, promises, timers, thread scheduling, CSP channels, and parallel execution boundaries.

```
function task.spawn(funcOrThread: ((...any) -> ...any) | thread, ...: any): thread
function task.defer(funcOrThread: ((...any) -> ...any) | thread, ...: any): ()
function task.delay(sec: number, func: (...any) -> ...any, ...: any): Timer
function task.every(sec: number, func: (...any) -> ...any, ...: any): Timer
function task.wait(sec: number?): number
function task.yield(): ()
function task.cancel(threadOrTimer: thread | Timer): ()
function task.status(threadOrPromise: thread | Promise): string
function task.desynchronize(): ()
function task.synchronize(): ()
```

### Promises:
```
function task.promise(executor: (resolve: (...any) -> (), reject: (any) -> ()) -> ()): Promise
function task.resolve(...: any): Promise
function task.reject(reason: any): Promise
function task.all(promises: { Promise }): Promise
function task.race(promises: { Promise }): Promise
function task.any(promises: { Promise }): Promise
function task.allSettled(promises: { Promise }): Promise
function task.async(fn: (...any) -> ...any): (...any) -> Promise
function task.await(promise: Promise): ...any
```

Promise methods:
- `promise:andThen(onFulfilled, onRejected): Promise`
- `promise:catch(onRejected): Promise`
- `promise:finally(onFinally): Promise`
- `promise:await(): ...any` (yields the calling coroutine until settled)
- `promise:status(): "pending" | "fulfilled" | "rejected"`
- `promise:value(): any`
- `promise:reason(): any`

### Channels (CSP):
```
function task.channel(capacity: number?): Channel
```

Channel methods:
- `channel:send(val: any): boolean` (yields if full/unbuffered)
- `channel:recv(): (any, boolean)` (yields if empty)
- `channel:receive(): (any, boolean)`
- `channel:try_send(val: any): boolean`
- `channel:trySend(val: any): boolean`
- `channel:try_receive(): (any, boolean)`
- `channel:tryReceive(): (any, boolean)`
- `channel:close(): ()`
- `channel:len(): number`
- `channel:capacity(): number`
- `channel:is_closed(): boolean`
- `channel:await(): (any, boolean)`

