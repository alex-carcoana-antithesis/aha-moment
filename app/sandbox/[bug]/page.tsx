import { notFound } from "next/navigation";

import { BugDetailView } from "@/components/bug-detail-view";
import { PICKER_BUGS, type PickerBugId } from "@/lib/picker-bugs";

import "./bug-detail.css";

const VALID_BUG_IDS = PICKER_BUGS.map((b) => b.id);

export function generateStaticParams() {
  return VALID_BUG_IDS.map((bug) => ({ bug }));
}

export default async function TutorialBugPage({
  params,
}: {
  params: Promise<{ bug: string }>;
}) {
  const { bug } = await params;
  if (!VALID_BUG_IDS.includes(bug as PickerBugId)) notFound();
  return <BugDetailView bugId={bug as PickerBugId} />;
}
