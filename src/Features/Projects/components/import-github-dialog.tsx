import { useClerk } from "@clerk/clerk-react";
import { useForm } from "@tanstack/react-form";
import ky, { HTTPError } from "ky";
import z from "zod";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";


const formSchema = z.object({
    url: z.url("Please enter a valid URL")
}
)

interface GithubDialogBoxProps {
    open: boolean,
    onOpenChange: (open: boolean) => void
}

export const ImportDialogBox = ({
    open, onOpenChange
}: GithubDialogBoxProps) => {

    const router = useRouter()
    const { openUserProfile } = useClerk()

    const form = useForm({
        defaultValues: {
            url: ""
        },
        validators: {
            onSubmit: formSchema
        },
        onSubmit: async ({ value }) => {
            try {
                const { projectId } = await ky.post("/api/github/import", {
                    json: {
                        url: value.url
                    }
                }).json<{
                    success: boolean,
                    projectId: Id<"projects">
                }>()

                toast.success("Importing Repository...")

                onOpenChange(false)
                form.reset()

                router.push(`/projects/${projectId}`)


            } catch (error) {
                if (error instanceof HTTPError) {
                    const body = await error.response.json<{ error: string }>()
                    if (body?.error?.includes("Github not connected")) {
                        toast.error("Github account not connected", {
                            action: {
                                label: "Connect",
                                onClick: () => openUserProfile()
                            }
                        })
                        onOpenChange(false)
                        return
                    }
                }
                toast.error("Unable to import Repository. Please check the URL and try again.")

            }
        }

    })
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import from GitHub</DialogTitle>
              <DialogDescription>
                Enter a GitHub repository URL to import. A new project will be
                created with the repository contents.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <form.Field name="url">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
    
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Repository URL
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="https://github.com/owner/repo"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button 
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                    >
                      {isSubmitting ? "Importing..." : "Import"}
                    </Button>
                  )}
                </form.Subscribe>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );

}
