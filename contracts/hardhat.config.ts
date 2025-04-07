import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {},
    xdcTestnet: {
      url: "https://rpc.apothem.network",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 51
    }
  },
  etherscan: {
    apiKey: {
      xdcTestnet: "apiKeyNotRequired" // XDC usually doesn't require API key
    },
    customChains: [
      {
        network: "xdcTestnet",
        chainId: 51,
        urls: {
          apiURL: "https://apothem.blocksscan.io/api",
          browserURL: "https://explorer.apothem.network"
        }
      }
    ]
  },
  sourcify: {
    enabled: false // Disable Sourcify to avoid confusion
  }
};

export default config;
