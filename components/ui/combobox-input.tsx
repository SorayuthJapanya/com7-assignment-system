"use client";

import React, { useState } from "react";
import {
  ChevronsUpDown,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  SearchIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./input-group";

export interface ComboboxInputProps {
  /** Current value of the field */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** List of preset values to display in dropdown */
  presets: string[];
  /** Callback to add a new preset */
  onAddPreset: (value: string) => void;
  /** Callback to update an existing preset */
  onUpdatePreset: (oldValue: string, newValue: string) => void;
  /** Callback to remove a preset */
  onRemovePreset: (value: string) => void;
  /** Whether to use a multi-line textarea instead of input */
  multiline?: boolean;
  /** Additional class for the wrapper */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function ComboboxInput({
  value,
  onChange,
  placeholder,
  presets,
  onAddPreset,
  onUpdatePreset,
  onRemovePreset,
  multiline = false,
  className,
  disabled = false,
}: ComboboxInputProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingOriginalValue, setEditingOriginalValue] = useState<
    string | null
  >(null);

  const handleSelectPreset = (preset: string) => {
    onChange(preset);
    setOpen(false);
    setSearchQuery("");
    setEditingOriginalValue(null);
  };

  const handleSaveCurrent = () => {
    if (value.trim()) {
      onAddPreset(value.trim());
      setEditingOriginalValue(null);
    }
  };

  const handleUpdateCurrent = () => {
    if (value.trim() && editingOriginalValue) {
      if (value.trim() !== editingOriginalValue) {
        onUpdatePreset(editingOriginalValue, value.trim());
      }
      setEditingOriginalValue(null);
    }
  };

  const handleStartEdit = (preset: string) => {
    onChange(preset);
    setEditingOriginalValue(preset);
    setOpen(false); // Close dropdown to let user focus on editing the input
  };

  const filteredPresets = presets.filter((p) =>
    p.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const canSaveCurrent =
    value.trim() !== "" &&
    !presets.includes(value.trim()) &&
    !editingOriginalValue;

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className={cn("relative flex flex-col gap-1.5", className)}>
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) {
            // Optional: clear editing state if they close without saving, or keep it.
            // Let's keep it so they don't lose their edit context if they accidentally click away.
          }
        }}
      >
        <PopoverTrigger asChild>
          <div className="relative w-full cursor-text">
            <InputComponent
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                // If they clear the input, cancel the edit mode
                if (e.target.value.trim() === "") {
                  setEditingOriginalValue(null);
                }
              }}
              onClick={() => setOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                multiline && "min-h-[120px]",
                "w-full max-w-2xl pr-10 ", // Add padding for the absolute chevron
                // Add ring if editing
                editingOriginalValue &&
                  "border-primary ring-1 ring-primary pr-24",
              )}
            />
            {/* Visual indicator that it's a combobox */}
            {!editingOriginalValue && (
              <div className="absolute right-3 top-2.5 opacity-50 pointer-events-none">
                <ChevronsUpDown className="h-4 w-4" />
              </div>
            )}

            {/* Inline update actions when editing */}
            {editingOriginalValue && (
              <div className="absolute right-2 top-1 flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-primary hover:text-primary-foreground hover:bg-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateCurrent();
                  }}
                  disabled={
                    !value.trim() || value.trim() === editingOriginalValue
                  }
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingOriginalValue(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[--radix-popover-trigger-width] max-w-sm p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex flex-col max-h-72">
            {/* Search input */}
            <div className="p-2 border-b">
              <InputGroup>
                <InputGroupInput
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-sm"
                />
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end" className="font-normal">
                  {presets.length} result {presets.length > 1 ? "s" : ""}
                </InputGroupAddon>
              </InputGroup>
            </div>

            {/* Save current button */}
            {canSaveCurrent && (
              <button
                type="button"
                onClick={handleSaveCurrent}
                className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent border-b cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  Save &quot;
                  {value.trim().length > 30
                    ? value.trim().slice(0, 30) + "..."
                    : value.trim()}
                  &quot;
                </span>
              </button>
            )}

            {/* Preset list */}
            <div className="overflow-y-auto flex-1">
              {filteredPresets.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  {presets.length === 0
                    ? "Don't have any values - type and click Save to create"
                    : "No results found"}
                </div>
              ) : (
                filteredPresets.map((preset) => {
                  return (
                    <div
                      key={preset}
                      className="group flex items-center gap-1 px-2 py-1.5 hover:bg-accent/50 transition-colors"
                    >
                      <button
                        type="button"
                        className="flex-1 text-left text-sm truncate py-0.5 px-1 rounded cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSelectPreset(preset)}
                        title={preset}
                      >
                        {preset}
                      </button>

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(preset);
                          }}
                          title="Edit"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePreset(preset);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Helper text when editing */}
      {editingOriginalValue && (
        <span className="text-xs text-muted-foreground">
          Editing :{" "}
          <span className="font-medium text-foreground">
            {editingOriginalValue.length > 30
              ? editingOriginalValue.slice(0, 30) + "..."
              : editingOriginalValue}
          </span>
        </span>
      )}
    </div>
  );
}
