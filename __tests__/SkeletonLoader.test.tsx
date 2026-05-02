import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { SkeletonLoader, CardSkeleton, ProfileSkeleton } from "@/components/SkeletonLoader";

describe("SkeletonLoader", () => {
  it("renders with default props", () => {
    render(<SkeletonLoader />);
    const view =
      screen.getByTestId?.("skeleton") ||
      screen.UNSAFE_getByType(require("react-native").Animated.View);
    expect(view).toBeTruthy();
  });

  it("renders with custom width and height", () => {
    render(<SkeletonLoader width={100} height={50} />);
    const view = screen.UNSAFE_getByType(require("react-native").Animated.View);
    expect(view).toBeTruthy();
  });
});

describe("CardSkeleton", () => {
  it("renders card skeleton", () => {
    render(<CardSkeleton />);
    expect(screen.UNSAFE_getByType(require("react-native").View)).toBeTruthy();
  });
});

describe("ProfileSkeleton", () => {
  it("renders profile skeleton", () => {
    render(<ProfileSkeleton />);
    expect(screen.UNSAFE_getByType(require("react-native").View)).toBeTruthy();
  });
});
