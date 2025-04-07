const axios = require('axios');
const fs = require('fs');
const path = require('path');
const solc = require('solc');

// Flatten your contracts first using:
// npx hardhat flatten contracts/YourContract.sol > flattened/YourContract_flat.sol

async function verifyContract(contractAddress, contractName, sourceCode, compilerVersion = 'v0.8.17+commit.8df45f5f') {
  try {
    const apiUrl = 'https://apothem.blocksscan.io/api';
    
    const response = await axios.post(apiUrl, {
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: contractAddress,
      sourceCode: sourceCode,
      codeformat: 'solidity-single-file',
      contractname: contractName,
      compilerversion: compilerVersion,
      optimizationUsed: 1,
      runs: 200,
      // Add constructor arguments if needed
      // constructorArguments: '000000000000000000000000000000000000000000000000000000000000002a'
    });
    
    console.log(`Verification response for ${contractName}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error verifying ${contractName}:`, error.message);
    throw error;
  }
}

async function main() {
  // Read flattened contract
  const contractPath = path.resolve(__dirname, '../flattened/MentorshipToken_flat.sol');
  const sourceCode = fs.readFileSync(contractPath, 'utf8');
  
  // Clean up license identifiers (keep only the first one)
  const cleanedSourceCode = sourceCode.replace(/(\/\/ SPDX-License-Identifier: .*?$)([\s\S]*?)(\/\/ SPDX-License-Identifier: .*?$)/gm, '$1$2// License identifier removed');
  
  await verifyContract(
    '0x3bc607852393dcc75a3fccf0deb1699001d32bbd', 
    'MentorshipToken',
    cleanedSourceCode
  );
  
  // Add other contracts as needed
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 