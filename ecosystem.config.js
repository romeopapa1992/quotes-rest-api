export default {
    apps: [
      {
        name: "quotes-rest-api",
        script: "index.js",
        env: {
          NODE_ENV: "production",
          SESSION_SECRET: "MYQUOTES",
          PG_USER: "postgres",
          PG_HOST: "localhost",
          PG_DATABASE: "quotes",
          PG_PASSWORD: "2beornot2be",
          PG_PORT: "5432",
        },
      },
    ],
  };
  
  