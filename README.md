# code-executor

This is designed to be a somewhat lightweight way of processing, executing, and transpiling programming languages

## Exports

### Executor

The `Executor` is the class that handles running code

#### execute

The `execute` function is responsible for actually running the code

| argument | type | description |
| -- | -- | -- |
| statements | Statement[] | Statements to execute |
| globalContext | Context | Starting context for the executor. Optional |

#### createContext

The `createContext` method allows easy creation of a `Context` for use in the `execute` function.

| argument | type | description |
| -- | -- | -- |
| variables | Object with key being variable name and value being variable value | List of variables for the new context |
| functions | Object with key being function name and value being function callback | List of functions for the new context |

Context functions take in two parameters. The first is an array of arguments, and the second is the context that the function was called from.

#### findInContext

This method takes in a context and a variable name and looks up the corresponding value.

| argument | type | description |
| -- | -- | -- |
| context | The `Context` to search (will also search parent contexts) |
| variable | The variable name to find |

#### getTopLevelContext

This method returns the top level global `Context` that the `Executor` is working with.

#### getValueFor

This method takes in a context and a `ResultValue` and returns a scalar that represents the value 

| argument | type | description |
| -- | -- | -- |
| context | The `Context` to search (will also search parent contexts) |
| variable | The `ResultValue` to get a value for |

### validate

The `validate` function verifies that a code syntax is valid and can be executed. It takes in a single parameter, which is intended to be an array of `Statement` objects.

It returns nothing, but will throw an `Error` if there are validation errors.

### STRUCTURE_TYPE

A list of valid types for a `Statement`. See below for details.

### COMPARISON_OPERATOR

A list of operators for use in comparisons

| Type | Description |
| -- | -- |
| EQUAL | Checks for equality |
| NOT_EQUAL | Checks for non-equality |
| GREATER_THAN | Checks if left is greater than right |
| LESS_THAN | Checks if left is less than right |
| GREATER_THAN_OR_EQUAL | Checks if left is greater than or equal to right |
| LESS_THAN_OR_EQUAL | Checks if left is less than or equal to right |

### MATH_OPERATOR

Operators for use in math statments

| Operator |
| -- |
| ADD |
| SUBTRACT |
| MULTIPLY |
| DIVIDE |
| MODULO |

### VALUE_TYPE

| type | description |
| -- | -- |
| STRING | string data |
| NUMBER | numeric data |
| FUNCTION | The full data and structure of a function, as `Statements` |
| NULL | no data |
| BOOLEAN | boolean data |
| VARIABLE | A string that maps to another variable |
| OBJECT | A hashmap with object data |
| RETURN_VALUE | A special datatype that indicates a value generated from a `RETURN` statement. Should usually be bubbled up the stack to be returned from a function |

### Tokenize

The `Tokenize` method takes in a string of code and a series of "interesting" characters. It returns the code tokenized and broken apart by these characters.

| argument | type | description |
| -- | -- | -- |
| code | String | code to tokenize |
| splitTokens | String[] | List of tokens to split by. These tokens are also included in the output. |

### StateManager

The `StateManager` can provide assistance with generating your parse tree. It is split into a few sections: 

#### Creation

Create the state manager via the `constructor`, which takes in the following parameters:

| Param | Description |
| -- | -- |
| stateMap |  |
| initialState | The initial state to start the manager from |

Next, initialize a language via the `registerLanguage` method:

| Param | Description |
| -- | -- |
| language | The name of the language |
| stateMap | A map of state to process. This value must be a class. The required functions of this class are defined in later sections. |
| generateMap | A map from `STRUCTURE_TYPE` to generation function. The generation function takes in a `Statement` and a manager param, which is the current instance of the `StateManager` |
| initialState | The state to start with |
| splitTokens | A list of tokens to split code by |

#### Code Parsing

Code parsing is done first by setting the active language via `setCurrentLanguage`

| Param | Description |
| -- | -- |
| language | The language to set as the current |

