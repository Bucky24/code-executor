
const { generate, LANG } = require("../src/generate");
const { number, callFunction, conditional, comparison, variable, createFunction, assign, math, returnFn } = require("../src/helpers");
const { STRUCTURE_TYPE, VALUE_TYPE, COMPARISON_OPERATOR, MATH_OPERATOR } = require("../src/types");
const { vol } = require("memfs");

jest.mock("fs", () => require("memfs").fs);

function getCode() {
  return vol.readFileSync('path/main.js', 'utf-8');
}

describe('JavaScript Generation', () => {
  beforeEach(() => {
    vol.reset();
  });
  
  describe('generate', () => {
    it('should assign a variable', async () => {
      const code = { type: STRUCTURE_TYPE.ASSIGNMENT, left: { type: STRUCTURE_TYPE.VARIABLE, name: 'foo' }, right: number(1) };
      
      await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
      const codeString = getCode();
      
      expect(codeString).toBe('let foo = 1;');
    });
    
    it('should be able to assign a variable to another variable', async () => {
      const code = [
        assign('foo', number(1)),
        assign('bar', variable('foo')),
      ];
      
      await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
      const codeString = getCode();
      
      expect(codeString).toBe('let foo = 1;\nlet bar = foo;');
    });
    
    it('should handle a string correctly', async () => {
      const code = { type: STRUCTURE_TYPE.ASSIGNMENT, left: { type: STRUCTURE_TYPE.VARIABLE, name: 'foo' }, right: { type: STRUCTURE_TYPE.STRING, value: "hello" } };

      await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
      const codeString = getCode();
      
      expect(codeString).toBe('let foo = "hello";');
    });
    
    it('should call a global context function', async () => {
      const code = { type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [] };
      const context = { foo: () => {
        console.log("called");
      }};

      await generate(LANG.JAVASCRIPT, code, context, 'path');
      
      const codeString = getCode();
      
      expect(codeString).toBe('const foo = () => {\n  console.log("called");\n}\nfoo();');
    });

    
    it('should pass arguments to the function', async () => {
      const code = { type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [ number(1) ] };
      let args = null;
      let calledContext = null;
      const context = { foo: (arg, context) => {
        console.log(arg, context);
      }};

      await generate(LANG.JAVASCRIPT, code, context, 'path');
      
      const codeString = getCode();
      
      expect(codeString).toBe('const foo = (arg, context) => {\n  console.log(arg, context);\n}\nfoo(1);');
    });
    
    it('should handle return value of raw function', async() => {
      const code = assign('blar', callFunction('foo', []));
      let calledContext = null;
      const context = { foo: (arg, context) => {
        return {
          type: VALUE_TYPE.NUMBER,
          value: 6,
        };
      }};

      await generate(LANG.JAVASCRIPT, code, context, 'path');
      
      const codeString = getCode();
      
      expect(codeString).toBe('const foo = (arg, context) => {\n  return {\n    type: VALUE_TYPE.NUMBER,\n    value: 6\n  };\n}\nlet blar = foo();');
    });
    
    describe('comparisons', () => {
      it('should handle equals', async () => {
        let code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(1), operator: COMPARISON_OPERATOR.EQUAL };
      

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
        const codeString = getCode();
      
        expect(codeString).toBe('1 == 1;');
      });
      
      it('should handle not equals', async () => {
        let code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.NOT_EQUAL };
        
        await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
        const codeString = getCode();
      
        expect(codeString).toBe('1 != 2;');
      });
      
      it('should handle greater than', async () => {
        let code = { type: STRUCTURE_TYPE.COMPARISON, left: number(2), right: number(1), operator: COMPARISON_OPERATOR.GREATER_THAN };

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
        const codeString = getCode();
      
        expect(codeString).toBe('2 > 1;');
      });
      
      it('should handle less than', async () => {
        let code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.LESS_THAN };

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
        const codeString = getCode();
      
        expect(codeString).toBe('1 < 2;');
      });
      
      it('should handle greater than or equal', async () => {
        let code = { type: STRUCTURE_TYPE.COMPARISON, left: number(2), right: number(1), operator: COMPARISON_OPERATOR.GREATER_THAN_OR_EQUAL };

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
        const codeString = getCode();
      
        expect(codeString).toBe('2 >= 1;');
      });
      
      it('should handle less than or equal', async () => {
        let code = { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.LESS_THAN_OR_EQUAL };

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
        const codeString = getCode();
      
        expect(codeString).toBe('1 <= 2;');
      });
      
      it('should handle variables', async () => {
        const code = [
          assign('foo', number(1)),
          { type: STRUCTURE_TYPE.COMPARISON, left: variable('foo'), right: variable('foo'), operator: COMPARISON_OPERATOR.EQUAL },
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
        const codeString = getCode();
      
        expect(codeString).toBe('let foo = 1;\nfoo == foo;');
      });
    });

    return;
    
    describe('conditionals', () => {
      it('should execute the children if the condition is true', async () => {
        const code =[
          { type: STRUCTURE_TYPE.CONDITIONAL, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(1), operator: COMPARISON_OPERATOR.EQUAL }, children: [{ type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [] }] },
        ];
        let called = false;
        const context = { foo: () => {
          called = true;
        }};
      });
      
      it('should not execute the children if the condition is false', async () => {
        const code = [
          { type: STRUCTURE_TYPE.CONDITIONAL, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(2), right: number(1), operator: COMPARISON_OPERATOR.EQUAL }, children: [{ type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [] }] },
        ];
        let called = false;
        const context = { foo: () => {
          called = true;
        }};
      });
      
      it('should pass through return value and not execute further children', async () => {
        const code = [
          { type: STRUCTURE_TYPE.CONDITIONAL, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(1), operator: COMPARISON_OPERATOR.EQUAL }, children: [{ type: STRUCTURE_TYPE.RETURN, children: [number(5)] }, { type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [] }] },
        ];
        let called = false;
        const context = { foo: () => {
          called = true;
        }};
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
        const context = {
          foo: () => {
            calledFoo = true;
          },
          bar: () => {
            calledBar = true;
          },
        };
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
        const context = {
          foo: () => {
            calledFoo = true;
          },
          bar: () => {
            calledBar = true;
          },
        };
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
        const context = {
          foo: () => {
            calledFoo = true;
          },
          bar: () => {
            calledBar = true;
          },
        };
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
        const context = {
          foo: () => {
            calledFoo = true;
          },
          bar: () => {
            calledBar = true;
          },
        };
      });
      
      it('should return immediately if return value detected and not execute finally', async () => {
        const code = [
          {
            type: STRUCTURE_TYPE.CONDITIONAL_GROUP,
            children: [
              conditional(comparison(number(1), number(1), COMPARISON_OPERATOR.EQUAL), [returnFn(number(5)),callFunction('foo', [])]),
              conditional(comparison(number(1), number(1), COMPARISON_OPERATOR.EQUAL), [callFunction('foo', [])]),
            ],
            finally: callFunction('bar', []),
          },
        ];
        let calledFoo = false;
        let calledBar = false;
        const context = {
          foo: () => {
            calledFoo = true;
          },
          bar: () => {
            calledBar = true;
          },
        };
      });
    });
    
    it('should be able to assign a function', async () => {
      const code = { type: STRUCTURE_TYPE.ASSIGNMENT, left: variable('foo'), right: { type: STRUCTURE_TYPE.FUNCTION, parameters: [], children: [] }};
    });
    
    it('should be able to create a function', async () => {
      const code = { type: STRUCTURE_TYPE.FUNCTION, parameters: [], children: [], name: 'foo' };
    });
    
    describe('internal function calls', () => {
      it('should be able to call an internal function', async () => {
        const code = [
          assign('myvar', number(2)),
          createFunction('foo', [], [assign('myvar', number(3))]),
          callFunction('foo', []),
        ];
      });
      
      it('should be able to handle arguments into an internal function', async () => {
        const code = [
          assign('myvar', number(2)),
          createFunction('foo', [variable('arg')], [assign('myvar', variable('arg'))]),
          callFunction('foo', [number(1)]),
        ];
      });
      
      it('should be able to call a function that is defined after the call site', async () => {
        const code = [
          assign('myvar', number(2)),
          callFunction('foo', [number(1)]),
          createFunction('foo', [variable('arg')], [assign('myvar', variable('arg'))]),
        ];
      });
      
      it('should handle the return value of an internal function', async () => {
        const code = [
          assign('myvar', number(2)),
          createFunction('foo', [], [returnFn(number(3))]),
          assign('myvar', callFunction('foo', [])),
        ];
      });
    });
    
    describe('block', () => {
      it('should be able to execute a block', async () => {
        const code = [
          assign('myvar', number(2)),
          { type: STRUCTURE_TYPE.BLOCK, children: [assign('myvar', number(3)),]}
        ];
      });
      
      it('should pass a return value through', async () => {
        const code = [
          { type: STRUCTURE_TYPE.BLOCK, children: [returnFn(number(3)),]}
        ];
      });
    });
    
    describe('loops', () => {
      it('should execute a loop for as long as the condition is true', async () => {
        const code = [
          assign('myvar', number(0)),
          { type: STRUCTURE_TYPE.LOOP, condition: comparison(variable('myvar'), number(3), COMPARISON_OPERATOR.LESS_THAN), children: [assign('myvar', math(variable('myvar'), number(1), MATH_OPERATOR.ADD))] },
        ];
      });
      
      it('should execute the pre condition', async () => {
        const code = [
          assign('myvar', number(0)),
          { type: STRUCTURE_TYPE.LOOP, pre: assign('loop', number(0)), condition: comparison(variable('loop'), number(3), COMPARISON_OPERATOR.LESS_THAN), children: [
            assign('loop', math(variable('loop'), number(1), MATH_OPERATOR.ADD)),
            assign('myvar', variable('loop')),
          ] },
        ];
      });
      
      it('should execute the post condition', async () => {
        const code = [
          assign('myvar', number(0)),
          { type: STRUCTURE_TYPE.LOOP, pre: assign('loop', number(0)), condition: comparison(variable('loop'), number(3), COMPARISON_OPERATOR.LESS_THAN), post: assign('loop', math(variable('loop'), number(1), MATH_OPERATOR.ADD)), children: [assign('myvar', variable('loop'))] },
        ];
      });
      
      it('should pass though return value and quit loop when returning', async () => {
        const code = [
          assign('myvar', number(0)),
          { type: STRUCTURE_TYPE.LOOP, condition: comparison(variable('myvar'), number(3), COMPARISON_OPERATOR.LESS_THAN), children: [assign('myvar', math(variable('myvar'), number(1), MATH_OPERATOR.ADD)), conditional(comparison(variable('myvar'), number(1), COMPARISON_OPERATOR.GREATER_THAN_OR_EQUAL),[returnFn(number(5))])] },
        ];
      });
    });
    
    describe('math', () => {
      it('should be able to add two numbers', async () => {
        const code = [
          assign('myvar', math(number(1), number(2), MATH_OPERATOR.ADD)),
        ];
      });
      
      it('should be able to subtract two numbers', async () => {
        const code = [
          assign('myvar', math(number(1), number(2), MATH_OPERATOR.SUBTRACT)),
        ];
      });
      
      it('should be able to multiply two numbers', async () => {
        const code = [
          assign('myvar', math(number(2), number(2), MATH_OPERATOR.MULTIPLY)),
        ];
      });
      
      it('should be able to divide two numbers', async () => {
        const code = [
          assign('myvar', math(number(4), number(2), MATH_OPERATOR.DIVIDE)),
        ];
      });
      
      it('should be able to modulo two numbers', async () => {
        const code = [
          assign('myvar', math(number(5), number(2), MATH_OPERATOR.MODULO)),
        ];
      });
    });
    
    it('should be able to create an object', async () => {
      const code = [
        assign('myvar', { type: STRUCTURE_TYPE.OBJECT, properties: { foo: number(2) }}),
      ];
    });
    
    describe('paths', () => {
      it('should handle paths', async () => {
        const code = [
          assign('myvar', { type: STRUCTURE_TYPE.OBJECT, properties: { foo: number(2) }}),
          { type: STRUCTURE_TYPE.PATH, path: ['foo'], left: variable('myvar') },
        ];
      });
      
      it('should error if the path is invalid', async () => {
        const code = [
          assign('myvar', { type: STRUCTURE_TYPE.OBJECT, properties: { foo: number(2) }}),
          { type: STRUCTURE_TYPE.PATH, path: ['bar'], left: variable('myvar') },
        ];
      });
      
      it('should nest more than one level', async () => {
        const code = [
          assign('myvar', { type: STRUCTURE_TYPE.OBJECT, properties: { foo: { type: STRUCTURE_TYPE.OBJECT, properties: { bar: number(2) } } }}),
          { type: STRUCTURE_TYPE.PATH, path: ['foo', 'bar'], left: variable('myvar') },
        ];
      });
    });
  });
});
