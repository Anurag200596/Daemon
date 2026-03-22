import { generateText } from "ai";
import { inngest } from "./client";
import { google } from "@ai-sdk/google";
import Firecrawl from "@mendable/firecrawl-js";
import { FireCrawl } from "@/lib/firecrawl";


const URL_REGEX = /https?:\/\/[^\s]+/g;
export const demoGenerate = inngest.createFunction(
  { id: "genrate-data" },
  { event: "demo/generate" },
  async ({ event, step }) => {

    const {prompt} = event.data as {prompt : string};

    const urls = await step.run("collect-urls",async() => {
        return prompt.match(URL_REGEX) ?? [];
    }) as string[]

    const scrapedContent =  await step.run("scrape-content",async() => {
        const results = await Promise.all(
            urls.map(async (url) => {
                const result = FireCrawl.scrape(
                    url,
                    {formats : ["markdown"]}
                );
                return (await result).markdown ?? null;
            })
        )
        return results.filter(Boolean).join("\n\n")

    })

    const finalPrompt = scrapedContent ? `context : \n ${scrapedContent}\n\n Question : ${prompt}`:prompt



    await step.run("genearate-text", async () => {
      return await generateText({
        model: google("gemini-2.5-flash"),
        prompt:finalPrompt
      })
    })
  },
);

export const demoError = inngest.createFunction(
  {id : "generate-error"},
  {event : "demo/generate"},
  async({step}) => {
    await step.run("fail", async() => {
      throw new Error("This is an Inngest Error")

    })
  }

)

/*
===========================
EXPLANATION / COMMENTS
===========================

1) IMPORTS
----------
- generateText:
  Function from the AI SDK used to send a prompt to a language model
  and receive generated text as a response.

- inngest:
  The configured Inngest client. It is used to define event-driven
  background functions that run when specific events occur.

- google:
  AI SDK adapter that allows usage of Google Gemini models.


2) inngest.createFunction
-------------------------
This defines an Inngest background function.
The function does NOT run immediately — it runs only when its
associated event is triggered.


3) FUNCTION ID
--------------
{ id: "genrate-data" }

- A unique identifier for this function inside Inngest.
- Used for logging, retries, and monitoring in the Inngest dashboard.


4) EVENT TRIGGER
----------------
{ event: "demo/generate" }

- This function executes only when the "demo/generate" event is sent.
- Example trigger:
  inngest.send({ name: "demo/generate" })


5) FUNCTION HANDLER
------------------
async ({ step }) => { ... }

- Inngest passes a context object.
- `step` is used to define named, retryable steps.


6) step.run
-----------
step.run("genearate-text", async () => { ... })

- Creates a tracked step named "genearate-text".
- Inngest can retry this step automatically if it fails.
- Each step appears separately in the Inngest dashboard.


7) generateText CALL
--------------------
generateText({
  model: google("gemini-2.5-flash"),
  prompt: "Give me a recipie for lasagna for 4 people"
})

- Uses the Google Gemini 2.5 Flash model.
- Sends a text prompt to the model.
- Returns generated text along with metadata
  (token usage, finish reason, etc).


8) OVERALL FLOW
---------------
1. "demo/generate" event is fired
2. Inngest function starts running
3. "genearate-text" step executes
4. Gemini generates a lasagna recipe
5. Result is stored as the step output

===========================
END OF EXPLANATION
===========================
*/

// 9) PROMPT PROCESSING & CONTEXT ENRICHMENT
// ----------------------------------------
// This section prepares the final prompt that will be sent to the AI
// by optionally enriching it with external web content.

// - The `prompt` is extracted from the event payload and explicitly
//   typed to ensure TypeScript safety.

// - URLs are extracted from the prompt using a regular expression.
//   If no URLs are found, an empty array is returned to avoid errors.
//   This logic runs inside an Inngest step so it can be retried and
//   tracked independently.

// - If URLs exist, each URL is scraped in parallel using FireCrawl.
//   The scraped content is requested in markdown format.

// - Any failed or empty scrape results are safely ignored.
//   Only valid markdown content is kept.

// - All scraped markdown content is merged into a single string,
//   separated by blank lines for readability.

// - If scraped content exists, it is prepended to the original prompt
//   as contextual information. Otherwise, the original prompt is used
//   unchanged.

// This approach allows the AI to answer user questions with additional
// real-world context when URLs are provided, while remaining efficient
// and safe when no external data is needed.

