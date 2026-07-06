export interface CareerExample {
  id: string;
  name: string;
  role: string;
  company?: string;
  nationality?: string;
  image_url?: string;
  story_summary: string;
  notable_for?: string;
}

export interface CareerCase {
  id: string;
  persona_type: "global_idol" | "local_legend" | "current_icon";
  name: string;
  bio: string;
  history: { age: number; event: string }[];
  path_steps: { step: number; title: string; desc: string }[];
  achievements: string[];
  tags: string[];
  image_url?: string;
}

export interface CareerPath {
  id: string;
  title: string;
  description: string;
  class: string;
  subclass: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration_days: number;
  tags: string[];
  hero_image?: string;
  is_featured: boolean;
  examples?: CareerExample[];
  cases?: CareerCase[];
}

export type ViewType = "list" | "rpg";

export type TestEventType =
  | "view_loaded"
  | "class_selected"
  | "subclass_selected"
  | "path_clicked"
  | "example_clicked"
  | "enroll_started"
  | "enroll_completed"
  | "time_on_page"
  | "scroll_depth"
  | "filter_applied"
  | "search_query";

export interface TestEventPayload {
  [key: string]: unknown;
}

export interface TestEvent {
  view_type: ViewType;
  event_type: TestEventType;
  payload?: TestEventPayload;
}

export interface CareerClass {
  name: string;
  description: string;
  icon?: string;
  color?: string;
  subclasses: CareerSubclass[];
}

export interface CareerSubclass {
  name: string;
  description: string;
  paths: CareerPath[];
}
