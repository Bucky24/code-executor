class StateManager {
    constructor(states, initialState) {
        this.states = states;
        this.initialState = initialState;
        this.newContext();
        this.statements = [];
        this.stack = [];
        this.rewindFlag = false;
        this.childKey = null;
    }

    newContext() {
        this.context = {
            state: this.initialState,
            data: {},
        };
    }

    pop(rewind = false) {
        const contextAsStatement = {
            state: this.context.state,
            ...this.context.data,
            children: this.context.children,
        };
        if (this.stack.length === 0) {
            if (this.context.state !== this.initialState) {
                this.statements.push(contextAsStatement);
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

    processToken(token) {
        const stateData = this.states[this.context.state];
        if (!stateData) {
            throw new Error(`Don't know how to process state ${this.context.state}`);
        }
        let func;
        if (typeof stateData === 'function' && /^class\s/.test(Function.prototype.toString.call(stateData))) {
            func = stateData.process;
        } else if (typeof stateData === 'function') {
            func = stateData;
        }
        const result = func(token, this.getContext(), this);

        if (!result) {
            throw new Error(`Unxpected token "${token}" at state ${this.context.state}`);
        }

        if (this.rewindFlag) {
            // replay this token
            this.rewindFlag = false;
            this.processToken(token);
        }
    }

    processStatement(statement, lang) {
        const stateData = this.states[statement.state];
        if (!stateData) {
            throw new Error(`Don't know how to generate state ${statement.state}`);
        }
        let func;
        if (typeof stateData === 'function' && /^class\s/.test(Function.prototype.toString.call(stateData))) {
            func = stateData.generate;
        } else if (typeof stateData === 'function') {
            throw new Error(`processStatement requires a class but ${statement.state} is a function`);
        }

        const textOutput = func(statement, lang, this);

        return textOutput;
    }

    generate(language) {
        const statements = this.getStatements();

        const output = [];
        for (const statement of statements) {
            output.push(this.processStatement(statement, language));
        }

        return output;
    }
}

module.exports = {
    StateManager,
};