const { MATH_OPERATOR } = require("../src");
const { overrideLang, generate } = require("../src/generate");
const Generator = require("../src/generators/generator");
const { math, number, assign } = require("../src/helpers");
const { vol } = require("memfs");

jest.mock("fs", () => require("memfs").fs);

class MockGenerator extends Generator {
  static generate(code, globalContext) {
    return `stub code ${globalContext.foo ?? ''}`;
  }

  static getFile(file) {
    return `${file}.stub`;
  }
}

describe('generate', () => {
  beforeAll(() => {
    overrideLang('STUB', MockGenerator);
  });

  beforeEach(() => {
    vol.reset();
  });

  it('should throw on invalid lang', async () => {
    expect(async () => {
      await generate('badlang');
    }).rejects.toThrow('Unknown generator language badlang');
  });

  it('should properly write code', async () => {
    const code = [
        assign('myvar', math(number(1), number(2), MATH_OPERATOR.SUBTRACT)),
    ];
    await generate('STUB', code, {}, 'path');

    expect(vol.existsSync("path/main.stub"));
    const content = vol.readFileSync("path/main.stub", "utf-8");

    expect(content).toBe("stub code ");
  });

  it('should pass global context', async () => {
    const code = [
        assign('myvar', math(number(1), number(2), MATH_OPERATOR.SUBTRACT)),
    ];
    await generate('STUB', code, { foo: 'bar' }, 'path');

    expect(vol.existsSync("path/main.stub"));
    const content = vol.readFileSync("path/main.stub", "utf-8");

    expect(content).toBe("stub code bar");
  });
});