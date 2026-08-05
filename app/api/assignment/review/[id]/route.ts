import { isAuthorize } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBonusCycleStart, getRacingBucketIndex } from "@/lib/bonus-cycle";

// -1 to -3 days late  -> -300
// -3 to -7 days late  -> -500
// -7+ days late        -> -700
// on time / early      -> 0 penalty (that side is the record-bonus race below)
//
// NOTE: this flat calculation is now used ONLY as a reference value stored
// on the assignment row (earlyBirdModifier / adjustedScore) for display /
// record-keeping purposes. The actual Score entry that gets created below
// uses the racing logic in maybeApplyLatePenalty(), NOT this flat value.
function calculateLatePenalty(deadline: Date, submitAt: Date): number {
  const diffDays = (submitAt.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 0) return 0;
  if (diffDays <= 3) return -300;
  if (diffDays <= 7) return -500;
  return -700;
}

// 🔁 CHANGED: getRacingBucketIndex ย้ายไป lib/bonus-cycle.ts (shared) แล้ว
// ลบ local function ตัวเดิมออก ใช้ import แทน — ป้องกัน logic เพี้ยนกัน
// คนละที่ระหว่าง route นี้, assignments/route.ts (GET), และ mission-quest.

const RECORD_BONUS = 500;

// Late penalty buckets — same shape as the racing buckets used for the
// bonus side, but for the "late" half (buckets 4, 5, 6 in getFullBucketIndex).
const LATE_PENALTY_BY_BUCKET: Record<number, number> = {
  4: -300, // late_minor: 1–3 วัน
  5: -500, // late_major: 3–7 วัน
  6: -700, // late_worst: 7+ วัน
};

/**
 * แปลง (deadline, submitAt) ที่ "สาย" เป็น late-bucket index (4/5/6)
 * คืน null ถ้าไม่สาย (ไม่มี penalty ต้องพิจารณา)
 */
function getLateBucketIndex(deadline: Date, submitAt: Date): number | null {
  const diffDays = (submitAt.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 0 && diffDays <= 3) return 4;
  if (diffDays > 3 && diffDays <= 7) return 5;
  if (diffDays > 7) return 6;
  return null;
}

/**
 * Awards the flat +500 "fastest/closest submitter" bonus live, right after
 * approval.
 *
 * Rules (confirmed with the team):
 *  - 4 buckets race independently (super_early / early / before / ontime);
 *    up to 4 people can hold a record at once (one per bucket) each cycle.
 *  - Whoever currently has the widest margin in a bucket THIS cycle is the
 *    record holder. A new approval only gets the bonus if it beats the
 *    current best in its own bucket.
 *  - NO clawback: if someone later takes the record, the previous holder
 *    keeps their 500.
 *  - Guards against double-award if the same assignment is re-reviewed.
 */
async function maybeAwardRecordBonus(
  userId: string,
  assignment: { id: string; title: string; deadline: Date; submitAt: Date },
) {
  const bucketIdx = getRacingBucketIndex(assignment.deadline, assignment.submitAt);
  if (bucketIdx === null) return null; // late — nothing to race for

  const marker = `Record Bonus [${assignment.id}]`;
  const alreadyAwarded = await prisma.score.findFirst({
    where: { assignment_title: marker },
  });
  if (alreadyAwarded) return null;

  const cycleStart = await getBonusCycleStart();
  const now = new Date();

  const rivals = await prisma.assignment.findMany({
    where: {
      status: "Approved",
      deadline: { gte: cycleStart, lte: now },
      user: { role: "STAFF" },
      id: { not: assignment.id },
    },
    select: { deadline: true, submitAt: true },
  });

  const myMarginMs = assignment.deadline.getTime() - assignment.submitAt.getTime();

  const currentBestMarginMs = rivals.reduce((best, r) => {
    const rIdx = getRacingBucketIndex(r.deadline, r.submitAt);
    if (rIdx !== bucketIdx) return best; // only rivals in the SAME bucket count
    const margin = r.deadline.getTime() - r.submitAt.getTime();
    return margin > best ? margin : best;
  }, -Infinity);

  const beatsRecord = myMarginMs > currentBestMarginMs;
  if (!beatsRecord) return null;

  return prisma.score.create({
    data: {
      recipient_id: userId,
      reviewer: "System (Record Bonus)",
      assignment_title: marker,
      score: RECORD_BONUS,
    },
  });
}

/**
 * Applies the -300 / -500 / -700 "worst latecomer" penalty live, right
 * after approval — mirrors maybeAwardRecordBonus() but for the late side.
 *
 * Rules (same shape as the bonus race, confirmed with the team):
 *  - 3 late buckets race independently (late_minor / late_major / late_worst);
 *    up to 3 people can hold the "worst" record at once (one per bucket)
 *    each cycle.
 *  - Whoever currently has the WORST margin (most negative — i.e. latest
 *    submission relative to deadline) in a bucket THIS cycle holds the
 *    penalty record. A new approval only gets penalized if it beats
 *    (is later than) the current worst in its own bucket.
 *  - NO "un-penalizing": if someone later takes the worst-record spot, the
 *    previous holder keeps their penalty (no clawback either direction).
 *  - Guards against double-penalty if the same assignment is re-reviewed.
 */
