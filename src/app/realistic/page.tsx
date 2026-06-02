import { TorahExperience } from "@/components/TorahExperience";
import { Parsha } from "@/lib/torah";
import data from "@/data/parshiyot.json";

export default function RealisticPage() {
  return <TorahExperience parshiyot={data as Parsha[]} variant="realistic" />;
}
