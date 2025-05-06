const { Executor } = require("../src/executor");
const { STRUCTURE_TYPE, VALUE_TYPE } = require("../src/types");

describe('Executor', () => {
    describe('execute', () => {
        it('should create a variable', async () => {
            const code = { type: STRUCTURE_TYPE.VARIABLE, name: 'foo', value: { type: STRUCTURE_TYPE.NUMBER, value: 1 } };
            const executor = new Executor(code);

            await executor.execute();

            expect(executor.getTopLevelContext().variables).toEqual({ foo: { type: VALUE_TYPE.NUMBER, value: 1 } });
        });

        it('should handle a string correctly', async () => {
            const code = { type: STRUCTURE_TYPE.VARIABLE, name: 'foo', value: { type: STRUCTURE_TYPE.STRING, value: "hello" } };
            const executor = new Executor(code);

            await executor.execute();

            expect(executor.getTopLevelContext().variables).toEqual({ foo: { type: VALUE_TYPE.STRING, value: "hello" } });
        });

        it('should call a global context function', async () => {
            const code = { type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [] };
            let called = false;
            const context = Executor.createContext({}, { foo: () => {
                called = true;
            }});
            const executor = new Executor(code, context);

            await executor.execute();
            expect(called).toBe(true);
        });
        
        it('should fail if the function is not found', async () => {
            const code = { type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [] };
            const executor = new Executor(code);

            expect(async () => await executor.execute()).rejects.toThrow("Variable foo not found");
        });

        it('should fail to call a function that is not a function', async () => {
            const code = [
                { type: STRUCTURE_TYPE.VARIABLE, name: 'foo', value: { type: STRUCTURE_TYPE.NUMBER, value: 1 } },
                { type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [] },
            ];
            const executor = new Executor(code);

            expect(async () => await executor.execute()).rejects.toThrow("foo is not a function");
        });

        it('should pass arguments to the function', async () => {
            const code = { type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [ { type: STRUCTURE_TYPE.NUMBER, value: 1 } ] };
            let args = null;
            const context = Executor.createContext({}, { foo: (arg) => {
                args = arg;
            }});
            const executor = new Executor(code, context);

            await executor.execute();

            expect(args).toEqual({ type: VALUE_TYPE.NUMBER, value: 1 });
        });
    });
});