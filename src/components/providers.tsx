"use client"

import { ClerkProvider, SignInButton, SignUpButton, useAuth, UserButton } from "@clerk/nextjs"
import { Authenticated, AuthLoading, ConvexProvider, ConvexReactClient, Unauthenticated } from "convex/react"
import {ConvexProviderWithClerk} from "convex/react-clerk"
import { ThemeProvider } from "./themeprovider";
import { UnAuthenticatedView } from "@/Features/components/unauthenticatedview";
import { AuthLoadingView } from "@/Features/components/authloading";




const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const Providers = ({children} : {children : React.ReactNode}) =>{
  return (
    <ClerkProvider>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider
         attribute="class"
         defaultTheme="dark"
         enableSystem
         disableTransitionOnChange
         >
          <Authenticated>
            {children}

          </Authenticated>
          <Unauthenticated>
           <UnAuthenticatedView/>
          </Unauthenticated>
          <AuthLoading>
          <AuthLoadingView/>
          </AuthLoading>
        </ThemeProvider>

        </ConvexProviderWithClerk>
    </ClerkProvider>
  )

}