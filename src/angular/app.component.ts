import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { AuthService } from "./auth.service";

/** The shell: a header whose links follow the signed-in role, and the outlet for each route. */
@Component({
  selector: "app-root",
  imports: [RouterLink, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <a routerLink="/risks">Risk log</a>
      @if (auth.session(); as session) {
        @if (auth.can("risk:create")) {
          <a routerLink="/risks/new">New risk</a>
        }
        <span>{{ session.user }}, {{ session.role }} role</span>
        <button type="button" (click)="auth.signOut()">Sign out</button>
      }
    </header>
    <main>
      <router-outlet />
    </main>
  `,
})
export class AppComponent {
  protected readonly auth = inject(AuthService);
}
