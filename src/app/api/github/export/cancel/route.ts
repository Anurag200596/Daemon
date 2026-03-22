import { convex } from "@/lib/convex-client";
import { auth} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";
import { api } from "../../../../../../convex/_generated/api";
import { inngest } from "@/inngest/client";
import { Id } from "../../../../../../convex/_generated/dataModel";


const requestSchema = z.object({
    projectId : z.string()
})


export async function POST(request: Request) {
    const { userId } = await auth()

    if (!userId) return NextResponse.json({ error: "UnAuthorized" }, { status: 401 })

    const body = await request.json()

    const { projectId } = requestSchema.parse(body)

    const internalKey = process.env.DAEMON_CONVEX_INTERNAL_KEY

    if (!internalKey) return NextResponse.json({ error: "Server configuration Error" }, { status: 500 })


    await inngest.send({
        name: "github/export.cancel",
        data: {
            projectId
        }
    }
    )

    await convex.mutation(api.system.UpdateExportStatus,{
        projectId : projectId as Id<"projects">,
        internalKey,
        status : "cancelled"
    })

    return NextResponse.json({
        success: true,
    })
}