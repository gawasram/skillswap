import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SkillSwapDeployment", (m) => {
  const token = m.contract("MentorshipToken");
  const mentorRegistry = m.contract("MentorRegistry");
  
  const sessionManager = m.contract("SessionManager", {
    args: [mentorRegistry.address, token.address]
  });
  
  const reputationSystem = m.contract("ReputationSystem", {
    args: [sessionManager.address]
  });
  
  const skillSwapMain = m.contract("SkillSwapMain");
  
  return { token, mentorRegistry, sessionManager, reputationSystem, skillSwapMain };
});
