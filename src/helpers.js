const { STRUCTURE_TYPE } = require("./types")

module.exports = {
    number: (value) => {
        return {
            type: STRUCTURE_TYPE.NUMBER,
            value,
        };
    },
    variable: (name) => {
        return {
            type: STRUCTURE_TYPE.VARIABLE,
            name,
        };
    },
    callFunction: (name, args) => {
        return {
            type: STRUCTURE_TYPE.FUNCTION_CALL,
            name,
            arguments: args,
        };
    },
    comparison: (left, right, operator) => {
        return {
            type: STRUCTURE_TYPE.COMPARISON,
            left,
            right,
            operator,
        };
    },
    conditional: (condition, children) => {
        return {
            type: STRUCTURE_TYPE.CONDITIONAL,
            condition,
            children,
        };
    },
};