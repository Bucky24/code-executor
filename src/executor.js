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
            let value = await this.executeNode(node.right, context);
            const left = await this.executeNode(node.left, context);

            if (value.type === VALUE_TYPE.VARIABLE) {
                value = this.__findInContext(context, value.value);
            }

            if (left.type === VALUE_TYPE.VARIABLE) {
                try {
                    const existing = this.__findInContext(context, left.value);
                    existing.type = value.type;
                    existing.value = value.value;
                } catch(e) {
                    context.variables[left.value] = value;
                }
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
                functionArguments.push(await this.executeNode(arg, context));
            }

            let funcData = this.__findInContext(context, functionName);
            if (funcData.type !== VALUE_TYPE.FUNCTION) {
                throw new Error(`${functionName} is not a function`);
            }
            if (funcData.rawFn) {
                await funcData.rawFn(...functionArguments);
            } else {
                const paramData = {};
                for (let i = 0; i < funcData.parameters.length; i++) {
                    const paramName = await this.executeNode(funcData.parameters[i], context);
                    if (paramName.type !== VALUE_TYPE.VARIABLE) {
                        throw new Error(`Invalid parameter name type: ${paramName.type}`);
                    }
                    const data = functionArguments[i];
                    paramData[paramName.value] = data;
                }

                const childContext = {
                    parent: context,
                    variables: {
                        ...paramData,
                    },
                };
                for (const child of funcData.children) {
                    await this.executeNode(child, childContext);
                }
            }
        } else if (node.type === STRUCTURE_TYPE.COMPARISON) {
            const left = await this.executeNode(node.left, context);
            const right = await this.executeNode(node.right, context);
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
            const condition = await this.executeNode(node.condition, context);
            if (condition.value) {
                const childContext = {
                    parent: context,
                    variables: {},
                };
                for (const child of node.children) {
                    await this.executeNode(child, childContext);
                }
                return {
                    type: VALUE_TYPE.BOOLEAN,
                    value: true,
                };
            }
            return {
                type: VALUE_TYPE.BOOLEAN,
                value: false,
            };
        } else if (node.type === STRUCTURE_TYPE.CONDITIONAL_GROUP) {
            for (const child of node.children) {
                const result = await this.executeNode(child, context);
                if (result.value) {
                    // found one that matched
                    break;
                }
            }

            if (node.finally) {
                await this.executeNode(node.finally, context);
            }
        } else if (node.type === STRUCTURE_TYPE.FUNCTION) {
            const functionName = node.name;

            const funcData = {
                type: VALUE_TYPE.FUNCTION,
                parameters: node.parameters,
                children: node.children,
                context,
            };

            if (!node.name) {
                return funcData;
            }

            context.variables[functionName] = {
                ...funcData,
                name: functionName,
            };
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