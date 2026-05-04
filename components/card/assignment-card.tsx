import { IAssignment } from "@/types/assignment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Coins, CalendarDays, User, Users } from "lucide-react";

interface AssignmentCardProps {
  assignment: IAssignment;
  onSelected: (assignment: IAssignment) => void;
}

export default function AssignmentCard({
  assignment,
  onSelected,
}: AssignmentCardProps) {
  const resultStatus =
    assignment.submissionUrl === "" ? "Not Submit" : assignment.status;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Submit":
        return "bg-orange-100 text-orange-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-primary/10 text-primary";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card
      className="rounded-xl hover:shadow-lg hover:scale-105 hover:shadow-primary/20 transition-all duration-200 active:scale-95 cursor-pointer justify-between"
      onClick={() => onSelected(assignment)}
    >
      <CardHeader className="relative">
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-lg line-clamp-1 max-w-38 sm:max-w-50 truncate">
              {assignment.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-2">
              {assignment.description}
            </CardDescription>
            <div className="w-full flex flex-wrap items-center gap-2 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/40 border px-2.5 py-1 rounded-md">
                <span className="font-medium text-foreground">Assign By:</span>
                {assignment.createdBy}
              </div>
              {assignment.assignTo && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/40 border px-2.5 py-1 rounded-md">
                  <span className="font-medium text-foreground">
                    Assigned To:
                  </span>
                  {assignment.assignTo}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/40 border px-2.5 py-1 rounded-md">
                <span className="font-medium text-foreground">Type:</span>
                {assignment.type === "Individual" ? (
                  <User className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Users className="w-3.5 h-3.5 text-primary" />
                )}
                <span>{assignment.type}</span>
              </div>
              {assignment.type === "Group" && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/40 border px-2.5 py-1 rounded-md">
                  <span className="font-medium text-foreground">Members:</span>
                  {assignment.members.join(", ")}
                </div>
              )}
            </div>
          </div>
          <div className="absolute top-0 right-4">
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap">
              <Coins className="w-3 h-3" />
              {assignment.finalScore
                ? `Your Score: ${assignment.finalScore}`
                : `Reward: ${assignment.reward}`}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex flex-col gap-1">
            {/* Due date */}
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span>
                Due: {format(new Date(assignment.deadline), "dd/MM/yyyy HH:mm")}
              </span>
            </div>

            {/* Submitted at */}
            {assignment.submitAt > assignment.createdAt && (
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                <span>
                  Submitted:{" "}
                  {format(new Date(assignment.submitAt), "dd/MM/yyyy HH:mm")}
                </span>
                {assignment.submitAt > assignment.deadline && (
                  <span className="text-xs font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded-sm">
                    Late
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <span
          className={`${getStatusColor(resultStatus)} px-4 py-1 rounded-md text-xs font-medium whitespace-nowrap`}
        >
          {resultStatus}
        </span>
      </CardContent>
    </Card>
  );
}
