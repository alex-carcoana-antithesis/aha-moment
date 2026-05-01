import { Button } from "@/components/ui/button";
import { BugIcon, Calendar, Terminal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center px-6 pt-24 pb-24">
      <span className="inline-flex items-center rounded-full border border-[#917eff]/40 bg-[#917eff]/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#c9bfff]">
        Release with certainty
      </span>

      <h3 className="mt-10 max-w-[22ch] text-center font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl">
        Bug-free systems, unlimited velocity: Unleash your agents
      </h3>
      <div className="flex gap-2">
      <Button
        variant="default"
        size="lg"
        className="mt-10 cursor-pointer bg-[#917eff] hover:bg-[#a89af0] text-[#0a0826] text-[15px] transition-colors"
      >
        <Calendar className="h-4 w-4" />
        Book a demo
      </Button>
      <Link href="/sandbox" >
      <Button
        variant="secondary"
        size="lg"
        className="mt-10 cursor-pointer bg-transparent text-[#917eff] hover:bg-transparent hover:text-white text-[15px] transition-colors"
      >
       What&rsquo;s your favorite bug?
      </Button>
      </Link>
      </div>

      <div className="mt-20 w-full max-w-6xl px-4">
        <div className="overflow-hidden rounded-md border border-white/10 bg-black/40 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
          <Image
            src="/dashboard.png"
            alt="Antithesis dashboard"
            width={2400}
            height={1400}
            className="h-auto w-full"
            priority
          />
        </div>
      </div>
    </main>
  );
}
