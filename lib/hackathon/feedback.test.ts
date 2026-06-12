import {
  buildFeedbackRecord,
  getFeedbackParticipant,
  getFeedbackVersion,
  hackathonFeedbackSchema,
  type HackathonFeedbackInput,
} from "./feedback";

const validFeedback: HackathonFeedbackInput = {
  overall_rating: 5,
  top_takeaways: ["new_skills", "project_experience", "confidence"],
  other_takeaway: "",
  social_change_confidence: "much_more",
  had_mentorship: true,
  mentorship_rating: 4,
  mentor_help_area: "project_development",
  other_mentor_help: "",
  project_stage: "prototype",
  project_continuation_interest: "yes",
  ongoing_mentorship_interest: "maybe",
  future_event_interest: "definitely",
  improvement_suggestions: "",
  learning_content_rating: 4,
  learning_content_issues: ["more_examples"],
  learning_content_feedback: "",
  future_path_uncertain: null,
  product_priority: null,
  product_priority_reason: "",
  follow_up_interests: ["project_launch", "mentor_match"],
  wants_contact: false,
  contact_name: "",
  contact_topics: [],
  other_contact_topic: "",
};

describe("getFeedbackVersion", () => {
  it.each(["ม.3", "ม.4", "ม.5"])(
    "uses the future-path version for %s",
    (grade) => {
      expect(getFeedbackVersion(grade)).toBe("future_path");
    }
  );

  it.each(["ม.6", "ปวช.", "ปวส.", "ปริญญาตรี", "ปริญญาโท", ""])(
    "uses the project-growth version for %s",
    (grade) => {
      expect(getFeedbackVersion(grade)).toBe("project_growth");
    }
  );
});

describe("getFeedbackParticipant", () => {
  it("accepts a participant authenticated through the hackathon session", () => {
    expect(
      getFeedbackParticipant({
        id: "participant-1",
        name: "แพรว",
        grade_level: "ม.5",
      })
    ).toEqual({
      name: "แพรว",
      grade_level: "ม.5",
    });
  });

  it("rejects the Supabase admin fallback without a hackathon session", () => {
    expect(
      getFeedbackParticipant({
        id: "admin-1",
        name: "Admin",
        grade_level: "",
        is_admin: true,
      })
    ).toBeNull();
  });
});

describe("hackathonFeedbackSchema", () => {
  it("accepts a complete feedback response", () => {
    expect(hackathonFeedbackSchema.safeParse(validFeedback).success).toBe(true);
  });

  it("rejects more than three takeaways", () => {
    const result = hackathonFeedbackSchema.safeParse({
      ...validFeedback,
      top_takeaways: [
        "new_skills",
        "project_experience",
        "confidence",
        "community",
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects ratings outside 1-5", () => {
    const result = hackathonFeedbackSchema.safeParse({
      ...validFeedback,
      overall_rating: 6,
    });

    expect(result.success).toBe(false);
  });

  it("requires at least one learning-content response", () => {
    const result = hackathonFeedbackSchema.safeParse({
      ...validFeedback,
      learning_content_issues: [],
    });

    expect(result.success).toBe(false);
  });

  it("requires a name and topic when contact is requested", () => {
    const result = hackathonFeedbackSchema.safeParse({
      ...validFeedback,
      wants_contact: true,
      contact_name: "",
      contact_topics: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.contact_name).toBeDefined();
      expect(result.error.flatten().fieldErrors.contact_topics).toBeDefined();
    }
  });

  it("accepts participants who did not receive mentorship", () => {
    const result = hackathonFeedbackSchema.safeParse({
      ...validFeedback,
      had_mentorship: false,
      mentorship_rating: null,
      mentor_help_area: null,
    });

    expect(result.success).toBe(true);
  });

  it("rejects unknown product priorities", () => {
    const result = hackathonFeedbackSchema.safeParse({
      ...validFeedback,
      product_priority: "watch_videos",
    });

    expect(result.success).toBe(false);
  });

  it("requires mentorship details only when mentorship was received", () => {
    const result = hackathonFeedbackSchema.safeParse({
      ...validFeedback,
      had_mentorship: true,
      mentorship_rating: null,
      mentor_help_area: null,
    });

    expect(result.success).toBe(false);
  });

  it.each([
    {
      field: "top_takeaways",
      value: ["other"],
      textField: "other_takeaway",
    },
    {
      field: "mentor_help_area",
      value: "other",
      textField: "other_mentor_help",
    },
    {
      field: "contact_topics",
      value: ["other"],
      textField: "other_contact_topic",
      wants_contact: true,
      contact_name: "แพรว",
    },
  ])("requires a typed answer for $textField", (testCase) => {
    const result = hackathonFeedbackSchema.safeParse({
      ...validFeedback,
      ...testCase,
      [testCase.field]: testCase.value,
      [testCase.textField]: "",
    });

    expect(result.success).toBe(false);
  });
});

describe("buildFeedbackRecord", () => {
  it("derives the audience version and preserves compatible legacy fields", () => {
    expect(
      buildFeedbackRecord(
        {
          ...validFeedback,
          ongoing_mentorship_interest: "yes",
          future_path_uncertain: true,
          product_priority: "seven_day_project",
          product_priority_reason: "อยากรู้ว่าชอบจริงไหมก่อนเลือกสายเรียน",
          follow_up_interests: ["future_path", "mentor_future"],
        },
        {
          id: "participant-1",
          grade_level: "ม.5",
        }
      )
    ).toMatchObject({
      participant_id: "participant-1",
      feedback_version: "future_path",
      future_path_uncertain: true,
      product_priority: "seven_day_project",
      product_priority_reason: "อยากรู้ว่าชอบจริงไหมก่อนเลือกสายเรียน",
      follow_up_interests: ["future_path", "mentor_future"],
      mentorship_rating: 4,
      improvement_suggestions: null,
      wants_call: false,
      wants_product_beta: true,
      wants_continue_mentorship: true,
    });
  });

  it("keeps product interest but drops only age-specific answers from the other audience version", () => {
    expect(
      buildFeedbackRecord(
        {
          ...validFeedback,
          future_path_uncertain: true,
          product_priority: "career_classes",
          product_priority_reason: "อยากเห็นตัวเลือกทั้งหมดก่อน",
          follow_up_interests: ["future_path", "project_launch"],
        },
        {
          id: "participant-2",
          grade_level: "ม.6",
        }
      )
    ).toMatchObject({
      feedback_version: "project_growth",
      future_path_uncertain: null,
      product_priority: "career_classes",
      product_priority_reason: "อยากเห็นตัวเลือกทั้งหมดก่อน",
      follow_up_interests: ["future_path", "project_launch"],
      wants_product_beta: true,
    });
  });

  it("stores no mentorship details when mentorship was not received", () => {
    expect(
      buildFeedbackRecord(
        {
          ...validFeedback,
          had_mentorship: false,
          mentorship_rating: null,
          mentor_help_area: null,
        },
        {
          id: "participant-3",
          grade_level: "ปริญญาตรี",
        }
      )
    ).toMatchObject({
      had_mentorship: false,
      mentorship_rating: null,
      mentor_help_area: null,
    });
  });
});
