const { STRUCTURE_TYPE, COMPARISON_OPERATOR, MATH_OPERATOR } = require("../types");
const Generator = require("./generator");

const DEFAULT_CONTEXT = {
  vars: [],
};

const PARENT = {
  NONE: 'none',
  CLASS: 'class',
};

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

  static processStatements(code, indent = 0, context, parent = PARENT.NONE) {
    if (!context) context = structuredClone(DEFAULT_CONTEXT);
    const indentString = "\t".repeat(indent);
    return code.map((line) => JavascriptGenerator.processStatement(line, indent, context, parent)).map((statement) => `${indentString}${statement};`).join("\n");
  }

  static processStatement(statement, indent, context, parent = PARENT.NONE) {
    if (statement.type === STRUCTURE_TYPE.ASSIGNMENT) {
      const left = JavascriptGenerator.processStatement(statement.left, indent, context);
      const right = JavascriptGenerator.processStatement(statement.right, indent, context);
      let showLet = true;
      if (statement.left.type === STRUCTURE_TYPE.VARIABLE) {
        if (context.vars.includes(left)) {
          showLet = false;
        } else {
          context.vars.push(left);
        }
      }
      return `${showLet ? 'let ' : ''}${left} = ${right}`;
    } else if (statement.type === STRUCTURE_TYPE.VARIABLE) {
      return statement.name;
    } else if (statement.type === STRUCTURE_TYPE.NUMBER) {
      return statement.value;
    } else if (statement.type === STRUCTURE_TYPE.STRING) {
      return `"${statement.value}\"`;
    } else if (statement.type === STRUCTURE_TYPE.FUNCTION_CALL) {
      const argStrings = statement.arguments.map(JavascriptGenerator.processStatement, indent, context).join(",");
      const name = JavascriptGenerator.processStatement(statement.name, 0, context);
      return `${name}(${argStrings})`;
    } else if (statement.type === STRUCTURE_TYPE.COMPARISON) {
      const left = JavascriptGenerator.processStatement(statement.left, indent, context);
      const right = JavascriptGenerator.processStatement(statement.right, indent, context);
      let operator;

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
          throw new Error(`Unexpected comparison operator ${statement.operator, indent, context}`);
      }

      return `${left} ${operator} ${right}`;
    } else if (statement.type === STRUCTURE_TYPE.CONDITIONAL) {
      return `if (${JavascriptGenerator.processStatement(statement.condition, indent, context)}) {\n${JavascriptGenerator.processStatements(statement.children, indent + 1, structuredClone(context))}\n}`;
    } else if (statement.type === STRUCTURE_TYPE.CONDITIONAL_GROUP) {
      let allChildCode = "";
      for (let i=0;i<statement.children.length;i++) {
        const child = statement.children[i];
        const first = i === 0;
        const childCode = JavascriptGenerator.processStatement(child, indent, context);
        if (first) allChildCode += childCode;
        else allChildCode += ` else ${childCode}`;
      }

      if (statement.finally) {
        allChildCode += ` else {\n${JavascriptGenerator.processStatements([statement.finally], indent + 1, context)}\n}`
      }

      return allChildCode;
    } else if (statement.type === STRUCTURE_TYPE.FUNCTION) {
      const prefix = parent === PARENT.CLASS ? 'static async ' : 'async function ';
      const paramList = statement.parameters.map(JavascriptGenerator.processStatement).join(", ");
      const childCode = JavascriptGenerator.processStatements(statement.children, indent + 1, structuredClone(context));
      if (statement.name) {
        return `${prefix}${statement.name}(${paramList}) {\n${childCode}\n}`;
      }
      return `${prefix}(${paramList}) {\n${childCode}\n}`;
    } else if (statement.type === STRUCTURE_TYPE.RETURN) {
      if (statement.children.length === 0) {
        return `return`;
      }
      return `return ${JavascriptGenerator.processStatement(statement.children[0], indent, context)}`
    } else if (statement.type === STRUCTURE_TYPE.BLOCK) {
      return JavascriptGenerator.processStatements(statement.children, indent + 1, structuredClone(context), parent);
    } else if (statement.type === STRUCTURE_TYPE.LOOP) {
      const childContext = structuredClone(context);
      const preCode = statement.pre ? JavascriptGenerator.processStatement(statement.pre, indent, childContext) : '';
      const postCode = statement.post ? JavascriptGenerator.processStatement(statement.post, indent, childContext) : '';
      return `for (${preCode};${JavascriptGenerator.processStatement(statement.condition, indent, childContext)};${postCode}) {\n${JavascriptGenerator.processStatements(statement.children, indent + 1, childContext)}\n}`;
    } else if (statement.type === STRUCTURE_TYPE.MATH) {
      const left = JavascriptGenerator.processStatement(statement.left, indent, context);
      const right = JavascriptGenerator.processStatement(statement.right, indent, context);

      let operator;
      switch (statement.operator) {
        case MATH_OPERATOR.ADD:
          operator = '+';
          break;
        case MATH_OPERATOR.SUBTRACT:
          operator = "-";
          break;
        case MATH_OPERATOR.DIVIDE:
          operator = "/";
          break;
        case MATH_OPERATOR.MULTIPLY:
          operator = "*";
          break;
        case MATH_OPERATOR.MODULO:
          operator= "%";
          break;
        default:
          throw new Error(`Unknown math operator ${statement.operator}`);
      }
      
      return `${left} ${operator} ${right}`;
    } else if (statement.type === STRUCTURE_TYPE.OBJECT) {
      const childLines = [];
      const indentString = "\t".repeat(indent);
      for (const key in statement.properties) {
        const value = statement.properties[key];
        childLines.push(`${indentString}\t${key}: ${JavascriptGenerator.processStatement(value, indent+1, context)},`);
      }
      
      return `{\n${childLines.join('\n')}\n${indentString}}`;
    } else if (statement.type === STRUCTURE_TYPE.PATH) {
      const left = JavascriptGenerator.processStatement(statement.left, indent, context);

      return `${left}.${statement.path.join(".")}`;
    } else if (statement.type === STRUCTURE_TYPE.CLASS) {
      return `class ${statement.name} {\n${JavascriptGenerator.processStatements(statement.children, indent+1, context, PARENT.CLASS)}\n}`;
    } else if (statement.type === STRUCTURE_TYPE.COMMENT) {
      return `// ${statement.comment}`;
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