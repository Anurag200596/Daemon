import { ProjectIdLayout } from "@/Features/Projects/components/projectIdLayout"
import { Id } from "../../../../convex/_generated/dataModel"


const Layout = async({children,params} : {children : React.ReactNode;params: Promise<{projectId : string}>}) =>{

    const {projectId} = await params

    return (
        <>
        <ProjectIdLayout projectId = {projectId as Id<"projects">}>
        
        {children}

        </ProjectIdLayout>
        
        </>
    )

}

export default Layout


// import { ProjectIdLayout } from "@/Features/Projects/components/projectIdLayout";
// import { Id } from "../../../../convex/_generated/dataModel";

// const Layout = async ({
//   children,
//   params,
// }: {
//   children: React.ReactNode;
//   params: Promise<{ projectId: string }>
// }) => {
//   const { projectId } = await params;

//   return (
//     <ProjectIdLayout
//       projectId={projectId as Id<"projects">}
//     >
//       {children}
//     </ProjectIdLayout>
//   );
// }
 
// export default Layout;