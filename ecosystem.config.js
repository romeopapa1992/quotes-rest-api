export default {
  apps: [
    {
      name: "quotes-rest-api", 
      script: "./index.js",
      env_file: "./.env",
      cwd: "/home/rafal/quotes-rest-api",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
