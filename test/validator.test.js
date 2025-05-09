const { number, variable } = require("../src/helpers");
const { STRUCTURE_TYPE, COMPARISON_OPERATOR, MATH_OPERATOR } = require("../src/types");
const { validate } = require("../src/validator");

describe('validator', () => {
    describe('validate', () => {
        it('should validate numbers', () => {
            expect(() => validate(number(1))).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.NUMBER })).toThrow("top: Missing the following properties: value");
        });

        it('should validate variables', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.VARIABLE, name: 'foo' })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.VARIABLE })).toThrow("top: Missing the following properties: name");
        });

        it('should validate assignments', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.ASSIGNMENT, left: { type: STRUCTURE_TYPE.VARIABLE, name: 'foo' }, right: number(1) })).not.toThrow();
            
            expect(() => validate({ type: STRUCTURE_TYPE.ASSIGNMENT })).toThrow("top: Missing the following properties: left, right");
            
            expect(() => validate({ type: STRUCTURE_TYPE.ASSIGNMENT, left: { type: STRUCTURE_TYPE.VARIABLE  }, right: number(1) })).toThrow("top.left: Missing the following properties: name");

            expect(() => validate({ type: STRUCTURE_TYPE.ASSIGNMENT, left: { type: STRUCTURE_TYPE.VARIABLE, name: 'foo'  }, right: { type: STRUCTURE_TYPE.NUMBER } })).toThrow("top.right: Missing the following properties: value");
        });

        it('should validate strings', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.STRING, value: "hello" })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.STRING })).toThrow("top: Missing the following properties: value");
        });

        it('should validate function calls', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo', arguments: [{ type: STRUCTURE_TYPE.NUMBER, value: 1 }] })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.FUNCTION_CALL, name: 'foo' })).toThrow("top: Missing the following properties: arguments");

            expect(() => validate({ type: STRUCTURE_TYPE.FUNCTION_CALL })).toThrow("top: Missing the following properties: name, arguments");
        });

        it('should validate comparisons', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.EQUAL })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.COMPARISON })).toThrow("top: Missing the following properties: left, right, operator");
            
            expect(() => validate({ type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: 'foo' })).toThrow("Invalid operator: foo");
        });

        it('should validate conditionals', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.CONDITIONAL, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.EQUAL }, children: [number(1)] })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.CONDITIONAL })).toThrow("top: Missing the following properties: condition, children");
        });

        it('should validate conditional groups', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.CONDITIONAL_GROUP, children: [{ type: STRUCTURE_TYPE.CONDITIONAL, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.EQUAL }, children: [number(1)] }] })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.CONDITIONAL_GROUP })).toThrow("top: Missing the following properties: children");

            expect(() => validate({ type: STRUCTURE_TYPE.CONDITIONAL_GROUP, children: [{ type: STRUCTURE_TYPE.CONDITIONAL, operator: COMPARISON_OPERATOR.EQUAL, children: [number(1)] }] })).toThrow("top.children.0: Missing the following properties: condition");

            expect(() => validate({ type: STRUCTURE_TYPE.CONDITIONAL_GROUP, children: [{ type: STRUCTURE_TYPE.CONDITIONAL, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.EQUAL }, children: [number(1)] }], finally: { type: STRUCTURE_TYPE.NUMBER} })).toThrow("top.finally: Missing the following properties: value");
        });

        it('should validate functions', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.FUNCTION, name: 'foo', parameters: [], children: [] })).not.toThrow();
            expect(() => validate({ type: STRUCTURE_TYPE.FUNCTION, parameters: [], children: [] })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.FUNCTION })).toThrow("top: Missing the following properties: parameters, children");

            expect(() => validate({ type: STRUCTURE_TYPE.FUNCTION, name: 'foo', parameters: [{ type: STRUCTURE_TYPE.VARIABLE}], children: [] })).toThrow("top.parameters.0: Missing the following properties: name");
            
            expect(() => validate({ type: STRUCTURE_TYPE.FUNCTION, name: 'foo', parameters: [variable('foo')], children: [{ type: STRUCTURE_TYPE.VARIABLE }] })).toThrow("top.children.0: Missing the following properties: name");
        });

        it('should validate blocks', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.BLOCK, children: [] })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.BLOCK })).toThrow("top: Missing the following properties: children");

            expect(() => validate({ type: STRUCTURE_TYPE.BLOCK, children: [{ type: STRUCTURE_TYPE.VARIABLE }] })).toThrow("top.children.0: Missing the following properties: name");
        });

        it('should validate loops', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.LOOP, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.EQUAL }, children: [] })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.LOOP })).toThrow("top: Missing the following properties: condition, children");

            expect(() => validate({ type: STRUCTURE_TYPE.LOOP, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.EQUAL }, children: [{ type: STRUCTURE_TYPE.VARIABLE }] })).toThrow("top.children.0: Missing the following properties: name");

            expect(() => validate({ type: STRUCTURE_TYPE.LOOP, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(1), operator: COMPARISON_OPERATOR.EQUAL }, children: [variable('foo', number(1))] })).toThrow("top.condition: Missing the following properties: right");

            expect(() => validate({ type: STRUCTURE_TYPE.LOOP, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.EQUAL }, children: [], pre: { type: STRUCTURE_TYPE.ASSIGNMENT, left: variable('foo') } })).toThrow("top.pre: Missing the following properties: right");

            expect(() => validate({ type: STRUCTURE_TYPE.LOOP, condition: { type: STRUCTURE_TYPE.COMPARISON, left: number(1), right: number(2), operator: COMPARISON_OPERATOR.EQUAL }, children: [], post: { type: STRUCTURE_TYPE.ASSIGNMENT, left: variable('foo') } })).toThrow("top.post: Missing the following properties: right");
        });

        it('should validate math', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.MATH, left: number(1), right: number(2), operator: MATH_OPERATOR.ADD })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.MATH })).toThrow("top: Missing the following properties: left, right, operator");

            expect(() => validate({ type: STRUCTURE_TYPE.MATH, left: number(1), right: number(2), operator: 'foo' })).toThrow("top: Invalid operator: foo");

            expect(() => validate({ type: STRUCTURE_TYPE.MATH, left: { type: STRUCTURE_TYPE.VARIABLE }, right: number(2), operator: MATH_OPERATOR.ADD })).toThrow("top.left: Missing the following properties: name");

            expect(() => validate({ type: STRUCTURE_TYPE.MATH, left: number(1), right: { type: STRUCTURE_TYPE.VARIABLE }, operator: MATH_OPERATOR.ADD })).toThrow("top.right: Missing the following properties: name");
        });
    });
});