<<<<<<< HEAD
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
=======
module.exports = {
    apps: [
      {
        name: "quotes-rest-api",
        script: "./index.js",
        env_file: "./.env",
        env: {
          NODE_ENV: "production",
>>>>>>> f1ef921ac1d4e829b3e8540183c5aa94cfc847df
        },
      },
    ],
  };
<<<<<<< HEAD
  
=======
>>>>>>> f1ef921ac1d4e829b3e8540183c5aa94cfc847df
  