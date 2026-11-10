import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
export default function Home(){
 return <main className="landing container" id="main-content">
 <p>Australian Disability Ltd</p><h1>AD<span className="accent">.iD</span></h1>
 <h2>Your services, your choice.</h2><p>Secure and accessible access to Australian Disability services.</p>
 <SignedOut><Link className="primary-button" href="/sign-in">Sign in securely</Link></SignedOut>
 <SignedIn><Link className="primary-button" href="/dashboard">Go to your services</Link></SignedIn>
 <p>AD.iD sign-in does not automatically grant access to other applications.</p>
 </main>;
}
