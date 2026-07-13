const JavascriptGenerator = require("./generators/javascript");
const fs = require("fs");
const path = require("path");

const LANG = {
  JAVASCRIPT: 'lang/javascript',
};

const overrides = {};

function getGenerator(lang) {
  if (overrides[lang]) {
    return overrides[lang];
  }

  switch (lang) {
    case LANG.JAVASCRIPT:
      return JavascriptGenerator;
    default:
      throw new Error(`Unknown generator language ${lang}`);
  }
}

module.exports = {
  LANG,
  generate: async (lang, code, globalContext, outputDir) => {
    const generator = getGenerator(lang);

    // ensure the directory exists and is clean
    if (fs.existsSync(outputDir)) {
      fs.rmdirSync(outputDir, { recursive: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    const outputCode = await generator.generate(code, globalContext);

    fs.writeFileSync(path.join(outputDir, generator.getFile("main")), outputCode);
  },
  overrideLang: (lang, cls) => {
    overrides[lang] = cls;
  },
}