import { IAssignment } from "@/types/assignment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Coins, CalendarDays, Clock, User, Users } from "lucide-react";

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

  const isLate = assignment.submitAt > assignment.deadline;

  const getDelay = () => {
    const diffMs =
      new Date(assignment.submitAt).getTime() -
      new Date(assignment.deadline).getTime();
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    if (days > 0) return `${days} ${days === 1 ? "day" : "days"} ${time}`;
    return time;
  };

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
              <>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>
                    Submitted:{" "}
                    {format(new Date(assignment.submitAt), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
                {isLate && (
                  <div className="flex items-center gap-2 text-red-500" >
                    <Clock className="w-4 h-4" />
                    <span>Delay: {getDelay()}</span>
                  </div>
                )}
              </>
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
