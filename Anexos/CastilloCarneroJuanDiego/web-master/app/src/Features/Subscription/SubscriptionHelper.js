/**
 * If the user changes to a less expensive plan, we shouldn't apply the change immediately.
 * This is to avoid unintended/artifical credits on users Recurly accounts.
 */
function shouldPlanChangeAtTermEnd(oldPlan, newPlan) {
  return oldPlan.price > newPlan.price
}

module.exports = {
  shouldPlanChangeAtTermEnd,
}
