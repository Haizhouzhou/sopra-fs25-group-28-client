const { execSync } = require("child_process");

try {
  const output = execSync("hostname -I", { encoding: "utf-8" });
  const ip = output.trim().split(" ")[0];
  console.log(`🌐 Open your app at: http://${ip}:3000`);
} catch (e) {
  console.error("Failed to get WSL IP:", e.message);
}
