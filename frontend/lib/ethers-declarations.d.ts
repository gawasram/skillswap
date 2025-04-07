declare module 'ethers' {
  export namespace utils {
    function isAddress(address: string): boolean;
    function formatEther(wei: any): string;
    function parseEther(ether: string): any;
  }

  export namespace providers {
    class Web3Provider {
      constructor(provider: any);
      getBalance(address: string): Promise<any>;
      listAccounts(): Promise<string[]>;
      getSigner(): Signer;
    }
  }

  export class Signer {
    getAddress(): Promise<string>;
    sendTransaction(transaction: any): Promise<TransactionResponse>;
  }

  export interface TransactionResponse {
    hash: string;
    wait(): Promise<TransactionReceipt>;
  }

  export interface TransactionReceipt {
    blockNumber: number;
    blockHash: string;
    transactionIndex: number;
    confirmations: number;
    status: number;
  }
} 