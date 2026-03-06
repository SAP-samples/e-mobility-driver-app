import eslintConfigRoot from "../../eslint.config.mjs";

const driverVueConfig = await Promise.all(
    eslintConfigRoot.map(async (config) => {
        if (config.files && config.files.includes("**/*.{js,ts,vue}")) {
            return {
                ...config,
                languageOptions: {
                    ...config.languageOptions,
                    parserOptions: {
                        ...config.languageOptions?.parserOptions,
                        project: "./tsconfig.app.json",
                    },
                    globals: {
                        ...(config.languageOptions?.globals || {}),
                        window: "readonly",
                        document: "readonly",
                    },
                    ecmaVersion: 2022,
                },
            };
        }
        return config;
    })
);

export default [...driverVueConfig];