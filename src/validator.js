const { STRUCTURE_TYPE, COMPARISON_OPERATOR } = require("./types");

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
        if (structure.type === STRUCTURE_TYPE.VARIABLE) {
            checkForKeys(structure, ['name', 'value']);
            validate(structure.value, [...path, 'value']);
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
