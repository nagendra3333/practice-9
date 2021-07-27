const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());
const db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      fileName: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const passwordLength = (password) => {
  return password.length > 4;
};

app.post("/require", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectedQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectedQuery);

  if (dbUser === undefined) {
    const createUserQuery = `
          INSERT INTO 
              user { username, name, password, gender, location}
          VALUES
              (
                 '${username}',
                  ${name},
                  ${hashedPassword},
                  ${gender},
                  ${location} 
              )    `;
    if (passwordLength(password)) {
      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exist");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectLoginQuery = `SELECT * FROM user WHERE username= '${username}';`;
  const dbUser = await db.get(selectLoginQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectPassword = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectPassword);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (passwordLength(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedQuery = `
                UPDATE
                   user
                SET
                   password = '${hashedPassword}'
                WHERE
                   username = '${username}'`;
        await db.run(updatedQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
