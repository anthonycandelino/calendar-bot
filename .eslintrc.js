module.exports = {
  'env': {
    'commonjs': true,
    'es6': true,
    'node': true,
  },
  'extends': [
    'google',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parserOptions': {
    'ecmaVersion': 2018,
  },
  'rules': {
    'require-jsdoc': ['error', {
      require: {
        FunctionDeclaration: false,
        MethodDefinition: false,
        ClassDeclaration: false,
      },
    }],
    'max-len': ['error', {
      code: 200,
    }],
    'camelcase': ['error', {"ignoreDestructuring": true, "properties": "never"}],
  },
};
