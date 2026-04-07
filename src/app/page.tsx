import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PLATFORM_NAME } from "@/lib/platform"

export const dynamic = "force-dynamic"

const features = [
  {
    title: "Meal Plans",
    description: "Build personalised weekly meal plans for each client. Templates, column fill, and instant sync to Google Sheets.",
  },
  {
    title: "Progress Tracking",
    description: "Clients log weight, measurements, and notes. You see the trend. All data lives in their own Google Sheet.",
  },
  {
    title: "Appointment Booking",
    description: "Clients request sessions, you confirm with date and time. Email notifications keep everyone in the loop.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gf-black text-white flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-16 pb-10">
        <h1 className="text-5xl sm:text-6xl font-bold mb-3">
          <span className="text-gf-pink">{PLATFORM_NAME}</span>
        </h1>
        <p className="text-gf-muted text-lg max-w-md mb-8">
          The coaching portal built for personal trainers and nutritionists who actually use Google Sheets.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link href="/register/coach">
            <Button size="lg">Start Free 14-Day Trial</Button>
          </Link>
          <p className="text-gf-muted text-sm">
            No credit card required.{" "}
            <Link href="/login" className="text-gf-pink hover:underline">
              Already have an account?
            </Link>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-10 max-w-4xl mx-auto w-full">
        <div className="grid sm:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title}>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gf-muted text-sm leading-relaxed">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Google Sheets callout */}
      <section className="px-6 pb-12 max-w-2xl mx-auto text-center">
        <h2 className="text-xl font-bold mb-3">Your data, your way</h2>
        <p className="text-gf-muted text-sm leading-relaxed">
          Every client gets their own Google Sheet in your Drive. No proprietary exports, no lock-in.
          Connect once and every update syncs instantly. Your clients can&apos;t see each other&apos;s data.
        </p>
      </section>
    </div>
  )
}
