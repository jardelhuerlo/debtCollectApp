import { loginSchema, signUpSchema, loanSchema, paymentSchema } from "@/lib/validation";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";

describe("loginSchema", () => {
  it("validates correct login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("validates correct sign up data", () => {
    const result = signUpSchema.safeParse({
      fullName: "John Doe",
      email: "john@example.com",
      password: "secure123",
      confirmPassword: "secure123",
      acceptedTerms: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects when passwords do not match", () => {
    const result = signUpSchema.safeParse({
      fullName: "John Doe",
      email: "john@example.com",
      password: "secure123",
      confirmPassword: "different",
      acceptedTerms: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = signUpSchema.safeParse({
      fullName: "John Doe",
      email: "john@example.com",
      password: "securepass",
      confirmPassword: "securepass",
      acceptedTerms: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = signUpSchema.safeParse({
      fullName: "John Doe",
      email: "john@example.com",
      password: "sh1",
      confirmPassword: "sh1",
      acceptedTerms: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when terms not accepted", () => {
    const result = signUpSchema.safeParse({
      fullName: "John Doe",
      email: "john@example.com",
      password: "secure123",
      confirmPassword: "secure123",
      acceptedTerms: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects short full name", () => {
    const result = signUpSchema.safeParse({
      fullName: "J",
      email: "john@example.com",
      password: "secure123",
      confirmPassword: "secure123",
      acceptedTerms: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("loanSchema", () => {
  it("validates correct loan data", () => {
    const result = loanSchema.safeParse({
      debtor_name: "Jane Smith",
      amount: "150.00",
      interes: "10",
      payment_method: "efectivo",
      note: "Test note",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = loanSchema.safeParse({
      debtor_name: "Jane Smith",
      amount: "0",
      interes: "10",
      payment_method: "efectivo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = loanSchema.safeParse({
      debtor_name: "Jane Smith",
      amount: "-50",
      interes: "10",
      payment_method: "efectivo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects interest over 100", () => {
    const result = loanSchema.safeParse({
      debtor_name: "Jane Smith",
      amount: "100",
      interes: "150",
      payment_method: "efectivo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid payment method", () => {
    const result = loanSchema.safeParse({
      debtor_name: "Jane Smith",
      amount: "100",
      interes: "10",
      payment_method: "crypto",
    });
    expect(result.success).toBe(false);
  });

  it("allows zero interest", () => {
    const result = loanSchema.safeParse({
      debtor_name: "Jane Smith",
      amount: "100",
      interes: "0",
      payment_method: "transferencia",
    });
    expect(result.success).toBe(true);
  });
});

describe("paymentSchema", () => {
  it("validates correct payment data", () => {
    const result = paymentSchema.safeParse({
      amount: "50.00",
      paymentMethod: "efectivo",
      paymentNote: "Monthly payment",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = paymentSchema.safeParse({
      amount: "0",
      paymentMethod: "efectivo",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid payment method", () => {
    const result = paymentSchema.safeParse({
      amount: "50",
      paymentMethod: "bitcoin",
    });
    expect(result.success).toBe(false);
  });
});
