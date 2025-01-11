export default {
  apps: [
    {
      name: "quotes-rest-api",
      script: "./index.js",
      env_file: "./.env",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
