import { createServer } from "http";
import { readFile, writeFile, access } from "fs/promises";
import { constants as fsConstants } from "fs";
import bcrypt from "bcryptjs";

const USERS_FILE = "./users.json";

// Load users from file
async function loadUsers() {
  try {
    await access(USERS_FILE, fsConstants.F_OK);
    const data = await readFile(USERS_FILE, "utf8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

// Save users to file
async function saveUsers(users) {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Register function
async function register(email, password) {
  const users = await loadUsers();
  if (users.find((u) => u.email === email)) {
    return { success: false, message: "User already exists" };
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ email, password: hashedPassword });
  await saveUsers(users);
  return { success: true, message: "Registration successful" };
}

// Login function
async function login(email, password) {
  const users = await loadUsers();
  const user = users.find((u) => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return { success: false, message: "Invalid credentials" };
  }

  return { success: true, message: "Login successful" };
}

// Create server
const server = createServer(async (req, res) => {
  if (
    (req.url === "/api/register" || req.url === "/api/login") &&
    req.method === "POST"
  ) {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { email, password } = JSON.parse(body);

        if (!email || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ success: false, message: "Email and password required" })
          );
        }

        const results =
          req.url === "/api/register"
            ? await register(email, password)
            : await login(email, password);

        res.writeHead(results.success ? 200 : 401, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify(results));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ success: false, message: "Server error", error: err.message })
        );
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
