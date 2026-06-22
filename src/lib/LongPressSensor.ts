/**
 * LongPressSensor — custom @dnd-kit sensor
 *
 * Behavior (identical to Microsoft To Do / Todoist):
 * - Touch anywhere on the card → scroll works normally during hold window
 * - Hold still for DELAY ms without moving more than TOLERANCE px → drag activates
 * - If finger moves > TOLERANCE px before DELAY ms → cancelled, scroll wins
 *
 * Implementation: extends PointerSensor (covers mouse + touch via pointer events).
 * The {delay, tolerance} constraint is what produces long-press behavior.
 * No need to override activators — PointerSensor handles primary pointer correctly.
 */

import { PointerSensor } from "@dnd-kit/core";
import type { PointerActivationConstraint } from "@dnd-kit/core";

export class LongPressSensor extends PointerSensor {}

export const LONG_PRESS_CONSTRAINT: PointerActivationConstraint = {
  delay: 500,
  tolerance: 10,
};
