// Polyfill import.meta for Jest
if (typeof globalThis.import === "undefined") {
  globalThis.import = { meta: { url: "" } };
}

jest.mock("expo", () => {
  const actual = jest.requireActual("expo");
  return {
    ...actual,
    registerRootComponent: jest.fn(),
  };
});

jest.mock("expo-linking", () => ({
  parse: jest.fn(() => ({
    scheme: "https",
    hostname: "doognpanlarlvnwkbwdz.supabase.co",
    path: "/auth/v1/verify",
    queryParams: { type: "recovery", token: "abc123" },
  })),
  createURL: jest.fn((path) => `debtcollectapp://${path}`),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: null } })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    })),
    rpc: jest.fn(),
  },
}));
