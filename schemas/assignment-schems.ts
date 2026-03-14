import { z } from "zod";

export const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["Individual", "Group"], {
    required_error: "Type is required",
  }),
  assignTo: z.array(z.string()).min(1, "At least one assignee is required"),
  reward: z.coerce.number().min(0, "Reward must be a positive number"),
  deadline: z.coerce.date({
    required_error: "A deadline is required",
    invalid_type_error: "That's not a date!",
  }),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;
