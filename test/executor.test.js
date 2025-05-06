const { Executor } = require("../src/executor");
const { STRUCTURE_TYPE } = require("../src/types");

describe('Executor', () => {
    describe('execute', () => {
        it('should create a variable', async () => {
            const code = { type: STRUCTURE_TYPE.VARIABLE, name: 'foo', value: { type: STRUCTURE_TYPE.NUMBER, value: 1 } };
            const executor = new Executor(code);

            await executor.execute();

            expect(executor.getTopLevelContext().variables).toEqual({ foo: 1 });
        });
    });
});