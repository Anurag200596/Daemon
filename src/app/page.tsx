import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProjectsView } from "@/Features/Projects/components/ProjectsView";
import { api } from "../../convex/_generated/api";

export default function Home() {
  return (
<ProjectsView/>
   
  );
}
