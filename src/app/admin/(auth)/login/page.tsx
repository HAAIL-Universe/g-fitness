"use client"

import dynamic from "next/dynamic"

const AdminLoginForm = dynamic(
  () => import("@/components/admin/admin-login-form"),
  { ssr: false }
)

export default function AdminLoginPage() {
  return <AdminLoginForm />
}
