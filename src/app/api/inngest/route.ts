import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { demoError, demoGenerate } from "@/inngest/functions";
import { processMessage } from "@/Features/conversations/inggest/process-message";
import { importGithubRepo } from "@/Features/Projects/inngest/create-project-repo";
import { exportToGithub } from "@/Features/Projects/inngest/export-to-github";



// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processMessage,
    importGithubRepo,
    exportToGithub
  ],
});

/*
===========================
EXPLANATION / COMMENTS
===========================

1) PURPOSE OF THIS FILE
----------------------
This file exposes an API endpoint that Inngest uses to communicate
with your application.

It does NOT trigger events.
It does NOT call inngest.send().

Its only job is to:
- Receive events from Inngest Cloud
- Execute the matching Inngest functions


2) serve FROM "inngest/next"
----------------------------
- Creates a Next.js-compatible API handler.
- Handles webhooks, retries, and execution for Inngest.
- Automatically wires HTTP methods (GET, POST, PUT).


3) INNGEST CLIENT
-----------------
import { inngest } from "../../../inngest/client";

- This is the same Inngest client used everywhere:
  - inngest.createFunction()
  - inngest.send()
  - serve()

- It identifies your app to Inngest.


4) FUNCTION REGISTRATION
-----------------------
functions: [ demoGenerate ]

- Registers the demoGenerate function with Inngest.
- When an event with name "demo/generate" arrives,
  Inngest runs demoGenerate.


5) EXPORTED HTTP METHODS
------------------------
export const { GET, POST, PUT } = serve(...)

- Next.js automatically exposes these methods
  at the API route (commonly /api/inngest).
- Inngest Cloud sends events to this endpoint.


6) IMPORTANT: WHERE inngest.send() IS CALLED
---------------------------------------------
ingest.send() is NOT called here.

It must be called elsewhere, for example:
- API routes
- Server actions
- Background jobs
- After DB operations

Example:
await inngest.send({ name: "demo/generate" });


7) FULL FLOW SUMMARY
-------------------
1. Some part of your app calls inngest.send()
2. Event reaches Inngest Cloud
3. Inngest calls this API endpoint
4. serve() matches the event to demoGenerate
5. demoGenerate function executes

===========================
END OF EXPLANATION
===========================
*/
