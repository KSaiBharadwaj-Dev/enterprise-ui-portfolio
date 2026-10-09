import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from "@angular/core";
import { AuthService } from "./auth.service";
import { Risk, RiskStore } from "./risk.store";

@Component({
  selector: "app-risks",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      type="search"
      aria-label="Search risks"
      [value]="store.query()"
      (input)="onSearch($event)"
    />

    <p role="status">{{ store.load() === "loading" ? "Loading risks..." : "" }}</p>
    <p role="alert">{{ store.error() }}</p>

    <table>
      <caption class="sr-only">
        Program risks
      </caption>
      <thead>
        <tr>
          <th scope="col">ID</th>
          <th scope="col">Risk</th>
          <th scope="col">Status</th>
          <th scope="col"><span class="sr-only">Action</span></th>
        </tr>
      </thead>
      <tbody>
        @for (risk of store.visible(); track risk.id) {
          <tr [attr.aria-busy]="store.pending().has(risk.id)">
            <td>{{ risk.id }}</td>
            <!-- Interpolation is escaped by Angular. Untrusted text never becomes markup. -->
            <td>{{ risk.title }}</td>
            <td>{{ risk.status }}</td>
            <td>
              <button
                type="button"
                [disabled]="!canUpdate()"
                [attr.aria-disabled]="store.pending().has(risk.id) || null"
                [attr.aria-label]="actionLabel(risk)"
                (click)="toggle(risk)"
              >
                {{ risk.status === "resolved" ? "Reopen" : "Resolve" }}
              </button>
            </td>
          </tr>
        } @empty {
          @if (store.load() === "ready") {
            <tr>
              <td colspan="4">No risks match. Clear the search to see them all.</td>
            </tr>
          }
        }
      </tbody>
    </table>
  `,
})
export class RisksComponent implements OnInit {
  protected readonly store = inject(RiskStore);
  private readonly auth = inject(AuthService);
  protected readonly canUpdate = computed(() => this.auth.can("risk:update"));

  ngOnInit(): void {
    this.store.reload();
  }

  protected onSearch(event: Event): void {
    this.store.setQuery((event.target as HTMLInputElement).value);
  }

  protected actionLabel(risk: Risk): string {
    return `${risk.status === "resolved" ? "Reopen" : "Resolve"} ${risk.id}`;
  }

  protected toggle(risk: Risk): void {
    this.store.setStatus(risk.id, risk.status === "resolved" ? "open" : "resolved");
  }
}
