import { WebContainer } from "@webcontainer/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFiles } from "@/Features/Hooks/use-files";
import { buildFileTree, getFilePath } from "../Utils/file-tree";


let webContainerInstance : WebContainer | null = null
let bootPromise : Promise<WebContainer> | null = null



export const getWebContainer = async() => {
    if(webContainerInstance) return webContainerInstance

    if(!bootPromise){
        bootPromise = WebContainer.boot({coep : "credentialless"})
    }

    webContainerInstance = await bootPromise

    return webContainerInstance

}

export const tearDownWebContainer = async() => {
    if(webContainerInstance){
         webContainerInstance.teardown()
         webContainerInstance = null
    }

     bootPromise = null
}

interface useWebContainerProps {
    projectId : Id<"projects">,
    enabled : boolean,
    settings? : {
        installCommand? : string,
        devCommand? : string
    }
}

export const useWebContainer = ({
    projectId,
    enabled,
    settings
}:useWebContainerProps ) => {
    const [status,setStatus] = useState<"idle"| "running"|"booting"|"installing"|"error">("idle")
    const [previewUrl, setpreviewUrl] = useState<string | null>(null);
    const [error, seterror] = useState<string|null>(null);
    const [restartKey, setrestartKey] = useState(0);
    const [terminalOutput, setterminalOutput] = useState("");

    const containerRef = useRef<WebContainer | null>(null)
    const hasStartedRef = useRef(false)

    const files = useFiles(projectId)

    useEffect(() => {
      if(!enabled || files?.length === 0 || !files || hasStartedRef.current){
        return 
      }
      hasStartedRef.current = true

      const start = async() => {
          try {
            setStatus("booting"),
            seterror(null)
            setterminalOutput("")
    
            const appendOutput = (data : string) => {
                setterminalOutput((prev) => prev + data)
            }
    
            const container = await getWebContainer()
            containerRef.current = container
            console.log(files)
    
            const fileTree = buildFileTree(files)
            await container.mount(fileTree)
    
            container.on("server-ready",(port,url)=> {
                setpreviewUrl(url),
                setStatus("running")
            })
    
            setStatus("installing")
            const installCmd = settings?.installCommand || "npm install"
            const [installBin,...installArgs] = installCmd.split(" ")
            appendOutput(`$${installCmd}\n`)

            const installProcess = await container.spawn(installBin,installArgs,{
              cwd: "/",
            });
            installProcess.output.pipeTo(
                new WritableStream({
                    write(data) {
                        appendOutput(data)
                    }
                })
            )

            const installExitCode = await installProcess.exit
            if(installExitCode !== 0){
                throw new Error(
                    `${installCmd} failed with code ${installExitCode}`)
            }

            const devCmd = settings?.devCommand || "npm run dev"
            const [devBin,...devArgs] = devCmd.split(" ")
            appendOutput(`$${devCmd}\n`)

            const devProcess = await container.spawn(devBin,devArgs,{
              cwd: "/",
            });
            devProcess.output.pipeTo(
                new WritableStream({
                    write(data) {
                        appendOutput(data)
                    }
                })
            )



        } catch (error) {
            seterror(error instanceof Error ? error.message : "Unknown Error")
            setStatus("error")
          
        }
        
      }

      start()

    }, [enabled,files,restartKey,settings?.devCommand,settings?.installCommand]);



    // Sync file changes (hot-reload)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !files || status !== "running") return;

    const filesMap = new Map(files.map((f) => [f._id, f]));

    for (const file of files) {
      if (file.type !== "file" || file.storageId || !file.content) continue;

      const filePath = getFilePath(file, filesMap);
      container.fs.writeFile(filePath, file.content);
    }
  }, [files, status]);

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      hasStartedRef.current = false;
      setStatus("idle");
      setpreviewUrl(null);
      seterror(null);
    }
  }, [enabled]);

  // Restart the entire WebContainer process
  const restart = useCallback(() => {
    tearDownWebContainer()
    containerRef.current = null;
    hasStartedRef.current = false;
    setStatus("idle");
    setpreviewUrl(null);
    seterror(null);
    setrestartKey((k) => k + 1);
  }, []);

  return {
    status,
    previewUrl,
    terminalOutput,
    error,
    restart
  }

}

