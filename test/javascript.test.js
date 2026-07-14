
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
    
    it('should show a conditional', async () => {
      const code =[
        { type: STRUCTURE_TYPE.CONDITIONAL, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(1), operator: COMPARISON_OPERATOR.EQUAL }, children: [{ type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [] }] },
      ];

      await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
      const codeString = getCode();
      
      expect(codeString).toBe('if (1 == 1) {\n\tfoo();\n};');
    });
    
    describe('conditional group', () => {
      it('should show a group', async () => {
        const code = [
          {
            type: STRUCTURE_TYPE.CONDITIONAL_GROUP,
            children: [
              conditional(comparison(number(1), number(1), COMPARISON_OPERATOR.EQUAL), [callFunction('foo', [])]),
              conditional(comparison(number(2), number(1), COMPARISON_OPERATOR.EQUAL), [callFunction('bar', [])]),
            ],
          },
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
        
        const codeString = getCode();
        
        expect(codeString).toBe('if (1 == 1) {\n\tfoo();\n} else if (2 == 1) {\n\tbar();\n};');
      });
      
      it('should handle finally', async () => {
        const code = [
          {
            type: STRUCTURE_TYPE.CONDITIONAL_GROUP,
            children: [
              conditional(comparison(number(1), number(1), COMPARISON_OPERATOR.EQUAL), [callFunction('foo', [])]),
            ],
            finally: callFunction('bar', []),
          },
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
        const codeString = getCode();
        
        expect(codeString).toBe('if (1 == 1) {\n\tfoo();\n} else {\n\tbar();\n};');
      });
    });
    
    it('should be able to assign a function', async () => {
      const code = { type: STRUCTURE_TYPE.ASSIGNMENT, left: variable('foo'), right: { type: STRUCTURE_TYPE.FUNCTION, parameters: [], children: [] }};

      await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
      const codeString = getCode();
        
      expect(codeString).toBe('let foo = function() {\n\n};');
    });
    
    it('should be able to create a function', async () => {
      const code = { type: STRUCTURE_TYPE.FUNCTION, parameters: [], children: [], name: 'foo' };

      await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
      const codeString = getCode();
      
      expect(codeString).toBe('function foo() {\n\n};');
    });

    it('should create a function with paramters', async () => {
      const code = { type: STRUCTURE_TYPE.FUNCTION, parameters: [variable('foo'), variable('bar')], children: [], name: 'foo' };

      await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
      const codeString = getCode();
      
      expect(codeString).toBe('function foo(foo, bar) {\n\n};');
    });

    it('should handle a function with a body', async () => {
      const code = { type: STRUCTURE_TYPE.FUNCTION, parameters: [], children: [assign('foo', number(1))], name: 'foo' };

      await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
      const codeString = getCode();
      
      expect(codeString).toBe('function foo() {\n\tlet foo = 1;\n};');
    });

    it('should handle the return value of an internal function', async () => {
      const code = [
        assign('myvar', number(2)),
        createFunction('foo', [], [returnFn(number(3))]),
        assign('myvar', callFunction('foo', [])),
      ];

      await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
      const codeString = getCode();
      
      expect(codeString).toBe('let myvar = 2;\nfunction foo() {\n\treturn 3;\n};\nmyvar = foo();');
    });
    
    describe('block', () => {
      it('should be able to execute a block', async () => {
        const code = [
          assign('myvar', number(2)),
          { type: STRUCTURE_TYPE.BLOCK, children: [assign('myvar', number(3)),]}
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
      
        const codeString = getCode();
        
        expect(codeString).toBe('let myvar = 2;\n{\n\tmyvar = 3;\n};');
      });
    });
    
    describe('loops', () => {
      it('should show a loop', async () => {
        const code = [
          assign('myvar', number(0)),
          { type: STRUCTURE_TYPE.LOOP, condition: comparison(variable('myvar'), number(3), COMPARISON_OPERATOR.LESS_THAN), children: [assign('myvar', math(variable('myvar'), number(1), MATH_OPERATOR.ADD))] },
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
        const codeString = getCode();
      
        expect(codeString).toBe('let myvar = 0;\nfor (;myvar < 3;) {\n\tmyvar = myvar + 1;\n};');
      });
      
      it('should show a loop precondition', async () => {
        const code = [
          assign('myvar', number(0)),
          { type: STRUCTURE_TYPE.LOOP, pre: assign('loop', number(0)), condition: comparison(variable('loop'), number(3), COMPARISON_OPERATOR.LESS_THAN), children: [
            assign('loop', math(variable('loop'), number(1), MATH_OPERATOR.ADD)),
            assign('myvar', variable('loop')),
          ] },
        ];
        await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
        const codeString = getCode();
      
        expect(codeString).toBe('let myvar = 0;\nfor (let loop = 0;loop < 3;) {\n\tloop = loop + 1;\n\tmyvar = loop;\n};');
      });
      
      it('should show a loop post condition', async () => {
        const code = [
          assign('myvar', number(0)),
          { type: STRUCTURE_TYPE.LOOP, pre: assign('loop', number(0)), condition: comparison(variable('loop'), number(3), COMPARISON_OPERATOR.LESS_THAN), post: assign('loop', math(variable('loop'), number(1), MATH_OPERATOR.ADD)), children: [assign('myvar', variable('loop'))] },
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
        const codeString = getCode();
      
        expect(codeString).toBe('let myvar = 0;\nfor (let loop = 0;loop < 3;loop = loop + 1) {\n\tmyvar = loop;\n};');
      });
    });
    
    describe('math', () => {
      it('should be able to add two numbers', async () => {
        const code = [
          assign('myvar', math(number(1), number(2), MATH_OPERATOR.ADD)),
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
        const codeString = getCode();
      
        expect(codeString).toBe('let myvar = 1 + 2;');
      });
      
      it('should be able to subtract two numbers', async () => {
        const code = [
          assign('myvar', math(number(1), number(2), MATH_OPERATOR.SUBTRACT)),
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
        const codeString = getCode();
      
        expect(codeString).toBe('let myvar = 1 - 2;');
      });
      
      it('should be able to multiply two numbers', async () => {
        const code = [
          assign('myvar', math(number(2), number(2), MATH_OPERATOR.MULTIPLY)),
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
        const codeString = getCode();
      
        expect(codeString).toBe('let myvar = 2 * 2;');
      });
      
      it('should be able to divide two numbers', async () => {
        const code = [
          assign('myvar', math(number(4), number(2), MATH_OPERATOR.DIVIDE)),
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
        const codeString = getCode();
      
        expect(codeString).toBe('let myvar = 4 / 2;');
      });
      
      it('should be able to modulo two numbers', async () => {
        const code = [
          assign('myvar', math(number(5), number(2), MATH_OPERATOR.MODULO)),
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
        const codeString = getCode();
      
        expect(codeString).toBe('let myvar = 5 % 2;');
      });
    });
    
    it('should be able to create an object', async () => {
      const code = [
        assign('myvar', { type: STRUCTURE_TYPE.OBJECT, properties: { foo: number(2) }}),
      ];

      await generate(LANG.JAVASCRIPT, code, {}, 'path');
  
      const codeString = getCode();
    
      expect(codeString).toBe('let myvar = {\n\tfoo: 2,\n};');
    });
    
    describe('paths', () => {
      it('should handle paths', async () => {
        const code = [
          assign('myvar', { type: STRUCTURE_TYPE.OBJECT, properties: { foo: number(2) }}),
          { type: STRUCTURE_TYPE.PATH, path: ['foo'], left: variable('myvar') },
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
        const codeString = getCode();
      
        expect(codeString).toBe('let myvar = {\n\tfoo: 2,\n};\nmyvar.foo;');
      });
      
      it('should nest more than one level', async () => {
        const code = [
          assign('myvar', { type: STRUCTURE_TYPE.OBJECT, properties: { foo: { type: STRUCTURE_TYPE.OBJECT, properties: { bar: number(2) } } }}),
          { type: STRUCTURE_TYPE.PATH, path: ['foo', 'bar'], left: variable('myvar') },
        ];

        await generate(LANG.JAVASCRIPT, code, {}, 'path');
    
        const codeString = getCode();
      
        expect(codeString).toBe('let myvar = {\n\tfoo: {\n\t\tbar: 2,\n\t},\n};\nmyvar.foo.bar;');
      });
    });
  });
});
