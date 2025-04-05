"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Download, RefreshCw, CheckCircle } from "lucide-react";

export function MetaMaskHelp() {
  const reloadPage = () => {
    window.location.reload();
  };

  const openMetaMaskSite = () => {
    window.open("https://metamask.io/download/", "_blank");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          MetaMask Not Detected
        </CardTitle>
        <CardDescription>
          To use Web3 features, you need to install and configure MetaMask
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="install">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="install">Install</TabsTrigger>
            <TabsTrigger value="config">Configure</TabsTrigger>
            <TabsTrigger value="troubleshoot">Troubleshoot</TabsTrigger>
          </TabsList>

          <TabsContent value="install" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Install the MetaMask extension</h3>
              <p className="text-sm text-muted-foreground">
                MetaMask is a browser extension that allows you to interact with blockchain applications.
              </p>
              <Button 
                onClick={openMetaMaskSite}
                className="mt-2 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download MetaMask
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">2. Create or import a wallet</h3>
              <p className="text-sm text-muted-foreground">
                After installing, follow MetaMask's instructions to create a new wallet or import an existing one.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">3. Refresh this page</h3>
              <p className="text-sm text-muted-foreground">
                After setup is complete, refresh this page to detect your MetaMask wallet.
              </p>
              <Button 
                variant="outline" 
                onClick={reloadPage}
                className="mt-2 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Unlock your MetaMask wallet</h3>
              <p className="text-sm text-muted-foreground">
                Make sure your MetaMask wallet is unlocked (click the extension icon and enter your password if needed).
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">2. Connect to the right network</h3>
              <p className="text-sm text-muted-foreground">
                Ensure you're connected to a compatible network like Ethereum Mainnet, Polygon, or a testnet.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-2 text-sm p-2 bg-muted rounded-md">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Ethereum Mainnet
                </div>
                <div className="flex items-center gap-2 text-sm p-2 bg-muted rounded-md">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Polygon
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">3. Allow site connection</h3>
              <p className="text-sm text-muted-foreground">
                When prompted by MetaMask, allow this site to connect to your wallet.
              </p>
              <div className="flex items-center gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                <CheckCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>Only connect to websites you trust. Never share your secret recovery phrase.</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="troubleshoot" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Common Issues</h3>
              <ul className="list-disc pl-5 text-sm space-y-2">
                <li>
                  <strong>MetaMask is locked</strong> - Click the MetaMask icon in your browser and unlock it with your password
                </li>
                <li>
                  <strong>Browser is blocking extensions</strong> - Make sure your browser allows extensions and MetaMask has permissions
                </li>
                <li>
                  <strong>Old version</strong> - Update to the latest version of MetaMask from the extension store
                </li>
                <li>
                  <strong>Privacy mode enabled</strong> - In MetaMask settings, ensure that "Privacy Mode" is disabled or allow this site
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Try these steps:</h3>
              <ol className="list-decimal pl-5 text-sm space-y-2">
                <li>Refresh the page</li>
                <li>Restart your browser</li>
                <li>Disconnect and reconnect MetaMask</li>
                <li>Try a different browser</li>
                <li>Ensure you have funds in your wallet (even a small amount)</li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4 text-sm text-muted-foreground">
        <div>Need help? Visit <a href="https://metamask.io/faqs/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">MetaMask support</a></div>
        <Button size="sm" variant="ghost" onClick={reloadPage} className="gap-2">
          <RefreshCw className="h-3 w-3" />
          Retry
        </Button>
      </CardFooter>
    </Card>
  );
} 