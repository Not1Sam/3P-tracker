const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/db/**'],
              message: 'UI layer must not import directly from db layer. Use services instead.',
            },
          ],
        },
      ],
    },
  },
];
