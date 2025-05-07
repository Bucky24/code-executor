const { STRUCTURE_TYPE, VALUE_TYPE, COMPARISON_OPERATOR } = require("./types");
const { validate } = require("./validator");

class Executor {
    constructor(code, globalContext = {}) {
        this.context = {
            variables: {},
            parent: globalContext,
        };
        validate(code);
        this.code = code;
    }

    static createContext(variables, functions) {
        const newVariables = {};
        for (const key in variables) {
            let type = null;
            if (typeof variables[key] === 'string') {
                type = VALUE_TYPE.STRING;
            } else if (typeof variables[key] === 'number') {
                type = VALUE_TYPE.NUMBER;
            }
            newVariables[variable.name] = {
                type,
                value: variables[key],
            };
        }

        for (const name in functions) {
            newVariables[name] = {
                type: VALUE_TYPE.FUNCTION,
                rawFn: functions[name],
            };
        }
        return {
            variables: newVariables,
        };
    }

    async execute() {
        const executeCode = Array.isArray(this.code) ? this.code : [this.code];
        let result = null;
        for (const node of executeCode) {
            result = await this.executeNode(node, this.context);
        }
        return result;
    }

    async executeNode(node, context) {
        if (node.type === STRUCTURE_TYPE.ASSIGNMENT) {
            const value = await this.executeNode(node.right);
            const left = await this.executeNode(node.left);
            if (left.type === VALUE_TYPE.VARIABLE) {
                context.variables[left.value] = value;
            } else {
                throw new Error(`Invalid left hand of assignment: ${left.type}`);
            }
            return;
        } else if (node.type === STRUCTURE_TYPE.VARIABLE) {
            return {
                type: VALUE_TYPE.VARIABLE,
                value: node.name,
            };
        } else if (node.type === STRUCTURE_TYPE.NUMBER) {
            return {
                type: VALUE_TYPE.NUMBER,
                value: node.value,
            };
        } else if (node.type === STRUCTURE_TYPE.STRING) {
            return {
                type: VALUE_TYPE.STRING,
                value: node.value,
            };
        } else if (node.type === STRUCTURE_TYPE.FUNCTION_CALL) {
            const functionName = node.name;
            const functionArguments = [];
            for (const arg of node.arguments) {
                functionArguments.push(await this.executeNode(arg));
            }
            let funcData = this.__findInContext(context, functionName);
            if (funcData.type !== VALUE_TYPE.FUNCTION) {
                throw new Error(`${functionName} is not a function`);
            }
            if (funcData.rawFn) {
                await funcData.rawFn(...functionArguments);
            }
        } else if (node.type === STRUCTURE_TYPE.COMPARISON) {
            const left = await this.executeNode(node.left);
            const right = await this.executeNode(node.right);
            const operator = node.operator;
            
            let result = false;
            if (operator === COMPARISON_OPERATOR.EQUAL) {
                result = left.value === right.value;
            } else if (operator === COMPARISON_OPERATOR.NOT_EQUAL) {
                result = left.value !== right.value;
            } else if (operator === COMPARISON_OPERATOR.GREATER_THAN) {
                result = left.value > right.value;
            } else if (operator === COMPARISON_OPERATOR.LESS_THAN) {
                result = left.value < right.value;
            } else if (operator === COMPARISON_OPERATOR.GREATER_THAN_OR_EQUAL) {
                result = left.value >= right.value;
            } else if (operator === COMPARISON_OPERATOR.LESS_THAN_OR_EQUAL) {
                result = left.value <= right.value;
            }

            return {
                type: VALUE_TYPE.BOOLEAN,
                value: result,
            };
        } else if (node.type === STRUCTURE_TYPE.CONDITIONAL) {
            const condition = await this.executeNode(node.condition);
            if (condition.value) {
                const childContext = {
                    parent: context,
                    variables: {},
                };
                for (const child of node.children) {
                    await this.executeNode(child, childContext);
                }
            }
        } else {
            throw new Error(`Unknown node type: ${node.type}`);
        }

        return {
            type: VALUE_TYPE.NULL,
        };
    }

    __findInContext(context, variable) {
        if (context.variables?.[variable]) {
            return context.variables[variable];
        } else if (context.parent) {
            return this.__findInContext(context.parent, variable);
        } else {
            throw new Error(`Variable ${variable} not found`);
        }
    }

    getTopLevelContext() {
        return this.context;
    }
}

module.exports = {
    Executor,
};