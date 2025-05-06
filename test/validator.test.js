const { STRUCTURE_TYPE, COMPARISON_OPERATOR } = require("../src/types");
const { validate } = require("../src/validator");

describe('validator', () => {
    describe('validate', () => {
        it('should validate numbers', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.NUMBER, value: 1 })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.NUMBER })).toThrow("top: Missing the following properties: value");
        });

        it('should validate variables', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.VARIABLE, name: 'foo', value: { type: STRUCTURE_TYPE.NUMBER, value: 1 } })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.VARIABLE, name: 'foo' })).toThrow("top: Missing the following properties: value");

            expect(() => validate({ type: STRUCTURE_TYPE.VARIABLE, name: 'foo', value: { type: STRUCTURE_TYPE.NUMBER } })).toThrow("top.value: Missing the following properties: value");
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
            expect(() => validate({ type: STRUCTURE_TYPE.COMPARISON, left: { type: STRUCTURE_TYPE.NUMBER, value: 1 }, right: { type: STRUCTURE_TYPE.NUMBER, value: 2 }, operator: COMPARISON_OPERATOR.EQUAL })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.COMPARISON })).toThrow("top: Missing the following properties: left, right, operator");
            
            expect(() => validate({ type: STRUCTURE_TYPE.COMPARISON, left: { type: STRUCTURE_TYPE.NUMBER, value: 1 }, right: { type: STRUCTURE_TYPE.NUMBER, value: 2 }, operator: 'foo' })).toThrow("Invalid operator: foo");
        });

        it('should validate conditionals', () => {
            expect(() => validate({ type: STRUCTURE_TYPE.CONDITIONAL, condition: { type: STRUCTURE_TYPE.COMPARISON, left: { type: STRUCTURE_TYPE.NUMBER, value: 1 }, right: { type: STRUCTURE_TYPE.NUMBER, value: 2 }, operator: COMPARISON_OPERATOR.EQUAL }, children: [{ type: STRUCTURE_TYPE.NUMBER, value: 1 }] })).not.toThrow();

            expect(() => validate({ type: STRUCTURE_TYPE.CONDITIONAL })).toThrow("top: Missing the following properties: condition, children");
        });
    });
});