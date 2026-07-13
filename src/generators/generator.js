class Generator {
  static generate() {
    throw new Error(`Child of Generator must implement generate`);
  }

  static getFile() {
    throw new Error(`Child of Generator must implement getFile`);
  }
}

module.exports = Generator;