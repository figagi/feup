module.exports = {
  extends: [require.resolve('feup-lint/dist/eslint')],

  rules: {
    'import/no-dynamic-require': 0,
    'global-require': 0,
    camelcase: 0,
  },
};
