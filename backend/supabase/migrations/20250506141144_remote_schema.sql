drop trigger if exists "update_agent_runs_updated_at" on "public"."agent_runs";

drop trigger if exists "update_messages_updated_at" on "public"."messages";

drop trigger if exists "update_projects_updated_at" on "public"."projects";

drop trigger if exists "update_threads_updated_at" on "public"."threads";

drop policy "agent_run_delete_policy" on "public"."agent_runs";

drop policy "agent_run_insert_policy" on "public"."agent_runs";

drop policy "agent_run_select_policy" on "public"."agent_runs";

drop policy "agent_run_update_policy" on "public"."agent_runs";

drop policy "message_delete_policy" on "public"."messages";

drop policy "message_insert_policy" on "public"."messages";

drop policy "message_select_policy" on "public"."messages";

drop policy "message_update_policy" on "public"."messages";

drop policy "project_delete_policy" on "public"."projects";

drop policy "project_insert_policy" on "public"."projects";

drop policy "project_select_policy" on "public"."projects";

drop policy "project_update_policy" on "public"."projects";

drop policy "thread_delete_policy" on "public"."threads";

drop policy "thread_insert_policy" on "public"."threads";

drop policy "thread_select_policy" on "public"."threads";

drop policy "thread_update_policy" on "public"."threads";

revoke delete on table "public"."messages" from "anon";

revoke insert on table "public"."messages" from "anon";

revoke references on table "public"."messages" from "anon";

revoke select on table "public"."messages" from "anon";

revoke trigger on table "public"."messages" from "anon";

revoke truncate on table "public"."messages" from "anon";

revoke update on table "public"."messages" from "anon";

revoke delete on table "public"."messages" from "authenticated";

revoke insert on table "public"."messages" from "authenticated";

revoke references on table "public"."messages" from "authenticated";

revoke select on table "public"."messages" from "authenticated";

revoke trigger on table "public"."messages" from "authenticated";

revoke truncate on table "public"."messages" from "authenticated";

revoke update on table "public"."messages" from "authenticated";

revoke delete on table "public"."messages" from "service_role";

revoke insert on table "public"."messages" from "service_role";

revoke references on table "public"."messages" from "service_role";

revoke select on table "public"."messages" from "service_role";

revoke trigger on table "public"."messages" from "service_role";

revoke truncate on table "public"."messages" from "service_role";

revoke update on table "public"."messages" from "service_role";

revoke delete on table "public"."projects" from "anon";

revoke insert on table "public"."projects" from "anon";

revoke references on table "public"."projects" from "anon";

revoke select on table "public"."projects" from "anon";

revoke trigger on table "public"."projects" from "anon";

revoke truncate on table "public"."projects" from "anon";

revoke update on table "public"."projects" from "anon";

revoke delete on table "public"."projects" from "authenticated";

revoke insert on table "public"."projects" from "authenticated";

revoke references on table "public"."projects" from "authenticated";

revoke select on table "public"."projects" from "authenticated";

revoke trigger on table "public"."projects" from "authenticated";

revoke truncate on table "public"."projects" from "authenticated";

revoke update on table "public"."projects" from "authenticated";

revoke delete on table "public"."projects" from "service_role";

revoke insert on table "public"."projects" from "service_role";

revoke references on table "public"."projects" from "service_role";

revoke select on table "public"."projects" from "service_role";

revoke trigger on table "public"."projects" from "service_role";

revoke truncate on table "public"."projects" from "service_role";

revoke update on table "public"."projects" from "service_role";

alter table "public"."agent_runs" drop constraint "agent_runs_thread_id_fkey";

alter table "public"."messages" drop constraint "messages_thread_id_fkey";

alter table "public"."projects" drop constraint "projects_account_id_fkey";

alter table "public"."threads" drop constraint "threads_account_id_fkey";

alter table "public"."threads" drop constraint "threads_project_id_fkey";

drop function if exists "public"."get_llm_formatted_messages"(p_thread_id uuid);

drop function if exists "public"."update_updated_at_column"();

alter table "public"."agent_runs" drop constraint "agent_runs_pkey";

alter table "public"."messages" drop constraint "messages_pkey";

alter table "public"."projects" drop constraint "projects_pkey";

drop index if exists "public"."agent_runs_pkey";

drop index if exists "public"."idx_agent_runs_created_at";

drop index if exists "public"."idx_agent_runs_status";

drop index if exists "public"."idx_agent_runs_thread_id";

drop index if exists "public"."idx_messages_created_at";

drop index if exists "public"."idx_messages_thread_id";

drop index if exists "public"."idx_projects_account_id";

drop index if exists "public"."idx_projects_created_at";

drop index if exists "public"."idx_threads_account_id";

drop index if exists "public"."idx_threads_created_at";

drop index if exists "public"."idx_threads_project_id";

drop index if exists "public"."messages_pkey";

drop index if exists "public"."projects_pkey";

drop table "public"."messages";

drop table "public"."projects";

alter table "public"."agent_runs" drop column "completed_at";

alter table "public"."agent_runs" drop column "error";

alter table "public"."agent_runs" drop column "responses";

alter table "public"."agent_runs" drop column "started_at";

alter table "public"."agent_runs" drop column "thread_id";

alter table "public"."agent_runs" drop column "updated_at";

alter table "public"."agent_runs" alter column "created_at" set default now();

alter table "public"."agent_runs" alter column "id" drop default;

alter table "public"."agent_runs" alter column "id" set data type bigint using 1;

alter table "public"."agent_runs" alter column "id" add generated by default as identity;

alter table "public"."agent_runs" alter column "status" set default 'created'::text;

alter table "public"."threads" disable row level security;

CREATE INDEX agent_runs_status_idx ON public.agent_runs USING btree (status);

CREATE UNIQUE INDEX test_pkey ON public.agent_runs USING btree (id);

alter table "public"."agent_runs" add constraint "test_pkey" PRIMARY KEY using index "test_pkey";


