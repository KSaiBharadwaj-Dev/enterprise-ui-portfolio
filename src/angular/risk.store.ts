import { HttpClient } from "@angular/common/http";
import { DestroyRef, Injectable, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";

export type RiskStatus = "open" | "mitigating" | "resolved";
export interface Risk {
  readonly id: string;
  title: string;
  owner: string;
  severity: "low" | "medium" | "high";
  status: RiskStatus;
}
type Load = "idle" | "loading" | "ready" | "error";

/** Signal store: private writable state, public read-only views. */
@Injectable({ providedIn: "root" })
export class RiskStore {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly items = signal<readonly Risk[]>([]);
  private readonly loadState = signal<Load>("idle");
  private readonly queryState = signal("");
  private readonly errorState = signal<string | null>(null);
  private readonly pendingState = signal<ReadonlySet<string>>(new Set());

  readonly load = this.loadState.asReadonly();
  readonly query = this.queryState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly pending = this.pendingState.asReadonly();

  readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.items().filter(
      (r) => q === "" || `${r.id} ${r.title} ${r.owner}`.toLowerCase().includes(q),
    );
  });

  setQuery(value: string): void {
    this.queryState.set(value);
  }

  reload(): void {
    this.loadState.set("loading");
    this.errorState.set(null);
    this.http
      .get<Risk[]>("/api/risks")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.items.set(rows);
          this.loadState.set("ready");
        },
        error: () => {
          this.errorState.set("Could not load risks. Try again.");
          this.loadState.set("error");
        },
      });
  }

  /** Optimistic update: change the row now, put the old one back if the request fails. */
  setStatus(id: string, status: RiskStatus): void {
    const previous = this.items().find((r) => r.id === id);
    if (!previous || previous.status === status || this.pending().has(id)) return;
    this.errorState.set(null);
    this.replace({ ...previous, status });
    this.mark(id, true);
    this.http
      .patch<Risk>(`/api/risks/${id}`, { status })
      .pipe(finalize(() => this.mark(id, false)))
      .subscribe({
        error: () => {
          this.replace(previous);
          this.errorState.set(`The update failed, so ${id} was restored.`);
        },
      });
  }

  private replace(next: Risk): void {
    this.items.update((rows) => rows.map((r) => (r.id === next.id ? next : r)));
  }

  private mark(id: string, on: boolean): void {
    this.pendingState.update((current) => {
      const copy = new Set(current);
      if (on) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }
}
