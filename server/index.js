const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const readline = require("readline");

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());
// 启用所有路由的CORS
app.use(cors());

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function startServer() {
  const defaultPort = 3000;
  const port =
    (await askQuestion(`请输入端口号（默认为 ${defaultPort}）: `)) ||
    defaultPort;
  const databaseHost =
    (await askQuestion("请输入数据库连接信息: host （默认为 localhost )")) ||
    "localhost";
  const databaseuser =
    (await askQuestion("请输入数据库连接信息: user （默认为 root )")) || "root";
  const databasepassword = (await askQuestion("请输入数据库连接信息: password "));
  const databasedatabase =
    (await askQuestion(
      "请输入数据库连接信息: database （默认为 movies )"
    )) || "movies";
  
  // 在这里处理数据库连接信息等

  // 配置数据库连接
  const connection = mysql.createConnection({
    host: databaseHost,
    user: databaseuser,
    password: databasepassword,
    database: databasedatabase,
  });

  // 连接数据库
  connection.connect((err) => {
    if (err) throw err;
    console.log("Connected to database");
  });


  app.get("/movies/:id?", (req, res) => {
    let searchTerm = req.params.id;
    if (searchTerm == undefined) {
      const sql =
        "SELECT * FROM movies";
      console.log(sql);
      connection.query(sql, (err, results) => {
        if (err) throw err;
        console.log(results);
        res.send(results);
      });
    } else {
      const sql =
        "SELECT * FROM movies WHERE movie_name LIKE '%" +
        searchTerm +
        "%' OR moviesID = ? ";
      console.log(sql);
      connection.query(sql, [searchTerm] , (err, results) => {
        if (err) throw err;
        console.log(results);
        res.send(results);
      });
    }
  });

  app.post('/movies', (req, res) => {
    // 使用 REPLACE INTO 语句，如果存在相同的 moviesID，则更新记录；否则插入新记录
    console.log(req.body);
    const addOrUpdateMovies = `
    REPLACE INTO movies (moviesID, movie_name, movie_description, movie_rating, release_date,url)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
    const {
      moviesID,
      movie_name,
      movie_description,
      movie_rating,
      release_date,
      movieURL,
    } = req.body;
    // 将字符串日期转换为符合 MySQL DATETIME 格式的字符串
    // 将字符串日期转换为符合 MySQL DATETIME 格式的字符串
    const formattedReleaseDate = new Date(release_date)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    console.log(formattedReleaseDate);
    connection.query(
      addOrUpdateMovies,
      [
        moviesID,
        movie_name,
        movie_description,
        movie_rating,
        formattedReleaseDate,
        movieURL,
      ],
      (err, results) => {
        if (err) throw err;
        console.log(results);
      }
    );
  });

  // 登陆服务启动
  server.listen(port, () => {
    console.log(
      `服务器已启动，正在监听端口 ${port}，数据库连接信息: ${databaseHost}，喵~`
    );
    rl.close();
  });
}

startServer();

rl.on("close", () => {
  console.log("感谢使用，喵~");
});
