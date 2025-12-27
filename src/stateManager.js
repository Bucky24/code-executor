class StateManager {
    constructor(states, initialState) {
        this.states = states;
        this.initialState = initialState;
        this.newContext();
        this.statements = [];
        this.stack = [];
        this.rewindFlag = false;
    }

    newContext() {
        this.context = {
            state: this.initialState,
            data: {},
        };
    }

    pop() {
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
            const oldContext = this.context;
            this.context = this.stack.pop();
            this.context.children = [
                ...this.context.children || [],
                contextAsStatement,
            ];
        }
    }

    push(rewind = false) {
        this.stack.push(this.context);
        this.newContext();

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
                        throw new Error(`setData: error when processing data path ${path} at elem ${elem}: does not exist`);
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
        const stateFunction = this.states[this.context.state];
        if (!stateFunction) {
            throw new Error(`Don't know how to process state ${this.context.state}`);
        }
        const result = stateFunction(token, this.getContext());
        if (!result) {
            throw new Error(`Unxpected token "${token}" at state ${this.context.state}`);
        }

        if (this.rewindFlag) {
            // replay this token
            this.rewindFlag = false;
            this.processToken(token);
        }
    }
}

module.exports = {
    StateManager,
};