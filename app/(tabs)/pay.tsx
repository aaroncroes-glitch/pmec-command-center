import PayslipsScreen from "../payslips";

// Payslips render inside the tab. Redirecting to /payslips instead left the tab bar
// behind, and pressing back landed on this tab, which redirected straight back again.
export default function PayTab() {
  return <PayslipsScreen />;
}
