import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "ATHLETE";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "ATHLETE";
  }
}
