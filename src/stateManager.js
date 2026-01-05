const { Tokenize } = require("./tokenizer");

class StateManager {
    constructor() {
        this.languages = {};
        this.internalStatements = [];
        this.statements = [];
        this.stack = [];
        this.rewindFlag = false;
        this.childKey = null;
        this.currentLanguage = null;
    }

    registerLanguage(language, states, generators, initialState, splitTokens) {
        this.languages[language] = {
            states,
            generators,
            initialState,
            splitTokens,
        };
    }

    getCurrentLanguage() {
        return this.languages[this.currentLanguage];
    }

    setCurrentLanguage(language) {
        this.currentLanguage = language;
    }

    newContext() {
        const language = this.getCurrentLanguage();
        this.context = {
            state: language.initialState,
            data: {},
        };
    }

    pop(rewind = false) {
        const language = this.getCurrentLanguage();
        const contextAsStatement = {
            state: this.context.state,
            ...this.context.data,
            children: this.context.children,
        };
        if (this.stack.length === 0) {
            if (this.context.state !== language.initialState) {
                this.internalStatements.push(contextAsStatement);
            }
            this.newContext();
        } else {
            this.context = this.stack.pop();
            if (this.childKey) {
                this.context.data[this.childKey] = [
                    ...this.context.data[this.childKey] || [],
                    contextAsStatement,
                ]
            } else {
                this.context.children = [
                    ...this.context.children || [],
                    contextAsStatement,
                ];
            }
            this.childKey = null;
        }

        if (rewind) {
            this.rewindFlag = true;
        }
    }

    popAll() {
        while (this.stack.length > 0) {
            this.pop();
        }
        // pop anything left over that's not in the stack
        this.pop();
    }

    push(rewind = false, childKey = null) {
        this.stack.push(this.context);
        this.newContext();
        this.childKey = childKey;

        if (rewind) {
            this.rewindFlag = true;
        }
    }

    setState(state, data) {
        this.context.state = state;
        this.setData(data);
    }

    setData(data = {}) {
        const newData = {...this.context.data};
        const set = (obj, key, val) => {
            if (obj[key] && Array.isArray(obj[key]) && Array.isArray(val)) {
                obj[key] = [...obj[key], ...val];
            } else {
                obj[key] = val;
            }
        }
        for (const key in data) {
            const val = data[key];
            if (key.includes(".")) {
                const path = key.split(".");
                let cur = newData;
                for (let i=0;i<path.length-1;i++) {
                    const elem = path[i];
                    if (!cur[elem]) {
                        throw new Error(`setData: error when processing data path ${key} at elem ${elem}: does not exist`);
                    }
                    cur = cur[elem];
                }
                set(cur, path.at(-1), val);
            } else {
                set(newData, key, val);
            }
        }

        this.context.data = newData;
    }

    getContext() {
        return {
            state: this.context.state,
            ...this.context.data,
            children: this.context.children,
        };
    }

    getStatements() {
        return this.statements;
    }

    getInternalStatements() {
        return this.internalStatements;
    }

    getClassMethod(state, method) {
        const language = this.getCurrentLanguage();
        const stateData = language.states[state];
        if (!stateData) {
            throw new Error(`Don't know how to handle state ${state}/${this.currentLanguage}`);
        }
        if (typeof stateData === 'function' && /^class\s/.test(Function.prototype.toString.call(stateData))) {
            if (!stateData[method]) {
                throw new Error(`State ${state}/${this.currentLanguage} does not expose static method "${method}"`);
            }
            return stateData[method];
        }

        throw new Error(`State ${state}/${this.currentLanguage} does not map to a class`);
    }

    processToken(token, debug) {
        const func = this.getClassMethod(this.context.state, 'processToken');
        if (debug) {
            const context = this.getContext();
            if (debug === 1) {
                delete context.children;
            }
            console.log(`Processing token ${token} with context ${JSON.stringify(context, null, 4)}`);
        }
        const result = func(token, this.getContext(), this);

        if (!result) {
            throw new Error(`Unxpected token "${token}" at state ${this.context.state}/${this.currentLanguage}`);
        }

        if (this.rewindFlag) {
            // replay this token
            this.rewindFlag = false;
            this.processToken(token, debug);
        }
    }

    processInternalStatement(statement) {
        const func = this.getClassMethod(statement.state, 'processInternal');
        const result = func(statement, this);

        return result;
    }

    processCode(code, debug = false) {
        const language = this.getCurrentLanguage();
        const tokens = Tokenize(code, language.splitTokens);
        this.newContext();
        this.internalStatements = [];

        for (const token of tokens) {
            this.processToken(token, debug);
        }

        this.popAll();

        // now go through statements and convert them 
        for (const statement of this.getInternalStatements()) {
            this.statements.push(this.processInternalStatement(statement));
        }
    }

    generateStatement(statement) {
        const language = this.getCurrentLanguage();
        const generator = language.generators[statement.type];
        if (!generator) {
            throw new Error(`Don't know how to generate type ${statement.type}/${this.currentLanguage}`);
        }

        const textOutput = generator(statement, this);

        return textOutput;
    }

    generateInternalStatement(statement) {
        const func = this.getClassMethod(statement.state, 'generateInternal');
        const result = func(statement, this);

        return result;
    }

    generate() {
        const statements = this.getStatements();
        const internal = [];
        for (const statement of statements) {
            internal.push(this.generateStatement(statement));
        }

        // now we have our statements in internal statement mode, convert to text
        const output = [];
        for (const statement of internal) {
            output.push(this.generateInternalStatement(statement));
        }

        return output;
    }
}

module.exports = {
    StateManager,
};