import * as Haptics from 'expo-haptics';

/** Light tap - for button presses, toggles */
export function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Medium tap - for important actions (create, save) */
export function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Success - for completed actions (sign, create) */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Error/Warning - for destructive actions (delete) */
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
