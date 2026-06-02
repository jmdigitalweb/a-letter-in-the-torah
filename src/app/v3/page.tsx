import { TorahExperience } from "@/components/TorahExperience";
import { Parsha } from "@/lib/torah";
import data from "@/data/parshiyot.json";

export default function V3Page() {
  return <TorahExperience parshiyot={data as Parsha[]} variant="photo" />;
}
