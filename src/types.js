const STRUCTURE_TYPE = {
    ASSIGNMENT: "assignment",
    VARIABLE: "variable",
    NUMBER: "number",
    STRING: "string",
    FUNCTION_CALL: "function_call",
    FUNCTION: "function",
    COMPARISON: "comparison",
    CONDITIONAL: "conditional",
    CONDITIONAL_GROUP: "conditional_group",
    FUNCTION: "function",
    BLOCK: "block",
    LOOP: "loop",
    MATH: "math",
    OBJECT: "object",
};

const COMPARISON_OPERATOR = {
    EQUAL: "equal",
    NOT_EQUAL: "not_equal",
    GREATER_THAN: "gt",
    LESS_THAN: "lt",
    GREATER_THAN_OR_EQUAL: "gte",
    LESS_THAN_OR_EQUAL: "lte",
};

const VALUE_TYPE = {
    STRING: "string",
    NUMBER: "number",
    FUNCTION: "function",
    NULL: "null",
    BOOLEAN: "boolean",
    VARIABLE: "variable",
    OBJECT: "object",
};

const MATH_OPERATOR = {
    ADD: "add",
    SUBTRACT: "subtract",
    MULTIPLY: "multiply",
    DIVIDE: "divide",
    MODULO: "modulo",
};

module.exports = {
    STRUCTURE_TYPE,
    VALUE_TYPE,
    COMPARISON_OPERATOR,
    MATH_OPERATOR,
};