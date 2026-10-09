import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { finalize } from "rxjs";
import { AuthService } from "./auth.service";
import { safeReturnUrl } from "./validators";

@Component({
  selector: "app-sign-in",
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <label for="username">Username</label>
      <input id="username" formControlName="username" autocomplete="username" />
      <label for="password">Password</label>
      <input
        id="password"
        type="password"
        formControlName="password"
        autocomplete="current-password"
      />
      <button type="submit" [disabled]="pending()">
        {{ pending() ? "Signing in..." : "Sign in" }}
      </button>
      @if (error(); as message) {
        <p role="alert">{{ message }}</p>
      }
    </form>
  `,
})
export class SignInComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.group({
    username: ["", Validators.required],
    password: ["", Validators.required],
  });

  /** Plain language for each outcome. A wrong name and a wrong password get the same answer. */
  private messageFor(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) return "Something unexpected went wrong.";
    if (error.status === 401) return "Invalid username or password.";
    if (error.status === 429) return "Too many attempts. Wait a moment, then try again.";
    if (error.status === 0) return "You appear to be offline. Check your connection and try again.";
    return "The server hit a problem. Try again.";
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.error.set("Enter your username and password.");
      const first = this.form.controls.username.invalid ? "#username" : "#password";
      this.host.nativeElement.querySelector<HTMLElement>(first)?.focus();
      return;
    }
    this.pending.set(true);
    this.error.set(null);
    const { username, password } = this.form.getRawValue();
    this.auth
      .signIn(username, password)
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigateByUrl(
            safeReturnUrl(this.route.snapshot.queryParamMap.get("returnUrl")),
          ),
        error: (error: unknown) => {
          this.form.controls.password.reset(); // never leave a rejected password in the field
          this.error.set(this.messageFor(error));
        },
      });
  }
}
