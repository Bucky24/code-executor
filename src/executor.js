const { STRUCTURE_TYPE } = require("./types");
const { validate } = require("./validator");

class Executor {
    constructor(code) {
        this.context = {
            variables: {},
        };
        validate(code);
        this.code = code;
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
        } else if (node.type === STRUCTURE_TYPE.NUMBER) {
            return node.value;
        } else {
            throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    getTopLevelContext() {
        return this.context;
    }
}

module.exports = {
    Executor,
};