const { STRUCTURE_TYPE } = require("./types")

module.exports = {
    number: (value) => {
        return {
            type: STRUCTURE_TYPE.NUMBER,
            value,
        };
    },
};