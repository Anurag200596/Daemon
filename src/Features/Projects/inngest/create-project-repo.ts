// HTTP client used for uploading binary data to Convex storage
import ky from "ky";

// Official GitHub SDK used to communicate with GitHub API
import { Octokit } from "octokit";

// Library used to detect whether a file is binary (image, pdf, etc)
import { isBinaryFile } from "isbinaryfile";

// Error type from Inngest used when a job should not retry
import { NonRetriableError } from "inngest";

// Convex client used to call Convex mutations from backend
import { convex } from "@/lib/convex-client";

// Inngest client used to create background functions
import { inngest } from "@/inngest/client";

// Generated Convex API types for calling mutations
import { api } from "../../../../convex/_generated/api";

// Convex ID type helper
import { Id } from "../../../../convex/_generated/dataModel";


// Type definition describing the event payload
// This is the data sent when triggering the import job
interface ImportGithubRepoEvent {
  owner: string;            // GitHub repository owner
  repo: string;             // Repository name
  projectId: Id<"projects">;// Convex project ID where files will be imported
  githubToken: string;      // GitHub personal access token
}


// Create an Inngest background function
export const importGithubRepo = inngest.createFunction(
  {
    id: "import-github-repo", // Unique identifier for this function

    // This runs automatically if the function fails
    onFailure: async ({ event, step }) => {

      // Internal security key used to authorize Convex mutations
      const internalKey = process.env.DAEMON_CONVEX_INTERNAL_KEY;

      // If key doesn't exist just stop
      if (!internalKey) return;

      // Extract projectId from event payload
      const { projectId } = event.data.event.data as ImportGithubRepoEvent;

      // Update project import status to "failed"
      await step.run("set-failed-status", async () => {
        await convex.mutation(api.system.UpdateImportStatus, {
          internalKey,
          projectId,
          status: "failed",
        });
      });
    },
  },

  // This function runs when this event is triggered
  { event: "github/import.repo" },

  // Main function logic
  async ({ event, step }) => {

    // Extract repository information from event
    const { owner, repo, projectId, githubToken } =
      event.data as ImportGithubRepoEvent;

    // Load internal Convex key from environment
    const internalKey = process.env.DAEMON_CONVEX_INTERNAL_KEY;

    // If key missing, stop execution completely
    if (!internalKey) {
      throw new NonRetriableError("DAEMON_CONVEX_INTERNAL_KEY is not configured");
    };

    // Create GitHub API client authenticated with user token
    const octokit = new Octokit({ auth: githubToken });

    // STEP 1: Cleanup any previously imported files in this project
    await step.run("cleanup-project", async () => {
      await convex.mutation(api.system.cleanUp, { 
        internalKey,
        projectId
      });
    });

    // STEP 2: Fetch repository file tree from GitHub
    const tree = await step.run("fetch-repo-tree", async () => {
      try {

        // Try to fetch tree from "main" branch
        const { data } = await octokit.rest.git.getTree({
          owner,
          repo,
          tree_sha: "main",
          recursive: "1", // recursively fetch entire folder structure
        });

        return data;

      } catch {

        // If "main" doesn't exist, fallback to "master"
        const { data } = await octokit.rest.git.getTree({
          owner,
          repo,
          tree_sha: "master",
          recursive: "1",
        });

        return data;
      }
    });

    // Sort folders so parent folders are created before child folders
    // Example:
    // src
    // src/components
    // src/components/ui
    const folders = tree.tree
      .filter((item) => item.type === "tree" && item.path) // keep only folders
      .sort((a, b) => {

        // calculate folder depth
        const aDepth = a.path ? a.path.split("/").length : 0;
        const bDepth = b.path ? b.path.split("/").length : 0;

        // shallow folders first
        return aDepth - bDepth;
      });

    // STEP 3: Create folders inside Convex
    const folderIdMap = await step.run("create-folders", async () => {

      // object to store mapping between path and folderId
      const map: Record<string, Id<"files">> = {};

      for (const folder of folders) {

        // skip if folder path missing
        if (!folder.path) {
          continue;
        }

        // break path into parts
        const pathParts = folder.path.split("/");

        // folder name (last part)
        const name = pathParts.pop()!;

        // parent folder path
        const parentPath = pathParts.join("/");

        // get parent folder id from map
        const parentId = parentPath ? map[parentPath] : undefined;

        // create folder in database
        const folderId = await convex.mutation(api.system.createFolder, {
          internalKey,
          projectId,
          name,
          parentId,
        });

        // store folderId in map
        map[folder.path] = folderId;
      }

      // return folder mapping
      return map;
    });

    // STEP 4: Extract all files (blobs) from GitHub tree
    const allFiles = tree.tree.filter(
      (item) => item.type === "blob" && item.path && item.sha
    );

    // STEP 5: Download and import files
    await step.run("create-files", async () => {

      // loop through every file
      for (const file of allFiles) {

        // skip if invalid
        if (!file.path || !file.sha) {
          continue;
        }

        try {

          // Fetch actual file content from GitHub
          const { data: blob } = await octokit.rest.git.getBlob({
            owner,
            repo,
            file_sha: file.sha,
          });

          // Convert base64 GitHub content into binary buffer
          const buffer = Buffer.from(blob.content, "base64");

          // Detect whether the file is binary
          const isBinary = await isBinaryFile(buffer);

          // Split file path into segments
          const pathParts = file.path.split("/");

          // Extract file name
          const name = pathParts.pop()!;

          // Parent folder path
          const parentPath = pathParts.join("/");

          // Get parent folder id
          const parentId = parentPath ? folderIdMap[parentPath] : undefined;

          // If file is binary (image, pdf, etc)
          if (isBinary) {

            // Ask Convex to generate a temporary upload URL
            const uploadUrl = await convex.mutation(
              api.system.generateUploadUrl,
              { internalKey }
            );

            // Upload binary buffer to storage
            const { storageId } = await ky
              .post(uploadUrl, {
                headers: { "Content-Type": "application/octet-stream" },
                body: buffer,
              })
              .json<{ storageId: Id<"_storage"> }>();

            // Save file metadata in database
            await convex.mutation(api.system.createBinaryFile, {
              internalKey,
              projectId,
              name,
              storageId,
              parentId,
            });

          } else {

            // Convert buffer to readable UTF-8 text
            const content = buffer.toString("utf-8");

            // Store text file directly in database
            await convex.mutation(api.system.createFile, {
              internalKey,
              projectId,
              name,
              content,
              parentId,
            });
          }

        } catch {

          // Log file import error but continue processing others
          console.error(`Failed to import file: ${file.path}`);
        }
      }
    });

    // STEP 6: Mark project import as completed
    await step.run("set-completed-status", async () => {
      await convex.mutation(api.system.UpdateImportStatus, {
        internalKey,
        projectId,
        status: "completed",
      });
    });

    // Return success response
    return { success: true, projectId };
  }
);