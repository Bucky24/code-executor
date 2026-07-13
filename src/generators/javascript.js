const { STRUCTURE_TYPE, COMPARISON_OPERATOR } = require("../types");
const Generator = require("./generator");

class JavascriptGenerator extends Generator {
  static generate(code, globalContext) {
    if (!Array.isArray(code)) {
      code = [code];
    }

    const globals = Object.keys(globalContext).map((key) => {
      const value = globalContext[key];

      // trim spaces
      const lines = value.toString().split("\n");
      let spacesCount = 0;
      for (const c of lines.at(-1)) {
        if (c !== ' ') break;
        spacesCount ++;
      }
      for (let i=1;i<lines.length;i++) {
        lines[i] = lines[i].substring(spacesCount);
      }
      
      return `const ${key} = ${lines.join("\n")}`;
    });

    const generatedCode = JavascriptGenerator.processStatements(code);

    return (globals.length > 0 ? globals.join('\n') + '\n' : '') + generatedCode;
  }

  static processStatements(code) {
    return code.map(JavascriptGenerator.processStatement).map((statement) => `${statement};`).join("\n");
  }

  static processStatement(statement) {
    if (statement.type === STRUCTURE_TYPE.ASSIGNMENT) {
      const left = JavascriptGenerator.processStatement(statement.left);
      const right = JavascriptGenerator.processStatement(statement.right);
      return `let ${left} = ${right}`;
    } else if (statement.type === STRUCTURE_TYPE.VARIABLE) {
      return statement.name;
    } else if (statement.type === STRUCTURE_TYPE.NUMBER) {
      return statement.value;
    } else if (statement.type === STRUCTURE_TYPE.STRING) {
      return `"${statement.value}\"`;
    } else if (statement.type === STRUCTURE_TYPE.FUNCTION_CALL) {
      const argStrings = statement.arguments.map(JavascriptGenerator.processStatement).join(",");
      return `${statement.name}(${argStrings})`;
    } else if (statement.type === STRUCTURE_TYPE.COMPARISON) {
      const left = JavascriptGenerator.processStatement(statement.left);
      const right = JavascriptGenerator.processStatement(statement.right);
      let operator;

      console.log(statement);

      switch (statement.operator) {
        case COMPARISON_OPERATOR.NOT_EQUAL:
          operator = "!=";
          break;
        case COMPARISON_OPERATOR.EQUAL:
          operator = "==";
          break;
        case COMPARISON_OPERATOR.GREATER_THAN:
          operator = ">";
          break;
        case COMPARISON_OPERATOR.GREATER_THAN_OR_EQUAL:
          operator = ">=";
          break;
        case COMPARISON_OPERATOR.LESS_THAN:
          operator = "<";
          break;
        case COMPARISON_OPERATOR.LESS_THAN_OR_EQUAL:
          operator = "<=";
          break;
        default:
          throw new Error(`Unexpected comparison operator ${statement.operator}`);
      }

      return `${left} ${operator} ${right}`;
    } else {
      console.log(statement);
      throw new Error(`Unexpected structure type ${statement.type}`);
    }
  }

  static getFile(file) {
    return `${file}.js`;
  }
}

module.exports = JavascriptGenerator;