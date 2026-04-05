"use client"

import dynamic from "next/dynamic"

const RegisterForm = dynamic(() => import("@/components/register-form"), {
  ssr: false,
})

export default function RegisterPage() {
  return <RegisterForm />
}
