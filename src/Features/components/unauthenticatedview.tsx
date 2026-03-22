import { Button } from "@/components/ui/button";
import { Item,ItemActions,ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { ShieldAlertIcon } from "lucide-react";



export const UnAuthenticatedView = () =>{
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-full max-w-lg bg-muted">
                <Item variant="outline">
                    <ItemMedia>
                        <ShieldAlertIcon></ShieldAlertIcon>
                    </ItemMedia>
                   
                        <ItemContent>
                            <ItemTitle>UnAuthorized Access</ItemTitle>
                            <ItemDescription>
                                You are not authorized to access this resource.
                            </ItemDescription>
                        </ItemContent>
                    <ItemActions>
                        <SignInButton>
                            <Button variant="outline">
                                Sign in
                            </Button>
                        </SignInButton>
                        <SignUpButton>
                            <Button variant="outline">
                            Sign up

                            </Button>
                        </SignUpButton>
                    </ItemActions>

                </Item>

            </div>

        </div>
    )
}
