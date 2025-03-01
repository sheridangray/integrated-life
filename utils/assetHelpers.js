const fs = require("fs");
const path = require("path");

exports.getBundlePath = () => {
  const distPath = path.join(process.cwd(), "public", "js", "dist");
  try {
    const files = fs.readdirSync(distPath);
    const bundleFile = files.find(
      (file) => file.startsWith("bundle") && file.endsWith(".js")
    );
    return bundleFile || "bundle.js"; // Fallback to bundle.js if no hash version found
  } catch (error) {
    console.error("Error reading bundle directory:", error);
    return "bundle.js"; // Fallback to bundle.js
  }
};
