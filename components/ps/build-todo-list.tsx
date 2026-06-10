"use client";

import { useState, useRef, useTransition } from "react";
import { Plus, Check } from "lucide-react";
import { format } from "date-fns";
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

export function BuildTodoList({ initialTodos }: Props) {
  const [todos, setTodos] = useState<BuildTodo[]>(initialTodos);
  const [addingNew, setAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [datePickerId, setDatePickerId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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

  return (
    <div className="space-y-1">
      {todos.map((todo) => (
        <Popover
          key={todo.id}
          open={datePickerId === todo.id}
          onOpenChange={(open) => !open && setDatePickerId(null)}
        >
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-white/5 group cursor-default select-none">
                <button
                  onClick={() => toggleDone(todo)}
                  className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
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

                <span className="text-xs text-white/30 group-hover:text-white/50 flex-shrink-0">
                  {todo.due_date}
                </span>
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

      {addingNew && (
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-4 h-4 rounded border border-white/30 flex-shrink-0" />
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

      <button
        onClick={startAdding}
        className="flex items-center gap-2 px-2 py-1.5 text-sm text-white/40 hover:text-white/70 transition-colors w-full"
      >
        <Plus className="w-4 h-4" />
        Add task
      </button>
    </div>
  );
}
