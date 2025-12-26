function Tokenize(code, splitTokens) {
    let buffer = '';
    const tokens = [];
    for (const char of code) {
        if (splitTokens.includes(char)) {
            if (buffer.length > 0) {
                tokens.push(buffer);
            }
            buffer = '';
            tokens.push(char);
        } else {
            buffer += char;
        }
    }

    if (buffer.length > 0) {
        tokens.push(buffer);
    }

    return tokens;
}

module.exports = {
    Tokenize,
};