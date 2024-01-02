const readline = require("readline");
const express = require("express");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const http = require("http");
const fs = require("fs/promises");
const cors = require("cors");


const app = express();
const server = http.createServer(app);


app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
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
  const databasepassword = await askQuestion(
    "请输入数据库连接信息: password "
  );
  const databasedatabase =
    (await askQuestion(
      "请输入数据库连接信息: database （默认为 eventmanagement )"
    )) || "eventmanagement";
  const secret_key =
    (await askQuestion("Token secret key :(default secret key for test 39hf93hf93hfi39f3)")) ||
    "39hf93hf93hfi39f3";

  // 在这里处理数据库连接信息等

  // 配置Express中间件
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(
    require("express-session")({
      secret: secret_key,
      resave: true,
      saveUninitialized: true,
    })
  );

  // 将 Passport 初始化并添加到 Express 应用中
  app.use(passport.initialize());
  app.use(passport.session());

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

  // 生成 Token
  const generateToken = (adminid) => {
    const expiresIn = "3d"; // 过期时间为72小时
    const expires = 24 * 60 * 60 * 1000 * 3;
    const token = jwt.sign({ adminid }, secret_key, { expiresIn });

    return { token, expires };
  };

  // 配置Passport
  passport.use(
    new LocalStrategy(
      {
        usernameField: "adminid",
        passwordField: "password",
      },
      (adminid, password, done) => {
        // 在数据库中查找用户
        connection.query(
          "SELECT * FROM admins WHERE adminid = ?",
          [adminid],
          (error, results, fields) => {
            if (error) {
              console.error("数据库查询错误:", error);
              return done(error);
            }

            // 输出实际在数据库中查到的整个用户记录
            console.log(
              "实际数据库记录:",
              results.length > 0 ? results[0] : "没有找到匹配记录"
            );

            // 检查用户是否存在
            if (results.length === 0) {
              console.log("用户不存在");
              return done(null, false, { message: "用户不存在", errorcode: 1 });
            }

            const user = results[0];

            // 输出实际在数据库中查到的密码（注意使用大写 P）
            console.log("实际数据库密码:", user.Password);

            // 检查密码是否匹配
            if (password !== user.Password) {
              console.log("密码不正确");
              return done(null, false, { message: "密码不正确", errorcode: 2 });
            }

            // 用户验证通过
            console.log("用户验证通过");
            return done(null, user);
          }
        );
      }
    )
  );

  // 设置用于存储用户信息的cookie
  passport.serializeUser((user, done) => {
    done(null, user.adminid);
  });

  passport.deserializeUser((adminid, done) => {
    connection.query(
      "SELECT * FROM admins WHERE adminid = ?",
      [adminid],
      (error, results, fields) => {
        if (error) {
          console.error("数据库查询错误:", error);
          // 返回错误信息
          return done(error);
        }

        const user = results[0];
        done(null, user);
      }
    );
  });

  // 中间件用于验证Token
  const verifyToken = (req, res, next) => {
    let token = req.cookies.jwt;

    if (!token) {
      const tokenHeader = req.headers.authorization;
      if (!tokenHeader || !tokenHeader.startsWith("Bearer ")) {
        return res.redirect("/login"); // 未提供 Token，重定向到登录页
      }
      token = tokenHeader.split(" ")[1];
      if (!token) {
        console.error("Token not provided"); // 输出未提交 Token 的信息
        return res.redirect("/login"); // 未提供 Token，重定向到登录页
      }
    }
    const secretKey = secret_key;

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          console.error("Token has expired"); // 输出 Token 过期的信息
          return res.redirect("/login"); // Token 过期，重定向到登录页
        } else {
          console.error("Invalid token"); // 输出其他验证错误的信息
          return res.redirect("/login"); // 其他验证错误，重定向到登录页
        }
      }
      // 输出解码后的用户 ID 和过期时间等信息
      console.log("Decoded Token Information:", decoded);

      req.userId = decoded.adminid; // 将解码后的用户 ID 存储在请求中
      next(); // 继续执行下一个中间件或路由处理
    });
  };

  app.get("/login", (req, res) => {
    res.render("login.ejs"); // 渲染 views/page1.ejs
  });

  // 登录路由
  app.post("/login", (req, res, next) => {
    console.log("Full req.body:", req.body);
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err || !user) {
        console.error("登录失败:", err || info);
        if (info.errorcode == 1) {
          console.log(info.errorcode);
          return res.status(401).json({ success: false, errorcode: 1 });
        } else {
          console.log(info.errorcode);
          return res.status(401).json({ success: false, errorcode: 2 });
        }
      }

      req.login(user, { session: false }, (error) => {
        if (error) {
          console.error("登录失败:", error);
          return res.status(401).json({ success: false });
        }

        // 生成JWT令牌
        const token = generateToken(user.AdminID).token;
        console.log("Generated Token:", token);
        const expires = generateToken(user.AdminID).expires;
        res.cookie("jwt", token, {
          expires: new Date(Date.now() + expires),
          httpOnly: false,
        });
        return res.json({ success: true, token: token });
      });
    })(req, res);
  });

  // 游客登录请求
  app.post("/guest-login", (req, res) => {
    // // 在实际应用中，你可能会为游客生成一个特定的用户标识，然后创建相应的JWT
    // const user = "guest_" + Math.random().toString(36).substring(7);

    // // 生成JWT令牌
    // const token = generateToken(user).token;
    // const expires = generateToken(user).expires;
    // req.session.successMessage = "Login successful";
    // delete req.session.errorMessage;
    // res.cookie("jwt", token, {
    //   expires: new Date(Date.now() + expires),
    //   httpOnly: true,
    // });
    return res.redirect("/test/");
  });

  // 保护路由，需要在请求头中提供有效的JWT令牌
  app.get("/admin", verifyToken, (req, res) => {
    // 在这里处理受保护路由的逻辑

    connection.query(
      "SELECT AdminName, AdminContact FROM admins WHERE AdminID = ?",
      [req.userId],
      (queryError, results, fields) => {
        if (queryError) {
          console.error("数据库查询错误:", error);
          return done(error);
        }

        const adminInfo = results[0]; // 假设结果只有一行

        // 将 AdminName 和 AdminContact 传递到前端页面
        // res.render("admin.ejs", {
        //   userId: req.userId,
        //   adminName: adminInfo.AdminName,
        //   adminContact: adminInfo.AdminContact,
        // }); // 渲染 views/admin.ejs
        res.json({
          AdminID: req.userId,
          AdminName: adminInfo.AdminName,
          AdminContact: adminInfo.AdminContact,
        }); // 渲染 views/admin.ejs
      }
    );

    // 输出解码后的用户 ID
    console.log("User ID:", req.userId);

    // 输出其他请求信息
    console.log("Request Method:", req.method);
    console.log("Request URL:", req.originalUrl);
  });

  // 登出路由，清除token cookie
  app.post("/logout", (req, res) => {
    res.clearCookie("jwt");
    // 可以根据需要添加其他登出逻辑
    res.redirect("/login"); // 重定向到登录页或其他页面
  });

  // 删除用户
  app.post("/deleteID", verifyToken, (req, res, next) => {
    console.log("Full req.body:", req.body);
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err || !user) {
        console.error("删除失败:", err || info);
        if (info.errorcode == 1) {
          console.log(info.errorcode);
          return res.status(401).json({ success: false, errorcode: 1 });
        } else {
          console.log(info.errorcode);
          return res.status(401).json({ success: false, errorcode: 2 });
        }
      }

      req.login(user, { session: false }, (error) => {
        if (error) {
          console.error("删除失败:", error);
          return res.status(401).json({ success: false });
        }

        connection.query(
          "DELETE FROM admins WHERE AdminID = ?",
          [user.AdminID],
          (deleteErr, deleteResults) => {
            if (deleteErr) {
              console.error("删除记录失败:", deleteErr);
              throw deleteErr;
            }
            console.log(`成功删除 ${deleteResults.affectedRows} 条记录`);
          }
        );
        res.clearCookie("jwt");
        res.json({ success: true });
      });
    })(req, res);
  });

  // 更改密码
  app.post("/update-password", verifyToken, (req, res, next) => {
    const { adminid, password, updatePassword } = req.body;
    console.log("Full req.body:", req.body);
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err || !user) {
        console.error("更改失败:", err || info);
        if (info.errorcode == 1) {
          console.log(info.errorcode);
          return res.status(401).json({ success: false, errorcode: 1 });
        } else {
          console.log(info.errorcode);
          return res.status(401).json({ success: false, errorcode: 2 });
        }
      }

      req.login(user, { session: false }, (error) => {
        if (error) {
          console.error("更改失败:", error);
          return res.status(401).json({ success: false });
        }

        // 执行数据库更新操作
        connection.query(
          "UPDATE admins SET Password = ? WHERE AdminID = ?",
          [updatePassword, adminid],
          (updateError, updateResults) => {
            if (updateError) {
              console.error("更新信息时发生错误:", updateError);
              res.json({ success: false });
            } else {
              console.log("信息更新成功");
              res.json({ success: true });
            }
          }
        );
        res.clearCookie("jwt");
      });
    })(req, res);
  });

  //update-admin-info
  app.post("/update-admin-info", verifyToken, (req, res) => {
    const { adminid, updateAdminName, updateAdminContact } = req.body;
    console.log("Full req.body:", req.body);

    console.log("Received POST request to update admin info");
    console.log("Admin ID:", adminid);
    console.log("New Admin Name:", updateAdminName);
    console.log("New Admin Contact:", updateAdminContact);

    // 执行数据库更新操作
    connection.query(
      "UPDATE admins SET AdminName = ?, AdminContact = ? WHERE AdminID = ?",
      [updateAdminName, updateAdminContact, adminid],
      (updateError, updateResults) => {
        if (updateError) {
          console.error("更新信息时发生错误:", updateError);
          res.json({ success: false });
        } else {
          console.log("信息更新成功");
          res.json({ success: true });
        }
      }
    );
  });
  // 添加新管理员的路由
  app.post("/add-new-admin", verifyToken, (req, res) => {
    const { adminId, adminName, adminContact, adminPassword } = req.body;
    console.log("Full req.body:", req.body);
    // 在实际应用中，你可能需要进行更多的输入验证和处理
    console.log({ adminId, adminName, adminContact, adminPassword });
    // 检查数据库中是否已存在相同的管理员 ID
    connection.query(
      "SELECT * FROM admins WHERE adminid = ?",
      [adminId],
      (error, results) => {
        if (error) {
          console.error("数据库查询错误:", error);
          res.json({ success: false, message: "数据库查询错误" });
        } else {
          if (results.length > 0) {
            // 已存在相同的管理员 ID
            res.json({ success: false, message: "已存在相同的管理员 ID" });
          } else {
            // 向数据库插入新管理员记录
            connection.query(
              "INSERT INTO admins (adminid, adminname, admincontact, password) VALUES (?, ?, ?, ?)",
              [adminId, adminName, adminContact, adminPassword],
              (insertError) => {
                if (insertError) {
                  console.error("数据库插入错误:", insertError);
                  res.json({ success: false, message: "数据库插入错误" });
                } else {
                  res.json({ success: true });
                }
              }
            );
          }
        }
      }
    );
  });

  // 设置路由，父事件作为可选变量
  app.get("/test/:parentEvent?", (req, res) => {
    let parentEvent = req.params.parentEvent;
    console.log(parentEvent);

    // 使用 COALESCE 处理 NULL 值
    // const coalescedParentEvent = parentEvent || null;
    const coalescedParentEvent = parentEvent === null ? null : parentEvent;

    // 查询父事件及其子事件的详细信息
    const eventsQuery = `
    SELECT e.*, ed.*
    FROM events e
    INNER JOIN event_details ed ON e.slide = ed.slideID
    WHERE COALESCE(e.parentEvent, e.EventID) = COALESCE(?, e.EventID);
  `;

    // 查询拥有特定父事件并拥有子事件的事件
    const childrenQuery = `SELECT DISTINCT EventID
FROM events
WHERE (ParentEvent IS NULL AND ? IS NULL) OR (ParentEvent = ? AND EventID IN (
  SELECT DISTINCT ParentEvent
  FROM events
  WHERE ParentEvent IS NOT NULL
));
`;
    const SelectPreEvent = "SELECT ParentEvent FROM events WHERE EventID = ? ";

    // 执行两个查询
    connection.query(
      eventsQuery,
      [coalescedParentEvent],
      (error1, eventsResults, fields1) => {
        if (error1) {
          console.error("Error executing events query: " + error1.stack);
          res.status(500).send("Internal Server Error");
          return;
        }

        connection.query(
          childrenQuery,
          [coalescedParentEvent, coalescedParentEvent],
          (error2, childrenResults, fields2) => {
            if (error2) {
              console.error("Error executing children query: " + error2.stack);
              res.status(500).send("Internal Server Error");
              return;
            }
            connection.query(
              SelectPreEvent,
              [coalescedParentEvent],
              (error3, Results, fields3) => {
                if (error3) {
                  console.error(
                    "Error executing PreEvent query: " + error3.stack
                  );
                  res.status(500).send("Internal Server Error");
                  return;
                }
                //console.log(childrenResults);
                // 将两个查询结果整合为一个 JSON 对象
                const combinedResults = {
                  parentEventDetails: eventsResults,
                  eventsWithChildren: childrenResults.map((row) => row.EventID),
                };
                const PreEvent =
                  Results.map((row) => row.ParentEvent)[0] === null
                    ? -1
                    : Results.map((row) => row.ParentEvent)[0];
                // 将整合后的结果发送到客户端
                //console.log(combinedResults);
                //res.render("test", { combinedResults, parentEvent });
                res.json({ combinedResults, parentEvent, PreEvent });
              }
            );
          }
        );
      }
    );
  });

  app.get("/eventmanagement", verifyToken, function (req, res) {
    console.log("Full req.body:", req.body);
    // 查询 media 表中的所有记录
    const queryMedia = "SELECT * FROM media";
    connection.query(queryMedia, (errMedia, resultsMedia) => {
      if (errMedia) throw errMedia;

      // 查询 background 表中的所有记录
      const queryBackground = "SELECT * FROM background";
      connection.query(queryBackground, (errBackground, resultsBackground) => {
        if (errBackground) throw errBackground;

        // 查询 event_details 表中的所有记录
        const queryevent_details = "SELECT * FROM event_details";
        connection.query(
          queryevent_details,
          (errevent_details, resultsevent_details) => {
            if (errevent_details) throw errevent_details;
            connection.query("SELECT * FROM slides", (error, slidesResults) => {
              if (error) throw error;
              res.json({
                mediaData: resultsMedia.map((row) => ({
                  value: row.mediaID,
                  label: row.mediaID,
                })),
                backgroundData: resultsBackground.map((row) => ({
                  value: row.backgroundID,
                  label: row.backgroundID,
                })),
                event_details: resultsevent_details.map((row) => ({
                  value: row.slideID,
                  label: row.slideID,
                })),
                slidesResults,
              });
            });

            // 将查询结果传递给模板引擎进行渲染
            // res.render("eventmanagement", {
            //   mediaData: resultsMedia,
            //   backgroundData: resultsBackground,
            //   event_details: resultsevent_details,
            // });
          }
        );
      });
    });
  });

  // post/eventmanagement路由

  app.post("/eventmanagement", verifyToken, (req, res) => {
    console.log("Full req.body:", req.body);

    const eventID = req.body.eventID;
    // 检查是否有重复的 eventID
    const checkDuplicateeventIDQuery = `SELECT * FROM slides WHERE Slides_unique_id = ?`;
    connection.query(checkDuplicateeventIDQuery, [eventID], (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        // 如果已经存在相同的 eventID 记录，提示用户选择另一个ID或执行其他逻辑
        return res.json({
          success: false,
          message: "已经存在相同的 eventID 记录",
        });
      }

      const mediaID = req.body.mediaID !== "" ? req.body.mediaID : null;
      const backgroundID =
        req.body.backgroundID !== "" ? req.body.backgroundID : null;

      let startDateID, endDateID, textID;

      const startTime = new Date(req.body.start_time);
      const formattedStartTime = {
        year: startTime.getFullYear(),
        month: startTime.getMonth() + 1,
        day: startTime.getDate(),
        hour: startTime.getHours(),
        minute: startTime.getMinutes(),
        second: startTime.getSeconds(),
        millisecond: startTime.getMilliseconds(),
      };

      const insertDateSQL = `INSERT INTO date (year, month, day, hour, minute, second, millisecond, display_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      connection.query(
        insertDateSQL,
        [
          formattedStartTime.year,
          formattedStartTime.month,
          formattedStartTime.day,
          formattedStartTime.hour,
          formattedStartTime.minute,
          formattedStartTime.second,
          formattedStartTime.millisecond,
          req.body.start_date_display_date,
        ],
        (err, results) => {
          if (err) throw err;
          startDateID = results.insertId;

          const endTime = req.body.end_time
            ? new Date(req.body.end_time)
            : null;

          if (endTime) {
            const formattedEndTime = {
              year: endTime.getFullYear(),
              month: endTime.getMonth() + 1,
              day: endTime.getDate(),
              hour: endTime.getHours(),
              minute: endTime.getMinutes(),
              second: endTime.getSeconds(),
              millisecond: endTime.getMilliseconds(),
            };

            connection.query(
              insertDateSQL,
              [
                formattedEndTime.year,
                formattedEndTime.month,
                formattedEndTime.day,
                formattedEndTime.hour,
                formattedEndTime.minute,
                formattedEndTime.second,
                formattedEndTime.millisecond,
                req.body.end_date_display_date,
              ],
              (err, results) => {
                if (err) throw err;
                endDateID = results.insertId;

                insertTextAndSlides();
              }
            );
          } else {
            endDateID = null;
            insertTextAndSlides();
          }
        }
      );

      function insertTextAndSlides() {
        if (req.body.headline || req.body.text) {
          const insertTextSQL = `INSERT INTO text (headline, text) VALUES (?, ?)`;

          connection.query(
            insertTextSQL,
            [req.body.headline, req.body.text],
            (err, results) => {
              if (err) throw err;
              textID = results.insertId;

              insertSlides();
            }
          );
        } else {
          textID = null;
          insertSlides();
        }
      }

      function insertSlides() {
        const insertSlidesSQL = `INSERT INTO slides (start_date, end_date, textID, mediaID, \`group\`, display_date, autolink, backgroundID, Slides_unique_id)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        connection.query(
          insertSlidesSQL,
          [
            startDateID,
            endDateID,
            textID,
            mediaID,
            req.body.group,
            req.body.event_display_date,
            req.body.autoLink,
            backgroundID,
            req.body.eventID,
          ],
          (err, results) => {
            if (err) throw err;

            const slidesID = results.insertId;
            console.log(
              "Dates and other data added to slides table with ID:",
              slidesID
            );
            // res.redirect("/eventmanagement");
            res.json({
              success: true,
              message: "success",
            });
          }
        );
      }
    });
  });

  app.get("/mediamanagement", verifyToken, function (req, res) {
    connection.query("SELECT * FROM media", (error, mediaResults) => {
      if (error) throw error;
      res.json({
        mediaResults,
      });
    });
  });

  app.get("/datemanagement", verifyToken, function (req, res) {
    connection.query("SELECT * FROM date", (error, dateResults) => {
      if (error) throw error;
      res.json({
        dateResults,
      });
    });
  });

  app.post("/mediamanagement", verifyToken, function (req, res) {
    console.log("Full req.body:", req.body);

    // 获取请求体中的数据
    const {
      url,
      caption,
      credit,
      thumbnail,
      alt,
      title,
      link,
      link_target,
      mediaID,
    } = req.body;

    // 检查是否有重复的 mediaID
    // 这里假设 media 表的主键是 mediaID，你可能需要根据实际情况修改
    const checkDuplicateMediaIDQuery = `SELECT * FROM media WHERE mediaID = ?`;
    connection.query(checkDuplicateMediaIDQuery, [mediaID], (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        // 如果已经存在相同的 mediaID 记录，提示用户选择另一个ID或执行其他逻辑
        return res.json({
          success: false,
          message: "已存在相同ID封面",
        });
      }

      // 将空字符串转换为 null
      const cleanedCaption = caption === "" ? null : caption;
      const cleanedCredit = credit === "" ? null : credit;
      const cleanedThumbnail = thumbnail === "" ? null : thumbnail;
      const cleanedAlt = alt === "" ? null : alt;
      const cleanedTitle = title === "" ? null : title;
      const cleanedLink = link === "" ? null : link;
      const cleanedLinkTarget = link_target === "" ? null : link_target;

      // 插入数据到 media 表
      const insertMediaQuery = `
      INSERT INTO media (url, caption, credit, thumbnail, alt, title, link, link_target, mediaID)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      connection.query(
        insertMediaQuery,
        [
          url,
          cleanedCaption,
          cleanedCredit,
          cleanedThumbnail,
          cleanedAlt,
          cleanedTitle,
          cleanedLink,
          cleanedLinkTarget,
          mediaID,
        ],
        (err, results) => {
          if (err) throw err;

          const mediaInsertID = results.insertId;
          console.log("Media data added with ID:", mediaInsertID);

          // 其他逻辑或重定向到其他页面
          res.json({
            success: true,
            message: "添加成功",
          });
        }
      );
    });
  });

  app.get("/backgroundmanagement", verifyToken, function (req, res) {
    connection.query("SELECT * FROM background", (error, backgroundResults) => {
      if (error) throw error;
      res.json({
        backgroundResults,
      });
    });
  });

  app.post("/backgroundmanagement", verifyToken, function (req, res) {
    console.log("Full req.body:", req.body);

    // 获取请求体中的数据
    const { backgroundID, url, alt, color } = req.body;

    // 检查是否有重复的 backgroundID
    const checkDuplicateBackgroundIDQuery = `SELECT * FROM background WHERE backgroundID = ?`;
    connection.query(
      checkDuplicateBackgroundIDQuery,
      [backgroundID],
      (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
          // 如果已经存在相同的 backgroundID 记录，提示用户选择另一个ID或执行其他逻辑
          return res.json({
            success: false,
            message: "已存在相同ID背景",
          });
        }

        // 将空字符串转换为 null
        const cleanedUrl = url === "" ? null : url;
        const cleanedAlt = alt === "" ? null : alt;

        // 插入数据到 background 表
        const insertBackgroundQuery = `
      INSERT INTO background (backgroundID, url, alt, color)
      VALUES (?, ?, ?, ?)
    `;

        connection.query(
          insertBackgroundQuery,
          [backgroundID, cleanedUrl, cleanedAlt, color],
          (err, results) => {
            if (err) throw err;

            const backgroundInsertID = results.insertId;
            console.log("Background data added with ID:", backgroundInsertID);

            // 其他逻辑或重定向到其他页面
            //res.redirect("/backgroundmanagement");
            res.json({
              success: true,
              message: "添加成功",
            });
          }
        );
      }
    );
  });

  app.get("/activitiesmanagement", verifyToken, (req, res) => {
    // 查询 events 表的所有记录的 eventID
    const eventsQuery = "SELECT eventID FROM events";
    connection.query(eventsQuery, (eventsError, eventsResults) => {
      if (eventsError) throw eventsError;

      // 查询 slides 表的所有记录的 Slides_unique_id
      const slidesQuery = "SELECT Slides_unique_id AS slideID FROM slides";
      connection.query(slidesQuery, (slidesError, slidesResults) => {
        if (slidesError) throw slidesError;

        // 渲染页面，传递所有记录的 ID
        res.json({
          events: eventsResults,
          slides: slidesResults,
        });
      });
    });
  });

  app.post("/activitiesmanagement", verifyToken, function (req, res) {
    console.log("Full req.body:", req.body);

    // 获取请求体中的数据
    const slide = req.body.selectEvent;
    const ParentEvent = req.body.selectParentEvent;
    const EventID = req.body.scheduleID;

    // 检查是否有重复的 ID
    const checkDuplicateEventIDQuery = `SELECT * FROM events WHERE EventID = ?`;
    connection.query(checkDuplicateEventIDQuery, [EventID], (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        // 如果已经存在相同的 ID 记录，提示用户选择另一个ID或执行其他逻辑
        console.log("已经存在ID相同的记录");
        return res.json({ success: false, message: "已经存在ID相同的记录" });
      }

      // 将空字符串转换为 null
      const cleanedParentEvent =
        ParentEvent === "undefined" ? null : ParentEvent;

      // 插入数据到 events 表
      const inserteventsQuery = `
      INSERT INTO events (EventID, slide, ParentEvent)
      VALUES (?, ?, ?)
    `;

      connection.query(
        inserteventsQuery,
        [EventID, slide, cleanedParentEvent],
        (err, results) => {
          if (err) throw err;

          const EventInsertID = results.insertId;
          console.log("Activity data added with ID:", EventInsertID);

          // 其他逻辑或重定向到其他页面
          console.log("添加成功");
          res.json({ success: true, message: "添加成功" });
        }
      );
    });
  });

  // 定义一个递归函数来构建嵌套的 JSON 结构
  async function buildEventJSON(eventID, depth = 0) {
    if (depth > 1) {
      return null; // 超过指定深度时停止递归
    }

    const eventInfo = await getEventInfo(eventID);

    if (!eventInfo) {
      return null;
    }

    // 查询 slides 表中的信息
    const slideInfo = await getSlideInfo(eventInfo.slide);
    // 查询 media 表中的信息
    const mediaInfo = await getMediaInfo(slideInfo.mediaID);
    // 查询 dates 表中的信息
    const startDateInfo = await getDateInfo(slideInfo.start_date);
    const endDateInfo = await getDateInfo(slideInfo.end_date);
    // 查询 text 表中的信息
    const textInfo = await getTextInfo(slideInfo.textID);
    // 查询 background 表中的信息
    const backgroundInfo = await getBackgroundInfo(slideInfo.backgroundID);

    const eventJSON = {
      media: {
        ...(mediaInfo.url && { url: mediaInfo.url }),
        ...(mediaInfo.caption && { caption: mediaInfo.caption }),
        ...(mediaInfo.credit && { credit: mediaInfo.credit }),
        ...(mediaInfo.thumbnail && { thumbnail: mediaInfo.thumbnail }),
        ...(mediaInfo.alt && { alt: mediaInfo.alt }),
        ...(mediaInfo.title && { title: mediaInfo.title }),
        ...(mediaInfo.link && { link: mediaInfo.link }),
        ...(mediaInfo.link_target && { link_target: mediaInfo.link_target }),
      },
      start_date: {
        ...(startDateInfo.month && { month: startDateInfo.month }),
        ...(startDateInfo.day && { day: startDateInfo.day }),
        ...(startDateInfo.year && { year: startDateInfo.year }),
        ...(startDateInfo.hour && { hour: startDateInfo.hour }),
        ...(startDateInfo.minute && { minute: startDateInfo.minute }),
        ...(startDateInfo.second && { second: startDateInfo.second }),
        ...(startDateInfo.millisecond && {
          millisecond: startDateInfo.millisecond,
        }),
        ...(startDateInfo.display_date && {
          display_date: startDateInfo.display_date,
        }),
        ...(startDateInfo.format && { format: startDateInfo.format }),
      },
      end_date: {
        ...(endDateInfo.month && { month: endDateInfo.month }),
        ...(endDateInfo.day && { day: endDateInfo.day }),
        ...(endDateInfo.year && { year: endDateInfo.year }),
        ...(endDateInfo.hour && { hour: endDateInfo.hour }),
        ...(endDateInfo.minute && { minute: endDateInfo.minute }),
        ...(endDateInfo.second && { second: endDateInfo.second }),
        ...(endDateInfo.millisecond && {
          millisecond: endDateInfo.millisecond,
        }),
        ...(endDateInfo.display_date && {
          display_date: endDateInfo.display_date,
        }),
        ...(endDateInfo.format && { format: endDateInfo.format }),
      },
      text: {
        ...(textInfo.headline && { headline: textInfo.headline }),
        ...(textInfo.text && { text: textInfo.text }),
      },
      background: {
        ...(backgroundInfo.color && { color: backgroundInfo.color }),
        ...(backgroundInfo.url && { url: backgroundInfo.url }),
        ...(backgroundInfo.alt && { alt: backgroundInfo.alt }),
      },
      ...(slideInfo.group && { group: slideInfo.group }),
      ...(slideInfo.display_date && { display_date: slideInfo.display_date }),
      ...(slideInfo.autolink && { autolink: slideInfo.autolink }),
    };

    // 递归处理子事件
    const childEvents = await getChildEvents(eventID);
    if (childEvents.length > 0) {
      const childEventJSONs = await Promise.all(
        childEvents.map((childEventID) =>
          buildEventJSON(childEventID, depth + 1)
        )
      );
      const filteredChildEvents = childEventJSONs.filter(
        (childEvent) => childEvent !== null
      );

      if (filteredChildEvents.length > 0) {
        eventJSON.events = filteredChildEvents;
      }
    }

    // 删除空值
    removeEmptyFields(eventJSON);

    return Object.keys(eventJSON).length > 0 ? eventJSON : null;
  }

  // 递归删除对象中的值为空的字段
  function removeEmptyFields(obj) {
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        // 递归处理嵌套的对象
        removeEmptyFields(obj[key]);
        // 删除空对象
        if (Object.keys(obj[key]).length === 0) {
          delete obj[key];
        }
      } else if (
        obj[key] === undefined ||
        obj[key] === null ||
        obj[key] === ""
      ) {
        // 删除 undefined、null 或空字符串的字段
        delete obj[key];
      }
    }
  }

  // // 调用函数开始构建 JSON 结构
  // buildCompleteJSON();

  // 下面是数据库查询函数的定义，根据你的实际数据库表结构进行适当的调整
  function getEventInfo(eventID) {
    // 查询 event 表中的信息
    return new Promise((resolve, reject) => {
      const eventQuery = "SELECT * FROM events WHERE EventID = ?";
      connection.query(eventQuery, [eventID], (eventError, eventResults) => {
        if (eventError) {
          reject(eventError);
        } else {
          resolve(eventResults[0] || {});
        }
      });
    });
  }

  function getSlideInfo(slideID) {
    // 查询 slides 表中的信息
    return new Promise((resolve, reject) => {
      const slideQuery = "SELECT * FROM slides WHERE Slides_unique_id = ?";
      connection.query(slideQuery, [slideID], (slideError, slideResults) => {
        if (slideError) {
          reject(slideError);
        } else {
          resolve(slideResults[0] || {});
        }
      });
    });
  }

  function getMediaInfo(mediaID) {
    // 查询 media 表中的信息
    return new Promise((resolve, reject) => {
      const mediaQuery = "SELECT * FROM media WHERE MediaID = ?";
      connection.query(mediaQuery, [mediaID], (mediaError, mediaResults) => {
        if (mediaError) {
          reject(mediaError);
        } else {
          resolve(mediaResults[0] || {});
        }
      });
    });
  }

  function getDateInfo(dateID) {
    // 查询 date 表中的信息
    return new Promise((resolve, reject) => {
      const dateQuery = "SELECT * FROM date WHERE DateID = ?";
      connection.query(dateQuery, [dateID], (dateError, dateResults) => {
        if (dateError) {
          reject(dateError);
        } else {
          resolve(dateResults[0] || {});
        }
      });
    });
  }

  function getTextInfo(textID) {
    // 查询 text 表中的信息
    return new Promise((resolve, reject) => {
      const textQuery = "SELECT * FROM text WHERE TextID = ?";
      connection.query(textQuery, [textID], (textError, textResults) => {
        if (textError) {
          reject(textError);
        } else {
          resolve(textResults[0] || {});
        }
      });
    });
  }

  function getBackgroundInfo(backgroundID) {
    // 查询 background 表中的信息
    return new Promise((resolve, reject) => {
      const backgroundQuery = "SELECT * FROM background WHERE BackgroundID = ?";
      connection.query(
        backgroundQuery,
        [backgroundID],
        (backgroundError, backgroundResults) => {
          if (backgroundError) {
            reject(backgroundError);
          } else {
            resolve(backgroundResults[0] || {});
          }
        }
      );
    });
  }

  function getChildEvents(parentEventID) {
    // 查询子事件的 EventID 列表
    return new Promise((resolve, reject) => {
      const childEventsQuery =
        "SELECT EventID FROM events WHERE parentEvent = ?";
      connection.query(
        childEventsQuery,
        [parentEventID],
        (childEventsError, childEventsResults) => {
          if (childEventsError) {
            reject(childEventsError);
          } else {
            const childEventIDs = childEventsResults.map(
              (result) => result.EventID
            );
            resolve(childEventIDs);
          }
        }
      );
    });
  }

  // 获取所有根事件的 EventID 列表
  function getRootEventIDs() {
    return new Promise((resolve, reject) => {
      const rootEventsQuery =
        "SELECT EventID FROM events WHERE parentEvent IS NULL";
      connection.query(
        rootEventsQuery,
        (rootEventsError, rootEventsResults) => {
          if (rootEventsError) {
            reject(rootEventsError);
          } else {
            const rootEventIDs = rootEventsResults.map(
              (result) => result.EventID
            );
            resolve(rootEventIDs);
          }
        }
      );
    });
  }

  app.get("/getjson/:root?", async (req, res) => {
    let root = req.params.root;
    console.log(root);
    try {
      let rootEventJSON = {};

      let rootEventID = root || null;
      rootEventID = root === "undefined" ? null : rootEventID;
      console.log(rootEventID);

      if (rootEventID !== null) {
        // 提供具体的根事件 ID
        rootEventJSON = await buildEventJSON(rootEventID, 0);
      } else {
        // 提供 null，获取所有 parentEvent 为 null 的事件
        const rootEventIDs = await getRootEventIDs();
        const rootEventsJSON = await Promise.all(
          rootEventIDs.map((id) => buildEventJSON(id, 1))
        );
        const filteredRootEvents = rootEventsJSON.filter(
          (rootEvent) => rootEvent !== null
        );

        if (filteredRootEvents.length > 0) {
          rootEventJSON = {
            text: {
              headline: "<h1>这是事件系统的根目录页</h1>",
              text: "<p>滚动来浏览所有事件</p>",
            },
            events: filteredRootEvents,
          };
        }
      }

      const completeJSON = {
        title: {
          ...(rootEventJSON.media && { media: rootEventJSON.media }),
          ...(rootEventJSON.start_date && {
            start_date: rootEventJSON.start_date,
          }),
          ...(rootEventJSON.text && { text: rootEventJSON.text }),
          ...(rootEventJSON.background && {
            background: rootEventJSON.background,
          }),
          ...(rootEventJSON.group && { group: rootEventJSON.group }),
          ...(rootEventJSON.display_date && {
            display_date: rootEventJSON.display_date,
          }),
          ...(rootEventJSON.autolink && { autolink: rootEventJSON.autolink }),
        },
        events: rootEventJSON.events || [
          {
            start_date: {
              month: 11,
              day: 28,
              year: 2023,
              hour: 21,
              minute: 42,
              display_date: "空页面在这天被完成",
            },
            text: {
              headline: "<h1>空</h1>",
              text: "<h1>这里什么事件都没有哦</h1><br><p>返回以浏览其他事件</p>",
            },
          },
        ],
      };

      // 写入JSON文件
      await fs.writeFile("output.json", JSON.stringify(completeJSON, null, 2));

      // 发送JSON文件到客户端
      res.sendFile("output.json", { root: __dirname });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // 删除路由处理
  app.get("/delete", verifyToken, (req, res) => {
    // 查询数据库中的记录
    connection.query("SELECT * FROM media", (error, mediaResults) => {
      if (error) throw error;

      connection.query(
        "SELECT * FROM background",
        (error, backgroundResults) => {
          if (error) throw error;

          connection.query("SELECT * FROM date", (error, dateResults) => {
            if (error) throw error;

            connection.query("SELECT * FROM slides", (error, slidesResults) => {
              if (error) throw error;

              connection.query("SELECT * FROM text", (error, textResults) => {
                if (error) throw error;

                connection.query(
                  "SELECT * FROM event_details",
                  (error, detailsResults) => {
                    if (error) throw error;

                    //console.log(slidesResults);

                    // 将查询结果传递给渲染页面的ejs
                    // res.render("deletepage", {
                    //   mediaResults,
                    //   backgroundResults,
                    //   dateResults,
                    //   slidesResults,
                    //   textResults,
                    //   detailsResults,
                    // });
                    res.json({
                      mediaResults,
                      backgroundResults,
                      dateResults,
                      slidesResults,
                      textResults,
                      detailsResults,
                    });

                    // console.log({
                    //   mediaResults,
                    //   backgroundResults,
                    //   dateResults,
                    //   slidesResults,
                    //   textResults,
                    //   detailsResults,
                    // });
                  }
                );
              });
            });
          });
        }
      );
    });
  });

  // 添加一个新的路由处理，用于处理删除记录的 POST 请求
  app.post("/deleteRecord", verifyToken, (req, res) => {
    console.log(req.body);
    const { table, id } = req.body;

    // 查询表的主键列名
    const primaryKeyQuery = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      AND COLUMN_KEY = 'PRI';
  `;

    connection.query(primaryKeyQuery, [table], (error, results) => {
      if (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, error: "查询主键列名时发生错误" });
      } else {
        if (results.length > 0) {
          const primaryKeyColumnName = results[0].COLUMN_NAME;
          console.log(`表 ${table} 的主键列名为 ${primaryKeyColumnName}`);

          let referencedTable;
          let foreignKeyQuery;
          switch (table) {
            case "media":
              foreignKeyQuery =
                "SELECT Slides_unique_id FROM slides WHERE mediaID = ?";
              referencedTable = "slides";
              break;
            case "background":
              foreignKeyQuery =
                "SELECT Slides_unique_id FROM slides WHERE backgroundID = ?";
              referencedTable = "slides";
              break;
            case "date":
              foreignKeyQuery =
                "SELECT Slides_unique_id FROM slides WHERE start_date = ? OR end_date = ?";
              referencedTable = "slides";
              break;
            case "text":
              foreignKeyQuery =
                "SELECT Slides_unique_id FROM slides WHERE textID = ?";
              referencedTable = "slides";
              break;
            case "slides":
              foreignKeyQuery = "SELECT EventID FROM events WHERE slide = ? ";
              referencedTable = "events";
              break;
            case "event_details":
              foreignKeyQuery =
                "SELECT Slides_unique_id FROM slides WHERE Slides_unique_id = ?";
              referencedTable = "slides";
              break;
            case "events":
              foreignKeyQuery =
                "SELECT EventID FROM events WHERE ParentEvent = ?";
              referencedTable = "events";
              break;
          }

          connection.query(foreignKeyQuery, [id, id], (error, results) => {
            if (error) {
              console.error(error);
              res
                .status(500)
                .json({ success: false, error: "查询外键关联时发生错误" });
            } else {
              if (results.length > 0) {
                // 如果有外键关联，返回相关信息
                // const referencedTable = results[0].TABLE_NAME;
                // const referencedColumn = results[0].COLUMN_NAME;
                console.log(results[0]);
                // console.log(
                //   `表 ${table} 的主键列 ${primaryKeyColumnName} 与 ${referencedTable} 表的 ${referencedColumn} 列有外键关联`
                // );
                res.json({
                  success: false,
                  error: `无法删除，该记录与 ${referencedTable} 表中的记录有关联。`,
                });
              } else {
                // 如果没有外键关联，执行删除操作
                console.log(
                  `表 ${table} 的主键列 ${primaryKeyColumnName} 没有外键关联，可以删除`
                );
                const deleteQuery = `DELETE FROM ${table} WHERE ${primaryKeyColumnName} = ?`;

                connection.query(deleteQuery, [id], (error, results) => {
                  if (error) {
                    console.error(error);
                    res
                      .status(500)
                      .json({ success: false, error: "删除记录时发生错误" });
                  } else {
                    if (results.affectedRows > 0) {
                      console.log(
                        `成功删除 ${table} 记录，${primaryKeyColumnName}: ${id}`
                      );
                      res.json({ success: true });
                    } else {
                      res
                        .status(404)
                        .json({ success: false, error: "未找到要删除的记录" });
                    }
                  }
                });
              }
            }
          });
        } else {
          res.status(404).json({ success: false, error: "未找到主键列名" });
        }
      }
    });
  });

  // GET路由 - 获取Slides表中的所有记录
  app.get("/Slidesdetails", verifyToken, (req, res) => {
    connection.query("SELECT * FROM slides", (error, slidesResults) => {
      if (error) throw error;
      res.json({
        slidesResults,
      });
    });
  });

  app.get("/textdetails", verifyToken, (req, res) => {
    connection.query("SELECT * FROM text", (error, textResults) => {
      if (error) throw error;
      res.json({
        textResults,
      });
    });
  });

  app.get("/eventdetails", verifyToken, (req, res) => {
    connection.query("SELECT * FROM event_details", (error, detailsResults) => {
      if (error) throw error;
      res.json({
        detailsResults,
      });
    });
  });

  // POST路由 - 将用户输入插入或更新event_details表
  app.post("/eventdetails", verifyToken, (req, res) => {
    console.log(req.body);
    const { Slides_unique_id, vendor, guests, details } = req.body;

    // 检查是否有重复的 ID
    const checkDuplicateIDQuery = `SELECT * FROM event_details WHERE slideID = ?`;
    connection.query(
      checkDuplicateIDQuery,
      [Slides_unique_id],
      (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
          // 如果已经存在相同的 ID 记录，提示用户选择另一个ID或执行其他逻辑
          return res.json({ success: false, error: "已经存在ID相同的记录" });
        }

        const query = `
    INSERT INTO event_details (slideID, vendor, guests, details)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE vendor=?, guests=?, details=?`;

        const values = [
          Slides_unique_id,
          vendor,
          guests,
          details,
          vendor,
          guests,
          details,
        ];

        connection.query(query, values, (error, results) => {
          if (error) {
            res
              .status(500)
              .json({ success: false, error: "Internal Server Error" });
          } else {
            res.json({
              success: true,
              message: "Data inserted or updated successfully",
            });
          }
        });
      }
    );
  });

  // 获取事件数据并构建树形结构
  const getEvents = (callback) => {
    const query = "SELECT * FROM events";
    connection.query(query, (error, results) => {
      if (error) throw error;

      const events = results.map((result) => ({
        key: result.EventID,
        ParentEvent: result.ParentEvent,
        title: result.slide,
        children: [], // 子事件列表
      }));

      // 构建树形结构
      const eventMap = {};
      events.forEach((event) => {
        eventMap[event.key] = event;
      });

      events.forEach((event) => {
        if (event.ParentEvent !== null) {
          // 将当前事件添加为父事件的子事件
          const parentEvent = eventMap[event.ParentEvent];
          if (parentEvent) {
            parentEvent.children.push(event);
          }
        }
      });

      // 找到根事件（ParentEvent 为 null 的事件）
      const forest = events.filter((event) => event.ParentEvent === null);

      callback(forest);
    });
  };

  // GET路由 - 显示事件森林
  app.get("/eventtree", verifyToken, (req, res) => {
    // 查询 slides 表的所有记录的 Slides_unique_id
    const slidesQuery = "SELECT Slides_unique_id AS slideID FROM slides";
    connection.query(slidesQuery, (slidesError, slidesResults) => {
      if (slidesError) throw slidesError;

      getEvents((forest) => {
        res.json({
          forest,
          slides: slidesResults.map((row) => ({
            value: row.slideID,
            label: row.slideID,
          })),
        });
      });
    });
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
