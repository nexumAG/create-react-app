module.exports = {
  parser: 'babel-eslint',
  extends: [
    'airbnb',
    'plugin:flowtype/recommended',
  ],
  rules: {
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
  },
  env: {
    es6: true,
    browser: true,
    node: true,
    jest: true
  },
  plugins: [
    'flowtype',
  ],
  settings: {
    flowtype: {
      onlyFilesWithFlowAnnotation: true
    },
    'import/resolver': {
      node: {
        paths: ['src']
      }
    },
  }
};
