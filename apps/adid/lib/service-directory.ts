export const PUBLIC_SERVICES = [
 {id:"mapable",name:"MapAble",href:"https://mapable.com.au/",description:"Accessibility, support and community resources."},
 {id:"accessibooks",name:"AccessiBooks",href:"https://accessibooks.com.au/",description:"Accessible reading and listening."},
 {id:"disapedia",name:"Australian Disapedia",href:"https://disapedia.au/",description:"Disability-led knowledge and policy."},
 {id:"cripsquare",name:"CripSquare",href:"https://cripsquare.au/",description:"Community conversations and connections."}
] as const;
const hosts = new Set(["mapable.com.au","accessibooks.com.au","disapedia.au","cripsquare.au"]);
export function verifiedPublicHref(raw: unknown) {
 if (typeof raw !== "string") return null;
 try {const u=new URL(raw);return u.protocol==="https:"&&hosts.has(u.hostname)&&!u.port&&!u.username&&!u.password?u.toString():null;} catch{return null;}
}
export function claimsOk(issuer:unknown,subject:unknown){
 if(typeof issuer!=="string"||typeof subject!=="string"||!subject.trim()||subject.length>255)return false;
 try {const u=new URL(issuer);return u.protocol==="https:"&&!u.username&&!u.password&&!u.hash&&!u.search;}catch{return false;}
}