async function maybeApplyLatePenalty(
  userId: string,
  assignment: { id: string; title: string; deadline: Date; submitAt: Date },
) {
  const bucketIdx = getLateBucketIndex(assignment.deadline, assignment.submitAt);
  if (bucketIdx === null) return null; // not late — nothing to race for

  const marker = `Late Penalty [${assignment.id}]`;
  const alreadyApplied = await prisma.score.findFirst({
    where: { assignment_title: marker },
  });
  if (alreadyApplied) return null;

  const cycleStart = await getBonusCycleStart();
  const now = new Date();

  const rivals = await prisma.assignment.findMany({
    where: {
      status: "Approved",
      deadline: { gte: cycleStart, lte: now },
      user: { role: "STAFF" },
      id: { not: assignment.id },
    },
    select: { deadline: true, submitAt: true },
  });

  // margin = deadline - submitAt. The more negative, the later (worse).
  const myMarginMs = assignment.deadline.getTime() - assignment.submitAt.getTime();

  const currentWorstMarginMs = rivals.reduce((worst, r) => {
    if (!r.submitAt) return worst;
    const rIdx = getLateBucketIndex(r.deadline, r.submitAt);
    if (rIdx !== bucketIdx) return worst; // only rivals in the SAME bucket count
    const margin = r.deadline.getTime() - r.submitAt.getTime();
    return margin < worst ? margin : worst; // more negative = worse/later
  }, Infinity);

  const beatsRecord = myMarginMs < currentWorstMarginMs; // later than current worst
  if (!beatsRecord) return null;

  return prisma.score.create({
    data: {
      recipient_id: userId,
      reviewer: "System (Late Penalty)",
      assignment_title: marker,
      score: LATE_PENALTY_BY_BUCKET[bucketIdx],
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await isAuthorize(request);

    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const authUser = authResult.user!;
    const assignmentId = (await params).id;

    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    const isAdminCreator =
      authUser.role === "ADMIN" &&
      existingAssignment.createdBy === authUser.username;
    if (authUser.role !== "SUPER_ADMIN" && !isAdminCreator) {
      return NextResponse.json(
        { error: "You are not authorized to update this assignment" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { feedback, finalScore = 0, status = "Pending" } = body;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be Pending, Approved, or Rejected" },
        { status: 400 },
      );
    }

    if (status === "Approved" && !finalScore) {
      return NextResponse.json(
        { error: "Final Score is Required." },
        { status: 400 },
      );
    }

    // Flat late "reference" penalty. `earlyBirdModifier` / `adjustedScore`
    // fields (same schema as before) hold the flat point delta and
    // delta-adjusted score for record-keeping / display on the assignment
    // row. finalScore (raw) is still what's used everywhere else (Quality
    // King, Perfect Month avg%, etc).
    //
    // ⚠️ IMPORTANT: this flat value is NOT what gets written to the Score
    // table anymore for the late-penalty side — see maybeApplyLatePenalty()
    // below, which implements the actual racing rule (only the worst
    // latecomer per bucket per cycle gets penalized).
    let latePenaltyReference: number | null = null;
    let adjustedScore: number | null = null;
    if (status === "Approved") {
      latePenaltyReference = calculateLatePenalty(assignment.deadline, assignment.submitAt);
      adjustedScore = parseInt(finalScore) + latePenaltyReference;
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        feedback,
        finalScore: parseInt(finalScore),
        earlyBirdModifier: latePenaltyReference,
        adjustedScore,
        status: status as "Pending" | "Approved" | "Rejected",
      },
    });

    let score = null;
    let penaltyScore = null;
    let recordBonusScore = null;
    if (status === "Approved") {
      score = await prisma.score.create({
        data: {
          recipient_id: assignment.userId,
          reviewer: authUser.nickname,
          assignment_title: assignment.title,
          score: parseInt(finalScore) || 0,
        },
      });

      // 🔁 CHANGED: late penalty now races per late-bucket (same model as
      // the +500 record bonus) instead of applying a flat penalty to
      // everyone who submitted late. Only the worst latecomer in a bucket
      // this cycle gets penalized; previous record holders keep their
      // penalty (no clawback).
      penaltyScore = await maybeApplyLatePenalty(assignment.userId, {
        id: assignment.id,
        title: assignment.title,
        deadline: assignment.deadline,
        submitAt: assignment.submitAt,
      });

      recordBonusScore = await maybeAwardRecordBonus(assignment.userId, {
        id: assignment.id,
        title: assignment.title,
        deadline: assignment.deadline,
        submitAt: assignment.submitAt,
      });
    }

    return NextResponse.json({
      message: "Assignment reviewed successfully",
      assignment: updatedAssignment,
      score: score,
      penaltyScore: penaltyScore,
      recordBonusScore: recordBonusScore,
    });
  } catch (error) {
    console.error("Review assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}