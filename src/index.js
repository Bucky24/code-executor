const { Executor } = require("./executor");
const { validate } = require("./validator");
const { STRUCTURE_TYPE } = require("./types");

async function execute(code) {
    const executor = new Executor(code);

    await executor.execute();
}

module.exports = {
    execute,
    validate,
    STRUCTURE_TYPE,
};