import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
export const metadata:Metadata = {title:"AD.iD | Australian Disability",description:"Your secure account gateway for Australian Disability services."};
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <ClerkProvider><html lang="en-AU"><body><a className="skip-link" href="#main-content">Skip to main content</a>{children}</body></html></ClerkProvider>;
}
