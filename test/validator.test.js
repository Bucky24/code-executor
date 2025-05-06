const { STRUCTURE_TYPE } = require("../src/types");
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
    });
});