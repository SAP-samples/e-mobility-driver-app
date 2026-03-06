import eslintConfigRoot from "../eslint.config.mjs";

// Create CLI-specific configuration by extending root config
const cliConfig = eslintConfigRoot.map((config) => {
  // For configurations with files, add CLI-specific rule overrides
  if (config.files) {
    return {
      ...config,
      rules: {
        ...config.rules,
        // CLI-specific rule overrides
        "no-console": "off",
        "@typescript-eslint/no-explicit-any": "warn"
      }
    };
  }

  return config;
});

export default cliConfig;