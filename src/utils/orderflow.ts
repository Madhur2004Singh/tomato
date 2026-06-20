export const ORDER_ACTIONS: Record<string, string[]> = {
  placed: ["accepted"],// If the current statuis is placed then the next should be accepted, that will be shown to the restaurant owner.
  accepted: ["preparing"],
  preparing: ["ready_for_rider"],
};