Then the method `processCode` should be called.

| Param | Description |
| -- | -- |
| code | The code to process |

This method will perform the following steps:
1) Use `Tokenizer` to tokenize the code, according to the `splitTokens` of the language
2) Initialize the current state to `initialState`
3) For each token, look up the state class for the current state, then attempt to call `processToken`. This is a static method that takes in the following arguments:

| Param | Description |
| -- | -- |
| token | The token to process |
| context | The current processing context |
| manager | The current instance of the `StateManager` |

This method should return true if the token has been processed correctly. Else an error is thrown.

4) Once finished, these internal statements will be turned into `Statement` objects. For each internal statement, look up the state class for the state, then attempt to call `processInternal`. This is a static method that takes in the following arguments:

| Param | Description |
| -- | -- |
| statement | The internal statement |
| manager | The current instance of the `StateManager` |

This method should return a valid `Statement`

The following methods can be used by `processToken` to ensure the context is updated.

##### setData

This method allows changing any data field of the current context. It takes in an object, where the key is the path to what in the data should be modified (This is a dotpath which allows changing deeper objects). The value is the value to set. If the value to set is an array, and the existing value is also an array, the result will be the concatination of both arrays.

##### setState

This method changes the active state. Note that this will change the state of the current context, not create a new context (use the `push` method for creating a nested context). The second parameter of this method will also be passed into `setData` so you can set data and state in the same function.

##### push

This method adds the current context to the context stack and starts over from a brand new context. Use this when entering a statement block to allow recursive statement processing.

| param | description |
| -- | -- |
| rewind | boolean, if true the current token will be replayed after the new context is generated. Optional, defaults false |
| childKey | string, the key to insert children under on the parent context. Optional, defaults to "children" |

##### pop

The `pop` method should be called when the current statement is finished and ready for processing. If there are contexts on the stack, the current context is added to the `children` array of its parent. The parent is then popped of the stack and set as the current context.

If there are no contexts on the stack, the current context is added to the `statements` list and a new context is generated.

| param | description |
| -- | -- |
| rewind | boolean, if true the current token will be replayed after the next context is determined. Optional, defaults false |

#### Generation

The `StateManager` can take in statements and convert them into any registered language. Trigger this by calling `setCurrentLanguage` then `generate`. This kicks off the following process:

1) For each `Statement`, the appropriate function in the language's `generator` map is looked up, using the `STRUCTORE_TYPE` of the `Statement`

| Param | Description |
| statement | The `Statement` |
| manager | The instance of the `StateManager` |

This should return an internal statement representing the `Statement` for this language. The manager method `generateStatement` can be called with any nested `Statement`.

2) For each internal statement, look up the appropriate class for the statement state, then call `generateInternal`.

| Param | Description |
| statement | The internal statement |
| manager | The instance of the `StateManager` |

This should return a text representation of the statement in that language's code. The manager method `generateInternalStatement` can be called with any nested internal statement to get the code for that statement.

## Types

### Context

The Context is an object that provides functions, variables, and other data to a specific level of the program and all children of that level. This can be used to "inject" capabilities into your code.

| property | description |
| -- | -- |
| variables | Object with keys being the names of the variables, and values being `ResultValue` |
| functions | Object with keys being the names of the functions, and values being `ResultValue` with type `FUNCTION` |

### ResultValue

The `ResultValue` contains information and type and data for data that can be passed around the system.

| property | description |
| -- | -- |
| type | One of `VALUE_TYPE` |
| value | The value of the result |
| rawFn | Only used for `FUNCTION`, to indicate a function that is a JS callback, as opposed to `Statements` |


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

Defines a block of re-usable code that can be called as desired. Function definitions are processed before the main code loop, so it is possible to define a function after it is called.

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

### RETURN

Provides a way to exit a function at a specific point, returning an optional value. All blocks elements will exit as soon as they detect a RETURN statement has run.

| property | description |
| -- | -- |
| children | Only the first child is used, should execute to a value |