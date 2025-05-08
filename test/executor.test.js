const { Executor } = require("../src/executor");
const { number, callFunction, conditional, comparison, variable, createFunction, assign } = require("../src/helpers");
const { STRUCTURE_TYPE, VALUE_TYPE, COMPARISON_OPERATOR } = require("../src/types");

describe('Executor', () => {
    describe('execute', () => {
        it('should assign a variable', async () => {
            const code = { type: STRUCTURE_TYPE.ASSIGNMENT, left: { type: STRUCTURE_TYPE.VARIABLE, name: 'foo' }, right: number(1) };
            const executor = new Executor(code);

            await executor.execute();

            expect(executor.getTopLevelContext().variables).toEqual({ foo: number(1) });
        });

        it('should be able to assign a variable to another variable', async () => {
            const code = [
                assign('foo', number(1)),
                assign('bar', variable('foo')),
            ];
            const executor = new Executor(code);

            await executor.execute();

            expect(executor.getTopLevelContext().variables).toEqual({ foo: number(1), bar: number(1) });
        });

        it('should handle a string correctly', async () => {
            const code = { type: STRUCTURE_TYPE.ASSIGNMENT, left: { type: STRUCTURE_TYPE.VARIABLE, name: 'foo' }, right: { type: STRUCTURE_TYPE.STRING, value: "hello" } };
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
                { type: STRUCTURE_TYPE.ASSIGNMENT, left: { type: STRUCTURE_TYPE.VARIABLE, name: 'foo'}, right: number(1) },
                { type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [] },
            ];
            const executor = new Executor(code);

            expect(async () => await executor.execute()).rejects.toThrow("foo is not a function");
        });

        it('should pass arguments to the function', async () => {
            const code = { type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [ number(1) ] };
            let args = null;
            const context = Executor.createContext({}, { foo: (arg) => {
                args = arg;
            }});
            const executor = new Executor(code, context);

            await executor.execute();

            expect(args).toEqual({ type: VALUE_TYPE.NUMBER, value: 1 });
        });

        describe('comparisons', () => {
            it('should handle equals', async () => {
                let code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(1), operator: COMPARISON_OPERATOR.EQUAL };
                let executor = new Executor(code);

                let result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: true });

                code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.EQUAL };
                executor = new Executor(code);

                result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: false });
            });

            it('should handle not equals', async () => {
                let code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.NOT_EQUAL };
                let executor = new Executor(code);

                let result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: true });

                code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(1), operator: COMPARISON_OPERATOR.NOT_EQUAL };
                executor = new Executor(code);

                result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: false });
            });

            it('should handle greater than', async () => {
                let code = { type: STRUCTURE_TYPE.COMPARISON, left: number(2), right: number(1), operator: COMPARISON_OPERATOR.GREATER_THAN };
                let executor = new Executor(code);

                let result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: true });

                code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(1), operator: COMPARISON_OPERATOR.GREATER_THAN };
                executor = new Executor(code);

                result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: false });


                code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.GREATER_THAN };
                executor = new Executor(code);

                result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: false });
                
            });

            it('should handle less than', async () => {
                let code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.LESS_THAN };
                let executor = new Executor(code);

                let result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: true });

                code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(1), operator: COMPARISON_OPERATOR.LESS_THAN };
                executor = new Executor(code);

                result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: false });

                code = { type: STRUCTURE_TYPE.COMPARISON, left: number(2), right: number(1), operator: COMPARISON_OPERATOR.LESS_THAN };
                executor = new Executor(code);

                result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: false });
            });

            it('should handle greater than or equal', async () => {
                let code = { type: STRUCTURE_TYPE.COMPARISON, left: number(2), right: number(1), operator: COMPARISON_OPERATOR.GREATER_THAN_OR_EQUAL };
                let executor = new Executor(code);

                let result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: true });

                code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(1), operator: COMPARISON_OPERATOR.GREATER_THAN_OR_EQUAL };
                executor = new Executor(code);

                result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: true });


                code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.GREATER_THAN_OR_EQUAL };
                executor = new Executor(code);

                result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: false });
            });

            it('should handle less than or equal', async () => {
                let code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.LESS_THAN_OR_EQUAL };
                let executor = new Executor(code);

                let result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: true });

                code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(1), operator: COMPARISON_OPERATOR.LESS_THAN_OR_EQUAL };
                executor = new Executor(code);

                result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: true });


                code = { type: STRUCTURE_TYPE.COMPARISON, left: number(2), right: number(1), operator: COMPARISON_OPERATOR.LESS_THAN_OR_EQUAL };
                executor = new Executor(code);

                result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: false });
            });
        });

        describe('conditionals', () => {
            it('should execute the children if the condition is true', async () => {
                const code =[
                    { type: STRUCTURE_TYPE.CONDITIONAL, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(1), operator: COMPARISON_OPERATOR.EQUAL }, children: [{ type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [] }] },
                ];
                let called = false;
                const context = Executor.createContext({}, { foo: () => {
                    called = true;
                }});
                const executor = new Executor(code, context);

                await executor.execute();

                expect(called).toBe(true);
            });

            it('should not execute the children if the condition is false', async () => {
                const code = [
                    { type: STRUCTURE_TYPE.CONDITIONAL, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(2), right: number(1), operator: COMPARISON_OPERATOR.EQUAL }, children: [{ type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [] }] },
                ];
                let called = false;
                const context = Executor.createContext({}, { foo: () => {
                    called = true;
                }});
                const executor = new Executor(code, context);

                await executor.execute();

                expect(called).toBe(false);
            });
        });

        describe('conditional group', () => {
            it('should execute the first child that matches', async () => {
                const code = [
                    {
                        type: STRUCTURE_TYPE.CONDITIONAL_GROUP,
                        children: [
                            conditional(comparison(number(1), number(1), COMPARISON_OPERATOR.EQUAL), [callFunction('foo', [])]),
                            conditional(comparison(number(2), number(1), COMPARISON_OPERATOR.EQUAL), [callFunction('bar', [])]),
                        ],
                    },
                ];
                let calledFoo = false;
                let calledBar = false;
                const context = Executor.createContext({}, {
                    foo: () => {
                        calledFoo = true;
                    },
                    bar: () => {
                        calledBar = true;
                    },
                });
                const executor = new Executor(code, context);

                await executor.execute();

                expect(calledFoo).toBe(true);
                expect(calledBar).toBe(false);
            });

            it('should execute the first child that matches even if it not the first child', async () => {
                const code = [
                    {
                        type: STRUCTURE_TYPE.CONDITIONAL_GROUP,
                        children: [
                            conditional(comparison(number(2), number(1), COMPARISON_OPERATOR.EQUAL), [callFunction('foo', [])]),
                            conditional(comparison(number(1), number(1), COMPARISON_OPERATOR.EQUAL), [callFunction('bar', [])]),
                        ],
                    },
                ];
                let calledFoo = false;
                let calledBar = false;
                const context = Executor.createContext({}, {
                    foo: () => {
                        calledFoo = true;
                    },
                    bar: () => {
                        calledBar = true;
                    },
                });
                const executor = new Executor(code, context);

                await executor.execute();

                expect(calledFoo).toBe(false);
                expect(calledBar).toBe(true);
            });

            it('should execute finally if any children match', async () => {
                const code = [
                    {
                        type: STRUCTURE_TYPE.CONDITIONAL_GROUP,
                        children: [
                            conditional(comparison(number(1), number(1), COMPARISON_OPERATOR.EQUAL), [callFunction('foo', [])]),
                        ],
                        finally: callFunction('bar', []),
                    },
                ];
                let calledFoo = false;
                let calledBar = false;
                const context = Executor.createContext({}, {
                    foo: () => {
                        calledFoo = true;
                    },
                    bar: () => {
                        calledBar = true;
                    },
                });
                const executor = new Executor(code, context);

                await executor.execute();

                expect(calledFoo).toBe(true);
                expect(calledBar).toBe(true);
            });

            it('should execute finally if no children match', async () => {
                const code = [
                    {
                        type: STRUCTURE_TYPE.CONDITIONAL_GROUP,
                        children: [
                            conditional(comparison(number(2), number(1), COMPARISON_OPERATOR.EQUAL), [callFunction('foo', [])]),
                        ],
                        finally: callFunction('bar', []),
                    },
                ];
                let calledFoo = false;
                let calledBar = false;
                const context = Executor.createContext({}, {
                    foo: () => {
                        calledFoo = true;
                    },
                    bar: () => {
                        calledBar = true;
                    },
                });
                const executor = new Executor(code, context);

                await executor.execute();

                expect(calledFoo).toBe(false);
                expect(calledBar).toBe(true);
            });
        });
    });

    it('should be able to assign a function', async () => {
        const code = { type: STRUCTURE_TYPE.ASSIGNMENT, left: variable('foo'), right: { type: STRUCTURE_TYPE.FUNCTION, parameters: [], children: [] }};
        const executor = new Executor(code);

        await executor.execute();
        
        expect(executor.getTopLevelContext().variables.foo).toEqual(
            expect.objectContaining({ type: VALUE_TYPE.FUNCTION, parameters: [], children: [] })
        );
    });

    it('should be able to create a function', async () => {
        const code = { type: STRUCTURE_TYPE.FUNCTION, parameters: [], children: [], name: 'foo' };
        const executor = new Executor(code);

        await executor.execute();
        
        expect(executor.getTopLevelContext().variables.foo).toEqual(
            expect.objectContaining({ type: VALUE_TYPE.FUNCTION, name: 'foo', parameters: [], children: [] })
        );
    });

    describe('internal function calls', () => {
        it('should be able to call an internal function', async () => {
            const code = [
                assign('myvar', number(2)),
                createFunction('foo', [], [assign('myvar', number(3))]),
                callFunction('foo', []),
            ];
            const executor = new Executor(code);

            await executor.execute();

            expect(executor.getTopLevelContext().variables.myvar).toEqual(number(3));
        });

        it('should be able to handle arguments into an internal function', async () => {
            const code = [
                assign('myvar', number(2)),
                createFunction('foo', [variable('arg')], [assign('myvar', variable('arg'))]),
                callFunction('foo', [number(1)]),
            ];
            const executor = new Executor(code);

            await executor.execute();

            expect(executor.getTopLevelContext().variables.myvar).toEqual(number(1));
        });
    });
});