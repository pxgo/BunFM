import "./index.css";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertTitle } from "../components/ui/alert";
import { RotateCw, Play, Pause, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioPlayer } from "./hooks/use-audio-player";

export const App = () => {
  const { isPlaying, isLoading, error, togglePlay, retryCount } =
    useAudioPlayer("/fm");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/30 backdrop-blur-lg border-gray-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Bun FM
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-6">
          <div className="relative w-48 h-48">
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20",
                isPlaying ? "animate-pulse" : "",
              )}
            >
              <div className="absolute inset-4 rounded-full bg-gray-900 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-20 h-20 rounded-full hover:bg-cyan-500/20 transition-all"
                  onClick={togglePlay}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RotateCw className="text-cyan-400 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="text-cyan-400" />
                  ) : (
                    <Play className="text-cyan-400 ml-2" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-center">
            <h3 className="text-xl font-semibold text-cyan-400">Now Playing</h3>
            <p className="text-gray-300">
              <div>GitHub v0.1.1</div>
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          {error && (
            <Alert variant="destructive" className="animate-pulse">
              <WifiOff className="h-4 w-4" />
              <AlertTitle>
                Connection Error (Retrying {retryCount}/3)
              </AlertTitle>
            </Alert>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

/*
import "./index.css";
import { APITester } from "./APITester.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";

import logo from "./logo.svg";
import reactLogo from "./react.svg";

export function App() {
  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <div className="flex justify-center items-center gap-8 mb-8">
        <img
          src={logo}
          alt="Bun Logo"
          className="h-36 p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#646cffaa] scale-120"
        />
        <img
          src={reactLogo}
          alt="React Logo"
          className="h-36 p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa] [animation:spin_20s_linear_infinite]"
        />
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-muted">
        <CardContent className="pt-6">
          <h1 className="text-5xl font-bold my-4 leading-tight">Bun + React</h1>
          <p>
            Edit{" "}
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
              src/App.tsx
            </code>{" "}
            and save to test HMR
          </p>
          <APITester />
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
*/
