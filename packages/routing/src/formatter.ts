import type { ManeuverType, ManeuverModifier } from '@modern-maps/types';
import { formatDistance, formatDuration } from '@modern-maps/geospatial';

export { formatDistance, formatDuration };

/**
 * Builds clear, human-readable turn-by-turn instruction strings.
 */
export function buildManeuverInstruction(
  type: ManeuverType,
  modifier?: ManeuverModifier,
  streetName?: string
): string {
  const street = streetName && streetName.trim() !== '' ? ` onto ${streetName}` : '';

  switch (type) {
    case 'depart':
      return streetName ? `Head out on ${streetName}` : 'Depart and follow route';
    case 'arrive':
      return streetName ? `Arrive at destination on ${streetName}` : 'Arrive at destination';
    case 'turn-left':
      return `Turn left${street}`;
    case 'turn-right':
      return `Turn right${street}`;
    case 'turn-slight-left':
      return `Slight left${street}`;
    case 'turn-slight-right':
      return `Slight right${street}`;
    case 'turn-sharp-left':
      return `Sharp left${street}`;
    case 'turn-sharp-right':
      return `Sharp right${street}`;
    case 'continue':
      return `Continue${street}`;
    case 'u-turn':
      return `Make a U-turn${street}`;
    case 'merge':
      return `Merge${modifier ? ` ${modifier}` : ''}${street}`;
    case 'on-ramp':
      return `Take the ramp${street}`;
    case 'off-ramp':
      return `Take the exit ramp${street}`;
    case 'fork':
      return `Keep ${modifier || 'straight'}${street}`;
    case 'roundabout':
      return `Enter roundabout and take exit${street}`;
    default:
      return modifier ? `Turn ${modifier}${street}` : `Proceed${street}`;
  }
}

/**
 * Maps maneuver types and modifiers to Lucide/UI icon names.
 */
export function getManeuverIcon(
  type: ManeuverType,
  _modifier?: ManeuverModifier
): string {
  switch (type) {
    case 'depart':
      return 'navigation';
    case 'arrive':
      return 'map-pin';
    case 'turn-left':
      return 'corner-up-left';
    case 'turn-right':
      return 'corner-up-right';
    case 'turn-slight-left':
      return 'arrow-up-left';
    case 'turn-slight-right':
      return 'arrow-up-right';
    case 'turn-sharp-left':
      return 'corner-down-left';
    case 'turn-sharp-right':
      return 'corner-down-right';
    case 'continue':
      return 'arrow-up';
    case 'u-turn':
      return 'rotate-ccw';
    case 'merge':
      return 'git-merge';
    case 'fork':
      return 'git-branch';
    case 'roundabout':
      return 'circle';
    default:
      return 'arrow-up';
  }
}
