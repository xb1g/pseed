"use client";

import { useState, useRef, useTransition } from "react";
import { Plus, Check } from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { BuildTodo } from "@/actions/build-todos";
import {
  createBuildTodo,
  updateBuildTodo,
  deleteBuildTodo,
} from "@/actions/build-todos";

interface Props {
  initialTodos: BuildTodo[];
}

function getSectionLabel(due_date: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseISO(due_date);
  const diff = differenceInCalendarDays(due, today);
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} Days`;
}

function groupByDate(todos: BuildTodo[]): { label: string; date: string; todos: BuildTodo[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort todos by due_date ascending, then created_at
  const sorted = [...todos].sort((a, b) => {
    if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
    return a.created_at.localeCompare(b.created_at);
  });

  const groups: { label: string; date: string; todos: BuildTodo[] }[] = [];
  const seen = new Map<string, number>();

  for (const todo of sorted) {
    const label = getSectionLabel(todo.due_date);
    if (!seen.has(todo.due_date)) {
      seen.set(todo.due_date, groups.length);
      groups.push({ label, date: todo.due_date, todos: [todo] });
    } else {
      groups[seen.get(todo.due_date)!].todos.push(todo);
    }
  }

  return groups;
}

export function BuildTodoList({ initialTodos }: Props) {
  const [todos, setTodos] = useState<BuildTodo[]>(initialTodos);
  const [addingNew, setAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [datePickerId, setDatePickerId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const newInputRef = useRef<HTMLInputElement>(null);

  function startAdding() {
    setAddingNew(true);
    setNewTitle("");
    setTimeout(() => newInputRef.current?.focus(), 0);
  }

  function commitNew() {
    const title = newTitle.trim();
    if (!title) {
      setAddingNew(false);
      return;
    }
    setAddingNew(false);
    setNewTitle("");
    startTransition(async () => {
      const todo = await createBuildTodo(title);
      setTodos((prev) => [...prev, todo]);
    });
  }

  function toggleDone(todo: BuildTodo) {
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, is_done: !t.is_done } : t))
    );
    startTransition(async () => {
      await updateBuildTodo(todo.id, { is_done: !todo.is_done });
    });
  }

  function startRename(todo: BuildTodo) {
    setRenamingId(todo.id);
    setRenameValue(todo.title);
  }

  function commitRename(id: string) {
    const title = renameValue.trim();
    setRenamingId(null);
    if (!title) return;
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t))
    );
    startTransition(async () => {
      await updateBuildTodo(id, { title });
    });
  }

  function handleDateSelect(id: string, date: Date | undefined) {
    if (!date) return;
    const due_date = format(date, "yyyy-MM-dd");
    setDatePickerId(null);
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, due_date } : t))
    );
    startTransition(async () => {
      await updateBuildTodo(id, { due_date });
    });
  }

  function handleDelete(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => {
      await deleteBuildTodo(id);
    });
  }

  const groups = groupByDate(todos);

  return (
    <div className="relative">
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.date}>
            <h3 className="text-lg font-semibold text-white/80 mb-2 px-1">
              {group.label}
            </h3>
            <div className="space-y-0.5">
              {group.todos.map((todo) => (
                <Popover
                  key={todo.id}
                  open={datePickerId === todo.id}
                  onOpenChange={(open) => !open && setDatePickerId(null)}
                >
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center gap-3 px-2 py-2 rounded hover:bg-white/5 group cursor-default select-none">
                        <button
                          onClick={() => toggleDone(todo)}
                          className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                            todo.is_done
                              ? "bg-white/20 border-white/20"
                              : "border-white/30 hover:border-white/60"
                          }`}
                        >
                          {todo.is_done && <Check className="w-2.5 h-2.5 text-white/60" />}
                        </button>

                        {renamingId === todo.id ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => commitRename(todo.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename(todo.id);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            className="flex-1 bg-transparent text-sm text-white outline-none border-b border-white/30"
                          />
                        ) : (
                          <span
                            className={`flex-1 text-sm ${
                              todo.is_done
                                ? "line-through text-white/40"
                                : "text-white/90"
                            }`}
                          >
                            {todo.title}
                          </span>
                        )}
                      </div>
                    </ContextMenuTrigger>

                    <ContextMenuContent className="w-40">
                      <ContextMenuItem onClick={() => startRename(todo)}>
                        Rename
                      </ContextMenuItem>
                      <PopoverTrigger asChild>
                        <ContextMenuItem onClick={() => setDatePickerId(todo.id)}>
                          Edit date
                        </ContextMenuItem>
                      </PopoverTrigger>
                      <ContextMenuItem
                        onClick={() => handleDelete(todo.id)}
                        className="text-red-400 focus:text-red-400"
                      >
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>

                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={new Date(todo.due_date)}
                      onSelect={(date) => handleDateSelect(todo.id, date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ))}
            </div>
          </div>
        ))}

        {todos.length === 0 && !addingNew && (
          <p className="text-sm text-white/30 px-1 py-4 text-center">No tasks yet.</p>
        )}

        {addingNew && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-4 h-4 rounded-full border border-white/30 flex-shrink-0" />
            <input
              ref={newInputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={commitNew}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitNew();
                if (e.key === "Escape") setAddingNew(false);
              }}
              placeholder="New task..."
              className="flex-1 bg-transparent text-sm text-white/90 outline-none border-b border-white/30 placeholder:text-white/30"
            />
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={startAdding}
        className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all shadow-lg hover:shadow-white/10"
        title="Add task"
      >
        <Plus className="w-5 h-5 text-white/80" />
      </button>
    </div>
  );
}
