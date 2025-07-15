# code-executor

This is designed to be a somewhat lightweight way of executing a specific syntax tree. 

## Exports

### execute

The `execute` function is responsible for actually running the code. It takes in a single parameter, which is intended to be an array of `Statement` objects. It returns a promise that resolves once execution is complete.

### validate

The `validate` function verifies that a code syntax is valid and can be executed. It takes in a single parameter, which is intended to be an array of `Statement` objects.

It returns nothing, but will throw an `Error` if there are validation errors.

### STRUCTURE_TYPE

A list of valid types for a `Statement`. See below for details.

| COMPARISON | A comparison block |
| CONDITIONAL | A statement that allows comparing two values |
| CONDITIONAL_GROUP | Allows using boolean operators to compare multiple conditionals |
| BLOCK | A group of `Statement` objects |
| LOOP | A `Statement` that allows repeating code |
| MATH | Allows math operations on values |
| OBJECT | A key/value object |
| PATH | A list of keys allowing diving into objects |

## Statement

The whole premise of the executor is that it takes in a structured statement tree and then executes the statements. To that end, every `Statement` will have a `type` field, which must be one of `STRUCTURE_TYPE`. These are the things that the executor knows how to run.

### ASSIGNMENT

Allows assigning between two locations.

| property | description |
| -- | -- |
| left | `Statement` which provides something to assign to |
| right | `Statement` which provides the value to assign |

### VARIABLE

This `Statement` represents a variable. Usually meant for use as part of other statements

| property | description |
| -- | -- |
| name | The name of the variable |

### NUMBER

Represents a scalar numeric value

| property | description |
| -- | -- |
| value | A numeric value |

### STRING

Represents a scalar string value

| property | description |
| -- | -- |
| value | A string value |

### FUNCTION_CALL

Represents a call to a pre-defined function. This could be a local function or a function that is part of the the global scope.

| property | description |
| -- | -- |
| name | The name of the function to call |
| arguments | A list of `Statements` that resolve to arguments |

### FUNCTION

Defines a block of re-usable code that can be called as desired.

| property | description |
| -- | -- |
| name | The name of the function |
| parameters | A list of `Statements` that provide the parameter names. Expected to be of type `VARIABLE` |
| children | A list of `Statements` that provides the code that makes up the function.