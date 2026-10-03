import { StyleSheet } from "react-native";

export const Colors = {
  background: "#ffffff",
  backgroundGray: "#ffffff",
  surface: "#ffffff",
  text: "#1e293b",
  textSecondary: "#64748b",
  textGray: "#555",
  textLightGray: "#666",
  textMuted: "#94a3b8",
  placeholder: "#94a3b8",
  primary: "#2563eb",
  primaryDark: "#0066FF",
  primaryDisabled: "#93c5fd",
  error: "#ef4444",
  border: "#e2e8f0",
  success: "#22c55e",
  successBg: "#22c55e20",
  primaryBg: "#2563eb20",
  link: "#2563eb",
  delete: "#ff4d4d",
  deleteBg: "#ffe5e5",
  closeGray: "#ddd",
  badgeYellow: "#ffe9a8",
  badgeGreen: "#c8f7c5",
  paymentEfectivo: "#4CAF50",
  paymentTransferencia: "#2196F3",
  avatarBg: "#4f6cff",
  greenBg: "#f0f0f0",
  skeleton: "#e2e8f0",
};

export const FontSize = {
  xs: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 17,
  xxl: 18,
  xxxl: 22,
  title: 24,
  titleLg: 25,
  titleXl: 26,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 16,
  xxl: 20,
  xxxl: 28,
  xxxxl: 40,
};

export const Radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 20,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 0,
  },
  md: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  lg: {
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
};

export const Styles = StyleSheet.create({
  // Containers
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenGray: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formWrap: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  safeTop: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: Colors.backgroundGray,
  },

  // Inputs
  inputWrap: {
    width: "100%",
    marginBottom: 14,
  },
  input: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: FontSize.lg,
    color: Colors.text,
  },
  inputDanger: {
    borderColor: Colors.error,
  },
  inputRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  inputRowDanger: {
    borderColor: Colors.error,
  },
  inputFlex: {
    flex: 1,
    padding: 14,
    fontSize: FontSize.lg,
    color: Colors.text,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: 4,
    marginLeft: 4,
  },
  label: {
    fontSize: FontSize.lg,
    marginBottom: 5,
    fontWeight: "500",
  },

  // Buttons
  btnPrimary: {
    width: "100%",
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: Radius.lg,
    alignItems: "center",
    ...Shadow.lg,
    marginBottom: 20,
  },
  btnPrimaryDisabled: {
    backgroundColor: Colors.primaryDisabled,
  },
  btnPrimaryText: {
    color: Colors.surface,
    fontSize: FontSize.xl,
    fontWeight: "600",
  },
  btnSecondary: {
    backgroundColor: Colors.closeGray,
    padding: 10,
    borderRadius: Radius.md,
    alignItems: "center",
    marginTop: 10,
  },
  btnSecondaryText: {
    color: Colors.text,
  },
  btnDanger: {
    backgroundColor: Colors.delete,
    padding: 16,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginBottom: 20,
    ...Shadow.md,
  },
  btnDangerText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: FontSize.lg,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  btnHalf: {
    flex: 1,
    padding: 10,
    borderRadius: Radius.md,
    alignItems: "center",
  },

  // Text
  title: {
    fontSize: FontSize.titleXl,
    fontWeight: "bold",
    marginBottom: 6,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: 28,
    textAlign: "center",
  },
  link: {
    color: Colors.link,
    fontSize: FontSize.lg,
  },
  linkBold: {
    fontWeight: "700",
  },
  linkRow: {
    color: Colors.link,
    fontSize: FontSize.lg,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    marginVertical: 10,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },

  // Avatar
  avatar: {
    width: 100,
    height: 100,
    borderRadius: Radius.xl,
    backgroundColor: Colors.avatarBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    ...Shadow.md,
  },
  avatarText: {
    color: Colors.surface,
    fontSize: 36,
    fontWeight: "bold",
  },

  // Profile card
  profileCard: {
    backgroundColor: Colors.surface,
    width: "100%",
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  profileName: {
    fontSize: FontSize.xxxl,
    fontWeight: "bold",
    marginBottom: 12,
  },
  profileRow: {
    fontSize: FontSize.lg,
    color: Colors.textGray,
    marginBottom: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    padding: 20,
    width: "100%",
    borderRadius: Radius.lg,
  },
  modalTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "bold",
    marginBottom: 10,
  },

  // Loan card
  loanBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    marginTop: 8,
  },
  loanCardBtn: {
    flex: 1,
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: Radius.md,
    marginRight: 6,
    alignItems: "center",
  },
  loanCardBtnBlue: {
    flex: 1,
    backgroundColor: "#d0e6ff",
    padding: 10,
    borderRadius: Radius.md,
    marginLeft: 6,
    alignItems: "center",
  },

  // Payment method toggle
  payToggle: {
    flexDirection: "row",
    marginTop: 8,
    gap: 10,
  },
  paymentOption: {
    flex: 1,
    padding: 12,
    borderRadius: Radius.sm,
    alignItems: "center",
  },

  // Centered loading
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Back button
  backBtn: {
    position: "absolute",
    top: 52,
    left: 20,
  },

  // Icon circle
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  // Badges
  badgeSuccess: {
    backgroundColor: Colors.successBg,
  },
  badgeError: {
    backgroundColor: Colors.deleteBg,
  },
});
