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

### COMPARISON_OPERATOR

A list of operators for use in comparisons

| EQUAL | Checks for equality |
| NOT_EQUAL | Checks for non-equality |
| GREATER_THAN | Checks if left is greater than right |
| LESS_THAN | Checks if left is less than right |
| GREATER_THAN_OR_EQUAL | Checks if left is greater than or equal to right |
| LESS_THAN_OR_EQUAL | Checks if left is less than or equal to right |

### MATH_OPERATOR

Operators for use in math statments

| ADD |
| SUBTRACT |
| MULTIPLY |
| DIVIDE |
| MODULO |

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

### COMPARISON

Evaluates two statements against each other.

| property | description |
| -- | -- |
| left | A `Statement` to provide the left value |
| right | A `Statement` to provide the right value |
| operator | One of `COMPARISON_OPERATOR` to do the comparison |

### CONDITIONAL

Executes enclosed statements only if the attached comparison is true.

| property | description |
| -- | -- |
| condition | A `Statement` (usually a `COMPARISON`). If true, the attached statements will execute
| children | A list of `Statements` that will run if the condition is true

### CONDITIONAL_GROUP

Defines a list of `CONDITIONALS`, executing the statements of the first matching `CONDITIONAL`. Once a match is found, no further `CONDITIONALS` are checked.

| property | description |
| -- | -- |
| children | A list of `STATEMENTS` that are expected to be `CONDITIONALS` |
| finally | A list of `STATEMENTS` that are executed after any matching `CONDITIONAL`. Optional |

### BLOCK

A logical group of `Statements`, all the `BLOCK` does is simply execute all its children. Used mostly for easier structure of your input data. Blocks do create a new context, but do not add anything to that context. As such, they can also be used to prevent data from leaking to a higher context.

| property | description |
| -- | -- |
| children | A list of `STATEMENTS` |

### LOOP

Allows `Statements` to be repeated in a controlled manner.

| property | description |
| -- | -- |
| pre | A `Statement` to be executed before the loop starts. Runs in loop context. Optional |
| condition | A `Statement` that runs before every loop. If it does not evaluate to true, the loop ends. Runs in loop context. |
| post | A `Statement` to be executed after each loop iteration. Runsin loop context. Optional |
| children | A list of `Statements` to be run every loop iteration |

### MATH

Allows numeric operations to be performed on two values.

| property | description |
| -- | -- |
| left | A `Statement` that provides the left-hand side of the equation |
| right | A `Statement` that provides the right-hand side of the equation |
| operator | One of `MATH_OPERATOR` |

### OBJECT

Provides the definition for a standard key/value pair object

| property | description |
| -- | -- |
| properties | A map where the keys are any valid property key and the values are `Statements` |

### PATH

Provides a way to dive deeper into nested objects and draw out nested properties.

| property | description |
| -- | -- |
| left | A `Statement` providing the start of the path |
| path | An array of strings indicating the path to follow |