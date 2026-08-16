/**
 * Input Validation for PathLab Page Builder
 *
 * Validates all user inputs before they reach the database.
 * Returns structured validation errors for display in UI.
 */

import type {
  CreatePathActivityInput,
  UpdatePathActivityInput,
} from '@/types/pathlab';

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Constants
export const MAX_ACTIVITIES_PER_PAGE = 20;
const MAX_TITLE_LENGTH = 200;
const MAX_INSTRUCTIONS_LENGTH = 5000;
const MAX_BATCH_SIZE = MAX_ACTIVITIES_PER_PAGE;

/**
 * Validate activity creation input
 */
export function validateActivityInput(
  input: CreatePathActivityInput | UpdatePathActivityInput
): void {
  // Title validation
  if ('title' in input && input.title !== undefined) {
    if (!input.title || input.title.trim() === '') {
      throw new ValidationError(
        'Activity title is required',
        'title',
        'Please enter an activity title'
      );
    }

    if (input.title.length > MAX_TITLE_LENGTH) {
      throw new ValidationError(
        `Title exceeds ${MAX_TITLE_LENGTH} characters`,
        'title',
        `Title must be ${MAX_TITLE_LENGTH} characters or less`
      );
    }
  }

  // Instructions validation
  if (input.instructions !== undefined && input.instructions !== null) {
    if (input.instructions.length > MAX_INSTRUCTIONS_LENGTH) {
      throw new ValidationError(
        `Instructions exceed ${MAX_INSTRUCTIONS_LENGTH} characters`,
        'instructions',
        `Instructions must be ${MAX_INSTRUCTIONS_LENGTH} characters or less`
      );
    }
  }

  // Note: the legacy activity_type field was removed from the schema — the type
  // is now determined by content_type / assessment_type. No activity-type
  // validation is needed here.

  // Estimated minutes validation
  if (input.estimated_minutes !== undefined && input.estimated_minutes !== null) {
    if (input.estimated_minutes < 0) {
      throw new ValidationError(
        'Estimated minutes cannot be negative',
        'estimated_minutes',
        'Time estimate must be a positive number'
      );
    }

    if (input.estimated_minutes > 1440) {
      // Max 24 hours
      throw new ValidationError(
        'Estimated minutes exceeds 24 hours',
        'estimated_minutes',
        'Time estimate cannot exceed 24 hours (1440 minutes)'
      );
    }
  }
}

/**
 * Validate batch activity creation
 */
export function validateBatchActivities(
  activities: CreatePathActivityInput[]
): void {
  if (activities.length === 0) {
    throw new ValidationError(
      'No activities provided',
      'activities',
      'Please provide at least one activity'
    );
  }

  if (activities.length > MAX_BATCH_SIZE) {
    throw new ValidationError(
      `Batch size exceeds ${MAX_BATCH_SIZE}`,
      'activities',
      `You can create a maximum of ${MAX_BATCH_SIZE} activities at once`
    );
  }

  // Validate each activity
  activities.forEach((activity, index) => {
    try {
      validateActivityInput(activity);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `Activity ${index + 1}: ${error.message}`,
          `activities[${index}].${error.field}`,
          `Activity ${index + 1}: ${error.userMessage}`
        );
      }
      throw error;
    }
  });

  // Check for duplicate display_order
  const orders = activities.map(a => a.display_order);
  const duplicates = orders.filter((order, index) => orders.indexOf(order) !== index);
  if (duplicates.length > 0) {
    throw new ValidationError(
      'Duplicate display_order values',
      'activities',
      'Each activity must have a unique display order'
    );
  }
}

/**
 * Validate page activity count (enforce 20-activity limit)
 */
export async function validatePageActivityCount(
  pageId: string,
  additionalActivities: number,
  getCurrentCount: () => Promise<number>
): Promise<void> {
  const currentCount = await getCurrentCount();
  const newTotal = currentCount + additionalActivities;

  if (newTotal > MAX_ACTIVITIES_PER_PAGE) {
    throw new ValidationError(
      `Page would exceed ${MAX_ACTIVITIES_PER_PAGE} activity limit`,
      'activities',
      `This page already has ${currentCount} activities. Adding ${additionalActivities} more would exceed the limit of ${MAX_ACTIVITIES_PER_PAGE} activities per page.`
    );
  }
}
