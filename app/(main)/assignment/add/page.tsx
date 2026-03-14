import AddAssignmentForm from "@/components/form/add-assignment-form";
import Header from "@/components/header";

export default function AddAssignmentPage() {
  return (
    <div className="w-full max-w-8xl mx-auto space-y-8">
      <div className="w-full">
        <Header title={"Add Assignment"} subTitle={"Add new assignment"} />
      </div>
      <div className="w-full max-w-2xl">
        <AddAssignmentForm />
      </div>
    </div>
  );
}
