const { STRUCTURE_TYPE, COMPARISON_OPERATOR, MATH_OPERATOR } = require("./types");

function checkForKeys(structure, keys) {
    const errors = [];
    for (const key of keys) {
        if (structure[key] === undefined) {
            errors.push(key);
        }
    }

    if (errors.length > 0) {
        throw new Error("Missing the following properties: " + errors.join(", "));
    }
}

function validate(structure, path = ['top']) {
    try {
        if (Array.isArray(structure)) {
            for (let i=0;i<structure.length;i++) {
                validate(structure[i], [...path, i]);
            }
            return;
        }
        if (structure.type === STRUCTURE_TYPE.ASSIGNMENT) {
            checkForKeys(structure, ['left', 'right']);
            validate(structure.left, [...path, 'left']);
            validate(structure.right, [...path, 'right']);
        } else if (structure.type === STRUCTURE_TYPE.VARIABLE) {
            checkForKeys(structure, ['name']);
        } else if (structure.type === STRUCTURE_TYPE.NUMBER) {
            checkForKeys(structure, ['value']);
        } else if (structure.type === STRUCTURE_TYPE.STRING) {
            checkForKeys(structure, ['value']);
        } else if (structure.type === STRUCTURE_TYPE.FUNCTION_CALL) {
            checkForKeys(structure, ['name', 'arguments']);
            validate(structure.arguments, [...path, 'arguments']);
        } else if (structure.type === STRUCTURE_TYPE.COMPARISON) {
            checkForKeys(structure, ['left', 'right', 'operator']);
            validate(structure.left, [...path, 'left']);
            validate(structure.right, [...path, 'right']);
            if (!Object.values(COMPARISON_OPERATOR).includes(structure.operator)) {
                throw new Error(`Invalid operator: ${structure.operator}`);
            }
        } else if (structure.type === STRUCTURE_TYPE.CONDITIONAL) {
            checkForKeys(structure, ['condition', 'children']);
            validate(structure.condition, [...path, 'condition']);
            validate(structure.children, [...path, 'children']);
        } else if (structure.type === STRUCTURE_TYPE.CONDITIONAL_GROUP) {
            checkForKeys(structure, ['children']);
            validate(structure.children, [...path, 'children']);
            if (structure.finally) {
                validate(structure.finally, [...path, 'finally']);
            }
        } else if (structure.type === STRUCTURE_TYPE.FUNCTION) {
            checkForKeys(structure, ['parameters', 'children']);
            validate(structure.parameters, [...path, 'parameters']);
            validate(structure.children, [...path, 'children']);
        } else if (structure.type === STRUCTURE_TYPE.BLOCK) {
            checkForKeys(structure, ['children']);
            validate(structure.children, [...path, 'children']);
        } else if (structure.type === STRUCTURE_TYPE.LOOP) {
            checkForKeys(structure, ['condition', 'children']);
            validate(structure.condition, [...path, 'condition']);
            validate(structure.children, [...path, 'children']);
            if (structure.pre) {
                validate(structure.pre, [...path, 'pre']);
            }
            if (structure.post) {
                validate(structure.post, [...path, 'post']);
            }
        } else if (structure.type === STRUCTURE_TYPE.MATH) {
            checkForKeys(structure, ['left', 'right', 'operator']);
            validate(structure.left, [...path, 'left']);
            validate(structure.right, [...path, 'right']);
            if (!Object.values(MATH_OPERATOR).includes(structure.operator)) {
                throw new Error(`Invalid operator: ${structure.operator}`);
            }
        } else {
            throw new Error(`Unknown structure type: ${structure.type}`);
        }
    } catch (error) {
        if (error.message.startsWith("top")) {
            // pass it along
            throw error;
        }
        throw new Error(`${path.join('.')}: ${error.message}`);
    }
}

module.exports = {
    validate,
};
