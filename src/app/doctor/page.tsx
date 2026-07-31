import { DoctorClient } from "@/components/doctor/DoctorClient";

export const metadata = {
  title: "AI Website Doctor — Magic AI",
  description:
    "Paste a URL or upload a screenshot. Magic AI scores health, lists problems, and builds a fix plan.",
};

export default function DoctorPage() {
  return <DoctorClient />;
}
