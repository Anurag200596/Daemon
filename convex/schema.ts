import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    projects: defineTable({
        name:v.string(),
        ownerId : v.string(),
        updatedAt : v.number(),
        importStatus:v.optional(
            v.union(
                v.literal("importing"),
                v.literal("completed"),
                v.literal("failed")
            ),
        ),
        exportStatus : v.optional(
            v.union(
                v.literal("exporting"),
                v.literal("completed"),
                v.literal("failed"),
                v.literal("cancelled")
            )
        ),
        exportRepoUrl : v.optional(v.string()),
        settings : v.optional(
            v.object({
                installCommand : v.optional(v.string()),
                devCommand : v.optional(v.string())
            })
        )
    }).index("by_owner",["ownerId"]),

    files: defineTable({
        projectId : v.id("projects"),
        parentId : v.optional(v.id("files")),
        name : v.string(),
        type : v.union(v.literal("file"),v.literal("folder")),
        content : v.optional(v.string()),
        storageId : v.optional(v.id("_storage")),
        updatedAt : v.number()
    }).index("by_projectId",["projectId"])
    .index("by_parentId",["parentId"])
    .index("by_project_parent", ["projectId", "parentId"]),

    conversations : defineTable({
        projectId : v.id("projects"),
        updatedAt : v.number(),
        title : v.string()
    }).index("by_project",["projectId"]),

    messages : defineTable({
        projectId : v.id("projects"),
        content : v.string(),
        conversationId : v.id("conversations"),
        role : v.union(v.literal("user"),v.literal("assistant")),
        status : v.optional(v.union(v.literal("processing"),v.literal("completed"),v.literal("cancelled")))

    }).index("by_conversation",["conversationId"])
    .index("by_project_status",["projectId","status"]),

})