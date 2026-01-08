
export interface MarkEntryUpdate {
  id: string;
  obtainedMarks: number | null;
  isAbsent: boolean;
  remarks: string;
}

export const validateMarks = (
  update: MarkEntryUpdate,
  maxMarks: number
): { valid: boolean; error?: string } => {
  if (update.isAbsent) {
    if (update.obtainedMarks !== 0 && update.obtainedMarks !== null) {
      return { valid: false, error: "Absent students must have 0 or null marks." };
    }
    return { valid: true };
  }

  if (update.obtainedMarks === null) {
    return { valid: true }; // Marks can be null (pending)
  }

  if (isNaN(update.obtainedMarks)) {
    return { valid: false, error: "Marks must be a valid number." };
  }

  if (update.obtainedMarks < 0) {
    return { valid: false, error: "Marks cannot be negative." };
  }

  if (update.obtainedMarks > maxMarks) {
    return { valid: false, error: `Marks (${update.obtainedMarks}) exceed paper maximum (${maxMarks}).` };
  }

  return { valid: true };
};
