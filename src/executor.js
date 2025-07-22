const { STRUCTURE_TYPE, VALUE_TYPE, COMPARISON_OPERATOR, MATH_OPERATOR } = require("./types");
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
                value = this.findInContext(context, value.value);
            }

            if (left.type === VALUE_TYPE.VARIABLE) {
                try {
                    const existing = this.findInContext(context, left.value);
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

            let funcData = this.findInContext(context, functionName);
            if (funcData.type !== VALUE_TYPE.FUNCTION) {
                throw new Error(`${functionName} is not a function`);
            }
            if (funcData.rawFn) {
                await funcData.rawFn([...functionArguments], context);
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

            let leftValue = left.value; 
            let rightValue = right.value;

            if (left.type === VALUE_TYPE.VARIABLE) {
                leftValue = this.findInContext(context, left.value).value;
            }
            if (right.type === VALUE_TYPE.VARIABLE) {
                rightValue = this.findInContext(context, right.value).value;
            }

            let result = false;
            if (operator === COMPARISON_OPERATOR.EQUAL) {
                result = leftValue === rightValue;
            } else if (operator === COMPARISON_OPERATOR.NOT_EQUAL) {
                result = leftValue !== rightValue;
            } else if (operator === COMPARISON_OPERATOR.GREATER_THAN) {
                result = leftValue > rightValue;
            } else if (operator === COMPARISON_OPERATOR.LESS_THAN) {
                result = leftValue < rightValue;
            } else if (operator === COMPARISON_OPERATOR.GREATER_THAN_OR_EQUAL) {
                result = leftValue >= rightValue;
            } else if (operator === COMPARISON_OPERATOR.LESS_THAN_OR_EQUAL) {
                result = leftValue <= rightValue;
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
        } else if (node.type === STRUCTURE_TYPE.BLOCK) {
            const childContext = {
                parent: context,
                variables: {},
            };
            for (const child of node.children) {
                await this.executeNode(child, childContext);
            }
        } else if (node.type === STRUCTURE_TYPE.LOOP) {
            const childContext = {
                parent: context,
                variables: {},
            };

            if (node.pre) {
                await this.executeNode(node.pre, childContext);
            }

            while (true) {
                const result = await this.executeNode(node.condition, childContext);
                if (!result.value) {
                    break;
                }

                for (const child of node.children) {
                    await this.executeNode(child, childContext);
                }

                if (node.post) {
                await this.executeNode(node.post, childContext);
                }
            }
        } else if (node.type === STRUCTURE_TYPE.MATH) {
            const left = await this.executeNode(node.left, context);
            const right = await this.executeNode(node.right, context);
            const operator = node.operator;

            let leftValue = left.value;
            let rightValue = right.value;

            if (left.type === VALUE_TYPE.VARIABLE) {
                leftValue = this.findInContext(context, left.value).value;
            }
            if (right.type === VALUE_TYPE.VARIABLE) {
                rightValue = this.findInContext(context, right.value).value;
            }

            let result = null;
            if (operator === MATH_OPERATOR.ADD) {
                result = leftValue + rightValue;
            } else if (operator === MATH_OPERATOR.SUBTRACT) {
                result = leftValue - rightValue;
            } else if (operator === MATH_OPERATOR.MULTIPLY) {
                result = leftValue * rightValue;
            } else if (operator === MATH_OPERATOR.DIVIDE) {
                result = leftValue / rightValue;
            } else if (operator === MATH_OPERATOR.MODULO) {
                result = leftValue % rightValue;
            }

            return {
                type: VALUE_TYPE.NUMBER,
                value: result,
            };
        } else if (node.type === STRUCTURE_TYPE.OBJECT) {
            const result = {};
            for (const property in node.properties) {
                result[property] = await this.executeNode(node.properties[property], context);
            }
            return {
                type: VALUE_TYPE.OBJECT,
                value: result,
            };
        } else if (node.type === STRUCTURE_TYPE.PATH) {
            const left = await this.executeNode(node.left, context);
            let current = left;

            if (current.type === VALUE_TYPE.VARIABLE) {
                current = this.findInContext(context, current.value);
            }

            const path = [...node.path];
            while (path.length > 0) {
                const key = path.shift();
                if (current.type === VALUE_TYPE.OBJECT) {
                    if (current.value[key]) {
                        current = current.value[key];
                    } else {
                        throw new Error(`Invalid path: ${key}`);
                    }
                } else {
                    throw new Error(`Path on unknown value type: ${current.type}`);
                }
            }
            return current;
        } else {
            throw new Error(`Unknown node type: ${node.type}`);
        }

        return {
            type: VALUE_TYPE.NULL,
        };
    }

    findInContext(context, variable) {
        if (context.variables?.[variable]) {
            return context.variables[variable];
        } else if (context.parent) {
            return this.findInContext(context.parent, variable);
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