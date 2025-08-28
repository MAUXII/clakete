import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Clakete",
  description: "Sign in to your Clakete account"
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
