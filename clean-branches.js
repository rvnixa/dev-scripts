const { execSync } = require("child_process");

// Define branches you want to keep
const protectedBranches = ["main", "master", "dev"];

try {
  // Get the current branch
  const currentBranch = execSync("git branch --show-current").toString().trim();
  protectedBranches.push(currentBranch);

  // Get all local branches
  const branches = execSync("git branch", { encoding: "utf-8" })
    .split("\n")
    .map((branch) => branch.replace("*", "").trim())
    .filter((branch) => branch && !protectedBranches.includes(branch));

  if (branches.length === 0) {
    console.log("No branches to delete. All clean!");
    process.exit(0);
  }

  // Delete each branch (local/remote)
  branches.forEach((branch) => {
    console.log(`Deleting branch: ${branch}`);
    execSync(`git branch -D ${branch}`, { stdio: "inherit" });
    execSync(`git push origin --delete ${branch}`, { stdio: "inherit" });
  });

  console.log("\n🌿 All unwanted branches have been pruned.");
} catch (err) {
  console.error("❌ Error while cleaning branches:", err.message);
}
