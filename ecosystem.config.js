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
    {
      name: "quotes-app-react", 
      script: "npx",
      args: "serve -s build -l 4173",
      cwd: "/home/rafal/quotes-app-react",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
