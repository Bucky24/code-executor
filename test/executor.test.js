const { Executor } = require("../src/executor");
const { number, callFunction, conditional, comparison, variable, createFunction, assign, math } = require("../src/helpers");
const { STRUCTURE_TYPE, VALUE_TYPE, COMPARISON_OPERATOR, MATH_OPERATOR } = require("../src/types");

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
            let calledContext = null;
            const context = Executor.createContext({}, { foo: (arg, context) => {
                args = arg;
                calledContext = context;
            }});
            const executor = new Executor(code, context);

            await executor.execute();

            expect(args).toEqual([{ type: VALUE_TYPE.NUMBER, value: 1 }]);
            expect(calledContext).toStrictEqual({
                parent: context,
                variables: {},
            });
        });

        it('should handle return value of raw function', async() => {
            const code = assign('blar', callFunction('foo', []));
            let calledContext = null;
            const context = Executor.createContext({}, { foo: (arg, context) => {
                calledContext = context;
                return {
                    type: VALUE_TYPE.NUMBER,
                    value: 6,
                };
            }});
            const executor = new Executor(code, context);

            await executor.execute();

            expect(calledContext.variables).toEqual({
                blar: {
                    type: VALUE_TYPE.NUMBER,
                    value: 6,
                },
            });
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

            it('should handle variables', async () => {
                const code = [
                    assign('foo', number(1)),
                    { type: STRUCTURE_TYPE.COMPARISON, left: variable('foo'), right: variable('foo'), operator: COMPARISON_OPERATOR.EQUAL },
                ];
                const executor = new Executor(code);

                result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.BOOLEAN, value: true });
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

        it('should be able to execute a block', async () => {
            const code = [
                assign('myvar', number(2)),
                { type: STRUCTURE_TYPE.BLOCK, children: [assign('myvar', number(3)),]}
            ];
            const executor = new Executor(code);
    
            await executor.execute();

            expect(executor.getTopLevelContext().variables.myvar).toEqual(number(3));
        });

        describe('loops', () => {
            it('should execute a loop for as long as the condition is true', async () => {
                const code = [
                    assign('myvar', number(0)),
                    { type: STRUCTURE_TYPE.LOOP, condition: comparison(variable('myvar'), number(3), COMPARISON_OPERATOR.LESS_THAN), children: [assign('myvar', math(variable('myvar'), number(1), MATH_OPERATOR.ADD))] },
                ];
                const executor = new Executor(code);

                await executor.execute();

                expect(executor.getTopLevelContext().variables.myvar).toEqual(number(3));
            });

            it('should execute the pre condition', async () => {
                const code = [
                    assign('myvar', number(0)),
                    { type: STRUCTURE_TYPE.LOOP, pre: assign('loop', number(0)), condition: comparison(variable('loop'), number(3), COMPARISON_OPERATOR.LESS_THAN), children: [
                        assign('loop', math(variable('loop'), number(1), MATH_OPERATOR.ADD)),
                        assign('myvar', variable('loop')),
                    ] },
                ];
                const executor = new Executor(code);

                await executor.execute();

                expect(executor.getTopLevelContext().variables.myvar).toEqual(number(3));
            });

            it('should execute the post condition', async () => {
                const code = [
                    assign('myvar', number(0)),
                    { type: STRUCTURE_TYPE.LOOP, pre: assign('loop', number(0)), condition: comparison(variable('loop'), number(3), COMPARISON_OPERATOR.LESS_THAN), post: assign('loop', math(variable('loop'), number(1), MATH_OPERATOR.ADD)), children: [assign('myvar', variable('loop'))] },
                ];
                const executor = new Executor(code);

                await executor.execute();

                // the loop will run 3 times, but the post condition will be executed after the loop so it only runs 2 times
                expect(executor.getTopLevelContext().variables.myvar).toEqual(number(2));
            });
        });

        describe('math', () => {
            it('should be able to add two numbers', async () => {
                const code = [
                    assign('myvar', math(number(1), number(2), MATH_OPERATOR.ADD)),
                ];
                const executor = new Executor(code);

                await executor.execute();

                expect(executor.getTopLevelContext().variables.myvar).toEqual(number(3));
            });

            it('should be able to subtract two numbers', async () => {
                const code = [
                    assign('myvar', math(number(1), number(2), MATH_OPERATOR.SUBTRACT)),
                ];
                const executor = new Executor(code);

                await executor.execute();

                expect(executor.getTopLevelContext().variables.myvar).toEqual(number(-1));
            });

            it('should be able to multiply two numbers', async () => {
                const code = [
                    assign('myvar', math(number(2), number(2), MATH_OPERATOR.MULTIPLY)),
                ];
                const executor = new Executor(code);

                await executor.execute();

                expect(executor.getTopLevelContext().variables.myvar).toEqual(number(4));
            });

            it('should be able to divide two numbers', async () => {
                const code = [
                    assign('myvar', math(number(4), number(2), MATH_OPERATOR.DIVIDE)),
                ];

                const executor = new Executor(code);

                await executor.execute();

                expect(executor.getTopLevelContext().variables.myvar).toEqual(number(2));
            });

            it('should be able to modulo two numbers', async () => {
                const code = [
                    assign('myvar', math(number(5), number(2), MATH_OPERATOR.MODULO)),
                ];

                const executor = new Executor(code);

                await executor.execute();

                expect(executor.getTopLevelContext().variables.myvar).toEqual(number(1));
            });
        });

        it('should be able to create an object', async () => {
            const code = [
                assign('myvar', { type: STRUCTURE_TYPE.OBJECT, properties: { foo: number(2) }}),
            ];
            const executor = new Executor(code);

            await executor.execute();

            expect(executor.getTopLevelContext().variables.myvar).toEqual({ type: VALUE_TYPE.OBJECT, value: { foo: { type: VALUE_TYPE.NUMBER, value: 2 }}});
        });

        describe('paths', () => {
            it('should handle paths', async () => {
                const code = [
                    assign('myvar', { type: STRUCTURE_TYPE.OBJECT, properties: { foo: number(2) }}),
                    { type: STRUCTURE_TYPE.PATH, path: ['foo'], left: variable('myvar') },
                ];
                const executor = new Executor(code);

                const result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.NUMBER, value: 2 });
            });

            it('should error if the path is invalid', async () => {
                const code = [
                    assign('myvar', { type: STRUCTURE_TYPE.OBJECT, properties: { foo: number(2) }}),
                    { type: STRUCTURE_TYPE.PATH, path: ['bar'], left: variable('myvar') },
                ];
                const executor = new Executor(code);

                expect(async () => await executor.execute()).rejects.toThrow("Invalid path: bar");
            });

            it('should nest more than one level', async () => {
                const code = [
                    assign('myvar', { type: STRUCTURE_TYPE.OBJECT, properties: { foo: { type: STRUCTURE_TYPE.OBJECT, properties: { bar: number(2) } } }}),
                    { type: STRUCTURE_TYPE.PATH, path: ['foo', 'bar'], left: variable('myvar') },
                ];
                const executor = new Executor(code);

                const result = await executor.execute();

                expect(result).toEqual({ type: VALUE_TYPE.NUMBER, value: 2 });
            });
        });
    });

    describe('getValueFor', () => {
        it('should return expected data for a bool', async () => {
            const executor = new Executor([]);
            
            const result = executor.getValueFor({}, { type: VALUE_TYPE.BOOLEAN, value: true });

            expect(result).toBe(true);
        });

        it('should return expected data for a number', async () => {
            const executor = new Executor([]);
            
            const result = executor.getValueFor({}, { type: VALUE_TYPE.NUMBER, value: 7 });

            expect(result).toBe(7);
        });

        it('should return expected data for a string', async () => {
            const executor = new Executor([]);
            
            const result = executor.getValueFor({}, { type: VALUE_TYPE.STRING, value: "hi" });

            expect(result).toBe("hi");
        });

        it('should return expected data for a null', async () => {
            const executor = new Executor([]);
            
            const result = executor.getValueFor({}, { type: VALUE_TYPE.NULL });

            expect(result).toBe(null);
        });

        it('should return expected data for a function', async () => {
            const executor = new Executor([]);
            
            const result = executor.getValueFor({}, { type: VALUE_TYPE.FUNCTION });

            expect(result).toBe("__FUNCTION__");
        });

        it('should return expected data for an object', async () => {
            const executor = new Executor([]);
            
            const result = executor.getValueFor({}, { type: VALUE_TYPE.OBJECT });

            expect(result).toBe("__OBJECT__");
        });
    });
});