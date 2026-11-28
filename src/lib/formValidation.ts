// ============================================
// TASKLYN — Form validation helpers
// Scroll to + focus the first invalid field. Works inside pages, modals and
// panels with their own scroll (scrollIntoView scrolls every scrollable
// ancestor) and keeps the field clear of sticky headers via scroll-margin.
// ============================================

import { showToast } from "@/stores/toastStore";

const FOCUSABLE =
  'input:not([type="hidden"]):not([type="file"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Error messages must be rendered with `data-field-error` (or the field with
 * `aria-invalid="true"`). The field container is the closest `[data-field]`
 * or, by default, the error's parent element.
 */
export function focusFirstInvalidField(root?: ParentNode | null, headerOffset = 96): void {
  // Wait for React to commit the error messages, then for layout.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const scope: ParentNode = root ?? document;
      const marker = scope.querySelector<HTMLElement>('[data-field-error], [aria-invalid="true"]');
      if (!marker) return;
      const container =
        marker.closest<HTMLElement>("[data-field]") ||
        (marker.matches("input,select,textarea") ? marker : marker.parentElement) ||
        marker;
      container.style.scrollMarginTop = `${headerOffset}px`;
      container.style.scrollMarginBottom = "96px";
      container.scrollIntoView({ behavior: "smooth", block: "center" });
      const control = marker.matches(FOCUSABLE)
        ? marker
        : container.querySelector<HTMLElement>(FOCUSABLE);
      try {
        control?.focus({ preventScroll: true });
      } catch {
        /* not focusable */
      }
    }),
  );
}

/** General notification shown when a submit is blocked by invalid fields. */
export function notifyInvalidFields(count: number): void {
  showToast({
    variant: "error",
    message: "Hay campos que necesitan atención",
    description:
      count === 1
        ? "Revisa el campo marcado en rojo."
        : `Revisa los ${count} campos marcados en rojo.`,
  });
}
