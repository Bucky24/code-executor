# code-executor

This is designed to be a somewhat lightweight way of executing a specific syntax tree. 

## Exports

### execute

The `execute` function is responsible for actually running the code. It takes in a single parameter, which is intended to be an array of `Structure` objects. It returns a promise that resolves once execution is complete.

### validate

The `validate` function verifies that a code syntax is valid and can be executed. It takes in a single parameter, which is intended to be an array of `Structure` objects.

It returns nothing, but will throw an `Error` if there are validation errors.

### STRUCTURE_TYPE

A list of valid types for a `Structure`

| type | value |
| -- | -- |
| ASSIGNMENT | Variable assignment |
| VARIABLE | A standalone variable |
| NUMBER | A numeric value |
| STRING | A string value |
| FUNCTION_CALL | A call to a function |
| FUNCTION | A function definition |
| COMPARISON | A comparison block |
| CONDITIONAL | A statement that allows comparing two values |
| CONDITIONAL_GROUP | Allows using boolean operators to compare multiple conditionals |
| BLOCK | A group of `Structure` objects |
| LOOP | A `Structure` that allows repeating code |
| MATH | Allows math operations on values |
| OBJECT | A key/value object |
| PATH | A list of keys allowing diving into objects |