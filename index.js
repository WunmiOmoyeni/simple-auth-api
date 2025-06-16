import { createServer } from "http";
import fs from 'fs'
import bcrypt from "bcryptjs";


const USERS_FILE = "./users.json";

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE, "utf8");
  return JSON.parse(data || "[]");
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function register(email, password) {
  const users = loadUsers();
  if (users.find((u) => u.email === email)) {
    return { success: false, message: "User already exists" };
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ email, password: hashedPassword });
  saveUsers(users);
  return { success: true, message: "Registration successful" };
}


function login(email, password) {
  const users = loadUsers();
  const user = users.find((u) => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return { success: false, message: "Invalid credentials" };
  }

  return { success: true, message: "Login successful" };
}


const server = createServer((req, res) => {
  //Set Headers
  res.setHeader("Content-Type", "application/json");

  //Route: POST /api/register
  if (req.url === "/api/register" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { email, password } = JSON.parse(body);
      const results = register(email, password);

      res.writeHead(results.success ? 200 : 401, {
        "content-type": "application/json",
      });
      res.end(JSON.stringify(results));
    });
  } else if (req.url === "/api/login" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { email, password } = JSON.parse(body);
      const results = login(email, password);

      res.writeHead(results.success ? 200 : 401, {
        "content-type": "application/json",
      });
      res.end(JSON.stringify(results));
    });
  } else {
    res.writeHead (404, {'content-type': 'application/json'});
    res.end(JSON.stringify({message: "Route not found"}));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});