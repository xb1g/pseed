drop policy "Career examples are manageable by admins" on "public"."career_examples";

drop policy "Career examples are viewable by everyone" on "public"."career_examples";

drop policy "Career paths are manageable by admins" on "public"."career_paths";

drop policy "Career paths are viewable by everyone" on "public"."career_paths";

drop policy "Admins can read all test events" on "public"."view_test_events";

drop policy "Users can create their own test events" on "public"."view_test_events";

revoke delete on table "public"."career_examples" from "anon";

revoke insert on table "public"."career_examples" from "anon";

revoke references on table "public"."career_examples" from "anon";

revoke select on table "public"."career_examples" from "anon";

revoke trigger on table "public"."career_examples" from "anon";

revoke truncate on table "public"."career_examples" from "anon";

revoke update on table "public"."career_examples" from "anon";

revoke delete on table "public"."career_examples" from "authenticated";

revoke insert on table "public"."career_examples" from "authenticated";

revoke references on table "public"."career_examples" from "authenticated";

revoke select on table "public"."career_examples" from "authenticated";

revoke trigger on table "public"."career_examples" from "authenticated";

revoke truncate on table "public"."career_examples" from "authenticated";

revoke update on table "public"."career_examples" from "authenticated";

revoke delete on table "public"."career_examples" from "service_role";

revoke insert on table "public"."career_examples" from "service_role";

revoke references on table "public"."career_examples" from "service_role";

revoke select on table "public"."career_examples" from "service_role";

revoke trigger on table "public"."career_examples" from "service_role";

revoke truncate on table "public"."career_examples" from "service_role";

revoke update on table "public"."career_examples" from "service_role";

revoke delete on table "public"."career_paths" from "anon";

revoke insert on table "public"."career_paths" from "anon";

revoke references on table "public"."career_paths" from "anon";

revoke select on table "public"."career_paths" from "anon";

revoke trigger on table "public"."career_paths" from "anon";

revoke truncate on table "public"."career_paths" from "anon";

revoke update on table "public"."career_paths" from "anon";

revoke delete on table "public"."career_paths" from "authenticated";

revoke insert on table "public"."career_paths" from "authenticated";

revoke references on table "public"."career_paths" from "authenticated";

revoke select on table "public"."career_paths" from "authenticated";

revoke trigger on table "public"."career_paths" from "authenticated";

revoke truncate on table "public"."career_paths" from "authenticated";

revoke update on table "public"."career_paths" from "authenticated";

revoke delete on table "public"."career_paths" from "service_role";

revoke insert on table "public"."career_paths" from "service_role";

revoke references on table "public"."career_paths" from "service_role";

revoke select on table "public"."career_paths" from "service_role";

revoke trigger on table "public"."career_paths" from "service_role";

revoke truncate on table "public"."career_paths" from "service_role";

revoke update on table "public"."career_paths" from "service_role";

revoke delete on table "public"."view_test_events" from "anon";

revoke insert on table "public"."view_test_events" from "anon";

revoke references on table "public"."view_test_events" from "anon";

revoke select on table "public"."view_test_events" from "anon";

revoke trigger on table "public"."view_test_events" from "anon";

revoke truncate on table "public"."view_test_events" from "anon";

revoke update on table "public"."view_test_events" from "anon";

revoke delete on table "public"."view_test_events" from "authenticated";

revoke insert on table "public"."view_test_events" from "authenticated";

revoke references on table "public"."view_test_events" from "authenticated";

revoke select on table "public"."view_test_events" from "authenticated";

revoke trigger on table "public"."view_test_events" from "authenticated";

revoke truncate on table "public"."view_test_events" from "authenticated";

revoke update on table "public"."view_test_events" from "authenticated";

revoke delete on table "public"."view_test_events" from "service_role";

revoke insert on table "public"."view_test_events" from "service_role";

revoke references on table "public"."view_test_events" from "service_role";

revoke select on table "public"."view_test_events" from "service_role";

revoke trigger on table "public"."view_test_events" from "service_role";

revoke truncate on table "public"."view_test_events" from "service_role";

revoke update on table "public"."view_test_events" from "service_role";

alter table "public"."career_examples" drop constraint "career_examples_career_path_id_fkey";

alter table "public"."career_paths" drop constraint "career_paths_difficulty_check";

alter table "public"."view_test_events" drop constraint "view_test_events_event_type_check";

alter table "public"."view_test_events" drop constraint "view_test_events_user_id_fkey";

alter table "public"."view_test_events" drop constraint "view_test_events_view_type_check";

alter table "public"."radar_cards" drop constraint "radar_cards_kind_check";

alter table "public"."career_examples" drop constraint "career_examples_pkey";

alter table "public"."career_paths" drop constraint "career_paths_pkey";

alter table "public"."view_test_events" drop constraint "view_test_events_pkey";

drop index if exists "public"."career_examples_pkey";

drop index if exists "public"."career_paths_pkey";

drop index if exists "public"."idx_career_examples_path_id";

drop index if exists "public"."idx_career_paths_class";

drop index if exists "public"."idx_career_paths_difficulty";

drop index if exists "public"."idx_career_paths_published";

drop index if exists "public"."idx_career_paths_subclass";

drop index if exists "public"."idx_view_test_events_created_at";

drop index if exists "public"."idx_view_test_events_event_type";

drop index if exists "public"."idx_view_test_events_session";

drop index if exists "public"."idx_view_test_events_view_type";

drop index if exists "public"."view_test_events_pkey";

drop table "public"."career_examples";

drop table "public"."career_paths";

drop table "public"."view_test_events";

alter table "public"."radar_cards" add constraint "radar_cards_kind_check" CHECK ((kind = ANY (ARRAY['hook'::text, 'fantasyReality'::text, 'text'::text, 'jobs'::text, 'list'::text, 'cta'::text, 'dayInLife'::text, 'salaryProgression'::text, 'growthCompare'::text, 'aiImpact'::text, 'marketThailand'::text, 'entryRoutes'::text, 'risks'::text, 'realPeople'::text, 'sources'::text, 'reflection'::text, 'futureOutlook'::text]))) not valid;

alter table "public"."radar_cards" validate constraint "radar_cards_kind_check";


