import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  signal,
} from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { finalize } from "rxjs";
import { httpsUrl } from "./validators";

type FieldName = "title" | "owner" | "severity" | "reference";

@Component({
  selector: "app-risk-form",
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <label for="title">Title</label>
      <input
        id="title"
        formControlName="title"
        [attr.aria-invalid]="invalid('title')"
        [attr.aria-describedby]="invalid('title') ? 'title-error' : null"
      />
      @if (invalid("title")) {
        <p id="title-error" role="alert">{{ message("title") }}</p>
      }

      <label for="owner">Owner email</label>
      <input
        id="owner"
        type="email"
        formControlName="owner"
        [attr.aria-invalid]="invalid('owner')"
        [attr.aria-describedby]="invalid('owner') ? 'owner-error' : null"
      />
      @if (invalid("owner")) {
        <p id="owner-error" role="alert">{{ message("owner") }}</p>
      }

      <label for="severity">Severity</label>
      <select
        id="severity"
        formControlName="severity"
        [attr.aria-invalid]="invalid('severity')"
        [attr.aria-describedby]="invalid('severity') ? 'severity-error' : null"
      >
        @for (level of severities; track level) {
          <option [value]="level">{{ level }}</option>
        }
      </select>
      @if (invalid("severity")) {
        <p id="severity-error" role="alert">{{ message("severity") }}</p>
      }

      <label for="reference">Reference link (optional)</label>
      <input
        id="reference"
        formControlName="reference"
        [attr.aria-invalid]="invalid('reference')"
        [attr.aria-describedby]="invalid('reference') ? 'reference-error' : null"
      />
      @if (invalid("reference")) {
        <p id="reference-error" role="alert">{{ message("reference") }}</p>
      }

      <button type="submit" [disabled]="saving()">
        {{ saving() ? "Creating..." : "Create risk" }}
      </button>
      <p role="alert">{{ result() }}</p>
    </form>
  `,
})
export class RiskFormComponent {
  private readonly http = inject(HttpClient);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly severities = ["low", "medium", "high"] as const;
  protected readonly saving = signal(false);
  protected readonly result = signal("");
  protected readonly form = this.fb.group({
    title: ["", [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    owner: ["", [Validators.required, Validators.email]],
    severity: ["medium", Validators.required],
    reference: ["", [httpsUrl()]],
  });

  protected invalid(name: FieldName): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected message(name: FieldName): string {
    const errors = this.form.controls[name].errors;
    if (errors?.["server"]) return String(errors["server"]); // the server has the last word
    if (errors?.["httpsUrl"]) return "Use a full https:// link with no username or password.";
    if (errors?.["email"]) return "Enter a valid email address, like name@company.com.";
    if (name === "severity") return "Choose low, medium or high.";
    return name === "title" ? "Enter 3 to 80 characters." : "This field is required.";
  }

  protected submit(): void {
    this.result.set("");
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges(); // render aria-invalid first, then move focus to the first problem
      this.focusFirstProblem();
      return;
    }
    this.saving.set(true);
    this.http
      .post("/api/risks", this.form.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.form.reset();
          this.result.set("Risk created.");
        },
        error: (error: unknown) => this.onError(error),
      });
  }

  private onError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 422) {
      this.applyServerErrors(error.error?.fields ?? {});
      this.result.set("Some fields need attention.");
    } else if (error instanceof HttpErrorResponse && error.status === 403) {
      this.result.set("Your role does not allow this action.");
    } else {
      this.result.set("The risk was not created. Try again.");
    }
  }

  /** The API re-checks every field, so show whatever it rejects. */
  private applyServerErrors(fields: Record<string, string>): void {
    for (const [name, message] of Object.entries(fields)) {
      const control = this.form.get(name);
      control?.setErrors({ server: message });
      control?.markAsTouched(); // a field the person never touched still shows its error
    }
    this.cdr.detectChanges();
    this.focusFirstProblem();
  }

  private focusFirstProblem(): void {
    this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }
}
