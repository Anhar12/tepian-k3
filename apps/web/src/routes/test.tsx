import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/test")({
  component: RouteComponent,
});

function RouteComponent() {
  const [message, setMessage] = useState("");

  const testMutation = useMutation(
    trpc.test.broadcastTestEvent.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Test event broadcasted successfully");
      },
      onError: (error) => {
        globalErrorToast("Failed to broadcast test event: " + error.message);
      },
    }),
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Test Event Bus</h1>
      <Input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter test message"
      />
      <Button
        onClick={() => testMutation.mutate({ message })}
        className="rounded bg-blue-500 p-2 text-white"
        disabled={testMutation.isPending}
      >
        {testMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Broadcast Test Event
      </Button>
    </div>
  );
}
