import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";

/** Where the role guard sends a signed-in person whose role does not allow the page. */
@Component({
  selector: "app-forbidden",
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Your role does not allow this page</h1>
    <p>Ask an administrator for access, or go back to the risk log.</p>
    <a routerLink="/risks">Back to the risk log</a>
  `,
})
export class ForbiddenComponent {}
