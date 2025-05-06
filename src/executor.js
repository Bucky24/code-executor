const { STRUCTURE_TYPE, VALUE_TYPE } = require("./types");
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
        for (const node of executeCode) {
            await this.executeNode(node, this.context);
        }
    }

    async executeNode(node, context) {
        if (node.type === STRUCTURE_TYPE.VARIABLE) {
            const value = await this.executeNode(node.value);
            context.variables[node.name] = value;
            return 
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