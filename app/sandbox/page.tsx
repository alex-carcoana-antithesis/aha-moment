import { ArrowUpRight } from "lucide-react";

import { BugPickerView } from "@/components/bug-picker";
import { GithubUsernameForm } from "@/components/github-username-form";
import Image from "next/image";

const REPOS: { name: string; description: string; href: string }[] = [
  {
    name: "aardvark-arena",
    description: "Checkout how we test the frontend and backend of a simple matchmaking system using Antithesis.",
    href: "https://github.com/antithesishq/aardvark-arena/tree/main",
  },
 
];

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.19a11.05 11.05 0 0 1 5.79 0c2.21-1.5 3.18-1.19 3.18-1.19.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export default function TutorialsPage() {
  return (
    <main className="w-full pt-24 pb-24 mx-auto max-w-[1200px] flex flex-col gap-[128px]">
      <div>
        <BugPickerView /> 
      </div>

    </main>
  );
}

