import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <SignUp
        appearance={{
          elements: {
            rootBox: "shadow-2xl rounded-2xl",
            card: "rounded-2xl",
          },
        }}
        signInUrl="/auth/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
