"use client";

import { useState } from "react";

import Bridge from "@/app/Bridge";
import Faucet from "@/app/Faucet";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [showBridge, setShowBridge] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6">
      <div className="flex flex-col items-center gap-4 mb-4">
        <h1 className="text-4xl font-bold text-center">
          USde Token Manager by CapyPolls
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBridge(!showBridge)}
        >
          {showBridge ? "Switch to Faucet" : "Switch to Bridge"}
        </Button>
      </div>
      <p className="text-zinc-500 mb-8">
        {showBridge ? (
          "Bridge tokens across different networks"
        ) : (
          <>
            Get test USDe to use on{" "}
            <a
              href="https://capypolls.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              CapyPolls
            </a>
          </>
        )}
      </p>
      {showBridge ? <Bridge /> : <Faucet />}
    </main>
  );
}
