import { viem } from "hardhat";

async function main() {
  console.log("Deploying SkillSwap contracts...");
  
  // Deploy MentorshipToken
  const token = await viem.deployContract("MentorshipToken");
  console.log("MentorshipToken deployed to:", token.address);
  
  // Deploy MentorRegistry
  const mentorRegistry = await viem.deployContract("MentorRegistry");
  console.log("MentorRegistry deployed to:", mentorRegistry.address);
  
  // Deploy SessionManager
  const sessionManager = await viem.deployContract(
    "SessionManager", 
    [mentorRegistry.address, token.address]
  );
  console.log("SessionManager deployed to:", sessionManager.address);
  
  // Deploy ReputationSystem
  const reputationSystem = await viem.deployContract(
    "ReputationSystem", 
    [sessionManager.address]
  );
  console.log("ReputationSystem deployed to:", reputationSystem.address);
  
  // Deploy SkillSwapMain
  const skillSwapMain = await viem.deployContract("SkillSwapMain");
  console.log("SkillSwapMain deployed to:", skillSwapMain.address);
  
  console.log("All contracts deployed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 