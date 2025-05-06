const { Executor } = require("./executor");


async function execute(code) {
    const executor = new Executor(code);

    await executor.execute();
}

module.exports = {
    execute,
};