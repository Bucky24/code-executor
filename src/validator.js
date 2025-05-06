const { STRUCTURE_TYPE } = require("./types");

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
    if (Array.isArray(structure)) {
        for (let i=0;i<structure.length;i++) {
            validate(structure[i], [...path, i]);
        }
    }
    try {
        if (structure.type === STRUCTURE_TYPE.VARIABLE) {
            checkForKeys(structure, ['name', 'value']);
            validate(structure.value, [...path, 'value']);
        } else if (structure.type === STRUCTURE_TYPE.NUMBER) {
            checkForKeys(structure, ['value']);
        } else if (structure.type === STRUCTURE_TYPE.STRING) {
            checkForKeys(structure, ['value']);
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
