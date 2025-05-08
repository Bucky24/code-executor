const { STRUCTURE_TYPE } = require("./types")

const helpers = {
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
    assign: (name, value) => {
        return {
            type: STRUCTURE_TYPE.ASSIGNMENT,
            left: helpers.variable(name),
            right: value,
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
    createFunction: (name, parameters, children) => {
        return {
            type: STRUCTURE_TYPE.FUNCTION,
            name,
            parameters,
            children,
        };
    },
};

module.exports = helpers;